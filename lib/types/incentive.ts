/**
 * Incentive Engine Types
 * S5.1: Incentive Schema + Types | PRD v3.6.3 CR-012
 *
 * Layer 3 (Partner Incentive) — MUST NOT touch Layer 2 (Credits).
 * Language: "Ganjaran Kempen" (Campaign Rewards), NEVER "Komisen" (Commission).
 *
 * Three-Layer Isolation:
 * - Layer 1: Core Workflow (Epics 1-7)
 * - Layer 2: Credit Monetization (agent credits)
 * - Layer 3: Partner Incentive (THIS FILE - developer-funded buyer/referrer rewards)
 */

// =============================================================================
// TRIGGER DEFINITIONS
// =============================================================================

/**
 * FORBIDDEN TRIGGERS — hardcoded, DB CHECK constraint enforced
 * These MUST NEVER be used as incentive triggers (creates approval link)
 */
export const FORBIDDEN_TRIGGERS = [
  'APPROVED',           // Links reward to approval decision
  'LULUS',              // BM for "approved"
  'KELULUSAN',          // BM for "approval"
  'CASE_COMPLETED',     // Implies successful completion
  'LOAN_APPROVED',      // Direct approval link
  'LOAN_DISBURSED',     // Post-approval event
  'PINJAMAN_DILULUSKAN', // BM for "loan approved"
] as const;

export type ForbiddenTrigger = typeof FORBIDDEN_TRIGGERS[number];

/**
 * ALLOWED TRIGGERS — milestones that don't imply approval
 * These are safe to use for incentive evaluation
 */
export const ALLOWED_TRIGGERS = [
  // Step 0: Entry & Consent
  'CONSENT_GRANTED',           // Buyer completed PDPA consent (C1-C4)
  'PROFILE_CREATED',           // Buyer profile established

  // Step 1-2: Document Collection
  'FIRST_DOC_UPLOADED',        // Any document uploaded
  'DOCS_COMPLETE_CONFIRMED',   // All required docs submitted (agent confirms)
  'DOC_VERIFIED',              // Individual doc verified

  // Step 3: Submission
  'SUBMISSION_ATTESTED',       // Agent attests LPPSA portal submission
  'TAC_TIMESTAMP_RECORDED',    // TAC verification completed

  // Referral Events
  'REFERRAL_VALIDATED',        // Referrer code used by buyer
  'REFERRAL_CASE_REACHED_STEP', // Referred case hit milestone

  // Lawyer Events
  'LAWYER_ASSIGNED_CONFIRMED', // Lawyer assigned to case

  // Engagement Events
  'CASE_VIEWED_BY_BUYER',      // Buyer logged in and viewed case
  'RETURN_VISIT',              // Buyer returned after 24h

  // Special Events
  'CAMPAIGN_MILESTONE',        // Custom campaign-specific milestone
] as const;

export type AllowedTrigger = typeof ALLOWED_TRIGGERS[number];

/**
 * Trigger type for incentive rules
 * Only allowed triggers can be used
 */
export type IncentiveTrigger = AllowedTrigger;

/**
 * Check if trigger is forbidden
 */
export function isForbiddenTrigger(trigger: string): boolean {
  return (FORBIDDEN_TRIGGERS as readonly string[]).includes(trigger.toUpperCase());
}

/**
 * Check if trigger is allowed
 */
export function isAllowedTrigger(trigger: string): trigger is AllowedTrigger {
  return (ALLOWED_TRIGGERS as readonly string[]).includes(trigger as AllowedTrigger);
}

// =============================================================================
// RECIPIENT TYPES
// =============================================================================

/**
 * Who can receive incentive awards
 * v1: BUYER, REFERRER, LAWYER — NOT AGENT (agents use credits/Layer 2)
 */
export type RecipientType = 'BUYER' | 'REFERRER' | 'LAWYER';

export const RECIPIENT_TYPES: readonly RecipientType[] = [
  'BUYER',
  'REFERRER',
  'LAWYER',
] as const;

/**
 * Recipient type config
 */
export interface RecipientTypeConfig {
  type: RecipientType;
  labelEn: string;
  labelBm: string;
  descriptionEn: string;
  descriptionBm: string;
  requiresVerification: boolean;
  verificationMethod?: string;
}

