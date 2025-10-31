// backend/ai/services/responseFormatter.js
// 🎯 هدف: تولید پاسخ نهایی طبیعی، خلاصه، و مکالمه‌ای برای کاربر
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
 * (Updated with more aggressive filters from our previous conversations)
 */
const technicalFilters = [
  // --- Basic Jargon ---
  /بر اساس (اطلاعات|داده‌های|کانتکست|متن زمینه) (موجود|پایگاه داده|در دیتابیس|داده شده)/gi,
  /در (دیتابیس|پایگاه داده|کانتکست|متن زمینه|اطلاعات) (پیدا کردم|آمده است|ذکر شده|یافتم)/gi,
  /according to the (database|context|faq)/gi,
  /based on the information (provided|in the database)/gi,
  /اطلاعاتی که پیدا کردم:/gi,
  /پاسخ (شما|سوال شما) این است:/gi,
  /سوال:/gi,
  /پاسخ:/gi,
  /^نتیجه:/gi,
  /^خلاصه:/gi,

  // --- Aggressive Meta-Commentary Filters ---
  // "I searched X but didn't find it, so I searched Y"
  /^(در|توی) بخش (FAQ|پرسش‌های متداول).* (وجود نداره|موجود نیست|نبود|یافت نشد)\.?/gi,
  /^(حالا|اکنون) (بر اساس|با توجه به) (اطلاعات|داده‌های) .* (برات|برایتان) (می‌نویسم|خلاصه می‌کنم|ارائه می‌دم)(:|\.)?/gi,
  /.*(نبود|پیدا نشد|وجود نداشت)،? (پس|بنابراین|حالا|در نتیجه) .* (بررسی می‌کنم|می‌گردم|می‌نویسم|ارائه می‌دم)/gi,
  /^(سوال|پرسش) شما (به شکل کلی|درباره|در مورد) .* (است|می‌باشد)\.\s*/gi,
  /(،? (پس|بنابراین) سراغ (اطلاعات|داده‌های) .* (می‌روم|می‌گردم|رفتم))(:|،|\.)/gi,
  /(اطلاعات|داده‌های) (دوره‌ها|اساتید) را (بررسی|جستجو) کردم/gi,
];

/**
 * تمیزکننده و بازنویس پاسخ نهایی "Naturalizer"
 * حذف عبارات سیستمی و اضافه‌کردن لحن انسانی
 * @param {string} draftAnswer - The raw text from the AI.
 * @returns {{text: string, confidence: number}}
 */
export function composeFinalAnswer(draftAnswer = "") {
  let text = (draftAnswer || "").trim();

  // 1. 🧹 حذف توضیحات فنی و بی‌ربط
  technicalFilters.forEach((filter) => {
    text = text.replace(filter, '');
  });

  // 2. 🔤 حذف فاصله‌ها و خطوط اضافی
  text = text.replace(/\n{2,}/g, '\n').replace(/\s{2,}/g, ' ').trim();

  // 3. 🧠 اصلاح شروع پاسخ (اگر با کاراکترهای اضافه شروع شده باشد)
  text = text.replace(/^(،|\.|:)\s*/, '').replace(/^[.\s]*/, '').trim();

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
    confidence: 0.9,
  };
}