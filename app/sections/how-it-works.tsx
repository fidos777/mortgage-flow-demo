// app/sections/how-it-works.tsx
// How It Works Section with Step Cards
// Integrates: StepCards, Accordion, AnimatedContainer

'use client'

import { AnimatedContainer } from '@/components/ui/animated-container'
import { StepCards } from '@/components/ui/step-cards'
import { Accordion } from '@/components/ui/accordion'
import { Building2, User, Briefcase, Clock } from 'lucide-react'

// ==========================================
// Steps Data
// ==========================================

const steps = [
  {
    number: 1,
    title: 'Pemaju Cipta Link Invitation',
    description: 'Pemaju generate link unik untuk projek mereka. Link ini dihantar kepada pembeli melalui WhatsApp, QR code, atau galeri jualan.',
    duration: '2 min',
    persona: 'pemaju' as const,
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    number: 2,
    title: 'Pembeli Semak Kelayakan',
    description: 'Pembeli klik link, beri persetujuan PDPA, dan isi PreScan 7 langkah. Sistem kira DSR secara automatik.',
    duration: '5 min',
    persona: 'pembeli' as const,
    icon: <User className="w-5 h-5" />,
  },
  {
    number: 3,
    title: 'Ejen Proses Penghantaran',
    description: 'Ejen terima kes ready-to-go. Guna Portal Submission Kit untuk review, draft, copy data ke portal LPPSA rasmi.',
    duration: '8 min',
    persona: 'ejen' as const,
    icon: <Briefcase className="w-5 h-5" />,
  },
]

// ==========================================
// Timeline Component (Desktop)
// ==========================================

function Timeline() {
  const personaColors = {
    pemaju: { bg: 'bg-pemaju', border: 'border-pemaju', text: 'text-pemaju' },
    pembeli: { bg: 'bg-pembeli', border: 'border-pembeli', text: 'text-pembeli' },
    ejen: { bg: 'bg-ejen', border: 'border-ejen', text: 'text-ejen' },
  }

  return (
    <div className="relative">
      {/* Horizontal line */}
      <div className="absolute top-6 left-[10%] right-[10%] h-1 bg-gradient-to-r from-pemaju via-pembeli to-ejen rounded-full" />
      
      {/* Steps */}
      <div className="grid grid-cols-3 gap-4">
        {steps.map((step, index) => {
          const colors = personaColors[step.persona]
          
          return (
            <AnimatedContainer key={step.number}>
              <div className="flex flex-col items-center text-center">
                {/* Node */}
                <div className={`
                  relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg
                  ${colors.bg}
                `}>
                  {step.number}
                </div>
                
                {/* Content */}
                <div className="mt-6 p-4 bg-white rounded-xl border border-neutral-100 shadow-sm w-full">
                  <h3 className={`font-semibold mb-1 ${colors.text}`}>
                    {step.title}
                  </h3>
                  <div className="flex items-center justify-center gap-1 text-xs text-neutral-500 mb-3">
                    <Clock className="w-3 h-3" />
                    <span>{step.duration}</span>
                  </div>
                  <p className="text-sm text-neutral-600">
                    {step.description}
                  </p>
                </div>
              </div>
            </AnimatedContainer>
          )
        })}
      </div>
    </div>
  )
}

// ==========================================
// How It Works Section
// ==========================================

export function HowItWorksSection() {
  // Convert steps to accordion items format
  const accordionItems = steps.map((step) => ({
    id: `step-${step.number}`,
    title: `${step.number}. ${step.title}`,
    badge: step.duration,
    content: (
      <p className="text-neutral-600">{step.description}</p>
    ),
  }))

  return (
    <section id="how" className="py-12 sm:py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <AnimatedContainer>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center mb-3">
            Tiga langkah. Satu aliran.
          </h2>
          <p className="text-center text-neutral-600 mb-10 max-w-xl mx-auto">
            Aliran mengikut kausaliti data — pemaju cipta projek, pembeli semak kelayakan, ejen proses penghantaran.
          </p>
        </AnimatedContainer>

        {/* Mobile: Accordion */}
        <div className="lg:hidden">
          <Accordion 
            items={accordionItems}
            defaultOpenIndex={0}
          />
        </div>

        {/* Desktop: Timeline */}
        <div className="hidden lg:block">
          <Timeline />
        </div>
      </div>
    </section>
  )
}