export const RECIPIENT_CONFIG: Record<RecipientType, RecipientTypeConfig> = {
  BUYER: {
    type: 'BUYER',
    labelEn: 'Buyer',
    labelBm: 'Pembeli',
    descriptionEn: 'The loan applicant who completed the milestone',
    descriptionBm: 'Pemohon pinjaman yang mencapai pencapaian',
    requiresVerification: false, // Already verified via consent
  },
  REFERRER: {
    type: 'REFERRER',
    labelEn: 'Referrer',
    labelBm: 'Perujuk',
    descriptionEn: 'Person who referred the buyer to the platform',
    descriptionBm: 'Orang yang merujuk pembeli ke platform',
    requiresVerification: true,
    verificationMethod: 'REFERRAL_CODE_OTP',
  },
  LAWYER: {
    type: 'LAWYER',
    labelEn: 'Lawyer',
    labelBm: 'Peguam',
    descriptionEn: 'Legal representative assigned to the case',
    descriptionBm: 'Wakil undang-undang yang ditugaskan kepada kes',
    requiresVerification: true,
    verificationMethod: 'AGENT_ASSIGN_OR_OTP',
  },
};

// =============================================================================
// REWARD TYPES
// =============================================================================

/**
 * Type of reward given
 */
export type RewardType =
  | 'CASH'          // Direct cash transfer (requires bank details)
  | 'VOUCHER'       // E-voucher code (TnG, Grab, etc.)
  | 'REBATE'        // Discount on property/service
  | 'CREDIT';       // Platform credit (NOT agent credits - separate)

export const REWARD_TYPES: readonly RewardType[] = [
  'CASH',
  'VOUCHER',
  'REBATE',
  'CREDIT',
] as const;

/**
 * Reward type config
 */
export interface RewardTypeConfig {
  type: RewardType;
  labelEn: string;
  labelBm: string;
  requiresBankDetails: boolean;
  requiresVoucherProvider: boolean;
}

export const REWARD_TYPE_CONFIG: Record<RewardType, RewardTypeConfig> = {
  CASH: {
    type: 'CASH',
    labelEn: 'Cash Transfer',
    labelBm: 'Pemindahan Tunai',
    requiresBankDetails: true,
    requiresVoucherProvider: false,
  },
  VOUCHER: {
    type: 'VOUCHER',
    labelEn: 'E-Voucher',
    labelBm: 'E-Baucar',
    requiresBankDetails: false,
    requiresVoucherProvider: true,
  },
  REBATE: {
    type: 'REBATE',
    labelEn: 'Rebate',
    labelBm: 'Rebat',
    requiresBankDetails: false,
    requiresVoucherProvider: false,
  },
  CREDIT: {
    type: 'CREDIT',
    labelEn: 'Platform Credit',
    labelBm: 'Kredit Platform',
    requiresBankDetails: false,
    requiresVoucherProvider: false,
  },
};

// =============================================================================
// CAMPAIGN TYPES
// =============================================================================

/**
 * Campaign status lifecycle
 */
export type CampaignStatus =
  | 'DRAFT'         // Being configured
  | 'ACTIVE'        // Running and awarding
  | 'PAUSED'        // Temporarily stopped
  | 'EXHAUSTED'     // Budget depleted
  | 'EXPIRED'       // Past end date
  | 'CANCELLED';    // Manually cancelled

export const CAMPAIGN_STATUSES: readonly CampaignStatus[] = [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'EXHAUSTED',
  'EXPIRED',
  'CANCELLED',
] as const;

/**
 * Incentive campaign
 * Funded by developer, awards to buyers/referrers/lawyers
 */
export interface IncentiveCampaign {
  id: string;
  developerId: string;
  projectId: string;

  // Campaign metadata
  name: string;
  nameBm: string;
  description: string;
  descriptionBm: string;

  // Budget
  budgetTotal: number;       // Total campaign budget (RM)
  budgetRemaining: number;   // Remaining budget (RM)
  currency: 'MYR';

  // Timeline
  startDate: string;         // ISO timestamp
  endDate: string | null;    // ISO timestamp (null = no end)

  // Caps
  maxAwardsPerCase: number;  // Max awards per case (default 1)
  maxAwardsPerRecipient: number; // Max awards per recipient (default 1)

  // Status
  status: CampaignStatus;

  // Audit
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

// =============================================================================
// RULE TYPES
// =============================================================================

/**
 * Incentive rule within a campaign
 * Defines trigger → recipient → reward mapping
 */
export interface IncentiveRule {
  id: string;
  campaignId: string;

  // Trigger
  trigger: IncentiveTrigger;
  triggerConditions?: Record<string, unknown>; // Additional conditions

  // Recipient
  recipientType: RecipientType;

  // Reward
  rewardType: RewardType;
  rewardAmount: number;      // Amount in RM (or voucher value)
  rewardDescription?: string; // e.g., "TnG e-Wallet"

  // Caps (per-rule)
  maxAwardsPerCase?: number;
  maxAwardsPerRecipient?: number;
  maxTotalAwards?: number;

  // Status
  isActive: boolean;

