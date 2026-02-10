// app/(demo)/agent/page.tsx
// FIXED: Case list rendering + status mapping + null unit handling
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, RefreshCw, Bell, FileText, Calendar, AlertTriangle,
  Clock, Phone, MessageSquare, Eye, Shield, ChevronRight,
  Send, User, Building, Filter, X
} from 'lucide-react';

// ---------- Types ----------
interface ApiCase {
  id: string;
  case_ref: string;
  property_id: string | null;
  unit_id: string | null;
  developer_id: string;
  buyer_name: string;
  buyer_ic: string | null;
  buyer_phone: string | null;
  buyer_email: string | null;
  property_price: number | null;
  loan_amount_requested: number | null;
  income_declared: number | null;
  status: string;
  assigned_agent_id: string | null;
  assigned_at: string | null;
  spillover_source_id: string | null;
  pdpa_consented: boolean;
  pdpa_consented_at: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  completed_at: string | null;
  developer?: { id: string; company_name: string } | null;
  property?: { id: string; name: string; slug: string; location?: string } | null;
  unit?: { id: string; unit_no: string; floor?: string; price?: number; status?: string } | null;
  agent?: { id: string; name: string; phone_display: string; email?: string; is_master_agent?: boolean } | null;
}

// ---------- Status mapping: DB → Display ----------
// DB stores lowercase: new, prescan, dsr_check, docs_pending, tac_scheduled,
// tac_confirmed, submitted, kj_pending, lo_issued, completed, rejected, expired
const STATUS_DISPLAY: Record<string, { label: string; labelEN: string; color: string; phase: string }> = {
  new:            { label: 'Baru',              labelEN: 'New',              color: 'bg-blue-100 text-blue-800',    phase: 'NEW' },
  prescan:        { label: 'Pra-Semakan',       labelEN: 'Pre-Scan',        color: 'bg-purple-100 text-purple-800', phase: 'PRESCAN' },
  dsr_check:      { label: 'Semakan DSR',       labelEN: 'DSR Check',       color: 'bg-indigo-100 text-indigo-800', phase: 'DSR_CHECK' },
  docs_pending:   { label: 'Dokumen Pending',   labelEN: 'Docs Pending',    color: 'bg-yellow-100 text-yellow-800', phase: 'DOCS_PENDING' },
  tac_scheduled:  { label: 'TAC Dijadual',      labelEN: 'TAC Scheduled',   color: 'bg-cyan-100 text-cyan-800',    phase: 'TAC_SCHEDULED' },
  tac_confirmed:  { label: 'TAC Disahkan',      labelEN: 'TAC Confirmed',   color: 'bg-teal-100 text-teal-800',    phase: 'TAC_CONFIRMED' },
  submitted:      { label: 'Dihantar',          labelEN: 'Submitted',       color: 'bg-green-100 text-green-800',  phase: 'SUBMITTED' },
  kj_pending:     { label: 'Menunggu KJ',       labelEN: 'KJ Pending',      color: 'bg-orange-100 text-orange-800', phase: 'KJ_PENDING' },
  lo_issued:      { label: 'LO Dikeluarkan',    labelEN: 'LO Issued',       color: 'bg-emerald-100 text-emerald-800', phase: 'LO_ISSUED' },
  completed:      { label: 'Selesai',           labelEN: 'Completed',       color: 'bg-green-200 text-green-900',  phase: 'COMPLETED' },
  rejected:       { label: 'Ditolak',           labelEN: 'Rejected',        color: 'bg-red-100 text-red-800',      phase: 'REJECTED' },
  expired:        { label: 'Tamat',             labelEN: 'Expired',         color: 'bg-gray-100 text-gray-800',    phase: 'EXPIRED' },
};

function getStatusDisplay(status: string) {
  return STATUS_DISPLAY[status.toLowerCase()] || {
    label: status,
    labelEN: status,
    color: 'bg-gray-100 text-gray-600',
    phase: status.toUpperCase(),
  };
}

// ---------- Filter categories ----------
type FilterKey = 'all' | 'tac' | 'docs' | 'kj' | 'lo';

