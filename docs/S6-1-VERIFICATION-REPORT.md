# S6.1 Verification Report
## Snang.my / Qontrek Authority Engine — Sprint S6

---

| Field | Value |
|-------|-------|
| **Session** | S6.1 — Seed Execution + Live Verification |
| **Date** | 12 February 2026 |
| **Method** | Static analysis, dry-run validation, TypeScript compilation |
| **Constraint** | External network unavailable — Supabase and snang.my unreachable from build environment |

---

## 1. Seed File Validation (Dry-Run)

All 3 seed files validated against actual migration schemas (001–010). No schema drift detected.

### B1: seed-demo-data.sql

| Check | Result |
|-------|--------|
| File exists | ✅ `supabase/seed/seed-demo-data.sql` (252 lines) |
| FK: `developer_id` → `developers.id` (migration 002) | ✅ Valid |
| FK: `property_id` → `properties.id` (migration 002) | ✅ Valid |
| FK: `unit_id` → `units.id` (migration 002) | ✅ Valid |
| FK: `case_ref` → `mortgage_cases.case_ref` (migration 002) | ✅ Valid |
| CHECK: `consent_type` IN (C1–C6) (migration 007) | ✅ Uses `PDPA_BASIC`, `LPPSA_SUBMISSION` |
| CHECK: `status` values valid (migration 002) | ✅ Uses `new`, `ready` |
| ON CONFLICT clauses | ✅ `ON CONFLICT (case_ref) DO NOTHING`, `ON CONFLICT (buyer_hash, consent_type) DO NOTHING` |
| Idempotent | ✅ Safe to re-run |
| Cross-validation demo | ✅ Deliberate gred mismatch (DG9 vs DG41) for AgentReadinessPanel flag |

### B2: seed-whatsapp-template.sql

| Check | Result |
|-------|--------|
| File exists | ✅ `supabase/seed/seed-whatsapp-template.sql` (29 lines) |
| Table: `whatsapp_templates` (migration 005) | ✅ Valid |
| UNIQUE constraint: `code` column | ✅ Matches `ON CONFLICT (code) DO UPDATE SET` |
| Idempotent | ✅ Upsert pattern — safe to re-run |

### B3: update-privacy-notice-v1.1.sql

| Check | Result |
|-------|--------|
| File exists | ✅ `supabase/seed/update-privacy-notice-v1.1.sql` (223 lines) |
| Table: `pdpa_notice_versions` (migration 007) | ✅ Valid |
| Columns: version, content_bm, content_en, summary_bm, summary_en, effective_from, change_reason, approved_by | ✅ All match migration 007 schema |
| Transaction wrapping | ✅ `BEGIN` / `COMMIT` |
| Step 1: Supersede v1.0 (`SET superseded_at = NOW() WHERE version = '1.0' AND superseded_at IS NULL`) | ✅ Safe guard prevents double-supersession |
| Step 2: Insert v1.1 with all required fields | ✅ All non-nullable columns populated |
| Verification queries | ✅ Step 3 (status check) + Step 4 (consent chain simulation) |
| Idempotent | ⚠️ **No** — INSERT without `ON CONFLICT` will fail with PK violation on re-run |
| Placeholders | ⚠️ `[NO. SYARIKAT]`, `[ALAMAT]`, `[TELEFON]`, `[TARIKH]` must be filled before production |
| Approved by | ⚠️ `pending_legal_review` — must be updated post-lawyer sign-off |

**Recommendation:** B3 is designed as a single-execution script with manual verification. The non-idempotent design is acceptable given the post-run checklist and verification queries. If re-run is needed, manually delete v1.1 first:
```sql
DELETE FROM pdpa_notice_versions WHERE version = '1.1';
UPDATE pdpa_notice_versions SET superseded_at = NULL WHERE version = '1.0';
```

---

## 2. TypeScript Compilation

