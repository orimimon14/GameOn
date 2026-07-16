import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { syncPublicProfileForUser } from '../services/publicProfileSync';
import { deriveIsPro, type SubscriptionDocument } from '../types/billing';

// PAYMENTS.md §8 — subscriptions/{uid} → users/{uid} → publicProfiles/{uid}.
// The ONLY writer of the user's subscription* fields and isPro; the public
// mirror (isPro + verifiedBadge, ADR-025) is rebuilt via the shared sync so
// every consumer derives from users/{uid}, never from raw provider state.
export const onSubscriptionUpdated = onDocumentWritten(
  'subscriptions/{uid}',
  async (event) => {
    const { uid } = event.params;
    const subscription = event.data?.after.data() as SubscriptionDocument | undefined;
    if (!subscription) return; // deletion — reconciliation territory, not a product state

    const db = getFirestore();
    const userRef = db.doc(`users/${uid}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      logger.warn('onSubscriptionUpdated: user missing', { uid });
      return;
    }

    await userRef.update({
      subscriptionTier: subscription.tier,
      subscriptionStatus: subscription.status,
      subscriptionExpiresAt: subscription.currentPeriodEnd ?? null,
      isPro: deriveIsPro(subscription),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await syncPublicProfileForUser(uid);

    logger.info('onSubscriptionUpdated: entitlement synced', {
      uid,
      tier: subscription.tier,
      status: subscription.status,
      isPro: deriveIsPro(subscription),
    });
  },
);
