# PRD v3.6.3 — Corrected Alignment Analysis (Refined)

**Date:** 7 February 2026
**Baseline:** PRD v3.6.1 + ESD v1
**Brand:** Snang.my (consumer/agent) | Qontrek (institutional)
**Version:** 1.1 (Refined)

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 7 Feb 2026 | Analysis | Initial alignment corrections |
| 1.1 | 7 Feb 2026 | Refinement | Gap analysis, risk matrix, decision log added |

---

## Executive Summary

This document corrects architectural drift identified in the initial PRD v3.6.3 implementation roadmap. Six critical corrections ensure alignment with the established baseline (PRD v3.6.1 + ESD v1) and compliance frameworks.

**Critical Corrections Applied:**

| # | Correction | Risk if Ignored |
|---|------------|-----------------|
| 1 | Incentive ≠ Credit (Layer separation) | Revenue model confusion, audit failure |
| 2 | Snang.my brand (not Qontrek.my) | Domain strategy violation |
| 3 | Safe Language ("Ganjaran Kempen") | Compliance violation, misrepresentation |
| 4 | Epic 0 prerequisite (PDPA first) | PDPA violation, data collection without consent |
| 5 | Complete consent replacement | Partial compliance, legacy code debt |
| 6 | Phase 2 scaffold (Breach + Retention) | Unpreparedness for mid-2026 requirements |

---

## 1. Three-Layer Architecture (CRITICAL)

### 1.1 Corrected Model

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 3: PARTNER INCENTIVE CAMPAIGNS (NEW — Epic 8)                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Funding Source: Developer / REA Partner (marketing budget) │    │
│  │  Recipients: Buyer, Developer                               │    │
│  │  Purpose: Market awareness, case velocity acceleration      │    │
│  │  Examples: RM50 e-wallet, RM200 voucher, event tickets      │    │
│  │  Label: "Ganjaran Kempen" (Campaign Rewards)                │    │
│  │  ⛔ NEVER: "Komisen", "Credits", "Commission"               │    │
│  └─────────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 2: CREDIT-BASED MONETIZATION (EXISTING)                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Funding Source: Agent/REA (prepaid RM1 tokens)             │    │
│  │  Burn Rate: 20 credits (check) → 475 credits (full case)    │    │
│  │  Purpose: Platform operating revenue                        │    │
│  │  ⛔ NEVER: Mix with Layer 3 incentives                      │    │
│  └─────────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 1: CORE WORKFLOW ENGINE (EXISTING — Epics 1-7)               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Flow: PreScan → Readiness → Portal Kit → Submission        │    │
│  │  Compliance: PRD v3.6.1                                     │    │
│  │  Foundation for Layers 2 & 3                                │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Layer Isolation Rules

| Rule | Enforcement | Violation Example |
|------|-------------|-------------------|
| **L3 ≠ L2** | Different funding sources | Buyer sees "credits" for campaign reward |
| **L3 → L1** | Incentives hook into workflow events | Campaign triggers on `PRESCAN_COMPLETE` |
| **L2 → L1** | Credits burn on workflow actions | Agent pays 20 credits for eligibility check |
| **L3 ⊥ L2** | No cross-references in UI/API | Reward API returns credit balance (wrong) |

### 1.3 Data Model Separation

```sql
-- LAYER 2: Credit System (EXISTING)
CREATE TABLE agent_credits (
  agent_id UUID PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  -- NO reference to campaigns or incentives
);

-- LAYER 3: Incentive System (NEW)
CREATE TABLE reward_claims (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  -- NO reference to agent_credits
);

-- ⛔ ANTI-PATTERN: Never do this
-- reward_claims.credit_equivalent INTEGER -- WRONG
-- agent_credits.campaign_bonus INTEGER -- WRONG
```

---

## 2. Brand & Domain Architecture

### 2.1 Two-Domain Strategy

