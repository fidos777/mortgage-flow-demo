// components/agent/buyer-info-card.tsx
// Buyer Information Display for Agent View
// Uses masking utilities to protect PII

'use client'

import { maskPhone, maskEmail, formatIncomeRange } from '@/lib/utils/mask-pii'
import { User, Phone, Mail, Briefcase, Building2, GraduationCap, Banknote, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BuyerInfo {
  name: string
  phone?: string
  email?: string
  occupation?: string
  employer?: string
  grade?: string
  income?: number
  incomeRange?: string // Pre-calculated range from backend
}

interface BuyerInfoCardProps {
  buyer: BuyerInfo
  locale?: 'ms' | 'en'
  className?: string
}

export function BuyerInfoCard({
  buyer,
  locale = 'ms',
  className,
}: BuyerInfoCardProps) {
  const labels = {
    ms: {
      title: 'Maklumat Pembeli',
      name: 'Nama',
      phone: 'No. Telefon',
      email: 'Emel',
      occupation: 'Pekerjaan',
      employer: 'Majikan',
      grade: 'Gred',
      income: 'Julat Pendapatan',
      disclaimer: 'Angka tepat tidak ditunjukkan',
      privacyNote: 'Maklumat peribadi dipaparkan sebahagian untuk melindungi privasi pembeli.',
    },
    en: {
      title: 'Buyer Information',
      name: 'Name',
      phone: 'Phone No.',
      email: 'Email',
      occupation: 'Occupation',
      employer: 'Employer',
      grade: 'Grade',
      income: 'Income Range',
      disclaimer: 'Exact figures not shown',
      privacyNote: 'Personal information partially displayed to protect buyer privacy.',
    },
  }
  
  const t = labels[locale]

  // Calculate income range if not provided
  const incomeDisplay = buyer.incomeRange || formatIncomeRange(buyer.income)

  const fields = [
    { 
      icon: <User className="w-4 h-4" />,
      label: t.name, 
      value: buyer.name, // Name is always shown
      masked: false,
    },
    { 
      icon: <Phone className="w-4 h-4" />,
      label: t.phone, 
      value: maskPhone(buyer.phone), // ← MASKED
      masked: true,
    },
    { 
      icon: <Briefcase className="w-4 h-4" />,
      label: t.occupation, 
      value: buyer.occupation || '-',
      masked: false,
    },
    { 
      icon: <Building2 className="w-4 h-4" />,
      label: t.employer, 
      value: buyer.employer || '-',
      masked: false,
    },
    { 
      icon: <GraduationCap className="w-4 h-4" />,
      label: t.grade, 
      value: buyer.grade || '-',
      masked: false,
    },
    { 
      icon: <Banknote className="w-4 h-4" />,
      label: t.income, 
      value: incomeDisplay,
      masked: false,
      note: t.disclaimer, // Show disclaimer for income
    },
  ]

  return (
    <div className={cn('bg-white rounded-xl border border-neutral-200', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100">
        <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          {t.title}
        </h3>
      </div>
      
      {/* Privacy notice */}
      <div className="mx-4 mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">{t.privacyNote}</p>
      </div>
      
      {/* Fields */}
      <div className="p-4 space-y-3">
        {fields.map((field) => (
          <div key={field.label} className="flex items-start gap-3">
            <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-500 flex-shrink-0">
              {field.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-neutral-500">{field.label}</div>
              <div className={cn(
                'text-sm font-medium',
                field.masked ? 'text-neutral-600 font-mono' : 'text-neutral-800'
              )}>
                {field.value}
              </div>
              {field.note && (
                <div className="text-xs text-neutral-400 italic">{field.note}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


// ============================================
// USAGE EXAMPLE - How to update existing code
// ============================================
/*

BEFORE (showing full phone):
-----------------------------------------
<div className="text-sm">
  <span className="text-neutral-500">No. Telefon</span>
  <span className="font-medium">{buyer.phone}</span>  // ← Full number!
</div>


AFTER (with masking):
-----------------------------------------
import { maskPhone } from '@/lib/utils/mask-pii'

<div className="text-sm">
  <span className="text-neutral-500">No. Telefon</span>
  <span className="font-medium font-mono">{maskPhone(buyer.phone)}</span>  // ← Masked!
</div>


EXAMPLE OUTPUT:
-----------------------------------------
Input:  012-3456789
Output: 012-XXX-6789

Input:  0123456789
Output: XXXXXX6789

Input:  null
Output: -

*/
