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

export type InlineIndicatorType = 'pdpa' | 'ssl' | 'secure' | 'verified';
export type InlineIndicatorSize = 'sm' | 'md';

interface InlineIndicatorProps {
  type?: InlineIndicatorType;
  size?: InlineIndicatorSize;
  showLabel?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const INDICATOR_CONFIG: Record<
  InlineIndicatorType,
  { icon: React.ReactNode; label: string; color: string }
> = {
  pdpa: {
    icon: <Shield />,
    label: 'Dilindungi PDPA',
    color: 'text-blue-600',
  },
  ssl: {
    icon: <Lock />,
    label: 'SSL Aman',
    color: 'text-green-600',
  },
  secure: {
    icon: <Lock />,
    label: 'Selamat',
    color: 'text-green-600',
  },
  verified: {
    icon: <CheckCircle />,
    label: 'Disahkan',
    color: 'text-emerald-600',
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function InlineIndicator({
  type = 'verified',
  size = 'md',
  showLabel = true,
}: InlineIndicatorProps) {
  // Feature flag check
  if (process.env.NEXT_PUBLIC_ENABLE_TRUST_UI === 'false') {
    return null;
  }

  const config = INDICATOR_CONFIG[type];

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const containerClass =
    size === 'sm'
      ? 'flex items-center gap-1 text-xs'
      : 'flex items-center gap-2 text-sm';
  const labelClass = size === 'sm' ? 'font-medium' : 'font-semibold';

  return (
    <div
      className={`inline-flex ${containerClass}`}
      role="status"
      aria-label={`${config.label} - trust indicator`}
    >
      <span className={`${config.color} flex-shrink-0`}>
        {React.cloneElement(config.icon as React.ReactElement, {
          className: iconSize,
        })}
      </span>
      {showLabel && <span className={`${config.color} ${labelClass}`}>
        {config.label}
      </span>}
    </div>
  );
}

export default InlineIndicator;
