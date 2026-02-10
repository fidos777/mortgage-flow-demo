'use client'

import { Building2, Landmark, Home, Hotel, Target, MessageSquare, BadgePercent, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function PartnerSlot({ icon, index }: { icon: React.ReactNode; index: number }) {
  return (
    <div className="group relative bg-white rounded-2xl p-6 border-2 border-dashed border-primary/20 hover:border-primary/40 transition-all duration-300">
      <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/5 flex items-center justify-center text-primary/40 group-hover:text-primary/60 transition-colors">{icon}</div>
      <p className="text-sm font-medium text-neutral-400 text-center">Slot Tersedia</p>
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center"><span className="text-xs font-medium text-primary">{index}</span></div>
    </div>
  )
}

function BenefitCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
      <h4 className="font-semibold text-neutral-800 mb-1">{title}</h4>
      <p className="text-sm text-neutral-500">{description}</p>
    </div>
  )
}

export function SocialProofSection() {
  const partnerIcons = [
    <Building2 key="1" className="w-7 h-7" />,
    <Landmark key="2" className="w-7 h-7" />,
    <Home key="3" className="w-7 h-7" />,
    <Hotel key="4" className="w-7 h-7" />
  ]
  const benefits = [
    { icon: <Target className="w-5 h-5" />, title: 'Akses Awal', description: 'Guna platform sebelum pelancaran umum' },
    { icon: <MessageSquare className="w-5 h-5" />, title: 'Suara Anda Didengari', description: 'Maklum balas anda membentuk produk' },
    { icon: <BadgePercent className="w-5 h-5" />, title: 'Harga Istimewa', description: 'Kadar khas untuk rakan beta' },
  ]

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Building2 className="w-4 h-4" />
            Dalam Pembangunan Bersama
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-3">Program Rakan Beta</h2>
          <p className="text-neutral-600 max-w-xl mx-auto">Kami sedang bekerjasama dengan pemaju terpilih untuk memperhalusi platform ini sebelum pelancaran penuh.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {partnerIcons.map((icon, index) => (
            <PartnerSlot key={index} icon={icon} index={index + 1} />
          ))}
        </div>
        <div className="text-center mb-12">
          <p className="text-neutral-600 mb-4">Berminat menjadi antara yang pertama menggunakan Snang.my?</p>
          <Link href="/hubungi-kami" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
            Mohon Sebagai Rakan Beta
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-neutral-100">
          {benefits.map((benefit, index) => (
            <BenefitCard key={index} {...benefit} />
          ))}
        </div>
      </div>
    </section>
  )
}
