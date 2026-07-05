// Hebrew UI catalog (default locale, RTL) — ADR-035.
// Every user-facing string must live here (and in en.ts) — no hardcoded copy in components.
export const he = {
  common: {
    appName: 'Swish & Game',
  },
  nav: {
    discover: 'התאמות',
    games: 'משחקים',
    shop: 'חנות',
    likes: 'לייקים',
    chat: 'צ׳אט',
    settings: 'הגדרות',
  },
  titles: {
    discover: 'התאמות חדשות',
    likes: 'מי אהב אותך',
    shop: 'חנות סטייל',
    chat: 'הודעות',
    settings: 'הגדרות',
    profile: 'פרופיל אישי',
    games: 'בחירת משחק',
    subscriptions: 'שדרג ל-Premium',
    ai: 'מנוע הסקוואד',
  },
  auth: {
    loginNote: 'מסך ההתחברות ייבנה בשלב 2 (Firebase Auth). בינתיים אפשר להיכנס ישירות לאפליקציה.',
    loginCta: 'כניסה לאפליקציה',
  },
  onboarding: {
    welcome: 'ברוכים הבאים!',
    note: 'תהליך ה-onboarding (פרטים אישיים + בחירת משחקים) ייבנה בשלב 2.',
    continueCta: 'המשך ל-Discovery',
  },
  settings: {
    language: 'שפה',
    languageNote: 'בחר את שפת הממשק',
    hebrew: 'עברית',
    english: 'English',
  },
};

// Structural type — en.ts must provide every key, but with its own strings.
export type TranslationCatalog = typeof he;
