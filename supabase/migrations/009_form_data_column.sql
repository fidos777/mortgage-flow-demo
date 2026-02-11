-- ============================================================================
-- Sprint S5 Day 5: Add form_data JSONB to mortgage_cases
-- Migration: 009_form_data_column.sql
--
-- Stores buyer-declared form fields as JSONB for cross-validation.
-- Fields like gred_jawatan, employer_name live here because they don't
-- have dedicated columns in the original schema.
--
-- The cross-validate API reads this column to compare against
-- case_documents.extracted_data for mismatch detection.
-- ============================================================================

ALTER TABLE mortgage_cases ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}'::JSONB;

-- Index for JSONB field queries
CREATE INDEX IF NOT EXISTS idx_cases_form_data ON mortgage_cases USING GIN (form_data)
  WHERE form_data IS NOT NULL AND form_data != '{}'::JSONB;

COMMENT ON COLUMN mortgage_cases.form_data IS 'S5: Buyer-declared form fields (gred, employer, etc) for cross-validation';
