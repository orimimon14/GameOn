# Swish & Game — CI/CD Pipeline

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Production CI/CD Pipeline Contract |
| Repository Path | `docs/quality/CI_CD.md` |
| Product | Swish & Game |
| Source of Truth | `docs/architecture/ARCHITECTURE.md`, `docs/engineering/ENVIRONMENTS.md`, `docs/quality/TEST_STRATEGY.md`, `docs/quality/OBSERVABILITY.md`, `docs/architecture/SECURITY.md`, `docs/engineering/CONVENTIONS.md` |
| CI/CD Principle | backend-authoritative, security-first deploy |
| Environment Principle | every environment is separate; production is never used for local development |
| Production Gate | manual approval required |
| Preferred CI Provider | GitHub Actions, pending final confirmation |
| Deployment Target | Firebase Hosting, Firestore indexes/rules, Storage Rules, Cloud Functions |
| Secret Principle | secrets live in CI secret store / Secret Manager only; never in repo |
| Identity Principle | Workload Identity Federation preferred over long-lived service-account JSON |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Pipeline Overview](#2-pipeline-overview)
- [3. Branch → Environment Mapping](#3-branch--environment-mapping)
- [4. CI Stages — Pull Requests](#4-ci-stages--pull-requests)
- [5. Build & Bundle Safety](#5-build--bundle-safety)
- [6. Deployment](#6-deployment)
- [7. Secrets in CI](#7-secrets-in-ci)
- [8. Environment Protection](#8-environment-protection)
- [9. Preview / Staging Deploys](#9-preview--staging-deploys)
- [10. Production Deploy Gate](#10-production-deploy-gate)
- [11. Post-Deploy Smoke](#11-post-deploy-smoke)
- [12. Rollback Strategy](#12-rollback-strategy)
- [13. Release Versioning](#13-release-versioning)
- [14. CI Performance](#14-ci-performance)
- [15. Open Items](#15-open-items)

---

## 2. Pipeline Overview

### 2.1 CI/CD Goal

ה-CI/CD של Swish & Game נועד להבטיח שכל שינוי עובר בדיקות, build, security checks, rules tests ו-deploy מבוקר לפני שהוא מגיע ל-production.

ה-pipeline חייב להגן במיוחד על:

- Firestore Security Rules.
- Storage Rules.
- Cloud Functions שמחזיקות state רגיש.
- secrets.
- client bundle שלא יכיל secrets או Gemini ישיר.
- הפרדה מלאה בין `dev`, `staging`, `prod`.
- production deploy עם manual approval בלבד.

### 2.2 High-Level Flow

```text
Pull Request
  → install
  → typecheck
  → lint
  → unit/component tests
  → security rules tests
  → build
  → secret scan
  → forbidden bundle scan
  → optional integration tests

develop branch
  → all PR checks
  → deploy to swish-game-dev
  → dev smoke

main branch
  → all PR checks
  → deploy to swish-game-staging
  → staging smoke E2E

release tag
  → all checks
  → staging must be green
  → manual approval
  → deploy to swish-game-prod
  → production smoke
  → monitor dashboards/alerts
```

### 2.3 Pipeline Diagram

```text
feature branch
    |
    v
Pull Request
    |
    +--> typecheck
    +--> lint
    +--> unit/component tests
    +--> test:rules
    +--> build
    +--> secret scan
    +--> forbidden bundle scan
    |
    v
merge to develop
    |
    v
deploy dev: swish-game-dev
    |
    v
merge to main
    |
    v
deploy staging: swish-game-staging
    |
    +--> staging smoke E2E
    +--> payment sandbox smoke if enabled
    +--> AI staging smoke if enabled
    |
    v
release tag / manual approval
    |
    v
deploy prod: swish-game-prod
    |
    +--> production smoke
    +--> observability watch
```

### 2.4 Security-First Deploy Rule

Production deploy is allowed only after:

- PR checks pass.
- staging deploy passes.
- Security Rules tests pass.
- Storage Rules tests pass.
- forbidden bundle scan passes.
- manual approval is granted.
- deployment is executed through CI using protected environment credentials.

Local production deploy is forbidden except under a documented emergency process.

---

## 3. Branch → Environment Mapping

### 3.1 Canonical Mapping

| Branch / Trigger | Environment | Firebase Project | Deploy Type | Approval |
|---|---|---|---|---|
| Pull Request | emulator/test only | none / emulator project | no production deploy; optional preview | no |
| `develop` | dev | `swish-game-dev` | automatic dev deploy | no |
| `main` | staging | `swish-game-staging` | automatic staging deploy | optional reviewer |
| release tag | prod | `swish-game-prod` | protected production deploy | required manual approval |
| manual emergency workflow | prod | `swish-game-prod` | emergency rollback/hotfix only | required approval + incident record |

### 3.2 Pull Request Behavior

Pull requests must not deploy to Firebase production/staging by default.

Allowed PR actions:

- typecheck.
- lint.
- unit tests.
- component tests.
- rules tests.
- build.
- secret scan.
- forbidden bundle scan.
- optional Firebase Hosting preview channel if configured and isolated.
- optional emulator integration tests.

Forbidden PR actions:

- deploy to `swish-game-prod`.
- use production secrets.
- use production Firebase project.
- call real payment provider production endpoints.
- call real Gemini production key unless explicitly isolated in staging-only workflow.

### 3.3 `develop` Behavior

`develop` deploys to `swish-game-dev`.

Purpose:

- integration testing.
- QA of ongoing work.
- emulator-to-dev validation.
- development smoke checks.

### 3.4 `main` Behavior

`main` deploys to `swish-game-staging`.

Purpose:

- release candidate validation.
- staging smoke E2E.
- payment sandbox testing.
- AI staging-key testing.
- pre-production observability checks.

### 3.5 Release Tag Behavior

Release tags deploy to `swish-game-prod` only after manual approval.

Recommended tag format:

```text
v1.0.0
v1.0.1
v1.1.0
```

---

## 4. CI Stages — Pull Requests

### 4.1 Required PR Stage Matrix

| Stage | Command | Fail Condition |
|---|---|---|
| Checkout | `actions/checkout` | repo cannot be checked out |
| Setup Node | `actions/setup-node` | wrong Node version / install failure |
| Install | `npm ci` | dependency lock mismatch or install failure |
| Typecheck | `npm run typecheck` | TypeScript errors |
| Lint | `npm run lint` | lint errors |
| Unit tests | `npm run test` | failing unit/component tests |
| Security Rules tests | `npm run test:rules` | any allow/deny rule test fails |
| Build | `npm run build` | Vite/TypeScript build failure |
| Secret scan | `npm run scan:secrets` or configured scanner | secret-like value found |
| Forbidden bundle scan | `npm run scan:bundle` | forbidden string found in built bundle |
| Integration tests | `npm run test:integration` | optional in PR; required before staging/prod if adopted |

### 4.2 Stage Details

#### Install

```bash
npm ci
```

Rules:

- CI uses lockfile.
- Do not use `npm install` in CI.
- dependency update PRs must update lockfile intentionally.

#### Typecheck

```bash
npm run typecheck
```

Must catch:

- missing enum label coverage.
- API contract type drift.
- invalid imports.
- unsafe feature boundaries where typed.

#### Lint

```bash
npm run lint
```

Must catch:

- forbidden patterns configured in ESLint.
- unused dead prototype imports.
- direct provider imports where lint rules exist.
- code style issues.

#### Unit / Component Tests

```bash
npm run test
```

Includes:

- unit tests.
- component tests.
- hooks tests where possible.
- label maps tests.
- formatters.
- error mapping.
- Zod schemas.

#### Security Rules Tests

```bash
npm run test:rules
```

Must run with Firebase Emulator Suite.

Must include deny matrix for:

- `coins`.
- `isPro`.
- `subscriptionTier`.
- `subscriptionStatus`.
- `subscriptionExpiresAt`.
- `matches`.
- `swipes`.
- `subscriptions`.
- `transactions`.
- direct image chat message writes.
- `shopItems`.
- `gameCatalog`.
- non-participant chat reads/writes.

#### Build

```bash
npm run build
```

Build must fail if:

- TypeScript build fails.
- Vite cannot resolve env/config.
- bundle generation fails.
- forbidden client env is required.

#### Secret Scan

Recommended:

```bash
npm run scan:secrets
```

or a tool such as:

```bash
gitleaks detect --source .
```

Fail if repo contains:

- service-account JSON.
- API keys.
- webhook secrets.
- payment secrets.
- Gemini keys.
- private `.env` content.

#### Forbidden Bundle Scan

Run after `npm run build`.

```bash
npm run scan:bundle
```

Must fail if built frontend bundle contains forbidden strings.

Canonical forbidden strings:

```text
GEMINI_API_KEY
PAYMENT_WEBHOOK_SECRET
PAYMENT_API_SECRET
PAYMENT_API_KEY
PAYMENT_*_SECRET
process.env.API_KEY
gemini-3-flash-preview
```

---

## 5. Build & Bundle Safety

### 5.1 Vite Environment Rule

Only `VITE_*` variables are allowed in the client bundle.

Allowed client env examples:

```text
VITE_APP_ENV
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Forbidden client env examples:

```text
GEMINI_API_KEY
API_KEY
PAYMENT_WEBHOOK_SECRET
PAYMENT_API_SECRET
PAYMENT_API_KEY
SERVICE_ACCOUNT_JSON
ADMIN_INTERNAL_SECRET
```

### 5.2 No Client Secrets

The frontend must never contain:

- Gemini API key.
- payment provider secret.
- webhook signing secret.
- service account JSON.
- admin credential.
- raw Secret Manager values.

### 5.3 Forbidden Bundle Scan Script

Recommended script:

```bash
#!/usr/bin/env bash
set -euo pipefail

BUILD_DIR="${1:-dist}"

FORBIDDEN_PATTERNS=(
  "GEMINI_API_KEY"
  "PAYMENT_WEBHOOK_SECRET"
  "PAYMENT_API_SECRET"
  "PAYMENT_API_KEY"
  "process.env.API_KEY"
  "gemini-3-flash-preview"
)

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  if grep -R --line-number --binary-files=without-match "$pattern" "$BUILD_DIR"; then
    echo "Forbidden bundle string found: $pattern"
    exit 1
  fi
done

if grep -R --line-number --binary-files=without-match -E "PAYMENT_.*_SECRET" "$BUILD_DIR"; then
  echo "Forbidden payment secret-like string found"
  exit 1
fi

echo "Bundle scan passed."
```

Recommended `package.json` entry:

```json
{
  "scripts": {
    "scan:bundle": "bash scripts/scan-bundle.sh dist"
  }
}
```

### 5.4 Bundle Safety Checks

CI should verify:

| Check | Requirement |
|---|---|
| no secret strings | required |
| no direct Gemini client code | required |
| no `@google/genai` in frontend bundle | required |
| no `gemini-3-flash-preview` | required |
| no production emulator flags | required |
| correct `VITE_APP_ENV` | environment-specific |
| correct Firebase project ID | environment-specific |

### 5.5 Dependency Safety

Recommended checks:

```bash
npm audit --audit-level=high
```

Policy is open, but production deploy should not ignore critical dependency vulnerabilities without explicit risk acceptance.

---

## 6. Deployment

### 6.1 Deployment Tooling

Use Firebase CLI in CI.

Recommended commands:

```bash
firebase deploy --project swish-game-dev
firebase deploy --project swish-game-staging
firebase deploy --project swish-game-prod
```

Production deploy must be CI-only through protected environment.

### 6.2 Deployment Order

Canonical deployment order:

```text
1. Firestore indexes
2. Firestore Security Rules
3. Storage Rules
4. Cloud Functions
5. Firebase Hosting
6. Post-deploy smoke
```

### 6.3 Why This Order

| Step | Why |
|---|---|
| indexes first | functions/queries may require indexes before traffic |
| Security Rules before app | prevent permissive client surface |
| Storage Rules before app | protect uploads/media paths |
| Cloud Functions before hosting | app may call new backend contracts |
| hosting after backend | frontend should point to ready APIs |
| smoke last | verifies deployed system |

### 6.4 Firebase Deploy Commands

Recommended split deploy:

```bash
firebase deploy --project "$FIREBASE_PROJECT_ID" --only firestore:indexes
firebase deploy --project "$FIREBASE_PROJECT_ID" --only firestore:rules
firebase deploy --project "$FIREBASE_PROJECT_ID" --only storage
firebase deploy --project "$FIREBASE_PROJECT_ID" --only functions
firebase deploy --project "$FIREBASE_PROJECT_ID" --only hosting
```

If deployment is atomic enough for a given release, a combined deploy is allowed only after risk review:

```bash
firebase deploy --project "$FIREBASE_PROJECT_ID"
```

For production, prefer explicit staged deploy commands for better failure visibility.

### 6.5 Secrets Before Functions

Secrets must exist before deploying functions that reference them.

Required server-side secrets may include:

```text
GEMINI_API_KEY
PAYMENT_WEBHOOK_SECRET
PAYMENT_API_SECRET
PAYMENT_API_KEY
ADMIN_INTERNAL_SECRET
```

Rules:

- configure secrets in Secret Manager per environment.
- do not store secret values in repo.
- do not echo secret values in CI logs.
- CI should check secret existence by name only where possible.
- functions must bind secrets explicitly.

### 6.6 Environment-Specific Config

Each environment must have its own:

- Firebase project.
- web app config.
- Secret Manager secrets.
- payment provider sandbox/prod config.
- analytics/observability config.
- `system/config`.

### 6.7 `system/config` Deploy/Seed

`system/config` contains non-secret runtime flags and limits.

CI may deploy/verify config, but seed scripts must refuse production unless explicitly run through approved prod process.

Production config update rules:

- reviewed PR or protected admin workflow.
- no local prod writes.
- audit log when possible.
- smoke check after update.

### 6.8 Deploy Failures

If a deploy step fails:

| Failure Step | Action |
|---|---|
| indexes | stop deploy; do not deploy app/backend |
| Security Rules | stop deploy; do not deploy app |
| Storage Rules | stop deploy; do not deploy media-related app changes |
| Functions | stop deploy; do not deploy frontend relying on new functions |
| Hosting | backend may be live; assess compatibility |
| Smoke | treat as failed deploy; rollback or disable feature |

---

## 7. Secrets in CI

### 7.1 Secret Storage

Use:

- GitHub Actions encrypted secrets / environments.
- Google Secret Manager.
- Workload Identity Federation.

Do not use:

- committed `.env`.
- service-account JSON in repo.
- copied secrets in workflow YAML.
- secrets printed to logs.
- production secrets in PR workflows.

### 7.2 GitHub Actions Environments

Recommended environments:

```text
dev
staging
prod
```

Each environment should have:

| Environment | Secrets / Variables |
|---|---|
| `dev` | WIF provider/service account for `swish-game-dev`; non-prod config |
| `staging` | WIF provider/service account for `swish-game-staging`; sandbox provider config |
| `prod` | WIF provider/service account for `swish-game-prod`; protected approval |

### 7.3 Workload Identity Federation

Workload Identity Federation is preferred because it avoids long-lived service-account JSON.

Recommended pattern:

```yaml
- id: auth
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
    service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}
```

### 7.4 Service Account Permissions

Use least privilege.

Recommended deployment service accounts per environment:

```text
firebase-deployer-dev@swish-game-dev.iam.gserviceaccount.com
firebase-deployer-staging@swish-game-staging.iam.gserviceaccount.com
firebase-deployer-prod@swish-game-prod.iam.gserviceaccount.com
```

Permissions should be scoped to deploy required resources, not broad owner access where avoidable.

### 7.5 Secret Logging Rules

Forbidden in CI logs:

```text
echo $GEMINI_API_KEY
echo $PAYMENT_WEBHOOK_SECRET
cat service-account.json
printenv
firebase functions:config:get
```

Avoid broad environment dumps.

### 7.6 PR Secret Safety

Pull requests from forks must not receive secrets.

Rules:

- no production/staging secrets in PR.
- no provider production APIs in PR.
- no production Firebase deploy in PR.
- emulator-only testing in PR.

---

## 8. Environment Protection

### 8.1 Production Protection

Production environment must require:

- manual approval.
- required reviewers.
- branch/tag restrictions.
- successful staging workflow.
- successful security checks.
- deployment audit.

### 8.2 Required Reviewers

Recommended reviewers:

- Engineering owner.
- Security/backend owner for rules/functions changes.
- Product owner for release readiness where needed.
- Payment owner for billing changes.

### 8.3 Protection Rules

| Rule | Requirement |
|---|---|
| `prod` deploy from tag only | required |
| manual approval | required |
| no local prod deploy | required |
| secrets scoped to `prod` environment | required |
| staging green before prod | required |
| rules tests green | required |
| smoke after deploy | required |

### 8.4 Emergency Deploys

Emergency production deploys require:

- incident ID or incident note.
- manual approval.
- minimal change scope.
- post-incident review.
- follow-up PR if hotfix bypassed normal flow.

---

## 9. Preview / Staging Deploys

### 9.1 Preview Deploys

Preview deploys are optional and open.

If enabled, preview deploys must:

- use isolated preview hosting channel.
- use dev/emulator or safe dev Firebase config.
- never use production secrets.
- clearly label environment.
- expire automatically.

Recommended:

```bash
firebase hosting:channel:deploy pr-${PR_NUMBER} --project swish-game-dev --expires 7d
```

### 9.2 Staging Deploys

Staging is the release candidate environment.

Staging deploy from `main` should run:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:rules
npm run build
npm run scan:bundle
firebase deploy --project swish-game-staging
npm run test:e2e:staging
```

### 9.3 Staging Smoke E2E

Required smoke flows:

- app loads.
- `/login` renders.
- auth flow with staging test user if configured.
- onboarding/discovery route guards.
- Firestore `system/config` read.
- basic callable smoke if available.
- no emulator endpoints.
- no forbidden bundle strings.

### 9.4 Payment Sandbox

If payments are enabled in staging:

- use payment provider sandbox.
- test invalid webhook signature rejection.
- test sandbox checkout session creation.
- test sandbox verified webhook activation.
- verify no Pro is granted from redirect alone.
- verify `subscriptions/{uid}` is updated only by webhook/reconciliation.

### 9.5 AI Staging Key

If AI is enabled in staging:

- use staging-only `GEMINI_API_KEY`.
- never expose it in frontend.
- verify callable proxy only.
- verify AI feature flag behavior.
- verify safe errors/refusals.
- verify no prompt/response in logs.

---

## 10. Production Deploy Gate

### 10.1 Required Checklist

Production deploy may proceed only when:

- [ ] PR checks passed.
- [ ] `main` / staging deploy is green.
- [ ] staging smoke E2E passed.
- [ ] `npm run typecheck` passed.
- [ ] `npm run lint` passed.
- [ ] `npm run test` passed.
- [ ] `npm run test:rules` passed.
- [ ] `npm run build` passed.
- [ ] forbidden bundle scan passed.
- [ ] secret scan passed.
- [ ] Firestore Security Rules reviewed if changed.
- [ ] Storage Rules reviewed if changed.
- [ ] Cloud Functions reviewed if sensitive logic changed.
- [ ] Secret Manager secrets exist for prod if required.
- [ ] manual approval granted.
- [ ] deploy is through CI protected environment.
- [ ] no local prod deploy.
- [ ] rollback plan understood.

### 10.2 Sensitive Change Checklist

If the release changes any of these areas, require extra review:

| Area | Extra Review |
|---|---|
| Firestore Security Rules | security/backend owner |
| Storage Rules | security/backend owner |
| `submitSwipe` | backend/product owner |
| `purchaseShopItem` / coins | backend/economy owner |
| `paymentWebhook` | billing/backend owner |
| subscription entitlement | billing/backend owner |
| AI integration | backend/AI owner |
| auth/onboarding gates | frontend/backend owner |
| `system/config` defaults | platform/product owner |

### 10.3 Production Deploy Command

Production deploy should be executed by CI, not by a developer laptop.

CI command pattern:

```bash
firebase deploy --project swish-game-prod --only firestore:indexes
firebase deploy --project swish-game-prod --only firestore:rules
firebase deploy --project swish-game-prod --only storage
firebase deploy --project swish-game-prod --only functions
firebase deploy --project swish-game-prod --only hosting
```

### 10.4 Production Failure Rule

If production smoke fails:

1. stop further rollout.
2. assess user impact.
3. rollback hosting/functions if needed.
4. use `system/config` kill switches if safer.
5. notify engineering channel.
6. open incident if user-impacting.

---

## 11. Post-Deploy Smoke

### 11.1 Smoke Checklist

After staging/prod deploy:

- [ ] app loads.
- [ ] `/login` renders.
- [ ] Firebase project ID matches target environment.
- [ ] no emulator endpoints enabled in prod.
- [ ] `system/config` is readable.
- [ ] protected routes redirect correctly.
- [ ] one safe callable health/smoke check passes if available.
- [ ] invalid `paymentWebhook` signature is rejected.
- [ ] no forbidden secret strings in bundle.
- [ ] no new Cloud Functions error spike.
- [ ] no Sentry frontend exception spike.
- [ ] no secrets appear in logs.
- [ ] feature flags are expected.

### 11.2 Post-Deploy Monitoring Window

After production deploy, monitor for at least:

```text
30–60 minutes
```

Watch:

- Cloud Functions error rate.
- `paymentWebhook` failures.
- `submitSwipe` failures.
- `purchaseShopItem` failures.
- Firestore quota/rule denials.
- frontend Sentry spikes.
- AI cost/error spikes if AI changed.
- Storage abuse/failures if media changed.

### 11.3 Smoke Command Examples

```bash
curl -I https://<hosting-domain>
```

If health endpoint exists:

```bash
curl https://<functions-health-url>/health
```

Invalid webhook smoke must expect rejection:

```bash
curl -X POST https://<payment-webhook-url> \
  -H "Content-Type: application/json" \
  -H "x-provider-signature: invalid" \
  -d '{"test": true}'
```

Expected result:

```text
401 or 400
```

not success.

---

## 12. Rollback Strategy

### 12.1 Rollback Principles

Rollback must restore safety first.

Do not rollback Security Rules to a more permissive version without review.

If a feature is broken but data/security is safe, prefer a feature flag kill switch before risky rollback.

### 12.2 Rollback Tools

| Area | Rollback Option |
|---|---|
| Hosting | rollback to previous Firebase Hosting release |
| Cloud Functions | redeploy previous commit/tag |
| Firestore Rules | redeploy previous reviewed secure rules |
| Storage Rules | redeploy previous reviewed secure rules |
| `system/config` | disable affected feature flag |
| Firestore indexes | usually forward-fix; index rollback rarely needed |
| Secrets | rotate/revert secret versions carefully |

### 12.3 Feature Flags

Use `system/config` kill switches for risky systems:

```text
aiHubEnabled
proSubscriptionEnabled
shopEnabled
mediaUploadEnabled
reportsEnabled
```

Examples:

| Incident | First Mitigation |
|---|---|
| AI provider/cost spike | `aiHubEnabled = false` |
| payment checkout issue | `proSubscriptionEnabled = false` |
| shop/economy issue | `shopEnabled = false` |
| media abuse/storage issue | `mediaUploadEnabled = false` |
| report function regression | keep `reportsEnabled` true if possible; safety features should be disabled only as last resort |

### 12.4 Rules Rollback Warning

Rules rollback is high risk.

Never deploy permissive rules to fix UX quickly.

Rules changes require:

- review.
- `npm run test:rules`.
- staging validation.
- production smoke.

### 12.5 Data Migration Rollback

If a release includes data migration:

- prepare rollback/forward-fix plan before deploy.
- make migrations idempotent.
- log migration `request_id`.
- do not run migration locally against prod.
- test on staging with production-like fixtures.

### 12.6 Failed Deploy Recovery

| Failure | Recovery |
|---|---|
| hosting only failed | retry hosting or keep previous hosting |
| functions failed after rules deployed | assess compatibility; rollback rules if needed |
| rules failed | stop deploy; no app deploy |
| smoke failed after full deploy | rollback/kill switch depending severity |
| secret missing | add/restore secret and redeploy functions |
| payment webhook broken | disable payments; replay/reconcile after fix |

---

## 13. Release Versioning

### 13.1 Versioning Strategy

Use semantic versioning:

```text
MAJOR.MINOR.PATCH
```

Examples:

```text
v1.0.0
v1.1.0
v1.1.1
```

### 13.2 Version Meaning

| Type | Meaning | Example |
|---|---|---|
| MAJOR | breaking architecture/data/API change | `v2.0.0` |
| MINOR | new feature or significant capability | `v1.1.0` |
| PATCH | bugfix/security fix/minor improvement | `v1.1.1` |

### 13.3 Release Artifacts

Each release should include:

- Git tag.
- GitHub release notes.
- CHANGELOG entry.
- commit SHA.
- environment deployed.
- deploy timestamp.
- migration notes if any.
- rollback notes.

### 13.4 CHANGELOG

Recommended format:

```md
## v1.1.0 — YYYY-MM-DD

### Added
- Added `createCheckoutSession` flow.

### Changed
- Updated Pro gating copy.

### Fixed
- Fixed `submitSwipe` duplicate handling.

### Security
- Tightened Storage Rules for chat media.

### Migration
- Added Firestore index for discovery query.
```

### 13.5 Commit Conventions

Use conventional commits aligned with `CONVENTIONS.md`.

Examples:

```text
feat(discovery): add swipe deck callable integration
fix(payments): prevent Pro grant before webhook
test(rules): deny direct subscription writes
docs(ci): add production deploy gate
```

### 13.6 Release Branches

Release branch strategy is open.  
For MVP, release tags from `main` are enough unless hotfix complexity grows.

---

## 14. CI Performance

### 14.1 Goals

CI should be:

- fast enough for PR feedback.
- reliable.
- deterministic.
- parallel where safe.
- cached where safe.
- emulator-efficient.

### 14.2 Caching

Use Node/npm cache:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: npm
```

Do not cache:

- secrets.
- `.env` files.
- Firebase emulator data containing sensitive data.
- build output across environment-specific builds unless carefully validated.

### 14.3 Parallelization

Recommended split:

| Job | Runs In Parallel? |
|---|---:|
| typecheck | yes |
| lint | yes |
| unit/component tests | yes |
| rules tests | yes, but emulator startup isolated |
| build | after install; can run parallel after typecheck policy decision |
| bundle scan | after build |
| integration tests | separate optional job |

### 14.4 Emulator Startup

Rules/integration tests should start only required emulators.

Recommended:

```bash
firebase emulators:exec --project swish-game-dev "npm run test:rules:run"
```

Avoid keeping long-running emulator processes in CI when `emulators:exec` is enough.

### 14.5 Flake Reduction

Use:

- deterministic seed data.
- no arbitrary waits.
- isolated test users.
- emulator reset between suites where needed.
- provider stubs for payment/Gemini.
- no production network calls.

### 14.6 Workflow Time Budget

Recommended target:

| Workflow | Target Duration |
|---|---:|
| PR core checks | `< 10 minutes` |
| PR with integration | `< 15 minutes` |
| staging deploy + smoke | `< 20 minutes` |
| production deploy + smoke | `< 20 minutes` excluding approval wait |

---

## 15. Example GitHub Actions Workflow

### 15.1 PR Checks Workflow

```yaml
name: CI

on:
  pull_request:
    branches:
      - develop
      - main

permissions:
  contents: read

jobs:
  checks:
    name: PR Checks
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Unit and Component Tests
        run: npm run test

      - name: Security Rules Tests
        run: npm run test:rules

      - name: Build
        run: npm run build
        env:
          VITE_APP_ENV: test
          VITE_FIREBASE_API_KEY: test
          VITE_FIREBASE_AUTH_DOMAIN: test.firebaseapp.com
          VITE_FIREBASE_PROJECT_ID: swish-game-dev
          VITE_FIREBASE_STORAGE_BUCKET: swish-game-dev.appspot.com
          VITE_FIREBASE_MESSAGING_SENDER_ID: "000000000000"
          VITE_FIREBASE_APP_ID: "1:000000000000:web:test"

      - name: Forbidden Bundle Scan
        run: npm run scan:bundle

      - name: Secret Scan
        run: npm run scan:secrets
```

### 15.2 Staging Deploy Workflow

```yaml
name: Deploy Staging

on:
  push:
    branches:
      - main

permissions:
  contents: read
  id-token: write

jobs:
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install
        run: npm ci

      - name: Checks
        run: |
          npm run typecheck
          npm run lint
          npm run test
          npm run test:rules

      - name: Build
        run: npm run build
        env:
          VITE_APP_ENV: staging
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ vars.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: swish-game-staging
          VITE_FIREBASE_STORAGE_BUCKET: ${{ vars.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ vars.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ vars.VITE_FIREBASE_APP_ID }}

      - name: Forbidden Bundle Scan
        run: npm run scan:bundle

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

      - name: Setup Firebase CLI
        run: npm install -g firebase-tools

      - name: Deploy Firestore Indexes
        run: firebase deploy --project swish-game-staging --only firestore:indexes

      - name: Deploy Firestore Rules
        run: firebase deploy --project swish-game-staging --only firestore:rules

      - name: Deploy Storage Rules
        run: firebase deploy --project swish-game-staging --only storage

      - name: Deploy Functions
        run: firebase deploy --project swish-game-staging --only functions

      - name: Deploy Hosting
        run: firebase deploy --project swish-game-staging --only hosting

      - name: Staging Smoke
        run: npm run smoke:staging
```

### 15.3 Production Deploy Workflow

```yaml
name: Deploy Production

on:
  push:
    tags:
      - "v*.*.*"

permissions:
  contents: read
  id-token: write

jobs:
  deploy-prod:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment: prod

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install
        run: npm ci

      - name: Required Checks
        run: |
          npm run typecheck
          npm run lint
          npm run test
          npm run test:rules

      - name: Build
        run: npm run build
        env:
          VITE_APP_ENV: prod
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ vars.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: swish-game-prod
          VITE_FIREBASE_STORAGE_BUCKET: ${{ vars.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ vars.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ vars.VITE_FIREBASE_APP_ID }}

      - name: Forbidden Bundle Scan
        run: npm run scan:bundle

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

      - name: Setup Firebase CLI
        run: npm install -g firebase-tools

      - name: Deploy Firestore Indexes
        run: firebase deploy --project swish-game-prod --only firestore:indexes

      - name: Deploy Firestore Rules
        run: firebase deploy --project swish-game-prod --only firestore:rules

      - name: Deploy Storage Rules
        run: firebase deploy --project swish-game-prod --only storage

      - name: Deploy Functions
        run: firebase deploy --project swish-game-prod --only functions

      - name: Deploy Hosting
        run: firebase deploy --project swish-game-prod --only hosting

      - name: Production Smoke
        run: npm run smoke:prod
```

Production workflow must be protected by GitHub Environment approval.

---

## 16. Open Items

| Item | Status | Impact |
|---|---|---|
| Final CI provider | Open; GitHub Actions recommended | Determines exact workflow syntax and identity setup. |
| Workload Identity Federation setup | Open | Needed to remove service-account JSON risk. |
| Firebase Hosting preview channels | Open | Useful for PR QA but must avoid prod secrets. |
| Visual regression testing | Open | Could use Playwright screenshots or Storybook/Chromatic. |
| Full integration test requirement in PR | Open | Balance CI time vs confidence. |
| E2E staging account strategy | Open | Need deterministic test users and safe reset process. |
| Payment sandbox provider | Open via provider decision | Determines staging payment workflow. |
| AI staging budget/key | Open | Needed for safe AI smoke testing. |
| Release branch strategy | Open | Tags from `main` are enough for MVP unless hotfixes grow. |
| Automated production smoke | Open | Manual initially; should be automated before launch. |
| Alert integration with deploys | Open | Add deploy markers to observability dashboards. |
| Database migration framework | Open | Needed if schema migrations become complex. |
| Dependency vulnerability policy | Open | Define exact fail level for `npm audit`/scanner. |
| Rules deploy review ownership | Open | Define required reviewers for security-sensitive changes. |