| Domain | Layer | Audience | Branding |
|--------|-------|----------|----------|
| **snang.my** | Consumer UX | Buyers, REN/REA, Developer Sales | Teal `#0D9488` + Amber `#FBBF24` |
| **qontrek.com** | Institutional | Banks, LPPSA, Compliance, API consumers | Navy `#1E3A5F` + Gray `#64748B` |

### 2.2 Component-to-Domain Mapping

| Component | Domain | Rationale |
|-----------|--------|-----------|
| `PDPAConsentGate.tsx` | snang.my | Buyer-facing consent |
| `CampaignBanner.tsx` | snang.my | Campaign promotion |
| `MilestoneTracker.tsx` | snang.my | Buyer progress |
| `RewardSummary.tsx` | snang.my | Reward display |
| `/admin/campaigns` | qontrek.com | Partner admin |
| `/admin/breach-response` | qontrek.com | Compliance admin |
| `/api/v1/proof-events` | qontrek.com | Institutional API |

### 2.3 Visual Identity Specification

```css
/* snang.my — Consumer/Agent Layer */
:root {
  --snang-primary: #0D9488;      /* Teal */
  --snang-primary-dark: #0A7A70;
  --snang-accent: #FBBF24;       /* Amber */
  --snang-accent-dark: #D97706;
  --snang-text: #111827;
  --snang-bg: #FFFFFF;
}

/* qontrek.com — Institutional Layer */
:root {
  --qontrek-primary: #1E3A5F;    /* Navy */
  --qontrek-secondary: #64748B;  /* Gray */
  --qontrek-accent: #0D9488;     /* Teal (accent only) */
  --qontrek-text: #1F2937;
  --qontrek-bg: #F8FAFC;
}

/* Typography — Both domains */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

.brand-text {
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
}
```

---

## 3. Safe Language Framework

### 3.1 Prohibited Terms

| ⛔ Prohibited | ✅ Safe Alternative | Rationale |
|--------------|---------------------|-----------|
| Komisen | Ganjaran Kempen | Avoids commission = loan approval conflation |
| Commission | Campaign Reward | Same as above (EN) |
| Bonus | Ganjaran | "Bonus" implies guaranteed outcome |
| Cashback | Ganjaran Tunai | "Cashback" implies financial product |
| Rebate | Ganjaran | "Rebate" implies discount on loan |
| Credits (for rewards) | Ganjaran | "Credits" conflicts with Layer 2 |

### 3.2 Milestone Safe Language (Refined)

| Milestone Type | Trigger | Safe Label (EN) | Safe Label (BM) | Risk Level |
|----------------|---------|-----------------|-----------------|------------|
| `PRESCAN_COMPLETE` | Buyer completes Step 1 | Participation Reward | Ganjaran Penyertaan | ✅ Safe |
| `DOCS_UPLOADED` | Buyer uploads documents | Upload Reward | Ganjaran Muat Naik | ✅ Safe |
| `DOCS_VERIFIED` | All docs verified | Document Completion Reward | Ganjaran Dokumen Lengkap | ✅ Safe |
| `APPOINTMENT_ATTENDED` | Buyer attends event | Attendance Reward | Ganjaran Kehadiran | ✅ Safe |
| `SUBMISSION_COMPLETE` | Case submitted to LPPSA | Submission Reward | Ganjaran Penyerahan | ⚠️ Review |
| ~~`LO_RECEIVED`~~ | ~~Letter of Offer~~ | ~~Campaign Reward~~ | ~~Ganjaran Kempen~~ | 🔴 **REMOVED** |
| ~~`CASE_COMPLETED`~~ | ~~Full approval~~ | ~~N/A~~ | ~~N/A~~ | 🔴 **REMOVED** |

### 3.3 Why LO_RECEIVED and CASE_COMPLETED Are Removed

| Milestone | Problem | Audit Framework Reference |
|-----------|---------|---------------------------|
| `LO_RECEIVED` | Ties reward to bank decision, not user action | Safe Language Guidelines §4.2 |
| `CASE_COMPLETED` | Implies reward for LPPSA approval outcome | Safe Language Guidelines §4.3 |

