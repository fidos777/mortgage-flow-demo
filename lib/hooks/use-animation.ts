'use client';

/**
 * @scope VISUAL ONLY - Presentation Layer
 * Animation hooks for performance-aware motion.
 *
 * ⚠️ BOUNDARIES:
 * - Does NOT make API calls
 * - Does NOT send telemetry
 * - Does NOT persist to server
 * - Client-side detection only
 *
 * @see /docs/UI-AMENDMENTS.md
 */

import { useEffect, useState, useCallback, useRef } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export type AnimationCapability = 'full' | 'reduced' | 'none';

interface DeviceMetrics {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  connectionSpeed?: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  prefersReducedMotion: boolean;
}

interface FPSData {
  current: number;
  average: number;
  isDegraded: boolean;
}

// =============================================================================
// CAPABILITY DETECTION
// =============================================================================

/**
 * Detects device animation capability based on hardware and preferences.
 *
 * Factors:
 * - Device memory < 4GB → reduced
 * - CPU cores < 2 → reduced
 * - Connection type slow-2g/2g/3g → reduced
 * - prefers-reduced-motion → none
 *
 * @returns 'full' | 'reduced' | 'none'
 */
export function useAnimationCapability(): AnimationCapability {
  const [capability, setCapability] = useState<AnimationCapability>('full');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Gather device metrics
    const metrics: DeviceMetrics = {
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      connectionSpeed: (navigator as any).connection?.effectiveType,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };

    // Determine capability tier
    let determined: AnimationCapability = 'full';

    // Strict: if user prefers reduced motion, don't animate at all
    if (metrics.prefersReducedMotion) {
      determined = 'none';
    }
    // Soft constraints for reduced animations
    else if (
      (metrics.deviceMemory && metrics.deviceMemory < 4) ||
      (metrics.hardwareConcurrency && metrics.hardwareConcurrency < 2) ||
      metrics.connectionSpeed === 'slow-2g' ||
      metrics.connectionSpeed === '2g' ||
      metrics.connectionSpeed === '3g'
    ) {
      determined = 'reduced';
    }

    setCapability(determined);
  }, []);

  // Return 'full' on server, actual value on client
  return mounted ? capability : 'full';
}

// =============================================================================
// USER PREFERENCE TOGGLE
// =============================================================================

interface AnimationToggleState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
}

const ANIMATION_STORAGE_KEY = 'snang-animations-enabled';

/**
 * Manages user's animation preference in localStorage.
 * Respects NEXT_PUBLIC_ENABLE_ANIMATION feature flag.
 *
 * @returns {enabled, setEnabled, toggle}
 */
