-- ============================================================================
-- S5 A36: Seed Demo Data
-- Seeds one complete test case (Nur Adilah) for pilot demo
--
-- This script populates:
--   1. mortgage_cases — one case with form_data including gred_jawatan: DG9
--   2. case_documents — 3 required docs + 1 employer confirmation with
--      extracted_data showing gred_jawatan: DG41 (deliberate mismatch)
--   3. consent_records — PDPA_BASIC + LPPSA_SUBMISSION consents
--   4. proof_events — full lifecycle trace
--
-- The gred mismatch (DG9 vs DG41) demonstrates the cross-validator
-- flagging capability in the Agent Readiness Panel (R03).
--
-- Prerequisites: migrations 001-009 applied, developer seed from 002
-- ============================================================================

DO $$
DECLARE
  v_buyer_hash TEXT := 'demo_nur_adilah_abc123';
  v_developer_id UUID := 'a1000000-0000-0000-0000-000000000001'; -- From migration 002
  v_property_id UUID := 'b1000000-0000-0000-0000-000000000001'; -- From migration 002
  v_case_id UUID;
  v_consent_id UUID;
  v_doc_ic_id UUID;
  v_doc_payslip_id UUID;
  v_doc_bank_id UUID;
  v_doc_employer_id UUID;
BEGIN

-- ============================================================================
-- 1. MORTGAGE CASE
-- Uses actual schema from migration 002 + ALTERs from 007 + 009
-- ============================================================================
INSERT INTO mortgage_cases (
  case_ref, developer_id, property_id,
  buyer_name, buyer_phone, buyer_ic,
  property_price, income_declared,
  status, buyer_hash,
  readiness_score, readiness_band, dsr_ratio, readiness_computed_at,
  form_data,
  pre_kj_passed,
  created_at, updated_at
) VALUES (
  'QTK-2026-DEMO1',
  v_developer_id,
  v_property_id,
  'Nur Adilah binti Mohd Razif',
  '0171234567',
  '890501-14-5678',
  420000,
  5500,
  'documents_received', -- Valid status per CHECK constraint
  v_buyer_hash,
  72,
  'ready',
  35,
  NOW(),
  jsonb_build_object(
    'gred_jawatan', 'DG9',
    'employer_name', 'Kementerian Pendidikan Malaysia',
    'ic_number', '890501-14-5678',
    'buyer_name', 'Nur Adilah binti Mohd Razif',
    'employment_type', 'tetap',
    'service_years', '5+',
    'age_range', '35-49',
    'income_range', '5001-6000',
    'commitment_range', '31-40'
  ),
  false,
  NOW() - INTERVAL '3 days',
  NOW()
)
ON CONFLICT (case_ref) DO NOTHING
RETURNING id INTO v_case_id;

-- If case already exists, get its ID
IF v_case_id IS NULL THEN
  SELECT id INTO v_case_id FROM mortgage_cases WHERE case_ref = 'QTK-2026-DEMO1';
  RAISE NOTICE 'Case already exists: %', v_case_id;
END IF;

RAISE NOTICE 'Case ID: %', v_case_id;

-- ============================================================================
-- 2. CONSENT RECORDS
-- ============================================================================

-- PDPA Basic consent (granted at prescan)
INSERT INTO consent_records (
  buyer_hash, case_id, consent_type, purposes,
  consent_version, capture_method, ip_hash, user_agent_hash,
  granted_at
) VALUES (
  v_buyer_hash, v_case_id, 'PDPA_BASIC',
  '["C1_ELIGIBILITY", "C2_DOCUMENT_PROCESSING", "C3_SHARE_AGENT", "C4_DEVELOPER_ANALYTICS"]'::JSONB,
  '1.0', 'WEB_FORM', 'hash_demo_ip', 'hash_demo_ua',
  NOW() - INTERVAL '3 days'
)
ON CONFLICT (buyer_hash, consent_type) DO NOTHING
RETURNING id INTO v_consent_id;

