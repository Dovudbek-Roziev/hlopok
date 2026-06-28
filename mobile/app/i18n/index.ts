// i18n sozlash / i18n configuration
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './ru.json';
import ky from './ky.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      ky: { translation: ky },
    },
    lng: 'ru',
    fallbackLng: 'ru',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });

export default i18n;
