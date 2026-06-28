// Tamagui v1 konfiguratsiya / Tamagui v1 configuration
import { createTamagui } from 'tamagui';
import { config } from '@tamagui/config/v3';

const tamaguiConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    light: {
      ...config.themes.light,
      background:  '#FFFFFF',
      backgroundHover: '#F8F8F8',
      color:       '#1A1A1A',
      borderColor: '#E0E0E0',
      placeholderColor: '#9E9E9E',
    },
  },
  tokens: {
    ...config.tokens,
    color: {
      ...config.tokens.color,
      yellow:  '#FFD700',
      green:   '#2D8653',
      gray:    '#9E9E9E',
      red:     '#E53935',
    },
  },
});

export type AppConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
