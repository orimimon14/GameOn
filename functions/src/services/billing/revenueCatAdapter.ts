import { timingSafeEqual } from 'node:crypto';

import { Timestamp } from 'firebase-admin/firestore';

import type { NormalizedPaymentEvent, SubscriptionStatus } from '../../types/billing';

// ADR-037 — RevenueCat is the canonical billing abstraction: its webhook is
// the only writer of entitlement, whatever rails sit underneath (web billing
// now, StoreKit / Play Billing in the store build). RevenueCat authenticates
// webhooks with a static Authorization header value configured in its
// dashboard — compared timing-safe against our Secret Manager copy
// (PAYMENTS.md §7.3).
export const verifyRevenueCatAuthorization = (
  headers: Record<string, string | string[] | undefined>,
  secret: string,
): boolean => {
  const raw = headers.authorization;
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (!header || !secret) return false;
  // Accept both "Bearer <value>" and the raw configured value.
  const presented = header.startsWith('Bearer ') ? header.slice(7) : header;
  const a = Buffer.from(presented);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
};

// RevenueCat webhook payload — the fields we consume (their docs: "Webhooks").
type RevenueCatEvent = {
  id?: string;
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  product_id?: string;
  period_type?: string; // NORMAL | TRIAL | INTRO
  purchased_at_ms?: number;
  expiration_at_ms?: number;
  event_timestamp_ms?: number;
  price?: number;
  currency?: string;
  cancel_reason?: string;
};

const toTimestamp = (ms: number | undefined): Timestamp | undefined =>
  typeof ms === 'number' && ms > 0 ? Timestamp.fromMillis(ms) : undefined;

// PAYMENTS.md §4.4 / §7.4 — RevenueCat event type → normalized status.
const STATUS_BY_EVENT: Record<string, SubscriptionStatus> = {
  INITIAL_PURCHASE: 'active',
  RENEWAL: 'active',
  UNCANCELLATION: 'active',
  PRODUCT_CHANGE: 'active',
  NON_RENEWING_PURCHASE: 'active',
  CANCELLATION: 'cancelled', // auto-renew off; Pro holds until period end
  BILLING_ISSUE: 'past_due',
  EXPIRATION: 'expired',
};

// Events that are valid but carry no entitlement change we act on.
export const IGNORED_EVENT_TYPES = new Set(['TEST', 'TRANSFER', 'SUBSCRIBER_ALIAS']);

export class UnsupportedEventError extends Error {}

export const parseRevenueCatEvent = (rawBody: Buffer): NormalizedPaymentEvent => {
  let parsed: { event?: RevenueCatEvent };
  try {
    parsed = JSON.parse(rawBody.toString('utf8')) as { event?: RevenueCatEvent };
  } catch {
    throw new UnsupportedEventError('invalid_json');
  }
  const event = parsed.event;
  if (!event?.id || !event.type) throw new UnsupportedEventError('missing_event');

  const status =
    event.period_type === 'TRIAL' && STATUS_BY_EVENT[event.type] === 'active'
      ? 'trialing'
      : STATUS_BY_EVENT[event.type];
  if (!status) throw new UnsupportedEventError(`unsupported_type:${event.type}`);

  // App User ID is set to the Firebase uid at SDK login (ADR-037) — mapping
  // priority 1 of PAYMENTS.md §7.6.
  const uid = event.app_user_id ?? event.original_app_user_id;

  return {
    provider: 'revenuecat',
    providerEventId: event.id,
    eventType: event.type,
    providerCustomerId: event.original_app_user_id ?? event.app_user_id ?? '',
    providerSubscriptionId: event.product_id,
    status,
    tier: 'pro', // single paid tier (PRD §pricing); product mapping grows in V1
    currentPeriodStart: toTimestamp(event.purchased_at_ms),
    currentPeriodEnd: toTimestamp(event.expiration_at_ms),
    cancelledAt: event.type === 'CANCELLATION' ? toTimestamp(event.event_timestamp_ms) : undefined,
    // Store rails report store-local prices; web billing reports ILS. The
    // webhook validates the amount only when the currency IS ILS (see
    // paymentWebhook) — entitlement never keys off raw price (§4.5).
    priceAmount: typeof event.price === 'number' ? event.price : 29.9,
    currency: 'ILS',
    uid,
  };
};

export const isIgnoredRevenueCatEvent = (rawBody: Buffer): { id: string; type: string } | null => {
  try {
    const { event } = JSON.parse(rawBody.toString('utf8')) as { event?: RevenueCatEvent };
    if (event?.type && event.id && IGNORED_EVENT_TYPES.has(event.type)) {
      return { id: event.id, type: event.type };
    }
  } catch {
    return null;
  }
  return null;
};
