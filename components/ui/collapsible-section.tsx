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

interface CollapsibleSectionProps {
  /**
   * Title displayed in the section header
   */
  title: string | ReactNode;

  /**
   * Content to display when section is expanded
   */
  children: ReactNode;

  /**
   * Whether section is open by default
   */
  defaultOpen?: boolean;

  /**
   * Callback when toggle state changes
   */
  onToggle?: (isOpen: boolean) => void;

  /**
   * CSS class for customization
   */
  className?: string;

  /**
   * Custom icon element (defaults to ChevronDown)
   */
  icon?: ReactNode;
}

/**
 * CollapsibleSection
 *
 * Expandable/collapsible section with smooth CSS-based animation.
 * Content always remains in the DOM for accessibility and legal compliance.
 *
 * @example
 * ```tsx
 * <CollapsibleSection title="Section Title" defaultOpen>
 *   <p>This content is always in the DOM</p>
 * </CollapsibleSection>
 * ```
 */
export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  onToggle,
  className = '',
  icon,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [mounted, setMounted] = useState(false);

  // Hydration fix for SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  if (!mounted) {
    return (
      <div className={`border border-slate-200 rounded-lg overflow-hidden ${className}`}>
        <div className="bg-slate-50 px-5 py-4">
          <button
            type="button"
            className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
            disabled
          >
            <span className="font-medium text-slate-900">{title}</span>
            <div className="text-slate-500">
              {icon || <ChevronDown className="w-5 h-5" />}
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-slate-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full bg-slate-50 px-5 py-4 flex items-center justify-between hover:bg-slate-100 transition-colors active:bg-slate-200"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-slate-900 text-left">{title}</span>
        <div
          className="text-slate-500 flex-shrink-0 transition-transform duration-300 ease-out"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          {icon || <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Content - Always in DOM */}
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: isOpen ? '1000px' : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="px-5 py-4 border-t border-slate-200 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
}
