import { SUPPORTED_LANGUAGES, type SupportedLanguage } from './config';

// Țări în care una dintre limbile noastre e limbă oficială/majoritară.
// Nu includem țări multilingve ambigue (CH, BE, CA) — rămân pe fallback engleză.
const COUNTRY_TO_LANGUAGE: Record<string, SupportedLanguage> = {
  RO: 'ro', MD: 'ro',
  HU: 'hu',
  FR: 'fr', MC: 'fr',
  DE: 'de', AT: 'de', LI: 'de',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', PE: 'es', VE: 'es', CL: 'es',
  EC: 'es', GT: 'es', CU: 'es', BO: 'es', DO: 'es', HN: 'es', PY: 'es',
  SV: 'es', NI: 'es', CR: 'es', PA: 'es', UY: 'es', GQ: 'es',
  IT: 'it', SM: 'it', VA: 'it',
};

export const LANGUAGE_MANUAL_FLAG_KEY = 'earbore-language-manual';
const DETECTED_FLAG_KEY = 'earbore-language-country-detected';

// Rulează o singură dată, la pornirea aplicației. NU face nimic dacă:
// - userul a ales deja manual o limbă din LanguageSwitcher, sau
// - am mai făcut deja detectarea o dată (nu batem API-ul la fiecare refresh).
export async function detectAndApplyCountryLanguage(
  changeLanguage: (lng: string) => void,
): Promise<void> {
  try {
    if (localStorage.getItem(LANGUAGE_MANUAL_FLAG_KEY) === 'true') return;
    if (localStorage.getItem(DETECTED_FLAG_KEY) === 'true') return;

    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const countryCode = String(data?.country_code || data?.country || '').toUpperCase();

    const detected = COUNTRY_TO_LANGUAGE[countryCode];
    const finalLang: SupportedLanguage =
      detected && SUPPORTED_LANGUAGES.includes(detected) ? detected : 'en';

    changeLanguage(finalLang);
  } catch {
    // geolocalizarea IP a eșuat (rețea, rate-limit, ad-blocker) —
    // nu blocăm aplicația, rămânem pe limba deja setată din browser/fallback
  } finally {
    try {
      localStorage.setItem(DETECTED_FLAG_KEY, 'true');
    } catch {
      // localStorage indisponibil — ignorăm
    }
  }
}