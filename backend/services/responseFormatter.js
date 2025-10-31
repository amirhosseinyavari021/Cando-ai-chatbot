// backend/services/responseComposer.js
// 🎯 (REWRITTEN)
// هدف: تولید پاسخ نهایی طبیعی، خلاصه، و مکالمه‌ای برای کاربر
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
  // "I didn't find in FAQ..."
  /[^.!?]* (FAQ|پرسش‌های متداول|سوالات متداول)[^.!?]*[.!?]?/gi,
  // "So based on data..."
  /،? (اما|پس|بنابراین) (بر اساس|با توجه به) (اطلاعات|داده‌ها|دوره‌ها|courses)[^.!?]*[.!?]?/gi,
  // "Your question is about..."
  /^(سوال|پرسش) شما (به شکل کلی|درباره|در مورد) .* (است|می‌باشد)\.\s*/gi,
  // "So I'm going to..."
  /،? (پس|بنابراین) سراغ (اطلاعات|داده‌های) .* (می‌روم|می‌گردم|رفتم)(:|،|\.)/gi,
  // "I searched for..."
  /(اطلاعات|داده‌های) (دوره‌ها|اساتید) را (بررسی|جستجو) کردم/gi,
  // "I didn't find in the database"
  /(در|توی) (دیتابیس|پایگاه داده) (پیدا نکردم|نبود)/gi,
];

/**
 * A simple sentence splitter for summarization.
 */
const getSentences = (text) => {
  // Split by common sentence endings
  return text.split(/([.!?؟]+)\s+/).reduce((acc, part, index, arr) => {
    if (index % 2 === 0) {
      // It's a sentence part
      const nextPunctuation = arr[index + 1] || '';
      acc.push(part + nextPunctuation);
    }
    return acc;
  }, []);
};

/**
 * (REPLACES composeFinalAnswer)
 * تمیزکننده و بازنویس پاسخ نهایی "Naturalizer"
 * @param {string} draftAnswer - The raw text from the AI.
 * @returns {{text: string, confidence: number}}
 */
export function composeFinalAnswer(draftAnswer = "") {
  let text = (draftAnswer || "").trim();

  // 1. 🧹 Run all filters to remove meta-commentary
  technicalFilters.forEach((filter) => {
    text = text.replace(filter, ' '); // Replace with space
  });

  // 2. 🧹 Clean up whitespace and punctuation
  text = text
    .replace(/\n{2,}/g, '\n')   // Collapse multiple newlines
    .replace(/\s{2,}/g, ' ')    // Collapse multiple spaces
    .replace(/^(،|\.|:|\s)+/g, '') // Remove leading punctuation/space
    .trim();

  // 3. 💰 Handle "Price Awareness"
  if (/قیمت/g.test(text) && /(ذکر نشده|موجود نیست|؟|نامشخص)/g.test(text)) {
    text = text.replace(
      /شهریه .* (؟|نامشخص|موجود نیست|ذکر نشده)/gi,
      ''
    );
    // Add the polite response (if not already there)
    if (!/مشاور/g.test(text)) {
      text += '\n\n' + "در مورد قیمت دقیق اطلاعاتی در سیستم ثبت نشده، اما می‌تونم این مورد رو از مشاورین ثبت‌نام براتون بپرسم.";
    }
  }

  // 4. ✍️ Summarization step
  const sentences = getSentences(text);
  if (sentences.length > 5) {
    text = sentences.slice(0, 5).join(' ').trim();
    if (!/[.!?؟]$/.test(text)) text += '...';
  }

  // 5. ✨ Add friendly ending
  if (text.length > 10 && text.length < 250) {
    if (!/[.!؟👋🌟😊✨]/.test(text.slice(-5))) {
      const ending = friendlyEndings[Math.floor(Math.random() * friendlyEndings.length)];
      text += `\n\n${ending}`;
    }
  }

  // 6. 🚫 Avoid repetition
  text = text.replace(
    /(اگر (دوست|تمایل) (داشتید|دارید|داشتی)).*(\1)/gi,
    "$1"
  );


  // 7. 💔 Handle if filters removed everything
  if (text.length < 5) {
    text = 'متاسفانه الان اطلاعات دقیقی در این مورد ندارم، ولی می‌تونم برات بررسی کنم. چطور میتونم کمکت کنم؟ 😥';
  }

  return {
    text: text.trim(),
    confidence: 0.9,
  };
}