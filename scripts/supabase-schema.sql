-- P3-1: Telemetry + Event Capture (MVP)
-- P3-2: Lead/Case Tables (Comprehensive)
-- Supabase Schema for Qontrek Mortgage Flow Engine
-- Run this in Supabase SQL Editor to set up pilot data collection
-- Version: 2.0 | Updated: Feb 2, 2026

-- =============================================================================
-- TELEMETRY EVENTS TABLE
-- Append-only log of funnel events (no PII)
-- =============================================================================

CREATE TABLE IF NOT EXISTS telemetry_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Context (anonymized)
  case_id TEXT,
  project_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'agent', 'developer', 'system')),

  -- Safe metadata (JSONB for flexibility)
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_telemetry_event_type ON telemetry_events(event_type);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_case_id ON telemetry_events(case_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_project_id ON telemetry_events(project_id);

-- =============================================================================
-- P3-2: PROJECTS TABLE (Developer projects)
-- =============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  developer_name TEXT,
  location TEXT,

  -- Project stats (no PII)
  total_units INTEGER DEFAULT 0,
  sold_units INTEGER DEFAULT 0,
  loan_in_progress INTEGER DEFAULT 0,

  -- Configuration
  default_loan_types INTEGER[] DEFAULT ARRAY[1, 3], -- LPPSA types supported
  link_expiry_days INTEGER DEFAULT 7,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED'))
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- =============================================================================
-- P3-2: AGENTS TABLE (Agent registry - no PII stored)
-- =============================================================================

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),

  -- Anonymized identifier (hash of phone/email)
  agent_hash TEXT UNIQUE NOT NULL,

  -- Stats
  total_cases INTEGER DEFAULT 0,
  completed_cases INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_agents_project ON agents(project_id);
CREATE INDEX IF NOT EXISTS idx_agents_hash ON agents(agent_hash);

-- =============================================================================
-- P3-2: LEADS TABLE (Initial buyer interest - minimal PII)
-- =============================================================================

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  agent_id TEXT REFERENCES agents(id),

  -- Lead source
  source TEXT DEFAULT 'AGENT_CREATED',

  -- Status lifecycle
  status TEXT DEFAULT 'NEW' CHECK (status IN (
    'NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'
  )),

  -- Qualification signals (no exact values)
  employment_type TEXT,
  income_band TEXT,
  service_years_band TEXT,

  -- Property interest
  loan_type_code INTEGER CHECK (loan_type_code BETWEEN 1 AND 7),
  property_price_band TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  contacted_at TIMESTAMPTZ,
  qualified_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,

  -- Link to case (when converted)
  case_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_project ON leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_agent ON leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- =============================================================================
-- P3-2: CASES TABLE (Comprehensive - no PII)
-- =============================================================================

CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  agent_id TEXT REFERENCES agents(id),
  lead_id TEXT REFERENCES leads(id),

  -- Case phase (aligned with CasePhase type)
  phase TEXT DEFAULT 'PRESCAN' CHECK (phase IN (
    'PRESCAN', 'PRESCAN_COMPLETE', 'DOCS_PENDING', 'DOCS_COMPLETE',
    'IR_REVIEW', 'TAC_SCHEDULED', 'TAC_CONFIRMED', 'SUBMITTED',
    'LO_RECEIVED', 'KJ_PENDING', 'COMPLETED'
  )),

  -- Priority
  priority TEXT DEFAULT 'P3' CHECK (priority IN ('P1', 'P2', 'P3', 'P4')),

  -- Loan details (no exact amounts)
  loan_type_code INTEGER CHECK (loan_type_code BETWEEN 1 AND 7),
  loan_type TEXT,
  property_price_band TEXT,

  -- Readiness signals
  readiness_band TEXT CHECK (readiness_band IN ('ready', 'caution', 'not_ready')),
  dsr_band TEXT CHECK (dsr_band IN ('SIHAT', 'SEDERHANA', 'TINGGI')),

  -- Document progress
  docs_total INTEGER DEFAULT 0,
  docs_uploaded INTEGER DEFAULT 0,
  docs_verified INTEGER DEFAULT 0,

  -- Query risk
  query_risk TEXT DEFAULT 'none' CHECK (query_risk IN ('none', 'low', 'medium', 'high')),

  -- KJ tracking
  kj_status TEXT CHECK (kj_status IN ('pending', 'received', 'overdue')),
  kj_days INTEGER,

  -- LO tracking
  lo_received_at TIMESTAMPTZ,
  lo_expires_at TIMESTAMPTZ,

  -- TAC
  tac_scheduled_at TIMESTAMPTZ,
  tac_confirmed BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cases_project ON cases(project_id);
