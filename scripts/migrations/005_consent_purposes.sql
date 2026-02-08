-- =============================================================================
-- MIGRATION 005: Consent Purposes (C1-C6)
-- SF.2: Consent Purposes Refactor | PRD v3.6.3 CR-010B
-- =============================================================================
-- Adds:
--   1. purposes JSONB column to consent_records
--   2. Backward compatibility: populates purposes from existing consent_type
--   3. Purpose-specific views and functions
--
-- Run Order: After 001_pdpa_consent_tables.sql
-- =============================================================================

-- =============================================================================
-- ADD PURPOSES COLUMN
-- Stores array of C1-C6 purpose codes granted under this consent
-- =============================================================================

ALTER TABLE consent_records
ADD COLUMN IF NOT EXISTS purposes JSONB DEFAULT '[]'::JSONB;

-- Add check constraint for valid purpose codes
ALTER TABLE consent_records
ADD CONSTRAINT chk_valid_purposes CHECK (
  purposes IS NULL OR
  jsonb_typeof(purposes) = 'array'
);

-- Index for purpose-based queries
CREATE INDEX IF NOT EXISTS idx_consent_purposes
  ON consent_records USING GIN (purposes);

-- =============================================================================
-- BACKFILL PURPOSES FROM EXISTING CONSENT_TYPE
-- Maps legacy types to new C1-C6 codes
-- =============================================================================

-- PDPA_BASIC → C1, C2, C3, C4 (all required purposes)
UPDATE consent_records
SET purposes = '["C1_ELIGIBILITY", "C2_DOCUMENT_PROCESSING", "C3_SHARE_AGENT", "C4_DEVELOPER_ANALYTICS"]'::JSONB
WHERE consent_type = 'PDPA_BASIC'
  AND (purposes IS NULL OR purposes = '[]'::JSONB);

-- PDPA_MARKETING → C6 (promotional)
UPDATE consent_records
SET purposes = '["C6_PROMOTIONAL"]'::JSONB
WHERE consent_type = 'PDPA_MARKETING'
  AND (purposes IS NULL OR purposes = '[]'::JSONB);

-- PDPA_ANALYTICS → C4 (absorbed into developer analytics)
UPDATE consent_records
SET purposes = '["C4_DEVELOPER_ANALYTICS"]'::JSONB
WHERE consent_type = 'PDPA_ANALYTICS'
  AND (purposes IS NULL OR purposes = '[]'::JSONB);

-- PDPA_THIRD_PARTY → C3 (share with agent)
UPDATE consent_records
SET purposes = '["C3_SHARE_AGENT"]'::JSONB
WHERE consent_type = 'PDPA_THIRD_PARTY'
  AND (purposes IS NULL OR purposes = '[]'::JSONB);

-- =============================================================================
-- PURPOSE TYPES REFERENCE TABLE
-- Stores metadata about each purpose code
-- =============================================================================

