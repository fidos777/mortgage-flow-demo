'use client';

/**
 * Payout Management UI
 * S5.6: Payout Workflow | PRD v3.6.3
 *
 * Developer/Admin interface for managing partner incentive payouts.
 * Workflow: Request → Approve → Process → Complete
 */

import { useState, useMemo } from 'react';
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  User,
  Building,
  Calendar,
  CreditCard,
  RefreshCw,
  Download,
  Eye,
  Send,
  Ban,
  FileText,
} from 'lucide-react';
import {
  PayoutRequest,
  PayoutStatus,
  PayoutStats,
  RecipientType,
  PAYOUT_STATUS_CONFIG,
  RECIPIENT_TYPE_CONFIG,
  PAYMENT_METHOD_CONFIG,
  formatPayoutAmount,
  canApprovePayout,
  canRejectPayout,
  canProcessPayout,
  canCancelPayout,
} from '@/lib/types/payout';

// =============================================================================
// PROPS
// =============================================================================

interface PayoutManagementProps {
  payouts: PayoutRequest[];
  stats: PayoutStats;
  onApprove: (payoutId: string, notes?: string) => Promise<void>;
  onReject: (payoutId: string, reason: string) => Promise<void>;
  onProcess: (payoutId: string) => Promise<void>;
  onCancel: (payoutId: string, reason: string) => Promise<void>;
  onViewDetails: (payoutId: string) => void;
  onExportBatch: (payoutIds: string[]) => void;
  onRefresh: () => void;
  locale?: 'bm' | 'en';
  isLoading?: boolean;
  userRole: 'DEVELOPER_ADMIN' | 'DEVELOPER_FINANCE' | 'SUPER_ADMIN';
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PayoutManagement({
  payouts,
  stats,
  onApprove,
  onReject,
  onProcess,
  onCancel,
  onViewDetails,
  onExportBatch,
  onRefresh,
  locale = 'bm',
  isLoading = false,
  userRole,
}: PayoutManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<PayoutStatus | 'ALL'>('ALL');
  const [filterRecipient, setFilterRecipient] = useState<RecipientType | 'ALL'>('ALL');
  const [selectedPayouts, setSelectedPayouts] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Filter payouts
  const filteredPayouts = useMemo(() => {
    return payouts.filter(p => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          p.recipientName.toLowerCase().includes(query) ||
          p.projectName.toLowerCase().includes(query) ||
          p.campaignName.toLowerCase().includes(query) ||
          (p.unitCode && p.unitCode.toLowerCase().includes(query)) ||
          p.id.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Status filter
      if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;

      // Recipient type filter
      if (filterRecipient !== 'ALL' && p.recipientType !== filterRecipient) return false;

      return true;
    });
  }, [payouts, searchQuery, filterStatus, filterRecipient]);

  // Group by status for quick counts
  const statusCounts = useMemo(() => {
    const counts: Record<PayoutStatus, number> = {
      PENDING: 0,
      APPROVED: 0,
      PROCESSING: 0,
      COMPLETED: 0,
      REJECTED: 0,
      CANCELLED: 0,
      FAILED: 0,
    };
    payouts.forEach(p => {
      counts[p.status]++;
    });
    return counts;
  }, [payouts]);

  // Toggle payout selection
  const toggleSelection = (payoutId: string) => {
    const newSelected = new Set(selectedPayouts);
    if (newSelected.has(payoutId)) {
      newSelected.delete(payoutId);
    } else {
      newSelected.add(payoutId);
    }
    setSelectedPayouts(newSelected);
  };

  // Select all filtered payouts
  const selectAll = () => {
    const newSelected = new Set(filteredPayouts.map(p => p.id));
    setSelectedPayouts(newSelected);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedPayouts(new Set());
  };

