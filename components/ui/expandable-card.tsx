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
import { ChevronDown } from 'lucide-react';

interface ExpandableCardProps {
  /**
   * Card title
   */
  title: string | ReactNode;

  /**
   * Preview text shown when collapsed
   */
  preview: string | ReactNode;

  /**
   * Full content shown when expanded
   */
  children: ReactNode;

  /**
   * Optional icon element displayed before the title
   */
  icon?: ReactNode;

  /**
   * Text for the expand button
   * @default "Baca Lagi"
   */
  expandLabel?: string;

  /**
   * Text for the collapse button
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
   * CSS class for customization
   */
  className?: string;
}

/**
 * ExpandableCard
 *
 * Card component with preview content and expandable full content.
 * Displays toggle button with Malay labels ("Baca Lagi" / "Tutup").
 * All content remains in DOM for accessibility and compliance.
 *
 * @example
 * ```tsx
 * <ExpandableCard
 *   title="Card Title"
 *   preview="Summary text..."
 *   expandLabel="Baca Lagi"
 *   collapseLabel="Tutup"
 * >
 *   <p>Full expanded content here</p>
 * </ExpandableCard>
 * ```
 */
export function ExpandableCard({
  title,
  preview,
  children,
  icon,
  expandLabel = 'Baca Lagi',
  collapseLabel = 'Tutup',
  defaultExpanded = false,
  onExpandChange,
  className = '',
}: ExpandableCardProps) {
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

  if (!mounted) {
    return (
      <div
        className={`bg-white border border-slate-200 rounded-lg p-6 shadow-sm ${className}`}
      >
        <div className="flex items-start gap-4">
          {icon && (
            <div className="flex-shrink-0 mt-1">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
            <div className="text-slate-600 text-sm mb-4">{preview}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden ${className}`}
    >
      {/* Card Header */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          {icon && (
            <div className="flex-shrink-0 mt-1">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
            <div className="text-slate-600 text-sm">{preview}</div>
          </div>
        </div>
      </div>

      {/* Divider - Only shown when expanded */}
      {isExpanded && (
        <div className="border-t border-slate-100" />
      )}

      {/* Expanded Content - Always in DOM */}
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: isExpanded ? '2000px' : '0px',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="p-6 bg-slate-50">
          {children}
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full px-6 py-3 flex items-center justify-center gap-2 font-medium transition-colors ${
          isExpanded
            ? 'border-t border-slate-100 bg-white text-slate-600 hover:bg-slate-50'
            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
        }`}
        aria-expanded={isExpanded}
      >
        <span>
          {isExpanded ? collapseLabel : expandLabel}
        </span>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-300"
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
    </div>
  );
}
