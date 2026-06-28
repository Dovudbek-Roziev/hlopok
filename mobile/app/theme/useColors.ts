const light = {
  yellow:    '#FFD700',
  black:     '#1A1A1A',
  brand:     '#C49A00',
  green:     '#2D8653',
  greenBg:   '#E8F5E9',
  white:     '#FFFFFF',
  bg:        '#FBF5EC',
  gray:      '#9B9183',
  grayLight: '#F0E9DD',
  grayDark:  '#6B6258',
  red:       '#E53935',
  redBg:     '#FFF0F0',
  border:    '#E5DBC8',
  blue:      '#1565C0',
  blueBg:    '#E3F2FD',
  blueBorder:'#90CAF9',
  yellowBg:  '#FFF9E6',
};

export type AppColors = typeof light;

export const useColors = (): AppColors => light;
