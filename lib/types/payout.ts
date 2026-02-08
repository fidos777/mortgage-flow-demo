/**
 * Payout Types
 * S5.6: Payout Workflow | PRD v3.6.3
 *
 * Types for partner incentive payouts.
 * Layer 3 isolation: Payouts are for Partner Incentives only, NOT agent credits.
 */

// =============================================================================
// PAYOUT STATUS
// =============================================================================

export type PayoutStatus =
  | 'PENDING'      // Awaiting review
  | 'APPROVED'     // Approved, awaiting processing
  | 'PROCESSING'   // Being processed (bank transfer initiated)
  | 'COMPLETED'    // Successfully paid
  | 'REJECTED'     // Rejected by approver
  | 'CANCELLED'    // Cancelled by requester or system
  | 'FAILED';      // Processing failed (bank error)

export type PayoutMethod = 'BANK_TRANSFER' | 'CHEQUE' | 'EWALLET';

export type RecipientType = 'BUYER' | 'REFERRER' | 'LAWYER';
// NOTE: AGENT is NOT a valid recipient type - agents use Layer 2 Credits

// =============================================================================
// PAYOUT REQUEST
// =============================================================================

export interface PayoutRequest {
  id: string;
  campaignId: string;
  campaignName: string;
  awardId: string;
  recipientType: RecipientType;
  recipientId: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;

  // Case reference
  caseId: string;
  projectId: string;
  projectName: string;
  unitCode?: string;

  // Amount
  amount: number;
  currency: 'MYR';
  rewardTrigger: string;

  // Bank details (encrypted reference)
  paymentMethod: PayoutMethod;
  bankAccountRef?: string; // Reference to encrypted bank details
  ewalletRef?: string;

  // Status
  status: PayoutStatus;
  requestedAt: string;
  requestedBy: string;

  // Approval
  approvedAt?: string;
  approvedBy?: string;
  approvalNotes?: string;

  // Rejection
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;

  // Processing
  processedAt?: string;
  processedBy?: string;
  transactionRef?: string;
  bankRef?: string;

  // Completion
  completedAt?: string;
  paidAt?: string;

  // Failure
  failedAt?: string;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;

  // Audit
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// PAYOUT BATCH
// =============================================================================

export interface PayoutBatch {
  id: string;
  batchNumber: string;
  developerId: string;
  projectId?: string;

  payoutIds: string[];
  totalAmount: number;
  payoutCount: number;

  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';

  createdAt: string;
  createdBy: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  processedAt?: string;
  completedAt?: string;

  successCount: number;
  failedCount: number;
  notes?: string;
}

// =============================================================================
// BANK ACCOUNT (for display only - actual data encrypted)
// =============================================================================

export interface BankAccountDisplay {
  id: string;
  recipientId: string;
  bankName: string;
  accountNumberMasked: string; // e.g., "****1234"
  accountHolderName: string;
  isVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
}

// =============================================================================
// PAYOUT STATISTICS
// =============================================================================

export interface PayoutStats {
  totalPending: number;
  totalApproved: number;
  totalProcessing: number;
  totalCompleted: number;
  totalRejected: number;
  totalFailed: number;

  pendingAmount: number;
  approvedAmount: number;
  processingAmount: number;
  completedAmount: number;

  // By recipient type
  byRecipientType: Record<RecipientType, {
    count: number;
    amount: number;
  }>;