**Alternative for Post-Submission Engagement:**
If partners want to incentivize continued engagement after submission, use:
- `FEEDBACK_SUBMITTED` — "Ganjaran Maklum Balas" (Feedback Reward)
- `REFERRAL_MADE` — "Ganjaran Rujukan" (Referral Reward)

These reward **user actions**, not **external outcomes**.

---

## 4. ESD v1 Epic Synergy

### 4.1 Original vs Revised Epic Structure

**Original ESD v1 (4 Sprints, 7 Epics):**
```
Sprint 1: Epic 2 + 5 (Doc intake + proof_events)
Sprint 2: Epic 1 + 3 Steps 1-2 (Readiness + Draft Preview)
Sprint 3: Epic 3 Step 3 + 4 (Portal Kit + TAC)
Sprint 4: Epic 3 Step 4 + 6 + 7 (Attestation + Security + Training)
```

**Revised (6 Sprints, 9 Epics):**
```
Sprint 0: Epic 0 (PDPA Hard Gate) ← NEW, BLOCKING
Sprint 1: Epic 2 + 5 (Doc intake + proof_events) — now consent-aware
Sprint 2: Epic 1 + 3 Steps 1-2 (Readiness + Draft Preview)
Sprint 3: Epic 3 Step 3 + 4 (Portal Kit + TAC)
Sprint 4: Epic 3 Step 4 + 6 + 7 (Attestation + Security + Training)
Sprint 5: Epic 8 (Incentive Engine) ← NEW, DEPENDS ON 1-4
```

### 4.2 Dependency Graph (Refined)

```
                    ┌─────────────────┐
                    │    EPIC 0       │
                    │  PDPA Hard Gate │
                    │   (Sprint 0)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │  EPIC 2  │  │  EPIC 5  │  │  EPIC 6  │
        │Doc Intake│  │  Proof   │  │ Security │
        │          │  │  Events  │  │  (BYOD)  │
        └────┬─────┘  └────┬─────┘  └──────────┘
             │             │
             ▼             │
        ┌──────────┐       │
        │  EPIC 1  │       │
        │Readiness │       │
        └────┬─────┘       │
             │             │
             ▼             │
        ┌──────────┐       │
        │  EPIC 3  │◄──────┘
        │Portal Kit│
        │Steps 1-4 │
        └────┬─────┘
             │
             ▼
        ┌──────────┐       ┌──────────┐
        │  EPIC 4  │       │  EPIC 7  │
        │   TAC    │       │ Training │
        └────┬─────┘       └──────────┘
             │
             ▼
        ┌──────────┐
        │  EPIC 8  │
        │Incentive │
        │ Engine   │
        │(Sprint 5)│
        └──────────┘
```

### 4.3 Integration Touchpoints (Detailed)

| New Component | Target Epic | Integration Method | Code Location |
|---------------|-------------|-------------------|---------------|
| `PDPAConsentGate.tsx` | Epic 3 (Step 0) | Route guard before `/check` | `app/buyer/start/page.tsx` |
| `consent-service.ts` | Epic 5 | Logs `PDPA_*_GRANTED` events | `lib/services/consent-service.ts` |
| `developer_auth_ledger` | Epic 6 | Extends BYOD audit trail | `scripts/migrations/004_breach.sql` |
| Communication Gating | Epic 2 | `checkConsent()` before WhatsApp | `lib/services/notification-service.ts` |
| `IncentiveEngine` | Epic 1 | `updatePhase()` → `evaluateMilestone()` | `lib/services/case-service.ts` |
| `CampaignBanner.tsx` | Epic 3 | Portal Kit wizard header | `components/portal/PortalWizard.tsx` |

---

## 5. PDPA Compliance Phasing

### 5.1 Malaysia PDPA 2010 Amendment Act (2024) — Three Phases

