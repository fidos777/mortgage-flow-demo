'use client';

/**
 * CR-009C: Spillover Consent Modal
 *
 * Shown to buyer when their case is deemed ineligible for the original property.
 * Asks buyer for consent to be matched with alternative properties (Category B).
 *
 * Proof events:
 *   - SPILLOVER_CONSENT_REQUESTED (system → buyer)
 *   - SPILLOVER_CONSENT_GIVEN (buyer declares yes)
 *   - SPILLOVER_CONSENT_DECLINED (buyer declares no)
 *
 * All events logged with authorityClaimed: false.
 * Communication chain: Developer → Agent → Buyer (PRD Section 002-F)
 */

import { useState, useCallback } from 'react';
import {
  X,
  Shield,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Home,
} from 'lucide-react';

export interface SpilloverConsentModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Case reference for display */
  caseRef: string;
  /** Buyer name */
  buyerName: string;
  /** Original property name */
  propertyName: string;
  /** Reason buyer is ineligible */
  rejectionReason: string;
  /** Case ID for API call */
  caseId: string;
  /** Developer ID for API call */
  developerId: string;
  /** Callback after consent decision */
  onDecision?: (consented: boolean) => void;
  /** Locale */
  locale?: 'bm' | 'en';
}

export function SpilloverConsentModal({
  isOpen,
  onClose,
  caseRef,
  buyerName,
  propertyName,
  rejectionReason,
  caseId,
  developerId,
  onDecision,
  locale = 'bm',
}: SpilloverConsentModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [decided, setDecided] = useState<'consented' | 'declined' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConsent = useCallback(async (consent: boolean) => {
    setSubmitting(true);
    setError(null);

    try {
      // Log proof event
      console.log(`[SpilloverConsent] ${consent ? 'SPILLOVER_CONSENT_GIVEN' : 'SPILLOVER_CONSENT_DECLINED'}`, {
        caseId,
        buyerName,
        authorityClaimed: false,
        timestamp: new Date().toISOString(),
      });

      // Call spillover consent API
      const res = await fetch('/api/spillover/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          buyer_name: buyerName,
          original_developer_id: developerId,
          rejection_reason: rejectionReason,
          matching_criteria: {
            // Basic criteria — will be enriched by matching engine
            price_max: 500000,
            preferred_states: ['Selangor', 'Kuala Lumpur', 'Johor'],
          },
          expires_in_days: 30,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal menyimpan keputusan');
      }

      setDecided(consent ? 'consented' : 'declined');
      onDecision?.(consent);
    } catch (err) {
      setError(locale === 'bm'
        ? 'Ralat semasa menyimpan. Sila cuba lagi.'
        : 'Error saving decision. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [caseId, buyerName, developerId, rejectionReason, onDecision, locale]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <ArrowRightLeft className="w-5 h-5" />
            <h2 className="font-semibold text-lg">
              {locale === 'bm' ? 'Pilihan Hartanah Alternatif' : 'Alternative Property Options'}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Success / Declined state */}
          {decided && (
            <div className={`text-center py-6 ${decided === 'consented' ? 'text-emerald-700' : 'text-slate-600'}`}>
              {decided === 'consented' ? (
                <>
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                  <p className="font-semibold text-lg">
                    {locale === 'bm' ? 'Terima kasih!' : 'Thank you!'}
                  </p>
                  <p className="text-sm mt-2">
                    {locale === 'bm'
                      ? 'Kami akan mencarikan hartanah yang sesuai untuk anda. Ejen akan menghubungi anda.'
                      : 'We will find suitable properties for you. An agent will contact you.'}
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p className="font-semibold text-lg">
                    {locale === 'bm' ? 'Pilihan anda direkodkan' : 'Your choice is recorded'}
                  </p>
                  <p className="text-sm mt-2 text-slate-500">
                    {locale === 'bm'
                      ? 'Anda boleh memilih semula pada bila-bila masa.'
                      : 'You can change your mind at any time.'}
                  </p>
                </>
              )}
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"
              >
                {locale === 'bm' ? 'Tutup' : 'Close'}
              </button>
            </div>
          )}

          {/* Decision state */}
          {!decided && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      {locale === 'bm'
                        ? `Permohonan anda untuk ${propertyName} tidak dapat diteruskan.`
                        : `Your application for ${propertyName} cannot proceed.`}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      {locale === 'bm' ? 'Sebab: ' : 'Reason: '}
                      {rejectionReason === 'dsr_exceeded' ? (locale === 'bm' ? 'DSR melebihi had' : 'DSR exceeded threshold') :
                       rejectionReason === 'income_insufficient' ? (locale === 'bm' ? 'Pendapatan tidak mencukupi' : 'Insufficient income') :
                       rejectionReason}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-700 mb-4">
                {locale === 'bm'
                  ? 'Adakah anda bersetuju untuk dipadankan dengan hartanah alternatif yang sesuai dengan profil kewangan anda?'
                  : 'Would you like to be matched with alternative properties that suit your financial profile?'}
              </p>

              {/* What we share / what we don't */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mb-2">
                    <Eye className="w-3 h-3" />
                    {locale === 'bm' ? 'Yang dikongsi' : 'Shared'}
                  </p>
                  <ul className="text-[11px] text-emerald-600 space-y-1">
                    <li>• {locale === 'bm' ? 'Julat pendapatan' : 'Income range'}</li>
                    <li>• {locale === 'bm' ? 'Lokasi pilihan' : 'Preferred location'}</li>
                    <li>• {locale === 'bm' ? 'Bajet hartanah' : 'Property budget'}</li>
                  </ul>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-2">
                    <EyeOff className="w-3 h-3" />
                    {locale === 'bm' ? 'TIDAK dikongsi' : 'NOT shared'}
                  </p>
                  <ul className="text-[11px] text-slate-500 space-y-1">
                    <li>• {locale === 'bm' ? 'No. IC' : 'IC Number'}</li>
                    <li>• {locale === 'bm' ? 'Gaji tepat' : 'Exact salary'}</li>
                    <li>• {locale === 'bm' ? 'Skor kredit' : 'Credit score'}</li>
                  </ul>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 mb-3">{error}</p>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleConsent(true)}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl font-medium text-sm hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  {submitting
                    ? (locale === 'bm' ? 'Memproses...' : 'Processing...')
                    : (locale === 'bm' ? 'Ya, Carikan Saya' : 'Yes, Find Me Options')}
                </button>
                <button
                  onClick={() => handleConsent(false)}
                  disabled={submitting}
                  className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 disabled:opacity-50"
                >
                  {locale === 'bm' ? 'Tidak' : 'No'}
                </button>
              </div>

              {/* PDPA notice */}
              <p className="text-[10px] text-slate-400 mt-3 text-center">
                <Shield className="w-3 h-3 inline mr-1" />
                {locale === 'bm'
                  ? 'Data anda dilindungi di bawah PDPA 2010. Persetujuan boleh ditarik balik pada bila-bila masa.'
                  : 'Your data is protected under PDPA 2010. Consent can be withdrawn at any time.'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SpilloverConsentModal;
