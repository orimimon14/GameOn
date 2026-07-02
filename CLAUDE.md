# CLAUDE.md — Swish & Game Agent Guide

## Project Overview

Swish & Game is a mobile-first, Hebrew-first RTL web app for matching gamers through swipe-based discovery, matches, chat, cosmetics, Pro subscription, and AI-assisted profile/squad advice.

The product name is **Swish & Game**. Legacy names such as `GameOn`, `DoGame`, and `dogame` are deprecated.

---

## Current State

The project is moving from a prototype with mock data to a Firebase production architecture.

Follow the migration plan:

- `docs/engineering/MIGRATION_PLAN.md`

Critical prototype warning: the current prototype exposed the Gemini API key to the client via `vite.config.ts` / `process.env.API_KEY`. Do **not** continue this pattern. Gemini must be server-side only.

---

## Canonical Docs Map

Read the relevant document before changing its area. Do not invent contracts that are already defined in docs.

| Doc | Purpose | Path |
|---|---|---|
| PRD | Product scope, MVP/V1 boundaries, pricing, feature rules | `docs/product/PRD.md` |
| Architecture | System architecture, frontend/backend boundaries | `docs/architecture/ARCHITECTURE.md` |
| Data Model | Firestore collections, documents, fields, enums | `docs/architecture/DATA_MODEL.md` |
| Decision Log | ADRs and canonical product/engineering decisions | `docs/product/DECISIONS.md` |
| API Contract | Cloud Functions contracts and error model | `docs/architecture/API_CONTRACT.md` |
| Security | Firestore/Storage Rules and security model | `docs/architecture/SECURITY.md` |
| AI Integration | Gemini proxy, prompts, guardrails, AI audit | `docs/architecture/AI_INTEGRATION.md` |
| Payments | Pro subscription, webhook validation, entitlement flow | `docs/architecture/PAYMENTS.md` |
| Environments | env vars, secrets, Firebase projects, local setup | `docs/engineering/ENVIRONMENTS.md` |
| Conventions | code style, folder structure, workflow | `docs/engineering/CONVENTIONS.md` |
| Migration Plan | prototype → Firebase production phases | `docs/engineering/MIGRATION_PLAN.md` |
| Trust & Safety | moderation, reports/blocks, enforcement, escalation | `docs/operations/TRUST_AND_SAFETY.md` |
| Store Compliance | App Store / Google Play distribution & IAP (forward-looking) | `docs/operations/STORE_COMPLIANCE.md` |
| Motion & FX | cosmetic rendering, animation/sound stack, formats, performance | `docs/design/MOTION_AND_FX.md` |
| Roadmap | phased delivery + launch readiness | `docs/product/ROADMAP.md` |

---

## Tech Stack

- Frontend: React + Vite + TypeScript strict
- Styling: Tailwind CSS + Framer Motion
- Routing: React Router
- State: Zustand, Firestore subscriptions, React Hook Form
- Validation: Zod
- Localization: Hebrew + English, bidirectional RTL+LTR via i18n (react-i18next/FormatJS), i18n-ready (ADR-035)
- Backend: Firebase Auth, Firestore, Storage, Cloud Functions
- AI: Gemini through server-side Cloud Functions proxy only
- Payments: RevenueCat billing/entitlement abstraction (web now; store IAP-ready); entitlement only via verified webhooks (ADR-037)
- Packaging: web now; Capacitor for future App Store / Google Play distribution (ADR-036)
- Cosmetics & FX: Rive, Lottie, PixiJS/WebGL, dual-format alpha video, Howler (ADR-039)

---

## Non-Negotiable Rules

1. **Backend-authoritative always.** The client may request actions, but the backend owns sensitive decisions and writes.
2. The client must never write server-owned fields or collections:
   - `coins`
   - `subscriptionTier`
   - `subscriptionStatus`
   - `subscriptionExpiresAt`
   - `isPro`
   - `verifiedBadge`
   - `isSuspended`
   - `matches`
   - `swipes`
   - `transactions`
   - `ownedItems`
   - `aiRequests`
   - `subscriptions`
3. **No secrets in the client.** Client env vars must be public `VITE_*` Firebase config only.
4. `GEMINI_API_KEY`, payment secrets, webhook secrets, and service credentials belong in Secret Manager / server-side only.
5. Gemini is accessed only through callable Cloud Functions:
   - `sendAIProfileReview`
   - `sendAISquadAdvice`
6. Never use `@google/genai`, `process.env.API_KEY`, or `GEMINI_API_KEY` in frontend code.
7. Never use the invalid prototype model ID:
   - `gemini-3-flash-preview`
8. Data and enum values are English. Hebrew belongs in UI label maps only.
9. UI is Hebrew-first (RTL default); English (LTR) is supported via i18n (ADR-035). All UI strings go through i18n catalogs — no hardcoded strings.
10. Client-created chat messages may only be `type: "text"`. Image/media messages are created only by `sendChatMediaMessage`.
11. Checkout redirect does not grant Pro. Only verified `paymentWebhook` provider events update entitlement.
12. `verifiedBadge` means Pro member only.
13. Function names must match `API_CONTRACT.md`.
14. Collections and fields must match `DATA_MODEL.md`.

---

## Folder Structure

Use feature-based frontend structure:

```text
src/
  app/
  config/
  features/
    auth/
    onboarding/
    profile/
    discovery/
    matches/
    chat/
    shop/
    subscription/
    ai/
    safety/
  shared/
```

Backend functions:

```text
functions/src/
  callable/
  http/
  triggers/
  shared/
  repositories/
  services/
  schemas/
  types/
```

Detailed rules are in:

- `docs/engineering/CONVENTIONS.md`

---

## Commands

Common development commands:

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm run test
npm run test:rules
```

Run local Firebase emulators:

```bash
firebase emulators:start --project swish-game-dev
```

Never use `swish-game-prod` for local development.

---

## Before You Code

Use this checklist before editing code:

- Read the relevant canonical doc first.
- Do not invent new fields, enums, functions, collections, or secrets.
- If a contract changes, update the matching doc in the same PR.
- Keep frontend/client code free of secrets and provider SDKs.
- Use Zod at trust boundaries.
- Use English enum/data values and Hebrew label maps.
- Preserve backend-authoritative behavior.
- Add/update tests for changed behavior.
- Follow `docs/engineering/CONVENTIONS.md`, especially AI-assisted development notes in Section 16.

---

## Forbidden Patterns

Do not introduce:

```text
any
process.env.API_KEY in frontend
process.env.GEMINI_API_KEY in frontend
@google/genai in frontend
GEMINI_API_KEY in .env/.env.local client files
PAYMENT_WEBHOOK_SECRET in client files
PAYMENT_API_SECRET in client files
service account JSON in repo
client writes to server-owned fields
client writes to matches/swipes/transactions/subscriptions
Hebrew enum values in Firestore
dogame-* classes/namespaces
GameOn/DoGame product naming
gemini-3-flash-preview
```

---

## Agent Rule

When in doubt, stop and check the canonical docs. If the docs do not define the contract, propose a doc update before implementing code.
