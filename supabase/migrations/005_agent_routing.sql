-- ============================================================================
-- CR-007A: Master Agent Routing
-- Migration: 005_agent_routing.sql
-- Description: Case distribution from master agents to sub-agents
-- ============================================================================

-- ============================================================================
-- UPDATE MORTGAGE_AGENTS TABLE
-- Add routing-related columns
-- ============================================================================
ALTER TABLE mortgage_agents
ADD COLUMN IF NOT EXISTS master_agent_id UUID REFERENCES mortgage_agents(id),
ADD COLUMN IF NOT EXISTS max_cases_per_week INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS current_week_cases INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_assign_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS specializations TEXT[], -- ['first_time_buyer', 'refinance', 'lppsa']
ADD COLUMN IF NOT EXISTS preferred_price_min DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS preferred_price_max DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS preferred_states TEXT[];

-- ============================================================================
-- CASE ASSIGNMENTS TABLE
-- Track all case assignments between agents
-- ============================================================================
CREATE TABLE IF NOT EXISTS case_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Case Reference
    case_id UUID NOT NULL REFERENCES mortgage_cases(id) ON DELETE CASCADE,

    -- Assignment Parties
    agent_id UUID NOT NULL REFERENCES mortgage_agents(id),    -- Assigned to
    assigned_by UUID REFERENCES mortgage_agents(id),          -- Master agent (null = auto-assigned)
    previous_agent_id UUID REFERENCES mortgage_agents(id),    -- For reassignments

    -- Assignment Type
    assignment_type VARCHAR(20) DEFAULT 'manual' CHECK (assignment_type IN (
        'manual',       -- Master agent manually assigned
        'auto',         -- System auto-assigned
        'spillover',    -- From spillover match
        'reassign',     -- Reassigned from another agent
        'escalation'    -- Escalated to senior agent
    )),

    -- Status Flow
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Awaiting agent acceptance
        'accepted',     -- Agent accepted the case
        'rejected',     -- Agent rejected (with reason)
        'reassigned',   -- Reassigned to another agent
        'completed',    -- Case completed by this agent
        'expired'       -- Assignment expired without response
    )),

    -- Timestamps
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,                                   -- Auto-reject deadline

    -- Rejection Details
    rejection_reason VARCHAR(200),
    rejection_notes TEXT,

    -- Priority & Workload
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest
    estimated_hours DECIMAL(5,2),

    -- Performance Tracking
    first_contact_at TIMESTAMPTZ,                             -- When agent first contacted buyer
    response_time_hours DECIMAL(5,2),                         -- Time to first action

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AGENT CAPACITY TABLE
-- Weekly/monthly capacity tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_capacity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    agent_id UUID NOT NULL REFERENCES mortgage_agents(id),

    -- Period
    period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Capacity
    max_cases INTEGER NOT NULL,
    assigned_cases INTEGER DEFAULT 0,
    completed_cases INTEGER DEFAULT 0,
    rejected_cases INTEGER DEFAULT 0,

    -- Utilization
    utilization_pct DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN max_cases > 0 THEN ROUND((assigned_cases::DECIMAL / max_cases) * 100, 2) ELSE 0 END
    ) STORED,

    -- Status
    is_at_capacity BOOLEAN GENERATED ALWAYS AS (assigned_cases >= max_cases) STORED,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint per agent per period
    UNIQUE(agent_id, period_type, period_start)
);

