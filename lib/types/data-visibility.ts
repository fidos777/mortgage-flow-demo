/**
 * Data Visibility Types
 * SF.3: "Who Can See What" Panel | PRD v3.6.3 CR-010B
 *
 * Defines data access matrix for transparent disclosure to buyers.
 * Maps consent purposes (C1-C6) to role-based data visibility.
 */

import type { Role } from '@/types/stakeholder';
import type { ConsentPurpose } from './consent';

// =============================================================================
// DATA CATEGORY TYPES
// =============================================================================

/**
 * Categories of buyer data that can be collected/processed
 * Aligned with C1-C6 consent purposes
 */
export type DataCategory =
  // C1: Eligibility Assessment
  | 'income'
  | 'employment'
  | 'financial_commitments'
  | 'identification'
  // C2: Document Processing
  | 'payslips'
  | 'bank_statements'
  | 'ic_copies'
  | 'employment_letters'
  // C3: Share with Agent
  | 'case_status'
  | 'readiness_signals'
  | 'phase_progress'
  // C4: Developer Analytics
  | 'aggregate_counts'
  | 'phase_distribution'
  | 'conversion_metrics'
  // C5: Communication
  | 'phone_number'
  | 'email_address'
  // C6: Promotional
  | 'project_interests';

/**
 * Data category metadata
 */
export interface DataCategoryConfig {
  category: DataCategory;
  labelEn: string;
  labelBm: string;
  descriptionEn: string;
  descriptionBm: string;
  /** Which consent purpose grants access to this data */
  consentPurpose: ConsentPurpose;
  /** Whether this is personally identifiable information */
  isPII: boolean;
  /** Sensitivity level */
  sensitivity: 'low' | 'medium' | 'high';
}

