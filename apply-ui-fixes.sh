#!/bin/bash
# UI Fixes for Snang.my Landing Page
# Run from mortgage-flow-demo directory

echo "🎨 Applying UI Design Fixes..."

# 1. NAVBAR
cat > app/sections/navbar.tsx << 'ENDNAVBAR'
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight } from 'lucide-react'

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '#personas', label: 'Untuk Siapa' },
    { href: '#how', label: 'Cara Guna' },
    { href: '#trust', label: 'Keselamatan' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-primary">Snang.my</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-neutral-600 hover:text-primary transition-colors">{link.label}</a>
            ))}
            <Link href="/buyer" className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
              Cuba Demo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-neutral-600 hover:text-primary" aria-label="Toggle menu">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-100 py-4">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-600 hover:text-primary transition-colors py-2">{link.label}</a>
              ))}
              <Link href="/buyer" onClick={() => setIsMobileMenuOpen(false)} className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors">
                Cuba Demo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
ENDNAVBAR
echo "✅ navbar.tsx"

# 2. FOOTER
cat > app/sections/footer.tsx << 'ENDFOOTER'
'use client'

import Link from 'next/link'
import { Shield, Globe } from 'lucide-react'
import { useState } from 'react'

function LanguageToggle() {
  const [lang, setLang] = useState<'bm' | 'en'>('bm')
  return (
    <div className="inline-flex items-center gap-1 bg-white/10 rounded-full p-1">
      <button onClick={() => setLang('bm')} className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${lang === 'bm' ? 'bg-white text-primary' : 'text-white/70 hover:text-white'}`}>BM</button>
      <button onClick={() => setLang('en')} className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${lang === 'en' ? 'bg-white text-primary' : 'text-white/70 hover:text-white'}`}>EN</button>
    </div>
  )
}

export function Footer() {
  const currentYear = new Date().getFullYear()
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block"><span className="text-2xl font-bold">Snang.my</span></Link>
            <p className="mt-3 text-white/80 text-sm leading-relaxed max-w-sm">Platform kesediaan pinjaman LPPSA untuk pembeli rumah, pemaju, dan ejen hartanah Malaysia.</p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-white/60 text-xs"><Shield className="w-4 h-4" /><span>SSL Secured</span></div>
              <div className="flex items-center gap-1.5 text-white/60 text-xs"><Globe className="w-4 h-4" /><span>PDPA Compliant</span></div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="/buyer" className="text-white/80 hover:text-white text-sm transition-colors">Cuba Demo</Link></li>
              <li><Link href="/#personas" className="text-white/80 hover:text-white text-sm transition-colors">Untuk Siapa</Link></li>
              <li><Link href="/#how" className="text-white/80 hover:text-white text-sm transition-colors">Cara Guna</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Syarikat</h4>
            <ul className="space-y-2">
              <li><a href="https://qontrek.com" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white text-sm transition-colors">Qontrek.com</a></li>
              <li><Link href="/dasar-privasi" className="text-white/80 hover:text-white text-sm transition-colors">Dasar Privasi</Link></li>
              <li><Link href="/hubungi-kami" className="text-white/80 hover:text-white text-sm transition-colors">Hubungi Kami</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/60 text-xs text-center sm:text-left">© {currentYear} SME Cloud Sdn Bhd. Hak cipta terpelihara.</p>
            <LanguageToggle />
          </div>
        </div>
      </div>
    </footer>
  )
}
ENDFOOTER
echo "✅ footer.tsx"

# 3. SOCIAL PROOF (RAKAN BETA)
cat > app/sections/social-proof.tsx << 'ENDSOCIAL'
'use client'

import { Building2, Landmark, Home, Hotel, Target, MessageSquare, BadgePercent, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function PartnerSlot({ icon, index }: { icon: React.ReactNode; index: number }) {
  return (
    <div className="group relative bg-white rounded-2xl p-6 border-2 border-dashed border-primary/20 hover:border-primary/40 transition-all duration-300">
      <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/5 flex items-center justify-center text-primary/40 group-hover:text-primary/60 transition-colors">{icon}</div>
      <p className="text-sm font-medium text-neutral-400 text-center">Slot Tersedia</p>
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center"><span className="text-xs font-medium text-primary">{index}</span></div>
    </div>
  )
}

function BenefitCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
      <h4 className="font-semibold text-neutral-800 mb-1">{title}</h4>
      <p className="text-sm text-neutral-500">{description}</p>
    </div>
  )
}

