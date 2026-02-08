'use client';

/**
 * Temujanji Review Panel
 * CR-008: Doc-First Buyer Flow | PRD v3.6.3
 *
 * Agent view to review and manage buyer temujanji (appointments).
 * Shows pending appointments, allows confirmation/rescheduling.
 */

import { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  MessageCircle,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  MapPin,
  Building,
  RefreshCw,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type TemujanjiStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'NO_SHOW';

type ContactMethod = 'WHATSAPP' | 'CALL' | 'EMAIL';

interface BuyerSummary {
  id: string;
  name: string;
  phone: string;
  email?: string;
  icNumber?: string; // Masked
  documentsUploaded: number;
  documentsRequired: number;
  readinessBand?: 'GREEN' | 'AMBER' | 'RED';
}

interface TemujanjiSlot {
  id: string;
  buyerId: string;
  buyer: BuyerSummary;
  projectId: string;
  projectName: string;
  unitId?: string;
  unitCode?: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // minutes
  location?: string;
  contactMethod: ContactMethod;
  status: TemujanjiStatus;
  notes?: string;
  agentNotes?: string;
  createdAt: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

interface TemujanjiReviewPanelProps {
  temujanjiList: TemujanjiSlot[];
  onConfirm: (id: string, notes?: string) => Promise<void>;
  onReschedule: (id: string, newDate: string, newTime: string) => Promise<void>;
  onCancel: (id: string, reason: string) => Promise<void>;
  onComplete: (id: string, notes?: string) => Promise<void>;
  onViewBuyer: (buyerId: string) => void;
  locale?: 'bm' | 'en';
  isLoading?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_CONFIG: Record<TemujanjiStatus, {
  labelBm: string;
  labelEn: string;
  color: string;
  bgColor: string;
  icon: typeof CheckCircle;
}> = {
  PENDING: {
    labelBm: 'Menunggu',
    labelEn: 'Pending',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: Clock,
  },
  CONFIRMED: {
    labelBm: 'Disahkan',
    labelEn: 'Confirmed',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: CheckCircle,
  },
  COMPLETED: {
    labelBm: 'Selesai',
    labelEn: 'Completed',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
  },
  CANCELLED: {
    labelBm: 'Dibatalkan',
    labelEn: 'Cancelled',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: XCircle,
  },
  RESCHEDULED: {
    labelBm: 'Dijadualkan Semula',
    labelEn: 'Rescheduled',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: RefreshCw,
  },
  NO_SHOW: {
    labelBm: 'Tidak Hadir',
    labelEn: 'No Show',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    icon: AlertCircle,
  },
};

const CONTACT_CONFIG: Record<ContactMethod, { labelBm: string; labelEn: string; icon: typeof Phone }> = {
  WHATSAPP: { labelBm: 'WhatsApp', labelEn: 'WhatsApp', icon: MessageCircle },
  CALL: { labelBm: 'Panggilan', labelEn: 'Call', icon: Phone },
  EMAIL: { labelBm: 'Emel', labelEn: 'Email', icon: MessageCircle },
};

const READINESS_CONFIG: Record<string, { labelBm: string; labelEn: string; color: string }> = {
  GREEN: { labelBm: 'Sedia', labelEn: 'Ready', color: 'text-green-600 bg-green-100' },
  AMBER: { labelBm: 'Hampir Sedia', labelEn: 'Almost Ready', color: 'text-amber-600 bg-amber-100' },
  RED: { labelBm: 'Belum Sedia', labelEn: 'Not Ready', color: 'text-red-600 bg-red-100' },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function TemujanjiReviewPanel({
  temujanjiList,
  onConfirm,
  onReschedule,
  onCancel,
  onComplete,
  onViewBuyer,
  locale = 'bm',
  isLoading = false,
}: TemujanjiReviewPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TemujanjiStatus | 'ALL'>('ALL');
  const [filterDate, setFilterDate] = useState<'today' | 'tomorrow' | 'week' | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);

  // Filter temujanji
  const filteredList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return temujanjiList.filter(t => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          t.buyer.name.toLowerCase().includes(query) ||
          t.buyer.phone.includes(query) ||
          t.projectName.toLowerCase().includes(query) ||
          (t.unitCode && t.unitCode.toLowerCase().includes(query));
        if (!matches) return false;
      }

      // Status filter
      if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;

      // Date filter
      if (filterDate !== 'all') {
        const tDate = new Date(t.scheduledDate);
        tDate.setHours(0, 0, 0, 0);

        if (filterDate === 'today' && tDate.getTime() !== today.getTime()) return false;
        if (filterDate === 'tomorrow' && tDate.getTime() !== tomorrow.getTime()) return false;
        if (filterDate === 'week' && (tDate < today || tDate > weekEnd)) return false;
      }

      return true;
    });
  }, [temujanjiList, searchQuery, filterStatus, filterDate]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups = new Map<string, TemujanjiSlot[]>();

    filteredList.forEach(t => {
      const date = t.scheduledDate;
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(t);
    });

    // Sort by time within each date
    groups.forEach((slots, date) => {
      slots.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    });

    // Sort dates ascending
    return new Map(
      Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    );
  }, [filteredList]);

  // Statistics
  const stats = useMemo(() => ({
    total: temujanjiList.length,
    pending: temujanjiList.filter(t => t.status === 'PENDING').length,
    confirmed: temujanjiList.filter(t => t.status === 'CONFIRMED').length,
    today: temujanjiList.filter(t => {
      const today = new Date().toISOString().split('T')[0];
      return t.scheduledDate === today && ['PENDING', 'CONFIRMED'].includes(t.status);
    }).length,
  }), [temujanjiList]);

  // Format date for display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return locale === 'bm' ? 'Hari Ini' : 'Today';
    }
    if (dateStr === tomorrow.toISOString().split('T')[0]) {
      return locale === 'bm' ? 'Esok' : 'Tomorrow';
    }

    return date.toLocaleDateString(locale === 'bm' ? 'ms-MY' : 'en-MY', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  // Handle confirm action
  const handleConfirm = async (id: string) => {
    setActionLoading(id);
    try {
      await onConfirm(id);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle complete action
  const handleComplete = async (id: string) => {
    setActionLoading(id);
    try {
      await onComplete(id);
    } finally {
      setActionLoading(null);
    }
  };

  // Render single temujanji card
  const renderTemujanjiCard = (temujanji: TemujanjiSlot) => {
    const statusConfig = STATUS_CONFIG[temujanji.status];
    const contactConfig = CONTACT_CONFIG[temujanji.contactMethod];
    const readinessConfig = temujanji.buyer.readinessBand
      ? READINESS_CONFIG[temujanji.buyer.readinessBand]
      : null;
    const isExpanded = expandedId === temujanji.id;
    const isActionLoading = actionLoading === temujanji.id;
    const StatusIcon = statusConfig.icon;
    const ContactIcon = contactConfig.icon;

    return (
      <div
        key={temujanji.id}
        className={`
          bg-white rounded-xl border-2 transition-all
          ${isExpanded ? 'border-teal-300 shadow-lg' : 'border-slate-200 hover:border-slate-300'}
        `}
      >
        {/* Header - Always visible */}
        <button
          onClick={() => setExpandedId(isExpanded ? null : temujanji.id)}
          className="w-full p-4 text-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {/* Time */}
              <div className="text-center min-w-[60px]">
                <div className="text-lg font-bold text-slate-800">
                  {temujanji.scheduledTime}
                </div>
                <div className="text-xs text-slate-500">
                  {temujanji.duration} min
                </div>
              </div>

              {/* Buyer Info */}
              <div>
                <h4 className="font-semibold text-slate-800">{temujanji.buyer.name}</h4>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                  <ContactIcon className="w-3.5 h-3.5" />
                  <span>{temujanji.buyer.phone}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${statusConfig.bgColor} ${statusConfig.color}`}>
                    {locale === 'bm' ? statusConfig.labelBm : statusConfig.labelEn}
                  </span>
                  {readinessConfig && (
                    <span className={`text-xs px-2 py-0.5 rounded ${readinessConfig.color}`}>
                      {locale === 'bm' ? readinessConfig.labelBm : readinessConfig.labelEn}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Expand indicator */}
            <div className="flex items-center gap-2">
              {temujanji.unitCode && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                  {temujanji.unitCode}
                </span>
              )}
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-slate-100">
            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              {/* Project */}
              <div className="flex items-start gap-2">
                <Building className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">
                    {locale === 'bm' ? 'Projek' : 'Project'}
                  </div>
                  <div className="font-medium text-slate-700">{temujanji.projectName}</div>
                </div>
              </div>

              {/* Documents */}
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">
                    {locale === 'bm' ? 'Dokumen' : 'Documents'}
                  </div>
                  <div className="font-medium text-slate-700">
                    {temujanji.buyer.documentsUploaded}/{temujanji.buyer.documentsRequired}
                    {temujanji.buyer.documentsUploaded >= temujanji.buyer.documentsRequired && (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 inline ml-1" />
                    )}
                  </div>
                </div>
              </div>

              {/* Location */}
              {temujanji.location && (
                <div className="flex items-start gap-2 col-span-2">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500">
                      {locale === 'bm' ? 'Lokasi' : 'Location'}
                    </div>
                    <div className="font-medium text-slate-700">{temujanji.location}</div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {temujanji.notes && (
                <div className="col-span-2 bg-slate-50 p-3 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">
                    {locale === 'bm' ? 'Nota Pembeli' : 'Buyer Notes'}
                  </div>
                  <div className="text-slate-700">{temujanji.notes}</div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
              {/* View Buyer */}
              <button
                onClick={() => onViewBuyer(temujanji.buyerId)}
                className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5"
              >
                <User className="w-4 h-4" />
                {locale === 'bm' ? 'Lihat Pembeli' : 'View Buyer'}
              </button>

              {/* Status-specific actions */}
              {temujanji.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleConfirm(temujanji.id)}
                    disabled={isActionLoading}
                    className="px-3 py-2 text-sm bg-teal-600 text-white hover:bg-teal-700 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {locale === 'bm' ? 'Sahkan' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setShowRescheduleModal(temujanji.id)}
                    className="px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {locale === 'bm' ? 'Jadual Semula' : 'Reschedule'}
                  </button>
                  <button
                    onClick={() => setShowCancelModal(temujanji.id)}
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    {locale === 'bm' ? 'Batal' : 'Cancel'}
                  </button>
                </>
              )}

              {temujanji.status === 'CONFIRMED' && (
                <>
                  <button
                    onClick={() => handleComplete(temujanji.id)}
                    disabled={isActionLoading}
                    className="px-3 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {locale === 'bm' ? 'Tandakan Selesai' : 'Mark Complete'}
                  </button>
                  <button
                    onClick={() => setShowRescheduleModal(temujanji.id)}
                    className="px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {locale === 'bm' ? 'Jadual Semula' : 'Reschedule'}
                  </button>
                </>
              )}

              {/* Contact Buyer */}
              <a
                href={
                  temujanji.contactMethod === 'WHATSAPP'
                    ? `https://wa.me/6${temujanji.buyer.phone.replace(/\D/g, '')}`
                    : `tel:${temujanji.buyer.phone}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1.5 ml-auto"
              >
                <ContactIcon className="w-4 h-4" />
                {locale === 'bm' ? 'Hubungi' : 'Contact'}
              </a>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-50 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-teal-600" />
            {locale === 'bm' ? 'Temujanji Pembeli' : 'Buyer Appointments'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {locale === 'bm'
              ? `${stats.pending} menunggu pengesahan • ${stats.today} hari ini`
              : `${stats.pending} pending confirmation • ${stats.today} today`}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <div className="text-xs text-slate-500">
              {locale === 'bm' ? 'Menunggu' : 'Pending'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
            <div className="text-xs text-slate-500">
              {locale === 'bm' ? 'Disahkan' : 'Confirmed'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-600">{stats.today}</div>
            <div className="text-xs text-slate-500">
              {locale === 'bm' ? 'Hari Ini' : 'Today'}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={locale === 'bm' ? 'Cari nama, telefon, projek...' : 'Search name, phone, project...'}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-200 focus:border-teal-500"
          />
        </div>

        {/* Date Filter */}
        <select
          value={filterDate}
          onChange={e => setFilterDate(e.target.value as typeof filterDate)}
          className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm"
        >
          <option value="all">{locale === 'bm' ? 'Semua Tarikh' : 'All Dates'}</option>
          <option value="today">{locale === 'bm' ? 'Hari Ini' : 'Today'}</option>
          <option value="tomorrow">{locale === 'bm' ? 'Esok' : 'Tomorrow'}</option>
          <option value="week">{locale === 'bm' ? 'Minggu Ini' : 'This Week'}</option>
        </select>

        {/* Status Filter */}
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

      {/* Temujanji List */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-slate-300 mx-auto animate-spin" />
          <p className="text-slate-500 mt-3">
            {locale === 'bm' ? 'Memuatkan...' : 'Loading...'}
          </p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {locale === 'bm' ? 'Tiada temujanji ditemui' : 'No appointments found'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {locale === 'bm'
              ? 'Cuba ubah carian atau tapis'
              : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedByDate.entries()).map(([date, slots]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-teal-600" />
                <h3 className="font-semibold text-slate-700">{formatDate(date)}</h3>
                <span className="text-xs text-slate-400">
                  ({slots.length} {locale === 'bm' ? 'temujanji' : 'appointments'})
                </span>
              </div>

              {/* Slots */}
              <div className="space-y-3">
                {slots.map(renderTemujanjiCard)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reschedule Modal Placeholder */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {locale === 'bm' ? 'Jadual Semula Temujanji' : 'Reschedule Appointment'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {locale === 'bm'
                ? 'Fungsi ini akan datang dalam versi seterusnya.'
                : 'This feature is coming in the next version.'}
            </p>
            <button
              onClick={() => setShowRescheduleModal(null)}
              className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              {locale === 'bm' ? 'Tutup' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Cancel Modal Placeholder */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {locale === 'bm' ? 'Batal Temujanji' : 'Cancel Appointment'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {locale === 'bm'
                ? 'Fungsi ini akan datang dalam versi seterusnya.'
                : 'This feature is coming in the next version.'}
            </p>
            <button
              onClick={() => setShowCancelModal(null)}
              className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              {locale === 'bm' ? 'Tutup' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TemujanjiReviewPanel;
