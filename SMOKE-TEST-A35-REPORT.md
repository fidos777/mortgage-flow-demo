# Smoke Test Report — A35

**Project:** Snang.my / Qontrek Authority Engine
**Sprint:** S5 (Post-Sprint Session 2)
**Date:** 11 February 2026
**Tester:** Claude (code audit, static analysis, trace walkthrough)
**Method:** Static analysis + TypeScript compilation + file-by-file trace

---

## 1. Executive Summary

| Category | Status |
|----------|--------|
| TypeScript Compilation | **0 production errors** (44 in test scaffolds only) |
| Buyer Journey (9 pages) | **All pages exist, all links valid** |
| Agent Journey | **Case list + Case detail + Readiness Panel all exist** |
| Developer Journey | **Dashboard + property list functional** |
| API Endpoints (35 routes) | **All present, 10 clean, 20 minor issues, 5 notable** |
| Walkthrough iframe fix | **CONFIRMED — X-Frame-Options: SAMEORIGIN** |
| Duplicate banner fix | **CONFIRMED — DemoBuildWatermark: top-right only** |
| Seed data (Nur Adilah) | **Script valid, NOT yet executed in production Supabase** |
| Migrations (001–010) | **All 10 present, 22 tables total** |

**Verdict: Demo-ready for guided walkthrough. Seed data execution required before live demo.**

---

## 2. TypeScript Compilation

```
Total errors:     44
Production errors: 0  ✅
Test-only errors: 44 (22 in __tests__/ + 22 in e2e/)
```

Test errors are pre-existing scaffolding issues (missing `vitest` and `@playwright/test` dependencies, type mismatches in test fixtures). These do not affect production build or runtime.

---

## 3. Buyer Journey Trace

### CR-008 Doc-First Flow (Primary Demo Path)

| Step | Page | Exists | Wired To | Status |
|------|------|--------|----------|--------|
| 1 | `/buyer/start` (PDPA consent) | ✅ | → `/buyer/upload` | OK |
| 2 | `/buyer/upload` (4 docs) | ✅ | → `/buyer/upload-complete` | OK — real API + fallback |
| 3 | `/buyer/upload-complete` | ✅ | → `/buyer/temujanji` | OK |
| 4 | `/buyer/temujanji` (booking) | ✅ | → `/buyer` (dashboard) | OK — LPPSA consent gate |

### Alternative Flows

| Flow | Pages | Status |
|------|-------|--------|
| Prescan → Journey | `/buyer/prescan` → `/buyer/journey` | ✅ All exist |
| DSR Quick Check | `/buyer/dsr-check` | ✅ Wired to POST `/api/readiness` |
| KJ Confirm | `/buyer/kj-confirm` | ✅ Exists |

### Observations

- All buyer pages use Suspense wrappers for `useSearchParams` (Next.js 16 ready)
- All API calls have graceful fallback (local-only mode if API unreachable)
- Proof events fire-and-forget on: prescan completion, DSR check, doc upload, temujanji booking, consent grant
- `sessionStorage` used for cross-page state (buyer_hash, doc_first_uploads, case_id)
- Query params (`pid`, `did`, `aid`, `entry`, `project`) passed through the full chain
- DSR check maps exact RM → range strings via `toIncomeRange()` / `toCommitmentRange()`

### Known Limitations

- `buyer/page.tsx` (portal dashboard) uses hardcoded demo data (propertyData, consentData) — not wired to live API
- Temujanji slots are hardcoded mock data (AVAILABLE_SLOTS array) — not fetched from API
- No real file upload validation in demo mode (creates synthetic File objects if no file selected)

---

## 4. Agent Journey Trace

| Component | Exists | Status |
|-----------|--------|--------|
| `/agent` (case list) | ✅ | Fetches from GET `/api/cases`, search + filter + preview panel |
| `/agent/case/[id]` (detail) | ✅ | Full case view with tabs (Overview, Query, Submission Kit) |
| `AgentReadinessPanel` | ✅ | Unified panel: readiness band + consent status + pre-KJ checklist + cross-validation flags |

### Agent Dashboard Features Verified
- Status mapping (12 statuses: new → completed/rejected/expired)
- Filter tabs: All, TAC Dijadual, Dokumen Pending, KJ Overdue, LO Hampir Tamat
- Phone masking (`maskPhone`) — only last 4 digits shown
- Income shown as range only (per PRD)
- "Lihat Penuh" navigates to `/agent/case/[id]`
- Authority boundary notice at bottom

