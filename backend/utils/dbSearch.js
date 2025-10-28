import Faq from '../models/Faq.js'; // مدل سوالات متداول
import Course from '../models/Course.js'; // مدل جدید دوره‌ها

const MAX_CONTEXT_LENGTH = 1500; // محدودیت برای پرامپت اصلی

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
 * === تابع جدید ===
 * جستجو در کالکشن Courses (دوره‌ها)
 */
export const searchCourses = async (query, limit = 5) => {
  try {
    console.log(`Searching Courses for: "${query}"`);
    // جستجوی متنی در کالکشن دوره‌ها
    const results = await Course.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit);

    if (!results || results.length === 0) {
      console.log("No relevant Courses found in DB.");
      return ""; // اگه چیزی پیدا نشد، رشته خالی برگردون
    }

    console.log(`Found ${results.length} relevant Courses.`);

    // فرمت کردن اطلاعات پیدا شده برای ارسال به AI
    let context = "✅ اطلاعات دوره‌های پیدا شده (از کالکشن courses):\n";
    for (const course of results) {
      let courseText = `- نام دوره: ${course.name}\n`;
      if (course.instructor) courseText += `  - استاد: ${course.instructor}\n`;
      if (course.schedule) courseText += `  - زمان‌بندی: ${course.schedule}\n`;
      if (course.fee) courseText += `  - شهریه: ${course.fee}\n`;
      if (course.link) courseText += `  - لینک: ${course.link}\n`;
      courseText += "\n"; // یه خط خالی برای جداسازی

      if (context.length + courseText.length <= MAX_CONTEXT_LENGTH) {
        context += courseText;
      } else {
        break; // اگه متن خیلی طولانی شد، بقیه‌شو بی‌خیال شو
      }
    }
    return context;

  } catch (error) {
    console.error("Error searching Courses collection:", error);
    return ""; // در صورت خطا، رشته خالی برگردون
  }
};