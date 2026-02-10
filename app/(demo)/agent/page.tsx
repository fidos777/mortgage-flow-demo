// app/(demo)/agent/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, Bell, Clock, FileText, User, Calendar,
  AlertTriangle, CheckCircle, ChevronRight, Send, Eye,
  MoreVertical, Phone, Building, RefreshCw, ArrowUpRight,
  Zap, Shield, AlertCircle, Info, XCircle, MessageCircle,
  Loader2
} from 'lucide-react';
import { AuthorityDisclaimer, PermissionWarning } from '@/components/permission-gate';
import { WhatsAppContactCTA } from '@/components/agent';
import { getPhaseLabel, getPhaseConfig } from '@/lib/orchestrator/case-state';
import { maskPhone } from '@/lib/utils';
import { confidenceToLabel } from '@/lib/orchestrator/permissions';
import { salaryToRange } from '@/lib/orchestrator/permissions';
import type { Case, CasePhase, Document } from '@/types/case';

type FilterTab = 'all' | 'tac' | 'docs' | 'kj' | 'lo';
type Priority = 'P1' | 'P2' | 'P3' | 'P4';

// API response types
interface APICaseResponse {
  id: string;
  case_ref: string;
  developer_id: string;
  property_id: string | null;
  unit_id: string | null;
  buyer_name: string;
  buyer_ic: string | null;
  buyer_phone: string | null;
  buyer_email: string | null;
  property_price: number | null;
  loan_amount_requested: number | null;
  income_declared: number | null;
  assigned_agent_id: string | null;
  status: string;
  priority: string | null;
  tac_scheduled_at: string | null;
  tac_confirmed: boolean;
  kj_status: string | null;
  kj_days_pending: number | null;
  lo_days_remaining: number | null;
  query_risk: string | null;
  created_at: string;
  updated_at: string;
  developer: { id: string; company_name: string } | null;
  property: { id: string; name: string; slug: string; location?: string; type?: string } | null;
  unit: { id: string; unit_no: string; price: number } | null;
  agent: { id: string; name: string; phone_display: string } | null;
}

// Map API status to CasePhase
function mapStatusToPhase(status: string): CasePhase {
  const mapping: Record<string, CasePhase> = {
    'new': 'PRESCAN',
    'documents_pending': 'DOCS_PENDING',
    'documents_received': 'DOCS_COMPLETE',
    'under_review': 'IR_REVIEW',
    'tac_scheduled': 'TAC_SCHEDULED',
    'tac_confirmed': 'TAC_CONFIRMED',
    'submitted_bank': 'SUBMITTED',
    'bank_processing': 'SUBMITTED',
    'lo_received': 'LO_RECEIVED',
    'kj_pending': 'KJ_PENDING',
    'approved': 'COMPLETED',
    'completed': 'COMPLETED',
    'rejected': 'COMPLETED',
    'cancelled': 'COMPLETED',
  };
  return mapping[status] || 'PRESCAN';
}

// Map priority string to typed priority
function mapPriority(priority: string | null): Priority {
  if (priority && ['P1', 'P2', 'P3', 'P4'].includes(priority)) {
    return priority as Priority;
  }
  return 'P3'; // Default medium priority
}

// Transform API response to Case type
function transformAPICase(apiCase: APICaseResponse): Case {
  return {
    id: apiCase.id,
    buyer: {
      id: `buyer-${apiCase.id}`,
      name: apiCase.buyer_name,
      phone: apiCase.buyer_phone || '',
      ic: apiCase.buyer_ic || undefined,
      email: apiCase.buyer_email || undefined,
      incomeRange: apiCase.income_declared ? salaryToRange(apiCase.income_declared) : undefined,
    },
    property: {
      name: apiCase.property?.name || 'Unknown Property',
      unit: apiCase.unit?.unit_no || '-',
      price: apiCase.unit?.price || apiCase.property_price || 0,
      type: (apiCase.property?.type as 'subsale' | 'new_project' | 'land_build') || 'subsale',
      location: apiCase.property?.location || '',
    },
    phase: mapStatusToPhase(apiCase.status),
    priority: mapPriority(apiCase.priority),
    loanType: 'LPPSA',
    readiness: undefined, // Will be fetched separately if needed
    documents: [], // Will be fetched separately if needed
    tacSchedule: apiCase.tac_scheduled_at ? {
      date: new Date(apiCase.tac_scheduled_at).toLocaleDateString('ms-MY'),
      time: new Date(apiCase.tac_scheduled_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }),
      confirmed: apiCase.tac_confirmed,
    } : undefined,
    kjStatus: apiCase.kj_status as 'pending' | 'received' | 'overdue' | undefined,
    kjDays: apiCase.kj_days_pending || undefined,
    loExpiry: apiCase.lo_days_remaining || undefined,
    queryRisk: (apiCase.query_risk as 'none' | 'low' | 'medium' | 'high') || 'none',
    createdAt: apiCase.created_at,
    updatedAt: apiCase.updated_at,
  };
}

