-- ============================================================================
-- CR-004: Agent Contact CTAs
-- Migration: 003_agent_contacts.sql
-- Description: WhatsApp deep links and contact attempt tracking
-- ============================================================================

-- ============================================================================
-- MORTGAGE AGENTS TABLE
-- Registered mortgage agents (Category A & B processors)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mortgage_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identity
    name VARCHAR(255) NOT NULL,
    ic_number VARCHAR(20),                           -- For KYC verification
    license_no VARCHAR(50),                          -- Mortgage agent license

    -- Contact (used for WhatsApp deep links)
    phone VARCHAR(20) NOT NULL,                      -- Primary WhatsApp number
    phone_display VARCHAR(20),                       -- Masked version for UI
    email VARCHAR(255),

    -- Assignment
    developer_id UUID REFERENCES developers(id),     -- Primary developer assigned
    is_master_agent BOOLEAN DEFAULT false,           -- CR-007A: Master agent role
    max_active_cases INTEGER DEFAULT 50,             -- Capacity management

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'suspended')),
    available_from TIME,                             -- Working hours start
    available_until TIME,                            -- Working hours end
    timezone VARCHAR(50) DEFAULT 'Asia/Kuala_Lumpur',

    -- Performance Metrics
    total_cases_handled INTEGER DEFAULT 0,
    cases_approved INTEGER DEFAULT 0,
    avg_response_time_hours DECIMAL(5, 2),           -- Average first response time
    rating DECIMAL(3, 2),                            -- 1.00 - 5.00

    -- Metadata
    profile_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONTACT ATTEMPTS TABLE
