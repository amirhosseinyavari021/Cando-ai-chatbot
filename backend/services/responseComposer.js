// A simple pass-through stub for response composition.

/**
 * Formats the raw AI text.
 * @param {string} rawText - The text from the AI adapter.
 * @returns {object}
 */
export const composeFinalAnswer = (rawText) => {
  return {
    text: rawText.trim(),
  };
};