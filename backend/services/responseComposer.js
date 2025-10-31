// backend/services/responseComposer.js
// 🎯 (REWRITTEN)
// هدف: تولید پاسخ نهایی طبیعی، خلاصه، و مکالمه‌ای برای کاربر
// This is the "Naturalizer" layer.

/**
 * A list of friendly, natural closings in Persian.
 */
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
 */
const technicalFilters = [
  // --- Old Filters ---
  /بر اساس اطلاعات (موجود|پایگاه داده|در دیتابیس|داده شده)/gi,
  /در (دیتابیس|پایگاه داده|کانتکست|متن زمینه) (پیدا کردم|آمده است|ذکر شده)/gi,
  /according to the (database|context|faq)/gi,
  /based on the information (provided|in the database)/gi,
  /اطلاعاتی که پیدا کردم:/gi,
  /پاسخ (شما|سوال شما) این است:/gi,
  /سوال:/gi, // Remove "سوال:" prefix if AI copies it
  /پاسخ:/gi, // Remove "پاسخ:" prefix if AI copies it
  /^نتیجه:/gi,
  /^خلاصه:/gi,
  /(سوال شما|این سوال) .* (FAQ|سوالات متداول|پرسش‌ها) (نبود|پیدا نشد)/gi,
  /(،? (پس|بنابراین) .* (بررسی کردم|جستجو کردم))/gi,
  /(اطلاعات|داده‌های) (دوره‌ها|اساتید) را (بررسی|جستجو) کردم/gi,

  // --- ⭐️ NEW FILTERS TO CATCH YOUR LATEST EXAMPLE ⭐️ ---

  // This targets: "سوال شما به شکل کلی درباره دوره‌های ارائه شده است."
  // (It removes sentences that just describe the user's question)
  /^(سوال|پرسش) شما (به شکل کلی|درباره|در مورد) .* (است|می‌باشد)\.\s*/gi,

  // This targets: "من در بخش پرسش‌های متداول (FAQ) پاسخی دقیقا ... پیدا نکردم،"
  // (It removes phrases about *not* finding info in the FAQ)
  /(در بخش|توی) (FAQ|پرسش‌های متداول|سوالات).* (پیدا نکردم|پاسخی نبود|یافت نشد)(،|\.)/gi,

  // This targets: "پس سراغ اطلاعات دوره‌ها می‌روم:"
  // (It removes phrases about *what* the bot will do next)
  /(،? (پس|بنابراین) سراغ (اطلاعات|داده‌های) .* (می‌روم|می‌گردم|رفتم))(:|،|\.)/gi,

  // This is a broader catch-all for explaining the search
  /من (در|ابتدا) .* (جستجو کردم|گشتم|بررسی کردم) .* (نبود|پیدا نکردم)/gi,
  // --- END NEW FILTERS ---
];

/**
 * (REPLACES composeFinalAnswer)
 * تمیزکننده و بازنویس پاسخ نهایی "Naturalizer"
 * حذف عبارات سیستمی و اضافه‌کردن لحن انسانی
 * @param {string} draftAnswer - The raw text from the AI.
 * @returns {{text: string, confidence: number}}
 */
export function composeFinalAnswer(draftAnswer = "") {
  let text = draftAnswer.trim();

  // 1. 🧹 حذف توضیحات فنی و بی‌ربط
  technicalFilters.forEach((filter) => {
    text = text.replace(filter, '');
  });

  // 2. 🔤 حذف فاصله‌ها و خطوط اضافی
  text = text.replace(/\n{2,}/g, '\n').replace(/\s{2,}/g, ' ').trim();

  // 3. 🧠 اصلاح شروع پاسخ (اگر با کاراکترهای اضافه شروع شده باشد)
  // (e.g., if a filter left a starting comma)
  text = text.replace(/^،\s*/, '').replace(/^[.\s]*/, '').trim();

  // 4. ✨ بازنویسی پایان متن (دعوت به تعامل انسانی)
  // If the answer is short and doesn't already have a friendly closing.
  if (text.length > 10 && text.length < 250) {
    // Check if it already ends with a greeting or emoji
    if (!/[.!؟👋🌟😊✨]/.test(text.slice(-5))) {
      // Add a random friendly ending
      const ending = friendlyEndings[Math.floor(Math.random() * friendlyEndings.length)];
      text += `\n\n${ending}`;
    }
  }

  // 5. 💔 مدیریت پاسخ خالی (اگر فیلترها همه چیز را پاک کردند)
  if (text.length === 0) {
    text = 'متاسفانه الان اطلاعات دقیقی در این مورد ندارم، ولی می‌تونم برات بررسی کنم. چطور میتونم کمکت کنم؟';
  }

  return {
    text: text.trim(),
    confidence: 0.9, // Confidence is now static as RAG hits aren't passed
  };
}