  // Period stats
  thisMonth: {
    count: number;
    amount: number;
  };
  lastMonth: {
    count: number;
    amount: number;
  };
}

// =============================================================================
// STATUS CONFIG
// =============================================================================

export const PAYOUT_STATUS_CONFIG: Record<PayoutStatus, {
  labelBm: string;
  labelEn: string;
  color: string;
  bgColor: string;
  canApprove: boolean;
  canReject: boolean;
  canProcess: boolean;
  canCancel: boolean;
}> = {
  PENDING: {
    labelBm: 'Menunggu Kelulusan',
    labelEn: 'Pending Approval',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    canApprove: true,
    canReject: true,
    canProcess: false,
    canCancel: true,
  },
  APPROVED: {
    labelBm: 'Diluluskan',
    labelEn: 'Approved',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    canApprove: false,
    canReject: false,
    canProcess: true,
    canCancel: true,
  },
  PROCESSING: {
    labelBm: 'Sedang Diproses',
    labelEn: 'Processing',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    canApprove: false,
    canReject: false,
    canProcess: false,
    canCancel: false,
  },
  COMPLETED: {
    labelBm: 'Selesai',
    labelEn: 'Completed',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    canApprove: false,
    canReject: false,
    canProcess: false,
    canCancel: false,
  },
  REJECTED: {
    labelBm: 'Ditolak',
    labelEn: 'Rejected',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    canApprove: false,
    canReject: false,
    canProcess: false,
    canCancel: false,
  },
  CANCELLED: {
    labelBm: 'Dibatalkan',
    labelEn: 'Cancelled',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    canApprove: false,
    canReject: false,
    canProcess: false,
    canCancel: false,
  },
  FAILED: {
    labelBm: 'Gagal',
    labelEn: 'Failed',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    canApprove: false,
    canReject: false,
    canProcess: true, // Can retry
    canCancel: true,
  },
};

export const PAYMENT_METHOD_CONFIG: Record<PayoutMethod, {
  labelBm: string;
  labelEn: string;
}> = {
  BANK_TRANSFER: { labelBm: 'Pindahan Bank', labelEn: 'Bank Transfer' },
  CHEQUE: { labelBm: 'Cek', labelEn: 'Cheque' },
  EWALLET: { labelBm: 'E-Wallet', labelEn: 'E-Wallet' },
};

export const RECIPIENT_TYPE_CONFIG: Record<RecipientType, {
  labelBm: string;
  labelEn: string;
}> = {
  BUYER: { labelBm: 'Pembeli', labelEn: 'Buyer' },
  REFERRER: { labelBm: 'Perujuk', labelEn: 'Referrer' },
  LAWYER: { labelBm: 'Peguam', labelEn: 'Lawyer' },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format currency for display
 */
export function formatPayoutAmount(amount: number): string {
  return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Check if payout can be approved
 */
export function canApprovePayout(payout: PayoutRequest): boolean {
  return PAYOUT_STATUS_CONFIG[payout.status].canApprove;
}

/**
 * Check if payout can be rejected
 */
export function canRejectPayout(payout: PayoutRequest): boolean {
  return PAYOUT_STATUS_CONFIG[payout.status].canReject;
}

/**
 * Check if payout can be processed
 */
export function canProcessPayout(payout: PayoutRequest): boolean {
  return PAYOUT_STATUS_CONFIG[payout.status].canProcess;
}

/**
 * Check if payout can be cancelled
 */
export function canCancelPayout(payout: PayoutRequest): boolean {
  return PAYOUT_STATUS_CONFIG[payout.status].canCancel;
}

/**
 * Get next valid statuses for a payout
 */
export function getValidNextStatuses(currentStatus: PayoutStatus): PayoutStatus[] {
  const transitions: Record<PayoutStatus, PayoutStatus[]> = {
    PENDING: ['APPROVED', 'REJECTED', 'CANCELLED'],
    APPROVED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['COMPLETED', 'FAILED'],
    COMPLETED: [],
    REJECTED: [],
    CANCELLED: [],
    FAILED: ['PROCESSING', 'CANCELLED'], // Retry or cancel
  };
  return transitions[currentStatus];
}

/**
 * Validate recipient type is allowed for payouts
 * IMPORTANT: Agents are NOT valid recipients - they use Layer 2 Credits
 */
export function isValidPayoutRecipient(recipientType: string): recipientType is RecipientType {
  return ['BUYER', 'REFERRER', 'LAWYER'].includes(recipientType);
}
