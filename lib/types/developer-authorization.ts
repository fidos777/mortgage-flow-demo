// lib/types/developer-authorization.ts
// SF.1: Developer PDPA Authorization Types
// PRD v3.6.3 CR-010B — Controller-Processor clickwrap

/**
 * Authorization status lifecycle
 * PENDING → ACTIVE → EXPIRED | REVOKED | SUPERSEDED
 */
export type AuthorizationStatus =
  | 'PENDING'      // Clickwrap shown but not yet signed
  | 'ACTIVE'       // Signed and valid
  | 'EXPIRED'      // Past expiry date
  | 'REVOKED'      // Manually revoked by admin
  | 'SUPERSEDED';  // Replaced by newer version

/**
 * Acknowledgement types — Controller-Processor requirements
 * All REQUIRED for ACTIVE status (except DATA_RETENTION and AUDIT_ACCESS)
 */
export type AcknowledgementType =
  | 'NO_PII_ACCESS'             // "Saya faham saya TIDAK boleh mengakses data peribadi pembeli"
  | 'AGGREGATE_ONLY'            // "Saya hanya akan melihat data agregat"
  | 'APPOINTED_AGENTS_DECLARED' // "Saya telah melantik ejen yang disenaraikan"
  | 'DATA_RETENTION_UNDERSTOOD' // "Saya faham polisi penyimpanan data"
  | 'BREACH_REPORTING_AGREED'   // "Saya bersetuju melaporkan insiden dalam 72 jam"
  | 'AUDIT_ACCESS_GRANTED';     // "Saya memberi kebenaran audit bila diperlukan"

/**
 * Required acknowledgements for ACTIVE status
 */
export const REQUIRED_ACKNOWLEDGEMENTS: AcknowledgementType[] = [
  'NO_PII_ACCESS',
  'AGGREGATE_ONLY',
  'APPOINTED_AGENTS_DECLARED',
];

/**
 * Single acknowledgement record
 */
export interface Acknowledgement {
  agreed: boolean;
  timestamp: string;  // ISO 8601
  ip_hash?: string;
}

/**
 * Acknowledgements object — keyed by AcknowledgementType
 */
export type Acknowledgements = Partial<Record<AcknowledgementType, Acknowledgement>>;

/**
 * Appointed agent record
 */
export interface AppointedAgent {
  agent_id: string;
  name: string;
  phone: string;
  email?: string;
  appointed_at: string;  // ISO 8601
  revoked_at?: string;   // ISO 8601 if removed
}

/**
 * Developer authorization record
 */
export interface DeveloperAuthorization {
  id: string;
  developer_id: string;

  // Company Information
  company_name: string;
  ssm_number: string;
  company_address?: string;

  // Authorized Signatory
  authorized_person: string;
  authorized_email: string;
  authorized_phone?: string;
  authorized_ic_hash?: string;
  authorized_designation?: string;

  // Appointed Agents
  appointed_agents: AppointedAgent[];

  // Acknowledgements
  acknowledgements: Acknowledgements;

  // Lifecycle
  status: AuthorizationStatus;
  signed_at?: string;
  expires_at?: string;
  revoked_at?: string;
  revoked_by?: string;
  revocation_reason?: string;

  // Version
  auth_version: number;
  notice_version_id?: string;

  // Scope
  project_scope: 'all' | string[];

  // Audit
  created_at: string;
  updated_at: string;
}

/**
 * Input for creating a new authorization (PENDING status)
 */
export interface CreateAuthorizationInput {
  developer_id: string;
  company_name: string;
  ssm_number: string;
  company_address?: string;
  authorized_person: string;
  authorized_email: string;
  authorized_phone?: string;
  authorized_designation?: string;
  appointed_agents?: AppointedAgent[];
  project_scope?: 'all' | string[];
}

/**
 * Input for signing an authorization (PENDING → ACTIVE)
 */
export interface SignAuthorizationInput {
  authorization_id: string;
  acknowledgements: Acknowledgements;
  ip_hash?: string;
  validity_days?: number;  // Default: 365
}

/**
 * Input for revoking an authorization
 */
