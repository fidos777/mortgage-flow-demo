'use client';

/**
 * Animated Container Component
 * snang.my Pilot - Session 1: Animation Foundation
 *
 * A flexible wrapper component that applies performance-aware animations
 * based on device capability and user preferences.
 *
 * Features:
 * - Respects prefers-reduced-motion
 * - Auto-detects device performance
 * - Respects NEXT_PUBLIC_ENABLE_ANIMATION flag
 * - Falls back gracefully when animations disabled
 * - Supports multiple animation variants
 * - TypeScript support with proper types
 *
 * @see /docs/UI-AMENDMENTS.md
 */

import React, { useMemo } from 'react';
import { useAnimationCapability, useAnimationToggle } from '@/lib/hooks/use-animation';
import { getAnimationVariants, type AnimationTier, type AnimationVariants } from '@/lib/animation-variants';

// =============================================================================
// TYPES
// =============================================================================

type VariantName = 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'staggerContainer' | 'staggerItem';

export interface AnimatedContainerProps {
  /**
   * Animation variant to apply
   * @default 'fadeIn'
   */
  variant?: VariantName;

  /**
   * CSS class name to apply alongside animation
   */
  className?: string;

  /**
   * Inline styles to merge with animation styles
   */
  style?: React.CSSProperties;

  /**
   * Child elements to animate
   */
  children: React.ReactNode;

  /**
   * Whether to apply animation
   * @default true
   */
  animate?: boolean;

  /**
   * Initial state before animation
   * For fade: opacity value (0-1)
   * For slide: transform value
   * For scale: scale value
   * @default Appropriate for variant
   */
  initial?: React.CSSProperties;

  /**
   * Delay before animation starts (ms)
   * @default 0
   */
  delay?: number;

  /**
   * Stagger index for batch animations
   * @default undefined
   */
  staggerIndex?: number;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;

