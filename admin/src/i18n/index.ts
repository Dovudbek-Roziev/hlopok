import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './ru.json';
import ky from './ky.json';

const savedLang = localStorage.getItem('admin_lang') || 'ru';

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    ky: { translation: ky },
  },
  lng: savedLang,
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
});

export default i18n;
