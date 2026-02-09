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
import { Shield } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export type PrivacyNoteVariant = 'subtle' | 'prominent';

interface PrivacyNoteProps {
  message?: string;
  icon?: React.ReactNode;
  variant?: PrivacyNoteVariant;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_MESSAGE = 'Data anda dilindungi mengikut PDPA 2010';

// =============================================================================
// COMPONENT
// =============================================================================

export function PrivacyNote({
  message = DEFAULT_MESSAGE,
  icon,
  variant = 'subtle',
}: PrivacyNoteProps) {
  // Feature flag check
  if (process.env.NEXT_PUBLIC_ENABLE_TRUST_UI === 'false') {
    return null;
  }

  const defaultIcon = icon || <Shield className="h-4 w-4" />;

  const containerClass =
    variant === 'subtle'
      ? 'py-2 px-3 bg-blue-50 border border-blue-200 rounded-lg'
      : 'py-3 px-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-300 rounded-lg shadow-sm';

  const textClass =
    variant === 'subtle'
      ? 'text-xs text-blue-700'
      : 'text-sm text-blue-900 font-medium';

  return (
    <div
      className={`flex items-start gap-2 ${containerClass}`}
      role="region"
      aria-label="Privacy notice"
    >
      <span className="text-blue-600 flex-shrink-0 mt-0.5">
        {defaultIcon}
      </span>
      <p className={textClass}>{message}</p>
    </div>
  );
}

export default PrivacyNote;
