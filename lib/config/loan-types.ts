// lib/config/loan-types.ts
// L-1: LPPSA 7 Loan Types Configuration
// Demo Focus: Type 1 (Subsale) & Type 3 (Tanah + Bina)

/**
 * LPPSA Loan Type Codes
 */
export type LoanTypeCode = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Loan Type Configuration
 */
export interface LoanTypeConfig {
  code: LoanTypeCode;
  nameMy: string;          // Malay name
  nameEn: string;          // English name
  shortName: string;       // Short display name
  description: string;     // Brief description
  propertyType: string;    // Type of property
  demoSupport: 'full' | 'partial' | 'planned';
  requiredDocs: string[];  // Document types required
  specialRules: string[];  // Special eligibility rules
  maxTenure: number;       // Maximum loan tenure in years
  icon: string;            // Emoji icon
}

/**
 * All 7 LPPSA Loan Types
 */
export const LOAN_TYPES: Record<LoanTypeCode, LoanTypeConfig> = {
  1: {
    code: 1,
    nameMy: 'Rumah Siap (Subsale)',
    nameEn: 'Completed House (Subsale)',
    shortName: 'Subsale',
    description: 'Pembelian rumah siap dari pemilik sedia ada',
    propertyType: 'Rumah siap',
    demoSupport: 'full',
    requiredDocs: [
      'IC',
      'SLIP_GAJI',
      'PENYATA_BANK',
      'SURAT_PENGESAHAN_MAJIKAN',
      'SPA',
      'GERAN_HAKMILIK',
    ],
    specialRules: [
      'Rumah mesti berumur tidak melebihi 30 tahun',
      'Pemilik semasa mesti tidak mempunyai hutang tertunggak',
    ],
    maxTenure: 35,
    icon: '🏠',
  },
  2: {
    code: 2,
    nameMy: 'Pembinaan Rumah',
    nameEn: 'House Construction',
    shortName: 'Pembinaan',
    description: 'Pembinaan rumah di atas tanah sendiri',
    propertyType: 'Tanah + pembinaan',
    demoSupport: 'planned',
    requiredDocs: [
      'IC',
      'SLIP_GAJI',
      'PENYATA_BANK',
      'SURAT_PENGESAHAN_MAJIKAN',
      'GERAN_TANAH',
      'PELAN_BANGUNAN',
      'KELULUSAN_PBT',
    ],
    specialRules: [
      'Tanah mesti atas nama pemohon',
      'Pelan bangunan mesti diluluskan oleh PBT',
    ],
    maxTenure: 35,
    icon: '🏗️',
  },
  3: {
    code: 3,
    nameMy: 'Tanah + Bina Rumah',
    nameEn: 'Land + Build House',
    shortName: 'Tanah + Bina',
    description: 'Pembelian tanah dan pembinaan rumah serentak',
    propertyType: 'Tanah + pembinaan',
    demoSupport: 'full',
    requiredDocs: [
      'IC',
      'SLIP_GAJI',
      'PENYATA_BANK',
      'SURAT_PENGESAHAN_MAJIKAN',
      'SPA_TANAH',
      'PERJANJIAN_PEMBINAAN',
      'PELAN_BANGUNAN',
    ],
    specialRules: [
      'Tanah dan pembinaan mesti dari pemaju yang sama atau berbeza',
      'CFO dalam tempoh 24 bulan',
    ],
    maxTenure: 35,
    icon: '🏡',
  },
  4: {
    code: 4,
    nameMy: 'Dalam Pembinaan',
    nameEn: 'Under Construction',
    shortName: 'Dalam Bina',
    description: 'Pembelian rumah yang masih dalam pembinaan',
    propertyType: 'Projek pemaju',
    demoSupport: 'planned',
    requiredDocs: [
      'IC',
      'SLIP_GAJI',
      'PENYATA_BANK',
      'SURAT_PENGESAHAN_MAJIKAN',
      'SPA',
      'LESEN_PEMAJU',
    ],
    specialRules: [
      'Pemaju mesti mempunyai lesen pemaju yang sah',
      'Projek mesti didaftarkan dengan KPKT',
    ],
    maxTenure: 35,
    icon: '🏗️',
  },
  5: {
    code: 5,
    nameMy: 'Refinance',
    nameEn: 'Refinancing',
    shortName: 'Refinance',
    description: 'Pembiayaan semula pinjaman perumahan sedia ada',
    propertyType: 'Rumah sedia ada',
    demoSupport: 'planned',
    requiredDocs: [
      'IC',
      'SLIP_GAJI',
      'PENYATA_BANK',
      'SURAT_PENGESAHAN_MAJIKAN',
      'PENYATA_PINJAMAN_SEMASA',
      'GERAN_HAKMILIK',
    ],
    specialRules: [
      'Pinjaman semasa mesti dari institusi kewangan berlesen',
      'Tiada tunggakan 3 bulan berturut-turut',
    ],
    maxTenure: 35,
    icon: '🔄',
  },
  6: {
    code: 6,
    nameMy: 'Ubahsuai Rumah',
    nameEn: 'Home Renovation',
    shortName: 'Ubahsuai',
    description: 'Pengubahsuaian atau pembesaran rumah sedia ada',
    propertyType: 'Rumah sedia ada',
    demoSupport: 'planned',
    requiredDocs: [
      'IC',
      'SLIP_GAJI',
      'PENYATA_BANK',
      'SURAT_PENGESAHAN_MAJIKAN',
      'GERAN_HAKMILIK',
      'SEBUT_HARGA_KONTRAKTOR',
      'PELAN_UBAHSUAI',
    ],
    specialRules: [
      'Rumah mesti atas nama pemohon',
      'Ubahsuai mesti mematuhi undang-undang PBT',
    ],
    maxTenure: 15,
    icon: '🔧',
  },
  7: {
    code: 7,
    nameMy: 'Pembelian Tanah',
    nameEn: 'Land Purchase',
    shortName: 'Tanah',
    description: 'Pembelian tanah sahaja tanpa pembinaan',
    propertyType: 'Tanah',
    demoSupport: 'planned',
    requiredDocs: [
      'IC',
      'SLIP_GAJI',
      'PENYATA_BANK',
      'SURAT_PENGESAHAN_MAJIKAN',
      'SPA_TANAH',
      'GERAN_TANAH',
    ],
    specialRules: [
      'Tanah mesti untuk kegunaan kediaman',
      'Status tanah mesti lot banglo/perumahan',
    ],
    maxTenure: 25,
    icon: '🌍',
  },
};

