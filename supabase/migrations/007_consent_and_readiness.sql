-- ============================================================================
-- Sprint S5: PDPA Consent + Readiness Engine
-- Migration: 007_consent_and_readiness.sql
-- Source: Port from scripts/migrations/001 + 005 with dual-key adaptation
-- ============================================================================
-- Creates:
--   1. pdpa_notice_versions — Versioned PDPA notice text (BM + EN)
--   2. consent_records — Dual-key (buyer_hash + case_id) consent tracking
--   3. consent_audit_log — Immutable audit trail
--   4. consent_purpose_types — C1-C6 purpose reference
--   5. ALTERs mortgage_cases — readiness + declared_phone fields
--   6. Views: v_active_consents, v_buyer_consent_status
--   7. Functions: consent checking + purpose checking
-- ============================================================================

-- ============================================================================
-- 1. PDPA NOTICE VERSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pdpa_notice_versions (
  version TEXT PRIMARY KEY,
  content_bm TEXT NOT NULL,
  content_en TEXT NOT NULL,
  summary_bm TEXT,
  summary_en TEXT,
  effective_from TIMESTAMPTZ NOT NULL,
  superseded_at TIMESTAMPTZ,
  change_reason TEXT,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_pdpa_notice_current
  ON pdpa_notice_versions(effective_from DESC)
  WHERE superseded_at IS NULL;

-- Insert initial PDPA notice version (v1.0)
INSERT INTO pdpa_notice_versions (
  version, content_bm, content_en, summary_bm, summary_en,
  effective_from, change_reason, approved_by
) VALUES (
  '1.0',
  E'NOTIS PERLINDUNGAN DATA PERIBADI\n\nMenurut Akta Perlindungan Data Peribadi 2010 (Pindaan 2024), kami memerlukan persetujuan anda untuk memproses data peribadi anda bagi tujuan penilaian kelayakan pinjaman perumahan.\n\nData yang dikumpul:\n- Maklumat pengenalan (nama, IC)\n- Maklumat kewangan (pendapatan, komitmen)\n- Maklumat pekerjaan\n- Maklumat hartanah\n\nTujuan pemprosesan:\n- Penilaian kelayakan pinjaman LPPSA\n- Penyediaan dokumen permohonan\n- Komunikasi berkaitan permohonan\n\nHak anda:\n- Akses kepada data anda\n- Pembetulan data yang tidak tepat\n- Menarik balik persetujuan (dengan notis)\n\nData anda akan disimpan selama 7 tahun selepas tamat urusan atau seperti yang dikehendaki oleh undang-undang.',
  E'PERSONAL DATA PROTECTION NOTICE\n\nUnder the Personal Data Protection Act 2010 (Amendment 2024), we require your consent to process your personal data for housing loan eligibility assessment purposes.\n\nData collected:\n- Identification information (name, IC)\n- Financial information (income, commitments)\n- Employment information\n- Property information\n\nProcessing purposes:\n- LPPSA loan eligibility assessment\n- Application document preparation\n- Application-related communications\n\nYour rights:\n- Access to your data\n- Correction of inaccurate data\n- Withdrawal of consent (with notice)\n\nYour data will be retained for 7 years after completion of the matter or as required by law.',
  'Saya membenarkan pemprosesan data peribadi saya untuk penilaian kelayakan pinjaman perumahan.',
  'I consent to the processing of my personal data for housing loan eligibility assessment.',
  NOW(),
  'Initial PDPA notice version for PRD v3.6.3 S5 launch',
  'system'
) ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- 2. CONSENT RECORDS TABLE (Dual-Key: buyer_hash + case_id)
-- ============================================================================
-- Key design: buyer_hash is set at consent time (before case exists).
-- case_id is nullable and backfilled when POST /api/cases creates the case.
-- This solves the chicken-and-egg: PDPA requires consent before data collection,
-- but case_id only exists after case creation.
-- ============================================================================
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Dual-key identification
  buyer_hash TEXT NOT NULL,
  case_id UUID REFERENCES mortgage_cases(id) ON DELETE SET NULL,

  -- Consent type (S5: added LPPSA_SUBMISSION)
  consent_type TEXT NOT NULL CHECK (consent_type IN (
    'PDPA_BASIC',
    'PDPA_MARKETING',
    'PDPA_ANALYTICS',
    'PDPA_THIRD_PARTY',
    'LPPSA_SUBMISSION'
  )),

  -- Purposes (C1-C6 codes from Sprint 0 migration 005)
  purposes JSONB DEFAULT '[]'::JSONB,

  -- Consent lifecycle
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  retention_period INTERVAL,

  -- Version tracking
  consent_version TEXT NOT NULL REFERENCES pdpa_notice_versions(version),

  -- Capture context
  ip_hash TEXT,
  user_agent_hash TEXT,
  capture_method TEXT DEFAULT 'WEB_FORM' CHECK (capture_method IN (
    'WEB_FORM', 'API', 'IMPORT'
  )),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One active consent type per buyer (keyed on buyer_hash)
  UNIQUE(buyer_hash, consent_type)
);

