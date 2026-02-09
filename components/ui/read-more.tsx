/**
 * @scope VISUAL ONLY - Presentation Layer
 * Progressive disclosure component.
 *
 * ⚠️ BOUNDARIES:
 * - Content ALWAYS in DOM (not conditionally rendered)
 * - No API calls on expand/collapse
 * - No analytics tracking
 *
 * ⚠️ COMPLIANCE:
 * - Legal text must remain visible in DOM
 *
 * @see /docs/UI-AMENDMENTS.md
 */

'use client';

import { ReactNode, useState, useEffect } from 'react';

interface ReadMoreProps {
  /**
   * The full text content
   */
  text: string;

  /**
   * Maximum number of characters to display when collapsed
   * @default 150
   */
  maxLength?: number;

  /**
   * Label for the "read more" link
   * @default "Baca Lagi"
   */
  expandLabel?: string;

  /**
   * Label for the "read less" link
   * @default "Tutup"
   */
  collapseLabel?: string;

  /**
   * Whether expanded by default
   */
  defaultExpanded?: boolean;

  /**
   * Callback when expanded state changes
   */
  onExpandChange?: (isExpanded: boolean) => void;

  /**
   * CSS class for container
   */
  className?: string;

  /**
   * CSS class for text
   */
  textClassName?: string;

  /**
   * CSS class for link
   */
  linkClassName?: string;
}

/**
 * ReadMore
 *
 * Truncates text content with an inline "Baca Lagi" / "Tutup" toggle.
 * Full text is always in the DOM for accessibility and compliance.
 * Truncation happens at word boundary near maxLength.
 *
 * @example
 * ```tsx
 * <ReadMore
 *   text="Long text content..."
 *   maxLength={150}
 *   expandLabel="Baca Lagi"
 *   collapseLabel="Tutup"
 * />
 * ```
 */
export function ReadMore({
  text,
  maxLength = 150,
  expandLabel = 'Baca Lagi',
  collapseLabel = 'Tutup',
  defaultExpanded = false,
  onExpandChange,
  className = '',
  textClassName = '',
  linkClassName = '',
}: ReadMoreProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [mounted, setMounted] = useState(false);

  // Hydration fix for SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onExpandChange?.(newState);
  };

  const isTruncated = text.length > maxLength;

  // Find word boundary near maxLength
  const getTruncatedText = () => {
    if (text.length <= maxLength) {
      return text;
    }

    // Truncate at maxLength and find last space
    let truncated = text.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    if (lastSpaceIndex > maxLength * 0.7) {
      // If space found and reasonably close, use it
      truncated = text.substring(0, lastSpaceIndex);
    }

    return truncated.trim() + '...';
  };

  const displayText = isExpanded ? text : getTruncatedText();

  if (!mounted) {
    return (
      <div className={className}>
        <p className={textClassName}>{text}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Text always in DOM - hidden/shown via overflow */}
      <p className={`${textClassName} leading-relaxed`}>
        {text}
      </p>

      {/* Truncation indicator and toggle - only shown when truncated and collapsed */}
      {isTruncated && !isExpanded && (
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-slate-600">...</span>
          <button
            type="button"
            onClick={handleToggle}
            className={`font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors inline-block ${linkClassName}`}
            aria-expanded={isExpanded}
          >
            {expandLabel}
          </button>
        </div>
      )}

      {/* Collapse button - only shown when expanded and truncated */}
      {isTruncated && isExpanded && (
        <button
          type="button"
          onClick={handleToggle}
          className={`font-medium text-slate-600 hover:text-slate-700 hover:underline transition-colors inline-block mt-2 ${linkClassName}`}
          aria-expanded={isExpanded}
        >
          {collapseLabel}
        </button>
      )}
    </div>
  );
}

/**
 * ReadMoreDisplay
 *
 * Alternative display-only version that shows truncated/full text
 * without interactive toggle (useful for SSR scenarios).
 * The actual toggle would be handled by parent component.
 */
export function ReadMoreDisplay({
  text,
  isExpanded = false,
  maxLength = 150,
  className = '',
  textClassName = '',
}: {
  text: string;
  isExpanded?: boolean;
  maxLength?: number;
  className?: string;
  textClassName?: string;
}) {
  const getTruncatedText = () => {
    if (text.length <= maxLength) {
      return text;
    }

    let truncated = text.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    if (lastSpaceIndex > maxLength * 0.7) {
      truncated = text.substring(0, lastSpaceIndex);
    }

    return truncated.trim() + '...';
  };

  const displayText = isExpanded ? text : getTruncatedText();

  return (
    <div className={className}>
      <p className={`${textClassName} leading-relaxed`}>
        {displayText}
      </p>
    </div>
  );
}
