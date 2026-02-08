'use client';

/**
 * QR Entry Page
 * SF.4: QR Entry Mode Wiring | PRD v3.6.3
 *
 * Landing page for QR code scans. Validates token and redirects to buyer flow.
 *
 * Flow: /q/[token] → validate → /buyer/start?project=...&dev=...
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, QrCode, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import {
  validateQRToken,
  buildRedirectUrl,
  logQRProofEvent,
  type QRLinkPayload,
  type QRLinkValidation,
} from '@/lib/services/qr-link-service';

// =============================================================================
// COMPONENT
// =============================================================================

export default function QREntryPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

  const [status, setStatus] = useState<'validating' | 'valid' | 'invalid' | 'redirecting'>('validating');
  const [validation, setValidation] = useState<QRLinkValidation | null>(null);
  const [countdown, setCountdown] = useState(3);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setValidation({
        isValid: false,
        payload: null,
        error: 'Tiada token QR.',
        errorCode: 'INVALID_TOKEN',
      });
      return;
    }

    // Log scan event
    logQRProofEvent('QR_LINK_SCANNED', {
      token: token.substring(0, 20) + '...',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
    });

    // Validate token
    const result = validateQRToken(token);
    setValidation(result);

    if (result.isValid && result.payload) {
      setStatus('valid');
      logQRProofEvent('QR_LINK_VALIDATED', {
        projectId: result.payload.projectId,
        developerId: result.payload.developerId,
        agentId: result.payload.agentId,
        source: result.payload.source,
      });
    } else {
      setStatus('invalid');
      logQRProofEvent(
        result.errorCode === 'EXPIRED' ? 'QR_LINK_EXPIRED' : 'QR_LINK_INVALID',
        {
          token: token.substring(0, 20) + '...',
          error: result.error,
        }
      );
    }
  }, [token]);

  // Countdown and redirect for valid tokens
  useEffect(() => {
    if (status !== 'valid' || !validation?.payload) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus('redirecting');

          // Build redirect URL and navigate
          const redirectUrl = buildRedirectUrl(validation.payload as QRLinkPayload, 'start');
          router.push(redirectUrl);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, validation, router]);

  // Handle manual continue
  const handleContinue = () => {
    if (validation?.payload) {
      setStatus('redirecting');
      const redirectUrl = buildRedirectUrl(validation.payload, 'start');
      router.push(redirectUrl);
    }
  };

  // Handle retry (go back to main page)
  const handleRetry = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Validating State */}
        {status === 'validating' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <QrCode className="w-10 h-10 text-teal-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">
              Mengesahkan Kod QR
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              Sila tunggu sebentar...
            </p>
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto" />
          </div>
        )}

        {/* Valid State */}
        {status === 'valid' && validation?.payload && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-white" />
                <span className="text-white font-semibold">Kod QR Sah</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-slate-800 mb-2">
                  Selamat Datang!
                </h1>
                <p className="text-slate-500 text-sm">
                  Anda akan dialihkan ke halaman pendaftaran pembeli.
                </p>
              </div>

              {/* Project Info */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Projek</p>
                    <p className="font-semibold text-slate-800">{validation.payload.projectName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Pemaju</p>
                    <p className="text-slate-700">{validation.payload.developerName}</p>
                  </div>
                  {validation.payload.agentId && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">ID Ejen</p>
                      <p className="text-slate-600 text-sm font-mono">{validation.payload.agentId}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Countdown */}
              <div className="text-center mb-6">
                <p className="text-sm text-slate-500">
                  Mengalih dalam <span className="font-bold text-teal-600">{countdown}</span> saat...
                </p>
              </div>

              {/* Continue Button */}
              <button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30 hover:shadow-xl transition-all"
              >
                Teruskan Sekarang <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Invalid State */}
        {status === 'invalid' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-white" />
                <span className="text-white font-semibold">Kod QR Tidak Sah</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-xl font-bold text-slate-800 mb-2">
                  {validation?.errorCode === 'EXPIRED'
                    ? 'Pautan Telah Tamat'
                    : 'Pautan Tidak Sah'}
                </h1>
                <p className="text-slate-500 text-sm">
                  {validation?.error || 'Kod QR ini tidak dapat disahkan.'}
                </p>
              </div>

              {/* Error Details */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-700">
                  {validation?.errorCode === 'EXPIRED' ? (
                    <>
                      Pautan QR ini telah tamat tempoh. Sila hubungi ejen anda untuk
                      mendapatkan pautan baharu.
                    </>
                  ) : validation?.errorCode === 'MALFORMED' ? (
                    <>
                      Kod QR tidak dapat dibaca dengan betul. Sila cuba imbas semula
                      atau dapatkan pautan baharu.
                    </>
                  ) : (
                    <>
                      Terdapat masalah dengan pautan ini. Sila hubungi ejen anda
                      untuk bantuan.
                    </>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="w-full bg-gradient-to-r from-slate-600 to-slate-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  Kembali ke Halaman Utama
                </button>
                <p className="text-xs text-center text-slate-400">
                  Hubungi ejen anda jika masalah berterusan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Redirecting State */}
        {status === 'redirecting' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">
              Mengalihkan...
            </h1>
            <p className="text-slate-500 text-sm">
              Sila tunggu sebentar.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Powered by <span className="font-semibold text-teal-600">snang.my</span>
          </p>
        </div>
      </div>
    </div>
  );
}