  /**
   * HTML element to render as
   * @default 'div'
   */
  as?: keyof JSX.IntrinsicElements;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Animated Container - Performance-aware animation wrapper
 *
 * Usage:
 * ```tsx
 * <AnimatedContainer variant="slideUp">
 *   <h1>Welcome</h1>
 * </AnimatedContainer>
 *
 * // With stagger
 * {items.map((item, i) => (
 *   <AnimatedContainer
 *     key={item.id}
 *     variant="fadeIn"
 *     staggerIndex={i}
 *   >
 *     {item.label}
 *   </AnimatedContainer>
 * ))}
 * ```
 */
export const AnimatedContainer = React.forwardRef<
  HTMLDivElement,
  AnimatedContainerProps
>(
  (
    {
      variant = 'fadeIn',
      className,
      style,
      children,
      animate = true,
      initial,
      delay = 0,
      staggerIndex,
      debug = false,
      as: Component = 'div',
    },
    ref
  ) => {
    const capability = useAnimationCapability();
    const { enabled: userEnabled } = useAnimationToggle();

    // Check if animations are enabled globally
    const animationsGloballyEnabled = process.env.NEXT_PUBLIC_ENABLE_ANIMATION !== 'false';

    // Determine if we should animate
    const shouldAnimate = useMemo(() => {
      if (!animate) {
        if (debug) console.log('[AnimatedContainer]', variant, '- animate prop is false');
        return false;
      }

      if (!animationsGloballyEnabled) {
        if (debug) console.log('[AnimatedContainer]', variant, '- globally disabled');
        return false;
      }

      if (!userEnabled) {
        if (debug) console.log('[AnimatedContainer]', variant, '- user disabled');
        return false;
      }

      if (capability === 'none') {
        if (debug) console.log('[AnimatedContainer]', variant, '- device capability is none');
        return false;
      }

      if (debug) console.log('[AnimatedContainer]', variant, `- animating (capability: ${capability})`);
      return true;
    }, [animate, animationsGloballyEnabled, userEnabled, capability, variant, debug]);

    // Get animation variants for current capability tier
    const animationTier: AnimationTier = shouldAnimate ? capability : 'none';
    const variants = useMemo(() => getAnimationVariants(animationTier), [animationTier]);

    // Get the specific variant
    const variantStyle = variants[variant];

    // Merge all styles
    const mergedStyle = useMemo<React.CSSProperties>(() => {
      const base: React.CSSProperties = {
        // Start with initial state if provided
        ...(initial && {
          ...initial,
        }),

        // Apply animation styles if should animate
        ...(shouldAnimate && {
          ...variantStyle.style,
          ...(delay > 0 && {
            animationDelay: `${delay}ms`,
          }),
        }),

        // Stagger index CSS variable for batch animations
        ...(staggerIndex !== undefined && {
          '--stagger-index': staggerIndex,
        } as React.CSSProperties & { '--stagger-index': number }),

        // User provided styles (highest priority)
        ...style,
      };

      return base;
    }, [initial, shouldAnimate, variantStyle.style, delay, staggerIndex, style]);

    // Merge class names
    const mergedClassName = useMemo(() => {
      const classes: string[] = [];

      // Add variant class if animating
      if (shouldAnimate && variantStyle.className) {
        classes.push(variantStyle.className);
      }

      // Add user class
      if (className) {
        classes.push(className);
      }

      return classes.join(' ').trim();
    }, [shouldAnimate, variantStyle.className, className]);

    // Render component with proper type safety
    const props: any = {
      ref,
      className: mergedClassName,
      style: mergedStyle,
      'data-animation': shouldAnimate ? variant : 'disabled',
      'data-capability': capability,
    };

    return React.createElement(Component as any, props, children);
  }
);

AnimatedContainer.displayName = 'AnimatedContainer';

// =============================================================================
// PRESET VARIANTS (for convenience)
// =============================================================================

/**
 * Fade in animation
 */
export const FadeInContainer = React.forwardRef<HTMLDivElement, Omit<AnimatedContainerProps, 'variant'>>(
  (props, ref) => <AnimatedContainer {...props} ref={ref} variant="fadeIn" />
);
FadeInContainer.displayName = 'FadeInContainer';

/**
 * Slide up animation (for cards, modals, etc.)
 */
export const SlideUpContainer = React.forwardRef<HTMLDivElement, Omit<AnimatedContainerProps, 'variant'>>(
  (props, ref) => <AnimatedContainer {...props} ref={ref} variant="slideUp" />
);
SlideUpContainer.displayName = 'SlideUpContainer';

/**
 * Slide left animation
 */
export const SlideLeftContainer = React.forwardRef<HTMLDivElement, Omit<AnimatedContainerProps, 'variant'>>(
  (props, ref) => <AnimatedContainer {...props} ref={ref} variant="slideLeft" />
);
SlideLeftContainer.displayName = 'SlideLeftContainer';

/**
 * Slide right animation
 */
export const SlideRightContainer = React.forwardRef<HTMLDivElement, Omit<AnimatedContainerProps, 'variant'>>(
  (props, ref) => <AnimatedContainer {...props} ref={ref} variant="slideRight" />
);
SlideRightContainer.displayName = 'SlideRightContainer';

/**
 * Scale in animation (for emphasis)
 */
export const ScaleInContainer = React.forwardRef<HTMLDivElement, Omit<AnimatedContainerProps, 'variant'>>(
  (props, ref) => <AnimatedContainer {...props} ref={ref} variant="scaleIn" />
);
ScaleInContainer.displayName = 'ScaleInContainer';

// =============================================================================
// STAGGER CONTAINER (for animating lists)
// =============================================================================

interface StaggerContainerProps extends Omit<AnimatedContainerProps, 'variant' | 'staggerIndex'> {
  /**
   * Variant to apply to each child
   * @default 'fadeIn'
   */
  childVariant?: VariantName;

  /**
   * Delay between each child animation (ms)
   * @default 50
   */
  staggerDelay?: number;
}

/**
 * Container that automatically staggers its children
 *
 * Usage:
 * ```tsx
 * <StaggerContainer>
 *   <Item />
 *   <Item />
 *   <Item />
 * </StaggerContainer>
 * ```
 */
export const StaggerContainer = React.forwardRef<HTMLDivElement, StaggerContainerProps>(
  (
    {
      childVariant = 'fadeIn',
      staggerDelay = 50,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const childArray = React.Children.toArray(children);

    return (
      <div ref={ref} className={className} {...props}>
        {childArray.map((child, index) => (
          <AnimatedContainer
            key={index}
            variant={childVariant}
            delay={index * staggerDelay}
            staggerIndex={index}
          >
            {child}
          </AnimatedContainer>
        ))}
      </div>
    );
  }
);

StaggerContainer.displayName = 'StaggerContainer';

// =============================================================================
// CONDITIONAL ANIMATION WRAPPER
// =============================================================================

interface ConditionalAnimationProps extends Omit<AnimatedContainerProps, 'animate'> {
  /**
   * Condition that determines if animation should play
   * Animation will be disabled if false
   */
  when: boolean;
}

/**
 * Animation wrapper with conditional logic
 *
 * Usage:
 * ```tsx
 * <ConditionalAnimation when={isLoaded} variant="slideUp">
 *   <Content />
 * </ConditionalAnimation>
 * ```
 */
export const ConditionalAnimation = React.forwardRef<HTMLDivElement, ConditionalAnimationProps>(
  ({ when, ...props }, ref) => (
    <AnimatedContainer {...props} ref={ref} animate={when} />
  )
);

ConditionalAnimation.displayName = 'ConditionalAnimation';
