/**
 * Incentive Service
 * S5.2: Campaign Service + Rules Engine | PRD v3.6.3 CR-012
 *
 * Layer 3 (Partner Incentive) — MUST NOT touch Layer 2 (Credits).
 * Language: "Ganjaran Kempen" (Campaign Rewards), NEVER "Komisen" (Commission).
 *
 * Responsibilities:
 * - Campaign CRUD operations
 * - Rule management
 * - Milestone evaluation (with forbidden trigger guard)
 * - Cap enforcement (per-case, per-recipient, per-rule)
 * - Award lifecycle management
 * - Budget tracking
 */

import {
  IncentiveCampaign,
  IncentiveRule,
  IncentiveAward,
  CampaignStatus,
  AwardStatus,
  RecipientType,
  CreateCampaignInput,
  CreateRuleInput,
  EvaluateMilestoneInput,
  IncentiveTrigger,
  isForbiddenTrigger,
  isAllowedTrigger,
  FORBIDDEN_TRIGGERS,
} from '../types/incentive';

// =============================================================================
// LOCAL STORAGE KEYS (Demo Mode)
// =============================================================================

const STORAGE_KEYS = {
  CAMPAIGNS: 'incentive_campaigns',
  RULES: 'incentive_rules',
  AWARDS: 'incentive_awards',
} as const;

// =============================================================================
// RESULT TYPES
// =============================================================================

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export interface MilestoneEvaluationResult {
  evaluated: boolean;
  triggeredRules: IncentiveRule[];
  awardsIssued: IncentiveAward[];
  blocked?: {
    reason: string;
    forbiddenTrigger?: string;
    capReached?: boolean;
    budgetExhausted?: boolean;
  };
}

// =============================================================================
// INCENTIVE SERVICE CLASS
// =============================================================================

class IncentiveService {
  private campaigns: Map<string, IncentiveCampaign> = new Map();
  private rules: Map<string, IncentiveRule> = new Map();
  private awards: Map<string, IncentiveAward> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // ===========================================================================
  // STORAGE OPERATIONS
  // ===========================================================================

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const campaignsJson = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
      const rulesJson = localStorage.getItem(STORAGE_KEYS.RULES);
      const awardsJson = localStorage.getItem(STORAGE_KEYS.AWARDS);

