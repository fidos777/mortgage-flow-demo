/**
 * PDPA Consent Types
 * Sprint 0, Session S0.1 | PRD v3.6.3 CR-010, CR-010A
 * SF.2: Consent Purposes Refactor — 4 abstract → 6 specific C1-C6
 *
 * Defines granular consent types for PDPA 2010 (Amendment 2024) compliance.
 * These types replace the deprecated CONSENT_GIVEN single-consent model.
 */

// =============================================================================
// CONSENT PURPOSE TYPES (SF.2: C1-C6 Specific Purposes)
// =============================================================================

/**
 * PRD v3.6.3 CR-010B: Specific consent purposes
 * C1-C4 are REQUIRED for loan processing
 * C5-C6 are OPTIONAL enhancements
 */
export type ConsentPurpose =
  | 'C1_ELIGIBILITY'        // Loan eligibility assessment
  | 'C2_DOCUMENT_PROCESSING' // Document verification and processing
  | 'C3_SHARE_AGENT'        // Share with appointed agent for case management
  | 'C4_DEVELOPER_ANALYTICS' // Aggregate pipeline metrics for developer (no PII)
  | 'C5_COMMUNICATION'      // Transactional notifications (SMS/email updates)
  | 'C6_PROMOTIONAL';       // Marketing/promotional communications

export const CONSENT_PURPOSES: readonly ConsentPurpose[] = [
  'C1_ELIGIBILITY',
  'C2_DOCUMENT_PROCESSING',
  'C3_SHARE_AGENT',
  'C4_DEVELOPER_ANALYTICS',
  'C5_COMMUNICATION',
  'C6_PROMOTIONAL',
] as const;

/**
 * Required vs optional purposes
 * C1-C4: Required for loan processing (blocking gate)
 * C5-C6: Optional enhancements
 */
export const REQUIRED_PURPOSES: readonly ConsentPurpose[] = [
  'C1_ELIGIBILITY',
  'C2_DOCUMENT_PROCESSING',
  'C3_SHARE_AGENT',
  'C4_DEVELOPER_ANALYTICS',
] as const;

export const OPTIONAL_PURPOSES: readonly ConsentPurpose[] = [
  'C5_COMMUNICATION',
  'C6_PROMOTIONAL',
] as const;

/**
 * Check if purpose is required
 */
export function isPurposeRequired(purpose: ConsentPurpose): boolean {
  return (REQUIRED_PURPOSES as readonly string[]).includes(purpose);
}

// =============================================================================
// CONSENT TYPES (Legacy — Backward Compatibility)
// =============================================================================

/**
 * Granular PDPA consent types (LEGACY — kept for backward compat)
 * Maps to C1-C6 purposes:
 * - PDPA_BASIC → C1, C2, C3, C4 (all required purposes)
 * - PDPA_MARKETING → C6 (promotional)
 * - PDPA_ANALYTICS → (absorbed into C4_DEVELOPER_ANALYTICS)
 * - PDPA_THIRD_PARTY → C3 (share with agent) + implicit LPPSA sharing
 */
export type ConsentType =
  | 'PDPA_BASIC'
  | 'PDPA_MARKETING'
  | 'PDPA_ANALYTICS'
  | 'PDPA_THIRD_PARTY';

export const CONSENT_TYPES: readonly ConsentType[] = [
  'PDPA_BASIC',
  'PDPA_MARKETING',
  'PDPA_ANALYTICS',
  'PDPA_THIRD_PARTY',
] as const;

/**
 * SF.2: Map legacy ConsentType to new ConsentPurpose[]
 * Used for backward compatibility during migration
 */
export const CONSENT_TYPE_TO_PURPOSES: Record<ConsentType, ConsentPurpose[]> = {
  PDPA_BASIC: ['C1_ELIGIBILITY', 'C2_DOCUMENT_PROCESSING', 'C3_SHARE_AGENT', 'C4_DEVELOPER_ANALYTICS'],
  PDPA_MARKETING: ['C6_PROMOTIONAL'],
  PDPA_ANALYTICS: ['C4_DEVELOPER_ANALYTICS'], // Absorbed into C4
  PDPA_THIRD_PARTY: ['C3_SHARE_AGENT'], // LPPSA sharing is implicit with C1
};

/**
 * SF.2: Derive legacy ConsentType from purposes
 * Used for UI display during transition
 */
