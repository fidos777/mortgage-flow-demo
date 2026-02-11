'use client';

/**
 * PDPAConsentGate Component
 * Sprint 0, Session S0.2 | PRD v3.6.3 CR-010
 *
 * Full-screen PDPA consent gate that blocks data collection until consent is granted.
 * Replaces the deprecated single checkbox consent at /app/buyer/prescan/page.tsx Lines 379-395.
 *
 * Features:
 * - Bilingual support (BM + EN)
 * - Granular consent types (PDPA_BASIC required, others optional)
 * - View full PDPA notice modal
 * - Accept Required Only / Accept All buttons
 * - Integration with consent-service.ts
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ConsentType, CONSENT_TYPES, CONSENT_CONFIG } from '@/lib/types/consent';
import { Locale, getConsentStrings } from '@/lib/i18n/consent';
// S5: Removed direct ConsentService import — using API routes instead
import { isPdpaGateEnabled } from '@/lib/services/feature-flags';
import ConsentCheckbox from './ConsentCheckbox';

// =============================================================================
// TYPES
// =============================================================================

interface PDPAConsentGateProps {
  buyerHash: string;
  locale?: Locale;
  onLocaleChange?: (locale: Locale) => void;
  onConsentGranted: (consents: ConsentType[]) => void;
  onBack?: () => void;
  projectName?: string;
}

interface ConsentState {
  [key: string]: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PDPAConsentGate({
  buyerHash,
  locale: initialLocale = 'bm',
  onLocaleChange,
  onConsentGranted,
  onBack,
  projectName,
}: PDPAConsentGateProps) {
  // State
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [consents, setConsents] = useState<ConsentState>({
    PDPA_BASIC: false,
    PDPA_MARKETING: false,
    PDPA_ANALYTICS: false,
    PDPA_THIRD_PARTY: false,
  });
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeContent, setNoticeContent] = useState<string>('');
  const [noticeVersion, setNoticeVersion] = useState<string>('1.0');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strings = getConsentStrings(locale);

  // Check if gate is enabled
  const gateEnabled = isPdpaGateEnabled();

  // S5: Load current PDPA notice via API route
  useEffect(() => {
    async function loadNotice() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/consent/notice?locale=${locale}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setNoticeContent(json.data.content);
            setNoticeVersion(json.data.version);
          }
        } else {
          // Fallback notice
          setNoticeContent(locale === 'bm'
            ? 'NOTIS PERLINDUNGAN DATA PERIBADI — Sila berikan persetujuan anda untuk meneruskan.'
            : 'PERSONAL DATA PROTECTION NOTICE — Please provide your consent to proceed.');
          setNoticeVersion('1.0');
        }
      } catch (err) {
        console.error('Error loading PDPA notice:', err);
        setNoticeContent(locale === 'bm'
          ? 'NOTIS PERLINDUNGAN DATA PERIBADI — Sila berikan persetujuan anda untuk meneruskan.'
          : 'PERSONAL DATA PROTECTION NOTICE — Please provide your consent to proceed.');
        setNoticeVersion('1.0');
      } finally {
        setIsLoading(false);
      }
    }
    loadNotice();
  }, [locale]);

  // Handle locale change
  const handleLocaleChange = useCallback(
    (newLocale: Locale) => {
      setLocale(newLocale);
      onLocaleChange?.(newLocale);
    },
    [onLocaleChange]
  );

  // Handle consent change
  const handleConsentChange = useCallback(
    (type: ConsentType, checked: boolean) => {
      setConsents((prev) => ({
        ...prev,
        [type]: checked,
      }));
      setError(null);
    },
    []
  );

  // Accept required only
  const handleAcceptRequired = useCallback(() => {
    setConsents({
      PDPA_BASIC: true,
      PDPA_MARKETING: false,
      PDPA_ANALYTICS: false,
      PDPA_THIRD_PARTY: false,
    });
  }, []);

  // Accept all
  const handleAcceptAll = useCallback(() => {
    setConsents({
      PDPA_BASIC: true,
      PDPA_MARKETING: true,
      PDPA_ANALYTICS: true,
      PDPA_THIRD_PARTY: true,
    });
  }, []);

  // S5: Submit consents via API route
  const handleSubmit = useCallback(async () => {
    // Validate required consent
    if (!consents.PDPA_BASIC) {
      setError(strings.messages.requiredConsent);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Prepare consent batch
      const consentBatch = CONSENT_TYPES.map((type) => ({
        type,
        granted: consents[type] || false,
      }));

      // S5: Grant consents via API route
      const res = await fetch('/api/consent/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_hash: buyerHash,
          consents: consentBatch,
          consent_version: noticeVersion,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to save consents');
      }

      // Cache consent info in sessionStorage for offline fallback
      const grantedTypes = CONSENT_TYPES.filter((type) => consents[type]);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pdpa_consents', JSON.stringify(grantedTypes));
        sessionStorage.setItem('pdpa_consented_at', new Date().toISOString());
      }

      // Callback with granted consent types
      onConsentGranted(grantedTypes);
    } catch (err) {
      console.error('Error saving consents:', err);
      setError(strings.messages.errorSaving);
    } finally {
      setIsSaving(false);
    }
  }, [
    consents,
    buyerHash,
    noticeVersion,
    strings.messages,
    onConsentGranted,
  ]);

  // If gate is disabled, auto-proceed
  useEffect(() => {
    if (!gateEnabled) {
      console.warn('[PDPAConsentGate] Gate disabled - auto-proceeding');
      onConsentGranted(['PDPA_BASIC']);
    }
  }, [gateEnabled, onConsentGranted]);

  // Don't render if gate is disabled
  if (!gateEnabled) {
    return null;
  }

  const canSubmit = consents.PDPA_BASIC;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo / Back */}
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label={strings.buttons.back}
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            <div className="flex items-center">
              <span className="text-xl font-bold text-teal-600">Snang</span>
              <span className="text-xl font-bold text-amber-500">.</span>
              <span className="text-xl font-bold text-teal-600">my</span>
            </div>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleLocaleChange('bm')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                locale === 'bm'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              BM
            </button>
            <button
              onClick={() => handleLocaleChange('en')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                locale === 'en'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 mb-4">
            <svg
              className="w-8 h-8 text-teal-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {strings.pageTitle}
          </h1>
          <p className="text-gray-600">{strings.pageSubtitle}</p>
          {projectName && (
            <p className="text-sm text-teal-600 mt-2 font-medium">
              {projectName}
            </p>
          )}
        </div>

        {/* Intro Text */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <p className="text-sm text-gray-700 leading-relaxed">
            {strings.introText}
          </p>
          <button
            onClick={() => setShowNoticeModal(true)}
            className="mt-3 text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {strings.buttons.viewFullNotice}
          </button>
        </div>

        {/* Consent Checkboxes */}
        <div className="space-y-3 mb-6">
          {CONSENT_TYPES.map((type) => (
            <ConsentCheckbox
              key={type}
              consentType={type}
              checked={consents[type] || false}
              onChange={(checked) => handleConsentChange(type, checked)}
              locale={locale}
              disabled={isSaving}
            />
          ))}
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleAcceptRequired}
            disabled={isSaving}
            className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {strings.buttons.acceptRequired}
          </button>
          <button
            onClick={handleAcceptAll}
            disabled={isSaving}
            className="flex-1 py-2.5 px-4 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {strings.buttons.acceptAll}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSaving}
          className={`
            w-full py-4 px-6 text-base font-semibold rounded-xl transition-all duration-200
            ${
              canSubmit && !isSaving
                ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {strings.messages.loadingNotice}
            </span>
          ) : (
            strings.buttons.continue
          )}
        </button>

        {/* Footer Disclaimer */}
        <p className="mt-6 text-xs text-center text-gray-500 leading-relaxed">
          {strings.footer.disclaimer}
        </p>
      </main>

      {/* Notice Modal */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setShowNoticeModal(false)}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {strings.noticeModal.title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {strings.noticeModal.version}: {noticeVersion}
                  </p>
                </div>
                <button
                  onClick={() => setShowNoticeModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <svg
                      className="animate-spin w-8 h-8 text-teal-600"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                      {noticeContent}
                    </pre>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => setShowNoticeModal(false)}
                  className="w-full py-3 px-4 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  {strings.noticeModal.closeButton}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default PDPAConsentGate;
