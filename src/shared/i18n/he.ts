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
    title: 'התחברות',
    signupTitle: 'הרשמה',
    emailLabel: 'אימייל',
    passwordLabel: 'סיסמה',
    submitLogin: 'התחבר',
    submitSignup: 'הירשם',
    googleCta: 'המשך עם Google',
    or: 'או',
    switchToSignup: 'אין לך חשבון? הירשם',
    switchToLogin: 'יש לך חשבון? התחבר',
    logout: 'התנתק',
    errors: {
      invalidEmail: 'כתובת אימייל לא תקינה',
      weakPassword: 'הסיסמה חייבת להכיל לפחות 6 תווים',
      emailInUse: 'כתובת האימייל כבר רשומה במערכת',
      invalidCredentials: 'אימייל או סיסמה שגויים',
      popupClosed: 'ההתחברות בוטלה',
      network: 'בעיית תקשורת — נסה שוב',
      tooManyRequests: 'יותר מדי ניסיונות — נסה שוב מאוחר יותר',
      generic: 'משהו השתבש — נסה שוב',
    },
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
