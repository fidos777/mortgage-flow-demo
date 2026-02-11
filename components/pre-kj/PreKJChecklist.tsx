'use client';

/**
 * S5 R01: Pre-KJ Checklist Component
 *
 * Displays a structured checklist showing whether a case has met
 * all prerequisites for the KJ (Ketua Jabatan) signing step.
 *
 * Used in:
 * - Agent case detail view (Day 5 R03)
 * - Buyer journey timeline (future)
 *
 * Fetches from GET /api/pre-kj and renders pass/fail for each item.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Shield,
  AlertTriangle,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface ChecklistItem {
  id: string;
  label: string;
  labelBm: string;
  passed: boolean;
  detail?: string;
  required: boolean;
}

interface PreKJResult {
  pre_kj_passed: boolean;
  passed_count: number;
  total_required: number;
  checklist: ChecklistItem[];
}

interface PreKJChecklistProps {
  caseId?: string;
  buyerHash?: string;
  locale?: 'bm' | 'en';
  compact?: boolean;
  onResult?: (result: PreKJResult) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PreKJChecklist({
  caseId,
  buyerHash,
  locale = 'bm',
  compact = false,
  onResult,
}: PreKJChecklistProps) {
  const [result, setResult] = useState<PreKJResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChecklist = useCallback(async () => {
    if (!caseId && !buyerHash) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (caseId) params.set('case_id', caseId);
      if (buyerHash) params.set('buyer_hash', buyerHash);

      const response = await fetch(`/api/pre-kj?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        onResult?.(data.data);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load checklist');
    } finally {
      setLoading(false);
    }
  }, [caseId, buyerHash, onResult]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  // === LOADING STATE ===
  if (loading && !result) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin mx-auto mb-2" />
        <p className="text-sm text-slate-500">
          {locale === 'bm' ? 'Menyemak senarai semak...' : 'Checking prerequisites...'}
        </p>
      </div>
    );
  }

  // === ERROR STATE ===
  if (error && !result) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="font-semibold text-red-800 text-sm">
            {locale === 'bm' ? 'Gagal memuatkan senarai semak' : 'Failed to load checklist'}
          </p>
        </div>
        <p className="text-xs text-red-600 mb-3">{error}</p>
        <button
          onClick={fetchChecklist}
          className="text-xs text-red-700 hover:text-red-900 flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          {locale === 'bm' ? 'Cuba semula' : 'Retry'}
        </button>
      </div>
    );
  }

  if (!result) return null;

  // === COMPACT MODE (for inline display) ===
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
          result.pre_kj_passed
            ? 'bg-green-100 text-green-800'
            : 'bg-amber-100 text-amber-800'
        }`}>
          {result.pre_kj_passed ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5" />
          )}
          {result.pre_kj_passed
            ? (locale === 'bm' ? 'Sedia untuk KJ' : 'Ready for KJ')
            : `${result.passed_count}/${result.total_required}`
          }
        </div>
      </div>
    );
  }

  // === FULL CHECKLIST VIEW ===
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        result.pre_kj_passed
          ? 'bg-green-50 border-b border-green-200'
          : 'bg-amber-50 border-b border-amber-200'
      }`}>
        <div className="flex items-center gap-2">
          <Shield className={`w-5 h-5 ${
            result.pre_kj_passed ? 'text-green-600' : 'text-amber-600'
          }`} />
          <div>
            <h3 className="font-semibold text-sm text-slate-800">
              {locale === 'bm' ? 'Senarai Semak Pra-KJ' : 'Pre-KJ Checklist'}
            </h3>
            <p className="text-xs text-slate-500">
              {result.passed_count}/{result.total_required}{' '}
              {locale === 'bm' ? 'lulus' : 'passed'}
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchChecklist}
          disabled={loading}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Checklist items */}
      <div className="divide-y divide-slate-100">
        {result.checklist.map((item) => (
          <div
            key={item.id}
            className="px-4 py-3 flex items-start gap-3"
          >
            {/* Status icon */}
            <div className="mt-0.5">
              {item.passed ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                item.passed ? 'text-slate-800' : 'text-slate-500'
              }`}>
                {locale === 'bm' ? item.labelBm : item.label}
              </p>
              {item.detail && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {item.detail}
                </p>
              )}
            </div>

            {/* Required badge */}
            {item.required && !item.passed && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                {locale === 'bm' ? 'Wajib' : 'Required'}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Overall result */}
      <div className={`px-4 py-3 border-t ${
        result.pre_kj_passed
          ? 'bg-green-50 border-green-200'
          : 'bg-slate-50 border-slate-200'
      }`}>
        <p className={`text-sm font-semibold text-center ${
          result.pre_kj_passed ? 'text-green-700' : 'text-slate-500'
        }`}>
          {result.pre_kj_passed
            ? (locale === 'bm'
                ? '✓ Kes sedia untuk proses KJ'
                : '✓ Case ready for KJ process')
            : (locale === 'bm'
                ? `✗ ${result.total_required - result.passed_count} item lagi diperlukan`
                : `✗ ${result.total_required - result.passed_count} more items needed`)
          }
        </p>
      </div>
    </div>
  );
}

export default PreKJChecklist;
