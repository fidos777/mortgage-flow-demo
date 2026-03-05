// components/buyer/SelfCheckResult.tsx
// CR-KP-002 Sprint 1 (A4): Self-Check Result Display
// DEC-001: Shows readiness band, NOT approval probability

'use client';

import type { SelfCheckResult as SelfCheckResultType, SelfCheckInput } from '@/types/cr-kp-002';

export interface SelfCheckResultProps {
  result: SelfCheckResultType;
  input: SelfCheckInput;
  onProceedToApply?: () => void;
  onRetry?: () => void;
}

const BAND_CONFIG = {
  ready: {
    icon: '✅',
    title: 'Sedia untuk Memohon',
    titleEn: 'Ready to Apply',
    color: 'bg-emerald-50 border-emerald-200',
    textColor: 'text-emerald-800',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  caution: {
    icon: '⚠️',
    title: 'Perlu Perhatian',
    titleEn: 'Needs Attention',
    color: 'bg-amber-50 border-amber-200',
    textColor: 'text-amber-800',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  not_ready: {
    icon: '⛔',
    title: 'Belum Sedia',
    titleEn: 'Not Ready',
    color: 'bg-red-50 border-red-200',
    textColor: 'text-red-800',
    badgeColor: 'bg-red-100 text-red-700',
  },
};

export function SelfCheckResult({
  result,
  input,
  onProceedToApply,
  onRetry,
}: SelfCheckResultProps) {
  const config = BAND_CONFIG[result.band];

  return (
    <div className="space-y-4">
      {/* Main result card */}
      <div className={`rounded-xl border ${config.color} overflow-hidden`}>
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <h2 className={`text-lg font-bold ${config.textColor}`}>{config.title}</h2>
              <p className="text-xs text-slate-500">{config.titleEn}</p>
            </div>
            <span className={`ml-auto px-3 py-1 text-xs font-medium rounded-full ${config.badgeColor}`}>
              {result.band.toUpperCase().replace('_', ' ')}
            </span>
          </div>

          <p className={`text-sm ${config.textColor}`}>{result.guidance}</p>
        </div>
      </div>

      {/* Metrics breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="font-semibold text-slate-800 text-sm mb-3">Pecahan Analisis</h3>

        <div className="space-y-3">
          {/* DSR */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-slate-700">Nisbah Khidmat Hutang (DSR)</span>
              <p className="text-xs text-slate-400">
                Had: {result.dsrThreshold}% ({input.kategoriPinjaman === 'HARTA PERTAMA' ? 'Harta Pertama' : 'Harta Kedua'})
              </p>
            </div>
            <div className="text-right">
              <span className={`text-lg font-bold ${result.dsrPass ? 'text-emerald-600' : 'text-red-600'}`}>
                {result.dsr}%
              </span>
              <span className={`ml-2 text-xs ${result.dsrPass ? 'text-emerald-500' : 'text-red-500'}`}>
                {result.dsrPass ? '✓ Lulus' : '✗ Melebihi'}
              </span>
            </div>
          </div>

          {/* DSR bar */}
          <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${result.dsrPass ? 'bg-emerald-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(result.dsr, 100)}%` }}
            />
            {/* Threshold marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-400"
              style={{ left: `${result.dsrThreshold}%` }}
            />
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2">
            {/* Net income */}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Pendapatan Bersih</span>
              <span className="font-medium text-slate-800">
                RM {result.pendapatanBersih.toLocaleString()}
              </span>
            </div>

            {/* Tenure check */}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tempoh Pinjaman</span>
              <span className={`font-medium ${result.tenurePass ? 'text-slate-800' : 'text-red-600'}`}>
                {input.tempohPinjaman} tahun {result.tenurePass ? '✓' : `(maks ${result.maxTenure})`}
              </span>
            </div>

            {/* Age at maturity */}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Umur Tamat Pinjaman</span>
              <span className={`font-medium ${result.agePass ? 'text-slate-800' : 'text-red-600'}`}>
                {result.ageAtMaturity} tahun {result.agePass ? '✓' : '(melebihi had)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DEC-001 Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <p className="text-xs text-blue-700">
          <strong>⚠ Penafian:</strong> Keputusan ini adalah isyarat kesediaan sahaja, bukan kelulusan
          atau jaminan kelulusan pinjaman. Keputusan muktamad adalah hak eksklusif LPPSA.
          Sistem ini tidak membuat sebarang ramalan kelulusan.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {result.band === 'ready' && onProceedToApply && (
          <button
            onClick={onProceedToApply}
            className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition"
          >
            📝 Teruskan ke Permohonan
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className={`${result.band === 'ready' ? 'px-4' : 'flex-1'} py-2.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition`}
          >
            🔄 Semak Semula
          </button>
        )}
      </div>
    </div>
  );
}

export default SelfCheckResult;
