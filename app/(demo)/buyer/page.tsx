/**
 * Buyer Portal Dashboard — S6.4 Wired to Live APIs
 *
 * Data sources:
 *   - GET /api/cases?buyer_hash=...&limit=1  → property + case info
 *   - GET /api/consent/status?buyer_hash=... → PDPA consent status
 *
 * Fallback: hardcoded demo data when no buyer_hash in sessionStorage
 * (i.e. buyer hasn't gone through /buyer/start yet)
 *
 * S6.3 contract compliance:
 *   - Cases: reads { success, data: Case[], page, limit, total }
 *   - Consent: reads { success, data: BuyerConsentStatus }
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Upload,
  Search,
  FileText,
  CheckCircle2,
  Home,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

// ---------- Types (matching API response shapes) ----------

interface ApiCase {
  id: string;
  case_ref: string;
  property_price: number | null;
  status: string;
  created_at: string;
  developer?: { id: string; company_name: string } | null;
  property?: { id: string; name: string; slug: string } | null;
  unit?: { id: string; unit_no: string; price?: number } | null;
}

interface BuyerConsentStatus {
  buyerHash: string;
  hasBasic: boolean;
  hasMarketing: boolean;
  hasAnalytics: boolean;
  hasThirdParty: boolean;
  hasLppsaSubmission: boolean;
  activeConsentCount: number;
  firstConsentAt: string | null;
  latestConsentAt: string | null;
  canProceed: boolean;
}

// ---------- Fallback demo data (shown when no buyer_hash in session) ----------

const FALLBACK_PROPERTY = {
  name: 'Residensi Harmoni',
  developer: 'Global Fiz Resources Sdn Bhd',
  location: 'Seksyen 15, Shah Alam',
  unitType: 'Unit A-12-03',
  price: 'RM 385,000',
};

const FALLBACK_CONSENT_TYPES = [
  'Pengumpulan data peribadi',
  'Pemprosesan untuk tujuan pinjaman',
  'Perkongsian dengan pihak berkaitan',
  'Penyimpanan rekod',
];

// ---------- Helpers ----------

function formatPrice(price: number | null): string {
  if (!price) return '—';
  return `RM ${price.toLocaleString('en-MY')}`;
}

function formatDateBM(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Derive BM consent type labels from boolean flags */
function deriveConsentTypes(status: BuyerConsentStatus): string[] {
  const types: string[] = [];
  if (status.hasBasic) {
    types.push(
      'Pengumpulan data peribadi',
      'Pemprosesan untuk tujuan pinjaman',
      'Penyimpanan rekod'
    );
  }
  if (status.hasThirdParty) {
    types.push('Perkongsian dengan pihak berkaitan');
  }
  if (status.hasLppsaSubmission) {
    types.push('Penghantaran permohonan LPPSA');
  }
  if (status.hasMarketing) {
    types.push('Komunikasi pemasaran');
  }
  return types;
}

// ---------- Main Component ----------