export function purposesToLegacyType(purposes: ConsentPurpose[]): ConsentType[] {
  const types: ConsentType[] = [];

  // If has all required purposes → PDPA_BASIC
  const hasAllRequired = REQUIRED_PURPOSES.every(p => purposes.includes(p));
  if (hasAllRequired) types.push('PDPA_BASIC');

  // If has C6 → PDPA_MARKETING
  if (purposes.includes('C6_PROMOTIONAL')) types.push('PDPA_MARKETING');

  // C4 already covered by PDPA_BASIC, but standalone analytics possible
  if (purposes.includes('C4_DEVELOPER_ANALYTICS') && !hasAllRequired) {
    types.push('PDPA_ANALYTICS');
  }

  // C3 for third-party sharing (if standalone)
  if (purposes.includes('C3_SHARE_AGENT') && !hasAllRequired) {
    types.push('PDPA_THIRD_PARTY');
  }

  return types;
}

/**
 * SF.2: Consent purpose metadata (C1-C6)
 */
export interface ConsentPurposeConfig {
  purpose: ConsentPurpose;
  required: boolean;
  labelEn: string;
  labelBm: string;
  descriptionEn: string;
  descriptionBm: string;
  retentionYears: number;
  dataCategories: string[]; // What data is processed under this purpose
}

export const PURPOSE_CONFIG: Record<ConsentPurpose, ConsentPurposeConfig> = {
  C1_ELIGIBILITY: {
    purpose: 'C1_ELIGIBILITY',
    required: true,
    labelEn: 'Loan Eligibility Assessment',
    labelBm: 'Penilaian Kelayakan Pinjaman',
    descriptionEn: 'Process your income, employment, and financial data to calculate LPPSA loan eligibility.',
    descriptionBm: 'Memproses data pendapatan, pekerjaan, dan kewangan anda untuk mengira kelayakan pinjaman LPPSA.',
    retentionYears: 7,
    dataCategories: ['income', 'employment', 'financial_commitments', 'identification'],
  },
  C2_DOCUMENT_PROCESSING: {
    purpose: 'C2_DOCUMENT_PROCESSING',
    required: true,
    labelEn: 'Document Verification',
    labelBm: 'Pengesahan Dokumen',
    descriptionEn: 'Verify and process supporting documents (payslips, bank statements, IC copies) for loan application.',
    descriptionBm: 'Mengesahkan dan memproses dokumen sokongan (slip gaji, penyata bank, salinan IC) untuk permohonan pinjaman.',
    retentionYears: 7,
    dataCategories: ['payslips', 'bank_statements', 'ic_copies', 'employment_letters'],
  },
  C3_SHARE_AGENT: {
    purpose: 'C3_SHARE_AGENT',
    required: true,
    labelEn: 'Share with Appointed Agent',
    labelBm: 'Kongsi dengan Ejen Dilantik',
    descriptionEn: 'Allow your appointed real estate agent to view case status and assist with your application.',
    descriptionBm: 'Membenarkan ejen hartanah dilantik anda untuk melihat status kes dan membantu permohonan anda.',
    retentionYears: 7,
    dataCategories: ['case_status', 'readiness_signals', 'phase_progress'],
  },
  C4_DEVELOPER_ANALYTICS: {
    purpose: 'C4_DEVELOPER_ANALYTICS',
    required: true,
    labelEn: 'Developer Pipeline Metrics',
    labelBm: 'Metrik Pipeline Pemaju',
    descriptionEn: 'Share aggregate (non-identifiable) pipeline metrics with the project developer. No personal details shared.',
    descriptionBm: 'Kongsi metrik pipeline agregat (tanpa identiti) dengan pemaju projek. Tiada maklumat peribadi dikongsi.',
    retentionYears: 7,
    dataCategories: ['aggregate_counts', 'phase_distribution', 'conversion_metrics'],
  },
  C5_COMMUNICATION: {
    purpose: 'C5_COMMUNICATION',
    required: false,
    labelEn: 'Application Updates',
    labelBm: 'Kemaskini Permohonan',
    descriptionEn: 'Receive SMS and email notifications about your application status, deadlines, and required actions.',
    descriptionBm: 'Terima pemberitahuan SMS dan e-mel tentang status permohonan, tarikh akhir, dan tindakan diperlukan.',
    retentionYears: 2,
    dataCategories: ['phone_number', 'email_address'],
  },
  C6_PROMOTIONAL: {
    purpose: 'C6_PROMOTIONAL',
    required: false,
    labelEn: 'Promotional Communications',
    labelBm: 'Komunikasi Promosi',
    descriptionEn: 'Receive updates about new projects, special offers, and mortgage tips from developers and partners.',
    descriptionBm: 'Terima maklumat tentang projek baharu, tawaran istimewa, dan tip gadai janji daripada pemaju dan rakan kongsi.',
    retentionYears: 2,
    dataCategories: ['phone_number', 'email_address', 'project_interests'],
  },
};

