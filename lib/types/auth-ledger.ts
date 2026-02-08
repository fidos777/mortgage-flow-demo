/**
 * Auth Ledger Types
 * Sprint 0, Session S0.4 | PRD v3.6.3 CR-010B
 *
 * TypeScript types for developer authentication tracking.
 * Maps to scripts/migrations/002_developer_auth_ledger.sql
 */

// =============================================================================
// ENUM TYPES
// =============================================================================

/**
 * Authentication event types
 */
export type AuthEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'SESSION_EXPIRED'
  | 'SESSION_REFRESH'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_COMPLETE'
  | 'MFA_CHALLENGE'
  | 'MFA_SUCCESS'
  | 'MFA_FAILED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_REVOKED'
  | 'IMPERSONATION_START'
  | 'IMPERSONATION_END';

/**
 * Authentication provider types
 */
export type AuthProvider =
  | 'EMAIL_PASSWORD'
  | 'GOOGLE'
  | 'MICROSOFT'
  | 'APPLE'
  | 'MAGIC_LINK'
  | 'API_KEY'
  | 'SSO_SAML'
  | 'SSO_OIDC';

/**
 * Auth event categories for grouping
 */
export const AUTH_EVENT_CATEGORIES: Record<AuthEventType, string> = {
  LOGIN_SUCCESS: 'session',
  LOGIN_FAILED: 'security',
  LOGOUT: 'session',
  SESSION_EXPIRED: 'session',
  SESSION_REFRESH: 'session',
  PASSWORD_RESET_REQUEST: 'security',
  PASSWORD_RESET_COMPLETE: 'security',
  MFA_CHALLENGE: 'mfa',
  MFA_SUCCESS: 'mfa',
  MFA_FAILED: 'mfa',
  ACCOUNT_LOCKED: 'security',
  ACCOUNT_UNLOCKED: 'security',
  PERMISSION_GRANTED: 'permission',
  PERMISSION_REVOKED: 'permission',
  IMPERSONATION_START: 'admin',
  IMPERSONATION_END: 'admin',
};

// =============================================================================
// DATABASE ROW TYPES
// =============================================================================

/**
 * Database row type for developer_auth_ledger table
 */
