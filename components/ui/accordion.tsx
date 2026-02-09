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
import { CollapsibleSection } from './collapsible-section';

export interface AccordionItem {
  /**
   * Unique identifier for the accordion item
   */
  id: string;

  /**
   * Title/header text for the item
   */
  title: string | ReactNode;

  /**
   * Content to display when expanded
   */
  content: ReactNode;

  /**
   * Optional custom icon
   */
  icon?: ReactNode;
}

interface AccordionProps {
  /**
   * Array of accordion items
   */
  items: AccordionItem[];

  /**
   * Allow multiple items to be open simultaneously
   * If false, only one can be open at a time
   */
  allowMultiple?: boolean;

  /**
   * Index of item that should be open by default (0-based)
   */
  defaultOpenIndex?: number;

  /**
   * Callback when open state changes
   */
  onOpenChange?: (openItems: string[]) => void;

  /**
   * CSS class for customization
   */
  className?: string;

  /**
   * Gap between items
   */
  gap?: 'sm' | 'md' | 'lg';
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

/**
 * Accordion
 *
 * Multi-item collapsible container with optional single-open mode.
 * All items' content is always in the DOM for accessibility and compliance.
 *
 * @example
 * ```tsx
 * <Accordion
 *   items={[
 *     { id: '1', title: 'First', content: <p>Content 1</p> },
 *     { id: '2', title: 'Second', content: <p>Content 2</p> },
 *   ]}
 *   allowMultiple={false}
 *   defaultOpenIndex={0}
 * />
 * ```
 */
export function Accordion({
  items,
  allowMultiple = true,
  defaultOpenIndex,
  onOpenChange,
  className = '',
  gap = 'md',
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (defaultOpenIndex !== undefined && defaultOpenIndex < items.length) {
      initial.add(items[defaultOpenIndex].id);
    }
    return initial;
  });

  const [mounted, setMounted] = useState(false);

  // Hydration fix for SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = (itemId: string, isOpen: boolean) => {
    const newOpenItems = new Set(openItems);

    if (isOpen) {
      // If single-open mode, close all others
      if (!allowMultiple) {
        newOpenItems.clear();
      }
      newOpenItems.add(itemId);
    } else {
      newOpenItems.delete(itemId);
    }

    setOpenItems(newOpenItems);
    onOpenChange?.([...newOpenItems]);
  };

  if (!mounted) {
    return (
      <div className={`${gapClasses[gap]} flex flex-col ${className}`}>
        {items.map((item) => (
          <CollapsibleSection
            key={item.id}
            title={item.title}
            icon={item.icon}
            defaultOpen={false}
          >
            {item.content}
          </CollapsibleSection>
        ))}
      </div>
    );
  }

  return (
    <div className={`${gapClasses[gap]} flex flex-col ${className}`}>
      {items.map((item) => (
        <CollapsibleSection
          key={item.id}
          title={item.title}
          icon={item.icon}
          defaultOpen={openItems.has(item.id)}
          onToggle={(isOpen) => handleToggle(item.id, isOpen)}
        >
          {item.content}
        </CollapsibleSection>
      ))}
    </div>
  );
}