-- Track all agent-buyer contact attempts via WhatsApp
-- ============================================================================
CREATE TABLE IF NOT EXISTS contact_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    case_id UUID NOT NULL REFERENCES mortgage_cases(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES mortgage_agents(id),

    -- Contact Details
    contact_type VARCHAR(20) NOT NULL CHECK (contact_type IN ('whatsapp', 'call', 'sms', 'email')),
    contact_direction VARCHAR(10) NOT NULL CHECK (contact_direction IN ('outbound', 'inbound')),

    -- WhatsApp Deep Link Details
    whatsapp_number VARCHAR(20),                     -- Number contacted
    whatsapp_message_template VARCHAR(50),           -- Template used
    deep_link_url TEXT,                              -- Generated wa.me link

    -- Tracking
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    clicked_at TIMESTAMPTZ,                          -- When CTA was clicked
    responded_at TIMESTAMPTZ,                        -- When buyer responded (if tracked)

    -- Source Context
    source_page VARCHAR(100),                        -- 'agent_dashboard', 'case_detail'
    source_ip INET,
    user_agent TEXT,

    -- Outcome
    status VARCHAR(20) DEFAULT 'initiated' CHECK (status IN (
        'initiated',     -- CTA clicked, link generated
        'opened',        -- WhatsApp opened (if trackable)
        'responded',     -- Buyer responded
        'no_response',   -- Timed out
        'failed'         -- Error in contact
    )),
    notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- WHATSAPP TEMPLATES TABLE
-- Pre-defined message templates for different scenarios
-- ============================================================================
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identity
    code VARCHAR(50) UNIQUE NOT NULL,                -- 'first_contact', 'document_reminder'
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Content (with placeholders)
    message_en TEXT NOT NULL,                        -- English version
    message_bm TEXT NOT NULL,                        -- Bahasa Malaysia version

    -- Placeholders: {buyer_name}, {property_name}, {case_ref}, {agent_name}

    -- Usage Context
    category VARCHAR(30) NOT NULL CHECK (category IN (
        'first_contact',     -- Initial outreach
        'follow_up',         -- General follow up
        'document_request',  -- Request documents
        'status_update',     -- Case status change
        'appointment',       -- Schedule meeting
        'completion'         -- Case completed
    )),

    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONTACT METRICS VIEW
-- Aggregated contact performance per agent
-- ============================================================================
CREATE OR REPLACE VIEW agent_contact_metrics AS
SELECT
    a.id AS agent_id,
    a.name AS agent_name,
    COUNT(ca.id) AS total_contacts,
    COUNT(CASE WHEN ca.status = 'responded' THEN 1 END) AS successful_contacts,
    ROUND(
        COUNT(CASE WHEN ca.status = 'responded' THEN 1 END)::DECIMAL /
        NULLIF(COUNT(ca.id), 0) * 100, 2
    ) AS response_rate_pct,
    AVG(
        EXTRACT(EPOCH FROM (ca.responded_at - ca.initiated_at)) / 3600
    ) AS avg_response_hours,
    MAX(ca.initiated_at) AS last_contact_at
FROM mortgage_agents a
LEFT JOIN contact_attempts ca ON a.id = ca.agent_id
GROUP BY a.id, a.name;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Agent queries
CREATE INDEX IF NOT EXISTS idx_agents_developer ON mortgage_agents(developer_id, status);
CREATE INDEX IF NOT EXISTS idx_agents_status ON mortgage_agents(status, is_master_agent);
CREATE INDEX IF NOT EXISTS idx_agents_phone ON mortgage_agents(phone);

-- Contact attempts
CREATE INDEX IF NOT EXISTS idx_contacts_case ON contact_attempts(case_id, initiated_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_agent ON contact_attempts(agent_id, initiated_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contact_attempts(status, initiated_at DESC);

-- Templates
CREATE INDEX IF NOT EXISTS idx_templates_category ON whatsapp_templates(category, is_active);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE mortgage_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Agents can see their own profile
CREATE POLICY agents_own_policy ON mortgage_agents
    FOR ALL USING (id = auth.uid());

-- Agents can see contacts for their assigned cases
CREATE POLICY contacts_agent_policy ON contact_attempts
    FOR ALL
    USING (agent_id = auth.uid());

-- Developers can see contacts for their cases
CREATE POLICY contacts_developer_policy ON contact_attempts
    FOR SELECT
    USING (
        case_id IN (
            SELECT id FROM mortgage_cases WHERE developer_id = auth.uid()
        )
    );

-- Templates are readable by all authenticated users
CREATE POLICY templates_read_policy ON whatsapp_templates
    FOR SELECT
    USING (is_active = true);

-- Service role override
CREATE POLICY service_role_agents ON mortgage_agents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_contacts ON contact_attempts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_templates ON whatsapp_templates FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Generate WhatsApp deep link
CREATE OR REPLACE FUNCTION generate_whatsapp_link(
    p_phone VARCHAR,
    p_message TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_clean_phone VARCHAR;
    v_encoded_message TEXT;
BEGIN
    -- Clean phone number (remove spaces, dashes, keep + for country code)
    v_clean_phone := REGEXP_REPLACE(p_phone, '[^0-9+]', '', 'g');

    -- If starts with 0, assume Malaysia and add country code
    IF v_clean_phone LIKE '0%' THEN
        v_clean_phone := '60' || SUBSTRING(v_clean_phone FROM 2);
    END IF;

    -- Remove + if present
    v_clean_phone := REPLACE(v_clean_phone, '+', '');

    -- URL encode the message
    v_encoded_message := REPLACE(p_message, ' ', '%20');
    v_encoded_message := REPLACE(v_encoded_message, E'\n', '%0A');

    RETURN 'https://wa.me/' || v_clean_phone || '?text=' || v_encoded_message;
END;
$$ LANGUAGE plpgsql;

-- Function: Log contact attempt and return deep link
CREATE OR REPLACE FUNCTION initiate_contact(
    p_case_id UUID,
    p_agent_id UUID,
    p_template_code VARCHAR,
    p_language VARCHAR DEFAULT 'bm',
    p_source_page VARCHAR DEFAULT 'agent_dashboard'
)
RETURNS TABLE (
    contact_id UUID,
    deep_link TEXT,
    buyer_name VARCHAR,
    buyer_phone_masked VARCHAR
) AS $$
DECLARE
    v_case RECORD;
    v_template RECORD;
    v_message TEXT;
    v_link TEXT;
    v_contact_id UUID;
BEGIN
    -- Get case and buyer info
    SELECT * INTO v_case FROM mortgage_cases WHERE id = p_case_id;

    IF v_case IS NULL THEN
        RAISE EXCEPTION 'Case not found: %', p_case_id;
    END IF;

    -- Get template
    SELECT * INTO v_template FROM whatsapp_templates WHERE code = p_template_code AND is_active = true;

    IF v_template IS NULL THEN
        RAISE EXCEPTION 'Template not found or inactive: %', p_template_code;
    END IF;

    -- Select message by language
    v_message := CASE WHEN p_language = 'en' THEN v_template.message_en ELSE v_template.message_bm END;

    -- Replace placeholders
    v_message := REPLACE(v_message, '{buyer_name}', COALESCE(v_case.buyer_name, 'Pembeli'));
    v_message := REPLACE(v_message, '{case_ref}', v_case.case_ref);

    -- Generate deep link
    v_link := generate_whatsapp_link(v_case.buyer_phone, v_message);

    -- Log the contact attempt
    INSERT INTO contact_attempts (
        case_id,
        agent_id,
        contact_type,
        contact_direction,
        whatsapp_number,
        whatsapp_message_template,
        deep_link_url,
        source_page,
        status
    ) VALUES (
        p_case_id,
        p_agent_id,
        'whatsapp',
        'outbound',
        v_case.buyer_phone,
        p_template_code,
        v_link,
        p_source_page,
        'initiated'
    )
    RETURNING id INTO v_contact_id;

    -- Return result
    RETURN QUERY SELECT
        v_contact_id,
        v_link,
        v_case.buyer_name::VARCHAR,
        -- Mask phone: show last 4 digits only
        ('XXX-XXX-' || RIGHT(REGEXP_REPLACE(v_case.buyer_phone, '[^0-9]', '', 'g'), 4))::VARCHAR;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get agent's contact history for a case
CREATE OR REPLACE FUNCTION get_contact_history(
    p_case_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    contact_id UUID,
    agent_name VARCHAR,
    contact_type VARCHAR,
    status VARCHAR,
    initiated_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ca.id,
        ma.name,
        ca.contact_type,
        ca.status,
        ca.initiated_at,
        ca.responded_at,
        ca.notes
    FROM contact_attempts ca
    JOIN mortgage_agents ma ON ca.agent_id = ma.id
    WHERE ca.case_id = p_case_id
    ORDER BY ca.initiated_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA: WhatsApp Templates
-- ============================================================================
INSERT INTO whatsapp_templates (code, name, category, message_en, message_bm) VALUES
(
    'first_contact',
    'Initial Contact',
    'first_contact',
    'Hi {buyer_name}, I am your mortgage consultant for case {case_ref}. How may I assist you today?',
    'Salam {buyer_name}, saya konsultan pembiayaan anda untuk kes {case_ref}. Bagaimana saya boleh bantu hari ini?'
),
(
    'document_reminder',
    'Document Reminder',
    'document_request',
    'Hi {buyer_name}, just a friendly reminder to upload your documents for case {case_ref}. Let me know if you need help!',
    'Salam {buyer_name}, peringatan mesra untuk muat naik dokumen anda bagi kes {case_ref}. Beritahu jika perlukan bantuan!'
),
(
    'status_approved',
    'Loan Approved',
    'status_update',
    'Great news {buyer_name}! Your loan for {case_ref} has been approved. Let''s discuss the next steps.',
    'Berita baik {buyer_name}! Pembiayaan anda untuk {case_ref} telah diluluskan. Mari bincang langkah seterusnya.'
),
(
    'follow_up_general',
    'General Follow Up',
    'follow_up',
    'Hi {buyer_name}, just checking in on your mortgage application {case_ref}. Any questions?',
    'Salam {buyer_name}, sekadar bertanya tentang permohonan pembiayaan {case_ref}. Ada soalan?'
)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SEED DATA: Demo Agents
-- ============================================================================
INSERT INTO mortgage_agents (id, name, phone, phone_display, email, developer_id, is_master_agent, status) VALUES
(
    'a1000000-0000-0000-0000-000000000001',
    'Ahmad Razak',
    '+60123456789',
    'XXX-XXX-6789',
    'ahmad.razak@globalfiz.my',
    'a1000000-0000-0000-0000-000000000001',
    true,
    'active'
),
(
    'a2000000-0000-0000-0000-000000000002',
    'Siti Aminah',
    '+60198765432',
    'XXX-XXX-5432',
    'siti.aminah@globalfiz.my',
    'a1000000-0000-0000-0000-000000000001',
    false,
    'active'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE mortgage_agents IS 'CR-004: Mortgage agents with WhatsApp contact capability';
COMMENT ON TABLE contact_attempts IS 'CR-004: Audit trail for all agent-buyer contact attempts';
COMMENT ON TABLE whatsapp_templates IS 'CR-004: Pre-defined WhatsApp message templates';
COMMENT ON FUNCTION generate_whatsapp_link IS 'Generates wa.me deep link with URL-encoded message';
COMMENT ON FUNCTION initiate_contact IS 'Logs contact attempt and returns WhatsApp deep link';
