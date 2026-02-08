# PRD v3.6.3 Implementation Roadmap (Corrected)
## Snang<span style="color:#FBBF24">.</span>my Mortgage Flow Engine

---

### ⚠️ Alignment Corrections Applied (7 Feb 2026)

| Item | Original | Corrected |
|------|----------|-----------|
| **Brand** | Qontrek.my | **Snang.my** (consumer/agent), **Qontrek** (institutional) |
| **Incentive vs Credits** | Unclear | Incentive = **Layer 3 ON TOP** of credit model |
| **Commission language** | `agent_commissions` | Reframe as **"Ganjaran Kempen"** |
| **ESD integration** | Parallel Sprint 4-6 | **Epic 0** (PDPA) → Epics 1-7 → **Epic 8** (Incentive) |
| **PDPA consent** | Enhancement | **Complete replacement** |
| **PDPA phases** | Single Sprint 4 | Phase-mapped with **breach scaffold** |
| **Total sessions** | 16 | **17** (+S0.7 breach scaffold) |

---

### Brand Identity (Corrected)

**Two-Domain Architecture:**

| Domain | Purpose | Audience |
|--------|---------|----------|
| **snang.my** | Buyer & Agent UX, campaigns, incentives | Buyers, REN/REA, Developer sales |
| **qontrek.com** | Authority, governance, proof ledger, API | Banks, LPPSA, compliance, institutional |

**Snang.my Visual Identity:**

| Element | Value |
|---------|-------|
| **Logo Variant** | #12 — White on Teal (Reversed) |
| **Font** | DM Sans 600 (SemiBold) |
| **Background** | Solid Teal `#0D9488` |
| **Text Color** | White `#FFFFFF` |
| **Dot Accent** | Amber `#FBBF24` |
| **Feel** | Confident, clean, trustworthy |

---

**Generated:** 2026-02-07 (Corrected)
**PRD Version:** v3.6.3 (from v3.6.1 + ESD v1 baseline)
**Status:** Planning Phase — Aligned

---

## Three-Layer Architecture (CRITICAL)

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: PARTNER INCENTIVE CAMPAIGNS (NEW - Epic 8)            │
│  Funded by: Developer / REA partner                             │
│  Recipients: Buyer, Developer                                   │
│  Purpose: Market awareness, case velocity                       │
│  Examples: RM50 e-wallet, RM200 voucher                         │
│  Label: "Ganjaran Kempen" (Campaign Rewards)                    │
│  ⚠️ NEVER cross-pollute with credits                            │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: CREDIT-BASED MONETIZATION (EXISTING)                  │
│  Funded by: Agent/REA (prepaid RM1 tokens)                      │
│  Burns: 20 credits (check) → 475 credits (full)                 │
│  Revenue: Platform operating income                             │
│  ⚠️ Credits ≠ Incentives — different funding sources            │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 1: CORE WORKFLOW ENGINE (EXISTING - Epics 1-7)           │
│  PreScan → Readiness → Portal Kit → Submission                  │
│  PRD v3.6.1 compliant                                           │
└─────────────────────────────────────────────────────────────────┘
```

**Key Distinction:**
- **Credits** = Platform's revenue engine (agents PAY to use)
- **Incentives** = Partner's marketing spend (partners PAY to accelerate)
- A buyer earning RM50 e-wallet from a developer campaign should **NEVER** see that as "credits"

---

## Change Requests (Corrected)

### Priority 0 (P0) - PDPA Compliance Block → Epic 0

| CR ID | Title | Impact | Effort |
|-------|-------|--------|--------|
| CR-010 | PDPA Compliance Gate (Step 0) | **Critical** - Blocks all data collection | Medium |
| CR-010A | Granular Consent System | High - Required for PDPA compliance | Medium |
| CR-010B | Developer Authorization Ledger | High - Audit trail requirement | Low |
| CR-010C | **Breach Response Scaffold (NEW)** | Medium - Phase 2 prep | Low |
| CR-010D | **Data Retention & Deletion Hooks (NEW)** | Medium - Phase 2 prep | Low |
| CR-011 | Communication Gating | High - No comms without consent | Low |

### Priority 1 (P1) - Incentive Engine → Epic 8

| CR ID | Title | Impact | Effort |
|-------|-------|--------|--------|
| CR-012 | Incentive Engine v1 | Medium - Campaign rewards | High |
| CR-012A | External Recipients (Reframed) | Medium - "Ganjaran Kempen" tracking | Medium |

---

## ESD v1 Epic Synergy (Corrected)

### Revised Dependency Graph

```
EPIC 0 (NEW: PDPA Gate) ──→ EPIC 2 ──→ EPIC 1 ──→ EPIC 3 ──→ EPIC 4
         │                                              │
         v                                              v
    EPIC 5 (Proof Events)                          EPIC 8 (NEW: Incentive)
         │
         v
    EPIC 6 & EPIC 7
