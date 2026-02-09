// app/sections/problems.tsx
// Problems Section V3 - Role-Specific Pain Points

'use client'

import { useState } from 'react'
import { AlertCircle, TrendingDown, Clock, FileQuestion, Shield, Users } from 'lucide-react'

interface ProblemCategory {
  id: 'pemaju' | 'pembeli' | 'ejen'
  icon: string
  title: string
  quote: string
  problems: {
    icon: React.ReactNode
    title: string
    description: string
  }[]
  color: string
}

const problemCategories: ProblemCategory[] = [
  {
    id: 'pemaju',
    icon: '🏢',
    title: 'Pemaju',
    quote: '"Pipeline projek jadi guessing game"',
    problems: [
      {
        icon: <TrendingDown className="w-5 h-5" />,
        title: 'Tiada Visibility Pipeline',
        description: 'Tak tahu berapa pembeli sebenarnya ready vs just browsing',
      },
      {
        icon: <AlertCircle className="w-5 h-5" />,
        title: 'Tak Boleh Ukur ROI',
        description: 'Kempen marketing mana yang sebenarnya convert? Tak tahu.',
      },
      {
        icon: <Users className="w-5 h-5" />,
        title: 'Manual Coordination',
        description: 'WhatsApp dengan ejen scattered — no centralized tracking',
      },
    ],
    color: 'cyan',
  },
  {
    id: 'pembeli',
    icon: '👤',
    title: 'Pembeli',
    quote: '"Takut apply, takut kena reject"',
    problems: [
      {
        icon: <FileQuestion className="w-5 h-5" />,
        title: 'Tak Tahu Kelayakan',
        description: 'Perlu jumpa ejen dulu baru tahu layak ke tak — awkward',
      },
      {
        icon: <Shield className="w-5 h-5" />,
        title: 'Risau Data Privacy',
        description: 'Data peribadi dikongsi dengan siapa? Tak clear.',
      },
      {
        icon: <AlertCircle className="w-5 h-5" />,
        title: 'Confuse Keperluan',
        description: 'Dokumen apa perlu? Format macam mana? No guidance.',
      },
    ],
    color: 'emerald',
  },
  {
    id: 'ejen',
    icon: '💼',
    title: 'Ejen',
    quote: '"Kerja banyak, submit sikit"',
    problems: [
      {
        icon: <Clock className="w-5 h-5" />,
        title: 'Chase Lebih Dari Submit',
        description: 'Majoriti masa habis kejar dokumen, bukan proses application',
      },
      {
        icon: <FileQuestion className="w-5 h-5" />,
        title: 'Kes Incomplete',
        description: 'Sampai TAC baru tahu dokumen tak lengkap — waste trip',
      },
      {
        icon: <AlertCircle className="w-5 h-5" />,
        title: 'Manual Copy-Paste',
        description: 'Copy data ke portal LPPSA satu-satu — error-prone',
      },
    ],
    color: 'violet',
  },
]

export function ProblemsSection() {
  const [activeTab, setActiveTab] = useState<'pemaju' | 'pembeli' | 'ejen'>('pemaju')

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-primary font-semibold text-sm uppercase tracking-wide">
            MASALAH
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mt-2 mb-4">
            Masalah Berbeza, Satu Penyelesaian
          </h2>
          <p className="text-lg text-neutral-600">
            Setiap stakeholder ada pain point yang unik dalam proses LPPSA.
            Snang.my selesaikan semua dalam satu platform.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-2 mb-10">
          {problemCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-5 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 ${
                activeTab === cat.id
                  ? cat.color === 'cyan' ? 'bg-cyan-100 text-cyan-700' :
                    cat.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-violet-100 text-violet-700'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.title}</span>
            </button>
          ))}
        </div>

        {/* Problem Cards */}
        {problemCategories.map((cat) => (
          <div
            key={cat.id}
            className={`transition-all duration-300 ${activeTab === cat.id ? 'block' : 'hidden'}`}
          >
            {/* Quote */}
            <div className="text-center mb-10">
              <blockquote className="text-2xl font-semibold text-neutral-700 italic">
                {cat.quote}
              </blockquote>
              <p className="text-neutral-500 mt-2">— Suara {cat.title}</p>
            </div>

            {/* Problem Cards Grid */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {cat.problems.map((problem, i) => (
                <div
                  key={i}
                  className={`p-6 rounded-2xl border-2 transition-all hover:shadow-lg ${
                    cat.color === 'cyan' ? 'border-cyan-200 hover:border-cyan-300 bg-cyan-50/50' :
                    cat.color === 'emerald' ? 'border-emerald-200 hover:border-emerald-300 bg-emerald-50/50' :
                    'border-violet-200 hover:border-violet-300 bg-violet-50/50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    cat.color === 'cyan' ? 'bg-cyan-100 text-cyan-600' :
                    cat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-violet-100 text-violet-600'
                  }`}>
                    {problem.icon}
                  </div>
                  <h3 className="font-bold text-neutral-800 mb-2">{problem.title}</h3>
                  <p className="text-sm text-neutral-600">{problem.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Solution Teaser */}
        <div className="mt-16 text-center">
          <p className="text-neutral-500 mb-4">
            Bagaimana Snang.my selesaikan semua ini?
          </p>
          <a
            href="#untuk-siapa"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            Lihat penyelesaian untuk setiap peranan →
          </a>
        </div>
      </div>
    </section>
  )
}
