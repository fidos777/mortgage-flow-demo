'use client';

/**
 * Contact History Panel
 * CR-004: Agent Contact CTAs | PRD v3.6.3
 *
 * Displays contact attempt history for a case.
 * Helps agents track follow-up status and buyer responsiveness.
 */

import { useState } from 'react';
import {
  History,
  MessageCircle,
  Phone,
  Mail,
  Check,
  CheckCheck,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar,
  User,
} from 'lucide-react';
import { ContactAttempt, ContactPurpose } from './WhatsAppContactCTA';

// =============================================================================
// TYPES
// =============================================================================

interface ContactHistoryPanelProps {
  caseId: string;
  attempts: ContactAttempt[];
  locale?: 'bm' | 'en';
  maxVisible?: number;
}

// =============================================================================
// CONFIG
// =============================================================================

const PURPOSE_CONFIG: Record<ContactPurpose, { labelBm: string; labelEn: string; color: string }> = {
  DOC_REMINDER: { labelBm: 'Peringatan Dokumen', labelEn: 'Document Reminder', color: 'bg-amber-100 text-amber-700' },
  TAC_CONFIRMATION: { labelBm: 'Pengesahan TAC', labelEn: 'TAC Confirmation', color: 'bg-blue-100 text-blue-700' },
  TAC_RESCHEDULE: { labelBm: 'Jadual Semula TAC', labelEn: 'TAC Reschedule', color: 'bg-purple-100 text-purple-700' },
  KJ_REMINDER: { labelBm: 'Peringatan KJ', labelEn: 'KJ Reminder', color: 'bg-red-100 text-red-700' },
  LO_EXPIRY: { labelBm: 'LO Hampir Tamat', labelEn: 'LO Expiry', color: 'bg-orange-100 text-orange-700' },
  GENERAL_UPDATE: { labelBm: 'Kemaskini Umum', labelEn: 'General Update', color: 'bg-slate-100 text-slate-700' },
  WELCOME: { labelBm: 'Selamat Datang', labelEn: 'Welcome', color: 'bg-violet-100 text-violet-700' },
};

const STATUS_CONFIG = {
  SENT: { icon: Check, color: 'text-slate-500', labelBm: 'Dihantar', labelEn: 'Sent' },
  DELIVERED: { icon: CheckCheck, color: 'text-blue-500', labelBm: 'Diterima', labelEn: 'Delivered' },
  READ: { icon: CheckCheck, color: 'text-green-500', labelBm: 'Dibaca', labelEn: 'Read' },
  REPLIED: { icon: MessageCircle, color: 'text-green-600', labelBm: 'Dibalas', labelEn: 'Replied' },
  FAILED: { icon: XCircle, color: 'text-red-500', labelBm: 'Gagal', labelEn: 'Failed' },
};

const CHANNEL_ICON = {
  WHATSAPP: MessageCircle,
  CALL: Phone,
  SMS: Mail,
};

// =============================================================================
// DEMO DATA
// =============================================================================

