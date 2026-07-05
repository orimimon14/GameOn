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
    title: 'Log In',
    signupTitle: 'Sign Up',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    submitLogin: 'Log In',
    submitSignup: 'Sign Up',
    googleCta: 'Continue with Google',
    or: 'or',
    switchToSignup: "Don't have an account? Sign up",
    switchToLogin: 'Already have an account? Log in',
    logout: 'Log Out',
    errors: {
      invalidEmail: 'Invalid email address',
      weakPassword: 'Password must be at least 6 characters',
      emailInUse: 'This email is already registered',
      invalidCredentials: 'Wrong email or password',
      popupClosed: 'Sign-in was cancelled',
      network: 'Network problem — try again',
      tooManyRequests: 'Too many attempts — try again later',
      generic: 'Something went wrong — try again',
    },
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