// Fetch cases from API
async function fetchCases(agentId?: string): Promise<Case[]> {
  const params = new URLSearchParams();
  if (agentId) {
    params.set('agent_id', agentId);
  }

  const url = `/api/cases${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch cases: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch cases');
  }

  return (result.data || []).map(transformAPICase);
}

export default function AgentControlPanel() {
  const router = useRouter();

  // Data state
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load cases
  const loadCases = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Get agent ID from session/auth context
      const data = await fetchCases();
      setCases(data);
    } catch (err) {
      console.error('Failed to load cases:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const filters: { id: FilterTab; label: string; count: number; icon: React.ElementType }[] = [
    { id: 'all', label: 'Semua', count: cases.length, icon: FileText },
    { id: 'tac', label: 'TAC Dijadual', count: cases.filter(c => c.phase === 'TAC_SCHEDULED').length, icon: Calendar },
    { id: 'docs', label: 'Dokumen Pending', count: cases.filter(c => c.phase === 'DOCS_PENDING').length, icon: FileText },
    { id: 'kj', label: 'KJ Overdue', count: cases.filter(c => c.kjStatus === 'overdue').length, icon: AlertTriangle },
    { id: 'lo', label: 'LO Hampir Tamat', count: cases.filter(c => c.loExpiry && c.loExpiry <= 5).length, icon: Clock },
  ];

  const filteredCases = cases.filter(c => {
    if (activeFilter === 'tac') return c.phase === 'TAC_SCHEDULED';
    if (activeFilter === 'docs') return c.phase === 'DOCS_PENDING';
    if (activeFilter === 'kj') return c.kjStatus === 'overdue';
    if (activeFilter === 'lo') return c.loExpiry && c.loExpiry <= 5;
    return true;
  }).filter(c =>
    searchQuery === '' ||
    c.buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.property.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityConfig = (priority: Priority) => {
    const configs: Record<Priority, { bg: string; text: string; label: string }> = {
      P1: { bg: 'bg-red-100', text: 'text-red-700', label: 'Kritikal' },
      P2: { bg: 'bg-snang-teal-100', text: 'text-snang-teal-700', label: 'Tinggi' },
      P3: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Sederhana' },
      P4: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Rendah' },
    };
    return configs[priority];
  };

  const getReadinessConfig = (band?: string) => {
    if (!band) return { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Belum Diimbas' };
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      ready: { bg: 'bg-green-100', text: 'text-green-700', label: 'READY' },
      caution: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'CAUTION' },
      not_ready: { bg: 'bg-red-100', text: 'text-red-700', label: 'NOT READY' },
    };
    return configs[band] || configs.ready;
  };

  const currentCase = cases.find(c => c.id === selectedCase);

  const handleCaseClick = (caseId: string) => {
    setSelectedCase(caseId);
    setShowPreview(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-snang-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Memuatkan kes...</p>
          <p className="text-sm text-slate-400">Loading cases...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Ralat Memuatkan Data</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <p className="text-sm text-slate-500 mb-6">Failed to load cases. Please try again.</p>
          <button
            onClick={loadCases}
            className="inline-flex items-center gap-2 px-6 py-3 bg-snang-teal-600 text-white rounded-lg font-medium hover:bg-snang-teal-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Cuba Lagi / Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sub-header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Control Panel</h1>
            <p className="text-sm text-slate-500">Urus kes permohonan LPPSA</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadCases}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh cases"
            >
              <RefreshCw className="w-5 h-5 text-slate-500" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-slate-500" />
            </button>
            <button className="bg-snang-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-snang-teal-700 transition-colors">
              <Send className="w-4 h-4" />
              Batch Reminder
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">Jumlah Kes</p>
            <p className="text-2xl font-bold text-slate-800">{cases.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">TAC Minggu Ini</p>
            <p className="text-2xl font-bold text-snang-teal-600">{cases.filter(c => c.tacSchedule).length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">Perlu Perhatian</p>
            <p className="text-2xl font-bold text-red-600">
              {cases.filter(c => c.kjStatus === 'overdue' || (c.loExpiry && c.loExpiry <= 5)).length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">Siap Hantar</p>
            <p className="text-2xl font-bold text-green-600">
              {cases.filter(c => c.phase === 'TAC_CONFIRMED').length}
            </p>
          </div>
        </div>

        {/* PRD Reminder */}
        <PermissionWarning
          message="Ejen melihat julat pendapatan sahaja, bukan angka tepat. Tahap keyakinan ditunjukkan sebagai HIGH/LOW."
          type="info"
        />

        <div className="flex gap-6 mt-4">
          {/* Case List */}
          <div className="flex-1">
            {/* Search & Filters */}
            <div className="bg-white rounded-xl shadow-sm mb-4">
              <div className="p-4 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama pembeli atau projek..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-snang-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex overflow-x-auto p-2 gap-1">
                {filters.map(filter => {
                  const Icon = filter.icon;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        activeFilter === filter.id
                          ? 'bg-snang-teal-600 text-white'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {filter.label}
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        activeFilter === filter.id
                          ? 'bg-white/20'
                          : 'bg-slate-200'
                      }`}>
                        {filter.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Empty State */}
            {filteredCases.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Tiada Kes Dijumpai</h3>
                <p className="text-slate-500 mb-4">
                  {searchQuery
                    ? `Tiada kes yang sepadan dengan "${searchQuery}"`
                    : 'Tiada kes dalam kategori ini'}
                </p>
                <p className="text-sm text-slate-400">
                  {searchQuery
                    ? `No cases match "${searchQuery}"`
                    : 'No cases in this category'}
                </p>
              </div>
            )}

            {/* Case Cards */}
            <div className="space-y-3">
              {filteredCases.map(caseData => {
                const priorityConfig = getPriorityConfig(caseData.priority);
                const readinessConfig = getReadinessConfig(caseData.readiness?.band);
                const phaseConfig = getPhaseConfig(caseData.phase);

                return (
                  <div
                    key={caseData.id}
                    onClick={() => handleCaseClick(caseData.id)}
                    className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                      selectedCase === caseData.id ? 'ring-2 ring-snang-teal-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{caseData.buyer.name}</p>
                          <p className="text-sm text-slate-500">{caseData.property.name} • {caseData.property.unit}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityConfig.bg} ${priorityConfig.text}`}>
                          {caseData.priority}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${readinessConfig.bg} ${readinessConfig.text}`}>
                          {readinessConfig.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`px-2 py-1 rounded ${phaseConfig.bgColor} ${phaseConfig.textColor}`}>
                          {getPhaseLabel(caseData.phase)}
                        </span>

                        {/* PRD Compliance: Show income RANGE not exact figure */}
                        {caseData.buyer.incomeRange && (
                          <span className="text-slate-500">
                            Pendapatan: <span className="font-medium text-slate-700">{caseData.buyer.incomeRange}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {caseData.kjStatus === 'overdue' && (
                          <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            KJ {caseData.kjDays} hari
                          </span>
                        )}
                        {caseData.loExpiry && caseData.loExpiry <= 5 && (
                          <span className="flex items-center gap-1 text-xs text-snang-teal-600 bg-snang-teal-50 px-2 py-1 rounded">
                            <Clock className="w-3 h-3" />
                            LO {caseData.loExpiry} hari
                          </span>
                        )}
                        {caseData.queryRisk === 'high' && (
                          <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                            <AlertCircle className="w-3 h-3" />
                            Risiko Query
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && currentCase && (
            <div className="w-96 bg-white rounded-xl shadow-sm p-5 sticky top-20 h-fit">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Pratonton Kes</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Buyer Info */}
              <div className="mb-4">
                <p className="text-sm text-slate-500 mb-1">Pembeli</p>
                <p className="font-semibold text-slate-800">{currentCase.buyer.name}</p>
                {currentCase.buyer.phone && (
                  <p className="text-sm text-slate-600 font-mono">{maskPhone(currentCase.buyer.phone)}</p>
                )}
              </div>

              {/* Property */}
              <div className="mb-4">
                <p className="text-sm text-slate-500 mb-1">Hartanah</p>
                <p className="font-semibold text-slate-800">{currentCase.property.name}</p>
                <p className="text-sm text-slate-600">
                  {currentCase.property.unit} • RM {currentCase.property.price.toLocaleString()}
                </p>
              </div>

              {/* PRD Compliance: Income as RANGE only */}
              {currentCase.buyer.incomeRange && (
                <div className="mb-4">
                  <p className="text-sm text-slate-500 mb-1">Julat Pendapatan</p>
                  <p className="font-semibold text-slate-800">{currentCase.buyer.incomeRange}</p>
                  <p className="text-xs text-slate-400">Angka tepat tidak ditunjukkan</p>
                </div>
              )}

              {/* Documents with PRD-compliant confidence labels */}
              {currentCase.documents.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-slate-500 mb-2">Status Dokumen</p>
                  <div className="space-y-2">
                    {currentCase.documents.slice(0, 4).map(doc => {
                      // PRD Compliance: Show confidence LABEL not percentage
                      const confidenceLabel = doc.confidence
                        ? confidenceToLabel(doc.confidence)
                        : null;

                      return (
                        <div key={doc.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {doc.status === 'verified' ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className="text-slate-700">{doc.type}</span>
                          </div>
                          {confidenceLabel && (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              confidenceLabel === 'HIGH_CONFIDENCE'
                                ? 'bg-green-100 text-green-700'
                                : confidenceLabel === 'LOW_CONFIDENCE'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {confidenceLabel === 'HIGH_CONFIDENCE' ? 'TINGGI' :
                               confidenceLabel === 'LOW_CONFIDENCE' ? 'RENDAH' :
                               'SEMAK'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAC Info */}
              {currentCase.tacSchedule && (
                <div className="mb-4 bg-snang-teal-50 border border-snang-teal-200 rounded-lg p-3">
                  <p className="text-sm text-snang-teal-800 font-medium mb-1">TAC Dijadualkan</p>
                  <p className="text-snang-teal-700">{currentCase.tacSchedule.date}</p>
                  <p className="text-sm text-snang-teal-600">{currentCase.tacSchedule.time}</p>
                  {currentCase.tacSchedule.confirmed && (
                    <p className="text-xs text-green-600 mt-1">✓ Disahkan</p>
                  )}
                  {/* PRD: Agent sees timestamp only, NOT TAC code */}
                  <p className="text-xs text-snang-teal-600 mt-2">
                    Kod TAC hanya untuk pembeli
                  </p>
                </div>
              )}

              {/* KJ Status - PRD: This is buyer-reported, not system-verified */}
              {currentCase.kjStatus && (
                <div className={`mb-4 rounded-lg p-3 ${
                  currentCase.kjStatus === 'overdue'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-slate-50 border border-slate-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-sm font-medium ${
                      currentCase.kjStatus === 'overdue' ? 'text-red-800' : 'text-slate-700'
                    }`}>
                      Status KJ
                    </p>
                    <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                      Dilaporkan Pembeli
                    </span>
                  </div>
                  <p className={`text-sm ${
                    currentCase.kjStatus === 'overdue' ? 'text-red-700' : 'text-slate-600'
                  }`}>
                    {currentCase.kjStatus === 'overdue'
                      ? `Belum diterima (${currentCase.kjDays} hari)`
                      : currentCase.kjStatus === 'received'
                      ? 'Diterima'
                      : 'Menunggu'
                    }
                  </p>
                  {/* PRD Clarification */}
                  <p className="text-xs text-slate-500 mt-1">
                    KJ = Pengesahan identiti oleh Ketua Jabatan (bukan kelulusan pinjaman)
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/agent/case/${currentCase.id}`)}
                  className="w-full bg-snang-teal-600 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-snang-teal-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Lihat Penuh
                </button>
                <div className="flex gap-2">
                  {currentCase.buyer.phone && (
                    <WhatsAppContactCTA
                      buyer={{
                        name: currentCase.buyer.name,
                        phone: currentCase.buyer.phone,
                        caseRef: currentCase.id,
                        propertyName: currentCase.property.name,
                        unitCode: currentCase.property.unit,
                        tacDate: currentCase.tacSchedule?.date,
                        tacTime: currentCase.tacSchedule?.time,
                        missingDocs: currentCase.documents
                          .filter(d => d.status !== 'verified')
                          .map(d => d.type),
                      }}
                      caseId={currentCase.id}
                      locale="bm"
                      variant="dropdown"
                    />
                  )}
                  <button className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                    <Phone className="w-4 h-4" />
                    Panggil
                  </button>
                </div>
              </div>

              {/* PRD Warning */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 text-center">
                  Ejen tidak boleh meluluskan atau menolak permohonan.
                  Hanya koordinasi dan penghantaran.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="max-w-6xl mx-auto px-4 pb-24">
        <AuthorityDisclaimer variant="prominent" />
      </div>
    </div>
  );
}
