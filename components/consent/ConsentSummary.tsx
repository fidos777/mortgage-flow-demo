'use client';

/**
 * ConsentSummary Component
 * Sprint 0, Session S0.2 | PRD v3.6.3 CR-010
 *
 * Displays a summary of granted consents with timestamps.
 * Used after consent gate submission and in buyer profile.
 */

import React from 'react';
import { ConsentType, CONSENT_TYPES } from '@/lib/types/consent';
import { Locale, getConsentStrings } from '@/lib/i18n/consent';

// =============================================================================
// TYPES
// =============================================================================

interface ConsentStatus {
  type: ConsentType;
  granted: boolean;
  grantedAt?: string;
}

interface ConsentSummaryProps {
  consents: ConsentStatus[];
  locale?: Locale;
  showTimestamps?: boolean;
  compact?: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatTimestamp(isoString: string, locale: Locale): string {
  const date = new Date(isoString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleDateString(locale === 'bm' ? 'ms-MY' : 'en-US', options);
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ConsentSummary({
  consents,
  locale = 'bm',
  showTimestamps = true,
  compact = false,
}: ConsentSummaryProps) {
  const strings = getConsentStrings(locale);

  // Ensure all consent types are represented
  const allConsents: ConsentStatus[] = CONSENT_TYPES.map((type) => {
    const existing = consents.find((c) => c.type === type);
    return existing || { type, granted: false };
  });

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {allConsents.map((consent) => (
          <span
            key={consent.type}
            className={`
              inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
              ${
                consent.granted
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-gray-100 text-gray-500'
              }
            `}
          >
            {consent.granted ? (
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {strings.consentTypes[consent.type].label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">
          {strings.summary.title}
        </h3>
      </div>

      {/* Consent List */}
      <div className="divide-y divide-gray-100">
        {allConsents.map((consent) => {
          const typeStrings = strings.consentTypes[consent.type];

          return (
            <div
              key={consent.type}
              className="px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {/* Status Icon */}
                <div
                  className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                    ${consent.granted ? 'bg-teal-100' : 'bg-gray-100'}
                  `}
                >
                  {consent.granted ? (
                    <svg
                      className="w-5 h-5 text-teal-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>

                {/* Label */}
                <div>
                  <p
                    className={`text-sm font-medium ${
                      consent.granted ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {typeStrings.label}
                  </p>
                  {showTimestamps && consent.granted && consent.grantedAt && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {strings.summary.timestamp}:{' '}
                      {formatTimestamp(consent.grantedAt, locale)}
                    </p>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`
                  text-xs font-medium px-2 py-1 rounded
                  ${
                    consent.granted
                      ? 'bg-teal-50 text-teal-700'
                      : 'bg-gray-50 text-gray-500'
                  }
                `}
              >
                {consent.granted
                  ? strings.summary.granted
                  : strings.summary.notGranted}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ConsentSummary;
