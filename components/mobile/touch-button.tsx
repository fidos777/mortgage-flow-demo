/**
 * @component TouchButton
 * @scope VISUAL ONLY - Presentation Layer
 *
 * Touch-optimized button with 44px minimum target.
 * Designed for Malaysia market (low-end Android devices).
 *
 * ⚠️ BOUNDARIES:
 * - No API calls
 * - No analytics tracking
 * - Visual wrapper only
 *
 * @see /docs/UI-AMENDMENTS.md
 */

'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-snang-teal-600 text-white
    hover:bg-snang-teal-700 active:bg-snang-teal-800
    focus:ring-snang-teal-500
  `,
  secondary: `
    bg-snang-amber-500 text-white
    hover:bg-snang-amber-600 active:bg-snang-amber-700
    focus:ring-snang-amber-500
  `,
  outline: `
    border-2 border-snang-teal-600 text-snang-teal-600 bg-transparent
    hover:bg-snang-teal-50 active:bg-snang-teal-100
    focus:ring-snang-teal-500
  `,
  ghost: `
    text-snang-teal-600 bg-transparent
    hover:bg-snang-teal-50 active:bg-snang-teal-100
    focus:ring-snang-teal-500
  `,
  danger: `
    bg-red-600 text-white
    hover:bg-red-700 active:bg-red-800
    focus:ring-red-500
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-touch px-3 py-2 text-sm',
  md: 'min-h-touch px-4 py-2.5 text-base',
  lg: 'min-h-touch-lg px-6 py-3 text-lg',
};

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center gap-2
          font-medium rounded-lg
          transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          active:scale-[0.98]
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

TouchButton.displayName = 'TouchButton';

export default TouchButton;