      if (campaignsJson) {
        const arr: IncentiveCampaign[] = JSON.parse(campaignsJson);
        arr.forEach(c => this.campaigns.set(c.id, c));
      }
      if (rulesJson) {
        const arr: IncentiveRule[] = JSON.parse(rulesJson);
        arr.forEach(r => this.rules.set(r.id, r));
      }
      if (awardsJson) {
        const arr: IncentiveAward[] = JSON.parse(awardsJson);
        arr.forEach(a => this.awards.set(a.id, a));
      }
    } catch (error) {
      console.error('[IncentiveService] Failed to load from storage:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        STORAGE_KEYS.CAMPAIGNS,
        JSON.stringify(Array.from(this.campaigns.values()))
      );
      localStorage.setItem(
        STORAGE_KEYS.RULES,
        JSON.stringify(Array.from(this.rules.values()))
      );
      localStorage.setItem(
        STORAGE_KEYS.AWARDS,
        JSON.stringify(Array.from(this.awards.values()))
      );
    } catch (error) {
      console.error('[IncentiveService] Failed to save to storage:', error);
    }
  }

  // ===========================================================================
  // CAMPAIGN CRUD
  // ===========================================================================

  /**
   * Create a new campaign
   */
  createCampaign(
    input: CreateCampaignInput,
    createdBy: string
  ): ServiceResult<IncentiveCampaign> {
    const id = `CAMP-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    const campaign: IncentiveCampaign = {
      id,
      developerId: input.developerId,
      projectId: input.projectId,
      name: input.name,
      nameBm: input.nameBm,
      description: input.description,
      descriptionBm: input.descriptionBm,
      budgetTotal: input.budgetTotal,
      budgetRemaining: input.budgetTotal, // Starts with full budget
      currency: 'MYR',
      startDate: input.startDate,
      endDate: input.endDate || null,
      maxAwardsPerCase: input.maxAwardsPerCase || 1,
      maxAwardsPerRecipient: input.maxAwardsPerRecipient || 1,
      status: 'DRAFT',
      createdAt: now,
      createdBy,
      updatedAt: now,
    };

    this.campaigns.set(id, campaign);
    this.saveToStorage();

    console.log('[IncentiveService] Campaign created:', id, campaign.name);
    return { success: true, data: campaign };
  }

  /**
   * Get campaign by ID
   */
  getCampaign(campaignId: string): ServiceResult<IncentiveCampaign> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      return { success: false, error: 'Campaign not found', errorCode: 'NOT_FOUND' };
    }
    return { success: true, data: campaign };
  }

  /**
   * Get campaigns by developer
   */
  getCampaignsByDeveloper(developerId: string): IncentiveCampaign[] {
    return Array.from(this.campaigns.values()).filter(
      c => c.developerId === developerId
    );
  }

  /**
   * Get campaigns by project
   */
  getCampaignsByProject(projectId: string): IncentiveCampaign[] {
    return Array.from(this.campaigns.values()).filter(
      c => c.projectId === projectId
    );
  }

  /**
   * Get active campaigns for a project
   */
  getActiveCampaigns(projectId?: string): IncentiveCampaign[] {
    const now = new Date().toISOString();
    return Array.from(this.campaigns.values()).filter(c => {
      if (c.status !== 'ACTIVE') return false;
      if (projectId && c.projectId !== projectId) return false;
      if (c.endDate && c.endDate < now) return false;
      return true;
    });
  }

  /**
   * Activate a campaign
   */
  activateCampaign(campaignId: string): ServiceResult<IncentiveCampaign> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      return { success: false, error: 'Campaign not found', errorCode: 'NOT_FOUND' };
    }

    if (campaign.status !== 'DRAFT' && campaign.status !== 'PAUSED') {
      return {
        success: false,
        error: `Cannot activate campaign with status ${campaign.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    campaign.status = 'ACTIVE';
    campaign.updatedAt = new Date().toISOString();
    this.campaigns.set(campaignId, campaign);
    this.saveToStorage();

    console.log('[IncentiveService] Campaign activated:', campaignId);
    return { success: true, data: campaign };
  }

  /**
   * Pause a campaign
   */
  pauseCampaign(campaignId: string): ServiceResult<IncentiveCampaign> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      return { success: false, error: 'Campaign not found', errorCode: 'NOT_FOUND' };
    }

    if (campaign.status !== 'ACTIVE') {
      return {
        success: false,
        error: `Cannot pause campaign with status ${campaign.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    campaign.status = 'PAUSED';
    campaign.updatedAt = new Date().toISOString();
    this.campaigns.set(campaignId, campaign);
    this.saveToStorage();

    console.log('[IncentiveService] Campaign paused:', campaignId);
    return { success: true, data: campaign };
  }

  /**
   * Cancel a campaign
   */
  cancelCampaign(campaignId: string): ServiceResult<IncentiveCampaign> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      return { success: false, error: 'Campaign not found', errorCode: 'NOT_FOUND' };
    }

    campaign.status = 'CANCELLED';
    campaign.updatedAt = new Date().toISOString();
    this.campaigns.set(campaignId, campaign);
    this.saveToStorage();

    console.log('[IncentiveService] Campaign cancelled:', campaignId);
    return { success: true, data: campaign };
  }

  // ===========================================================================
  // RULE MANAGEMENT
  // ===========================================================================

  /**
   * Create a new rule for a campaign
   * ENFORCES: Forbidden trigger check
   */
  createRule(input: CreateRuleInput): ServiceResult<IncentiveRule> {
    // CRITICAL: Check forbidden triggers FIRST
    if (isForbiddenTrigger(input.trigger)) {
      console.error(
        '[IncentiveService] FORBIDDEN TRIGGER ATTEMPTED:',
        input.trigger,
        'Forbidden list:',
        FORBIDDEN_TRIGGERS
      );
      return {
        success: false,
        error: `Trigger '${input.trigger}' is FORBIDDEN. Rewards cannot be linked to approval decisions.`,
        errorCode: 'FORBIDDEN_TRIGGER',
      };
    }

    // Verify trigger is in allowed list
    if (!isAllowedTrigger(input.trigger)) {
      return {
        success: false,
        error: `Trigger '${input.trigger}' is not in the allowed triggers list.`,
        errorCode: 'INVALID_TRIGGER',
      };
    }

    // Verify campaign exists
    const campaign = this.campaigns.get(input.campaignId);
    if (!campaign) {
      return {
        success: false,
        error: 'Campaign not found',
        errorCode: 'CAMPAIGN_NOT_FOUND',
      };
    }

    const id = `RULE-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    const rule: IncentiveRule = {
      id,
      campaignId: input.campaignId,
      trigger: input.trigger,
      triggerConditions: input.triggerConditions,
      recipientType: input.recipientType,
      rewardType: input.rewardType,
      rewardAmount: input.rewardAmount,
      rewardDescription: input.rewardDescription,
      maxAwardsPerCase: input.maxAwardsPerCase,
      maxAwardsPerRecipient: input.maxAwardsPerRecipient,
      maxTotalAwards: input.maxTotalAwards,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.rules.set(id, rule);
    this.saveToStorage();

    console.log('[IncentiveService] Rule created:', id, rule.trigger, '→', rule.recipientType);
    return { success: true, data: rule };
  }

  /**
   * Get rules for a campaign
   */
  getRulesByCampaign(campaignId: string, activeOnly = false): IncentiveRule[] {
    return Array.from(this.rules.values()).filter(r => {
      if (r.campaignId !== campaignId) return false;
      if (activeOnly && !r.isActive) return false;
      return true;
    });
  }

  /**
   * Get rules by trigger
   */
  getRulesByTrigger(trigger: IncentiveTrigger, activeOnly = true): IncentiveRule[] {
    return Array.from(this.rules.values()).filter(r => {
      if (r.trigger !== trigger) return false;
      if (activeOnly && !r.isActive) return false;
      return true;
    });
  }

  /**
   * Deactivate a rule
   */
  deactivateRule(ruleId: string): ServiceResult<IncentiveRule> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return { success: false, error: 'Rule not found', errorCode: 'NOT_FOUND' };
    }

    rule.isActive = false;
    rule.updatedAt = new Date().toISOString();
    this.rules.set(ruleId, rule);
    this.saveToStorage();

    return { success: true, data: rule };
  }

  // ===========================================================================
  // MILESTONE EVALUATION
  // ===========================================================================

  /**
   * Evaluate a milestone and issue awards if rules match
   *
   * CRITICAL GUARDS:
   * 1. Forbidden trigger check
   * 2. Campaign active check
   * 3. Budget check
   * 4. Cap enforcement (per-case, per-recipient)
   */
  evaluateMilestone(input: EvaluateMilestoneInput): MilestoneEvaluationResult {
    const { caseId, trigger, proofEventId, metadata } = input;

    // GUARD 1: Forbidden trigger check
    if (isForbiddenTrigger(trigger)) {
      console.error(
        '[IncentiveService] FORBIDDEN TRIGGER BLOCKED:',
        trigger,
        'Case:',
        caseId
      );
      return {
        evaluated: false,
        triggeredRules: [],
        awardsIssued: [],
        blocked: {
          reason: `Trigger '${trigger}' is FORBIDDEN. Cannot evaluate.`,
          forbiddenTrigger: trigger,
        },
      };
    }

    // Get all active rules for this trigger
    const matchingRules = this.getRulesByTrigger(trigger, true);

    if (matchingRules.length === 0) {
      return {
        evaluated: true,
        triggeredRules: [],
        awardsIssued: [],
      };
    }

    const triggeredRules: IncentiveRule[] = [];
    const awardsIssued: IncentiveAward[] = [];

    for (const rule of matchingRules) {
      // Get campaign
      const campaign = this.campaigns.get(rule.campaignId);
      if (!campaign) continue;

      // GUARD 2: Campaign active check
      if (campaign.status !== 'ACTIVE') {
        console.log(
          '[IncentiveService] Skipping rule - campaign not active:',
          campaign.id,
          campaign.status
        );
        continue;
      }

      // GUARD 3: Budget check
      if (campaign.budgetRemaining < rule.rewardAmount) {
        console.log(
          '[IncentiveService] Skipping rule - insufficient budget:',
          rule.id,
          'Need:',
          rule.rewardAmount,
          'Have:',
          campaign.budgetRemaining
        );
        continue;
      }

      // GUARD 4: Cap enforcement
      const capCheck = this.checkCaps(rule, caseId, this.getRecipientIdForCase(caseId, rule.recipientType));
      if (!capCheck.allowed) {
        console.log(
          '[IncentiveService] Skipping rule - cap reached:',
          rule.id,
          capCheck.reason
        );
        continue;
      }

      // All guards passed - issue award
      triggeredRules.push(rule);

      const awardResult = this.issueAward(rule, caseId, proofEventId, metadata);
      if (awardResult.success && awardResult.data) {
        awardsIssued.push(awardResult.data);
      }
    }

    console.log(
      '[IncentiveService] Milestone evaluated:',
      trigger,
      'Case:',
      caseId,
      'Rules triggered:',
      triggeredRules.length,
      'Awards issued:',
      awardsIssued.length
    );

    return {
      evaluated: true,
      triggeredRules,
      awardsIssued,
    };
  }

  // ===========================================================================
  // CAP ENFORCEMENT
  // ===========================================================================

  /**
   * Check if caps allow issuing an award
   */
  private checkCaps(
    rule: IncentiveRule,
    caseId: string,
    recipientId: string
  ): { allowed: boolean; reason?: string } {
    const campaign = this.campaigns.get(rule.campaignId);
    if (!campaign) {
      return { allowed: false, reason: 'Campaign not found' };
    }

    // Count existing awards for this rule
    const ruleAwards = Array.from(this.awards.values()).filter(
      a => a.ruleId === rule.id && a.status !== 'REJECTED' && a.status !== 'CLAWBACK'
    );

    // Check per-case cap
    const caseAwards = ruleAwards.filter(a => a.caseId === caseId);
    const maxPerCase = rule.maxAwardsPerCase ?? campaign.maxAwardsPerCase;
    if (caseAwards.length >= maxPerCase) {
      return { allowed: false, reason: `Per-case cap reached (${maxPerCase})` };
    }

    // Check per-recipient cap
    const recipientAwards = ruleAwards.filter(a => a.recipientId === recipientId);
    const maxPerRecipient = rule.maxAwardsPerRecipient ?? campaign.maxAwardsPerRecipient;
    if (recipientAwards.length >= maxPerRecipient) {
      return { allowed: false, reason: `Per-recipient cap reached (${maxPerRecipient})` };
    }

    // Check rule total cap
    if (rule.maxTotalAwards !== undefined) {
      if (ruleAwards.length >= rule.maxTotalAwards) {
        return { allowed: false, reason: `Rule total cap reached (${rule.maxTotalAwards})` };
      }
    }

    return { allowed: true };
  }

  /**
   * Get recipient ID for a case (demo implementation)
   */
  private getRecipientIdForCase(caseId: string, recipientType: RecipientType): string {
    // In demo mode, generate consistent recipient ID from case + type
    return `${recipientType}-${caseId}`;
  }

  // ===========================================================================
  // AWARD MANAGEMENT
  // ===========================================================================

  /**
   * Issue an award (internal - called by evaluateMilestone)
   */
  private issueAward(
    rule: IncentiveRule,
    caseId: string,
    proofEventId?: string,
    metadata?: Record<string, unknown>
  ): ServiceResult<IncentiveAward> {
    const campaign = this.campaigns.get(rule.campaignId);
    if (!campaign) {
      return { success: false, error: 'Campaign not found' };
    }

    const id = `AWD-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();
    const recipientId = this.getRecipientIdForCase(caseId, rule.recipientType);

    const award: IncentiveAward = {
      id,
      ruleId: rule.id,
      campaignId: rule.campaignId,
      caseId,
      recipientType: rule.recipientType,
      recipientId,
      recipientName: metadata?.recipientName as string | undefined,
      rewardType: rule.rewardType,
      rewardAmount: rule.rewardAmount,
      rewardDescription: rule.rewardDescription,
      status: 'PENDING',
      triggeredBy: rule.trigger,
      triggerProofEventId: proofEventId,
      triggeredAt: now,
      createdAt: now,
      updatedAt: now,
    };

    this.awards.set(id, award);
    this.saveToStorage();

    console.log(
      '[IncentiveService] Award issued:',
      id,
      'RM',
      rule.rewardAmount,
      'to',
      rule.recipientType
    );

    return { success: true, data: award };
  }

  /**
   * Get awards by case
   */
  getAwardsByCase(caseId: string): IncentiveAward[] {
    return Array.from(this.awards.values()).filter(a => a.caseId === caseId);
  }

  /**
   * Get awards by recipient
   */
  getAwardsByRecipient(recipientType: RecipientType, recipientId: string): IncentiveAward[] {
    return Array.from(this.awards.values()).filter(
      a => a.recipientType === recipientType && a.recipientId === recipientId
    );
  }

  /**
   * Get awards by campaign
   */
  getAwardsByCampaign(campaignId: string): IncentiveAward[] {
    return Array.from(this.awards.values()).filter(a => a.campaignId === campaignId);
  }

  /**
   * Get pending awards
   */
  getPendingAwards(): IncentiveAward[] {
    return Array.from(this.awards.values()).filter(a => a.status === 'PENDING');
  }

  // ===========================================================================
  // AWARD LIFECYCLE
  // ===========================================================================

  /**
   * Verify an award (PENDING → VERIFIED)
   */
  verifyAward(awardId: string, verifiedBy: string): ServiceResult<IncentiveAward> {
    const award = this.awards.get(awardId);
    if (!award) {
      return { success: false, error: 'Award not found', errorCode: 'NOT_FOUND' };
    }

    if (award.status !== 'PENDING') {
      return {
        success: false,
        error: `Cannot verify award with status ${award.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    award.status = 'VERIFIED';
    award.verifiedAt = new Date().toISOString();
    award.verifiedBy = verifiedBy;
    award.updatedAt = new Date().toISOString();

    this.awards.set(awardId, award);
    this.saveToStorage();

    console.log('[IncentiveService] Award verified:', awardId);
    return { success: true, data: award };
  }

  /**
   * Approve an award (VERIFIED → APPROVED)
   * Deducts from campaign budget
   */
  approveAward(awardId: string): ServiceResult<IncentiveAward> {
    const award = this.awards.get(awardId);
    if (!award) {
      return { success: false, error: 'Award not found', errorCode: 'NOT_FOUND' };
    }

    if (award.status !== 'VERIFIED') {
      return {
        success: false,
        error: `Cannot approve award with status ${award.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    // Deduct from campaign budget
    const campaign = this.campaigns.get(award.campaignId);
    if (!campaign) {
      return { success: false, error: 'Campaign not found' };
    }

    if (campaign.budgetRemaining < award.rewardAmount) {
      return {
        success: false,
        error: 'Insufficient campaign budget',
        errorCode: 'BUDGET_EXHAUSTED',
      };
    }

    // Update campaign budget
    campaign.budgetRemaining -= award.rewardAmount;
    campaign.updatedAt = new Date().toISOString();

    // Check if budget exhausted
    if (campaign.budgetRemaining <= 0) {
      campaign.status = 'EXHAUSTED';
      console.log('[IncentiveService] Campaign budget exhausted:', campaign.id);
    }

    this.campaigns.set(campaign.id, campaign);

    // Update award status
    award.status = 'APPROVED';
    award.updatedAt = new Date().toISOString();

    this.awards.set(awardId, award);
    this.saveToStorage();

    console.log(
      '[IncentiveService] Award approved:',
      awardId,
      'Budget remaining:',
      campaign.budgetRemaining
    );
    return { success: true, data: award };
  }

  /**
   * Mark an award as paid (APPROVED → PAID)
   */
  markAwardPaid(
    awardId: string,
    payoutReference: string,
    payoutMethod: string
  ): ServiceResult<IncentiveAward> {
    const award = this.awards.get(awardId);
    if (!award) {
      return { success: false, error: 'Award not found', errorCode: 'NOT_FOUND' };
    }

    if (award.status !== 'APPROVED') {
      return {
        success: false,
        error: `Cannot pay award with status ${award.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    award.status = 'PAID';
    award.paidAt = new Date().toISOString();
    award.payoutReference = payoutReference;
    award.payoutMethod = payoutMethod;
    award.updatedAt = new Date().toISOString();

    this.awards.set(awardId, award);
    this.saveToStorage();

    console.log('[IncentiveService] Award paid:', awardId, 'Ref:', payoutReference);
    return { success: true, data: award };
  }

  /**
   * Reject an award (any status → REJECTED)
   */
  rejectAward(awardId: string, reason: string): ServiceResult<IncentiveAward> {
    const award = this.awards.get(awardId);
    if (!award) {
      return { success: false, error: 'Award not found', errorCode: 'NOT_FOUND' };
    }

    if (award.status === 'PAID') {
      return {
        success: false,
        error: 'Cannot reject paid award. Use clawback instead.',
        errorCode: 'INVALID_STATUS',
      };
    }

    award.status = 'REJECTED';
    award.statusReason = reason;
    award.updatedAt = new Date().toISOString();

    this.awards.set(awardId, award);
    this.saveToStorage();

    console.log('[IncentiveService] Award rejected:', awardId, 'Reason:', reason);
    return { success: true, data: award };
  }

  /**
   * Clawback a paid award (PAID → CLAWBACK)
   * Returns budget to campaign
   */
  clawbackAward(awardId: string, reason: string): ServiceResult<IncentiveAward> {
    const award = this.awards.get(awardId);
    if (!award) {
      return { success: false, error: 'Award not found', errorCode: 'NOT_FOUND' };
    }

    if (award.status !== 'PAID') {
      return {
        success: false,
        error: 'Can only clawback paid awards',
        errorCode: 'INVALID_STATUS',
      };
    }

    // Return budget to campaign
    const campaign = this.campaigns.get(award.campaignId);
    if (campaign) {
      campaign.budgetRemaining += award.rewardAmount;
      campaign.updatedAt = new Date().toISOString();

      // Reactivate if was exhausted
      if (campaign.status === 'EXHAUSTED') {
        campaign.status = 'ACTIVE';
      }

      this.campaigns.set(campaign.id, campaign);
    }

    award.status = 'CLAWBACK';
    award.statusReason = reason;
    award.updatedAt = new Date().toISOString();

    this.awards.set(awardId, award);
    this.saveToStorage();

    console.log('[IncentiveService] Award clawback:', awardId, 'Reason:', reason);
    return { success: true, data: award };
  }

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  /**
   * Get campaign statistics
   */
  getCampaignStats(campaignId: string): {
    budgetTotal: number;
    budgetRemaining: number;
    budgetSpent: number;
    budgetUsedPct: number;
    totalAwards: number;
    pendingAwards: number;
    verifiedAwards: number;
    approvedAwards: number;
    paidAwards: number;
    rejectedAwards: number;
  } | null {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return null;

    const awards = this.getAwardsByCampaign(campaignId);

    const stats = {
      budgetTotal: campaign.budgetTotal,
      budgetRemaining: campaign.budgetRemaining,
      budgetSpent: campaign.budgetTotal - campaign.budgetRemaining,
      budgetUsedPct: ((campaign.budgetTotal - campaign.budgetRemaining) / campaign.budgetTotal) * 100,
      totalAwards: awards.length,
      pendingAwards: awards.filter(a => a.status === 'PENDING').length,
      verifiedAwards: awards.filter(a => a.status === 'VERIFIED').length,
      approvedAwards: awards.filter(a => a.status === 'APPROVED').length,
      paidAwards: awards.filter(a => a.status === 'PAID').length,
      rejectedAwards: awards.filter(a => a.status === 'REJECTED').length,
    };

    return stats;
  }

  /**
   * Clear all data (for testing)
   */
  clearAll(): void {
    this.campaigns.clear();
    this.rules.clear();
    this.awards.clear();
    this.saveToStorage();
    console.log('[IncentiveService] All data cleared');
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let incentiveServiceInstance: IncentiveService | null = null;

export function getIncentiveService(): IncentiveService {
  if (!incentiveServiceInstance) {
    incentiveServiceInstance = new IncentiveService();
  }
  return incentiveServiceInstance;
}

// Export class for testing
export { IncentiveService };
