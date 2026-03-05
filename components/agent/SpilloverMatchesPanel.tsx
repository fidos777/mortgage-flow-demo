'use client';

/**
 * CR-009C: Spillover Matches Dashboard Panel
 *
 * Agent-facing component showing spillover match leads.
 * Fetches from GET /api/spillover/matches and displays match pipeline.
 *
 * Proof events logged:
 *   - SPILLOVER_MATCH_ACCEPTED (when agent accepts a match)
 *
 * All events logged with authorityClaimed: false.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowRightLeft,
  RefreshCw,
  Phone,
  Building,
  User,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface SpilloverMatch {
  id: string;
  consent_id: string;
  status: 'pending' | 'contacted' | 'interested' | 'converted' | 'rejected';
  created_at: string;
  consent?: {
    id: string;
    buyer_name: string;
    buyer_phone?: string;
    rejection_reason: string;
    matching_criteria: Record<string, unknown>;
    consent_timestamp?: string;
  };
  matched_property?: {
    id: string;
    name: string;
    slug: string;
    price_min?: number;
    price_max?: number;
    city?: string;
    state?: string;
  };
  matched_developer?: {
    id: string;
    company_name: string;
  };
}

interface SpilloverStats {
  total: number;
  pending: number;
  contacted: number;
  interested: number;
  converted: number;
  rejected: number;
}

export interface SpilloverMatchesPanelProps {
  /** Agent ID for filtering */
  agentId?: string;
  /** Locale */
  locale?: 'bm' | 'en';
}

const STATUS_CONFIG: Record<string, { label: { bm: string; en: string }; color: string }> = {
  pending:    { label: { bm: 'Menunggu',    en: 'Pending' },    color: 'bg-blue-100 text-blue-700' },
  contacted:  { label: { bm: 'Dihubungi',   en: 'Contacted' },  color: 'bg-cyan-100 text-cyan-700' },
  interested: { label: { bm: 'Berminat',    en: 'Interested' }, color: 'bg-amber-100 text-amber-700' },
  converted:  { label: { bm: 'Berjaya',     en: 'Converted' },  color: 'bg-emerald-100 text-emerald-700' },
  rejected:   { label: { bm: 'Ditolak',     en: 'Rejected' },   color: 'bg-red-100 text-red-700' },
};

export function SpilloverMatchesPanel({
  agentId,
  locale = 'bm',
}: SpilloverMatchesPanelProps) {
  const [matches, setMatches] = useState<SpilloverMatch[]>([]);
  const [stats, setStats] = useState<SpilloverStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (agentId) params.set('agent_id', agentId);

      const res = await fetch(`/api/spillover/matches?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setMatches(json.data || []);
        setStats(json.meta?.stats || null);
      } else {
        setError(json.error || 'Gagal mendapatkan data');
      }
    } catch {
      // Demo fallback — show empty state gracefully
      setMatches([]);
      setStats({ total: 0, pending: 0, contacted: 0, interested: 0, converted: 0, rejected: 0 });
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleAcceptMatch = useCallback(async (matchId: string) => {
    // Log proof event
    console.log('[SpilloverMatches] SPILLOVER_MATCH_ACCEPTED', {
      matchId,
      agentId,
      authorityClaimed: false,
      timestamp: new Date().toISOString(),
    });
    // In production, this would PATCH /api/spillover/matches/:id
  }, [agentId]);

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-gray-900 text-sm">
            {locale === 'bm' ? 'Padanan Spillover' : 'Spillover Matches'}
          </h3>
          {stats && stats.total > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">
              {stats.total}
            </span>
          )}
        </div>
        <button
          onClick={fetchMatches}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          title="Muat semula"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats mini-bar */}
      {stats && stats.total > 0 && (
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex gap-4 text-xs">
          <span className="text-blue-600 font-medium">{stats.pending} Menunggu</span>
          <span className="text-cyan-600 font-medium">{stats.contacted} Dihubungi</span>
          <span className="text-amber-600 font-medium">{stats.interested} Berminat</span>
          <span className="text-emerald-600 font-medium">{stats.converted} Berjaya</span>
        </div>
      )}

      {/* Content */}
      <div className="divide-y divide-slate-100">
        {loading && (
          <div className="px-5 py-8 text-center">
            <RefreshCw className="w-6 h-6 text-gray-300 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-gray-400">
              {locale === 'bm' ? 'Memuat padanan...' : 'Loading matches...'}
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="px-5 py-6 text-center">
            <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div className="px-5 py-8 text-center">
            <ArrowRightLeft className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">
              {locale === 'bm' ? 'Tiada padanan spillover' : 'No spillover matches'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {locale === 'bm'
                ? 'Padanan akan muncul apabila pembeli bersetuju untuk dicarikan hartanah alternatif.'
                : 'Matches will appear when buyers consent to alternative property matching.'}
            </p>
          </div>
        )}

        {!loading && !error && matches.map((match) => {
          const statusConfig = STATUS_CONFIG[match.status] || STATUS_CONFIG.pending;
          return (
            <div key={match.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-800 text-sm">
                      {match.consent?.buyer_name || '—'}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusConfig.color}`}>
                      {statusConfig.label[locale]}
                    </span>
                  </div>
                  {match.matched_property && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 ml-6">
                      <Building className="w-3 h-3" />
                      <span>{match.matched_property.name}</span>
                      {match.matched_property.city && (
                        <span>• {match.matched_property.city}</span>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1 ml-6 font-mono">
                    {match.consent?.rejection_reason || '—'} • authorityClaimed: false
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {match.status === 'pending' && (
                    <button
                      onClick={() => handleAcceptMatch(match.id)}
                      className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-100 flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {locale === 'bm' ? 'Hubungi' : 'Contact'}
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200">
        <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
          <Shield className="w-3 h-3" />
          {locale === 'bm'
            ? 'Ejen tidak boleh meluluskan — koordinasi sahaja. authorityClaimed: false'
            : 'Agent cannot approve — coordination only. authorityClaimed: false'}
        </p>
      </div>
    </div>
  );
}

export default SpilloverMatchesPanel;
