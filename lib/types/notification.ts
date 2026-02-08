/**
 * Notification Types
 * Sprint 0, Session S0.5 | PRD v3.6.3 CR-011
 *
 * Message classification system for PDPA-compliant communications.
 *
 * Three-Class System:
 * - TRANSACTIONAL: Required for service delivery (PDPA_BASIC)
 * - OPERATIONAL: Necessary for workflow (PDPA_BASIC)
 * - MARKETING: Promotional content (PDPA_MARKETING required)
 *
 * Bundle Rule: ANY promotional content in a message reclassifies
 * the entire message as MARKETING.
 */

// =============================================================================
// MESSAGE CLASSIFICATION
// =============================================================================

/**
 * Message class determines consent requirement
 */
export type MessageClass = 'TRANSACTIONAL' | 'OPERATIONAL' | 'MARKETING';

/**
 * Consent required per message class
 */
export const MESSAGE_CLASS_CONSENT: Record<MessageClass, 'PDPA_BASIC' | 'PDPA_MARKETING'> = {
  TRANSACTIONAL: 'PDPA_BASIC',
  OPERATIONAL: 'PDPA_BASIC',
  MARKETING: 'PDPA_MARKETING',
};

/**
 * Message class descriptions (BM + EN)
 */
export const MESSAGE_CLASS_LABELS: Record<MessageClass, { bm: string; en: string; description: string }> = {
  TRANSACTIONAL: {
    bm: 'Transaksi',
    en: 'Transactional',
    description: 'Required for service delivery - receipts, confirmations, status updates',
  },
  OPERATIONAL: {
    bm: 'Operasi',
    en: 'Operational',
    description: 'Necessary for workflow - document requests, reminders, action items',
  },
  MARKETING: {
    bm: 'Pemasaran',
    en: 'Marketing',
    description: 'Promotional content - offers, campaigns, cross-sell',
  },
};

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

/**
 * Notification channel
 */
export type NotificationChannel = 'WHATSAPP' | 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP';

/**
 * Notification status
 */
export type NotificationStatus =
  | 'PENDING'           // Queued for dispatch
  | 'CONSENT_BLOCKED'   // Blocked due to missing consent
  | 'DISPATCHED'        // Sent to channel
  | 'DELIVERED'         // Confirmed delivery
  | 'READ'              // User opened/read
  | 'FAILED'            // Delivery failed
  | 'EXPIRED';          // TTL expired before delivery

/**
 * Predefined notification templates
 */
export type NotificationTemplate =
  // Transactional
  | 'CASE_CREATED'
  | 'DOCUMENT_RECEIVED'
  | 'READINESS_RESULT'
  | 'SUBMISSION_CONFIRMED'
  | 'TAC_SCHEDULED'
  | 'TAC_REMINDER'
  | 'PHASE_CHANGED'
  // Operational
  | 'REQUEST_MISSING_DOCS'
  | 'KJ_VERIFICATION_NEEDED'
  | 'ACTION_REQUIRED'
  | 'DEADLINE_REMINDER'
  | 'QUERY_SIGNALS_DETECTED'
  // Marketing
  | 'PROMOTION_OFFER'
  | 'CROSS_SELL'
  | 'SURVEY_REQUEST'
  | 'NEWSLETTER'
  // Breach (Special)
  | 'PDPA_BREACH_NOTIFICATION';

/**
 * Template to message class mapping
 */
export const TEMPLATE_CLASS: Record<NotificationTemplate, MessageClass> = {
  // Transactional - service delivery essentials
  CASE_CREATED: 'TRANSACTIONAL',
  DOCUMENT_RECEIVED: 'TRANSACTIONAL',
  READINESS_RESULT: 'TRANSACTIONAL',
  SUBMISSION_CONFIRMED: 'TRANSACTIONAL',
  TAC_SCHEDULED: 'TRANSACTIONAL',
  TAC_REMINDER: 'TRANSACTIONAL',
  PHASE_CHANGED: 'TRANSACTIONAL',
  // Operational - workflow necessities (PRD: RequestMissingDocsCTA = OPERATIONAL)
  REQUEST_MISSING_DOCS: 'OPERATIONAL',
  KJ_VERIFICATION_NEEDED: 'OPERATIONAL',
  ACTION_REQUIRED: 'OPERATIONAL',
  DEADLINE_REMINDER: 'OPERATIONAL',
  QUERY_SIGNALS_DETECTED: 'OPERATIONAL',
  // Marketing - promotional content
  PROMOTION_OFFER: 'MARKETING',
  CROSS_SELL: 'MARKETING',
  SURVEY_REQUEST: 'MARKETING',
  NEWSLETTER: 'MARKETING',
  // Breach - special category (always allowed for compliance)
  PDPA_BREACH_NOTIFICATION: 'TRANSACTIONAL', // Mandatory, no consent block
};

// =============================================================================
// NOTIFICATION RECORD
// =============================================================================

/**
 * Database row type for notifications
 */
