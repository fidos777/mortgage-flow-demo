-- =============================================================================
-- Migration 008: Unit Auto-Status Transitions
-- CR-007A: Property Unit Inventory | PRD v3.6.3
--
-- Implements automatic status transitions for property units:
-- AVAILABLE → RESERVED → PENDING → SOLD
--
-- Triggers:
-- - On case creation with unit: AVAILABLE → RESERVED
-- - On KJ signed: RESERVED → PENDING
-- - On full disbursement: PENDING → SOLD
-- - On case cancelled: RESERVED/PENDING → AVAILABLE (with conditions)
-- =============================================================================

-- =============================================================================
-- UNIT STATUS TRANSITION RULES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS unit_status_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_status VARCHAR(20) NOT NULL,
    to_status VARCHAR(20) NOT NULL,
    trigger_event VARCHAR(50) NOT NULL,
    requires_approval BOOLEAN DEFAULT FALSE,
    auto_execute BOOLEAN DEFAULT TRUE,
    cooldown_hours INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(from_status, to_status, trigger_event)
);

-- Seed transition rules
INSERT INTO unit_status_transitions (from_status, to_status, trigger_event, auto_execute, requires_approval)
VALUES
    -- Forward transitions
    ('AVAILABLE', 'RESERVED', 'CASE_CREATED', TRUE, FALSE),
    ('AVAILABLE', 'RESERVED', 'MANUAL_RESERVE', FALSE, TRUE),
    ('RESERVED', 'PENDING', 'KJ_SIGNED', TRUE, FALSE),
    ('RESERVED', 'PENDING', 'LOAN_APPROVED', TRUE, FALSE),
    ('PENDING', 'SOLD', 'FULL_DISBURSEMENT', TRUE, FALSE),
    ('PENDING', 'SOLD', 'KEY_HANDOVER', TRUE, FALSE),

    -- Backward transitions (require approval or conditions)
    ('RESERVED', 'AVAILABLE', 'CASE_CANCELLED', TRUE, FALSE),
    ('RESERVED', 'AVAILABLE', 'RESERVATION_EXPIRED', TRUE, FALSE),
    ('RESERVED', 'AVAILABLE', 'MANUAL_RELEASE', FALSE, TRUE),
    ('PENDING', 'RESERVED', 'KJ_VOIDED', TRUE, TRUE),
    ('PENDING', 'AVAILABLE', 'CASE_CANCELLED', TRUE, TRUE)
ON CONFLICT (from_status, to_status, trigger_event) DO NOTHING;

-- =============================================================================
-- UNIT STATUS HISTORY TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS unit_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES property_units(id),
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    trigger_event VARCHAR(50) NOT NULL,
    case_id UUID REFERENCES cases(id),
    buyer_id UUID,
    triggered_by VARCHAR(100), -- User or 'SYSTEM'
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unit_status_history_unit ON unit_status_history(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_status_history_case ON unit_status_history(case_id);
CREATE INDEX IF NOT EXISTS idx_unit_status_history_created ON unit_status_history(created_at DESC);

-- =============================================================================
-- RESERVATION EXPIRY TRACKING
-- =============================================================================

CREATE TABLE IF NOT EXISTS unit_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES property_units(id),
    case_id UUID REFERENCES cases(id),
    buyer_id UUID,
    reserved_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    extended_count INTEGER DEFAULT 0,
    max_extensions INTEGER DEFAULT 2,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, CONVERTED, EXPIRED, CANCELLED
    converted_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(unit_id, case_id)
);

