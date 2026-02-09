// app/page.tsx
// snang.my Landing Page - Full Integration
// UI/UX Design Amendments v2.1

import { Metadata } from 'next'

// Trust Components
import { TrustStrip } from '@/components/trust'
import { TrustSection } from '@/components/trust'

// Progressive Disclosure
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { Accordion } from '@/components/ui/accordion'
import { ExpandableCard } from '@/components/ui/expandable-card'
import { StepCards } from '@/components/ui/step-cards'

// Mobile
import { ScrollToTop } from '@/components/mobile'
import { MobileContainer, MobileStack, MobileBottomBar } from '@/components/mobile'

// Animation
import { AnimatedContainer } from '@/components/ui/animated-container'

// Local Section Components (created below)
import { HeroSection } from './sections/hero'
import { StatsSection } from './sections/stats'
import { ProblemsSection } from './sections/problems'
import { PersonasSection } from './sections/personas'
import { HowItWorksSection } from './sections/how-it-works'
import { SocialProofSection } from './sections/social-proof'
import { FinalCTASection } from './sections/final-cta'
import { Footer } from './sections/footer'

export const metadata: Metadata = {
  title: 'Snang.my — Semak Kelayakan Rumah, Tanpa Leceh',
  description: 'Platform kesediaan pinjaman LPPSA untuk pembeli rumah, pemaju, dan ejen hartanah Malaysia.',
  openGraph: {
    title: 'Snang.my — Semak Kelayakan Rumah, Tanpa Leceh',
    description: 'Platform kesediaan pinjaman LPPSA untuk pembeli rumah, pemaju, dan ejen hartanah Malaysia.',
    url: 'https://snang.my',
    siteName: 'Snang.my',
    locale: 'ms_MY',
    type: 'website',
  },
}

export default function HomePage() {
  return (
    <>
      {/* Trust Strip - Persistent below navbar */}
      <TrustStrip locale="ms" />
      
      <main className="min-h-screen bg-neutral-50">
        {/* === ABOVE THE FOLD === */}
        <HeroSection />
        <StatsSection />
        
        {/* === FIRST SCROLL === */}
        <ProblemsSection />
        <PersonasSection />
        
        {/* === PROGRESSIVE REVEAL === */}
        <HowItWorksSection />
        <TrustSection locale="ms" variant="full" />
        <SocialProofSection />
        
        {/* === CONVERSION === */}
        <FinalCTASection />
      </main>
      
      <Footer />
      
      {/* Mobile utilities */}
      <ScrollToTop />
    </>
  )
}
