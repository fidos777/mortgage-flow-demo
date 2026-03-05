# Snang.my Release Plan — v3.7.0 Onwards

**Updated:** 2026-03-05
**Baseline:** PR #1 merged to `main` (commit 12c7be6, 39 files, 8,235 insertions)
**Supersedes:** PRD-v363-IMPLEMENTATION-ROADMAP.md (Feb 2026) release schedule

---

## Version History (Delivered)

| Version | Date | Scope | Status |
|---------|------|-------|--------|
| v3.6.1 | Jan 2026 | ESD v1 baseline — PreScan, Readiness, Portal Kit | Delivered |
| v3.6.2 | Feb 2026 | PDPA consent gate (CR-010 series), Sprint 0 | Delivered |
| v3.6.3 | Feb 2026 | Session 6 polish — seed data, UI amendments, API changes | Delivered |
| v3.6.4–v3.6.6 | Feb 2026 | Landing page iterations (V1–V3), motion guidelines | Delivered |
| **v3.7.0** | **5 Mar 2026** | **CR-KP-002 Sprint 1 — Developer Pipeline Intelligence** | **Delivered** |

---

## v3.7.0 — CR-KP-002 Sprint 1 (DELIVERED)

**PR #1 · 39 files · 8,235 insertions**

### What shipped

- A1: Foundation types (`types/cr-kp-002.ts`) + service layer (`lib/services/cr-kp-002-services.ts`) + boundary tests
- A2: APDL credential verification, Jenis 3 gate card, developer settings page
- A3: Booking form with source tracking, pipeline table with stale detection (14-day threshold)
- A4: Buyer self-check (DSR calculator, DEC-001 compliant), buyer application form (LPPSA borang with 5 sections)
- A5: Pipeline action panel (6 actions, Developer → Agent → Buyer chain per PRD 002-F)
- A6: Terminology cleanup — "Kes Selesai" replaces "Conversion Rate", LPPSA badge removed, SLIP_GAJI_ASAL, Jenis 3 corrected to "Dalam Pembinaan"
- A7: Document checklist config (15 doc types, 4 categories), interactive checklist component

### Architectural decisions locked

- **DEC-001**: "Approval Probability Engine" permanently rejected. System provides readiness signals only.
- **DEC-002**: KJ letter uses "Surat Pengesahan Ketua Jabatan" (post-Oct 2025 terminology)
- **Three-Tier Visibility**: Level 1 (developer aggregates), Level 2 (booking-originated, PII nullified), Level 3 (buyer PII, never exposed to developers)
- **Communication Chain**: Developer → Agent → Buyer — developers cannot contact buyers directly

---

## v3.7.1 — Copy Cleanup + UI Enforcement

**Effort:** 1–2 sessions
**Dependencies:** None (independent cleanup)

| Item | Description | Files |
|------|-------------|-------|
| CR-001 (remaining) | Replace legacy terminology across landing page and demo | `app/sections/stats.tsx` ("Kadar Kelulusan" DEC-001 violation), hero-data.ts |
| CR-003 (terminology only) | Terminology enforcement piece of CR-003: verify `BANNED_WORDS` coverage, wire CI lint, fix remaining readiness-language violations | `lib/i18n/glossary.ts`, `scripts/check-i18n.ts` |
| "Kelulusan" fix | Buyer portal Pengesahan KJ card uses "kelulusan" — pre-existing, not Sprint 1 regression | Buyer portal components |
| `conversionRate` rename | Internal API property rename (`conversionRate` → `completionRate`) — cascades across 10+ files | `case-store.ts`, `permissions.ts`, `hooks.ts`, services, tests |

**Scope note on CR-003:** The full CR-003 spec includes making Steps 3–6 buyer=read-only and agent=action+attest, plus new proof events (`KJ_SIGNATURE_*`, `LO_RECEIVED`). That work is **not** in v3.7.1 — it moves to v3.7.3 alongside agent console refinement. v3.7.1 covers only the terminology enforcement and CI lint piece.

---