| Check | Result |
|-------|--------|
| Production errors | **0** ✅ |
| Test scaffold errors | 44 (vitest + playwright not installed — pre-existing, expected) |
| Build-blocking issues | None |

---

## 3. Codebase Inventory

| Metric | Sprint Plan | Actual | Match |
|--------|-------------|--------|-------|
| Database migrations | 10 | 10 (001–010) | ✅ |
| Database tables | ~22 | ~22 | ✅ |
| API route files | 37 | 36 | ⚠️ Minor count difference (agents route may be counted differently) |
| Buyer pages | 9 | 8 buyer + `buyer/page.tsx` portal = 9 total | ✅ |
| Agent pages | 2 | 2 (dashboard + case detail) | ✅ |
| Developer pages | 3 | 3 (dashboard + proof + properties) | ✅ |
| Total page.tsx files | — | 22 | — |
| Component files | — | 60 | — |
| Feature flags | 9 | 9 (3 presets: demo, pilot, production) | ✅ |
| Seed files ready | 3 | 3 | ✅ |
| Seeds executed | 0 of 3 | 0 of 3 | ✅ (matches — still pending) |

---

## 4. S6.3 Issue Pre-Verification

The sprint plan S6.3 lists 5 API issues to harden. Pre-verification against current code:

| # | Route | Issue | Verified |
|---|-------|-------|----------|
| N1 | POST /api/readiness | No Zod validation; negative numbers accepted in salary/commitments | ✅ **Confirmed** — TypeScript interface only, no runtime validation |
| N2 | POST /api/documents/upload | File size and type not validated server-side | ❌ **Already fixed** — 20MB limit + MIME whitelist present (lines 17-74) |
| N3 | GET /api/cases | No pagination | ⚠️ **Partially done** — offset-based pagination exists (default limit 50) but no max cap, no cursor-based, meta returns page count not total |
| N4 | POST /api/proof-events | Missing event_type validation | ✅ **Confirmed** — event_category and actor_type validated, but event_type accepts arbitrary strings |
| N5 | GET /api/properties | Internal IDs exposed | ✅ **Confirmed** — uses `select('*')` with no field whitelist |

**Impact on S6.3 scope:** N2 is already resolved, reducing S6.3 from 5 fixes to 4. N3 needs clarification on whether the existing offset pagination is sufficient or if cursor-based is required.

**Note:** These 5 issues are distinct from the A35 report's 5 "notable" issues (which cover login auth, property deletion, N+1 performance, dead RPC code, and spillover expiry ordering). The S6.3 issues target the buyer demo path specifically because S6.4 wires the buyer portal against these endpoints.

---

## 5. A35 Notable Issues Status (for reference)

These A35 issues are NOT part of S6.3 scope but are tracked in the backlog:

| # | Route | Issue | Demo Impact |
|---|-------|-------|-------------|
| 1 | POST /api/private-login | Plaintext password comparison, no rate-limiting | Low — demo gate only |
| 2 | DELETE /api/properties/[id]?hard=true | No authorization check on hard delete | Low — demo-only endpoint |
| 3 | PUT /api/contacts/[id] | N+1 agent metrics recalculation | Low — small dataset |
| 4 | PUT /api/routing/assignments/[id] | Dead RPC references (fallback works) | None — fallback active |
| 5 | PUT /api/spillover/consent/[id] | Expiry check after status check | Low — edge case |

---

## 6. QA Signoff Status

| Category | Items | Checked |
|----------|-------|---------|
| Files Delivered (Sessions 0–6) | 29 | ✅ 29/29 |
| Backend Impact Verification | 5 | ⬜ 0/5 |
| Feature Flag Verification | 4 | ⬜ 0/4 |
| Animation System | 5 | ⬜ 0/5 |
| Progressive Disclosure | 6 | ⬜ 0/6 |
| Trust UI | 5 | ⬜ 0/5 |
| i18n Localization | 5 | ⬜ 0/5 |
| Mobile-First Polish | 6 | ⬜ 0/6 |
| Cross-Browser Testing | 5 | ⬜ 0/5 |
| Device Testing (Malaysia) | 4 | ⬜ 0/4 |
| Accessibility | 5 | ⬜ 0/5 |
| Pre-Deploy Checklist | 5 | ⬜ 0/5 |
| **Total Manual QA** | **55** | **⬜ 0/55** |
| Sign-off signatures | 4 | ⬜ 0/4 |

