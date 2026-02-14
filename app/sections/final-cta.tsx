// app/sections/final-cta.tsx
// V3 — Single developer-focused CTA block
// Polished: larger type, more breathing room, animated color sweep, radial center glow

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, LayoutGrid } from 'lucide-react'
import { useLocale } from '@/app/context/locale'

const COPY = {
  bm: {
    headline: 'LPPSA Tak Sepatutnya Jadi Bottleneck.',
    sub: 'Lihat bagaimana pipeline anda boleh jadi terstruktur — dalam satu dashboard.',
    cta: 'Lihat Demo Pipeline',
    trust: ['Tiada pendaftaran', 'Data contoh sahaja', 'PDPA Compliant'],
  },
  en: {
    headline: 'LPPSA Shouldn\u2019t Be a Bottleneck.',
    sub: 'See how your pipeline can become structured \u2014 in one dashboard.',
    cta: 'View Pipeline Demo',
    trust: ['No registration', 'Sample data only', 'PDPA Compliant'],
  },
}

export function FinalCTASection() {
  const { lang } = useLocale()
  const c = COPY[lang]

  return (
    <section className="py-28 sm:py-36 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e, #115e59)' }}
    >
      {/* Animated color sweep — extremely subtle */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 50%, rgba(20,184,166,0.15) 0%, transparent 50%)',
        }}
        animate={{
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 70% 40%, rgba(94,234,212,0.08) 0%, transparent 50%)',
        }}
        animate={{
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Center radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.08) 0%, transparent 55%)',
        }}
      />

      <div className="max-w-[720px] mx-auto px-6 relative z-10 text-center">
        <motion.h2
          className="font-display font-extrabold text-white tracking-tight"
          style={{ fontSize: 'clamp(30px, 4.5vw, 50px)', letterSpacing: '-0.025em', lineHeight: 1.15 }}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          {c.headline}
        </motion.h2>

        <motion.p
          className="font-body text-[16px] text-white/70 mt-6 max-w-[480px] mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {c.sub}
        </motion.p>

        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Link
            href="/developer"
            className="inline-flex items-center gap-2.5 px-10 py-4.5 rounded-xl font-display text-[16px] font-semibold text-teal-700 no-underline transition-all duration-200 hover:brightness-105 hover:scale-[1.02]"
            style={{
              background: 'white',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <LayoutGrid size={18} strokeWidth={2} />
            {c.cta}
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          className="flex flex-wrap justify-center gap-6 mt-14"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {c.trust.map((item, i) => (
            <span key={i} className="flex items-center gap-2 text-white/50 text-[12px] font-body tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