CREATE INDEX IF NOT EXISTS idx_cases_agent ON cases(agent_id);
CREATE INDEX IF NOT EXISTS idx_cases_phase ON cases(phase);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_loan_type ON cases(loan_type_code);

-- =============================================================================
-- P3-2: DOCUMENTS TABLE (Document tracking - no content stored)
-- =============================================================================

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  case_id TEXT REFERENCES cases(id) ON DELETE CASCADE,

  -- Document type
  doc_type TEXT NOT NULL,
  doc_name TEXT,

  -- Status
  status TEXT DEFAULT 'PENDING' CHECK (status IN (
    'PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED'
  )),

  -- AI extraction confidence (no actual values)
  confidence_level TEXT CHECK (confidence_level IN (
    'HIGH_CONFIDENCE', 'LOW_CONFIDENCE', 'NEEDS_REVIEW'
  )),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,

  -- Storage reference (external - Supabase Storage or S3)
  storage_path TEXT
);

CREATE INDEX IF NOT EXISTS idx_documents_case ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- =============================================================================
-- CASE EVENTS TABLE (Proof trail, append-only)
-- =============================================================================

CREATE TABLE IF NOT EXISTS case_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id TEXT REFERENCES cases(id),
  event_type TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('FACT', 'DECLARE', 'DERIVED')),
  actor TEXT NOT NULL,
  intent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- PRD compliance: Always false
  authority_claimed BOOLEAN DEFAULT FALSE CHECK (authority_claimed = FALSE),

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_case_events_case_id ON case_events(case_id);
CREATE INDEX IF NOT EXISTS idx_case_events_timestamp ON case_events(timestamp DESC);

-- =============================================================================
-- P3-3: LINKS TABLE (Invite Link Hardening)
-- =============================================================================

CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  case_id TEXT REFERENCES cases(id),
  agent_id TEXT REFERENCES agents(id),

  -- Link type
  link_type TEXT DEFAULT 'BUYER_INVITE' CHECK (link_type IN (
    'BUYER_INVITE', 'DOC_UPLOAD', 'TAC_CONFIRM', 'KJ_VIEW'
  )),

  -- Lifecycle status
  status TEXT DEFAULT 'CREATED' CHECK (status IN (
    'CREATED', 'SENT', 'OPENED', 'COMPLETED', 'EXPIRED', 'REVOKED'
  )),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,

  -- Security (P3-3)
  otp_required BOOLEAN DEFAULT TRUE,
  otp_verified BOOLEAN DEFAULT FALSE,
  otp_attempts INTEGER DEFAULT 0,
  otp_locked_until TIMESTAMPTZ,

  -- Access control
  max_opens INTEGER DEFAULT 3,
  open_count INTEGER DEFAULT 0,

  -- Metadata
  buyer_phone_hash TEXT, -- Hashed phone for OTP verification
  ip_addresses TEXT[] DEFAULT ARRAY[]::TEXT[],
  user_agents TEXT[] DEFAULT ARRAY[]::TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_links_project ON links(project_id);
CREATE INDEX IF NOT EXISTS idx_links_case ON links(case_id);
CREATE INDEX IF NOT EXISTS idx_links_status ON links(status);
CREATE INDEX IF NOT EXISTS idx_links_expires ON links(expires_at);

-- Function to check if link is valid
CREATE OR REPLACE FUNCTION is_link_valid(link_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  link_record RECORD;
BEGIN
  SELECT * INTO link_record FROM links WHERE id = link_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check status
  IF link_record.status NOT IN ('CREATED', 'SENT', 'OPENED') THEN
    RETURN FALSE;
  END IF;

  -- Check expiry
  IF link_record.expires_at < NOW() THEN
    UPDATE links SET status = 'EXPIRED' WHERE id = link_id;
    RETURN FALSE;
  END IF;

  -- Check max opens
  IF link_record.open_count >= link_record.max_opens THEN
    RETURN FALSE;
  END IF;

  -- Check OTP lock
  IF link_record.otp_locked_until IS NOT NULL AND link_record.otp_locked_until > NOW() THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- P3-6: VIEWS FOR METRICS DASHBOARD
-- =============================================================================

-- Daily event counts
CREATE OR REPLACE VIEW daily_event_counts AS
SELECT
  DATE(timestamp) as date,
  event_type,
  COUNT(*) as count
FROM telemetry_events
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), event_type
ORDER BY date DESC, event_type;