CREATE INDEX IF NOT EXISTS idx_unit_reservations_unit ON unit_reservations(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_reservations_expires ON unit_reservations(expires_at) WHERE status = 'ACTIVE';

-- =============================================================================
-- FUNCTION: Validate Status Transition
-- =============================================================================

CREATE OR REPLACE FUNCTION is_valid_unit_transition(
    p_from_status VARCHAR(20),
    p_to_status VARCHAR(20),
    p_trigger_event VARCHAR(50)
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM unit_status_transitions
        WHERE from_status = p_from_status
          AND to_status = p_to_status
          AND trigger_event = p_trigger_event
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION: Execute Unit Status Transition
-- =============================================================================

CREATE OR REPLACE FUNCTION execute_unit_transition(
    p_unit_id UUID,
    p_to_status VARCHAR(20),
    p_trigger_event VARCHAR(50),
    p_case_id UUID DEFAULT NULL,
    p_buyer_id UUID DEFAULT NULL,
    p_triggered_by VARCHAR(100) DEFAULT 'SYSTEM',
    p_notes TEXT DEFAULT NULL
) RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    old_status VARCHAR(20),
    new_status VARCHAR(20)
) AS $$
DECLARE
    v_current_status VARCHAR(20);
    v_requires_approval BOOLEAN;
    v_auto_execute BOOLEAN;
BEGIN
    -- Get current unit status
    SELECT status INTO v_current_status
    FROM property_units
    WHERE id = p_unit_id;

    IF v_current_status IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Unit not found', NULL::VARCHAR(20), NULL::VARCHAR(20);
        RETURN;
    END IF;

    -- Check if transition is valid
    SELECT requires_approval, auto_execute INTO v_requires_approval, v_auto_execute
    FROM unit_status_transitions
    WHERE from_status = v_current_status
      AND to_status = p_to_status
      AND trigger_event = p_trigger_event;

    IF NOT FOUND THEN
        RETURN QUERY SELECT
            FALSE,
            format('Invalid transition: %s → %s (trigger: %s)', v_current_status, p_to_status, p_trigger_event),
            v_current_status,
            NULL::VARCHAR(20);
        RETURN;
    END IF;

    -- Check if requires approval (and triggered by system)
    IF v_requires_approval AND p_triggered_by = 'SYSTEM' THEN
        RETURN QUERY SELECT
            FALSE,
            'This transition requires manual approval',
            v_current_status,
            NULL::VARCHAR(20);
        RETURN;
    END IF;

    -- Execute the transition
    UPDATE property_units
    SET
        status = p_to_status,
        reserved_by_case_id = CASE
            WHEN p_to_status = 'RESERVED' THEN COALESCE(p_case_id, reserved_by_case_id)
            WHEN p_to_status = 'AVAILABLE' THEN NULL
            ELSE reserved_by_case_id
        END,
        reserved_at = CASE
            WHEN p_to_status = 'RESERVED' AND v_current_status = 'AVAILABLE' THEN NOW()
            WHEN p_to_status = 'AVAILABLE' THEN NULL
            ELSE reserved_at
        END,
        sold_at = CASE
            WHEN p_to_status = 'SOLD' THEN NOW()
            ELSE sold_at
        END,
        updated_at = NOW()
    WHERE id = p_unit_id;

    -- Record history
    INSERT INTO unit_status_history (
        unit_id, from_status, to_status, trigger_event,
        case_id, buyer_id, triggered_by, notes
    ) VALUES (
        p_unit_id, v_current_status, p_to_status, p_trigger_event,
        p_case_id, p_buyer_id, p_triggered_by, p_notes
    );

    RETURN QUERY SELECT
        TRUE,
        format('Status updated: %s → %s', v_current_status, p_to_status),
        v_current_status,
        p_to_status;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION: Auto-Reserve Unit on Case Creation
-- =============================================================================

CREATE OR REPLACE FUNCTION auto_reserve_unit_on_case()
RETURNS TRIGGER AS $$
DECLARE
    v_result RECORD;
BEGIN
    -- Only trigger if unit_id is set and it's a new case
    IF NEW.unit_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.unit_id IS NULL) THEN
        SELECT * INTO v_result FROM execute_unit_transition(
            NEW.unit_id,
            'RESERVED',
            'CASE_CREATED',
            NEW.id,
            NEW.buyer_id,
            'SYSTEM',
            'Auto-reserved on case creation'
        );

        IF NOT v_result.success THEN
            -- Log warning but don't block case creation
            RAISE WARNING 'Unit reservation failed: %', v_result.message;
        ELSE
            -- Create reservation record
            INSERT INTO unit_reservations (unit_id, case_id, buyer_id, expires_at)
            VALUES (
                NEW.unit_id,
                NEW.id,
                NEW.buyer_id,
                NOW() + INTERVAL '14 days' -- Default 14-day reservation
            )
            ON CONFLICT (unit_id, case_id) DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_auto_reserve_unit ON cases;
CREATE TRIGGER trg_auto_reserve_unit
    AFTER INSERT OR UPDATE OF unit_id ON cases
    FOR EACH ROW
    EXECUTE FUNCTION auto_reserve_unit_on_case();

-- =============================================================================
-- FUNCTION: Update Unit Status on Milestone Change
-- =============================================================================

CREATE OR REPLACE FUNCTION update_unit_on_milestone()
RETURNS TRIGGER AS $$
DECLARE
    v_unit_id UUID;
    v_result RECORD;
    v_trigger_event VARCHAR(50);
    v_new_status VARCHAR(20);