/**
 * Consent type metadata (LEGACY — kept for backward compat)
 */
export interface ConsentTypeConfig {
  type: ConsentType;
  required: boolean;
  labelEn: string;
  labelBm: string;
  descriptionEn: string;
  descriptionBm: string;
  retentionYears: number;
  /** SF.2: Maps to new purpose codes */
  mappedPurposes: ConsentPurpose[];
}

export const CONSENT_CONFIG: Record<ConsentType, ConsentTypeConfig> = {
  PDPA_BASIC: {
    type: 'PDPA_BASIC',
    required: true,
    labelEn: 'Basic Data Processing',
    labelBm: 'Pemprosesan Data Asas',
    descriptionEn: 'Required for loan eligibility assessment. We process your identification, financial, and property information.',
    descriptionBm: 'Diperlukan untuk penilaian kelayakan pinjaman. Kami memproses maklumat pengenalan, kewangan, dan hartanah anda.',
    retentionYears: 7,
    mappedPurposes: ['C1_ELIGIBILITY', 'C2_DOCUMENT_PROCESSING', 'C3_SHARE_AGENT', 'C4_DEVELOPER_ANALYTICS'],
  },
  PDPA_MARKETING: {
    type: 'PDPA_MARKETING',
    required: false,
    labelEn: 'Marketing Communications',
    labelBm: 'Komunikasi Pemasaran',
    descriptionEn: 'Receive updates about new projects, promotions, and mortgage tips via SMS, email, or WhatsApp.',
    descriptionBm: 'Terima maklumat tentang projek baharu, promosi, dan tip gadai janji melalui SMS, e-mel, atau WhatsApp.',
    retentionYears: 2,
    mappedPurposes: ['C6_PROMOTIONAL'],
  },
  PDPA_ANALYTICS: {
    type: 'PDPA_ANALYTICS',
    required: false,
    labelEn: 'Usage Analytics',
    labelBm: 'Analitik Penggunaan',
    descriptionEn: 'Help us improve our service by allowing anonymous usage analytics.',
    descriptionBm: 'Bantu kami meningkatkan perkhidmatan dengan membenarkan analitik penggunaan tanpa nama.',
    retentionYears: 1,
    mappedPurposes: ['C4_DEVELOPER_ANALYTICS'],
  },
  PDPA_THIRD_PARTY: {
    type: 'PDPA_THIRD_PARTY',
    required: false, // Becomes required at submission stage
    labelEn: 'Third-Party Sharing',
    labelBm: 'Perkongsian Pihak Ketiga',
    descriptionEn: 'Share your application data with LPPSA and partner banks for loan processing.',
    descriptionBm: 'Kongsi data permohonan anda dengan LPPSA dan bank rakan kongsi untuk pemprosesan pinjaman.',
    retentionYears: 7,
    mappedPurposes: ['C3_SHARE_AGENT'],
  },
};

// =============================================================================
// CONSENT RECORD TYPES
// =============================================================================

/**
 * Methods for capturing consent
 */
export type ConsentCaptureMethod = 'WEB_FORM' | 'API' | 'IMPORT';

/**
 * Consent record as stored in database
 * SF.2: Added purposes JSONB field for C1-C6 tracking
 */
export interface ConsentRecord {
  id: string;
  buyerHash: string;
  consentType: ConsentType;
  grantedAt: string; // ISO timestamp
  expiresAt: string | null;
  revokedAt: string | null;
  retentionPeriod: string | null; // PostgreSQL INTERVAL as string
  consentVersion: string;
  ipHash: string | null;
  userAgentHash: string | null;
  captureMethod: ConsentCaptureMethod;
  proofEventId: string | null;
  createdAt: string;
  updatedAt: string;
  /** SF.2: Specific purposes granted under this consent type */
  purposes?: ConsentPurpose[];
}

/**
 * SF.2: Purpose-specific consent record
 * Used for granular purpose tracking
 */
export interface PurposeConsent {
  purpose: ConsentPurpose;
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string;
}

/**
 * Input for granting consent
 */
export interface GrantConsentInput {
  buyerHash: string;
  consentType: ConsentType;
  consentVersion: string;
  ipHash?: string;
  userAgentHash?: string;
  captureMethod?: ConsentCaptureMethod;
  expiresAt?: string; // ISO timestamp
}

