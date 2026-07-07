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

export { blockUser } from './callable/blockUser';
export { completeOnboarding } from './callable/completeOnboarding';
export { deleteAccount } from './callable/deleteAccount';
export { equipItem } from './callable/equipItem';
export { sendAIProfileReview } from './callable/sendAIProfileReview';
export { sendAISquadAdvice } from './callable/sendAISquadAdvice';
export { purchaseShopItem } from './callable/purchaseShopItem';
export { sendChatMediaMessage } from './callable/sendChatMediaMessage';
export { submitSwipe } from './callable/submitSwipe';
export { syncPublicProfile } from './callable/syncPublicProfile';
export { onMessageCreated } from './triggers/onMessageCreated';
export { onUserCreated } from './triggers/onUserCreated';
export { onUserGameUpdated } from './triggers/onUserGameUpdated';
export { onUserProfileUpdated } from './triggers/onUserProfileUpdated';