## v3.7.2 — Secure Link + Navigation Wiring

**Effort:** 2–3 sessions
**Dependencies:** v3.7.0 routes exist but are URL-only accessible

| Item | Description | Notes |
|------|-------------|-------|
| CR-002A | Secure shareable link generation for buyer self-check | Token-based `/q/[token]` route already exists; needs auth + expiry logic |
| Navigation wiring | Wire Sprint 1 routes into sidebar/nav | `/listing/settings`, `/listing/bookings`, `/buyer/self-check`, `/buyer/apply` |
| Demo flow | End-to-end walkthrough path for investor/partner demos | Connect booking → pipeline → action → checklist flow |

**Note on CR-002 (WA OTP):** Deprioritised. Feature flag exists (`WA_OTP_ENABLED`), no implementation. Only revisit if PDPA-gate-only decision is reversed and WhatsApp becomes the primary auth channel.

---

## v3.7.3 — Agent Console Refinement

**Effort:** 3–4 sessions
**Dependencies:** v3.7.0 (pipeline types), existing agent components from v3.6.x

| Item | Description | Notes |
|------|-------------|-------|
| CR-003 (agent ownership) | Steps 3–6 buyer=read-only, agent=action+attest; new proof events (`KJ_SIGNATURE_*`, `LO_RECEIVED`) | Full CR-003 scope beyond terminology — role-based step enforcement |
| CR-004 | Agent dashboard polish — integrate pipeline summary from CR-KP-002 types | `CopyNextPanel.tsx` and `SPASubmissionChecklist.tsx` already exist |
| CR-005 | Agent-side readiness view — read-only pipeline status for assigned cases | Uses Level 2 visibility (booking-originated, PII nullified) |
| CR-009C (spillover UI) | Wire existing spillover API infrastructure into buyer/agent UI | API layer exists: 5 routes (`/api/spillover/*`), consent gating (30-day expiry), Category A→B matching, outcome logging. **Missing:** buyer consent modal, agent spillover matches dashboard, proof events (`SPILLOVER_CONSENT_REQUESTED`, `SPILLOVER_MATCH_ACCEPTED`), integration into case flow |

**CR-009C infrastructure status:** The spillover backend is fully functional — consent records, match scoring via RPC, status pipeline (pending→consented→matched→contacted→converted), and stats endpoint. What's missing is the UI layer and proof event integration. This is a "verify and wire" task, not a greenfield build.

---

## v3.7.4 — Property QR + Master Agent

**Effort:** 2–3 sessions
**Dependencies:** v3.7.2 (secure link generation)

| Item | Description | Notes |
|------|-------------|-------|
| CR-007 | Property-level QR code generation | Developer generates QR per project → buyer scans → enters self-check flow |
| CR-007A | Master Agent role | Agent who manages sub-agents; needs role hierarchy in permissions |

---

## v3.8.0 — Incentive Engine (Layer 3)

**Effort:** 8–10 sessions (S5.1–S5.10 per PRD-v363)
**Dependencies:** Core workflow events (PRESCAN_COMPLETE, DOCS_VERIFIED) from Epics 1–4

| Item | Description | Notes |
|------|-------------|-------|
| CR-012 | Incentive Engine v1 — campaign schema, milestone evaluation, reward calculation | Layer 3 overlay on top of Layer 2 credit system |
| CR-012A | External recipients — "Ganjaran Kempen" tracking for buyers and developers | Agents excluded (use Layer 2 credits) |

**Architecture guard:** Incentives ("Ganjaran Kempen") and Credits are separate funding sources. Never cross-pollinate. See PRD-v363 Three-Layer Architecture.

**Safe language:** Use "Ganjaran Kempen" (Campaign Rewards), never "Komisen" (Commission). `CASE_COMPLETED` milestone removed — only reward the act of submission, not approval outcomes.

---

## v3.9.0 — Agency Workspace + Routing (BLOCKED)

**Effort:** 4–6 sessions
**Dependencies:** P0 architectural decisions required before work begins

