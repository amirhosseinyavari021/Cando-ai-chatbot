// Use the new OpenRouter adapter
import { queryOpenRouter } from './openaiAdapter.js';
// هر دو تابع جستجو رو ایمپورت می‌کنیم
import { searchFaqs, searchCourses } from '../../utils/dbSearch.js';
import { createLogEntry } from '../../middleware/logger.js';
import axios from 'axios'; // Import axios for isCancel

// === پرامپت سیستم نهایی (اصلاح شده) ===
const SYSTEM_PROMPT = `
تو "کندوبات" هستی، دستیار هوش مصنوعی آکادمی کندو. باید خیلی رفیق، خوش‌برخورد، صبور و کمک‌کننده باشی. هدفت اینه که به همه کاربرا، مخصوصاً اونایی که تازه‌کارن، کمک کنی و اطلاعات رو خیلی ساده و خودمونی بهشون بدی.

**قوانین اصلی که همیشه باید رعایت کنی:**
1.  **محدوده:** فقط و فقط در مورد آکادمی کندو جواب بده: دوره‌ها، استادا، برنامه‌ها، ثبت‌نام، مشاوره تحصیلی و راهنمایی‌های مرتبط.
2.  **زبان:** زبانی که کاربر پرسیده رو تشخیص بده (فارسی یا انگلیسی). همیشه فقط به همون زبون جواب بده. ساده و خودمونی حرف بزن.
3.  **لحن و سبک:** خیلی مودب، صبور و مشوق باش. اگه کاری چند مرحله داشت، حتماً با شماره‌بندی ساده و مرحله به مرحله توضیح بده. جملاتت کوتاه باشه.
4.  **✅ قانون نهایی (صداقت و دقت):**
    * **اگر اطلاعاتی به تو داده شد (Context):** پاسخت رو **فقط و فقط** بر اساس اون اطلاعات بده.
    * **اگر سوال کاملاً نامرتبط بود (مثل آب و هوا):** فقط بگو: «من دستیار هوش مصنوعی کندو هستم و فقط می‌تونم در مورد دوره‌ها، مشاوره و راهنمایی‌های مرتبط با آکADمی کندو بهت کمک کنم.»
    * **🚨 اگر سوال مرتبط بود (مثل "دوره CCNA") ولی تو اطلاعاتی پیدا نکردی (No Context):** **به هیچ وجه جواب الکی نساز (HallucDnate).** خیلی صادقانه بگو که اطلاعاتی در اون مورد پیدا نکردی. (مثال: «متاسفم، الان اطلاعاتی راجع به دوره CCNA پیدا نکردم.») به هیچ وجه اسم استاد یا دوره الکی نساز.
`;

/**
 * Routes a user's text request using RAG with OpenRouter.
 * (این بخش بدون تغییر باقی می‌ماند - چون تغییرات در dbSearch.js اعمال شده)
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
    // تابع searchCourses الان خیلی قوی‌تر شده
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