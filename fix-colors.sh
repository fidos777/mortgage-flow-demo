#!/bin/bash
# Fix color alternation and remaining issues
# Run from mortgage-flow-demo directory

echo "🎨 Fixing color alternation and emoji issues..."

# 1. TRUST SECTION - Change to WHITE background (not teal)
cat > components/trust/trust-section.tsx << 'ENDTRUST'
'use client'

import { Shield, Lock, EyeOff, FileText, Users, Server } from 'lucide-react'

const trustBadges = [
  {
    icon: Shield,
    title: 'PDPA 2010',
    description: 'Mematuhi Akta Perlindungan Data Peribadi Malaysia'
  },
  {
    icon: Lock,
    title: 'Penyulitan SSL',
    description: 'Semua data dihantar melalui sambungan selamat'
  },
  {
    icon: EyeOff,
    title: 'Tiada Jualan Data',
    description: 'Data anda tidak akan dijual kepada pihak ketiga'
  },
  {
    icon: FileText,
    title: 'Jejak Audit',
    description: 'Setiap akses direkod untuk akauntabiliti'
  },
  {
    icon: Users,
    title: 'Akses Terhad',
    description: 'Hanya pihak berkenaan dapat melihat dokumen'
  },
  {
    icon: Server,
    title: 'Pelayan Tempatan',
    description: 'Data disimpan di Malaysia'
  }
]

