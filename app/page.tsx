import { Metadata } from 'next'
import { Navbar } from './sections/navbar'
import { HeroSection } from './sections/hero'
import { WhyMattersSection } from './sections/why-matters'
import { ContrastSection } from './sections/contrast'
import { HowItWorksSection } from './sections/how-it-works'
import { TrustSection } from '@/components/trust'
import { FinalCTASection } from './sections/final-cta'
import { Footer } from './sections/footer'
import { LocaleProvider } from './context/locale'

export const metadata: Metadata = {
  title: 'Snang.my — LPPSA Pipeline Intelligence untuk Pemaju',
  description: 'Platform kawalan pipeline LPPSA untuk pemaju hartanah Malaysia. Pantau kes, bukan kejar pembeli.',
}

export default function HomePage() {
  return (
    <LocaleProvider>
      <Navbar />
      <main className="min-h-screen bg-neutral-50 pt-16">
        <HeroSection />
        <WhyMattersSection />
        <ContrastSection />
        <HowItWorksSection />
        <TrustSection />
        <FinalCTASection />
      </main>
      <Footer />
    </LocaleProvider>
  )
}