BEGIN
    -- Get unit_id from case
    SELECT unit_id INTO v_unit_id FROM cases WHERE id = NEW.case_id;

    IF v_unit_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Determine trigger event and new status based on milestone
    CASE NEW.milestone_type
        WHEN 'KJ_SIGNED' THEN
            v_trigger_event := 'KJ_SIGNED';
            v_new_status := 'PENDING';
        WHEN 'LOAN_APPROVED' THEN
            v_trigger_event := 'LOAN_APPROVED';
            v_new_status := 'PENDING';
        WHEN 'KEY_HANDOVER' THEN
            v_trigger_event := 'KEY_HANDOVER';
            v_new_status := 'SOLD';
        ELSE
            RETURN NEW; -- No action for other milestones
    END CASE;

    -- Only execute if milestone is being marked as achieved
    IF NEW.achieved_at IS NOT NULL AND (OLD.achieved_at IS NULL OR TG_OP = 'INSERT') THEN
        SELECT * INTO v_result FROM execute_unit_transition(
            v_unit_id,
            v_new_status,
            v_trigger_event,
            NEW.case_id,
            NULL,
            'SYSTEM',
            format('Auto-updated on milestone: %s', NEW.milestone_type)
        );

        -- Update reservation status if transitioning to SOLD
        IF v_result.success AND v_new_status = 'SOLD' THEN
            UPDATE unit_reservations
            SET status = 'CONVERTED', converted_at = NOW(), updated_at = NOW()
            WHERE unit_id = v_unit_id AND case_id = NEW.case_id AND status = 'ACTIVE';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (assuming milestones table exists)
-- DROP TRIGGER IF EXISTS trg_update_unit_milestone ON case_milestones;
-- CREATE TRIGGER trg_update_unit_milestone
--     AFTER INSERT OR UPDATE OF achieved_at ON case_milestones
--     FOR EACH ROW
--     EXECUTE FUNCTION update_unit_on_milestone();

-- =============================================================================
-- FUNCTION: Release Unit on Case Cancellation
-- =============================================================================

CREATE OR REPLACE FUNCTION release_unit_on_case_cancel()
RETURNS TRIGGER AS $$
DECLARE
    v_result RECORD;
    v_unit_status VARCHAR(20);
BEGIN
    -- Only trigger on status change to CANCELLED
    IF NEW.status = 'CANCELLED' AND OLD.status != 'CANCELLED' AND NEW.unit_id IS NOT NULL THEN
        -- Get current unit status
        SELECT status INTO v_unit_status FROM property_units WHERE id = NEW.unit_id;

        -- Only release if RESERVED (PENDING requires approval)
        IF v_unit_status = 'RESERVED' THEN
            SELECT * INTO v_result FROM execute_unit_transition(
                NEW.unit_id,
                'AVAILABLE',
                'CASE_CANCELLED',
                NEW.id,
                NEW.buyer_id,
                'SYSTEM',
                'Auto-released on case cancellation'
            );

            -- Update reservation
            UPDATE unit_reservations
            SET status = 'CANCELLED', cancelled_at = NOW(),
                cancel_reason = 'Case cancelled', updated_at = NOW()
            WHERE unit_id = NEW.unit_id AND case_id = NEW.id AND status = 'ACTIVE';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_release_unit_cancel ON cases;
CREATE TRIGGER trg_release_unit_cancel
    AFTER UPDATE OF status ON cases
    FOR EACH ROW
    EXECUTE FUNCTION release_unit_on_case_cancel();

-- =============================================================================
-- FUNCTION: Process Expired Reservations (to be called by cron)
-- =============================================================================

CREATE OR REPLACE FUNCTION process_expired_reservations()
RETURNS TABLE(
    processed_count INTEGER,
    unit_ids UUID[]
) AS $$
DECLARE
    v_expired_units UUID[];
    v_unit_id UUID;
    v_result RECORD;
BEGIN
    -- Find expired reservations
    SELECT ARRAY_AGG(unit_id) INTO v_expired_units
    FROM unit_reservations
    WHERE status = 'ACTIVE'
      AND expires_at < NOW();

    IF v_expired_units IS NULL THEN
        RETURN QUERY SELECT 0, ARRAY[]::UUID[];
        RETURN;
    END IF;

    -- Process each expired reservation
    FOREACH v_unit_id IN ARRAY v_expired_units
    LOOP
        SELECT * INTO v_result FROM execute_unit_transition(
            v_unit_id,
            'AVAILABLE',
            'RESERVATION_EXPIRED',
            NULL,
            NULL,
            'SYSTEM',
            'Auto-released due to reservation expiry'
        );

        IF v_result.success THEN
            UPDATE unit_reservations
            SET status = 'EXPIRED', expired_at = NOW(), updated_at = NOW()
            WHERE unit_id = v_unit_id AND status = 'ACTIVE';
        END IF;
    END LOOP;

    RETURN QUERY SELECT COALESCE(array_length(v_expired_units, 1), 0), v_expired_units;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION: Extend Reservation
-- =============================================================================

CREATE OR REPLACE FUNCTION extend_unit_reservation(
    p_unit_id UUID,
    p_case_id UUID,
    p_extension_days INTEGER DEFAULT 7,
    p_extended_by VARCHAR(100) DEFAULT NULL
) RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    new_expiry TIMESTAMPTZ
) AS $$
DECLARE
    v_reservation RECORD;