/**
 * Get loan type by code
 */
export function getLoanType(code: LoanTypeCode): LoanTypeConfig {
  return LOAN_TYPES[code];
}

/**
 * Get loan type by string (e.g., "Jenis 1 - Rumah Siap (Subsale)")
 */
export function getLoanTypeByString(loanTypeString: string): LoanTypeConfig | null {
  const match = loanTypeString.match(/Jenis\s*(\d)/i);
  if (match) {
    const code = parseInt(match[1]) as LoanTypeCode;
    if (code >= 1 && code <= 7) {
      return LOAN_TYPES[code];
    }
  }
  return null;
}

/**
 * Format loan type for display
 */
export function formatLoanType(code: LoanTypeCode): string {
  const type = LOAN_TYPES[code];
  return `Jenis ${code} - ${type.nameMy}`;
}

/**
 * Get all loan types
 */
export function getAllLoanTypes(): LoanTypeConfig[] {
  return Object.values(LOAN_TYPES);
}

/**
 * Get demo-supported loan types only
 */
export function getDemoSupportedTypes(): LoanTypeConfig[] {
  return Object.values(LOAN_TYPES).filter(t => t.demoSupport === 'full');
}

/**
 * Check if loan type is demo-ready
 */
export function isDemoSupported(code: LoanTypeCode): boolean {
  return LOAN_TYPES[code]?.demoSupport === 'full';
}

/**
 * Get document checklist for loan type
 */
export function getDocumentChecklist(code: LoanTypeCode): string[] {
  return LOAN_TYPES[code]?.requiredDocs || [];
}

/**
 * Get color configuration for loan type badges
 */
export function getLoanTypeColor(code: LoanTypeCode): {
  bg: string;
  text: string;
  border: string;
} {
  const colors: Record<LoanTypeCode, { bg: string; text: string; border: string }> = {
    1: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    2: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    3: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    4: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    5: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    6: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    7: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  };
  return colors[code] || colors[1];
}

/**
 * Parse loan type code from string
 */
export function parseLoanTypeCode(input: string): LoanTypeCode | null {
  // Handle "Jenis X" format
  const jenisMatch = input.match(/Jenis\s*(\d)/i);
  if (jenisMatch) {
    const code = parseInt(jenisMatch[1]);
    if (code >= 1 && code <= 7) return code as LoanTypeCode;
  }

  // Handle numeric string
  const num = parseInt(input);
  if (num >= 1 && num <= 7) return num as LoanTypeCode;

  return null;
}
