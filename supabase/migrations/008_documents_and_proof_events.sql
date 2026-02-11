-- ============================================================================
-- Sprint S5 Day 3: Documents + Proof Events
-- Migration: 008_documents_and_proof_events.sql
-- Creates:
--   1. case_documents — Buyer document uploads (IC, payslip, bank, KWSP)
--   2. proof_events — Immutable audit trail of every buyer/agent action
--   3. Supabase Storage bucket for document files
--   4. Views + helper functions
-- ============================================================================

-- ============================================================================
-- 1. CASE DOCUMENTS TABLE
-- Dual-key like consent_records: buyer_hash always set, case_id backfilled
-- ============================================================================
CREATE TABLE IF NOT EXISTS case_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Dual-key: buyer_hash set at upload, case_id linked when case created
  buyer_hash TEXT NOT NULL,
  case_id UUID REFERENCES mortgage_cases(id),

  -- Document metadata
  document_type TEXT NOT NULL CHECK (document_type IN (
    'IC', 'PAYSLIP', 'BANK_STATEMENT', 'KWSP'
  )),
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,          -- bytes
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,          -- Supabase Storage path

  -- Status workflow
  status TEXT DEFAULT 'UPLOADED' CHECK (status IN (
    'UPLOADING',     -- Upload in progress
    'UPLOADED',      -- Successfully stored
    'PROCESSING',    -- OCR/extraction running
    'VERIFIED',      -- Agent verified
    'REJECTED',      -- Agent rejected (re-upload needed)
    'FAILED'         -- Upload failed
  )),

  -- Extraction results (populated by OCR pipeline, S7+)
  extracted_data JSONB,
  extraction_confidence DECIMAL(3,2),

  -- Audit
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verified_by UUID,                    -- Agent who verified
  rejected_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_case_docs_buyer
  ON case_documents(buyer_hash, document_type);

CREATE INDEX IF NOT EXISTS idx_case_docs_case
  ON case_documents(case_id)
  WHERE case_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_case_docs_status
  ON case_documents(status, uploaded_at DESC);

-- ============================================================================
-- 2. PROOF EVENTS TABLE
-- Immutable audit log — every significant buyer/agent action
-- Replaces Sprint 0's telemetry_events (never created in production)
-- ============================================================================
CREATE TABLE IF NOT EXISTS proof_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Event identification
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL DEFAULT 'BUYER' CHECK (event_category IN (
    'BUYER',         -- Buyer-initiated action
    'AGENT',         -- Agent-initiated action
    'SYSTEM',        -- System-generated event
    'CONSENT'        -- Consent lifecycle event
  )),

  -- Context keys (dual-key like everything else)
  buyer_hash TEXT,
  case_id UUID REFERENCES mortgage_cases(id),

  -- Actor
  actor_type TEXT NOT NULL DEFAULT 'buyer' CHECK (actor_type IN (
    'buyer', 'agent', 'system'
  )),
  actor_id TEXT,                       -- agent UUID or 'system'

  -- Event payload
  metadata JSONB DEFAULT '{}',

  -- Client context
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,

  -- Timestamp (immutable — no updated_at by design)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for proof event queries
CREATE INDEX IF NOT EXISTS idx_proof_events_buyer
  ON proof_events(buyer_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proof_events_case
  ON proof_events(case_id, created_at DESC)
  WHERE case_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_proof_events_type
  ON proof_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proof_events_category
  ON proof_events(event_category, created_at DESC);

-- ============================================================================
-- 3. SUPABASE STORAGE BUCKET
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'case-documents',
  'case-documents',
  false,                               -- Private bucket
  20971520,                            -- 20MB max file size
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. RLS POLICIES
-- ============================================================================

-- 4a. case_documents RLS
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY service_role_case_docs
  ON case_documents FOR ALL
  USING (auth.role() = 'service_role');

-- Buyer can view own docs via buyer_hash (future: when auth is wired)
-- For now, all access goes through API routes with service role key

-- 4b. proof_events RLS
ALTER TABLE proof_events ENABLE ROW LEVEL SECURITY;

-- Service role full access (only API routes write proof events)
CREATE POLICY service_role_proof_events
  ON proof_events FOR ALL
  USING (auth.role() = 'service_role');

-- Read-only for authenticated users (agent panel reads proof events)
CREATE POLICY proof_events_agent_read
  ON proof_events FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- 5. STORAGE POLICIES
-- ============================================================================

-- Allow service role to upload to case-documents bucket
CREATE POLICY storage_case_docs_insert
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'case-documents'
    AND auth.role() = 'service_role'
  );

