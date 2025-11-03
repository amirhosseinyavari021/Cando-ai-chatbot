/**
 * Removes banned internal keywords from a text response.
 * @param {string} text - The raw text from the bot.
 * @returns {string} The sanitized text.
 */
function sanitizeOutput(text) {
  if (typeof text !== 'string') {
    return text;
  }

  const banned =
    /(FAQ|Knowledge\s*Base|Database|Source|Internal|Docs|File|from our data|دانش[-‌ ]?پایه|پAYEGAH DANESH|دیتابیس|منبع( داده| اطلاعاتی| داخلی)?|منابع|فایل|داده‌ها|اطلاعات داخلی)/gi;

  return text.replace(banned, '').replace(/\s{2,}/g, ' ').trim();
}

export default sanitizeOutput;