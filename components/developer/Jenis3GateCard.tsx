// components/developer/Jenis3GateCard.tsx
// CR-KP-002 Sprint 1 (A2): Jenis 3 Gate Card
// Shows Jenis 3 (Dalam Pembinaan) requirements and APDL gate status

'use client';

import { useState } from 'react';
import type { ApdlCredential } from '@/types/cr-kp-002';
import { isApdlRequired } from '@/lib/services/cr-kp-002-services';
import { getLoanType } from '@/lib/config/loan-types';

export interface Jenis3GateCardProps {
  apdlCredential?: ApdlCredential | null;
  onRequestApdl?: () => void;
  onProceed?: () => void;
}

export function Jenis3GateCard({
  apdlCredential,
  onRequestApdl,
  onProceed,
}: Jenis3GateCardProps) {
  const loanType = getLoanType(3);
  const isApdlVerified = apdlCredential?.status === 'active';
  const [expanded, setExpanded] = useState(false);

  const requirements = [
    {
      id: 'apdl',
      label: 'Pengesahan APDL',
      description: 'Pendaftaran APDL yang sah diperlukan',
      status: isApdlVerified ? 'complete' : 'pending',
      icon: isApdlVerified ? '✅' : '🔒',
    },
    {
      id: 'spa_tanah',
      label: 'SPA Tanah',
      description: 'Surat Perjanjian Jual Beli tanah',
      status: 'pending' as const,
      icon: '📄',
    },
    {
      id: 'perjanjian',
      label: 'Perjanjian Pembinaan',
      description: 'Perjanjian dengan kontraktor pembinaan',
      status: 'pending' as const,
      icon: '📄',
    },
    {
      id: 'pelan',
      label: 'Pelan Bangunan',
      description: 'Pelan bangunan yang diluluskan PBT',
      status: 'pending' as const,
      icon: '📐',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-emerald-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{loanType.icon}</span>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800">
              Jenis 3: {loanType.nameMy}
            </h3>
            <p className="text-sm text-slate-500">{loanType.nameEn}</p>
          </div>
          {isApdlVerified ? (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
              ✓ Sedia
            </span>
          ) : (
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              ⚠ APDL Diperlukan
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="px-5 py-3 border-b border-slate-100">
        <p className="text-sm text-slate-600">{loanType.description}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
          <span>Tempoh maks: {loanType.maxTenure} tahun</span>
          <span>·</span>
          <span>{loanType.requiredDocs.length} dokumen diperlukan</span>
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="px-5 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium text-slate-700 w-full"
        >
          <span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
          Keperluan Jenis 3
          <span className="text-xs text-slate-400 ml-auto">
            {requirements.filter(r => r.status === 'complete').length}/{requirements.length}
          </span>
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            {requirements.map(req => (
              <div
                key={req.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg ${
                  req.status === 'complete'
                    ? 'bg-emerald-50'
                    : 'bg-slate-50'
                }`}
              >
                <span className="text-lg">{req.icon}</span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700">{req.label}</span>
                  <p className="text-xs text-slate-500">{req.description}</p>
                </div>
                {req.status === 'complete' && (
                  <span className="text-xs text-emerald-600 font-medium">Selesai</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Special rules */}
      <div className="px-5 py-3 border-t border-slate-100">
        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Syarat Khas</h4>
        <ul className="space-y-1">
          {loanType.specialRules.map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
              <span className="text-slate-400 mt-0.5">•</span>
              {rule}
            </li>
          ))}
        </ul>
      </div>

      {/* Action button */}
      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
        {!isApdlVerified ? (
          <button
            onClick={onRequestApdl}
            className="w-full py-2.5 text-sm font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition"
          >
            🔑 Sahkan APDL untuk Mula
          </button>
        ) : (
          <button
            onClick={onProceed}
            className="w-full py-2.5 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition"
          >
            🏡 Mula Projek Jenis 3
          </button>
        )}
      </div>
    </div>
  );
}

export default Jenis3GateCard;
