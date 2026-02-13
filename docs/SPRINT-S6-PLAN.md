# Sprint S6 Planning Document
## Snang.my / Qontrek Authority Engine

---

| Field | Value |
|-------|-------|
| **Sprint** | S6 |
| **Planning Date** | 12 February 2026 |
| **Predecessor** | S5 (completed) + Post-Sprint Sessions 1-4 |
| **Goal** | Demo hardening, seed execution, QA sign-off, and pilot-readiness |
| **Duration** | 4 core sessions (S6.1 – S6.4) + 1 stretch (S6.5) |
| **PRD Basis** | PRD v3.6.1 (released) + v3.6.3 Implementation Roadmap (working draft, 7 Feb 2026) |

---

## 1. Where We Are

### Completed Work

| Sprint/Session | Scope | Status |
|----------------|-------|--------|
| Sprint 0 (S0.1–S0.7) | PDPA Hard Gate — consent schema, UI gate, auth ledger, comms gating, breach scaffold, 108 bilingual strings | Done |
| Sprint S5 | Core workflow engine — 10 migrations, 22 tables, 37 API routes, 15 demo pages, 58 components | Done |
| S5 UI Sessions 1–6 | Animation system, progressive disclosure, trust UI, i18n, mobile-first, integration QA checklist | Done |
| Post-Sprint Session 1 | B03 DSR check wiring + bug fixes (walkthrough iframe, duplicate banner) | Done |
| Post-Sprint Session 2 | A35 End-to-End Smoke Test — 0 production TypeScript errors, full audit report | Done |
| Post-Sprint Session 3 | A09 WhatsApp Agent Notification — API route + component + seed template | Done |
| Post-Sprint Session 4 | A37 Legal Prep — PDPA Privacy Notice v1.1 SQL (corrected with v1.0 supersession, summaries, audit metadata) | Done |

### Current State Metrics

| Metric | Value |
|--------|-------|
| TypeScript production errors | **0** |
| API route files | **37** (10 clean, 20 minor, 5 notable per A35 audit) |
| Database migrations | **10** (001–010), 22 tables |
| Buyer pages | **9** (all functional with fallbacks) |
| Agent pages | **2** (dashboard + case detail) |
| Developer pages | **3** (dashboard + proof log + property console) |
| Feature flags | **9** (3 presets: demo, pilot, production) |
| Seed files ready | **3** (demo data, WhatsApp template, privacy notice v1.1) |
| Seeds executed | **0 of 3** (blocking for demo — validated clean, awaiting SQL Editor access) |
| QA manual checkboxes | **0 of 55** signed off (34/36 statically verifiable items PASS, 21 require live browser) |
| S6.3 API hardening | **COMPLETE** — 4 fixes applied (N2 was already resolved), consumer regression caught and fixed |
| S6.4 buyer portal wiring | **COMPLETE** — buyer portal wired to live API (cases + consent), fallback demo data preserved |

---

## 2. Blocking Actions (Pre-Sprint)

These must be done before S6 sessions begin. They require Supabase SQL Editor access.

| # | Action | SQL File | Risk |
|---|--------|----------|------|
| B1 | Run seed-demo-data.sql | `supabase/seed/seed-demo-data.sql` | Low — inserts Nur Adilah test case (QTK-2026-DEMO1) with deliberate gred mismatch for cross-validation demo |
| B2 | Run seed-whatsapp-template.sql | `supabase/seed/seed-whatsapp-template.sql` | Low — inserts agent_case_alert template into whatsapp_templates |
| B3 | Run update-privacy-notice-v1.1.sql | `supabase/seed/update-privacy-notice-v1.1.sql` | Low — supersedes v1.0, inserts v1.1 with placeholders. **Note:** Replace `[NO. SYARIKAT]`, `[ALAMAT]`, `[TELEFON]`, `[TARIKH]` before running in production |

**Run order:** B1 → B2 → B3 (B1 must go first as other seeds reference case data context)

---

## 3. Sprint S6 Sessions

### S6.1 — Seed Execution + Live Verification