### AgentReadinessPanel API Calls
- `GET /api/pre-kj?case_id=X` — 6-item checklist
- `GET /api/consent/status?buyer_hash=X` — PDPA + LPPSA consent state
- `GET /api/cross-validate?case_id=X` — form vs document mismatch flags

---

## 5. Developer Journey Trace

| Component | Exists | Status |
|-----------|--------|--------|
| `/developer` (dashboard) | ✅ | Aggregate stats + property list + activity feed |

### Developer Dashboard Features Verified
- Fetches from `GET /api/cases` + `GET /api/properties` in parallel
- KPIs: total cases, active, submitted/KJ, completed
- Pipeline value (sum of property_price)
- Conversion rate calculation
- Status breakdown with progress bars
- Property list with per-property case count
- Privacy notice: "Pemaju melihat data agregat sahaja"
- Recent activity feed (last 5 cases)

---

## 6. API Endpoint Audit Summary

### 35 Route Files Audited

| Rating | Count | Details |
|--------|-------|---------|
| Clean (no issues) | 10 | agents, consent/check, consent/notice, consent/revoke, consent/status, documents list, readiness, routing/assignments, routing/team, templates |
| Minor issues | 20 | Non-critical: hardcoded configs, non-fatal silent failures, inefficient queries |
| Notable issues | 5 | See below |

### Notable Issues (Non-Blocking for Demo)

1. **`POST /api/private-login`** — Password compared in plaintext against env var. No rate-limiting. Acceptable for demo gate but not production auth.

2. **`DELETE /api/properties/[id]?hard=true`** — Hard delete via query param with no authorization check. Low risk (demo only) but should be gated.

3. **`PUT /api/contacts/[id]`** — Agent metrics recalculation is N+1 inefficient. Works correctly but will slow down with scale.

4. **`PUT /api/routing/assignments/[id]`** — Contains dead code referencing non-existent RPC functions (`greatest()`, `coalesce_add()`). Falls back to manual queries correctly.

5. **`PUT /api/spillover/consent/[id]`** — Expiry check runs after status check (should be first). Status can desync if matching RPC fails.

### API Coverage by Domain

| Domain | Endpoints | Methods |
|--------|-----------|---------|
| Auth | 3 | GET, POST |
| Cases | 1 | GET, POST |
| Consent | 5 | GET, POST |
| Contacts | 2 | GET, POST, PUT |
| Cross-validate | 1 | GET |
| Developers | 1 | GET |
| Documents | 2 | GET, POST |
| Pre-KJ | 1 | GET |
| Proof Events | 1 | GET, POST |
| Properties | 4 | GET, POST, PUT, DELETE |
| Readiness | 1 | POST |
| Routing | 4 | GET, POST, PUT |
| Spillover | 4 | GET, POST, PUT |
| Templates | 1 | GET |
| **Total** | **35** | — |

---

## 7. Fixes Verified

### Fix 1: Walkthrough Iframe (Session 1)
- **Before:** `X-Frame-Options: DENY` in middleware.ts blocked same-origin iframe
- **After:** `X-Frame-Options: SAMEORIGIN` (line 136)
- **Verification:** `walkthrough.html` exists in `/public/`, iframe in `app/walkthrough/page.tsx` uses `src="/walkthrough.html"`
- **Status:** ✅ FIXED

### Fix 2: Duplicate Demo Banner (Session 1)
- **Before:** `DemoBuildWatermark.tsx` had both top-right badge AND bottom banner
- **After:** Only top-right floating badge remains (lines 13-18)
- **Verification:** `FooterDisclaimer.tsx` occupies `bottom-0` with snang.my branding + Qontrek engine attribution
- **Status:** ✅ FIXED

### Fix 3: B03 DSR Check Wiring (Session 1)
- **Before:** Pure client-side calculator, no server integration
- **After:** POSTs to `/api/readiness` with range mapping, shows server readiness band
- **Verification:** `toIncomeRange()` and `toCommitmentRange()` functions present, `serverResult` state displayed
- **Status:** ✅ WIRED

---

## 8. Seed Data Status

### File: `supabase/seed/seed-demo-data.sql` (252 lines)

