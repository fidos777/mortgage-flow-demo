/**
 * Notification Service
 * Sprint 0, Session S0.5 | PRD v3.6.3 CR-011
 *
 * Consent-aware notification dispatch service.
 * Enforces PDPA compliance by checking consent before sending.
 *
 * Key Features:
 * - Message classification (TRANSACTIONAL, OPERATIONAL, MARKETING)
 * - Consent verification before dispatch
 * - Bundle rule enforcement
 * - 72h breach notification scaffold
 * - Audit trail for all send attempts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getServiceMode } from './index';
import { getConsentService } from './consent-service';
import { getTelemetryService } from './telemetry-service';
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
  NotificationTemplate,
  MessageClass,
  SendNotificationInput,
  SendNotificationResult,
  BatchSendInput,
  BatchSendResult,
  BreachNotificationInput,
  BreachNotificationRecord,
  TEMPLATE_CLASS,
  MESSAGE_CLASS_CONSENT,
  getTemplateClass,
  getRequiredConsent,
  applyBundleRule,
  isBreachNotification,
} from '../types/notification';
import { ConsentType } from '../types/consent';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Breach notification deadline (72 hours per PDPA 2024)
const BREACH_NOTIFICATION_DEADLINE_HOURS = 72;

// =============================================================================
// NOTIFICATION SERVICE CLASS
// =============================================================================

export class NotificationService {
  private supabase: SupabaseClient | null = null;
  private mockNotifications: Notification[] = [];
  private mockBreachRecords: BreachNotificationRecord[] = [];

  constructor() {
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    }
  }

  // ===========================================================================
  // CONSENT VERIFICATION
  // ===========================================================================

  /**
   * Check if buyer has required consent for a message class
   */
  async verifyConsent(
    buyerHash: string,
    messageClass: MessageClass
  ): Promise<{ hasConsent: boolean; consentType: ConsentType; consentRecordId?: string }> {
    const consentService = getConsentService();
    const requiredConsent = getRequiredConsent(messageClass);

    // Check consent
    const hasConsent = await consentService.hasConsent(buyerHash, requiredConsent);

    return {
      hasConsent,
      consentType: requiredConsent,
      consentRecordId: undefined, // Would be populated from actual consent check
    };
  }

  /**
   * Determine final message class after bundle rule
   */
  determineMessageClass(
    template: NotificationTemplate,
    hasPromotionalContent: boolean = false
  ): MessageClass {
    const baseClass = getTemplateClass(template);
    return applyBundleRule(baseClass, hasPromotionalContent);
  }

  // ===========================================================================
  // SEND NOTIFICATION
  // ===========================================================================

  /**
   * Send a single notification with consent check
   */
  async send(input: SendNotificationInput): Promise<SendNotificationResult> {
    const mode = getServiceMode();

    // Determine message class
    const hasPromo = this.detectPromotionalContent(input.body || '');
    const messageClass = this.determineMessageClass(input.template, hasPromo);
    const requiredConsent = getRequiredConsent(messageClass);

    // Skip consent check for breach notifications (mandatory compliance)
    const isBreach = isBreachNotification(input.template);

    // Verify consent (unless skipped or breach)
    if (!input.skipConsentCheck && !isBreach) {
      const consentCheck = await this.verifyConsent(input.buyerHash, messageClass);

      if (!consentCheck.hasConsent) {
        // Log blocked attempt
        await this.logBlockedNotification(input, messageClass, requiredConsent);

        return {
          success: false,
          notificationId: null,
          status: 'CONSENT_BLOCKED',
          blockedReason: `Missing ${requiredConsent} consent`,
          consentMissing: requiredConsent,
        };
      }
    }

    // Create notification record
    const notification = await this.createNotification(input, messageClass);

    if (!notification) {
      return {
        success: false,
        notificationId: null,
        status: 'FAILED',
        blockedReason: 'Failed to create notification record',
      };
    }

    // Dispatch to channel (mock in demo mode)
    const dispatched = await this.dispatchToChannel(notification, input.channel);

    // Update status
    const finalStatus: NotificationStatus = dispatched ? 'DISPATCHED' : 'FAILED';
    await this.updateNotificationStatus(notification.id, finalStatus);

    // Log telemetry
    const telemetry = getTelemetryService();
    await telemetry.logEvent({
      eventType: 'LINK_CREATED', // Reusing existing type for notification tracking
      role: 'system',
      caseId: input.caseId,
      projectId: input.projectId,
      metadata: {
        notificationType: 'message_sent',
        template: input.template,
        messageClass,
        channel: input.channel,
        status: finalStatus,
      },
    });

    return {
      success: dispatched,
      notificationId: notification.id,
      status: finalStatus,
    };
  }

  /**
   * Send multiple notifications
   */
  async sendBatch(input: BatchSendInput): Promise<BatchSendResult> {
    const results: SendNotificationResult[] = [];
    let sent = 0;
    let blocked = 0;
    let failed = 0;

    for (const notification of input.notifications) {
      const result = await this.send(notification);
      results.push(result);

      if (result.success) {
        sent++;
      } else if (result.status === 'CONSENT_BLOCKED') {
        blocked++;
        if (input.stopOnFirstBlock) break;
      } else {
        failed++;
      }
    }

    return {
      total: input.notifications.length,
      sent,
      blocked,
      failed,
      results,
    };
  }

  // ===========================================================================
  // BREACH NOTIFICATION (72h Scaffold)
  // ===========================================================================

  /**
   * Send breach notifications to affected parties
   * PDPA 2024 requires notification within 72 hours
   */
  async sendBreachNotifications(
    input: BreachNotificationInput
  ): Promise<{
    success: boolean;
    notificationsSent: number;
    deadline: string;
    records: BreachNotificationRecord[];
  }> {
    const records: BreachNotificationRecord[] = [];
    let notificationsSent = 0;

    // Calculate 72h deadline from detection
    const detectedAt = new Date(input.breachDetectedAt);
    const deadline = new Date(detectedAt.getTime() + BREACH_NOTIFICATION_DEADLINE_HOURS * 60 * 60 * 1000);

    // Check if within deadline
    const now = new Date();
    const isWithinDeadline = now < deadline;

    if (!isWithinDeadline) {
      console.warn('[NotificationService] BREACH DEADLINE EXCEEDED - notifications still being sent but compliance may be affected');
    }

    // Send notification to each affected buyer
    for (const buyerHash of input.affectedBuyerHashes) {
      // Breach notifications skip consent check (mandatory compliance)
      const result = await this.send({
        buyerHash,
        template: 'PDPA_BREACH_NOTIFICATION',
        channel: 'EMAIL', // Primary channel for breach
        subject: `[PENTING] Notis Pelanggaran Data Peribadi | Personal Data Breach Notice`,
        body: this.generateBreachNotificationBody(input),
        skipConsentCheck: true, // Mandatory notification
        metadata: {
          incidentId: input.incidentId,
          severity: input.severity,
          breachType: input.breachType,
        },
      });

      if (result.success && result.notificationId) {
        notificationsSent++;

        const record: BreachNotificationRecord = {
          id: `breach-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          incidentId: input.incidentId,
          buyerHash,
          notificationId: result.notificationId,
          severity: input.severity,
          notifiedAt: new Date().toISOString(),
          deliveredAt: null,
          acknowledgedAt: null,
          metadata: {
            breachType: input.breachType,
            dataTypesAffected: input.dataTypesAffected,
          },
        };

        records.push(record);
        this.mockBreachRecords.push(record);
      }
    }

    return {
      success: notificationsSent > 0,
      notificationsSent,
      deadline: deadline.toISOString(),
      records,
    };
  }

  /**
   * Get breach notification status for an incident
   */
  async getBreachNotificationStatus(incidentId: string): Promise<{
    totalAffected: number;
    notified: number;
    delivered: number;
    acknowledged: number;
    records: BreachNotificationRecord[];
  }> {
    const records = this.mockBreachRecords.filter((r) => r.incidentId === incidentId);

    return {
      totalAffected: records.length,
      notified: records.length,
      delivered: records.filter((r) => r.deliveredAt !== null).length,
      acknowledged: records.filter((r) => r.acknowledgedAt !== null).length,
      records,
    };
  }

  // ===========================================================================
  // QUERY METHODS
  // ===========================================================================

  /**
   * Get notifications for a buyer
   */
  async getNotificationsForBuyer(
    buyerHash: string,
    options?: { limit?: number; status?: NotificationStatus }
  ): Promise<Notification[]> {
    let notifications = this.mockNotifications.filter((n) => n.buyerHash === buyerHash);

    if (options?.status) {
      notifications = notifications.filter((n) => n.status === options.status);
    }

    notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (options?.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    return notifications;
  }

  /**
   * Get blocked notifications (consent missing)
   */
  async getBlockedNotifications(
    options?: { buyerHash?: string; limit?: number }
  ): Promise<Notification[]> {
    let notifications = this.mockNotifications.filter(
      (n) => n.status === 'CONSENT_BLOCKED'
    );

    if (options?.buyerHash) {
      notifications = notifications.filter((n) => n.buyerHash === options.buyerHash);
    }

    if (options?.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    return notifications;
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Create notification record
   */
  private async createNotification(
    input: SendNotificationInput,
    messageClass: MessageClass
  ): Promise<Notification | null> {
    const now = new Date().toISOString();
    const requiredConsent = getRequiredConsent(messageClass);

    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      buyerHash: input.buyerHash,
      recipientPhoneHash: null,
      recipientEmailHash: null,
      template: input.template,
      messageClass,
      channel: input.channel,
      subject: input.subject || null,
      bodyPreview: (input.body || '').slice(0, 100),
      consentTypeRequired: requiredConsent,
      consentVerifiedAt: now,
      consentRecordId: null,
      status: 'PENDING',
      dispatchedAt: null,
      deliveredAt: null,
      readAt: null,
      failedAt: null,
      failureReason: null,
      caseId: input.caseId || null,
      projectId: input.projectId || null,
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now,
      expiresAt: input.expiresAt || null,
    };

    this.mockNotifications.push(notification);
    return notification;
  }

  /**
   * Dispatch notification to channel (mock implementation)
   */
  private async dispatchToChannel(
    notification: Notification,
    channel: NotificationChannel
  ): Promise<boolean> {
    const mode = getServiceMode();

    if (mode === 'mock') {
      console.log(`[NotificationService] Mock dispatch to ${channel}:`, {
        id: notification.id,
        template: notification.template,
        messageClass: notification.messageClass,
      });
      return true;
    }

    // Production: integrate with actual channel providers
    // WhatsApp: Twilio/360dialog
    // SMS: Twilio
    // Email: SendGrid/SES
    // Push: FCM/APNs

    return true;
  }

  /**
   * Update notification status
   */
  private async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
    failureReason?: string
  ): Promise<void> {
    const notification = this.mockNotifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.status = status;
      notification.updatedAt = new Date().toISOString();

      if (status === 'DISPATCHED') {
        notification.dispatchedAt = new Date().toISOString();
      } else if (status === 'DELIVERED') {
        notification.deliveredAt = new Date().toISOString();
      } else if (status === 'FAILED') {
        notification.failedAt = new Date().toISOString();
        notification.failureReason = failureReason || 'Unknown error';
      }
    }
  }

  /**
   * Log blocked notification attempt
   */
  private async logBlockedNotification(
    input: SendNotificationInput,
    messageClass: MessageClass,
    missingConsent: ConsentType
  ): Promise<void> {
    console.log('[NotificationService] Notification BLOCKED:', {
      buyerHash: input.buyerHash,
      template: input.template,
      messageClass,
      missingConsent,
      channel: input.channel,
    });

    // Create blocked record
    await this.createNotification(
      { ...input, body: '[BLOCKED - Consent missing]' },
      messageClass
    ).then((n) => {
      if (n) {
        this.updateNotificationStatus(n.id, 'CONSENT_BLOCKED');
      }
    });
  }

  /**
   * Detect promotional content in message body (bundle rule)
   */
  private detectPromotionalContent(body: string): boolean {
    const promoKeywords = [
      'promosi',
      'promotion',
      'diskaun',
      'discount',
      'tawaran',
      'offer',
      'percuma',
      'free',
      'hadiah',
      'gift',
      'rebate',
      'cashback',
      'bonus',
      'limited time',
      'masa terhad',
      'exclusive',
      'eksklusif',
    ];

    const lowerBody = body.toLowerCase();
    return promoKeywords.some((keyword) => lowerBody.includes(keyword));
  }

  /**
   * Generate breach notification body
   */
  private generateBreachNotificationBody(input: BreachNotificationInput): string {
    return `
NOTIS PELANGGARAN DATA PERIBADI
PERSONAL DATA BREACH NOTICE

${input.breachDescription}

Jenis Data Terjejas / Data Types Affected:
${input.dataTypesAffected.map((t) => `- ${t}`).join('\n')}

Tindakan Pemulihan / Remedial Actions:
${input.remedialActions.map((a) => `- ${a}`).join('\n')}

Hubungi / Contact:
${input.contactInfo}

ID Insiden / Incident ID: ${input.incidentId}
Tarikh Dikesan / Date Detected: ${new Date(input.breachDetectedAt).toLocaleString('ms-MY')}

${input.reportedToCommissioner ? 'Pelanggaran ini telah dilaporkan kepada Pesuruhjaya Perlindungan Data Peribadi.' : ''}
${input.reportedToCommissioner ? 'This breach has been reported to the Personal Data Protection Commissioner.' : ''}
    `.trim();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let notificationServiceInstance: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService();
  }
  return notificationServiceInstance;
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick send notification
 */
export async function sendNotification(
  input: SendNotificationInput
): Promise<SendNotificationResult> {
  return getNotificationService().send(input);
}

/**
 * Check if notification would be blocked
 */
export async function wouldBeBlocked(
  buyerHash: string,
  template: NotificationTemplate
): Promise<{ blocked: boolean; reason?: string }> {
  const service = getNotificationService();
  const messageClass = service.determineMessageClass(template);
  const consent = await service.verifyConsent(buyerHash, messageClass);

  if (!consent.hasConsent) {
    return {
      blocked: true,
      reason: `Missing ${consent.consentType} consent for ${messageClass} messages`,
    };
  }

  return { blocked: false };
}

/**
 * Send breach notification (72h scaffold)
 */
export async function sendBreachNotification(
  input: BreachNotificationInput
): Promise<ReturnType<NotificationService['sendBreachNotifications']>> {
  return getNotificationService().sendBreachNotifications(input);
}
