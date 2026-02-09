'use client';

/**
 * @scope VISUAL ONLY - Presentation Layer
 * Trust indicator component.
 *
 * ⚠️ CRITICAL BOUNDARIES:
 * - VISUAL INDICATOR ONLY
 * - Does NOT read consent state from server
 * - Does NOT write consent state to server
 * - Does NOT gate user progression
 * - Does NOT make API calls
 *
 * Actual consent logic is handled by backend services.
 *
 * @see /docs/UI-AMENDMENTS.md
 */

import React from 'react';
import { Shield, Lock, CheckCircle } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export type BadgeType = 'pdpa' | 'ssl' | 'secure' | 'bank-grade';
export type TrustStripVariant = 'compact' | 'full';

interface Badge {
  type: BadgeType;
  label: string;
}

interface TrustStripProps {
  badges?: Badge[];
  variant?: TrustStripVariant;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_BADGES: Badge[] = [
  { type: 'pdpa', label: 'Dilindungi PDPA 2010' },
  { type: 'ssl', label: 'Enkripsi SSL 256-bit' },
  { type: 'bank-grade', label: 'Keamanan Bank-Grade' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function TrustStrip({
  badges = DEFAULT_BADGES,
  variant = 'full',
}: TrustStripProps) {
  // Feature flag check
  if (process.env.NEXT_PUBLIC_ENABLE_TRUST_UI === 'false') {
    return null;
  }

  const getIconForBadge = (type: BadgeType) => {
    const iconProps = {
      className: variant === 'compact' ? 'h-4 w-4' : 'h-5 w-5',
    };

    switch (type) {
      case 'pdpa':
        return <Shield {...iconProps} />;
      case 'ssl':
        return <Lock {...iconProps} />;
      case 'secure':
      case 'bank-grade':
        return <CheckCircle {...iconProps} />;
      default:
        return <Shield {...iconProps} />;
    }
  };

  const containerClass =
    variant === 'compact'
      ? 'py-2 px-4 gap-2 text-xs'
      : 'py-4 px-6 gap-4 text-sm';

  const badgeClass =
    variant === 'compact'
      ? 'py-1 px-2 rounded gap-1'
      : 'py-2 px-3 rounded-lg gap-2';

  return (
    <div
      className={`
        w-full bg-gradient-to-r from-green-50 to-teal-50 border border-green-200
        flex items-center justify-center flex-wrap
        ${containerClass}
      `}
      role="region"
      aria-label="Trust and security indicators"
    >
      {badges.map((badge) => (
        <div
          key={badge.type}
          className={`
            flex items-center text-green-700 font-medium
            ${badgeClass}
            bg-white rounded-full border border-green-200 shadow-sm
            hover:shadow-md transition-shadow duration-200
          `}
          aria-label={`${badge.label} verified`}
        >
          <span className="text-green-600 flex-shrink-0">
            {getIconForBadge(badge.type)}
          </span>
          {variant === 'full' && <span>{badge.label}</span>}
        </div>
      ))}
    </div>
  );
}

export default TrustStrip;
