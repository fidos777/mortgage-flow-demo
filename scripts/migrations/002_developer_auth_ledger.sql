-- =============================================================================
-- Migration 002: Developer Auth Ledger
-- Sprint 0, Session S0.4 | PRD v3.6.3 CR-010B
-- =============================================================================
-- Purpose: Track developer authentication events for audit trail
--
-- Key Features:
-- - Records login/logout events per developer
-- - Tracks session duration and activity
-- - Links auth events to consent records (when applicable)
-- - Supports IP-based anomaly detection (future)
--
-- Dependencies: 001_pdpa_consent_tables.sql (pdpa_notice_versions, consent_audit_log)
-- =============================================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- Auth event types
CREATE TYPE auth_event_type AS ENUM (
  'LOGIN_SUCCESS',          -- Successful login
  'LOGIN_FAILED',           -- Failed login attempt
  'LOGOUT',                 -- User-initiated logout
  'SESSION_EXPIRED',        -- Automatic session expiration
  'SESSION_REFRESH',        -- Token refresh
  'PASSWORD_RESET_REQUEST', -- Password reset requested
  'PASSWORD_RESET_COMPLETE',-- Password reset completed
  'MFA_CHALLENGE',          -- MFA challenge sent
  'MFA_SUCCESS',            -- MFA verification successful
  'MFA_FAILED',             -- MFA verification failed
  'ACCOUNT_LOCKED',         -- Account locked due to failed attempts
  'ACCOUNT_UNLOCKED',       -- Account unlocked
  'PERMISSION_GRANTED',     -- New permission granted
  'PERMISSION_REVOKED',     -- Permission revoked
  'IMPERSONATION_START',    -- Admin started impersonating
  'IMPERSONATION_END'       -- Admin ended impersonation
);

-- Auth provider types
CREATE TYPE auth_provider AS ENUM (
  'EMAIL_PASSWORD',   -- Standard email/password
  'GOOGLE',           -- Google OAuth
  'MICROSOFT',        -- Microsoft OAuth
  'APPLE',            -- Apple OAuth
  'MAGIC_LINK',       -- Passwordless magic link
  'API_KEY',          -- API key authentication
  'SSO_SAML',         -- Enterprise SAML SSO
  'SSO_OIDC'          -- Enterprise OIDC SSO
);

-- =============================================================================
-- DEVELOPER AUTH LEDGER TABLE
-- =============================================================================