export interface NotificationRow {
  id: string;
  // Recipient
  buyer_hash: string;
  recipient_phone_hash: string | null;
  recipient_email_hash: string | null;
  // Content
  template: NotificationTemplate;
  message_class: MessageClass;
  channel: NotificationChannel;
  subject: string | null;
  body_preview: string;
  // Consent tracking
  consent_type_required: 'PDPA_BASIC' | 'PDPA_MARKETING';
  consent_verified_at: string | null;
  consent_record_id: string | null;
  // Status
  status: NotificationStatus;
  dispatched_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  // Context
  case_id: string | null;
  project_id: string | null;
  // Metadata
  metadata: Record<string, unknown>;
  // Audit
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

/**
 * Application type for notification (camelCase)
 */
export interface Notification {
  id: string;
  buyerHash: string;
  recipientPhoneHash: string | null;
  recipientEmailHash: string | null;
  template: NotificationTemplate;
  messageClass: MessageClass;
  channel: NotificationChannel;
  subject: string | null;
  bodyPreview: string;
  consentTypeRequired: 'PDPA_BASIC' | 'PDPA_MARKETING';
  consentVerifiedAt: string | null;
  consentRecordId: string | null;
  status: NotificationStatus;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  caseId: string | null;
  projectId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Input for sending a notification
 */
export interface SendNotificationInput {
  buyerHash: string;
  template: NotificationTemplate;
  channel: NotificationChannel;
  // Content overrides (optional - templates have defaults)
  subject?: string;
  body?: string;
  // Context
  caseId?: string;
  projectId?: string;
  // Personalization
  variables?: Record<string, string>;
  // Options
  skipConsentCheck?: boolean;  // Only for system/breach notifications
  expiresAt?: string;          // TTL for time-sensitive messages
  metadata?: Record<string, unknown>;
}

/**
 * Result of send attempt
 */
export interface SendNotificationResult {
  success: boolean;
  notificationId: string | null;
  status: NotificationStatus;
  blockedReason?: string;
  consentMissing?: 'PDPA_BASIC' | 'PDPA_MARKETING';
}

/**
 * Batch send input
 */
export interface BatchSendInput {
  notifications: SendNotificationInput[];
  // Global options
  stopOnFirstBlock?: boolean;
}

/**
 * Batch send result
 */
export interface BatchSendResult {
  total: number;
  sent: number;
  blocked: number;
  failed: number;
  results: SendNotificationResult[];
}

// =============================================================================
// BREACH NOTIFICATION (72h Scaffold)
// =============================================================================

/**
 * PDPA breach severity
 */
export type BreachSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Breach notification input
 */
export interface BreachNotificationInput {
  // Affected parties
  affectedBuyerHashes: string[];
  // Breach details
  breachType: string;
  breachDescription: string;
  breachDetectedAt: string;
  breachOccurredAt?: string;
  dataTypesAffected: string[];
  severity: BreachSeverity;
  // Response
  remedialActions: string[];
  contactInfo: string;
  // Regulatory
  reportedToCommissioner: boolean;
  commissionerReportDate?: string;
  // Metadata
  incidentId: string;
}

/**
 * Breach notification tracking
 */
export interface BreachNotificationRecord {
  id: string;
  incidentId: string;
  buyerHash: string;
  notificationId: string;
  severity: BreachSeverity;
  notifiedAt: string;
  deliveredAt: string | null;
  acknowledgedAt: string | null;
  metadata: Record<string, unknown>;
}

// =============================================================================
// TYPE CONVERTERS
// =============================================================================

/**
 * Convert database row to application type
 */
export function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    buyerHash: row.buyer_hash,
    recipientPhoneHash: row.recipient_phone_hash,
    recipientEmailHash: row.recipient_email_hash,
    template: row.template,
    messageClass: row.message_class,
    channel: row.channel,
    subject: row.subject,
    bodyPreview: row.body_preview,
    consentTypeRequired: row.consent_type_required,
    consentVerifiedAt: row.consent_verified_at,
    consentRecordId: row.consent_record_id,
    status: row.status,
    dispatchedAt: row.dispatched_at,
    deliveredAt: row.delivered_at,
    readAt: row.read_at,
    failedAt: row.failed_at,
    failureReason: row.failure_reason,
    caseId: row.case_id,
    projectId: row.project_id,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get message class for a template
 */
export function getTemplateClass(template: NotificationTemplate): MessageClass {
  return TEMPLATE_CLASS[template];
}

/**
 * Get required consent for a message class
 */
export function getRequiredConsent(messageClass: MessageClass): 'PDPA_BASIC' | 'PDPA_MARKETING' {
  return MESSAGE_CLASS_CONSENT[messageClass];
}

/**
 * Check if template requires marketing consent
 */
export function requiresMarketingConsent(template: NotificationTemplate): boolean {
  return TEMPLATE_CLASS[template] === 'MARKETING';
}

/**
 * Apply bundle rule: if content has promotional elements, reclassify to MARKETING
 */
export function applyBundleRule(
  baseClass: MessageClass,
  hasPromotionalContent: boolean
): MessageClass {
  if (hasPromotionalContent && baseClass !== 'MARKETING') {
    return 'MARKETING';
  }
  return baseClass;
}

/**
 * Check if notification is a breach notification (special handling)
 */
export function isBreachNotification(template: NotificationTemplate): boolean {
  return template === 'PDPA_BREACH_NOTIFICATION';
}