**Goal:** Execute all pending seeds and verify the live demo path end-to-end.

| Task | Description | Deliverable |
|------|-------------|-------------|
| Execute B1–B3 | Run all 3 seed files in Supabase SQL Editor | Verification screenshots or query output |
| Live smoke test | Walk through buyer flow on snang.my: `/buyer/start` → consent → upload → upload-complete → temujanji | Pass/fail report per page |
| Agent verification | Open `/agent` → verify Nur Adilah case appears → open case detail → verify readiness panel + WhatsApp notification button | Working case with gred mismatch flagged |
| Developer verification | Open `/developer` → verify aggregate counts → open `/developer/proof` → verify proof events from consent + upload | Events visible in proof log |
| API health check | Run `npm run demo:health` (7 routes return 200) | Green health check |

**Exit Criteria:** All 3 demo paths (buyer, agent, developer) functional with live Supabase data.

---

### S6.2 — QA Sign-Off Completion

**Goal:** Complete all 55 manual QA checks from SESSION-6-QA-SIGNOFF.md (34 pre-verified by static analysis, 21 require live browser).

**Pre-Verification Status:** S6.2 static pre-verification complete. See `docs/S6-2-STATIC-PREVERIFICATION.md` for the 34 items that pass code inspection. Remaining 21 items (cross-browser, device, accessibility, pre-deploy) require a dedicated browser session.

| Category | Checks | What to Verify |
|----------|--------|----------------|
| Backend impact | 5 checks | No new API calls in Network tab, no DB writes from UI components, existing upload/booking still work |
| Feature flags | 4 flags | Toggle each flag (animation, trust UI, i18n, progressive disclosure) and verify on/off behaviour |
| Animation system | 5 checks | Device tier detection, localStorage persistence, FPS degradation, reduced-motion, kill-switch |
| Progressive disclosure | 6 checks | Collapsible sections, accordion modes, ReadMore truncation, StepCards, keyboard navigation |
| Trust UI | 5 checks | TrustStrip badges, InlineTrustIndicator, PrivacyNoteCTA, ConsentIndicator read-only |
| i18n localization | 5 checks | BM/EN toggle, localStorage persistence, no layout shift, text overflow, all strings translated |
| Mobile-first | 5 checks | Touch targets 44px, viewport meta, no horizontal scroll, responsive breakpoints |

**Deliverable:** Updated SESSION-6-QA-SIGNOFF.md with all checkboxes marked and sign-off signatures.

**Exit Criteria:** All manual QA checks pass. Document signed by QA.

---

### S6.3 — API Hardening (A35 Notable Issues)

**Goal:** Address the 5 notable API issues identified in the A35 smoke test AND document the new response contracts for S6.4 consumption.

| # | Route | Issue (from A35) | Fix | Status |
|---|-------|------------------|-----|--------|
| N1 | POST /api/readiness | No input validation on salary/commitments — negative numbers accepted | Zod v4 schema validation with field-level error details | ✅ DONE |
| N2 | POST /api/documents/upload | File size and type not validated server-side | **Already resolved** — 20MB limit + MIME whitelist already present | ✅ N/A |
| N3 | GET /api/cases | No pagination cap — default limit too high | Page-based pagination (`?page=1&limit=20`), max cap 100, total count in response | ✅ DONE |
| N4 | POST /api/proof-events | Missing event_type validation — accepts arbitrary strings | Validated against 15 known event types at application layer | ✅ DONE |
| N5 | GET /api/properties | Response includes internal IDs without need | `.select()` whitelist — removed `qr_*`, `created_at`, `updated_at` | ✅ DONE |

**Post-Review Fix:** N3 default limit change (50→20) silently broke 3 dashboard consumers that compute client-side aggregates. Fixed by adding explicit `?limit=100` to agent dashboard, developer dashboard, and PropertyConsole. See `docs/API-CHANGES-S6.3.md` "Consumer Fixes Applied" section.

**S6.3 → S6.4 Dependency (API Contract Documentation):**

S6.4 wires the buyer portal against routes hardened in S6.3. To prevent the frontend hitting unexpected response shapes, S6.3 must produce a contract document covering:

| Route | What changes | S6.4 impact |
|-------|-------------|-------------|
| GET /api/cases | New paginated response: `{ data: [], page, limit, total }` | S6.4 must unwrap `.data` array instead of using raw response |
| POST /api/readiness | Zod validation errors return `{ error, details: ZodIssue[] }` | S6.4 error handling must display field-level validation messages |
| GET /api/properties | Reduced field set (no internal IDs) | S6.4 must use only whitelisted fields |

**Deliverable:** Updated route files with input validation, pagination, and field whitelisting. API contract changelog in inline JSDoc or a brief `API-CHANGES-S6.3.md`.

**Exit Criteria:** TypeScript compiles clean. Re-run targeted smoke checks on fixed routes. Contract doc reviewed before S6.4 begins.

---

### S6.4 — Buyer Portal Dashboard Wiring ✅ COMPLETE

**Goal:** Replace hardcoded demo data in `/buyer/page.tsx` with live API data.

The buyer portal dashboard (`/buyer/page.tsx`) previously used hardcoded `propertyData` and `consentData` objects. Now wired to live APIs.

| Task | Description | Status |
|------|-------------|--------|
| Wire case status | Fetch buyer's case from `/api/cases?buyer_hash=...&limit=1` — reads S6.3 paginated response shape | ✅ DONE |
| Wire consent status | Fetch from `/api/consent/status?buyer_hash=...` — derive consent type labels from boolean flags | ✅ DONE |
| Wire property info | Property name + developer name come from cases join (no separate fetch needed) | ✅ DONE |
| Fallback handling | Hardcoded demo data preserved as fallback when no `buyer_hash` in sessionStorage | ✅ DONE |
| Session continuity | Reads `sessionStorage.getItem('buyer_hash')` set by `/buyer/start` consent flow | ✅ DONE |
| Consent state UI | Consent section turns amber with "Belum Diberikan" + link to `/buyer/start` when `canProceed` is false | ✅ DONE |
| Live/demo indicator | Footer banner shows "Live Data" or "Demo Mode" based on whether live fetch succeeded | ✅ DONE |

**Implementation Notes:**
- Converted from Server Component (with `export const metadata`) to Client Component (`'use client'`) — matches all other buyer pages
- Property location not available from cases join (only `id, name, slug`) — shows only for fallback data. Acceptable for demo; could add properties detail fetch later
- Consent type labels derived from `BuyerConsentStatus` boolean flags: `hasBasic` → 3 labels, `hasThirdParty` → 1, `hasLppsaSubmission` → 1, `hasMarketing` → 1
- Parallel fetch: both API calls fire simultaneously via `Promise.all`

**Deliverable:** Buyer portal showing live case data after the buyer completes the upload flow.

**Exit Criteria:** After running the doc-first flow with seed data, buyer portal shows Nur Adilah's case with correct status, property, and consent flags. *(TypeScript: 0 production errors)*

---

### S6.5 — Stretch: Pilot Reliability Hardening OR Incentive Engine Schema

**Status:** STRETCH SESSION — only if S6.1–S6.4 complete without overrun.

S6.1–S6.4 are the sprint's real goal: one complete path working with real data, end to end. S6.5 should be chosen based on how S6.1–S6.4 go.

**Option A (recommended if S6.1 surfaces issues): Pilot Reliability Hardening**

These items directly affect pilot success criteria (first-attempt completion >90%, agent onboarding <1 day, READY-to-SUBMITTED <24h):

| Task | Description | Pilot Impact |
|------|-------------|--------------|
| Live temujanji slots | Replace hardcoded `AVAILABLE_SLOTS` with API-backed scheduling | Without this, demo works but pilot users see fake appointment times |
| Server-side file validation | Real MIME type checking + 10MB limit on `/api/documents/upload` | Prevents pilot users uploading invalid files that silently fail |
| Test infrastructure | Install vitest + playwright, fix 44 test scaffold errors | Enables CI/CD and prevents regression in subsequent sprints |