| Phase | Effective | Key Requirements | v3.6.3 Coverage |
|-------|-----------|------------------|-----------------|
| **Phase 1: Core** | Already effective | Consent, purpose limitation, access rights | CR-010, CR-010A |
| **Phase 2: Processor** | Mid-2026 (est.) | Processor contracts, cross-border, breach 72h | CR-010B, CR-010C, CR-010D |
| **Phase 3: Enhanced** | Late 2026 (est.) | Portability, erasure, DPO | Future scope |

### 5.2 Phase 2 Preparation Deliverables

| CR ID | Deliverable | Effort | Compliance Value |
|-------|-------------|--------|------------------|
| CR-010C | `breach_incidents` table | Low | Demonstrates breach readiness |
| CR-010C | `/admin/breach-response` page | Low | 72-hour notification workflow scaffold |
| CR-010D | `consent_records.retention_period` | Low | Retention policy foundation |
| CR-010D | Consent expiry job stub | Low | Automated compliance prep |
| CR-010D | `DELETE /v1/buyers/{hash}/data` (501) | Low | Right-to-erasure route exists |

### 5.3 Breach Response Schema

```sql
CREATE TABLE breach_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Detection
  detected_at TIMESTAMPTZ NOT NULL,
  detected_by TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

  -- Scope
  affected_records_count INTEGER,
  affected_data_types TEXT[],  -- ['buyer_ic', 'buyer_phone', etc.]
  description TEXT NOT NULL,

  -- Notification (72-hour requirement)
  notified_commissioner_at TIMESTAMPTZ,
  notification_reference TEXT,

  -- Remediation
  remediation_status TEXT DEFAULT 'DETECTED'
    CHECK (remediation_status IN ('DETECTED', 'INVESTIGATING', 'CONTAINED', 'REMEDIATED', 'CLOSED')),
  remediation_notes TEXT,
  remediation_actions TEXT[],

  -- Closure
  closed_at TIMESTAMPTZ,
  root_cause TEXT,
  preventive_measures TEXT[],

  -- Audit
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_breach_severity ON breach_incidents(severity);
CREATE INDEX idx_breach_status ON breach_incidents(remediation_status);
CREATE INDEX idx_breach_detected ON breach_incidents(detected_at);
```

### 5.4 Data Retention Configuration

```typescript
// lib/config/pdpa-retention.ts
export const RETENTION_PERIODS = {
  // Consent-related
  PDPA_BASIC: { years: 7, rationale: 'Loan application lifecycle' },
  PDPA_MARKETING: { years: 2, rationale: 'Marketing consent decay' },
  PDPA_ANALYTICS: { years: 1, rationale: 'Anonymous analytics TTL' },

  // Data categories
  BUYER_PII: { years: 7, rationale: 'Financial records requirement' },
  PROOF_EVENTS: { years: 10, rationale: 'Audit trail for disputes' },
  AGENT_CREDITS: { years: 7, rationale: 'Financial transaction records' },
  CAMPAIGN_REWARDS: { years: 3, rationale: 'Marketing spend audit' },
} as const;

export type RetentionCategory = keyof typeof RETENTION_PERIODS;
```

---

## 6. Sprint 0 Session Breakdown (Refined)

### 6.1 Session Plan

| Session | Focus | Deliverables | Dependencies |
|---------|-------|--------------|--------------|
| **S0.1** | Schema Foundation | `consent_records` table, `consent-service.ts` | None |
| **S0.2** | UI Gate | `PDPAConsentGate.tsx` (BM+EN), `ConsentCheckbox.tsx` | S0.1 |
| **S0.3** | Flow Integration | Route guard, Step 0 → Step 1 blocking | S0.1, S0.2 |
| **S0.4** | Auth Ledger | `developer_auth_ledger` table, tracking service | S0.1 |
| **S0.5** | Comms Gating | `notification-service.ts` consent checks | S0.1 |
| **S0.6** | Phase 2 Scaffold | `breach_incidents` table, retention hooks, deletion stub | S0.1 |
| **S0.7** | QA + Polish | Testing, demo bypass, bilingual verification | S0.1-S0.6 |

