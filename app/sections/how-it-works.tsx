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
