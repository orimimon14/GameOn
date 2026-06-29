# Swish & Game — Product & Delivery Roadmap

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Production Product & Delivery Roadmap |
| Repository Path | `docs/product/ROADMAP.md` |
| Product | Swish & Game |
| Source of Truth | `docs/product/PRD.md`, `docs/product/DECISIONS.md`, `docs/engineering/MIGRATION_PLAN.md`, `docs/architecture/ARCHITECTURE.md`, `docs/quality/DEFINITION_OF_DONE.md`, `docs/quality/CI_CD.md`, `docs/operations/TRUST_AND_SAFETY.md` |
| Replaces | `DEVELOPMENT_PLAN.md`, `LAUNCH_CHECKLIST.md` |
| Roadmap Model | phase-based sequencing, no fixed dates |
| Scope Tiers | `MVP`, `V1`, `Scale/V1`, `Future` |
| Delivery Principle | scope discipline, backend-authoritative, doc-driven, secure-by-default |
| Launch Principle | MVP launch only after DoD, CI/CD production gate, Trust & Safety, legal, observability, and payment readiness are complete |
| Date Policy | No concrete dates in this document unless approved in product/source docs |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Roadmap Principles](#2-roadmap-principles)
- [3. Phase Model](#3-phase-model)
- [4. MVP Scope](#4-mvp-scope)
- [5. V1 Scope](#5-v1-scope)
- [6. Scale/V1 Scope](#6-scalev1-scope)
- [7. Future / Backlog](#7-future--backlog)
- [8. Milestones & Sequencing](#8-milestones--sequencing)
- [9. Launch Readiness / Go-Live Checklist](#9-launch-readiness--go-live-checklist)
- [10. Open Decisions Affecting Roadmap](#10-open-decisions-affecting-roadmap)
- [11. Superseded Documents](#11-superseded-documents)
- [12. Open Items](#12-open-items)

---

## 2. Roadmap Principles

### 2.1 Scope Discipline

כל capability חייב להיות משויך ל-tier ברור:

| Tier | Meaning |
|---|---|
| `MVP` | נדרש להשקה הראשונה ולבדיקת הערך המרכזי: התאמת גיימרים, chat בסיסי, Pro gating, safety בסיסי, backend enforcement. |
| `V1` | שיפורים לאחר MVP שמחזקים איכות, safety, retention, UX, automation, ו-feature depth. |
| `Scale/V1` | יכולות תפעול, audit, moderation, billing ו-reliability שנדרשות כשהמוצר גדל. |
| `Future` | רעיונות/הרחבות שאינם חלק מהתחייבות launch או V1 הקרוב. |

כל פיצ'ר ללא tier לא נכנס לפיתוח.

### 2.2 Backend-Authoritative

ה-roadmap חייב לשמור על העיקרון הקנוני:

- client לא קובע state רגיש.
- Cloud Functions ו-Security Rules אוכפים הרשאות.
- `coins`, `matches`, `swipes`, `subscriptions`, `isPro`, `verifiedBadge`, `transactions`, `aiRequests` הם server-owned או server-controlled.
- checkout redirect לא מעניק Pro.
- analytics/logging אינם source of truth.
- safety decisions נאכפים ב-backend.

### 2.3 Doc-Driven Delivery

פיתוח מתחיל רק כאשר המסמכים הרלוונטיים מסונכרנים:

| Change Area | Required Source |
|---|---|
| Product scope | `PRD.md`, `DECISIONS.md`, `ROADMAP.md` |
| Delivery sequencing | `MIGRATION_PLAN.md`, `ROADMAP.md` |
| API / Functions | `API_CONTRACT.md` |
| Data / Firestore | `DATA_MODEL.md` |
| Security Rules | `SECURITY.md` |
| AI | `AI_INTEGRATION.md` |
| Payments | `PAYMENTS.md` |
| Testing / DoD | `TEST_STRATEGY.md`, `DEFINITION_OF_DONE.md`, `TEST_CASES.md` |
| CI/CD / Release | `CI_CD.md` |
| Trust & Safety | `TRUST_AND_SAFETY.md` |
| Legal | `PRIVACY_AND_TERMS.md` draft + legal review |

### 2.4 Migration Alignment

ה-roadmap עוקב אחרי שלבי `MIGRATION_PLAN.md`:

1. foundation/security/Firebase.
2. data model.
3. auth/onboarding/profile.
4. discovery/swipes.
5. matching.
6. chat.
7. shop/economy.
8. subscription/payments.
9. AI.
10. safety.
11. QA/release hardening.

אין לקפוץ לפיצ'ר תלוי לפני שהשכבות שהוא תלוי בהן מוכנות.

### 2.5 No Date Commitments

מסמך זה אינו כולל dates, deadlines או התחייבויות תאריך.  
הוא מגדיר sequence, scope, readiness ו-dependencies בלבד.

---

## 3. Phase Model

### 3.1 Canonical Delivery Phases

| Phase | Aligned Migration Area | Scope Tier | Primary Goal | Exit Criteria |
|---|---|---|---|---|
| Phase 0 | Product/docs foundation | `MVP` | לוודא שכל מסמכי המקור קיימים ומסונכרנים | PRD/Architecture/Data/Security/API/UX/Testing/CI/DoD קיימים ומיושרים |
| Phase 1 | Firebase + environments + security baseline | `MVP` | להקים dev/staging/prod, rules, config, secrets, CI baseline | env separation, no local prod, rules tests, no client secrets |
| Phase 2 | Data model + public/private profile model | `MVP` | לבנות מודל משתמשים, פרופילים, games, shop, safety collections | `DATA_MODEL.md` מיושם; indexes/rules מסונכרנים |
| Phase 3 | Auth + onboarding + profile | `MVP` | משתמש יכול להירשם, להשלים onboarding, וליצור profile discoverable | auth/onboarding/profile flows + tests green |
| Phase 4 | Discovery + swipe | `MVP` | deck עובד, filter לפי game, swipe left/right דרך `submitSwipe` | no self/blocked/duplicate candidates; server-owned swipes |
| Phase 5 | Matching | `MVP` | reciprocal like יוצר `match` ו-`chat` בצורה idempotent | duplicate/race tests green |
| Phase 6 | Chat text | `MVP` | matched users יכולים לשלוח text chat | participant rules, blocked chat behavior, text tests green |
| Phase 7 | Shop + coins + cosmetics | `MVP` | coins/cosmetics עובדים בשרת בלבד | `purchaseShopItem`, `equipItem`, `transactions` audit |
| Phase 8 | Pro subscription | `MVP` | Pro checkout/entitlement עובד דרך provider webhook | `createCheckoutSession`, `paymentWebhook`, no redirect grant |
| Phase 9 | AI Hub | `MVP` | AI features דרך Cloud Functions בלבד | `sendAIProfileReview`, `sendAISquadAdvice`, no client Gemini |
| Phase 10 | Trust & Safety MVP | `MVP` | report/block מוכנים להשקה | `createReport`, `blockUser`, report/block tests green |
| Phase 11 | QA / launch hardening | `MVP` | כל ה-MVP עובר DoD, CI/CD, legal, observability | launch readiness checklist complete |
| Phase 12 | Post-MVP enhancements | `V1` | לשפר moderation, UX, retention ו-quality | V1 scope approved and prioritized |
| Phase 13 | Operational scale | `Scale/V1` | להוסיף moderation/billing/audit/reconciliation tooling | scale systems implemented and monitored |
| Phase 14 | Strategic backlog | `Future` | הרחבות שאינן נדרשות ל-MVP/V1 | future decision / PRD update |

---

## 4. MVP Scope

### 4.1 MVP Objective

MVP מוכיח את הערך המרכזי:

> גיימר יכול להירשם, לבנות פרופיל, לבחור משחקים, לגלות שחקנים רלוונטיים, לבצע swipe, לקבל match, לשוחח ב-text chat, להשתמש ב-shop/cosmetics, להבין/לרכוש Pro, להשתמש ביכולות AI בסיסיות, ולדווח/לחסום משתמשים בצורה בטוחה.

### 4.2 MVP In-Scope

| Area | MVP Capability | Key Backend / Data |
|---|---|---|
| Auth | signup/login/logout, route guards | Firebase Auth, `users/{uid}` |
| Onboarding | profile basics, game selection, completion gate | `users`, `publicProfiles`, user game data |
| Profile | view/edit own profile, public profile sync | `syncPublicProfile` |
| Localization | Hebrew-first, RTL, enum labels via maps | `he-IL`, label maps |
| Discovery | deck, game filter, skip/like | client-filtered `publicProfiles` query + `submitSwipe` (server-side `getDiscoveryDeck` is Scale/V1) |
| Swipe limits | Basic daily swipe limit if configured | server-side enforcement |
| Matching | reciprocal like creates match/chat | `matches`, `chats`, transaction/idempotency |
| Chat text | text chat between matched users | `chats/{chatId}/messages` |
| Chat media gating | Basic blocked; Pro-only enforcement where media is present | `sendChatMediaMessage`, Storage Rules |
| Shop | browse items, view item | `shopItems` |
| Economy | coins server-owned, purchase/equip cosmetics | `purchaseShopItem`, `equipItem`, `transactions` |
| Pro | upgrade modal, checkout session, entitlement from webhook | `createCheckoutSession`, `paymentWebhook`, `subscriptions` |
| Pro price | `29.90 ILS/month` | `PAYMENTS.md` |
| AI Hub | profile review, squad advice | `sendAIProfileReview`, `sendAISquadAdvice`, `aiRequests` |
| Safety | report user/content, block user | `createReport`, `blockUser`, `reports`, `users/{uid}/blocks` |
| Trust signal | `verifiedBadge` = Pro member only | not identity verification |
| Observability | health logs/metrics/alerts for critical flows | `OBSERVABILITY.md` |
| Testing | PR/MVP acceptance tests | `TEST_STRATEGY.md`, `TEST_CASES.md` |
| CI/CD | protected production deploy | `CI_CD.md` |
| Legal draft | Privacy/ToS draft reviewed before launch | `PRIVACY_AND_TERMS.md` |

### 4.3 MVP Explicitly Out-of-Scope

| Out-of-Scope Item | Target Tier | Reason |
|---|---|---|
| Automated image moderation | `V1` / `Scale/V1` | ADR-024: MVP is report-based/manual |
| Full moderation panel | `Scale/V1` | MVP can use minimal internal review |
| `moderationActions` full audit tooling | `Scale/V1` | planned for operational maturity |
| `billingEvents` full provider event ledger | `Scale/V1` | planned after provider finalization/scale |
| `reconcileSubscription` full scheduled reconciliation | `Scale/V1` unless needed for launch provider | depends on payment provider decision |
| Identity verification | `Future` | separate from `verifiedBadge` |
| Age verification | `Future` / legal-dependent | separate compliance domain |
| Coin purchase with real money | `Future` | ADR-005: coins granted/earned, not bought with real money; ADR-018: cosmetic-only |
| Cash-out or real-money coin value | Out of scope | explicitly forbidden for MVP economy |
| Full notifications/deep links | `Future` | not required for core MVP |
| Internationalization beyond Hebrew-first | `Future` | launch is Israel/Hebrew-first |
| True realtime presence | `Future` | ADR-023: last-active presence only |
| Advanced anti-evasion detection | `Scale/V1` | needs safety scale signals |
| Advanced social graph/search | `Future` | not required for core swipe matching |

### 4.4 MVP Non-Negotiables

MVP cannot launch unless:

- backend enforcement exists for sensitive flows.
- Security Rules tests are green.
- no forbidden bundle strings.
- no secrets in client/repo.
- payment activation is webhook-based.
- report/block are available.
- Privacy/ToS and age policy receive legal sign-off.
- Trust & Safety severe escalation path exists.
- observability dashboards/alerts are ready.
- production deploy gate passes.

---

## 5. V1 Scope

### 5.1 V1 Objective

V1 improves safety, quality, UX depth, and operational confidence after MVP launch, without breaking MVP architecture.

### 5.2 V1 Candidate Scope

| Area | V1 Capability | Notes |
|---|---|---|
| Image moderation | automated pre/post-upload checks | expands ADR-024 beyond report-based MVP |
| Text moderation | toxicity/spam signals | based on chat/report volume |
| Likes You policy | finalize behavior/gating | depends on ADR-033 |
| Discovery enhancements | better filters and ranking | must not break MVP game-only filter principle unless PRD updated |
| Chat enhancements | throttling, abuse controls, better empty/error states | depends on chat throttle ADR |
| AI limits | tier-based limits, cost controls, safety tuning | depends on AI request limit ADR |
| Shop enhancements | more categories/rarities/cosmetic UX | no real-money coins unless Future decision changes |
| Profile enhancements | richer gamer profile | must keep privacy/data minimization |
| Safety UX | improved report/block flows, user notices | aligned to Trust & Safety |
| Accessibility/UX polish | keyboard/focus/a11y improvements | release quality |
| Analytics dashboards | product funnel dashboard maturity | separate from observability |
| Visual regression | screenshot checks for core UI | CI optional open item |

### 5.3 V1 Guardrails

- No feature may bypass Security Rules or Cloud Functions.
- No new sensitive data category without `DATA_MODEL.md`, `SECURITY.md`, and legal review.
- No AI expansion without `AI_INTEGRATION.md` update.
- No payment/economy expansion without `PAYMENTS.md` and legal review.
- No trust signal changes that make `verifiedBadge` look like identity verification.

---

## 6. Scale/V1 Scope

### 6.1 Scale/V1 Objective

Scale/V1 covers capabilities needed when user volume, payments, moderation, and operational complexity increase.

### 6.2 Scale/V1 Capabilities

| Capability | Purpose | Source / Notes |
|---|---|---|
| `moderationActions` | auditable enforcement actions | planned in `DATA_MODEL.md` / `TRUST_AND_SAFETY.md` |
| `billingEvents` | normalized billing webhook ledger | planned in `DATA_MODEL.md` / `PAYMENTS.md` |
| `reconcileSubscription` | entitlement drift correction | payment reliability and Pro trust |
| automated moderation | image/text safety automation | extends MVP report/manual moderation |
| moderation panel | internal review of reports/actions | PRD safety operations |
| anti-evasion signals | detect ban evasion / repeated abuse | privacy/legal review required |
| safety dashboards | moderation queue and reason distribution | `OBSERVABILITY.md`, `ANALYTICS.md` |
| billing dashboard | subscription activation/cancellation/drift | `OBSERVABILITY.md` |
| AI cost dashboard | monitor Gemini spend/errors | `OBSERVABILITY.md` |
| audit retention policy | define retention by data class | legal/safety decision |
| on-call safety process | severe content response | `TRUST_AND_SAFETY.md` |
| release automation hardening | smoke automation, deploy markers | `CI_CD.md` |

### 6.3 Scale/V1 Entry Criteria

Move into Scale/V1 only after:

- MVP is stable.
- core flows are monitored.
- report/block queue is operational.
- payment provider is finalized.
- safety/legal retention policy is decided.
- CI/CD production process is stable.
- incident response baseline exists.

---

## 7. Future / Backlog

### 7.1 Future Candidates

| Future Item | Notes / Guardrail |
|---|---|
| notifications/deep links | add only after core route guards and privacy behavior are clear |
| identity verification | separate from `verifiedBadge`; new field/copy/legal review required |
| age verification | legal/compliance-heavy; not inferred from Pro |
| coin purchase | requires payment/legal/economy redesign; not MVP |
| additional languages beyond he/en | he+en bidirectional in scope now (ADR-035); more locales after launch maturity |
| store distribution (App Store / Google Play) | Capacitor packaging + store IAP via RevenueCat (ADR-036/037); see `STORE_COMPLIANCE.md` |
| animated cosmetics depth (Rive/PixiJS/alpha-video) | rendering stack per ADR-039; see `MOTION_AND_FX.md` |
| advanced recommendations | requires ranking docs, fairness/privacy review |
| teams/squads management | product scope expansion |
| tournaments/events | future product module |
| richer presence | ADR-023 says last-active only for now |
| web push/mobile app | platform decision |
| advanced admin console | can graduate from moderation panel |
| public status page | operational maturity |
| appeal process UX | Trust & Safety/legal scope |

### 7.2 Future Guardrails

Future ideas must not enter implementation until:

- PRD scope is updated.
- relevant ADR is accepted.
- data/security/API docs are updated.
- legal/privacy impact is reviewed where needed.
- DoR is satisfied.

---

## 8. Milestones & Sequencing

### 8.1 Dependency Chain

```text
Docs / decisions
  → environments / Firebase foundation
  → Security Rules baseline
  → Data model
  → Auth
  → Onboarding / Profile
  → Discovery deck
  → submitSwipe
  → Matching
  → Chat text
  → Shop / coins
  → Pro subscription
  → AI Hub
  → Report / Block
  → QA / CI / Observability / Legal
  → MVP launch
```

### 8.2 Dependency Table

| Capability | Depends On | Cannot Start Until |
|---|---|---|
| Auth | Firebase envs, Auth config | dev/staging setup exists |
| Onboarding | Auth, data model, localization | `users`, `publicProfiles`, game model defined |
| Profile | Onboarding, data model | public/private profile rules ready |
| Discovery | Profile, game data, Security Rules | discoverable public profiles exist |
| `submitSwipe` | Discovery, swipes model | backend validation and transaction pattern ready |
| Matching | `submitSwipe`, matches/chats model | deterministic match/chat strategy defined |
| Chat text | Matching, chat rules | participants access model ready |
| Chat media | Chat, Storage Rules, Pro gating | `sendChatMediaMessage` and media policy ready |
| Shop | shop item model, UI components | `shopItems` read model ready |
| Coins/economy | transactions model, backend functions | server-owned coin rules ready |
| Pro checkout | payments doc, provider config | ADR-017/payment provider path decided enough for implementation |
| Webhook entitlement | payment provider sandbox, secrets | `PAYMENT_WEBHOOK_SECRET` configured |
| AI Hub | AI doc, Gemini secret, functions | server-side proxy and guardrails ready |
| Report/block | safety data model, functions | `reports`, `blocks`, chat/discovery effects defined |
| Observability | core functions | structured logs and metrics points implemented |
| Launch | all MVP flows | DoD + CI/CD + legal + safety + smoke complete |

### 8.3 Delivery Milestones

| Milestone | Tier | Primary Outcome |
|---|---|---|
| M0 — Docs & Decisions Locked | `MVP` | core docs exist, open ADR impacts understood |
| M1 — Platform Foundation Ready | `MVP` | envs, Firebase, CI, rules test harness |
| M2 — User Foundation Ready | `MVP` | auth/onboarding/profile complete |
| M3 — Discovery Loop Ready | `MVP` | discovery + swipe + matching |
| M4 — Communication Ready | `MVP` | chat text + blocking behavior |
| M5 — Monetization/Economy Ready | `MVP` | shop/coins/Pro checkout/webhook |
| M6 — AI & Safety Ready | `MVP` | AI Hub + report/block |
| M7 — Release Candidate Ready | `MVP` | tests, security, docs, staging smoke |
| M8 — Go-Live Ready | `MVP` | production gate + legal sign-off + observability |
| M9 — Post-Launch V1 Planning | `V1` | prioritize V1 enhancements using real feedback |
| M10 — Scale Operations | `Scale/V1` | moderation/billing/reconciliation/audit tooling |

### 8.4 Sequencing Rules

- Do not build UI-only Pro gates without backend enforcement.
- Do not build discovery before public profile model and privacy rules.
- Do not build chat before match/participant access model.
- Do not build economy without transaction audit.
- Do not build payment activation without webhook verification.
- Do not build AI client-side.
- Do not launch without report/block.
- Do not launch with legal docs still unapproved.

---

## 9. Launch Readiness / Go-Live Checklist

This section replaces the old `LAUNCH_CHECKLIST.md`.

### 9.1 Product MVP Acceptance

Cross-reference: `DEFINITION_OF_DONE.md` §6.

| Area | Checklist |
|---|---|
| Auth | signup/login/logout works |
| Onboarding | onboarding blocks discovery until complete |
| Profile | user can create/update profile and games |
| Discovery | deck loads, empty/error states exist |
| Swipe | `submitSwipe` handles left/right |
| Match | reciprocal like creates single match/chat |
| Chat | text chat works for participants |
| Pro gating | Basic blocked from Pro-only media/actions |
| Shop | browse/view/purchase/equip cosmetics works |
| Coins | server-owned only; no negative balances |
| Subscription | checkout starts, Pro only after verified webhook |
| AI | AI Hub via server-side functions only |
| Safety | report/block work |
| RTL | Hebrew-first RTL works |
| Responsive | mobile-first flows usable |

### 9.2 Security Readiness

| Requirement | Status |
|---|---|
| Firestore Security Rules deny matrix green | required |
| Storage Rules tests green | required |
| client cannot write `coins`, `isPro`, `subscriptions`, `matches`, `swipes`, `transactions` | required |
| no direct client writes to server-owned collections | required |
| no Gemini key/client SDK in frontend | required |
| no payment secrets in frontend | required |
| no service account in repo | required |
| logs do not include PII/raw chat/payment/AI prompt | required |
| suspended/deleted users denied by backend functions | required |
| report/block data private | required |

### 9.3 CI/CD Production Gate

Cross-reference: `CI_CD.md` §10.

Required commands:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:rules
npm run build
npm run scan:bundle
```

Required deployment controls:

| Control | Requirement |
|---|---|
| branch mapping | PR=test/emulator, `develop`=dev, `main`=staging, release tag=prod |
| prod approval | manual approval required |
| prod deploy | through protected CI environment only |
| deployment order | indexes → Security Rules → Storage Rules → Cloud Functions → hosting → smoke |
| no local prod | required |
| rollback plan | required |
| staging smoke | required before prod |

Forbidden bundle strings:

```text
GEMINI_API_KEY
PAYMENT_WEBHOOK_SECRET
PAYMENT_API_SECRET
PAYMENT_API_KEY
PAYMENT_*_SECRET
process.env.API_KEY
gemini-3-flash-preview
```

### 9.4 Environment & Secrets Readiness

| Area | Requirement |
|---|---|
| Firebase projects | `swish-game-dev`, `swish-game-staging`, `swish-game-prod` |
| Secret Manager | `GEMINI_API_KEY`, `PAYMENT_WEBHOOK_SECRET`, payment secrets configured server-side |
| CI identity | Workload Identity Federation preferred |
| Vite client env | only `VITE_*` |
| `system/config` | feature flags and limits seeded |
| payment sandbox | staging flow verified |
| AI staging key | staging only, server-side |
| production config | reviewed and approved |

### 9.5 Payments Readiness

| Requirement | Notes |
|---|---|
| payment provider selected | ADR-017 must be resolved or launch path approved |
| sandbox checkout works | staging |
| invalid webhook signature rejected | required |
| verified webhook activates Pro | required |
| redirect alone does not grant Pro | required |
| duplicate webhook idempotent | required |
| cancellation/expiry behavior tested | required |
| refund policy legally approved | required |
| price display reviewed | `29.90 ILS/month` |

### 9.6 AI Readiness

| Requirement | Notes |
|---|---|
| Gemini only server-side | required |
| no `@google/genai` in frontend | required |
| no raw prompt/response in logs | required |
| `aiRequests` audit exists | required |
| refusal/error UX safe | required |
| AI cost monitoring | required |
| AI feature flag | `system/config.aiHubEnabled` |
| model ID verified before production | required if exact production model is set |

### 9.7 Trust & Safety Readiness

Cross-reference: `TRUST_AND_SAFETY.md`.

| Requirement | Notes |
|---|---|
| report flow works | `createReport` |
| block flow works | `blockUser` |
| `ReportReason` enum implemented | 8 canonical values |
| blocked users excluded from discovery | backend-side |
| blocked chat disabled | backend/rules |
| reports private | no regular user read |
| block list private | owner-only |
| severe content escalation path | required before launch |
| minimum age policy | `16+`, legal review required |
| `verifiedBadge` copy | Pro member only |
| moderation owner | assigned before launch |

### 9.8 Legal Readiness

Cross-reference: `PRIVACY_AND_TERMS.md`.

| Requirement | Status |
|---|---|
| Privacy Policy approved by lawyer | required |
| Terms of Service approved by lawyer | required |
| Community Guidelines approved | required |
| minimum age `16+` approved | required |
| refunds/cancellation approved | required |
| UGC license approved | required |
| data retention approved | required |
| cookie/analytics consent decision | required |
| payment provider terms reviewed | required |
| AI disclosure reviewed | required |
| severe content / minors escalation reviewed | required |

### 9.9 Observability Readiness

| Dashboard / Alert | Required |
|---|---|
| system health dashboard | yes |
| function error rate by function | yes |
| `submitSwipe` error spike alert | yes |
| match transaction failure alert | yes |
| `purchaseShopItem` failures alert | yes |
| negative coin balance alert | yes |
| payment webhook failure alert | yes |
| AI error/cost spike alert | yes |
| Firestore quota alert | yes |
| Security Rule denial spike alert | yes |
| report/block failures | yes |
| post-deploy monitoring window | 30–60 minutes |

### 9.10 QA / Test Readiness

| Requirement | Source |
|---|---|
| MVP acceptance checklist green | `DEFINITION_OF_DONE.md` |
| test cases P0 green | `TEST_CASES.md` |
| Security Rules tests green | `TEST_STRATEGY.md` |
| Cloud Function tests green | `TEST_STRATEGY.md` |
| E2E core flows green | `TEST_STRATEGY.md` |
| RTL/mobile checks complete | `TEST_CASES.md` |
| error mapping Hebrew-safe | `TEST_CASES.md` |
| bundle scan green | `CI_CD.md` |

### 9.11 Go / No-Go Decision

MVP launch is **No-Go** if any of the following are true:

- legal approval missing.
- production deploy not protected by manual approval.
- payment webhook activation not tested.
- Security Rules tests failing.
- secrets found in bundle/repo.
- report/block not working.
- Pro gating only enforced in UI.
- coins can be changed client-side.
- Gemini callable bypassed by client key.
- no rollback plan.
- no severe content escalation process.
- production smoke fails.

---

## 10. Open Decisions Affecting Roadmap

| Decision | Current Status | Roadmap Impact |
|---|---|---|
| ADR-013 — minimum age `16+` | pending legal | Launch legal readiness and Trust & Safety policy depend on approval |
| ADR-017 — payment provider | open/TBD | Blocks final production payment integration and provider-specific webhook tests |
| ADR-027 — AI request limits | open | Affects AI Hub rate limits, cost control, and P0/P1 test thresholds |
| ADR-028 — chat throttle/abuse thresholds | open | Affects chat spam prevention and V1 safety scope |
| ADR-029 — daily reset timezone | open | Affects Basic daily swipe limit reset behavior |
| ADR-030 — platform vocabulary | open | Affects onboarding/profile enum coverage and localization tests |
| ADR-032 — Pro cosmetics after expiration | open | Affects shop/economy behavior after downgrade |
| ADR-033 — Likes You policy | open | Affects whether Likes You is V1, Pro-gated, or not shipped |
| Final legal retention policy | open | Affects Privacy/ToS, safety data, audit records |
| Final moderation operations owner | open | Affects launch readiness and severe escalation |
| Final CI provider | GitHub Actions recommended | Affects workflow implementation details |
| AI production model verification | open | Must be verified before production AI deployment |
| Payment refund/cancellation terms | open | Launch blocker for Pro subscription |

---

## 11. Superseded Documents

This document explicitly supersedes:

```text
DEVELOPMENT_PLAN.md
LAUNCH_CHECKLIST.md
```

### 11.1 Replacement Policy

| Old Document | Replacement Section |
|---|---|
| `DEVELOPMENT_PLAN.md` | `ROADMAP.md` §§2–8 |
| `LAUNCH_CHECKLIST.md` | `ROADMAP.md` §9 |

### 11.2 Maintenance Rule

Do not update `DEVELOPMENT_PLAN.md` or `LAUNCH_CHECKLIST.md` as active sources of truth.

If those files remain in the repository for historical context, add a banner:

```md
> Superseded by `docs/product/ROADMAP.md`.
> Do not use this document as the source of truth.
```

---

## 12. Open Items

| Item | Status | Owner Needed |
|---|---|---|
| Resolve ADR-017 payment provider | Open | Product / Engineering / Legal |
| Confirm minimum age and legal launch policy | Open | Legal |
| Finalize Privacy/ToS legal approval | Open | Legal |
| Define refund/cancellation copy | Open | Product / Legal / Payments |
| Define retention policy | Open | Legal / Security / Safety |
| Assign moderation owner | Open | Trust & Safety |
| Define severe content escalation runbook | Open | Trust & Safety / Legal |
| Finalize AI limits and cost budget | Open | Product / Engineering |
| Finalize chat throttle thresholds | Open | Engineering / Trust & Safety |
| Decide Likes You V1 policy | Open | Product |
| Decide Pro cosmetics expiration behavior | Open | Product / Engineering |
| Confirm launch observability dashboard owners | Open | SRE / Engineering |
| Automate production smoke | Open | DevOps / QA |
| Add deploy markers to dashboards | Open | SRE / DevOps |
| Confirm whether old files are deleted or kept with superseded banner | Open | Product / Docs |