export const DATA_CATEGORY_CONFIG: Record<DataCategory, DataCategoryConfig> = {
  // C1: Eligibility Assessment
  income: {
    category: 'income',
    labelEn: 'Income Information',
    labelBm: 'Maklumat Pendapatan',
    descriptionEn: 'Monthly salary and allowances',
    descriptionBm: 'Gaji bulanan dan elaun',
    consentPurpose: 'C1_ELIGIBILITY',
    isPII: true,
    sensitivity: 'high',
  },
  employment: {
    category: 'employment',
    labelEn: 'Employment Details',
    labelBm: 'Butiran Pekerjaan',
    descriptionEn: 'Employer, position, years of service',
    descriptionBm: 'Majikan, jawatan, tahun perkhidmatan',
    consentPurpose: 'C1_ELIGIBILITY',
    isPII: true,
    sensitivity: 'medium',
  },
  financial_commitments: {
    category: 'financial_commitments',
    labelEn: 'Financial Commitments',
    labelBm: 'Komitmen Kewangan',
    descriptionEn: 'Existing loans and obligations',
    descriptionBm: 'Pinjaman dan tanggungan sedia ada',
    consentPurpose: 'C1_ELIGIBILITY',
    isPII: true,
    sensitivity: 'high',
  },
  identification: {
    category: 'identification',
    labelEn: 'Identification',
    labelBm: 'Pengenalan',
    descriptionEn: 'IC number and personal details',
    descriptionBm: 'Nombor IC dan butiran peribadi',
    consentPurpose: 'C1_ELIGIBILITY',
    isPII: true,
    sensitivity: 'high',
  },

  // C2: Document Processing
  payslips: {
    category: 'payslips',
    labelEn: 'Payslips',
    labelBm: 'Slip Gaji',
    descriptionEn: 'Monthly salary statements',
    descriptionBm: 'Penyata gaji bulanan',
    consentPurpose: 'C2_DOCUMENT_PROCESSING',
    isPII: true,
    sensitivity: 'high',
  },
  bank_statements: {
    category: 'bank_statements',
    labelEn: 'Bank Statements',
    labelBm: 'Penyata Bank',
    descriptionEn: 'Account transaction history',
    descriptionBm: 'Sejarah transaksi akaun',
    consentPurpose: 'C2_DOCUMENT_PROCESSING',
    isPII: true,
    sensitivity: 'high',
  },
  ic_copies: {
    category: 'ic_copies',
    labelEn: 'IC Copies',
    labelBm: 'Salinan IC',
    descriptionEn: 'Identity card front and back',
    descriptionBm: 'Kad pengenalan depan dan belakang',
    consentPurpose: 'C2_DOCUMENT_PROCESSING',
    isPII: true,
    sensitivity: 'high',
  },
  employment_letters: {
    category: 'employment_letters',
    labelEn: 'Employment Letters',
    labelBm: 'Surat Pengesahan Majikan',
    descriptionEn: 'Employer confirmation letters',
    descriptionBm: 'Surat pengesahan daripada majikan',
    consentPurpose: 'C2_DOCUMENT_PROCESSING',
    isPII: true,
    sensitivity: 'medium',
  },

  // C3: Share with Agent
  case_status: {
    category: 'case_status',
    labelEn: 'Case Status',
    labelBm: 'Status Kes',
    descriptionEn: 'Current application phase',
    descriptionBm: 'Fasa permohonan semasa',
    consentPurpose: 'C3_SHARE_AGENT',
    isPII: false,
    sensitivity: 'low',
  },
  readiness_signals: {
    category: 'readiness_signals',
    labelEn: 'Readiness Signals',
    labelBm: 'Isyarat Kesediaan',
    descriptionEn: 'Application readiness band (HIGH/MEDIUM/LOW)',
    descriptionBm: 'Jalur kesediaan permohonan (TINGGI/SEDERHANA/RENDAH)',
    consentPurpose: 'C3_SHARE_AGENT',
    isPII: false,
    sensitivity: 'low',
  },
  phase_progress: {
    category: 'phase_progress',
    labelEn: 'Phase Progress',
    labelBm: 'Kemajuan Fasa',
    descriptionEn: 'Progress through application phases',
    descriptionBm: 'Kemajuan melalui fasa permohonan',
    consentPurpose: 'C3_SHARE_AGENT',
    isPII: false,
    sensitivity: 'low',
  },

  // C4: Developer Analytics
  aggregate_counts: {
    category: 'aggregate_counts',
    labelEn: 'Aggregate Counts',
    labelBm: 'Kiraan Agregat',
    descriptionEn: 'Total cases per phase (no names)',
    descriptionBm: 'Jumlah kes per fasa (tanpa nama)',
    consentPurpose: 'C4_DEVELOPER_ANALYTICS',
    isPII: false,
    sensitivity: 'low',
  },
  phase_distribution: {
    category: 'phase_distribution',
    labelEn: 'Phase Distribution',
    labelBm: 'Taburan Fasa',
    descriptionEn: 'Distribution of cases across phases',
    descriptionBm: 'Taburan kes merentasi fasa',
    consentPurpose: 'C4_DEVELOPER_ANALYTICS',
    isPII: false,
    sensitivity: 'low',
  },
  conversion_metrics: {
    category: 'conversion_metrics',
    labelEn: 'Conversion Metrics',
    labelBm: 'Metrik Penukaran',
    descriptionEn: 'Phase-to-phase conversion rates',
    descriptionBm: 'Kadar penukaran fasa-ke-fasa',
    consentPurpose: 'C4_DEVELOPER_ANALYTICS',
    isPII: false,
    sensitivity: 'low',
  },

  // C5: Communication
  phone_number: {
    category: 'phone_number',
    labelEn: 'Phone Number',
    labelBm: 'Nombor Telefon',
    descriptionEn: 'Mobile number for SMS notifications',
    descriptionBm: 'Nombor telefon bimbit untuk pemberitahuan SMS',
    consentPurpose: 'C5_COMMUNICATION',
    isPII: true,
    sensitivity: 'medium',
  },
  email_address: {
    category: 'email_address',
    labelEn: 'Email Address',
    labelBm: 'Alamat E-mel',
    descriptionEn: 'Email for application updates',
    descriptionBm: 'E-mel untuk kemaskini permohonan',
    consentPurpose: 'C5_COMMUNICATION',
    isPII: true,
    sensitivity: 'medium',
  },

  // C6: Promotional
  project_interests: {
    category: 'project_interests',
    labelEn: 'Project Interests',
    labelBm: 'Minat Projek',
    descriptionEn: 'Preferred property types and locations',
    descriptionBm: 'Jenis hartanah dan lokasi pilihan',
    consentPurpose: 'C6_PROMOTIONAL',
    isPII: false,
    sensitivity: 'low',
  },
};

// =============================================================================
// ROLE-BASED DATA ACCESS MATRIX
// =============================================================================

