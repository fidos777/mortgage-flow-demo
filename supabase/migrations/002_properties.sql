-- ============================================================================
-- CR-007: Property Console + QR Generation
-- Migration: 002_properties.sql
-- Description: Property management for developers with QR code generation
-- ============================================================================

-- ============================================================================
-- DEVELOPERS TABLE
-- Registered property developers (Category A & B)
-- ============================================================================
CREATE TABLE IF NOT EXISTS developers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identity
    company_name VARCHAR(255) NOT NULL,
    registration_no VARCHAR(50) UNIQUE NOT NULL,    -- SSM registration
    slug VARCHAR(100) UNIQUE,                        -- URL-friendly identifier

    -- Contact
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,

    -- Category
    category VARCHAR(10) NOT NULL CHECK (category IN ('A', 'B')),
    -- Category A: Direct integration (Seven Sky, etc.)
    -- Category B: Spillover recipients

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'inactive')),
    verified_at TIMESTAMPTZ,
    verified_by UUID,

    -- Settings
    default_agent_id UUID,                           -- Primary assigned agent
    spillover_enabled BOOLEAN DEFAULT false,         -- Can receive spillover?
    spillover_priority INTEGER DEFAULT 100,          -- Lower = higher priority

    -- Metadata
    logo_url TEXT,
    website_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROPERTIES TABLE
-- Property listings managed by developers
-- ============================================================================
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Ownership
    developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,

    -- Basic Info
    name VARCHAR(255) NOT NULL,                      -- "Residensi Harmoni"
    slug VARCHAR(100),                               -- URL-friendly: "residensi-harmoni"
    property_type VARCHAR(50) NOT NULL CHECK (property_type IN (
        'apartment', 'condominium', 'townhouse', 'semi-d',
        'bungalow', 'terrace', 'commercial', 'mixed'
    )),

    -- Location
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    postcode VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Pricing
    price_min DECIMAL(12, 2),                        -- Starting price
    price_max DECIMAL(12, 2),                        -- Maximum price
    currency VARCHAR(3) DEFAULT 'MYR',

    -- Details
    description TEXT,
    description_bm TEXT,                             -- Bahasa Malaysia version
    total_units INTEGER,
    available_units INTEGER,
    completion_date DATE,                            -- Expected completion
    tenure VARCHAR(20) CHECK (tenure IN ('freehold', 'leasehold')),
    lease_years INTEGER,                             -- If leasehold

    -- Media
    cover_image_url TEXT,
    gallery_urls TEXT[],                             -- Array of image URLs
    brochure_url TEXT,
    video_url TEXT,

    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'sold_out', 'archived')),
    published_at TIMESTAMPTZ,

    -- QR Code
    qr_generated BOOLEAN DEFAULT false,
    qr_url TEXT,                                     -- Stored QR image URL
    qr_token VARCHAR(64),                            -- Link to secure_links

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- ============================================================================
-- PROPERTY UNITS TABLE
-- Individual units within a property
-- ============================================================================
CREATE TABLE IF NOT EXISTS property_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Parent
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    -- Unit Details
    unit_no VARCHAR(50) NOT NULL,                    -- "A-12-05"
    block VARCHAR(50),                               -- "Block A"
    floor INTEGER,
    unit_type VARCHAR(50),                           -- "Type A", "3BR Premium"

    -- Specifications
    built_up_sqft DECIMAL(10, 2),
    land_sqft DECIMAL(10, 2),                        -- For landed properties
    bedrooms INTEGER,
    bathrooms INTEGER,
    parking_lots INTEGER DEFAULT 1,

    -- Pricing
    price DECIMAL(12, 2) NOT NULL,
    booking_fee DECIMAL(10, 2),

    -- Status
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN (
        'available', 'reserved', 'booked', 'sold', 'unavailable'
    )),
    reserved_until TIMESTAMPTZ,
    reserved_by UUID,                                -- Case ID if reserved

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: no duplicate unit numbers per property
    UNIQUE(property_id, unit_no)
);

-- ============================================================================
-- MORTGAGE CASES TABLE
-- Buyer mortgage applications linked to properties
-- ============================================================================
CREATE TABLE IF NOT EXISTS mortgage_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Case Reference
    case_ref VARCHAR(20) UNIQUE NOT NULL,            -- "QTK-2026-00001"

    -- Property Link
    property_id UUID REFERENCES properties(id),
    unit_id UUID REFERENCES property_units(id),
    developer_id UUID NOT NULL REFERENCES developers(id),

    -- Buyer Info (encrypted/masked in views)
    buyer_name VARCHAR(255) NOT NULL,
    buyer_ic VARCHAR(20),                            -- MyKad number
    buyer_phone VARCHAR(20),
    buyer_email VARCHAR(255),

    -- Financial
    property_price DECIMAL(12, 2),
    loan_amount_requested DECIMAL(12, 2),
    income_declared DECIMAL(12, 2),

    -- Status Workflow
    status VARCHAR(30) DEFAULT 'new' CHECK (status IN (
        'new',              -- Just created
        'documents_pending', -- Awaiting buyer docs
        'documents_received', -- Docs uploaded
        'under_review',      -- Agent reviewing
        'submitted_bank',    -- Submitted to bank
        'bank_processing',   -- Bank is processing
        'approved',          -- Loan approved
        'rejected',          -- Loan rejected
        'completed',         -- Disbursed
        'cancelled'          -- Cancelled by buyer/developer
    )),

    -- Assignment
    assigned_agent_id UUID,                          -- Mortgage agent
    assigned_at TIMESTAMPTZ,
    spillover_source_id UUID,                        -- If from spillover

    -- PDPA
    pdpa_consented BOOLEAN DEFAULT false,
    pdpa_consented_at TIMESTAMPTZ,
    pdpa_consent_ip INET,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Developer lookups
