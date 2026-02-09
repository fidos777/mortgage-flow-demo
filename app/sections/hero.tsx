// app/sections/hero.tsx
// Hero Section with Langkah Tiga pattern
// Integrates: AnimatedContainer, PrivacyNoteCTA, TouchButton

'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { AnimatedContainer } from '@/components/ui/animated-container'
import { PrivacyNoteCTA } from '@/components/trust'
import { TouchButton } from '@/components/mobile'
import { useAnimationCapability } from '@/lib/hooks/use-animation'
import { Play, ArrowRight } from 'lucide-react'

// ==========================================
// Langkah Tiga Pattern (Animated SVG)
// ==========================================

function LangkahTiga() {
  const animationTier = useAnimationCapability()
  const shouldAnimate = animationTier === 'full'

  return (
    <svg 
      viewBox="0 0 800 120" 
      className="w-full max-w-3xl mx-auto"
      aria-label="Aliran tiga langkah: Pemaju, Pembeli, Ejen"
    >
      <defs>
        <linearGradient id="senang-flow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="50%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {shouldAnimate && (
          <style>
            {`
              @keyframes flowPath {
                0% { stroke-dashoffset: 600; }
                100% { stroke-dashoffset: 0; }
              }
              @keyframes nodePulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
              }
              .flow-path { animation: flowPath 2s ease-in-out forwards; }
              .node-1 { animation: nodePulse 2s ease-in-out infinite; animation-delay: 0s; }
              .node-2 { animation: nodePulse 2s ease-in-out infinite; animation-delay: 0.5s; }
              .node-3 { animation: nodePulse 2s ease-in-out infinite; animation-delay: 1s; }
            `}
          </style>
        )}
      </defs>

      {/* Background path */}
      <path 
        d="M100,50 Q250,15 400,50 T700,50" 
        stroke="#e5e7eb" 
        strokeWidth="4" 
        fill="none"
        strokeLinecap="round"
      />

      {/* Animated flowing path */}
      <path 
        d="M100,50 Q250,15 400,50 T700,50" 
        stroke="url(#senang-flow)" 
        strokeWidth="4" 
        fill="none"
        strokeLinecap="round"
        strokeDasharray="600"
        strokeDashoffset={shouldAnimate ? "600" : "0"}
        className={shouldAnimate ? 'flow-path' : ''}
        filter="url(#glow)"
      />

      {/* Node 1: Pemaju */}
      <g className={shouldAnimate ? 'node-1' : ''} style={{ transformOrigin: '100px 50px' }}>
        <circle cx="100" cy="50" r="22" fill="#1e40af" filter="url(#glow)" />
        <circle cx="100" cy="50" r="16" fill="white" />
        <text x="100" y="55" textAnchor="middle" fill="#1e40af" fontSize="14" fontWeight="600">1</text>
      </g>
      <text x="100" y="95" textAnchor="middle" fill="#1e40af" fontSize="13" fontWeight="500" fontFamily="Poppins, sans-serif">
        Pemaju
      </text>

      {/* Node 2: Pembeli */}
      <g className={shouldAnimate ? 'node-2' : ''} style={{ transformOrigin: '400px 50px' }}>
        <circle cx="400" cy="50" r="22" fill="#0891b2" filter="url(#glow)" />
        <circle cx="400" cy="50" r="16" fill="white" />
        <text x="400" y="55" textAnchor="middle" fill="#0891b2" fontSize="14" fontWeight="600">2</text>
      </g>
      <text x="400" y="95" textAnchor="middle" fill="#0891b2" fontSize="13" fontWeight="500" fontFamily="Poppins, sans-serif">
        Pembeli
      </text>

      {/* Node 3: Ejen */}
      <g className={shouldAnimate ? 'node-3' : ''} style={{ transformOrigin: '700px 50px' }}>
        <circle cx="700" cy="50" r="22" fill="#0d9488" filter="url(#glow)" />
        <circle cx="700" cy="50" r="16" fill="white" />
        <text x="700" y="55" textAnchor="middle" fill="#0d9488" fontSize="14" fontWeight="600">3</text>
      </g>
      <text x="700" y="95" textAnchor="middle" fill="#0d9488" fontSize="13" fontWeight="500" fontFamily="Poppins, sans-serif">
        Ejen
      </text>
    </svg>
  )
}

// ==========================================
// Wave Background
// ==========================================

function GelombangTenang() {
  const animationTier = useAnimationCapability()
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg 
        viewBox="0 0 1440 320" 
        className="absolute bottom-0 w-[200%] opacity-[0.03]"
        preserveAspectRatio="none"
        style={{ 
          animation: animationTier === 'full' ? 'waveDrift 60s linear infinite' : 'none',
        }}
      >
        <path 
          fill="#1e40af" 
          d="M0,160L48,170.7C96,181,192,203,288,192C384,181,480,139,576,128C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L0,320Z"
        />
      </svg>
      <style jsx>{`
        @keyframes waveDrift {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

// ==========================================
// Hero Section
// ==========================================

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden bg-gradient-to-b from-white to-blue-50/30">
      {/* Background */}
      <GelombangTenang />
      
      {/* Decorative blurs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Badge */}
        <AnimatedContainer animation="fade-up" delay={0}>
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              Platform Kesediaan LPPSA
            </span>
          </div>
        </AnimatedContainer>

        {/* Main headline */}
        <AnimatedContainer animation="fade-up" delay={100}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center text-primary-dark leading-tight">
            Semak Kelayakan Rumah,
            <br />
            <span className="text-secondary">Tanpa Leceh</span>
          </h1>
        </AnimatedContainer>

        {/* Subheadline */}
        <AnimatedContainer animation="fade-up" delay={200}>
          <p className="mt-6 text-lg sm:text-xl text-center text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Kami jadikan proses pinjaman rumah anda lebih senang — dari semakan pertama 
            hingga penghantaran terakhir. Untuk pembeli, pemaju, dan ejen.
          </p>
        </AnimatedContainer>

        {/* Langkah Tiga Pattern */}
        <AnimatedContainer animation="fade-up" delay={300}>
          <div className="mt-10 mb-8 hidden sm:block">
            <LangkahTiga />
          </div>
        </AnimatedContainer>

        {/* CTAs */}
        <AnimatedContainer animation="fade-up" delay={400}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Link href="/buyer">
              <TouchButton 
                variant="primary" 
                size="lg"
                className="group shadow-lg shadow-primary/25"
              >
                Mula Semakan Sekarang
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </TouchButton>
            </Link>
            <Link href="#how">
              <TouchButton variant="outline" size="lg">
                <Play className="w-5 h-5" />
                Lihat Cara Guna
              </TouchButton>
            </Link>
          </div>
        </AnimatedContainer>

        {/* Privacy Note */}
        <AnimatedContainer animation="fade-up" delay={500}>
          <PrivacyNoteCTA locale="ms" className="mt-4" />
        </AnimatedContainer>

        {/* Trust line */}
        <AnimatedContainer animation="fade-up" delay={600}>
          <p className="text-center text-sm text-neutral-500 mt-2">
            Percuma. Tiada pendaftaran diperlukan. Semakan 5 minit.
          </p>
        </AnimatedContainer>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden sm:block">
        <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}
