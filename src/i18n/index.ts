import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import sw from './locales/sw.json';
import ar from './locales/ar.json';
import fr from './locales/fr.json';
import hi from './locales/hi.json';
import es from './locales/es.json';

const stored = localStorage.getItem('tronnlix-app-store');
let defaultLang = 'en';
if (stored) {
  try {
    const parsed = JSON.parse(stored);
    if (parsed?.state?.language) defaultLang = parsed.state.language;
  } catch {}
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    sw: { translation: sw },
    ar: { translation: ar },
    fr: { translation: fr },
    hi: { translation: hi },
    es: { translation: es },
  },
  lng: defaultLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