```

**Rationale:**
- PDPA consent MUST precede document intake (Epic 2)
- No data collection permitted without consent
- Epic 0 is a **true hard prerequisite**
- Same principle as "Do NOT ship Epic 3 without Epic 5"

### Revised Sprint Plan (6 Sprints)

| Sprint | Epics | Focus | Sessions |
|--------|-------|-------|----------|
| **0 (NEW)** | Epic 0: PDPA Hard Gate | Consent schema, UI gate, comms gating, auth ledger, breach scaffold | S0.1–S0.7 |
| 1 | Epic 2 + 5 | Doc intake + proof_events (now consent-aware) | Existing |
| 2 | Epic 1 + 3 (Steps 1-2) | Readiness + Draft Preview | Existing |
| 3 | Epic 3 (Step 3) + 4 | Portal Kit + TAC | Existing |
| 4 | Epic 3 (Step 4) + 6 + 7 | Attestation + Security + Training | Existing |
| **5 (NEW)** | Epic 8: Incentive Engine | Campaign schema, engine, UI, admin, reporting | S5.1–S5.10 |

**Why Sprint 0, not Sprint 4:**
PDPA is a **blocking prerequisite** — must be built FIRST before any data-collecting Epic runs.

**Why Incentive goes last (Sprint 5):**
Depends on case lifecycle events (PRESCAN_COMPLETE, DOCS_VERIFIED) produced by Epics 1-4. Building incentives before core workflow = nothing triggers milestones.

---

## Sprint 0: PDPA Hard Gate (Epic 0)

### Session Breakdown (7 Sessions)

| Session | Focus | Deliverables |
|---------|-------|--------------|
| **S0.1** | Schema + Service | `consent_records` table, `consent-service.ts` |
| **S0.2** | UI Gate | `PDPAConsentGate.tsx` (BM + EN), `ConsentCheckbox.tsx` |
| **S0.3** | Flow Integration | Portal Step 0 → Step 1 blocking logic |
| **S0.4** | Auth Ledger | `developer_auth_ledger` table + tracking |
| **S0.5** | Comms Gating | `notification-service.ts` consent checks |
| **S0.6** | Breach Scaffold + Retention | `breach_incidents` table, retention hooks, deletion endpoint stub |
| **S0.7** | QA + Polish | Testing, edge cases, demo bypass, **bilingual verification** |

### CR-010: PDPA Compliance Gate (Complete Replacement)

**IMPORTANT:** This is a **complete replacement**, not enhancement. The existing demo consent checkbox (Lines 379-395 in Feature Truth Table) is removed entirely.

**Migration Notes:**
- Deprecate `CONSENT_GIVEN` proof event
- Replace with granular types: `PDPA_BASIC_GRANTED`, `PDPA_MARKETING_GRANTED`, `PDPA_ANALYTICS_GRANTED`
- Demo mode bypass via `PDPA_GATE_ENABLED: false` preserves backward compatibility

**Implementation:**

```
components/
├── consent/
│   ├── PDPAConsentGate.tsx      # Full-screen consent gate (BM + EN)
│   ├── ConsentCheckbox.tsx      # Individual consent item
│   └── ConsentSummary.tsx       # Display granted consents
```

**Database Schema:**
```sql
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_hash TEXT NOT NULL,
  consent_type TEXT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  retention_period INTERVAL,  -- CR-010D: Phase 2 prep
  ip_hash TEXT,
  consent_version TEXT NOT NULL,
  revoked_at TIMESTAMPTZ,
  UNIQUE(buyer_hash, consent_type)
);
```

### CR-010A: Granular Consent System

| Type | Required | Description |
|------|----------|-------------|
| `PDPA_BASIC` | ✅ Yes | Basic data processing for loan application |
| `PDPA_MARKETING` | ❌ No | Marketing communications |
| `PDPA_ANALYTICS` | ❌ No | Anonymous usage analytics |
| `PDPA_THIRD_PARTY` | ⚠️ Situational | Sharing with LPPSA/banks |

**UI Requirements:**
- Clear explanation of each consent type
- Individual toggles with descriptions
- "View Full PDPA Notice" link (bilingual)
- Timestamp shown on confirmation
- **Brand:** Teal `#0D9488` buttons, Amber `#FBBF24` accent on checkmarks
- **Bilingual:** BM/EN toggle via existing navbar switcher

