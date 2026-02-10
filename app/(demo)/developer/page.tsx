// app/(demo)/developer/page.tsx
// Sprint S4 Day 3: Wired to real APIs (GET /api/cases + /api/properties)
// PRD Section 9.2: Developer sees AGGREGATE data only
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2, Users, TrendingUp, FileText, Clock, CheckCircle,
  AlertTriangle, PieChart, BarChart3, Download, Plus, Link as LinkIcon,
  Shield, Lock, Info, Eye, ArrowUpRight, RefreshCw, QrCode
} from 'lucide-react';
import { AuthorityDisclaimer, PermissionGate, PermissionWarning } from '@/components/permission-gate';
import { useTranslation } from '@/lib/i18n';
import { InvitationModal } from '@/components/InvitationModal';

// ---------- Types ----------
interface ApiCase {
  id: string;
  case_ref: string;
  status: string;
  property_price: number | null;
  loan_amount_requested: number | null;
  created_at: string;
  developer?: { id: string; company_name: string } | null;
  property?: { id: string; name: string; slug: string } | null;
}

interface ApiProperty {
  id: string;
  name: string;
  location: string;
  total_units: number;
  status: string;
  developer?: { id: string; company_name: string } | null;
}

// ---------- Status → Phase mapping ----------
const STATUS_PHASES: Record<string, string> = {
  new: 'PRESCAN', prescan: 'PRESCAN',
  dsr_check: 'DOCS_PENDING', docs_pending: 'DOCS_PENDING',
  tac_scheduled: 'TAC_SCHEDULED', tac_confirmed: 'TAC_CONFIRMED',
  submitted: 'SUBMITTED', kj_pending: 'KJ_PENDING',
  lo_issued: 'LO_RECEIVED', completed: 'COMPLETED',
  rejected: 'REJECTED', expired: 'EXPIRED',
};

