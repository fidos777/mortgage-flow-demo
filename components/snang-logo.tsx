// components/snang-logo.tsx
// Animated Flowing S mark — 6 micro-animations
// Usage: <SnangLogo animation="breathe" size={28} />

'use client'

import { useId } from 'react'

const T = {
  300: '#5EEAD4',
  400: '#2DD4BF',
  600: '#0D9488',
}

export type LogoAnimation = 'draw' | 'breathe' | 'flow' | 'glow' | 'wave' | 'stamp' | 'none'

interface SnangLogoProps {
  animation?: LogoAnimation
  size?: number
  playing?: boolean
  className?: string
}

const S_PATH =
  'M20 10.5C20 10.5 18.5 8 15.5 8C12.5 8 10.5 10 10.5 12.5C10.5 15 12.5 16 15.5 16.5C18.5 17 21 18 21 21C21 23.5 18.5 25.5 15.5 25.5C12 25.5 10 23 10 23'
const S_PATH_LENGTH = 52

export function SnangLogo({
  animation = 'none',
  size = 32,
  playing = true,
  className,
}: SnangLogoProps) {
  const ns = useId().replace(/:/g, '')
  const sw = size <= 32 ? 3 : 2.5

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      style={{ overflow: 'visible' }}
      aria-label="Snang.my logo"
      role="img"
    >
      <defs>
        <filter id={`glow-${ns}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <radialGradient id={`dot-grad-${ns}`}>
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor={T[300]} />
        </radialGradient>
      </defs>

      <style>{`
        @keyframes ${ns}-draw {
          0% { stroke-dashoffset: ${S_PATH_LENGTH}; opacity: 0.3; }
          15% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes ${ns}-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes ${ns}-flowdot {
          0% { offset-distance: 0%; opacity: 0; }
          5% { opacity: 1; }
          90% { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        @keyframes ${ns}-glow-ring {
          0% { r: 14; opacity: 0.35; }
          50% { r: 17; opacity: 0; }
          100% { r: 14; opacity: 0; }
        }
        @keyframes ${ns}-glow-ring2 {
          0% { r: 14; opacity: 0.2; }
          60% { r: 19; opacity: 0; }
          100% { r: 14; opacity: 0; }
        }
        @keyframes ${ns}-wave1 {
          0%, 100% { d: path("M20 10.5C20 10.5 18.5 8 15.5 8C12.5 8 10.5 10 10.5 12.5C10.5 15 12.5 16 15.5 16.5C18.5 17 21 18 21 21C21 23.5 18.5 25.5 15.5 25.5C12 25.5 10 23 10 23"); }
          33% { d: path("M20 10.5C20 10.5 19 8 16 7.5C13 7.5 10.5 9.5 10 12.5C9.5 15.5 12 16.5 15.5 17C19 17.5 21.5 18.5 21 21.5C20.5 24 18 26 15.5 26C12.5 26 10 23.5 10 23.5"); }
          66% { d: path("M20 10.5C20 10.5 18 8.5 15 8.5C12 8.5 10.5 10.5 11 12.5C11.5 14.5 13 15.5 15.5 16C18 16.5 20.5 17.5 20.5 20.5C20.5 23 18 25 15.5 25C12.5 25 10.5 22.5 10.5 22.5"); }
        }
        @keyframes ${ns}-stamp {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.15); opacity: 1; }
          70% { transform: scale(0.95); }
          85% { transform: scale(1.03); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes ${ns}-stamp-flash {
          0% { opacity: 0; }
          40% { opacity: 0.4; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* Background */}
      <rect
        width="32"
        height="32"
        rx="6"
        fill={T[600]}
        style={
          animation === 'stamp' && playing
            ? {
                transformOrigin: '16px 16px',
                animation: `${ns}-stamp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
              }
            : animation === 'breathe' && playing
              ? {
                  transformOrigin: '16px 16px',
                  animation: `${ns}-breathe 3s ease-in-out infinite`,
                }
              : {}
        }
      />

      {/* Glow rings */}
      {animation === 'glow' && playing && (
        <>
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke={T[400]}
            strokeWidth="1.5"
            style={{ animation: `${ns}-glow-ring 2.4s ease-out infinite` }}
          />
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke={T[300]}
            strokeWidth="1"
            style={{ animation: `${ns}-glow-ring2 2.4s ease-out 0.4s infinite` }}
          />
        </>
      )}

      {/* Stamp flash */}
      {animation === 'stamp' && playing && (
        <rect
          width="32"
          height="32"
          rx="6"
          fill="white"
          style={{
            animation: `${ns}-stamp-flash 0.6s ease-out forwards`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* The S path */}
      <path
        d={S_PATH}
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        fill="none"
        style={
          animation === 'draw' && playing
            ? {
                strokeDasharray: S_PATH_LENGTH,
                strokeDashoffset: S_PATH_LENGTH,
                animation: `${ns}-draw 1s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
              }
            : animation === 'wave' && playing
              ? { animation: `${ns}-wave1 4s ease-in-out infinite` }
              : {}
        }
      />

      {/* Flow dots */}
      {animation === 'flow' && playing && (
        <>
          <circle
            r="2.5"
            fill={`url(#dot-grad-${ns})`}
            style={{
              offsetPath: `path("${S_PATH}")`,
              animation: `${ns}-flowdot 2s ease-in-out infinite`,
            }}
          />
          <circle
            r="2.5"
            fill={`url(#dot-grad-${ns})`}
            style={{
              offsetPath: `path("${S_PATH}")`,
              animation: `${ns}-flowdot 2s ease-in-out 0.8s infinite`,
              opacity: 0,
            }}
          />
        </>
      )}
    </svg>
  )
}
