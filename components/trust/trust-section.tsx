// components/trust/trust-section.tsx
// V3 — Condensed enterprise governance section
// 3 strong badges, horizontal layout, bilingual, authoritative tone

'use client'

import { motion } from 'framer-motion'
import { Shield, Lock, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLocale } from '@/app/context/locale'

interface Badge { icon: LucideIcon; title: string; desc: string }

const COPY: Record<'bm' | 'en', { title: string; sub: string; badges: Badge[] }> = {
  bm: {
    title: 'Kawalan & Pematuhan Gred Perusahaan',
    sub: 'Dibina untuk pemaju yang menguruskan data sensitif pembeli.',
    badges: [
      { icon: Shield, title: 'PDPA 2010', desc: 'Mematuhi Akta Perlindungan Data Peribadi Malaysia' },
      { icon: Lock, title: 'Penyulitan SSL', desc: 'Semua data dihantar melalui sambungan selamat 256-bit' },
      { icon: FileText, title: 'Jejak Audit', desc: 'Setiap akses dan perubahan direkod untuk akauntabiliti' },
    ],
  },
  en: {
    title: 'Enterprise-Grade Control & Compliance',
    sub: 'Built for developers handling sensitive buyer data.',
    badges: [
      { icon: Shield, title: 'PDPA 2010', desc: 'Compliant with Malaysia\u2019s Personal Data Protection Act' },
      { icon: Lock, title: 'SSL Encryption', desc: 'All data transmitted via secure 256-bit connection' },
      { icon: FileText, title: 'Audit Trail', desc: 'Every access and change logged for accountability' },
    ],
  },
}

export function TrustSection() {
  const { lang } = useLocale()
  const c = COPY[lang]

  return (
    <section id="trust" className="py-20 sm:py-28 bg-white">
      <div className="max-w-[820px] mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="font-display font-extrabold tracking-tight"
            style={{ fontSize: 'clamp(24px, 3vw, 36px)', color: '#0f172a', letterSpacing: '-0.02em' }}
          >
            {c.title}
          </h2>
          <p className="font-body text-[15px] text-slate-500 mt-3 max-w-[400px] mx-auto leading-relaxed">
            {c.sub}
          </p>
        </motion.div>

        {/* 3 badges — horizontal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {c.badges.map((badge, i) => {
            const Icon = badge.icon
            return (
              <motion.div
                key={i}
                className="flex flex-col items-center text-center px-5 py-7 rounded-2xl transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(13,148,136,0.06)]"
                style={{
                  background: 'linear-gradient(145deg, #f8fafc, white)',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: 0.08 + i * 0.06 }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: '#f0fdfa', border: '1.5px solid #99f6e4' }}
                >
                  <Icon size={20} strokeWidth={1.8} className="text-teal-600" />
                </div>
                <h3 className="font-display text-[14px] font-bold text-slate-800 mb-1">
                  {badge.title}
                </h3>
                <p className="font-body text-[12px] text-slate-500 leading-relaxed">
                  {badge.desc}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
