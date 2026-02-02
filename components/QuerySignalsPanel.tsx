// components/QuerySignalsPanel.tsx
// P2-4: Query LPPSA Tab Component
'use client';

import { useState } from 'react';
import {
  AlertTriangle, FileText, Calculator, UserX,
  Printer, Download, CheckCircle, XCircle,
  Info, Shield
} from 'lucide-react';
import { Case } from '@/types/case';
import { useCaseStore } from '@/lib/store/case-store';
import { ProofEventFactory } from '@/lib/qontrek/proof-events';

interface QuerySignal {
  id: string;
  type: 'DSR' | 'DOCUMENT' | 'KJ' | 'INCOME' | 'ELIGIBILITY';
  field: string;
  issue: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  resolution?: string;
}

interface QuerySignalsPanelProps {
  caseData: Case;
}

export function QuerySignalsPanel({ caseData }: QuerySignalsPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const { addProofEvent } = useCaseStore();

  // Derive query signals from case data
  const querySignals: QuerySignal[] = [];

  // Check DSR-related signals
  if (caseData.queryRisk === 'high') {
    querySignals.push({
      id: 'dsr-high',
      type: 'DSR',
      field: 'Nisbah Khidmat Hutang',
      issue: 'DSR melebihi 60% - risiko tinggi untuk kelulusan',
      severity: 'HIGH',
      resolution: 'Pembeli perlu kurangkan komitmen sedia ada atau tingkatkan pendapatan',
    });
  } else if (caseData.queryRisk === 'medium') {
    querySignals.push({
      id: 'dsr-medium',
      type: 'DSR',
      field: 'Nisbah Khidmat Hutang',
      issue: 'DSR dalam julat 41-60% - perlu perhatian',
      severity: 'MEDIUM',
      resolution: 'Pastikan komitmen sedia ada direkod dengan tepat',
    });
  }

  // Check document-related signals
  const pendingDocs = caseData.documents.filter(d => d.status === 'pending');
  const rejectedDocs = caseData.documents.filter(d => d.status === 'rejected');
  const lowConfidenceDocs = caseData.documents.filter(d => d.confidence && d.confidence < 0.85);

  if (pendingDocs.length > 0) {
    querySignals.push({
      id: 'docs-pending',
      type: 'DOCUMENT',
      field: 'Dokumen Tertangguh',
      issue: `${pendingDocs.length} dokumen masih belum dimuat naik: ${pendingDocs.map(d => d.type).join(', ')}`,
      severity: pendingDocs.length > 2 ? 'HIGH' : 'MEDIUM',
      resolution: 'Pembeli perlu memuat naik dokumen yang diperlukan',
    });
  }

  if (rejectedDocs.length > 0) {
    querySignals.push({
      id: 'docs-rejected',
      type: 'DOCUMENT',
      field: 'Dokumen Ditolak',
      issue: `${rejectedDocs.length} dokumen ditolak: ${rejectedDocs.map(d => d.type).join(', ')}`,
      severity: 'HIGH',
      resolution: 'Pembeli perlu muat naik semula dokumen yang betul',
    });
  }

  if (lowConfidenceDocs.length > 0) {
    querySignals.push({
      id: 'docs-low-conf',
      type: 'DOCUMENT',
      field: 'Keyakinan Rendah',
      issue: `${lowConfidenceDocs.length} dokumen dengan keyakinan rendah - mungkin perlu semakan manual`,
      severity: 'LOW',
      resolution: 'Semak dokumen secara manual sebelum hantar ke LPPSA',
    });
  }

  // Check KJ-related signals
  if (caseData.kjStatus === 'overdue') {
    querySignals.push({
      id: 'kj-overdue',
      type: 'KJ',
      field: 'Pengesahan Ketua Jabatan',
      issue: `KJ belum diterima selepas ${caseData.kjDays || '?'} hari`,
      severity: 'HIGH',
      resolution: 'Pembeli perlu menghubungi Ketua Jabatan untuk pengesahan',
    });
  }

  // Check LO expiry signals
  if (caseData.loExpiry && caseData.loExpiry <= 3) {
    querySignals.push({
      id: 'lo-expiring',
      type: 'ELIGIBILITY',
      field: 'Letter of Offer',
      issue: `LO akan tamat dalam ${caseData.loExpiry} hari`,
      severity: caseData.loExpiry <= 1 ? 'HIGH' : 'MEDIUM',
      resolution: 'Pastikan proses selesai sebelum LO tamat',
    });
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true);

    // Log proof event
    const event = {
      id: `evt_query_${Date.now()}`,
      eventType: 'QUERY_SIGNALS_DETECTED' as const,
      category: 'DERIVED' as const,
      actor: 'agent' as const,
      intent: `Laporan Query dijana: ${querySignals.length} isyarat dikesan`,
      timestamp: new Date().toISOString(),
      caseId: caseData.id,
      authorityClaimed: false as const,
      humanConfirmationRequired: false,
      metadata: {
        signalCount: querySignals.length,
        highSeverity: querySignals.filter(s => s.severity === 'HIGH').length,
        mediumSeverity: querySignals.filter(s => s.severity === 'MEDIUM').length,
        lowSeverity: querySignals.filter(s => s.severity === 'LOW').length,
      },
    };

    addProofEvent(event);

    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsGenerating(false);
    setReportGenerated(true);

    // Open print dialog
    window.print();
  };

  const getSeverityColor = (severity: QuerySignal['severity']) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-100 text-red-700 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getSeverityIcon = (severity: QuerySignal['severity']) => {
    switch (severity) {
      case 'HIGH': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'MEDIUM': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'LOW': return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTypeIcon = (type: QuerySignal['type']) => {
    switch (type) {
      case 'DSR': return <Calculator className="w-4 h-4" />;
      case 'DOCUMENT': return <FileText className="w-4 h-4" />;
      case 'KJ': return <UserX className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Isyarat Pertanyaan LPPSA
          </h3>
          <p className="text-sm text-slate-500">
            Isu yang mungkin ditanya oleh LPPSA semasa penilaian
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            querySignals.length === 0
              ? 'bg-green-100 text-green-700'
              : querySignals.some(s => s.severity === 'HIGH')
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {querySignals.length} Isyarat
          </span>
        </div>
      </div>

      {/* PRD Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-700">
          <Shield className="w-3 h-3 inline mr-1" />
          <strong>Penafian:</strong> Isyarat ini adalah panduan sahaja dan bukan keputusan rasmi.
          Kelulusan atau penolakan hanya ditentukan oleh LPPSA berdasarkan dokumen rasmi.
        </p>
      </div>

      {/* Signals List */}
      {querySignals.length > 0 ? (
        <div className="space-y-3">
          {querySignals.map(signal => (
            <div
              key={signal.id}
              className={`border rounded-lg p-4 ${getSeverityColor(signal.severity)}`}
            >
              <div className="flex items-start gap-3">
                {getSeverityIcon(signal.severity)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-white/50 rounded flex items-center gap-1">
                      {getTypeIcon(signal.type)}
                      {signal.type}
                    </span>
                    <span className="font-medium">{signal.field}</span>
                  </div>
                  <p className="text-sm">{signal.issue}</p>
                  {signal.resolution && (
                    <p className="text-xs mt-2 opacity-75">
                      <strong>Cadangan:</strong> {signal.resolution}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <p className="font-medium text-green-700">Tiada Isyarat Pertanyaan</p>
          <p className="text-sm text-green-600">
            Kes ini kelihatan lengkap dan bersedia untuk penilaian LPPSA.
          </p>
        </div>
      )}

      {/* Summary Stats */}
      {querySignals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-600">
              {querySignals.filter(s => s.severity === 'HIGH').length}
            </p>
            <p className="text-xs text-red-500">Tinggi</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {querySignals.filter(s => s.severity === 'MEDIUM').length}
            </p>
            <p className="text-xs text-yellow-500">Sederhana</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {querySignals.filter(s => s.severity === 'LOW').length}
            </p>
            <p className="text-xs text-blue-500">Rendah</p>
          </div>
        </div>
      )}

      {/* Generate Report Button */}
      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin">⏳</span>
              Menjana Laporan...
            </>
          ) : (
            <>
              <Printer className="w-5 h-5" />
              Jana Laporan Query
            </>
          )}
        </button>
        <p className="text-xs text-slate-400 text-center mt-2">
          Laporan akan dibuka untuk cetakan/PDF
        </p>
        {reportGenerated && (
          <p className="text-xs text-green-600 text-center mt-1 flex items-center justify-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Proof event QUERY_SIGNALS_DETECTED dilog (authorityClaimed: false)
          </p>
        )}
      </div>

      {/* Print-only section (hidden on screen) */}
      <div className="hidden print:block">
        <div className="border-t-2 border-slate-300 pt-4 mt-4">
          <p className="text-xs text-slate-500">
            Dijana pada: {new Date().toLocaleString('ms-MY')} |
            Kes: {caseData.id} |
            Pembeli: {caseData.buyer.name}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Laporan ini adalah isyarat sahaja. authorityClaimed: false
          </p>
        </div>
      </div>
    </div>
  );
}
