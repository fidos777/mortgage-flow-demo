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

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface SecurityStatementProps {
  title: string;
  statements: string[];
  defaultExpanded?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SecurityStatement({
  title,
  statements,
  defaultExpanded = false,
}: SecurityStatementProps) {
  // Feature flag check
  if (process.env.NEXT_PUBLIC_ENABLE_TRUST_UI === 'false') {
    return null;
  }

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={toggleExpanded}
        className={`
          w-full px-4 py-4 flex items-center justify-between
          transition-colors duration-200
          ${
            isExpanded
              ? 'bg-blue-50 border-b border-gray-200'
              : 'bg-white hover:bg-gray-50'
          }
        `}
        aria-expanded={isExpanded}
        aria-controls={`security-content-${title.replace(/\s+/g, '-')}`}
      >
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <ChevronDown
          className={`
            h-5 w-5 text-gray-500 transition-transform duration-200
            ${isExpanded ? 'transform rotate-180' : ''}
          `}
          aria-hidden="true"
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <div
          id={`security-content-${title.replace(/\s+/g, '-')}`}
          className="px-4 py-4 bg-blue-50 border-t border-gray-200"
        >
          <ul className="space-y-3">
            {statements.map((statement, index) => (
              <li key={index} className="flex gap-3">
                <span className="text-blue-600 font-bold flex-shrink-0 mt-0.5">
                  ✓
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {statement}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SecurityStatement;