export default function BuyerPortalPage() {
  const [caseData, setCaseData] = useState<ApiCase | null>(null);
  const [consentStatus, setConsentStatus] = useState<BuyerConsentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveData, setIsLiveData] = useState(false);

  useEffect(() => {
    const buyerHash = sessionStorage.getItem('buyer_hash');

    if (!buyerHash) {
      // No session = show fallback demo data
      setLoading(false);
      return;
    }

    // Fetch case + consent status in parallel
    const encodedHash = encodeURIComponent(buyerHash);

    Promise.all([
      fetch(`/api/cases?buyer_hash=${encodedHash}&limit=1`).then((r) => r.json()),
      fetch(`/api/consent/status?buyer_hash=${encodedHash}`).then((r) => r.json()),
    ])
      .then(([casesRes, consentRes]) => {
        // S6.3 contract: casesRes = { success, data: Case[], page, limit, total }
        if (casesRes.success && Array.isArray(casesRes.data) && casesRes.data.length > 0) {
          setCaseData(casesRes.data[0]);
          setIsLiveData(true);
        }
        // Consent: { success, data: BuyerConsentStatus }
        if (consentRes.success && consentRes.data) {
          setConsentStatus(consentRes.data);
          setIsLiveData(true);
        }
      })
      .catch((err) => {
        console.error('[buyer-portal] Fetch error:', err);
        setError('Gagal memuat data. Data contoh ditunjukkan.');
      })
      .finally(() => setLoading(false));
  }, []);

  // ---------- Derive display values ----------

  const propertyDisplay = caseData
    ? {
        name: caseData.property?.name || '—',
        developer: caseData.developer?.company_name || '—',
        unitType: caseData.unit?.unit_no ? `Unit ${caseData.unit.unit_no}` : '—',
        price: formatPrice(caseData.property_price),
      }
    : FALLBACK_PROPERTY;

  const hasConsent = consentStatus ? consentStatus.canProceed : true; // fallback assumes consented
  const consentDate = consentStatus
    ? formatDateBM(consentStatus.firstConsentAt)
    : '1 Februari 2026';
  const consentTypes = consentStatus
    ? deriveConsentTypes(consentStatus)
    : FALLBACK_CONSENT_TYPES;

  // ---------- Render ----------

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-primary">
              Snang.my
            </Link>
            <span className="text-sm text-neutral-500">Portal Pembeli</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 mb-6">
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">
            Selamat datang ke Portal Pembeli
          </h1>
          <p className="text-neutral-600">
            Semak kelayakan dan status permohonan pinjaman LPPSA anda.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neutral-100 mb-6 text-center">
            <RefreshCw className="w-8 h-8 text-neutral-400 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-neutral-500">Memuat data anda...</p>
          </div>
        ) : (
          <>
            {/* Property Info Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Home className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-neutral-800">{propertyDisplay.name}</h2>
                  <p className="text-sm text-neutral-500">{propertyDisplay.developer}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {'location' in propertyDisplay && propertyDisplay.location && (
                      <span className="text-xs bg-neutral-100 px-2 py-1 rounded-full">
                        {propertyDisplay.location}
                      </span>
                    )}
                    <span className="text-xs bg-neutral-100 px-2 py-1 rounded-full">
                      {propertyDisplay.unitType}
                    </span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                      {propertyDisplay.price}
                    </span>
                  </div>
                  {caseData?.case_ref && (
                    <p className="text-xs text-neutral-400 mt-2">
                      Ref: {caseData.case_ref}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* PDPA Consent Status */}
            <div
              className={`rounded-2xl p-6 border mb-6 ${
                hasConsent
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    hasConsent ? 'bg-emerald-100' : 'bg-amber-100'
                  }`}
                >
                  <Shield
                    className={`w-6 h-6 ${
                      hasConsent ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className={`font-semibold ${
                        hasConsent ? 'text-emerald-800' : 'text-amber-800'
                      }`}
                    >
                      Persetujuan PDPA
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        hasConsent
                          ? 'bg-emerald-200 text-emerald-700'
                          : 'bg-amber-200 text-amber-700'
                      }`}
                    >
                      {hasConsent ? 'Diberikan' : 'Belum Diberikan'}
                    </span>
                  </div>
                  {hasConsent && (
                    <p
                      className={`text-sm ${
                        hasConsent ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      Diberikan pada: <strong>{consentDate}</strong>
                    </p>
                  )}
                  {!hasConsent && (
                    <p className="text-sm text-amber-700">
                      Sila berikan persetujuan PDPA di{' '}
                      <Link href="/buyer/start" className="underline font-medium">
                        halaman mula
                      </Link>{' '}
                      sebelum meneruskan.
                    </p>
                  )}
                  {consentTypes.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {consentTypes.map((type, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-1.5 text-xs ${
                            hasConsent ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {type}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Journey Options */}
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Pilihan Perjalanan</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Upload Documents */}
          <Link
            href="/buyer/upload"
            className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-md hover:border-primary/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold text-neutral-800 mb-1">Upload Dokumen</h4>
            <p className="text-sm text-neutral-500 mb-3">Mula hantar dokumen untuk permohonan</p>
            <span className="text-sm text-primary font-medium flex items-center gap-1">
              Mula Sini <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          {/* Readiness Scan */}
          <Link
            href="/buyer/prescan"
            className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-md hover:border-primary/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4 group-hover:bg-amber-100 transition-colors">
              <Search className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="font-semibold text-neutral-800 mb-1">Imbasan Kesediaan</h4>
            <p className="text-sm text-neutral-500 mb-3">Pre-check kelayakan (optional)</p>
            <span className="text-sm text-amber-600 font-medium flex items-center gap-1">
              Cuba Sekarang <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          {/* Full Application */}
          <Link
            href="/buyer/journey"
            className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-md hover:border-primary/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-neutral-800 mb-1">Permohonan Penuh</h4>
            <p className="text-sm text-neutral-500 mb-3">Document upload & TAC scheduling</p>
            <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
              Teruskan <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          {/* KJ Confirmation */}
          <Link
            href="/buyer/kj-confirm"
            className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-md hover:border-primary/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center mb-4 group-hover:bg-violet-100 transition-colors">
              <CheckCircle2 className="w-6 h-6 text-violet-600" />
            </div>
            <h4 className="font-semibold text-neutral-800 mb-1">Pengesahan KJ</h4>
            <p className="text-sm text-neutral-500 mb-3">Kelulusan Jenis verification</p>
            <span className="text-sm text-violet-600 font-medium flex items-center gap-1">
              Sahkan <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* Privacy Disclosure */}
        <div className="bg-neutral-100 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Apa yang anda boleh lihat
          </h3>
          <ul className="space-y-2 mb-6">
            {[
              'Status permohonan semasa',
              'Dokumen yang telah diupload',
              'Timeline progress',
              'Langkah seterusnya',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-neutral-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>

          <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <EyeOff className="w-5 h-5" />
            Apa yang tidak ditunjukkan
          </h3>
          <ul className="space-y-2">
            {[
              'Skor kredit penuh / breakdown',
              'Risk flag dalaman',
              'Keputusan bank sebelum rasmi',
              'Data pembeli lain',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-neutral-500">
                <span className="w-4 h-4 rounded-full bg-neutral-300 flex items-center justify-center text-xs text-white">
                  ✕
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Demo Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-sm text-amber-700">
            <strong>{isLiveData ? 'Live Data:' : 'Demo Mode:'}</strong>{' '}
            {isLiveData
              ? 'Data ditunjukkan dari pangkalan data. Tiada penghantaran sebenar dilakukan.'
              : 'Data contoh sahaja. Tiada penghantaran sebenar dilakukan.'}
          </p>
        </div>
      </main>
    </div>
  );
}
