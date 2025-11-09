// backend/services/memory.js
import { getDb } from "../utils/db.js";

export async function getHistory(sessionId, limit = 8) {
  const db = await getDb();
  const doc = await db.collection("conversations").findOne(
    { sessionId },
    { projection: { turns: { $slice: -limit } } }
  );
  // turns: [{role, text, ts}]
  return (doc?.turns || [])
    .filter(t => t?.role === "user" || t?.role === "assistant")
    .map(t => ({ role: t.role, content: t.text }));
}

export async function appendTurn(sessionId, role, text) {
  const db = await getDb();
  await db.collection("conversations").updateOne(
    { sessionId },
    {
      $setOnInsert: { userId: "anonymous", createdAt: new Date() },
      $set: { updatedAt: new Date() },
      $push: {
        turns: {
          role,
          text,
          ts: new Date()
        }
      }
    },
    { upsert: true }
  );
}