BEGIN
    -- Get current reservation
    SELECT * INTO v_reservation
    FROM unit_reservations
    WHERE unit_id = p_unit_id
      AND case_id = p_case_id
      AND status = 'ACTIVE';

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'No active reservation found', NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Check extension limit
    IF v_reservation.extended_count >= v_reservation.max_extensions THEN
        RETURN QUERY SELECT
            FALSE,
            format('Maximum extensions (%s) reached', v_reservation.max_extensions),
            v_reservation.expires_at;
        RETURN;
    END IF;

    -- Extend the reservation
    UPDATE unit_reservations
    SET
        expires_at = expires_at + (p_extension_days || ' days')::INTERVAL,
        extended_count = extended_count + 1,
        updated_at = NOW()
    WHERE id = v_reservation.id
    RETURNING expires_at INTO v_reservation.expires_at;

    -- Log the extension
    INSERT INTO unit_status_history (
        unit_id, from_status, to_status, trigger_event,
        case_id, triggered_by, notes
    ) VALUES (
        p_unit_id, 'RESERVED', 'RESERVED', 'RESERVATION_EXTENDED',
        p_case_id, COALESCE(p_extended_by, 'SYSTEM'),
        format('Reservation extended by %s days', p_extension_days)
    );

    RETURN QUERY SELECT
        TRUE,
        format('Reservation extended to %s', v_reservation.expires_at),
        v_reservation.expires_at;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VIEW: Unit Status Summary with Transition Eligibility
-- =============================================================================

CREATE OR REPLACE VIEW v_unit_transition_eligibility AS
SELECT
    u.id AS unit_id,
    u.full_unit_code,
    u.status AS current_status,
    t.to_status AS available_transition,
    t.trigger_event,
    t.requires_approval,
    t.auto_execute,
    r.expires_at AS reservation_expires,
    r.extended_count,
    r.max_extensions,
    CASE
        WHEN r.expires_at IS NOT NULL AND r.expires_at < NOW() THEN TRUE
        ELSE FALSE
    END AS is_expired
FROM property_units u
LEFT JOIN unit_status_transitions t ON t.from_status = u.status
LEFT JOIN unit_reservations r ON r.unit_id = u.id AND r.status = 'ACTIVE'
ORDER BY u.full_unit_code, t.to_status;

-- =============================================================================
-- VIEW: Reservation Expiry Report
-- =============================================================================

CREATE OR REPLACE VIEW v_reservation_expiry_report AS
SELECT
    u.full_unit_code,
    u.project_id,
    p.name AS project_name,
    r.case_id,
    r.reserved_at,
    r.expires_at,
    r.extended_count,
    r.max_extensions,
    EXTRACT(EPOCH FROM (r.expires_at - NOW()))/3600 AS hours_remaining,
    CASE
        WHEN r.expires_at < NOW() THEN 'EXPIRED'
        WHEN r.expires_at < NOW() + INTERVAL '24 hours' THEN 'EXPIRING_SOON'
        WHEN r.expires_at < NOW() + INTERVAL '72 hours' THEN 'EXPIRING_3_DAYS'
        ELSE 'OK'
    END AS urgency
FROM unit_reservations r
JOIN property_units u ON u.id = r.unit_id
LEFT JOIN projects p ON p.id = u.project_id
WHERE r.status = 'ACTIVE'
ORDER BY r.expires_at ASC;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION is_valid_unit_transition TO authenticated;
GRANT EXECUTE ON FUNCTION execute_unit_transition TO authenticated;
GRANT EXECUTE ON FUNCTION process_expired_reservations TO authenticated;
GRANT EXECUTE ON FUNCTION extend_unit_reservation TO authenticated;

-- Grant select on views
GRANT SELECT ON v_unit_transition_eligibility TO authenticated;
GRANT SELECT ON v_reservation_expiry_report TO authenticated;

-- Grant table access
GRANT SELECT, INSERT ON unit_status_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON unit_reservations TO authenticated;
GRANT SELECT ON unit_status_transitions TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE unit_status_transitions IS 'Defines valid unit status transitions and their triggers';
COMMENT ON TABLE unit_status_history IS 'Audit trail of all unit status changes';
COMMENT ON TABLE unit_reservations IS 'Tracks unit reservations with expiry management';
COMMENT ON FUNCTION execute_unit_transition IS 'Safely executes a unit status transition with validation';
COMMENT ON FUNCTION process_expired_reservations IS 'Batch process for releasing expired reservations (call via cron)';
COMMENT ON FUNCTION extend_unit_reservation IS 'Extends a unit reservation by specified days';
