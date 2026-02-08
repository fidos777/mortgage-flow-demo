/**
 * Payout Service
 * S5.6: Payout Workflow | PRD v3.6.3
 *
 * Service for managing partner incentive payouts.
 * Implements request → approve → process → complete workflow.
 *
 * LAYER 3 ISOLATION: This service handles Partner Incentive payouts only.
 * Agent compensation uses Layer 2 (Credits) which is a separate system.
 */

import {
  PayoutRequest,
  PayoutBatch,
  PayoutStats,
  PayoutStatus,
  PayoutMethod,
  RecipientType,
  BankAccountDisplay,
  isValidPayoutRecipient,
  getValidNextStatuses,
} from '@/lib/types/payout';

// =============================================================================
// PAYOUT SERVICE CLASS
// =============================================================================

export class PayoutService {
  // ---------------------------------------------------------------------------
  // PAYOUT REQUESTS
  // ---------------------------------------------------------------------------

  /**
   * Create a payout request from an award
   * Called automatically when an award reaches EARNED status
   */
  async createPayoutRequest(params: {
    awardId: string;
    campaignId: string;
    campaignName: string;
    recipientType: RecipientType;
    recipientId: string;
    recipientName: string;
    recipientEmail?: string;
    recipientPhone?: string;
    caseId: string;
    projectId: string;
    projectName: string;
    unitCode?: string;
    amount: number;
    rewardTrigger: string;
    paymentMethod: PayoutMethod;
    bankAccountRef?: string;
    requestedBy: string;
  }): Promise<{ success: boolean; payoutId?: string; error?: string }> {
    // Validate recipient type (NOT AGENT)
    if (!isValidPayoutRecipient(params.recipientType)) {
      return {
        success: false,
        error: `Invalid recipient type: ${params.recipientType}. Agents use Layer 2 Credits, not payouts.`,
      };
    }

    // Validate amount
    if (params.amount <= 0) {
      return { success: false, error: 'Payout amount must be greater than zero' };
    }

    // Check for duplicate payout request
    const existing = await this.findExistingPayout(params.awardId);
    if (existing) {
      return { success: false, error: 'Payout request already exists for this award' };
    }

    // Create payout request
    const payout: PayoutRequest = {
      id: this.generateId(),
      campaignId: params.campaignId,
      campaignName: params.campaignName,
      awardId: params.awardId,
      recipientType: params.recipientType,
      recipientId: params.recipientId,
      recipientName: params.recipientName,
      recipientEmail: params.recipientEmail,
      recipientPhone: params.recipientPhone,
      caseId: params.caseId,
      projectId: params.projectId,
      projectName: params.projectName,
      unitCode: params.unitCode,
      amount: params.amount,
      currency: 'MYR',
      rewardTrigger: params.rewardTrigger,
      paymentMethod: params.paymentMethod,
      bankAccountRef: params.bankAccountRef,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      requestedBy: params.requestedBy,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In real implementation, save to database
    console.log('[PayoutService] Created payout request:', payout.id);

    return { success: true, payoutId: payout.id };
  }

  /**
   * Get payout requests with filtering
   */
  async getPayoutRequests(filters: {
    developerId?: string;
    projectId?: string;
    campaignId?: string;
    status?: PayoutStatus | PayoutStatus[];
    recipientType?: RecipientType;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ payouts: PayoutRequest[]; total: number }> {
    // In real implementation, query database with filters
    // For demo, return mock data structure
    return { payouts: [], total: 0 };
  }

  /**
   * Get single payout request by ID
   */
  async getPayoutById(payoutId: string): Promise<PayoutRequest | null> {
    // In real implementation, query database
    return null;
  }

  // ---------------------------------------------------------------------------
  // APPROVAL WORKFLOW
  // ---------------------------------------------------------------------------

  /**
   * Approve a payout request
   */
  async approvePayout(params: {
    payoutId: string;
    approvedBy: string;
    notes?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const payout = await this.getPayoutById(params.payoutId);
    if (!payout) {
      return { success: false, error: 'Payout not found' };
    }

    // Validate status transition
    const validNextStatuses = getValidNextStatuses(payout.status);
    if (!validNextStatuses.includes('APPROVED')) {
      return {
        success: false,
        error: `Cannot approve payout in ${payout.status} status`,
      };
    }

    // Validate approver is not same as requester
    if (payout.requestedBy === params.approvedBy) {
      return {
        success: false,
        error: 'Approver cannot be the same as requester (4-eye principle)',
      };
    }

    // Update payout status
    const updates: Partial<PayoutRequest> = {
      status: 'APPROVED',
      approvedAt: new Date().toISOString(),
      approvedBy: params.approvedBy,
      approvalNotes: params.notes,
      updatedAt: new Date().toISOString(),
    };

    // In real implementation, update database
    console.log('[PayoutService] Approved payout:', params.payoutId);

    return { success: true };
  }

  /**
   * Reject a payout request
   */
  async rejectPayout(params: {
    payoutId: string;
    rejectedBy: string;
    reason: string;
  }): Promise<{ success: boolean; error?: string }> {
    const payout = await this.getPayoutById(params.payoutId);
    if (!payout) {
      return { success: false, error: 'Payout not found' };
    }

    // Validate status transition
    const validNextStatuses = getValidNextStatuses(payout.status);
    if (!validNextStatuses.includes('REJECTED')) {
      return {
        success: false,
        error: `Cannot reject payout in ${payout.status} status`,
      };
    }

    // Require rejection reason
    if (!params.reason || params.reason.trim().length < 10) {
      return {
        success: false,
        error: 'Rejection reason must be at least 10 characters',
      };
    }

    // Update payout status
    const updates: Partial<PayoutRequest> = {
      status: 'REJECTED',
      rejectedAt: new Date().toISOString(),
      rejectedBy: params.rejectedBy,
      rejectionReason: params.reason,
      updatedAt: new Date().toISOString(),
    };

    // In real implementation, update database
    console.log('[PayoutService] Rejected payout:', params.payoutId);

    return { success: true };
  }

  /**
   * Cancel a payout request
   */
  async cancelPayout(params: {
    payoutId: string;
    cancelledBy: string;
    reason: string;
  }): Promise<{ success: boolean; error?: string }> {
    const payout = await this.getPayoutById(params.payoutId);
    if (!payout) {
      return { success: false, error: 'Payout not found' };
    }

    // Validate status transition
    const validNextStatuses = getValidNextStatuses(payout.status);
    if (!validNextStatuses.includes('CANCELLED')) {
      return {
        success: false,
        error: `Cannot cancel payout in ${payout.status} status`,
      };
    }

    // Update payout status
    const updates: Partial<PayoutRequest> = {
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
    };

    // In real implementation, update database
    console.log('[PayoutService] Cancelled payout:', params.payoutId);

    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // PROCESSING
  // ---------------------------------------------------------------------------

  /**
   * Process approved payout (initiate bank transfer)
   */
  async processPayout(params: {
    payoutId: string;
    processedBy: string;
  }): Promise<{ success: boolean; transactionRef?: string; error?: string }> {
    const payout = await this.getPayoutById(params.payoutId);
    if (!payout) {
      return { success: false, error: 'Payout not found' };
    }

    // Validate status
    const validNextStatuses = getValidNextStatuses(payout.status);
    if (!validNextStatuses.includes('PROCESSING')) {
      return {
        success: false,
        error: `Cannot process payout in ${payout.status} status`,
      };
    }

    // Check retry count for failed payouts
    if (payout.status === 'FAILED' && payout.retryCount >= payout.maxRetries) {
      return {
        success: false,
        error: `Maximum retry attempts (${payout.maxRetries}) reached`,
      };
    }

    // Generate transaction reference
    const transactionRef = this.generateTransactionRef();

    // Update to processing status
    const updates: Partial<PayoutRequest> = {
      status: 'PROCESSING',
      processedAt: new Date().toISOString(),
      processedBy: params.processedBy,
      transactionRef,
      retryCount: payout.status === 'FAILED' ? payout.retryCount + 1 : 0,
      updatedAt: new Date().toISOString(),
    };

    // In real implementation:
    // 1. Update database
    // 2. Call bank/payment API
    // 3. Handle async callback for completion/failure
    console.log('[PayoutService] Processing payout:', params.payoutId, 'Ref:', transactionRef);

    return { success: true, transactionRef };
  }

  /**
   * Mark payout as completed (called by payment callback)
   */
  async completePayout(params: {
    payoutId: string;
    bankRef: string;
  }): Promise<{ success: boolean; error?: string }> {
    const payout = await this.getPayoutById(params.payoutId);
    if (!payout) {
      return { success: false, error: 'Payout not found' };
    }

    if (payout.status !== 'PROCESSING') {
      return {
        success: false,
        error: `Cannot complete payout in ${payout.status} status`,
      };
    }

    // Update to completed
    const updates: Partial<PayoutRequest> = {
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
      bankRef: params.bankRef,
      updatedAt: new Date().toISOString(),
    };

    // In real implementation, update database
    console.log('[PayoutService] Completed payout:', params.payoutId);

    return { success: true };
  }

  /**
   * Mark payout as failed (called by payment callback)
   */
  async failPayout(params: {
    payoutId: string;
    reason: string;
  }): Promise<{ success: boolean; error?: string }> {
    const payout = await this.getPayoutById(params.payoutId);
    if (!payout) {
      return { success: false, error: 'Payout not found' };
    }

    if (payout.status !== 'PROCESSING') {
      return {
        success: false,
        error: `Cannot fail payout in ${payout.status} status`,
      };
    }

    // Update to failed
    const updates: Partial<PayoutRequest> = {
      status: 'FAILED',
      failedAt: new Date().toISOString(),
      failureReason: params.reason,
      updatedAt: new Date().toISOString(),
    };

    // In real implementation, update database
    console.log('[PayoutService] Failed payout:', params.payoutId);

    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // BATCH OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Create a batch of payouts for processing
   */
  async createPayoutBatch(params: {
    developerId: string;
    projectId?: string;
    payoutIds: string[];
    createdBy: string;
    notes?: string;
  }): Promise<{ success: boolean; batchId?: string; error?: string }> {
    if (params.payoutIds.length === 0) {
      return { success: false, error: 'No payouts selected for batch' };
    }

    // Validate all payouts are in APPROVED status
    for (const payoutId of params.payoutIds) {
      const payout = await this.getPayoutById(payoutId);
      if (!payout) {
        return { success: false, error: `Payout ${payoutId} not found` };
      }
      if (payout.status !== 'APPROVED') {
        return {
          success: false,
          error: `Payout ${payoutId} is not in APPROVED status`,
        };
      }
    }

    // Calculate totals (would query actual amounts)
    const batch: PayoutBatch = {
      id: this.generateId(),
      batchNumber: this.generateBatchNumber(),
      developerId: params.developerId,
      projectId: params.projectId,
      payoutIds: params.payoutIds,
      totalAmount: 0, // Would sum from actual payouts
      payoutCount: params.payoutIds.length,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      createdBy: params.createdBy,
      successCount: 0,
      failedCount: 0,
      notes: params.notes,
    };

    // In real implementation, save to database
    console.log('[PayoutService] Created batch:', batch.id);

    return { success: true, batchId: batch.id };
  }

  /**
   * Process entire batch
   */
  async processBatch(params: {
    batchId: string;
    processedBy: string;
  }): Promise<{ success: boolean; error?: string }> {
    // In real implementation:
    // 1. Update batch status to PROCESSING
    // 2. Process each payout in batch
    // 3. Track success/failure counts
    // 4. Update batch to COMPLETED or PARTIAL
    console.log('[PayoutService] Processing batch:', params.batchId);
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // STATISTICS
  // ---------------------------------------------------------------------------

  /**
   * Get payout statistics
   */
  async getPayoutStats(filters: {
    developerId?: string;
    projectId?: string;
    campaignId?: string;
  }): Promise<PayoutStats> {
    // In real implementation, aggregate from database
    return {
      totalPending: 0,
      totalApproved: 0,
      totalProcessing: 0,
      totalCompleted: 0,
      totalRejected: 0,
      totalFailed: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      processingAmount: 0,
      completedAmount: 0,
      byRecipientType: {
        BUYER: { count: 0, amount: 0 },
        REFERRER: { count: 0, amount: 0 },
        LAWYER: { count: 0, amount: 0 },
      },
      thisMonth: { count: 0, amount: 0 },
      lastMonth: { count: 0, amount: 0 },
    };
  }

  // ---------------------------------------------------------------------------
  // BANK ACCOUNTS
  // ---------------------------------------------------------------------------

  /**
   * Get bank accounts for recipient (display only)
   */
  async getRecipientBankAccounts(
    recipientId: string
  ): Promise<BankAccountDisplay[]> {
    // In real implementation, fetch from secure storage
    return [];
  }

  /**
   * Verify bank account
   */
  async verifyBankAccount(params: {
    accountId: string;
    verifiedBy: string;
  }): Promise<{ success: boolean; error?: string }> {
    // In real implementation:
    // 1. Perform micro-deposit verification
    // 2. Update verification status
    console.log('[PayoutService] Verifying bank account:', params.accountId);
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private async findExistingPayout(awardId: string): Promise<PayoutRequest | null> {
    // In real implementation, query database
    return null;
  }

  private generateId(): string {
    return `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTransactionRef(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `TXN${date}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  private generateBatchNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `BATCH${date}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const payoutService = new PayoutService();
