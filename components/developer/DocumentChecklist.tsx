// components/developer/DocumentChecklist.tsx
// CR-KP-002 Sprint 1 (A7): Document Checklist Component
// Shows required documents per loan type with status tracking

'use client';

import { useState } from 'react';
import type { LoanTypeCode } from '@/lib/config/loan-types';
import type { DocumentChecklistItem, DocumentChecklistSummary } from '@/types/cr-kp-002';
import {
  generateDocumentChecklist,
  calculateChecklistSummary,
} from '@/lib/services/cr-kp-002-services';
import {
  getDocumentsByCategory,
  CATEGORY_LABELS,
  getDocumentMeta,
} from '@/lib/config/document-checklist';
import { LoanTypeBadge } from '@/components/LoanTypeBadge';

export interface DocumentChecklistProps {
  loanTypeCode: LoanTypeCode;
  items?: DocumentChecklistItem[];
  onStatusChange?: (docType: string, status: DocumentChecklistItem['status']) => void;
  readOnly?: boolean;
}

const STATUS_DISPLAY: Record<
  DocumentChecklistItem['status'],
  { label: string; color: string; icon: string }
> = {
  pending: { label: 'Belum Muat Naik', color: 'text-slate-400 bg-slate-50', icon: '⏳' },
  uploaded: { label: 'Dimuat Naik', color: 'text-blue-600 bg-blue-50', icon: '📤' },
  verified: { label: 'Disahkan', color: 'text-emerald-600 bg-emerald-50', icon: '✅' },
  rejected: { label: 'Ditolak', color: 'text-red-600 bg-red-50', icon: '❌' },
  not_applicable: { label: 'Tidak Berkaitan', color: 'text-slate-300 bg-slate-50', icon: '—' },
};

export function DocumentChecklist({
  loanTypeCode,
  items: externalItems,
  onStatusChange,
  readOnly = false,
}: DocumentChecklistProps) {
  const [items, setItems] = useState<DocumentChecklistItem[]>(
    externalItems || generateDocumentChecklist(loanTypeCode)
  );
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const summary = calculateChecklistSummary(items);
  const grouped = getDocumentsByCategory(loanTypeCode, items);

  const handleStatusChange = (docType: string, status: DocumentChecklistItem['status']) => {
    setItems(prev =>
      prev.map(item =>
        item.docType === docType ? { ...item, status } : item
      )
    );
    onStatusChange?.(docType, status);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="font-semibold text-slate-800">Senarai Semak Dokumen</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <LoanTypeBadge loanType={loanTypeCode} size="sm" />
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-teal-700">{summary.completionPct}%</span>
            <p className="text-xs text-slate-500">
              {summary.completed}/{summary.total} lengkap
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${summary.completionPct}%` }}
          />
        </div>

        {/* Summary badges */}
        <div className="flex gap-3 mt-2">
          {summary.completed > 0 && (
            <span className="text-xs text-emerald-600">✅ {summary.completed} disahkan</span>
          )}
          {summary.pending > 0 && (
            <span className="text-xs text-amber-600">⏳ {summary.pending} belum</span>
          )}
          {summary.rejected > 0 && (
            <span className="text-xs text-red-600">❌ {summary.rejected} ditolak</span>
          )}
        </div>
      </div>

      {/* Document categories */}
      <div className="divide-y divide-slate-50">
        {Object.entries(grouped).map(([category, categoryItems]) => {
          const catLabel = CATEGORY_LABELS[category];
          const isExpanded = expandedCategory === category || expandedCategory === null;
          const catComplete = categoryItems.filter(
            i => i.status === 'verified' || i.status === 'uploaded'
          ).length;

          return (
            <div key={category}>
              <button
                onClick={() =>
                  setExpandedCategory(prev =>
                    prev === category ? null : category
                  )
                }
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition"
              >
                <span>{catLabel?.icon || '📄'}</span>
                <span className="text-sm font-medium text-slate-700 flex-1 text-left">
                  {catLabel?.my || category}
                </span>
                <span className="text-xs text-slate-400">
                  {catComplete}/{categoryItems.length}
                </span>
                <span className={`text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                  ▶
                </span>
              </button>

              {isExpanded && (
                <div className="px-5 pb-3 space-y-1">
                  {categoryItems.map(item => {
                    const statusDisplay = STATUS_DISPLAY[item.status];
                    const meta = item.meta;

                    return (
                      <div
                        key={item.docType}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition"
                      >
                        <span className="text-lg">{meta.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-slate-700">{meta.label}</span>
                          {meta.description && (
                            <p className="text-xs text-slate-400">{meta.description}</p>
                          )}
                          {item.rejectionReason && (
                            <p className="text-xs text-red-500 mt-0.5">
                              Sebab: {item.rejectionReason}
                            </p>
                          )}
                        </div>
                        {readOnly ? (
                          <span className={`px-2 py-0.5 text-xs rounded-full ${statusDisplay.color}`}>
                            {statusDisplay.icon} {statusDisplay.label}
                          </span>
                        ) : (
                          <select
                            value={item.status}
                            onChange={e =>
                              handleStatusChange(
                                item.docType,
                                e.target.value as DocumentChecklistItem['status']
                              )
                            }
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-600"
                          >
                            <option value="pending">⏳ Belum</option>
                            <option value="uploaded">📤 Dimuat Naik</option>
                            <option value="verified">✅ Disahkan</option>
                            <option value="rejected">❌ Ditolak</option>
                            <option value="not_applicable">— N/A</option>
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">
          Senarai semak berdasarkan keperluan LPPSA untuk Jenis {loanTypeCode}.
          Demo sahaja — tiada pengesahan sebenar.
        </p>
      </div>
    </div>
  );
}

export default DocumentChecklist;
