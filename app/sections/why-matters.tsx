// app/sections/why-matters.tsx
// "Why This Matters" — strategic framing micro-section
// 3 business-driven impact bullets. Bridges hero to contrast.
// Bilingual, Framer Motion reveal, minimal footprint.

'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Eye, CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLocale } from '@/app/context/locale'

interface Point { icon: LucideIcon; text: string }

const COPY: Record<'bm' | 'en', { label: string; points: Point[] }> = {
  bm: {
    label: 'Kenapa Ini Penting',
    points: [
      { icon: TrendingUp, text: 'Kelewatan LPPSA memberi kesan langsung kepada aliran tunai pemaju.' },
      { icon: Eye, text: 'Visibility pipeline mengurangkan ketidaktentuan dan mempercepatkan keputusan.' },
      { icon: CheckCircle2, text: 'Intake berstruktur meningkatkan kadar kejayaan submission sehingga 40%.' },
    ],
  },
  en: {
    label: 'Why This Matters',
    points: [
      { icon: TrendingUp, text: 'LPPSA delays directly impact developer cashflow.' },
      { icon: Eye, text: 'Pipeline visibility reduces uncertainty and accelerates decisions.' },
      { icon: CheckCircle2, text: 'Structured intake increases submission success rates by up to 40%.' },
    ],
  },
}

export function WhyMattersSection() {
  const { lang } = useLocale()
  const c = COPY[lang]

  return (
    <section className="py-14 sm:py-20 bg-white border-b border-slate-100">
      <div className="max-w-[820px] mx-auto px-6">
        {/* Section label */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
        >
          <span
            className="inline-block font-display text-[11px] font-bold uppercase tracking-[0.15em] text-teal-600 px-4 py-1.5 rounded-full"
            style={{ background: '#f0fdfa', border: '1px solid #ccfbf1' }}
          >
            {c.label}
          </span>
        </motion.div>

        {/* 3 impact points — horizontal on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {c.points.map((point, i) => {
            const Icon = point.icon
            return (
              <motion.div
                key={i}
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: 0.06 + i * 0.08 }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: '#f0fdfa', border: '1px solid #e0f7f3' }}
                >
                  <Icon size={17} strokeWidth={1.8} className="text-teal-600" />
                </div>
                <p className="font-body text-[14px] text-slate-600 leading-relaxed max-w-[260px]">
                  {point.text}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
