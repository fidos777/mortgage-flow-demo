// app/sections/social-proof.tsx
// Social Proof Section with Beta Placeholder
// Integrates: AnimatedContainer, TouchButton

'use client'

import Link from 'next/link'
import { AnimatedContainer } from '@/components/ui/animated-container'
import { TouchButton } from '@/components/mobile'
import { Building2, MessageSquare, Trophy, ArrowRight } from 'lucide-react'

// ==========================================
// Beta Benefit Card
// ==========================================

interface BetaBenefitProps {
  icon: React.ReactNode
  title: string
  description: string
}

function BetaBenefit({ icon, title, description }: BetaBenefitProps) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-neutral-700 text-sm">{title}</h3>
      <p className="text-xs text-neutral-500 mt-1">{description}</p>
    </div>
  )
}

// ==========================================
// Placeholder Logo Card
// ==========================================

function PlaceholderLogo({ index }: { index: number }) {
  // Different icons for visual variety
  const icons = ['🏢', '🏗️', '🏠', '🏛️']

  return (
    <div className="bg-gradient-to-br from-neutral-50 to-white rounded-xl border border-neutral-200 p-6 flex flex-col items-center justify-center min-h-[120px] hover:border-primary/30 hover:shadow-sm transition-all group">
      <div className="w-14 h-14 bg-primary/5 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
        <span className="text-2xl opacity-50 group-hover:opacity-70 transition-opacity">
          {icons[index - 1]}
        </span>
      </div>
      <span className="text-xs font-medium text-neutral-400 group-hover:text-primary/60 transition-colors">
        Slot Tersedia
      </span>
    </div>
  )
}

// ==========================================
// Social Proof Section
// ==========================================

export function SocialProofSection() {
  const benefits = [
    {
      icon: <span className="text-xl">🎯</span>,
      title: 'Akses Awal',
      description: 'Guna platform sebelum pelancaran umum',
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-secondary" />,
      title: 'Suara Anda Didengari',
      description: 'Maklum balas anda membentuk produk',
    },
    {
      icon: <Trophy className="w-5 h-5 text-trust" />,
      title: 'Harga Istimewa',
      description: 'Kadar khas untuk rakan beta',
    },
  ]

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <AnimatedContainer>
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 bg-trust/10 text-trust px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Building2 className="w-4 h-4" />
              Dalam Pembangunan Bersama
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
              Program Rakan Beta
            </h2>
            <p className="text-neutral-600 mt-3 max-w-xl mx-auto">
              Kami sedang bekerjasama dengan pemaju terpilih untuk memperhalusi platform ini 
              sebelum pelancaran penuh.
            </p>
          </div>
        </AnimatedContainer>

        {/* Placeholder Logos */}
        <AnimatedContainer>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <PlaceholderLogo key={i} index={i} />
            ))}
          </div>
        </AnimatedContainer>

        {/* CTA */}
        <AnimatedContainer>
          <div className="text-center mb-10">
            <p className="text-neutral-600 mb-4">
              Berminat menjadi antara yang pertama menggunakan Snang.my?
            </p>
            <Link href="/hubungi-kami">
              <TouchButton variant="primary" size="md">
                Mohon Sebagai Rakan Beta
                <ArrowRight className="w-4 h-4" />
              </TouchButton>
            </Link>
          </div>
        </AnimatedContainer>

        {/* Benefits */}
        <AnimatedContainer>
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-neutral-100">
            {benefits.map((benefit) => (
              <BetaBenefit key={benefit.title} {...benefit} />
            ))}
          </div>
        </AnimatedContainer>
      </div>
    </section>
  )
}
