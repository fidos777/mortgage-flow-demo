/**
 * Breach Types
 * Sprint 0, Session S0.6 | PRD v3.6.3 CR-010C, CR-012
 *
 * TypeScript types for PDPA breach incident management.
 * Maps to scripts/migrations/003_breach_notification_tables.sql
 */

// =============================================================================
// ENUM TYPES
// =============================================================================

/**
 * Breach severity levels
 */
export type BreachSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Breach incident status
 */
export type BreachStatus =
  | 'DETECTED'
  | 'CONFIRMED'
  | 'COMMISSIONER_NOTIFIED'
  | 'AFFECTED_NOTIFIED'
  | 'REMEDIATED'
  | 'CLOSED'
  | 'REOPENED';

/**
 * Notification delivery status
 */
export type BreachNotificationStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'ACKNOWLEDGED';

/**
 * Retention action types
 */
export type RetentionAction =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED';

/**
 * Deadline status for breach notifications
 */
export type DeadlineStatus =
  | 'ON_TRACK'
  | 'WARNING'      // <48h remaining
  | 'URGENT'       // <24h remaining
  | 'CRITICAL'     // <12h remaining
  | 'OVERDUE';     // Deadline missed

// =============================================================================
// BREACH SEVERITY CONFIG
// =============================================================================

export const BREACH_SEVERITY_CONFIG: Record<BreachSeverity, {
  label: { bm: string; en: string };
  color: string;
  deadlineHours: number;
  requiresCommissioner: boolean;
}> = {
  LOW: {
    label: { bm: 'Rendah', en: 'Low' },
    color: 'yellow',
    deadlineHours: 72,
    requiresCommissioner: false,
  },
  MEDIUM: {
    label: { bm: 'Sederhana', en: 'Medium' },
    color: 'orange',
    deadlineHours: 72,
    requiresCommissioner: true,
  },
  HIGH: {
    label: { bm: 'Tinggi', en: 'High' },
    color: 'red',
    deadlineHours: 72,
    requiresCommissioner: true,
  },
  CRITICAL: {
    label: { bm: 'Kritikal', en: 'Critical' },
    color: 'purple',
    deadlineHours: 72,
    requiresCommissioner: true,
  },
};

export const BREACH_STATUS_CONFIG: Record<BreachStatus, {
  label: { bm: string; en: string };
  description: string;
}> = {
  DETECTED: {
    label: { bm: 'Dikesan', en: 'Detected' },
    description: 'Breach detected, assessment in progress',
  },
  CONFIRMED: {
    label: { bm: 'Disahkan', en: 'Confirmed' },
    description: 'Breach confirmed, response initiated',
  },
  COMMISSIONER_NOTIFIED: {
    label: { bm: 'Pesuruhjaya Diberitahu', en: 'Commissioner Notified' },
    description: 'Reported to PDPA Commissioner',
  },
  AFFECTED_NOTIFIED: {
    label: { bm: 'Pihak Terjejas Diberitahu', en: 'Affected Notified' },
    description: 'All affected parties have been notified',
  },
  REMEDIATED: {
    label: { bm: 'Dipulihkan', en: 'Remediated' },
    description: 'Containment and remediation complete',
  },
  CLOSED: {
    label: { bm: 'Ditutup', en: 'Closed' },
    description: 'Incident closed',
  },
  REOPENED: {
    label: { bm: 'Dibuka Semula', en: 'Reopened' },
    description: 'Incident reopened due to new findings',
  },
};

// =============================================================================
// DATABASE ROW TYPES
// =============================================================================

/**
 * Breach incident database row
 */
export interface BreachIncidentRow {
  id: string;
  incident_id: string;
  title: string;
  description: string;
  breach_type: string;
  severity: BreachSeverity;
  status: BreachStatus;
  detected_at: string;
  occurred_at: string | null;
  confirmed_at: string | null;
  contained_at: string | null;
  closed_at: string | null;
  notification_deadline: string;
  deadline_met: boolean | null;
  deadline_extension_reason: string | null;
  data_types_affected: string[];
  records_affected_count: number;
  systems_affected: string[];
  root_cause: string | null;
  containment_actions: string[];
  remedial_actions: string[];
  preventive_measures: string[];
  commissioner_notified: boolean;
  commissioner_report_date: string | null;
  commissioner_reference: string | null;
  commissioner_response: string | null;
  dpo_contact: string | null;
  incident_lead: string | null;
  external_counsel: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
}

/**
 * Affected party database row
 */