### 6.2 Session Deliverables Detail

**S0.1: Schema Foundation**
```
Files:
├── scripts/migrations/003_consent_tables.sql
├── lib/services/consent-service.ts
├── lib/types/consent.ts
└── lib/config/pdpa-retention.ts

Tests:
├── __tests__/consent-service.test.ts
```

**S0.2: UI Gate**
```
Files:
├── components/consent/PDPAConsentGate.tsx
├── components/consent/ConsentCheckbox.tsx
├── components/consent/ConsentSummary.tsx
├── lib/i18n/consent.bm.json
└── lib/i18n/consent.en.json

Tests:
├── __tests__/PDPAConsentGate.test.tsx
```

**S0.3: Flow Integration**
```
Files:
├── app/buyer/start/page.tsx (new route)
├── middleware.ts (consent check)
└── lib/hooks/useConsentGate.ts

Tests:
├── __tests__/consent-flow.integration.test.ts
```

**S0.4: Auth Ledger**
```
Files:
├── scripts/migrations/004_auth_ledger.sql
├── lib/services/auth-ledger-service.ts
└── lib/middleware/audit-middleware.ts

Tests:
├── __tests__/auth-ledger.test.ts
```

**S0.5: Comms Gating**
```
Files:
├── lib/services/notification-service.ts (update)
└── lib/guards/marketing-consent-guard.ts

Tests:
├── __tests__/notification-consent.test.ts
```

**S0.6: Phase 2 Scaffold**
```
Files:
├── scripts/migrations/005_breach_scaffold.sql
├── app/admin/breach-response/page.tsx
├── lib/services/breach-service.ts (stub)
├── app/v1/buyers/[hash]/route.ts (501 stub)
└── lib/jobs/consent-expiry-check.ts (stub)

Tests:
├── __tests__/breach-scaffold.test.ts
```

**S0.7: QA + Polish**
```
Checklist:
├── [ ] All consent types testable via feature flags
├── [ ] Demo mode bypass (PDPA_GATE_ENABLED: false) works
├── [ ] BM/EN toggle works on all consent screens
├── [ ] Consent events logged to proof_events
├── [ ] Auth ledger captures all data access
├── [ ] Notification service respects consent
├── [ ] Breach scaffold admin page accessible
├── [ ] Deletion endpoint returns 501 correctly
```

---

## 7. Sprint 5 Session Breakdown (Incentive Engine)

### 7.1 Session Plan

| Session | Focus | Deliverables | Dependencies |
|---------|-------|--------------|--------------|
| **S5.1** | Campaign Schema | `campaigns`, `campaign_milestones`, `reward_claims` tables | Sprint 0-4 complete |
| **S5.2** | Engine Core | `incentive-engine.ts`, `campaign-manager.ts` | S5.1 |
| **S5.3** | Milestone Logic | `milestone-evaluator.ts`, case-service integration | S5.2 |
| **S5.4** | Reward Calculator | `reward-calculator.ts`, claim tracking | S5.2 |
| **S5.5** | UI Components | `CampaignBanner.tsx`, `MilestoneTracker.tsx` | S5.3, S5.4 |
| **S5.6** | Admin Panel | `/admin/campaigns` CRUD | S5.2 |
| **S5.7** | Partner Portal | Partner campaign management | S5.6 |
| **S5.8** | Buyer Rewards | E-wallet integration stub | S5.4, S5.5 |
| **S5.9** | Reporting | Campaign analytics, payout reports | S5.1-S5.8 |
| **S5.10** | QA + Polish | Safe Language audit, layer isolation verification | S5.1-S5.9 |

### 7.2 Safe Language Audit Checklist (S5.10)

