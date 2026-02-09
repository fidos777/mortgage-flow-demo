// app/sections/problems.tsx
// Problems Section with Progressive Disclosure
// Integrates: CollapsibleSection, AnimatedContainer, Icon badges

'use client'

import { AnimatedContainer } from '@/components/ui/animated-container'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { FileX, RefreshCw, EyeOff } from 'lucide-react'

// ==========================================
// Problem Card
// ==========================================

interface ProblemCardProps {
  icon: React.ReactNode
  title: string
  description: string
  delay?: number
}

function ProblemCard({ icon, title, description, delay = 0 }: ProblemCardProps) {
  return (
    <AnimatedContainer animation="fade-up" delay={delay}>
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-red-500 mb-4">
          {icon}
        </div>
        <h3 className="font-semibold text-neutral-800 mb-2">{title}</h3>
        <p className="text-sm text-neutral-600 leading-relaxed">{description}</p>
      </div>
    </AnimatedContainer>
  )
}

// ==========================================
// Problems Preview (Mobile collapsed state)
// ==========================================

function ProblemsPreview() {
  return (
    <p className="text-neutral-600">
      Pembeli keliru dengan borang. Ejen kejar dokumen. Pemaju tak nampak status. 
      Semua ini boleh diselesaikan.
    </p>
  )
}

// ==========================================
// Problems Details (Expanded content)
// ==========================================

function ProblemsDetails() {
  const problems = [
    {
      icon: <FileX className="w-6 h-6" />,
      title: 'Dokumen Tak Lengkap',
      description: 'Punca utama permohonan LPPSA ditolak — dokumen missing atau format salah.',
      delay: 0,
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: 'Ulang-Alik Tanpa Henti',
      description: 'Ejen WhatsApp pembeli 5-6 kali untuk satu dokumen. Pembeli confuse dengan keperluan.',
      delay: 100,
    },
    {
      icon: <EyeOff className="w-6 h-6" />,
      title: 'Tiada Visibility',
      description: 'Pemaju tak tahu berapa pembeli sebenarnya ready. Pipeline jadi guessing game.',
      delay: 200,
    },
  ]

  return (
    <div className="grid sm:grid-cols-3 gap-4 mt-6">
      {problems.map((problem) => (
        <ProblemCard key={problem.title} {...problem} />
      ))}
    </div>
  )
}

// ==========================================
// Problems Section
// ==========================================

export function ProblemsSection() {
  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <AnimatedContainer animation="fade-up">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center mb-4">
            Kenapa proses pinjaman rumah masih leceh?
          </h2>
        </AnimatedContainer>
        
        {/* Mobile: Collapsible */}
        <div className="lg:hidden">
          <CollapsibleSection
            preview={<ProblemsPreview />}
            expandText="Lihat masalah"
            collapseText="Tutup"
            showOnDesktop={false}
          >
            <ProblemsDetails />
          </CollapsibleSection>
        </div>
        
        {/* Desktop: Always visible */}
        <div className="hidden lg:block">
          <p className="text-center text-neutral-600 mb-8 max-w-2xl mx-auto">
            Pembeli keliru dengan borang. Ejen kejar dokumen. Pemaju tak nampak status. 
            Semua ini boleh diselesaikan dengan aliran kerja yang tersusun.
          </p>
          <ProblemsDetails />
        </div>
      </div>
    </section>
  )
}
