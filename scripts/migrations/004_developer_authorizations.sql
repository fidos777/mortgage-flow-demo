-- =============================================================================
-- Migration 004: Developer PDPA Authorizations
-- Sprint S0-FIX, Session SF.1 | PRD v3.6.3 CR-010B
-- =============================================================================
-- Purpose: Track developer PDPA clickwrap authorizations for data processing
--
-- IMPORTANT: This is DIFFERENT from developer_auth_ledger (002):
-- - developer_auth_ledger = authentication events (login, logout, MFA)
-- - developer_authorizations = PDPA clickwrap agreements (this table)
--
-- Key Features:
-- - Controller-Processor acknowledgements per PRD 9.2
-- - Appointed agents tracking (JSONB array)
-- - Authorization lifecycle (ACTIVE → EXPIRED → REVOKED)
-- - Enforcement: no QR generation without valid authorization
--
-- Dependencies: None (standalone table)
-- =============================================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- Authorization status lifecycle
CREATE TYPE authorization_status AS ENUM (
  'PENDING',      -- Clickwrap shown but not yet signed
  'ACTIVE',       -- Signed and valid
  'EXPIRED',      -- Past expiry date (auto-transition via cron)
  'REVOKED',      -- Manually revoked by admin
  'SUPERSEDED'    -- Replaced by newer version
);

-- Acknowledgement types (Controller-Processor requirements)
CREATE TYPE acknowledgement_type AS ENUM (
  'NO_PII_ACCESS',            -- "Saya faham saya TIDAK boleh mengakses data peribadi pembeli"
  'AGGREGATE_ONLY',           -- "Saya hanya akan melihat data agregat"
  'APPOINTED_AGENTS_DECLARED',-- "Saya telah melantik ejen yang disenaraikan"
  'DATA_RETENTION_UNDERSTOOD',-- "Saya faham polisi penyimpanan data"
  'BREACH_REPORTING_AGREED',  -- "Saya bersetuju melaporkan insiden kebocoran dalam 72 jam"
  'AUDIT_ACCESS_GRANTED'      -- "Saya memberi kebenaran audit rekod bila diperlukan"
);

-- =============================================================================
-- DEVELOPER AUTHORIZATIONS TABLE
-- =============================================================================

CREATE TABLE developer_authorizations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Developer Identity (from Supabase auth or external)
  developer_id UUID NOT NULL,           -- Reference to developer account

  -- Company Information (captured at signing)
  company_name VARCHAR(255) NOT NULL,   -- SSM registered name
  ssm_number VARCHAR(20) NOT NULL,      -- SSM registration number
  company_address TEXT,                 -- Registered address

  -- Authorized Signatory
  authorized_person VARCHAR(255) NOT NULL,  -- Name of person signing
  authorized_email VARCHAR(255) NOT NULL,   -- Email for notices
  authorized_phone VARCHAR(20),             -- Phone for urgent notices
  authorized_ic_hash VARCHAR(64),           -- SHA-256 of IC number (privacy)
  authorized_designation VARCHAR(100),      -- Job title

  -- Appointed Agents (JSONB array)
  -- Format: [{ "agent_id": "uuid", "name": "...", "phone": "...", "appointed_at": "iso8601" }]
  appointed_agents JSONB DEFAULT '[]'::JSONB,

  -- Acknowledgements (JSONB object)
  -- Format: { "NO_PII_ACCESS": { "agreed": true, "timestamp": "iso8601" }, ... }
  acknowledgements JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Authorization Lifecycle
  status authorization_status NOT NULL DEFAULT 'PENDING',
  signed_at TIMESTAMPTZ,                -- When clickwrap was signed
  expires_at TIMESTAMPTZ,               -- Expiry date (default: signed_at + 365 days)
  revoked_at TIMESTAMPTZ,               -- When revoked (if applicable)
  revoked_by UUID,                      -- Admin who revoked
  revocation_reason TEXT,               -- Why revoked

  -- Version Control
  auth_version INTEGER NOT NULL DEFAULT 1,  -- Version of clickwrap signed
  notice_version_id UUID,                   -- Link to pdpa_notice_versions

  -- Projects Covered (optional: can be "all" or specific)
  project_scope JSONB DEFAULT '"all"'::JSONB,  -- "all" or ["project_id_1", "project_id_2"]

  -- Metadata
  ip_hash VARCHAR(64),                  -- SHA-256 of IP at signing
  user_agent_hash VARCHAR(64),          -- SHA-256 of user agent
  signing_session_id UUID,              -- Session when signed
  metadata JSONB DEFAULT '{}'::JSONB,   -- Additional data

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status_transition CHECK (
    -- PENDING can only go to ACTIVE
    -- ACTIVE can go to EXPIRED, REVOKED, SUPERSEDED
    -- Terminal states: EXPIRED, REVOKED, SUPERSEDED
    (status = 'PENDING') OR
    (status = 'ACTIVE' AND signed_at IS NOT NULL) OR
    (status = 'EXPIRED' AND expires_at <= NOW()) OR
    (status = 'REVOKED' AND revoked_at IS NOT NULL) OR
    (status = 'SUPERSEDED')
  ),
  CONSTRAINT valid_expiry CHECK (
    expires_at IS NULL OR expires_at > signed_at
  ),
  CONSTRAINT required_acknowledgements CHECK (
    status != 'ACTIVE' OR (
      acknowledgements ? 'NO_PII_ACCESS' AND
      acknowledgements ? 'AGGREGATE_ONLY' AND
      acknowledgements ? 'APPOINTED_AGENTS_DECLARED'
    )
  )
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary access patterns
CREATE INDEX idx_dev_auth_developer_id ON developer_authorizations(developer_id);
CREATE INDEX idx_dev_auth_status ON developer_authorizations(status);
CREATE INDEX idx_dev_auth_ssm ON developer_authorizations(ssm_number);

