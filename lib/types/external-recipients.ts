/**
 * External Recipients Types
 * S5.3: Incentive External Recipients | PRD v3.6.3 CR-012A
 *
 * Layer 3 (Partner Incentive) — recipient verification and anti-fraud.
 * Recipients: BUYER, REFERRER, LAWYER (NOT AGENT — agents use Layer 2 credits)
 *
 * Verification flows:
 * - BUYER: Auto-verified via PDPA consent (C1-C4)
 * - REFERRER: Code/link → buyer uses at Step 0 → REFERRAL_VALIDATED
 * - LAWYER: Agent-assign OR self-claim OTP → LAWYER_ASSIGNED_CONFIRMED
 */

import { RecipientType } from './incentive';

// =============================================================================
// REFERRER TYPES
// =============================================================================

export type ReferrerStatus =
  | 'PENDING'      // Referrer registered, not yet verified
  | 'ACTIVE'       // Verified and eligible for rewards
  | 'SUSPENDED'    // Temporarily blocked (fraud review)
  | 'BLOCKED';     // Permanently blocked

export interface Referrer {
  id: string;

  // Contact info
  name: string;
  phone: string;           // Malaysian format: +60xxxxxxxxx
  email?: string;

  // Verification
  referralCode: string;    // Unique code (e.g., "REF-AHMAD-2026")
  verificationStatus: ReferrerStatus;
  verifiedAt?: string;
  verifiedMethod?: 'OTP' | 'MANUAL';

  // Bank details (for payout)
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;

  // Statistics
  totalReferrals: number;
  successfulReferrals: number;  // Referrals that reached SUBMISSION_ATTESTED
  totalEarned: number;          // Total RM earned

  // Anti-fraud flags
  fraudFlags: FraudFlag[];
  riskScore: number;            // 0-100, higher = more risky

  // Audit
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// LAWYER TYPES
// =============================================================================

export type LawyerStatus =
  | 'PENDING'      // Registered, awaiting verification
  | 'VERIFIED'     // Verified by agent or OTP
  | 'ACTIVE'       // Assigned to cases
  | 'INACTIVE';    // No longer active

export interface Lawyer {
  id: string;

  // Contact info
  name: string;
  firmName: string;
  phone: string;
  email: string;

  // Verification
  verificationStatus: LawyerStatus;
  verifiedAt?: string;
  verifiedBy?: string;         // Agent ID or 'SELF_OTP'
  verifiedMethod?: 'AGENT_ASSIGN' | 'OTP';

  // Bank details (for payout)
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;

  // Statistics
  totalCases: number;
  completedCases: number;
  totalEarned: number;

  // Audit
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// FRAUD DETECTION
// =============================================================================

export type FraudFlagType =
  | 'SELF_REFERRAL'           // Referrer phone = buyer phone
  | 'DUPLICATE_REFERRAL'      // Same buyer referred multiple times
  | 'RAPID_REFERRALS'         // Too many referrals in short time
  | 'SUSPICIOUS_PATTERN'      // Unusual patterns detected
  | 'BANK_MISMATCH'           // Bank details don't match name
  | 'FARMING_SUSPECTED';      // Suspected reward farming

export interface FraudFlag {
  type: FraudFlagType;
  detectedAt: string;
  details: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export const FRAUD_FLAG_CONFIG: Record<FraudFlagType, {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  autoBlock: boolean;
  labelBm: string;
  labelEn: string;
}> = {
  SELF_REFERRAL: {
    severity: 'CRITICAL',
    autoBlock: true,
    labelBm: 'Rujukan Sendiri',
    labelEn: 'Self Referral',
  },
  DUPLICATE_REFERRAL: {
    severity: 'HIGH',
    autoBlock: true,
    labelBm: 'Rujukan Berganda',
    labelEn: 'Duplicate Referral',
  },
  RAPID_REFERRALS: {
    severity: 'MEDIUM',
    autoBlock: false,
    labelBm: 'Rujukan Terlalu Pantas',
    labelEn: 'Rapid Referrals',
  },
  SUSPICIOUS_PATTERN: {
    severity: 'MEDIUM',
    autoBlock: false,
    labelBm: 'Corak Mencurigakan',
    labelEn: 'Suspicious Pattern',
  },
  BANK_MISMATCH: {
    severity: 'LOW',
    autoBlock: false,
    labelBm: 'Butiran Bank Tidak Sepadan',
    labelEn: 'Bank Details Mismatch',
  },
  FARMING_SUSPECTED: {
    severity: 'HIGH',
    autoBlock: true,
    labelBm: 'Disyaki Farming Ganjaran',
    labelEn: 'Suspected Reward Farming',
  },
};

// =============================================================================
// REFERRAL LINK TYPES
// =============================================================================

export interface ReferralLink {
  id: string;
  referrerId: string;
  code: string;              // Short code for URL
  fullUrl: string;           // snang.my/r/{code}

  // Targeting (optional)
  projectId?: string;        // Specific project
  developerId?: string;      // Specific developer

