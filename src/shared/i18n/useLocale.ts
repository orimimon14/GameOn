import { useTranslation } from 'react-i18next';

import { DEFAULT_LOCALE, Locale, LOCALE_DIRECTIONS, LOCALE_STORAGE_KEY, SUPPORTED_LOCALES } from '@/config/i18n';

export const useLocale = () => {
  const { i18n } = useTranslation();
  const language = i18n.language;
  const locale: Locale = (SUPPORTED_LOCALES as readonly string[]).includes(language)
    ? (language as Locale)
    : DEFAULT_LOCALE;

  const setLocale = (next: Locale) => {
    void i18n.changeLanguage(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Persistence is best-effort; Firestore sync arrives in Phase 2.
    }
  };

  return { locale, setLocale, dir: LOCALE_DIRECTIONS[locale] };
};
