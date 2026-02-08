-- =============================================================================
-- MIGRATION 001: PDPA Consent Tables
-- Sprint 0, Session S0.1 | PRD v3.6.3 CR-010, CR-010A
-- =============================================================================
-- Creates:
--   1. pdpa_notice_versions - Versioned PDPA notice text for audit trail
--   2. consent_records - Granular consent tracking per buyer
--
-- Run Order: Must run BEFORE 002_auth_ledger.sql and 003_breach_scaffold.sql
-- =============================================================================

-- =============================================================================
-- PDPA NOTICE VERSIONS TABLE
-- Stores versioned PDPA notice text (BM + EN) for consent audit trail
-- When notice text changes, create new version - consents reference specific version
-- =============================================================================

CREATE TABLE IF NOT EXISTS pdpa_notice_versions (
  version TEXT PRIMARY KEY,                    -- e.g. '1.0', '1.1', '2.0'

  -- Full notice text (bilingual)
  content_bm TEXT NOT NULL,                    -- Bahasa Malaysia notice
  content_en TEXT NOT NULL,                    -- English notice

  -- Summary text for UI display
  summary_bm TEXT,                             -- Short BM summary
  summary_en TEXT,                             -- Short EN summary

  -- Version metadata
  effective_from TIMESTAMPTZ NOT NULL,         -- When this version became active
  superseded_at TIMESTAMPTZ,                   -- When replaced by newer version (NULL = current)

  -- Change tracking
  change_reason TEXT,                          -- Why this version was created
  approved_by TEXT,                            -- Who approved the notice text

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'system'
);

-- Index for finding current active version
CREATE INDEX IF NOT EXISTS idx_pdpa_notice_current
  ON pdpa_notice_versions(effective_from DESC)
  WHERE superseded_at IS NULL;

-- =============================================================================
-- Insert initial PDPA notice version (v1.0)
-- =============================================================================

INSERT INTO pdpa_notice_versions (
  version,
  content_bm,
  content_en,
  summary_bm,
  summary_en,
  effective_from,
  change_reason,
  approved_by
) VALUES (
  '1.0',
  E'NOTIS PERLINDUNGAN DATA PERIBADI\n\nMenurut Akta Perlindungan Data Peribadi 2010 (Pindaan 2024), kami memerlukan persetujuan anda untuk memproses data peribadi anda bagi tujuan penilaian kelayakan pinjaman perumahan.\n\nData yang dikumpul:\n• Maklumat pengenalan (nama, IC)\n• Maklumat kewangan (pendapatan, komitmen)\n• Maklumat pekerjaan\n• Maklumat hartanah\n\nTujuan pemprosesan:\n• Penilaian kelayakan pinjaman LPPSA\n• Penyediaan dokumen permohonan\n• Komunikasi berkaitan permohonan\n\nHak anda:\n• Akses kepada data anda\n• Pembetulan data yang tidak tepat\n• Menarik balik persetujuan (dengan notis)\n\nData anda akan disimpan selama 7 tahun selepas tamat urusan atau seperti yang dikehendaki oleh undang-undang.',
  E'PERSONAL DATA PROTECTION NOTICE\n\nUnder the Personal Data Protection Act 2010 (Amendment 2024), we require your consent to process your personal data for housing loan eligibility assessment purposes.\n\nData collected:\n• Identification information (name, IC)\n• Financial information (income, commitments)\n• Employment information\n• Property information\n\nProcessing purposes:\n• LPPSA loan eligibility assessment\n• Application document preparation\n• Application-related communications\n\nYour rights:\n• Access to your data\n• Correction of inaccurate data\n• Withdrawal of consent (with notice)\n\nYour data will be retained for 7 years after completion of the matter or as required by law.',
  'Saya membenarkan pemprosesan data peribadi saya untuk penilaian kelayakan pinjaman perumahan.',
  'I consent to the processing of my personal data for housing loan eligibility assessment.',
  NOW(),
  'Initial PDPA notice version for PRD v3.6.3 launch',
  'system'
) ON CONFLICT (version) DO NOTHING;

-- =============================================================================
-- CONSENT RECORDS TABLE
-- Granular consent tracking with PDPA-compliant types
-- CR-010A: PDPA_BASIC (required), PDPA_MARKETING, PDPA_ANALYTICS, PDPA_THIRD_PARTY
-- =============================================================================