export default function DeveloperDashboard() {
  const { t, lang } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'proof'>('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [cases, setCases] = useState<ApiCase[]>([]);
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesRes, propsRes] = await Promise.all([
        fetch('/api/cases'),
        fetch('/api/properties'),
      ]);
      const casesJson = await casesRes.json();
      const propsJson = await propsRes.json();
      if (casesJson.success && casesJson.data) setCases(casesJson.data);
      if (propsJson.success && propsJson.data) setProperties(propsJson.data);
    } catch (err) {
      console.error('[developer] Fetch error:', err);
      setError('Gagal mendapatkan data. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derive project info from properties
  const projectInfo = {
    name: properties[0]?.name || 'Residensi Harmoni',
    location: properties[0]?.location || 'Kajang, Selangor',
    totalUnits: properties.reduce((sum, p) => sum + (p.total_units || 0), 0),
    sold: cases.filter(c => c.status === 'completed').length,
    loanInProgress: cases.filter(c => !['completed', 'rejected', 'expired'].includes(c.status)).length,
  };

  // PRD Section 9.2: AGGREGATE only
  const aggregates = {
    totalCases: cases.length,
    byPhase: cases.reduce((acc, c) => {
      const phase = STATUS_PHASES[c.status?.toLowerCase()] || 'UNKNOWN';
      acc[phase] = (acc[phase] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    completed: cases.filter(c => c.status === 'completed').length,
    inProgress: cases.filter(c => !['completed', 'new', 'prescan', 'rejected', 'expired'].includes(c.status)).length,
    conversionRate: cases.length > 0
      ? Math.round((cases.filter(c => c.status === 'completed').length / cases.length) * 100) : 0,
  };

  const statusDistribution = [
    { label: 'Imbasan', count: (aggregates.byPhase['PRESCAN'] || 0), color: 'bg-slate-400' },
    { label: 'Dokumen', count: (aggregates.byPhase['DOCS_PENDING'] || 0), color: 'bg-yellow-400' },
    { label: 'TAC', count: (aggregates.byPhase['TAC_SCHEDULED'] || 0) + (aggregates.byPhase['TAC_CONFIRMED'] || 0), color: 'bg-teal-400' },
    { label: 'Dihantar', count: aggregates.byPhase['SUBMITTED'] || 0, color: 'bg-purple-400' },
    { label: 'LO/KJ', count: (aggregates.byPhase['LO_RECEIVED'] || 0) + (aggregates.byPhase['KJ_PENDING'] || 0), color: 'bg-amber-400' },
    { label: 'Selesai', count: aggregates.byPhase['COMPLETED'] || 0, color: 'bg-green-400' },
  ];
  const totalStatusCount = statusDistribution.reduce((sum, s) => sum + s.count, 0) || 1;

  return (
    <div className="min-h-screen bg-slate-100">
      <InvitationModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)}
        projectName={projectInfo.name} projectLocation={projectInfo.location} />

      {/* Sub-header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Pipeline Dashboard</h1>
            <p className="text-sm text-slate-500">
              {lang === 'bm' ? 'Pantau prestasi projek anda' : 'Monitor your project performance'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Muat semula">
              <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/developer/properties"
              className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-cyan-700 transition-colors">
              <QrCode className="w-4 h-4" />
              {lang === 'bm' ? 'Konsol Hartanah' : 'Property Console'}
            </Link>
            <button className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-200 transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={() => setShowInviteModal(true)}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-teal-700 transition-colors">
              <Plus className="w-4 h-4" />
              {lang === 'bm' ? 'Cipta Pautan Jemputan' : 'Create Invitation Link'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* PRD CRITICAL WARNING */}
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 mb-1">Akses Terhad (PRD Section 9.2)</p>
              <p className="text-sm text-red-700">
                Pemaju hanya dapat melihat <strong>data agregat projek</strong> sahaja.
                Butiran kes individu, nama pembeli, nombor telefon, unit, harga, dan tarikh dijangka <strong> tidak boleh diakses</strong>.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={fetchData} className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">Cuba Lagi</button>
          </div>
        )}

        {/* Project Info */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-300 text-sm mb-1">Projek</p>
              <h2 className="text-2xl font-bold">{projectInfo.name}</h2>
              <p className="text-teal-200">{projectInfo.location}</p>
            </div>
            <div className="text-right">
              <p className="text-teal-300 text-sm">Jumlah Unit</p>
              <p className="text-3xl font-bold">{projectInfo.totalUnits}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-teal-600">
            <div>
              <p className="text-teal-300 text-sm">Dijual</p>
              <p className="text-2xl font-bold text-green-400">{projectInfo.sold}</p>
            </div>
            <div>
              <p className="text-teal-300 text-sm">Pinjaman Dalam Proses</p>
              <p className="text-2xl font-bold text-amber-400">{projectInfo.loanInProgress}</p>
            </div>
            <div>
              <p className="text-teal-300 text-sm">Kadar Penukaran</p>
              <p className="text-2xl font-bold text-teal-300">{aggregates.conversionRate}%</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'overview', label: 'Ringkasan', icon: PieChart },
            { id: 'analytics', label: 'Analitik', icon: BarChart3 },
            { id: 'proof', label: 'Log Bukti', icon: Shield },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 hover:bg-teal-50 hover:text-teal-700'
                }`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { icon: Users, label: 'Permohonan Aktif', value: aggregates.totalCases, color: 'text-teal-600', sub: 'Jumlah' },
                { icon: TrendingUp, label: 'Selesai', value: aggregates.completed, color: 'text-green-500', sub: 'Selesai' },
                { icon: Clock, label: 'Dalam Proses', value: aggregates.inProgress, color: 'text-teal-600', sub: 'Aktif' },
                { icon: CheckCircle, label: 'Penukaran', value: `${aggregates.conversionRate}%`, color: 'text-purple-500', sub: 'Kadar' },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-8 h-8 ${stat.color}`} />
                      <span className="text-xs text-slate-400">{stat.sub}</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">Taburan Status</h3>
                <div className="h-8 rounded-full overflow-hidden flex mb-4 bg-slate-100">
                  {statusDistribution.map((s, i) => s.count > 0 && (
                    <div key={i} className={`${s.color} transition-all`}
                      style={{ width: `${(s.count / totalStatusCount) * 100}%` }} title={`${s.label}: ${s.count}`} />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {statusDistribution.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${s.color}`} />
                      <span className="text-sm text-slate-600">{s.label}</span>
                      <span className="text-sm font-medium text-slate-800">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">Hartanah Berdaftar</h3>
                {properties.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4">Tiada hartanah berdaftar lagi.</p>
                ) : (
                  <div className="space-y-3">
                    {properties.map((p) => (
                      <div key={p.id} className="bg-slate-50 rounded-lg p-3 border">
                        <p className="font-medium text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.location || '—'}</p>
                        <div className="flex gap-3 mt-1 text-xs text-slate-500">
                          <span>{p.total_units || 0} unit</span>
                          <span className={`px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                            {p.status || 'draft'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* BLOCKED: Individual Case List */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Senarai Kes</h3>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-medium">AKSES DITOLAK</span>
              </div>
              <PermissionGate role="developer" resource="case_details">
                <div>Individual cases</div>
              </PermissionGate>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h4 className="font-semibold text-slate-700 mb-2">Butiran Kes Tidak Boleh Diakses</h4>
                <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
                  Mengikut PRD Section 9.2, pemaju hanya boleh melihat data agregat projek.
                </p>
                <div className="flex justify-center gap-4 text-sm">
                  {['Nama pembeli', 'No. telefon', 'Unit & harga', 'Tarikh dijangka'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-red-500">
                      <XIcon className="w-4 h-4" /><span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Analitik Projek</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Funnel Permohonan (Data Sebenar)</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Imbasan Selesai', count: cases.length, pct: 100 },
                    { label: 'Dokumen Lengkap', count: cases.filter(c => !['new', 'prescan', 'docs_pending'].includes(c.status)).length,
                      pct: cases.length > 0 ? Math.round((cases.filter(c => !['new', 'prescan', 'docs_pending'].includes(c.status)).length / cases.length) * 100) : 0 },
                    { label: 'TAC Dijadualkan', count: cases.filter(c => ['tac_scheduled', 'tac_confirmed', 'submitted', 'kj_pending', 'lo_issued', 'completed'].includes(c.status)).length,
                      pct: cases.length > 0 ? Math.round((cases.filter(c => ['tac_scheduled', 'tac_confirmed', 'submitted', 'kj_pending', 'lo_issued', 'completed'].includes(c.status)).length / cases.length) * 100) : 0 },
                    { label: 'Dihantar ke LPPSA', count: cases.filter(c => ['submitted', 'kj_pending', 'lo_issued', 'completed'].includes(c.status)).length,
                      pct: cases.length > 0 ? Math.round((cases.filter(c => ['submitted', 'kj_pending', 'lo_issued', 'completed'].includes(c.status)).length / cases.length) * 100) : 0 },
                    { label: 'Kelulusan', count: cases.filter(c => c.status === 'completed').length,
                      pct: cases.length > 0 ? Math.round((cases.filter(c => c.status === 'completed').length / cases.length) * 100) : 0 },
                  ].map((stage, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-32 text-sm text-slate-600">{stage.label}</span>
                      <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full" style={{ width: `${stage.pct}%` }} />
                      </div>
                      <span className="text-sm font-medium text-slate-700 w-16 text-right">{stage.count} ({stage.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Hartanah Berdaftar</h4>
                {properties.length === 0 ? (
                  <p className="text-sm text-slate-500">Tiada hartanah berdaftar lagi.</p>
                ) : (
                  <div className="space-y-3">
                    {properties.map((p) => (
                      <div key={p.id} className="bg-white rounded-lg p-3 border">
                        <p className="font-medium text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.location || '—'} • {p.total_units || 0} unit</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <Info className="w-3 h-3 inline mr-1" />
                Semua data di halaman ini adalah agregat. Pemaju tidak boleh melihat maklumat peribadi pembeli.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'proof' && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-500" /> Log Bukti Aktiviti
              </h3>
              <Link href="/developer/proof" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
                Lihat Semua <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {cases.slice(0, 10).map(c => (
                <div key={c.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-teal-600" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">Kes {c.case_ref} — Status: {c.status}</p>
                    <p className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString('ms-MY')}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">AGGREGATE</span>
                    <p className="text-xs text-slate-400 mt-1">authority: false</p>
                  </div>
                </div>
              ))}
              {cases.length === 0 && <div className="text-center py-8 text-slate-500 text-sm">Tiada log bukti lagi.</div>}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center">Log ini menunjukkan aktiviti tanpa mendedahkan identiti pembeli</p>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24">
        <AuthorityDisclaimer variant="prominent" />
      </div>
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
