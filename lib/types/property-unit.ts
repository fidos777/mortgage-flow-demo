/**
 * Property Unit Types
 * CR-007A: Property Unit Inventory | PRD v3.6.3
 *
 * Unit-level granularity for property management:
 * - Unit CRUD (block, floor, unit_number, type, sqft, price, status)
 * - Unit selection in "Cipta Pautan Jemputan" modal
 * - Auto-status transition (AVAILABLE → RESERVED when buyer gives consent)
 * - Unit → Case linking for pre-filled property data
 */

// =============================================================================
// UNIT STATUS
// =============================================================================

export type UnitStatus =
  | 'AVAILABLE'      // Unit is available for new buyers
  | 'RESERVED'       // Buyer has started application (consent given)
  | 'PENDING'        // Application in progress
  | 'SOLD'           // Unit sold/completed
  | 'UNAVAILABLE';   // Withdrawn or not for sale

export const UNIT_STATUS_CONFIG: Record<UnitStatus, {
  labelBm: string;
  labelEn: string;
  color: string;
  bgColor: string;
  canReserve: boolean;
}> = {
  AVAILABLE: {
    labelBm: 'Tersedia',
    labelEn: 'Available',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    canReserve: true,
  },
  RESERVED: {
    labelBm: 'Ditempah',
    labelEn: 'Reserved',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    canReserve: false,
  },
  PENDING: {
    labelBm: 'Dalam Proses',
    labelEn: 'Pending',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    canReserve: false,
  },
  SOLD: {
    labelBm: 'Terjual',
    labelEn: 'Sold',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    canReserve: false,
  },
  UNAVAILABLE: {
    labelBm: 'Tidak Tersedia',
    labelEn: 'Unavailable',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    canReserve: false,
  },
};

// =============================================================================
// UNIT TYPE
// =============================================================================

export type UnitType =
  | 'STUDIO'
  | 'ONE_BEDROOM'
  | 'TWO_BEDROOM'
  | 'THREE_BEDROOM'
  | 'PENTHOUSE'
  | 'DUPLEX'
  | 'TOWNHOUSE'
  | 'OTHER';

export const UNIT_TYPE_CONFIG: Record<UnitType, {
  labelBm: string;
  labelEn: string;
  shortLabel: string;
}> = {
  STUDIO: {
    labelBm: 'Studio',
    labelEn: 'Studio',
    shortLabel: 'Studio',
  },
  ONE_BEDROOM: {
    labelBm: '1 Bilik Tidur',
    labelEn: '1 Bedroom',
    shortLabel: '1BR',
  },
  TWO_BEDROOM: {
    labelBm: '2 Bilik Tidur',
    labelEn: '2 Bedrooms',
    shortLabel: '2BR',
  },
  THREE_BEDROOM: {
    labelBm: '3 Bilik Tidur',
    labelEn: '3 Bedrooms',
    shortLabel: '3BR',
  },
  PENTHOUSE: {
    labelBm: 'Penthouse',
    labelEn: 'Penthouse',
    shortLabel: 'PH',
  },
  DUPLEX: {
    labelBm: 'Duplex',
    labelEn: 'Duplex',
    shortLabel: 'DPX',
  },
  TOWNHOUSE: {
    labelBm: 'Townhouse',
    labelEn: 'Townhouse',
    shortLabel: 'TH',
  },
  OTHER: {
    labelBm: 'Lain-lain',
    labelEn: 'Other',
    shortLabel: 'Other',
  },
};

// =============================================================================
// PROPERTY UNIT
// =============================================================================

export interface PropertyUnit {
  id: string;

  // Property relationship
  propertyId: string;
  developerId: string;

  // Unit identification
  block?: string;              // e.g., "A", "Tower 1"
  floor: string;               // e.g., "12", "G", "P1"
  unitNumber: string;          // e.g., "03", "A-12-03"
  fullUnitCode: string;        // Generated: "A-12-03"

  // Unit details
  unitType: UnitType;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  sqm?: number;                // Auto-calculated from sqft

  // Pricing
  listPrice: number;           // RM
  bookingFee?: number;         // RM

  // Status
  status: UnitStatus;
  statusChangedAt?: string;
  statusChangedBy?: string;

