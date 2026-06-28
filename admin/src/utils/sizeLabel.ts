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

export const sizeLabel = (size: string, lang: 'ru' | 'ky'): string => {
  if (lang === 'ky') return SIZE_KY[size] || size;
  return size;
};

export const sizeLabelBoth = (size: string): string => {
  const ky = SIZE_KY[size];
  return ky ? `${size} / ${ky}` : size;
};