-- Funnel conversion view
CREATE OR REPLACE VIEW funnel_metrics AS
SELECT
  project_id,
  COUNT(*) FILTER (WHERE event_type = 'LINK_CREATED') as links_created,
  COUNT(*) FILTER (WHERE event_type = 'LINK_OPENED') as links_opened,
  COUNT(*) FILTER (WHERE event_type = 'CONSENT_GIVEN') as consent_given,
  COUNT(*) FILTER (WHERE event_type = 'DOC_UPLOADED') as docs_uploaded,
  COUNT(*) FILTER (WHERE event_type = 'READINESS_CALCULATED') as readiness_calculated,
  COUNT(*) FILTER (WHERE event_type = 'SUBMISSION_ATTESTED') as submission_attested
FROM telemetry_events
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY project_id;

-- P3-6: Case pipeline by phase
CREATE OR REPLACE VIEW case_pipeline AS
SELECT
  project_id,
  phase,
  priority,
  COUNT(*) as case_count,
  COUNT(*) FILTER (WHERE readiness_band = 'ready') as ready_count,
  COUNT(*) FILTER (WHERE readiness_band = 'caution') as caution_count,
  COUNT(*) FILTER (WHERE query_risk IN ('medium', 'high')) as at_risk_count
FROM cases
WHERE phase NOT IN ('COMPLETED')
GROUP BY project_id, phase, priority
ORDER BY project_id, phase;

-- P3-6: Time-to-ready metrics
CREATE OR REPLACE VIEW time_to_ready AS
SELECT
  project_id,
  loan_type_code,
  COUNT(*) as total_cases,
  AVG(EXTRACT(EPOCH FROM (submitted_at - created_at))/86400)::NUMERIC(10,1) as avg_days_to_submit,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (submitted_at - created_at))/86400) as median_days,
  MIN(EXTRACT(EPOCH FROM (submitted_at - created_at))/86400)::NUMERIC(10,1) as fastest_days,
  MAX(EXTRACT(EPOCH FROM (submitted_at - created_at))/86400)::NUMERIC(10,1) as slowest_days
FROM cases
WHERE submitted_at IS NOT NULL
GROUP BY project_id, loan_type_code;

-- P3-6: Document completion rates
CREATE OR REPLACE VIEW doc_completion_rates AS
SELECT
  c.project_id,
  c.loan_type_code,
  COUNT(DISTINCT c.id) as total_cases,
  AVG(c.docs_uploaded::FLOAT / NULLIF(c.docs_total, 0) * 100)::NUMERIC(5,1) as avg_completion_pct,
  COUNT(*) FILTER (WHERE c.docs_uploaded = c.docs_total) as fully_complete,
  COUNT(*) FILTER (WHERE c.docs_uploaded < c.docs_total) as incomplete
FROM cases c
WHERE c.docs_total > 0
GROUP BY c.project_id, c.loan_type_code;

-- P3-6: Agent performance (anonymized)
CREATE OR REPLACE VIEW agent_performance AS
SELECT
  a.id as agent_id,
  a.project_id,
  COUNT(DISTINCT c.id) as total_cases,
  COUNT(*) FILTER (WHERE c.phase = 'COMPLETED') as completed_cases,
  COUNT(*) FILTER (WHERE c.phase = 'SUBMITTED') as submitted_cases,
  AVG(EXTRACT(EPOCH FROM (c.submitted_at - c.created_at))/86400)::NUMERIC(10,1) as avg_turnaround_days,
  COUNT(*) FILTER (WHERE c.query_risk IN ('medium', 'high')) as cases_with_queries
FROM agents a
LEFT JOIN cases c ON a.id = c.agent_id
GROUP BY a.id, a.project_id;

