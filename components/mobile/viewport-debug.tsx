/**
 * @component ViewportDebug
 * @scope VISUAL ONLY - Development Tool
 *
 * Shows current viewport size and breakpoint for testing.
 * Only renders in development mode.
 *
 * ⚠️ BOUNDARIES:
 * - Development only (process.env.NODE_ENV)
 * - No API calls
 * - No analytics
 *
 * @see /docs/UI-AMENDMENTS.md
 */

'use client';

import { useState, useEffect } from 'react';

interface ViewportDebugProps {
  /** Position on screen */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Always show (even in production) - use with caution */
  forceShow?: boolean;
}

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints: Record<Breakpoint, number> = {
  'xs': 375,
  'sm': 640,
  'md': 768,
  'lg': 1024,
  'xl': 1280,
  '2xl': 1536,
};

const positionStyles = {
  'top-left': 'top-2 left-2',
  'top-right': 'top-2 right-2',
  'bottom-left': 'bottom-2 left-2',
  'bottom-right': 'bottom-2 right-2',
};

function getBreakpoint(width: number): Breakpoint {
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints['xl']) return 'xl';
  if (width >= breakpoints['lg']) return 'lg';
  if (width >= breakpoints['md']) return 'md';
  if (width >= breakpoints['sm']) return 'sm';
  return 'xs';
}

export function ViewportDebug({
  position = 'bottom-right',
  forceShow = false,
}: ViewportDebugProps) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Only show in development or if forced
  if (!isMounted) return null;
  if (process.env.NODE_ENV !== 'development' && !forceShow) return null;

  const breakpoint = getBreakpoint(viewport.width);

  const breakpointColors: Record<Breakpoint, string> = {
    'xs': 'bg-red-500',
    'sm': 'bg-orange-500',
    'md': 'bg-yellow-500',
    'lg': 'bg-green-500',
    'xl': 'bg-blue-500',
    '2xl': 'bg-purple-500',
  };

  return (
    <div
      className={`
        fixed ${positionStyles[position]} z-[9999]
        flex items-center gap-2
        px-2 py-1 rounded-md
        bg-black/80 text-white text-xs font-mono
        pointer-events-none
        select-none
      `}
    >
      <span className={`w-2 h-2 rounded-full ${breakpointColors[breakpoint]}`} />
      <span className="font-bold">{breakpoint.toUpperCase()}</span>
      <span className="text-white/60">
        {viewport.width} × {viewport.height}
      </span>
    </div>
  );
}

/**
 * DeviceSimulator - Test different screen sizes
 * Only for development
 */
interface DeviceSimulatorProps {
  children: React.ReactNode;
  device?: 'iphone-se' | 'iphone-14' | 'android-small' | 'android-mid' | 'tablet';
}

const deviceSizes = {
  'iphone-se': { width: 375, height: 667 },
  'iphone-14': { width: 390, height: 844 },
  'android-small': { width: 360, height: 640 },
  'android-mid': { width: 412, height: 915 },
  'tablet': { width: 768, height: 1024 },
};

export function DeviceSimulator({
  children,
  device = 'android-small',
}: DeviceSimulatorProps) {
  if (process.env.NODE_ENV !== 'development') {
    return <>{children}</>;
  }

  const size = deviceSizes[device];

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 p-8">
      <div
        className="relative bg-white overflow-auto rounded-lg shadow-2xl border-4 border-slate-800"
        style={{
          width: size.width,
          height: size.height,
          maxHeight: '90vh',
        }}
      >
        <div className="absolute top-0 left-0 right-0 bg-slate-800 text-white text-xs text-center py-1 z-50">
          {device} ({size.width}×{size.height})
        </div>
        <div className="pt-6">{children}</div>
      </div>
    </div>
  );
}

export default ViewportDebug;
