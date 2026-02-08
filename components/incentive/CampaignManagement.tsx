'use client';

/**
 * Campaign Management UI
 * S5.5: Campaign Management | PRD v3.6.3
 *
 * Developer/Admin interface to create and manage partner incentive campaigns.
 * Uses safe language "Ganjaran Kempen" throughout.
 */

import { useState, useMemo } from 'react';
import {
  Gift,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Users,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  TrendingUp,
  BarChart2,
  Copy,
  Settings,
} from 'lucide-react';

// =============================================================================
// TYPES (from lib/types/incentive.ts)
// =============================================================================

type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'CANCELLED';
type RecipientType = 'BUYER' | 'REFERRER' | 'LAWYER';
type RewardTrigger = 'RESERVATION' | 'KJ_SIGNED' | 'LOAN_APPROVED' | 'DISBURSEMENT' | 'KEY_HANDOVER';

interface CampaignRule {
  id: string;
  campaignId: string;
  recipientType: RecipientType;
  trigger: RewardTrigger;
  rewardType: 'FIXED' | 'PERCENTAGE';
  rewardValue: number;
  maxPerRecipient?: number;
  conditions?: Record<string, unknown>;
  isActive: boolean;
}

interface Campaign {
  id: string;
  developerId: string;
  projectId: string;
  projectName: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  totalBudget: number;
  usedBudget: number;
  reservedBudget: number;
  rules: CampaignRule[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy?: string;
}

interface CampaignManagementProps {
  campaigns: Campaign[];
  onCreateCampaign: () => void;
  onEditCampaign: (id: string) => void;
  onDuplicateCampaign: (id: string) => void;
  onDeleteCampaign: (id: string) => Promise<void>;
  onToggleStatus: (id: string, newStatus: CampaignStatus) => Promise<void>;
  onViewAnalytics: (id: string) => void;
  locale?: 'bm' | 'en';
  isLoading?: boolean;
  userRole: 'DEVELOPER_ADMIN' | 'DEVELOPER_STAFF' | 'SUPER_ADMIN';
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_CONFIG: Record<CampaignStatus, {
  labelBm: string;
  labelEn: string;
  color: string;
  bgColor: string;
  icon: typeof CheckCircle;
}> = {
  DRAFT: {
    labelBm: 'Draf',
    labelEn: 'Draft',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    icon: Edit2,
  },
  SCHEDULED: {
    labelBm: 'Dijadualkan',
    labelEn: 'Scheduled',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: Calendar,
  },
  ACTIVE: {
    labelBm: 'Aktif',
    labelEn: 'Active',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
  },
  PAUSED: {
    labelBm: 'Dijeda',
    labelEn: 'Paused',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: Clock,
  },
  ENDED: {
    labelBm: 'Tamat',
    labelEn: 'Ended',
    color: 'text-slate-500',
    bgColor: 'bg-slate-100',
    icon: CheckCircle,
  },
  CANCELLED: {
    labelBm: 'Dibatalkan',
    labelEn: 'Cancelled',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: AlertTriangle,
  },
};

const TRIGGER_CONFIG: Record<RewardTrigger, { labelBm: string; labelEn: string }> = {
  RESERVATION: { labelBm: 'Tempahan', labelEn: 'Reservation' },
  KJ_SIGNED: { labelBm: 'KJ Ditandatangani', labelEn: 'KJ Signed' },
  LOAN_APPROVED: { labelBm: 'Pinjaman Diluluskan', labelEn: 'Loan Approved' },
  DISBURSEMENT: { labelBm: 'Pengeluaran', labelEn: 'Disbursement' },
  KEY_HANDOVER: { labelBm: 'Serahan Kunci', labelEn: 'Key Handover' },
};

const RECIPIENT_CONFIG: Record<RecipientType, { labelBm: string; labelEn: string; icon: typeof Users }> = {
  BUYER: { labelBm: 'Pembeli', labelEn: 'Buyer', icon: Users },
  REFERRER: { labelBm: 'Perujuk', labelEn: 'Referrer', icon: Gift },
  LAWYER: { labelBm: 'Peguam', labelEn: 'Lawyer', icon: Users },
};

// Incentive disclaimer as required by S5 rules
const INCENTIVE_DISCLAIMER_BM = 'Ganjaran Kempen tertakluk kepada terma & syarat. Pemaju berhak mengubah atau menamatkan kempen pada bila-bila masa.';
const INCENTIVE_DISCLAIMER_EN = 'Campaign Rewards are subject to terms & conditions. Developer reserves the right to modify or end campaigns at any time.';

// =============================================================================
// COMPONENT
// =============================================================================

export function CampaignManagement({
  campaigns,
  onCreateCampaign,
  onEditCampaign,
  onDuplicateCampaign,
  onDeleteCampaign,
  onToggleStatus,
  onViewAnalytics,
  locale = 'bm',
  isLoading = false,
  userRole,
}: CampaignManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | 'ALL'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          c.name.toLowerCase().includes(query) ||
          c.projectName.toLowerCase().includes(query) ||
          (c.description && c.description.toLowerCase().includes(query));
        if (!matches) return false;
      }

