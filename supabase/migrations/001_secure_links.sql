-- ============================================================================
-- CR-002A: Secure Link Authentication
-- Migration: 001_secure_links.sql
-- Description: Token-based authentication for QR code buyer portal access
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECURE LINKS TABLE
-- Stores tokenized access links for buyer portal
-- ============================================================================
CREATE TABLE IF NOT EXISTS secure_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Token & Authentication
    token VARCHAR(64) UNIQUE NOT NULL,          -- crypto.randomBytes(32).toString('hex')
    token_hash VARCHAR(128),                     -- SHA-256 hash for lookup (optional security layer)

    -- Link Target
    case_id UUID NOT NULL,                       -- Reference to mortgage case
    property_id UUID,                            -- Optional: specific property context

    -- Access Control
    access_type VARCHAR(20) DEFAULT 'buyer' CHECK (access_type IN ('buyer', 'agent', 'developer')),
    scope VARCHAR(50) DEFAULT 'full',            -- 'full', 'view_only', 'documents_only'

    -- Lifecycle Management
    expires_at TIMESTAMPTZ NOT NULL,             -- Token expiration (default 7 days)
    max_uses INTEGER DEFAULT NULL,               -- NULL = unlimited, or specific count
    use_count INTEGER DEFAULT 0,                 -- Track number of times used

    -- Metadata
    created_by UUID,                             -- Developer/Agent who generated link
    created_at TIMESTAMPTZ DEFAULT NOW(),
    first_accessed_at TIMESTAMPTZ,               -- When link was first opened
    last_accessed_at TIMESTAMPTZ,                -- Most recent access

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'exhausted')),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID,
    revoked_reason TEXT,

    -- Audit Trail
    ip_addresses TEXT[],                         -- Array of IPs that accessed
    user_agents TEXT[],                          -- Array of user agents

    -- QR Code Metadata
    qr_generated_at TIMESTAMPTZ,
    qr_format VARCHAR(20) DEFAULT 'png'          -- 'png', 'svg', 'pdf'
);

-- ============================================================================
-- LINK ACCESS LOG
-- Detailed audit trail for every link access attempt
-- ============================================================================
CREATE TABLE IF NOT EXISTS link_access_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Reference
    link_id UUID NOT NULL REFERENCES secure_links(id) ON DELETE CASCADE,

    -- Access Details
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referer TEXT,

    -- Result
    access_granted BOOLEAN NOT NULL,
    denial_reason VARCHAR(50),                   -- 'expired', 'revoked', 'max_uses', 'invalid'

    -- Session
    session_id UUID,                             -- Links to buyer session if created
    session_duration_seconds INTEGER
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary lookup: token validation (most common operation)
CREATE UNIQUE INDEX IF NOT EXISTS idx_secure_links_token ON secure_links(token);

-- Active links by case (developer dashboard)
CREATE INDEX IF NOT EXISTS idx_secure_links_case_active
    ON secure_links(case_id, status)
    WHERE status = 'active';

-- Expiration cleanup (cron job)
CREATE INDEX IF NOT EXISTS idx_secure_links_expires
    ON secure_links(expires_at)
    WHERE status = 'active';

-- Creator lookup (audit)
CREATE INDEX IF NOT EXISTS idx_secure_links_created_by
    ON secure_links(created_by, created_at DESC);

-- Access log: link history
CREATE INDEX IF NOT EXISTS idx_link_access_log_link
    ON link_access_log(link_id, accessed_at DESC);