/**
 * Input for revoking consent
 */
export interface RevokeConsentInput {
  buyerHash: string;
  consentType: ConsentType;
  reason?: string;
  ipHash?: string;
}

/**
 * Batch consent grant (for consent gate submission)
 */
export interface BatchConsentInput {
  buyerHash: string;
  consents: {
    type: ConsentType;
    granted: boolean;
  }[];
  consentVersion: string;
  ipHash?: string;
  userAgentHash?: string;
}

// =============================================================================
// PDPA NOTICE VERSION TYPES
// =============================================================================

/**
 * PDPA notice version as stored in database
 */
export interface PDPANoticeVersion {
  version: string;
  contentBm: string;
  contentEn: string;
  summaryBm: string | null;
  summaryEn: string | null;
  effectiveFrom: string; // ISO timestamp
  supersededAt: string | null;
  changeReason: string | null;
  approvedBy: string | null;
  createdAt: string;
  createdBy: string;
}

/**
 * Notice version for UI display
 */
export interface PDPANoticeDisplay {
  version: string;
  content: string; // BM or EN based on locale
  summary: string | null;
  effectiveFrom: string;
}

// =============================================================================
// CONSENT STATUS TYPES
// =============================================================================

/**
 * Buyer consent status summary
 */
export interface BuyerConsentStatus {
  buyerHash: string;
  hasBasic: boolean;
  hasMarketing: boolean;
  hasAnalytics: boolean;
  hasThirdParty: boolean;
  activeConsentCount: number;
  firstConsentAt: string | null;
  latestConsentAt: string | null;
  canProceed: boolean; // True if PDPA_BASIC is granted
}

/**
 * Consent check result for a specific type
 */
export interface ConsentCheckResult {
  consentType: ConsentType;
  hasConsent: boolean;
  grantedAt: string | null;
  expiresAt: string | null;
  consentVersion: string | null;
}

// =============================================================================
// AUDIT LOG TYPES
// =============================================================================

/**
 * Consent audit actions
 */
export type ConsentAuditAction =
  | 'GRANTED'
  | 'REVOKED'
  | 'EXPIRED'
  | 'RENEWED'
  | 'MIGRATED';

/**
 * Consent audit log entry
 */
export interface ConsentAuditEntry {
  id: string;
  consentId: string;
  buyerHash: string;
  consentType: ConsentType;
  action: ConsentAuditAction;
  performedAt: string;
  performedBy: string;
  ipHash: string | null;
  reason: string | null;
  stateSnapshot: Record<string, unknown>;
}

// =============================================================================
// PROOF EVENT TYPES (for integration with Epic 5)
// =============================================================================

/**
 * Granular proof event types replacing CONSENT_GIVEN
 */
export type ConsentProofEventType =
  | 'PDPA_BASIC_GRANTED'
  | 'PDPA_MARKETING_GRANTED'
  | 'PDPA_ANALYTICS_GRANTED'
  | 'PDPA_THIRD_PARTY_GRANTED'
  | 'PDPA_BASIC_REVOKED'
  | 'PDPA_MARKETING_REVOKED'
  | 'PDPA_ANALYTICS_REVOKED'
  | 'PDPA_THIRD_PARTY_REVOKED'
  // SF.2: Purpose-specific events
  | 'PURPOSE_C1_ELIGIBILITY_GRANTED'
  | 'PURPOSE_C2_DOCUMENT_PROCESSING_GRANTED'
  | 'PURPOSE_C3_SHARE_AGENT_GRANTED'
  | 'PURPOSE_C4_DEVELOPER_ANALYTICS_GRANTED'
  | 'PURPOSE_C5_COMMUNICATION_GRANTED'
  | 'PURPOSE_C6_PROMOTIONAL_GRANTED'
  | 'PURPOSE_C1_ELIGIBILITY_REVOKED'
  | 'PURPOSE_C2_DOCUMENT_PROCESSING_REVOKED'
  | 'PURPOSE_C3_SHARE_AGENT_REVOKED'
  | 'PURPOSE_C4_DEVELOPER_ANALYTICS_REVOKED'
  | 'PURPOSE_C5_COMMUNICATION_REVOKED'
  | 'PURPOSE_C6_PROMOTIONAL_REVOKED';

/**
 * Map consent type to proof event type
 */
