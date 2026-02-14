// app/sections/how-it-works.tsx
// V3 — Developer-centric 3-step process milestones
// Teal token system, bilingual, Framer Motion stagger, connecting line

'use client'

import { motion } from 'framer-motion'
import { QrCode, UserCheck, LayoutDashboard } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLocale } from '@/app/context/locale'

interface Step {
  icon: LucideIcon
  title: string
  desc: string
  time: string
}

const COPY: Record<'bm' | 'en', { title: string; sub: string; steps: Step[] }> = {
  bm: {
    title: 'Tiga Langkah. Satu Aliran.',
    sub: 'Dari link QR hingga submission \u2014 semuanya terstruktur.',
    steps: [
      {
        icon: QrCode,
        title: 'Hantar QR Link',
        desc: 'Generate link unik untuk projek anda. Hantar melalui WhatsApp, QR code, atau galeri jualan.',
        time: '2 min',
      },
      {
        icon: UserCheck,
        title: 'Pembeli Lengkapkan',
        desc: 'Pembeli self-serve PreScan 7 langkah. DSR dikira automatik. Tiada campur tangan anda.',
        time: '5 min',
      },
      {
        icon: LayoutDashboard,
        title: 'Anda Pantau',
        desc: 'Semua kes masuk dashboard anda. Status, DSR, dokumen \u2014 satu paparan.',
        time: 'Masa nyata',
      },
    ],
  },
  en: {
    title: 'Three Steps. One Flow.',
    sub: 'From QR link to submission \u2014 everything is structured.',
    steps: [
      {
        icon: QrCode,
        title: 'Send QR Link',
        desc: 'Generate a unique link for your project. Share via WhatsApp, QR code, or sales gallery.',
        time: '2 min',
      },
      {
        icon: UserCheck,
        title: 'Buyer Completes',
        desc: 'Buyer self-serves 7-step PreScan. DSR auto-calculated. No intervention needed.',
        time: '5 min',
      },
      {
        icon: LayoutDashboard,
        title: 'You Monitor',
        desc: 'All cases flow into your dashboard. Status, DSR, documents \u2014 one view.',
        time: 'Real-time',
      },
    ],
  },
}

export function HowItWorksSection() {
  const { lang } = useLocale()
  const c = COPY[lang]

  return (
    <section id="how" className="py-24 sm:py-32 bg-slate-50 relative overflow-hidden">
      {/* Subtle background sweep */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 50%, rgba(13,148,136,0.03) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(13,148,136,0.02) 0%, transparent 50%)',
        }}
      />

      <div className="max-w-[820px] mx-auto px-6 relative">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="font-display font-extrabold tracking-tight"
            style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#0f172a', letterSpacing: '-0.02em' }}
          >
            {c.title}
          </h2>
          <p className="font-body text-[15px] text-slate-500 mt-3 max-w-[420px] mx-auto leading-relaxed">
            {c.sub}
          </p>
        </motion.div>

        {/* Steps — milestone layout with connecting line */}
        <div className="relative">
          {/* Connecting line behind cards (desktop) */}
          <div
            className="hidden md:block absolute top-[44px] left-[16.6%] right-[16.6%] h-px"
            style={{ background: 'linear-gradient(to right, transparent, #99f6e4, #99f6e4, transparent)' }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {c.steps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={i}
                  className="flex flex-col items-center text-center relative"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45, delay: 0.1 + i * 0.1 }}
                >
                  {/* Large structural number — background */}
                  <div
                    className="absolute -top-2 font-display font-extrabold text-[72px] leading-none pointer-events-none select-none"
                    style={{ color: 'rgba(13,148,136,0.04)', letterSpacing: '-0.04em' }}
                  >
                    {i + 1}
                  </div>

                  {/* Icon circle */}
                  <div className="relative mb-6 z-10">
                    <div
                      className="w-[56px] h-[56px] rounded-2xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(145deg, #f0fdfa, white)',
                        border: '1.5px solid #99f6e4',
                        boxShadow: '0 4px 16px rgba(13,148,136,0.08)',
                      }}
                    >
                      <Icon size={22} strokeWidth={1.8} className="text-teal-600" />
                    </div>
                    <div
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center font-display text-[11px] font-bold text-white z-20"
                      style={{ background: '#0d9488', boxShadow: '0 2px 6px rgba(13,148,136,0.3)' }}
                    >
                      {i + 1}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-[16px] font-bold text-slate-800 mb-2">
                    {step.title}
                  </h3>

                  {/* Time badge */}
                  <span
                    className="inline-block font-display text-[10px] font-semibold uppercase tracking-wider text-teal-600 mb-4 px-3 py-1 rounded-full"
                    style={{ background: '#f0fdfa', border: '1px solid #ccfbf1' }}
                  >
                    {step.time}
                  </span>

                  {/* Description */}
                  <p className="font-body text-[13px] text-slate-500 leading-relaxed max-w-[240px]">
                    {step.desc}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
