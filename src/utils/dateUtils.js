// parse YYYY-MM-DD into a Date, returns null if it cant
export const parseYMD = (s) => {
  if (!s || typeof s !== 'string') return null;
  const parts = String(s).split('-').map(n => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
};