-- Active authorization lookup (most common query)
CREATE INDEX idx_dev_auth_active ON developer_authorizations(developer_id, status)
  WHERE status = 'ACTIVE';

-- Expiry monitoring
CREATE INDEX idx_dev_auth_expiry ON developer_authorizations(expires_at)
  WHERE status = 'ACTIVE';

-- Agent lookup (GIN for JSONB array)
CREATE INDEX idx_dev_auth_agents ON developer_authorizations
  USING GIN (appointed_agents jsonb_path_ops);

-- =============================================================================
-- VIEWS
-- =============================================================================

-- View: Currently valid authorizations
CREATE OR REPLACE VIEW v_active_developer_authorizations AS
SELECT
  id,
  developer_id,
  company_name,
  ssm_number,
  authorized_person,
  authorized_email,
  appointed_agents,
  signed_at,
  expires_at,
  auth_version,
  EXTRACT(DAY FROM (expires_at - NOW())) as days_until_expiry
FROM developer_authorizations
WHERE status = 'ACTIVE'
  AND expires_at > NOW();

-- View: Authorizations expiring within 30 days
CREATE OR REPLACE VIEW v_expiring_authorizations AS
SELECT
  id,
  developer_id,
  company_name,
  authorized_email,
  expires_at,
  EXTRACT(DAY FROM (expires_at - NOW())) as days_remaining
FROM developer_authorizations
WHERE status = 'ACTIVE'
  AND expires_at > NOW()
  AND expires_at <= NOW() + INTERVAL '30 days'
