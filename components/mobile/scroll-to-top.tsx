/**
 * @component ScrollToTop
 * @scope VISUAL ONLY - Presentation Layer
 *
 * Floating scroll-to-top button for mobile users.
 *
 * ⚠️ BOUNDARIES:
 * - No API calls
 * - No analytics tracking
 * - Client-side scroll only
 *
 * @see /docs/UI-AMENDMENTS.md
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronUp } from 'lucide-react';

interface ScrollToTopProps {
  /** Scroll threshold before button appears (px) */
  threshold?: number;
  /** Position from bottom (includes safe area) */
  bottomOffset?: number;
  /** Show on mobile only */
  mobileOnly?: boolean;
  /** Custom className */
  className?: string;
}

export function ScrollToTop({
  threshold = 400,
  bottomOffset = 80,
  mobileOnly = true,
  className = '',
}: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Hydration safety
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Scroll detection
  useEffect(() => {
    if (!isMounted) return;

    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(scrollY > threshold);
    };

    // Throttle scroll handler
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', throttledScroll);
  }, [isMounted, threshold]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  // Don't render during SSR
  if (!isMounted) return null;

  // Mobile-only check
  if (mobileOnly && typeof window !== 'undefined' && window.innerWidth > 640) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll ke atas"
      className={`
        fixed right-4 z-50
        min-w-touch min-h-touch
        flex items-center justify-center
        bg-snang-teal-600 text-white
        rounded-full shadow-lg
        transition-all duration-300
        hover:bg-snang-teal-700
        focus:outline-none focus:ring-2 focus:ring-snang-teal-500 focus:ring-offset-2
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        ${className}
      `}
      style={{
        bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))`,
      }}
    >
      <ChevronUp className="w-6 h-6" />
    </button>
  );
}

export default ScrollToTop;
