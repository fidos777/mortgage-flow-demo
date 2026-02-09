// app/sections/personas.tsx
// Personas Section with Expandable Cards
// Integrates: ExpandableCard, AnimatedContainer, Persona colors

'use client'

import { AnimatedContainer } from '@/components/ui/animated-container'
import { ExpandableCard } from '@/components/ui/expandable-card'
import { Building2, User, Briefcase, Check } from 'lucide-react'

// ==========================================
// Feature List Component
// ==========================================

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="space-y-2 mt-3">
      {features.map((feature, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <Check className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  )
}

// ==========================================
// Personas Section
// ==========================================

export function PersonasSection() {
  const personas = [
    {
      number: 1,
      title: 'Pemaju',
      subtitle: 'Pantau Pipeline Projek',
      description: 'Lihat berapa pembeli di setiap stage — tanpa akses data individu. Privacy by design.',
      features: [
        'Dashboard agregat dengan conversion rates',
        'Generate link invitation untuk pembeli baru',
        'Proof events log untuk audit trail',
        'Tiada akses data individu (PRD 9.2)',
      ],
      accentColor: 'pemaju' as const,
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      number: 2,
      title: 'Pembeli',
      subtitle: 'Semak Kelayakan Sendiri',
      description: 'Isi maklumat dalam 7 langkah. Dapat keputusan DSR serta-merta. Tahu status kesediaan.',
      features: [
        'PreScan 7 langkah dengan validasi real-time',
        'Pengiraan DSR automatik (isyarat kesediaan)',
        'Persetujuan PDPA direkod sebagai proof event',
        'Tiada login — akses melalui link unik',
      ],
      accentColor: 'pembeli' as const,
      icon: <User className="w-5 h-5" />,
    },
    {
      number: 3,
      title: 'Ejen',
      subtitle: 'Urus Kes Dengan Mudah',
      description: 'Terima kes yang sudah ready. Copy data ke portal rasmi. Declare submission secara manual.',
      features: [
        'Dashboard kes dengan filter status',
        'Portal Submission Kit (4 langkah)',
        'TAC Attestation dengan timer 180s',
        'Ejen submit manual — AI bantu, bukan ganti',
      ],
      accentColor: 'ejen' as const,
      icon: <Briefcase className="w-5 h-5" />,
    },
  ]

  return (
    <section id="personas" className="py-12 sm:py-16 bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <AnimatedContainer animation="fade-up">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center mb-3">
            Satu platform, tiga peranan
          </h2>
          <p className="text-center text-neutral-600 mb-8 max-w-xl mx-auto">
            Setiap stakeholder nampak apa yang relevan — dan hanya apa yang dibenarkan.
          </p>
        </AnimatedContainer>

        {/* Mobile: Stack of expandable cards */}
        <div className="lg:hidden space-y-3">
          {personas.map((persona, index) => (
            <AnimatedContainer key={persona.title} animation="fade-up" delay={index * 100}>
              <ExpandableCard
                number={persona.number}
                title={persona.title}
                subtitle={persona.subtitle}
                accentColor={persona.accentColor}
                previewContent={
                  <span className="line-clamp-2">{persona.description}</span>
                }
                expandedContent={
                  <>
                    <p className="mb-3">{persona.description}</p>
                    <FeatureList features={persona.features} />
                  </>
                }
              />
            </AnimatedContainer>
          ))}
        </div>

        {/* Desktop: Grid of full cards */}
        <div className="hidden lg:grid grid-cols-3 gap-6">
          {personas.map((persona, index) => (
            <AnimatedContainer key={persona.title} animation="fade-up" delay={index * 100}>
              <div className={`
                bg-white rounded-xl overflow-hidden border-2 shadow-sm hover:shadow-md transition-shadow
                ${persona.accentColor === 'pemaju' ? 'border-pemaju/20 hover:border-pemaju/40' : ''}
                ${persona.accentColor === 'pembeli' ? 'border-pembeli/20 hover:border-pembeli/40' : ''}
                ${persona.accentColor === 'ejen' ? 'border-ejen/20 hover:border-ejen/40' : ''}
              `}>
                {/* Header */}
                <div className={`
                  p-4 text-white
                  ${persona.accentColor === 'pemaju' ? 'bg-pemaju' : ''}
                  ${persona.accentColor === 'pembeli' ? 'bg-pembeli' : ''}
                  ${persona.accentColor === 'ejen' ? 'bg-ejen' : ''}
                `}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">
                      {persona.number}
                    </div>
                    <div>
                      <h3 className="font-semibold">{persona.title}</h3>
                      <p className="text-sm text-white/80">{persona.subtitle}</p>
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-5">
                  <p className="text-neutral-600 text-sm mb-4">
                    {persona.description}
                  </p>
                  <FeatureList features={persona.features} />
                </div>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>
    </section>
  )
}
