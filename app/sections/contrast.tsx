// app/sections/contrast.tsx
// V3 — "Pantau. Bukan Kejar." before/after contrast block
// Developer-centric: shows the shift from manual chaos to pipeline clarity

'use client'

import { motion } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { useLocale } from '@/app/context/locale'

const COPY = {
  bm: {
    title1: 'Pantau.',
    title2: 'Bukan Kejar.',
    sub: 'Bagaimana aliran LPPSA berubah apabila setiap langkah ada struktur.',
    before: {
      label: 'Tanpa Snang',
      items: [
        'Excel tracking secara manual — tiada status masa nyata',
        'Kejar pembeli untuk dokumen melalui WhatsApp',
        'Tiada visibility kes mana yang stuck atau ready',
      ],
    },
    after: {
      label: 'Dengan Snang',
      items: [
        'Dashboard pipeline masa nyata — setiap kes ada status',
        'Pembeli self-serve PreScan, DSR dikira automatik',
        'Alert automatik untuk kes stuck dan kes ready to submit',
      ],
    },
  },
  en: {
    title1: 'Monitor.',
    title2: 'Don\u2019t Chase.',
    sub: 'How LPPSA workflow changes when every step has structure.',
    before: {
      label: 'Without Snang',
      items: [
        'Manual Excel tracking \u2014 no real-time status',
        'Chasing buyers for documents over WhatsApp',
        'No visibility on which cases are stuck or ready',
      ],
    },
    after: {
      label: 'With Snang',
      items: [
        'Real-time pipeline dashboard \u2014 every case has status',
        'Buyers self-serve PreScan, DSR auto-calculated',
        'Auto alerts for stuck cases and ready-to-submit cases',
      ],
    },
  },
}

export function ContrastSection() {
  const { lang } = useLocale()
  const c = COPY[lang]

  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="max-w-[820px] mx-auto px-6">
        {/* Title — split into two dramatic lines */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="font-display font-extrabold tracking-tight leading-[1.1]"
            style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', color: '#0f172a', letterSpacing: '-0.03em' }}
          >
            {c.title1}<br />
            <span className="text-teal-600">{c.title2}</span>
          </h2>
          <p className="font-body text-[15px] text-slate-500 mt-5 max-w-[460px] mx-auto leading-relaxed">
            {c.sub}
          </p>
        </motion.div>

        {/* Two-column contrast */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="font-display text-[13px] font-semibold text-slate-400 uppercase tracking-wider mb-7">
              {c.before.label}
            </div>
            <div className="space-y-6">
              {c.before.items.map((item, i) => (
                <div key={i} className="flex gap-3.5 items-start">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <X size={11} strokeWidth={2.5} className="text-slate-400" />
                  </div>
                  <p className="font-body text-[14px] text-slate-500 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* After — vivid styling */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Subtle glow background */}
            <div
              className="absolute -inset-4 rounded-2xl pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(13,148,136,0.04) 0%, transparent 70%)' }}
            />

            <div className="relative">
              <div className="font-display text-[13px] font-bold text-teal-600 uppercase tracking-wider mb-7">
                {c.after.label}
              </div>
              <div className="space-y-6">
                {c.after.items.map((item, i) => (
                  <div key={i} className="flex gap-3.5 items-start">
                    <div
                      className="mt-0.5 w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center shrink-0"
                      style={{ border: '1.5px solid #99f6e4', boxShadow: '0 0 8px rgba(13,148,136,0.1)' }}
                    >
                      <Check size={11} strokeWidth={2.5} className="text-teal-600" />
                    </div>
                    <p className="font-body text-[14px] text-slate-800 leading-relaxed font-medium">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