/**
 * Access level for a data category
 */
export type AccessLevel =
  | 'full'        // Can see exact values
  | 'ranged'      // Can see ranges only (e.g., income range)
  | 'status_only' // Can see status flags only
  | 'aggregate'   // Can see aggregate/anonymous data only
  | 'none';       // Cannot see at all

/**
 * Data access entry for a role
 */
export interface DataAccessEntry {
  category: DataCategory;
  accessLevel: AccessLevel;
  /** What they actually see (for UI display) */
  visibleAsEn: string;
  visibleAsBm: string;
}

/**
 * Role-based data access matrix
 * Maps what each role can see for each data category
 */
export const ROLE_DATA_ACCESS: Record<Role, DataAccessEntry[]> = {
  buyer: [
    // Buyers see their own data in full
    { category: 'income', accessLevel: 'full', visibleAsEn: 'Your exact salary', visibleAsBm: 'Gaji sebenar anda' },
    { category: 'employment', accessLevel: 'full', visibleAsEn: 'Your employer details', visibleAsBm: 'Butiran majikan anda' },
    { category: 'financial_commitments', accessLevel: 'full', visibleAsEn: 'Your loan details', visibleAsBm: 'Butiran pinjaman anda' },
    { category: 'identification', accessLevel: 'full', visibleAsEn: 'Your IC number', visibleAsBm: 'Nombor IC anda' },
    { category: 'payslips', accessLevel: 'full', visibleAsEn: 'Your uploaded payslips', visibleAsBm: 'Slip gaji yang dimuat naik' },
    { category: 'bank_statements', accessLevel: 'full', visibleAsEn: 'Your bank statements', visibleAsBm: 'Penyata bank anda' },
    { category: 'ic_copies', accessLevel: 'full', visibleAsEn: 'Your IC images', visibleAsBm: 'Imej IC anda' },
    { category: 'employment_letters', accessLevel: 'full', visibleAsEn: 'Your employment letters', visibleAsBm: 'Surat pengesahan anda' },
    { category: 'case_status', accessLevel: 'full', visibleAsEn: 'Your case status', visibleAsBm: 'Status kes anda' },
    { category: 'readiness_signals', accessLevel: 'full', visibleAsEn: 'Your readiness band', visibleAsBm: 'Jalur kesediaan anda' },
    { category: 'phase_progress', accessLevel: 'full', visibleAsEn: 'Your progress', visibleAsBm: 'Kemajuan anda' },
    { category: 'phone_number', accessLevel: 'full', visibleAsEn: 'Your phone number', visibleAsBm: 'Nombor telefon anda' },
    { category: 'email_address', accessLevel: 'full', visibleAsEn: 'Your email', visibleAsBm: 'E-mel anda' },
  ],

  agent: [
    // Agents see limited/ranged data for assigned cases
    { category: 'income', accessLevel: 'ranged', visibleAsEn: 'Income range (e.g., RM3k-5k)', visibleAsBm: 'Julat pendapatan (cth: RM3k-5k)' },
    { category: 'employment', accessLevel: 'status_only', visibleAsEn: 'Employment type only', visibleAsBm: 'Jenis pekerjaan sahaja' },
    { category: 'financial_commitments', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
    { category: 'identification', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
    { category: 'payslips', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
    { category: 'bank_statements', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
    { category: 'ic_copies', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
    { category: 'employment_letters', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
    { category: 'case_status', accessLevel: 'full', visibleAsEn: 'Case status', visibleAsBm: 'Status kes' },
    { category: 'readiness_signals', accessLevel: 'status_only', visibleAsEn: 'Readiness band (HIGH/LOW)', visibleAsBm: 'Jalur kesediaan (TINGGI/RENDAH)' },
    { category: 'phase_progress', accessLevel: 'full', visibleAsEn: 'Phase progress', visibleAsBm: 'Kemajuan fasa' },
    { category: 'phone_number', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
    { category: 'email_address', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
  ],

  developer: [
    // Developers see aggregate data only - no individual buyer data
    { category: 'income', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
    { category: 'employment', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
    { category: 'financial_commitments', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
    { category: 'identification', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
    { category: 'payslips', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
    { category: 'bank_statements', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
    { category: 'ic_copies', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
    { category: 'employment_letters', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
    { category: 'case_status', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
    { category: 'readiness_signals', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
    { category: 'phase_progress', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
    { category: 'aggregate_counts', accessLevel: 'aggregate', visibleAsEn: 'Total counts only', visibleAsBm: 'Jumlah kiraan sahaja' },
    { category: 'phase_distribution', accessLevel: 'aggregate', visibleAsEn: 'Phase percentages', visibleAsBm: 'Peratusan fasa' },
    { category: 'conversion_metrics', accessLevel: 'aggregate', visibleAsEn: 'Conversion rates', visibleAsBm: 'Kadar penukaran' },
    { category: 'phone_number', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
    { category: 'email_address', accessLevel: 'none', visibleAsEn: 'Not visible', visibleAsBm: 'Tidak dapat dilihat' },
  ],

  system: [
    // System has processing access but doesn't "view" in user sense
    { category: 'income', accessLevel: 'full', visibleAsEn: 'Processing only', visibleAsBm: 'Pemprosesan sahaja' },
    { category: 'employment', accessLevel: 'full', visibleAsEn: 'Processing only', visibleAsBm: 'Pemprosesan sahaja' },
    { category: 'financial_commitments', accessLevel: 'full', visibleAsEn: 'Processing only', visibleAsBm: 'Pemprosesan sahaja' },
    { category: 'identification', accessLevel: 'full', visibleAsEn: 'Processing only', visibleAsBm: 'Pemprosesan sahaja' },
    { category: 'payslips', accessLevel: 'full', visibleAsEn: 'Processing only', visibleAsBm: 'Pemprosesan sahaja' },
    { category: 'bank_statements', accessLevel: 'full', visibleAsEn: 'Processing only', visibleAsBm: 'Pemprosesan sahaja' },
    { category: 'ic_copies', accessLevel: 'full', visibleAsEn: 'Processing only', visibleAsBm: 'Pemprosesan sahaja' },
    { category: 'employment_letters', accessLevel: 'full', visibleAsEn: 'Processing only', visibleAsBm: 'Pemprosesan sahaja' },
    { category: 'case_status', accessLevel: 'full', visibleAsEn: 'Processing only', visibleAsBm: 'Pemprosesan sahaja' },
    { category: 'readiness_signals', accessLevel: 'full', visibleAsEn: 'Processing only', visibleAsBm: 'Pemprosesan sahaja' },
    { category: 'phase_progress', accessLevel: 'full', visibleAsEn: 'Processing only', visibleAsBm: 'Pemprosesan sahaja' },
    { category: 'phone_number', accessLevel: 'full', visibleAsEn: 'Processing only', visibleAsBm: 'Pemprosesan sahaja' },
    { category: 'email_address', accessLevel: 'full', visibleAsEn: 'Processing only', visibleAsBm: 'Pemprosesan sahaja' },
  ],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get data access entries for a role
 */
export function getRoleDataAccess(role: Role): DataAccessEntry[] {
  return ROLE_DATA_ACCESS[role] || [];
}

/**
 * Get access level for a specific category and role
 */
export function getAccessLevel(role: Role, category: DataCategory): AccessLevel {
  const entries = ROLE_DATA_ACCESS[role];
  const entry = entries?.find(e => e.category === category);
  return entry?.accessLevel || 'none';
}

/**
 * Check if role can see any data for a category
 */
export function canRoleSeeCategory(role: Role, category: DataCategory): boolean {
  const level = getAccessLevel(role, category);
  return level !== 'none';
}

/**
 * Get all data categories for a consent purpose
 */
export function getCategoriesForPurpose(purpose: ConsentPurpose): DataCategory[] {
  return Object.values(DATA_CATEGORY_CONFIG)
    .filter(config => config.consentPurpose === purpose)
    .map(config => config.category);
}

/**
 * Get summary of what a role can see (for UI)
 */
export function getRoleAccessSummary(role: Role): {
  canSee: DataCategory[];
  cannotSee: DataCategory[];
  rangedOnly: DataCategory[];
} {
  const entries = ROLE_DATA_ACCESS[role] || [];

  return {
    canSee: entries.filter(e => e.accessLevel === 'full').map(e => e.category),
    cannotSee: entries.filter(e => e.accessLevel === 'none').map(e => e.category),
    rangedOnly: entries.filter(e => ['ranged', 'status_only', 'aggregate'].includes(e.accessLevel)).map(e => e.category),
  };
}
