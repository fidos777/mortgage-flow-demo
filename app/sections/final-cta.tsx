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