export function SocialProofSection() {
  const partnerIcons = [
    <Building2 key="1" className="w-7 h-7" />,
    <Landmark key="2" className="w-7 h-7" />,
    <Home key="3" className="w-7 h-7" />,
    <Hotel key="4" className="w-7 h-7" />
  ]
  const benefits = [
    { icon: <Target className="w-5 h-5" />, title: 'Akses Awal', description: 'Guna platform sebelum pelancaran umum' },
    { icon: <MessageSquare className="w-5 h-5" />, title: 'Suara Anda Didengari', description: 'Maklum balas anda membentuk produk' },
    { icon: <BadgePercent className="w-5 h-5" />, title: 'Harga Istimewa', description: 'Kadar khas untuk rakan beta' },
  ]

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Building2 className="w-4 h-4" />
            Dalam Pembangunan Bersama
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-3">Program Rakan Beta</h2>
          <p className="text-neutral-600 max-w-xl mx-auto">Kami sedang bekerjasama dengan pemaju terpilih untuk memperhalusi platform ini sebelum pelancaran penuh.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {partnerIcons.map((icon, index) => (
            <PartnerSlot key={index} icon={icon} index={index + 1} />
          ))}
        </div>
        <div className="text-center mb-12">
          <p className="text-neutral-600 mb-4">Berminat menjadi antara yang pertama menggunakan Snang.my?</p>
          <Link href="/hubungi-kami" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
            Mohon Sebagai Rakan Beta
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-neutral-100">
          {benefits.map((benefit, index) => (
            <BenefitCard key={index} {...benefit} />
          ))}
        </div>
      </div>
    </section>
  )
}
ENDSOCIAL
echo "✅ social-proof.tsx"

# 4. HOW IT WORKS
cat > app/sections/how-it-works.tsx << 'ENDHOW'
'use client'

import { Clock, Building2, User, Briefcase } from 'lucide-react'

interface Step {
  number: number
  icon: React.ReactNode
  title: string
  description: string
  time: string
  color: string
  bgColor: string
}

export function HowItWorksSection() {
  const steps: Step[] = [
    {
      number: 1,
      icon: <Building2 className="w-5 h-5 text-cyan-600" />,
      title: 'Pemaju Cipta Link Invitation',
      description: 'Pemaju generate link unik untuk projek mereka. Link ini dihantar kepada pembeli melalui WhatsApp, QR code, atau galeri jualan.',
      time: '2 min',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50'
    },
    {
      number: 2,
      icon: <User className="w-5 h-5 text-emerald-600" />,
      title: 'Pembeli Semak Kelayakan',
      description: 'Pembeli klik link, beri persetujuan PDPA, dan isi PreScan 7 langkah. Sistem kira DSR secara automatik.',
      time: '5 min',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      number: 3,
      icon: <Briefcase className="w-5 h-5 text-violet-600" />,
      title: 'Ejen Proses Penghantaran',
      description: 'Ejen terima kes ready-to-go. Guna Portal Submission Kit untuk review, draft, copy data ke portal LPPSA rasmi.',
      time: '8 min',
      color: 'text-violet-600',
      bgColor: 'bg-violet-50'
    }
  ]

  return (
    <section id="how" className="py-16 sm:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-3">Tiga langkah. Satu aliran.</h2>
          <p className="text-neutral-600 max-w-xl mx-auto">Aliran mengikut kausaliti data — pemaju cipta projek, pembeli semak kelayakan, ejen proses penghantaran.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div key={step.number} className="relative flex flex-col items-center">
              <div className="flex flex-col items-center mb-4">
                <div className={`w-12 h-12 rounded-full ${step.bgColor} flex items-center justify-center shadow-lg`}>
                  <span className={`text-lg font-bold ${step.color}`}>{step.number}</span>
                </div>
                <div className="w-0.5 h-6 bg-gradient-to-b from-primary/40 to-primary/10" />
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-md transition-shadow w-full">
                <div className={`w-10 h-10 rounded-xl ${step.bgColor} flex items-center justify-center mb-4`}>{step.icon}</div>
                <h3 className="font-semibold text-neutral-800 mb-2">{step.title}</h3>
                <div className="inline-flex items-center gap-1 text-xs text-neutral-500 mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  {step.time}
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
ENDHOW
echo "✅ how-it-works.tsx"

# 5. PAGE.TSX
cat > app/page.tsx << 'ENDPAGE'
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
ENDPAGE
echo "✅ page.tsx"

echo ""
echo "🎉 All files updated!"
echo ""
echo "Now run:"
echo "  npm run build"
