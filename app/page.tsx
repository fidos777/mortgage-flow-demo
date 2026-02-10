import { Metadata } from 'next'
import { Navbar } from './sections/navbar'
import { TrustStrip, TrustSection } from '@/components/trust'
import { HeroSection } from './sections/hero'
import { StatsSection } from './sections/stats'
import { ProblemsSection } from './sections/problems'
import { PersonasSection } from './sections/personas'
import { HowItWorksSection } from './sections/how-it-works'
import { SocialProofSection } from './sections/social-proof'
import { FinalCTASection } from './sections/final-cta'
import { Footer } from './sections/footer'

export const metadata: Metadata = {
  title: 'Snang.my — Satu Platform. Tiga Peranan. Sifar Leceh.',
  description: 'Platform kesediaan pinjaman LPPSA untuk pemaju, pembeli rumah, dan ejen hartanah Malaysia. Semak kelayakan dalam 5 minit.',
}

export default function HomePage() {
  return (
    <>
      <Navbar />
      <div className="pt-16">
        <TrustStrip />
      </div>
      <main className="min-h-screen bg-neutral-50">
        <HeroSection />
        <StatsSection />
        <ProblemsSection />
        <PersonasSection />
        <HowItWorksSection />
        <TrustSection />
        <SocialProofSection />
        <FinalCTASection />
      </main>
      <Footer />
    </>
  )
}
