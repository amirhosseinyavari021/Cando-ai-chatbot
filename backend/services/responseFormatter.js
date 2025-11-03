// backend/services/responseFormatter.js
// 🎯 (REFACTORED)
// هدف: اعمال الگوی لحن جدید "persianFriendly" و حذف کامل الگوهای قدیمی.

/**
 * A list of friendly, natural closings in Persian.
 * (This is no longer used for the primary template, but can be kept for future use)
 */
const friendlyEndings = [
  'اگه سوال دیگه‌ای هم داشتی خوشحال میشم کمکت کنم 🌟',
  'امیدوارم کمکت کرده باشه! 😊',
  'کاری داشti بازم بپرس! 👋',
];

/**
 * Phrases to be removed from the AI's raw output (to create the 'summary').
 * This includes technical jargon, meta-comments, and filler.
 */
const technicalFilters = [
  // --- Basic Jargon ---
  /بر اساس (اطلاعات|داده‌های|کانتکست|متن زمینه) (موجود|پایگاه داده|در دیتابیس|داده شده)/gi,
  /در (دیتابیس|پایگاه داده|کانتکست|متن زمینه|اطلاعات) (پیدا کردم|آمده است|ذکر شده|یافتم)/gi,
  /according to the (database|context|faq)/gi,
  /based on the information (provided|in the database)/gi,
  /اطلاعاتی که پیدا کردم:/gi,
  /پاسخ (شما|سوال شما) این است:/gi,
  /(سوال|پاسخ):/gi,
  /^نتیجه:/gi,
  /^خلاصه:/gi,

  // --- Aggressive Meta-Commentary Filters ---
  // "I didn't find in FAQ..."
  /[^.!?]* (FAQ|پرسش‌های متداول|سوالات متداول)[^.!?]*[.!?]?/gi,
  // "So based on data..."
  /،? (اما|پس|بنابراین) (بر اساس|با توجه به) (اطلاعات|داده‌ها|دوره‌ها|courses)[^.!?]*[.!?]?/gi,
  // "Your question is about..."
  /^(سوال|پرسش) شما (به شکل کلی|درباره|در مورد) .* (است|می‌باشد)\.\s*/gi,
  // "So I'm going to..."
  /،? (پس|بنابراین) سراغ (اطلاعات|داده‌های) .* (می‌روم|می‌گردم|رفتم)(:|،|\.)/gi,
  // "I checked X..."
  /(اطلاعات|داده‌های) (دوره‌ها|اساتید) را (بررسی|جستجو) کردم/gi,

  // --- ⛔️ As requested: Explicitly remove the old template ---
  /سؤال شما رو بررسی کردم و خوشبختانه جوابش تو بخش FAQ موجوده/gi,
];

/**
 * (REPLACES composeFinalAnswer)
 * تمیزکننده و بازنویس پاسخ نهایی "Naturalizer"
 * @param {string} draftAnswer - The raw text from the AI.
 * @returns {{text: string, confidence: number}}
 */
export function composeFinalAnswer(draftAnswer = "") {
  let summary = (draftAnswer || "").trim();

  // 1. 🧹 Run all filters to clean the AI's raw text into a summary
  technicalFilters.forEach((filter) => {
    summary = summary.replace(filter, ' '); // Replace with a space
  });

  // 2. 🔤 Clean up extra whitespace and punctuation
  summary = summary
    .replace(/\n{2,}/g, '\n')   // Collapse multiple newlines
    .replace(/\s{2,}/g, ' ')    // Collapse multiple spaces
    .replace(/^(،|\.|:|\s)+/g, '') // Remove leading punctuation/space
    .replace(/(،|\.|:|\s)+$/g, '') // Remove trailing punctuation/space
    .trim();

  // 3. 🛡️ Policy Check (forbidFixedFacts logic)
  // Check if summary is empty (filters removed everything) OR
  // if it's about "fixed facts" (price, address) and the data is missing.
  const isAboutFixedFacts = /(شهریه|قیمت|آدرس|تلفن)/g.test(summary);
  const isDataMissing =
    summary.length < 5 || // Filters removed everything
    /(؟|نامشخص|ذکر نشده|موجود نیست|اعلام نشده)/g.test(summary);

  if (isAboutFixedFacts && isDataMissing) {
    // Fulfill the "forbidFixedFacts" requirement
    const policyMessage = 'برای موارد ثابت مثل شهریه یا آدرس باید از منبع رسمی اعلام بشه. اگه خواستی من می‌تونم راهنمایی کنم از کجا بپرسی.';
    return {
      text: policyMessage,
      confidence: 0.95, // High confidence in policy message
    };
  }

  // 4. 💬 Apply the new "persianFriendly" template
  // Fulfill the "template(summary)" requirement
  const finalText = `حله! الان سریع می‌گم: ${summary}. اگه موردی جا موند به من بگو.`;

  return {
    text: finalText.trim(),
    confidence: 0.9,
  };
}