  // Buyer link
  buyerHash?: string;
  caseId?: string;
  reservedAt?: string;

  // Master agent (CR-007A)
  masterAgentId?: string;

  // QR/Link tracking
  qrCodeUrl?: string;
  invitationLinkCount: number;
  scanCount: number;

  // Metadata
  features: string[];
  notes?: string;

  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// =============================================================================
// UNIT STATUS HISTORY
// =============================================================================

export interface UnitStatusHistory {
  id: string;
  unitId: string;
  previousStatus?: UnitStatus;
  newStatus: UnitStatus;
  changedBy?: string;
  changeReason?: string;
  buyerHash?: string;
  caseId?: string;
  changedAt: string;
}

// =============================================================================
// UNIT INVITATION LINK
// =============================================================================

export interface UnitInvitationLink {
  id: string;
  unitId: string;

  // Link details
  shortCode: string;           // For URL: snang.my/u/{shortCode}
  fullUrl: string;

  // Targeting
  agentId?: string;

  // Usage tracking
  clickCount: number;
  conversionCount: number;

  // Status
  isActive: boolean;
  expiresAt?: string;

  // Audit
  createdAt: string;
  createdBy?: string;
}

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface CreateUnitInput {
  propertyId: string;
  developerId: string;
  block?: string;
  floor: string;
  unitNumber: string;
  unitType: UnitType;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  listPrice: number;
  bookingFee?: number;
  masterAgentId?: string;
  features?: string[];
  notes?: string;
}

export interface UpdateUnitInput {
  unitType?: UnitType;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  listPrice?: number;
  bookingFee?: number;
  status?: UnitStatus;
  masterAgentId?: string;
  features?: string[];
  notes?: string;
}

export interface ReserveUnitInput {
  unitId: string;
  buyerHash: string;
  caseId?: string;
  reservedBy?: string;
}

export interface CreateInvitationLinkInput {
  unitId: string;
  agentId?: string;
  expiresAt?: string;
}

// =============================================================================
// UNIT STATISTICS
// =============================================================================

export interface PropertyUnitStats {
  propertyId: string;
  developerId: string;
  totalUnits: number;
  availableUnits: number;
  reservedUnits: number;
  pendingUnits: number;
  soldUnits: number;
  totalValue: number;
  soldValue: number;
  avgPrice: number;
  totalScans: number;
  totalLinks: number;
}

// =============================================================================
// UNIT BOARD (for visual grid)
// =============================================================================

export interface UnitBoardCell {
  unitNumber: string;
  status: UnitStatus;
  unitType: UnitType;
  price: number;
  buyerHash?: string;
}

export interface UnitBoardRow {
  propertyId: string;
  block?: string;
  floor: string;
  units: UnitBoardCell[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate full unit code from parts
 */
export function generateUnitCode(
  block: string | undefined,
  floor: string,
  unitNumber: string
): string {
  if (block) {
    return `${block}-${floor}-${unitNumber}`;
  }
  return `${floor}-${unitNumber}`;
}

/**
 * Convert sqft to sqm
 */
export function sqftToSqm(sqft: number): number {
  return Math.round(sqft * 0.092903 * 100) / 100;
}

/**
 * Format price in MYR
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Check if unit can be reserved
 */
export function canReserveUnit(status: UnitStatus): boolean {
  return UNIT_STATUS_CONFIG[status].canReserve;
}

/**
 * Get status display config
 */
export function getUnitStatusConfig(status: UnitStatus) {
  return UNIT_STATUS_CONFIG[status];
}

/**
 * Get unit type display config
 */
export function getUnitTypeConfig(type: UnitType) {
  return UNIT_TYPE_CONFIG[type];
}

// =============================================================================
// PROOF EVENTS
// =============================================================================

export type UnitProofEventType =
  | 'UNIT_CREATED'
  | 'UNIT_UPDATED'
  | 'UNIT_STATUS_CHANGED'
  | 'UNIT_RESERVED'
  | 'UNIT_RELEASED'
  | 'UNIT_SOLD'
  | 'INVITATION_LINK_CREATED'
  | 'INVITATION_LINK_CLICKED'
  | 'INVITATION_LINK_CONVERTED'
  | 'INVITATION_LINK_EXPIRED'
  | 'QR_SCANNED';
