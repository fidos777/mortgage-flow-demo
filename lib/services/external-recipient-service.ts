/**
 * External Recipient Service
 * S5.3: Incentive External Recipients | PRD v3.6.3 CR-012A
 *
 * Layer 3 (Partner Incentive) — recipient management with anti-fraud.
 *
 * Responsibilities:
 * - Referrer registration and verification
 * - Lawyer registration and assignment
 * - Referral code generation and validation
 * - Anti-fraud detection (self-referral, duplicates, farming)
 * - Payout request management
 */

import {
  Referrer,
  ReferrerStatus,
  Lawyer,
  LawyerStatus,
  ReferralLink,
  FraudFlag,
  FraudFlagType,
  RecipientVerification,
  PayoutRequest,
  PayoutStatus,
  RegisterReferrerInput,
  ValidateReferralInput,
  RegisterLawyerInput,
  AssignLawyerInput,
  generateReferralCode,
  isSelfReferral,
  calculateRiskScore,
  shouldAutoBlock,
  FRAUD_FLAG_CONFIG,
} from '../types/external-recipients';
import { RecipientType } from '../types/incentive';

// =============================================================================
// LOCAL STORAGE KEYS (Demo Mode)
// =============================================================================

const STORAGE_KEYS = {
  REFERRERS: 'external_referrers',
  LAWYERS: 'external_lawyers',
  REFERRAL_LINKS: 'referral_links',
  VERIFICATIONS: 'recipient_verifications',
  PAYOUTS: 'payout_requests',
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

export interface ValidationResult {
  valid: boolean;
  referrerId?: string;
  referrerName?: string;
  fraudFlag?: FraudFlagType;
  reason?: string;
}

// =============================================================================
// EXTERNAL RECIPIENT SERVICE CLASS
// =============================================================================

class ExternalRecipientService {
  private referrers: Map<string, Referrer> = new Map();
  private lawyers: Map<string, Lawyer> = new Map();
  private referralLinks: Map<string, ReferralLink> = new Map();
  private verifications: Map<string, RecipientVerification> = new Map();
  private payouts: Map<string, PayoutRequest> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // ===========================================================================
  // STORAGE OPERATIONS
  // ===========================================================================

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const referrersJson = localStorage.getItem(STORAGE_KEYS.REFERRERS);
      const lawyersJson = localStorage.getItem(STORAGE_KEYS.LAWYERS);
      const linksJson = localStorage.getItem(STORAGE_KEYS.REFERRAL_LINKS);
      const verificationsJson = localStorage.getItem(STORAGE_KEYS.VERIFICATIONS);
      const payoutsJson = localStorage.getItem(STORAGE_KEYS.PAYOUTS);

      if (referrersJson) {
        const arr: Referrer[] = JSON.parse(referrersJson);
        arr.forEach(r => this.referrers.set(r.id, r));
      }
      if (lawyersJson) {
        const arr: Lawyer[] = JSON.parse(lawyersJson);
        arr.forEach(l => this.lawyers.set(l.id, l));
      }
      if (linksJson) {
        const arr: ReferralLink[] = JSON.parse(linksJson);
        arr.forEach(l => this.referralLinks.set(l.id, l));
      }
      if (verificationsJson) {
        const arr: RecipientVerification[] = JSON.parse(verificationsJson);
        arr.forEach(v => this.verifications.set(v.id, v));
      }
      if (payoutsJson) {
        const arr: PayoutRequest[] = JSON.parse(payoutsJson);
        arr.forEach(p => this.payouts.set(p.id, p));
      }
    } catch (error) {
      console.error('[ExternalRecipientService] Failed to load from storage:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEYS.REFERRERS, JSON.stringify(Array.from(this.referrers.values())));
      localStorage.setItem(STORAGE_KEYS.LAWYERS, JSON.stringify(Array.from(this.lawyers.values())));
      localStorage.setItem(STORAGE_KEYS.REFERRAL_LINKS, JSON.stringify(Array.from(this.referralLinks.values())));
      localStorage.setItem(STORAGE_KEYS.VERIFICATIONS, JSON.stringify(Array.from(this.verifications.values())));
      localStorage.setItem(STORAGE_KEYS.PAYOUTS, JSON.stringify(Array.from(this.payouts.values())));
    } catch (error) {
      console.error('[ExternalRecipientService] Failed to save to storage:', error);
    }
  }

  // ===========================================================================
  // REFERRER OPERATIONS
  // ===========================================================================

  /**
   * Register a new referrer
   */
  registerReferrer(input: RegisterReferrerInput): ServiceResult<Referrer> {
    // Check for duplicate phone
    const existingByPhone = Array.from(this.referrers.values()).find(
      r => r.phone === input.phone
    );
    if (existingByPhone) {
      return {
        success: false,
        error: 'Nombor telefon sudah didaftarkan',
        errorCode: 'DUPLICATE_PHONE',
      };
    }

    const id = `REF-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const referralCode = generateReferralCode(input.name);
    const now = new Date().toISOString();

    const referrer: Referrer = {
      id,
      name: input.name,
      phone: input.phone,
      email: input.email,
      referralCode,
      verificationStatus: 'PENDING',
      totalReferrals: 0,
      successfulReferrals: 0,
      totalEarned: 0,
      fraudFlags: [],
      riskScore: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.referrers.set(id, referrer);
    this.saveToStorage();

    console.log('[ExternalRecipientService] Referrer registered:', id, referralCode);
    return { success: true, data: referrer };
  }

  /**
   * Get referrer by ID
   */
  getReferrer(referrerId: string): ServiceResult<Referrer> {
    const referrer = this.referrers.get(referrerId);
    if (!referrer) {
      return { success: false, error: 'Referrer not found', errorCode: 'NOT_FOUND' };
    }
    return { success: true, data: referrer };
  }

  /**
   * Get referrer by referral code
   */
  getReferrerByCode(code: string): Referrer | null {
    return Array.from(this.referrers.values()).find(
      r => r.referralCode.toUpperCase() === code.toUpperCase()
    ) || null;
  }

  /**
   * Verify referrer via OTP
   */
  verifyReferrer(referrerId: string): ServiceResult<Referrer> {
    const referrer = this.referrers.get(referrerId);
    if (!referrer) {
      return { success: false, error: 'Referrer not found', errorCode: 'NOT_FOUND' };
    }

    referrer.verificationStatus = 'ACTIVE';
    referrer.verifiedAt = new Date().toISOString();
    referrer.verifiedMethod = 'OTP';
    referrer.updatedAt = new Date().toISOString();

    this.referrers.set(referrerId, referrer);
    this.saveToStorage();

    console.log('[ExternalRecipientService] Referrer verified:', referrerId);
    return { success: true, data: referrer };
  }

  /**
   * Validate referral code and check for fraud
   * Called when buyer uses a referral code
   */
  validateReferral(input: ValidateReferralInput): ValidationResult {
    const { buyerHash, buyerPhone, referralCode } = input;

    // Find referrer by code
    const referrer = this.getReferrerByCode(referralCode);
    if (!referrer) {
      return {
        valid: false,
        reason: 'Kod rujukan tidak sah',
      };
    }

    // Check referrer status
    if (referrer.verificationStatus === 'BLOCKED') {
      return {
        valid: false,
        reason: 'Perujuk telah disekat',
      };
    }

    if (referrer.verificationStatus === 'SUSPENDED') {
      return {
        valid: false,
        reason: 'Perujuk dalam semakan',
      };
    }

    // ANTI-FRAUD: Self-referral check
    if (isSelfReferral(referrer.phone, buyerPhone)) {
      // Add fraud flag
      const fraudFlag: FraudFlag = {
        type: 'SELF_REFERRAL',
        detectedAt: new Date().toISOString(),
        details: `Buyer phone ${buyerPhone} matches referrer phone`,
        resolved: false,
      };

      referrer.fraudFlags.push(fraudFlag);
      referrer.riskScore = calculateRiskScore(referrer.fraudFlags);

      // Auto-block if needed
      if (shouldAutoBlock(referrer.fraudFlags)) {
        referrer.verificationStatus = 'BLOCKED';
      }

      referrer.updatedAt = new Date().toISOString();
      this.referrers.set(referrer.id, referrer);
      this.saveToStorage();

      console.log('[ExternalRecipientService] SELF_REFERRAL_BLOCKED:', referrer.id, buyerPhone);

      return {
        valid: false,
        fraudFlag: 'SELF_REFERRAL',
        reason: 'Rujukan sendiri tidak dibenarkan',
      };
    }

    // Check for duplicate referral (same buyer used code before)
    // In production, check database for existing referral records

    // Increment referral count
    referrer.totalReferrals++;
    referrer.updatedAt = new Date().toISOString();
    this.referrers.set(referrer.id, referrer);
    this.saveToStorage();

    console.log('[ExternalRecipientService] Referral validated:', referrer.id, buyerHash);

    return {
      valid: true,
      referrerId: referrer.id,
      referrerName: referrer.name,
    };
  }

  /**
   * Record successful referral (buyer reached milestone)
   */
  recordSuccessfulReferral(referrerId: string, amount: number): ServiceResult<Referrer> {
    const referrer = this.referrers.get(referrerId);
    if (!referrer) {
      return { success: false, error: 'Referrer not found', errorCode: 'NOT_FOUND' };
    }

    referrer.successfulReferrals++;
    referrer.totalEarned += amount;
    referrer.updatedAt = new Date().toISOString();

    this.referrers.set(referrerId, referrer);
    this.saveToStorage();

    console.log('[ExternalRecipientService] Successful referral recorded:', referrerId, amount);
    return { success: true, data: referrer };
  }

  // ===========================================================================
  // LAWYER OPERATIONS
  // ===========================================================================

  /**
   * Register a new lawyer
   */
  registerLawyer(input: RegisterLawyerInput): ServiceResult<Lawyer> {
    // Check for duplicate email
    const existingByEmail = Array.from(this.lawyers.values()).find(
      l => l.email === input.email
    );
    if (existingByEmail) {
      return {
        success: false,
        error: 'Emel sudah didaftarkan',
        errorCode: 'DUPLICATE_EMAIL',
      };
    }

    const id = `LAW-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    const lawyer: Lawyer = {
      id,
      name: input.name,
      firmName: input.firmName,
      phone: input.phone,
      email: input.email,
      verificationStatus: 'PENDING',
      totalCases: 0,
      completedCases: 0,
      totalEarned: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.lawyers.set(id, lawyer);
    this.saveToStorage();

    console.log('[ExternalRecipientService] Lawyer registered:', id);
    return { success: true, data: lawyer };
  }

  /**
   * Get lawyer by ID
   */
  getLawyer(lawyerId: string): ServiceResult<Lawyer> {
    const lawyer = this.lawyers.get(lawyerId);
    if (!lawyer) {
      return { success: false, error: 'Lawyer not found', errorCode: 'NOT_FOUND' };
    }
    return { success: true, data: lawyer };
  }

  /**
   * Verify lawyer (via agent assignment or OTP)
   */
  verifyLawyer(lawyerId: string, verifiedBy: string, method: 'AGENT_ASSIGN' | 'OTP'): ServiceResult<Lawyer> {
    const lawyer = this.lawyers.get(lawyerId);
    if (!lawyer) {
      return { success: false, error: 'Lawyer not found', errorCode: 'NOT_FOUND' };
    }

    lawyer.verificationStatus = 'VERIFIED';
    lawyer.verifiedAt = new Date().toISOString();
    lawyer.verifiedBy = verifiedBy;
    lawyer.verifiedMethod = method;
    lawyer.updatedAt = new Date().toISOString();

    this.lawyers.set(lawyerId, lawyer);
    this.saveToStorage();

    console.log('[ExternalRecipientService] Lawyer verified:', lawyerId, method);
    return { success: true, data: lawyer };
  }

  /**
   * Assign lawyer to case
   */
  assignLawyerToCase(input: AssignLawyerInput): ServiceResult<Lawyer> {
    const lawyer = this.lawyers.get(input.lawyerId);
    if (!lawyer) {
      return { success: false, error: 'Lawyer not found', errorCode: 'NOT_FOUND' };
    }

    // Auto-verify if pending
    if (lawyer.verificationStatus === 'PENDING') {
      lawyer.verificationStatus = 'VERIFIED';
      lawyer.verifiedAt = new Date().toISOString();
      lawyer.verifiedBy = input.assignedBy;
      lawyer.verifiedMethod = 'AGENT_ASSIGN';
    }

    // Update to active
    lawyer.verificationStatus = 'ACTIVE';
    lawyer.totalCases++;
    lawyer.updatedAt = new Date().toISOString();

    this.lawyers.set(input.lawyerId, lawyer);
    this.saveToStorage();

    console.log('[ExternalRecipientService] Lawyer assigned to case:', input.lawyerId, input.caseId);
    return { success: true, data: lawyer };
  }

  /**
   * Record completed case for lawyer
   */
  recordCompletedCase(lawyerId: string, amount: number): ServiceResult<Lawyer> {
    const lawyer = this.lawyers.get(lawyerId);
    if (!lawyer) {
      return { success: false, error: 'Lawyer not found', errorCode: 'NOT_FOUND' };
    }

    lawyer.completedCases++;
    lawyer.totalEarned += amount;
    lawyer.updatedAt = new Date().toISOString();

    this.lawyers.set(lawyerId, lawyer);
    this.saveToStorage();

    console.log('[ExternalRecipientService] Completed case recorded for lawyer:', lawyerId, amount);
    return { success: true, data: lawyer };
  }

  // ===========================================================================
  // REFERRAL LINK OPERATIONS
  // ===========================================================================

  /**
   * Create referral link for referrer
   */
  createReferralLink(
    referrerId: string,
    projectId?: string,
    developerId?: string
  ): ServiceResult<ReferralLink> {
    const referrer = this.referrers.get(referrerId);
    if (!referrer) {
      return { success: false, error: 'Referrer not found', errorCode: 'NOT_FOUND' };
    }

    const id = `LINK-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const code = referrer.referralCode;
    const fullUrl = `https://snang.my/r/${code}`;

    const link: ReferralLink = {
      id,
      referrerId,
      code,
      fullUrl,
      projectId,
      developerId,
      clickCount: 0,
      conversionCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.referralLinks.set(id, link);
    this.saveToStorage();

    console.log('[ExternalRecipientService] Referral link created:', id, fullUrl);
    return { success: true, data: link };
  }

  /**
   * Record link click
   */
  recordLinkClick(linkId: string): void {
    const link = this.referralLinks.get(linkId);
    if (link) {
      link.clickCount++;
      this.referralLinks.set(linkId, link);
      this.saveToStorage();
    }
  }

  /**
   * Record link conversion
   */
  recordLinkConversion(linkId: string): void {
    const link = this.referralLinks.get(linkId);
    if (link) {
      link.conversionCount++;
      this.referralLinks.set(linkId, link);
      this.saveToStorage();
    }
  }

  // ===========================================================================
  // PAYOUT OPERATIONS
  // ===========================================================================

  /**
   * Request payout for recipient
   */
  requestPayout(
    awardId: string,
    recipientType: RecipientType,
    recipientId: string,
    amount: number
  ): ServiceResult<PayoutRequest> {
    const id = `PAY-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    const payout: PayoutRequest = {
      id,
      awardId,
      recipientType,
      recipientId,
      amount,
      currency: 'MYR',
      method: 'BANK_TRANSFER',
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    this.payouts.set(id, payout);
    this.saveToStorage();

    console.log('[ExternalRecipientService] Payout requested:', id, amount);
    return { success: true, data: payout };
  }

  /**
   * Process payout
   */
  processPayout(payoutId: string): ServiceResult<PayoutRequest> {
    const payout = this.payouts.get(payoutId);
    if (!payout) {
      return { success: false, error: 'Payout not found', errorCode: 'NOT_FOUND' };
    }

    payout.status = 'PROCESSING';
    payout.processedAt = new Date().toISOString();
    payout.updatedAt = new Date().toISOString();

    this.payouts.set(payoutId, payout);
    this.saveToStorage();

    return { success: true, data: payout };
  }

  /**
   * Complete payout
   */
  completePayout(payoutId: string, transactionRef: string): ServiceResult<PayoutRequest> {
    const payout = this.payouts.get(payoutId);
    if (!payout) {
      return { success: false, error: 'Payout not found', errorCode: 'NOT_FOUND' };
    }

    payout.status = 'COMPLETED';
    payout.completedAt = new Date().toISOString();
    payout.transactionRef = transactionRef;
    payout.updatedAt = new Date().toISOString();

    this.payouts.set(payoutId, payout);
    this.saveToStorage();

    // Update recipient earnings
    if (payout.recipientType === 'REFERRER') {
      this.recordSuccessfulReferral(payout.recipientId, payout.amount);
    } else if (payout.recipientType === 'LAWYER') {
      this.recordCompletedCase(payout.recipientId, payout.amount);
    }

    console.log('[ExternalRecipientService] Payout completed:', payoutId, transactionRef);
    return { success: true, data: payout };
  }

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  /**
   * Get all referrers
   */
  getAllReferrers(): Referrer[] {
    return Array.from(this.referrers.values());
  }

  /**
   * Get all lawyers
   */
  getAllLawyers(): Lawyer[] {
    return Array.from(this.lawyers.values());
  }

  /**
   * Get pending payouts
   */
  getPendingPayouts(): PayoutRequest[] {
    return Array.from(this.payouts.values()).filter(p => p.status === 'PENDING');
  }

  /**
   * Clear all data (for testing)
   */
  clearAll(): void {
    this.referrers.clear();
    this.lawyers.clear();
    this.referralLinks.clear();
    this.verifications.clear();
    this.payouts.clear();
    this.saveToStorage();
    console.log('[ExternalRecipientService] All data cleared');
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let externalRecipientServiceInstance: ExternalRecipientService | null = null;

export function getExternalRecipientService(): ExternalRecipientService {
  if (!externalRecipientServiceInstance) {
    externalRecipientServiceInstance = new ExternalRecipientService();
  }
  return externalRecipientServiceInstance;
}

// Export class for testing
export { ExternalRecipientService };