-- ============================================================================
-- ROUTING RULES TABLE
-- Configurable rules for auto-assignment
-- ============================================================================
CREATE TABLE IF NOT EXISTS routing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Rule Identity
    name VARCHAR(100) NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 100,           -- Lower = higher priority

    -- Scope
    developer_id UUID REFERENCES developers(id), -- Null = applies to all
    property_type VARCHAR(50),              -- Null = any property type

    -- Conditions (JSONB for flexibility)
    conditions JSONB NOT NULL DEFAULT '{}',
    -- Example:
    -- {
    --   "price_min": 300000,
    --   "price_max": 500000,
    --   "states": ["Selangor", "KL"],
    --   "case_type": "first_time_buyer",
    --   "loan_type": "lppsa"
    -- }

    -- Action
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN (
        'assign_agent',     -- Assign to specific agent
        'assign_pool',      -- Assign to agent pool (round-robin)
        'assign_master',    -- Route to master agent for manual assignment
        'auto_balance'      -- Auto-balance based on capacity
    )),
    target_agent_id UUID REFERENCES mortgage_agents(id), -- For assign_agent
    target_pool_ids UUID[],                              -- For assign_pool

    -- Status
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Assignment lookups
CREATE INDEX IF NOT EXISTS idx_case_assignments_case ON case_assignments(case_id);
CREATE INDEX IF NOT EXISTS idx_case_assignments_agent ON case_assignments(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_case_assignments_assigned_by ON case_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_case_assignments_status ON case_assignments(status, assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_assignments_pending ON case_assignments(status) WHERE status = 'pending';

-- Agent hierarchy
CREATE INDEX IF NOT EXISTS idx_agents_master ON mortgage_agents(master_agent_id) WHERE master_agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agents_auto_assign ON mortgage_agents(auto_assign_enabled, status) WHERE auto_assign_enabled = true;

-- Capacity tracking
CREATE INDEX IF NOT EXISTS idx_agent_capacity_period ON agent_capacity(agent_id, period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_agent_capacity_available ON agent_capacity(is_at_capacity) WHERE is_at_capacity = false;

-- Routing rules
CREATE INDEX IF NOT EXISTS idx_routing_rules_active ON routing_rules(is_active, priority) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_routing_rules_developer ON routing_rules(developer_id) WHERE developer_id IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE case_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_rules ENABLE ROW LEVEL SECURITY;

-- Agents see their own assignments
CREATE POLICY case_assignments_agent_policy ON case_assignments
    FOR SELECT
    USING (agent_id = auth.uid() OR assigned_by = auth.uid());

-- Master agents see their team's assignments
CREATE POLICY case_assignments_master_policy ON case_assignments
    FOR ALL
    USING (
        agent_id IN (SELECT id FROM mortgage_agents WHERE master_agent_id = auth.uid())
        OR assigned_by = auth.uid()
    );

-- Agents see their own capacity
CREATE POLICY agent_capacity_own_policy ON agent_capacity
    FOR SELECT
    USING (agent_id = auth.uid());

-- Master agents see their team's capacity
CREATE POLICY agent_capacity_master_policy ON agent_capacity
    FOR SELECT
    USING (
        agent_id IN (SELECT id FROM mortgage_agents WHERE master_agent_id = auth.uid())
    );

-- Service role full access
CREATE POLICY service_role_case_assignments ON case_assignments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_agent_capacity ON agent_capacity FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_routing_rules ON routing_rules FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Get available agents for auto-assignment
CREATE OR REPLACE FUNCTION get_available_agents(
    p_developer_id UUID DEFAULT NULL,
    p_price_range DECIMAL DEFAULT NULL,
    p_state VARCHAR DEFAULT NULL
) RETURNS TABLE (
    agent_id UUID,
    agent_name VARCHAR,
    current_load INTEGER,
    max_load INTEGER,
    availability_score DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ma.id AS agent_id,
        ma.name AS agent_name,
        COALESCE(ma.current_week_cases, 0) AS current_load,
        COALESCE(ma.max_cases_per_week, 20) AS max_load,
        -- Availability score: higher = more available
        CASE
            WHEN ma.max_cases_per_week > 0 THEN
                ROUND(1.0 - (COALESCE(ma.current_week_cases, 0)::DECIMAL / ma.max_cases_per_week), 2)
            ELSE 0.00
        END AS availability_score
    FROM mortgage_agents ma
    WHERE ma.status = 'active'
      AND ma.auto_assign_enabled = true
      AND ma.is_master_agent = false
      AND (ma.max_cases_per_week IS NULL OR ma.current_week_cases < ma.max_cases_per_week)
      AND (p_developer_id IS NULL OR ma.developer_id = p_developer_id)
      AND (p_state IS NULL OR p_state = ANY(ma.preferred_states) OR ma.preferred_states IS NULL)
    ORDER BY
        availability_score DESC,
        ma.rating DESC NULLS LAST,
        ma.current_week_cases ASC;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-assign a case to the best available agent
CREATE OR REPLACE FUNCTION auto_assign_case(
    p_case_id UUID,
    p_assigned_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_case RECORD;
    v_agent_id UUID;
    v_assignment_id UUID;
BEGIN
    -- Get case details
    SELECT * INTO v_case FROM mortgage_cases WHERE id = p_case_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Case not found: %', p_case_id;
    END IF;

    -- Find best available agent
    SELECT agent_id INTO v_agent_id
    FROM get_available_agents(v_case.developer_id, v_case.property_price, NULL)
    LIMIT 1;

    IF v_agent_id IS NULL THEN
        -- No available agents, assign to master agent
        SELECT id INTO v_agent_id
        FROM mortgage_agents
        WHERE developer_id = v_case.developer_id
          AND is_master_agent = true
          AND status = 'active'
        LIMIT 1;
    END IF;

    IF v_agent_id IS NULL THEN
        RAISE EXCEPTION 'No available agents for case: %', p_case_id;
    END IF;

    -- Create assignment
    INSERT INTO case_assignments (
        case_id,
        agent_id,
        assigned_by,
        assignment_type,
        status,
        expires_at
    ) VALUES (
        p_case_id,
        v_agent_id,
        p_assigned_by,
        CASE WHEN p_assigned_by IS NULL THEN 'auto' ELSE 'manual' END,
        'pending',
        NOW() + INTERVAL '24 hours'
    )
    RETURNING id INTO v_assignment_id;

    -- Update case with assigned agent
    UPDATE mortgage_cases
    SET assigned_agent_id = v_agent_id,
        assigned_at = NOW()
    WHERE id = p_case_id;

    -- Increment agent's current week cases
    UPDATE mortgage_agents
    SET current_week_cases = COALESCE(current_week_cases, 0) + 1
    WHERE id = v_agent_id;

    RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Reassign a case to a different agent
CREATE OR REPLACE FUNCTION reassign_case(
    p_case_id UUID,
    p_new_agent_id UUID,
    p_reason VARCHAR DEFAULT NULL,
    p_reassigned_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_old_assignment RECORD;
    v_new_assignment_id UUID;
BEGIN
    -- Get current assignment
    SELECT * INTO v_old_assignment
    FROM case_assignments
    WHERE case_id = p_case_id AND status IN ('pending', 'accepted')
    ORDER BY assigned_at DESC
    LIMIT 1;

    -- Mark old assignment as reassigned
    IF v_old_assignment IS NOT NULL THEN
        UPDATE case_assignments
        SET status = 'reassigned',
            rejection_reason = p_reason
        WHERE id = v_old_assignment.id;

        -- Decrement old agent's case count
        UPDATE mortgage_agents
        SET current_week_cases = GREATEST(0, COALESCE(current_week_cases, 0) - 1)
        WHERE id = v_old_assignment.agent_id;
    END IF;

    -- Create new assignment
    INSERT INTO case_assignments (
        case_id,
        agent_id,
        assigned_by,
        previous_agent_id,
        assignment_type,
        status,
        expires_at
    ) VALUES (
        p_case_id,
        p_new_agent_id,
        p_reassigned_by,
        v_old_assignment.agent_id,
        'reassign',
        'pending',
        NOW() + INTERVAL '24 hours'
    )
    RETURNING id INTO v_new_assignment_id;

    -- Update case
    UPDATE mortgage_cases
    SET assigned_agent_id = p_new_agent_id,
        assigned_at = NOW()
    WHERE id = p_case_id;

    -- Increment new agent's case count
    UPDATE mortgage_agents
    SET current_week_cases = COALESCE(current_week_cases, 0) + 1
    WHERE id = p_new_agent_id;

    RETURN v_new_assignment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE TRIGGER set_case_assignments_updated_at
    BEFORE UPDATE ON case_assignments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_agent_capacity_updated_at
    BEFORE UPDATE ON agent_capacity
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_routing_rules_updated_at
    BEFORE UPDATE ON routing_rules
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Agent workload view
CREATE OR REPLACE VIEW agent_workload AS
SELECT
    ma.id AS agent_id,
    ma.name AS agent_name,
    ma.is_master_agent,
    ma.developer_id,
    d.company_name AS developer_name,
    ma.max_cases_per_week,
    COALESCE(ma.current_week_cases, 0) AS current_cases,
    ma.max_cases_per_week - COALESCE(ma.current_week_cases, 0) AS available_slots,
    CASE
        WHEN ma.max_cases_per_week > 0 THEN
            ROUND((COALESCE(ma.current_week_cases, 0)::DECIMAL / ma.max_cases_per_week) * 100, 1)
        ELSE 0
    END AS utilization_pct,
    ma.status,
    ma.auto_assign_enabled
FROM mortgage_agents ma
LEFT JOIN developers d ON ma.developer_id = d.id
WHERE ma.status = 'active';

-- Team hierarchy view
CREATE OR REPLACE VIEW agent_teams AS
SELECT
    master.id AS master_agent_id,
    master.name AS master_agent_name,
    master.developer_id,
    COUNT(sub.id) AS team_size,
    SUM(COALESCE(sub.current_week_cases, 0)) AS team_total_cases,
    SUM(sub.max_cases_per_week) AS team_max_capacity,
    ROUND(AVG(sub.rating), 2) AS team_avg_rating
FROM mortgage_agents master
LEFT JOIN mortgage_agents sub ON sub.master_agent_id = master.id AND sub.status = 'active'
WHERE master.is_master_agent = true AND master.status = 'active'
GROUP BY master.id;

-- Assignment pipeline view
CREATE OR REPLACE VIEW assignment_pipeline AS
SELECT
    ca.id AS assignment_id,
    ca.case_id,
    mc.case_ref,
    mc.buyer_name,
    ca.agent_id,
    ma.name AS agent_name,
    ca.assigned_by,
    assigner.name AS assigned_by_name,
    ca.assignment_type,
    ca.status,
    ca.priority,
    ca.assigned_at,
    ca.accepted_at,
    ca.expires_at,
    CASE
        WHEN ca.status = 'pending' AND ca.expires_at < NOW() THEN true
        ELSE false
    END AS is_expired
FROM case_assignments ca
JOIN mortgage_cases mc ON ca.case_id = mc.id
JOIN mortgage_agents ma ON ca.agent_id = ma.id
LEFT JOIN mortgage_agents assigner ON ca.assigned_by = assigner.id;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Set Ahmad Razak as master agent for Siti Aminah
UPDATE mortgage_agents
SET master_agent_id = 'a1000000-0000-0000-0000-000000000001'
WHERE id = 'a2000000-0000-0000-0000-000000000002';

-- Add default routing rule
INSERT INTO routing_rules (name, description, priority, conditions, action_type)
VALUES (
    'Default Auto-Balance',
    'Default rule: auto-balance cases across available agents',
    1000,
    '{}',
    'auto_balance'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE case_assignments IS 'CR-007A: Track case assignments between agents';
COMMENT ON TABLE agent_capacity IS 'CR-007A: Weekly/monthly agent capacity tracking';
COMMENT ON TABLE routing_rules IS 'CR-007A: Configurable auto-routing rules';
COMMENT ON FUNCTION get_available_agents IS 'CR-007A: Get agents sorted by availability';
COMMENT ON FUNCTION auto_assign_case IS 'CR-007A: Auto-assign case to best available agent';
COMMENT ON FUNCTION reassign_case IS 'CR-007A: Reassign case to different agent';