      // Status filter
      if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;

      return true;
    });
  }, [campaigns, searchQuery, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const active = campaigns.filter(c => c.status === 'ACTIVE');
    const totalBudget = active.reduce((sum, c) => sum + c.totalBudget, 0);
    const usedBudget = active.reduce((sum, c) => sum + c.usedBudget, 0);
    const totalRules = campaigns.reduce((sum, c) => sum + c.rules.length, 0);

    return {
      total: campaigns.length,
      active: active.length,
      draft: campaigns.filter(c => c.status === 'DRAFT').length,
      totalBudget,
      usedBudget,
      utilization: totalBudget > 0 ? Math.round((usedBudget / totalBudget) * 100) : 0,
      totalRules,
    };
  }, [campaigns]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 0 })}`;
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await onDeleteCampaign(id);
      setDeleteConfirm(null);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (id: string, currentStatus: CampaignStatus) => {
    const newStatus: CampaignStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setActionLoading(id);
    try {
      await onToggleStatus(id, newStatus);
    } finally {
      setActionLoading(null);
    }
  };

  // Can edit campaign (only drafts and scheduled)
  const canEdit = (status: CampaignStatus): boolean => {
    return ['DRAFT', 'SCHEDULED'].includes(status);
  };

  // Can delete campaign (only drafts)
  const canDelete = (status: CampaignStatus): boolean => {
    return status === 'DRAFT' && userRole !== 'DEVELOPER_STAFF';
  };

  // Render campaign card
  const renderCampaignCard = (campaign: Campaign) => {
    const statusConfig = STATUS_CONFIG[campaign.status];
    const isExpanded = expandedId === campaign.id;
    const StatusIcon = statusConfig.icon;
    const budgetPercent = campaign.totalBudget > 0
      ? Math.round((campaign.usedBudget / campaign.totalBudget) * 100)
      : 0;
    const reservedPercent = campaign.totalBudget > 0
      ? Math.round((campaign.reservedBudget / campaign.totalBudget) * 100)
      : 0;

    return (
      <div
        key={campaign.id}
        className={`
          bg-white rounded-xl border-2 transition-all
          ${isExpanded ? 'border-teal-300 shadow-lg' : 'border-slate-200 hover:border-slate-300'}
        `}
      >
        {/* Header */}
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-800">{campaign.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded ${statusConfig.bgColor} ${statusConfig.color}`}>
                  {locale === 'bm' ? statusConfig.labelBm : statusConfig.labelEn}
                </span>
              </div>
              <p className="text-sm text-slate-500">{campaign.projectName}</p>
              {campaign.description && (
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{campaign.description}</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              {campaign.status === 'ACTIVE' && (
                <button
                  onClick={() => handleStatusToggle(campaign.id, campaign.status)}
                  disabled={actionLoading === campaign.id}
                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                  title={locale === 'bm' ? 'Jeda' : 'Pause'}
                >
                  <Clock className="w-4 h-4" />
                </button>
              )}
              {campaign.status === 'PAUSED' && (
                <button
                  onClick={() => handleStatusToggle(campaign.id, campaign.status)}
                  disabled={actionLoading === campaign.id}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                  title={locale === 'bm' ? 'Aktifkan' : 'Activate'}
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setExpandedId(isExpanded ? null : campaign.id)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Budget Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-slate-600">
                {locale === 'bm' ? 'Bajet Digunakan' : 'Budget Used'}
              </span>
              <span className="font-medium text-slate-800">
                {formatCurrency(campaign.usedBudget)} / {formatCurrency(campaign.totalBudget)}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all"
                style={{ width: `${Math.min(budgetPercent + reservedPercent, 100)}%` }}
              >
                <div
                  className="h-full bg-teal-300"
                  style={{ width: `${reservedPercent > 0 ? (reservedPercent / (budgetPercent + reservedPercent)) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-slate-500">{budgetPercent}% {locale === 'bm' ? 'dibayar' : 'paid'}</span>
              {reservedPercent > 0 && (
                <span className="text-teal-600">{reservedPercent}% {locale === 'bm' ? 'ditempah' : 'reserved'}</span>
              )}
            </div>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(campaign.startDate).toLocaleDateString(locale === 'bm' ? 'ms-MY' : 'en-MY')}
                {' - '}
                {new Date(campaign.endDate).toLocaleDateString(locale === 'bm' ? 'ms-MY' : 'en-MY')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              <span>
                {campaign.rules.length} {locale === 'bm' ? 'peraturan' : 'rules'}
              </span>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-slate-100">
            {/* Rules Summary */}
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                {locale === 'bm' ? 'Peraturan Ganjaran' : 'Reward Rules'}
              </h4>
              <div className="space-y-2">
                {campaign.rules.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">
                    {locale === 'bm' ? 'Tiada peraturan ditetapkan' : 'No rules configured'}
                  </p>
                ) : (
                  campaign.rules.map(rule => {
                    const recipientConfig = RECIPIENT_CONFIG[rule.recipientType];
                    const triggerConfig = TRIGGER_CONFIG[rule.trigger];
                    const RecipientIcon = recipientConfig.icon;

                    return (
                      <div
                        key={rule.id}
                        className={`
                          flex items-center justify-between p-2 rounded-lg
                          ${rule.isActive ? 'bg-slate-50' : 'bg-slate-100 opacity-60'}
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <RecipientIcon className="w-4 h-4 text-slate-500" />
                          <span className="text-sm">
                            {locale === 'bm' ? recipientConfig.labelBm : recipientConfig.labelEn}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className="text-sm text-slate-600">
                            {locale === 'bm' ? triggerConfig.labelBm : triggerConfig.labelEn}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-teal-700">
                            {rule.rewardType === 'FIXED'
                              ? formatCurrency(rule.rewardValue)
                              : `${rule.rewardValue}%`}
                          </span>
                          {!rule.isActive && (
                            <span className="text-xs text-slate-400">
                              ({locale === 'bm' ? 'tidak aktif' : 'inactive'})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => onViewAnalytics(campaign.id)}
                className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5"
              >
                <BarChart2 className="w-4 h-4" />
                {locale === 'bm' ? 'Analitik' : 'Analytics'}
              </button>

              {canEdit(campaign.status) && (
                <button
                  onClick={() => onEditCampaign(campaign.id)}
                  className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1.5"
                >
                  <Edit2 className="w-4 h-4" />
                  {locale === 'bm' ? 'Edit' : 'Edit'}
                </button>
              )}

              <button
                onClick={() => onDuplicateCampaign(campaign.id)}
                className="px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                {locale === 'bm' ? 'Duplikat' : 'Duplicate'}
              </button>

              {canDelete(campaign.status) && (
                <button
                  onClick={() => setDeleteConfirm(campaign.id)}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1.5 ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  {locale === 'bm' ? 'Padam' : 'Delete'}
                </button>
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
            <Gift className="w-7 h-7 text-teal-600" />
            {locale === 'bm' ? 'Pengurusan Ganjaran Kempen' : 'Campaign Rewards Management'}
          </h1>
          <p className="text-slate-500 mt-1">
            {locale === 'bm'
              ? 'Cipta dan urus kempen ganjaran rakan kongsi'
              : 'Create and manage partner reward campaigns'}
          </p>
        </div>

        {userRole !== 'DEVELOPER_STAFF' && (
          <button
            onClick={onCreateCampaign}
            className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            {locale === 'bm' ? 'Kempen Baru' : 'New Campaign'}
          </button>
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          {locale === 'bm' ? INCENTIVE_DISCLAIMER_BM : INCENTIVE_DISCLAIMER_EN}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-sm text-slate-500 mb-1">
            {locale === 'bm' ? 'Jumlah Kempen' : 'Total Campaigns'}
          </div>
          <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
          <div className="text-xs text-slate-400 mt-1">
            {stats.draft} {locale === 'bm' ? 'draf' : 'drafts'}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-sm text-slate-500 mb-1">
            {locale === 'bm' ? 'Kempen Aktif' : 'Active Campaigns'}
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-sm text-slate-500 mb-1">
            {locale === 'bm' ? 'Jumlah Bajet' : 'Total Budget'}
          </div>
          <div className="text-2xl font-bold text-teal-600">{formatCurrency(stats.totalBudget)}</div>
          <div className="text-xs text-slate-400 mt-1">
            {stats.utilization}% {locale === 'bm' ? 'digunakan' : 'utilized'}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-sm text-slate-500 mb-1">
            {locale === 'bm' ? 'Jumlah Peraturan' : 'Total Rules'}
          </div>
          <div className="text-2xl font-bold text-purple-600">{stats.totalRules}</div>
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
            placeholder={locale === 'bm' ? 'Cari kempen...' : 'Search campaigns...'}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-200 focus:border-teal-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
          className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm"
        >
          <option value="ALL">{locale === 'bm' ? 'Semua Status' : 'All Status'}</option>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>
              {locale === 'bm' ? config.labelBm : config.labelEn}
            </option>
          ))}
        </select>
      </div>

      {/* Campaign List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 mt-3">
            {locale === 'bm' ? 'Memuatkan...' : 'Loading...'}
          </p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Gift className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {campaigns.length === 0
              ? (locale === 'bm' ? 'Tiada kempen dicipta lagi' : 'No campaigns created yet')
              : (locale === 'bm' ? 'Tiada kempen ditemui' : 'No campaigns found')}
          </p>
          {campaigns.length === 0 && userRole !== 'DEVELOPER_STAFF' && (
            <button
              onClick={onCreateCampaign}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              {locale === 'bm' ? 'Cipta Kempen Pertama' : 'Create First Campaign'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map(renderCampaignCard)}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {locale === 'bm' ? 'Padam Kempen?' : 'Delete Campaign?'}
              </h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              {locale === 'bm'
                ? 'Tindakan ini tidak boleh dibatalkan. Kempen akan dipadamkan secara kekal.'
                : 'This action cannot be undone. The campaign will be permanently deleted.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                {locale === 'bm' ? 'Batal' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={actionLoading === deleteConfirm}
                className="flex-1 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {locale === 'bm' ? 'Padam' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignManagement;
