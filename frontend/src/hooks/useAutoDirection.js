import { useMemo } from 'react';

// Regex to check for any RTL characters
const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;

/**
 * Detects the writing direction of a text.
 * @param {string} text - The text to analyze.
 * @returns {'rtl' | 'ltr'} - The detected direction.
 */
const getDirection = (text) => {
  if (!text || text.trim().length === 0) {
    return 'rtl'; // Default to RTL if empty
  }
  return rtlRegex.test(text) ? 'rtl' : 'ltr';
};

/**
 * A hook to automatically determine the text direction (RTL/LTR).
 * Defaults to 'rtl' for empty strings.
 * @param {string} text
 */
export const useAutoDirection = (text) => {
  const direction = useMemo(() => getDirection(text), [text]);
  return direction;
};