'use client'

import { TrendingUp, Clock, CreditCard } from 'lucide-react'

const stats = [
  {
    icon: TrendingUp,
    value: '80.5%',
    label: 'Kadar Kelulusan',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  },
  {
    icon: Clock,
    value: '5 min',
    label: 'Semakan DSR',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50'
  },
  {
    icon: CreditCard,
    value: '7',
    label: 'Jenis Pinjaman',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50'
  }
]

export function StatsSection() {
  return (
    <section className="py-8 sm:py-12 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-4 sm:p-6 text-center shadow-sm"
              >
                <div className={`w-10 h-10 mx-auto mb-3 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-sm text-neutral-500 mt-1">{stat.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
