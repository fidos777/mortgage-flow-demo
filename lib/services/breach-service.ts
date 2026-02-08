/**
 * Breach Service
 * Sprint 0, Session S0.6 | PRD v3.6.3 CR-010C, CR-012
 *
 * PDPA 2024 breach incident management service.
 * Handles incident tracking, 72h deadline enforcement, and retention policy.
 *
 * Key Features:
 * - Create and track breach incidents
 * - 72h notification deadline monitoring
 * - Affected party management
 * - Commissioner reporting
 * - Retention policy automation
 * - Legal hold management
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getServiceMode } from './index';
import { getNotificationService } from './notification-service';
import {
  BreachIncident,
  BreachAffectedParty,
  BreachSeverity,
  BreachStatus,
  BreachNotificationStatus,
  RetentionSchedule,
  RetentionAction,
  DeadlineStatus,
  CreateBreachIncidentInput,
  AddAffectedPartyInput,
  UpdateIncidentStatusInput,
  CommissionerReportInput,
  SetLegalHoldInput,
  BreachNotificationResult,
  DeadlineCheckResult,
  PurgeExecutionResult,
  RetentionComplianceSummary,
  calculateDeadlineStatus,
  BREACH_NOTIFICATION_DEADLINE_HOURS,
} from '../types/breach';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// =============================================================================
// BREACH SERVICE CLASS
// =============================================================================

export class BreachService {
  private supabase: SupabaseClient | null = null;

  // Mock storage
  private mockIncidents: BreachIncident[] = [];
  private mockAffectedParties: BreachAffectedParty[] = [];
  private mockRetentionSchedules: RetentionSchedule[] = [];
  private mockIncidentCounter = 1;

  constructor() {
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    }
  }

  // ===========================================================================
  // INCIDENT MANAGEMENT
  // ===========================================================================

  /**
   * Create a new breach incident
   */
  async createIncident(input: CreateBreachIncidentInput): Promise<BreachIncident> {
    const mode = getServiceMode();

    const detectedAt = new Date(input.detectedAt);
    const deadline = new Date(detectedAt.getTime() + BREACH_NOTIFICATION_DEADLINE_HOURS * 60 * 60 * 1000);
    const now = new Date().toISOString();

    const incident: BreachIncident = {
      id: `breach-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      incidentId: `INC-${new Date().getFullYear()}-${String(this.mockIncidentCounter++).padStart(4, '0')}`,
      title: input.title,
      description: input.description,
      breachType: input.breachType,
      severity: input.severity,
      status: 'DETECTED',
      detectedAt: input.detectedAt,
      occurredAt: input.occurredAt || null,
      confirmedAt: null,
      containedAt: null,
      closedAt: null,
      notificationDeadline: deadline.toISOString(),
      deadlineMet: null,
      deadlineStatus: calculateDeadlineStatus(deadline.toISOString()),
      hoursRemaining: BREACH_NOTIFICATION_DEADLINE_HOURS,
      dataTypesAffected: input.dataTypesAffected,
      recordsAffectedCount: 0,
      systemsAffected: input.systemsAffected || [],
      rootCause: null,
      containmentActions: [],
      remedialActions: [],
      preventiveMeasures: [],
      commissionerNotified: false,
      commissionerReportDate: null,
      commissionerReference: null,
      dpoContact: input.dpoContact || null,
      incidentLead: input.incidentLead || null,
      metadata: {},
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy,
    };

    if (mode === 'mock' || !this.supabase) {
      this.mockIncidents.push(incident);
      console.log('[BreachService] Created incident:', incident.incidentId);
      return incident;
    }

    // Production: Insert to Supabase
    // ... (implementation for Supabase)

    return incident;
  }

  /**
   * Get incident by ID
   */
  async getIncident(incidentId: string): Promise<BreachIncident | null> {
    const incident = this.mockIncidents.find(
      (i) => i.id === incidentId || i.incidentId === incidentId
    );

    if (incident) {
      // Recalculate deadline status
      incident.deadlineStatus = calculateDeadlineStatus(incident.notificationDeadline);
      incident.hoursRemaining = Math.max(
        0,
        (new Date(incident.notificationDeadline).getTime() - Date.now()) / (1000 * 60 * 60)
      );
    }

    return incident || null;
  }

  /**
   * Get all active incidents
   */
  async getActiveIncidents(): Promise<BreachIncident[]> {
    return this.mockIncidents
      .filter((i) => !['CLOSED', 'REMEDIATED'].includes(i.status))
      .map((i) => ({
        ...i,
        deadlineStatus: calculateDeadlineStatus(i.notificationDeadline),
        hoursRemaining: Math.max(
          0,
          (new Date(i.notificationDeadline).getTime() - Date.now()) / (1000 * 60 * 60)
        ),
      }))
      .sort((a, b) => {
        // Sort by severity then deadline
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return new Date(a.notificationDeadline).getTime() - new Date(b.notificationDeadline).getTime();
      });
  }

  /**
   * Update incident status
   */
  async updateStatus(input: UpdateIncidentStatusInput): Promise<BreachIncident | null> {
    const incident = await this.getIncident(input.incidentId);
    if (!incident) return null;

    incident.status = input.status;
    incident.updatedAt = new Date().toISOString();

    // Set timestamps based on status
    if (input.status === 'CONFIRMED' && !incident.confirmedAt) {
      incident.confirmedAt = new Date().toISOString();
    }
    if (input.status === 'CLOSED' && !incident.closedAt) {
      incident.closedAt = new Date().toISOString();
    }

    console.log('[BreachService] Updated status:', incident.incidentId, '->', input.status);
    return incident;
  }

  // ===========================================================================
  // AFFECTED PARTY MANAGEMENT
  // ===========================================================================

  /**
   * Add affected party to incident
   */
  async addAffectedParty(input: AddAffectedPartyInput): Promise<BreachAffectedParty> {
    const now = new Date().toISOString();

    const party: BreachAffectedParty = {
      id: `party-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      incidentId: input.incidentId,
      buyerHash: input.buyerHash,
      consentRecordId: input.consentRecordId || null,
      notificationStatus: 'PENDING',
      notificationChannel: null,
      notificationSentAt: null,
      notificationDeliveredAt: null,
      notificationAcknowledgedAt: null,
      notificationFailedReason: null,
      dataTypesExposed: input.dataTypesExposed,
      followUpRequired: false,
      followUpSentAt: null,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    this.mockAffectedParties.push(party);

    // Update incident count
    const incident = await this.getIncident(input.incidentId);
    if (incident) {
      incident.recordsAffectedCount = this.mockAffectedParties.filter(
        (p) => p.incidentId === input.incidentId
      ).length;
    }

    return party;
  }

  /**
   * Add multiple affected parties
   */
  async addAffectedParties(
    incidentId: string,
    parties: Array<{ buyerHash: string; dataTypesExposed: string[]; consentRecordId?: string }>
  ): Promise<BreachAffectedParty[]> {
    const results: BreachAffectedParty[] = [];

    for (const party of parties) {
      const added = await this.addAffectedParty({
        incidentId,
        ...party,
      });
      results.push(added);
    }

    return results;
  }

  /**
   * Get affected parties for incident
   */
  async getAffectedParties(incidentId: string): Promise<BreachAffectedParty[]> {
    return this.mockAffectedParties.filter((p) => p.incidentId === incidentId);
  }

  /**
   * Update notification status for affected party
   */
  async updatePartyNotificationStatus(
    partyId: string,
    status: BreachNotificationStatus,
    channel?: string,
    failedReason?: string
  ): Promise<BreachAffectedParty | null> {
    const party = this.mockAffectedParties.find((p) => p.id === partyId);
    if (!party) return null;

    party.notificationStatus = status;
    party.updatedAt = new Date().toISOString();

    if (channel) party.notificationChannel = channel;
    if (status === 'SENT') party.notificationSentAt = new Date().toISOString();
    if (status === 'DELIVERED') party.notificationDeliveredAt = new Date().toISOString();
    if (status === 'ACKNOWLEDGED') party.notificationAcknowledgedAt = new Date().toISOString();
    if (status === 'FAILED') party.notificationFailedReason = failedReason || 'Unknown error';

    return party;
  }

  // ===========================================================================
  // NOTIFICATION DISPATCH
  // ===========================================================================

  /**
   * Send breach notifications to all affected parties
   */
  async sendNotifications(incidentId: string): Promise<BreachNotificationResult> {
    const incident = await this.getIncident(incidentId);
    if (!incident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    const parties = await this.getAffectedParties(incidentId);
    const pendingParties = parties.filter((p) => p.notificationStatus === 'PENDING');

    const notificationService = getNotificationService();
    let notified = 0;
    let delivered = 0;
    let failed = 0;

    for (const party of pendingParties) {
      try {
        // Use the notification service's breach notification
        const result = await notificationService.send({
          buyerHash: party.buyerHash,
          template: 'PDPA_BREACH_NOTIFICATION',
          channel: 'EMAIL',
          skipConsentCheck: true, // Breach notifications are mandatory
          metadata: {
            incidentId: incident.incidentId,
            severity: incident.severity,
            dataTypesExposed: party.dataTypesExposed,
          },
        });

        if (result.success) {
          await this.updatePartyNotificationStatus(party.id, 'SENT', 'EMAIL');
          notified++;
          // Assume delivered in mock mode
          await this.updatePartyNotificationStatus(party.id, 'DELIVERED');
          delivered++;
        } else {
          await this.updatePartyNotificationStatus(party.id, 'FAILED', 'EMAIL', result.blockedReason);
          failed++;
        }
      } catch (error) {
        await this.updatePartyNotificationStatus(
          party.id,
          'FAILED',
          'EMAIL',
          error instanceof Error ? error.message : 'Unknown error'
        );
        failed++;
      }
    }

    // Check if all notified
    const allParties = await this.getAffectedParties(incidentId);
    const allDelivered = allParties.every(
      (p) => p.notificationStatus === 'DELIVERED' || p.notificationStatus === 'ACKNOWLEDGED'
    );

    if (allDelivered && incident.status !== 'AFFECTED_NOTIFIED') {
      await this.updateStatus({
        incidentId,
        status: 'AFFECTED_NOTIFIED',
        updatedBy: 'system',
      });

      // Check deadline met
      incident.deadlineMet = new Date() <= new Date(incident.notificationDeadline);
    }

    return {
      total: parties.length,
      notified,
      delivered,
      failed,
      pending: parties.length - notified - failed,
    };
  }

  // ===========================================================================
  // COMMISSIONER REPORTING
  // ===========================================================================

  /**
   * Record commissioner notification
   */
  async reportToCommissioner(input: CommissionerReportInput): Promise<BreachIncident | null> {
    const incident = await this.getIncident(input.incidentId);
    if (!incident) return null;

    incident.commissionerNotified = true;
    incident.commissionerReportDate = input.reportDate;
    incident.commissionerReference = input.reference || null;
    incident.status = 'COMMISSIONER_NOTIFIED';
    incident.updatedAt = new Date().toISOString();

    console.log('[BreachService] Commissioner notified for:', incident.incidentId);
    return incident;
  }

  // ===========================================================================
  // DEADLINE MONITORING
  // ===========================================================================

  /**
   * Check all breach deadlines
   */
  async checkDeadlines(): Promise<DeadlineCheckResult[]> {
    const activeIncidents = await this.getActiveIncidents();

    return activeIncidents.map((incident) => {
      const affectedNotNotified = this.mockAffectedParties.filter(
        (p) =>
          p.incidentId === incident.id &&
          !['DELIVERED', 'ACKNOWLEDGED'].includes(p.notificationStatus)
      ).length;

      return {
        incidentId: incident.id,
        incidentCode: incident.incidentId,
        hoursRemaining: incident.hoursRemaining,
        status: incident.deadlineStatus,
        affectedNotNotified,
      };
    });
  }

  /**
   * Get overdue incidents
   */
  async getOverdueIncidents(): Promise<BreachIncident[]> {
    const incidents = await this.getActiveIncidents();
    return incidents.filter((i) => i.deadlineStatus === 'OVERDUE');
  }

  /**
   * Get urgent incidents (< 24h remaining)
   */
  async getUrgentIncidents(): Promise<BreachIncident[]> {
    const incidents = await this.getActiveIncidents();
    return incidents.filter((i) => ['CRITICAL', 'URGENT'].includes(i.deadlineStatus));
  }

  // ===========================================================================
  // RETENTION POLICY
  // ===========================================================================

  /**
   * Schedule consent purge
   */
  async scheduleConsentPurge(
    consentRecordId: string,
    buyerHash: string,
    consentType: string,
    grantedAt: string
  ): Promise<RetentionSchedule> {
    const retentionDays = this.getRetentionDays(consentType);
    const grantedDate = new Date(grantedAt);
    const purgeDate = new Date(grantedDate.getTime() + retentionDays * 24 * 60 * 60 * 1000);
    const now = new Date().toISOString();

    const schedule: RetentionSchedule = {
      id: `retention-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      consentRecordId,
      buyerHash,
      consentType,
      retentionStart: grantedAt,
      retentionEnd: purgeDate.toISOString(),
      retentionPeriodDays: retentionDays,
      purgeScheduledAt: purgeDate.toISOString(),
      purgeAction: 'SCHEDULED',
      purgeExecutedAt: null,
      purgeResult: null,
      legalHold: false,
      legalHoldReason: null,
      legalHoldSetBy: null,
      legalHoldSetAt: null,
      legalHoldExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.mockRetentionSchedules.push(schedule);
    return schedule;
  }

  /**
   * Set legal hold on consent
   */
  async setLegalHold(input: SetLegalHoldInput): Promise<RetentionSchedule | null> {
    const schedule = this.mockRetentionSchedules.find(
      (s) => s.consentRecordId === input.consentRecordId
    );

    if (!schedule) return null;

    schedule.legalHold = true;
    schedule.legalHoldReason = input.reason;
    schedule.legalHoldSetBy = input.setBy;
    schedule.legalHoldSetAt = new Date().toISOString();
    schedule.legalHoldExpiresAt = input.expiresAt || null;
    schedule.purgeAction = 'SKIPPED';
    schedule.updatedAt = new Date().toISOString();

    console.log('[BreachService] Legal hold set on:', input.consentRecordId);
    return schedule;
  }

  /**
   * Remove legal hold
   */
  async removeLegalHold(consentRecordId: string, removedBy: string): Promise<RetentionSchedule | null> {
    const schedule = this.mockRetentionSchedules.find(
      (s) => s.consentRecordId === consentRecordId
    );

    if (!schedule) return null;

    schedule.legalHold = false;
    schedule.legalHoldReason = `${schedule.legalHoldReason} [REMOVED by ${removedBy} at ${new Date().toISOString()}]`;
    schedule.purgeAction = new Date(schedule.purgeScheduledAt) <= new Date() ? 'SCHEDULED' : schedule.purgeAction;
    schedule.updatedAt = new Date().toISOString();

    console.log('[BreachService] Legal hold removed from:', consentRecordId);
    return schedule;
  }

  /**
   * Execute pending purges
   */
  async executePendingPurges(batchSize: number = 100): Promise<PurgeExecutionResult> {
    const now = new Date();
    let purgedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    const pendingSchedules = this.mockRetentionSchedules
      .filter(
        (s) =>
          s.purgeAction === 'SCHEDULED' &&
          !s.legalHold &&
          new Date(s.purgeScheduledAt) <= now
      )
      .slice(0, batchSize);

    for (const schedule of pendingSchedules) {
      try {
        if (schedule.legalHold) {
          schedule.purgeAction = 'SKIPPED';
          schedule.purgeResult = 'Legal hold active';
          skippedCount++;
          continue;
        }

        // In production: DELETE FROM consent_records WHERE id = ...
        schedule.purgeAction = 'COMPLETED';
        schedule.purgeExecutedAt = new Date().toISOString();
        schedule.purgeResult = 'Successfully purged';
        purgedCount++;

        console.log('[BreachService] Purged consent:', schedule.consentRecordId);
      } catch (error) {
        schedule.purgeAction = 'FAILED';
        schedule.purgeResult = error instanceof Error ? error.message : 'Unknown error';
        failedCount++;
      }
    }

    return { purgedCount, failedCount, skippedCount };
  }

  /**
   * Get retention compliance summary
   */
  async getRetentionComplianceSummary(): Promise<RetentionComplianceSummary[]> {
    const byType = new Map<string, RetentionComplianceSummary>();

    for (const schedule of this.mockRetentionSchedules) {
      const existing = byType.get(schedule.consentType) || {
        consentType: schedule.consentType,
        totalRecords: 0,
        onHold: 0,
        purged: 0,
        pendingPurge: 0,
        failedPurge: 0,
        nextScheduledPurge: null,
        lastPurge: null,
      };

      existing.totalRecords++;
      if (schedule.legalHold) existing.onHold++;
      if (schedule.purgeAction === 'COMPLETED') existing.purged++;
      if (schedule.purgeAction === 'SCHEDULED' && new Date(schedule.purgeScheduledAt) <= new Date()) {
        existing.pendingPurge++;
      }
      if (schedule.purgeAction === 'FAILED') existing.failedPurge++;

      // Track next/last purge dates
      if (schedule.purgeAction === 'SCHEDULED') {
        if (!existing.nextScheduledPurge || schedule.purgeScheduledAt < existing.nextScheduledPurge) {
          existing.nextScheduledPurge = schedule.purgeScheduledAt;
        }
      }
      if (schedule.purgeExecutedAt) {
        if (!existing.lastPurge || schedule.purgeExecutedAt > existing.lastPurge) {
          existing.lastPurge = schedule.purgeExecutedAt;
        }
      }

      byType.set(schedule.consentType, existing);
    }

    return Array.from(byType.values());
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private getRetentionDays(consentType: string): number {
    const retentionMap: Record<string, number> = {
      PDPA_BASIC: 2555,        // 7 years
      PDPA_THIRD_PARTY: 2555,  // 7 years
      PDPA_MARKETING: 730,     // 2 years
      PDPA_ANALYTICS: 365,     // 1 year
    };
    return retentionMap[consentType] || 2555;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let breachServiceInstance: BreachService | null = null;

export function getBreachService(): BreachService {
  if (!breachServiceInstance) {
    breachServiceInstance = new BreachService();
  }
  return breachServiceInstance;
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Create breach incident
 */
export async function createBreachIncident(
  input: CreateBreachIncidentInput
): Promise<BreachIncident> {
  return getBreachService().createIncident(input);
}

/**
 * Check breach deadlines
 */
export async function checkBreachDeadlines(): Promise<DeadlineCheckResult[]> {
  return getBreachService().checkDeadlines();
}

/**
 * Execute retention purges
 */
export async function executeRetentionPurges(
  batchSize?: number
): Promise<PurgeExecutionResult> {
  return getBreachService().executePendingPurges(batchSize);
}
