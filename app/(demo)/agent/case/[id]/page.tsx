// app/agent/case/[id]/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, User, Building, FileText, Calendar, Clock,
  CheckCircle, AlertTriangle, Send, Phone, MessageSquare,
  Shield, Eye, RefreshCw, Info, AlertCircle
} from 'lucide-react';
import { AuthorityDisclaimer, PermissionWarning } from '@/components/permission-gate';
import { QuerySignalsPanel } from '@/components/QuerySignalsPanel';
import { useCaseStore } from '@/lib/store/case-store';
import { useProofLogger } from '@/lib/services/hooks';
import { getPhaseLabel, getPhaseConfig, getNextAction } from '@/lib/orchestrator/case-state';
import { confidenceToLabel } from '@/lib/orchestrator/permissions';
import { formatProofEvent } from '@/lib/qontrek/proof-events';

export default function AgentCaseDetail() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  
  // Use service hooks for proof logging
  const { logTacScheduled, logTacConfirmed, logSubmissionConfirmed } = useProofLogger();
  
  const { cases, proofEvents, scheduleTac, confirmTac } = useCaseStore();
  const caseData = cases.find(c => c.id === caseId);
  const caseProofEvents = proofEvents.filter(e => e.caseId === caseId);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'query' | 'docs' | 'timeline' | 'proof'>('overview');

  if (!caseData) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">Kes tidak dijumpai</p>
          <button 
            onClick={() => router.push('/agent')}
            className="mt-4 text-snang-teal-600 hover:text-snang-teal-600"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const phaseConfig = getPhaseConfig(caseData.phase);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.push('/agent')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-3"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800">{caseData.buyer.name}</h1>
              <p className="text-sm text-slate-500">{caseData.property.name} • {caseData.property.unit}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${phaseConfig.bgColor} ${phaseConfig.textColor}`}>
                {getPhaseLabel(caseData.phase)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* PRD Reminder */}
        <PermissionWarning
          message="Paparan ini menunjukkan data yang boleh dilihat oleh ejen sahaja. Dokumen mentah dan angka tepat tidak ditunjukkan."
          type="info"
        />

        {/* Tab Navigation */}
        <div className="flex gap-1 mt-4 mb-4 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Ringkasan
          </button>
          <button
            onClick={() => setActiveTab('query')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'query'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center justify-center gap-1">
              Query LPPSA
              {caseData.queryRisk === 'high' && (
                <span className="w-2 h-2 bg-red-500 rounded-full" />
              )}
            </span>
          </button>
        </div>

        {/* Query Tab Content */}
        {activeTab === 'query' && (
          <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
            <QuerySignalsPanel caseData={caseData} />
          </div>
        )}

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-4">
            {/* Buyer Info Card */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-snang-teal-600" />
                Maklumat Pembeli
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Nama</p>
                  <p className="font-medium text-slate-800">{caseData.buyer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">No. Telefon</p>
                  <p className="font-medium text-slate-800">{caseData.buyer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Pekerjaan</p>
                  <p className="font-medium text-slate-800">{caseData.buyer.occupation || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Majikan</p>
                  <p className="font-medium text-slate-800">{caseData.buyer.employer || '-'}</p>
                </div>
                {/* PRD Compliance: Income as RANGE only */}
                <div>
                  <p className="text-sm text-slate-500">Julat Pendapatan</p>
                  <p className="font-medium text-slate-800">{caseData.buyer.incomeRange}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Angka tepat tidak ditunjukkan</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Gred</p>
                  <p className="font-medium text-slate-800">{caseData.buyer.grade || '-'}</p>
                </div>
              </div>
            </div>

            {/* Property Info Card */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-snang-teal-600" />
                Maklumat Hartanah
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Nama Projek</p>
                  <p className="font-medium text-slate-800">{caseData.property.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Unit</p>
                  <p className="font-medium text-slate-800">{caseData.property.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Harga</p>
                  <p className="font-medium text-slate-800">RM {caseData.property.price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Jenis</p>
                  <p className="font-medium text-slate-800">
                    {caseData.property.type === 'subsale' ? 'Subsale' :
                     caseData.property.type === 'land_build' ? 'Tanah + Bina' : 'Projek Baru'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">Lokasi</p>
                  <p className="font-medium text-slate-800">{caseData.property.location}</p>
                </div>
              </div>
            </div>

            {/* Documents Card */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-snang-teal-600" />
                Status Dokumen
              </h3>
              
              {/* PRD Warning about document access */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-700">
                  <Info className="w-3 h-3 inline mr-1" />
                  Ejen melihat status sahaja. Dokumen mentah tidak boleh diakses untuk melindungi privasi pembeli.
                </p>
              </div>

              <div className="space-y-3">
                {caseData.documents.map(doc => {
                  // PRD Compliance: Show confidence LABEL not percentage
                  const confidenceLabel = doc.confidence 
                    ? confidenceToLabel(doc.confidence)
                    : null;
                  
                  return (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {doc.status === 'verified' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : doc.status === 'pending' ? (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium text-slate-800">{doc.name}</p>
                          <p className="text-xs text-slate-500">{doc.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* PRD Compliance: Confidence as label, not percentage */}
                        {confidenceLabel && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            confidenceLabel === 'HIGH_CONFIDENCE'
                              ? 'bg-green-100 text-green-700'
                              : confidenceLabel === 'LOW_CONFIDENCE'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {confidenceLabel === 'HIGH_CONFIDENCE' ? 'KEYAKINAN TINGGI' :
                             confidenceLabel === 'LOW_CONFIDENCE' ? 'KEYAKINAN RENDAH' :
                             'PERLU SEMAKAN'}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${
                          doc.status === 'verified' 
                            ? 'bg-green-100 text-green-700'
                            : doc.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {doc.status === 'verified' ? 'Disahkan' :
                           doc.status === 'pending' ? 'Pending' : 'Ditolak'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Proof Events Log */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-snang-teal-600" />
                Log Aktiviti (Qontrek)
              </h3>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {caseProofEvents.length > 0 ? caseProofEvents.slice(0, 10).map(event => {
                  const formatted = formatProofEvent(event);
                  return (
                    <div key={event.id} className="flex items-start gap-3 text-sm">
                      <div className="text-right w-16 flex-shrink-0">
                        <p className="text-slate-500">{formatted.date}</p>
                        <p className="text-slate-400 text-xs">{formatted.time}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${formatted.categoryColor.replace('text-', 'bg-')}`} />
                      <div>
                        <p className="text-slate-700">{formatted.action}</p>
                        <p className="text-xs text-slate-400">oleh {formatted.actor}</p>
                        {/* PRD: Always show authorityClaimed = false */}
                        <p className="text-xs text-slate-300">
                          authorityClaimed: false
                        </p>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-slate-400 text-center py-4">
                    Tiada log aktiviti
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-3">Status Semasa</h3>
              <div className={`p-3 rounded-lg ${phaseConfig.bgColor}`}>
                <p className={`font-medium ${phaseConfig.textColor}`}>
                  {getPhaseLabel(caseData.phase)}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {getNextAction(caseData.phase)}
                </p>
              </div>
            </div>

            {/* Readiness Signal */}
            {caseData.readiness && (
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-3">Isyarat Kesediaan</h3>
                <div className={`p-3 rounded-lg ${
                  caseData.readiness.band === 'ready' ? 'bg-green-50' :
                  caseData.readiness.band === 'caution' ? 'bg-yellow-50' : 'bg-red-50'
                }`}>
                  <p className={`font-bold ${
                    caseData.readiness.band === 'ready' ? 'text-green-700' :
                    caseData.readiness.band === 'caution' ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {caseData.readiness.label}
                  </p>
                  {/* PRD: Score breakdown NOT shown to agent */}
                  <p className="text-xs text-slate-500 mt-1">
                    Pecahan skor tidak ditunjukkan
                  </p>
                </div>
              </div>
            )}

            {/* TAC Card */}
            {caseData.tacSchedule && (
              <div className="bg-snang-teal-50 border border-snang-teal-200 rounded-xl p-5">
                <h3 className="font-semibold text-snang-teal-800 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  TAC Dijadualkan
                </h3>
                <p className="text-snang-teal-700 font-medium">{caseData.tacSchedule.date}</p>
                <p className="text-snang-teal-600">{caseData.tacSchedule.time}</p>
                {caseData.tacSchedule.confirmed && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Disahkan oleh pembeli
                  </p>
                )}
                {/* PRD: TAC code not visible to agent */}
                <p className="text-xs text-snang-teal-600 mt-2">
                  Kod TAC dihantar terus kepada pembeli
                </p>
              </div>
            )}

            {/* KJ Status */}
            {caseData.kjStatus && (
              <div className={`rounded-xl p-5 ${
                caseData.kjStatus === 'overdue' 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-slate-50 border border-slate-200'
              }`}>
                <h3 className={`font-semibold mb-2 ${
                  caseData.kjStatus === 'overdue' ? 'text-red-800' : 'text-slate-800'
                }`}>
                  Status KJ
                </h3>
                <p className={`text-sm ${
                  caseData.kjStatus === 'overdue' ? 'text-red-700' : 'text-slate-600'
                }`}>
                  {caseData.kjStatus === 'overdue' 
                    ? `Belum diterima (${caseData.kjDays} hari)`
                    : caseData.kjStatus === 'received'
                    ? 'Diterima'
                    : 'Menunggu'
                  }
                </p>
                {/* PRD Clarification */}
                <div className="bg-white/50 rounded p-2 mt-2">
                  <p className="text-xs text-slate-500">
                    <strong>KJ = Ketua Jabatan</strong><br/>
                    Pengesahan identiti sahaja, bukan kelulusan pinjaman.
                    Status ini dilaporkan oleh pembeli.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-xl p-5 shadow-sm space-y-2">
              <button className="w-full bg-snang-teal-600 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-snang-teal-700 transition-colors">
                <Send className="w-4 h-4" />
                Hantar Peringatan
              </button>
              <button className="w-full bg-slate-100 text-slate-700 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                <Phone className="w-4 h-4" />
                Hubungi Pembeli
              </button>
              <button className="w-full bg-slate-100 text-slate-700 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </button>
            </div>

            {/* PRD Boundary Reminder */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs text-red-700 text-center">
                <strong>⚠️ Sempadan Kuasa:</strong><br/>
                Ejen tidak boleh meluluskan atau menolak.
                Penghantaran ke LPPSA dilakukan secara manual di portal rasmi.
              </p>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        <AuthorityDisclaimer variant="prominent" />
      </div>
    </div>
  );
}
