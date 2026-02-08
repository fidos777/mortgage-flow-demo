-- =============================================================================
-- Migration 003: Breach Notification & Retention Policy Tables
-- Sprint 0, Session S0.6 | PRD v3.6.3 CR-010C, CR-012
-- =============================================================================
-- Purpose: PDPA 2024 breach notification compliance + data retention automation
--
-- Key Features:
-- - Breach incident tracking with 72h deadline enforcement
-- - Affected party notification records
-- - Commissioner reporting audit trail
-- - Consent retention policy with auto-purge
-- - Data minimization compliance
--
-- Dependencies:
-- - 001_pdpa_consent_tables.sql (consent_records, pdpa_notice_versions)
-- - 002_developer_auth_ledger.sql (developer_auth_ledger)
-- =============================================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- Breach severity levels
CREATE TYPE breach_severity AS ENUM (
  'LOW',       -- Minor breach, limited impact
  'MEDIUM',    -- Moderate breach, some PII exposed
  'HIGH',      -- Significant breach, sensitive data exposed
  'CRITICAL'   -- Major breach, widespread impact
);

-- Breach status
CREATE TYPE breach_status AS ENUM (
  'DETECTED',            -- Breach detected, assessment in progress
  'CONFIRMED',           -- Breach confirmed, response initiated
  'COMMISSIONER_NOTIFIED', -- Reported to PDPA Commissioner
  'AFFECTED_NOTIFIED',   -- All affected parties notified
  'REMEDIATED',          -- Containment and remediation complete
  'CLOSED',              -- Incident closed
  'REOPENED'             -- Incident reopened due to new findings
);

-- Notification delivery status
CREATE TYPE breach_notification_status AS ENUM (
  'PENDING',     -- Queued for delivery
  'SENT',        -- Dispatched
  'DELIVERED',   -- Confirmed delivery
  'FAILED',      -- Delivery failed
  'ACKNOWLEDGED' -- Recipient acknowledged
);

-- Retention action types
CREATE TYPE retention_action AS ENUM (
  'SCHEDULED',   -- Purge scheduled
  'IN_PROGRESS', -- Purge in progress
  'COMPLETED',   -- Data purged successfully
  'FAILED',      -- Purge failed
  'SKIPPED'      -- Skipped (legal hold or other reason)
);

-- =============================================================================
-- BREACH INCIDENTS TABLE
-- =============================================================================

CREATE TABLE breach_incidents (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id VARCHAR(50) UNIQUE NOT NULL, -- Human-readable ID (e.g., INC-2024-001)

  -- Breach Details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  breach_type VARCHAR(100) NOT NULL,
  severity breach_severity NOT NULL,
  status breach_status NOT NULL DEFAULT 'DETECTED',

  -- Timeline (PDPA 2024: 72h notification deadline)
  detected_at TIMESTAMPTZ NOT NULL,
  occurred_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  contained_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  -- 72h Deadline Tracking
  notification_deadline TIMESTAMPTZ NOT NULL, -- detected_at + 72 hours
  deadline_met BOOLEAN,
  deadline_extension_reason TEXT,

  -- Affected Data
  data_types_affected TEXT[] NOT NULL DEFAULT '{}',
  records_affected_count INTEGER DEFAULT 0,
  systems_affected TEXT[] DEFAULT '{}',

  -- Response
  root_cause TEXT,
  containment_actions TEXT[] DEFAULT '{}',
  remedial_actions TEXT[] DEFAULT '{}',
  preventive_measures TEXT[] DEFAULT '{}',

  -- Commissioner Reporting
  commissioner_notified BOOLEAN DEFAULT FALSE,
  commissioner_report_date TIMESTAMPTZ,
  commissioner_reference VARCHAR(100),
  commissioner_response TEXT,

  -- Contact Information
  dpo_contact VARCHAR(255),
  incident_lead VARCHAR(255),
  external_counsel VARCHAR(255),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_by VARCHAR(255)
);

-- =============================================================================
-- BREACH AFFECTED PARTIES TABLE
-- =============================================================================