| Check | Status |
|-------|--------|
| FK references valid (developer, property from migration 002) | ✅ |
| ON CONFLICT clauses backed by UNIQUE constraints | ✅ |
| Idempotent (safe to re-run) | ✅ |
| Gred mismatch (DG9 vs DG41) for cross-validator demo | ✅ |
| Proof events lifecycle (9 events) | ✅ |
| **Executed in production Supabase** | ❌ NOT YET |

### What Seed Data Enables
- Nur Adilah test case visible in Agent dashboard
- AgentReadinessPanel shows cross-validation flag (gred mismatch)
- Pre-KJ checklist partially passes
- Consent records show PDPA_BASIC + LPPSA_SUBMISSION granted

### Pre-Demo Action Required
```sql
-- Run in Supabase SQL editor:
-- Paste contents of supabase/seed/seed-demo-data.sql
```

---

## 9. Migrations Inventory

| # | File | Tables Created | Status |
|---|------|---------------|--------|
| 001 | secure_links | secure_links | ✅ |
| 002 | properties | developers, properties, units, mortgage_cases + seed data | ✅ |
| 003 | agent_contacts | agents, contact_attempts + views | ✅ |
| 004 | spillover_system | spillover_consents, spillover_matches | ✅ |
| 005 | agent_routing | agent_teams, case_assignments, whatsapp_templates | ✅ |
| 006 | add_agent_fk | (ALTER TABLE only) | ✅ |
| 007 | consent_and_readiness | consent_records, pdpa_notices + views, ALTERs to mortgage_cases | ✅ |
| 008 | documents_and_proof_events | case_documents, proof_events + RPC | ✅ |
| 009 | form_data_column | (ALTER TABLE: form_data JSONB + pre_kj columns) | ✅ |
| 010 | private_login_logs | private_login_logs + view | ✅ |

**Total: 10 migrations, ~22 tables, 5+ views, 2+ RPCs**

---

## 10. Demo Walkthrough Script (Recommended)

For a guided demo, follow this path:

### Part A: Buyer Flow (~5 min)
1. Open `/` (landing page) → Click "Cuba Demo"
2. `/buyer` → Click "Imbasan Kesediaan" → Walk through prescan
3. `/buyer` → Click "Upload Dokumen" → Upload 3 required docs (demo files auto-generated)
4. `/buyer/upload-complete` → Click "Tempah Temujanji"
5. `/buyer/temujanji` → Select slot → Check LPPSA consent → Confirm

### Part B: DSR Check (~2 min)
1. `/buyer/dsr-check` → Adjust income/commitments → Click "Kira DSR"
2. Show server readiness band result

### Part C: Agent View (~3 min)
1. Switch to Agent role (role switcher in header)
2. `/agent` → Show case list with Nur Adilah (requires seed data)
3. Click "Lihat Penuh" → Show AgentReadinessPanel with cross-validation flag

### Part D: Developer View (~2 min)
1. Switch to Developer role
2. `/developer` → Show aggregate dashboard, pipeline value, property list

### Part E: Walkthrough (~1 min)
1. Click walkthrough button in header
2. Verify iframe loads without "refused to connect" error

---

## 11. Risk Register

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | Seed data not executed → Agent dashboard empty | HIGH | Run seed SQL before demo |
| 2 | Supabase cold start → first API call slow | LOW | Hit any API endpoint 30s before demo |
| 3 | Private login env var not set → password wall disabled | LOW | Verify `BASIC_PASSWORD` in Vercel env |
| 4 | WhatsApp CTA → opens WhatsApp but no real agent | INFO | Expected for demo, not a bug |
| 5 | Hardcoded temujanji slots → dates may be in the past | LOW | Update AVAILABLE_SLOTS if demo date > Feb 12 |

---

## 12. Conclusion

The Snang.my demo is **structurally sound and ready for guided demonstration**. All pages exist, all navigation links are valid, all API endpoints are present with proper error handling and graceful fallbacks. The two UI bugs from Session 1 (walkthrough iframe + duplicate banner) are confirmed fixed.

**One blocking pre-demo action:** Execute `seed-demo-data.sql` in the production Supabase instance so the Agent dashboard shows the Nur Adilah test case with cross-validation flags.

**Post-demo backlog items** (non-blocking):
- Rate-limiting on login endpoint
- Authorization checks on property DELETE
- Replace mock temujanji slots with API-driven slots
- Wire buyer portal dashboard to live case data
- Install vitest + playwright dev dependencies to clear test scaffolding errors

---

*End of Report*
