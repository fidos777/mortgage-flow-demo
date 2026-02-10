-- ============================================================================
-- CR-009C: Spillover System
-- Migration: 004_spillover_system.sql
-- Description: Spillover consent and matching for Category A → Category B flow
-- ============================================================================

-- ============================================================================
-- SPILLOVER CONSENTS TABLE
-- Tracks buyer consent to receive alternative property options
-- ============================================================================
CREATE TABLE IF NOT EXISTS spillover_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Buyer Reference
    case_id UUID NOT NULL REFERENCES mortgage_cases(id) ON DELETE CASCADE,
    buyer_name VARCHAR(255) NOT NULL,
    buyer_phone VARCHAR(20),
    buyer_email VARCHAR(255),

    -- Original Application Context
    original_property_id UUID REFERENCES properties(id),
    original_developer_id UUID NOT NULL REFERENCES developers(id),

    -- Eligibility Failure Reason
    rejection_reason VARCHAR(100) NOT NULL CHECK (rejection_reason IN (
        'dsr_exceeded',         -- DSR > 60%
        'income_insufficient',  -- Income below threshold
        'credit_score_low',     -- Credit issues
        'age_restriction',      -- Age limit issues
        'property_sold',        -- Unit no longer available
        'other'
    )),
    rejection_details JSONB,    -- { dsr_value: 72, threshold: 60 }

    -- Consent Decision
    consent_given BOOLEAN NOT NULL,
    consent_timestamp TIMESTAMPTZ,
    consent_ip INET,
    declined_reason VARCHAR(255), -- If consent_given = false

    -- Matching Criteria (anonymized, shared with Category B)
    matching_criteria JSONB NOT NULL DEFAULT '{}',
    -- Expected structure:
    -- {
    --   "price_min": 300000,
    --   "price_max": 500000,
    --   "preferred_states": ["Selangor", "Kuala Lumpur"],
    --   "preferred_cities": ["Shah Alam", "Petaling Jaya"],
    --   "property_types": ["condominium", "apartment"],
    --   "max_dsr": 65,
    --   "income_bracket": "mid"
    -- }

    -- Processing Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Awaiting buyer decision
        'consented',    -- Buyer agreed to spillover
        'declined',     -- Buyer declined
        'matched',      -- Matches found
        'contacted',    -- Category B agents contacted buyer
        'converted',    -- Buyer converted to Category B property
        'expired'       -- Consent expired without conversion
    )),
    expires_at TIMESTAMPTZ,     -- Consent validity period

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SPILLOVER MATCHES TABLE
-- Tracks matched Category B properties for consented spillover buyers
-- ============================================================================
CREATE TABLE IF NOT EXISTS spillover_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    consent_id UUID NOT NULL REFERENCES spillover_consents(id) ON DELETE CASCADE,
    matched_property_id UUID NOT NULL REFERENCES properties(id),
    matched_developer_id UUID NOT NULL REFERENCES developers(id),
    matched_agent_id UUID REFERENCES mortgage_agents(id),

    -- Match Quality
    match_score DECIMAL(3,2) NOT NULL DEFAULT 0.00, -- 0.00 to 1.00
    match_factors JSONB,
    -- Expected structure:
    -- {
    --   "price_match": 0.95,
    --   "location_match": 0.80,
    --   "type_match": 1.00,
    --   "dsr_compatibility": 0.90
    -- }

    -- Contact Tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Match created, not yet contacted
        'queued',       -- In agent's queue
        'contacted',    -- Agent reached out
        'interested',   -- Buyer showed interest
        'viewing',      -- Scheduled property viewing
        'applied',      -- Buyer submitted new application
        'converted',    -- Successfully converted
        'rejected',     -- Buyer rejected this match
        'expired'       -- Match expired
    )),
    contacted_at TIMESTAMPTZ,
    first_response_at TIMESTAMPTZ,

    -- Conversion Tracking
    converted_at TIMESTAMPTZ,
    new_case_id UUID REFERENCES mortgage_cases(id), -- New mortgage case if converted

    -- Commission (Revenue!)
    commission_rate DECIMAL(5,4) DEFAULT 0.0100,    -- 1% default
    commission_amount DECIMAL(12,2),
    commission_status VARCHAR(20) DEFAULT 'pending' CHECK (commission_status IN (
        'pending',      -- Not yet calculated
        'calculated',   -- Amount determined
        'invoiced',     -- Invoice sent
        'paid',         -- Commission paid
        'disputed'      -- Under dispute
    )),
    commission_paid_at TIMESTAMPTZ,

    -- Priority & Ranking
    priority_rank INTEGER DEFAULT 1,    -- 1 = highest priority
    display_order INTEGER,              -- Order shown to buyer

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure unique match per consent-property pair
    UNIQUE(consent_id, matched_property_id)
);