  // Usage tracking
  clickCount: number;
  conversionCount: number;   // Buyers who completed consent

  // Status
  isActive: boolean;
  expiresAt?: string;

  // Audit
  createdAt: string;
}

// =============================================================================
// RECIPIENT VERIFICATION
// =============================================================================

export interface RecipientVerification {
  id: string;
  recipientType: RecipientType;
  recipientId: string;

  // Verification details
  method: 'OTP' | 'AGENT_ASSIGN' | 'PDPA_CONSENT' | 'MANUAL';
  phone?: string;
  email?: string;

  // OTP details
  otpCode?: string;
  otpExpiresAt?: string;
  otpAttempts: number;

  // Status
  status: 'PENDING' | 'SENT' | 'VERIFIED' | 'EXPIRED' | 'FAILED';
  verifiedAt?: string;

  // Audit
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface RegisterReferrerInput {
  name: string;
  phone: string;
  email?: string;
}

export interface ValidateReferralInput {
  buyerHash: string;
  buyerPhone: string;
  referralCode: string;
}

export interface RegisterLawyerInput {
  name: string;
  firmName: string;
  phone: string;
  email: string;
}

export interface AssignLawyerInput {
  caseId: string;
  lawyerId: string;
  assignedBy: string;  // Agent ID
}

// =============================================================================
// PAYOUT TYPES
// =============================================================================

export type PayoutStatus =
  | 'PENDING'        // Award approved, awaiting payout
  | 'PROCESSING'     // Payout initiated
  | 'COMPLETED'      // Successfully paid
  | 'FAILED'         // Payout failed
  | 'CANCELLED';     // Payout cancelled

export interface PayoutRequest {
  id: string;
  awardId: string;
  recipientType: RecipientType;
  recipientId: string;

  // Amount
  amount: number;
  currency: 'MYR';

  // Payout method
  method: 'BANK_TRANSFER' | 'EWALLET' | 'VOUCHER';
  bankName?: string;
  accountNumber?: string;
  ewalletType?: 'TNG' | 'GRABPAY' | 'BOOST';
  ewalletPhone?: string;

  // Status
  status: PayoutStatus;
  processedAt?: string;
  completedAt?: string;
  failedReason?: string;

  // Reference
  transactionRef?: string;

  // Audit
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a unique referral code
 */
export function generateReferralCode(name: string): string {
  const cleanName = name.replace(/\s+/g, '-').toUpperCase().substring(0, 10);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REF-${cleanName}-${random}`;
}

/**
 * Check if phone numbers match (anti-fraud: self-referral detection)
 */
export function isSelfReferral(referrerPhone: string, buyerPhone: string): boolean {
  // Normalize phone numbers (remove spaces, dashes, country code variations)
  const normalize = (phone: string) =>
    phone.replace(/[\s\-\(\)]/g, '').replace(/^\+60/, '0').replace(/^60/, '0');

  return normalize(referrerPhone) === normalize(buyerPhone);
}

/**
 * Calculate risk score based on fraud flags
 */
export function calculateRiskScore(flags: FraudFlag[]): number {
  const activeFlags = flags.filter(f => !f.resolved);

  let score = 0;
  for (const flag of activeFlags) {
    const config = FRAUD_FLAG_CONFIG[flag.type];
    switch (config.severity) {
      case 'CRITICAL': score += 40; break;
      case 'HIGH': score += 25; break;
      case 'MEDIUM': score += 15; break;
      case 'LOW': score += 5; break;
    }
  }

  return Math.min(score, 100);
}

/**
 * Check if recipient should be auto-blocked
 */
export function shouldAutoBlock(flags: FraudFlag[]): boolean {
  const activeFlags = flags.filter(f => !f.resolved);
  return activeFlags.some(f => FRAUD_FLAG_CONFIG[f.type].autoBlock);
}

// =============================================================================
// PROOF EVENTS
// =============================================================================

export type ExternalRecipientProofEventType =
  // Referrer Events
  | 'REFERRER_REGISTERED'
  | 'REFERRER_VERIFIED'
  | 'REFERRER_SUSPENDED'
  | 'REFERRER_BLOCKED'
  | 'REFERRAL_CODE_GENERATED'
  | 'REFERRAL_CODE_USED'
  | 'REFERRAL_VALIDATED'
  | 'REFERRAL_REJECTED'
  // Lawyer Events
  | 'LAWYER_REGISTERED'
  | 'LAWYER_VERIFIED'
  | 'LAWYER_ASSIGNED'
  | 'LAWYER_UNASSIGNED'
  // Fraud Events
  | 'FRAUD_FLAG_RAISED'
  | 'FRAUD_FLAG_RESOLVED'
  | 'SELF_REFERRAL_BLOCKED'
  | 'DUPLICATE_REFERRAL_BLOCKED'
  // Payout Events
  | 'PAYOUT_REQUESTED'
  | 'PAYOUT_PROCESSING'
  | 'PAYOUT_COMPLETED'
  | 'PAYOUT_FAILED';
