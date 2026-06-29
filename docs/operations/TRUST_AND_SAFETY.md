# Swish & Game — Trust & Safety Policy

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Production Trust & Safety Policy |
| Repository Path | `docs/operations/TRUST_AND_SAFETY.md` |
| Product | Swish & Game |
| Source of Truth | `docs/product/PRD.md`, `docs/product/DECISIONS.md`, `docs/architecture/API_CONTRACT.md`, `docs/architecture/DATA_MODEL.md`, `docs/architecture/SECURITY.md`, `docs/architecture/AI_INTEGRATION.md`, `docs/design/UX_FLOWS.md` |
| Scope | בטיחות משתמשים, מודרציה, דיווחים, חסימות, אכיפה, escalation |
| MVP Safety Features | `createReport`, `blockUser`, `reports`, `users/{uid}/blocks` |
| Principle | Safety is core; backend-authoritative; privacy-first; auditable sensitive actions |
| Minimum Age | `16+` pending legal review |
| Image Moderation | report-based / manual in MVP; automated moderation in V1 |
| Trust Signal Rule | `verifiedBadge` means Pro member only, not identity verification |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Trust & Safety Strategy](#2-trust--safety-strategy)
- [3. Community Guidelines / Content Policy](#3-community-guidelines--content-policy)
- [4. Reporting](#4-reporting)
- [5. Blocking](#5-blocking)
- [6. Content Moderation](#6-content-moderation)
- [7. Abuse Prevention](#7-abuse-prevention)
- [8. Minors & Age Safety](#8-minors--age-safety)
- [9. Enforcement Actions](#9-enforcement-actions)
- [10. AI Safety](#10-ai-safety)
- [11. Admin & Moderation Tooling](#11-admin--moderation-tooling)
- [12. Severe Content Escalation](#12-severe-content-escalation)
- [13. Trust Signals](#13-trust-signals)
- [14. Privacy & Safety Data](#14-privacy--safety-data)
- [15. Safety Metrics](#15-safety-metrics)
- [16. Legal & Compliance Touchpoints](#16-legal--compliance-touchpoints)
- [17. Open Items](#17-open-items)

---

## 2. Trust & Safety Strategy

### 2.1 Core Position

Swish & Game מחברת זרים דרך discovery, matching ו-chat. לכן בטיחות אינה feature מאוחר — היא דרישת ליבה של המוצר.

כל יכולת שמאפשרת אינטראקציה בין משתמשים חייבת לכלול:

- אפשרות לדווח (`createReport`).
- אפשרות לחסום (`blockUser`).
- הגנה על פרטיות המשתמש.
- אכיפה ב-backend, לא רק ב-UI.
- audit trail לפעולות רגישות.
- טיפול ב-abuse ו-edge cases.

### 2.2 Safety Model

המודל הוא layered:

| Layer | Goal | Examples |
|---|---|---|
| Prevention | למנוע abuse מראש | required profile fields, rate limits, Pro badge clarity, server-side validation |
| Detection | לזהות abuse | reports, block signals, rule denial spikes, suspicious activity |
| Response | לטפל ב-abuse | warning, restriction, suspension, ban, escalation |
| Review | audit and improve | `reports`, `moderationActions`, safety metrics |
| Legal | טיפול בתוכן חמור | illegal content escalation, legal review, data retention |

### 2.3 Safe-by-Default Rules

- משתמשים רגילים לא רואים `reports`.
- משתמשים רגילים לא רואים `moderationActions`.
- block list פרטית.
- report descriptions לא נשלחים ל-analytics/logs.
- moderation state נאכף בשרת.
- suspended/deleted users לא יכולים להשתמש בפעולות core.
- `verifiedBadge` לא מוצג כאימות זהות.

### 2.4 Backend-Authoritative Safety

Safety decisions must be enforced server-side.

| Behavior | Must Be Enforced By |
|---|---|
| Report creation | `createReport` + Security Rules |
| Block user | `blockUser` + backend side effects |
| Chat blocked after block | Cloud Function / rules / chat status |
| Discovery exclusion after block | backend deck filtering |
| Suspended user restrictions | Cloud Functions + route guards |
| Pro-only media | `sendChatMediaMessage` + Storage Rules |
| Moderation state | `users/{uid}/private/account.moderationState` + functions |

UI can guide, but cannot be trusted as enforcement.

---

## 3. Community Guidelines / Content Policy

### 3.1 User Conduct Standard

Swish & Game is for finding people to play with, building teams, chatting respectfully, and using gaming-related profile discovery.

Users must not use the platform to harass, threaten, manipulate, impersonate, scam, sexually exploit, or harm others.

### 3.2 Prohibited Content and Behavior

| Category | Prohibited |
|---|---|
| `harassment` | insults, threats, targeted abuse, repeated unwanted contact, intimidation, bullying |
| `hate_speech` | attacks or dehumanizing content based on protected characteristics |
| `sexual_content` | sexual harassment, unsolicited sexual messages/images, explicit sexual content, sexual exploitation |
| Minors safety | any sexual content involving minors, grooming, age manipulation, underage solicitation |
| `scam_spam` | phishing, fraudulent offers, account stealing, spam links, fake giveaways |
| `cheating_exploits` | selling cheats, promoting exploits, account boosting scams, malware tools |
| `fake_profile` | impersonation, misleading identity, fake age, fake photos, deceptive profile claims |
| Doxxing | sharing private info like phone, address, email, real name without consent |
| Ban evasion | creating new accounts to bypass suspension/restriction |
| Toxic behavior | repeated abusive gameplay/chat behavior, slurs, rage targeting, coercive behavior |
| Illegal content | content or behavior that may violate law, including threats, exploitation, or illegal trade |

### 3.3 UGC Scope

User-generated content includes:

- profile images.
- profile banners.
- bio.
- game/rank/platform profile details.
- chat text.
- chat media.
- report descriptions.
- display names.
- any future custom cosmetic labels or status text.

### 3.4 Enforcement Principle

Severity and pattern matter.

| Case | Typical Response |
|---|---|
| minor first offense | warning / education |
| repeated toxicity | restriction / suspension |
| harassment/threats | restriction/suspension/ban depending severity |
| scams/phishing | suspension/ban |
| fake profile | warning/restriction/suspension |
| sexual content involving minors | immediate severe escalation |
| illegal content | immediate escalation to legal/law enforcement path |

---

## 4. Reporting

### 4.1 Report Function

Reports are created through:

```text
createReport
```

The client must not directly write unsafe report data unless explicitly allowed by rules. The canonical flow should be function-based so validation, deduplication, permission, and audit can be enforced.

### 4.2 Report Sources

Reports can originate from:

| Source | Example |
|---|---|
| `profile` | report from public profile / discovery card |
| `chat` | report from chat screen |
| `message` | report a specific chat message |
| `matches` | report from match list |
| `discovery` | report from swipe/profile discovery |

MVP minimum sources:

```text
profile
chat
message
```

### 4.3 Report Reasons

Canonical `ReportReason` enum values:

```text
harassment
hate_speech
sexual_content
scam_spam
underage_concern
cheating_exploits
fake_profile
other
```

### 4.4 `createReport` Flow

```text
User opens ReportModal
  → selects ReportReason
  → optionally adds short description
  → submits
  → createReport validates auth/input/permission
  → reports/{reportId} created with status = open
  → user sees success state
  → moderation queue receives item
```

### 4.5 Report Data Model

`reports/{reportId}` should store minimized but actionable data.

| Field | Purpose | Notes |
|---|---|---|
| `reportId` | stable ID | generated server-side or deterministic if dedupe policy |
| `reporterUid` | reporting user | private |
| `reportedUid` | reported user | private |
| `reason` | one of `ReportReason` | required |
| `source` | `profile`, `chat`, `message`, `matches`, `discovery` | required |
| `sourceRef` | safe resource reference | e.g. `chatId`, `messageId`; no raw content |
| `description` | optional user-provided detail | sensitive; never analytics/logs |
| `status` | `open`, `reviewing`, `resolved`, `dismissed` | MVP status flow |
| `createdAt` | server timestamp | required |
| `updatedAt` | server timestamp | required |
| `reviewedBy?` | moderator/admin uid | future/admin only |
| `resolution?` | normalized resolution | no unnecessary free text |

### 4.6 Report Privacy

- Reporter identity is not shown to reported user.
- Reports are not readable by regular users.
- Report descriptions are sensitive.
- Do not track report description in analytics.
- Do not log report description in Cloud Logging/Sentry.
- Use normalized reason/source/status for metrics.

### 4.7 Duplicate Reports

MVP policy:

- Duplicate reports may be allowed but should be detectable.
- Future policy should dedupe by `reporterUid + reportedUid + source + sourceRef + reason` if abuse/noise grows.
- Repeated reports against same `reportedUid` should elevate moderation priority.

### 4.8 Report Confirmation UX

After report submit:

- show clear Hebrew success copy.
- optionally offer `blockUser`.
- do not promise immediate action.
- do not disclose moderation thresholds.
- do not reveal whether target is penalized.

---

## 5. Blocking

### 5.1 Block Function

Blocking is performed through:

```text
blockUser
```

Blocking is a core MVP safety function.

### 5.2 One-Directional Block

Blocking is one-directional:

```text
A blocks B
```

means A does not want interaction with B. The system should also prevent B from continuing interaction with A where relevant for safety.

### 5.3 `blockUser` Flow

```text
User opens safety menu
  → selects block
  → confirms BlockConfirmModal
  → blockUser validates auth/input/self-action
  → writes users/{uid}/blocks/{blockedUid}
  → updates affected match/chat state
  → excludes blocked user from discovery
  → user sees success state
```

### 5.4 Block Data Model

`users/{uid}/blocks/{blockedUid}`:

| Field | Purpose |
|---|---|
| `blockedUid` | user being blocked |
| `createdAt` | server timestamp |
| `source` | `profile`, `chat`, `message`, `matches`, `discovery` |
| `relatedChatId?` | safe reference if relevant |
| `relatedMatchId?` | safe reference if relevant |
| `reason?` | optional normalized reason if captured |

### 5.5 Effects of Blocking

| Area | Expected Effect |
|---|---|
| Discovery | blocked users are excluded from each other's discovery deck where safety requires |
| Match | active match may become `blocked` / inactive |
| Chat | chat composer disabled; new messages denied |
| Messages | existing messages may remain visible depending policy, but new contact is blocked |
| Notifications | future notifications between users suppressed |
| Reports | reporting and blocking can happen together |
| Search/future discovery | block exclusion must apply server-side |

### 5.6 Self-Block

`blockUser` must reject:

```text
targetUid == auth.uid
```

Expected error:

```text
self_action_forbidden
```

### 5.7 Unblock

Unblock is open item unless implemented.  
If implemented, it must be backend-authoritative and auditable.

---

## 6. Content Moderation

### 6.1 MVP Moderation Position

MVP image moderation is report-based/manual.

This means:

- uploaded images are controlled by Storage Rules and size/MIME limits.
- users can report profile images/chat media.
- moderation reviews reports.
- no automated image moderation is required in MVP.
- automated moderation is planned for V1.

### 6.2 UGC Moderation Areas

| UGC Area | MVP Control | V1/Future |
|---|---|---|
| Profile images | report-based/manual; Storage validation | automated image moderation |
| Profile banners | report-based/manual; Storage validation | automated image moderation |
| Bio | report-based/manual; length/schema validation | text moderation classifier |
| Chat text | report/block; possible rate limits | automated toxicity detection |
| Chat media | Pro-only; report-based/manual | automated image moderation |
| Display name | schema/length/report | automated checks |
| AI output | server-side guardrails/refusal | continuous safety tuning |

### 6.3 Text Moderation

MVP text moderation relies on:

- user reports.
- block.
- rate limits where implemented.
- manual review of reported content.
- backend enforcement against suspended users.

Future text moderation may include:

- toxicity classifier.
- spam detection.
- link/phishing detection.
- repeated harassment signals.

### 6.4 Image Moderation

MVP:

- validate MIME and file size.
- restrict paths through Storage Rules.
- allow report from profile/chat/message context.
- manual review removes content or restricts user when necessary.

V1:

- automated image moderation pipeline.
- quarantine suspicious uploads.
- safety review queue.
- enforcement/audit integration.

### 6.5 Moderation State

Moderation state should live under:

```text
users/{uid}/private/account.moderationState
```

Canonical values:

```text
clean
warned
restricted
suspended
banned
```

The exact schema may include more fields such as:

```text
moderationReason
moderationUpdatedAt
moderationExpiresAt
moderationActor
```

---

## 7. Abuse Prevention

### 7.1 Fake Profiles

Prevention:

- required onboarding fields.
- at least one game required.
- validated enum values.
- optional profile image constraints.
- `verifiedBadge` clarity: Pro only, not identity.
- report reason `fake_profile`.

Detection signals:

- repeated reports with `fake_profile`.
- inconsistent profile behavior.
- high block rate.

### 7.2 Spam and Scam

Prevention:

- message length limits.
- rate limits for chat/AI/report if needed.
- link/phishing detection in future.
- Basic/Pro gating where relevant.
- report reason `scam_spam`.

Response:

- warning for low severity.
- restriction/suspension for repeated spam.
- ban for phishing/fraud.

### 7.3 Harassment

Prevention:

- block from chat/profile.
- report from profile/chat/message.
- chat disable after block.
- server-side blocked state.

Response:

- warning/restriction/suspension depending severity.
- ban for severe threats or repeated harassment.

### 7.4 Ban Evasion

Signals:

- repeated accounts linked by device/IP/provider metadata where legally allowed.
- repeated reports/blocks after suspension.
- similar profile patterns.

MVP:

- use `isSuspended`, `isDeleted`, `moderationState`.
- Cloud Functions deny suspended/deleted users.
- manual review.

Future:

- anti-evasion scoring.
- stronger device/account trust signals.
- appeal process.

### 7.5 Rate Limits

Rate limits should be considered for:

| Action | Risk |
|---|---|
| `submitSwipe` | automation/spam |
| `sendChatMediaMessage` | storage abuse |
| chat text messages | harassment/spam |
| `createReport` | false report spam |
| `blockUser` | lower risk but monitor |
| AI functions | cost abuse |
| signup | fake account creation |

Rate limit errors should use safe `ApiErrorCode`, usually:

```text
resource_exhausted
```

---

## 8. Minors & Age Safety

### 8.1 Minimum Age

Canonical current policy:

```text
16+
```

This is pending legal review and must be finalized before launch.

### 8.2 Age Safety Requirements

- onboarding/ToS must clearly state minimum age.
- reports include `underage_concern`.
- users suspected to be under minimum age require escalation.
- sexual content involving minors is severe and must trigger immediate escalation.
- do not expose underage reports to regular users.
- do not collect unnecessary age-sensitive data unless legal/product requires.

### 8.3 `underage_concern`

`underage_concern` should be used when:

- a profile appears under minimum age.
- a user claims to be under minimum age.
- another user reports possible underage activity.
- there are signals of grooming or exploitation.

### 8.4 Escalation for Minors

Potential underage safety cases should be prioritized over normal reports.

| Case | Action |
|---|---|
| user appears under minimum age | review and restrict if needed |
| user claims under 16 | suspend/restrict pending review |
| sexual content involving minor | immediate severe escalation |
| grooming/exploitation suspicion | immediate severe escalation |
| false/unclear report | review carefully; avoid unnecessary disclosure |

### 8.5 Legal Review Required

Before launch, legal must review:

- minimum age policy.
- ToS language.
- privacy policy.
- UGC policy.
- report handling.
- data retention.
- law enforcement escalation process.

---

## 9. Enforcement Actions

### 9.1 Enforcement Ladder

| Level | Action | Typical Use |
|---|---|---|
| 0 | no action / dismissed | false report or no violation |
| 1 | warning | first minor violation |
| 2 | restriction | repeated/medium severity issue |
| 3 | suspension | serious or repeated abuse |
| 4 | ban | severe abuse, scam, illegal content, ban evasion |

### 9.2 `moderationState`

Canonical values:

```text
clean
warned
restricted
suspended
banned
```

### 9.3 Effects by State

| `moderationState` | Effect |
|---|---|
| `clean` | normal access |
| `warned` | normal or limited access with warning shown |
| `restricted` | limited features; e.g. no chat/media/discovery depending policy |
| `suspended` | blocked from core actions; may access appeal/account only |
| `banned` | account disabled from product use |

### 9.4 `isSuspended` and `isDeleted`

Existing fields:

```text
isSuspended
isDeleted
```

Expected behavior:

| Field | Expected Behavior |
|---|---|
| `isSuspended = true` | Cloud Functions deny user-facing actions; UI shows restricted account state |
| `isDeleted = true` | user is treated as inactive/deleted; profile should not appear in discovery |
| `moderationState = suspended/banned` | should derive or align with `isSuspended` policy |

### 9.5 Moderation Audit

`moderationActions/{actionId}` is planned for Scale/V1.

Recommended fields:

| Field | Purpose |
|---|---|
| `actionId` | unique audit ID |
| `actorUid` | moderator/admin/service |
| `targetUid` | affected user |
| `reportId?` | related report |
| `actionType` | `warning`, `restriction`, `suspension`, `ban`, `dismissal` |
| `reasonCode` | normalized reason |
| `notes?` | sensitive; access restricted |
| `createdAt` | server timestamp |
| `expiresAt?` | for temporary restrictions |
| `requestId` | log correlation |

### 9.6 Enforcement Requirements

- enforcement must be backend-authoritative.
- regular users cannot edit `moderationState`.
- moderation actions must be auditable.
- client must not decide final enforcement.
- suspended users must be denied by functions, not just hidden by UI.

### 9.7 Appeals

Appeals process is open item.

Minimum future requirements:

- user can request review.
- appeal does not expose reporter identity.
- appeal does not reveal internal detection thresholds.
- outcome is audited.

---

## 10. AI Safety

### 10.1 AI Integration Safety

AI features must follow `AI_INTEGRATION.md`.

AI requests go through Cloud Functions only:

```text
sendAIProfileReview
sendAISquadAdvice
```

No Gemini SDK/API key in frontend.

### 10.2 AI Must Not Produce Unsafe Content

AI should refuse or safely redirect content involving:

- harassment.
- hate.
- sexual content involving minors.
- grooming/exploitation.
- scams/phishing.
- cheating/exploit enablement.
- doxxing.
- instructions to evade moderation.
- unsafe self-harm/violence content if encountered.

### 10.3 AI Privacy

Do not log or track:

```text
Gemini prompt
Gemini response
system prompt
raw user bio
raw chat content
API key
```

Store only minimized audit metadata in:

```text
aiRequests/{requestId}
```

### 10.4 AI Refusal UX

When AI refuses:

- show safe Hebrew explanation.
- do not expose raw model safety policy.
- do not expose provider error.
- allow user to revise if appropriate.
- audit status as `blocked` or safe refusal category.

### 10.5 AI Abuse Prevention

- rate limit AI requests.
- monitor cost spikes.
- disable with `system/config.aiHubEnabled` if needed.
- log safe normalized errors only.
- keep request audit for operational review.

---

## 11. Admin & Moderation Tooling

### 11.1 MVP Tooling

MVP may start with minimal internal review tooling.

Minimum required capability:

- view `reports` queue.
- filter by `status`, `reason`, `source`, `createdAt`.
- view safe context needed for review.
- mark report `reviewing`, `resolved`, `dismissed`.
- apply manual account action if supported.
- avoid exposing report data to normal users.

### 11.2 Future Moderation Panel

Future moderation panel should support:

| Capability | Purpose |
|---|---|
| report queue | review open reports |
| user safety timeline | see reports/blocks/moderation actions |
| content review | review reported profile/chat/media safely |
| action controls | warn/restrict/suspend/ban |
| audit | create `moderationActions` |
| appeal handling | manage appeals |
| severe escalation | legal/law enforcement workflow |
| metrics | backlog, report rate, action rate |

### 11.3 Admin Access Control

Admin tools require:

- admin role.
- least privilege.
- audit logs.
- no public access.
- strong authentication.
- environment separation.
- production access approval.

### 11.4 Admin Safety

Moderators may see sensitive content. Tooling should:

- minimize exposure.
- avoid auto-loading severe media.
- support blur/click-to-view for reported images.
- prevent copying/exporting sensitive data where possible.
- log admin access.

---

## 12. Severe Content Escalation

### 12.1 Severe Content Categories

Severe content includes:

- CSAM or suspected CSAM.
- sexual exploitation of minors.
- grooming or solicitation of minors.
- credible threats of violence.
- terrorism/extremism recruitment or support.
- doxxing with credible harm risk.
- illegal trade or fraud at serious scale.
- self-harm emergency signals if encountered.

### 12.2 Immediate Escalation

For severe content:

1. restrict access to the content internally.
2. do not share it in normal channels.
3. notify designated safety/legal owner immediately.
4. preserve only legally required metadata.
5. follow law enforcement/reporting obligations.
6. suspend/restrict user if needed to prevent harm.
7. document action in audit trail.

### 12.3 CSAM / Minor Sexual Content

Any sexual content involving minors or suspected minors requires immediate escalation to legal/safety owner.

Policy:

- do not store additional copies.
- do not download/share internally.
- do not include details in regular logs.
- preserve only what legal process requires.
- follow mandatory reporting obligations.
- restrict involved account(s) as appropriate.
- consult legal before deletion if evidence preservation is required.

### 12.4 Internal Communication

Severe incidents must not be discussed with raw content in general chat/tools.

Use:

- incident ID.
- report ID.
- severity.
- restricted access notes.
- legal/safety owner.

Do not paste raw content.

---

## 13. Trust Signals

### 13.1 `verifiedBadge`

Canonical meaning:

```text
verifiedBadge = Pro member
```

It does **not** mean:

- identity verified.
- age verified.
- safe user.
- background checked.
- trusted by Swish & Game.
- official gamer/esports status.

### 13.2 UI Copy Requirement

UI must avoid misleading text.

Allowed:

```text
חבר Pro
Pro member
```

Not allowed:

```text
מאומת זהות
Verified identity
Trusted user
Safe user
```

### 13.3 Future Verification

Future identity/age verification is open item.  
If implemented, it must use a separate field and UI label from `verifiedBadge`.

Recommended future concepts:

```text
identityVerified
ageVerified
```

These must not be inferred from Pro payment.

---

## 14. Privacy & Safety Data

### 14.1 Access Rules

| Data | Regular User Access |
|---|---|
| `reports` | no read |
| `moderationActions` | no read |
| `users/{uid}/blocks` | owner-only |
| `users/{uid}/private/account.moderationState` | owner/admin depending policy; not public |
| public profile safety badges | only approved public fields |
| report descriptions | moderator/admin only |

### 14.2 Privacy Rules

- block list is private.
- reporter identity is private.
- report details are sensitive.
- moderation notes are sensitive.
- safety data should not be included in analytics payloads.
- logs must not contain raw report descriptions, raw chat, raw AI prompts, or payment data.

### 14.3 Data Minimization

Store what is needed to act safely:

| Need | Store |
|---|---|
| identify reporter/target | `reporterUid`, `reportedUid` |
| classify report | `reason`, `source` |
| locate context | `sourceRef` |
| review status | `status`, timestamps |
| audit action | `moderationActions` when implemented |

Avoid storing unnecessary raw content unless explicitly required for review/legal process.

### 14.4 Deletion and Retention

Retention policy is open and requires legal review.

Guidance:

- reports retained long enough for safety operations.
- moderation actions retained for accountability.
- severe content handled under legal process.
- deleted users should be removed from discovery.
- safety audits may require longer retention than normal analytics.

---

## 15. Safety Metrics

Safety metrics are used for operational safety health, not public scoring.

### 15.1 Analytics Metrics

Cross-reference `ANALYTICS.md`.

| Metric | Source |
|---|---|
| report rate | `user_reported` |
| block rate | `user_blocked` |
| reports by reason | `user_reported.reason` |
| report source distribution | `user_reported.source` |
| block/report overlap | analytics + reports |
| media block rate | `media_upload_blocked_basic` |

### 15.2 Observability Metrics

Cross-reference `OBSERVABILITY.md`.

| Metric | Source |
|---|---|
| report creation failures | `createReport` logs |
| block failures | `blockUser` logs |
| moderation queue backlog | `reports.status = open` |
| severe report count | `reason = underage_concern` or escalated flags |
| repeated reports against same user | `reports` aggregation |
| rule denials on safety collections | Security Rules logs |

### 15.3 Safety Dashboard

Recommended dashboard widgets:

- open reports count.
- reports by reason.
- reports by source.
- reports older than SLA.
- block count.
- block rate by source.
- repeated reported users.
- underage concern queue.
- moderation action count.
- report creation error rate.

---

## 16. Legal & Compliance Touchpoints

### 16.1 Required Legal Documents

Before launch, product/legal must review:

- Terms of Service.
- Privacy Policy.
- Community Guidelines.
- UGC policy.
- age policy.
- moderation/enforcement policy.
- data retention policy.
- deletion/export process.
- law enforcement request process.

### 16.2 Legal Review Required Before Launch

Legal review is required for:

| Topic | Why |
|---|---|
| minimum age `16+` | age-related legal requirements vary by jurisdiction |
| minors safety | escalation, reporting, data handling |
| UGC moderation | platform obligations and user rights |
| data retention | privacy/legal/accountability |
| reports/moderation access | sensitive user data |
| payment/Pro trust signals | avoid misleading claims |
| identity verification if added | separate compliance domain |

### 16.3 Data Deletion

User deletion must consider:

- removing from discovery.
- preserving legally required safety records where allowed/required.
- anonymizing where possible.
- not breaking audit integrity.
- honoring privacy rights.

### 16.4 Terms Enforcement

Enforcement actions should map to ToS/community guideline violations.  
Do not rely only on internal policy text; user-facing policy must align with enforcement.

---

## 17. Open Items

| Item | Status | Impact |
|---|---|---|
| Final legal approval for minimum age `16+` | Open | Launch blocker. |
| Appeals process | Open | Needed for fair enforcement at scale. |
| Moderation panel | Open | MVP can use minimal internal tooling; V1 needs panel. |
| Automated image moderation | V1 | ADR-024 says manual/report-based in MVP. |
| Automated text moderation | Future | Needed as chat volume grows. |
| Moderation action schema finalization | Open | `moderationActions` planned for Scale/V1. |
| Safety on-call owner | Open | Needed for severe content escalation. |
| Report deduplication policy | Open | Needed if reports volume/noise grows. |
| Rate limits for chat/report/block/AI | Open | Exact thresholds TBD. |
| Underage escalation runbook | Open | Legal/safety must define exact process. |
| Law enforcement request process | Open | Needed before public launch. |
| Data retention schedule | Open | Legal/privacy decision required. |
| User notification policy after enforcement | Open | Define warning/suspension/ban copy. |
| Identity/age verification future scope | Open | Must be separate from `verifiedBadge`. |