export function TrustSection() {
  return (
    <section id="trust" className="py-16 sm:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-3">
            Keselamatan Data Anda
          </h2>
          <p className="text-neutral-600 max-w-xl mx-auto">
            Kami mengutamakan privasi dan keselamatan maklumat anda
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustBadges.map((badge, index) => {
            const Icon = badge.icon
            return (
              <div 
                key={index} 
                className="bg-neutral-50 rounded-2xl p-6 text-center hover:shadow-md transition-shadow border border-neutral-100"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-neutral-800 mb-2">{badge.title}</h3>
                <p className="text-sm text-neutral-600">{badge.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
ENDTRUST
echo "✅ trust-section.tsx (white background)"

# 2. STATS SECTION - Fix values and ensure no emojis
cat > app/sections/stats.tsx << 'ENDSTATS'
'use client'

import { TrendingUp, Clock, CreditCard } from 'lucide-react'

const stats = [
  {
    icon: TrendingUp,
    value: '80.5%',
    label: 'Kadar Kelulusan',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  },
  {
    icon: Clock,
    value: '5 min',
    label: 'Semakan DSR',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50'
  },
  {
    icon: CreditCard,
    value: '7',
    label: 'Jenis Pinjaman',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50'
  }
]

export function StatsSection() {
  return (
    <section className="py-8 sm:py-12 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-4 sm:p-6 text-center shadow-sm"
              >
                <div className={`w-10 h-10 mx-auto mb-3 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-sm text-neutral-500 mt-1">{stat.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
ENDSTATS
echo "✅ stats.tsx (fixed values + Lucide icons)"

# 3. FOOTER - Different shade (darker teal or neutral dark)
cat > app/sections/footer.tsx << 'ENDFOOTER'
'use client'

import Link from 'next/link'
import { Shield, Globe } from 'lucide-react'
import { useState } from 'react'

function LanguageToggle() {
  const [lang, setLang] = useState<'bm' | 'en'>('bm')
  return (
    <div className="inline-flex items-center gap-1 bg-white/10 rounded-full p-1">
      <button onClick={() => setLang('bm')} className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${lang === 'bm' ? 'bg-white text-neutral-800' : 'text-white/70 hover:text-white'}`}>BM</button>
      <button onClick={() => setLang('en')} className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${lang === 'en' ? 'bg-white text-neutral-800' : 'text-white/70 hover:text-white'}`}>EN</button>
    </div>
  )
}

export function Footer() {
  const currentYear = new Date().getFullYear()
  return (
    <footer className="bg-neutral-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block"><span className="text-2xl font-bold text-primary">Snang.my</span></Link>
            <p className="mt-3 text-neutral-400 text-sm leading-relaxed max-w-sm">Platform kesediaan pinjaman LPPSA untuk pembeli rumah, pemaju, dan ejen hartanah Malaysia.</p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs"><Shield className="w-4 h-4" /><span>SSL Secured</span></div>
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs"><Globe className="w-4 h-4" /><span>PDPA Compliant</span></div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-neutral-300">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="/buyer" className="text-neutral-400 hover:text-white text-sm transition-colors">Cuba Demo</Link></li>
              <li><Link href="/#personas" className="text-neutral-400 hover:text-white text-sm transition-colors">Untuk Siapa</Link></li>
              <li><Link href="/#how" className="text-neutral-400 hover:text-white text-sm transition-colors">Cara Guna</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-neutral-300">Syarikat</h4>
            <ul className="space-y-2">
              <li><a href="https://qontrek.com" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white text-sm transition-colors">Qontrek.com</a></li>
              <li><Link href="/dasar-privasi" className="text-neutral-400 hover:text-white text-sm transition-colors">Dasar Privasi</Link></li>
              <li><Link href="/hubungi-kami" className="text-neutral-400 hover:text-white text-sm transition-colors">Hubungi Kami</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-neutral-500 text-xs text-center sm:text-left">© {currentYear} SME Cloud Sdn Bhd. Hak cipta terpelihara.</p>
            <LanguageToggle />
          </div>
        </div>
      </div>
    </footer>
  )
}
ENDFOOTER
echo "✅ footer.tsx (dark neutral background)"

# 4. FINAL CTA - Keep teal but add visual separation
cat > app/sections/final-cta.tsx << 'ENDFINALCTA'
'use client'

import Link from 'next/link'
import { Building2, User, Briefcase, ArrowRight, Play } from 'lucide-react'

const roles = [
  {
    id: 'developer',
    icon: Building2,
    title: 'PEMAJU',
    description: 'Dashboard agregat, QR generation, pipeline tracking',
    href: '/developer',
    cta: 'Demo pemaju'
  },
  {
    id: 'buyer',
    icon: User,
    title: 'PEMBELI',
    description: 'Semak DSR dengan data contoh, lihat privacy controls',
    href: '/buyer',
    cta: 'Demo pembeli'
  },
  {
    id: 'agent',
    icon: Briefcase,
    title: 'EJEN',
    description: 'Case management, submission kit, contact tools',
    href: '/agent',
    cta: 'Demo ejen'
  }
]

export function FinalCTASection() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-primary via-primary to-primary-dark relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border border-white rounded-full" />
        <div className="absolute bottom-10 right-10 w-48 h-48 border border-white rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 border border-white rounded-full" />
      </div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-white/60 text-sm font-medium uppercase tracking-wider">
            Mula Sekarang
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-3">
            Pilih Peranan Anda untuk Demo yang Relevan
          </h2>
          <p className="text-white/80 max-w-xl mx-auto">
            Lihat sendiri bagaimana Snang.my membantu peranan anda dalam proses LPPSA. 
            Tiada pendaftaran. Tiada komitmen.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {roles.map((role) => {
            const Icon = role.icon
            return (
              <Link
                key={role.id}
                href={role.href}
                className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">{role.title}</h3>
                <p className="text-white/70 text-sm mb-4">{role.description}</p>
                <span className="inline-flex items-center gap-1 text-white font-medium text-sm group-hover:gap-2 transition-all">
                  {role.cta} <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            )
          })}
        </div>

        {/* Walkthrough CTA */}
        <div className="text-center">
          <p className="text-white/60 text-sm mb-4">ATAU</p>
          <Link
            href="/walkthrough"
            className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-medium hover:bg-neutral-100 transition-colors shadow-lg"
          >
            <Play className="w-4 h-4" />
            Lihat Full Walkthrough (15 minit)
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-white/50 text-xs mt-3">
            32 screenshots • 3 bahagian • Aliran lengkap Pemaju → Pembeli → Ejen
          </p>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-6 mt-10 pt-8 border-t border-white/10">
          {['Data contoh sahaja', 'Tiada pendaftaran', 'PDPA Compliant', 'Demo interaktif'].map((item, i) => (
            <span key={i} className="text-white/60 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
ENDFINALCTA
echo "✅ final-cta.tsx (enhanced with decorative elements)"

echo ""
echo "🎉 All color/emoji fixes applied!"
echo ""
echo "Now run: npm run build"
