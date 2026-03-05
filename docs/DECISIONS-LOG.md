# Project Decisions Log

## DEC-001: Reject "Approval Probability Engine" Concept

**Date:** 2026-03-04
**Sprint:** CR-KP-002 Sprint 1
**Priority:** P1 — Architectural Discipline
**Status:** PERMANENT REJECTION

### Decision

The concept of an "Approval Probability Engine" — any system, feature, or UI element that predicts, scores, or implies the likelihood of LPPSA loan approval — is permanently rejected from the Snang.my platform.

This is a **concept-level** prohibition, not merely a terminology restriction. The system:

- MUST NOT compute approval probability in any form (percentage, score, band, label)
- MUST NOT train or deploy models that predict LPPSA approval outcomes
- MUST NOT store fields named `approval_probability`, `approval_score`, `approval_likelihood`, or semantic equivalents
- MUST NOT display UI elements that a reasonable user could interpret as approval prediction
- MUST NOT market the platform using "approval rate" or "success rate" claims tied to system output

### What IS Permitted

The platform provides **readiness signals** (`skor kesediaan`) which measure document completeness and DSR compliance — objective, verifiable inputs that the buyer can act on before submitting to the official LPPSA portal. Readiness signals:

- Measure document completeness (binary: present or absent)
- Calculate DSR from declared income vs declared commitments
- Flag missing items or potential blockers
- NEVER predict what LPPSA will decide

### Rationale

1. **Regulatory risk**: LPPSA is the sole approval authority. Any system that implies approval prediction could be construed as operating an unlicensed financial advisory service.
2. **Presenter Discipline Pack**: The platform's core discipline is "AI bantu prepare, MANUSIA submit." Approval prediction fundamentally contradicts this principle.
3. **Three-Tier Visibility Model**: Even aggregate approval rates shown to developers (Level 1) could create pressure on agents/buyers and distort the platform's neutral readiness role.
4. **Liability**: If a buyer acts on a high "approval probability" and is rejected, the platform bears moral (and potentially legal) liability.

### Enforcement

- `lib/i18n/glossary.ts` → `BANNED_WORDS` list includes approval-related terms
- `scripts/check-i18n.ts` → CI lint catches banned terms in UI strings
- `lib/orchestrator/permissions.ts` → `confidenceToLabel()` converts internal scores to readiness labels only
- This decision log serves as the authoritative reference for any future feature proposals

### Cross-References

- PRD v3.7 Section 16.3: Readiness score display rules
- Presenter Discipline Pack (concept-level rule)
- `lib/i18n/glossary.ts`: BANNED_WORDS
- `scripts/check-i18n.ts`: Automated enforcement
- `app/sections/stats.tsx:9`: Known legacy violation ("Kadar Kelulusan") — flagged for removal, outside Sprint 1 scope

---

## DEC-002: LPPSA Surat Pengesahan KJ — Terminology Direction

**Date:** 2026-03-04
**Sprint:** CR-KP-002 Sprint 1 (A7)
**Priority:** P1 — Data Accuracy
**Status:** RESOLVED

### Decision

The correct terminology direction for the KJ endorsement letter is:

- **OLD** (before 1 Oct 2025): "Surat Iringan KJ"
- **NEW** (from 1 Oct 2025): "Surat Pengesahan Ketua Jabatan"

The system uses `SURAT_PENGESAHAN_KJ` as the canonical key. The old name "Surat Iringan" appears only in explanatory notes (e.g., "Dahulunya dikenali sebagai Surat Iringan KJ").

### Source

Official LPPSA Notis Makluman dated 30 Sep 2025, effective 1 Oct 2025. Transition period ended 31 Oct 2025. Applications using the old format will be "dikuiri" (queried) by LPPSA.

### Files Updated

- `lib/config/document-checklist.ts` (DOC_003)
- `lib/config/loan-types.ts` (all 7 Jenis types)
