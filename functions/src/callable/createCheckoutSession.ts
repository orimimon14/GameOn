import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';

// API_CONTRACT §3.13 / PAYMENTS.md §5.3 — returns the RevenueCat Web Billing
// purchase URL for this uid. The redirect itself grants NOTHING (ADR-037):
// Pro flips only when the verified webhook writes subscriptions/{uid}.
// The purchase-link base lives in system/config/billing (non-secret; the
// dashboard URL is public anyway) so enabling billing is a config write, not
// a deploy.
const inputSchema = z.object({
  successUrl: z.string().url().max(500).optional(),
  cancelUrl: z.string().url().max(500).optional(),
  // ADR-044 billing plans — same entitlements, different billing period.
  plan: z.enum(['weekly', 'monthly', 'annual']).optional().default('monthly'),
});

export const createCheckoutSession = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'auth required');
  }
  const parsed = inputSchema.safeParse(request.data ?? {});
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'invalid_argument');
  }
  const { plan } = parsed.data;

  const db = getFirestore();
  const userSnap = await db.doc(`users/${uid}`).get();
  const user = userSnap.data();
  if (!user || user.isDeleted === true || user.isSuspended === true) {
    throw new HttpsError('failed-precondition', 'account_unavailable');
  }
  if (user.isPro === true && ['trialing', 'active'].includes(user.subscriptionStatus)) {
    throw new HttpsError('failed-precondition', 'already_pro');
  }

  const configSnap = await db.doc('system/config').get();
  const billing = configSnap.data()?.billing as
    | {
        webPurchaseUrl?: string;
        // optional per-plan purchase links (ADR-044); falls back to the base
        webPurchaseUrls?: Partial<Record<'weekly' | 'monthly' | 'annual', string>>;
        enabled?: boolean;
      }
    | undefined;
  const planUrl = billing?.webPurchaseUrls?.[plan] ?? billing?.webPurchaseUrl;
  if (!billing?.enabled || !planUrl) {
    // Provider account not connected yet — the client shows a friendly
    // "payments open soon" state on this exact code.
    throw new HttpsError('failed-precondition', 'billing_not_configured');
  }

  // RevenueCat Web Billing purchase links accept the App User ID as a query
  // param — set to the Firebase uid (ADR-037) so the webhook maps back to
  // this account with zero lookups.
  const url = new URL(planUrl);
  url.searchParams.set('app_user_id', uid);

  return {
    provider: 'revenuecat',
    checkoutSessionId: `${uid}:${Date.now()}`,
    checkoutUrl: url.toString(),
  };
});