-- Access log: IP tracking (security)
CREATE INDEX IF NOT EXISTS idx_link_access_log_ip
    ON link_access_log(ip_address, accessed_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Multi-tenant isolation
-- ============================================================================

ALTER TABLE secure_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_access_log ENABLE ROW LEVEL SECURITY;

-- Policy: Developers can only see/manage links they created
CREATE POLICY developer_links_policy ON secure_links
    FOR ALL
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Policy: Service role can do anything (API routes)
CREATE POLICY service_role_links_policy ON secure_links
    FOR ALL
    USING (auth.role() = 'service_role');

-- Policy: Access logs follow same pattern
CREATE POLICY developer_access_log_policy ON link_access_log
    FOR SELECT
    USING (
        link_id IN (
            SELECT id FROM secure_links WHERE created_by = auth.uid()
        )
    );

CREATE POLICY service_role_access_log_policy ON link_access_log
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Validate token and return link data
CREATE OR REPLACE FUNCTION validate_secure_link(p_token VARCHAR)
RETURNS TABLE (
    is_valid BOOLEAN,
    link_id UUID,
    case_id UUID,
    property_id UUID,
    access_type VARCHAR,
    scope VARCHAR,
    denial_reason VARCHAR
) AS $$
DECLARE
    v_link RECORD;
BEGIN
    -- Find the link
    SELECT * INTO v_link FROM secure_links WHERE token = p_token;

    -- Token not found
    IF v_link IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::UUID, NULL::VARCHAR, NULL::VARCHAR, 'invalid'::VARCHAR;
        RETURN;
    END IF;

    -- Check status
    IF v_link.status != 'active' THEN
        RETURN QUERY SELECT false, v_link.id, v_link.case_id, v_link.property_id, v_link.access_type, v_link.scope, v_link.status::VARCHAR;
        RETURN;
    END IF;

    -- Check expiration
    IF v_link.expires_at < NOW() THEN
        -- Auto-update status
        UPDATE secure_links SET status = 'expired' WHERE id = v_link.id;
        RETURN QUERY SELECT false, v_link.id, v_link.case_id, v_link.property_id, v_link.access_type, v_link.scope, 'expired'::VARCHAR;
        RETURN;
    END IF;

    -- Check max uses
    IF v_link.max_uses IS NOT NULL AND v_link.use_count >= v_link.max_uses THEN
        -- Auto-update status
        UPDATE secure_links SET status = 'exhausted' WHERE id = v_link.id;
        RETURN QUERY SELECT false, v_link.id, v_link.case_id, v_link.property_id, v_link.access_type, v_link.scope, 'exhausted'::VARCHAR;
        RETURN;
    END IF;

    -- Valid! Update access tracking
    UPDATE secure_links SET
        use_count = use_count + 1,
        first_accessed_at = COALESCE(first_accessed_at, NOW()),
        last_accessed_at = NOW()
    WHERE id = v_link.id;

    RETURN QUERY SELECT true, v_link.id, v_link.case_id, v_link.property_id, v_link.access_type, v_link.scope, NULL::VARCHAR;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Generate new secure link
CREATE OR REPLACE FUNCTION create_secure_link(
    p_case_id UUID,
    p_token VARCHAR,
    p_created_by UUID,
    p_expires_in_days INTEGER DEFAULT 7,
    p_max_uses INTEGER DEFAULT NULL,
    p_access_type VARCHAR DEFAULT 'buyer',
    p_scope VARCHAR DEFAULT 'full',
    p_property_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_link_id UUID;
BEGIN
    INSERT INTO secure_links (
        token,
        case_id,
        property_id,
        access_type,
        scope,
        expires_at,
        max_uses,
        created_by
    ) VALUES (
        p_token,
        p_case_id,
        p_property_id,
        p_access_type,
        p_scope,
        NOW() + (p_expires_in_days || ' days')::INTERVAL,
        p_max_uses,
        p_created_by
    )
    RETURNING id INTO v_link_id;

    RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Revoke a link
CREATE OR REPLACE FUNCTION revoke_secure_link(
    p_link_id UUID,
    p_revoked_by UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE secure_links SET
        status = 'revoked',
        revoked_at = NOW(),
        revoked_by = p_revoked_by,
        revoked_reason = p_reason
    WHERE id = p_link_id AND status = 'active';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CRON: Auto-expire links (run daily)
-- Requires pg_cron extension in Supabase
-- ============================================================================
-- SELECT cron.schedule('expire-links', '0 0 * * *', $$
--     UPDATE secure_links
--     SET status = 'expired'
--     WHERE status = 'active' AND expires_at < NOW()
-- $$);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE secure_links IS 'CR-002A: Tokenized access links for QR code buyer portal authentication';
COMMENT ON TABLE link_access_log IS 'CR-002A: Audit trail for all link access attempts';
COMMENT ON FUNCTION validate_secure_link IS 'Validates token and returns access details or denial reason';
COMMENT ON FUNCTION create_secure_link IS 'Creates new secure link with configurable expiration and max uses';
COMMENT ON FUNCTION revoke_secure_link IS 'Revokes an active link with reason tracking';