CREATE TABLE developer_auth_ledger (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Developer Identity (anonymized where possible)
  developer_id UUID NOT NULL,           -- Reference to developer account
  developer_hash VARCHAR(64),           -- SHA-256 hash for anonymous tracking

  -- Event Details
  event_type auth_event_type NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Session Context
  session_id UUID,                      -- Current session identifier
  session_start TIMESTAMPTZ,            -- When session began
  session_duration_seconds INTEGER,     -- Duration (for logout/expiry events)

  -- Authentication Context
  auth_provider auth_provider NOT NULL DEFAULT 'EMAIL_PASSWORD',
  auth_method VARCHAR(50),              -- Specific method used (e.g., 'otp', 'biometric')
  mfa_method VARCHAR(50),               -- MFA type if applicable (e.g., 'totp', 'sms')

  -- Client Context (privacy-safe)
  ip_hash VARCHAR(64),                  -- SHA-256 of IP address
  user_agent_hash VARCHAR(64),          -- SHA-256 of user agent
  device_fingerprint VARCHAR(64),       -- Device fingerprint hash
  geo_region VARCHAR(10),               -- ISO region code (e.g., 'MY', 'SG')

  -- Risk Assessment
  risk_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00 risk score
  risk_factors JSONB DEFAULT '[]',      -- Array of risk factor codes
  is_anomalous BOOLEAN DEFAULT FALSE,   -- Flagged as anomalous

  -- Related Entities
  consent_record_id UUID,               -- Link to consent record if applicable
  project_id UUID,                      -- Project context if applicable
  case_id UUID,                         -- Case context if applicable

  -- Additional Metadata
  failure_reason VARCHAR(255),          -- For failed events
  metadata JSONB DEFAULT '{}',          -- Additional event-specific data

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_risk_score CHECK (risk_score >= 0 AND risk_score <= 1)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary access patterns
CREATE INDEX idx_auth_ledger_developer_id ON developer_auth_ledger(developer_id);
CREATE INDEX idx_auth_ledger_developer_hash ON developer_auth_ledger(developer_hash);
CREATE INDEX idx_auth_ledger_session_id ON developer_auth_ledger(session_id);

-- Time-based queries
CREATE INDEX idx_auth_ledger_timestamp ON developer_auth_ledger(event_timestamp DESC);
CREATE INDEX idx_auth_ledger_dev_timestamp ON developer_auth_ledger(developer_id, event_timestamp DESC);

-- Event type queries
CREATE INDEX idx_auth_ledger_event_type ON developer_auth_ledger(event_type);

-- Security monitoring
CREATE INDEX idx_auth_ledger_anomalous ON developer_auth_ledger(is_anomalous) WHERE is_anomalous = TRUE;
CREATE INDEX idx_auth_ledger_failed_logins ON developer_auth_ledger(developer_id, event_timestamp)
  WHERE event_type = 'LOGIN_FAILED';

-- IP-based queries (for rate limiting)
CREATE INDEX idx_auth_ledger_ip_hash ON developer_auth_ledger(ip_hash, event_timestamp DESC);

-- =============================================================================
-- ACTIVE SESSIONS VIEW
-- =============================================================================

CREATE OR REPLACE VIEW v_active_sessions AS
SELECT DISTINCT ON (developer_id)
  developer_id,
  session_id,
  session_start,
  auth_provider,
  ip_hash,
  geo_region,
  event_timestamp as last_activity
FROM developer_auth_ledger
WHERE event_type IN ('LOGIN_SUCCESS', 'SESSION_REFRESH')
  AND session_id IS NOT NULL
  AND event_timestamp > NOW() - INTERVAL '24 hours'
ORDER BY developer_id, event_timestamp DESC;

-- =============================================================================
-- FAILED LOGIN ATTEMPTS VIEW (Last 24h)
-- =============================================================================

CREATE OR REPLACE VIEW v_failed_login_attempts AS
SELECT
  developer_id,
  developer_hash,
  ip_hash,
  COUNT(*) as attempt_count,
  MIN(event_timestamp) as first_attempt,
  MAX(event_timestamp) as last_attempt,
  array_agg(DISTINCT failure_reason) as failure_reasons
FROM developer_auth_ledger
WHERE event_type = 'LOGIN_FAILED'
  AND event_timestamp > NOW() - INTERVAL '24 hours'
GROUP BY developer_id, developer_hash, ip_hash
HAVING COUNT(*) >= 3;  -- Flag 3+ failed attempts

-- =============================================================================
-- AUTH METRICS VIEW (Daily Aggregates)
-- =============================================================================

CREATE OR REPLACE VIEW v_auth_metrics_daily AS
SELECT
  DATE(event_timestamp) as metric_date,
  event_type,
  auth_provider,
  COUNT(*) as event_count,
  COUNT(DISTINCT developer_id) as unique_developers,
  COUNT(CASE WHEN is_anomalous THEN 1 END) as anomalous_count,
  AVG(risk_score) as avg_risk_score
FROM developer_auth_ledger
WHERE event_timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(event_timestamp), event_type, auth_provider
ORDER BY metric_date DESC, event_count DESC;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function: Log an auth event
CREATE OR REPLACE FUNCTION log_auth_event(
  p_developer_id UUID,
  p_event_type auth_event_type,
  p_session_id UUID DEFAULT NULL,
  p_auth_provider auth_provider DEFAULT 'EMAIL_PASSWORD',
  p_ip_hash VARCHAR(64) DEFAULT NULL,
  p_user_agent_hash VARCHAR(64) DEFAULT NULL,
  p_failure_reason VARCHAR(255) DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_developer_hash VARCHAR(64);
  v_session_start TIMESTAMPTZ;
BEGIN
  -- Generate developer hash for anonymous tracking
  v_developer_hash := encode(sha256(p_developer_id::text::bytea), 'hex');

  -- Get session start time if session exists
  IF p_session_id IS NOT NULL THEN
    SELECT session_start INTO v_session_start
    FROM developer_auth_ledger
    WHERE session_id = p_session_id AND event_type = 'LOGIN_SUCCESS'
    ORDER BY event_timestamp DESC
    LIMIT 1;
  END IF;

  INSERT INTO developer_auth_ledger (
    developer_id,
    developer_hash,
    event_type,
    session_id,
    session_start,
    auth_provider,
    ip_hash,
    user_agent_hash,
    failure_reason,
    metadata
  ) VALUES (
    p_developer_id,
    v_developer_hash,
    p_event_type,
    p_session_id,
    COALESCE(v_session_start, CASE WHEN p_event_type = 'LOGIN_SUCCESS' THEN NOW() END),
    p_auth_provider,
    p_ip_hash,
    p_user_agent_hash,
    p_failure_reason,
    p_metadata
  ) RETURNING id INTO v_event_id;

  -- Auto-lock account after 5 failed login attempts in 15 minutes
  IF p_event_type = 'LOGIN_FAILED' THEN
    IF (
      SELECT COUNT(*) FROM developer_auth_ledger
      WHERE developer_id = p_developer_id
        AND event_type = 'LOGIN_FAILED'
        AND event_timestamp > NOW() - INTERVAL '15 minutes'
    ) >= 5 THEN
      -- Log account lock event
      INSERT INTO developer_auth_ledger (
        developer_id,
        developer_hash,
        event_type,
        ip_hash,
        metadata
      ) VALUES (
        p_developer_id,
        v_developer_hash,
        'ACCOUNT_LOCKED',
        p_ip_hash,
        jsonb_build_object('reason', 'Too many failed login attempts', 'triggered_by', v_event_id)
      );
    END IF;
  END IF;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate session duration on logout/expiry
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type IN ('LOGOUT', 'SESSION_EXPIRED') AND NEW.session_id IS NOT NULL THEN
    -- Calculate duration from session start
    SELECT EXTRACT(EPOCH FROM (NOW() - session_start))::INTEGER
    INTO NEW.session_duration_seconds
    FROM developer_auth_ledger
    WHERE session_id = NEW.session_id
      AND event_type = 'LOGIN_SUCCESS'
    ORDER BY event_timestamp DESC
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_session_duration
BEFORE INSERT ON developer_auth_ledger
FOR EACH ROW
EXECUTE FUNCTION calculate_session_duration();

-- Function: Get recent auth events for a developer
CREATE OR REPLACE FUNCTION get_developer_auth_history(
  p_developer_id UUID,
  p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
  event_id UUID,
  event_type auth_event_type,
  event_timestamp TIMESTAMPTZ,
  auth_provider auth_provider,
  session_duration_seconds INTEGER,
  geo_region VARCHAR(10),
  is_anomalous BOOLEAN,
  failure_reason VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    dal.event_type,
    dal.event_timestamp,
    dal.auth_provider,
    dal.session_duration_seconds,
    dal.geo_region,
    dal.is_anomalous,
    dal.failure_reason
  FROM developer_auth_ledger dal
  WHERE developer_id = p_developer_id
  ORDER BY dal.event_timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(
  p_developer_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_lock_event RECORD;
  v_unlock_event RECORD;
BEGIN
  -- Get most recent lock event
  SELECT * INTO v_lock_event
  FROM developer_auth_ledger
  WHERE developer_id = p_developer_id
    AND event_type = 'ACCOUNT_LOCKED'
  ORDER BY event_timestamp DESC
  LIMIT 1;

  -- If no lock event, account is not locked
  IF v_lock_event IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get most recent unlock event after the lock
  SELECT * INTO v_unlock_event
  FROM developer_auth_ledger
  WHERE developer_id = p_developer_id
    AND event_type = 'ACCOUNT_UNLOCKED'
    AND event_timestamp > v_lock_event.event_timestamp
  ORDER BY event_timestamp DESC
  LIMIT 1;

  -- If unlock event exists after lock, account is not locked
  IF v_unlock_event IS NOT NULL THEN
    RETURN FALSE;
  END IF;

  -- Auto-unlock after 30 minutes
  IF v_lock_event.event_timestamp < NOW() - INTERVAL '30 minutes' THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE developer_auth_ledger ENABLE ROW LEVEL SECURITY;

-- Policy: Developers can view their own auth history
CREATE POLICY auth_ledger_developer_read ON developer_auth_ledger
  FOR SELECT
  USING (developer_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Policy: Only system/service can insert auth events
CREATE POLICY auth_ledger_insert ON developer_auth_ledger
  FOR INSERT
  WITH CHECK (TRUE);  -- Controlled at application level

-- Policy: No direct updates (immutable audit log)
CREATE POLICY auth_ledger_no_update ON developer_auth_ledger
  FOR UPDATE
  USING (FALSE);

-- Policy: No direct deletes (immutable audit log)
CREATE POLICY auth_ledger_no_delete ON developer_auth_ledger
  FOR DELETE
  USING (FALSE);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE developer_auth_ledger IS 'Immutable audit log of developer authentication events - Sprint 0 S0.4 PDPA compliance';
COMMENT ON COLUMN developer_auth_ledger.developer_hash IS 'SHA-256 hash of developer_id for anonymous analytics';
COMMENT ON COLUMN developer_auth_ledger.risk_score IS 'ML-computed risk score from 0 (safe) to 1 (high risk)';
COMMENT ON COLUMN developer_auth_ledger.is_anomalous IS 'Flagged by anomaly detection system';

COMMENT ON FUNCTION log_auth_event IS 'Safely log an authentication event with auto-lock on repeated failures';
COMMENT ON FUNCTION is_account_locked IS 'Check if developer account is currently locked due to failed attempts';