export interface AuthLedgerRow {
  id: string;
  developer_id: string;
  developer_hash: string | null;
  event_type: AuthEventType;
  event_timestamp: string;
  session_id: string | null;
  session_start: string | null;
  session_duration_seconds: number | null;
  auth_provider: AuthProvider;
  auth_method: string | null;
  mfa_method: string | null;
  ip_hash: string | null;
  user_agent_hash: string | null;
  device_fingerprint: string | null;
  geo_region: string | null;
  risk_score: number;
  risk_factors: string[];
  is_anomalous: boolean;
  consent_record_id: string | null;
  project_id: string | null;
  case_id: string | null;
  failure_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// =============================================================================
// APPLICATION TYPES
// =============================================================================

/**
 * Auth event for application use (camelCase)
 */
export interface AuthEvent {
  id: string;
  developerId: string;
  developerHash: string | null;
  eventType: AuthEventType;
  eventTimestamp: string;
  sessionId: string | null;
  sessionStart: string | null;
  sessionDurationSeconds: number | null;
  authProvider: AuthProvider;
  authMethod: string | null;
  mfaMethod: string | null;
  ipHash: string | null;
  userAgentHash: string | null;
  deviceFingerprint: string | null;
  geoRegion: string | null;
  riskScore: number;
  riskFactors: string[];
  isAnomalous: boolean;
  consentRecordId: string | null;
  projectId: string | null;
  caseId: string | null;
  failureReason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

/**
 * Active session info
 */
export interface ActiveSession {
  developerId: string;
  sessionId: string;
  sessionStart: string;
  authProvider: AuthProvider;
  ipHash: string | null;
  geoRegion: string | null;
  lastActivity: string;
}

/**
 * Failed login attempt summary
 */
export interface FailedLoginAttempt {
  developerId: string;
  developerHash: string;
  ipHash: string;
  attemptCount: number;
  firstAttempt: string;
  lastAttempt: string;
  failureReasons: string[];
}

/**
 * Daily auth metrics
 */
export interface AuthMetricsDaily {
  metricDate: string;
  eventType: AuthEventType;
  authProvider: AuthProvider;
  eventCount: number;
  uniqueDevelopers: number;
  anomalousCount: number;
  avgRiskScore: number;
}

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Input for logging an auth event
 */
export interface LogAuthEventInput {
  developerId: string;
  eventType: AuthEventType;
  sessionId?: string;
  authProvider?: AuthProvider;
  authMethod?: string;
  mfaMethod?: string;
  ipHash?: string;
  userAgentHash?: string;
  deviceFingerprint?: string;
  geoRegion?: string;
  failureReason?: string;
  consentRecordId?: string;
  projectId?: string;
  caseId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Options for querying auth history
 */
export interface AuthHistoryOptions {
  developerId?: string;
  eventTypes?: AuthEventType[];
  startDate?: string;
  endDate?: string;
  limit?: number;
  includeAnomalousOnly?: boolean;
}

// =============================================================================
// TYPE CONVERTERS
// =============================================================================

/**
 * Convert database row to application type
 */
export function toAuthEvent(row: AuthLedgerRow): AuthEvent {
  return {
    id: row.id,
    developerId: row.developer_id,
    developerHash: row.developer_hash,
    eventType: row.event_type,
    eventTimestamp: row.event_timestamp,
    sessionId: row.session_id,
    sessionStart: row.session_start,
    sessionDurationSeconds: row.session_duration_seconds,
    authProvider: row.auth_provider,
    authMethod: row.auth_method,
    mfaMethod: row.mfa_method,
    ipHash: row.ip_hash,
    userAgentHash: row.user_agent_hash,
    deviceFingerprint: row.device_fingerprint,
    geoRegion: row.geo_region,
    riskScore: row.risk_score,
    riskFactors: row.risk_factors,
    isAnomalous: row.is_anomalous,
    consentRecordId: row.consent_record_id,
    projectId: row.project_id,
    caseId: row.case_id,
    failureReason: row.failure_reason,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

/**
 * Convert application type to database input
 */
export function toAuthLedgerInput(input: LogAuthEventInput): Partial<AuthLedgerRow> {
  return {
    developer_id: input.developerId,
    event_type: input.eventType,
    session_id: input.sessionId || null,
    auth_provider: input.authProvider || 'EMAIL_PASSWORD',
    auth_method: input.authMethod || null,
    mfa_method: input.mfaMethod || null,
    ip_hash: input.ipHash || null,
    user_agent_hash: input.userAgentHash || null,
    device_fingerprint: input.deviceFingerprint || null,
    geo_region: input.geoRegion || null,
    failure_reason: input.failureReason || null,
    consent_record_id: input.consentRecordId || null,
    project_id: input.projectId || null,
    case_id: input.caseId || null,
    metadata: input.metadata || {},
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Auth event type labels (BM + EN)
 */
export const AUTH_EVENT_LABELS: Record<AuthEventType, { bm: string; en: string }> = {
  LOGIN_SUCCESS: { bm: 'Log masuk berjaya', en: 'Login successful' },
  LOGIN_FAILED: { bm: 'Log masuk gagal', en: 'Login failed' },
  LOGOUT: { bm: 'Log keluar', en: 'Logout' },
  SESSION_EXPIRED: { bm: 'Sesi tamat tempoh', en: 'Session expired' },
  SESSION_REFRESH: { bm: 'Sesi diperbaharui', en: 'Session refreshed' },
  PASSWORD_RESET_REQUEST: { bm: 'Permintaan reset kata laluan', en: 'Password reset requested' },
  PASSWORD_RESET_COMPLETE: { bm: 'Reset kata laluan selesai', en: 'Password reset complete' },
  MFA_CHALLENGE: { bm: 'Cabaran MFA dihantar', en: 'MFA challenge sent' },
  MFA_SUCCESS: { bm: 'Pengesahan MFA berjaya', en: 'MFA verification successful' },
  MFA_FAILED: { bm: 'Pengesahan MFA gagal', en: 'MFA verification failed' },
  ACCOUNT_LOCKED: { bm: 'Akaun dikunci', en: 'Account locked' },
  ACCOUNT_UNLOCKED: { bm: 'Akaun dibuka kunci', en: 'Account unlocked' },
  PERMISSION_GRANTED: { bm: 'Kebenaran diberikan', en: 'Permission granted' },
  PERMISSION_REVOKED: { bm: 'Kebenaran dibatalkan', en: 'Permission revoked' },
  IMPERSONATION_START: { bm: 'Penyamaran dimulakan', en: 'Impersonation started' },
  IMPERSONATION_END: { bm: 'Penyamaran ditamatkan', en: 'Impersonation ended' },
};

/**
 * Auth provider labels
 */
export const AUTH_PROVIDER_LABELS: Record<AuthProvider, { bm: string; en: string }> = {
  EMAIL_PASSWORD: { bm: 'E-mel & Kata Laluan', en: 'Email & Password' },
  GOOGLE: { bm: 'Google', en: 'Google' },
  MICROSOFT: { bm: 'Microsoft', en: 'Microsoft' },
  APPLE: { bm: 'Apple', en: 'Apple' },
  MAGIC_LINK: { bm: 'Pautan Ajaib', en: 'Magic Link' },
  API_KEY: { bm: 'Kunci API', en: 'API Key' },
  SSO_SAML: { bm: 'SSO (SAML)', en: 'SSO (SAML)' },
  SSO_OIDC: { bm: 'SSO (OIDC)', en: 'SSO (OIDC)' },
};

/**
 * Common failure reasons
 */
export const FAILURE_REASONS = {
  INVALID_CREDENTIALS: 'invalid_credentials',
  ACCOUNT_DISABLED: 'account_disabled',
  ACCOUNT_LOCKED: 'account_locked',
  MFA_REQUIRED: 'mfa_required',
  MFA_INVALID: 'mfa_invalid',
  SESSION_EXPIRED: 'session_expired',
  IP_BLOCKED: 'ip_blocked',
  RATE_LIMITED: 'rate_limited',
  CONSENT_REQUIRED: 'consent_required',
} as const;

export type FailureReason = typeof FAILURE_REASONS[keyof typeof FAILURE_REASONS];
