-- =============================================================================
-- MIGRATION 006: Incentive Engine
-- S5.1: Incentive Schema | PRD v3.6.3 CR-012
-- =============================================================================
-- Creates:
--   1. incentive_campaigns - Developer-funded campaigns
--   2. incentive_rules - Trigger → Recipient → Reward mappings
--   3. incentive_awards - Individual award instances
--
-- Layer 3 (Partner Incentive) — MUST NOT touch Layer 2 (Credits)
-- Language: "Ganjaran Kempen" (Campaign Rewards), NEVER "Komisen" (Commission)
-- =============================================================================

-- =============================================================================
-- FORBIDDEN TRIGGERS CHECK
-- These triggers MUST NEVER be used (creates approval link)
-- =============================================================================

CREATE OR REPLACE FUNCTION check_forbidden_trigger(trigger_value TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  forbidden_triggers TEXT[] := ARRAY[
    'APPROVED', 'LULUS', 'KELULUSAN', 'CASE_COMPLETED',
    'LOAN_APPROVED', 'LOAN_DISBURSED', 'PINJAMAN_DILULUSKAN'
  ];
BEGIN
  RETURN UPPER(trigger_value) = ANY(forbidden_triggers);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- INCENTIVE CAMPAIGNS TABLE
-- Developer-funded campaigns for buyer/referrer/lawyer incentives
-- =============================================================================

CREATE TABLE IF NOT EXISTS incentive_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Owner
  developer_id TEXT NOT NULL,           -- FK to developer_authorizations
  project_id TEXT NOT NULL,

  -- Campaign metadata
  name TEXT NOT NULL,
  name_bm TEXT NOT NULL,
  description TEXT,
  description_bm TEXT,

  -- Budget (MYR)
  budget_total NUMERIC(12, 2) NOT NULL CHECK (budget_total > 0),
  budget_remaining NUMERIC(12, 2) NOT NULL CHECK (budget_remaining >= 0),
  currency TEXT DEFAULT 'MYR' CHECK (currency = 'MYR'),

  -- Timeline
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,                 -- NULL = no end

  -- Caps
  max_awards_per_case INTEGER DEFAULT 1 CHECK (max_awards_per_case > 0),
  max_awards_per_recipient INTEGER DEFAULT 1 CHECK (max_awards_per_recipient > 0),

  -- Status
  status TEXT DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT', 'ACTIVE', 'PAUSED', 'EXHAUSTED', 'EXPIRED', 'CANCELLED'
  )),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: budget_remaining <= budget_total
  CONSTRAINT chk_budget_remaining CHECK (budget_remaining <= budget_total)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_developer ON incentive_campaigns(developer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_project ON incentive_campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_campaign_status ON incentive_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_active ON incentive_campaigns(status, start_date, end_date)
  WHERE status = 'ACTIVE';

-- =============================================================================
-- INCENTIVE RULES TABLE
-- Defines trigger → recipient → reward mapping within a campaign
-- =============================================================================

CREATE TABLE IF NOT EXISTS incentive_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES incentive_campaigns(id) ON DELETE CASCADE,

  -- Trigger (FORBIDDEN triggers blocked)
  trigger TEXT NOT NULL CHECK (NOT check_forbidden_trigger(trigger)),
  trigger_conditions JSONB DEFAULT '{}'::JSONB,

  -- Recipient (v1: BUYER, REFERRER, LAWYER — NOT AGENT)
  recipient_type TEXT NOT NULL CHECK (recipient_type IN (
    'BUYER', 'REFERRER', 'LAWYER'
  )),

  -- Reward
  reward_type TEXT NOT NULL CHECK (reward_type IN (
    'CASH', 'VOUCHER', 'REBATE', 'CREDIT'
  )),
  reward_amount NUMERIC(10, 2) NOT NULL CHECK (reward_amount > 0),
  reward_description TEXT,              -- e.g., "TnG e-Wallet"

  -- Per-rule caps (override campaign defaults if set)
  max_awards_per_case INTEGER,
  max_awards_per_recipient INTEGER,
  max_total_awards INTEGER,

  -- Counters
  total_awards_issued INTEGER DEFAULT 0,
  total_amount_awarded NUMERIC(12, 2) DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rule_campaign ON incentive_rules(campaign_id);
CREATE INDEX IF NOT EXISTS idx_rule_trigger ON incentive_rules(trigger);
CREATE INDEX IF NOT EXISTS idx_rule_active ON incentive_rules(campaign_id, is_active)
  WHERE is_active = TRUE;

-- =============================================================================
-- INCENTIVE AWARDS TABLE
-- Individual award instances, created when milestone is triggered
-- =============================================================================

CREATE TABLE IF NOT EXISTS incentive_awards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES incentive_rules(id),
  campaign_id UUID NOT NULL REFERENCES incentive_campaigns(id),
  case_id TEXT NOT NULL,

  -- Recipient
  recipient_type TEXT NOT NULL CHECK (recipient_type IN (
    'BUYER', 'REFERRER', 'LAWYER'
  )),
  recipient_id TEXT NOT NULL,           -- Buyer hash, referrer ID, or lawyer ID
  recipient_name TEXT,                  -- For display

  -- Reward
  reward_type TEXT NOT NULL CHECK (reward_type IN (
    'CASH', 'VOUCHER', 'REBATE', 'CREDIT'
  )),
  reward_amount NUMERIC(10, 2) NOT NULL CHECK (reward_amount > 0),
  reward_description TEXT,

  -- Status lifecycle: PENDING → VERIFIED → APPROVED → PAID (or REJECTED / CLAWBACK)
  status TEXT DEFAULT 'PENDING' CHECK (status IN (
    'PENDING', 'VERIFIED', 'APPROVED', 'PAID', 'REJECTED', 'CLAWBACK'
  )),
  status_reason TEXT,                   -- Reason for rejection/clawback

  -- Payout details (populated when PAID)
  paid_at TIMESTAMPTZ,
  payout_reference TEXT,
  payout_method TEXT,                   -- Bank, voucher code, etc.

  -- Verification
  verified_at TIMESTAMPTZ,
  verified_by TEXT,

  -- Trigger context
  triggered_by TEXT NOT NULL,           -- The trigger that created this award
  trigger_proof_event_id UUID,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_award_rule ON incentive_awards(rule_id);
CREATE INDEX IF NOT EXISTS idx_award_campaign ON incentive_awards(campaign_id);
CREATE INDEX IF NOT EXISTS idx_award_case ON incentive_awards(case_id);
CREATE INDEX IF NOT EXISTS idx_award_recipient ON incentive_awards(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_award_status ON incentive_awards(status);
CREATE INDEX IF NOT EXISTS idx_award_pending ON incentive_awards(status, campaign_id)
  WHERE status = 'PENDING';

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Check if case has reached award cap for a rule
CREATE OR REPLACE FUNCTION check_award_cap(
  p_rule_id UUID,
  p_case_id TEXT,
  p_recipient_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_rule incentive_rules%ROWTYPE;
  v_campaign incentive_campaigns%ROWTYPE;
  v_case_count INTEGER;
  v_recipient_count INTEGER;
  v_max_per_case INTEGER;
  v_max_per_recipient INTEGER;
BEGIN
  -- Get rule and campaign
  SELECT * INTO v_rule FROM incentive_rules WHERE id = p_rule_id;
  SELECT * INTO v_campaign FROM incentive_campaigns WHERE id = v_rule.campaign_id;

  -- Determine effective caps (rule overrides campaign if set)
  v_max_per_case := COALESCE(v_rule.max_awards_per_case, v_campaign.max_awards_per_case);
  v_max_per_recipient := COALESCE(v_rule.max_awards_per_recipient, v_campaign.max_awards_per_recipient);

  -- Check case count
  SELECT COUNT(*) INTO v_case_count
  FROM incentive_awards
  WHERE rule_id = p_rule_id
    AND case_id = p_case_id
    AND status NOT IN ('REJECTED', 'CLAWBACK');

  IF v_case_count >= v_max_per_case THEN
    RETURN FALSE;
  END IF;

  -- Check recipient count
  SELECT COUNT(*) INTO v_recipient_count
  FROM incentive_awards
  WHERE rule_id = p_rule_id
    AND recipient_id = p_recipient_id
    AND status NOT IN ('REJECTED', 'CLAWBACK');

  IF v_recipient_count >= v_max_per_recipient THEN
    RETURN FALSE;
  END IF;

  -- Check rule total cap if set
  IF v_rule.max_total_awards IS NOT NULL THEN
    IF v_rule.total_awards_issued >= v_rule.max_total_awards THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Issue an award (with cap and budget checks)
CREATE OR REPLACE FUNCTION issue_award(
  p_rule_id UUID,
  p_case_id TEXT,
  p_recipient_type TEXT,
  p_recipient_id TEXT,
  p_recipient_name TEXT,
  p_triggered_by TEXT,
  p_trigger_proof_event_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_rule incentive_rules%ROWTYPE;
  v_campaign incentive_campaigns%ROWTYPE;
  v_award_id UUID;
BEGIN
  -- Get rule and campaign
  SELECT * INTO v_rule FROM incentive_rules WHERE id = p_rule_id AND is_active = TRUE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rule not found or inactive: %', p_rule_id;
  END IF;

  SELECT * INTO v_campaign FROM incentive_campaigns WHERE id = v_rule.campaign_id AND status = 'ACTIVE';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found or not active: %', v_rule.campaign_id;
  END IF;

  -- Check budget
  IF v_campaign.budget_remaining < v_rule.reward_amount THEN
    RAISE EXCEPTION 'Insufficient campaign budget';
  END IF;

  -- Check caps
  IF NOT check_award_cap(p_rule_id, p_case_id, p_recipient_id) THEN
    RAISE EXCEPTION 'Award cap reached for this case or recipient';
  END IF;

  -- Create award
  INSERT INTO incentive_awards (
    rule_id, campaign_id, case_id,
    recipient_type, recipient_id, recipient_name,
    reward_type, reward_amount, reward_description,
    triggered_by, trigger_proof_event_id
  ) VALUES (
    p_rule_id, v_rule.campaign_id, p_case_id,
    p_recipient_type, p_recipient_id, p_recipient_name,
    v_rule.reward_type, v_rule.reward_amount, v_rule.reward_description,
    p_triggered_by, p_trigger_proof_event_id
  ) RETURNING id INTO v_award_id;

  -- Update rule counters
  UPDATE incentive_rules
  SET total_awards_issued = total_awards_issued + 1,
      total_amount_awarded = total_amount_awarded + v_rule.reward_amount,
      updated_at = NOW()
  WHERE id = p_rule_id;

  RETURN v_award_id;
END;
$$ LANGUAGE plpgsql;

-- Approve award (deducts from budget)
CREATE OR REPLACE FUNCTION approve_award(p_award_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_award incentive_awards%ROWTYPE;
BEGIN
  SELECT * INTO v_award FROM incentive_awards WHERE id = p_award_id AND status = 'VERIFIED';
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Deduct from campaign budget
  UPDATE incentive_campaigns
  SET budget_remaining = budget_remaining - v_award.reward_amount,
      status = CASE
        WHEN budget_remaining - v_award.reward_amount <= 0 THEN 'EXHAUSTED'
        ELSE status
      END,
      updated_at = NOW()
  WHERE id = v_award.campaign_id;

  -- Update award status
  UPDATE incentive_awards
  SET status = 'APPROVED',
      updated_at = NOW()
  WHERE id = p_award_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Active campaigns with budget info
CREATE OR REPLACE VIEW v_active_campaigns AS
SELECT
  c.id,
  c.developer_id,
  c.project_id,
  c.name,
  c.name_bm,
  c.budget_total,
  c.budget_remaining,
  c.budget_total - c.budget_remaining AS budget_spent,
  ROUND((c.budget_total - c.budget_remaining) / c.budget_total * 100, 1) AS budget_used_pct,
  c.start_date,
  c.end_date,
  c.status,
  COUNT(DISTINCT r.id) AS rule_count,
  COALESCE(SUM(r.total_awards_issued), 0) AS total_awards
FROM incentive_campaigns c
LEFT JOIN incentive_rules r ON r.campaign_id = c.id AND r.is_active = TRUE
WHERE c.status = 'ACTIVE'
GROUP BY c.id;

-- Award summary by status
CREATE OR REPLACE VIEW v_award_summary AS
SELECT
  campaign_id,
  status,
  COUNT(*) AS count,
  SUM(reward_amount) AS total_amount
FROM incentive_awards
GROUP BY campaign_id, status;

-- Daily award metrics
CREATE OR REPLACE VIEW v_daily_award_metrics AS
SELECT
  DATE(triggered_at) AS date,
  campaign_id,
  triggered_by,
  recipient_type,
  COUNT(*) AS awards_issued,
  SUM(CASE WHEN status = 'PAID' THEN reward_amount ELSE 0 END) AS amount_paid
FROM incentive_awards
GROUP BY DATE(triggered_at), campaign_id, triggered_by, recipient_type
ORDER BY date DESC;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE incentive_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_awards ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access on incentive_campaigns"
  ON incentive_campaigns FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on incentive_rules"
  ON incentive_rules FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on incentive_awards"
  ON incentive_awards FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_incentive_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_campaign_updated
  BEFORE UPDATE ON incentive_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_incentive_timestamp();

CREATE TRIGGER tr_rule_updated
  BEFORE UPDATE ON incentive_rules
  FOR EACH ROW EXECUTE FUNCTION update_incentive_timestamp();

CREATE TRIGGER tr_award_updated
  BEFORE UPDATE ON incentive_awards
  FOR EACH ROW EXECUTE FUNCTION update_incentive_timestamp();

-- Auto-expire campaigns trigger
CREATE OR REPLACE FUNCTION check_campaign_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date IS NOT NULL AND NEW.end_date < NOW() AND NEW.status = 'ACTIVE' THEN
    NEW.status := 'EXPIRED';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_campaign_expiry
  BEFORE UPDATE ON incentive_campaigns
  FOR EACH ROW EXECUTE FUNCTION check_campaign_expiry();

-- =============================================================================
-- SEED DATA: Default Campaign Templates
-- =============================================================================

-- Note: Actual seed data will be inserted via incentive-service.ts
-- These are template definitions for reference:
--
-- 1. "Ganjaran Penyertaan" — RM20 at DOCS_COMPLETE_CONFIRMED (cap RM5K)
-- 2. "Ganjaran Rujukan" — RM50 at SUBMISSION_ATTESTED (cap RM10K)
-- 3. "Ganjaran Peguam" — RM150 at SUBMISSION_ATTESTED (cap RM15K)

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Tables created:
--   - incentive_campaigns
--   - incentive_rules
--   - incentive_awards
-- Functions created:
--   - check_forbidden_trigger()
--   - check_award_cap()
--   - issue_award()
--   - approve_award()
-- Views created:
--   - v_active_campaigns
--   - v_award_summary
--   - v_daily_award_metrics
--
-- IMPORTANT: Forbidden triggers (APPROVED, LULUS, etc.) are blocked at DB level
-- =============================================================================