-- LPPSA Submission consent (granted at temujanji)
INSERT INTO consent_records (
  buyer_hash, case_id, consent_type, purposes,
  consent_version, capture_method,
  granted_at
) VALUES (
  v_buyer_hash, v_case_id, 'LPPSA_SUBMISSION',
  '["C5_COMMUNICATION"]'::JSONB,
  '1.0', 'WEB_FORM',
  NOW() - INTERVAL '1 day'
)
ON CONFLICT (buyer_hash, consent_type) DO NOTHING;

-- ============================================================================
-- 3. CASE DOCUMENTS (with extracted_data for cross-validation)
-- ============================================================================

-- IC document (extracted fields match form data)
INSERT INTO case_documents (
  buyer_hash, case_id, document_type,
  file_name, file_size, mime_type, storage_path,
  status, extracted_data, extraction_confidence,
  uploaded_at
) VALUES (
  v_buyer_hash, v_case_id, 'IC',
  'ic_nur_adilah.pdf', 245000, 'application/pdf',
  v_buyer_hash || '/IC/ic_nur_adilah.pdf',
  'VERIFIED',
  jsonb_build_object(
    'ic_number', '890501-14-5678',
    'full_name', 'NUR ADILAH BINTI MOHD RAZIF',
    'date_of_birth', '1989-05-01',
    'address', 'No 23, Jalan Harmoni 3, Presint 16, 62150 Putrajaya'
  ),
  0.95,
  NOW() - INTERVAL '2 days'
)
RETURNING id INTO v_doc_ic_id;

-- Payslip (basic_salary matches declared income)
INSERT INTO case_documents (
  buyer_hash, case_id, document_type,
  file_name, file_size, mime_type, storage_path,
  status, extracted_data, extraction_confidence,
  uploaded_at
) VALUES (
  v_buyer_hash, v_case_id, 'PAYSLIP',
  'payslip_jan2026.pdf', 189000, 'application/pdf',
  v_buyer_hash || '/PAYSLIP/payslip_jan2026.pdf',
  'UPLOADED',
  jsonb_build_object(
    'basic_salary', 5500,
    'allowances', 800,
    'deductions', 1200,
    'net_salary', 5100,
    'pay_period', '2026-01'
  ),
  0.92,
  NOW() - INTERVAL '2 days'
)
RETURNING id INTO v_doc_payslip_id;

-- Bank statement
INSERT INTO case_documents (
  buyer_hash, case_id, document_type,
  file_name, file_size, mime_type, storage_path,
  status,
  uploaded_at
) VALUES (
  v_buyer_hash, v_case_id, 'BANK_STATEMENT',
  'bank_statement_dec2025.pdf', 312000, 'application/pdf',
  v_buyer_hash || '/BANK_STATEMENT/bank_statement_dec2025.pdf',
  'UPLOADED',
  NOW() - INTERVAL '2 days'
)
RETURNING id INTO v_doc_bank_id;

-- ============================================================================
-- EMPLOYER CONFIRMATION (as KWSP doc type) — DELIBERATE GRED MISMATCH
-- Form says DG9, employer letter says DG41.
-- Stored as KWSP because case_documents CHECK constraint allows
-- IC/PAYSLIP/BANK_STATEMENT/KWSP only.
-- The doc_subtype in extracted_data flags this as employer_confirmation.
-- ============================================================================
INSERT INTO case_documents (
  buyer_hash, case_id, document_type,
  file_name, file_size, mime_type, storage_path,
  status, extracted_data, extraction_confidence,
  uploaded_at
) VALUES (
  v_buyer_hash, v_case_id, 'KWSP',
  'surat_pengesahan_majikan.pdf', 156000, 'application/pdf',
  v_buyer_hash || '/KWSP/surat_pengesahan_majikan.pdf',
  'UPLOADED',
  jsonb_build_object(
    'gred_jawatan', 'DG41',
    'employer_name', 'Kementerian Pendidikan Malaysia',
    'position', 'Pegawai Perkhidmatan Pendidikan',
    'confirmation_date', '2026-01-15',
    'doc_subtype', 'employer_confirmation'
  ),
  0.88,
  NOW() - INTERVAL '2 days'
)
RETURNING id INTO v_doc_employer_id;

