# Sprint 0: PDPA Hard Gate — Completion Summary

**PRD Version:** v3.6.3
**Sprint Status:** ✅ COMPLETE
**Sessions:** S0.1 → S0.7 (7/7)
**Date Completed:** 8 Feb 2026

---

## Overview

Sprint 0 implements the PDPA 2010 (Amendment 2024) compliance foundation, creating a hard consent gate that blocks data collection until explicit buyer consent is captured.

### Key Compliance Requirements

| Requirement | PRD Reference | Status |
|-------------|---------------|--------|
| Granular consent types | CR-010 | ✅ |
| Step 0 blocking gate | CR-010A | ✅ |
| 72h breach notification | CR-010C | ✅ |
| Data retention automation | CR-012 | ✅ |

---

## Session Breakdown

### S0.1 — Schema + Service ✅

**Files Created:**
- `scripts/migrations/001_consent_schema.sql` — Database tables
- `lib/types/consent.ts` — TypeScript types
- `lib/services/consent-service.ts` — Service layer

**Key Features:**
- 4 granular consent types: `PDPA_BASIC`, `PDPA_MARKETING`, `PDPA_ANALYTICS`, `PDPA_THIRD_PARTY`
- Retention periods: 7yr/2yr/1yr/7yr respectively
- Integration with proof_events (Epic 5)

### S0.2 — UI Gate ✅

**Files Created:**
- `lib/i18n/consent.ts` — Bilingual strings (BM + EN)
- `components/pdpa/PDPAConsentGate.tsx` — Consent capture UI

**Key Features:**
- 35 strings per locale (70 total)
- Safe Language compliance (PRD 6.2)
- Checkbox → Submission → Confirmation flow

### S0.3 — Flow Integration ✅

**Files Created:**
- `app/buyer/start/page.tsx` — Step 0 route
- `lib/hooks/useConsentGuard.ts` — Client-side guard

**Key Features:**
- Auto-redirect if `PDPA_BASIC` missing
- Bypass when `PDPA_GATE_ENABLED=false`
- SessionStorage caching

### S0.4 — Auth Ledger ✅

**Files Created:**
- `scripts/migrations/002_developer_auth_ledger.sql` — Auth audit tables
- `lib/types/auth-ledger.ts` — TypeScript types
- `lib/services/auth-ledger.ts` — Service layer
- `lib/hooks/useAuthLedger.ts` — React hook

**Key Features:**
- 16 auth event types
- Auto-lock after 5 failed attempts
- Session tracking with 15min timeout

### S0.5 — Comms Gating ✅

**Files Created:**
- `lib/types/notification.ts` — Message classification types
- `lib/services/notification-service.ts` — Consent-aware dispatch
- `lib/hooks/useNotification.ts` — React hook

**Key Features:**
- 3-class system: TRANSACTIONAL, OPERATIONAL, MARKETING
- Bundle rule: promo content → requires PDPA_MARKETING
- 10+ promo keywords for auto-reclassification

### S0.6 — Breach Scaffold + Retention ✅

**Files Created:**
- `scripts/migrations/003_breach_notification_tables.sql` — 5 tables
- `lib/types/breach.ts` — TypeScript types
- `lib/services/breach-service.ts` — Incident management

**Key Features:**
- 72h deadline tracking (PDPA 2024)
- 4 severity levels with bilingual labels
- 7 incident statuses with workflow
- Legal hold mechanism for litigation
- Auto-purge scheduler

### S0.7 — QA + Polish ✅

**Files Created:**
- `__tests__/sprint0-pdpa.test.ts` — Integration smoke tests
- `docs/SPRINT0-PDPA-COMPLETION.md` — This document

**Verification Results:**
- Bilingual strings: 54 BM + 54 EN = 108 total ✅
- Feature flag presets: demo/pilot/production verified ✅
- All service exports: tested ✅
- All hook exports: tested ✅

---

## Feature Flag Presets

| Preset | PDPA_GATE | PDPA_STRICT | BREACH_SCAFFOLD | Use Case |
|--------|-----------|-------------|-----------------|----------|
| `demo` | ❌ | ❌ | ❌ | Quick presentations |
| `pilot` | ✅ | ❌ | ✅ | Early adopters |
| `production` | ✅ | ✅ | ✅ | Full compliance |

---

## Database Tables Created

### Migration 001 — Consent Schema
- `consent_records` — Individual consent grants
- `pdpa_notice_versions` — PDPA notice versioning
- `consent_audit_log` — Compliance audit trail

### Migration 002 — Auth Ledger
- `developer_auth_ledger` — Authentication events
- Views: `v_active_sessions`, `v_failed_login_attempts`, `v_auth_metrics_daily`

### Migration 003 — Breach & Retention
- `breach_incidents` — Incident records
- `breach_affected_parties` — Affected individuals
- `breach_timeline_log` — Status changes
- `consent_retention_schedule` — Purge scheduling
- `data_purge_log` — Purge audit

---

## Safe Language Compliance (PRD 6.2)

All user-facing text follows Safe Language guidelines:

| ❌ Avoid | ✅ Use Instead |
|----------|----------------|
| Lulus / Approved | Readiness Signal / Isyarat Kesediaan |
| Eligible / Layak | Ready to Proceed / Sedia Diteruskan |
| Guaranteed | Structured Workflow |
| Reward | Ganjaran Kempen |

Footer disclaimer included in all buyer-facing pages:
> "This system provides readiness signals and structured workflows, not loan approvals and not a replacement for official portals."

---

## Running Tests

```bash
# Run Sprint 0 tests only
npx vitest run __tests__/sprint0-pdpa.test.ts

# Run all tests
npx vitest run
```

---

## Next Steps

Sprint 0 provides the compliance foundation. Subsequent sprints can build on:

1. **Sprint 1** — Loan Readiness Signal (Safe Language numerics)
2. **Sprint 2** — Campaign Engine ("Ganjaran Kempen" automation)
3. **Sprint 3** — Breach Dashboard (Phase 2 visual incident management)

---

## Architecture Decisions

### Dual-Table Strategy (consent_audit_log vs proof_events)

Per PRD analysis, the system maintains two audit mechanisms:

| Table | Purpose | Retention |
|-------|---------|-----------|
| `consent_audit_log` | PDPA compliance evidence | Regulated (7yr) |
| `proof_events` | Workflow event log | Operational |

This separation ensures compliance requirements don't interfere with day-to-day operations while maintaining a clear audit trail for regulatory purposes.

---

## Files Index

```
lib/
├── types/
│   ├── consent.ts          # Consent type definitions
│   ├── auth-ledger.ts      # Auth event types
│   ├── notification.ts     # Message classification
│   └── breach.ts           # Breach & retention types
├── services/
│   ├── consent-service.ts  # Consent CRUD
│   ├── auth-ledger.ts      # Auth logging
│   ├── notification-service.ts  # Consent-gated dispatch
│   ├── breach-service.ts   # Incident management
│   └── feature-flags.ts    # Flag presets
├── hooks/
│   ├── useConsentGuard.ts  # Client-side gate
│   ├── useAuthLedger.ts    # Auth hook
│   └── useNotification.ts  # Notification hook
└── i18n/
    └── consent.ts          # Bilingual strings

app/buyer/
├── start/
│   └── page.tsx            # Step 0 consent gate

scripts/migrations/
├── 001_consent_schema.sql
├── 002_developer_auth_ledger.sql
└── 003_breach_notification_tables.sql

__tests__/
└── sprint0-pdpa.test.ts    # Integration tests
```

---

**Sprint 0 Complete** 🎉
