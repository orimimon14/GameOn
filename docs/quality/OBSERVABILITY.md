# Swish & Game — Observability & Monitoring

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Production Observability & Monitoring Contract |
| Repository Path | `docs/quality/OBSERVABILITY.md` |
| Product | Swish & Game |
| Source of Truth | `docs/architecture/ARCHITECTURE.md`, `docs/architecture/SECURITY.md`, `docs/engineering/ENVIRONMENTS.md`, `docs/architecture/PAYMENTS.md`, `docs/architecture/AI_INTEGRATION.md`, `docs/architecture/DATA_MODEL.md`, `docs/quality/ANALYTICS.md` |
| Primary Environments | `swish-game-dev`, `swish-game-staging`, `swish-game-prod` |
| Observability Scope | system health, reliability, security, cost, auditability |
| Out of Scope | product funnels and KPIs — see `docs/quality/ANALYTICS.md` |
| Privacy Principle | no secrets, no PII, no raw chat, no raw payment payloads, no Gemini prompts/responses in logs |
| Audit Principle | every sensitive operation must be auditable |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Observability Strategy](#2-observability-strategy)
- [3. Logging](#3-logging)
- [4. Error Tracking](#4-error-tracking)
- [5. Monitoring Targets](#5-monitoring-targets)
- [6. Critical Alerts](#6-critical-alerts)
- [7. Audit Logs](#7-audit-logs)
- [8. Dashboards](#8-dashboards)
- [9. SLOs & Health Checks](#9-slos--health-checks)
- [10. Cost Monitoring](#10-cost-monitoring)
- [11. Privacy in Logs](#11-privacy-in-logs)
- [12. Tooling](#12-tooling)
- [13. Incident Response](#13-incident-response)
- [14. Open Items](#14-open-items)

---

## 2. Observability Strategy

### 2.1 Goal

Observability ב-Swish & Game נועד לענות מהר על שאלות מערכתיות:

- האם המערכת זמינה?
- האם Cloud Functions נכשלות?
- האם latency גבוה מדי?
- האם Firestore/Storage מתקרבים למגבלות quota?
- האם webhook של תשלומים נכשל?
- האם יש spike בשגיאות AI / עלויות Gemini?
- האם יש ניסיונות עקיפה של Security Rules?
- האם יש כתיבות לא צפויות ל-server-owned collections?
- האם פעולות רגישות auditable?

### 2.2 Observability vs Analytics

`OBSERVABILITY.md` עוסק בבריאות המערכת.  
`ANALYTICS.md` עוסק בהתנהגות מוצרית, funnels ו-KPIs.

| Area | Observability | Analytics |
|---|---|---|
| Purpose | reliability, errors, security, cost, incidents | product behavior, funnels, KPIs |
| Examples | function error rate, webhook failures, rule denials | onboarding completion, match funnel, Pro conversion |
| Tools | Cloud Logging, Cloud Monitoring, Error Reporting, Sentry | GA4/Firebase Analytics/PostHog/Mixpanel TBD |
| Privacy | no PII/raw content/secrets | no PII/raw content/secrets |
| Source of truth | logs, metrics, traces, audit docs | event taxonomy |

### 2.3 Observability Pillars

| Pillar | Purpose | Main Tools |
|---|---|---|
| Logs | להבין מה קרה ברמת request/function | Cloud Logging, structured logs |
| Metrics | לזהות trends, spikes, degradation | Cloud Monitoring, log-based metrics |
| Traces | להבין latency and call path | Cloud Trace / function telemetry if enabled |
| Alerts | להפוך degradation ל-action | Cloud Monitoring alert policies |
| Error Tracking | grouping and triage of exceptions | Cloud Error Reporting, Sentry |
| Audit Logs | immutable-ish business/security trail | Firestore audit collections |

### 2.4 Environment Separation

Observability must be environment-aware.

| Environment | Purpose | Monitoring Behavior |
|---|---|---|
| `swish-game-dev` | local/dev testing | debug-friendly, no noisy paging |
| `swish-game-staging` | pre-prod verification | staging alerts to engineering channel |
| `swish-game-prod` | production users | high-signal alerts, severity-based response |

Every log/metric/event must include or be attributable to:

```text
app_env
firebase_project_id
function_name
```

where relevant.

---

## 3. Logging

### 3.1 Logging Principles

Logs must be:

- structured.
- searchable.
- privacy-safe.
- environment-tagged.
- correlated across request/function flow.
- actionable.
- minimal but sufficient.

Logs must not include raw private user content or secrets.

### 3.2 Structured Logging Shape

Recommended backend log shape:

```ts
type LogContext = {
  app_env: "dev" | "staging" | "prod";
  firebase_project_id: string;
  function_name: string;
  request_id: string;
  correlation_id?: string;
  uid?: string;
  severity: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  operation?: string;
  resource_type?: string;
  resource_id?: string;
};
```

Example:

```ts
logger.info("submitSwipe completed", {
  app_env: process.env.APP_ENV,
  firebase_project_id: process.env.GCLOUD_PROJECT,
  function_name: "submitSwipe",
  request_id,
  uid,
  operation: "submit_swipe",
  result: "matched",
  match_id: matchId,
  chat_id: chatId,
  game_id: input.gameId
});
```

### 3.3 Log Levels

| Level | Usage | Examples |
|---|---|---|
| `DEBUG` | local/staging diagnostics only | branch decisions, emulator-only details |
| `INFO` | successful important operations | `submitSwipe completed`, webhook processed |
| `WARNING` | recoverable or suspicious states | duplicate webhook, rate limit, rule denial spike |
| `ERROR` | failed request/action needing investigation | function exception, provider failure |
| `CRITICAL` | user-impacting/systemic issue | payment webhook outage, negative coin balance |

### 3.4 Backend Logging

Backend logs are emitted from:

- callable Cloud Functions.
- HTTP functions.
- Firestore/Storage triggers.
- scheduled functions.
- reconciliation jobs.

Required context for sensitive backend operations:

| Field | Required? | Notes |
|---|---:|---|
| `function_name` | Yes | e.g. `purchaseShopItem` |
| `request_id` | Yes | generated at function entry |
| `uid` | When authenticated | pseudonymous; no email |
| `operation` | Yes | e.g. `purchase_shop_item` |
| `result` | When relevant | e.g. `success`, `denied`, `duplicate`, `failed` |
| `error_code` | On errors | `ApiErrorCode` or provider-normalized code |
| `duration_ms` | Recommended | latency monitoring |
| `resource_id` | When safe | `match_id`, `item_id`, `chat_id`, not raw content |

### 3.5 Frontend Logging

Frontend logs should be minimal.

Allowed frontend logging:

- route-level unhandled error context.
- API/callable failure summary.
- client build/version/environment.
- sanitized UI state names.

Frontend must not log:

- raw chat messages.
- bio.
- email.
- profile image URLs.
- Gemini prompts/responses.
- payment data.
- secrets.
- full Firebase config beyond public project ID.
- raw stack traces to the user.

Frontend exceptions should be sent to Sentry if configured.

### 3.6 Correlation IDs

Every Cloud Function request should generate or propagate a `request_id`.

Recommended pattern:

```ts
const requestId = crypto.randomUUID();
```

For client-initiated callables, the client may send a `client_request_id` for deduplication/debugging only if safe.

Rules:

- `request_id` is not authentication.
- `request_id` is not idempotency key unless explicitly designed.
- `request_id` must be safe to log.
- use `correlation_id` to connect webhook/reconciliation flows where possible.

### 3.7 What to Log

Allowed examples:

```text
function_name
request_id
uid
app_env
firebase_project_id
operation
ApiErrorCode
duration_ms
match_id
chat_id
item_id
game_id
subscription_status
provider
provider_event_id hash or normalized ID
ai_request_id
report_id
```

### 3.8 What Not to Log

Forbidden examples:

```text
GEMINI_API_KEY
PAYMENT_WEBHOOK_SECRET
PAYMENT_API_SECRET
PAYMENT_API_KEY
service account JSON
raw payment payload
payment card data
provider signature secret
Gemini prompt
Gemini response
system prompt
raw chat message
report description
bio
email
phone
profile image URL
storage download token
private account data
```

### 3.9 Log Redaction

Every logger wrapper must support redaction.

```ts
const forbiddenLogKeys = [
  "email",
  "phone",
  "bio",
  "messageText",
  "rawChatMessage",
  "reportDescription",
  "geminiPrompt",
  "geminiResponse",
  "systemPrompt",
  "paymentPayload",
  "paymentCardData",
  "webhookSecret",
  "apiKey",
  "serviceAccountJson"
];

export function redactLogPayload(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if (forbiddenLogKeys.includes(key)) {
        return [key, "[REDACTED]"];
      }

      return [key, value];
    })
  );
}
```

---

## 4. Error Tracking

### 4.1 Tool Split

| Area | Tool | Purpose |
|---|---|---|
| Frontend | Sentry | React exceptions, route errors, UI runtime failures |
| Backend | Cloud Error Reporting | Cloud Functions exceptions and grouped backend errors |
| Logs | Cloud Logging | context around failures |
| Alerts | Cloud Monitoring | error rate, latency, quotas, log-based metrics |

### 4.2 Frontend Error Tracking

Sentry should capture:

- unhandled React exceptions.
- route error boundary exceptions.
- failed dynamic imports.
- serious client runtime errors.
- environment/build info.
- route name.

Sentry must not capture:

- raw user inputs.
- raw chat.
- bio.
- email.
- Gemini prompts/responses.
- payment data.
- secrets.

Recommended Sentry context:

```ts
Sentry.setContext("app", {
  app_env,
  app_version,
  locale: "he-IL",
  direction: "rtl"
});
```

Optional user context:

```ts
Sentry.setUser({
  id: pseudonymousUserId
});
```

Do not set user email.

### 4.3 Backend Error Tracking

Cloud Functions should throw standard errors and log safe structured context.

Backend errors should include:

- `function_name`.
- `request_id`.
- `uid` if authenticated.
- `ApiErrorCode`.
- safe `operation`.
- safe provider-normalized code where applicable.

Do not expose raw stack traces to the client.

Client-facing errors must map to safe `ApiErrorCode` messages.

### 4.4 Raw Provider Errors

Provider errors must be normalized before client exposure.

| Provider | Raw Error Handling |
|---|---|
| Payment provider | log safe normalized code; never raw payload/card data |
| Gemini | log safe provider category/status; never prompt/response |
| Firebase Admin | log safe code and resource type; avoid private doc data |
| Storage | log bucket/path category only; avoid download tokens |

### 4.5 Client Error UX

Client UI must show safe messages:

```text
אירעה שגיאה. נסה שוב מאוחר יותר.
```

or feature-specific safe copy.

Never show:

- raw provider response.
- raw stack trace.
- function internals.
- security rule internals.
- prompt/safety policy internals.

---

## 5. Monitoring Targets

### 5.1 System Monitoring Matrix

| Target | What to Monitor | Why | Signals |
|---|---|---|---|
| Auth | sign-in failures, auth latency, provider issues | Login/onboarding availability | Firebase Auth errors, client auth error rates |
| Firestore | read/write latency, quota, rule denials, hot documents | Core data layer health | Cloud Monitoring, rule denial logs, quota alerts |
| Cloud Functions | error rate, latency, cold starts, timeouts, retries | Backend-authoritative operations | function metrics, logs, Error Reporting |
| `submitSwipe` / matching | error rate, transaction failures, duplicate match attempts | Core product loop | logs, function metrics, match audit |
| Chat | message write failures, non-participant denials, blocked write attempts | Engagement and safety | Firestore rule logs, function logs |
| Storage | upload failures, abuse patterns, size/MIME denials | Profile images/chat media safety | Storage metrics/rules logs |
| Shop / Economy | purchase failures, negative balances, transaction audit gaps | Coin integrity | `transactions`, function logs |
| Subscription / Webhook | invalid signatures, processing failures, duplicate events, entitlement drift | Revenue and Pro trust | `billingEvents`, function logs, reconciliation |
| AI | Gemini error rate, refusal/blocked rate, timeout, request volume, cost | AI reliability/cost/safety | `aiRequests`, function metrics, cost metrics |
| Safety | report creation failures, moderation queue growth, block failures | User safety | `reports`, `moderationActions`, function logs |
| Frontend | JS exceptions, route errors, build version issues | Client stability | Sentry, web vitals if enabled |
| Security | rule denial spikes, unexpected writes, suspicious patterns | Abuse/bypass detection | Security Rules logs, log-based metrics |
| Environments | dev/staging/prod separation, deploy health | Prevent env mixups | project ID, release markers, smoke checks |

### 5.2 Function-Specific Monitoring

| Function | Monitor |
|---|---|
| `submitSwipe` | error rate, latency p95/p99, transaction retry/failure, `resource_exhausted`, duplicate match handling |
| `purchaseShopItem` | error rate, `insufficient_coins`, `pro_required`, transaction failure, negative balance prevention |
| `equipItem` | error rate, not-owned attempts, public profile sync failure |
| `sendChatMediaMessage` | `pro_required`, Storage failures, MIME/size denials, latency |
| `sendAIProfileReview` | timeout, provider errors, blocked/refusal, token/cost estimates, audit write failure |
| `sendAISquadAdvice` | timeout, provider errors, blocked/refusal, token/cost estimates, audit write failure |
| `createReport` | failures, report volume, invalid report attempts |
| `blockUser` | failures, repeated block attempts, match/chat update failure |
| `syncPublicProfile` | failures, private data exclusion assertions where testable |
| `createCheckoutSession` | provider errors, duplicate active subscription attempts, checkout creation latency |
| `paymentWebhook` | invalid signature, processing failure, duplicate event, unknown customer, entitlement update failure |
| `reconcileSubscription` | drift count, provider failures, entitlement corrections |

---

## 6. Critical Alerts

### 6.1 Severity Levels

| Severity | Meaning | Expected Response |
|---|---|---|
| `SEV1` | Revenue/security/core availability impact | immediate response |
| `SEV2` | Major feature degradation | same-day urgent response |
| `SEV3` | Partial degradation/noisy issue | triage during business hours |
| `SEV4` | Informational trend | backlog/monitor |

### 6.2 Alert Matrix

| Alert | Trigger | Severity | Action |
|---|---|---|---|
| Payment webhook failure spike | `paymentWebhook` 5xx or processing failures above threshold in 5–10 min | `SEV1` | Disable checkout if needed via `system/config.proSubscriptionEnabled = false`; inspect logs; verify provider status; replay/reconcile events. |
| Invalid webhook signature spike | high rate of invalid signatures | `SEV2` | Check for attack/misconfiguration; verify secret rotation; consider WAF/rate limiting. |
| `submitSwipe` error spike | error rate above threshold or p95 latency high | `SEV2` | Inspect transaction failures, Firestore quota, recent deploy; consider rollback/disable discovery actions if severe. |
| Match transaction failures | transaction abort/failure spike in `submitSwipe` | `SEV2` | Check hot docs/indexes; verify deterministic IDs; inspect contention. |
| `purchaseShopItem` failures | purchase failures spike | `SEV2` | Check transactions, coin balances, item config; pause shop if economy integrity risk. |
| Negative coin balance detected | any user `coins < 0` or transaction invariant violation | `SEV1` | Freeze shop purchases; inspect transaction audit; correct balances; patch function. |
| AI error spike | AI call failures/timeouts exceed threshold | `SEV2` | Disable AI via `system/config.aiHubEnabled = false`; inspect Gemini status/cost/limits. |
| AI cost spike | AI spend/request volume above budget threshold | `SEV2` | Lower limits/disable AI; inspect abuse; rotate keys if suspicious. |
| Storage abuse | upload denials/large file attempts spike | `SEV2` | Tighten rules/limits; inspect source; disable media if needed. |
| Firestore quota approaching | reads/writes/index/storage nearing quota/budget | `SEV2` | Inspect queries, hot paths; reduce polling; deploy index/query fix. |
| Security rule denial spike | sudden increase in denied writes/reads | `SEV2` | Determine abuse vs client bug; inspect release; block abusive patterns if needed. |
| Unexpected writes to server-owned collections | direct client write attempts or unauthorized writes to protected paths | `SEV1` | Investigate security bypass/rule regression; lock down rules; rollback. |
| Chat write failures | message write failures or denied participant writes spike | `SEV2` | Inspect chat rules, blocked state, deploy changes; roll back if regression. |
| Report creation failure spike | `createReport` failures above threshold | `SEV2` | Prioritize safety; inspect rules/functions; hotfix. |
| Cloud Functions cold start/latency spike | p95/p99 latency above SLO | `SEV3` | Analyze function region, min instances, bundle size. |
| Frontend exception spike | Sentry issue volume above threshold after deploy | `SEV2/SEV3` | Rollback or hotfix depending user impact. |
| Secret access failure | Secret Manager access denied/missing secret in prod | `SEV1` | Verify secret binding/IAM; rollback deploy if needed. |
| Prod config missing/corrupt | `system/config` missing required fields | `SEV1` | Restore config from known good seed; disable affected feature. |

### 6.3 Alert Routing

Recommended routing:

| Severity | Destination |
|---|---|
| `SEV1` | on-call/pager + engineering channel |
| `SEV2` | urgent engineering channel + owner |
| `SEV3` | engineering channel |
| `SEV4` | dashboard/backlog |

Final on-call routing is an open item.

### 6.4 Alert Quality Rules

Alerts must be:

- actionable.
- tied to user/system impact.
- low-noise.
- environment-specific.
- documented with runbook link.
- tested in staging where possible.

---

## 7. Audit Logs

### 7.1 Audit Principle

Every sensitive operation must leave an audit trail that can answer:

- who initiated the action?
- what action occurred?
- what resource changed?
- when did it happen?
- what was the before/after sensitive value where appropriate?
- which backend function performed it?
- what request/correlation ID links related logs?

Audit logs are not product analytics. They are operational/security/accounting records.

### 7.2 Audit Collections

| Audit Area | Collection / Path | Scope | Status |
|---|---|---|---|
| Coin transactions | `users/{uid}/transactions/{transactionId}` | coin balance changes, item purchases, grants, refunds | MVP |
| AI requests | `aiRequests/{requestId}` | AI request metadata, status, safety/cost metadata | MVP |
| Reports | `reports/{reportId}` | user/content reports and status | MVP |
| Billing events | `billingEvents/{eventId}` | normalized provider webhook events/idempotency | Scale/V1 |
| Moderation actions | `moderationActions/{actionId}` | admin/moderator decisions | Scale/V1 |

### 7.3 Coin Transaction Audit

Required fields should include:

| Field | Purpose |
|---|---|
| `uid` | owner user |
| `type` | `item_purchase`, `admin_grant`, `signup_bonus`, `refund`, `system_adjustment` |
| `amount` | signed coin delta |
| `balanceBefore` | integrity/debugging |
| `balanceAfter` | integrity/debugging |
| `itemId?` | purchase relation |
| `sourceFunction` | e.g. `purchaseShopItem` |
| `requestId` | log correlation |
| `createdAt` | server timestamp |
| `createdBy` | `system`, `admin`, or user uid where applicable |

Must not store:

- payment data.
- private notes with PII.
- raw client payload.

### 7.4 Billing Event Audit

`billingEvents/{eventId}` is Scale/V1 but should be planned now.

Recommended event ID:

```text
{provider}:{providerEventId}
```

Store:

| Field | Purpose |
|---|---|
| `provider` | provider enum |
| `providerEventId` | idempotency |
| `eventType` | normalized event type |
| `uid?` | resolved user |
| `subscriptionId?` | provider subscription reference |
| `status` | processed/ignored/failed |
| `processedAt` | server timestamp |
| `requestId` | correlation |
| `errorCode?` | normalized error code |

Do not store raw provider payload unless explicitly approved and redacted. Prefer storing normalized metadata only.

### 7.5 AI Request Audit

`aiRequests/{requestId}` should store:

| Field | Purpose |
|---|---|
| `uid` | requester |
| `requestType` | `profile_optimization`, `squad_advice`, `match_insight` |
| `status` | `pending`, `completed`, `failed`, `blocked` |
| `model` | server-side model ID |
| `durationMs?` | latency |
| `estimatedInputTokens?` | cost signal if available |
| `estimatedOutputTokens?` | cost signal if available |
| `safetyOutcome?` | normalized safe category |
| `errorCode?` | normalized safe error |
| `createdAt` | server timestamp |
| `completedAt?` | server timestamp |

Must not store:

- raw prompt.
- raw Gemini response.
- system prompt.
- private profile text beyond approved minimized fields.
- API key.

### 7.6 Report Audit

`reports/{reportId}` should store:

| Field | Purpose |
|---|---|
| `reporterUid` | reporter |
| `reportedUid` | reported user |
| `reason` | enum from `ReportReason` |
| `source` | `profile`, `chat`, `message`, `matches`, `discovery` |
| `status` | `open`, `reviewing`, `resolved`, `dismissed` |
| `createdAt` | server timestamp |
| `updatedAt` | server timestamp |
| `sourceRef?` | safe resource reference |
| `description?` | sensitive; avoid logging elsewhere |

Reports are sensitive and must not be visible to regular users after creation unless explicitly designed.

### 7.7 Moderation Audit

`moderationActions/{actionId}` is Scale/V1.

Store:

| Field | Purpose |
|---|---|
| `actorUid` | moderator/admin/service actor |
| `targetUid` | affected user |
| `reportId?` | related report |
| `actionType` | warning/suspension/dismissal/etc. |
| `reasonCode` | normalized reason |
| `createdAt` | server timestamp |
| `requestId` | correlation |

Do not store private freeform details unless strictly necessary.

### 7.8 Audit Retention

Retention policy is open. Initial guidance:

| Audit Type | Suggested Retention |
|---|---|
| coin transactions | long-lived/accounting integrity |
| billing events | according to billing/legal requirements |
| AI requests | shorter retention for operational safety/cost |
| reports | according to safety/legal policy |
| moderation actions | long-lived safety/accountability |

---

## 8. Dashboards

### 8.1 System Health Dashboard

Purpose: detect overall production health.

Widgets:

- Cloud Functions error rate by function.
- Cloud Functions p50/p95/p99 latency.
- cold starts/timeouts.
- Firestore read/write count.
- Firestore latency/quota.
- Storage upload failures.
- frontend exception rate.
- deploy/release marker.
- active feature flags from `system/config`.

### 8.2 Economy Dashboard

Purpose: protect coins and cosmetics economy.

Widgets:

- `purchaseShopItem` success/failure rate.
- `insufficient_coins` count.
- `pro_required` count for shop.
- total coin deltas by type.
- negative balance detector.
- transaction audit gaps.
- top failing `itemId`.
- `equipItem` failures.

### 8.3 Billing Dashboard

Purpose: protect Pro revenue and entitlement sync.

Widgets:

- `createCheckoutSession` success/failure.
- `paymentWebhook` success/failure.
- invalid signature count.
- duplicate webhook count.
- unknown customer count.
- `subscription_activated` count.
- `subscription_cancelled` count.
- entitlement drift count from reconciliation.
- webhook latency / processing duration.

### 8.4 AI Cost & Reliability Dashboard

Purpose: control Gemini reliability and spend.

Widgets:

- `sendAIProfileReview` request count.
- `sendAISquadAdvice` request count.
- AI error rate.
- AI timeout rate.
- blocked/refusal count.
- estimated tokens.
- estimated cost.
- requests by `isPro`.
- `aiHubEnabled` flag status.
- Gemini provider error categories.

### 8.5 Safety Queue Dashboard

Purpose: maintain user safety operations.

Widgets:

- open reports count.
- reports by reason.
- reports by source.
- report creation failures.
- block actions count.
- moderation backlog age.
- repeated reports against same user.
- safety function errors.

### 8.6 Security Dashboard

Purpose: detect abuse or rule regressions.

Widgets:

- Security Rule denials by path.
- writes denied to server-owned fields.
- direct attempts to create `matches`.
- direct attempts to create `users/{uid}/swipes`.
- direct attempts to update `subscriptions`.
- denied chat reads by non-participants.
- Storage upload denials.
- rule denial spike by release version.

---

## 9. SLOs & Health Checks

### 9.1 Initial SLOs

Initial SLOs are targets and should be refined after real traffic.

| Service Area | Initial SLO |
|---|---|
| App shell availability | `99.5%` monthly |
| Authenticated app core availability | `99.5%` monthly |
| Callable function success rate | `99.0%` excluding user/input errors |
| `submitSwipe` p95 latency | `< 800ms` |
| `purchaseShopItem` p95 latency | `< 1000ms` |
| `sendChatMediaMessage` p95 latency | `< 2000ms` excluding upload time |
| `createCheckoutSession` p95 latency | `< 1500ms` excluding provider outage |
| `paymentWebhook` processing p95 | `< 1000ms` |
| AI request p95 | `< 10000ms` |
| Firestore Security Rules test pass rate | `100%` in CI |

### 9.2 Error Budget

Error budget policy is open.  
For MVP, any `SEV1` incident should trigger:

- incident review.
- test gap review.
- alert threshold review.
- runbook update.
- decision on whether to pause affected feature.

### 9.3 Health Checks

Recommended health checks:

| Health Check | Purpose |
|---|---|
| frontend app loads | verifies deployed web app |
| Firebase config points to expected project | prevents environment mixup |
| callable smoke `healthCheck` if implemented | verifies Functions availability |
| Firestore read `system/config` | verifies config availability |
| Secret Manager access smoke in staging | verifies secret binding before prod |
| payment webhook invalid signature test | verifies webhook rejects invalid requests |
| AI disabled/enabled smoke | verifies flag behavior without exposing key |

### 9.4 Post-Deploy Smoke

After staging/prod deploy:

1. verify app loads.
2. verify project ID matches target environment.
3. verify `/login` renders.
4. verify `system/config` can be read.
5. verify protected route redirects correctly.
6. verify no frontend bundle contains forbidden secret strings.
7. verify one safe callable smoke if available.
8. verify error dashboard does not spike.
9. verify feature flags are expected.
10. verify no emulator endpoints are enabled in prod.

Forbidden bundle strings:

```text
GEMINI_API_KEY
PAYMENT_WEBHOOK_SECRET
PAYMENT_API_SECRET
PAYMENT_API_KEY
process.env.API_KEY
gemini-3-flash-preview
```

---

## 10. Cost Monitoring

### 10.1 Cost Areas

| Area | Cost Risk |
|---|---|
| Gemini | AI request spikes, abuse, prompt size, retries |
| Firestore | excessive reads, hot queries, chat subscriptions |
| Cloud Functions | high invocations, cold starts, retries, long execution |
| Storage | image uploads, abuse, retained media |
| Logging | excessive debug logs in prod |
| Error Tracking | high event volume / unbounded frontend errors |
| Analytics | provider volume/cost depending final provider |

### 10.2 Gemini Cost Controls

Monitor:

- AI request count by function.
- estimated tokens.
- failed/retried provider calls.
- timeout rate.
- request volume by user/tier.
- sudden spikes.

Controls:

- `system/config.aiHubEnabled`.
- per-tier AI request limits.
- timeout.
- max output tokens.
- rate limits.
- provider key rotation.
- disable AI in incident.

### 10.3 Firestore Cost Controls

Monitor:

- reads/writes per collection.
- expensive queries.
- listener count.
- chat message subscription behavior.
- discovery deck read volume.
- index usage/quota.

Controls:

- pagination.
- query limits.
- read models.
- denormalized public profiles.
- avoid high-frequency polling.
- use backend deck generation where needed.

### 10.4 Cloud Functions Cost Controls

Monitor:

- invocations by function.
- duration.
- retries.
- memory.
- cold starts.
- timeout.

Controls:

- function-specific memory/timeouts.
- min instances only where justified.
- rate limits.
- idempotency.
- avoid unnecessary trigger fan-out.

### 10.5 Storage Cost Controls

Monitor:

- upload count.
- upload size.
- rejected uploads.
- media retention.
- download volume.

Controls:

- file size limits.
- MIME validation.
- Storage Rules.
- media feature gating.
- cleanup jobs for temp uploads.

### 10.6 Billing Alerts

Set budget alerts for:

| Budget | Alert Thresholds |
|---|---|
| overall GCP/Firebase | `50%`, `80%`, `100%` |
| Gemini/API spend | `50%`, `80%`, `100%` |
| Logging/Error tracking | `80%`, `100%` if provider supports |
| Storage | `80%`, `100%` |

---

## 11. Privacy in Logs

### 11.1 Forbidden Data

Never log:

```text
email
phone
displayName
bio
raw chat text
report description
profile image URL
storage download token
raw payment payload
card/payment data
webhook secret
payment API secret
Gemini API key
Gemini prompt
Gemini response
system prompt
service account JSON
private account data
```

### 11.2 Redaction Requirements

All logging wrappers should:

- redact known forbidden keys.
- avoid spreading raw request bodies.
- avoid logging full Firestore documents.
- log normalized IDs and enum values.
- hash or omit external provider IDs if not needed.
- limit error detail sent to client.

### 11.3 Safe Provider Logging

Payment:

```ts
logger.info("payment webhook processed", {
  provider: "cardcom",
  provider_event_id: normalizedEventId,
  status: "processed",
  uid,
  request_id: requestId
});
```

AI:

```ts
logger.warning("AI provider timeout", {
  function_name: "sendAIProfileReview",
  request_id: requestId,
  uid,
  ai_request_id: aiRequestId,
  provider: "gemini",
  error_code: "provider_timeout"
});
```

Do not log raw prompt/response.

### 11.4 Data Minimization

Before adding a log field, ask:

1. האם זה עוזר לאבחן incident?
2. האם זה ניתן לזיהוי אישי?
3. האם אפשר להשתמש ב-ID/enum במקום raw content?
4. האם זה secret/provider payload?
5. האם צריך retention קצר יותר?

If not necessary, do not log it.

---

## 12. Tooling

### 12.1 Baseline Tooling

| Tool | Purpose |
|---|---|
| Cloud Logging | structured backend logs |
| Cloud Error Reporting | backend exception grouping |
| Cloud Monitoring | metrics, dashboards, alerts |
| Firebase Console | Firebase service health and usage |
| Sentry | frontend exception tracking |
| Secret Manager audit logs | secret access visibility |
| Firebase Emulator Suite | local observability/test validation |
| Analytics provider TBD | product analytics only, not system health |

### 12.2 Log-Based Metrics

Create log-based metrics for:

- `paymentWebhook` failures.
- invalid webhook signatures.
- `submitSwipe` errors.
- match transaction failures.
- `purchaseShopItem` failures.
- negative coin balance detection.
- AI provider errors/timeouts.
- Storage upload denials.
- rule denial spikes.
- unexpected server-owned write attempts.
- report creation failures.

### 12.3 Metric Labels

Recommended labels:

```text
app_env
firebase_project_id
function_name
error_code
provider
operation
feature
```

Avoid high-cardinality labels:

```text
uid
email
raw path with random IDs
chat message ID
full provider payload
```

Use high-cardinality values in logs, not metric labels, unless carefully justified.

### 12.4 Sentry Configuration

Recommended Sentry fields:

- `app_env`.
- `app_version`.
- `route`.
- `locale`.
- `direction`.
- pseudonymous user ID only.
- release version.

Disable or scrub:

- request bodies.
- form data.
- user text.
- breadcrumbs containing sensitive text.

---

## 13. Incident Response

### 13.1 Baseline Flow

```text
Detect
  → Triage
  → Mitigate
  → Communicate
  → Recover
  → Review
  → Prevent recurrence
```

### 13.2 Detection

Sources:

- alerts.
- dashboards.
- Sentry spikes.
- Cloud Error Reporting.
- user reports.
- billing alerts.
- manual QA/staging checks.

### 13.3 Triage

For every incident, determine:

| Question | Examples |
|---|---|
| Impact | login down, swipes failing, Pro not activating |
| Environment | dev/staging/prod |
| Start time | first failing log/metric |
| Recent changes | deploy, config change, secret rotation |
| Blast radius | all users, Pro users, Basic users, one feature |
| Data integrity risk | coins, matches, subscriptions, reports |
| Security risk | rule bypass, secret exposure, abuse |

### 13.4 Mitigation

Use fastest safe mitigation:

| Incident | Mitigation |
|---|---|
| AI cost/error spike | `system/config.aiHubEnabled = false` |
| payment checkout issue | `system/config.proSubscriptionEnabled = false` |
| shop/economy issue | `system/config.shopEnabled = false` |
| media abuse | disable media messages / tighten Storage Rules |
| bad deploy | rollback hosting/functions/rules |
| secret compromise | rotate secret in Secret Manager and redeploy/rebind |
| Firestore quota | reduce feature traffic, deploy query fix |
| rules regression | rollback Security Rules immediately |

### 13.5 Kill Switches

`system/config` should support operational kill switches:

```text
aiHubEnabled
proSubscriptionEnabled
shopEnabled
mediaUploadEnabled
reportsEnabled
```

Kill switches are emergency controls, not substitutes for correct authorization.

### 13.6 Secret Rotation

When rotating secrets:

1. create new secret version in Secret Manager.
2. deploy functions bound to new version if required.
3. verify staging.
4. deploy production.
5. disable old provider key/signing secret after overlap.
6. monitor errors.
7. document incident/change.

Secrets:

```text
GEMINI_API_KEY
PAYMENT_WEBHOOK_SECRET
PAYMENT_API_SECRET
PAYMENT_API_KEY
```

### 13.7 Communication

Minimum incident communication:

- what is impacted.
- when it started.
- current mitigation.
- expected next update.
- whether user data/payment integrity is affected.
- final resolution.

### 13.8 Post-Incident Review

Every `SEV1` and major `SEV2` requires review:

| Topic | Required |
|---|---|
| root cause | yes |
| impact | yes |
| detection gap | yes |
| mitigation timeline | yes |
| tests to add | yes |
| alerts to adjust | yes |
| docs/runbooks to update | yes |
| owner/date for follow-ups | yes |

---

## 14. Open Items

| Item | Status | Impact |
|---|---|---|
| Final monitoring owner/on-call model | Open | Determines alert routing and response time. |
| Final SLO targets | Open | Initial SLOs are proposed; need business approval. |
| Sentry adoption | Open but recommended | Needed for frontend exception grouping. |
| Log retention policy | Open | Needed for privacy/cost/legal alignment. |
| Audit retention policy | Open | Needed for billing/safety/legal alignment. |
| Alert thresholds | Open | Need tuning after traffic baseline. |
| Cloud Trace usage | Open | May improve latency diagnostics. |
| AI cost budget | Open | Needed for Gemini cost alerts. |
| Billing dashboard provider integration | Open | Depends on final payment provider. |
| Moderation dashboard | Open | Needed when `moderationActions` is implemented. |
| Incident runbook repository path | Open | Could live under `docs/ops/`. |
| Production smoke automation | Open | Manual now; automate before launch. |
| Security anomaly detection | Open | Future abuse detection layer. |
| Status page/user communication process | Open | Needed for public launch. |
