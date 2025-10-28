import axios from 'axios';

// === پرامپت سیستم با لحن جدید و قوانین آپدیت شده ===
// (کپی شده از aiRouter.js برای هماهنگی)
const TEXT_SYSTEM_PROMPT = `
تو "کندوبات" هستی، دستیار هوش مصنوعی آکادمی کندو. باید خیلی رفیق، خوش‌برخورد، صبور و کمک‌کننده باشی. هدفت اینه که به همه کاربرا، مخصوصاً اونایی که تازه‌کارن، کمک کنی و اطلاعات رو خیلی ساده و خودمونی بهشون بدی.

**قوانین اصلی که همیشه باید رعایت کنی:**
1.  **محدوده:** فقط و فقط در مورد آکادمی کندو جواب بده: دوره‌ها، استادا، برنامه‌ها، ثبت‌نام، مشاوره تحصیلی و راهنمایی‌های مرتبط.
2.  **زبان:** زبانی که کاربر پرسیده رو تشخیص بده (فارسی یا انگلیسی). همیشه فقط به همون زبون جواب بده. ساده و خودمونی حرف بزن. اصلاً از کلمات تخصصی قلمبه سلمبه یا کلمات خارجی (مگه اینکه مثل 'API' ضروری باشه) استفاده نکن. جوابت باید دقیقاً با الفبای همون زبان (فارسی یا انگلیسی) باشه.
3.  **لحن و سبک:** خیلی مودب، صبور و مشوق باش. اگه کاری چند مرحله داشت، حتماً با شماره‌بندی ساده و مرحله به مرحله توضیح بده. جملاتت کوتاه باشه.
4.  **رد کردن سوال نامرتبط:** اگه سوال هیچ ربطی به کندو نداشت، فقط و فقط بگو: «من دستیار هوش مصنوعی کندو هستم و فقط می‌تونم در مورد دوره‌ها، مشاوره و راهنمایی‌های مرتبط با آکادمی کندو بهت کمک کنم. اگه سوال دیگه‌ای در این زمینه داری، خوشحال می‌شم راهنمایی کنم.» (اگه انگلیسی پرسید، همینو انگلیسی بگو). هیچ توضیح اضافه‌ای نده.
5.  **✅ قانون استفاده از اطلاعات:** اول از همه به اطلاعاتی که بهت داده میشه (که توی پرامپت سیستم قبل از سوال کاربر میاد) نگاه کن.
    * **اولویت با دوره‌ها:** اگه سوال در مورد اطلاعات یه دوره خاص (مثل استاد، قیمت، تاریخ، لینک) بود، **حتماً و فقط** از اطلاعاتی که زیر عنوان "✅ اطلاعات دوره‌های پیدا شده (از کالکشن courses)" اومده استفاده کن.
    * **سوالات عمومی:** برای سوالات کلی (مثل "آدرس کجاست؟" یا "چطور ثبت‌نام کنم؟") از بخش "اطلاعات کلی از پایگاه دانش (FAQ)" استفاده کن.
    * اگه اطلاعات توی هیچکدوم از اینا نبود، از دانش عمومی خودت (فقط در مورد کندو) استفاده کن.
    * اگه اطلاعاتی نداشتی، خیلی راحت بگو «در حال حاضر این اطلاعات رو ندارم» یا «مطمئن نیستم». به هیچ وجه اطلاعات الکی یا تاریخ و قیمت اشتباه نساز.
`;


/**
 * Sends a text prompt to a specified local Ollama text model.
 * @param {string} prompt - The user's text query.
 * @param {string} modelName - The name of the Ollama model to use.
 * @returns {Promise<string>} The AI's response text.
 */
export const queryOllama = async (prompt, modelName) => {
  const OLLAMA_API_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const OLLAMA_ENDPOINT = `${OLLAMA_API_URL}/api/generate`;

  console.log(`Processing request with Text model (${modelName})...`);
  const payload = {
    model: modelName,
    prompt: prompt,
    system: TEXT_SYSTEM_PROMPT, // استفاده از پرامپت جدید
    stream: false,
    keep_alive: "30m",
    options: {
      temperature: 0.5,
      // num_thread: 4, // Optional CPU core setting - uncomment if needed
    }
  };

  console.log(`Sending request to Ollama endpoint: ${OLLAMA_ENDPOINT} with model: ${modelName}`);

  try {
    const response = await axios.post(OLLAMA_ENDPOINT, payload, { timeout: 120000 });

    if (response.data && response.data.response) {
      console.log(`Received response from ${modelName}.`);
      return response.data.response.trim();
    } else {
      console.error(`Invalid response structure from Ollama API (${modelName}):`, response.data);
      throw new Error('Invalid response structure from Ollama API');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error(`Ollama API unreachable at ${OLLAMA_API_URL}. Is the service running?`);
      throw new Error(`Ollama API unreachable at ${OLLAMA_API_URL}. Is the service running?`);
    } else if (error.code === 'ETIMEDOUT' || (error.message && error.message.includes('timeout'))) {
      const timeoutDuration = error.config?.timeout ?? 'N/A';
      console.error(`Ollama model (${modelName}) timed out after ${timeoutDuration}ms.`);
      throw new Error(`The AI model (${modelName}) seems to be taking too long or is unavailable. Please try again shortly.`);
    } else {
      const errorDetails = error.response ? error.response.data : error.message;
      console.error(`Error querying Ollama (${modelName}):`, errorDetails);
      throw new Error(`Failed to get response from Ollama model (${modelName}).`);
    }
  }
};