-- Check constraint for valid purpose codes
ALTER TABLE consent_records
ADD CONSTRAINT chk_valid_purposes CHECK (
  purposes IS NULL OR jsonb_typeof(purposes) = 'array'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consent_buyer ON consent_records(buyer_hash);
CREATE INDEX IF NOT EXISTS idx_consent_case ON consent_records(case_id) WHERE case_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consent_type ON consent_records(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_active ON consent_records(buyer_hash, consent_type)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_consent_purposes ON consent_records USING GIN (purposes);

-- ============================================================================
-- 3. CONSENT AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS consent_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consent_id UUID NOT NULL REFERENCES consent_records(id),
  buyer_hash TEXT NOT NULL,
  consent_type TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'GRANTED', 'REVOKED', 'EXPIRED', 'RENEWED', 'MIGRATED', 'CASE_LINKED'
  )),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  performed_by TEXT DEFAULT 'buyer',
  ip_hash TEXT,
  reason TEXT,
  state_snapshot JSONB,
  purposes_snapshot JSONB
);

CREATE INDEX IF NOT EXISTS idx_consent_audit_consent ON consent_audit_log(consent_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_buyer ON consent_audit_log(buyer_hash);
CREATE INDEX IF NOT EXISTS idx_consent_audit_action ON consent_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_consent_audit_time ON consent_audit_log(performed_at DESC);

-- ============================================================================
-- 4. CONSENT PURPOSE TYPES (C1-C6 Reference Table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS consent_purpose_types (
  purpose_code TEXT PRIMARY KEY,
  display_order INTEGER NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  label_bm TEXT NOT NULL,
  label_en TEXT NOT NULL,
  description_bm TEXT NOT NULL,
  description_en TEXT NOT NULL,
  data_categories JSONB DEFAULT '[]'::JSONB,
  retention_years INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO consent_purpose_types (
  purpose_code, display_order, is_required,
  label_bm, label_en, description_bm, description_en,
  data_categories, retention_years
) VALUES
  ('C1_ELIGIBILITY', 1, TRUE,
   'Penilaian Kelayakan Pinjaman', 'Loan Eligibility Assessment',
   'Memproses data pendapatan, pekerjaan, dan kewangan anda untuk mengira kelayakan pinjaman LPPSA.',
   'Process your income, employment, and financial data to calculate LPPSA loan eligibility.',
   '["income", "employment", "financial_commitments", "identification"]'::JSONB, 7),
  ('C2_DOCUMENT_PROCESSING', 2, TRUE,
   'Pengesahan Dokumen', 'Document Verification',
   'Mengesahkan dan memproses dokumen sokongan (slip gaji, penyata bank, salinan IC) untuk permohonan pinjaman.',
   'Verify and process supporting documents (payslips, bank statements, IC copies) for loan application.',
   '["payslips", "bank_statements", "ic_copies", "employment_letters"]'::JSONB, 7),
  ('C3_SHARE_AGENT', 3, TRUE,
   'Kongsi dengan Ejen Dilantik', 'Share with Appointed Agent',
   'Membenarkan ejen hartanah dilantik anda untuk melihat status kes dan membantu permohonan anda.',
   'Allow your appointed real estate agent to view case status and assist with your application.',
   '["case_status", "readiness_signals", "phase_progress"]'::JSONB, 7),
  ('C4_DEVELOPER_ANALYTICS', 4, TRUE,
   'Metrik Pipeline Pemaju', 'Developer Pipeline Metrics',
   'Kongsi metrik pipeline agregat (tanpa identiti) dengan pemaju projek. Tiada maklumat peribadi dikongsi.',
   'Share aggregate (non-identifiable) pipeline metrics with the project developer. No personal details shared.',
   '["aggregate_counts", "phase_distribution", "conversion_metrics"]'::JSONB, 7),
  ('C5_COMMUNICATION', 5, FALSE,
   'Kemaskini Permohonan', 'Application Updates',
   'Terima pemberitahuan SMS dan e-mel tentang status permohonan, tarikh akhir, dan tindakan diperlukan.',
   'Receive SMS and email notifications about your application status, deadlines, and required actions.',
   '["phone_number", "email_address"]'::JSONB, 2),
  ('C6_PROMOTIONAL', 6, FALSE,
   'Komunikasi Promosi', 'Promotional Communications',
   'Terima maklumat tentang projek baharu, tawaran istimewa, dan tip gadai janji daripada pemaju dan rakan kongsi.',
   'Receive updates about new projects, special offers, and mortgage tips from developers and partners.',
   '["phone_number", "email_address", "project_interests"]'::JSONB, 2)
ON CONFLICT (purpose_code) DO NOTHING;

-- ============================================================================
-- 5. ALTER MORTGAGE_CASES — Readiness + Phone Fields
-- ============================================================================
ALTER TABLE mortgage_cases ADD COLUMN IF NOT EXISTS declared_phone TEXT;
ALTER TABLE mortgage_cases ADD COLUMN IF NOT EXISTS readiness_score INTEGER;
ALTER TABLE mortgage_cases ADD COLUMN IF NOT EXISTS readiness_band TEXT;
ALTER TABLE mortgage_cases ADD COLUMN IF NOT EXISTS dsr_ratio DECIMAL(5,2);
ALTER TABLE mortgage_cases ADD COLUMN IF NOT EXISTS pre_kj_passed BOOLEAN DEFAULT FALSE;
ALTER TABLE mortgage_cases ADD COLUMN IF NOT EXISTS pre_kj_checklist JSONB;
ALTER TABLE mortgage_cases ADD COLUMN IF NOT EXISTS readiness_computed_at TIMESTAMPTZ;
ALTER TABLE mortgage_cases ADD COLUMN IF NOT EXISTS buyer_hash TEXT;

-- Index for buyer_hash lookups (consent linkage)
CREATE INDEX IF NOT EXISTS idx_cases_buyer_hash ON mortgage_cases(buyer_hash) WHERE buyer_hash IS NOT NULL;

-- ============================================================================
-- 6. VIEWS
-- ============================================================================

-- Active consents (excludes revoked/expired)
CREATE OR REPLACE VIEW v_active_consents AS
SELECT
  cr.id,
  cr.buyer_hash,
  cr.case_id,
  cr.consent_type,
  cr.purposes,
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

-- Buyer consent status (aggregated)
CREATE OR REPLACE VIEW v_buyer_consent_status AS
SELECT
  buyer_hash,
  MAX(CASE WHEN consent_type = 'PDPA_BASIC' AND revoked_at IS NULL THEN 1 ELSE 0 END)::BOOLEAN AS has_basic,
  MAX(CASE WHEN consent_type = 'PDPA_MARKETING' AND revoked_at IS NULL THEN 1 ELSE 0 END)::BOOLEAN AS has_marketing,
  MAX(CASE WHEN consent_type = 'PDPA_ANALYTICS' AND revoked_at IS NULL THEN 1 ELSE 0 END)::BOOLEAN AS has_analytics,
  MAX(CASE WHEN consent_type = 'PDPA_THIRD_PARTY' AND revoked_at IS NULL THEN 1 ELSE 0 END)::BOOLEAN AS has_third_party,
  MAX(CASE WHEN consent_type = 'LPPSA_SUBMISSION' AND revoked_at IS NULL THEN 1 ELSE 0 END)::BOOLEAN AS has_lppsa_submission,
  COUNT(*) FILTER (WHERE revoked_at IS NULL) AS active_consent_count,
  MIN(granted_at) AS first_consent_at,
  MAX(granted_at) AS latest_consent_at
FROM consent_records
GROUP BY buyer_hash;

-- ============================================================================
-- 7. FUNCTIONS
-- ============================================================================

-- Get current active PDPA notice version
CREATE OR REPLACE FUNCTION get_current_pdpa_notice()
RETURNS pdpa_notice_versions AS $$
  SELECT * FROM pdpa_notice_versions
  WHERE superseded_at IS NULL
  ORDER BY effective_from DESC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Check if buyer has required consent
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

-- Check if buyer can proceed (has PDPA_BASIC)
CREATE OR REPLACE FUNCTION can_proceed(p_buyer_hash TEXT)
RETURNS BOOLEAN AS $$
  SELECT has_consent(p_buyer_hash, 'PDPA_BASIC');
$$ LANGUAGE SQL STABLE;

-- Check if buyer has granted a specific purpose
CREATE OR REPLACE FUNCTION has_purpose(
  p_buyer_hash TEXT,
  p_purpose TEXT
) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM consent_records
    WHERE buyer_hash = p_buyer_hash
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
      AND purposes ? p_purpose
  );
$$ LANGUAGE SQL STABLE;

-- Check if buyer has all required purposes (C1-C4)
CREATE OR REPLACE FUNCTION has_all_required_purposes(p_buyer_hash TEXT)
RETURNS BOOLEAN AS $$
  SELECT
    has_purpose(p_buyer_hash, 'C1_ELIGIBILITY') AND
    has_purpose(p_buyer_hash, 'C2_DOCUMENT_PROCESSING') AND
    has_purpose(p_buyer_hash, 'C3_SHARE_AGENT') AND
    has_purpose(p_buyer_hash, 'C4_DEVELOPER_ANALYTICS');
$$ LANGUAGE SQL STABLE;

-- Get all purposes for a buyer
CREATE OR REPLACE FUNCTION get_buyer_purposes(p_buyer_hash TEXT)
RETURNS JSONB AS $$
  SELECT COALESCE(
    jsonb_agg(DISTINCT purpose_elem),
    '[]'::JSONB
  )
  FROM consent_records,
       jsonb_array_elements_text(purposes) AS purpose_elem
  WHERE buyer_hash = p_buyer_hash
    AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW());
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================

-- Audit trigger: logs consent changes
CREATE OR REPLACE FUNCTION log_consent_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO consent_audit_log (
      consent_id, buyer_hash, consent_type, action, state_snapshot, purposes_snapshot
    ) VALUES (
      NEW.id, NEW.buyer_hash, NEW.consent_type, 'GRANTED',
      jsonb_build_object(
        'consent_version', NEW.consent_version,
        'capture_method', NEW.capture_method,
        'case_id', NEW.case_id,
        'ip_hash', NEW.ip_hash
      ),
      NEW.purposes
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Revocation
    IF OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL THEN
      INSERT INTO consent_audit_log (
        consent_id, buyer_hash, consent_type, action, state_snapshot, purposes_snapshot
      ) VALUES (
        NEW.id, NEW.buyer_hash, NEW.consent_type, 'REVOKED',
        jsonb_build_object(
          'revoked_at', NEW.revoked_at,
          'original_granted_at', NEW.granted_at
        ),
        NEW.purposes
      );
    END IF;
    -- Case linkage (backfill)
    IF OLD.case_id IS NULL AND NEW.case_id IS NOT NULL THEN
      INSERT INTO consent_audit_log (
        consent_id, buyer_hash, consent_type, action, state_snapshot
      ) VALUES (
        NEW.id, NEW.buyer_hash, NEW.consent_type, 'CASE_LINKED',
        jsonb_build_object(
          'case_id', NEW.case_id,
          'linked_at', NOW()
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

-- ============================================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdpa_notice_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_purpose_types ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access on consent_records"
  ON consent_records FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on consent_audit_log"
  ON consent_audit_log FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on pdpa_notice_versions"
  ON pdpa_notice_versions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on consent_purpose_types"
  ON consent_purpose_types FOR ALL USING (auth.role() = 'service_role');

-- Public can read notice versions (needed for consent form)
CREATE POLICY "Public can read pdpa_notice_versions"
  ON pdpa_notice_versions FOR SELECT USING (true);

-- Public can read purpose definitions (needed for consent form)
CREATE POLICY "Public can read consent_purpose_types"
  ON consent_purpose_types FOR SELECT USING (true);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Tables: pdpa_notice_versions, consent_records (dual-key), consent_audit_log,
--         consent_purpose_types
-- ALTERs: mortgage_cases (+readiness fields, +buyer_hash, +declared_phone)
-- Views: v_active_consents, v_buyer_consent_status
-- Functions: get_current_pdpa_notice(), has_consent(), can_proceed(),
--            has_purpose(), has_all_required_purposes(), get_buyer_purposes()
-- Trigger: tr_consent_audit (GRANTED, REVOKED, CASE_LINKED)
-- ============================================================================
