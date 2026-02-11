'use client';

/**
 * Buyer Upload Complete Page - CR-008 Doc-First Flow
 * PRD v3.6.3 CR-008 | Step 3 of 4
 *
 * Confirmation screen after document upload:
 * - Summary of uploaded documents
 * - Extracted data preview (if any)
 * - CTA to book Temujanji
 *
 * Flow: /buyer/upload → /buyer/upload-complete → /buyer/temujanji
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle,
  FileText,
  User,
  CreditCard,
  Building,
  Loader2,
  ArrowRight,
  Calendar,
  Clock,
  Phone,
  MessageCircle,
  Info,
  Shield,
} from 'lucide-react';
import { AuthorityDisclaimer } from '@/components/permission-gate';
import {
  DocFirstDocumentType,
  DOC_FIRST_DOCUMENTS,
  UploadedDocument,
} from '@/lib/types/buyer-flow';

// =============================================================================
// LOADING COMPONENT
// =============================================================================

function CompleteLoading() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto mb-2" />
        <p className="text-slate-500 text-sm">Memuatkan...</p>
      </div>
    </div>
  );
}

// =============================================================================
// ICON MAPPING
// =============================================================================

const DOC_ICONS: Record<DocFirstDocumentType, React.ComponentType<{ className?: string }>> = {
  IC: User,
  PAYSLIP: CreditCard,
  BANK_STATEMENT: Building,
  KWSP: FileText,
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function UploadCompleteFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get context from URL params
  const projectId = searchParams?.get('pid') || '';
  const developerId = searchParams?.get('did') || '';
  const agentId = searchParams?.get('aid') || '';
  const entrySource = searchParams?.get('entry') || 'direct';
  const projectName = searchParams?.get('project') || 'Residensi Harmoni';

  // State
  const [documents, setDocuments] = useState<
    Partial<Record<DocFirstDocumentType, UploadedDocument>>
  >({});
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load uploaded documents from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('doc_first_uploads');
    const completed = sessionStorage.getItem('doc_first_completed_at');

    if (stored) {
      try {
        setDocuments(JSON.parse(stored));
      } catch {
        console.error('[UploadComplete] Failed to parse stored uploads');
      }
    }

    if (completed) {
      setCompletedAt(completed);
    }

    setLoading(false);

    // Log event
    console.log('[UploadComplete] ALL_REQUIRED_DOCS_UPLOADED:', {
      buyerHash: sessionStorage.getItem('buyer_hash'),
      documentCount: stored ? Object.keys(JSON.parse(stored)).length : 0,
      completedAt: completed,
    });
  }, []);

  // Count uploaded docs
  const uploadedDocs = Object.entries(documents).filter(
    ([_, doc]) => doc?.status === 'UPLOADED'
  );
  const requiredUploaded = uploadedDocs.filter(
    ([type, _]) => DOC_FIRST_DOCUMENTS[type as DocFirstDocumentType].required
  );

  // Handle continue to Temujanji
  const handleBookTemujanji = () => {
    // S5 B06: Log TEMUJANJI_FLOW_STARTED proof event via real API
    const buyerHash = sessionStorage.getItem('buyer_hash');
    if (buyerHash) {
      fetch('/api/proof-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'TEMUJANJI_FLOW_STARTED',
          buyer_hash: buyerHash,
          case_id: sessionStorage.getItem('case_id') || undefined,
          metadata: { document_count: uploadedDocs.length },
        }),
      }).catch(() => {
        console.warn('[UploadComplete] Failed to log proof event');
      });
    }

    // Build query params
    const params = new URLSearchParams();
    if (projectId) params.set('pid', projectId);
    if (developerId) params.set('did', developerId);
    if (agentId) params.set('aid', agentId);
    if (entrySource) params.set('entry', entrySource);
    if (projectName) params.set('project', projectName);

    const queryString = params.toString();
    router.push(`/buyer/temujanji${queryString ? `?${queryString}` : ''}`);
  };

  // Handle skip (go to dashboard)
  const handleSkip = () => {
    router.push('/buyer');
  };

  if (loading) {
    return <CompleteLoading />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-900 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg">Snang.my</span>
              <span className="text-teal-400 text-xs font-mono">LPPSA</span>
            </div>
            <span className="text-slate-300 text-sm">Langkah 3 / 4</span>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-1">
            <div className="h-1 flex-1 rounded-full bg-teal-500" />
            <div className="h-1 flex-1 rounded-full bg-teal-500" />
            <div className="h-1 flex-1 rounded-full bg-teal-500" />
            <div className="h-1 flex-1 rounded-full bg-slate-600" />
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Success Banner */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-teal-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Dokumen Sedia! ✓
            </h1>
            <p className="text-slate-500 text-sm">
              Semua dokumen wajib telah berjaya dimuat naik
            </p>
          </div>

          {/* Document Summary */}
          <div className="bg-slate-50 rounded-xl p-4 mb-5">
            <h2 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              Ringkasan Dokumen
            </h2>
            <div className="space-y-2">
              {uploadedDocs.map(([type, doc]) => {
                const docType = type as DocFirstDocumentType;
                const config = DOC_FIRST_DOCUMENTS[docType];
                const Icon = DOC_ICONS[docType];

                return (
                  <div
                    key={type}
                    className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200"
                  >
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {config.labelBm}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {doc?.fileName}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-teal-500" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4 mb-5">
            <h2 className="font-semibold text-amber-800 text-sm mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Langkah Seterusnya
            </h2>
            <p className="text-sm text-amber-700 mb-3">
              Tempah temujanji dengan perunding untuk memulakan proses permohonan LPPSA anda.
            </p>
            <div className="flex items-center gap-4 text-xs text-amber-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                ~15 minit
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                WhatsApp / Panggilan
              </span>
            </div>
          </div>

          {/* Project Info */}
          {projectName && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-5">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-teal-600" />
                <span className="text-sm text-teal-800">
                  Projek: <strong>{projectName}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-slate-100 rounded-xl p-3 mb-5">
            <div className="flex gap-2">
              <Shield className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500">
                Dokumen anda disimpan dengan selamat dan hanya akan digunakan untuk
                menyediakan permohonan LPPSA. Sistem ini tidak membuat sebarang
                keputusan kelulusan.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleBookTemujanji}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30 hover:shadow-xl transition-all mb-3"
          >
            <Calendar className="w-5 h-5" />
            Tempah Temujanji Perunding
          </button>

          <button
            onClick={handleSkip}
            className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm"
          >
            Tempah Kemudian
          </button>
        </div>

        {/* Footer */}
        <AuthorityDisclaimer variant="compact" />
      </div>
    </div>
  );
}

// =============================================================================
// EXPORT WITH SUSPENSE
// =============================================================================

export default function UploadCompletePage() {
  return (
    <Suspense fallback={<CompleteLoading />}>
      <UploadCompleteFlow />
    </Suspense>
  );
}