export interface RevokeAuthorizationInput {
  authorization_id: string;
  revoked_by: string;
  reason: string;
}

/**
 * Input for adding an appointed agent
 */
export interface AddAgentInput {
  authorization_id: string;
  agent_id: string;
  agent_name: string;
  agent_phone: string;
  agent_email?: string;
}

/**
 * Authorization check result
 */
export interface AuthorizationCheck {
  has_authorization: boolean;
  authorization_id?: string;
  status?: AuthorizationStatus;
  expires_at?: string;
  days_until_expiry?: number;
  missing_acknowledgements?: AcknowledgementType[];
  reason?: string;
}

/**
 * Agent appointment check result
 */
export interface AgentAppointmentCheck {
  is_appointed: boolean;
  authorization_id?: string;
  appointed_at?: string;
  reason?: string;
}

// =============================================================================
// BILINGUAL LABELS (BM/EN)
// =============================================================================

export const ACKNOWLEDGEMENT_LABELS: Record<AcknowledgementType, { bm: string; en: string }> = {
  NO_PII_ACCESS: {
    bm: 'Saya faham saya TIDAK boleh mengakses data peribadi individu pembeli (salinan IC, slip gaji, penyata bank)',
    en: 'I understand I CANNOT access individual buyer personal data (IC copies, payslips, bank statements)',
  },
  AGGREGATE_ONLY: {
    bm: 'Saya hanya akan melihat data agregat dan metrik pipeline — bukan maklumat kes individu',
    en: 'I will only view aggregate data and pipeline metrics — not individual case information',
  },
  APPOINTED_AGENTS_DECLARED: {
    bm: 'Saya telah melantik ejen hartanah yang disenaraikan untuk menguruskan kes pembeli projek saya',
    en: 'I have appointed the listed real estate agents to manage buyer cases for my project',
  },
  DATA_RETENTION_UNDERSTOOD: {
    bm: 'Saya faham data akan disimpan mengikut polisi penyimpanan platform (7 tahun untuk rekod kewangan)',
    en: 'I understand data will be retained according to platform retention policy (7 years for financial records)',
  },
  BREACH_REPORTING_AGREED: {
    bm: 'Saya bersetuju melaporkan sebarang insiden kebocoran data dalam masa 72 jam kepada platform',
    en: 'I agree to report any data breach incidents within 72 hours to the platform',
  },
  AUDIT_ACCESS_GRANTED: {
    bm: 'Saya memberi kebenaran kepada platform untuk mengaudit rekod persetujuan bila diperlukan',
    en: 'I grant the platform permission to audit consent records when required',
  },
};

export const AUTHORIZATION_STATUS_LABELS: Record<AuthorizationStatus, { bm: string; en: string }> = {
  PENDING: {
    bm: 'Menunggu Tandatangan',
    en: 'Pending Signature',
  },
  ACTIVE: {
    bm: 'Aktif',
    en: 'Active',
  },
  EXPIRED: {
    bm: 'Tamat Tempoh',
    en: 'Expired',
  },
  REVOKED: {
    bm: 'Dibatalkan',
    en: 'Revoked',
  },
  SUPERSEDED: {
    bm: 'Digantikan',
    en: 'Superseded',
  },
};

// =============================================================================
// PROOF EVENT TYPES
// =============================================================================

export type AuthorizationProofEvent =
  | 'DEVELOPER_AUTHORIZED'          // sign_authorization() succeeds
  | 'DEVELOPER_AUTH_UPDATED'        // appointed_agents changed
  | 'DEVELOPER_AUTH_EXPIRED'        // expire_authorizations() runs
  | 'DEVELOPER_AUTH_REVOKED'        // revoke_authorization() succeeds
  | 'UNAUTHORIZED_ACCESS_ATTEMPT';  // has_valid_authorization() returns false

export const AUTHORIZATION_PROOF_EVENTS: AuthorizationProofEvent[] = [
  'DEVELOPER_AUTHORIZED',
  'DEVELOPER_AUTH_UPDATED',
  'DEVELOPER_AUTH_EXPIRED',
  'DEVELOPER_AUTH_REVOKED',
  'UNAUTHORIZED_ACCESS_ATTEMPT',
];