CREATE TABLE IF NOT EXISTS consent_purpose_types (
  purpose_code TEXT PRIMARY KEY,
  display_order INTEGER NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,

  -- Labels (bilingual)
  label_bm TEXT NOT NULL,
  label_en TEXT NOT NULL,

  -- Descriptions (bilingual)
  description_bm TEXT NOT NULL,
  description_en TEXT NOT NULL,

  -- Data categories processed under this purpose
  data_categories JSONB DEFAULT '[]'::JSONB,

  -- Retention period
  retention_years INTEGER NOT NULL DEFAULT 7,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert C1-C6 purpose definitions
INSERT INTO consent_purpose_types (
  purpose_code, display_order, is_required,
  label_bm, label_en,
  description_bm, description_en,
  data_categories, retention_years
) VALUES
  -- C1: Eligibility Assessment (REQUIRED)
  ('C1_ELIGIBILITY', 1, TRUE,
   'Penilaian Kelayakan Pinjaman',
   'Loan Eligibility Assessment',
   'Memproses data pendapatan, pekerjaan, dan kewangan anda untuk mengira kelayakan pinjaman LPPSA.',
   'Process your income, employment, and financial data to calculate LPPSA loan eligibility.',
   '["income", "employment", "financial_commitments", "identification"]'::JSONB, 7),

  -- C2: Document Processing (REQUIRED)
  ('C2_DOCUMENT_PROCESSING', 2, TRUE,
   'Pengesahan Dokumen',
   'Document Verification',
   'Mengesahkan dan memproses dokumen sokongan (slip gaji, penyata bank, salinan IC) untuk permohonan pinjaman.',
   'Verify and process supporting documents (payslips, bank statements, IC copies) for loan application.',
   '["payslips", "bank_statements", "ic_copies", "employment_letters"]'::JSONB, 7),

  -- C3: Share with Agent (REQUIRED)
  ('C3_SHARE_AGENT', 3, TRUE,
   'Kongsi dengan Ejen Dilantik',
   'Share with Appointed Agent',
   'Membenarkan ejen hartanah dilantik anda untuk melihat status kes dan membantu permohonan anda.',
   'Allow your appointed real estate agent to view case status and assist with your application.',
   '["case_status", "readiness_signals", "phase_progress"]'::JSONB, 7),

  -- C4: Developer Analytics (REQUIRED)
  ('C4_DEVELOPER_ANALYTICS', 4, TRUE,
   'Metrik Pipeline Pemaju',
   'Developer Pipeline Metrics',
   'Kongsi metrik pipeline agregat (tanpa identiti) dengan pemaju projek. Tiada maklumat peribadi dikongsi.',
   'Share aggregate (non-identifiable) pipeline metrics with the project developer. No personal details shared.',
   '["aggregate_counts", "phase_distribution", "conversion_metrics"]'::JSONB, 7),

  -- C5: Communication (OPTIONAL)
  ('C5_COMMUNICATION', 5, FALSE,
   'Kemaskini Permohonan',
   'Application Updates',
   'Terima pemberitahuan SMS dan e-mel tentang status permohonan, tarikh akhir, dan tindakan diperlukan.',
   'Receive SMS and email notifications about your application status, deadlines, and required actions.',
   '["phone_number", "email_address"]'::JSONB, 2),

  -- C6: Promotional (OPTIONAL)
  ('C6_PROMOTIONAL', 6, FALSE,
   'Komunikasi Promosi',
   'Promotional Communications',
   'Terima maklumat tentang projek baharu, tawaran istimewa, dan tip gadai janji daripada pemaju dan rakan kongsi.',
   'Receive updates about new projects, special offers, and mortgage tips from developers and partners.',
   '["phone_number", "email_address", "project_interests"]'::JSONB, 2)

ON CONFLICT (purpose_code) DO NOTHING;

-- =============================================================================
-- FUNCTIONS FOR PURPOSE CHECKING
-- =============================================================================

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

-- =============================================================================
-- UPDATED VIEWS
-- =============================================================================

-- View: Buyer consent status with purposes
CREATE OR REPLACE VIEW v_buyer_consent_status AS
SELECT
  buyer_hash,
  MAX(CASE WHEN consent_type = 'PDPA_BASIC' AND revoked_at IS NULL THEN 1 ELSE 0 END)::BOOLEAN AS has_basic,
  MAX(CASE WHEN consent_type = 'PDPA_MARKETING' AND revoked_at IS NULL THEN 1 ELSE 0 END)::BOOLEAN AS has_marketing,
  MAX(CASE WHEN consent_type = 'PDPA_ANALYTICS' AND revoked_at IS NULL THEN 1 ELSE 0 END)::BOOLEAN AS has_analytics,
  MAX(CASE WHEN consent_type = 'PDPA_THIRD_PARTY' AND revoked_at IS NULL THEN 1 ELSE 0 END)::BOOLEAN AS has_third_party,
  COUNT(*) FILTER (WHERE revoked_at IS NULL) AS active_consent_count,
  MIN(granted_at) AS first_consent_at,
  MAX(granted_at) AS latest_consent_at,
  -- SF.2: Purpose flags
  has_all_required_purposes(buyer_hash) AS has_all_required,
  has_purpose(buyer_hash, 'C5_COMMUNICATION') AS has_communication,
  has_purpose(buyer_hash, 'C6_PROMOTIONAL') AS has_promotional,
  get_buyer_purposes(buyer_hash) AS active_purposes
FROM consent_records
GROUP BY buyer_hash;

-- View: Purpose grants per day (for analytics)
CREATE OR REPLACE VIEW v_purpose_grants_daily AS
SELECT
  DATE(granted_at) AS date,
  purpose_elem AS purpose_code,
  COUNT(*) AS grants
FROM consent_records,
     jsonb_array_elements_text(purposes) AS purpose_elem
WHERE revoked_at IS NULL
GROUP BY DATE(granted_at), purpose_elem
ORDER BY date DESC, purpose_code;

-- =============================================================================
-- AUDIT LOG UPDATE
-- Add purpose tracking to consent audit
-- =============================================================================

-- Add purposes column to audit log if not exists
ALTER TABLE consent_audit_log
ADD COLUMN IF NOT EXISTS purposes_snapshot JSONB;

-- Update trigger to capture purposes
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
        'ip_hash', NEW.ip_hash
      ),
      NEW.purposes
    );
  ELSIF TG_OP = 'UPDATE' THEN
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
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE consent_purpose_types ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access on consent_purpose_types"
  ON consent_purpose_types FOR ALL
  USING (auth.role() = 'service_role');

-- Public can read purpose definitions
CREATE POLICY "Public can read consent_purpose_types"
  ON consent_purpose_types FOR SELECT
  USING (true);

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Changes:
--   - Added purposes JSONB column to consent_records
--   - Backfilled existing records with mapped purposes
--   - Created consent_purpose_types reference table
--   - Added has_purpose() and has_all_required_purposes() functions
--   - Updated v_buyer_consent_status view with purpose flags
--   - Added v_purpose_grants_daily analytics view
--   - Updated audit trigger to capture purposes
-- =============================================================================
