import { initializeApp } from 'firebase-admin/app';
import { onCall } from 'firebase-functions/v2/https';

initializeApp();

// Health-check callable — proves the functions emulator wiring end to end.
// Real callables (submitSwipe, purchaseShopItem, ...) land in Phases 3-8 per API_CONTRACT.md.
// Functions region is an open decision (ENVIRONMENTS open items); default region until decided.
export const ping = onCall(() => ({
  ok: true,
  service: 'swish-game-functions',
  at: new Date().toISOString(),
}));

export { completeOnboarding } from './callable/completeOnboarding';
export { syncPublicProfile } from './callable/syncPublicProfile';
export { onUserCreated } from './triggers/onUserCreated';
export { onUserGameUpdated } from './triggers/onUserGameUpdated';
export { onUserProfileUpdated } from './triggers/onUserProfileUpdated';