### CR-010B: Developer Authorization Ledger

```sql
CREATE TABLE developer_auth_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  action_type TEXT NOT NULL,
  buyer_hash TEXT,
  data_accessed TEXT[],
  performed_by TEXT,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address_hash TEXT,
  justification TEXT
);

CREATE INDEX idx_ledger_project ON developer_auth_ledger(project_id);
CREATE INDEX idx_ledger_buyer ON developer_auth_ledger(buyer_hash);
```

**Tracked Actions:**
- `VIEW_BUYER_DATA`
- `EXPORT_BUYER_DATA`
- `SHARE_WITH_BANK`
- `MODIFY_BUYER_DATA`
- `DELETE_BUYER_DATA`

### CR-010C: Breach Response Scaffold (NEW - Phase 2 Prep)

**Purpose:** Demonstrates readiness to Commissioner's office. Scaffold now, configure later.

```sql
CREATE TABLE breach_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_at TIMESTAMPTZ NOT NULL,
  severity TEXT NOT NULL,  -- LOW, MEDIUM, HIGH, CRITICAL
  affected_records_count INTEGER,
  description TEXT,
  notified_commissioner_at TIMESTAMPTZ,
  remediation_status TEXT DEFAULT 'DETECTED',
  remediation_notes TEXT,
  closed_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Admin Route:** `/admin/breach-response` (incident logging form)

### CR-010D: Data Retention & Deletion Hooks (NEW - Phase 2 Prep)

```typescript
// lib/services/consent-service.ts
interface RetentionConfig {
  PDPA_BASIC: '7 years',      // Loan application records
  PDPA_MARKETING: '2 years',  // Marketing consent
  PDPA_ANALYTICS: '1 year',   // Analytics consent
}

