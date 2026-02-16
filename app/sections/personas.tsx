// app/sections/personas.tsx
// Personas Section V3 - Detailed Role Benefits
// Equal focus on Developer, Buyer, Agent value propositions

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3, Link2, FileCheck, Shield,
  Eye, Clock, MessageSquare, Clipboard,
  CheckCircle2, ArrowRight, Play
} from 'lucide-react'
import Link from 'next/link'

interface RoleData {
  id: 'pemaju' | 'pembeli' | 'ejen'
  icon: string
  title: string
  tagline: string
  description: string
  painPoints: string[]
  benefits: {
    icon: React.ReactNode
    title: string
    description: string
  }[]
  cta: {
    text: string
    href: string
  }
  color: {
    bg: string
    text: string
    border: string
    badge: string
  }
}

const roles: RoleData[] = [
  {
    id: 'pemaju',
    icon: '🏢',
    title: 'PEMAJU',
    tagline: 'Pantau, Bukan Kejar',
    description: 'Dashboard agregat untuk keputusan strategik — tanpa akses data individu pembeli',
    painPoints: [
      'Pipeline projek jadi guessing game',
      'Tak boleh ukur ROI kempen marketing',
      'Manual follow-up dengan ejen',
    ],
    benefits: [
      {
        icon: <BarChart3 className="w-5 h-5" />,
        title: 'Dashboard Agregat',
        description: 'Lihat conversion rates dan funnel status tanpa data individu (PRD 9.2)',
      },
      {
        icon: <Link2 className="w-5 h-5" />,
        title: 'QR Code Tracking',
        description: 'Generate QR untuk setiap unit — track interest dari showroom ke portal',
      },
      {
        icon: <FileCheck className="w-5 h-5" />,
        title: 'Proof Events Log',
        description: 'Audit trail untuk setiap state change — compliance documentation ready',
      },
      {
        icon: <BarChart3 className="w-5 h-5" />,
        title: 'Campaign Source Analytics',
        description: 'Tahu channel mana yang convert — QR, WhatsApp, atau website',
      },
    ],
    cta: {
      text: 'Lihat Demo Pemaju',
      href: '/listing',
    },
    color: {
      bg: 'bg-cyan-50',
      text: 'text-cyan-700',
      border: 'border-cyan-200',
      badge: 'bg-cyan-100 text-cyan-700',
    },
  },
  {
    id: 'pembeli',
    icon: '👤',
    title: 'PEMBELI',
    tagline: 'Tahu Dulu, Share Kemudian',
    description: 'Semak kelayakan sendiri sebelum berjumpa sesiapa — anda kawal data anda',
    painPoints: [
      'Takut apply, takut kena reject',
      'Risau data dikongsi tanpa izin',
      'Confuse dengan keperluan dokumen',
    ],
    benefits: [
      {
        icon: <Clock className="w-5 h-5" />,
        title: 'DSR dalam 5 Minit',
        description: 'Isyarat kesediaan serta-merta — tahu potensi sebelum jumpa ejen',
      },
      {
        icon: <Shield className="w-5 h-5" />,
        title: 'Privasi Terjamin',
        description: 'Ejen nampak julat pendapatan sahaja, bukan angka tepat (masked)',
      },
      {
        icon: <Eye className="w-5 h-5" />,
        title: 'Nampak Siapa Lihat Apa',
        description: 'Transparent disclosure — tahu exactly data apa yang dikongsi',
      },
      {
        icon: <CheckCircle2 className="w-5 h-5" />,
        title: 'Consent Control',
        description: 'Tarik balik persetujuan bila-bila masa — data anda, hak anda',
      },
    ],
    cta: {
      text: 'Cuba Semakan DSR',
      href: '/buyer',
    },
    color: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700',
    },
  },
  {
    id: 'ejen',
    icon: '💼',
    title: 'EJEN',
    tagline: 'Submit, Bukan Chase',
    description: 'Terima kes ready-to-go — fokus pada penghantaran, bukan pengumpulan dokumen',
    painPoints: [
      'Chase dokumen lebih dari proses submission',
      'Kes incomplete waste time',
      'Manual copy-paste ke portal LPPSA',
    ],
    benefits: [
      {
        icon: <CheckCircle2 className="w-5 h-5" />,
        title: 'Kes Pre-Qualified',
        description: 'Terima kes dengan DSR sudah dikira — potensi kelulusan clear',
      },
      {
        icon: <Clipboard className="w-5 h-5" />,
        title: 'Document Checklist',
        description: 'Tahu apa yang missing sebelum TAC — no surprises at submission',
      },
      {
        icon: <FileCheck className="w-5 h-5" />,
        title: 'Portal Submission Kit',
        description: '4 langkah: Readiness → Draft → Copy-Next → TAC Attestation',
      },
      {
        icon: <MessageSquare className="w-5 h-5" />,
        title: 'WhatsApp Integration',
        description: 'Contact templates ready — professional outreach dalam satu klik',
      },
    ],
    cta: {
      text: 'Lihat Demo Ejen',
      href: '/agent',
    },
    color: {
      bg: 'bg-violet-50',
      text: 'text-violet-700',
      border: 'border-violet-200',
      badge: 'bg-violet-100 text-violet-700',
    },
  },
]

