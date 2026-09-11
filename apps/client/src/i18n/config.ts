import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ro from './locales/ro/translation.json';
import en from './locales/en/translation.json';
import hu from './locales/hu/translation.json';
import fr from './locales/fr/translation.json';
import de from './locales/de/translation.json';
import es from './locales/es/translation.json';
import it from './locales/it/translation.json';

export const SUPPORTED_LANGUAGES = ['ro', 'en', 'hu', 'fr', 'de', 'es', 'it'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = 'earbore-language';

function detectInitialLanguage(): SupportedLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)) {
      return stored as SupportedLanguage;
    }
  } catch {
    // localStorage indisponibil (mod privat etc.) — ignorăm
  }

  const browserLang = navigator.language?.slice(0, 2).toLowerCase();
  if ((SUPPORTED_LANGUAGES as readonly string[]).includes(browserLang)) {
    return browserLang as SupportedLanguage;
  }

  return 'ro';
}

i18n.use(initReactI18next).init({
  resources: {
    ro: { translation: ro },
    en: { translation: en },
    hu: { translation: hu },
    fr: { translation: fr },
    de: { translation: de },
    es: { translation: es },
    it: { translation: it },
  },
  lng: detectInitialLanguage(),
  fallbackLng: 'ro',
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignorăm — nu e critic
  }
  document.documentElement.lang = lng;
});

document.documentElement.lang = i18n.language;

export default i18n;