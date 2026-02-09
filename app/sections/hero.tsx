// app/sections/hero.tsx
// Hero Section V3 - 3-Market Focus
// Replaces buyer-only messaging with equal focus on Pemaju, Pembeli, Ejen

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'

// Role-specific colors
const roleColors = {
  pemaju: 'from-cyan-500 to-cyan-600',
  pembeli: 'from-emerald-500 to-emerald-600',
  ejen: 'from-violet-500 to-violet-600',
}

export function HeroSection() {
  const [activeRole, setActiveRole] = useState<'pemaju' | 'pembeli' | 'ejen'>('pemaju')

  // Auto-rotate roles every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRole(prev => {
        if (prev === 'pemaju') return 'pembeli'
        if (prev === 'pembeli') return 'ejen'
        return 'pemaju'
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const roleTaglines = {
    pemaju: {
      action: 'Pantau pipeline',
      benefit: 'data agregat untuk keputusan strategik',
      cta: 'Lihat Dashboard Pemaju'
    },
    pembeli: {
      action: 'Semak kelayakan',
      benefit: 'tahu DSR sebelum jumpa sesiapa',
      cta: 'Cuba Semakan DSR'
    },
    ejen: {
      action: 'Proses submission',
      benefit: 'terima kes ready, bukan chase dokumen',
      cta: 'Lihat Portal Submission'
    },
  }

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-white to-secondary/5" />

      {/* Langkah Tiga Pattern (subtle) */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 100 100">
        <circle cx="20" cy="50" r="8" fill="currentColor" className="text-primary" />
        <circle cx="50" cy="50" r="8" fill="currentColor" className="text-primary" />
        <circle cx="80" cy="50" r="8" fill="currentColor" className="text-primary" />
        <line x1="28" y1="50" x2="42" y2="50" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <line x1="58" y1="50" x2="72" y2="50" stroke="currentColor" strokeWidth="2" className="text-primary" />
      </svg>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Platform Kesediaan Pinjaman LPPSA
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6"
          >
            Satu Platform.
            <br />
            <span className="text-primary">Tiga Peranan.</span>
            <br />
            Sifar Leceh.
          </motion.h1>

          {/* Dynamic Role Tagline */}
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="h-24 flex flex-col items-center justify-center mb-8"
          >
            <p className="text-xl text-neutral-600 mb-2">
              <span className={`font-semibold bg-gradient-to-r ${roleColors[activeRole]} bg-clip-text text-transparent`}>
                {activeRole === 'pemaju' ? 'Pemaju' : activeRole === 'pembeli' ? 'Pembeli' : 'Ejen'}
              </span>
              {' '}{roleTaglines[activeRole].action} —
            </p>
            <p className="text-lg text-neutral-500">
              {roleTaglines[activeRole].benefit}
            </p>
          </motion.div>

          {/* Role Selector Pills */}
          <div className="flex justify-center gap-2 mb-10">
            {(['pemaju', 'pembeli', 'ejen'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeRole === role
                    ? `bg-gradient-to-r ${roleColors[role]} text-white shadow-lg`
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {role === 'pemaju' ? '🏢 Pemaju' : role === 'pembeli' ? '👤 Pembeli' : '💼 Ejen'}
              </button>
            ))}
          </div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/demo"
              className="group flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25"
            >
              <Play className="w-5 h-5" />
              Cuba Demo Interaktif
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="#untuk-siapa"
              className="flex items-center gap-2 text-neutral-600 hover:text-primary transition-colors px-6 py-4"
            >
              <Users className="w-5 h-5" />
              Lihat Untuk Siapa
            </Link>
          </motion.div>

          {/* Trust Line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-sm text-neutral-500"
          >
            Tiada pendaftaran. Tiada komitmen. Demo 5 minit dengan data contoh.
          </motion.p>
        </div>

        {/* Role Preview Cards (Desktop) */}
        <div className="hidden lg:grid grid-cols-3 gap-6 max-w-5xl mx-auto mt-16">
          {[
            { role: 'pemaju', icon: '📊', title: 'Dashboard Agregat', desc: 'Pipeline tanpa data individu' },
            { role: 'pembeli', icon: '🛡️', title: 'Privasi Terjamin', desc: 'Ejen nampak range sahaja' },
            { role: 'ejen', icon: '📋', title: 'Kes Ready', desc: 'DSR dikira, dokumen checklist' },
          ].map((item, i) => (
            <motion.div
              key={item.role}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                activeRole === item.role
                  ? 'bg-white border-primary/30 shadow-lg shadow-primary/10'
                  : 'bg-white/50 border-neutral-200 hover:border-primary/20'
              }`}
              onClick={() => setActiveRole(item.role as 'pemaju' | 'pembeli' | 'ejen')}
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-neutral-800 mb-1">{item.title}</h3>
              <p className="text-sm text-neutral-500">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
