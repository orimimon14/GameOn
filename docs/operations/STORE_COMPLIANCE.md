# Swish & Game — App Store & Google Play Compliance

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Forward-Looking Store Compliance Contract |
| Repository Path | `docs/operations/STORE_COMPLIANCE.md` |
| Product | Swish & Game |
| Current Distribution | `MVP-web-now` — web בלבד |
| Future Distribution | `future-store` — iOS + Android באמצעות `Capacitor` |
| Source of Truth | `docs/product/DECISIONS.md`, `docs/architecture/PAYMENTS.md`, `docs/operations/legal/PRIVACY_AND_TERMS.md`, `docs/operations/TRUST_AND_SAFETY.md`, `docs/architecture/SECURITY.md`, `docs/product/ROADMAP.md`, `docs/quality/DEFINITION_OF_DONE.md` |
| Canonical Decisions | `ADR-035`, `ADR-036`, `ADR-037`, `ADR-038` |
| Packaging Decision | `Capacitor` wrapper over the same `React + Vite` codebase |
| Billing Decision | `RevenueCat` abstraction for store builds |
| Store Billing Rule | Store IAP required for in-app digital goods in iOS/Android store builds |
| Entitlement Rule | entitlement is granted only after verified server-side webhook → `paymentWebhook` |
| Account Deletion Rule | in-app account deletion via `deleteAccount` required before store launch |
| Security Principle | backend-authoritative; no secrets in client; Gemini server-side only |
| Launch Timing | No concrete store launch date; this document keeps architecture store-ready from now |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Distribution Strategy](#2-distribution-strategy)
- [3. Billing & IAP Compliance](#3-billing--iap-compliance)
- [4. Apple App Store Requirements](#4-apple-app-store-requirements)
- [5. Google Play Requirements](#5-google-play-requirements)
- [6. Cross-Cutting Compliance](#6-cross-cutting-compliance)
- [7. Native Capabilities Mapping](#7-native-capabilities-mapping)
- [8. Pre-Store-Launch Readiness Checklist](#8-pre-store-launch-readiness-checklist)
- [9. Open Items](#9-open-items)
- [10. Official External References to Re-Check](#10-official-external-references-to-re-check)

---

## 2. Distribution Strategy

### 2.1 Current vs Future

| Mode | Status | Channel | Billing | Notes |
|---|---|---|---|---|
| `MVP-web-now` | Current | Web / browser | Web checkout via provider TBD | No App Store / Google Play distribution yet. |
| `future-store-ios` | Planned | Apple App Store | Apple IAP via RevenueCat | Digital goods must use compliant IAP flow. |
| `future-store-android` | Planned | Google Play | Google Play Billing via RevenueCat | Digital goods must use Play Billing / approved alternative program where applicable. |

### 2.2 Capacitor Strategy

Future native packaging uses:

```text
React + Vite codebase
  → Capacitor native shell
  → iOS app bundle
  → Android app bundle
```

The store apps should reuse the same product surface, but platform-sensitive behaviors must be behind environment/platform gates.

### 2.3 What Changes from Web

| Area | Web Current | Store Future |
|---|---|---|
| Shell | Browser | Capacitor native shell |
| Distribution | URL / web hosting | App Store Connect / Play Console |
| Billing | `createCheckoutSession` to web provider | Store IAP via RevenueCat |
| Entitlement | `paymentWebhook` after provider webhook | RevenueCat webhook → `paymentWebhook` |
| Account deletion | Web settings flow required | In-app `deleteAccount` required |
| Push notifications | Web optional/future | Native push permission + store privacy disclosure |
| Camera/media | Web file picker | Native permission strings and store declarations |
| Privacy disclosure | Privacy Policy + web consent | App privacy labels + Data Safety + manifests |
| Review process | internal QA | App Review / Play Review + demo account |

### 2.4 Platform Detection

Store-specific logic must not be scattered across the app.

Recommended pattern:

```ts
type RuntimePlatform = "web" | "ios" | "android";

function getRuntimePlatform(): RuntimePlatform {
  // Implement through Capacitor runtime detection.
  return "web";
}
```

Use feature flags and runtime gates:

```text
billingProvider = webProvider | revenueCat
nativePushEnabled = true | false
nativeCameraEnabled = true | false
storeBuild = true | false
```

### 2.5 Store-Ready Architecture Rule

Do not hard-code web-only payment assumptions into product logic.

Correct:

```text
User requests upgrade
  → platform billing adapter
  → verified webhook
  → backend entitlement
```

Incorrect:

```text
User returns from checkout
  → client sets isPro = true
```

---

## 3. Billing & IAP Compliance

### 3.1 Canonical Billing Position

For store builds, digital goods and digital features consumed in the app must use store-compliant IAP.

Swish & Game digital goods/features include:

| Item | Current MVP Web | Store Future |
|---|---|---|
| Pro subscription | Web checkout provider TBD | Apple IAP / Google Play Billing via RevenueCat |
| Coins | Earned/granted only; no real-money packs | If sold for money in future: store IAP required |
| Cosmetics | Bought with coins only | If sold for money in future: store IAP required |
| Pro media/chat features | Pro entitlement | Store IAP-backed entitlement |
| AI Pro benefits, if monetized | TBD | Store IAP if unlocked in app |

### 3.2 Store Commissions

Plan financial model assuming store commission range:

```text
15%–30%
```

This affects:

- Pro gross-to-net.
- price parity decisions.
- margin planning.
- refunds/cancellations.
- tax handling.
- subscription analytics.

### 3.3 RevenueCat Abstraction

Canonical store billing architecture:

```text
iOS StoreKit / Google Play Billing
  → RevenueCat SDK
  → RevenueCat entitlement/product mapping
  → RevenueCat webhook
  → paymentWebhook
  → Firestore subscription entitlement
  → users/{uid} + publicProfiles/{uid}
```

RevenueCat is an abstraction layer only. Swish & Game backend remains the entitlement source of truth.

### 3.4 Store Purchase Flow

```text
User taps Upgrade to Pro
  → app detects platform = ios/android
  → RevenueCat paywall/offering displayed
  → user purchases through Apple/Google IAP
  → store validates purchase/receipt
  → RevenueCat updates customer entitlement
  → RevenueCat sends signed/verified webhook to backend
  → paymentWebhook validates webhook
  → backend writes subscriptions/{uid}
  → backend syncs users/{uid}.isPro
  → backend syncs publicProfiles/{uid}.verifiedBadge
```

### 3.5 Backend Entitlement Rule

The client may display a temporary pending/provisional UI only if explicitly designed, but permanent entitlement must come from backend state.

Backend-owned fields:

```text
isPro
subscriptionTier
subscriptionStatus
subscriptionExpiresAt
verifiedBadge
subscriptions/{uid}
billingEvents/{eventId}
```

Client must never write these fields.

### 3.6 Mapping to Existing Functions

| Existing Function | Web Current | Store Future |
|---|---|---|
| `createCheckoutSession` | starts web checkout | disabled for store digital goods, or used only for legally approved external-link program |
| `paymentWebhook` | verifies web provider webhook | verifies RevenueCat webhook or normalized store billing webhook |
| `reconcileSubscription` | Scale/V1 reconciliation | required for store entitlement drift, renewals, cancellations, refunds |
| `syncPublicProfile` | syncs Pro badge/profile state | must reflect backend entitlement only |
| `deleteAccount` | required by ADR-038 | must handle subscription/account deletion disclosure |

### 3.7 Web Provider vs RevenueCat

`ADR-017` still controls the final web payment provider.  
Store builds use `RevenueCat` abstraction per `ADR-037`.

| Platform | Billing Entry Point |
|---|---|
| Web | `createCheckoutSession` → web provider TBD |
| iOS | RevenueCat → Apple IAP |
| Android | RevenueCat → Google Play Billing |
| Backend | `paymentWebhook` normalized verification |
| Scale/V1 | `reconcileSubscription`, `billingEvents` |

### 3.8 External Purchase Links

External purchase links are region- and program-specific. They are not a default solution.

| Region / Platform | Roadmap Position |
|---|---|
| Apple US storefront | External purchase link rules have changed; legal/store review required before using. |
| Apple EU / DMA | Region-specific entitlements/alternative terms may apply; legal/store review required. |
| Google Play EEA / DMA | Alternative billing/external offer programs may apply; legal/store review required. |
| Google Play US | Alternative billing/external link options may be affected by active legal orders/programs; legal/store review required. |
| Israel launch | Do not assume external purchase link allowed for store builds. Use IAP unless approved. |

Policy:

```text
No external purchase links in iOS/Android store builds unless Product + Legal + Store Compliance explicitly approve the exact region/program implementation.
```

### 3.9 Receipt / Webhook Validation

Required controls:

- verify RevenueCat webhook signature/authorization.
- normalize event type.
- idempotency by provider event ID.
- no Pro grant from client callback.
- no Pro grant from RevenueCat SDK client state alone.
- persist billing audit in `billingEvents` when implemented.
- reconcile with store/provider APIs when entitlement drift is suspected.

### 3.10 Coins and Consumables

Current MVP:

```text
coins are earned/granted only
coins are not purchased with real money
coins have no cash value
no cash-out
```

Future store builds:

- real-money coin packs require IAP.
- purchased consumables must follow Apple/Google restore/consumable behavior.
- server must maintain balance and transaction audit.
- refunds/revocations must be handled through webhooks/reconciliation.
- never trust client-side purchase state for coins.

---

## 4. Apple App Store Requirements

### 4.1 Store Status

| Requirement | MVP Web Now | Future Store |
|---|---:|---:|
| Apple Developer Program | no | yes |
| App Store Connect app record | no | yes |
| TestFlight | no | yes |
| App Review | no | yes |
| Apple IAP | no | yes for digital goods |
| `PrivacyInfo.xcprivacy` | no | yes |
| Privacy Nutrition Labels | no | yes |
| Account deletion in app | web required | required |
| Sign in with Apple / compliant equivalent | no if web-only | likely required if social login exists |

### 4.2 App Review Guideline 3.1.1 — IAP

For iOS store builds, any in-app unlock of digital features or content must be IAP-compliant.

Swish & Game store build must treat these as IAP-backed if sold/unlocked in app:

- `pro` subscription.
- future paid coins.
- future paid cosmetics.
- any paid AI feature consumed in app.
- premium chat/media capability.

Implementation rule:

```text
iOS store build must not show web checkout for Pro/digital goods unless a specific allowed external purchase entitlement/program is approved.
```

### 4.3 Subscriptions

Pro subscription must clearly disclose:

| Field | Required |
|---|---|
| Product name | `Swish & Game Pro` or approved final name |
| Price | store-localized price; web canonical is `29.90 ILS/month` |
| Billing period | monthly recurring |
| What user gets | Pro benefits |
| Renewal | automatic until cancelled |
| Cancellation path | Apple subscription management |
| Refund path | Apple-supported refund flow |
| Trial/intro offer | only if configured and disclosed |
| Cross-device access | entitlement by account where applicable |

### 4.4 User-Generated Content

Swish & Game includes UGC and social interaction:

- profile/bio.
- profile images/banners.
- chat text.
- chat media.
- discovery profiles.
- reports/blocking.

Apple store readiness requires:

- offensive content reporting.
- blocking abusive users.
- moderation/contact flow.
- content policy.
- published contact information.
- timely review process.
- safe default handling for UGC.

MVP already includes:

```text
createReport
blockUser
reports
users/{uid}/blocks
```

Future store submission should include review notes explaining report/block flows.

### 4.5 `PrivacyInfo.xcprivacy` Privacy Manifest

iOS store build must include a privacy manifest when required.

Track:

| Item | Required Action |
|---|---|
| `PrivacyInfo.xcprivacy` | add to native iOS target |
| Required-reason APIs | declare approved reasons if used by app or SDK |
| Third-party SDKs | confirm SDK privacy manifests/signatures |
| Capacitor plugins | inventory APIs used |
| RevenueCat SDK | verify current SDK privacy manifest requirements |
| Firebase SDKs | verify data collection declarations |
| Analytics SDK | declare if used |
| Crash reporting SDK | declare if used |

### 4.6 App Tracking Transparency — ATT

ATT is required only if the app tracks users across apps/websites owned by other companies or accesses identifiers for tracking.

Current product position:

```text
No ad tracking by default.
No sale of user data.
Analytics must not include PII/raw content.
```

Store build rule:

- do not include tracking SDKs unless explicitly approved.
- if tracking is introduced, implement ATT prompt and update Privacy Policy/App Privacy labels.
- do not gate app functionality on ATT consent.
- do not fingerprint users.

### 4.7 Privacy Nutrition Labels

Before App Store submission, App Store Connect privacy labels must match actual data collection and third-party SDK behavior.

Data categories likely relevant for Swish & Game:

| Data Area | Examples |
|---|---|
| Contact Info | email |
| User Content | profile bio, images, chat messages/media |
| Identifiers | `uid`, Firebase identifiers, RevenueCat app user ID |
| Purchases | subscription status, IAP transactions |
| Usage Data | analytics events, app interactions |
| Diagnostics | crash logs, performance metrics |
| Other Data | moderation/report metadata if applicable |

Do not claim “not collected” for data processed by Firebase/RevenueCat/analytics/crash SDKs.

### 4.8 Age Rating

Swish & Game has:

- UGC.
- chat/messaging.
- matchmaking/discovery between users.
- user profiles.
- potential unrestricted user-generated text/media.

Store age rating must be answered honestly in App Store Connect.

Internal policy minimum age:

```text
16+
```

Important distinction:

| Concept | Meaning |
|---|---|
| Product minimum age | App-level Terms/Privacy/Trust policy, currently `16+` pending legal |
| Store age rating | Store content rating questionnaire result |
| Age assurance | Technical/legal method to verify/declare age |

Do not rely on store age rating alone to satisfy product age policy.

### 4.9 Sign in with Apple

If the iOS app offers social login such as Google Sign-In for primary account creation/login, implement Sign in with Apple or another compliant equivalent that satisfies Apple login requirements.

Recommended store-ready path:

```text
Web/MVP: email + Google login can exist
iOS store: add Sign in with Apple before submission if social login remains
```

### 4.10 Account Deletion

App Store builds with account creation must allow users to initiate account deletion in app.

ADR-038 requirement:

```text
deleteAccount
```

iOS requirements for Swish & Game:

- deletion entry point inside account/settings.
- clear confirmation.
- explain subscription handling.
- explain retention exceptions.
- call backend `deleteAccount`.
- remove/anonymize data per legal policy.
- revoke Sign in with Apple token if used.
- support immediate deletion request unless legal/retention exception applies.

### 4.11 App Store Connect / TestFlight

Before submission:

- create App Store Connect app record.
- configure bundle ID.
- configure app name/subtitle/categories.
- configure privacy labels.
- configure age rating.
- configure IAP products/subscriptions.
- configure App Review notes.
- provide demo account.
- make backend/staging review environment accessible.
- test subscriptions/IAP in sandbox/TestFlight.
- include support URL and privacy policy URL.
- ensure screenshots/metadata are accurate and do not imply identity verification.

### 4.12 Apple Review Notes

Include review notes for:

- demo account credentials.
- test Pro/IAP products.
- how to test report/block.
- how to test account deletion.
- explanation that `verifiedBadge` means Pro member only.
- any AI features and safety refusals.
- UGC moderation path.
- Hebrew RTL target launch notes if relevant.

---

## 5. Google Play Requirements

### 5.1 Store Status

| Requirement | MVP Web Now | Future Store |
|---|---:|---:|
| Play Console account | no | yes |
| Android App Bundle | no | yes |
| Google Play Billing | no | yes for digital goods |
| RevenueCat Android SDK | no | yes |
| Data Safety form | no | yes |
| Privacy Policy URL | published (draft copy pending counsel): `/privacy.html` + `/terms.html` on the hosting domain, linked from Settings and the sign-in screen | swap copy after legal approval |
| Content rating | no | yes, IARC |
| Account deletion | web required | in-app + web URL |
| Target API | no | yes |
| Closed testing | no | may be required for new personal accounts |

### 5.2 Google Play Billing

Google Play Billing is required for in-app purchases of digital goods/services distributed on Google Play, unless a specific allowed exception/program applies.

Swish & Game store build must use Play Billing / RevenueCat for:

- Pro subscription.
- future paid coins.
- future paid cosmetics.
- any in-app digital premium feature.

Do not use web checkout in Android store build for in-app digital goods unless legal/store compliance approves a specific alternative billing program.

### 5.3 User Choice Billing / External Offers

Google supports alternative billing/external offer programs in certain regions and conditions.

Policy for Swish & Game:

```text
Default Android store path = Google Play Billing via RevenueCat.
Alternative billing/external links = disabled unless Legal + Product + Store Compliance approve region-specific implementation.
```

### 5.4 Data Safety Form

Before Play submission, complete Data Safety based on actual app behavior and third-party SDKs.

Must align with:

- `PRIVACY_AND_TERMS.md`.
- Firebase Auth/Firestore/Storage/Functions.
- RevenueCat.
- analytics provider.
- crash/error monitoring provider.
- AI/Gemini server-side behavior.
- account deletion flow.
- data retention/deletion policy.

Likely data declarations:

| Data Type | Examples |
|---|---|
| Personal info | email, account ID |
| User content | profile bio, images, chat content/media |
| App activity | app interactions, events |
| App info/performance | crash logs, diagnostics |
| Financial info | purchases/subscription metadata via store/provider |
| Device/other identifiers | Firebase/RevenueCat/analytics identifiers |

Data Safety must remain accurate after SDK or feature changes.

### 5.5 Privacy Policy URL

Google Play requires a public privacy policy link for apps that collect user data and for Data Safety declarations.

Store-ready requirements:

- public web URL, not a private repo file.
- accessible without login.
- not a PDF-only artifact.
- matches actual data practices.
- includes account deletion/data deletion section.
- includes contact method.
- Hebrew version for Israel launch; English version if store listing is English/global.

### 5.6 Target API Level

Android store build must target current Google Play required API level.

Current planning baseline:

```text
targetSdkVersion >= 35
Android 15 / API level 35
```

This must be rechecked before submission because Google updates target API requirements annually.

### 5.7 Google Play Billing Library

RevenueCat/Capacitor Android build must use a supported Play Billing Library version.

Planning baseline:

```text
Billing Library v8 or later by Aug 31, 2026
```

Before store submission:

- verify RevenueCat SDK version.
- verify transitive Play Billing Library version.
- verify Gradle dependency tree.
- verify `AndroidManifest.xml` includes billing metadata if required.
- test purchases, renewals, cancellations, refunds, restore.

### 5.8 Content Rating — IARC

Google Play requires content rating questionnaire via IARC.

Swish & Game must answer honestly for:

- user-generated content.
- chat/messaging.
- matching/discovery.
- profile images.
- report/block controls.
- possible AI content.
- in-app purchases.
- minimum age policy.

Internal minimum age `16+` does not replace the IARC rating.

### 5.9 Account Deletion

Google Play requires apps with account creation to provide:

- in-app path to request/delete app account and associated data.
- web link resource for users who cannot access the app.
- Data Safety deletion disclosures.

Swish & Game implementation:

```text
Settings → Account → Delete account
  → confirmation
  → subscription warning
  → deleteAccount
  → backend deletion/anonymization/retention process
```

Also required:

```text
https://<public-domain>/account-deletion
```

This page must be functional, public, relevant, and clearly allow account deletion request.

### 5.10 Closed Testing for New Personal Developer Accounts

If the Google Play developer account is a new personal account created after the applicable policy date, closed testing requirements may apply before production access.

Planning requirement:

- closed test track.
- required tester count per current policy.
- continuous opt-in period per current policy.
- collect tester feedback.
- apply for production access through Play Console.
- document testing summary.

Use organization developer account if appropriate and approved by business/legal.

### 5.11 Play Console Release Requirements

Before production:

- app package name finalized.
- signing key strategy decided.
- internal/closed testing completed.
- store listing completed.
- privacy policy URL public.
- Data Safety approved.
- content rating completed.
- target API compliant.
- billing configured.
- app access/demo account provided.
- reviewer credentials configured.
- staged rollout plan defined.

---

## 6. Cross-Cutting Compliance

### 6.1 Privacy Policy Public Availability

`PRIVACY_AND_TERMS.md` is currently a draft and not a public policy.

Before store submission:

- legal approves final Privacy Policy.
- publish it at a stable public URL.
- ensure the URL is not behind auth.
- ensure app store disclosures match it.
- update whenever data practices change.
- include account deletion process.

### 6.2 Account Deletion — ADR-038

Canonical requirement:

```text
deleteAccount
```

Must exist before store launch.

Required capabilities:

| Capability | Required |
|---|---|
| in-app entry point | yes |
| clear confirmation | yes |
| backend function | `deleteAccount` |
| reauthentication if needed | yes |
| subscription warning | yes |
| retention explanation | yes |
| deletion/anonymization | yes |
| public web deletion URL | Google Play yes; Apple if web completion needed |
| audit | yes, privacy-safe |

### 6.3 Age Assurance / App Store Accountability

Internal policy:

```text
minimumAge = 16+
```

Store readiness requires:

- legal approval of age policy.
- onboarding age declaration if adopted.
- `underage_concern` reporting remains active.
- Trust & Safety escalation for minors.
- age rating questionnaires answered honestly.
- no misleading “for kids” metadata.
- future identity/age verification separate from `verifiedBadge`.

### 6.4 UGC / Moderation

Cross-reference `TRUST_AND_SAFETY.md`.

Store builds must support:

- report user/content.
- block user.
- moderation/contact information.
- handling harassment/hate/sexual content/scam/fake profiles.
- severe content escalation.
- underage concern escalation.
- no normal-user access to reports/moderation data.

Current MVP safety functions:

```text
createReport
blockUser
```

Future Scale/V1:

```text
moderationActions
moderation panel
automated moderation
anti-evasion
```

### 6.5 Data Safety Alignment

Store declarations must match real data practices.

Checklist:

- `PRIVACY_AND_TERMS.md` final.
- Apple privacy labels filled.
- Google Data Safety filled.
- Firebase SDK behavior reviewed.
- RevenueCat SDK behavior reviewed.
- analytics SDK behavior reviewed.
- crash monitoring SDK behavior reviewed.
- AI server-side data flow described.
- user content disclosure included.
- deletion and retention disclosures consistent.

### 6.6 Security

Cross-reference `SECURITY.md`.

Store builds must preserve:

- no secrets in client.
- no `GEMINI_API_KEY` in bundle.
- no payment secrets in bundle.
- no service account in app.
- no direct Firestore writes to server-owned fields.
- all entitlement changes through backend.
- Security Rules tests green.
- Storage Rules tests green.
- App Review / Play Review demo backend uses staging-safe data.

### 6.7 AI Compliance

AI remains:

```text
server-side only
```

Rules:

- no Gemini SDK/API key in iOS/Android app.
- AI disclosures in Privacy Policy and Terms.
- safe refusal categories.
- no raw prompt/response in analytics/logs.
- cost/rate limits.
- disable through `system/config.aiHubEnabled`.

### 6.8 `verifiedBadge`

Canonical meaning:

```text
verifiedBadge = Pro member
```

Store listing and screenshots must not imply:

- identity verification.
- age verification.
- safety verification.
- background check.

If future verification exists, use separate fields:

```text
identityVerified
ageVerified
```

---

## 7. Native Capabilities Mapping

### 7.1 Capability Table

| Native Capability | Store Build Need | Current Web Fallback | Feature Flag / Gate | Compliance Notes |
|---|---|---|---|---|
| IAP | required for Pro/digital goods | web checkout via `createCheckoutSession` | `billingProvider` | RevenueCat + webhook entitlement |
| Push notifications | future | none/web push optional | `nativePushEnabled` | requires permission copy + privacy disclosure |
| Camera | optional for profile/media | file picker/upload | `nativeCameraEnabled` | iOS usage string; Android permissions; Data Safety |
| Photo library/storage | profile/chat media | file picker | `nativeMediaPickerEnabled` | limit scope; declare data use |
| Deep links | future | web routes | `deepLinksEnabled` | handle auth/safety routing carefully |
| App tracking | not planned | none | `trackingEnabled` | ATT required if tracking introduced |
| Biometrics | future optional | none | `biometricLoginEnabled` | sensitive permission/privacy review |
| Native share | future optional | web share if available | `nativeShareEnabled` | avoid leaking private chat/profile data |
| Crash reporting | recommended | Sentry/web | `nativeCrashReportingEnabled` | privacy labels/Data Safety |
| Play Integrity / DeviceCheck | future anti-abuse | server risk checks | `deviceIntegrityEnabled` | legal/privacy/security review |

### 7.2 Feature Flag Pattern

Use platform-aware flags in `system/config`:

```json
{
  "billingProvider": "webProvider",
  "storeBuild": false,
  "nativePushEnabled": false,
  "nativeCameraEnabled": false,
  "revenueCatEnabled": false,
  "externalPurchaseLinksEnabled": false,
  "deleteAccountEnabled": true
}
```

For store builds:

```json
{
  "billingProvider": "revenueCat",
  "storeBuild": true,
  "revenueCatEnabled": true,
  "externalPurchaseLinksEnabled": false
}
```

### 7.3 Native Permission Copy

Prepare localized permission copy in Hebrew and English where required.

| Permission | Hebrew Purpose Copy |
|---|---|
| Camera | העלאת תמונת פרופיל או תמונה לצ׳אט, אם המשתמש בוחר בכך. |
| Photo Library | בחירת תמונה לפרופיל או לצ׳אט, אם המשתמש בוחר בכך. |
| Push Notifications | קבלת עדכונים על התאמות, הודעות או פעילות חשבון. |
| Tracking | לא מתוכנן; אם יתווסף, דורש ATT ו-legal approval. |

---

## 8. Pre-Store-Launch Readiness Checklist

This gate is in addition to `ROADMAP.md` §9 and `DEFINITION_OF_DONE.md`.

### 8.1 Product / Platform

- [ ] Store launch tier approved in `ROADMAP.md`.
- [ ] Capacitor shell implemented.
- [ ] iOS and Android builds generated from same React+Vite codebase.
- [ ] platform detection works.
- [ ] store vs web billing routing works.
- [ ] no web-only purchase CTA appears in store builds for digital goods.
- [ ] Hebrew RTL tested in native shells.
- [ ] mobile safe areas / keyboard / viewport tested.
- [ ] deep link behavior either disabled or tested.
- [ ] app icons/splash screens prepared.
- [ ] store screenshots accurate.

### 8.2 Billing / IAP

- [ ] RevenueCat project configured.
- [ ] Apple App Store products/subscriptions configured.
- [ ] Google Play products/subscriptions configured.
- [ ] RevenueCat offerings configured.
- [ ] RevenueCat entitlements map to `pro`.
- [ ] RevenueCat customer ID maps to `uid`.
- [ ] RevenueCat webhook connected to backend.
- [ ] `paymentWebhook` verifies RevenueCat webhook.
- [ ] `paymentWebhook` is idempotent.
- [ ] `reconcileSubscription` implemented or launch exception approved.
- [ ] Store sandbox purchases tested.
- [ ] renewal/cancellation/refund/revocation tested.
- [ ] no Pro from client/store callback alone.
- [ ] `billingEvents` implemented or Scale/V1 exception documented.
- [ ] store commission modeled at 15%–30%.

### 8.3 Apple Checklist

- [ ] Apple Developer account active.
- [ ] bundle ID configured.
- [ ] App Store Connect record created.
- [ ] TestFlight configured.
- [ ] IAP products/subscriptions submitted/approved as needed.
- [ ] App Review demo account prepared.
- [ ] backend review environment live.
- [ ] `PrivacyInfo.xcprivacy` present.
- [ ] required-reason APIs declared.
- [ ] third-party SDK privacy manifests reviewed.
- [ ] App Privacy labels completed.
- [ ] ATT not used unless required and approved.
- [ ] age rating questionnaire completed honestly.
- [ ] Sign in with Apple implemented if required by login setup.
- [ ] account deletion available in-app.
- [ ] support URL public.
- [ ] privacy policy URL public.
- [ ] review notes explain UGC/report/block/Pro/AI.

### 8.4 Google Play Checklist

- [ ] Play Console developer account ready.
- [ ] package name finalized.
- [ ] app signing configured.
- [ ] Android App Bundle generated.
- [ ] target API level compliant.
- [ ] Play Billing dependency supported.
- [ ] RevenueCat Android SDK configured.
- [ ] Play products/subscriptions configured.
- [ ] Data Safety form completed.
- [ ] privacy policy URL public and non-PDF.
- [ ] account deletion in-app.
- [ ] account deletion public web URL.
- [ ] content rating / IARC completed.
- [ ] app access/demo account configured.
- [ ] closed testing requirements satisfied if applicable.
- [ ] Play pre-launch report reviewed.
- [ ] staged rollout plan defined.

### 8.5 Privacy / Legal

- [ ] `PRIVACY_AND_TERMS.md` finalized by legal.
- [ ] Privacy Policy published publicly.
- [ ] Terms of Service published publicly.
- [ ] account deletion policy published.
- [ ] retention policy approved.
- [ ] refund/cancellation policy approved.
- [ ] age policy `16+` approved.
- [ ] minors/safety escalation approved.
- [ ] UGC license and moderation policy approved.
- [ ] AI disclosure approved.
- [ ] store data declarations match real SDK behavior.

### 8.6 Trust & Safety

- [ ] `createReport` works in native shell.
- [ ] `blockUser` works in native shell.
- [ ] report reasons match canonical enum.
- [ ] blocked users excluded from discovery.
- [ ] blocked chat prevents new messages.
- [ ] support/contact URL available.
- [ ] moderation review process active.
- [ ] severe content escalation owner assigned.
- [ ] `verifiedBadge` copy says Pro only.

### 8.7 Security / CI

- [ ] no secrets in native app bundles.
- [ ] no `GEMINI_API_KEY` in bundle.
- [ ] no payment secrets in bundle.
- [ ] no service account in app.
- [ ] Security Rules tests pass.
- [ ] Storage Rules tests pass.
- [ ] native build CI added.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run test` passes.
- [ ] `npm run test:rules` passes.
- [ ] `npm run build` passes.
- [ ] bundle/native scans pass.
- [ ] production deploy remains manual approval.
- [ ] rollback plan includes store staged rollout halt.

---

## 9. Open Items

| Item | Status | Impact |
|---|---|---|
| `ADR-017` final web payment provider | Open | Needed to align web checkout with RevenueCat/server entitlement model. |
| Store launch timing | Open | No concrete App Store / Google Play launch date. |
| `ADR-039` cosmetic rendering in native shells | Open | Validate Rive/Lottie/PixiJS/alpha-video performance inside Capacitor WebView on real devices. |
| RevenueCat configuration plan | Open | Need products, offerings, entitlements, webhook signature strategy. |
| Store product IDs | Open | Need canonical Apple/Google product IDs for Pro and any future digital goods. |
| `deleteAccount` implementation | Required by ADR-038 | Store launch blocker. |
| Public account deletion URL | Open | Google Play requirement; useful for Apple if web completion needed. |
| Final age-assurance method | Open | Needed for `16+` policy and possible App Store Accountability laws. |
| Store age rating target | Open | Must be answered through Apple age rating and Google/IARC questionnaires. |
| Sign in with Apple | Open | Required if iOS store build keeps third-party/social login. |
| Privacy manifest inventory | Open | Need full SDK/API audit after Capacitor plugins are chosen. |
| Google Data Safety mapping | Open | Must map all SDKs/data flows precisely. |
| App Privacy labels mapping | Open | Must map all SDKs/data flows precisely. |
| External purchase link strategy | Open/legal-gated | Default disabled; region-specific only with approval. |
| Native push notifications | Future | Requires permission UX and privacy/store declarations. |
| Native camera/media permissions | Open | Required only if native camera/media picker is used. |
| Play closed testing plan | Open | Depends on developer account type. |
| Store listing assets | Open | Icons, screenshots, preview video, copy, support URL. |
| Store review demo account | Open | Needed for both Apple and Google review. |
| Native crash reporting | Open | Sentry/native equivalent decision. |
| Store release rollback plan | Open | Need staged rollout halt, hotfix and communication process. |
| Legal review of store-specific terms | Open | Refunds, subscriptions, IAP, data deletion, age policy. |

---

## 10. Official External References to Re-Check

This document is forward-looking. Before store submission, re-check the latest official Apple, Google Play, Android, and RevenueCat documentation because store policies change frequently.

| Area | Reference |
|---|---|
| Apple App Review Guidelines | Apple Developer — App Review Guidelines |
| Apple user privacy / ATT / labels | Apple Developer — User Privacy and Data Use |
| Apple privacy manifests | Apple Developer — Privacy manifest files / required reason APIs |
| Apple account deletion | Apple Developer — Offering account deletion in your app |
| Apple age ratings | App Store Connect Help — Age ratings values and definitions |
| Google Play Payments | Play Console Help — Understanding Google Play’s Payments policy |
| Google Data Safety | Play Console Help — Provide information for Google Play’s Data safety section |
| Google account deletion | Play Console Help — App account deletion requirements |
| Google target API | Play Console Help — Target API level requirements |
| Play Billing Library | Android Developers — Play Billing Library version deprecation |
| Play testing | Play Console Help — App testing requirements for new personal developer accounts |
| RevenueCat | RevenueCat Docs — Entitlements and Server Notifications |