**Option B (recommended if S6.1–S6.4 are clean): Incentive Engine Schema Foundation**

Lay the database foundation for the Incentive Engine (Layer 3) per the PRD v3.6.3 implementation roadmap (working draft). The roadmap defines 10 sessions for the full Incentive Engine. This delivers schema only.

| Task | Description |
|------|-------------|
| Migration 011 | Create `campaigns`, `campaign_milestones`, `reward_claims` tables per roadmap spec |
| Safe Language | All reward labels use "Ganjaran Kempen" terminology, never "Komisen" |
| Recipient types | BUYER and DEVELOPER only (agents use Layer 2 credit system, per roadmap correction) |
| Milestone types | PRESCAN_COMPLETE, DOCS_VERIFIED, SUBMISSION_COMPLETE (CASE_COMPLETED removed per roadmap) |
| Budget guards | `budget` and `spent` columns with CHECK constraint `spent <= budget` |
| Feature flags | Add `INCENTIVE_ENGINE: false` flag (disabled by default) |
| Seed data | Basic seed with one sample campaign for demo |
| RLS policies | Service role full access, public read on active campaigns |

**Note:** The incentive schema is designed against the PRD v3.6.3 implementation roadmap, which is a working draft (7 Feb 2026) not yet formally released. If the roadmap spec changes before the lawyer review completes (14 March), the migration may need amendment. Schema-only scope limits this risk — no engine logic or UI depends on it yet.

**Decision point:** Choose Option A or B at the start of S6.5 based on S6.1–S6.4 outcomes.

---

## 4. Backlog (Post-S6)

Items identified but deferred beyond S6, ordered by priority.

| Priority | Item | Source | Notes |
|----------|------|--------|-------|
| P1 | Incentive Engine Core (S5.2–S5.4) | PRD Epic 8 | `incentive-engine.ts`, `campaign-manager.ts`, `milestone-evaluator.ts`, `reward-calculator.ts` |
| P1 | Incentive UI Components (S5.5) | PRD Epic 8 | `CampaignBanner.tsx`, `MilestoneTracker.tsx`, `RewardSummary.tsx` |
| P1 | Incentive Admin Panel (S5.6) | PRD Epic 8 | `/admin/campaigns/page.tsx` — campaign CRUD |
| P1 | Partner + Buyer Recipient Tracking (S5.7–S5.8) | PRD Epic 8 | Reward claim tracking, e-wallet integration stub |
| P1 | Incentive Reporting + QA (S5.9–S5.10) | PRD Epic 8 | Campaign reports, payout summaries, safe language audit |
| P2 | Server-side aggregate endpoints | S6.3 Review | `GET /api/cases/stats` and `GET /api/properties/stats` for dashboard KPIs — eliminates client-side aggregation that breaks when pagination limits change. Seven Sky's ~1,296 annual cases will exceed the 100 limit cap. |
| P2 | Temujanji live slots | A35 Report | Replace hardcoded AVAILABLE_SLOTS with API-backed scheduling |
| P2 | File upload validation (server-side) | A35 Report | Real file type checking, virus scan stub |
| P2 | PDPC registration guidance | Legal Review | Lawyer to advise on Kelas 10/11 registration timing |
| P2 | Data deletion endpoint | PRD CR-010D | Currently 501 stub — implement when PDPA Phase 2 takes effect |
| P3 | Cross-browser testing | QA Checklist | Chrome, Safari, Firefox on desktop + mobile |
| P3 | Performance audit | QA Checklist | Verify FCP < 2s on 4G connection |
| P3 | Accessibility audit | QA Checklist | WCAG AA color contrast, keyboard navigation |
| P3 | Test infrastructure | A35 Report | Install vitest + playwright, fix 44 test scaffold errors |

---