  // Audit
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// AWARD TYPES
// =============================================================================

/**
 * Award status lifecycle
 */
export type AwardStatus =
  | 'PENDING'       // Milestone triggered, awaiting verification
  | 'VERIFIED'      // Verified, awaiting approval
  | 'APPROVED'      // Approved, awaiting payout
  | 'PAID'          // Paid out to recipient
  | 'REJECTED'      // Rejected (fraud, ineligible, etc.)
  | 'CLAWBACK';     // Previously paid, now recovered

export const AWARD_STATUSES: readonly AwardStatus[] = [
  'PENDING',
  'VERIFIED',
  'APPROVED',
  'PAID',
  'REJECTED',
  'CLAWBACK',
] as const;

/**
 * Incentive award instance
 * Created when milestone is triggered
 */
export interface IncentiveAward {
  id: string;
  ruleId: string;
  campaignId: string;
  caseId: string;

  // Recipient
  recipientType: RecipientType;
  recipientId: string;       // Buyer hash, referrer ID, or lawyer ID
  recipientName?: string;    // For display

  // Reward
  rewardType: RewardType;
  rewardAmount: number;
  rewardDescription?: string;

  // Status
  status: AwardStatus;
  statusReason?: string;     // Reason for rejection/clawback

  // Payout details (populated when PAID)
  paidAt?: string;
  payoutReference?: string;
  payoutMethod?: string;     // Bank, voucher code, etc.

  // Verification
  verifiedAt?: string;
  verifiedBy?: string;

  // Trigger context
  triggeredBy: IncentiveTrigger;
  triggerProofEventId?: string;
  triggeredAt: string;

