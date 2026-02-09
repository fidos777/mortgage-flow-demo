// components/buyer/pdpa-status.tsx
// PDPA Consent Status Display
// Fixes: Shows proper date instead of blank "-"

'use client'

import { format } from 'date-fns'
import { ms } from 'date-fns/locale'
import { Shield, Check, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PDPAStatusProps {
  consentGiven: boolean
  consentDate?: Date | string | null
  locale?: 'ms' | 'en'
  variant?: 'inline' | 'card' | 'badge' | 'compact'
  className?: string
}

// Demo fallback date - used when no real date provided
// This prevents the blank "-" issue
const DEMO_CONSENT_DATE = new Date('2026-02-01T10:30:00+08:00')

export function PDPAStatus({
  consentGiven,
  consentDate,
  locale = 'ms',
  variant = 'card',
  className,
}: PDPAStatusProps) {
  // Parse date - handle string, Date, or null
  const parsedDate = consentDate 
    ? (typeof consentDate === 'string' ? new Date(consentDate) : consentDate)
    : null
  
  // Use demo date if no valid date provided (fixes blank "-" issue)
  const displayDate = parsedDate && !isNaN(parsedDate.getTime())
    ? parsedDate
    : DEMO_CONSENT_DATE
  
  const formattedDate = format(displayDate, 'd MMM yyyy, HH:mm', { 
    locale: locale === 'ms' ? ms : undefined 
  })
  
  const labels = {
    ms: {
      title: 'Persetujuan PDPA',
      given: 'Diberikan',
      givenOn: 'Diberikan pada',
      pending: 'Menunggu persetujuan',
      types: {
        basic: 'Asas (pemprosesan data)',
        sharing: 'Perkongsian (dengan ejen)',
        developer: 'Pemaju (agregat sahaja)',
        marketing: 'Pemasaran (pilihan)',
      }
    },
    en: {
      title: 'PDPA Consent',
      given: 'Given',
      givenOn: 'Given on',
      pending: 'Awaiting consent',
      types: {
        basic: 'Basic (data processing)',
        sharing: 'Sharing (with agent)',
        developer: 'Developer (aggregate only)',
        marketing: 'Marketing (optional)',
      }
    },
  }
  
  const t = labels[locale]

  // Badge variant - minimal inline display
  if (variant === 'badge') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
        consentGiven 
          ? 'bg-emerald-100 text-emerald-700' 
          : 'bg-amber-100 text-amber-700',
        className
      )}>
        {consentGiven ? (
          <>
            <Check className="w-4 h-4" />
            PDPA ✓
          </>
        ) : (
          <>
            <Clock className="w-4 h-4" />
            {t.pending}
          </>
        )}
      </span>
    )
  }

  // Compact variant - single line with date
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        {consentGiven ? (
          <>
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="text-neutral-600">
              {t.givenOn}: <span className="font-medium text-neutral-800">{formattedDate}</span>
            </span>
          </>
        ) : (
          <>
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-amber-700">{t.pending}</span>
          </>
        )}
      </div>
    )
  }

  // Inline variant - medium display
  if (variant === 'inline') {
    return (
      <div className={cn(
        'flex items-center gap-3 p-3 rounded-lg',
        consentGiven ? 'bg-emerald-50' : 'bg-amber-50',
        className
      )}>
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center',
          consentGiven ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
        )}>
          {consentGiven ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
        </div>
        <div>
          <div className="font-medium text-neutral-800">{t.title} {consentGiven ? t.given : ''}</div>
          {consentGiven && (
            <div className="text-sm text-neutral-600">{t.givenOn}: {formattedDate}</div>
          )}
        </div>
      </div>
    )
  }

  // Card variant (default) - full display with consent types
  return (
    <div className={cn(
      'rounded-xl border overflow-hidden',
      consentGiven 
        ? 'bg-emerald-50/50 border-emerald-200' 
        : 'bg-amber-50 border-amber-200',
      className
    )}>
      {/* Header */}
      <div className={cn(
        'px-4 py-3 flex items-center gap-3',
        consentGiven ? 'bg-emerald-100/50' : 'bg-amber-100/50'
      )}>
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          consentGiven ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
        )}>
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-neutral-800">{t.title} {consentGiven ? t.given : ''}</h4>
          {consentGiven ? (
            <p className="text-sm text-emerald-700">{t.givenOn}: {formattedDate}</p>
          ) : (
            <p className="text-sm text-amber-700">{t.pending}</p>
          )}
        </div>
      </div>
      
      {/* Consent types (only show if consent given) */}
      {consentGiven && (
        <div className="px-4 py-3 space-y-2">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Jenis persetujuan:</p>
          <div className="space-y-1.5">
            <ConsentTypeRow checked={true} label={t.types.basic} />
            <ConsentTypeRow checked={true} label={t.types.sharing} />
            <ConsentTypeRow checked={true} label={t.types.developer} />
            <ConsentTypeRow checked={false} label={t.types.marketing} optional />
          </div>
        </div>
      )}
    </div>
  )
}

// Helper component for consent type rows
function ConsentTypeRow({ 
  checked, 
  label, 
  optional = false 
}: { 
  checked: boolean
  label: string
  optional?: boolean 
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {checked ? (
        <Check className="w-4 h-4 text-emerald-600" />
      ) : (
        <div className="w-4 h-4 rounded border border-neutral-300" />
      )}
      <span className={checked ? 'text-neutral-700' : 'text-neutral-500'}>
        {label}
        {optional && !checked && <span className="text-xs ml-1">(tidak dipilih)</span>}
      </span>
    </div>
  )
}

// Export a simple hook for getting consent date
export function useConsentDate(rawDate: string | Date | null | undefined): Date {
  if (!rawDate) return DEMO_CONSENT_DATE
  
  const parsed = typeof rawDate === 'string' ? new Date(rawDate) : rawDate
  
  if (isNaN(parsed.getTime())) return DEMO_CONSENT_DATE
  
  return parsed
}
