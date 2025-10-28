// Use the new OpenRouter adapter
import { queryOpenRouter } from './openaiAdapter.js';
// هر دو تابع جستجو رو ایمپورت می‌کنیم
import { searchFaqs, searchCourses } from '../../utils/dbSearch.js';
import { createLogEntry } from '../../middleware/logger.js';
import axios from 'axios'; // Import axios for isCancel

// === پرامپت سیستم با قانون جدید ===
const SYSTEM_PROMPT = `
تو "کندوبات" هستی، دستیار هوش مصنوعی آکادمی کندو. باید خیلی رفیق، خوش‌برخورد، صبور و کمک‌کننده باشی. هدفت اینه که به همه کاربرا، مخصوصاً اونایی که تازه‌کارن، کمک کنی و اطلاعات رو خیلی ساده و خودمونی بهشون بدی.

**قوانین اصلی که همیشه باید رعایت کنی:**
1.  **محدوده:** فقط و فقط در مورد آکادمی کندو جواب بده: دوره‌ها، استادا، برنامه‌ها، ثبت‌نام، مشاوره تحصیلی و راهنمایی‌های مرتبط.
2.  **زبان:** زبانی که کاربر پرسیده رو تشخیص بده (فارسی یا انگلیسی). همیشه فقط به همون زبون جواب بده. ساده و خودمونی حرف بزن. اصلاً از کلمات تخصصی قلمبه سلمبه یا کلمات خارجی (مگه اینکه مثل 'API' ضروری باشه) استفاده نکن.
3.  **لحن و سبک:** خیلی مودب، صبور و مشوق باش. اگه کاری چند مرحله داشت، حتماً با شماره‌بندی ساده و مرحله به مرحله توضیح بده. جملاتت کوتاه باشه.
4.  **رد کردن سوال نامرتبط:** اگه سوال هیچ ربطی به کندو نداشت، فقط و فقط بگو: «من دستیار هوش مصنوعی کندو هستم و فقط می‌تونم در مورد دوره‌ها، مشاوره و راهنمایی‌های مرتبط با آکادمی کندو بهت کمک کنم. اگه سوال دیگه‌ای در این زمینه داری، خوشحال می‌شم راهنمایی کنم.»
5.  **✅ قانون استفاده از اطلاعات:** اول از همه به اطلاعاتی که بهت داده میشه (بعد از "Use the following information:") نگاه کن.
    * **اولویت با دوره‌ها:** اگه سوال در مورد اطلاعات یه دوره خاص (مثل استاد، قیمت، تاریخ، لینک) بود، **حتماً و فقط** از اطلاعاتی که زیر عنوان "✅ اطلاعات دوره‌های پیدا شده (از کالکشن courses)" اومده استفاده کن.
    * **سوالات عمومی:** برای سوالات کلی از بخش "اطلاعات کلی از پایگاه دانش (FAQ)" استفاده کن.
    
6.  **🚨 قانون نهایی (عدم اختراع):** اگر هیچ اطلاعاتی (Context) به تو داده نشد، یا اطلاعات داده شده به سوال ربطی نداشت، **به هیچ وجه نباید جواب الکی بسازی (Hallucinate).** خیلی ساده و محترمانه بگو که «در حال حاضر اطلاعات دقیقی در این مورد ندارم» یا «نتونستم دوره‌ای با این مشخصات پیدا کنم». به هیچ وجه اسامی (مثل اسم استاد) یا دوره‌هایی که در اطلاعاتت نیست رو نساز.
`;

/**
 * Routes a user's text request using RAG with OpenRouter.
 * @param {object} options - The request options.
 * @param {string} options.prompt - The user's text prompt.
 * @param {string} [options.userId='anonymous'] - The ID of the user.
 * @param {object} options.cancelTokenSource - Axios cancel token source.
 * @returns {Promise<object>} An object with the final response and metadata.
 */
export const routeRequestToAI = async ({ prompt, userId = 'anonymous', cancelTokenSource }) => {
  const startTime = Date.now();
  const requestType = 'TEXT';
  const modelIdentifier = 'OPENROUTER_GPTOSS';

  if (!prompt || !prompt.trim()) {
    return { success: false, response: "لطفاً سوالت رو بپرس." };
  }

  try {
    // --- RAG Step 1: Retrieval ---
    const faqContext = await searchFaqs(prompt, 3);
    // تابع searchCourses الان قوی‌تر شده
    const courseContext = await searchCourses(prompt, 5);

    const combinedContext = [courseContext, faqContext]
      .filter(Boolean)
      .join('\n\n');

    // --- RAG Step 2 & 3: Augmentation & Generation ---
    console.log(`Sending prompt to OpenRouter with ${combinedContext ? 'retrieved context' : 'no context'}.`);

    const response = await queryOpenRouter(
      SYSTEM_PROMPT, // استفاده از پرامپت جدید و امن
      combinedContext,
      prompt,
      cancelTokenSource ? cancelTokenSource.token : null
    );

    await createLogEntry({
      userId,
      requestType,
      modelUsed: modelIdentifier,
      status: 'SUCCESS',
      prompt,
      response,
      latency: Date.now() - startTime
    });
    return { success: true, response };

  } catch (error) {
    if (axios.isCancel(error)) {
      console.log("OpenRouter RAG request canceled.");
      throw error;
    }

    console.error(`FATAL: OpenRouter RAG pipeline failed. Error: ${error.message}`);
    await createLogEntry({
      userId,
      requestType,
      modelUsed: 'NONE',
      status: 'ERROR',
      prompt,
      errorMessage: error.message,
      latency: Date.now() - startTime
    });
    return {
      success: false,
      response: error.message || "یه مشکلی پیش اومده، نمی‌تونم به سرور وصل بشم.",
      error: error.message
    };
  }
};