export interface BreachAffectedPartyRow {
  id: string;
  incident_id: string;
  buyer_hash: string;
  consent_record_id: string | null;
  notification_status: BreachNotificationStatus;
  notification_channel: string | null;
  notification_sent_at: string | null;
  notification_delivered_at: string | null;
  notification_acknowledged_at: string | null;
  notification_failed_reason: string | null;
  data_types_exposed: string[];
  notification_content_hash: string | null;
  follow_up_required: boolean;
  follow_up_sent_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Retention schedule database row
 */
export interface RetentionScheduleRow {
  id: string;
  consent_record_id: string;
  buyer_hash: string;
  consent_type: string;
  retention_start: string;
  retention_end: string;
  retention_period_days: number;
  purge_scheduled_at: string;
  purge_action: RetentionAction;
  purge_executed_at: string | null;
  purge_result: string | null;
  legal_hold: boolean;
  legal_hold_reason: string | null;
  legal_hold_set_by: string | null;
  legal_hold_set_at: string | null;
  legal_hold_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// APPLICATION TYPES
// =============================================================================

/**
 * Breach incident (camelCase)
 */
export interface BreachIncident {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  breachType: string;
  severity: BreachSeverity;
  status: BreachStatus;
  detectedAt: string;
  occurredAt: string | null;
  confirmedAt: string | null;
  containedAt: string | null;
  closedAt: string | null;
  notificationDeadline: string;
  deadlineMet: boolean | null;
  deadlineStatus: DeadlineStatus;
  hoursRemaining: number;
  dataTypesAffected: string[];
  recordsAffectedCount: number;
  systemsAffected: string[];
  rootCause: string | null;
  containmentActions: string[];
  remedialActions: string[];
  preventiveMeasures: string[];
  commissionerNotified: boolean;
  commissionerReportDate: string | null;
  commissionerReference: string | null;
  dpoContact: string | null;
  incidentLead: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * Affected party (camelCase)
 */
export interface BreachAffectedParty {
  id: string;
  incidentId: string;
  buyerHash: string;
  consentRecordId: string | null;
  notificationStatus: BreachNotificationStatus;
  notificationChannel: string | null;
  notificationSentAt: string | null;
  notificationDeliveredAt: string | null;
  notificationAcknowledgedAt: string | null;
  notificationFailedReason: string | null;
  dataTypesExposed: string[];
  followUpRequired: boolean;
  followUpSentAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Retention schedule (camelCase)
 */
export interface RetentionSchedule {
  id: string;
  consentRecordId: string;
  buyerHash: string;
  consentType: string;
  retentionStart: string;
  retentionEnd: string;
  retentionPeriodDays: number;
  purgeScheduledAt: string;
  purgeAction: RetentionAction;
  purgeExecutedAt: string | null;
  purgeResult: string | null;
  legalHold: boolean;
  legalHoldReason: string | null;
  legalHoldSetBy: string | null;
  legalHoldSetAt: string | null;
  legalHoldExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Create breach incident input
 */
export interface CreateBreachIncidentInput {
  title: string;
  description: string;
  breachType: string;
  severity: BreachSeverity;
  detectedAt: string;
  occurredAt?: string;
  dataTypesAffected: string[];
  systemsAffected?: string[];
  dpoContact?: string;
  incidentLead?: string;
  createdBy: string;
}

/**
 * Add affected party input
 */
export interface AddAffectedPartyInput {
  incidentId: string;
  buyerHash: string;
  dataTypesExposed: string[];
  consentRecordId?: string;
}

/**
 * Update incident status input
 */
export interface UpdateIncidentStatusInput {
  incidentId: string;
  status: BreachStatus;
  updatedBy: string;
  notes?: string;
}

/**
 * Commissioner report input
 */
export interface CommissionerReportInput {
  incidentId: string;
  reportDate: string;
  reference?: string;
  reportedBy: string;
}

/**
 * Legal hold input
 */
export interface SetLegalHoldInput {
  consentRecordId: string;
  reason: string;
  setBy: string;
  expiresAt?: string;
}

// =============================================================================
// RESULT TYPES
// =============================================================================

/**
 * Breach notification result
 */
export interface BreachNotificationResult {
  total: number;
  notified: number;
  delivered: number;
  failed: number;
  pending: number;
}

/**
 * Deadline check result
 */
export interface DeadlineCheckResult {
  incidentId: string;
  incidentCode: string;
  hoursRemaining: number;
  status: DeadlineStatus;
  affectedNotNotified: number;
}

/**
 * Purge execution result
 */
export interface PurgeExecutionResult {
  purgedCount: number;
  failedCount: number;
  skippedCount: number;
}

/**
 * Retention compliance summary
 */
export interface RetentionComplianceSummary {
  consentType: string;
  totalRecords: number;
  onHold: number;
  purged: number;
  pendingPurge: number;
  failedPurge: number;
  nextScheduledPurge: string | null;
  lastPurge: string | null;
}

// =============================================================================
// TYPE CONVERTERS
// =============================================================================

/**
 * Calculate deadline status from deadline timestamp
 */
export function calculateDeadlineStatus(deadline: string): DeadlineStatus {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const hoursRemaining = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursRemaining < 0) return 'OVERDUE';
  if (hoursRemaining < 12) return 'CRITICAL';
  if (hoursRemaining < 24) return 'URGENT';
  if (hoursRemaining < 48) return 'WARNING';
  return 'ON_TRACK';
}

/**
 * Convert database row to breach incident
 */
export function toBreachIncident(row: BreachIncidentRow): BreachIncident {
  const hoursRemaining = (new Date(row.notification_deadline).getTime() - Date.now()) / (1000 * 60 * 60);

  return {
    id: row.id,
    incidentId: row.incident_id,
    title: row.title,
    description: row.description,
    breachType: row.breach_type,
    severity: row.severity,
    status: row.status,
    detectedAt: row.detected_at,
    occurredAt: row.occurred_at,
    confirmedAt: row.confirmed_at,
    containedAt: row.contained_at,
    closedAt: row.closed_at,
    notificationDeadline: row.notification_deadline,
    deadlineMet: row.deadline_met,
    deadlineStatus: calculateDeadlineStatus(row.notification_deadline),
    hoursRemaining: Math.max(0, hoursRemaining),
    dataTypesAffected: row.data_types_affected,
    recordsAffectedCount: row.records_affected_count,
    systemsAffected: row.systems_affected,
    rootCause: row.root_cause,
    containmentActions: row.containment_actions,
    remedialActions: row.remedial_actions,
    preventiveMeasures: row.preventive_measures,
    commissionerNotified: row.commissioner_notified,
    commissionerReportDate: row.commissioner_report_date,
    commissionerReference: row.commissioner_reference,
    dpoContact: row.dpo_contact,
    incidentLead: row.incident_lead,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

/**
 * Convert database row to affected party
 */
export function toBreachAffectedParty(row: BreachAffectedPartyRow): BreachAffectedParty {
  return {
    id: row.id,
    incidentId: row.incident_id,
    buyerHash: row.buyer_hash,
    consentRecordId: row.consent_record_id,
    notificationStatus: row.notification_status,
    notificationChannel: row.notification_channel,
    notificationSentAt: row.notification_sent_at,
    notificationDeliveredAt: row.notification_delivered_at,
    notificationAcknowledgedAt: row.notification_acknowledged_at,
    notificationFailedReason: row.notification_failed_reason,
    dataTypesExposed: row.data_types_exposed,
    followUpRequired: row.follow_up_required,
    followUpSentAt: row.follow_up_sent_at,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert database row to retention schedule
 */
export function toRetentionSchedule(row: RetentionScheduleRow): RetentionSchedule {
  return {
    id: row.id,
    consentRecordId: row.consent_record_id,
    buyerHash: row.buyer_hash,
    consentType: row.consent_type,
    retentionStart: row.retention_start,
    retentionEnd: row.retention_end,
    retentionPeriodDays: row.retention_period_days,
    purgeScheduledAt: row.purge_scheduled_at,
    purgeAction: row.purge_action,
    purgeExecutedAt: row.purge_executed_at,
    purgeResult: row.purge_result,
    legalHold: row.legal_hold,
    legalHoldReason: row.legal_hold_reason,
    legalHoldSetBy: row.legal_hold_set_by,
    legalHoldSetAt: row.legal_hold_set_at,
    legalHoldExpiresAt: row.legal_hold_expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * PDPA 2024 notification deadline (hours)
 */
export const BREACH_NOTIFICATION_DEADLINE_HOURS = 72;

/**
 * Common data types for breach classification
 */
export const COMMON_DATA_TYPES = [
  'IC_NUMBER',
  'PASSPORT_NUMBER',
  'SALARY_INFO',
  'BANK_ACCOUNT',
  'ADDRESS',
  'PHONE_NUMBER',
  'EMAIL',
  'EMPLOYMENT_INFO',
  'MEDICAL_RECORDS',
  'FINANCIAL_RECORDS',
  'BIOMETRIC_DATA',
  'LOCATION_DATA',
] as const;

export type CommonDataType = typeof COMMON_DATA_TYPES[number];