  // Audit
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// PROOF EVENT TYPES
// =============================================================================

/**
 * Incentive-related proof events
 */
export type IncentiveProofEventType =
  | 'CAMPAIGN_CREATED'
  | 'CAMPAIGN_ACTIVATED'
  | 'CAMPAIGN_PAUSED'
  | 'CAMPAIGN_RESUMED'
  | 'CAMPAIGN_EXHAUSTED'
  | 'CAMPAIGN_EXPIRED'
  | 'CAMPAIGN_CANCELLED'
  | 'RULE_CREATED'
  | 'RULE_UPDATED'
  | 'RULE_DEACTIVATED'
  | 'MILESTONE_EVALUATED'
  | 'AWARD_ISSUED'
  | 'AWARD_VERIFIED'
  | 'AWARD_APPROVED'
  | 'AWARD_PAID'
  | 'AWARD_REJECTED'
  | 'AWARD_CLAWBACK'
  | 'FORBIDDEN_TRIGGER_ATTEMPTED';

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Input for creating a campaign
 */
export interface CreateCampaignInput {
  developerId: string;
  projectId: string;
  name: string;
  nameBm: string;
  description: string;
  descriptionBm: string;
  budgetTotal: number;
  startDate: string;
  endDate?: string;
  maxAwardsPerCase?: number;
  maxAwardsPerRecipient?: number;
}

/**
 * Input for creating a rule
 */
export interface CreateRuleInput {
  campaignId: string;
  trigger: IncentiveTrigger;
  triggerConditions?: Record<string, unknown>;
  recipientType: RecipientType;
  rewardType: RewardType;
  rewardAmount: number;
  rewardDescription?: string;
  maxAwardsPerCase?: number;
  maxAwardsPerRecipient?: number;
  maxTotalAwards?: number;
}

/**
 * Input for evaluating a milestone
 */
export interface EvaluateMilestoneInput {
  caseId: string;
  trigger: IncentiveTrigger;
  proofEventId?: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Campaign status display config
 */
export const CAMPAIGN_STATUS_CONFIG: Record<CampaignStatus, {
  labelEn: string;
  labelBm: string;
  color: string;
  bgColor: string;
}> = {
  DRAFT: {
    labelEn: 'Draft',
    labelBm: 'Draf',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  ACTIVE: {
    labelEn: 'Active',
    labelBm: 'Aktif',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  PAUSED: {
    labelEn: 'Paused',
    labelBm: 'Dijeda',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  EXHAUSTED: {
    labelEn: 'Budget Exhausted',
    labelBm: 'Bajet Habis',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  EXPIRED: {
    labelEn: 'Expired',
    labelBm: 'Tamat Tempoh',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  CANCELLED: {
    labelEn: 'Cancelled',
    labelBm: 'Dibatalkan',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
};

/**
 * Award status display config
 */
export const AWARD_STATUS_CONFIG: Record<AwardStatus, {
  labelEn: string;
  labelBm: string;
  color: string;
  bgColor: string;
}> = {
  PENDING: {
    labelEn: 'Pending',
    labelBm: 'Menunggu',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  VERIFIED: {
    labelEn: 'Verified',
    labelBm: 'Disahkan',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  APPROVED: {
    labelEn: 'Approved',
    labelBm: 'Diluluskan',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
  },
  PAID: {
    labelEn: 'Paid',
    labelBm: 'Dibayar',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  REJECTED: {
    labelEn: 'Rejected',
    labelBm: 'Ditolak',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  CLAWBACK: {
    labelEn: 'Clawback',
    labelBm: 'Ditarik Balik',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
};

/**
 * Trigger display config
 */
export const TRIGGER_CONFIG: Record<AllowedTrigger, {
  labelEn: string;
  labelBm: string;
  descriptionEn: string;
  descriptionBm: string;
}> = {
  CONSENT_GRANTED: {
    labelEn: 'Consent Granted',
    labelBm: 'Persetujuan Diberikan',
    descriptionEn: 'Buyer completed PDPA consent',
    descriptionBm: 'Pembeli melengkapkan persetujuan PDPA',
  },
  PROFILE_CREATED: {
    labelEn: 'Profile Created',
    labelBm: 'Profil Dicipta',
    descriptionEn: 'Buyer profile established',
    descriptionBm: 'Profil pembeli diwujudkan',
  },
  FIRST_DOC_UPLOADED: {
    labelEn: 'First Document Uploaded',
    labelBm: 'Dokumen Pertama Dimuat Naik',
    descriptionEn: 'Any document uploaded',
    descriptionBm: 'Mana-mana dokumen dimuat naik',
  },
  DOCS_COMPLETE_CONFIRMED: {
    labelEn: 'Documents Complete',
    labelBm: 'Dokumen Lengkap',
    descriptionEn: 'All required documents submitted',
    descriptionBm: 'Semua dokumen diperlukan dihantar',
  },
  DOC_VERIFIED: {
    labelEn: 'Document Verified',
    labelBm: 'Dokumen Disahkan',
    descriptionEn: 'Individual document verified',
    descriptionBm: 'Dokumen individu disahkan',
  },
  SUBMISSION_ATTESTED: {
    labelEn: 'Submission Attested',
    labelBm: 'Penghantaran Disahkan',
    descriptionEn: 'Agent attests LPPSA portal submission',
    descriptionBm: 'Ejen mengesahkan penghantaran portal LPPSA',
  },
  TAC_TIMESTAMP_RECORDED: {
    labelEn: 'TAC Recorded',
    labelBm: 'TAC Direkod',
    descriptionEn: 'TAC verification completed',
    descriptionBm: 'Pengesahan TAC selesai',
  },
  REFERRAL_VALIDATED: {
    labelEn: 'Referral Validated',
    labelBm: 'Rujukan Disahkan',
    descriptionEn: 'Referrer code used by buyer',
    descriptionBm: 'Kod perujuk digunakan oleh pembeli',
  },
  REFERRAL_CASE_REACHED_STEP: {
    labelEn: 'Referral Case Progress',
    labelBm: 'Kemajuan Kes Rujukan',
    descriptionEn: 'Referred case hit milestone',
    descriptionBm: 'Kes rujukan mencapai pencapaian',
  },
  LAWYER_ASSIGNED_CONFIRMED: {
    labelEn: 'Lawyer Assigned',
    labelBm: 'Peguam Ditugaskan',
    descriptionEn: 'Lawyer assigned to case',
    descriptionBm: 'Peguam ditugaskan kepada kes',
  },
  CASE_VIEWED_BY_BUYER: {
    labelEn: 'Case Viewed',
    labelBm: 'Kes Dilihat',
    descriptionEn: 'Buyer logged in and viewed case',
    descriptionBm: 'Pembeli log masuk dan melihat kes',
  },
  RETURN_VISIT: {
    labelEn: 'Return Visit',
    labelBm: 'Lawatan Semula',
    descriptionEn: 'Buyer returned after 24h',
    descriptionBm: 'Pembeli kembali selepas 24 jam',
  },
  CAMPAIGN_MILESTONE: {
    labelEn: 'Campaign Milestone',
    labelBm: 'Pencapaian Kempen',
    descriptionEn: 'Custom campaign-specific milestone',
    descriptionBm: 'Pencapaian khusus kempen',
  },
};

// =============================================================================
// SAFE LANGUAGE DISCLAIMER
// =============================================================================

/**
 * Disclaimer text for all incentive displays
 * MUST appear on every reward/incentive UI
 */
export const INCENTIVE_DISCLAIMER = {
  en: 'This incentive is not related to LPPSA loan approval. Incentives are funded by the developer and do not guarantee or imply loan approval.',
  bm: 'Insentif ini tidak berkait dengan kelulusan pinjaman LPPSA. Insentif dibiayai oleh pemaju dan tidak menjamin atau membayangkan kelulusan pinjaman.',
} as const;