-- Allow service role to read from case-documents bucket
CREATE POLICY storage_case_docs_select
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'case-documents'
    AND auth.role() = 'service_role'
  );

-- ============================================================================
-- 6. VIEWS
-- ============================================================================

-- View: Document completeness per buyer
CREATE OR REPLACE VIEW v_buyer_document_status AS
SELECT
  buyer_hash,
  case_id,
  COUNT(*) FILTER (WHERE status IN ('UPLOADED', 'VERIFIED')) AS docs_uploaded,
  COUNT(*) FILTER (WHERE document_type = 'IC' AND status IN ('UPLOADED', 'VERIFIED')) > 0 AS has_ic,
  COUNT(*) FILTER (WHERE document_type = 'PAYSLIP' AND status IN ('UPLOADED', 'VERIFIED')) > 0 AS has_payslip,
  COUNT(*) FILTER (WHERE document_type = 'BANK_STATEMENT' AND status IN ('UPLOADED', 'VERIFIED')) > 0 AS has_bank_statement,
  COUNT(*) FILTER (WHERE document_type = 'KWSP' AND status IN ('UPLOADED', 'VERIFIED')) > 0 AS has_kwsp,
  -- All 3 required docs present
  (
    COUNT(*) FILTER (WHERE document_type = 'IC' AND status IN ('UPLOADED', 'VERIFIED')) > 0
    AND COUNT(*) FILTER (WHERE document_type = 'PAYSLIP' AND status IN ('UPLOADED', 'VERIFIED')) > 0
    AND COUNT(*) FILTER (WHERE document_type = 'BANK_STATEMENT' AND status IN ('UPLOADED', 'VERIFIED')) > 0
  ) AS all_required_uploaded,
  MAX(uploaded_at) AS last_upload_at
FROM case_documents
GROUP BY buyer_hash, case_id;

-- View: Proof event timeline per case
CREATE OR REPLACE VIEW v_case_proof_timeline AS
SELECT
  COALESCE(case_id::TEXT, buyer_hash) AS case_key,
  buyer_hash,
  case_id,
  event_type,
  event_category,
  actor_type,
  metadata,
  created_at
FROM proof_events
ORDER BY created_at ASC;

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function: Check if buyer has all required documents
CREATE OR REPLACE FUNCTION has_all_required_docs(p_buyer_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM v_buyer_document_status
    WHERE buyer_hash = p_buyer_hash
      AND all_required_uploaded = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log a proof event (callable from API routes)
CREATE OR REPLACE FUNCTION log_proof_event(
  p_event_type TEXT,
  p_buyer_hash TEXT DEFAULT NULL,
  p_case_id UUID DEFAULT NULL,
  p_actor_type TEXT DEFAULT 'buyer',
  p_actor_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_event_category TEXT DEFAULT 'BUYER'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO proof_events (
    event_type, event_category, buyer_hash, case_id,
    actor_type, actor_id, metadata,
    ip_address, user_agent, session_id
  ) VALUES (
    p_event_type, p_event_category, p_buyer_hash, p_case_id,
    p_actor_type, p_actor_id, p_metadata,
    p_ip_address, p_user_agent, p_session_id
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. TRIGGER: Auto-update case_documents.updated_at
-- ============================================================================
CREATE TRIGGER set_case_docs_updated_at
  BEFORE UPDATE ON case_documents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================================
-- 9. BACKFILL: Link existing uploads to cases (same pattern as consent_records)
-- When a case is created and buyer_hash matches, link documents to case
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_link_docs_to_case()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new case is created with a buyer_hash, link orphan documents
  IF NEW.buyer_hash IS NOT NULL THEN
    UPDATE case_documents
    SET case_id = NEW.id
    WHERE buyer_hash = NEW.buyer_hash
      AND case_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_link_docs_on_case_insert
  AFTER INSERT ON mortgage_cases
  FOR EACH ROW
  EXECUTE FUNCTION trigger_link_docs_to_case();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE case_documents IS 'S5: Buyer document uploads with dual-key (buyer_hash + case_id)';
COMMENT ON TABLE proof_events IS 'S5: Immutable proof event log for audit trail';
COMMENT ON FUNCTION log_proof_event IS 'S5: Convenience function to insert proof events';
COMMENT ON FUNCTION has_all_required_docs IS 'S5: Check document completeness for a buyer';
