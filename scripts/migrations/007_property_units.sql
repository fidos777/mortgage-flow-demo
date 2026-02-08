-- =============================================================================
-- Migration 007: Property Units
-- CR-007A: Property Unit Inventory | PRD v3.6.3
--
-- Adds unit-level granularity to property management:
-- - Unit CRUD (block, floor, unit_number, type, sqft, price, status)
-- - Unit selection in "Cipta Pautan Jemputan" modal
-- - Auto-status transition (AVAILABLE → RESERVED when buyer gives consent)
-- - Unit → Case linking for pre-filled property data
--
-- Dependencies: None (standalone schema)
-- =============================================================================

-- =============================================================================
-- UNIT STATUS ENUM
-- =============================================================================

-- Unit availability status
CREATE TYPE unit_status AS ENUM (
  'AVAILABLE',      -- Unit is available for new buyers
  'RESERVED',       -- Buyer has started application (consent given)
  'PENDING',        -- Application in progress
  'SOLD',           -- Unit sold/completed
  'UNAVAILABLE'     -- Withdrawn or not for sale
);

-- Unit type classification
CREATE TYPE unit_type AS ENUM (
  'STUDIO',
  'ONE_BEDROOM',
  'TWO_BEDROOM',
  'THREE_BEDROOM',
  'PENTHOUSE',
  'DUPLEX',
  'TOWNHOUSE',
  'OTHER'
);

-- =============================================================================
-- PROPERTY UNITS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS property_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Property relationship
  property_id UUID NOT NULL,              -- FK to properties table
  developer_id UUID NOT NULL,             -- FK to developers table

  -- Unit identification
  block VARCHAR(20),                       -- e.g., "A", "Tower 1"
  floor VARCHAR(10) NOT NULL,              -- e.g., "12", "G", "P1"
  unit_number VARCHAR(20) NOT NULL,        -- e.g., "03", "A-12-03"
  full_unit_code VARCHAR(50) GENERATED ALWAYS AS (
    COALESCE(block || '-', '') || floor || '-' || unit_number
  ) STORED,                                -- e.g., "A-12-03"

  -- Unit details
  unit_type unit_type NOT NULL DEFAULT 'OTHER',
  bedrooms INTEGER,
  bathrooms INTEGER,
  sqft DECIMAL(10, 2),                     -- Square footage
  sqm DECIMAL(10, 2),                      -- Square meters (auto-calc)

  -- Pricing
  list_price DECIMAL(15, 2) NOT NULL,      -- RM
  booking_fee DECIMAL(10, 2),              -- RM

  -- Status
  status unit_status NOT NULL DEFAULT 'AVAILABLE',
  status_changed_at TIMESTAMPTZ,
  status_changed_by UUID,                  -- User who changed status

  -- Buyer link (when reserved/sold)
  buyer_hash VARCHAR(100),                 -- Linked buyer
  case_id UUID,                            -- Linked case
  reserved_at TIMESTAMPTZ,

  -- Master agent assignment (CR-007A)
  master_agent_id UUID,                    -- Default agent for this unit

  -- QR/Link tracking
  qr_code_url VARCHAR(500),                -- snang.my/u/{unit_id}
  invitation_link_count INTEGER DEFAULT 0,
  scan_count INTEGER DEFAULT 0,

  -- Metadata
  features JSONB DEFAULT '[]',             -- ["Balcony", "Corner Unit", etc.]
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,

  -- Constraints
  CONSTRAINT unique_unit_per_property UNIQUE (property_id, block, floor, unit_number),
  CONSTRAINT valid_sqft CHECK (sqft IS NULL OR sqft > 0),
  CONSTRAINT valid_price CHECK (list_price > 0)
);

-- Indexes
CREATE INDEX idx_property_units_property ON property_units(property_id);
CREATE INDEX idx_property_units_developer ON property_units(developer_id);
CREATE INDEX idx_property_units_status ON property_units(status);
CREATE INDEX idx_property_units_buyer ON property_units(buyer_hash) WHERE buyer_hash IS NOT NULL;
CREATE INDEX idx_property_units_case ON property_units(case_id) WHERE case_id IS NOT NULL;
CREATE INDEX idx_property_units_code ON property_units(full_unit_code);

-- =============================================================================
-- UNIT STATUS HISTORY
-- =============================================================================

