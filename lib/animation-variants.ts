/**
 * Animation Variants
 * snang.my Pilot - Session 1: Animation Foundation
 *
 * CSS-based animation presets using Tailwind CSS and CSS Modules.
 * Three tiers of motion for performance-aware animations:
 * - 'full': Standard animations with smooth transitions
 * - 'reduced': Minimal animations, shorter durations
 * - 'none': Instant transitions (no animation)
 *
 * These variants are framework-agnostic and work with CSS transitions/animations.
 * For component usage, import and apply to className or style definitions.
 *
 * @see /docs/UI-AMENDMENTS.md
 */

// =============================================================================
// TYPES
// =============================================================================

export type AnimationTier = 'full' | 'reduced' | 'none';

export interface AnimationVariant {
  className: string;
  style?: React.CSSProperties;
  duration: string;
}

export interface AnimationVariants {
  fadeIn: AnimationVariant;
  slideUp: AnimationVariant;
  slideLeft: AnimationVariant;
  slideRight: AnimationVariant;
  scaleIn: AnimationVariant;
  staggerContainer: AnimationVariant;
  staggerItem: AnimationVariant;
}

// =============================================================================
// ANIMATION PRESET DEFINITIONS
// =============================================================================

/**
 * Full-tier animations: Standard motion with natural easing
 * Duration: 300-600ms depending on animation type
 * Best for: Desktop, modern browsers, good connectivity
 */
