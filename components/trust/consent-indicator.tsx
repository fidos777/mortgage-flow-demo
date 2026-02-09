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
import { CheckCircle2, Circle } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface ConsentIndicatorProps {
  label: string;
  checked: boolean;
  timestamp?: Date | string;
}

// =============================================================================
// HELPERS
// =============================================================================

const formatTimestamp = (ts: Date | string): string => {
  const date = typeof ts === 'string' ? new Date(ts) : ts;

  if (isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru sahaja';
  if (diffMins < 60) return `${diffMins} min yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;

  return date.toLocaleDateString('ms-MY');
};

// =============================================================================
// COMPONENT
// =============================================================================

export function ConsentIndicator({
  label,
  checked,
  timestamp,
}: ConsentIndicatorProps) {
  // Feature flag check
  if (process.env.NEXT_PUBLIC_ENABLE_TRUST_UI === 'false') {
    return null;
  }

  const containerClass = checked
    ? 'bg-green-50 border border-green-200'
    : 'bg-gray-50 border border-gray-200';

  const textColorClass = checked ? 'text-green-900' : 'text-gray-600';
  const timestampColorClass = checked
    ? 'text-green-700'
    : 'text-gray-500';

  const formattedTime = timestamp ? formatTimestamp(timestamp) : '';

  return (
    <div
      className={`flex items-start gap-3 py-3 px-4 rounded-lg ${containerClass}`}
      role="status"
      aria-label={`${label} consent status: ${checked ? 'given' : 'not given'}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {checked ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <Circle className="h-5 w-5 text-gray-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${textColorClass}`}>{label}</p>
        {checked && formattedTime && (
          <p className={`text-xs ${timestampColorClass} mt-1`}>
            Diberikan: {formattedTime}
          </p>
        )}
        {!checked && (
          <p className={`text-xs ${timestampColorClass} mt-1`}>
            Belum diberikan
          </p>
        )}
      </div>
    </div>
  );
}

export default ConsentIndicator;