export const CONSENT_TO_PROOF_EVENT: Record<ConsentType, ConsentProofEventType> = {
  PDPA_BASIC: 'PDPA_BASIC_GRANTED',
  PDPA_MARKETING: 'PDPA_MARKETING_GRANTED',
  PDPA_ANALYTICS: 'PDPA_ANALYTICS_GRANTED',
  PDPA_THIRD_PARTY: 'PDPA_THIRD_PARTY_GRANTED',
};

/**
 * Map consent type to revocation proof event type
 */
export const REVOKE_TO_PROOF_EVENT: Record<ConsentType, ConsentProofEventType> = {
  PDPA_BASIC: 'PDPA_BASIC_REVOKED',
  PDPA_MARKETING: 'PDPA_MARKETING_REVOKED',
  PDPA_ANALYTICS: 'PDPA_ANALYTICS_REVOKED',
  PDPA_THIRD_PARTY: 'PDPA_THIRD_PARTY_REVOKED',
};

/**
 * SF.2: Map purpose to proof event type
 */
export const PURPOSE_TO_PROOF_EVENT: Record<ConsentPurpose, ConsentProofEventType> = {
  C1_ELIGIBILITY: 'PURPOSE_C1_ELIGIBILITY_GRANTED',
  C2_DOCUMENT_PROCESSING: 'PURPOSE_C2_DOCUMENT_PROCESSING_GRANTED',
  C3_SHARE_AGENT: 'PURPOSE_C3_SHARE_AGENT_GRANTED',
  C4_DEVELOPER_ANALYTICS: 'PURPOSE_C4_DEVELOPER_ANALYTICS_GRANTED',
  C5_COMMUNICATION: 'PURPOSE_C5_COMMUNICATION_GRANTED',
  C6_PROMOTIONAL: 'PURPOSE_C6_PROMOTIONAL_GRANTED',
};

/**
 * SF.2: Map purpose to revocation proof event type
 */
export const PURPOSE_REVOKE_TO_PROOF_EVENT: Record<ConsentPurpose, ConsentProofEventType> = {
  C1_ELIGIBILITY: 'PURPOSE_C1_ELIGIBILITY_REVOKED',
  C2_DOCUMENT_PROCESSING: 'PURPOSE_C2_DOCUMENT_PROCESSING_REVOKED',
  C3_SHARE_AGENT: 'PURPOSE_C3_SHARE_AGENT_REVOKED',
  C4_DEVELOPER_ANALYTICS: 'PURPOSE_C4_DEVELOPER_ANALYTICS_REVOKED',
  C5_COMMUNICATION: 'PURPOSE_C5_COMMUNICATION_REVOKED',
  C6_PROMOTIONAL: 'PURPOSE_C6_PROMOTIONAL_REVOKED',
};

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Database row to TypeScript mapping utilities
 * SF.2: Added purposes JSONB field
 */
export interface ConsentRecordRow {
  id: string;
  buyer_hash: string;
  consent_type: string;
  granted_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  retention_period: string | null;
  consent_version: string;
  ip_hash: string | null;
  user_agent_hash: string | null;
  capture_method: string;
  proof_event_id: string | null;
  created_at: string;
  updated_at: string;
  /** SF.2: Specific purposes granted (JSONB array) */
  purposes: string[] | null;
}

/**
 * Convert database row to TypeScript object
 * SF.2: Includes purposes mapping
 */
export function toConsentRecord(row: ConsentRecordRow): ConsentRecord {
  return {
    id: row.id,
    buyerHash: row.buyer_hash,
    consentType: row.consent_type as ConsentType,
    grantedAt: row.granted_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    retentionPeriod: row.retention_period,
    consentVersion: row.consent_version,
    ipHash: row.ip_hash,
    userAgentHash: row.user_agent_hash,
    captureMethod: row.capture_method as ConsentCaptureMethod,
    proofEventId: row.proof_event_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    purposes: row.purposes as ConsentPurpose[] | undefined,
  };
}

export interface PDPANoticeRow {
  version: string;
  content_bm: string;
  content_en: string;
  summary_bm: string | null;
  summary_en: string | null;
  effective_from: string;
  superseded_at: string | null;
  change_reason: string | null;
  approved_by: string | null;
  created_at: string;
  created_by: string;
}

export function toPDPANoticeVersion(row: PDPANoticeRow): PDPANoticeVersion {
  return {
    version: row.version,
    contentBm: row.content_bm,
    contentEn: row.content_en,
    summaryBm: row.summary_bm,
    summaryEn: row.summary_en,
    effectiveFrom: row.effective_from,
    supersededAt: row.superseded_at,
    changeReason: row.change_reason,
    approvedBy: row.approved_by,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}