-- ============================================================================
-- 4. PROOF EVENTS (lifecycle trace)
-- ============================================================================

INSERT INTO proof_events (event_type, event_category, buyer_hash, case_id, actor_type, metadata, created_at)
VALUES ('PRESCAN_COMPLETED', 'BUYER', v_buyer_hash, v_case_id, 'buyer',
  jsonb_build_object('readiness_band', 'ready'), NOW() - INTERVAL '3 days');

INSERT INTO proof_events (event_type, event_category, buyer_hash, case_id, actor_type, metadata, created_at)
VALUES ('CASE_CREATED', 'SYSTEM', v_buyer_hash, v_case_id, 'system',
  jsonb_build_object('case_id', v_case_id), NOW() - INTERVAL '3 days');

INSERT INTO proof_events (event_type, event_category, buyer_hash, case_id, actor_type, metadata, created_at)
VALUES ('DOC_UPLOADED', 'BUYER', v_buyer_hash, v_case_id, 'buyer',
  jsonb_build_object('document_type', 'IC', 'doc_id', v_doc_ic_id), NOW() - INTERVAL '2 days');

INSERT INTO proof_events (event_type, event_category, buyer_hash, case_id, actor_type, metadata, created_at)
VALUES ('DOC_UPLOADED', 'BUYER', v_buyer_hash, v_case_id, 'buyer',
  jsonb_build_object('document_type', 'PAYSLIP', 'doc_id', v_doc_payslip_id), NOW() - INTERVAL '2 days');

INSERT INTO proof_events (event_type, event_category, buyer_hash, case_id, actor_type, metadata, created_at)
VALUES ('DOC_UPLOADED', 'BUYER', v_buyer_hash, v_case_id, 'buyer',
  jsonb_build_object('document_type', 'BANK_STATEMENT', 'doc_id', v_doc_bank_id), NOW() - INTERVAL '2 days');

INSERT INTO proof_events (event_type, event_category, buyer_hash, case_id, actor_type, metadata, created_at)
VALUES ('ALL_REQUIRED_DOCS_UPLOADED', 'BUYER', v_buyer_hash, v_case_id, 'buyer',
  '{}'::JSONB, NOW() - INTERVAL '2 days');

INSERT INTO proof_events (event_type, event_category, buyer_hash, case_id, actor_type, metadata, created_at)
VALUES ('LPPSA_SUBMISSION_CONSENT_GRANTED', 'CONSENT', v_buyer_hash, v_case_id, 'buyer',
  jsonb_build_object('purpose', 'C5_COMMUNICATION'), NOW() - INTERVAL '1 day');

INSERT INTO proof_events (event_type, event_category, buyer_hash, case_id, actor_type, metadata, created_at)
VALUES ('TEMUJANJI_BOOKED', 'BUYER', v_buyer_hash, v_case_id, 'buyer',
  jsonb_build_object('slot', '2026-02-15 10:00', 'method', 'in_person'), NOW() - INTERVAL '1 day');

INSERT INTO proof_events (event_type, event_category, buyer_hash, case_id, actor_type, metadata, created_at)
VALUES ('TAC_SESSION_BOOKED', 'BUYER', v_buyer_hash, v_case_id, 'buyer',
  jsonb_build_object('booked_via', 'temujanji_flow'), NOW() - INTERVAL '1 day');

RAISE NOTICE 'Seed complete: case=%, buyer_hash=%', v_case_id, v_buyer_hash;
RAISE NOTICE 'Cross-validation should flag gred mismatch: form=DG9, doc=DG41';

END $$;
