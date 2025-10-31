// backend/services/responseFormatter.js
// 🎯 هدف: تولید پاسخ نهایی طبیعی، خلاصه، و مکالمه‌ای برای کاربر
// This is the "Naturalizer" layer.

const friendlyEndings = [
  'اگه سوال دیگه‌ای هم داشتی خوشحال میشم کمکت کنم 🌟',
  'امیدوارم کمکت کرده باشه! 😊',
  'کاری داشتی بازم بپرس! 👋',
  'خوشحال میشم بتونم بیشتر راهنماییت کنم.',
  'روز خوبی داشته باشی! ✨',
];

/**
 * Phrases to be removed from the AI's raw output.
 * This includes technical jargon, meta-comments, and filler.
 * (Updated with MORE aggressive filters)
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

  // --- ⭐️ NEW AGGRESSIVE FILTERS ⭐️ ---

  // This removes: "سؤال شما توی بخش پرسش‌های متداول (FAQ) به شکل مستقیم جواب داده نشده."
  // and "سؤال ... توی بخش پرسش‌های متداول (FAQ) پیدا نمی‌شه،"
  // It removes ANY sentence fragment that mentions finding (or not finding) something in the FAQ.
  /[^.!?]* (FAQ|پرسش‌های متداول|سوالات متداول)[^.!?]*[.!?]?/gi,

  // This removes: "پس بر اساس اطلاعات دوره‌ها به شما پاسخ می‌دم:"
  // and "اما بر اساس اطلاعات مربوط به ... این مراحل رو باید طی کنید:"
  // It removes ANY clause starting with "so/but based on..."
  /،? (اما|پس|بنابراین) (بر اساس|با توجه به) (اطلاعات|داده‌ها|دوره‌ها|courses)[^.!?]*[.!?]?/gi,

  // This removes any full sentence that just describes the user's question
  /^(سوال|پرسش) شما (به شکل کلی|درباره|در مورد) .* (است|می‌باشد)\.\s*/gi,

  // This removes "so I'm going to..."
  /،? (پس|بنابراین) سراغ (اطلاعات|داده‌های) .* (می‌روم|می‌گردم|رفتم)(:|،|\.)/gi,

  // This removes "I checked X..."
  /(اطلاعات|داده‌های) (دوره‌ها|اساتید) را (بررسی|جستجو) کردم/gi,
];

/**
 * تمیزکننده و بازنویس پاسخ نهایی "Naturalizer"
 * حذف عبارات سیستمی و اضافه‌کردن لحن انسانی
 * @param {string} draftAnswer - The raw text from the AI.
 *s @returns {{text: string, confidence: number}}
 */
export function composeFinalAnswer(draftAnswer = "") {
  let text = (draftAnswer || "").trim();

  // 1. 🧹 Run all filters to remove meta-commentary
  technicalFilters.forEach((filter) => {
    text = text.replace(filter, ' '); // Replace with a space to avoid joining words
  });

  // 2. 🔤 Clean up extra whitespace, newlines, and leftover punctuation
  text = text
    .replace(/\n{2,}/g, '\n')   // Collapse multiple newlines
    .replace(/\s{2,}/g, ' ')    // Collapse multiple spaces
    .replace(/^(،|\.|:|\s)+/g, '') // Remove leading punctuation/space
    .replace(/(،|\.|:|\s)+$/g, '') // Remove trailing punctuation/space
    .trim();

  // 3. ✨ Add friendly ending
  if (text.length > 10 && text.length < 250) {
    if (!/[.!؟👋🌟😊✨]/.test(text.slice(-5))) {
      const ending = friendlyEndings[Math.floor(Math.random() * friendlyEndings.length)];
      text += `\n\n${ending}`;
    }
  }

  // 4. 💔 Handle if filters removed everything
  if (text.length < 5) { // Increased threshold
    text = 'متاسفانه الان اطلاعات دقیقی در این مورد ندارم، ولی می‌تونم برات بررسی کنم. چطور میتونم کمکت کنم؟';
  }

  return {
    text: text.trim(),
    confidence: 0.9,
  };
}