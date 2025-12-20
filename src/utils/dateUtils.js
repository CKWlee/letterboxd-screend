// src/utils/dateUtils.js

/**
 * Parse a date string in YYYY-MM-DD format to a Date object
 * @param {string} s - Date string in format "YYYY-MM-DD"
 * @returns {Date|null} - Parsed Date object or null if invalid
 */
export const parseYMD = (s) => {
  if (!s || typeof s !== 'string') return null;
  const parts = String(s).split('-').map(n => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
};
