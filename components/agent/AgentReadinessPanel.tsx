'use client';

/**
 * S5 R03: Agent Readiness Panel
 *
 * Unified panel for agent case detail view showing:
 *   1. Readiness band + guidance (from API, score suppressed per PRD §16.3)
 *   2. Consent status (PDPA basic + LPPSA submission)
 *   3. Pre-KJ checklist (compact badge + expandable detail)
 *   4. Cross-validator flags (field mismatches from documents vs form)
 *
 * Agent sees actionable signals, NEVER raw scores or buyer PII.
 *
 * @see PRD v3.6.3 §16.3: Score suppression
 * @see PRD v3.6.3 §8.3: Agent visibility boundaries
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileWarning,
  ClipboardCheck,
  Lock,
  Loader2,
} from 'lucide-react';
import type { ReadinessBand } from '@/types/case';
import type { FieldMismatch, MismatchSeverity } from '@/lib/readiness/cross-validator';

// =============================================================================
// TYPES
// =============================================================================

interface AgentReadinessPanelProps {
  caseId: string;
  buyerHash?: string;
  readinessBand?: ReadinessBand;
  readinessLabel?: string;
  readinessGuidance?: string;
  locale?: 'bm' | 'en';
}

interface PreKJData {
  pre_kj_passed: boolean;
  passed_count: number;
  total_required: number;
  checklist: {
    id: string;
    label: string;
    labelBm: string;
    passed: boolean;
    detail?: string;
    required: boolean;
  }[];
}

interface ConsentData {
  has_basic: boolean;
  has_lppsa_submission: boolean;
  active_consent_count: number;
}

interface CrossValidateData {
  mismatches: FieldMismatch[];
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
    has_critical: boolean;
  };
}

// =============================================================================
// BAND DISPLAY CONFIG
// =============================================================================

const BAND_CONFIG: Record<ReadinessBand, {
  bgColor: string; textColor: string; borderColor: string;
  labelBm: string; labelEn: string; icon: typeof CheckCircle;
}> = {
  ready: {
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    labelBm: 'SEDIA UNTUK DITERUSKAN',
    labelEn: 'READY TO CONTINUE',
    icon: CheckCircle,
  },
  caution: {
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    labelBm: 'TERUSKAN DENGAN PERHATIAN',
    labelEn: 'CONTINUE WITH CAUTION',
    icon: AlertTriangle,
  },
  not_ready: {
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    labelBm: 'BELUM SEDIA',
    labelEn: 'NOT READY TO PROCEED',
    icon: XCircle,
  },
};

const SEVERITY_CONFIG: Record<MismatchSeverity, {
  bgColor: string; textColor: string; borderColor: string; icon: typeof AlertTriangle;
}> = {
  critical: { bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200', icon: XCircle },
  warning: { bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200', icon: AlertTriangle },
  info: { bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200', icon: AlertTriangle },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function AgentReadinessPanel({
  caseId,
  buyerHash,
  readinessBand,
  readinessLabel,
  readinessGuidance,
  locale = 'bm',
}: AgentReadinessPanelProps) {
  const [preKJ, setPreKJ] = useState<PreKJData | null>(null);
  const [consent, setConsent] = useState<ConsentData | null>(null);
  const [crossValidation, setCrossValidation] = useState<CrossValidateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showKJDetail, setShowKJDetail] = useState(false);
  const [showMismatches, setShowMismatches] = useState(false);

  const isBm = locale === 'bm';

  // === Fetch all data ===
  const fetchData = useCallback(async () => {
    setLoading(true);
    const queryParam = caseId
      ? `case_id=${caseId}${buyerHash ? `&buyer_hash=${buyerHash}` : ''}`
      : `buyer_hash=${buyerHash}`;

    // Fetch all three endpoints in parallel
    const [preKJRes, consentRes, cvRes] = await Promise.allSettled([
      fetch(`/api/pre-kj?${queryParam}`).then(r => r.ok ? r.json() : null),
      buyerHash
        ? fetch(`/api/consent/status?buyer_hash=${buyerHash}`).then(r => r.ok ? r.json() : null)
        : Promise.resolve(null),
      fetch(`/api/cross-validate?${queryParam}`).then(r => r.ok ? r.json() : null),
    ]);

    if (preKJRes.status === 'fulfilled' && preKJRes.value?.data) {
      setPreKJ(preKJRes.value.data);
    }
    if (consentRes.status === 'fulfilled' && consentRes.value?.data) {
      setConsent(consentRes.value.data);
    }
    if (cvRes.status === 'fulfilled' && cvRes.value?.data) {
      setCrossValidation(cvRes.value.data);
    }

    setLoading(false);
  }, [caseId, buyerHash]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // === Readiness Band Section ===
  const bandConfig = readinessBand ? BAND_CONFIG[readinessBand] : null;
  const BandIcon = bandConfig?.icon || Shield;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-600" />
          {isBm ? 'Panel Kesediaan' : 'Readiness Panel'}
        </h3>
        <button
          onClick={fetchData}
          disabled={loading}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          title={isBm ? 'Muat semula' : 'Refresh'}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* 1. READINESS BAND */}
        {bandConfig ? (
          <div className={`p-3 rounded-lg border ${bandConfig.bgColor} ${bandConfig.borderColor}`}>
            <div className="flex items-center gap-2 mb-1">
              <BandIcon className={`w-5 h-5 ${bandConfig.textColor}`} />
              <span className={`font-bold text-sm ${bandConfig.textColor}`}>
                {isBm ? bandConfig.labelBm : bandConfig.labelEn}
              </span>
            </div>
            {readinessGuidance && (
              <p className="text-xs text-slate-600 ml-7">{readinessGuidance}</p>
            )}
            {/* PRD §16.3: Score suppression notice */}
            <p className="text-xs text-slate-400 ml-7 mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {isBm ? 'Skor dalaman tidak ditunjukkan' : 'Internal score not displayed'}
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-500">
              {isBm ? 'Penilaian kesediaan belum dikira' : 'Readiness assessment not computed'}
            </p>
          </div>
        )}

        {/* 2. CONSENT STATUS */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {isBm ? 'Status Persetujuan' : 'Consent Status'}
          </h4>
          {consent ? (
            <div className="space-y-1.5">
              <ConsentRow
                label={isBm ? 'PDPA Asas' : 'PDPA Basic'}
                granted={consent.has_basic}
                locale={locale}
              />
              <ConsentRow
                label={isBm ? 'Permohonan LPPSA' : 'LPPSA Submission'}
                granted={consent.has_lppsa_submission}
                locale={locale}
              />
            </div>
          ) : loading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isBm ? 'Memuatkan...' : 'Loading...'}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              {isBm ? 'Status persetujuan tidak tersedia' : 'Consent status unavailable'}
            </p>
          )}
        </div>

        {/* 3. PRE-KJ CHECKLIST */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <ClipboardCheck className="w-3 h-3" />
            {isBm ? 'Semakan Pra-KJ' : 'Pre-KJ Checklist'}
          </h4>
          {preKJ ? (
            <div>
              {/* Compact badge */}
              <button
                onClick={() => setShowKJDetail(!showKJDetail)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                  preKJ.pre_kj_passed
                    ? 'bg-green-50 border-green-200 hover:bg-green-100'
                    : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  {preKJ.pre_kj_passed ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                  <span className={`text-sm font-medium ${preKJ.pre_kj_passed ? 'text-green-700' : 'text-amber-700'}`}>
                    {preKJ.pre_kj_passed
                      ? (isBm ? 'Sedia untuk KJ' : 'Ready for KJ')
                      : `${preKJ.passed_count}/${preKJ.total_required} ${isBm ? 'lulus' : 'passed'}`
                    }
                  </span>
                </span>
                {showKJDetail ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {/* Expanded checklist */}
              {showKJDetail && (
                <div className="mt-2 space-y-1.5 pl-2">
                  {preKJ.checklist.map(item => (
                    <div key={item.id} className="flex items-start gap-2 text-sm">
                      {item.passed ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <span className={item.passed ? 'text-slate-600' : 'text-slate-800 font-medium'}>
                          {isBm ? item.labelBm : item.label}
                        </span>
                        {item.detail && !item.passed && (
                          <p className="text-xs text-slate-400 mt-0.5">{item.detail}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isBm ? 'Memuatkan...' : 'Loading...'}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              {isBm ? 'Semakan pra-KJ tidak tersedia' : 'Pre-KJ checklist unavailable'}
            </p>
          )}
        </div>

        {/* 4. CROSS-VALIDATION FLAGS */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <FileWarning className="w-3 h-3" />
            {isBm ? 'Pengesahan Silang Data' : 'Data Cross-Validation'}
          </h4>
          {crossValidation ? (
            crossValidation.summary.total > 0 ? (
              <div>
                {/* Summary badge */}
                <button
                  onClick={() => setShowMismatches(!showMismatches)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    crossValidation.summary.has_critical
                      ? 'bg-red-50 border-red-200 hover:bg-red-100'
                      : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {crossValidation.summary.has_critical ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      crossValidation.summary.has_critical ? 'text-red-700' : 'text-amber-700'
                    }`}>
                      {crossValidation.summary.total} {isBm ? 'ketidakpadanan' : 'mismatch'}
                      {crossValidation.summary.total > 1 && !isBm ? 'es' : ''}
                      {crossValidation.summary.critical > 0 && (
                        <span className="text-red-600 ml-1">
                          ({crossValidation.summary.critical} {isBm ? 'kritikal' : 'critical'})
                        </span>
                      )}
                    </span>
                  </span>
                  {showMismatches ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Expanded mismatch list */}
                {showMismatches && (
                  <div className="mt-2 space-y-2">
                    {crossValidation.mismatches.map((m, idx) => {
                      const sc = SEVERITY_CONFIG[m.severity];
                      const SevIcon = sc.icon;
                      return (
                        <div key={idx} className={`p-3 rounded-lg border ${sc.bgColor} ${sc.borderColor}`}>
                          <div className="flex items-start gap-2">
                            <SevIcon className={`w-4 h-4 ${sc.textColor} mt-0.5 shrink-0`} />
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${sc.textColor}`}>
                                {isBm ? m.labelBm : m.labelEn}
                              </p>
                              <div className="grid grid-cols-2 gap-2 mt-1.5 text-xs">
                                <div>
                                  <span className="text-slate-500">{isBm ? 'Borang:' : 'Form:'} </span>
                                  <span className="font-mono font-medium text-slate-700">{m.formValue}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">{isBm ? 'Dokumen:' : 'Document:'} </span>
                                  <span className="font-mono font-medium text-slate-700">{m.docValue}</span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {isBm ? m.explanationBm : m.explanation}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-lg border border-green-200 bg-green-50 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  {isBm ? 'Tiada ketidakpadanan ditemui' : 'No mismatches found'}
                </span>
              </div>
            )
          ) : loading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isBm ? 'Memuatkan...' : 'Loading...'}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              {isBm ? 'Pengesahan silang tidak tersedia' : 'Cross-validation unavailable'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function ConsentRow({
  label,
  granted,
  locale = 'bm',
}: {
  label: string;
  granted: boolean;
  locale?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2.5 rounded-md bg-slate-50">
      <span className="text-sm text-slate-700">{label}</span>
      {granted ? (
        <span className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle className="w-3.5 h-3.5" />
          {locale === 'bm' ? 'Diberikan' : 'Granted'}
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs text-red-500">
          <XCircle className="w-3.5 h-3.5" />
          {locale === 'bm' ? 'Belum' : 'Not granted'}
        </span>
      )}
    </div>
  );
}

export default AgentReadinessPanel;