// Scheduled job stub for consent expiry checks
async function checkConsentExpiry() {
  // TODO: Implement when Phase 2 takes effect
  console.log('Consent expiry check - not implemented');
}
```

**API Endpoint (Stub):**
```typescript
// DELETE /v1/buyers/{hash}/data
// Returns 501 Not Implemented for now, but route exists
app.delete('/v1/buyers/:hash/data', (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Data deletion will be available when PDPA Phase 2 takes effect',
    pdpa_phase: 2,
    estimated_effective: '2026-H2'
  });
});
```

### CR-011: Communication Gating

**Rule:** No SMS/email/WhatsApp unless `PDPA_MARKETING` consent granted.

```typescript
// lib/services/notification-service.ts
async function sendNotification(type: NotificationType, buyerHash: string) {
  const hasConsent = await checkConsent(buyerHash, 'PDPA_MARKETING');

  if (!hasConsent && type !== 'TRANSACTIONAL') {
    throw new ConsentRequiredError('PDPA_MARKETING consent not granted');
  }

  // Proceed with notification
}
```

**Exception:** Transactional messages (OTP, appointment confirmations) allowed under `PDPA_BASIC`.

---

## Sprint 5: Incentive Engine (Epic 8)

### Session Breakdown (10 Sessions)

| Session | Focus | Deliverables |
|---------|-------|--------------|
| **S5.1** | Campaign Schema | `campaigns`, `campaign_milestones` tables |
| **S5.2** | Engine Core | `incentive-engine.ts`, `campaign-manager.ts` |
| **S5.3** | Milestone Logic | `milestone-evaluator.ts`, trigger integration |
| **S5.4** | Reward Calculator | `reward-calculator.ts`, claim tracking |
| **S5.5** | UI Components | `CampaignBanner.tsx`, `MilestoneTracker.tsx` |
| **S5.6** | Admin Panel | `app/admin/campaigns/page.tsx` |
| **S5.7** | Partner Recipient | Partner/Developer reward tracking |
| **S5.8** | Buyer Recipient | Buyer reward tracking (e-wallet integration stub) |
| **S5.9** | Reporting | Campaign reports, payout summaries |
| **S5.10** | QA + Polish | Testing, edge cases, budget guards |

### CR-012: Incentive Engine v1 (Layer 3)

**Architecture:**

```
lib/
├── incentives/
│   ├── incentive-engine.ts       # Core engine
│   ├── campaign-manager.ts       # Campaign CRUD
│   ├── milestone-evaluator.ts    # Check trigger conditions
│   └── reward-calculator.ts      # Calculate rewards
components/
├── incentives/
│   ├── CampaignBanner.tsx        # Show active campaign (snang.my branding)
│   ├── MilestoneTracker.tsx      # Progress indicator
│   └── RewardSummary.tsx         # "Ganjaran Kempen" display
```

**Campaign Schema:**
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,
  name_bm TEXT,  -- Bilingual support
  description TEXT,
  funded_by TEXT NOT NULL,  -- 'DEVELOPER' | 'REA_PARTNER'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'DRAFT',
  budget DECIMAL(12,2),
  spent DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaign_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  milestone_type TEXT NOT NULL,
  trigger_phase TEXT,
  reward_type TEXT NOT NULL,
  reward_value DECIMAL(10,2),
  reward_label TEXT NOT NULL,     -- Safe language label
  reward_label_bm TEXT NOT NULL,  -- BM translation
  max_claims INTEGER,
  claimed_count INTEGER DEFAULT 0
);

CREATE TABLE reward_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  milestone_id UUID REFERENCES campaign_milestones(id),
  case_id UUID REFERENCES cases(id),
  recipient_type TEXT NOT NULL,  -- 'BUYER' | 'DEVELOPER'
  recipient_id TEXT NOT NULL,
  reward_amount DECIMAL(10,2),
  status TEXT DEFAULT 'PENDING',
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);
```

### CR-012A: Milestone Safe Language (CORRECTED)

**⚠️ CRITICAL: Use "Ganjaran Kempen" (Campaign Rewards), NEVER "Komisen" (Commission)**

| Type | Trigger | Label (EN) | Label (BM) | Safe? |
|------|---------|------------|------------|-------|
| `PRESCAN_COMPLETE` | Buyer completes Step 1 | "Participation Reward" | "Ganjaran Penyertaan" | ✅ |
| `DOCS_VERIFIED` | All docs verified | "Document Completion Reward" | "Ganjaran Dokumen Lengkap" | ✅ |
| `LO_RECEIVED` | Letter of Offer received | "Campaign Reward" | "Ganjaran Kempen" | ⚠️ Review |
| ~~`CASE_COMPLETED`~~ | ~~Full completion~~ | ~~"RM500 cash"~~ | ~~Removed~~ | 🔴 **REMOVED** |

**Why CASE_COMPLETED Removed:**
Tying rewards to full case completion (implies LPPSA approval) crosses into territory the audit framework warns against. Rewarding approval outcomes ≠ safe.

**Alternative (if needed):**
`SUBMISSION_COMPLETE` — "Ganjaran Penyerahan Lengkap" — rewards the **act of submission**, not approval.

### Recipient Types (Corrected)

| Type | Description | Payment Method |
|------|-------------|----------------|
| `BUYER` | The loan applicant | E-wallet / Bank transfer |
| `DEVELOPER` | Project developer funding the campaign | Internal credit |
| ~~`AGENT`~~ | ~~Sales agent~~ | **REMOVED** — Agents use credit system, not incentives |

**Why AGENT Removed from Incentive Recipients:**
Agent compensation flows through Layer 2 (credit-based monetization). Mixing agent payments into Layer 3 (partner incentives) causes cross-pollination that violates the three-layer architecture.

---

## PDPA Phase Compliance Map