CREATE TABLE IF NOT EXISTS unit_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES property_units(id),

  -- Status change
  previous_status unit_status,
  new_status unit_status NOT NULL,

  -- Context
  changed_by UUID,
  change_reason VARCHAR(255),
  buyer_hash VARCHAR(100),
  case_id UUID,

  -- Audit
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_unit_status_history_unit ON unit_status_history(unit_id);
CREATE INDEX idx_unit_status_history_time ON unit_status_history(changed_at DESC);

-- =============================================================================
-- UNIT INVITATION LINKS
-- =============================================================================

CREATE TABLE IF NOT EXISTS unit_invitation_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES property_units(id),

  -- Link details
  short_code VARCHAR(20) NOT NULL UNIQUE,  -- For URL: snang.my/u/{short_code}
  full_url VARCHAR(500) NOT NULL,

  -- Targeting
  agent_id UUID,                           -- Specific agent assignment

  -- Usage tracking
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,      -- Buyers who completed consent

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX idx_unit_links_unit ON unit_invitation_links(unit_id);
CREATE INDEX idx_unit_links_code ON unit_invitation_links(short_code);
CREATE INDEX idx_unit_links_active ON unit_invitation_links(is_active) WHERE is_active = TRUE;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Auto-calculate sqm from sqft
CREATE OR REPLACE FUNCTION calc_sqm_from_sqft()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sqft IS NOT NULL THEN
    NEW.sqm := ROUND(NEW.sqft * 0.092903, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calc_sqm
  BEFORE INSERT OR UPDATE OF sqft ON property_units
  FOR EACH ROW
  EXECUTE FUNCTION calc_sqm_from_sqft();

-- Log status changes
CREATE OR REPLACE FUNCTION log_unit_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO unit_status_history (
      unit_id, previous_status, new_status, changed_by, buyer_hash, case_id
    ) VALUES (
      NEW.id, OLD.status, NEW.status, NEW.status_changed_by, NEW.buyer_hash, NEW.case_id
    );

    NEW.status_changed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_unit_status_change
  BEFORE UPDATE OF status ON property_units
  FOR EACH ROW
  EXECUTE FUNCTION log_unit_status_change();

-- Update timestamp on modification
CREATE OR REPLACE FUNCTION update_unit_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_unit_timestamp
  BEFORE UPDATE ON property_units
  FOR EACH ROW
  EXECUTE FUNCTION update_unit_timestamp();

-- Reserve unit for buyer (auto-transition)
CREATE OR REPLACE FUNCTION reserve_unit_for_buyer(
  p_unit_id UUID,
  p_buyer_hash VARCHAR,
  p_case_id UUID DEFAULT NULL,
  p_changed_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_status unit_status;
BEGIN
  -- Get current status
  SELECT status INTO v_current_status FROM property_units WHERE id = p_unit_id;

  -- Only reserve if AVAILABLE
  IF v_current_status != 'AVAILABLE' THEN
    RETURN FALSE;
  END IF;

  -- Update unit
  UPDATE property_units SET
    status = 'RESERVED',
    buyer_hash = p_buyer_hash,
    case_id = p_case_id,
    reserved_at = NOW(),
    status_changed_by = p_changed_by
  WHERE id = p_unit_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Release unit (cancel reservation)
CREATE OR REPLACE FUNCTION release_unit(
  p_unit_id UUID,
  p_changed_by UUID DEFAULT NULL,
  p_reason VARCHAR DEFAULT 'Reservation cancelled'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE property_units SET
    status = 'AVAILABLE',
    buyer_hash = NULL,
    case_id = NULL,
    reserved_at = NULL,
    status_changed_by = p_changed_by
  WHERE id = p_unit_id AND status IN ('RESERVED', 'PENDING');

  -- Log the release reason
  UPDATE unit_status_history SET
    change_reason = p_reason
  WHERE unit_id = p_unit_id
  ORDER BY changed_at DESC
  LIMIT 1;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Generate short code for invitation link
CREATE OR REPLACE FUNCTION generate_unit_short_code()
RETURNS VARCHAR AS $$
DECLARE
  v_code VARCHAR;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-char alphanumeric code
    v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

    -- Check uniqueness
    SELECT EXISTS(SELECT 1 FROM unit_invitation_links WHERE short_code = v_code) INTO v_exists;

    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Unit summary view with property context
CREATE OR REPLACE VIEW v_unit_summary AS
SELECT
  u.id,
  u.property_id,
  u.developer_id,
  u.full_unit_code,
  u.block,
  u.floor,
  u.unit_number,
  u.unit_type,
  u.bedrooms,
  u.bathrooms,
  u.sqft,
  u.sqm,
  u.list_price,
  u.status,
  u.buyer_hash,
  u.case_id,
  u.reserved_at,
  u.master_agent_id,
  u.scan_count,
  u.invitation_link_count,
  u.created_at,
  u.updated_at,
  -- Computed fields
  CASE
    WHEN u.status = 'AVAILABLE' THEN TRUE
    ELSE FALSE
  END AS is_available,
  EXTRACT(DAY FROM (NOW() - u.reserved_at)) AS days_reserved
FROM property_units u;

-- Property unit statistics
CREATE OR REPLACE VIEW v_property_unit_stats AS
SELECT
  property_id,
  developer_id,
  COUNT(*) AS total_units,
  COUNT(*) FILTER (WHERE status = 'AVAILABLE') AS available_units,
  COUNT(*) FILTER (WHERE status = 'RESERVED') AS reserved_units,
  COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_units,
  COUNT(*) FILTER (WHERE status = 'SOLD') AS sold_units,
  SUM(list_price) AS total_value,
  SUM(list_price) FILTER (WHERE status = 'SOLD') AS sold_value,
  AVG(list_price) AS avg_price,
  SUM(scan_count) AS total_scans,
  SUM(invitation_link_count) AS total_links
FROM property_units
GROUP BY property_id, developer_id;

-- Unit availability board (for visual grid display)
CREATE OR REPLACE VIEW v_unit_board AS
SELECT
  property_id,
  block,
  floor,
  ARRAY_AGG(
    JSON_BUILD_OBJECT(
      'unit_number', unit_number,
      'status', status,
      'unit_type', unit_type,
      'price', list_price,
      'buyer_hash', buyer_hash
    ) ORDER BY unit_number
  ) AS units
FROM property_units
GROUP BY property_id, block, floor
ORDER BY block, floor DESC;

-- =============================================================================
-- SEED DATA (Demo)
-- =============================================================================

-- Insert sample units for Residensi Harmoni (demo)
DO $$
DECLARE
  v_property_id UUID := '11111111-1111-1111-1111-111111111111';
  v_developer_id UUID := '22222222-2222-2222-2222-222222222222';
  v_floors TEXT[] := ARRAY['10', '11', '12', '13', '14', '15'];
  v_units TEXT[] := ARRAY['01', '02', '03', '04', '05', '06'];
  v_floor TEXT;
  v_unit TEXT;
  v_status unit_status;
  v_price DECIMAL;
BEGIN
  FOREACH v_floor IN ARRAY v_floors LOOP
    FOREACH v_unit IN ARRAY v_units LOOP
      -- Randomize status for demo
      v_status := CASE
        WHEN RANDOM() < 0.6 THEN 'AVAILABLE'
        WHEN RANDOM() < 0.8 THEN 'RESERVED'
        WHEN RANDOM() < 0.9 THEN 'PENDING'
        ELSE 'SOLD'
      END;

      -- Price varies by floor
      v_price := 350000 + (v_floor::INTEGER * 5000) + (RANDOM() * 20000);

      INSERT INTO property_units (
        property_id, developer_id, block, floor, unit_number,
        unit_type, bedrooms, bathrooms, sqft, list_price, status
      ) VALUES (
        v_property_id, v_developer_id, 'A', v_floor, v_unit,
        CASE
          WHEN v_unit IN ('01', '06') THEN 'THREE_BEDROOM'
          WHEN v_unit IN ('02', '05') THEN 'TWO_BEDROOM'
          ELSE 'ONE_BEDROOM'
        END,
        CASE WHEN v_unit IN ('01', '06') THEN 3 WHEN v_unit IN ('02', '05') THEN 2 ELSE 1 END,
        CASE WHEN v_unit IN ('01', '06') THEN 2 WHEN v_unit IN ('02', '05') THEN 2 ELSE 1 END,
        CASE WHEN v_unit IN ('01', '06') THEN 1200 WHEN v_unit IN ('02', '05') THEN 950 ELSE 650 END,
        ROUND(v_price, 2),
        v_status
      )
      ON CONFLICT (property_id, block, floor, unit_number) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE property_units IS 'CR-007A: Property unit inventory with status tracking';
COMMENT ON TABLE unit_status_history IS 'Audit log of unit status changes';
COMMENT ON TABLE unit_invitation_links IS 'QR/invitation links for specific units';
COMMENT ON FUNCTION reserve_unit_for_buyer IS 'Auto-transition unit from AVAILABLE to RESERVED when buyer consents';
COMMENT ON FUNCTION release_unit IS 'Release a reserved unit back to AVAILABLE status';
COMMENT ON VIEW v_unit_board IS 'Unit availability data for visual grid/board display';