export const fullAnimationVariants: AnimationVariants = {
  fadeIn: {
    className: 'animate-fadeIn',
    style: {
      animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    },
    duration: '300ms',
  },
  slideUp: {
    className: 'animate-slideUp',
    style: {
      animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    },
    duration: '400ms',
  },
  slideLeft: {
    className: 'animate-slideLeft',
    style: {
      animation: 'slideLeft 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    },
    duration: '400ms',
  },
  slideRight: {
    className: 'animate-slideRight',
    style: {
      animation: 'slideRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    },
    duration: '400ms',
  },
  scaleIn: {
    className: 'animate-scaleIn',
    style: {
      animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    },
    duration: '300ms',
  },
  staggerContainer: {
    className: 'animate-staggerContainer',
    style: {
      animationDelay: '0ms',
    },
    duration: '0ms',
  },
  staggerItem: {
    className: 'animate-staggerItem',
    style: {
      animationDelay: 'var(--stagger-index, 0) * 50ms',
    },
    duration: '50ms',
  },
};

/**
 * Reduced-tier animations: Minimal motion, shorter durations
 * Duration: 150-300ms
 * Best for: Low-end devices, slow connections, accessibility preference
 */
export const reducedAnimationVariants: AnimationVariants = {
  fadeIn: {
    className: 'animate-fadeIn-reduced',
    style: {
      animation: 'fadeIn 0.15s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    },
    duration: '150ms',
  },
  slideUp: {
    className: 'animate-slideUp-reduced',
    style: {
      animation: 'slideUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    },
    duration: '200ms',
  },
  slideLeft: {
    className: 'animate-slideLeft-reduced',
    style: {
      animation: 'slideLeft 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    },
    duration: '200ms',
  },
  slideRight: {
    className: 'animate-slideRight-reduced',
    style: {
      animation: 'slideRight 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    },
    duration: '200ms',
  },
  scaleIn: {
    className: 'animate-scaleIn-reduced',
    style: {
      animation: 'scaleIn 0.15s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    },
    duration: '150ms',
  },
  staggerContainer: {
    className: 'animate-staggerContainer-reduced',
    style: {
      animationDelay: '0ms',
    },
    duration: '0ms',
  },
  staggerItem: {
    className: 'animate-staggerItem-reduced',
    style: {
      animationDelay: 'var(--stagger-index, 0) * 25ms',
    },
    duration: '25ms',
  },
};

/**
 * None-tier animations: Instant transitions
 * Duration: 0ms (no animation)
 * Best for: Accessibility (prefers-reduced-motion), very low-end devices
 */
export const noAnimationVariants: AnimationVariants = {
  fadeIn: {
    className: '',
    style: {
      animation: 'none',
    },
    duration: '0ms',
  },
  slideUp: {
    className: '',
    style: {
      animation: 'none',
    },
    duration: '0ms',
  },
  slideLeft: {
    className: '',
    style: {
      animation: 'none',
    },
    duration: '0ms',
  },
  slideRight: {
    className: '',
    style: {
      animation: 'none',
    },
    duration: '0ms',
  },
  scaleIn: {
    className: '',
    style: {
      animation: 'none',
    },
    duration: '0ms',
  },
  staggerContainer: {
    className: '',
    style: {
      animation: 'none',
    },
    duration: '0ms',
  },
  staggerItem: {
    className: '',
    style: {
      animation: 'none',
      animationDelay: '0ms',
    },
    duration: '0ms',
  },
};

// =============================================================================
// VARIANT SELECTION
// =============================================================================

/**
 * Get animation variants for a specific tier
 *
 * @param tier Animation capability tier
 * @returns Animation variants for that tier
 */
export function getAnimationVariants(tier: AnimationTier): AnimationVariants {
  switch (tier) {
    case 'full':
      return fullAnimationVariants;
    case 'reduced':
      return reducedAnimationVariants;
    case 'none':
      return noAnimationVariants;
    default:
      return fullAnimationVariants;
  }
}

/**
 * Get a specific variant by name and tier
 *
 * @param tier Animation capability tier
 * @param variant Variant name (e.g., 'fadeIn', 'slideUp')
 * @returns Specific animation variant
 */
export function getAnimationVariant(
  tier: AnimationTier,
  variant: keyof AnimationVariants
): AnimationVariant {
  const variants = getAnimationVariants(tier);
  return variants[variant];
}

// =============================================================================
// TAILWIND CONFIGURATION
// =============================================================================

/**
 * Tailwind CSS animation configuration to add to tailwind.config.js
 *
 * Add this to your Tailwind config's theme.extend.animation:
 *
 * ```js
 * extend: {
 *   animation: {
 *     // Full-tier animations
 *     fadeIn: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
 *     slideUp: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
 *     slideLeft: 'slideLeft 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
 *     slideRight: 'slideRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
 *     scaleIn: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
 *
 *     // Reduced-tier animations
 *     'fadeIn-reduced': 'fadeIn 0.15s cubic-bezier(0.4, 0, 0.2, 1) forwards',
 *     'slideUp-reduced': 'slideUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
 *     'slideLeft-reduced': 'slideLeft 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
 *     'slideRight-reduced': 'slideRight 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
 *     'scaleIn-reduced': 'scaleIn 0.15s cubic-bezier(0.4, 0, 0.2, 1) forwards',
 *   },
 *   keyframes: {
 *     fadeIn: {
 *       from: { opacity: '0' },
 *       to: { opacity: '1' },
 *     },
 *     slideUp: {
 *       from: { transform: 'translateY(10px)', opacity: '0' },
 *       to: { transform: 'translateY(0)', opacity: '1' },
 *     },
 *     slideLeft: {
 *       from: { transform: 'translateX(10px)', opacity: '0' },
 *       to: { transform: 'translateX(0)', opacity: '1' },
 *     },
 *     slideRight: {
 *       from: { transform: 'translateX(-10px)', opacity: '0' },
 *       to: { transform: 'translateX(0)', opacity: '1' },
 *     },
 *     scaleIn: {
 *       from: { transform: 'scale(0.95)', opacity: '0' },
 *       to: { transform: 'scale(1)', opacity: '1' },
 *     },
 *   },
 * }
 * ```
 */

export const TAILWIND_CONFIG_SNIPPET = {
  animation: {
    // Full-tier animations
    fadeIn: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    slideUp: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    slideLeft: 'slideLeft 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    slideRight: 'slideRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    scaleIn: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',

    // Reduced-tier animations
    'fadeIn-reduced': 'fadeIn 0.15s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    'slideUp-reduced': 'slideUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    'slideLeft-reduced': 'slideLeft 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    'slideRight-reduced': 'slideRight 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    'scaleIn-reduced': 'scaleIn 0.15s cubic-bezier(0.4, 0, 0.2, 1) forwards',
  },
  keyframes: {
    fadeIn: {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    slideUp: {
      from: { transform: 'translateY(10px)', opacity: '0' },
      to: { transform: 'translateY(0)', opacity: '1' },
    },
    slideLeft: {
      from: { transform: 'translateX(10px)', opacity: '0' },
      to: { transform: 'translateX(0)', opacity: '1' },
    },
    slideRight: {
      from: { transform: 'translateX(-10px)', opacity: '0' },
      to: { transform: 'translateX(0)', opacity: '1' },
    },
    scaleIn: {
      from: { transform: 'scale(0.95)', opacity: '0' },
      to: { transform: 'scale(1)', opacity: '1' },
    },
  },
} as const;
