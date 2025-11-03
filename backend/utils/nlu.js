/**
 * Tries to infer a role_slug from the user's text.
 * @param {string} text - The user's chat message.
 * @returns {string | null} The corresponding role_slug or null.
 */
function inferRoleSlug(text) {
  const t = text.toLowerCase();

  if (t.includes('network') || t.includes('شبکه')) {
    return 'network-engineer';
  }
  if (t.includes('system') || t.includes('ادمین') || t.includes('سرویس')) {
    return 'system-administrator';
  }
  if (t.includes('devops') || t.includes('دواپس') || t.includes('لینوکس')) {
    return 'linux-devops';
  }
  
  return null;
}

/**
 * Basic language detection based on character sets.
 * @param {string} text - The user's chat message.
 * @returns {'fa' | 'en'} The detected language.
 */
function detectLanguage(text) {
  // Check for Persian (Arabic script) characters
  return /[آ-ی]/.test(text) ? 'fa' : 'en';
}

module.exports = {
  inferRoleSlug,
  detectLanguage,
};