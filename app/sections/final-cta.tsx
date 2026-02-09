// app/sections/final-cta.tsx
// Final CTA Section
// Integrates: AnimatedContainer, TouchButton, PrivacyNoteCTA

'use client'

import Link from 'next/link'
import { AnimatedContainer } from '@/components/ui/animated-container'
import { TouchButton } from '@/components/mobile'
import { PrivacyNoteCTA } from '@/components/trust'
import { ArrowRight, AlertTriangle } from 'lucide-react'

export function FinalCTASection() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-primary/5">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <AnimatedContainer animation="fade-up">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-4">
            Lihat sendiri bagaimana ia berfungsi
          </h2>
          <p className="text-neutral-600 mb-8 max-w-xl mx-auto">
            Cuba demo interaktif kami — tiada pendaftaran, tiada komitmen. 
            Lihat aliran penuh dari Pemaju hingga Ejen dalam 5 minit.
          </p>
        </AnimatedContainer>

        <AnimatedContainer animation="fade-up" delay={100}>
          <Link href="/buyer">
            <TouchButton 
              variant="primary" 
              size="lg"
              className="shadow-lg shadow-primary/25"
            >
              Mula Semakan Sekarang
              <ArrowRight className="w-5 h-5" />
            </TouchButton>
          </Link>
          
          <PrivacyNoteCTA locale="ms" className="mt-4" />
        </AnimatedContainer>

        {/* Disclaimer */}
        <AnimatedContainer animation="fade-up" delay={200}>
          <div className="mt-10 p-4 bg-amber-50 border border-amber-200 rounded-lg inline-flex items-start gap-3 text-left max-w-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Isyarat kesediaan sahaja</strong> — bukan kelulusan pinjaman. 
              Sistem ini untuk rujukan sahaja. Tiada penghantaran atau kelulusan 
              dilakukan oleh sistem.
            </p>
          </div>
        </AnimatedContainer>
      </div>
    </section>
  )
}
