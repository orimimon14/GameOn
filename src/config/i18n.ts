import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from '@/shared/i18n/en';
import { he } from '@/shared/i18n/he';

// Bidirectional i18n bootstrap — ADR-035. Hebrew (RTL) is the default; English (LTR) is supported.
export const SUPPORTED_LOCALES = ['he', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'he';
export const LOCALE_DIRECTIONS: Record<Locale, 'rtl' | 'ltr'> = { he: 'rtl', en: 'ltr' };
// Persisted locally now; synced to users/{uid}.preferredLocale once auth lands (Phase 2).
export const LOCALE_STORAGE_KEY = 'preferredLocale';

const isLocale = (value: string | null): value is Locale =>
  value !== null && (SUPPORTED_LOCALES as readonly string[]).includes(value);

const getInitialLocale = (): Locale => {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // localStorage unavailable (tests/privacy mode) — fall back to default.
  }
  return DEFAULT_LOCALE;
};

void i18n.use(initReactI18next).init({
  resources: {
    he: { translation: he },
    en: { translation: en },
  },
  lng: getInitialLocale(),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
});

export { i18n };
