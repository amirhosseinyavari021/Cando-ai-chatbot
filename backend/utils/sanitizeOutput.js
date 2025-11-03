/**
 * Removes banned internal keywords from a text response.
 * @param {string} text - The raw text from the bot.
 * @returns {string} The sanitized text.
 */
function sanitizeOutput(text) {
  if (typeof text !== 'string') {
    return text;
  }

  // Regex to find all banned words, including Persian variations
  const banned =
    /(FAQ|Knowledge\s*Base|Database|Source|Internal|Docs|File|from our data|دانش[-‌ ]?پایه|پایگاه دانش|دیتابیس|منبع( داده| اطلاعاتی| داخلی)?|منابع|فایل|داده‌ها|اطلاعات داخلی)/gi;

  // Replace banned words with an empty string and clean up extra spaces
  return text.replace(banned, '').replace(/\s{2,}/g, ' ').trim();
}

module.exports = sanitizeOutput;