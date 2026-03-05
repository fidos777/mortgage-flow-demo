// components/developer/PipelineActionPanel.tsx
// CR-KP-002 Sprint 1 (A5): Pipeline Action Panel
// Developer can take actions on pipeline entries (remind, escalate, request docs)

'use client';

import { useState } from 'react';
import type { Booking, PipelineAction, PipelineActionResult } from '@/types/cr-kp-002';
import { LoanTypeBadge } from '@/components/LoanTypeBadge';

export interface PipelineActionPanelProps {
  booking: Booking;
  onAction?: (bookingId: string, action: PipelineAction, note?: string) => void;
  onClose?: () => void;
}

interface ActionConfig {
  action: PipelineAction;
  label: string;
  icon: string;
  description: string;
  color: string;
  requiresNote: boolean;
  availableStatuses: string[];
}

const ACTIONS: ActionConfig[] = [
  {
    action: 'SEND_REMINDER',
    label: 'Hantar Peringatan',
    icon: '🔔',
    description: 'Hantar peringatan kepada ejen yang ditugaskan bahawa pemaju sedang membuat susulan (Developer → Agent → Buyer chain, PRD 002-F)',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    requiresNote: false,
    availableStatuses: ['BOOKED', 'PRESCAN_PENDING', 'DOCS_COLLECTING'],
  },
  {
    action: 'REQUEST_DOCS',
    label: 'Minta Dokumen',
    icon: '📄',
    description: 'Minta dokumen tambahan yang diperlukan daripada pembeli',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    requiresNote: true,
    availableStatuses: ['PRESCAN_DONE', 'DOCS_COLLECTING'],
  },
  {
    action: 'ESCALATE_TO_AGENT',
    label: 'Escalate ke Ejen',
    icon: '🤝',
    description: 'Serahkan kes ini kepada ejen untuk tindakan lanjut',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    requiresNote: true,
    availableStatuses: ['PRESCAN_DONE', 'DOCS_COLLECTING', 'DOCS_COMPLETE'],
  },
  {
    action: 'SCHEDULE_TAC',
    label: 'Jadualkan TAC',
    icon: '📅',
    description: 'Jadualkan sesi TAC (Tatacara Akuan Calon) untuk pembeli',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    requiresNote: false,
    availableStatuses: ['DOCS_COMPLETE'],
  },
  {
    action: 'MARK_STALE',
    label: 'Tandai Lapuk',
    icon: '⏰',
    description: 'Tandakan kes ini sebagai lapuk kerana tiada kemajuan',
    color: 'bg-red-50 text-red-600 border-red-200',
    requiresNote: true,
    availableStatuses: ['BOOKED', 'PRESCAN_PENDING', 'PRESCAN_DONE', 'DOCS_COLLECTING'],
  },
  {
    action: 'ARCHIVE',
    label: 'Arkib',
    icon: '📦',
    description: 'Arkibkan kes yang telah selesai atau dibatalkan',
    color: 'bg-slate-50 text-slate-600 border-slate-200',
    requiresNote: false,
    availableStatuses: ['COMPLETED', 'CANCELLED'],
  },
];

export function PipelineActionPanel({
  booking,
  onAction,
  onClose,
}: PipelineActionPanelProps) {
  const [selectedAction, setSelectedAction] = useState<PipelineAction | null>(null);
  const [note, setNote] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<PipelineActionResult | null>(null);

  const availableActions = ACTIONS.filter(a =>
    a.availableStatuses.includes(booking.status)
  );

  const selectedConfig = selectedAction
    ? ACTIONS.find(a => a.action === selectedAction)
    : null;

  const handleExecute = async () => {
    if (!selectedAction) return;

    setIsExecuting(true);
    // Simulate action execution
    await new Promise(resolve => setTimeout(resolve, 1000));

    const result: PipelineActionResult = {
      success: true,
      action: selectedAction,
      message: `Tindakan "${selectedConfig?.label}" berjaya dilaksanakan`,
      timestamp: new Date().toISOString(),
    };

    setLastResult(result);
    setIsExecuting(false);
    onAction?.(booking.id, selectedAction, note || undefined);

    // Reset after showing result
    setTimeout(() => {
      setSelectedAction(null);
      setNote('');
      setLastResult(null);
    }, 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">Tindakan Pipeline</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">{booking.id}</span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-500">{booking.buyerName}</span>
              <span className="text-xs text-slate-300">·</span>
              <LoanTypeBadge loanType={booking.loanTypeCode} size="sm" showIcon={false} />
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Success toast */}
      {lastResult?.success && (
        <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100">
          <p className="text-sm text-emerald-700">✅ {lastResult.message}</p>
        </div>
      )}

      {/* Action list */}
      <div className="p-5 space-y-2">
        {availableActions.length === 0 ? (
          <div className="text-center py-4">
            <span className="text-2xl">📋</span>
            <p className="text-sm text-slate-500 mt-2">
              Tiada tindakan tersedia untuk status semasa
            </p>
          </div>
        ) : (
          availableActions.map(action => (
            <button
              key={action.action}
              onClick={() => setSelectedAction(action.action)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition text-left ${
                selectedAction === action.action
                  ? `${action.color} ring-2 ring-offset-1`
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="text-xl">{action.icon}</span>
              <div className="flex-1">
                <span className="text-sm font-medium text-slate-800">{action.label}</span>
                <p className="text-xs text-slate-500">{action.description}</p>
              </div>
              {selectedAction === action.action && (
                <span className="text-teal-600">✓</span>
              )}
            </button>
          ))
        )}
      </div>

      {/* Note input (for actions that require it) */}
      {selectedAction && selectedConfig?.requiresNote && (
        <div className="px-5 pb-3">
          <label className="block text-xs text-slate-500 mb-1">Nota (pilihan)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="Tambah nota untuk tindakan ini..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 resize-none"
          />
        </div>
      )}

      {/* Execute button */}
      {selectedAction && (
        <div className="px-5 pb-5">
          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className={`w-full py-2.5 text-sm font-medium rounded-lg transition ${
              isExecuting
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            {isExecuting
              ? '⏳ Melaksanakan...'
              : `${selectedConfig?.icon} Laksanakan: ${selectedConfig?.label}`}
          </button>
        </div>
      )}

      {/* Privacy footer */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">
          Tindakan direkodkan dalam jejak audit. Data demo sahaja.
        </p>
      </div>
    </div>
  );
}

export default PipelineActionPanel;