const FILTERS: { key: FilterKey; label: string; icon: typeof FileText; matchStatuses: string[] }[] = [
  { key: 'all',  label: 'Semua',            icon: FileText,       matchStatuses: [] }, // empty = show all
  { key: 'tac',  label: 'TAC Dijadual',     icon: Calendar,       matchStatuses: ['tac_scheduled', 'tac_confirmed'] },
  { key: 'docs', label: 'Dokumen Pending',  icon: FileText,       matchStatuses: ['docs_pending'] },
  { key: 'kj',   label: 'KJ Overdue',       icon: AlertTriangle,  matchStatuses: ['kj_pending'] },
  { key: 'lo',   label: 'LO Hampir Tamat',  icon: Clock,          matchStatuses: ['lo_issued'] },
];

// ---------- Helpers ----------
function maskPhone(phone: string | null): string {
  if (!phone) return '—';
  // Mask middle digits: +60191234567 → XXXXXXX4567
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 4) {
    return 'X'.repeat(clean.length - 4) + clean.slice(-4);
  }
  return phone;
}

function incomeToRange(income: number | null): string {
  if (!income) return '—';
  if (income <= 3000) return 'RM 2,000 - RM 3,000';
  if (income <= 4000) return 'RM 3,001 - RM 4,000';
  if (income <= 5000) return 'RM 4,001 - RM 5,000';
  if (income <= 6000) return 'RM 5,001 - RM 6,000';
  if (income <= 8000) return 'RM 6,001 - RM 8,000';
  return 'RM 8,001 ke atas';
}

function formatPrice(price: number | null): string {
  if (!price) return '—';
  return `RM ${price.toLocaleString('en-MY')}`;
}

function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ms-MY', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