export function useAnimationToggle(): AnimationToggleState {
  const [enabled, setEnabledState] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);

    // Check feature flag first
    const flagEnabled = process.env.NEXT_PUBLIC_ENABLE_ANIMATION !== 'false';
    if (!flagEnabled) {
      setEnabledState(false);
      return;
    }

    // Load user preference
    try {
      const stored = localStorage.getItem(ANIMATION_STORAGE_KEY);
      if (stored !== null) {
        setEnabledState(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to read animation preference:', error);
    }
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    try {
      localStorage.setItem(ANIMATION_STORAGE_KEY, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save animation preference:', error);
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled(!enabled);
  }, [enabled, setEnabled]);

  return { enabled: mounted ? enabled : true, setEnabled, toggle };
}

// =============================================================================
// FPS MONITORING & AUTO-DEGRADE
// =============================================================================

interface UseFPSMonitorOptions {
  threshold?: number; // FPS threshold for degradation (default: 30)
  sampleSize?: number; // Number of frames to sample (default: 60)
  onDegraded?: (fps: number) => void;
}

/**
 * Monitors frame rate and auto-degrades animations if FPS drops below threshold.
 *
 * @param options Configuration for monitoring
 * @returns Current FPS data
 */
export function useFPSMonitor(options: UseFPSMonitorOptions = {}): FPSData {
  const {
    threshold = 30,
    sampleSize = 60,
    onDegraded,
  } = options;

  const [fpsData, setFpsData] = useState<FPSData>({
    current: 60,
    average: 60,
    isDegraded: false,
  });

  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const animationIdRef = useRef<number | null>(null);
  const degradedRef = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const measureFrame = () => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (delta > 0) {
        const fps = Math.round(1000 / delta);
        frameTimesRef.current.push(fps);

        // Keep only last sampleSize measurements
        if (frameTimesRef.current.length > sampleSize) {
          frameTimesRef.current.shift();
        }

        frameCountRef.current++;

        // Update state every 10 frames
        if (frameCountRef.current % 10 === 0 && mounted) {
          const average = Math.round(
            frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length
          );
          const isDegraded = average < threshold;

          setFpsData({
            current: fps,
            average,
            isDegraded,
          });

          // Notify if status changed
          if (isDegraded && !degradedRef.current) {
            degradedRef.current = true;
            onDegraded?.(average);
          } else if (!isDegraded && degradedRef.current) {
            degradedRef.current = false;
          }
        }
      }

      animationIdRef.current = requestAnimationFrame(measureFrame);
    };

    // Start monitoring after a short delay
    const timeoutId = setTimeout(() => {
      animationIdRef.current = requestAnimationFrame(measureFrame);
    }, 100);

    return () => {
      mounted = false;
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
      clearTimeout(timeoutId);
    };
  }, [threshold, sampleSize, onDegraded]);

  return fpsData;
}

// =============================================================================
// SCROLL ANIMATION TRIGGER
// =============================================================================

interface UseAnimateOnScrollOptions {
  threshold?: number | number[]; // IntersectionObserver threshold (default: 0.1)
  rootMargin?: string; // IntersectionObserver rootMargin (default: '0px')
}

/**
 * Provides IntersectionObserver ref for scroll-triggered animations.
 * Returns a ref to attach to animatable elements.
 *
 * Typical usage:
 * ```tsx
 * const { ref, isVisible } = useAnimateOnScroll();
 * return <div ref={ref}>{isVisible && 'Animate me!'}</div>
 * ```
 *
 * @param options Configuration for intersection observer
 * @returns {ref, isVisible}
 */
export function useAnimateOnScroll(
  options: UseAnimateOnScrollOptions = {}
): {
  ref: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
} {
  const { threshold = 0.1, rootMargin = '0px' } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    // Check if IntersectionObserver is available
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: assume visible if observer not available
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
    };
  }, [threshold, rootMargin]);

  return { ref, isVisible };
}

// =============================================================================
// COMBINED ANIMATION STATE
// =============================================================================

interface UseAnimationStateReturn {
  capability: AnimationCapability;
  userEnabled: boolean;
  fpsData: FPSData;
  isAnimationSafe: boolean;
  setUserEnabled: (enabled: boolean) => void;
  toggleAnimation: () => void;
}

/**
 * Combines all animation state into a single hook.
 * Useful for components that need complete animation control.
 *
 * @param enableFPSMonitoring Whether to track FPS (default: false)
 * @returns Combined animation state
 */
export function useAnimationState(enableFPSMonitoring = false): UseAnimationStateReturn {
  const capability = useAnimationCapability();
  const { enabled: userEnabled, setEnabled: setUserEnabled, toggle: toggleAnimation } = useAnimationToggle();
  const fpsData = useFPSMonitor({
    onDegraded: () => {
      // Could auto-disable here if desired
    },
  });

  // Only animate if:
  // 1. Feature flag is enabled
  // 2. User hasn't disabled it
  // 3. Device capability allows it (not 'none')
  // 4. FPS is healthy (if monitoring)
  const isAnimationSafe =
    process.env.NEXT_PUBLIC_ENABLE_ANIMATION !== 'false' &&
    userEnabled &&
    capability !== 'none' &&
    (!enableFPSMonitoring || !fpsData.isDegraded);

  return {
    capability,
    userEnabled,
    fpsData,
    isAnimationSafe,
    setUserEnabled,
    toggleAnimation,
  };
}
