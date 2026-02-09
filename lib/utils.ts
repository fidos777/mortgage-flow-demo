// lib/utils.ts
// Utility functions for snang.my

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with clsx
 * Commonly used pattern for conditional classNames
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// PII Masking (Privacy)
export {
  maskPhone,
  maskIC,
  maskEmail,
  formatIncomeRange
} from './utils/mask-pii'
