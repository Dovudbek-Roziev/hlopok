const SIZE_KY: Record<string, string> = {
  '1 мес':  '1 ай',
  '3 мес':  '3 ай',
  '6 мес':  '6 ай',
  '9 мес':  '9 ай',
  '12 мес': '12 ай',
  '18 мес': '18 ай',
  '24 мес': '24 ай',
  '3 года': '3 жаш',
  '4 года': '4 жаш',
  '5 лет':  '5 жаш',
  '6 лет':  '6 жаш',
  '7 лет':  '7 жаш',
};

const SIZE_RU: Record<string, string> = {
  '1 ай':   '1 мес',
  '3 ай':   '3 мес',
  '6 ай':   '6 мес',
  '9 ай':   '9 мес',
  '12 ай':  '12 мес',
  '18 ай':  '18 мес',
  '24 ай':  '24 мес',
  '3 жаш':  '3 года',
  '4 жаш':  '4 года',
  '5 жаш':  '5 лет',
  '6 жаш':  '6 лет',
  '7 жаш':  '7 лет',
};

export const getSizeLabel = (size: string, lang: string): string => {
  if (!size) return size;
  if (lang === 'ky') {
    if (SIZE_KY[size]) return SIZE_KY[size];
    // pattern fallback: "24 мес" → "24 ай", "3 года" → "3 жаш"
    const mMonths = size.match(/^(\d+)\s*мес/i);
    if (mMonths) return `${mMonths[1]} ай`;
    const mYears = size.match(/^(\d+)\s*(год|года|лет)/i);
    if (mYears) return `${mYears[1]} жаш`;
    return size;
  }
  // ru: normalize back if stored in ky format
  if (SIZE_RU[size]) return SIZE_RU[size];
  return size;
};
