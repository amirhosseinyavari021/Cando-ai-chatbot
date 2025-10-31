// backend/services/aiRouter.js

import natural from "natural";
import { callPrimary } from "../ai/adapters/openaiPrimary.js";
import { callLocal } from "../ai/adapters/localFallback.js";
import { getHistory, appendTurn } from "./conversationMemory.js";
import { composeFinalAnswer } from "./responseComposer.js";
import { createLogEntry } from "../middleware/logger.js";
import logger from "../middleware/logger.js";
import aiConfig from "../config/ai.js";
import Course from "../models/Course.js";
import Faq from "../models/Faq.js";

const {
  AI_TIMEOUT_MS = 15000,
  AI_FALLBACK_ENABLED = true,
  AI_PRIMARY_MODEL,
  AI_LOCAL_MODEL_NAME,
} = aiConfig;

const createTimeout = (ms) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`AI Timeout: ${ms}ms`)), ms)
  );

export const getContextFromDB = async (userMessage) => {
  try {
    const tokenizer = new natural.WordTokenizer();
    const stemmer = natural.PorterStemmerFa;
    const queryTokens = tokenizer.tokenize(userMessage).map((t) => stemmer.stem(t));

    const [courses, faqs] = await Promise.all([
      Course.find({}, "title instructor_name registration_status mode start_date price").lean(),
      Faq.find({}, "question answer").lean(),
    ]);

    const scoreDocs = (docs, textFields) =>
      docs.map((d) => {
        const tokens = tokenizer
          .tokenize(textFields.map((f) => d[f]).join(" "))
          .map((t) => stemmer.stem(t));
        const overlap = tokens.filter((t) => queryTokens.includes(t)).length;
        const score = overlap / Math.max(tokens.length, 1);
        return { ...d, score };
      });

    const bestFaqs = scoreDocs(faqs, ["question", "answer"])
      .filter((f) => f.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const bestCourses = scoreDocs(courses, ["title", "instructor_name"])
      .filter((c) => c.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const contextParts = [];
    if (bestFaqs.length)
      contextParts.push(
        bestFaqs.map((f) => `سوال: ${f.question}\nپاسخ: ${f.answer}`).join("\n\n")
      );
    if (bestCourses.length)
      contextParts.push(
        bestCourses.map(
          (c) =>
            `دوره: ${c.title} - استاد: ${c.instructor_name} - قیمت: ${c.price || "نامشخص"}`
        ).join("\n")
      );

    return contextParts.join("\n\n");
  } catch (err) {
    logger.error(`❌ RAG Error: ${err.message}`);
    return "";
  }
};

export const routeRequest = async (userMessage, userId = "anonymous") => {
  const start = Date.now();
  let primaryError = null;
  const dbContext = await getContextFromDB(userMessage);
  const history = getHistory(userId);

  const combinedMessage = [
    history.map((h) => `${h.role === "user" ? "کاربر" : "دستیار"}: ${h.content}`).join("\n"),
    `سؤال فعلی: ${userMessage}`,
    dbContext ? `\n📘 داده‌های مرتبط:\n${dbContext}` : "",
  ].join("\n");

  try {
    logger.info("🤖 Calling Primary AI...");
    const result = await Promise.race([
      callPrimary(combinedMessage),
      createTimeout(AI_TIMEOUT_MS),
    ]);
    const final = composeFinalAnswer([], result.text);
    appendTurn(userId, { role: "user", content: userMessage });
    appendTurn(userId, { role: "assistant", content: final.text });

    await createLogEntry({
      userId,
      requestType: "TEXT",
      modelUsed: AI_PRIMARY_MODEL,
      status: "SUCCESS",
      prompt: userMessage,
      response: final.text,
      latency: Date.now() - start,
    });

    return { text: final.text, didFallback: false };
  } catch (err) {
    logger.warn(`⚠️ Primary AI failed: ${err.message}`);
    primaryError = err;
  }

  if (AI_FALLBACK_ENABLED) {
    try {
      const fallback = await callLocal(userMessage, dbContext);
      const final = composeFinalAnswer([], fallback.text);
      appendTurn(userId, { role: "user", content: userMessage });
      appendTurn(userId, { role: "assistant", content: final.text });

      await createLogEntry({
        userId,
        requestType: "TEXT",
        modelUsed: AI_LOCAL_MODEL_NAME,
        status: "FALLBACK_SUCCESS",
        prompt: userMessage,
        response: final.text,
        latency: Date.now() - start,
      });

      return { text: final.text, didFallback: true };
    } catch (err) {
      logger.error(`❌ Fallback AI failed: ${err.message}`);
      throw err;
    }
  }

  throw new Error(primaryError?.message || "AI service unavailable.");
};
