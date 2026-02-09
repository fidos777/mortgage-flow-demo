// lib/utils/mask-pii.ts
// PII Masking Utilities for Privacy Compliance
// PRD v3.6.1 - Agent can only see partial data

/**
 * Masks phone number for privacy display
 * Shows only last 4 digits
 * @example maskPhone('012-3456789') → '012-XXX-X789'
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '-'
  
  // Remove non-digit characters for processing
  const digitsOnly = phone.replace(/\D/g, '')
  
  if (digitsOnly.length < 4) return phone
  
  // Keep last 4 digits visible
  const visiblePart = digitsOnly.slice(-4)
  const maskedPart = digitsOnly.slice(0, -4)
  
  // Reconstruct with Malaysian format: 012-XXX-X789
  if (phone.includes('-') && maskedPart.length >= 3) {
    const prefix = maskedPart.slice(0, 3)
    const middle = 'X'.repeat(maskedPart.length - 3)
    return `${prefix}-${middle}-${visiblePart}`
  }
  
  // Fallback: just mask
  return 'X'.repeat(maskedPart.length) + visiblePart
}

/**
 * Masks IC number for privacy display
 * Shows only last 4 digits
 * @example maskIC('880515-14-5678') → 'XXXXXX-XX-5678'
 */
export function maskIC(ic: string | null | undefined): string {
  if (!ic) return '-'
  
  const digitsOnly = ic.replace(/\D/g, '')
  
  if (digitsOnly.length < 4) return ic
  
  const visiblePart = digitsOnly.slice(-4)
  const maskedLength = digitsOnly.length - 4
  
  // Malaysian IC format: XXXXXX-XX-5678
  if (maskedLength === 8) {
    return `XXXXXX-XX-${visiblePart}`
  }
  
  return 'X'.repeat(maskedLength) + visiblePart
}

/**
 * Masks email for privacy display
 * @example maskEmail('ahmad@gmail.com') → 'a***d@gmail.com'
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return '-'
  
  const [local, domain] = email.split('@')
  
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`
  }
  
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 3))}${local.slice(-1)}@${domain}`
}

/**
 * Format income as range (never show exact)
 * @example formatIncomeRange(4500) → 'RM 4,001 - RM 5,000'
 */
export function formatIncomeRange(income: number | null | undefined): string {
  if (!income) return '-'
  
  const ranges = [
    { min: 0, max: 2000, label: 'RM 0 - RM 2,000' },
    { min: 2001, max: 3000, label: 'RM 2,001 - RM 3,000' },
    { min: 3001, max: 4000, label: 'RM 3,001 - RM 4,000' },
    { min: 4001, max: 5000, label: 'RM 4,001 - RM 5,000' },
    { min: 5001, max: 6000, label: 'RM 5,001 - RM 6,000' },
    { min: 6001, max: 8000, label: 'RM 6,001 - RM 8,000' },
    { min: 8001, max: 10000, label: 'RM 8,001 - RM 10,000' },
    { min: 10001, max: Infinity, label: 'RM 10,000+' },
  ]
  
  const range = ranges.find(r => income >= r.min && income <= r.max)
  return range?.label || '-'
}