| Item | Description | Blocker |
|------|-------------|---------|
| CR-008 | Agency workspace — multi-agent team management, case assignment | Requires P0 decision: agency = tenant or project-level entity? |
| CR-007B | Routing pools — automatic case distribution across agents | Requires P0 decision: round-robin vs. skill-based vs. manual? |

**P0 Questions (must answer before scoping):**

1. Is an agency a platform-level tenant (like a developer) or a project-level assignment?
2. Can one agent belong to multiple agencies?
3. Does routing happen at booking creation or at prescan completion?
4. What is the fallback when no agent is available in the pool?

---

## CR Status Summary

| CR | Title | Status | Version |
|----|-------|--------|---------|
| CR-001 | Terminology alignment | Partial — landing page items remain | v3.7.1 |
| CR-002 | WA OTP | Deprioritised — feature flag only | — |
| CR-002A | Secure shareable link | Planned | v3.7.2 |
| CR-003 (terminology) | CI lint + BANNED_WORDS enforcement | Planned | v3.7.1 |
| CR-003 (agent ownership) | Steps 3–6 buyer=read-only, agent=attest, new proof events | Planned | v3.7.3 |
| CR-004 | Agent dashboard polish | Planned | v3.7.3 |
| CR-005 | Agent readiness view | Planned | v3.7.3 |
| CR-007 | Property QR | Planned | v3.7.4 |
| CR-007A | Master Agent role | Planned | v3.7.4 |
| CR-007B | Routing pools | Blocked (P0) | v3.9.0 |
| CR-008 | Agency workspace | Blocked (P0) | v3.9.0 |
| CR-009C | Spillover UI (API exists, needs buyer/agent UI + proof events) | Planned | v3.7.3 |
| CR-010 series | PDPA compliance gate | Delivered | v3.6.2 |
| CR-011 | Communication gating | Delivered | v3.6.2 |
| CR-012 / CR-012A | Incentive engine | Planned | v3.8.0 |
| CR-KP-002 S1 | Developer Pipeline Intelligence | **Delivered** | **v3.7.0** |

---

## Tech Debt Register

| ID | Description | Effort | Target |
|----|-------------|--------|--------|
| TD-001 | `conversionRate` internal API property rename — cascades across 10+ files | Medium | v3.7.1 |
| TD-002 | `SLIP_GAJI` → `SLIP_GAJI_ASAL` references in Supabase seed data (if applicable) | Low | v3.7.1 |
| TD-003 | Landing page DEC-001 violation in `stats.tsx` ("Kadar Kelulusan") | Low | v3.7.1 |
| TD-004 | Duplicate route cleanup — `app/q/[token]/page.tsx` deleted but check for other route conflicts | Low | Done |
| TD-005 | "Kelulusan" in buyer portal Pengesahan KJ card | Low | v3.7.1 |

---

## Retired / Superseded Items

These items from the original v3.6.2–v3.6.6 plan are no longer relevant:

| Original Item | Why Retired |
|---------------|-------------|
| v3.6.4 "Landing page V1" | Delivered and iterated through V3 |
| v3.6.5 "Landing page V2" | Superseded by V3 |
| v3.6.6 "Landing page V3" | Delivered (current production) |
| "Sprint 0 PDPA" as future | Already delivered in v3.6.2 |
| "Sprint 1–4 ESD v1" as future | Core workflow delivered in v3.6.1 |

---

## Notes

1. **Session = 1 Claude coding session.** Effort estimates assume focused implementation with verification.
2. **Version bumps** follow semver-ish: patch (x.y.Z) for fixes/polish, minor (x.Y.0) for feature milestones, major reserved for public launch.
3. **CR-KP-002 Sprints 2–4** are not yet formally scoped. Sprint 1 established the type system and service layer; subsequent sprints will build on this foundation (Supabase integration, real WhatsApp flows, production APDL verification).
4. **Landing page (V3 tightening)** has a separate plan — see `.claude/plans/` for the developer-first positioning update. This is independent of the release plan and can ship at any version.