```
Safe Language Verification:
├── [ ] No "Komisen" in any UI text
├── [ ] No "Commission" in any UI text
├── [ ] No "Bonus" in reward labels
├── [ ] No "Cashback" in reward labels
├── [ ] No "Rebate" in reward labels
├── [ ] No "Credits" in incentive context
├── [ ] All rewards use "Ganjaran" prefix
├── [ ] BM translations verified by native speaker
├── [ ] No rewards tied to approval outcomes

Layer Isolation Verification:
├── [ ] No agent_credits reference in reward_claims
├── [ ] No campaign reference in agent_credits
├── [ ] Separate API endpoints (/v1/credits vs /v1/rewards)
├── [ ] UI components don't display credits as rewards
├── [ ] Admin panels clearly separated by domain
```

---

## 8. Risk Assessment Matrix

### 8.1 Risk Register

| ID | Risk | Likelihood | Impact | Severity | Mitigation | Owner |
|----|------|------------|--------|----------|------------|-------|
| R1 | PDPA gate blocks existing demos | Medium | High | **High** | Feature flag bypass | Dev |
| R2 | Credit/Incentive cross-pollination | Low | Critical | **High** | Layer isolation tests | QA |
| R3 | Safe Language violation in UI | Medium | High | **High** | Audit checklist S5.10 | Compliance |
| R4 | Bilingual inconsistency | Medium | Medium | **Medium** | Native speaker review | Content |
| R5 | Phase 2 deadline missed | Low | High | **Medium** | Scaffold in Sprint 0 | Dev |
| R6 | Epic 0 delays Epic 1-4 | Medium | High | **High** | Parallel workstreams | PM |
| R7 | Partner misuses milestone rewards | Low | High | **Medium** | Remove LO/CASE milestones | Product |

### 8.2 Mitigation Details

**R1: PDPA Gate Blocks Demos**
```typescript
// Feature flag in lib/services/feature-flags.ts
PDPA_GATE_ENABLED: process.env.NODE_ENV === 'production' ? true : false,

// Demo mode detection
if (FeatureFlags.DEMO_MODE && !FeatureFlags.PDPA_GATE_ENABLED) {
  // Skip consent gate, log warning
  console.warn('PDPA gate bypassed in demo mode');
}
```

**R2: Layer Cross-Pollination**
```typescript
// Automated test in __tests__/layer-isolation.test.ts
describe('Layer Isolation', () => {
  it('reward_claims has no agent_credits foreign key', async () => {
    const schema = await getTableSchema('reward_claims');
    expect(schema.foreignKeys).not.toContain('agent_credits');
  });

  it('RewardSummary component does not import CreditBalance', () => {
    const imports = getComponentImports('RewardSummary');
    expect(imports).not.toContain('CreditBalance');
  });
});
```

**R6: Epic 0 Delays**
```
Parallel Workstream Strategy:
├── Team A: Epic 0 (PDPA) — Sprint 0
├── Team B: Epic 2 + 5 prep (Doc intake scaffolding) — Sprint 0
│           └── Cannot collect data, but can build UI shells
└── Merge: Sprint 1 start — Epic 0 complete, Epic 2+5 data-aware
```

---

## 9. Decision Log

| ID | Decision | Rationale | Date | Approver |
|----|----------|-----------|------|----------|
| D1 | Remove `CASE_COMPLETED` milestone | Rewards tied to approval outcome violate Safe Language | 7 Feb | Product |
| D2 | Remove `LO_RECEIVED` milestone | Letter of Offer is bank decision, not user action | 7 Feb | Product |
| D3 | Remove `AGENT` from incentive recipients | Agents use credit system (Layer 2), not incentives (Layer 3) | 7 Feb | Arch |
| D4 | Sprint 0 before Sprint 1 | PDPA is blocking prerequisite for data collection | 7 Feb | PM |
| D5 | Add CR-010C, CR-010D | Phase 2 preparation worth low effort | 7 Feb | Compliance |
| D6 | 17 sessions (not 16) | S0.7 for breach scaffold + bilingual QA | 7 Feb | PM |