const DEMO_ATTEMPTS: ContactAttempt[] = [
  {
    id: 'ca-1',
    caseId: 'case-1',
    purpose: 'TAC_CONFIRMATION',
    channel: 'WHATSAPP',
    status: 'READ',
    createdAt: '2025-02-09T10:30:00Z',
    notes: 'Pembeli sahkan akan hadir',
  },
  {
    id: 'ca-2',
    caseId: 'case-1',
    purpose: 'DOC_REMINDER',
    channel: 'WHATSAPP',
    status: 'DELIVERED',
    createdAt: '2025-02-07T14:15:00Z',
  },
  {
    id: 'ca-3',
    caseId: 'case-1',
    purpose: 'WELCOME',
    channel: 'WHATSAPP',
    status: 'REPLIED',
    createdAt: '2025-02-01T09:00:00Z',
    notes: 'Pembeli sangat responsif',
  },
  {
    id: 'ca-4',
    caseId: 'case-1',
    purpose: 'DOC_REMINDER',
    channel: 'CALL',
    status: 'SENT',
    createdAt: '2025-02-05T11:00:00Z',
    notes: 'Tidak menjawab, tinggal voicemail',
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function ContactHistoryPanel({
  caseId,
  attempts = DEMO_ATTEMPTS,
  locale = 'bm',
  maxVisible = 5,
}: ContactHistoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterChannel, setFilterChannel] = useState<'ALL' | 'WHATSAPP' | 'CALL' | 'SMS'>('ALL');

  // Filter attempts
  const filteredAttempts = attempts.filter(a => {
    if (filterChannel === 'ALL') return true;
    return a.channel === filterChannel;
  });

  const visibleAttempts = isExpanded
    ? filteredAttempts
    : filteredAttempts.slice(0, maxVisible);

  const hasMore = filteredAttempts.length > maxVisible;

  // Calculate stats
  const stats = {
    total: attempts.length,
    whatsapp: attempts.filter(a => a.channel === 'WHATSAPP').length,
    calls: attempts.filter(a => a.channel === 'CALL').length,
    replied: attempts.filter(a => a.status === 'REPLIED').length,
    responseRate: attempts.length > 0
      ? Math.round((attempts.filter(a => a.status === 'REPLIED' || a.status === 'READ').length / attempts.length) * 100)
      : 0,
  };

  // Get time ago
  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return locale === 'bm' ? `${diffDays} hari lalu` : `${diffDays}d ago`;
    if (diffHours > 0) return locale === 'bm' ? `${diffHours} jam lalu` : `${diffHours}h ago`;
    if (diffMins > 0) return locale === 'bm' ? `${diffMins} minit lalu` : `${diffMins}m ago`;
    return locale === 'bm' ? 'Baru sahaja' : 'Just now';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-violet-600" />
            {locale === 'bm' ? 'Sejarah Hubungan' : 'Contact History'}
          </h3>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">
              {stats.total} {locale === 'bm' ? 'percubaan' : 'attempts'}
            </span>
            <span className="text-green-600">
              {stats.responseRate}% {locale === 'bm' ? 'respons' : 'response'}
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mt-3">
          {(['ALL', 'WHATSAPP', 'CALL'] as const).map(channel => (
            <button
              key={channel}
              onClick={() => setFilterChannel(channel)}
              className={`
                px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${filterChannel === channel
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }
              `}
            >
              {channel === 'ALL'
                ? (locale === 'bm' ? 'Semua' : 'All')
                : channel === 'WHATSAPP'
                  ? 'WhatsApp'
                  : (locale === 'bm' ? 'Panggilan' : 'Calls')
              }
            </button>
          ))}
        </div>
      </div>

      {/* Attempts List */}
      <div className="divide-y divide-slate-100">
        {visibleAttempts.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              {locale === 'bm' ? 'Tiada sejarah hubungan' : 'No contact history'}
            </p>
          </div>
        ) : (
          visibleAttempts.map(attempt => {
            const purposeConfig = PURPOSE_CONFIG[attempt.purpose];
            const statusConfig = STATUS_CONFIG[attempt.status];
            const ChannelIcon = CHANNEL_ICON[attempt.channel];
            const StatusIcon = statusConfig.icon;

            return (
              <div key={attempt.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  {/* Channel Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    attempt.channel === 'WHATSAPP' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <ChannelIcon className={`w-4 h-4 ${
                      attempt.channel === 'WHATSAPP' ? 'text-green-600' : 'text-blue-600'
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${purposeConfig.color}`}>
                        {locale === 'bm' ? purposeConfig.labelBm : purposeConfig.labelEn}
                      </span>
                      <span className={`flex items-center gap-1 text-xs ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {locale === 'bm' ? statusConfig.labelBm : statusConfig.labelEn}
                      </span>
                    </div>

                    {attempt.notes && (
                      <p className="text-sm text-slate-600 mb-1">{attempt.notes}</p>
                    )}

                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getTimeAgo(attempt.createdAt)}
                      <span className="text-slate-300 mx-1">•</span>
                      {new Date(attempt.createdAt).toLocaleDateString('ms-MY')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Expand/Collapse */}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2 bg-slate-50 border-t border-slate-200 text-sm text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              {locale === 'bm' ? 'Tunjuk kurang' : 'Show less'}
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              {locale === 'bm' ? `Lihat ${filteredAttempts.length - maxVisible} lagi` : `View ${filteredAttempts.length - maxVisible} more`}
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default ContactHistoryPanel;
