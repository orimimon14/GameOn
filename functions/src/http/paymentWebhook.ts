import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';

import {
  isIgnoredRevenueCatEvent,
  parseRevenueCatEvent,
  UnsupportedEventError,
  verifyRevenueCatAuthorization,
} from '../services/billing/revenueCatAdapter';
import type { NormalizedPaymentEvent } from '../types/billing';

// API_CONTRACT §4.1 / PAYMENTS.md §7 — the ONLY writer of subscriptions/{uid}
// (ADR-037: entitlement exclusively via verified webhooks; checkout redirects
// grant nothing). Handling follows §7.2 order exactly; §7.9 idempotency is a
// billingEvents/{provider}:{eventId} ledger written in the same transaction
// as the subscription, so retries can never double-apply.
const webhookSecret = defineSecret('PAYMENT_WEBHOOK_SECRET');

const MVP_PRICE_ILS = 29.9;

// PAYMENTS.md §7.6 — providerCustomerId → uid mapping priority after event
// metadata: existing subscription, then private account payment id.
const mapCustomerToUid = async (event: NormalizedPaymentEvent): Promise<string | null> => {
  const db = getFirestore();
  if (event.uid) {
    const userSnap = await db.doc(`users/${event.uid}`).get();
    if (userSnap.exists) return event.uid;
  }
  if (!event.providerCustomerId) return null;
  const bySubscription = await db
    .collection('subscriptions')
    .where('providerCustomerId', '==', event.providerCustomerId)
    .limit(1)
    .get();
  if (!bySubscription.empty) return bySubscription.docs[0].id;
  const byAccount = await db
    .collectionGroup('private')
    .where('paymentCustomerId', '==', event.providerCustomerId)
    .limit(1)
    .get();
  if (!byAccount.empty) return byAccount.docs[0].ref.parent.parent?.id ?? null;
  return null;
};

export const paymentWebhook = onRequest({ secrets: [webhookSecret] }, async (request, response) => {
  if (request.method !== 'POST') {
    response.status(400).json({ error: 'post_only' });
    return;
  }

  // §7.3 — verify against the RAW body before any parsing; never log it.
  const rawBody: Buffer = request.rawBody ?? Buffer.from(JSON.stringify(request.body ?? {}));
  if (!verifyRevenueCatAuthorization(request.headers, webhookSecret.value())) {
    logger.warn('paymentWebhook: signature verification failed');
    response.status(401).json({ error: 'invalid_signature' });
    return;
  }

  const db = getFirestore();

  // Valid-but-inert events (TEST ping etc.) — audit as ignored, ack 200.
  const ignored = isIgnoredRevenueCatEvent(rawBody);
  if (ignored) {
    await db.doc(`billingEvents/revenuecat:${ignored.id}`).set(
      {
        eventId: `revenuecat:${ignored.id}`,
        provider: 'revenuecat',
        providerEventId: ignored.id,
        eventType: ignored.type,
        status: 'ignored',
        receivedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    response.status(200).json({ received: true, eventId: ignored.id, processed: false });
    return;
  }

  let event: NormalizedPaymentEvent;
  try {
    event = parseRevenueCatEvent(rawBody);
  } catch (error) {
    logger.warn('paymentWebhook: unsupported event', {
      reason: error instanceof UnsupportedEventError ? error.message : 'parse_error',
    });
    response.status(400).json({ error: 'unsupported_event' });
    return;
  }

  const ledgerId = `${event.provider}:${event.providerEventId}`;
  const ledgerRef = db.doc(`billingEvents/${ledgerId}`);

  // §7.6 mapping + §7.7 validation happen before any write.
  const uid = await mapCustomerToUid(event);
  if (!uid) {
    logger.warn('paymentWebhook: no uid mapping', {
      provider: event.provider,
      eventType: event.eventType,
      providerCustomerId: event.providerCustomerId,
    });
    await ledgerRef.set(
      {
        eventId: ledgerId,
        provider: event.provider,
        providerEventId: event.providerEventId,
        providerCustomerId: event.providerCustomerId,
        eventType: event.eventType,
        status: 'failed',
        errorCode: 'uid_mapping_failed',
        receivedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    response.status(404).json({ error: 'unknown_customer' });
    return;
  }

  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists || userSnap.data()?.isDeleted === true) {
    response.status(404).json({ error: 'unknown_user' });
    return;
  }
  if (
    event.tier !== 'pro' ||
    event.currency !== 'ILS' ||
    // Store rails price in store-local currency; enforce the MVP amount only
    // for ILS-denominated (web) charges. Entitlement never keys off price.
    (event.currency === 'ILS' && event.priceAmount !== MVP_PRICE_ILS)
  ) {
    logger.warn('paymentWebhook: validation failed', {
      tier: event.tier,
      currency: event.currency,
      priceAmount: event.priceAmount,
    });
    response.status(400).json({ error: 'validation_failed' });
    return;
  }

  // §7.9 — idempotency check + subscription write in ONE transaction.
  const result = await db.runTransaction(async (tx) => {
    const ledgerSnap = await tx.get(ledgerRef);
    if (ledgerSnap.exists && ledgerSnap.data()?.status === 'processed') {
      return 'duplicate' as const;
    }

    const subscriptionRef = db.doc(`subscriptions/${uid}`);
    const existing = await tx.get(subscriptionRef);
    const startedAt: Timestamp | undefined =
      existing.data()?.startedAt ?? event.currentPeriodStart;

    tx.set(
      subscriptionRef,
      {
        uid,
        tier: event.tier,
        status: event.status,
        provider: event.provider,
        providerCustomerId: event.providerCustomerId,
        ...(event.providerSubscriptionId
          ? { providerSubscriptionId: event.providerSubscriptionId }
          : {}),
        ...(startedAt ? { startedAt } : {}),
        ...(event.currentPeriodStart ? { currentPeriodStart: event.currentPeriodStart } : {}),
        ...(event.currentPeriodEnd ? { currentPeriodEnd: event.currentPeriodEnd } : {}),
        ...(event.cancelledAt ? { cancelledAt: event.cancelledAt } : {}),
        priceAmount: event.priceAmount,
        currency: event.currency,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    tx.set(
      ledgerRef,
      {
        eventId: ledgerId,
        provider: event.provider,
        providerEventId: event.providerEventId,
        uid,
        providerCustomerId: event.providerCustomerId,
        ...(event.providerSubscriptionId
          ? { providerSubscriptionId: event.providerSubscriptionId }
          : {}),
        eventType: event.eventType,
        status: 'processed',
        receivedAt: FieldValue.serverTimestamp(),
        processedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return 'processed' as const;
  });

  logger.info('paymentWebhook: event handled', {
    eventId: ledgerId,
    eventType: event.eventType,
    uid,
    outcome: result,
  });
  response
    .status(200)
    .json({ received: true, eventId: event.providerEventId, processed: result === 'processed' });
});
