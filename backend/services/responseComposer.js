// backend/services/responseComposer.js
export function composeFinalAnswer(ragHits = [], draftAnswer = "") {
  const hasStrongHit = ragHits.some((h) => h.score >= 0.6);
  let text = (draftAnswer || "").trim();

  const banPatterns = [
    /(FAQ|دیتابیس|پایگاه داده|RAG|رفتم|بررسی|context)/gi,
    /(در FAQ نیست|پیدا نکردم|رفتم بررسی کنم)/gi,
  ];
  banPatterns.forEach((rx) => (text = text.replace(rx, "")));

  text = text.replace(/\n{2,}/g, "\n").trim();

  if (!text || text.length < 10)
    text = "برای پاسخ دقیق‌تر لطفاً مشخص کنید درباره‌ی چه دوره یا استادی صحبت می‌کنید.";

  if (!hasStrongHit)
    text += "\n(توجه: این پاسخ ممکن است کامل نباشد، لطفاً سوال را دقیق‌تر بفرمایید.)";

  return { text, confidence: hasStrongHit ? 0.9 : 0.6 };
}