  // Handle approve
  const handleApprove = async (payoutId: string) => {
    setActionLoading(payoutId);
    try {
      await onApprove(payoutId);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!showRejectModal || rejectReason.length < 10) return;
    setActionLoading(showRejectModal);
    try {
      await onReject(showRejectModal, rejectReason);
      setShowRejectModal(null);
      setRejectReason('');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle process
  const handleProcess = async (payoutId: string) => {
    setActionLoading(payoutId);
    try {
      await onProcess(payoutId);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    if (!showCancelModal || rejectReason.length < 10) return;
    setActionLoading(showCancelModal);
    try {
      await onCancel(showCancelModal, rejectReason);
      setShowCancelModal(null);
      setRejectReason('');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle batch export
  const handleBatchExport = () => {
    const approvedSelected = Array.from(selectedPayouts).filter(id => {
      const payout = payouts.find(p => p.id === id);
      return payout?.status === 'APPROVED';
    });
    if (approvedSelected.length > 0) {
      onExportBatch(approvedSelected);
    }
  };

  // Render payout card
  const renderPayoutCard = (payout: PayoutRequest) => {
    const statusConfig = PAYOUT_STATUS_CONFIG[payout.status];
    const recipientConfig = RECIPIENT_TYPE_CONFIG[payout.recipientType];
    const paymentConfig = PAYMENT_METHOD_CONFIG[payout.paymentMethod];
    const isExpanded = expandedId === payout.id;
    const isSelected = selectedPayouts.has(payout.id);
    const isActionLoading = actionLoading === payout.id;

    return (
      <div
        key={payout.id}
        className={`
          bg-white rounded-xl border-2 transition-all
          ${isSelected ? 'border-teal-400 bg-teal-50/30' : 'border-slate-200'}
          ${isExpanded ? 'shadow-lg' : 'hover:border-slate-300'}
        `}
      >
        {/* Header */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelection(payout.id)}
              className="mt-1 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />

            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-slate-800 truncate">
                  {payout.recipientName}
                </h4>
                <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${statusConfig.bgColor} ${statusConfig.color}`}>
                  {locale === 'bm' ? statusConfig.labelBm : statusConfig.labelEn}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {locale === 'bm' ? recipientConfig.labelBm : recipientConfig.labelEn}
                </span>
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" />
                  {payout.projectName}
                </span>
                {payout.unitCode && (
                  <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                    {payout.unitCode}
                  </span>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-teal-700">
                {formatPayoutAmount(payout.amount)}
              </div>
              <div className="text-xs text-slate-500">
                {payout.rewardTrigger}
              </div>
            </div>

            {/* Expand Toggle */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : payout.id)}
              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => onViewDetails(payout.id)}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              {locale === 'bm' ? 'Lihat' : 'View'}
            </button>

            {canApprovePayout(payout) && userRole !== 'DEVELOPER_FINANCE' && (
              <button
                onClick={() => handleApprove(payout.id)}
                disabled={isActionLoading}
                className="px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-1 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {locale === 'bm' ? 'Lulus' : 'Approve'}
              </button>
            )}

            {canRejectPayout(payout) && userRole !== 'DEVELOPER_FINANCE' && (
              <button
                onClick={() => setShowRejectModal(payout.id)}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                {locale === 'bm' ? 'Tolak' : 'Reject'}
              </button>
            )}

            {canProcessPayout(payout) && (
              <button
                onClick={() => handleProcess(payout.id)}
                disabled={isActionLoading}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-1 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {payout.status === 'FAILED'
                  ? (locale === 'bm' ? 'Cuba Semula' : 'Retry')
                  : (locale === 'bm' ? 'Proses' : 'Process')}
              </button>
            )}

            {canCancelPayout(payout) && (
              <button
                onClick={() => setShowCancelModal(payout.id)}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 ml-auto"
              >
                <Ban className="w-4 h-4" />
                {locale === 'bm' ? 'Batal' : 'Cancel'}
              </button>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-sm">
              {/* Campaign */}
              <div>
                <div className="text-xs text-slate-500 mb-0.5">
                  {locale === 'bm' ? 'Kempen' : 'Campaign'}
                </div>
                <div className="font-medium text-slate-700">{payout.campaignName}</div>
              </div>

              {/* Payment Method */}
              <div>
                <div className="text-xs text-slate-500 mb-0.5">
                  {locale === 'bm' ? 'Kaedah Bayaran' : 'Payment Method'}
                </div>
                <div className="font-medium text-slate-700">
                  {locale === 'bm' ? paymentConfig.labelBm : paymentConfig.labelEn}
                </div>
              </div>

              {/* Requested Date */}
              <div>
                <div className="text-xs text-slate-500 mb-0.5">
                  {locale === 'bm' ? 'Tarikh Mohon' : 'Requested'}
                </div>
                <div className="font-medium text-slate-700">
                  {new Date(payout.requestedAt).toLocaleDateString(locale === 'bm' ? 'ms-MY' : 'en-MY')}
                </div>
              </div>

              {/* Approved/Rejected/Completed Info */}
              {payout.approvedAt && (
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">
                    {locale === 'bm' ? 'Diluluskan Oleh' : 'Approved By'}
                  </div>
                  <div className="font-medium text-slate-700">{payout.approvedBy}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(payout.approvedAt).toLocaleDateString(locale === 'bm' ? 'ms-MY' : 'en-MY')}
                  </div>
                </div>
              )}

              {payout.rejectedAt && (
                <div className="col-span-2">
                  <div className="text-xs text-slate-500 mb-0.5">
                    {locale === 'bm' ? 'Sebab Tolak' : 'Rejection Reason'}
                  </div>
                  <div className="font-medium text-red-700">{payout.rejectionReason}</div>
                </div>
              )}

              {payout.transactionRef && (
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">
                    {locale === 'bm' ? 'Rujukan Transaksi' : 'Transaction Ref'}
                  </div>
                  <div className="font-mono text-sm text-slate-700">{payout.transactionRef}</div>
                </div>
              )}

              {payout.failureReason && (
                <div className="col-span-2">
                  <div className="text-xs text-slate-500 mb-0.5">
                    {locale === 'bm' ? 'Sebab Gagal' : 'Failure Reason'}
                  </div>
                  <div className="font-medium text-red-700">{payout.failureReason}</div>
                  <div className="text-xs text-slate-400">
                    {locale === 'bm' ? 'Percubaan' : 'Attempts'}: {payout.retryCount}/{payout.maxRetries}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-teal-600" />
            {locale === 'bm' ? 'Pengurusan Pembayaran' : 'Payout Management'}
          </h1>
          <p className="text-slate-500 mt-1">
            {locale === 'bm'
              ? 'Lulus dan proses pembayaran ganjaran kempen'
              : 'Approve and process campaign reward payouts'}
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 text-amber-700">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">
              {locale === 'bm' ? 'Menunggu' : 'Pending'}
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-800">{statusCounts.PENDING}</div>
            <div className="text-sm text-amber-600">{formatPayoutAmount(stats.pendingAmount)}</div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              {locale === 'bm' ? 'Diluluskan' : 'Approved'}
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-blue-800">{statusCounts.APPROVED}</div>
            <div className="text-sm text-blue-600">{formatPayoutAmount(stats.approvedAmount)}</div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 text-purple-700">
            <RefreshCw className="w-5 h-5" />
            <span className="text-sm font-medium">
              {locale === 'bm' ? 'Diproses' : 'Processing'}
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-purple-800">{statusCounts.PROCESSING}</div>
            <div className="text-sm text-purple-600">{formatPayoutAmount(stats.processingAmount)}</div>
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 text-green-700">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium">
              {locale === 'bm' ? 'Selesai' : 'Completed'}
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-green-800">{statusCounts.COMPLETED}</div>
            <div className="text-sm text-green-600">{formatPayoutAmount(stats.completedAmount)}</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={locale === 'bm' ? 'Cari nama, projek, ID...' : 'Search name, project, ID...'}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-200 focus:border-teal-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
          className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm"
        >
          <option value="ALL">{locale === 'bm' ? 'Semua Status' : 'All Status'}</option>
          {Object.entries(PAYOUT_STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>
              {locale === 'bm' ? config.labelBm : config.labelEn} ({statusCounts[key as PayoutStatus]})
            </option>
          ))}
        </select>

        <select
          value={filterRecipient}
          onChange={e => setFilterRecipient(e.target.value as typeof filterRecipient)}
          className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm"
        >
          <option value="ALL">{locale === 'bm' ? 'Semua Penerima' : 'All Recipients'}</option>
          {Object.entries(RECIPIENT_TYPE_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>
              {locale === 'bm' ? config.labelBm : config.labelEn}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedPayouts.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
          <span className="text-sm text-teal-700">
            {selectedPayouts.size} {locale === 'bm' ? 'dipilih' : 'selected'}
          </span>
          <button
            onClick={handleBatchExport}
            className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            {locale === 'bm' ? 'Eksport Batch' : 'Export Batch'}
          </button>
          <button
            onClick={clearSelection}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            {locale === 'bm' ? 'Batal Pilih' : 'Clear'}
          </button>
          <button
            onClick={selectAll}
            className="px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-100 rounded-lg ml-auto"
          >
            {locale === 'bm' ? 'Pilih Semua' : 'Select All'}
          </button>
        </div>
      )}

      {/* Payout List */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-slate-300 mx-auto animate-spin" />
          <p className="text-slate-500 mt-3">
            {locale === 'bm' ? 'Memuatkan...' : 'Loading...'}
          </p>
        </div>
      ) : filteredPayouts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {payouts.length === 0
              ? (locale === 'bm' ? 'Tiada pembayaran' : 'No payouts')
              : (locale === 'bm' ? 'Tiada pembayaran ditemui' : 'No payouts found')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayouts.map(renderPayoutCard)}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {locale === 'bm' ? 'Tolak Pembayaran' : 'Reject Payout'}
            </h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder={locale === 'bm' ? 'Masukkan sebab penolakan (min 10 aksara)...' : 'Enter rejection reason (min 10 characters)...'}
              className="w-full p-3 border border-slate-200 rounded-lg resize-none h-24 focus:ring-2 focus:ring-red-200 focus:border-red-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                {locale === 'bm' ? 'Batal' : 'Cancel'}
              </button>
              <button
                onClick={handleReject}
                disabled={rejectReason.length < 10 || actionLoading === showRejectModal}
                className="flex-1 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {locale === 'bm' ? 'Tolak' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {locale === 'bm' ? 'Batal Pembayaran' : 'Cancel Payout'}
            </h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder={locale === 'bm' ? 'Masukkan sebab pembatalan (min 10 aksara)...' : 'Enter cancellation reason (min 10 characters)...'}
              className="w-full p-3 border border-slate-200 rounded-lg resize-none h-24 focus:ring-2 focus:ring-slate-200 focus:border-slate-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowCancelModal(null); setRejectReason(''); }}
                className="flex-1 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                {locale === 'bm' ? 'Kembali' : 'Back'}
              </button>
              <button
                onClick={handleCancel}
                disabled={rejectReason.length < 10 || actionLoading === showCancelModal}
                className="flex-1 py-2 text-white bg-slate-600 rounded-lg hover:bg-slate-700 disabled:opacity-50"
              >
                {locale === 'bm' ? 'Batal Pembayaran' : 'Cancel Payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PayoutManagement;
