'use client';

/**
 * ConsentCheckbox Component
 * Sprint 0, Session S0.2 | PRD v3.6.3 CR-010A
 *
 * Individual consent checkbox with label, description, and required/optional badge.
 * Supports bilingual display (BM + EN).
 */

import React from 'react';
import { ConsentType, CONSENT_CONFIG } from '@/lib/types/consent';
import { Locale, getConsentStrings } from '@/lib/i18n/consent';

// =============================================================================
// TYPES
// =============================================================================

interface ConsentCheckboxProps {
  consentType: ConsentType;
  checked: boolean;
  onChange: (checked: boolean) => void;
  locale?: Locale;
  disabled?: boolean;
  showDescription?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ConsentCheckbox({
  consentType,
  checked,
  onChange,
  locale = 'bm',
  disabled = false,
  showDescription = true,
}: ConsentCheckboxProps) {
  const strings = getConsentStrings(locale);
  const config = CONSENT_CONFIG[consentType];
  const typeStrings = strings.consentTypes[consentType];

  const isRequired = config.required;

  // Badge styling
  const badgeClass = isRequired
    ? 'bg-red-100 text-red-800 border-red-200'
    : 'bg-gray-100 text-gray-600 border-gray-200';

  // Get badge text based on consent type
  const getBadgeText = () => {
    if (isRequired && 'required' in typeStrings) {
      return (typeStrings as { required: string }).required;
    }
    if ('optional' in typeStrings) {
      return (typeStrings as { optional: string }).optional;
    }
    if ('situational' in typeStrings) {
      return (typeStrings as { situational: string }).situational;
    }
    return '';
  };
  const badgeText = getBadgeText();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Required consents cannot be unchecked once checked
    if (isRequired && checked && !e.target.checked) {
      return;
    }
    onChange(e.target.checked);
  };

  return (
    <div
      className={`
        relative flex items-start p-4 rounded-lg border-2 transition-all duration-200
        ${checked ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-white hover:border-gray-300'}
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onClick={() => !disabled && onChange(!checked)}
    >
      {/* Checkbox */}
      <div className="flex items-center h-6">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled || (isRequired && checked)}
          className={`
            h-5 w-5 rounded border-2 transition-colors duration-200
            ${checked ? 'border-teal-600 bg-teal-600 text-white' : 'border-gray-300 bg-white'}
            focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
            disabled:cursor-not-allowed
          `}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Content */}
      <div className="ml-4 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Label */}
          <label
            className={`
              text-base font-semibold
              ${checked ? 'text-teal-900' : 'text-gray-900'}
            `}
          >
            {typeStrings.label}
          </label>

          {/* Badge */}
          <span
            className={`
              inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border
              ${badgeClass}
            `}
          >
            {badgeText}
          </span>
        </div>

        {/* Description */}
        {showDescription && (
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">
            {typeStrings.description}
          </p>
        )}
      </div>

      {/* Checkmark indicator */}
      {checked && (
        <div className="absolute top-2 right-2">
          <svg
            className="h-5 w-5 text-teal-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ConsentCheckbox;