CREATE INDEX IF NOT EXISTS idx_developers_category ON developers(category, status);
CREATE INDEX IF NOT EXISTS idx_developers_slug ON developers(slug);

-- Property queries
CREATE INDEX IF NOT EXISTS idx_properties_developer ON properties(developer_id, status);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(state, city);
CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);

-- Unit availability
CREATE INDEX IF NOT EXISTS idx_property_units_available
    ON property_units(property_id, status)
    WHERE status = 'available';

-- Case tracking
CREATE INDEX IF NOT EXISTS idx_cases_developer ON mortgage_cases(developer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_agent ON mortgage_cases(assigned_agent_id, status);
CREATE INDEX IF NOT EXISTS idx_cases_status ON mortgage_cases(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_ref ON mortgage_cases(case_ref);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE mortgage_cases ENABLE ROW LEVEL SECURITY;

-- Developers can only see their own data
CREATE POLICY developer_own_policy ON developers
    FOR ALL USING (id = auth.uid());

-- Properties: developer can manage their own
CREATE POLICY properties_developer_policy ON properties
    FOR ALL
    USING (developer_id = auth.uid())
    WITH CHECK (developer_id = auth.uid());

-- Properties: public can view active properties
CREATE POLICY properties_public_read_policy ON properties
    FOR SELECT
    USING (status = 'active');

-- Units follow property ownership
CREATE POLICY units_developer_policy ON property_units
    FOR ALL
    USING (
        property_id IN (
            SELECT id FROM properties WHERE developer_id = auth.uid()
        )
    );

-- Cases: developer sees their cases
CREATE POLICY cases_developer_policy ON mortgage_cases
    FOR SELECT
    USING (developer_id = auth.uid());

-- Cases: agent sees assigned cases
CREATE POLICY cases_agent_policy ON mortgage_cases
    FOR ALL
    USING (assigned_agent_id = auth.uid());

-- Service role override
CREATE POLICY service_role_developers ON developers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_properties ON properties FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_units ON property_units FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_cases ON mortgage_cases FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Generate case reference number
CREATE OR REPLACE FUNCTION generate_case_ref()
RETURNS VARCHAR AS $$
DECLARE
    v_year VARCHAR;
    v_count INTEGER;
    v_ref VARCHAR;
BEGIN
    v_year := TO_CHAR(NOW(), 'YYYY');

    SELECT COUNT(*) + 1 INTO v_count
    FROM mortgage_cases
    WHERE case_ref LIKE 'QTK-' || v_year || '-%';

    v_ref := 'QTK-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');

    RETURN v_ref;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-generate case_ref on insert
CREATE OR REPLACE FUNCTION trigger_set_case_ref()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.case_ref IS NULL THEN
        NEW.case_ref := generate_case_ref();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_case_ref
    BEFORE INSERT ON mortgage_cases
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_case_ref();

-- Trigger: Auto-update updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_developers_updated_at
    BEFORE UPDATE ON developers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_units_updated_at
    BEFORE UPDATE ON property_units
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_cases_updated_at
    BEFORE UPDATE ON mortgage_cases
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- Function: Get property stats for developer dashboard
CREATE OR REPLACE FUNCTION get_developer_stats(p_developer_id UUID)
RETURNS TABLE (
    total_properties BIGINT,
    active_properties BIGINT,
    total_units BIGINT,
    available_units BIGINT,
    total_cases BIGINT,
    pending_cases BIGINT,
    approved_cases BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM properties WHERE developer_id = p_developer_id),
        (SELECT COUNT(*) FROM properties WHERE developer_id = p_developer_id AND status = 'active'),
        (SELECT COUNT(*) FROM property_units pu
            JOIN properties p ON pu.property_id = p.id
            WHERE p.developer_id = p_developer_id),
        (SELECT COUNT(*) FROM property_units pu
            JOIN properties p ON pu.property_id = p.id
            WHERE p.developer_id = p_developer_id AND pu.status = 'available'),
        (SELECT COUNT(*) FROM mortgage_cases WHERE developer_id = p_developer_id),
        (SELECT COUNT(*) FROM mortgage_cases WHERE developer_id = p_developer_id AND status IN ('new', 'documents_pending', 'under_review')),
        (SELECT COUNT(*) FROM mortgage_cases WHERE developer_id = p_developer_id AND status = 'approved');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA FOR DEMO
-- ============================================================================

-- Insert demo developers
INSERT INTO developers (id, company_name, registration_no, slug, email, phone, category, status) VALUES
    ('d1000000-0000-0000-0000-000000000001', 'Seven Sky Development Sdn Bhd', 'SSM-1234567-A', 'seven-sky', 'admin@sevensky.my', '+60123456789', 'A', 'active'),
    ('d2000000-0000-0000-0000-000000000002', 'Meridian Properties Sdn Bhd', 'SSM-2345678-B', 'meridian', 'admin@meridian.my', '+60123456790', 'B', 'active')
ON CONFLICT (registration_no) DO NOTHING;

-- Insert demo property
INSERT INTO properties (id, developer_id, name, slug, property_type, address, city, state, postcode, price_min, price_max, status) VALUES
    ('p1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Residensi Harmoni', 'residensi-harmoni', 'condominium', 'Jalan Harmoni 1, Taman Harmoni', 'Shah Alam', 'Selangor', '40000', 350000.00, 550000.00, 'active')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE developers IS 'CR-007: Property developers (Category A direct, Category B spillover)';
COMMENT ON TABLE properties IS 'CR-007: Property listings with QR code generation';
COMMENT ON TABLE property_units IS 'CR-007: Individual units within properties';
COMMENT ON TABLE mortgage_cases IS 'CR-007: Mortgage applications linked to properties';
