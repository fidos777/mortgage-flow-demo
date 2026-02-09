/**
 * @component MobileStack
 * @scope VISUAL ONLY - Presentation Layer
 *
 * Responsive layout that stacks on mobile, rows on desktop.
 * Optimized for Malaysia market (small screens, low bandwidth).
 *
 * ⚠️ BOUNDARIES:
 * - No API calls
 * - No analytics tracking
 * - Layout wrapper only
 *
 * @see /docs/UI-AMENDMENTS.md
 */

'use client';

import { ReactNode } from 'react';

interface MobileStackProps {
  children: ReactNode;
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  /** Reverse order on mobile */
  reverseOnMobile?: boolean;
  /** Custom breakpoint for switching (default: sm/640px) */
  breakpoint?: 'xs' | 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

const gapStyles = {
  sm: 'gap-2 sm:gap-3',
  md: 'gap-3 sm:gap-4',
  lg: 'gap-4 sm:gap-6',
  xl: 'gap-6 sm:gap-8',
};

const breakpointStyles = {
  xs: 'xs:flex-row',
  sm: 'sm:flex-row',
  md: 'md:flex-row',
  lg: 'lg:flex-row',
};

export function MobileStack({
  children,
  gap = 'md',
  reverseOnMobile = false,
  breakpoint = 'sm',
  className = '',
}: MobileStackProps) {
  return (
    <div
      className={`
        flex flex-col
        ${breakpointStyles[breakpoint]}
        ${gapStyles[gap]}
        ${reverseOnMobile ? 'flex-col-reverse sm:flex-row' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * Grid that becomes single column on mobile
 */
interface MobileGridProps {
  children: ReactNode;
  /** Desktop columns */
  cols?: 2 | 3 | 4;
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

const gridColStyles = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

const gridGapStyles = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

export function MobileGrid({
  children,
  cols = 2,
  gap = 'md',
  className = '',
}: MobileGridProps) {
  return (
    <div
      className={`
        grid grid-cols-1
        ${gridColStyles[cols]}
        ${gridGapStyles[gap]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * Container with mobile-optimized padding
 */
interface MobileContainerProps {
  children: ReactNode;
  /** Max width */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

const maxWidthStyles = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  full: 'max-w-full',
};

const paddingStyles = {
  none: '',
  sm: 'px-3 sm:px-4',
  md: 'px-4 sm:px-6',
  lg: 'px-4 sm:px-8 lg:px-12',
};

export function MobileContainer({
  children,
  maxWidth = 'lg',
  padding = 'md',
  className = '',
}: MobileContainerProps) {
  return (
    <div
      className={`
        mx-auto w-full
        ${maxWidthStyles[maxWidth]}
        ${paddingStyles[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * Sticky bottom action bar for mobile
 */
interface MobileBottomBarProps {
  children: ReactNode;
  /** Show shadow */
  shadow?: boolean;
  /** Additional className */
  className?: string;
}

export function MobileBottomBar({
  children,
  shadow = true,
  className = '',
}: MobileBottomBarProps) {
  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-40
        bg-white border-t border-slate-200
        p-4
        ${shadow ? 'shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]' : ''}
        ${className}
      `}
      style={{
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Spacer to account for MobileBottomBar
 */
interface MobileBottomSpacerProps {
  /** Height of the bottom bar (default: 80px) */
  height?: number;
}

export function MobileBottomSpacer({ height = 80 }: MobileBottomSpacerProps) {
  return (
    <div
      className="sm:hidden"
      style={{
        height: `calc(${height}px + env(safe-area-inset-bottom, 0px))`,
      }}
    />
  );
}

export default MobileStack;