CREATE TABLE breach_affected_parties (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Links
  incident_id UUID NOT NULL REFERENCES breach_incidents(id) ON DELETE CASCADE,
  buyer_hash VARCHAR(64) NOT NULL,
  consent_record_id UUID, -- Link to original consent

  -- Notification Tracking
  notification_status breach_notification_status NOT NULL DEFAULT 'PENDING',
  notification_channel VARCHAR(50), -- EMAIL, SMS, LETTER
  notification_sent_at TIMESTAMPTZ,
  notification_delivered_at TIMESTAMPTZ,
  notification_acknowledged_at TIMESTAMPTZ,
  notification_failed_reason TEXT,

  -- Affected Data for this Party
  data_types_exposed TEXT[] DEFAULT '{}',

  -- Communication
  notification_content_hash VARCHAR(64), -- Hash of sent content for audit
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_sent_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_incident_buyer UNIQUE (incident_id, buyer_hash)
);

-- =============================================================================
-- BREACH TIMELINE LOG TABLE
-- =============================================================================

CREATE TABLE breach_timeline_log (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Links
  incident_id UUID NOT NULL REFERENCES breach_incidents(id) ON DELETE CASCADE,

  -- Event Details
  event_type VARCHAR(100) NOT NULL,
  event_description TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Actor
  actor VARCHAR(255) NOT NULL,
  actor_role VARCHAR(50),

  -- Evidence
  evidence_urls TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- CONSENT RETENTION SCHEDULE TABLE
-- =============================================================================

CREATE TABLE consent_retention_schedule (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Target
  consent_record_id UUID NOT NULL REFERENCES consent_records(id) ON DELETE CASCADE,
  buyer_hash VARCHAR(64) NOT NULL,
  consent_type VARCHAR(50) NOT NULL,

  -- Retention Period
  retention_start TIMESTAMPTZ NOT NULL,
  retention_end TIMESTAMPTZ NOT NULL,
  retention_period_days INTEGER NOT NULL,

  -- Purge Schedule
  purge_scheduled_at TIMESTAMPTZ NOT NULL,
  purge_action retention_action NOT NULL DEFAULT 'SCHEDULED',
  purge_executed_at TIMESTAMPTZ,
  purge_result TEXT,

  -- Legal Hold (prevents purge)
  legal_hold BOOLEAN DEFAULT FALSE,
  legal_hold_reason TEXT,
  legal_hold_set_by VARCHAR(255),
  legal_hold_set_at TIMESTAMPTZ,
  legal_hold_expires_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_consent_schedule UNIQUE (consent_record_id)
);

-- =============================================================================
-- DATA PURGE LOG TABLE
-- =============================================================================

CREATE TABLE data_purge_log (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Purge Details
  purge_type VARCHAR(50) NOT NULL, -- CONSENT, AUTH_LEDGER, NOTIFICATION, etc.
  target_table VARCHAR(100) NOT NULL,
  target_id UUID,
  buyer_hash VARCHAR(64),

  -- Execution
  action retention_action NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  records_deleted INTEGER DEFAULT 0,

  -- Reason
  reason VARCHAR(255) NOT NULL,
  triggered_by VARCHAR(100) NOT NULL, -- SCHEDULED, MANUAL, REVOCATION, etc.

  -- Compliance
  retention_policy_id UUID,
  legal_basis VARCHAR(100),

  -- Result
  success BOOLEAN NOT NULL,
  error_message TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Breach incidents
CREATE INDEX idx_breach_incidents_status ON breach_incidents(status);
CREATE INDEX idx_breach_incidents_severity ON breach_incidents(severity);
CREATE INDEX idx_breach_incidents_deadline ON breach_incidents(notification_deadline)
  WHERE deadline_met IS NULL;
CREATE INDEX idx_breach_incidents_detected ON breach_incidents(detected_at DESC);

-- Affected parties
CREATE INDEX idx_breach_affected_incident ON breach_affected_parties(incident_id);
CREATE INDEX idx_breach_affected_buyer ON breach_affected_parties(buyer_hash);
CREATE INDEX idx_breach_affected_status ON breach_affected_parties(notification_status)
  WHERE notification_status IN ('PENDING', 'FAILED');

-- Timeline log
CREATE INDEX idx_breach_timeline_incident ON breach_timeline_log(incident_id, event_timestamp DESC);

-- Retention schedule
CREATE INDEX idx_retention_purge_date ON consent_retention_schedule(purge_scheduled_at)
  WHERE purge_action = 'SCHEDULED';
CREATE INDEX idx_retention_buyer ON consent_retention_schedule(buyer_hash);
CREATE INDEX idx_retention_legal_hold ON consent_retention_schedule(legal_hold)
  WHERE legal_hold = TRUE;

-- Purge log
CREATE INDEX idx_purge_log_date ON data_purge_log(executed_at DESC);
CREATE INDEX idx_purge_log_buyer ON data_purge_log(buyer_hash);
CREATE INDEX idx_purge_log_type ON data_purge_log(purge_type, executed_at DESC);

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Active breach incidents requiring action
CREATE OR REPLACE VIEW v_active_breaches AS
SELECT
  id,
  incident_id,
  title,
  severity,
  status,
  detected_at,
  notification_deadline,
  CASE
    WHEN NOW() > notification_deadline THEN 'OVERDUE'
    WHEN NOW() > notification_deadline - INTERVAL '24 hours' THEN 'URGENT'
    WHEN NOW() > notification_deadline - INTERVAL '48 hours' THEN 'WARNING'
    ELSE 'ON_TRACK'
  END as deadline_status,
  EXTRACT(EPOCH FROM (notification_deadline - NOW())) / 3600 as hours_remaining,
  records_affected_count,
  commissioner_notified,
  (SELECT COUNT(*) FROM breach_affected_parties WHERE incident_id = breach_incidents.id) as total_affected,
  (SELECT COUNT(*) FROM breach_affected_parties WHERE incident_id = breach_incidents.id AND notification_status = 'DELIVERED') as notified_count
FROM breach_incidents
WHERE status NOT IN ('CLOSED', 'REMEDIATED')
ORDER BY
  CASE severity
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    WHEN 'LOW' THEN 4
  END,
  notification_deadline ASC;

-- Pending consent purges
CREATE OR REPLACE VIEW v_pending_purges AS
SELECT
  crs.id,
  crs.consent_record_id,
  crs.buyer_hash,
  crs.consent_type,
  crs.retention_end,
  crs.purge_scheduled_at,
  crs.legal_hold,
  crs.legal_hold_reason,
  cr.granted_at,
  cr.revoked_at
FROM consent_retention_schedule crs
JOIN consent_records cr ON crs.consent_record_id = cr.id
WHERE crs.purge_action = 'SCHEDULED'
  AND crs.legal_hold = FALSE
  AND crs.purge_scheduled_at <= NOW()
ORDER BY crs.purge_scheduled_at ASC;

-- Retention compliance summary
CREATE OR REPLACE VIEW v_retention_compliance AS
SELECT
  consent_type,
  COUNT(*) as total_records,
  COUNT(CASE WHEN legal_hold THEN 1 END) as on_hold,
  COUNT(CASE WHEN purge_action = 'COMPLETED' THEN 1 END) as purged,
  COUNT(CASE WHEN purge_action = 'SCHEDULED' AND purge_scheduled_at <= NOW() THEN 1 END) as pending_purge,
  COUNT(CASE WHEN purge_action = 'FAILED' THEN 1 END) as failed_purge,
  MIN(purge_scheduled_at) as next_scheduled_purge,
  MAX(purge_executed_at) as last_purge
FROM consent_retention_schedule
GROUP BY consent_type;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function: Create breach incident with 72h deadline
CREATE OR REPLACE FUNCTION create_breach_incident(
  p_title VARCHAR(255),
  p_description TEXT,
  p_breach_type VARCHAR(100),
  p_severity breach_severity,
  p_detected_at TIMESTAMPTZ,
  p_data_types_affected TEXT[],
  p_created_by VARCHAR(255)
) RETURNS UUID AS $$
DECLARE
  v_incident_id UUID;
  v_incident_code VARCHAR(50);
  v_deadline TIMESTAMPTZ;
BEGIN
  -- Generate incident code
  v_incident_code := 'INC-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
    LPAD(NEXTVAL('breach_incident_seq')::TEXT, 4, '0');

  -- Calculate 72h deadline
  v_deadline := p_detected_at + INTERVAL '72 hours';

  INSERT INTO breach_incidents (
    incident_id,
    title,
    description,
    breach_type,
    severity,
    detected_at,
    notification_deadline,
    data_types_affected,
    created_by
  ) VALUES (
    v_incident_code,
    p_title,
    p_description,
    p_breach_type,
    p_severity,
    p_detected_at,
    v_deadline,
    p_data_types_affected,
    p_created_by
  ) RETURNING id INTO v_incident_id;

  -- Log timeline event
  INSERT INTO breach_timeline_log (
    incident_id,
    event_type,
    event_description,
    actor,
    actor_role
  ) VALUES (
    v_incident_id,
    'INCIDENT_CREATED',
    'Breach incident created: ' || p_title,
    p_created_by,
    'DPO'
  );

  RETURN v_incident_id;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for incident codes
CREATE SEQUENCE IF NOT EXISTS breach_incident_seq START 1;

-- Function: Add affected party to breach incident
CREATE OR REPLACE FUNCTION add_breach_affected_party(
  p_incident_id UUID,
  p_buyer_hash VARCHAR(64),
  p_data_types_exposed TEXT[],
  p_consent_record_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_party_id UUID;
BEGIN
  INSERT INTO breach_affected_parties (
    incident_id,
    buyer_hash,
    consent_record_id,
    data_types_exposed
  ) VALUES (
    p_incident_id,
    p_buyer_hash,
    p_consent_record_id,
    p_data_types_exposed
  )
  ON CONFLICT (incident_id, buyer_hash) DO UPDATE
  SET data_types_exposed = ARRAY(
    SELECT DISTINCT unnest(breach_affected_parties.data_types_exposed || p_data_types_exposed)
  ),
  updated_at = NOW()
  RETURNING id INTO v_party_id;

  -- Update affected count on incident
  UPDATE breach_incidents
  SET records_affected_count = (
    SELECT COUNT(*) FROM breach_affected_parties WHERE incident_id = p_incident_id
  ),
  updated_at = NOW()
  WHERE id = p_incident_id;

  RETURN v_party_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Schedule consent retention purge
CREATE OR REPLACE FUNCTION schedule_consent_purge(
  p_consent_record_id UUID
) RETURNS UUID AS $$
DECLARE
  v_schedule_id UUID;
  v_buyer_hash VARCHAR(64);
  v_consent_type VARCHAR(50);
  v_granted_at TIMESTAMPTZ;
  v_retention_days INTEGER;
  v_purge_date TIMESTAMPTZ;
BEGIN
  -- Get consent record details
  SELECT buyer_hash, consent_type, granted_at
  INTO v_buyer_hash, v_consent_type, v_granted_at
  FROM consent_records
  WHERE id = p_consent_record_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consent record not found: %', p_consent_record_id;
  END IF;

  -- Determine retention period based on consent type
  v_retention_days := CASE v_consent_type
    WHEN 'PDPA_BASIC' THEN 2555      -- 7 years
    WHEN 'PDPA_THIRD_PARTY' THEN 2555 -- 7 years
    WHEN 'PDPA_MARKETING' THEN 730   -- 2 years
    WHEN 'PDPA_ANALYTICS' THEN 365   -- 1 year
    ELSE 2555 -- Default 7 years
  END;

  v_purge_date := v_granted_at + (v_retention_days || ' days')::INTERVAL;

  INSERT INTO consent_retention_schedule (
    consent_record_id,
    buyer_hash,
    consent_type,
    retention_start,
    retention_end,
    retention_period_days,
    purge_scheduled_at
  ) VALUES (
    p_consent_record_id,
    v_buyer_hash,
    v_consent_type,
    v_granted_at,
    v_purge_date,
    v_retention_days,
    v_purge_date
  )
  ON CONFLICT (consent_record_id) DO UPDATE
  SET retention_end = v_purge_date,
      purge_scheduled_at = v_purge_date,
      updated_at = NOW()
  RETURNING id INTO v_schedule_id;

  RETURN v_schedule_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Execute pending purges
CREATE OR REPLACE FUNCTION execute_pending_purges(
  p_batch_size INTEGER DEFAULT 100
) RETURNS TABLE (
  purged_count INTEGER,
  failed_count INTEGER,
  skipped_count INTEGER
) AS $$
DECLARE
  v_purged INTEGER := 0;
  v_failed INTEGER := 0;
  v_skipped INTEGER := 0;
  v_schedule RECORD;
BEGIN
  FOR v_schedule IN
    SELECT * FROM v_pending_purges
    LIMIT p_batch_size
  LOOP
    BEGIN
      -- Check for legal hold one more time
      IF v_schedule.legal_hold THEN
        v_skipped := v_skipped + 1;

        UPDATE consent_retention_schedule
        SET purge_action = 'SKIPPED',
            purge_result = 'Legal hold active',
            updated_at = NOW()
        WHERE id = v_schedule.id;

        CONTINUE;
      END IF;

      -- Delete consent record
      DELETE FROM consent_records
      WHERE id = v_schedule.consent_record_id;

      -- Update schedule
      UPDATE consent_retention_schedule
      SET purge_action = 'COMPLETED',
          purge_executed_at = NOW(),
          purge_result = 'Successfully purged',
          updated_at = NOW()
      WHERE id = v_schedule.id;

      -- Log purge
      INSERT INTO data_purge_log (
        purge_type,
        target_table,
        target_id,
        buyer_hash,
        action,
        records_deleted,
        reason,
        triggered_by,
        retention_policy_id,
        legal_basis,
        success
      ) VALUES (
        'CONSENT',
        'consent_records',
        v_schedule.consent_record_id,
        v_schedule.buyer_hash,
        'COMPLETED',
        1,
        'Retention period expired',
        'SCHEDULED',
        v_schedule.id,
        'PDPA 2024 Section 7',
        TRUE
      );

      v_purged := v_purged + 1;

    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;

      UPDATE consent_retention_schedule
      SET purge_action = 'FAILED',
          purge_result = SQLERRM,
          updated_at = NOW()
      WHERE id = v_schedule.id;

      INSERT INTO data_purge_log (
        purge_type,
        target_table,
        target_id,
        buyer_hash,
        action,
        reason,
        triggered_by,
        success,
        error_message
      ) VALUES (
        'CONSENT',
        'consent_records',
        v_schedule.consent_record_id,
        v_schedule.buyer_hash,
        'FAILED',
        'Retention period expired',
        'SCHEDULED',
        FALSE,
        SQLERRM
      );
    END;
  END LOOP;

  RETURN QUERY SELECT v_purged, v_failed, v_skipped;
END;
$$ LANGUAGE plpgsql;

-- Function: Set legal hold on consent
CREATE OR REPLACE FUNCTION set_legal_hold(
  p_consent_record_id UUID,
  p_reason TEXT,
  p_set_by VARCHAR(255),
  p_expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE consent_retention_schedule
  SET legal_hold = TRUE,
      legal_hold_reason = p_reason,
      legal_hold_set_by = p_set_by,
      legal_hold_set_at = NOW(),
      legal_hold_expires_at = p_expires_at,
      purge_action = 'SKIPPED',
      updated_at = NOW()
  WHERE consent_record_id = p_consent_record_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function: Remove legal hold
CREATE OR REPLACE FUNCTION remove_legal_hold(
  p_consent_record_id UUID,
  p_removed_by VARCHAR(255)
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE consent_retention_schedule
  SET legal_hold = FALSE,
      legal_hold_reason = legal_hold_reason || ' [REMOVED by ' || p_removed_by || ' at ' || NOW() || ']',
      purge_action = CASE
        WHEN purge_scheduled_at <= NOW() THEN 'SCHEDULED'
        ELSE purge_action
      END,
      updated_at = NOW()
  WHERE consent_record_id = p_consent_record_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function: Check breach notification deadline status
CREATE OR REPLACE FUNCTION check_breach_deadlines()
RETURNS TABLE (
  incident_id UUID,
  incident_code VARCHAR(50),
  hours_remaining NUMERIC,
  status TEXT,
  affected_not_notified INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bi.id,
    bi.incident_id,
    EXTRACT(EPOCH FROM (bi.notification_deadline - NOW())) / 3600,
    CASE
      WHEN NOW() > bi.notification_deadline THEN 'DEADLINE_MISSED'
      WHEN NOW() > bi.notification_deadline - INTERVAL '12 hours' THEN 'CRITICAL'
      WHEN NOW() > bi.notification_deadline - INTERVAL '24 hours' THEN 'URGENT'
      WHEN NOW() > bi.notification_deadline - INTERVAL '48 hours' THEN 'WARNING'
      ELSE 'ON_TRACK'
    END,
    (SELECT COUNT(*)::INTEGER FROM breach_affected_parties bap
     WHERE bap.incident_id = bi.id
     AND bap.notification_status NOT IN ('DELIVERED', 'ACKNOWLEDGED'))
  FROM breach_incidents bi
  WHERE bi.status NOT IN ('CLOSED', 'REMEDIATED')
    AND bi.deadline_met IS NULL;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger: Auto-schedule purge when consent is granted
CREATE OR REPLACE FUNCTION trg_schedule_consent_purge()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM schedule_consent_purge(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_consent_purge_schedule
AFTER INSERT ON consent_records
FOR EACH ROW
EXECUTE FUNCTION trg_schedule_consent_purge();

-- Trigger: Update breach incident timestamp
CREATE OR REPLACE FUNCTION trg_update_breach_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_breach_incident_updated
BEFORE UPDATE ON breach_incidents
FOR EACH ROW
EXECUTE FUNCTION trg_update_breach_timestamp();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE breach_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE breach_affected_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE breach_timeline_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_retention_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_purge_log ENABLE ROW LEVEL SECURITY;

-- Breach incidents: Only DPO/Admin can view
CREATE POLICY breach_incidents_admin ON breach_incidents
  FOR ALL
  USING (auth.jwt() ->> 'role' IN ('dpo', 'admin', 'legal'));

-- Affected parties: DPO/Admin access
CREATE POLICY breach_affected_admin ON breach_affected_parties
  FOR ALL
  USING (auth.jwt() ->> 'role' IN ('dpo', 'admin', 'legal'));

-- Timeline: DPO/Admin access
CREATE POLICY breach_timeline_admin ON breach_timeline_log
  FOR ALL
  USING (auth.jwt() ->> 'role' IN ('dpo', 'admin', 'legal'));

-- Retention schedule: Admin only
CREATE POLICY retention_admin ON consent_retention_schedule
  FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'dpo'));

-- Purge log: Admin only
CREATE POLICY purge_log_admin ON data_purge_log
  FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'dpo'));

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE breach_incidents IS 'PDPA 2024 breach incident tracking with 72h notification deadline';
COMMENT ON TABLE breach_affected_parties IS 'Affected individuals and their notification status per breach';
COMMENT ON TABLE breach_timeline_log IS 'Immutable timeline of breach incident events';
COMMENT ON TABLE consent_retention_schedule IS 'Consent data retention policy with auto-purge scheduling';
COMMENT ON TABLE data_purge_log IS 'Audit trail of all data purge operations';

COMMENT ON COLUMN breach_incidents.notification_deadline IS 'PDPA 2024 requires notification within 72 hours of detection';
COMMENT ON COLUMN consent_retention_schedule.legal_hold IS 'Prevents purge for litigation or regulatory investigation';
COMMENT ON FUNCTION execute_pending_purges IS 'Batch process for purging expired consent records - run via cron';