**Sprint plan correction:** The sprint plan states "13 manual QA checkboxes" but the actual QA document contains 55 manual checks across 11 categories, plus 4 sign-off signatures. The "13" likely refers to the 7 core categories from S6.2 scope (backend + flags + animation + disclosure + trust + i18n + mobile = 36 checks). The remaining 19 checks (cross-browser + device + accessibility + pre-deploy) are stretch/production scope.

---

## 7. Blocking Actions for User

The following require manual execution in Supabase SQL Editor (cannot be done from build environment):

### Execute Seeds (B1 → B2 → B3)

**Step 1: Run B1 (seed-demo-data.sql)**
1. Open Supabase SQL Editor at `https://epboevdcsealfhqghktc.supabase.co`
2. Paste contents of `supabase/seed/seed-demo-data.sql`
3. Execute → verify "Nur Adilah" case appears in result
4. Expected: 1 mortgage case, 2 consent records, 9 proof events

**Step 2: Run B2 (seed-whatsapp-template.sql)**
1. Paste contents of `supabase/seed/seed-whatsapp-template.sql`
2. Execute → verify `agent_case_alert` template inserted

**Step 3: Run B3 (update-privacy-notice-v1.1.sql) — ONLY after lawyer sign-off**
1. Replace placeholders: `[NO. SYARIKAT]`, `[ALAMAT]`, `[TELEFON]`, `[TARIKH]`
2. Paste contents of `supabase/seed/update-privacy-notice-v1.1.sql`
3. Execute → verify Step 3 output shows v1.1 ACTIVE, v1.0 RETIRED
4. Verify Step 4 output returns exactly 1 row (v1.1)

### Live Verification (post-seed)

After seeds are executed, walk through:

| Path | URL | What to verify |
|------|-----|----------------|
| Buyer start | `/buyer/start` | PDPA consent gate loads, checkbox label from v1.1 |
| Buyer upload | `/buyer/upload` | Document upload form functional |
| Buyer complete | `/buyer/upload-complete` | Redirects to temujanji |
| Buyer booking | `/buyer/temujanji` | Slot selection + LPPSA consent |
| Agent dashboard | `/agent` | Nur Adilah case visible with case ref QTK-2026-DEMO1 |
| Agent case detail | `/agent/case/[id]` | Readiness panel shows gred mismatch flag |
| Developer dashboard | `/developer` | Aggregate stats populated |
| Developer proof | `/developer/proof` | Proof events from consent + upload visible |
| API health | `npm run demo:health` | 7 routes return 200 |

---

## 8. S6.1 Exit Criteria Assessment

| Criterion | Status |
|-----------|--------|
| All 3 seed files validated against schema | ✅ PASS |
| TypeScript compilation: 0 production errors | ✅ PASS |
| All 3 demo paths (buyer, agent, developer) functional | ⏳ **Pending seed execution + live verification** |
| Seeds executed in production Supabase | ⏳ **Pending — requires manual action** |
| API health check | ⏳ **Pending — requires network access** |

**S6.1 Status: VALIDATION COMPLETE, EXECUTION PENDING**

The static validation phase of S6.1 is complete. All seed files are schema-correct and ready for execution. The live verification phase requires Supabase SQL Editor access and network connectivity to snang.my.

---

*Report generated: 12 February 2026*
*Based on: Sprint S6 Plan, A35 Smoke Test Report, SESSION-6-QA-SIGNOFF.md, migration schemas 001–010*