CREATE TABLE IF NOT EXISTS consent_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Buyer identification (hashed for privacy)
  buyer_hash TEXT NOT NULL,                    -- SHA-256 hash of IC/phone

  -- Consent type (granular PDPA categories)
  consent_type TEXT NOT NULL CHECK (consent_type IN (
    'PDPA_BASIC',          -- Required: Basic data processing for loan assessment
    'PDPA_MARKETING',      -- Optional: Marketing communications (SMS, email, WhatsApp)
    'PDPA_ANALYTICS',      -- Optional: Anonymous usage analytics
    'PDPA_THIRD_PARTY'     -- Situational: Sharing with LPPSA/banks (required at submission)
  )),

  -- Consent lifecycle
  granted_at TIMESTAMPTZ DEFAULT NOW(),        -- When consent was given
  expires_at TIMESTAMPTZ,                      -- Optional expiry (NULL = no expiry)
  revoked_at TIMESTAMPTZ,                      -- When consent was withdrawn (NULL = active)

  -- CR-010D: Phase 2 retention prep
  retention_period INTERVAL,                   -- Data retention period for this consent type

  -- Version tracking (FK to pdpa_notice_versions)
  consent_version TEXT NOT NULL REFERENCES pdpa_notice_versions(version),

  -- Capture context (for audit)
  ip_hash TEXT,                                -- Hashed IP address
  user_agent_hash TEXT,                        -- Hashed user agent
  capture_method TEXT DEFAULT 'WEB_FORM' CHECK (capture_method IN (
    'WEB_FORM',            -- Standard web consent form
    'API',                 -- API-based consent
    'IMPORT'               -- Imported from legacy system
  )),

  -- Proof event reference (links to proof_events if logged)
  proof_event_id UUID,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one consent type per buyer
  UNIQUE(buyer_hash, consent_type)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_consent_buyer ON consent_records(buyer_hash);