| PDPA Phase | Effective | Requirement | v3.6.3 Coverage | Gap |
|------------|-----------|-------------|-----------------|-----|
| **Phase 1: Core** | Already effective | Consent, purpose limitation, access rights | CR-010, CR-010A | ✅ Covered |
| **Phase 2: Processor** | Mid-2026 (est.) | Processor contracts, cross-border, breach notification 72h | CR-010B (partial), CR-010C (scaffold) | ⚠️ Partial |
| **Phase 3: Enhanced** | Late 2026 (est.) | Portability, right to be forgotten, mandatory DPO | Not in scope | 🔴 Future |

**Phase 2 Preparation Strategy:**
Build the scaffold now (database schema, admin routes). When Phase 2 takes effect, compliance = configuration change, not a sprint.

---

## Integration Touchpoints

| New Component | Hooks Into | How |
|---------------|-----------|-----|
| `PDPAConsentGate.tsx` | Epic 3, Step 0 | New route: `snang.my/start` → consent → `/check` |
| `consent-service.ts` | Epic 5 proof_events | `CONSENT_GRANTED` logged as proof event |
| `developer_auth_ledger` | Epic 6 Security | Extends BYOD safeguards to data access audit |
| Communication Gating | Epic 2 (WhatsApp) | `RequestMissingDocsCTA` checks `PDPA_MARKETING` |
| `IncentiveEngine` | Epic 1 case-service | `updatePhase()` triggers milestone evaluation |
| `CampaignBanner.tsx` | Epic 3 Portal Kit | Shows active campaign in buyer journey header |

---

## Implementation Timeline (Session-Based)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SPRINT 0: PDPA HARD GATE (Epic 0) — BLOCKING PREREQUISITE              │
├─────────────────────────────────────────────────────────────────────────┤
│  S0.1  │  S0.2  │  S0.3  │  S0.4  │  S0.5  │  S0.6  │  S0.7            │
│ Schema │   UI   │  Flow  │ Ledger │ Comms  │ Breach │   QA             │
│  + Svc │  Gate  │ Integ  │ Audit  │ Gate   │Scaffold│ Polish           │
│        │ BM+EN  │        │        │        │ Retain │ Bilingual        │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  SPRINTS 1-4: EXISTING ESD v1 EPICS (Epics 1-7)                         │
│  Now consent-aware — all data collection checks PDPA gate first         │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  SPRINT 5: INCENTIVE ENGINE (Epic 8) — LAYER 3 OVERLAY                  │
├─────────────────────────────────────────────────────────────────────────┤
│  S5.1  │  S5.2  │  S5.3  │  S5.4  │  S5.5  │  S5.6  │  S5.7  │  S5.8  │
│Campaign│ Engine │  Mile- │ Reward │   UI   │ Admin  │Partner │ Buyer  │
│ Schema │  Core  │ stones │  Calc  │ Comps  │ Panel  │ Recip  │ Recip  │
├─────────────────────────────────────────────────────────────────────────┤
│  S5.9  │ S5.10  │                                                       │
│ Report │   QA   │                                                       │
│  -ing  │ Polish │                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

**Session Effort Estimate (Corrected):**
- Sprint 0 (PDPA): **7 sessions**
- Sprints 1-4 (ESD v1): **Existing**
- Sprint 5 (Incentives): **10 sessions**
- **Total New Work: 17 sessions**

---

## UI/Brand Guidelines (Snang.my)

### Color Palette

```css
:root {
  /* Primary - Snang.my */
  --snang-teal: #0D9488;
  --snang-teal-dark: #0A7A70;
  --snang-teal-light: #14B8A6;

  /* Accent - Snang.my */
  --snang-amber: #FBBF24;
  --snang-amber-dark: #D97706;

  /* Institutional - Qontrek */
  --qontrek-navy: #1E3A5F;
  --qontrek-gray: #64748B;

  /* Neutral */
  --white: #FFFFFF;
  --gray-50: #F9FAFB;
  --gray-900: #111827;
}
```

### Typography

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

.snang-brand {
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
}

