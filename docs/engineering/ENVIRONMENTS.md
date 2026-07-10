# Swish & Game — Environments, Config & Secrets

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Production Environments, Config & Secrets Contract |
| Repository Path | `docs/engineering/ENVIRONMENTS.md` |
| Product | Swish & Game |
| Source of Truth | `docs/architecture/SECURITY.md`, `docs/architecture/PAYMENTS.md`, `docs/architecture/AI_INTEGRATION.md`, `docs/architecture/ARCHITECTURE.md`, `docs/product/DECISIONS.md`, `docs/engineering/MIGRATION_PLAN.md` |
| Frontend Runtime | Vite + React + TypeScript |
| Backend Runtime | Firebase Cloud Functions |
| Firebase Projects | `swish-game-dev`, `swish-game-staging`, `swish-game-prod` |
| Primary Principle | רק Firebase public config נחשף ל-client; כל secrets נשמרים ב-Secret Manager / server-side בלבד |
| Security Warning | ה-prototype הישן הזריק Gemini API key ל-client דרך `vite.config.ts` / `process.env.API_KEY`; חובה להסיר זאת לפני כל deploy |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Environments Overview](#2-environments-overview)
- [3. Client Environment Variables](#3-client-environment-variables)
- [4. `.env.example` Full Content](#4-envexample-full-content)
- [5. Server-Side Config & Secrets](#5-server-side-config--secrets)
- [6. Removing the Insecure Client Gemini Key](#6-removing-the-insecure-client-gemini-key)
- [7. Local Development Setup](#7-local-development-setup)
- [8. Config Documents `system/config`](#8-config-documents-systemconfig)
- [9. CI/CD Environment Separation](#9-cicd-environment-separation)
- [10. Setup Runbook](#10-setup-runbook)
- [11. Open Items](#11-open-items)

---

## 2. Environments Overview

### 2.1 Canonical Firebase Projects

Swish & Game uses exactly three Firebase/GCP projects:

| Environment | Firebase Project ID | Purpose | Who Uses It | Data Sensitivity |
|---|---|---|---|---|
| `dev` | `swish-game-dev` | Local development, emulator-adjacent testing, feature development | Developers | Fake/dev data only |
| `staging` | `swish-game-staging` | Production-like QA, pre-release validation, webhook sandbox testing | Developers, QA, product reviewers | Test users only |
| `prod` | `swish-game-prod` | Real users, real billing, production data | Production app only | Real user data and billing metadata |

### 2.2 Hard Rules

- אסור להשתמש ב-`swish-game-prod` ל-local development.
- אסור להריץ seed scripts מול production.
- אסור לחבר local frontend ל-production Firestore/Storage/Functions.
- אסור לשמור service account JSON בתוך repo.
- אסור להכניס Gemini/payment secrets ל-`.env`, `vite.config.ts`, או client bundle.
- production deploy דורש manual approval.
- staging חייב להיות production-like, אבל עם test providers/test users בלבד.
- כל environment משתמש ב-secrets נפרדים.

### 2.3 Environment Usage

| Action | dev | staging | prod |
|---|---:|---:|---:|
| Local feature work | Yes | No | Never |
| Firebase Emulator Suite | Yes | Optional | Never |
| QA before release | Optional | Yes | No |
| Payment sandbox webhooks | Optional | Yes | No |
| Real payment webhooks | No | No | Yes |
| Real user traffic | No | No | Yes |
| Manual prod data changes | No | No | Only via approved admin tooling |
| Secret rotation testing | Yes | Yes | Yes, with change plan |

### 2.4 Environment Naming Convention

Use `APP_ENV` on the server side:

```ts
export type AppEnvironment = "dev" | "staging" | "prod";
```

For client-side public environment selection:

```env
VITE_APP_ENV=dev
```

The client may know which environment it is running in, but it must never receive secrets.

---

## 3. Client Environment Variables

### 3.1 Vite Rule

Swish & Game uses Vite.  
Only environment variables prefixed with `VITE_` are exposed to the browser bundle.

Client code must read public env vars only through:

```ts
import.meta.env.VITE_FIREBASE_PROJECT_ID
```

Never use:

```ts
process.env.API_KEY
process.env.GEMINI_API_KEY
process.env.PAYMENT_API_SECRET
```

inside frontend code.

### 3.2 Allowed Client Env Vars

The client may contain only public Firebase web config and non-secret public environment metadata.

| Env Var | Required | Secret? | Example | Description |
|---|---:|---:|---|---|
| `VITE_APP_ENV` | Yes | No | `dev` | Public app environment: `dev`, `staging`, `prod`. |
| `VITE_FIREBASE_API_KEY` | Yes | No | `AIza...` | Firebase web API key. Not a secret; protected by Firebase Auth + Security Rules. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | No | `swish-game-dev.firebaseapp.com` | Firebase Auth domain. |
| `VITE_FIREBASE_PROJECT_ID` | Yes | No | `swish-game-dev` | Firebase project ID. |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | No | `swish-game-dev.appspot.com` | Firebase Storage bucket. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | No | `000000000000` | Firebase messaging sender ID. |
| `VITE_FIREBASE_APP_ID` | Yes | No | `1:000000000000:web:abc123` | Firebase web app ID. |
| `VITE_USE_FIREBASE_EMULATORS` | Yes for local | No | `true` | Enables local emulator connection in dev only. |
| `VITE_FIRESTORE_EMULATOR_HOST` | Local only | No | `127.0.0.1` | Firestore emulator host. |
| `VITE_FIRESTORE_EMULATOR_PORT` | Local only | No | `8080` | Firestore emulator port. |
| `VITE_AUTH_EMULATOR_URL` | Local only | No | `http://127.0.0.1:9099` | Auth emulator URL. |
| `VITE_STORAGE_EMULATOR_HOST` | Local only | No | `127.0.0.1` | Storage emulator host. |
| `VITE_STORAGE_EMULATOR_PORT` | Local only | No | `9199` | Storage emulator port. |
| `VITE_FUNCTIONS_EMULATOR_HOST` | Local only | No | `127.0.0.1` | Functions emulator host. |
| `VITE_FUNCTIONS_EMULATOR_PORT` | Local only | No | `5001` | Functions emulator port. |

### 3.3 Forbidden Client Env Vars

These must never appear in frontend env files, `vite.config.ts`, `src/**`, browser bundle, logs, or static assets:

| Forbidden Var / Secret | Reason |
|---|---|
| `GEMINI_API_KEY` | Must be server-side only via Secret Manager. |
| `API_KEY` for Gemini | Ambiguous and dangerous; old prototype pattern. |
| `PAYMENT_WEBHOOK_SECRET` | Used to verify webhooks server-side only. |
| `PAYMENT_API_SECRET` | Provider secret key. |
| `PAYMENT_API_KEY` if secret | Provider secret or private API key. |
| Service account JSON | Full backend/admin access. |
| Admin SDK credentials | Backend-only. |
| Provider signing secret | Webhook security. |
| `ADMIN_INTERNAL_SECRET` | Internal admin tooling only if used. |

### 3.4 Recommended Client Config Module

```ts
// src/lib/firebase/clientConfig.ts

export const firebaseClientConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const appEnv = import.meta.env.VITE_APP_ENV;

export const useFirebaseEmulators =
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
```

### 3.5 Validation

At client boot, validate only public config:

```ts
const requiredPublicEnv = [
  "VITE_APP_ENV",
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID"
] as const;

for (const key of requiredPublicEnv) {
  if (!import.meta.env[key]) {
    throw new Error(`Missing required public env var: ${key}`);
  }
}
```

---

## 4. `.env.example` Full Content

Save the following file as `.env.example` in the repository root.

```env
# Swish & Game — Client Environment Example
# Copy this file to .env.local for local development.
#
# IMPORTANT:
# - This file is for PUBLIC Vite variables only.
# - Vite exposes variables prefixed with VITE_ to the browser bundle.
# - Do NOT put secrets here.
# - Do NOT put GEMINI_API_KEY here.
# - Do NOT put PAYMENT_WEBHOOK_SECRET here.
# - Do NOT put PAYMENT_API_SECRET here.
# - Do NOT put service account JSON here.
# - Firebase web config is not a secret, but access is protected by Firebase Auth
#   and Firebase Security Rules.

# ---------------------------------------------------------------------------
# App Environment
# ---------------------------------------------------------------------------

# Allowed values: dev, staging, prod
# Local development must use dev. Never use swish-game-prod for local dev.
VITE_APP_ENV=dev

# ---------------------------------------------------------------------------
# Firebase Web Config — Public Client Config
# ---------------------------------------------------------------------------

# Firebase project ID for local/dev.
# Canonical dev project: swish-game-dev
VITE_FIREBASE_PROJECT_ID=swish-game-dev

# Firebase web app public API key.
# This is not a secret, but it must only be used with correct Auth/Security Rules.
VITE_FIREBASE_API_KEY=replace-with-dev-firebase-web-api-key

# Firebase Auth domain.
VITE_FIREBASE_AUTH_DOMAIN=swish-game-dev.firebaseapp.com

# Firebase Storage bucket.
VITE_FIREBASE_STORAGE_BUCKET=swish-game-dev.appspot.com

# Firebase messaging sender ID.
VITE_FIREBASE_MESSAGING_SENDER_ID=replace-with-dev-messaging-sender-id

# Firebase web app ID.
VITE_FIREBASE_APP_ID=replace-with-dev-firebase-app-id

# ---------------------------------------------------------------------------
# Firebase Emulator Suite — Local Development Only
# ---------------------------------------------------------------------------

# Use emulators locally. Keep false in staging/prod builds.
VITE_USE_FIREBASE_EMULATORS=true

# Firestore Emulator
VITE_FIRESTORE_EMULATOR_HOST=127.0.0.1
VITE_FIRESTORE_EMULATOR_PORT=8080

# Firebase Auth Emulator
VITE_AUTH_EMULATOR_URL=http://127.0.0.1:9099

# Firebase Storage Emulator
VITE_STORAGE_EMULATOR_HOST=127.0.0.1
VITE_STORAGE_EMULATOR_PORT=9199

# Cloud Functions Emulator
VITE_FUNCTIONS_EMULATOR_HOST=127.0.0.1
VITE_FUNCTIONS_EMULATOR_PORT=5001

# ---------------------------------------------------------------------------
# Forbidden Examples — Do Not Add These
# ---------------------------------------------------------------------------

# GEMINI_API_KEY=never-put-gemini-key-in-client-env
# API_KEY=never-use-ambiguous-api-key-in-client
# PAYMENT_WEBHOOK_SECRET=never-put-payment-secrets-in-client-env
# PAYMENT_API_SECRET=never-put-payment-secrets-in-client-env
# PAYMENT_API_KEY=never-put-secret-provider-keys-in-client-env
# GOOGLE_APPLICATION_CREDENTIALS=never-commit-service-account-json
```

### 4.1 Local File Usage

Developers should create:

```text
.env.local
```

from `.env.example`, and `.env.local` must be gitignored.

Recommended `.gitignore` entries:

```gitignore
.env
.env.local
.env.*.local
*.service-account.json
serviceAccount*.json
firebase-debug.log
firestore-debug.log
ui-debug.log
```

---

## 5. Server-Side Config & Secrets

### 5.1 Server-Side Only

Cloud Functions read secrets from Secret Manager and non-secret runtime config from environment variables or `system/config`.

Server-side config is used for:

- Gemini integration.
- payment provider integration.
- webhook verification.
- admin/service operations.
- feature flags and limits.
- provider selection.

### 5.2 Secret Manager Inventory

| Secret | Required | Environments | Used By | Description |
|---|---:|---|---|---|
| `GEMINI_API_KEY` | Yes for AI | dev/staging/prod | `sendAIProfileReview`, `sendAISquadAdvice` | Gemini API key. Never exposed to client. |
| `PAYMENT_WEBHOOK_SECRET` | Yes for billing | staging/prod, optional dev | `paymentWebhook` | Provider webhook signature secret. |
| `PAYMENT_API_SECRET` | Yes for billing | staging/prod, optional dev | checkout/session creation, reconciliation | Provider secret API key/token. |
| `PAYMENT_API_KEY` | Provider-dependent | staging/prod, optional dev | provider adapter | Only if selected provider requires separate key. |
| `ADMIN_INTERNAL_SECRET` | Optional | staging/prod | internal admin tooling | Prefer IAM/custom claims over shared secrets. |
| `SENTRY_DSN` | Optional | dev/staging/prod | monitoring | Server DSN if using Sentry; frontend DSN can be public if chosen. |
| Service credentials | Managed by GCP/IAM | all | Cloud Functions runtime | Do not commit service account JSON. |

### 5.3 Environment-Specific Secrets

Each environment must have separate secret values:

| Secret | dev | staging | prod |
|---|---:|---:|---:|
| `GEMINI_API_KEY` | dev key | staging key | prod key |
| `PAYMENT_WEBHOOK_SECRET` | sandbox/test | sandbox/test | live |
| `PAYMENT_API_SECRET` | sandbox/test | sandbox/test | live |
| `PAYMENT_API_KEY` | sandbox/test | sandbox/test | live |
| Service account | GCP managed | GCP managed | GCP managed |

Never reuse production payment secrets in dev/staging.

### 5.4 Non-Secret Server Environment Variables

| Env Var | Secret? | Example | Description |
|---|---:|---|---|
| `APP_ENV` | No | `staging` | Server environment: `dev`, `staging`, `prod`. |
| `FIREBASE_PROJECT_ID` | No | `swish-game-staging` | Runtime project ID. |
| `BILLING_PROVIDER` | No | `stripe` | Selected provider adapter: `stripe`, `cardcom`, `meshulam`, `other`. |
| `GEMINI_MODEL` | No/Low sensitivity | `gemini-2.5-flash` | Server-side model ID. Must be verified before production deploy. |
| `GEMINI_TEMPERATURE` | No | `0.4` | Model generation setting. |
| `GEMINI_MAX_OUTPUT_TOKENS` | No | `1200` | Output token limit. |
| `AI_TIMEOUT_MS` | No | `15000` | AI provider timeout. |
| `PAYMENT_PRICE_AMOUNT` | No | `29.90` | Pro monthly price. |
| `PAYMENT_CURRENCY` | No | `ILS` | Billing currency. |

### 5.5 Cloud Functions Secret Binding

Functions that need secrets must declare them explicitly at deploy/runtime.

Conceptual example:

```ts
import { defineSecret } from "firebase-functions/params";

export const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
export const PAYMENT_WEBHOOK_SECRET = defineSecret("PAYMENT_WEBHOOK_SECRET");
export const PAYMENT_API_SECRET = defineSecret("PAYMENT_API_SECRET");
export const PAYMENT_API_KEY = defineSecret("PAYMENT_API_KEY");
```

Function binding example:

```ts
export const sendAIProfileReview = onCall(
  {
    secrets: [GEMINI_API_KEY],
    region: "me-west1"
  },
  async (request) => {
    // server-side only
  }
);
```

Webhook binding example:

```ts
export const paymentWebhook = onRequest(
  {
    secrets: [PAYMENT_WEBHOOK_SECRET, PAYMENT_API_SECRET, PAYMENT_API_KEY],
    region: "me-west1"
  },
  async (req, res) => {
    // verify raw body signature before processing
  }
);
```

### 5.6 What Is Never Stored in Firestore Config

Do not store these in `system/config`:

- Gemini API key.
- payment webhook secret.
- payment secret key.
- service account credentials.
- provider signing secret.
- admin shared secret.
- private API keys.

`system/config` is for non-secret runtime config only.

---

## 6. Removing the Insecure Client Gemini Key

### 6.1 Problem in Prototype

The prototype injects Gemini access into the client through `vite.config.ts`, using a pattern similar to:

```ts
define: {
  "process.env.API_KEY": JSON.stringify(env.API_KEY)
}
```

This is a security vulnerability because anything bundled into a Vite frontend can be inspected by users.

### 6.2 Required Removal

Remove all frontend references to:

```text
process.env.API_KEY
process.env.GEMINI_API_KEY
@google/genai
geminiService.ts direct provider calls
gemini-3-flash-preview
```

The old prototype model ID:

```text
gemini-3-flash-preview
```

must not appear in production code or config.

### 6.3 Correct `vite.config.ts`

`vite.config.ts` should not inject private env values.

Recommended pattern:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()]
});
```

No `process.env.API_KEY`.  
No Gemini key injection.  
No payment secrets.

### 6.4 Correct Frontend Pattern

Frontend calls Cloud Functions only:

```ts
import { getFunctions, httpsCallable } from "firebase/functions";

export async function requestAIProfileReview(input: AIProfileReviewInput) {
  const functions = getFunctions();
  const sendAIProfileReview = httpsCallable<
    AIProfileReviewInput,
    AIProfileReviewOutput
  >(functions, "sendAIProfileReview");

  const result = await sendAIProfileReview(input);
  return result.data;
}
```

The frontend never imports Gemini SDK.

### 6.5 Correct Backend Pattern

Backend owns:

- Gemini API key.
- model ID.
- system prompt.
- moderation/guardrails.
- data minimization.
- audit.
- rate limits.

Cross-reference:

- `docs/architecture/AI_INTEGRATION.md`
- `docs/engineering/MIGRATION_PLAN.md` Phase 0
- `docs/architecture/SECURITY.md`

### 6.6 Migration Checklist

| Check | Required |
|---|---:|
| Remove `process.env.API_KEY` from `vite.config.ts` | Yes |
| Remove `@google/genai` from frontend dependencies | Yes |
| Remove Gemini direct calls from `src/**` | Yes |
| Replace frontend AI service with callable wrapper | Yes |
| Add Cloud Function `sendAIProfileReview` | Yes |
| Add Cloud Function `sendAISquadAdvice` | Yes |
| Store `GEMINI_API_KEY` in Secret Manager | Yes |
| Add emulator-safe AI stub for local dev | Recommended |
| Verify bundle does not contain Gemini key | Yes |

---

## 7. Local Development Setup

### 7.1 Firebase Emulator Suite

Local development uses Firebase Emulator Suite, not production Firebase.

Required emulators:

| Emulator | Port | Purpose |
|---|---:|---|
| Auth | `9099` | Local Google/email-password auth simulation. |
| Firestore | `8080` | Local database. |
| Storage | `9199` | Local file upload testing. |
| Functions | `5001` | Callable/HTTP functions. |
| Emulator UI | `4000` | Visual inspection and debugging. |

### 7.2 `firebase.json`

Recommended baseline:

```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "functions": {
      "port": 5001
    },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "functions": {
    "source": "functions"
  }
}
```

### 7.3 `.firebaserc`

Recommended:

```json
{
  "projects": {
    "dev": "swish-game-dev",
    "staging": "swish-game-staging",
    "prod": "swish-game-prod"
  }
}
```

For local work:

```bash
firebase use dev
```

Never run:

```bash
firebase use prod
```

for local development.

### 7.4 Local Commands

Install dependencies:

```bash
npm install
```

Install functions dependencies:

```bash
cd functions
npm install
cd ..
```

Copy env example:

```bash
cp .env.example .env.local
```

Start emulators:

```bash
firebase emulators:start --project swish-game-dev
```

Start Vite dev server:

```bash
npm run dev
```

### 7.5 Connect Frontend to Emulators

Frontend should connect to emulators only when:

```ts
import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true"
```

Example:

```ts
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
  connectAuthEmulator(
    getAuth(),
    import.meta.env.VITE_AUTH_EMULATOR_URL
  );

  connectFirestoreEmulator(
    getFirestore(),
    import.meta.env.VITE_FIRESTORE_EMULATOR_HOST,
    Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT)
  );

  connectStorageEmulator(
    getStorage(),
    import.meta.env.VITE_STORAGE_EMULATOR_HOST,
    Number(import.meta.env.VITE_STORAGE_EMULATOR_PORT)
  );

  connectFunctionsEmulator(
    getFunctions(),
    import.meta.env.VITE_FUNCTIONS_EMULATOR_HOST,
    Number(import.meta.env.VITE_FUNCTIONS_EMULATOR_PORT)
  );
}
```

### 7.6 Local Secrets for Functions

For emulators, use one of the following approaches:

1. Firebase emulator secret support if configured.
2. Local `.secret.local` file that is gitignored.
3. Safe stubs for external providers.

Local AI behavior should default to a stub unless developer explicitly configures a dev Gemini key.

Example local-only file:

```env
# functions/.secret.local
# Gitignored. Local only.
GEMINI_API_KEY=dev-only-key-or-empty
PAYMENT_WEBHOOK_SECRET=dev-webhook-secret
PAYMENT_API_SECRET=dev-payment-secret
PAYMENT_API_KEY=dev-payment-api-key
```

### 7.7 Seed Data

Seed scripts must target dev/emulator only.

Seed recommended:

- `system/config`
- `gameCatalog`
- `shopItems`
- test users
- test `publicProfiles`
- test `subscriptions`
- test chats/messages

Command example:

```bash
npm run seed:emulator
```

Seed scripts must check:

```ts
if (process.env.APP_ENV === "prod") {
  throw new Error("Refusing to seed production.");
}
```

### 7.8 Local Payment Webhooks

For local/staging webhook testing:

- use provider sandbox mode.
- use provider CLI/tunnel if applicable.
- point webhook to Functions emulator or staging function.
- use sandbox secrets only.
- never send live payment events to dev/staging.

### 7.9 Local AI Testing

Default local AI should be stubbed:

```ts
if (process.env.APP_ENV === "dev" && process.env.USE_REAL_GEMINI !== "true") {
  return fakeAIProfileReviewResponse(input);
}
```

Real Gemini calls in dev require explicit opt-in and dev key only.

---

## 8. Config Documents `system/config`

### 8.1 Purpose

`system/config` stores non-secret runtime configuration that may be read by backend and, selectively, authenticated clients.

Path:

```text
system/config
```

Never store secrets here.

> הסכמה הקנונית המלאה של `SystemConfigDocument` מוגדרת ב-`docs/architecture/DATA_MODEL.md` (§4.22). סעיף זה מציג מבנה וערכי ברירת מחדל תפעוליים בלבד, ושמות השדות חייבים להישאר זהים לסכמה הקנונית.

### 8.2 Schema

```ts
export type SystemConfigDocument = {
  featureFlags: {
    aiHubEnabled: boolean;
    proSubscriptionEnabled: boolean;
    shopEnabled: boolean;
    mediaUploadEnabled: boolean;
    reportsEnabled: boolean;
  };

  limits: {
    basicDailySwipeLimit: number;
    aiProfileReviewDailyLimitBasic?: number;
    aiProfileReviewDailyLimitPro?: number;
    aiSquadAdviceDailyLimitBasic?: number;
    aiSquadAdviceDailyLimitPro?: number;
    mediaUploadDailyLimitPro?: number;
    maxProfileImageBytes: number;
    maxBannerImageBytes: number;
    maxChatMediaBytes: number;
    maxBioLength?: number;
  };

  billing: {
    provider: BillingProvider;
    proMonthlyPriceAmount: number;
    currency: "ILS";
  };

  ai: {
    model: string;
    temperature: number;
    maxOutputTokens: number;
    timeoutMs: number;
  };

  updatedAt: FirebaseFirestore.Timestamp;
};
```

### 8.3 Recommended Defaults

```json
{
  "featureFlags": {
    "aiHubEnabled": false,
    "proSubscriptionEnabled": false,
    "shopEnabled": true,
    "mediaUploadEnabled": true,
    "reportsEnabled": true
  },
  "limits": {
    "basicDailySwipeLimit": 30,
    "maxProfileImageBytes": 5242880,
    "maxBannerImageBytes": 5242880,
    "maxChatMediaBytes": 10485760
  },
  "billing": {
    "provider": "other",
    "proMonthlyPriceAmount": 29.9,
    "currency": "ILS"
  },
  "ai": {
    "model": "gemini-2.5-flash",
    "temperature": 0.4,
    "maxOutputTokens": 1200,
    "timeoutMs": 15000
  }
}
```

### 8.4 Security Notes

- `system/config` is non-secret.
- authenticated clients may read selected config.
- writes are admin/backend only.
- secrets remain in Secret Manager.
- model ID is server-side operational config; clients do not choose it.

### 8.5 Open Runtime Values

Some values remain open through ADRs:

| Config | ADR | Status |
|---|---|---|
| `basicDailySwipeLimit` | ADR-015 | Proposed `30/day`, pending confirmation. |
| AI request limits | ADR-027 | Open. |
| Daily reset timezone | ADR-029 | Open. |
| `Platform` vocabulary | ADR-030 | Open/pending final confirmation. |
| `maxBioLength` | ADR-031 | Open. |
| Pro cosmetics after expiry | ADR-032 | Open. |

---

## 9. CI/CD Environment Separation

### 9.1 Branch to Environment Mapping

Recommended mapping:

| Branch / Trigger | Environment | Firebase Project | Deploy Type |
|---|---|---|---|
| Pull request | Emulator/test only | none or `swish-game-dev` read-only | No deploy by default |
| `develop` | dev | `swish-game-dev` | automatic or manual |
| `main` | staging | `swish-game-staging` | automatic after tests |
| release tag | prod | `swish-game-prod` | manual approval required |

### 9.2 Deployment Separation

Each deployment must explicitly set project:

```bash
firebase deploy --project swish-game-staging
```

Production deploy must explicitly use:

```bash
firebase deploy --project swish-game-prod
```

and require manual approval.

### 9.3 CI Secrets

CI must store environment-specific secrets in the CI secret store or use Workload Identity Federation.

Do not store:

- service account JSON in repo.
- production Firebase token in repo.
- payment secrets in repo.
- Gemini key in repo.

Recommended:

- GitHub Actions environments:
  - `dev`
  - `staging`
  - `prod`
- Production environment protection rules.
- Manual reviewers for `prod`.

### 9.4 CI Checks

Required before deployment:

| Check | Required |
|---|---:|
| TypeScript build | Yes |
| Frontend build | Yes |
| Unit tests | Yes |
| Firebase Rules emulator tests | Yes |
| Functions tests | Yes |
| Secret scan | Yes |
| Lint | Yes |
| Bundle scan for forbidden strings | Yes |
| Production deploy approval | Yes |

### 9.5 Forbidden Bundle Strings

CI should fail frontend build if bundle contains:

```text
GEMINI_API_KEY
PAYMENT_WEBHOOK_SECRET
PAYMENT_API_SECRET
gemini-3-flash-preview
process.env.API_KEY
```

### 9.6 Deployment Order

Recommended order:

1. Firestore indexes.
2. Security Rules.
3. Storage Rules.
4. Cloud Functions.
5. Frontend hosting.
6. Post-deploy smoke tests.

### 9.7 Rollback

Rollback requirements:

- Keep previous functions version deployable.
- Keep previous hosting version.
- Avoid destructive migrations in same deploy as app code.
- Use feature flags for risky rollouts.
- Never rollback security rules to a less restrictive version without review.

---

## 10. Setup Runbook

### 10.1 Create Firebase Projects

Create projects:

```bash
swish-game-dev
swish-game-staging
swish-game-prod
```

For each project:

- enable Firebase.
- enable Firestore.
- enable Firebase Auth.
- enable Firebase Storage.
- enable Cloud Functions.
- enable Secret Manager.
- enable Cloud Logging.
- enable billing on staging/prod if required.

### 10.2 Configure `.firebaserc`

```json
{
  "projects": {
    "dev": "swish-game-dev",
    "staging": "swish-game-staging",
    "prod": "swish-game-prod"
  }
}
```

Set dev locally:

```bash
firebase use dev
```

### 10.3 Enable Auth Providers

For each environment, enable:

- Google provider.
- Email/password provider.

Configure OAuth redirect domains:

| Environment | Auth Domain |
|---|---|
| dev | `swish-game-dev.firebaseapp.com` |
| staging | `swish-game-staging.firebaseapp.com` |
| prod | `swish-game-prod.firebaseapp.com` |

Add local development domain:

```text
localhost
127.0.0.1
```

### 10.4 Configure Firebase Web Apps

Create one Firebase web app per environment.

Copy public config into:

- `.env.local` for dev local.
- CI environment variables for staging/prod frontend builds.

Example staging build env:

```env
VITE_APP_ENV=staging
VITE_FIREBASE_PROJECT_ID=swish-game-staging
VITE_USE_FIREBASE_EMULATORS=false
```

### 10.5 Configure Secret Manager

For each environment, create secrets.

Gemini:

```bash
firebase functions:secrets:set GEMINI_API_KEY --project swish-game-dev
firebase functions:secrets:set GEMINI_API_KEY --project swish-game-staging
firebase functions:secrets:set GEMINI_API_KEY --project swish-game-prod
```

Payments:

```bash
firebase functions:secrets:set PAYMENT_WEBHOOK_SECRET --project swish-game-staging
firebase functions:secrets:set PAYMENT_API_SECRET --project swish-game-staging
firebase functions:secrets:set PAYMENT_API_KEY --project swish-game-staging

firebase functions:secrets:set PAYMENT_WEBHOOK_SECRET --project swish-game-prod
firebase functions:secrets:set PAYMENT_API_SECRET --project swish-game-prod
firebase functions:secrets:set PAYMENT_API_KEY --project swish-game-prod
```

Only set `PAYMENT_API_KEY` if selected provider requires it.

### 10.6 Configure Non-Secret Server Env

Set non-secret env/config per environment:

```bash
APP_ENV=staging
FIREBASE_PROJECT_ID=swish-game-staging
BILLING_PROVIDER=other
GEMINI_MODEL=gemini-2.5-flash
PAYMENT_PRICE_AMOUNT=29.90
PAYMENT_CURRENCY=ILS
```

The final Gemini model ID must be verified against Google's current model list before production deploy.

### 10.7 Seed `system/config`

For dev/staging:

```bash
npm run seed:config -- --project swish-game-dev
npm run seed:config -- --project swish-game-staging
```

For prod:

- run only through approved deployment workflow.
- require review.
- verify no secrets in `system/config`.

### 10.8 Start Local Development

```bash
cp .env.example .env.local
firebase use dev
firebase emulators:start --project swish-game-dev
npm run dev
```

Verify:

- frontend connects to emulators.
- no production project ID appears in browser console.
- Auth emulator works.
- Firestore emulator receives writes.
- Functions emulator receives callable requests.
- Storage emulator receives uploads.

### 10.9 Deploy to Staging

```bash
npm run test
npm run build
firebase deploy --project swish-game-staging
```

Smoke tests:

- login.
- onboarding.
- public profile sync.
- discovery.
- text chat.
- shop read.
- `sendAIProfileReview` with staging/dev Gemini key if enabled.
- payment sandbox checkout if enabled.
- webhook sandbox event.

### 10.10 Deploy to Production

Production requirements:

- all tests green.
- staging smoke tests completed.
- secrets configured.
- Security Rules reviewed.
- Storage Rules reviewed.
- payment provider live config verified.
- manual approval complete.

Deploy:

```bash
firebase deploy --project swish-game-prod
```

Post-deploy:

- verify frontend project ID is `swish-game-prod`.
- verify no emulators enabled.
- verify login.
- verify Cloud Functions health.
- verify logs do not contain secrets.
- verify payment webhook endpoint signature rejection on invalid signatures.
- verify `system/config` values.

### 10.11 Emergency Secret Rotation

If secret leak suspected:

1. Disable affected feature flag if available.
2. Rotate provider/Gemini secret in provider console.
3. Update Secret Manager for affected environments.
4. Redeploy/restart affected Cloud Functions if necessary.
5. Audit logs for abuse.
6. Invalidate old webhook secret/provider key.
7. Document incident.

---

## 11. Open Items

| Item | Status | Impact |
|---|---|---|
| Final payment provider | Open via ADR-017 | Determines exact payment secrets, webhook headers, sandbox setup. |
| AI request limits by tier | Open via ADR-027 | Determines `system/config.limits.*` values. |
| Daily reset timezone | Open via ADR-029 | Determines usage counter date key. |
| Final `Platform` vocabulary | Open via ADR-030 | Impacts config validation and seed data. |
| Maximum `bio` length | Open via ADR-031 | Impacts frontend/backend validation config. |
| Pro-required cosmetics after expiration | Open via ADR-032 | May require feature flag/config. |
| Final Gemini model | Operational decision | `GEMINI_MODEL` must be verified before production deploy. |
| Region selection for Cloud Functions | Open | Impacts latency, compliance, and cost. |
| CI provider | Open | GitHub Actions recommended if repo is on GitHub. |
| Monitoring provider | Open | Cloud Logging/Error Reporting baseline; Sentry optional. |
| Secret rotation cadence | Open | Must be defined before production launch. |
| Production data access policy | Open | Needed for support/admin workflows. |
| Emulator seed dataset ownership | Open | Needs deterministic seed fixtures and reset commands. |


## הרשאת Cross-Service ל-Storage Rules (חובה בכל פרויקט!)

חוקי ה-Storage שלנו קוראים מסמכים מ-Firestore (`isNotSuspended`, `isProUser`, `isChatParticipant`). בענן זה דורש הענקה חד-פעמית של התפקיד `roles/firebaserules.firestoreServiceAgent` ל-service agent של Storage:

```
service-<PROJECT_NUMBER>@gcp-sa-firebasestorage.iam.gserviceaccount.com
```

בלי זה **כל ההעלאות נכשלות** עם `storage/unauthorized` (תמונות פרופיל, גלריה, הודעות וידאו) — האמולטור לא אוכף את זה ולכן הבאג לא נתפס מקומית (התגלה ותוקן ב-swish-game-dev ב-2026-07-10).

**לביצוע:** Firebase Console → Storage → Rules מציג כפתור הענקה אוטומטי, או `gcloud projects add-iam-policy-binding`. ⚠️ יש לחזור על זה ב-`swish-game-prod` לפני עלייה לאוויר.
