'use client'

import { Shield, Lock, EyeOff, FileText, Users, Server } from 'lucide-react'

const trustBadges = [
  {
    icon: Shield,
    title: 'PDPA 2010',
    description: 'Mematuhi Akta Perlindungan Data Peribadi Malaysia'
  },
  {
    icon: Lock,
    title: 'Penyulitan SSL',
    description: 'Semua data dihantar melalui sambungan selamat'
  },
  {
    icon: EyeOff,
    title: 'Tiada Jualan Data',
    description: 'Data anda tidak akan dijual kepada pihak ketiga'
  },
  {
    icon: FileText,
    title: 'Jejak Audit',
    description: 'Setiap akses direkod untuk akauntabiliti'
  },
  {
    icon: Users,
    title: 'Akses Terhad',
    description: 'Hanya pihak berkenaan dapat melihat dokumen'
  },
  {
    icon: Server,
    title: 'Pelayan Tempatan',
    description: 'Data disimpan di Malaysia'
  }
]

export function TrustSection() {
  return (
    <section id="trust" className="py-16 sm:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-3">
            Keselamatan Data Anda
          </h2>
          <p className="text-neutral-600 max-w-xl mx-auto">
            Kami mengutamakan privasi dan keselamatan maklumat anda
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustBadges.map((badge, index) => {
            const Icon = badge.icon
            return (
              <div 
                key={index} 
                className="bg-neutral-50 rounded-2xl p-6 text-center hover:shadow-md transition-shadow border border-neutral-100"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-neutral-800 mb-2">{badge.title}</h3>
                <p className="text-sm text-neutral-600">{badge.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