ORDER BY expires_at ASC;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function: Check if developer has valid authorization
CREATE OR REPLACE FUNCTION has_valid_authorization(
  p_developer_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM developer_authorizations
    WHERE developer_id = p_developer_id
      AND status = 'ACTIVE'
      AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get active authorization for developer
CREATE OR REPLACE FUNCTION get_active_authorization(
  p_developer_id UUID
) RETURNS developer_authorizations AS $$
  SELECT * FROM developer_authorizations
  WHERE developer_id = p_developer_id
    AND status = 'ACTIVE'
    AND expires_at > NOW()
  ORDER BY signed_at DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Function: Check if agent is appointed by developer
CREATE OR REPLACE FUNCTION is_agent_appointed(
  p_developer_id UUID,
  p_agent_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM developer_authorizations
    WHERE developer_id = p_developer_id
      AND status = 'ACTIVE'
      AND expires_at > NOW()
      AND appointed_agents @> jsonb_build_array(jsonb_build_object('agent_id', p_agent_id::text))
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Sign authorization (transition PENDING → ACTIVE)
CREATE OR REPLACE FUNCTION sign_authorization(
  p_authorization_id UUID,
  p_acknowledgements JSONB,
  p_ip_hash VARCHAR(64) DEFAULT NULL,
  p_validity_days INTEGER DEFAULT 365
) RETURNS developer_authorizations AS $$
DECLARE
  v_auth developer_authorizations;
BEGIN
  -- Validate required acknowledgements
  IF NOT (
    p_acknowledgements ? 'NO_PII_ACCESS' AND
    p_acknowledgements ? 'AGGREGATE_ONLY' AND
    p_acknowledgements ? 'APPOINTED_AGENTS_DECLARED'
  ) THEN
    RAISE EXCEPTION 'Missing required acknowledgements: NO_PII_ACCESS, AGGREGATE_ONLY, APPOINTED_AGENTS_DECLARED';
  END IF;

  UPDATE developer_authorizations
  SET
    status = 'ACTIVE',
    signed_at = NOW(),
    expires_at = NOW() + (p_validity_days || ' days')::INTERVAL,
    acknowledgements = p_acknowledgements,
    ip_hash = COALESCE(p_ip_hash, ip_hash),
    updated_at = NOW()
  WHERE id = p_authorization_id
    AND status = 'PENDING'
  RETURNING * INTO v_auth;

  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'Authorization not found or not in PENDING status';
  END IF;

  RETURN v_auth;
END;
$$ LANGUAGE plpgsql;

-- Function: Revoke authorization
CREATE OR REPLACE FUNCTION revoke_authorization(
  p_authorization_id UUID,
  p_revoked_by UUID,
  p_reason TEXT
) RETURNS developer_authorizations AS $$
DECLARE
  v_auth developer_authorizations;
BEGIN
  UPDATE developer_authorizations
  SET
    status = 'REVOKED',
    revoked_at = NOW(),
    revoked_by = p_revoked_by,
    revocation_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_authorization_id
    AND status = 'ACTIVE'
  RETURNING * INTO v_auth;

  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'Authorization not found or not in ACTIVE status';
  END IF;

  RETURN v_auth;
END;
$$ LANGUAGE plpgsql;

-- Function: Expire authorizations (called by cron)
CREATE OR REPLACE FUNCTION expire_authorizations()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE developer_authorizations
  SET
    status = 'EXPIRED',
    updated_at = NOW()
  WHERE status = 'ACTIVE'
    AND expires_at <= NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Add appointed agent
CREATE OR REPLACE FUNCTION add_appointed_agent(
  p_authorization_id UUID,
  p_agent_id UUID,
  p_agent_name VARCHAR(255),
  p_agent_phone VARCHAR(20)
) RETURNS developer_authorizations AS $$
DECLARE
  v_auth developer_authorizations;
  v_new_agent JSONB;
BEGIN
  v_new_agent := jsonb_build_object(
    'agent_id', p_agent_id::text,
    'name', p_agent_name,
    'phone', p_agent_phone,
    'appointed_at', NOW()::text
  );

  UPDATE developer_authorizations
  SET
    appointed_agents = appointed_agents || v_new_agent,
    updated_at = NOW()
  WHERE id = p_authorization_id
    AND status = 'ACTIVE'
    AND NOT (appointed_agents @> jsonb_build_array(jsonb_build_object('agent_id', p_agent_id::text)))
  RETURNING * INTO v_auth;

  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'Authorization not found, not active, or agent already appointed';
  END IF;

  RETURN v_auth;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger: Update updated_at on any change
CREATE OR REPLACE FUNCTION update_authorization_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_authorization_updated
BEFORE UPDATE ON developer_authorizations
FOR EACH ROW
EXECUTE FUNCTION update_authorization_timestamp();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE developer_authorizations ENABLE ROW LEVEL SECURITY;

-- Policy: Developers can view their own authorizations
CREATE POLICY dev_auth_developer_read ON developer_authorizations
  FOR SELECT
  USING (developer_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Policy: Only system/service can insert authorizations
CREATE POLICY dev_auth_insert ON developer_authorizations
  FOR INSERT
  WITH CHECK (TRUE);  -- Controlled at application level

-- Policy: Updates only via functions (no direct updates)
CREATE POLICY dev_auth_update ON developer_authorizations
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service');

-- Policy: No deletes (soft-delete via status)
CREATE POLICY dev_auth_no_delete ON developer_authorizations
  FOR DELETE
  USING (FALSE);

-- =============================================================================
-- PROOF EVENTS INTEGRATION
-- =============================================================================

-- Note: These proof events should be logged by the application layer:
-- - DEVELOPER_AUTHORIZED: When sign_authorization() succeeds
-- - DEVELOPER_AUTH_UPDATED: When appointed_agents change
-- - DEVELOPER_AUTH_EXPIRED: When expire_authorizations() runs
-- - DEVELOPER_AUTH_REVOKED: When revoke_authorization() succeeds
-- - UNAUTHORIZED_ACCESS_ATTEMPT: When has_valid_authorization() returns false

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE developer_authorizations IS 'PDPA clickwrap authorizations for developers - SF.1 CR-010B compliance';
COMMENT ON COLUMN developer_authorizations.acknowledgements IS 'JSONB object of signed acknowledgements with timestamps';
COMMENT ON COLUMN developer_authorizations.appointed_agents IS 'Array of agents authorized to handle cases for this developer';
COMMENT ON COLUMN developer_authorizations.project_scope IS '"all" or array of specific project_ids this authorization covers';

COMMENT ON FUNCTION has_valid_authorization IS 'Check if developer has valid PDPA authorization - use BEFORE generating QR/invite links';
COMMENT ON FUNCTION is_agent_appointed IS 'Check if agent is in appointed_agents list - use BEFORE assigning cases';
COMMENT ON FUNCTION expire_authorizations IS 'Cron job: run daily to expire authorizations past expires_at';
