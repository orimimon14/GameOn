import type { TranslationCatalog } from './he';

// English UI catalog (LTR) — ADR-035.
// Typed against the Hebrew catalog so a missing key fails typecheck.
export const en: TranslationCatalog = {
  common: {
    appName: 'Swish & Game',
  },
  nav: {
    discover: 'Matches',
    games: 'Games',
    shop: 'Shop',
    likes: 'Likes',
    chat: 'Chat',
    settings: 'Settings',
  },
  titles: {
    discover: 'New Matches',
    likes: 'Who Liked You',
    shop: 'Style Shop',
    chat: 'Messages',
    settings: 'Settings',
    profile: 'My Profile',
    games: 'Choose a Game',
    subscriptions: 'Upgrade to Premium',
    ai: 'Squad Engine',
  },
  auth: {
    loginNote: 'The login screen arrives in Phase 2 (Firebase Auth). For now you can enter the app directly.',
    loginCta: 'Enter the App',
  },
  onboarding: {
    welcome: 'Welcome!',
    note: 'The onboarding flow (personal details + game selection) arrives in Phase 2.',
    continueCta: 'Continue to Discovery',
  },
  settings: {
    language: 'Language',
    languageNote: 'Choose the interface language',
    hebrew: 'עברית',
    english: 'English',
  },
};