// ---------- Main Component ----------
export default function AgentDashboard() {
  const router = useRouter();

  // State
  const [cases, setCases] = useState<ApiCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<ApiCase | null>(null);

  // Fetch cases from API
  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cases');
      const json = await res.json();

      if (json.success && json.data) {
        setCases(json.data);
        // Auto-select first case for preview
        if (json.data.length > 0 && !selectedCase) {
          setSelectedCase(json.data[0]);
        }
      } else if (json.data) {
        // Fallback format (some API versions return data directly)
        setCases(Array.isArray(json.data) ? json.data : [json.data]);
      } else {
        setError(json.error || json.errorEN || 'Gagal mendapatkan data');
      }
    } catch (err) {
      setError('Ralat rangkaian. Sila cuba lagi.');
      console.error('[agent] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Filter cases
  const filteredCases = cases.filter((c) => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.buyer_name?.toLowerCase().includes(q) ||
        c.case_ref?.toLowerCase().includes(q) ||
        c.property?.name?.toLowerCase().includes(q) ||
        c.buyer_phone?.includes(q);
      if (!matchesSearch) return false;
    }

    // Category filter
    const filter = FILTERS.find((f) => f.key === activeFilter);
    if (!filter || filter.matchStatuses.length === 0) return true; // 'all' shows everything
    return filter.matchStatuses.includes(c.status?.toLowerCase());
  });

  // Compute stats
  const stats = {
    total: cases.length,
    tacThisWeek: cases.filter((c) =>
      ['tac_scheduled', 'tac_confirmed'].includes(c.status?.toLowerCase())
    ).length,
    needsAttention: cases.filter((c) =>
      ['docs_pending', 'kj_pending'].includes(c.status?.toLowerCase())
    ).length,
    readyToSubmit: cases.filter((c) =>
      ['tac_confirmed'].includes(c.status?.toLowerCase())
    ).length,
  };

  // Filter counts
  const filterCounts: Record<FilterKey, number> = {
    all: cases.length,
    tac: cases.filter((c) => ['tac_scheduled', 'tac_confirmed'].includes(c.status?.toLowerCase())).length,
    docs: cases.filter((c) => c.status?.toLowerCase() === 'docs_pending').length,
    kj: cases.filter((c) => c.status?.toLowerCase() === 'kj_pending').length,
    lo: cases.filter((c) => c.status?.toLowerCase() === 'lo_issued').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Control Panel</h1>
            <p className="text-sm text-gray-500">Urus kes permohonan LPPSA</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchCases}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Muat semula"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <button className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 flex items-center gap-2">
              <Send className="w-4 h-4" />
              Batch Reminder
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Jumlah Kes', value: stats.total, color: 'text-gray-900' },
            { label: 'TAC Minggu Ini', value: stats.tacThisWeek, color: 'text-teal-600' },
            { label: 'Perlu Perhatian', value: stats.needsAttention, color: 'text-red-600' },
            { label: 'Siap Hantar', value: stats.readyToSubmit, color: 'text-gray-900' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-4 border">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* PRD Compliance Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Ejen melihat julat pendapatan sahaja, bukan angka tepat. Tahap keyakinan ditunjukkan sebagai HIGH/LOW.
          </p>
        </div>

        <div className="flex gap-6">
          {/* Main List */}
          <div className="flex-1">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama pembeli atau projek..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {FILTERS.map((filter) => {
                const Icon = filter.icon;
                const count = filterCounts[filter.key];
                const isActive = activeFilter === filter.key;
                return (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {filter.label}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      isActive ? 'bg-teal-700 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-800 font-medium">{error}</p>
                <button
                  onClick={fetchCases}
                  className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                >
                  Cuba Lagi
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && !error && (
              <div className="bg-white rounded-xl p-8 text-center border">
                <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                <p className="text-gray-500 text-sm">Memuat data kes...</p>
              </div>
            )}

            {/* Case List */}
            {!loading && !error && filteredCases.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center border">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">Tiada Kes Dijumpai</p>
                <p className="text-gray-500 text-sm mt-1">Tiada kes dalam kategori ini</p>
                <p className="text-gray-400 text-xs mt-1">No cases in this category</p>
              </div>
            )}

            {!loading && !error && filteredCases.length > 0 && (
              <div className="space-y-3">
                {filteredCases.map((c) => {
                  const statusInfo = getStatusDisplay(c.status);
                  const isSelected = selectedCase?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
                      className={`bg-white rounded-xl p-4 border cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'ring-2 ring-teal-500 border-teal-300' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900">{c.buyer_name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Building className="w-3.5 h-3.5" />
                              {c.property?.name || '—'}
                            </span>
                            {c.unit?.unit_no && (
                              <span>Unit {c.unit.unit_no}</span>
                            )}
                            <span>{formatPrice(c.property_price)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                            <span>{c.case_ref}</span>
                            <span>Dibuat: {formatDate(c.created_at)}</span>
                            {c.income_declared && (
                              <span>Pendapatan: {incomeToRange(c.income_declared)}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 mt-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview Panel */}
          {selectedCase && (
            <div className="w-80 flex-shrink-0">
              <div className="bg-white rounded-xl border p-5 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Pratonton Kes</h3>
                  <button onClick={() => setSelectedCase(null)}>
                    <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>

                {/* Buyer Info */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Pembeli</p>
                  <p className="font-semibold text-gray-900">{selectedCase.buyer_name}</p>
                  <p className="text-sm text-gray-500">{maskPhone(selectedCase.buyer_phone)}</p>
                </div>

                {/* Property Info */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Hartanah</p>
                  <p className="font-semibold text-gray-900">
                    {selectedCase.property?.name || '—'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedCase.unit?.unit_no ? `Unit ${selectedCase.unit.unit_no} · ` : ''}
                    {formatPrice(selectedCase.property_price)}
                  </p>
                </div>

                {/* Income (range only per PRD) */}
                {selectedCase.income_declared && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Julat Pendapatan</p>
                    <p className="text-sm text-gray-700">{incomeToRange(selectedCase.income_declared)}</p>
                  </div>
                )}

                {/* Status */}
                <div className="mb-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusDisplay(selectedCase.status).color}`}>
                    {getStatusDisplay(selectedCase.status).label}
                  </span>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => router.push(`/agent/case/${selectedCase.id}`)}
                    className="w-full px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Lihat Penuh
                  </button>
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 flex items-center justify-center gap-1.5">
                      <MessageSquare className="w-4 h-4" />
                      WhatsApp
                    </button>
                    <button className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center justify-center gap-1.5">
                      <Phone className="w-4 h-4" />
                      Panggil
                    </button>
                  </div>
                </div>

                {/* Authority Boundary Notice */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-400 text-center leading-relaxed">
                    Ejen tidak boleh meluluskan atau menolak permohonan. Hanya koordinasi dan penghantaran.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-center">
          <p className="text-sm text-amber-800">
            ⚠ Sistem ini untuk rujukan sahaja. Tiada penghantaran atau kelulusan dilakukan oleh sistem.
          </p>
        </div>
      </div>
    </div>
  );
}