-- ============================================================================
-- SPILLOVER COMMISSION LEDGER
-- Financial tracking for spillover commissions
-- ============================================================================
CREATE TABLE IF NOT EXISTS spillover_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Reference
    match_id UUID NOT NULL REFERENCES spillover_matches(id),

    -- Parties
    source_developer_id UUID NOT NULL REFERENCES developers(id),  -- Category A (payer)
    recipient_developer_id UUID NOT NULL REFERENCES developers(id), -- Category B (receiver)
    recipient_agent_id UUID REFERENCES mortgage_agents(id),

    -- Financial
    property_price DECIMAL(12,2) NOT NULL,
    commission_rate DECIMAL(5,4) NOT NULL,
    commission_amount DECIMAL(12,2) NOT NULL,

    -- Splits
    platform_fee_rate DECIMAL(5,4) DEFAULT 0.0020, -- 0.2% platform fee
    platform_fee_amount DECIMAL(12,2),
    agent_commission_rate DECIMAL(5,4),
    agent_commission_amount DECIMAL(12,2),
    developer_net_amount DECIMAL(12,2),

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'approved',
        'invoiced',
        'paid',
        'disputed',
        'cancelled'
    )),

    -- Invoice/Payment
    invoice_number VARCHAR(50),
    invoice_date DATE,
    payment_date DATE,
    payment_reference VARCHAR(100),

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Consent lookups
CREATE INDEX IF NOT EXISTS idx_spillover_consents_case ON spillover_consents(case_id);
CREATE INDEX IF NOT EXISTS idx_spillover_consents_original_dev ON spillover_consents(original_developer_id);
CREATE INDEX IF NOT EXISTS idx_spillover_consents_status ON spillover_consents(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spillover_consents_pending ON spillover_consents(status) WHERE status IN ('pending', 'consented');

-- Match lookups
CREATE INDEX IF NOT EXISTS idx_spillover_matches_consent ON spillover_matches(consent_id);
CREATE INDEX IF NOT EXISTS idx_spillover_matches_property ON spillover_matches(matched_property_id);
CREATE INDEX IF NOT EXISTS idx_spillover_matches_developer ON spillover_matches(matched_developer_id);
CREATE INDEX IF NOT EXISTS idx_spillover_matches_agent ON spillover_matches(matched_agent_id);
CREATE INDEX IF NOT EXISTS idx_spillover_matches_status ON spillover_matches(status);
CREATE INDEX IF NOT EXISTS idx_spillover_matches_pending ON spillover_matches(status) WHERE status IN ('pending', 'queued', 'contacted');

-- Commission lookups
CREATE INDEX IF NOT EXISTS idx_spillover_commissions_match ON spillover_commissions(match_id);
CREATE INDEX IF NOT EXISTS idx_spillover_commissions_recipient ON spillover_commissions(recipient_developer_id);
CREATE INDEX IF NOT EXISTS idx_spillover_commissions_status ON spillover_commissions(status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE spillover_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE spillover_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE spillover_commissions ENABLE ROW LEVEL SECURITY;

-- CRITICAL PRIVACY: Category A sees only their original cases, NOT spillover details
CREATE POLICY spillover_consents_catA_policy ON spillover_consents
    FOR SELECT
    USING (original_developer_id = auth.uid());

-- Category B developers see only their matched properties (not original property)
CREATE POLICY spillover_matches_catB_policy ON spillover_matches
    FOR SELECT
    USING (matched_developer_id = auth.uid());

-- Agents see their assigned matches
CREATE POLICY spillover_matches_agent_policy ON spillover_matches
    FOR ALL
    USING (matched_agent_id = auth.uid());

-- Commission visibility based on party
CREATE POLICY spillover_commissions_recipient_policy ON spillover_commissions
    FOR SELECT
    USING (recipient_developer_id = auth.uid() OR recipient_agent_id = auth.uid());

-- Service role full access
CREATE POLICY service_role_spillover_consents ON spillover_consents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_spillover_matches ON spillover_matches FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_spillover_commissions ON spillover_commissions FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Calculate match score between buyer criteria and property
CREATE OR REPLACE FUNCTION calculate_match_score(
    p_criteria JSONB,
    p_property_id UUID
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    v_property RECORD;
    v_score DECIMAL(3,2) := 0.00;
    v_factors INTEGER := 0;
    v_price_score DECIMAL(3,2);
    v_location_score DECIMAL(3,2);
    v_type_score DECIMAL(3,2);
BEGIN
    -- Get property details
    SELECT * INTO v_property FROM properties WHERE id = p_property_id;

    IF NOT FOUND THEN
        RETURN 0.00;
    END IF;

    -- Price match (0-1)
    IF p_criteria ? 'price_min' AND p_criteria ? 'price_max' THEN
        IF v_property.price_min >= (p_criteria->>'price_min')::DECIMAL
           AND v_property.price_max <= (p_criteria->>'price_max')::DECIMAL THEN
            v_price_score := 1.00;
        ELSIF v_property.price_min <= (p_criteria->>'price_max')::DECIMAL
              AND v_property.price_max >= (p_criteria->>'price_min')::DECIMAL THEN
            v_price_score := 0.70; -- Partial overlap
        ELSE
            v_price_score := 0.00;
        END IF;
        v_score := v_score + v_price_score;
        v_factors := v_factors + 1;
    END IF;

    -- Location match (0-1)
    IF p_criteria ? 'preferred_states' THEN
        IF v_property.state = ANY(ARRAY(SELECT jsonb_array_elements_text(p_criteria->'preferred_states'))) THEN
            v_location_score := 1.00;
        ELSE
            v_location_score := 0.30; -- Different state
        END IF;
        v_score := v_score + v_location_score;
        v_factors := v_factors + 1;
    END IF;

    -- Property type match (0-1)
    IF p_criteria ? 'property_types' THEN
        IF v_property.property_type = ANY(ARRAY(SELECT jsonb_array_elements_text(p_criteria->'property_types'))) THEN
            v_type_score := 1.00;
        ELSE
            v_type_score := 0.50; -- Different type
        END IF;
        v_score := v_score + v_type_score;
        v_factors := v_factors + 1;
    END IF;

    -- Calculate average score
    IF v_factors > 0 THEN
        RETURN ROUND(v_score / v_factors, 2);
    ELSE
        RETURN 0.50; -- Default middle score if no criteria
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Find matching Category B properties for a spillover consent
CREATE OR REPLACE FUNCTION find_spillover_matches(
    p_consent_id UUID,
    p_limit INTEGER DEFAULT 5
) RETURNS TABLE (
    property_id UUID,
    developer_id UUID,
    property_name VARCHAR,
    match_score DECIMAL(3,2)
) AS $$
DECLARE
    v_consent RECORD;
BEGIN
    -- Get consent with criteria
    SELECT * INTO v_consent FROM spillover_consents WHERE id = p_consent_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Find Category B properties that match criteria
    RETURN QUERY
    SELECT
        p.id AS property_id,
        p.developer_id,
        p.name AS property_name,
        calculate_match_score(v_consent.matching_criteria, p.id) AS match_score
    FROM properties p
    JOIN developers d ON p.developer_id = d.id
    WHERE d.category = 'B'                              -- Only Category B
      AND d.spillover_enabled = true                    -- Accepting spillover
      AND d.status = 'active'
      AND p.status = 'active'
      AND p.developer_id != v_consent.original_developer_id  -- Not the original developer
      AND calculate_match_score(v_consent.matching_criteria, p.id) >= 0.50  -- Min 50% match
    ORDER BY
        d.spillover_priority ASC,                       -- Developer priority
        calculate_match_score(v_consent.matching_criteria, p.id) DESC  -- Then by score
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE TRIGGER set_spillover_consents_updated_at
    BEFORE UPDATE ON spillover_consents
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_spillover_matches_updated_at
    BEFORE UPDATE ON spillover_matches
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_spillover_commissions_updated_at
    BEFORE UPDATE ON spillover_commissions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Spillover pipeline view for dashboard
CREATE OR REPLACE VIEW spillover_pipeline AS
SELECT
    sc.id AS consent_id,
    sc.case_id,
    sc.buyer_name,
    sc.rejection_reason,
    sc.consent_given,
    sc.status AS consent_status,
    sc.created_at AS consent_date,
    COUNT(sm.id) AS total_matches,
    COUNT(CASE WHEN sm.status = 'converted' THEN 1 END) AS conversions,
    SUM(CASE WHEN sm.status = 'converted' THEN sm.commission_amount ELSE 0 END) AS total_commission
FROM spillover_consents sc
LEFT JOIN spillover_matches sm ON sc.id = sm.consent_id
GROUP BY sc.id;

-- Commission summary view
CREATE OR REPLACE VIEW spillover_commission_summary AS
SELECT
    d.id AS developer_id,
    d.company_name,
    d.category,
    COUNT(DISTINCT sm.consent_id) AS total_leads_received,
    COUNT(CASE WHEN sm.status = 'converted' THEN 1 END) AS total_conversions,
    SUM(sm.commission_amount) AS total_commission_earned,
    SUM(CASE WHEN sm.commission_status = 'paid' THEN sm.commission_amount ELSE 0 END) AS commission_paid,
    SUM(CASE WHEN sm.commission_status = 'pending' THEN sm.commission_amount ELSE 0 END) AS commission_pending
FROM developers d
LEFT JOIN spillover_matches sm ON d.id = sm.matched_developer_id
WHERE d.category = 'B'
GROUP BY d.id;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE spillover_consents IS 'CR-009C: Buyer consent for spillover to Category B properties';
COMMENT ON TABLE spillover_matches IS 'CR-009C: Matched Category B properties for spillover buyers';
COMMENT ON TABLE spillover_commissions IS 'CR-009C: Commission ledger for spillover conversions';
COMMENT ON FUNCTION calculate_match_score IS 'CR-009C: Calculate compatibility score between buyer criteria and property';
COMMENT ON FUNCTION find_spillover_matches IS 'CR-009C: Find matching Category B properties for a spillover consent';
