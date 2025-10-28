import Faq from '../models/Faq.js';
import Course from '../models/Course.js'; // این مدل الان درسته

const MAX_CONTEXT_LENGTH = 1500;

/**
 * جستجو در کالکشن Faq (سوالات متداول)
 */
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
 * === آپدیت شده ===
 * جستجو در کالکشن Courses (دوره‌ها)
 */
export const searchCourses = async (query, limit = 5) => {
  try {
    console.log(`Searching Courses for: "${query}"`);
    // این جستجو الان از ایندکس متنی درستی که تعریف کردیم استفاده می‌کنه
    const results = await Course.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit);

    if (!results || results.length === 0) {
      console.log("No relevant Courses found in DB.");
      return "";
    }

    console.log(`Found ${results.length} relevant Courses.`);

    let context = "✅ اطلاعات دوره‌های پیدا شده (از کالکشن courses):\n";
    for (const course of results) {
      // === اینجا کلید حل مشکل است ===
      // اطلاعات رو از فیلدهای فارسی که در دیتابیس هستند می‌خونیم
      let courseText = `- نام دوره: ${course['دوره']}\n`; // Use bracket notation
      if (course['استاد']) courseText += `  - استاد: ${course['استاد']}\n`;
      if (course['تاریخ شروع']) courseText += `  - زمان‌بندی: ${course['تاریخ شروع']}\n`;

      // نمایش شهریه‌ها
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
    // این خطا نباید دیگه اتفاق بیفته چون ایندکس رو درست می‌کنیم
    console.error("Error searching Courses collection:", error);
    return "";
  }
};