.snang-logo-dot {
  color: #FBBF24; /* Amber accent */
}
```

### Domain-Specific Branding

| Component | Domain | Brand |
|-----------|--------|-------|
| `CampaignBanner.tsx` | snang.my | Teal + Amber |
| `MilestoneTracker.tsx` | snang.my | Teal + Amber |
| `RewardSummary.tsx` | snang.my | Teal + Amber |
| `/admin/campaigns` | qontrek.com | Navy + Gray |
| `/admin/breach-response` | qontrek.com | Navy + Gray |

---

## Feature Flags

```typescript
// Add to lib/services/feature-flags.ts

// PDPA Flags
PDPA_GATE_ENABLED: true,        // Enable Step 0 PDPA gate
PDPA_STRICT_MODE: false,        // Block all without consent (prod)
PDPA_BREACH_SCAFFOLD: true,     // Enable breach incident logging

// Incentive Flags
INCENTIVE_ENGINE: false,        // Enable incentive system
INCENTIVE_BUYER_REWARDS: true,  // Enable buyer rewards
INCENTIVE_DEVELOPER_REWARDS: true, // Enable developer rewards
// INCENTIVE_AGENT_REWARDS: REMOVED — agents use credit system
```

---

## Risk Assessment (Updated)

| Risk | Impact | Mitigation |
|------|--------|------------|
| PDPA gate blocks demo flow | High | Feature flag to bypass in demo mode |
| ~~Incentive budget overrun~~ | ~~Medium~~ | Budget caps + admin alerts |
| ~~Commission disputes~~ | **REMOVED** | Agent payments via credit system, not incentives |
| Credit/Incentive cross-pollination | **HIGH** | Strict layer separation, different UI labels |
| Safe language violation | High | Pre-defined labels, no freetext rewards |
| Bilingual inconsistency | Medium | BM/EN review in S0.7, S5.10 |

---

## Success Metrics

### PDPA Compliance (Sprint 0)
- [ ] 100% consent capture before data collection
- [ ] < 5% consent screen abandonment
- [ ] Complete audit trail for all data access
- [ ] Breach scaffold ready for Phase 2
- [ ] Bilingual (BM/EN) coverage 100%

### Incentive Engine (Sprint 5)
- [ ] Campaign creation < 5 minutes
- [ ] Milestone trigger accuracy 100%
- [ ] Zero "Komisen" language in UI (Safe Language audit pass)
- [ ] Layer 3 isolation verified (no credit cross-pollination)

---

## Next Steps

| Priority | Action | Owner |
|----------|--------|-------|
| 1 | ✅ Approve corrected roadmap | Stakeholder |
| 2 | Begin S0.1 (PDPA Schema + Service) | Dev |
| 3 | Design consent UI mockups (BM + EN) | Design |
| 4 | Define Safe Language glossary | Compliance |
| 5 | Review CASE_COMPLETED milestone decision | Product |

---

## Appendix: Files to Create

### Sprint 0 (PDPA) — Sessions S0.1 to S0.7
```
lib/services/consent-service.ts
lib/services/notification-service.ts (update)
components/consent/PDPAConsentGate.tsx
components/consent/ConsentCheckbox.tsx
components/consent/ConsentSummary.tsx
scripts/migrations/003_consent_tables.sql
scripts/migrations/004_breach_tables.sql
app/admin/breach-response/page.tsx
app/v1/buyers/[hash]/route.ts (deletion stub)
```

### Sprint 5 (Incentives) — Sessions S5.1 to S5.10
```
lib/incentives/incentive-engine.ts
lib/incentives/campaign-manager.ts
lib/incentives/milestone-evaluator.ts
lib/incentives/reward-calculator.ts
components/incentives/CampaignBanner.tsx
components/incentives/MilestoneTracker.tsx
components/incentives/RewardSummary.tsx
app/admin/campaigns/page.tsx
scripts/migrations/005_incentive_tables.sql
```

---

<div style="text-align: center; padding: 20px; background: #0D9488; color: white; font-family: 'DM Sans', sans-serif;">
  <strong>Snang<span style="color: #FBBF24;">.</span>my</strong> — Confident. Clean. Trustworthy.<br/>
  <small style="opacity: 0.8;">Powered by Qontrek Authority Engine</small>
</div>

*Document corrected from PRD v3.6.3 alignment analysis (7 Feb 2026)*
