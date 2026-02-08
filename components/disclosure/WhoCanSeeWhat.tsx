'use client';

/**
 * WhoCanSeeWhat Component
 * SF.3: Data Visibility Disclosure Panel | PRD v3.6.3 CR-010B
 *
 * Transparently shows buyers what data each role can access.
 * Links to consent purposes (C1-C6) for PDPA compliance.
 */

import React, { useState } from 'react';
import type { Role } from '@/types/stakeholder';
import { ROLE_CONFIG } from '@/types/stakeholder';
import {
  ROLE_DATA_ACCESS,
  DATA_CATEGORY_CONFIG,
  type AccessLevel,
  type DataAccessEntry,
} from '@/lib/types/data-visibility';
import { PURPOSE_CONFIG, type ConsentPurpose } from '@/lib/types/consent';

// =============================================================================
// TYPES
// =============================================================================

type Locale = 'bm' | 'en';

interface WhoCanSeeWhatProps {
  locale?: Locale;
  /** Show only specific roles */
  roles?: Role[];
  /** Compact mode for embedding */
  compact?: boolean;
  /** Show as expandable accordion */
  expandable?: boolean;
  /** Initial expanded state */
  defaultExpanded?: boolean;
  /** Callback when user clicks "Learn More" */
  onLearnMore?: () => void;
}

// =============================================================================
// I18N STRINGS
// =============================================================================

const strings = {
  bm: {
    title: 'Siapa Boleh Lihat Apa',
    subtitle: 'Ketahui bagaimana data anda dilindungi',
    description: 'Kami komited terhadap ketelusan. Lihat dengan tepat siapa yang mempunyai akses kepada maklumat anda.',
    learnMore: 'Ketahui Lebih Lanjut',
    expand: 'Kembangkan',
    collapse: 'Kecilkan',
    accessLevels: {
      full: 'Akses penuh',
      ranged: 'Julat sahaja',
      status_only: 'Status sahaja',
      aggregate: 'Agregat sahaja',
      none: 'Tiada akses',
    },
    dataProtected: 'Data anda dilindungi',
    noAccess: 'tidak dapat melihat data peribadi anda',
    limitedAccess: 'mempunyai akses terhad',
    processingOnly: 'pemprosesan automatik sahaja',
    consentRequired: 'Memerlukan persetujuan:',
    piiWarning: 'Maklumat Peribadi Sensitif',
  },
  en: {
    title: 'Who Can See What',
    subtitle: 'Learn how your data is protected',
    description: 'We are committed to transparency. See exactly who has access to your information.',
    learnMore: 'Learn More',
    expand: 'Expand',
    collapse: 'Collapse',
    accessLevels: {
      full: 'Full access',
      ranged: 'Range only',
      status_only: 'Status only',
      aggregate: 'Aggregate only',
      none: 'No access',
    },
    dataProtected: 'Your data is protected',
    noAccess: 'cannot see your personal data',
    limitedAccess: 'has limited access',
    processingOnly: 'automated processing only',
    consentRequired: 'Requires consent:',
    piiWarning: 'Sensitive Personal Information',
  },
};

// =============================================================================
// ACCESS LEVEL BADGE COMPONENT
// =============================================================================

