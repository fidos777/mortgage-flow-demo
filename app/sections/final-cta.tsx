// app/sections/final-cta.tsx
// Final CTA Section V3 - Role-Specific Entry Points

'use client'

import Link from 'next/link'
import { Play, ArrowRight } from 'lucide-react'

export function FinalCTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary to-primary-dark text-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-primary-light font-semibold text-sm uppercase tracking-wide">
            MULA SEKARANG
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            Pilih Peranan Anda untuk Demo yang Relevan
          </h2>
          <p className="text-lg text-white/80">
            Lihat sendiri bagaimana Snang.my membantu peranan anda dalam proses LPPSA.
            Tiada pendaftaran. Tiada komitmen.
          </p>
        </div>

        {/* Role Demo Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          <RoleDemoCard
            icon="🏢"
            role="PEMAJU"
            description="Dashboard agregat, QR generation, pipeline tracking"
            href="/developer"
            color="cyan"
          />
          <RoleDemoCard
            icon="👤"
            role="PEMBELI"
            description="Semak DSR dengan data contoh, lihat privacy controls"
            href="/buyer"
            color="emerald"
          />
          <RoleDemoCard
            icon="💼"
            role="EJEN"
            description="Case management, submission kit, contact tools"
            href="/agent"
            color="violet"
          />
        </div>

        {/* Or Full Walkthrough */}
        <div className="text-center">
          <p className="text-white/60 text-sm mb-4">ATAU</p>
          <Link
            href="/walkthrough"
            className="inline-flex items-center gap-3 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-neutral-100 transition-all shadow-lg"
          >
            <Play className="w-5 h-5" />
            Lihat Full Walkthrough (15 minit)
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-white/50 text-sm mt-4">
            32 screenshots • 3 bahagian • Aliran lengkap Pemaju → Pembeli → Ejen
          </p>
        </div>

        {/* Trust Footer */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-white/60">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              Data contoh sahaja
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              Tiada pendaftaran
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              PDPA Compliant
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              Demo interaktif
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function RoleDemoCard({
  icon,
  role,
  description,
  href,
  color,
}: {
  icon: string
  role: string
  description: string
  href: string
  color: 'cyan' | 'emerald' | 'violet'
}) {
  const colorClasses = {
    cyan: 'hover:border-cyan-400 group-hover:text-cyan-400',
    emerald: 'hover:border-emerald-400 group-hover:text-emerald-400',
    violet: 'hover:border-violet-400 group-hover:text-violet-400',
  }

  return (
    <Link
      href={href}
      className={`group block p-6 rounded-2xl bg-white/10 border-2 border-white/20 backdrop-blur-sm transition-all hover:bg-white/20 ${colorClasses[color]}`}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{role}</h3>
      <p className="text-sm text-white/70 mb-4">{description}</p>
      <span className={`text-sm font-semibold flex items-center gap-1 ${colorClasses[color]}`}>
        Demo {role.toLowerCase()} →
      </span>
    </Link>
  )
}
