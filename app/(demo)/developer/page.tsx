// app/developer/page.tsx
// BM-4: Color migration — slate-800/900 → snang-teal-700/900, orange → teal
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2, Users, TrendingUp, FileText, Clock, CheckCircle,
  AlertTriangle, PieChart, BarChart3, Download, Plus, Link as LinkIcon,
  Shield, Lock, Info, Eye, ArrowUpRight, RefreshCw
} from 'lucide-react';
import { AuthorityDisclaimer, PermissionGate, PermissionWarning } from '@/components/permission-gate';
import { useCaseStore } from '@/lib/store/case-store';
import { getPhaseLabel } from '@/lib/orchestrator/case-state';
import { useTranslation } from '@/lib/i18n';
import { InvitationModal } from '@/components/InvitationModal';

export default function DeveloperDashboard() {
  const { cases, projectInfo, proofEvents } = useCaseStore();
  const { t, lang } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'proof'>('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // PRD Section 9.2: Developer sees AGGREGATE only
  const aggregates = {
    totalCases: cases.length,
    byPhase: cases.reduce((acc, c) => {
      acc[c.phase] = (acc[c.phase] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    completed: cases.filter(c => c.phase === 'COMPLETED').length,
    inProgress: cases.filter(c => !['COMPLETED', 'PRESCAN'].includes(c.phase)).length,
    conversionRate: cases.length > 0 
      ? Math.round((cases.filter(c => c.phase === 'COMPLETED').length / cases.length) * 100)
      : 0,
  };

  // Status distribution for chart - BM-4: updated colors
  const statusDistribution = [
    { label: 'Imbasan', count: aggregates.byPhase['PRESCAN'] || 0, color: 'bg-slate-400' },
    { label: 'Dokumen', count: (aggregates.byPhase['DOCS_PENDING'] || 0) + (aggregates.byPhase['DOCS_COMPLETE'] || 0), color: 'bg-yellow-400' },
    { label: 'TAC', count: (aggregates.byPhase['TAC_SCHEDULED'] || 0) + (aggregates.byPhase['TAC_CONFIRMED'] || 0), color: 'bg-snang-teal-400' },
    { label: 'Dihantar', count: aggregates.byPhase['SUBMITTED'] || 0, color: 'bg-purple-400' },
    { label: 'LO/KJ', count: (aggregates.byPhase['LO_RECEIVED'] || 0) + (aggregates.byPhase['KJ_PENDING'] || 0), color: 'bg-snang-amber-400' },
    { label: 'Selesai', count: aggregates.byPhase['COMPLETED'] || 0, color: 'bg-green-400' },
  ];

  const totalStatusCount = statusDistribution.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Invitation Modal */}
      <InvitationModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        projectName={projectInfo.name}
        projectLocation={projectInfo.location}
      />

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
            <button className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-200 transition-colors">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-snang-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-snang-teal-700 transition-colors"
            >
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
                Butiran kes individu, nama pembeli, nombor telefon, unit, harga, dan tarikh dijangka 
                <strong> tidak boleh diakses</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Project Info - BM-4: teal gradient */}
        <div className="bg-gradient-to-r from-snang-teal-700 to-snang-teal-900 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-snang-teal-300 text-sm mb-1">Projek</p>
              <h2 className="text-2xl font-bold">{projectInfo.name}</h2>
              <p className="text-snang-teal-200">{projectInfo.location}</p>
            </div>
            <div className="text-right">
              <p className="text-snang-teal-300 text-sm">Jumlah Unit</p>
              <p className="text-3xl font-bold">{projectInfo.totalUnits}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-snang-teal-600">
            <div>
              <p className="text-snang-teal-300 text-sm">Dijual</p>
              <p className="text-2xl font-bold text-green-400">{projectInfo.sold}</p>
            </div>
            <div>
              <p className="text-snang-teal-300 text-sm">Pinjaman Dalam Proses</p>
              <p className="text-2xl font-bold text-snang-amber-400">{projectInfo.loanInProgress}</p>
            </div>
            <div>
              <p className="text-snang-teal-300 text-sm">Kadar Penukaran</p>
              <p className="text-2xl font-bold text-snang-teal-300">{aggregates.conversionRate}%</p>
            </div>
          </div>
        </div>

        {/* Tabs - BM-4: teal active state */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'overview', label: 'Ringkasan', icon: PieChart },
            { id: 'analytics', label: 'Analitik', icon: BarChart3 },
            { id: 'proof', label: 'Log Bukti', icon: Shield },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-snang-teal-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-snang-teal-50 hover:text-snang-teal-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Stats Cards - AGGREGATE ONLY */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-snang-teal-600" />
                  <span className="text-xs text-slate-400">Jumlah</span>
                </div>
                <p className="text-3xl font-bold text-slate-800">{aggregates.totalCases}</p>
                <p className="text-sm text-slate-500">Permohonan Aktif</p>
              </div>
              
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                  <span className="text-xs text-green-500">+12%</span>
                </div>
                <p className="text-3xl font-bold text-slate-800">{aggregates.completed}</p>
                <p className="text-sm text-slate-500">Selesai</p>
              </div>
              
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 text-snang-teal-600" />
                  <span className="text-xs text-slate-400">Aktif</span>
                </div>
                <p className="text-3xl font-bold text-slate-800">{aggregates.inProgress}</p>
                <p className="text-sm text-slate-500">Dalam Proses</p>
              </div>
              
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8 text-purple-500" />
                  <span className="text-xs text-slate-400">Kadar</span>
                </div>
                <p className="text-3xl font-bold text-slate-800">{aggregates.conversionRate}%</p>
                <p className="text-sm text-slate-500">Penukaran</p>
              </div>
            </div>

            {/* Status Distribution - AGGREGATE ONLY */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">Taburan Status</h3>
                
                {/* Visual Bar */}
                <div className="h-8 rounded-full overflow-hidden flex mb-4">
                  {statusDistribution.map((status, idx) => (
                    status.count > 0 && (
                      <div
                        key={idx}
                        className={`${status.color} transition-all`}
                        style={{ width: `${(status.count / totalStatusCount) * 100}%` }}
                        title={`${status.label}: ${status.count}`}
                      />
                    )
                  ))}
                </div>

                {/* Legend */}
                <div className="grid grid-cols-3 gap-2">
                  {statusDistribution.map((status, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${status.color}`} />
                      <span className="text-sm text-slate-600">{status.label}</span>
                      <span className="text-sm font-medium text-slate-800">{status.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">Metrik Prestasi</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Purata Masa Proses</span>
                      <span className="font-medium text-slate-800">45 hari</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-snang-teal-600 rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Kadar Kejayaan TAC</span>
                      <span className="font-medium text-slate-800">92%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Dokumen Lengkap</span>
                      <span className="font-medium text-slate-800">78%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-snang-teal-600 rounded-full" style={{ width: '78%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BLOCKED: Individual Case List */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Senarai Kes</h3>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-medium">
                  AKSES DITOLAK
                </span>
              </div>
              
              {/* PRD Compliance: Block individual case access */}
              <PermissionGate role="developer" resource="case_details">
                {/* This will never render because developer cannot access case_details */}
                <div>Individual cases</div>
              </PermissionGate>
              
              {/* Fallback message */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h4 className="font-semibold text-slate-700 mb-2">Butiran Kes Tidak Boleh Diakses</h4>
                <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
                  Mengikut PRD Section 9.2, pemaju hanya boleh melihat data agregat projek. 
                  Untuk melihat butiran kes individu, sila hubungi ejen yang bertanggungjawab.
                </p>
                <div className="flex justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-red-500">
                    <XIcon className="w-4 h-4" />
                    <span>Nama pembeli</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-500">
                    <XIcon className="w-4 h-4" />
                    <span>No. telefon</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-500">
                    <XIcon className="w-4 h-4" />
                    <span>Unit & harga</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-500">
                    <XIcon className="w-4 h-4" />
                    <span>Tarikh dijangka</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Analitik Projek</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Monthly Trend - Aggregate - BM-4: teal bars */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Trend Bulanan (Agregat)</h4>
                <div className="space-y-2">
                  {['Jan', 'Feb', 'Mac', 'Apr'].map((month, idx) => (
                    <div key={month} className="flex items-center gap-3">
                      <span className="w-10 text-sm text-slate-500">{month}</span>
                      <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-snang-teal-500 rounded-full"
                          style={{ width: `${[40, 55, 65, 75][idx]}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700 w-8">
                        {[8, 11, 13, 15][idx]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phase Funnel - Aggregate - BM-4: teal gradient */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Funnel Permohonan</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Imbasan Selesai', count: 45, pct: 100 },
                    { label: 'Dokumen Lengkap', count: 38, pct: 84 },
                    { label: 'TAC Dijadualkan', count: 32, pct: 71 },
                    { label: 'Dihantar ke LPPSA', count: 28, pct: 62 },
                    { label: 'Kelulusan', count: 22, pct: 49 },
                  ].map((stage, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-32 text-sm text-slate-600">{stage.label}</span>
                      <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-snang-teal-500 to-snang-teal-400 rounded-full"
                          style={{ width: `${stage.pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700 w-12 text-right">
                        {stage.count} ({stage.pct}%)
                      </span>
                    </div>
                  ))}
                </div>
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
                <Shield className="w-5 h-5 text-snang-teal-500" />
                Log Bukti Aktiviti
              </h3>
              <Link
                href="/developer/proof"
                className="text-sm text-snang-teal-600 hover:text-snang-teal-700 flex items-center gap-1"
              >
                Lihat Semua <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Aggregated proof events - no individual identifiers */}
            <div className="space-y-3">
              {proofEvents.slice(0, 10).map(event => (
                <div 
                  key={event.id}
                  className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    event.category === 'FACT' ? 'bg-snang-teal-600' :
                    event.category === 'DECLARE' ? 'bg-green-500' : 'bg-purple-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{event.intent}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(event.timestamp).toLocaleString('ms-MY')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                      {event.category}
                    </span>
                    {/* PRD: Always show authorityClaimed = false */}
                    <p className="text-xs text-slate-400 mt-1">
                      authority: false
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center">
                Log ini menunjukkan aktiviti tanpa mendedahkan identiti pembeli
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto px-4 pb-24">
        <AuthorityDisclaimer variant="prominent" />
      </div>
    </div>
  );
}

// Simple X icon component
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
