import Faq from '../models/Faq.js';
import Course from '../models/Course.js';

const MAX_CONTEXT_LENGTH = 1500;

// ... تابع searchFaqs (بدون تغییر) ...
export const searchFaqs = async (query, limit = 3) => {
  try {
    console.log(`Searching FAQs for: "${query}"`);
    const results = await Faq.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit);

    if (!results || results.length === 0) {
      console.log("No relevant FAQs found in DB.");
      return "";
    }
    console.log(`Found ${results.length} relevant FAQs.`);
    let context = "اطلاعات کلی از پایگاه دانش (FAQ):\n";
    for (const faq of results) {
      const faqText = `- سوال: ${faq.question}\n- جواب: ${faq.answer}\n\n`;
      if (context.length + faqText.length <= MAX_CONTEXT_LENGTH) {
        context += faqText;
      } else {
        break;
      }
    }
    return context;
  } catch (error) {
    console.error("Error searching Faqs collection:", error);
    return "";
  }
};


/**
 * === آپدیت نهایی با جستجوی هوشمند Regex ===
 * جستجو در کالکشن Courses (دوره‌ها)
 */
export const searchCourses = async (query, limit = 5) => {
  let results = [];

  // === بخش جدید: پاکسازی و آماده‌سازی کلمات کلیدی ===
  // کلمات کلیدی مثل "دوره", "استاد", "با" رو حذف می‌کنیم
  const stopWords = new Set(["دوره", "استاد", "با", "چه", "هایی", "دارن", "دارید", "میخوام", "ثبت", "نام", "کنم", "برای", "در", "و"]);

  // 1. کلمات رو جدا کن
  // 2. کلمات اضافی (stop words) رو حذف کن
  // 3. کلمات باقی‌مونده رو برای جستجو آماده کن
  const keywords = query.split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.has(word))
    .map(word => new RegExp(word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i')); // برای هر کلمه یه Regex بساز

  if (keywords.length === 0) {
    console.log("No useful keywords found in query for course search.");
    return ""; // اگه هیچ کلمه به درد بخوری نموند، نگرد
  }

  console.log(`Searching Courses using keywords:`, keywords.map(k => k.source));

  try {
    // === مرحله ۱: جستجوی متنی (همچنان سریع‌ترین راهه) ===
    console.log(`Searching Courses for: "${query}" (Step 1: Text Index)`);
    results = await Course.find(
      { $text: { $search: query } }, // خود مانگو بهترین تلاشش رو می‌کنه
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit);

    // === مرحله ۲: جستجوی کمکی (Regex هوشمند) ===
    // اگه جستجوی اول هیچی پیدا نکرد، با کلمات کلیدی که ساختیم می‌گردیم
    if (results.length === 0) {
      console.log(`Text search found 0. Trying (Step 2: Smart Regex)`);

      results = await Course.find({
        $or: [
          // بگرد توی اسم دوره یا اسم استاد
          // $and: keywords -> یعنی باید *همه* کلمات کلیدی توی فیلد باشن
          { 'دوره': { $all: keywords } },
          { 'استاد': { $all: keywords } }
        ]
      }).limit(limit);
    }
    // === پایان بخش جدید ===

    if (!results || results.length === 0) {
      console.log("No relevant Courses found in DB (after both attempts).");
      return "";
    }

    console.log(`Found ${results.length} relevant Courses.`);

    let context = "✅ اطلاعات دوره‌های پیدا شده (از کالکشن courses):\n";
    for (const course of results) {
      let courseText = `- نام دوره: ${course['دوره']}\n`;
      if (course['استاد']) courseText += `  - استاد: ${course['استاد']}\n`;
      if (course['تاریخ شروع']) courseText += `  - زمان‌بندی: ${course['تاریخ شروع']}\n`;
      if (course['شهریه حضوری']) courseText += `  - شهریه حضوری: ${course['شهریه حضوری']}\n`;
      if (course['شهریه آنلاین با تخفیف']) courseText += `  - شهریه آنلاین: ${course['شهریه آنلاین با تخفیف']}\n`;
      if (course['لینک سرفصل (دوره) (Product)']) courseText += `  - لینک: ${course['لینک سرفصل (دوره) (Product)']}\n`;
      courseText += "\n";

      if (context.length + courseText.length <= MAX_CONTEXT_LENGTH) {
        context += courseText;
      } else {
        break;
      }
    }
    return context;

  } catch (error) {
    console.error("Error searching Courses collection:", error);
    return "";
  }
};