---

## 10. Glossary

| Term | Definition | Layer |
|------|------------|-------|
| **Ganjaran Kempen** | Campaign Reward — partner-funded incentive | Layer 3 |
| **Credits** | Prepaid tokens (RM1 each) for platform services | Layer 2 |
| **Proof Event** | Immutable audit log entry | Layer 1 |
| **Epic** | ESD v1 development unit | Planning |
| **Sprint** | Time-boxed development cycle | Planning |
| **Session** | Single focused work unit within a sprint | Planning |

---

## 11. Appendix: Change Request Summary

### 11.1 CR Matrix

| CR ID | Title | Epic | Sprint | Sessions | Priority |
|-------|-------|------|--------|----------|----------|
| CR-010 | PDPA Compliance Gate | Epic 0 | 0 | S0.1-S0.3 | P0 |
| CR-010A | Granular Consent System | Epic 0 | 0 | S0.2 | P0 |
| CR-010B | Developer Authorization Ledger | Epic 0 | 0 | S0.4 | P0 |
| CR-010C | Breach Response Scaffold | Epic 0 | 0 | S0.6 | P0 |
| CR-010D | Data Retention & Deletion Hooks | Epic 0 | 0 | S0.6 | P0 |
| CR-011 | Communication Gating | Epic 0 | 0 | S0.5 | P0 |
| CR-012 | Incentive Engine v1 | Epic 8 | 5 | S5.1-S5.6 | P1 |
| CR-012A | External Recipients (Buyer/Developer) | Epic 8 | 5 | S5.7-S5.8 | P1 |

### 11.2 File Creation Summary

**Sprint 0 (PDPA) — 18 files**
```
lib/services/consent-service.ts
lib/services/auth-ledger-service.ts
lib/services/breach-service.ts
lib/services/notification-service.ts (update)
lib/config/pdpa-retention.ts
lib/types/consent.ts
lib/hooks/useConsentGate.ts
lib/guards/marketing-consent-guard.ts
lib/middleware/audit-middleware.ts
lib/jobs/consent-expiry-check.ts
lib/i18n/consent.bm.json
lib/i18n/consent.en.json
components/consent/PDPAConsentGate.tsx
components/consent/ConsentCheckbox.tsx
components/consent/ConsentSummary.tsx
scripts/migrations/003_consent_tables.sql
scripts/migrations/004_auth_ledger.sql
scripts/migrations/005_breach_scaffold.sql
app/buyer/start/page.tsx
app/admin/breach-response/page.tsx
app/v1/buyers/[hash]/route.ts
```

**Sprint 5 (Incentives) — 14 files**
```
lib/incentives/incentive-engine.ts
lib/incentives/campaign-manager.ts
lib/incentives/milestone-evaluator.ts
lib/incentives/reward-calculator.ts
lib/types/campaign.ts
lib/types/milestone.ts
lib/i18n/rewards.bm.json
lib/i18n/rewards.en.json
components/incentives/CampaignBanner.tsx
components/incentives/MilestoneTracker.tsx
components/incentives/RewardSummary.tsx
app/admin/campaigns/page.tsx
app/partner/campaigns/page.tsx
scripts/migrations/006_incentive_tables.sql
```

---

## 12. Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product | | | |
| Architecture | | | |
| Compliance | | | |
| Engineering Lead | | | |

---

<div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #0D9488 0%, #1E3A5F 100%); color: white; font-family: 'DM Sans', sans-serif; border-radius: 8px;">
  <strong style="font-size: 1.2em;">Snang<span style="color: #FBBF24;">.</span>my</strong>
  <span style="opacity: 0.7; margin: 0 10px;">×</span>
  <strong style="font-size: 1.2em;">Qontrek</strong>
  <br/>
  <small style="opacity: 0.8;">PRD v3.6.3 Alignment Analysis — Refined</small>
</div>

---

*Document refined from initial alignment analysis, incorporating gap analysis, risk assessment, and decision log.*
