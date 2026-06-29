# Stale Docs (Archived)

These documents are **superseded** and kept only for historical reference.
Do **not** treat them as a source of truth — they conflict with the current canonical specs.

| Archived file | Superseded by | Why |
|---|---|---|
| `PRODUCT_REQUIREMENTS.md` | Product Requirements Document (PDF, v1.0) | Thinner and conflicts with the canonical PRD (personas, scope, monetization). KPI targets from this file were ported forward. |
| `DATABASE_SCHEMA.md` | Swish & Game Architecture (PDF, v1.0) | Simplified schema missing the `users`/`publicProfiles` public-vs-private split, `discoveryProfiles`, `subscriptions`, and audit collections. |
| `TEST_PLAN.md` | `docs/quality/TEST_STRATEGY.md` (v2.0) | Short early test plan; superseded by the expanded, consolidated Test Strategy (pyramid, rules deny matrix, function tests, E2E, CI). |
| `DEVELOPMENT_PLAN.md` | `docs/product/ROADMAP.md` | Early prototype-stage plan; superseded by the canonical phase-based Product & Delivery Roadmap (scope tiers, dependency chain, milestones). |
| `LAUNCH_CHECKLIST.md` | `docs/product/ROADMAP.md` §9 | Early go-to-market checklist; folded into the canonical Launch Readiness / Go-Live Checklist (security, CI/CD gate, payments, T&S, legal, observability, go/no-go). |

## Reconciliation decisions (Tier 0)

The following canonical decisions were made when archiving these files:

1. **PRD** — English PDF is canonical.
2. **Schema** — Architecture PDF schema is canonical (tiered into an MVP subset vs. scale-only collections).
3. **`skillLevel`** — stored as lowercase English enum `beginner | intermediate | pro | elite`; Hebrew used only as UI labels. (Replaces the code's 3-value Hebrew enum.)
4. **Name** — "Swish & Game" is canonical; the previous working name and the `dogame` CSS namespace are deprecated legacy.
5. **Coins** — granted in MVP; real-money coin packs deferred to V1.
6. **Design tokens** — reconcile code to the spec (amber accent `#F59E0B`, not the code's cyan `#22D3EE`).