## 5. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Seed data execution fails (schema drift) | Low | High | All seeds verified against actual migration schemas in Sessions 3-4 |
| Privacy notice v1.1 has unfilled placeholders | Medium | Medium | Flagged `[NO. SYARIKAT]` etc. in SQL comments — fill before production deploy |
| Lawyer sign-off delayed past 14 March | Medium | Low | v1.1 SQL is idempotent — can re-run after lawyer edits with `ON CONFLICT DO UPDATE` |
| Incentive Engine scope creep | Medium | High | S6.5 is stretch and schema-only. Engine logic, UI, and admin deferred to S7+. If sprint runs long, S6.5 defers entirely |
| S6.3 → S6.4 contract mismatch | Medium | Medium | S6.3 produces API contract changelog before S6.4 begins. S6.4 wires against documented contracts, not assumed shapes |
| Incentive schema built against draft spec | Low | Medium | PRD v3.6.3 roadmap is working draft (7 Feb). Schema-only scope limits blast radius if spec changes before 14 March |
| QA sign-off surfaces blocking issues | Low | Medium | All automated checks already pass. Manual checks are UI-only (no backend impact) |
| API hardening breaks existing pages | ~~Low~~ **MATERIALIZED** | Medium | N3 default limit change (50→20) silently broke 3 dashboard aggregates. **Caught in review, fixed with explicit `?limit=100`.** Lesson: audit all consumers before changing API defaults |

---

## 6. Sprint S6 Timeline

```
Pre-Sprint:  Execute seed data (B1-B3) in Supabase SQL Editor
             ↓
S6.1:  Live verification — walk all 3 demo paths with real data
             ↓
S6.2:  QA sign-off — complete all 55 manual checks
             ↓
S6.3:  API hardening — fix 4 notable issues + document new contracts  [DONE]
             ↓  (contract doc feeds into S6.4)
S6.4:  Buyer portal wiring — wire against hardened API         [DONE]
             ↓
S6.5:  [STRETCH] Pilot reliability hardening OR Incentive Engine schema
       (choose based on S6.1-S6.4 outcomes)
```

**Estimated effort:** 4 core sessions + 1 stretch, each 1-2 hours.

**Sprint goal in one sentence:** Make one complete buyer → agent → developer path work with real data, close all QA gaps, and harden the API surface for pilot readiness.

---

## 7. Definition of Done (Sprint S6)

**Core (S6.1–S6.4 — required for sprint success):**

- [ ] All 3 seed files executed successfully in production Supabase *(validated clean, awaiting SQL Editor access)*
- [ ] Buyer → Agent → Developer demo path functional with live data *(pending seed execution)*
- [ ] All 55 QA manual checks signed off *(34/36 static checks PASS — see S6-2-STATIC-PREVERIFICATION.md)*
- [x] ~~5~~ 4 notable API issues from A35 resolved *(N2 was already fixed; N1, N3, N4, N5 done + consumer regression fixed)*
- [x] API contract changelog documented for hardened routes *(API-CHANGES-S6.3.md delivered)*
- [x] Buyer portal dashboard wired to live API (with fallback) *(cases + consent APIs, parallel fetch, demo fallback preserved)*
- [x] TypeScript compilation: 0 production errors

**Stretch (S6.5 — one of the following):**

- [ ] Option A: Live temujanji slots + server-side file validation + test infrastructure
- [ ] Option B: Migration 011 (Incentive Engine schema) + INCENTIVE_ENGINE flag + seed

**Wrap-up:**

- [ ] Sprint S6 retrospective documented
- [ ] S6.5 decision rationale recorded (which option was chosen and why)

---

*Document generated: 12 February 2026*
*Rev 2: 12 February 2026 (addressed S6.3→S6.4 dependency, S6.5 stretch positioning, PRD version clarification)*
*Rev 3: 12 February 2026 (S6.3 complete — 4 fixes + consumer regression caught, QA count corrected 13→55, aggregate endpoint added to backlog, risk register updated with materialized risk)*
*Rev 4: 12 February 2026 (S6.4 complete — buyer portal wired to cases + consent APIs, Server→Client component conversion, fallback preserved, DoD 4/7 core items checked)*
*Based on: PRD v3.6.1 (released) + v3.6.3 Implementation Roadmap (working draft), Smoke Test A35, Session 6 QA Sign-Off, Post-Sprint Sessions 1-4*