CREATE INDEX IF NOT EXISTS idx_consent_type ON consent_records(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_granted ON consent_records(granted_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_active ON consent_records(buyer_hash, consent_type)
  WHERE revoked_at IS NULL;

-- =============================================================================
-- CONSENT AUDIT LOG TABLE
-- Tracks all changes to consent records for PDPA compliance
-- =============================================================================

CREATE TABLE IF NOT EXISTS consent_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Reference to consent record
  consent_id UUID NOT NULL REFERENCES consent_records(id),
  buyer_hash TEXT NOT NULL,
  consent_type TEXT NOT NULL,

  -- Action taken
  action TEXT NOT NULL CHECK (action IN (
    'GRANTED',             -- Consent given
    'REVOKED',             -- Consent withdrawn
    'EXPIRED',             -- Consent expired (automated)
    'RENEWED',             -- Consent renewed/extended
    'MIGRATED'             -- Migrated from legacy system
  )),

  -- Context
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  performed_by TEXT DEFAULT 'buyer',           -- 'buyer', 'system', 'admin'
  ip_hash TEXT,
  reason TEXT,                                 -- Reason for action (especially revocation)

  -- Snapshot of consent state at time of action
  state_snapshot JSONB
);

CREATE INDEX IF NOT EXISTS idx_consent_audit_consent ON consent_audit_log(consent_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_buyer ON consent_audit_log(buyer_hash);
CREATE INDEX IF NOT EXISTS idx_consent_audit_action ON consent_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_consent_audit_time ON consent_audit_log(performed_at DESC);

-- =============================================================================
-- VIEWS FOR CONSENT REPORTING
-- =============================================================================

-- Active consents view (excludes revoked)
CREATE OR REPLACE VIEW v_active_consents AS
SELECT
  cr.id,
  cr.buyer_hash,
  cr.consent_type,
  cr.granted_at,
  cr.expires_at,
  cr.consent_version,
  pnv.effective_from AS notice_effective_from,
  cr.capture_method,
  cr.created_at
FROM consent_records cr
JOIN pdpa_notice_versions pnv ON cr.consent_version = pnv.version
WHERE cr.revoked_at IS NULL
  AND (cr.expires_at IS NULL OR cr.expires_at > NOW());

-- Consent status by buyer
CREATE OR REPLACE VIEW v_buyer_consent_status AS
SELECT
  buyer_hash,
  MAX(CASE WHEN consent_type = 'PDPA_BASIC' AND revoked_at IS NULL THEN 1 ELSE 0 END)::BOOLEAN AS has_basic,
  MAX(CASE WHEN consent_type = 'PDPA_MARKETING' AND revoked_at IS NULL THEN 1 ELSE 0 END)::BOOLEAN AS has_marketing,
  MAX(CASE WHEN consent_type = 'PDPA_ANALYTICS' AND revoked_at IS NULL THEN 1 ELSE 0 END)::BOOLEAN AS has_analytics,
  MAX(CASE WHEN consent_type = 'PDPA_THIRD_PARTY' AND revoked_at IS NULL THEN 1 ELSE 0 END)::BOOLEAN AS has_third_party,
  COUNT(*) FILTER (WHERE revoked_at IS NULL) AS active_consent_count,
  MIN(granted_at) AS first_consent_at,
  MAX(granted_at) AS latest_consent_at
FROM consent_records
GROUP BY buyer_hash;

-- Daily consent metrics
CREATE OR REPLACE VIEW v_consent_metrics_daily AS
SELECT
  DATE(granted_at) AS date,
  consent_type,
  COUNT(*) AS grants,
  COUNT(*) FILTER (WHERE revoked_at IS NOT NULL) AS revocations
FROM consent_records
GROUP BY DATE(granted_at), consent_type
ORDER BY date DESC, consent_type;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdpa_notice_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
CREATE POLICY "Service role full access on consent_records"
  ON consent_records FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on consent_audit_log"
  ON consent_audit_log FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on pdpa_notice_versions"
  ON pdpa_notice_versions FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Public can read notice versions (needed for consent form)
CREATE POLICY "Public can read pdpa_notice_versions"
  ON pdpa_notice_versions FOR SELECT
  USING (true);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to get current active PDPA notice version
CREATE OR REPLACE FUNCTION get_current_pdpa_notice()
RETURNS pdpa_notice_versions AS $$
  SELECT * FROM pdpa_notice_versions
  WHERE superseded_at IS NULL
  ORDER BY effective_from DESC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function to check if buyer has required consent
CREATE OR REPLACE FUNCTION has_consent(
  p_buyer_hash TEXT,
  p_consent_type TEXT
) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM consent_records
    WHERE buyer_hash = p_buyer_hash
      AND consent_type = p_consent_type
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
  );
$$ LANGUAGE SQL STABLE;

-- Function to check if buyer can proceed (has PDPA_BASIC)
CREATE OR REPLACE FUNCTION can_proceed(p_buyer_hash TEXT)
RETURNS BOOLEAN AS $$
  SELECT has_consent(p_buyer_hash, 'PDPA_BASIC');
$$ LANGUAGE SQL STABLE;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger to log consent changes to audit log
CREATE OR REPLACE FUNCTION log_consent_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO consent_audit_log (
      consent_id, buyer_hash, consent_type, action, state_snapshot
    ) VALUES (
      NEW.id, NEW.buyer_hash, NEW.consent_type, 'GRANTED',
      jsonb_build_object(
        'consent_version', NEW.consent_version,
        'capture_method', NEW.capture_method,
        'ip_hash', NEW.ip_hash
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL THEN
      INSERT INTO consent_audit_log (
        consent_id, buyer_hash, consent_type, action, state_snapshot
      ) VALUES (
        NEW.id, NEW.buyer_hash, NEW.consent_type, 'REVOKED',
        jsonb_build_object(
          'revoked_at', NEW.revoked_at,
          'original_granted_at', NEW.granted_at
        )
      );
    END IF;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_consent_audit
  BEFORE INSERT OR UPDATE ON consent_records
  FOR EACH ROW EXECUTE FUNCTION log_consent_change();

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Tables created:
--   - pdpa_notice_versions (with v1.0 initial data)
--   - consent_records
--   - consent_audit_log
-- Views created:
--   - v_active_consents
--   - v_buyer_consent_status
--   - v_consent_metrics_daily
-- Functions created:
--   - get_current_pdpa_notice()
--   - has_consent(buyer_hash, consent_type)
--   - can_proceed(buyer_hash)
-- =============================================================================
