import type { Timestamp } from 'firebase-admin/firestore';

// PAYMENTS.md §6 — subscriptions/{uid} is the single entitlement source of
// truth (ADR-037): written ONLY by paymentWebhook / reconciliation, mirrored
// to users/{uid} + publicProfiles/{uid} by onSubscriptionUpdated.
export type SubscriptionTier = 'basic' | 'pro';

export type SubscriptionStatus =
  | 'none'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired';

// 'revenuecat' — ADR-037 makes RevenueCat the canonical billing abstraction;
// the underlying charge rails (web provider / StoreKit / Play Billing) stay
// behind it, so its webhook is a provider in its own right.
export type BillingProvider = 'revenuecat' | 'stripe' | 'cardcom' | 'meshulam' | 'other';

export type SubscriptionDocument = {
  uid: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  provider: BillingProvider;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  startedAt?: Timestamp;
  currentPeriodStart?: Timestamp;
  currentPeriodEnd?: Timestamp;
  cancelledAt?: Timestamp;
  priceAmount: number;
  currency: 'ILS';
  updatedAt: Timestamp;
};

// PAYMENTS.md §4.3 — what every provider payload is reduced to before any
// Firestore write. Raw payloads never drive product state (§4.5).
export type NormalizedPaymentEvent = {
  provider: BillingProvider;
  providerEventId: string;
  eventType: string;
  providerCustomerId: string;
  providerSubscriptionId?: string;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  currentPeriodStart?: Timestamp;
  currentPeriodEnd?: Timestamp;
  cancelledAt?: Timestamp;
  priceAmount: number;
  currency: 'ILS';
  // uid carried in provider metadata (RevenueCat app_user_id) — mapping
  // priority 1 in PAYMENTS.md §7.6.
  uid?: string;
};

export type BillingEventStatus = 'received' | 'processed' | 'failed' | 'ignored';

// DATA_MODEL §4.14 — audit + idempotency ledger, keyed {provider}:{eventId}.
export type BillingEventDocument = {
  eventId: string;
  provider: BillingProvider;
  providerEventId?: string;
  uid?: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  eventType: string;
  status: BillingEventStatus;
  receivedAt: Timestamp;
  processedAt?: Timestamp;
  errorCode?: string;
  errorMessage?: string;
};

// PAYMENTS.md §8.3 — the ONE place Pro is derived from a subscription.
export const deriveIsPro = (subscription: {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd?: Timestamp;
}): boolean =>
  subscription.tier === 'pro' &&
  ['trialing', 'active', 'cancelled'].includes(subscription.status) &&
  (!subscription.currentPeriodEnd || subscription.currentPeriodEnd.toMillis() > Date.now());