function AccessBadge({ level, locale }: { level: AccessLevel; locale: Locale }) {
  const t = strings[locale];

  const badgeStyles: Record<AccessLevel, string> = {
    full: 'bg-green-100 text-green-800 border-green-200',
    ranged: 'bg-amber-100 text-amber-800 border-amber-200',
    status_only: 'bg-blue-100 text-blue-800 border-blue-200',
    aggregate: 'bg-purple-100 text-purple-800 border-purple-200',
    none: 'bg-gray-100 text-gray-500 border-gray-200',
  };

  const icons: Record<AccessLevel, string> = {
    full: '✓',
    ranged: '~',
    status_only: '◐',
    aggregate: '∑',
    none: '✗',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badgeStyles[level]}`}
    >
      <span>{icons[level]}</span>
      {t.accessLevels[level]}
    </span>
  );
}

// =============================================================================
// ROLE CARD COMPONENT
// =============================================================================

function RoleCard({
  role,
  locale,
  compact,
}: {
  role: Role;
  locale: Locale;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const t = strings[locale];
  const roleConfig = ROLE_CONFIG[role];
  const accessEntries = ROLE_DATA_ACCESS[role] || [];

  // Exclude 'system' role from user-facing display unless explicitly included
  if (role === 'system') return null;

  // Group entries by access level
  const canSee = accessEntries.filter(e => e.accessLevel !== 'none');
  const cannotSee = accessEntries.filter(e => e.accessLevel === 'none');

  // Determine summary text
  const summaryText = canSee.length === 0
    ? t.noAccess
    : canSee.every(e => ['ranged', 'status_only', 'aggregate'].includes(e.accessLevel))
      ? t.limitedAccess
      : '';

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
          compact ? 'py-3' : ''
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{roleConfig.icon}</span>
          <div>
            <h4 className="font-semibold text-gray-900">
              {locale === 'bm' ? roleConfig.labelBm : roleConfig.label}
            </h4>
            {!compact && summaryText && (
              <p className="text-sm text-gray-500">{summaryText}</p>
            )}
          </div>
        </div>
        <button
          className="text-gray-400 hover:text-gray-600"
          aria-label={expanded ? t.collapse : t.expand}
        >
          <svg
            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          {/* What they CAN see */}
          {canSee.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                {locale === 'bm' ? 'Boleh Lihat:' : 'Can See:'}
              </h5>
              <div className="space-y-2">
                {canSee.map(entry => (
                  <DataAccessRow key={entry.category} entry={entry} locale={locale} />
                ))}
              </div>
            </div>
          )}

          {/* What they CANNOT see */}
          {cannotSee.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                {locale === 'bm' ? 'Tidak Boleh Lihat:' : 'Cannot See:'}
              </h5>
              <div className="flex flex-wrap gap-2">
                {cannotSee.map(entry => {
                  const categoryConfig = DATA_CATEGORY_CONFIG[entry.category];
                  return (
                    <span
                      key={entry.category}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      <span className="text-gray-400">✗</span>
                      {locale === 'bm' ? categoryConfig.labelBm : categoryConfig.labelEn}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// DATA ACCESS ROW COMPONENT
// =============================================================================

function DataAccessRow({ entry, locale }: { entry: DataAccessEntry; locale: Locale }) {
  const categoryConfig = DATA_CATEGORY_CONFIG[entry.category];
  const purposeConfig = PURPOSE_CONFIG[categoryConfig.consentPurpose];

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-white rounded border border-gray-100">
      <div className="flex items-center gap-2">
        {categoryConfig.isPII && (
          <span className="text-amber-500 text-xs" title={locale === 'bm' ? 'Maklumat Peribadi' : 'Personal Info'}>
            🔒
          </span>
        )}
        <span className="text-sm text-gray-800">
          {locale === 'bm' ? categoryConfig.labelBm : categoryConfig.labelEn}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">
          {locale === 'bm' ? entry.visibleAsBm : entry.visibleAsEn}
        </span>
        <AccessBadge level={entry.accessLevel} locale={locale} />
      </div>
    </div>
  );
}

// =============================================================================
// CONSENT PURPOSE LEGEND
// =============================================================================

function ConsentPurposeLegend({ locale }: { locale: Locale }) {
  const purposes: ConsentPurpose[] = [
    'C1_ELIGIBILITY',
    'C2_DOCUMENT_PROCESSING',
    'C3_SHARE_AGENT',
    'C4_DEVELOPER_ANALYTICS',
    'C5_COMMUNICATION',
    'C6_PROMOTIONAL',
  ];

  return (
    <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-100">
      <h4 className="text-sm font-medium text-teal-800 mb-3">
        {locale === 'bm' ? 'Tujuan Persetujuan' : 'Consent Purposes'}
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {purposes.map(purpose => {
          const config = PURPOSE_CONFIG[purpose];
          return (
            <div
              key={purpose}
              className={`px-3 py-2 rounded text-xs ${
                config.required
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span className="font-medium">
                {purpose.replace('_', ' ').replace('C', '')}
              </span>
              <span className="block text-xs opacity-75">
                {locale === 'bm' ? config.labelBm : config.labelEn}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function WhoCanSeeWhat({
  locale = 'bm',
  roles = ['buyer', 'agent', 'developer'],
  compact = false,
  expandable = true,
  defaultExpanded = false,
  onLearnMore,
}: WhoCanSeeWhatProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const t = strings[locale];

  // Filter out system role by default
  const displayRoles = roles.filter(r => r !== 'system') as Role[];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div
        className={`p-6 ${expandable ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
        onClick={() => expandable && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t.title}</h3>
              {!compact && <p className="text-sm text-gray-500">{t.subtitle}</p>}
            </div>
          </div>

          {expandable && (
            <button className="text-gray-400 hover:text-gray-600 p-1">
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {!compact && !isExpanded && (
          <p className="mt-3 text-sm text-gray-600">{t.description}</p>
        )}
      </div>

      {/* Expanded Content */}
      {(!expandable || isExpanded) && (
        <div className="px-6 pb-6">
          {/* Role Cards */}
          <div className="space-y-3">
            {displayRoles.map(role => (
              <RoleCard key={role} role={role} locale={locale} compact={compact} />
            ))}
          </div>

          {/* Consent Purpose Legend */}
          {!compact && <ConsentPurposeLegend locale={locale} />}

          {/* Learn More Button */}
          {onLearnMore && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLearnMore();
              }}
              className="mt-4 text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              {t.learnMore}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default WhoCanSeeWhat;
