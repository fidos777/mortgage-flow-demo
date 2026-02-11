'use client';

/**
 * Buyer Document Upload Page - CR-008 Doc-First Flow
 * PRD v3.6.3 CR-008 | Step 2 of 4
 * S5 B04: Wired to POST /api/documents/upload (Supabase Storage)
 *
 * Simplified 4-document upload flow:
 * 1. MyKad (IC) - Required
 * 2. Slip Gaji - Required
 * 3. Penyata Bank - Required
 * 4. Penyata KWSP - Optional
 *
 * Flow: /buyer/start (PDPA) → /buyer/upload → /buyer/upload-complete
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  CreditCard,
  Building,
  Loader2,
  RefreshCw,
  ArrowRight,
  Info,
  X,
  Camera,
} from 'lucide-react';
import { AuthorityDisclaimer } from '@/components/permission-gate';
import {
  DocFirstDocumentType,
  DOC_FIRST_DOCUMENTS,
  UploadedDocument,
  UploadStatus,
  getRequiredDocuments,
  hasAllRequiredDocuments,
  calculateUploadProgress,
  DOC_FIRST_DISCLAIMER,
} from '@/lib/types/buyer-flow';

// =============================================================================
// LOADING COMPONENT
// =============================================================================

function UploadLoading() {
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

function BuyerUploadFlow() {
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
  const [uploading, setUploading] = useState<DocFirstDocumentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load existing uploads from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('doc_first_uploads');
    if (stored) {
      try {
        setDocuments(JSON.parse(stored));
      } catch {
        console.error('[BuyerUpload] Failed to parse stored uploads');
      }
    }

    // Log flow start event
    const buyerHash = sessionStorage.getItem('buyer_hash');
    console.log('[BuyerUpload] Doc-First flow started:', {
      buyerHash,
      projectId,
      developerId,
      entrySource,
    });
  }, [projectId, developerId, entrySource]);

  // Save uploads to sessionStorage whenever they change
  useEffect(() => {
    if (Object.keys(documents).length > 0) {
      sessionStorage.setItem('doc_first_uploads', JSON.stringify(documents));
    }
  }, [documents]);

  // Calculate progress
  const progress = calculateUploadProgress(documents);
  const allRequiredUploaded = hasAllRequiredDocuments(documents);
  const requiredDocs = getRequiredDocuments();

  // S5 B04: Track whether we have a real API or are in fallback
  const [apiMode, setApiMode] = useState<'real' | 'fallback'>('real');

  // Handle file upload — real API with graceful fallback
  const handleUpload = useCallback(
    async (docType: DocFirstDocumentType, file?: File) => {
      setError(null);
      setUploading(docType);

      const config = DOC_FIRST_DOCUMENTS[docType];
      const buyerHash = sessionStorage.getItem('buyer_hash');

      // If no file provided, create a demo file for testing
      const uploadFile = file || new File(
        [new ArrayBuffer(1024 * Math.floor(Math.random() * 500 + 100))],
        `${docType.toLowerCase()}_document.pdf`,
        { type: 'application/pdf' }
      );

      // Client-side validation
      if (uploadFile.size > config.maxSizeMb * 1024 * 1024) {
        setError(`Fail terlalu besar. Maksimum ${config.maxSizeMb}MB.`);
        setUploading(null);
        return;
      }

      if (!config.acceptedFormats.includes(uploadFile.type)) {
        setError('Format fail tidak diterima. Sila gunakan PDF atau imej.');
        setUploading(null);
        return;
      }

      // Try real API upload
      try {
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('buyer_hash', buyerHash || 'anonymous');
        formData.append('document_type', docType);

        // Include case_id if available
        const storedCaseId = sessionStorage.getItem('case_id');
        if (storedCaseId) {
          formData.append('case_id', storedCaseId);
        }

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();

          const uploaded: UploadedDocument = {
            type: docType,
            fileName: uploadFile.name,
            fileSize: uploadFile.size,
            mimeType: uploadFile.type,
            uploadedAt: result.data.uploaded_at || new Date().toISOString(),
            status: 'UPLOADED',
          };

          setDocuments(prev => ({
            ...prev,
            [docType]: uploaded,
          }));
          setUploading(null);
          setApiMode('real');
          return;
        }

        // API returned error — fall through to fallback
        console.warn('[BuyerUpload] API error:', response.status);
      } catch (apiErr) {
        console.warn('[BuyerUpload] API unreachable, using local fallback:', apiErr);
      }

      // === FALLBACK: Local-only mode (no DB persistence) ===
      setApiMode('fallback');
      await new Promise(resolve => setTimeout(resolve, 600));

      const uploaded: UploadedDocument = {
        type: docType,
        fileName: uploadFile.name,
        fileSize: uploadFile.size,
        mimeType: uploadFile.type,
        uploadedAt: new Date().toISOString(),
        status: 'UPLOADED',
      };

      setDocuments(prev => ({
        ...prev,
        [docType]: uploaded,
      }));

      setUploading(null);

      // Log locally (proof event not persisted — governance gap per Day 1 analysis)
      console.log('[BuyerUpload] DOC_UPLOADED (fallback):', {
        docType,
        fileName: uploadFile.name,
        size: uploadFile.size,
      });
    },
    []
  );

  // Handle re-upload
  const handleReupload = (docType: DocFirstDocumentType) => {
    setDocuments(prev => {
      const next = { ...prev };
      delete next[docType];
      return next;
    });
  };

  // Handle continue to next step
  const handleContinue = async () => {
    // Store completion timestamp
    sessionStorage.setItem('doc_first_completed_at', new Date().toISOString());

    // S5 B06: Log ALL_REQUIRED_DOCS_UPLOADED proof event
    const buyerHash = sessionStorage.getItem('buyer_hash');
    if (buyerHash) {
      try {
        await fetch('/api/proof-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'ALL_REQUIRED_DOCS_UPLOADED',
            buyer_hash: buyerHash,
            case_id: sessionStorage.getItem('case_id') || undefined,
            metadata: {
              document_count: Object.keys(documents).length,
              api_mode: apiMode,
            },
          }),
        });
      } catch {
        // Non-fatal: proof event failure doesn't block navigation
        console.warn('[BuyerUpload] Failed to log proof event');
      }
    }

    // Build query params for next page
    const params = new URLSearchParams();
    if (projectId) params.set('pid', projectId);
    if (developerId) params.set('did', developerId);
    if (agentId) params.set('aid', agentId);
    if (entrySource) params.set('entry', entrySource);
    if (projectName) params.set('project', projectName);

    const queryString = params.toString();
    router.push(`/buyer/upload-complete${queryString ? `?${queryString}` : ''}`);
  };

  // Render document card
  const renderDocCard = (docType: DocFirstDocumentType) => {
    const config = DOC_FIRST_DOCUMENTS[docType];
    const doc = documents[docType];
    const Icon = DOC_ICONS[docType];
    const isUploading = uploading === docType;
    const isUploaded = doc?.status === 'UPLOADED';

    return (
      <div
        key={docType}
        className={`border-2 rounded-xl p-4 transition-all ${
          isUploaded
            ? 'border-teal-200 bg-teal-50'
            : isUploading
            ? 'border-amber-200 bg-amber-50'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isUploaded
                ? 'bg-teal-600'
                : isUploading
                ? 'bg-amber-500'
                : 'bg-slate-100'
            }`}
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : isUploaded ? (
              <CheckCircle className="w-6 h-6 text-white" />
            ) : (
              <Icon className="w-6 h-6 text-slate-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-800 text-sm truncate">
                {config.labelBm}
              </p>
              {config.required && (
                <span className="text-red-500 text-xs">*</span>
              )}
              {!config.required && (
                <span className="text-slate-400 text-xs">(Pilihan)</span>
              )}
            </div>
            {isUploaded ? (
              <p className="text-xs text-slate-500 truncate">{doc.fileName}</p>
            ) : (
              <p className="text-xs text-slate-400">{config.descriptionBm}</p>
            )}
          </div>

          {/* Action */}
          {isUploaded ? (
            <button
              onClick={() => handleReupload(docType)}
              className="p-2 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors"
              title="Muat naik semula"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          ) : isUploading ? (
            <span className="text-xs text-amber-600 font-medium">
              Memuat naik...
            </span>
          ) : (
            <button
              onClick={() => handleUpload(docType)}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-1"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Muat Naik</span>
            </button>
          )}
        </div>
      </div>
    );
  };

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
            <span className="text-slate-300 text-sm">Langkah 2 / 4</span>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-1">
            <div className="h-1 flex-1 rounded-full bg-teal-500" />
            <div
              className={`h-1 flex-1 rounded-full transition-all ${
                progress > 0 ? 'bg-teal-500' : 'bg-slate-600'
              }`}
            />
            <div className="h-1 flex-1 rounded-full bg-slate-600" />
            <div className="h-1 flex-1 rounded-full bg-slate-600" />
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Title */}
          <h1 className="text-xl font-bold text-slate-800 mb-1">
            Muat Naik Dokumen
          </h1>
          <p className="text-slate-500 text-sm mb-4">
            Sila muat naik dokumen berikut untuk permohonan LPPSA anda
          </p>

          {/* Project Context */}
          {projectName && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-teal-600" />
                <span className="text-sm text-teal-800">
                  Projek: <strong>{projectName}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Progress Summary */}
          <div className="bg-slate-800 rounded-xl p-4 mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-300">
                Kesediaan Dokumen
              </span>
              <span className="text-lg font-bold text-teal-400">{progress}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            {!allRequiredUploaded && (
              <p className="text-xs text-slate-400 mt-2">
                {requiredDocs.length -
                  requiredDocs.filter(d => documents[d]?.status === 'UPLOADED')
                    .length}{' '}
                dokumen wajib lagi
              </p>
            )}
          </div>

          {/* S5: Fallback warning */}
          {apiMode === 'fallback' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                Mod luar talian — dokumen disimpan secara tempatan sahaja.
                Sila muat naik semula apabila sambungan pulih.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Document Cards */}
          <div className="space-y-3 mb-5">
            {(Object.keys(DOC_FIRST_DOCUMENTS) as DocFirstDocumentType[]).map(
              renderDocCard
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                {DOC_FIRST_DISCLAIMER.bm}
              </p>
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!allRequiredUploaded}
            className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              allRequiredUploaded
                ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-500/30 hover:shadow-xl'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            Teruskan <ArrowRight className="w-5 h-5" />
          </button>

          {/* Optional: PreScan Link */}
          <p className="text-center text-xs text-slate-400 mt-4">
            Ingin semak kelayakan dahulu?{' '}
            <a href="/buyer/prescan" className="text-teal-600 hover:underline">
              Imbasan Kesediaan
            </a>
          </p>
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

export default function BuyerUploadPage() {
  return (
    <Suspense fallback={<UploadLoading />}>
      <BuyerUploadFlow />
    </Suspense>
  );
}