-- P3-6: Link conversion funnel
CREATE OR REPLACE VIEW link_conversion AS
SELECT
  project_id,
  link_type,
  COUNT(*) as total_links,
  COUNT(*) FILTER (WHERE status = 'OPENED') as opened,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
  COUNT(*) FILTER (WHERE status = 'EXPIRED') as expired,
  COUNT(*) FILTER (WHERE otp_verified = TRUE) as otp_verified,
  (COUNT(*) FILTER (WHERE status = 'COMPLETED')::FLOAT /
   NULLIF(COUNT(*) FILTER (WHERE status = 'OPENED'), 0) * 100)::NUMERIC(5,1) as conversion_rate
FROM links
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY project_id, link_type;

-- P3-6: Query risk distribution
CREATE OR REPLACE VIEW query_risk_distribution AS
SELECT
  project_id,
  query_risk,
  COUNT(*) as case_count,
  (COUNT(*)::FLOAT / NULLIF(SUM(COUNT(*)) OVER (PARTITION BY project_id), 0) * 100)::NUMERIC(5,1) as percentage
FROM cases
WHERE phase NOT IN ('COMPLETED')
GROUP BY project_id, query_risk;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable for production - project-based isolation
-- =============================================================================

-- Helper function to get user's project_id (from JWT claims)
CREATE OR REPLACE FUNCTION get_user_project_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::json->>'project_id';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Telemetry: Read-only for authenticated users
ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON telemetry_events;
DROP POLICY IF EXISTS "Allow read for authenticated" ON telemetry_events;
CREATE POLICY "telemetry_insert" ON telemetry_events
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "telemetry_select" ON telemetry_events
  FOR SELECT TO authenticated USING (
    project_id IS NULL OR project_id = get_user_project_id()
  );

-- Projects: Read own project
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_select" ON projects
  FOR SELECT TO authenticated USING (id = get_user_project_id());
CREATE POLICY "projects_update" ON projects
  FOR UPDATE TO authenticated USING (id = get_user_project_id());

-- Agents: Project-scoped
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agents_select" ON agents
  FOR SELECT TO authenticated USING (project_id = get_user_project_id());
CREATE POLICY "agents_insert" ON agents
  FOR INSERT TO authenticated WITH CHECK (project_id = get_user_project_id());
CREATE POLICY "agents_update" ON agents
  FOR UPDATE TO authenticated USING (project_id = get_user_project_id());

-- Leads: Project-scoped
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_all" ON leads
  FOR ALL TO authenticated USING (project_id = get_user_project_id())
  WITH CHECK (project_id = get_user_project_id());

-- Cases: Project-scoped
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cases_all" ON cases
  FOR ALL TO authenticated USING (project_id = get_user_project_id())
  WITH CHECK (project_id = get_user_project_id());

-- Documents: Via case ownership
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents_all" ON documents
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM cases WHERE cases.id = documents.case_id AND cases.project_id = get_user_project_id())
  );

-- Links: Project-scoped
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "links_all" ON links
  FOR ALL TO authenticated USING (project_id = get_user_project_id())
  WITH CHECK (project_id = get_user_project_id());

-- Case Events: Via case ownership
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "case_events_all" ON case_events
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM cases WHERE cases.id = case_events.case_id AND cases.project_id = get_user_project_id())
  );

-- =============================================================================
-- USAGE NOTES
-- =============================================================================
-- 1. Run this script in Supabase SQL Editor
-- 2. Get your SUPABASE_URL and SUPABASE_ANON_KEY from project settings
-- 3. Add to .env.local:
--    NEXT_PUBLIC_SUPABASE_URL=your-url
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
--    NEXT_PUBLIC_SUPABASE_PROJECT_ID=your-project-id
-- 4. Set service mode to 'api' in app initialization
--
-- Privacy: Tables designed to NOT store PII.
-- - No names, phones, ICs, emails
-- - Only operational metadata (bands, counts, types)
-- - Use case_id as reference, not buyer details
-- - Phone/email stored as hashes only for verification
--
-- Schema Version: 2.0
-- Tables: projects, agents, leads, cases, documents, links, telemetry_events, case_events
-- Views: daily_event_counts, funnel_metrics, case_pipeline, time_to_ready,
--        doc_completion_rates, agent_performance, link_conversion, query_risk_distribution
