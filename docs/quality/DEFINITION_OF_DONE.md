# Swish & Game — Definition of Ready & Definition of Done

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Production DoR/DoD Contract |
| Repository Path | `docs/quality/DEFINITION_OF_DONE.md` |
| Product | Swish & Game |
| Source of Truth | `docs/product/PRD.md`, `docs/engineering/CONVENTIONS.md`, `docs/quality/TEST_STRATEGY.md`, `docs/architecture/SECURITY.md`, `docs/quality/CI_CD.md`, `docs/engineering/MIGRATION_PLAN.md` |
| Principle | backend-authoritative, type-safe, tested, secure, documented |
| Done Means | code + tests + security + synced docs + green CI |
| Required CI Commands | `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:rules`, `npm run build`, bundle scan |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Definition of Ready — DoR](#2-definition-of-ready--dor)
- [3. Definition of Done — Task / PR Level](#3-definition-of-done--task--pr-level)
- [4. Per-Layer DoD](#4-per-layer-dod)
- [5. Feature-Level DoD](#5-feature-level-dod)
- [6. MVP Release Acceptance Criteria](#6-mvp-release-acceptance-criteria)
- [7. Release-Level DoD](#7-release-level-dod)
- [8. Migration DoD](#8-migration-dod)
- [9. Definition of Done Anti-Patterns](#9-definition-of-done-anti-patterns)
- [10. Open Items](#10-open-items)

---

## 2. Definition of Ready — DoR

Task/story מוכן להתחלה רק אם כל הסעיפים הבאים מתקיימים.

### 2.1 Product & Scope

- [ ] יש acceptance criteria ברורים ומדידים.
- [ ] ברור מה in-scope ומה out-of-scope.
- [ ] ברור האם השינוי שייך ל-MVP, V1, Scale/V1 או future.
- [ ] יש owner ברור.
- [ ] יש dependencies ידועות ופתורות או מתועדות.
- [ ] אם יש open ADR רלוונטי — ידוע אם צריך החלטה לפני תחילת העבודה.
- [ ] אם יש סיכון rollout — מוגדר feature flag ב-`system/config`.

### 2.2 Design & UX

- [ ] המסך/flow קיים או מתועד ב-`docs/design/UX_FLOWS.md`.
- [ ] רכיבים רלוונטיים ממופים ב-`docs/design/COMPONENTS.md`.
- [ ] states מוגדרים: `loading`, `empty`, `error`, `success`.
- [ ] gating ברור: auth / onboarding / Pro.
- [ ] ידוע איך השינוי מתנהג ב-Hebrew RTL.
- [ ] אם יש copy/enum labels — משתמשים ב-label maps מ-`LOCALIZATION.md`.

### 2.3 Technical Readiness

- [ ] API/function contract קיים ב-`API_CONTRACT.md`, אם יש backend action.
- [ ] Data model קיים ב-`DATA_MODEL.md`, אם יש collection/field חדש.
- [ ] Security model ברור ב-`SECURITY.md`, אם יש read/write חדש.
- [ ] ידוע אילו tests צריך להוסיף לפי `TEST_STRATEGY.md`.
- [ ] אין צורך ב-secret חדש, או שה-secret מוגדר ב-Secret Manager ותהליך CI.
- [ ] migration נדרשת? אם כן — היא מתועדת ב-`MIGRATION_PLAN.md`.

---

## 3. Definition of Done — Task / PR Level

PR נחשב done רק אם כל הסעיפים הרלוונטיים מתקיימים.

### 3.1 Code Quality

- [ ] הקוד עומד ב-`CONVENTIONS.md`.
- [ ] TypeScript strict עובר.
- [ ] אין `any` ללא הצדקה מתועדת.
- [ ] אין dead code / imports לא בשימוש.
- [ ] יש named exports.
- [ ] שמות files/components/hooks לפי conventions.
- [ ] אין business logic ב-`src/shared`.
- [ ] אין direct Firebase access ב-pages כשקיים hook/repository מתאים.
- [ ] אין direct Gemini/payment provider client-side.

### 3.2 Backend-Authoritative

- [ ] כל state רגיש נאכף בשרת, לא רק ב-UI.
- [ ] client לא כותב server-owned fields.
- [ ] `coins`, `isPro`, `subscriptionTier`, `subscriptionStatus`, `subscriptionExpiresAt`, `verifiedBadge`, `matches`, `swipes`, `transactions`, `ownedItems`, `subscriptions`, `aiRequests` נשארים server-owned.
- [ ] Pro gating נאכף ב-Cloud Function / Security Rules.
- [ ] checkout redirect לא מעניק Pro.
- [ ] analytics/logging לא משמשים כ-source of truth.

### 3.3 Tests

- [ ] נוספו unit tests רלוונטיים.
- [ ] נוספו component tests רלוונטיים.
- [ ] נוספו integration/emulator tests אם יש flow backend.
- [ ] נוספו Security Rules tests אם יש שינוי rules/data access.
- [ ] נוספו Cloud Function tests אם יש function חדש/מעודכן.
- [ ] נוספו E2E או עודכן flow קיים אם השינוי נוגע למסע קריטי.
- [ ] כל הבדיקות עוברות.

Required commands:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:rules
npm run build
```

### 3.4 Security

- [ ] אין secrets ב-client.
- [ ] אין secrets ב-repo.
- [ ] אין logging של PII, raw chat, raw payment payload, Gemini prompt/response.
- [ ] Security Rules עודכנו ונבדקו אם data access השתנה.
- [ ] Storage Rules עודכנו ונבדקו אם upload/read השתנה.
- [ ] כל פעולה רגישה auditable.
- [ ] suspended/deleted users מטופלים אם רלוונטי.
- [ ] idempotency קיימת בפעולות שדורשות זאת.

### 3.5 Documentation Sync

אם השינוי נוגע לאחד מהתחומים — המסמך המתאים עודכן באותו PR:

| Change Type | Required Docs |
|---|---|
| data/collection/field | `DATA_MODEL.md`, `SECURITY.md` |
| callable/http function | `API_CONTRACT.md`, `SECURITY.md`, `TEST_STRATEGY.md` אם נדרש |
| AI behavior | `AI_INTEGRATION.md`, `ENVIRONMENTS.md` אם secret/config השתנה |
| payments/subscription | `PAYMENTS.md`, `API_CONTRACT.md`, `SECURITY.md` |
| environment/config/secrets | `ENVIRONMENTS.md`, `CI_CD.md` אם pipeline השתנה |
| UX route/screen/flow | `UX_FLOWS.md`, `COMPONENTS.md` |
| design tokens/components | `DESIGN_SYSTEM.md`, `COMPONENTS.md` |
| analytics events | `ANALYTICS.md` |
| logging/alerts/audit | `OBSERVABILITY.md` |
| tests/QA strategy | `TEST_STRATEGY.md` |
| migration step | `MIGRATION_PLAN.md` |

### 3.6 UX / RTL / Accessibility

- [ ] כל async screen מטפל ב-`loading`, `empty`, `error`, `success`.
- [ ] UI בעברית ו-RTL.
- [ ] enum labels דרך label maps.
- [ ] אין hardcoded enum labels.
- [ ] שימוש ב-`start`/`end`, לא `left`/`right`, כשמדובר במשמעות layout.
- [ ] buttons ו-icon buttons נגישים עם accessible name.
- [ ] form errors מחוברים לשדות.
- [ ] keyboard/focus states תקינים.
- [ ] mobile-first נבדק.

### 3.7 Observability / Analytics

- [ ] analytics events נוספו אם השינוי משפיע על funnel/KPI.
- [ ] events לא כוללים PII/secrets/raw content.
- [ ] logging structured ובטוח.
- [ ] audit logs קיימים לפעולות רגישות.
- [ ] alert/metric עודכן אם השינוי יוצר סיכון production.
- [ ] feature flag קיים אם צריך kill switch.

### 3.8 CI / Review

- [ ] PR עבר review.
- [ ] CI green.
- [ ] bundle scan עבר.
- [ ] forbidden strings לא קיימים ב-bundle.
- [ ] אין `GEMINI_API_KEY`, `PAYMENT_*_SECRET`, `process.env.API_KEY`, `gemini-3-flash-preview` ב-client bundle.
- [ ] אין local prod deploy.
- [ ] אם PR משנה rules/functions/payments/AI — reviewer מתאים אישר.

---

## 4. Per-Layer DoD

### 4.1 Frontend Component DoD

- [ ] component נמצא במקום הנכון: `src/shared` או `src/features/{feature}`.
- [ ] shared component ללא business logic.
- [ ] props typed.
- [ ] no `any`.
- [ ] supports `loading`, `empty`, `error`, `success` אם async.
- [ ] supports RTL.
- [ ] uses `start`/`end`.
- [ ] enum labels דרך `LOCALIZATION.md`.
- [ ] accessible roles/labels.
- [ ] component tests קיימים.
- [ ] no direct secrets/provider SDKs.
- [ ] mobile viewport נבדק.

### 4.2 Cloud Function DoD

- [ ] function מופיעה ב-`API_CONTRACT.md`.
- [ ] auth נבדק.
- [ ] Zod validation קיים.
- [ ] permission checks קיימים.
- [ ] suspended/deleted user נבדק.
- [ ] idempotency קיימת כשצריך.
- [ ] side effects מתועדים.
- [ ] transaction/batch משמשים כשצריך consistency.
- [ ] standard `ApiErrorCode` מוחזר.
- [ ] אין raw provider errors ל-client.
- [ ] structured logging בטוח.
- [ ] audit write קיים לפעולות רגישות.
- [ ] tests מכסים auth/validation/permission/idempotency/side effects/failures.
- [ ] emulator integration test קיים ל-flow קריטי.

### 4.3 Security Rules Change DoD

- [ ] default deny נשמר.
- [ ] allow cases מוגדרים במדויק.
- [ ] deny tests נוספו לכל path/field רגיש.
- [ ] allow tests נוספו לכל behavior תקין.
- [ ] `npm run test:rules` עובר.
- [ ] אין פתיחה רחבה כדי "לתקן UX".
- [ ] Storage Rules נבדקו אם upload/read השתנה.
- [ ] reviewer security/backend אישר.

### 4.4 Data Model Change DoD

- [ ] `DATA_MODEL.md` עודכן לפני/עם הקוד.
- [ ] types נגזרים או מסונכרנים עם המודל.
- [ ] indexes עודכנו אם צריך.
- [ ] Security Rules עודכנו.
- [ ] migration/backfill מתועד אם נדרש.
- [ ] emulator seed עודכן.
- [ ] tests עודכנו.
- [ ] אין Hebrew enum values ב-data.
- [ ] sensitive fields מסומנים server-owned.

### 4.5 Payment Change DoD

- [ ] `PAYMENTS.md` עודכן.
- [ ] `API_CONTRACT.md` עודכן אם function/contract השתנה.
- [ ] secrets ב-Secret Manager בלבד.
- [ ] checkout redirect לא מעניק Pro.
- [ ] entitlement רק דרך `paymentWebhook` מאומת או reconciliation.
- [ ] idempotency לפי `providerEventId`.
- [ ] `billingEvents` מתוכנן/מעודכן אם רלוונטי.
- [ ] tests ל-invalid signature, duplicate webhook, entitlement sync.
- [ ] logs ללא raw payment payload.
- [ ] staging sandbox נבדק.

### 4.6 AI Change DoD

- [ ] `AI_INTEGRATION.md` עודכן.
- [ ] Gemini server-side בלבד.
- [ ] אין Gemini key/client SDK ב-frontend.
- [ ] secret ב-Secret Manager.
- [ ] prompts/responses לא נרשמים ב-logs/analytics.
- [ ] `aiRequests` audit נשמר.
- [ ] rate limits/feature flag נשקלו.
- [ ] tests ל-success/refusal/failure/rate-limit.
- [ ] safe error/refusal UX קיים.
- [ ] cost/observability עודכנו אם נדרש.

---

## 5. Feature-Level DoD

Feature נחשב done רק אם:

- [ ] כל user stories שלו done ברמת PR.
- [ ] acceptance criteria מולאו.
- [ ] UX flow עובד לפי `UX_FLOWS.md`.
- [ ] API/data/security docs מסונכרנים.
- [ ] frontend + backend מחוברים.
- [ ] backend enforcement קיים לכל gating רגיש.
- [ ] unit/component/integration/rules tests קיימים.
- [ ] E2E flow קיים אם feature קריטי.
- [ ] analytics events קיימים אם feature משפיע על funnel/KPI.
- [ ] observability/logging/audit קיימים אם feature רגיש.
- [ ] feature flag/kill switch קיים אם הסיכון מצדיק.
- [ ] RTL/mobile/accessibility נבדקו.
- [ ] staging smoke עבר.

---

## 6. MVP Release Acceptance Criteria

MVP release מוכן רק אם כל checklist זה ירוק.

### 6.1 Product Flows

- [ ] signup/login עובד.
- [ ] onboarding עובד וחוסם discovery עד השלמה.
- [ ] user יכול להוסיף game/profile בסיסי.
- [ ] discovery deck עובד.
- [ ] swipe left/right עובד דרך `submitSwipe`.
- [ ] reciprocal swipe יוצר match.
- [ ] match celebration מוצג.
- [ ] chat נפתח מ-match.
- [ ] text chat חינמי עובד.
- [ ] media chat חסום ל-Basic ונאכף בשרת.
- [ ] Pro gating עובד.
- [ ] checkout מתחיל דרך `createCheckoutSession`.
- [ ] Pro מופעל רק אחרי `paymentWebhook`.
- [ ] shop browse עובד.
- [ ] purchase/equip cosmetics עובד דרך backend.
- [ ] coins משתנים רק בשרת.
- [ ] AI Hub עובד דרך callable server-side.
- [ ] block/report עובדים.
- [ ] responsive mobile-first עובד.
- [ ] Hebrew RTL תקין.

### 6.2 Security / Backend

- [ ] Security Rules deny matrix עובר.
- [ ] Storage Rules tests עוברים.
- [ ] Cloud Functions tests עוברים.
- [ ] אין client writes ל-server-owned fields.
- [ ] אין secrets ב-client.
- [ ] Gemini לא נמצא ב-client.
- [ ] payment secrets לא ב-repo/client.
- [ ] audit logs קיימים לפעולות רגישות.

### 6.3 Quality / Release

- [ ] `npm run typecheck` עובר.
- [ ] `npm run lint` עובר.
- [ ] `npm run test` עובר.
- [ ] `npm run test:rules` עובר.
- [ ] `npm run build` עובר.
- [ ] bundle scan עובר.
- [ ] staging smoke עובר.
- [ ] production deploy gate מוכן.
- [ ] docs מסונכרנים.
- [ ] rollback plan קיים.

---

## 7. Release-Level DoD

Release מוכן ל-production רק אם:

- [ ] כל PR checks ירוקים.
- [ ] staging deploy ירוק.
- [ ] staging smoke E2E עבר.
- [ ] Security Rules tests ירוקים.
- [ ] Storage Rules tests ירוקים.
- [ ] production secrets קיימים ב-Secret Manager.
- [ ] no forbidden bundle strings.
- [ ] CHANGELOG עודכן.
- [ ] release tag נוצר.
- [ ] rollback plan ידוע.
- [ ] manual approval התקבל.
- [ ] deploy מתבצע דרך CI protected environment.
- [ ] no local prod deploy.
- [ ] post-deploy smoke מוגדר.
- [ ] observability dashboards/alerts נבדקים אחרי deploy.

Production gate commands:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:rules
npm run build
npm run scan:bundle
```

---

## 8. Migration DoD

Migration step נחשב done רק אם:

- [ ] step תואם `MIGRATION_PLAN.md`.
- [ ] code ישן/מת הוסר אם ה-step דורש זאת.
- [ ] Firebase config/environment תקין.
- [ ] data model docs עודכנו.
- [ ] API contracts עודכנו.
- [ ] Security Rules עודכנו ונבדקו.
- [ ] emulator seed עודכן.
- [ ] feature עובד מקצה לקצה ב-dev/staging.
- [ ] rollback/forward-fix ידוע.
- [ ] אין מעבר ל-production לפני שהשלב עבר QA.
- [ ] docs מסונכרנים באותו PR.

Migration areas that require explicit DoD:

| Area | Required |
|---|---|
| Security/Firebase | rules tests, env separation, no prod local |
| Data | `DATA_MODEL.md`, seed, indexes, migration |
| Discovery | `submitSwipe`, matching tests, Basic limit |
| Chat | participant access, text free, media Pro-only |
| Economy | coins server-owned, transactions audit |
| Subscription | webhook entitlement, no client Pro grant |
| AI | server proxy only, audit, no prompts in logs |
| Safety | report/block functions, access restrictions |
| QA | unit/integration/rules/E2E where relevant |

---

## 9. Definition of Done Anti-Patterns

The following are not done:

- [ ] UI hides an action but backend still allows it.
- [ ] Pro gate exists only in frontend.
- [ ] coins are updated client-side.
- [ ] checkout success redirect grants Pro.
- [ ] function has no Zod validation.
- [ ] function has no auth/permission tests.
- [ ] Security Rules changed without emulator tests.
- [ ] tests only mock success path.
- [ ] E2E passes but rules deny matrix missing.
- [ ] docs are outdated.
- [ ] `DATA_MODEL.md` does not match Firestore usage.
- [ ] `API_CONTRACT.md` does not match function implementation.
- [ ] secrets exist in `.env`, repo, client, or bundle.
- [ ] Gemini called from frontend.
- [ ] raw chat/payment/AI prompt logged.
- [ ] Hebrew enum values stored in data.
- [ ] hardcoded enum labels in components.
- [ ] mobile/RTL not checked.
- [ ] CI red but PR merged.
- [ ] production deployed locally.

---

## 10. Open Items

| Item | Status | Impact |
|---|---|---|
| Final numeric coverage thresholds | Open | `TEST_STRATEGY.md` has recommended targets; enforcement TBD. |
| Required E2E set for every release | Open | Need final release smoke suite. |
| Visual regression requirement | Open | May become part of UI DoD. |
| Accessibility automation threshold | Open | Consider `axe-core` gate. |
| Required reviewers matrix | Open | CI/CD has recommendation; final ownership TBD. |
| Release branch strategy | Open | Tags from `main` are enough for MVP unless hotfixes grow. |
| Formal incident/runbook DoD | Open | Needed before public launch. |