export function PersonasSection() {
  const [activeRole, setActiveRole] = useState<'pemaju' | 'pembeli' | 'ejen'>('pemaju')
  const activeData = roles.find(r => r.id === activeRole)!

  return (
    <section id="untuk-siapa" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-primary font-semibold text-sm uppercase tracking-wide">
            UNTUK SIAPA
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mt-2 mb-4">
            Setiap Peranan Dapat Apa yang Mereka Perlukan
          </h2>
          <p className="text-lg text-neutral-600">
            Platform yang direka untuk menyelesaikan masalah spesifik setiap stakeholder
            dalam proses pinjaman LPPSA.
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex justify-center gap-2 mb-12">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id)}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                activeRole === role.id
                  ? `${role.color.badge} shadow-md`
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <span className="text-xl">{role.icon}</span>
              <span className="hidden sm:inline">{role.title}</span>
            </button>
          ))}
        </div>

        {/* Active Role Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`rounded-3xl ${activeData.color.bg} ${activeData.color.border} border-2 overflow-hidden`}
          >
            <div className="p-8 md:p-12">
              {/* Role Header */}
              <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10">
                <div className="text-6xl">{activeData.icon}</div>
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${activeData.color.badge} mb-2`}>
                    {activeData.title}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
                    {activeData.tagline}
                  </h3>
                  <p className="text-neutral-600">{activeData.description}</p>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid md:grid-cols-2 gap-10">
                {/* Pain Points */}
                <div>
                  <h4 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                    <span className="text-red-500">✗</span> Masalah yang Dihadapi
                  </h4>
                  <ul className="space-y-3">
                    {activeData.painPoints.map((pain, i) => (
                      <li key={i} className="flex items-start gap-3 text-neutral-600">
                        <span className="w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                          {i + 1}
                        </span>
                        {pain}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div>
                  <h4 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                    <span className="text-green-500">✓</span> Penyelesaian Snang.my
                  </h4>
                  <div className="space-y-4">
                    {activeData.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${activeData.color.badge} flex items-center justify-center flex-shrink-0`}>
                          {benefit.icon}
                        </div>
                        <div>
                          <h5 className="font-semibold text-neutral-800 text-sm">{benefit.title}</h5>
                          <p className="text-sm text-neutral-600">{benefit.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href={activeData.cta.href}
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeRole === 'pemaju' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' :
                    activeRole === 'pembeli' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                    'bg-violet-600 hover:bg-violet-700 text-white'
                  }`}
                >
                  <Play className="w-4 h-4" />
                  {activeData.cta.text}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/walkthrough"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 border-neutral-200 text-neutral-700 hover:border-neutral-300 transition-all"
                >
                  Lihat Full Walkthrough
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Quick Compare (Desktop) */}
        <div className="hidden lg:block mt-12">
          <h4 className="text-center font-semibold text-neutral-500 mb-6 text-sm uppercase tracking-wide">
            Perbandingan Ringkas
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="py-4 px-6 font-semibold text-neutral-800">Aspek</th>
                  <th className="py-4 px-6 font-semibold text-cyan-700">🏢 Pemaju</th>
                  <th className="py-4 px-6 font-semibold text-emerald-700">👤 Pembeli</th>
                  <th className="py-4 px-6 font-semibold text-violet-700">💼 Ejen</th>
                </tr>
              </thead>
              <tbody className="text-sm text-neutral-600">
                <tr className="border-b border-neutral-100">
                  <td className="py-3 px-6 font-medium">Data Access</td>
                  <td className="py-3 px-6">Aggregate only</td>
                  <td className="py-3 px-6">Own data + controls</td>
                  <td className="py-3 px-6">Assigned cases, masked PII</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="py-3 px-6 font-medium">Primary Action</td>
                  <td className="py-3 px-6">Generate QR, track pipeline</td>
                  <td className="py-3 px-6">Check DSR, upload docs</td>
                  <td className="py-3 px-6">Process & submit to LPPSA</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="py-3 px-6 font-medium">Time to Value</td>
                  <td className="py-3 px-6">2 min (QR ready)</td>
                  <td className="py-3 px-6">5 min (DSR result)</td>
                  <td className="py-3 px-6">8 min (submission kit)</td>
                </tr>
                <tr>
                  <td className="py-3 px-6 font-medium">Key Benefit</td>
                  <td className="py-3 px-6">Pipeline visibility</td>
                  <td className="py-3 px-6">Privacy control</td>
                  <td className="py-3 px-6">Ready cases, not raw leads</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
