import Faq from '../models/Faq.js';
import Course from '../models/Course.js';

const MAX_CONTEXT_LENGTH = 1500;

// ... تابع searchFaqs (تغییری نکرده) ...
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
 * === آپدیت شده با جستجوی دو مرحله‌ای ===
 * جستجو در کالکشن Courses (دوره‌ها)
 */
export const searchCourses = async (query, limit = 5) => {
  let results = [];
  try {
    console.log(`Searching Courses for: "${query}" (Step 1: Text Index)`);
    // مرحله ۱: جستجوی سریع با ایندکس متنی
    results = await Course.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit);

    // === بخش جدید: جستجوی کمکی ===
    // اگه جستجوی اول هیچی پیدا نکرد، یه بارم با Regex بگرد
    if (results.length === 0) {
      console.log(`Text search found 0. Trying (Step 2: Regex Fallback)`);
      // ساختن یه عبارت جستجوی انعطاف‌پذیر (case-insensitive)
      const regexQuery = new RegExp(query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');

      results = await Course.find({
        $or: [ // بگرد توی اسم دوره یا اسم استاد
          { 'دوره': regexQuery },
          { 'استاد': regexQuery }
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
      if (course['شهریه آنلاین با تخfیف']) courseText += `  - شهریه آنلاین: ${course['شهریه آنلاین با تخفیف']}\n`; // (اصلاح تایپو)
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