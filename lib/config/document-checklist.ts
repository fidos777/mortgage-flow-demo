// lib/config/document-checklist.ts
// CR-KP-002 Sprint 1 (A7): Document Checklist Configuration
// Per-loan-type document requirements with BM labels

import type { LoanTypeCode } from './loan-types';
import type { DocumentChecklistItem } from '@/types/cr-kp-002';

/**
 * Document type metadata with BM labels
 */
export interface DocumentMeta {
  type: string;
  label: string;        // BM display name
  labelEn: string;      // EN display name
  description?: string;  // Additional guidance
  icon: string;
  category: 'PERIBADI' | 'PEKERJAAN' | 'HARTANAH' | 'PINJAMAN';
}

/**
 * All document types used across loan types
 */
export const DOCUMENT_TYPES: Record<string, DocumentMeta> = {
  IC: {
    type: 'IC',
    label: 'Salinan Kad Pengenalan',
    labelEn: 'Identity Card Copy',
    description: 'Depan dan belakang, salinan jelas',
    icon: '🪪',
    category: 'PERIBADI',
  },
  SLIP_GAJI_ASAL: {
    type: 'SLIP_GAJI_ASAL',
    label: 'Slip Gaji Asal (3 bulan terkini)',
    labelEn: 'Original Salary Slips (Latest 3 months)',
    description: 'Slip gaji asal, bukan salinan',
    icon: '💰',
    category: 'PEKERJAAN',
  },
  PENYATA_BANK: {
    type: 'PENYATA_BANK',
    label: 'Penyata Bank (3 bulan terkini)',
    labelEn: 'Bank Statements (Latest 3 months)',
    description: 'Akaun gaji utama',
    icon: '🏦',
    category: 'PEKERJAAN',
  },
  SURAT_PENGESAHAN_MAJIKAN: {
    type: 'SURAT_PENGESAHAN_MAJIKAN',
    label: 'Surat Pengesahan Majikan',
    labelEn: 'Employer Confirmation Letter',
    icon: '📋',
    category: 'PEKERJAAN',
  },
  SPA: {
    type: 'SPA',
    label: 'Surat Perjanjian Jual Beli (SPA)',
    labelEn: 'Sale & Purchase Agreement',
    icon: '📝',
    category: 'HARTANAH',
  },
  GERAN_HAKMILIK: {
    type: 'GERAN_HAKMILIK',
    label: 'Geran Hakmilik / Salinan',
    labelEn: 'Title Deed / Copy',
    icon: '📜',
    category: 'HARTANAH',
  },
  GERAN_TANAH: {
    type: 'GERAN_TANAH',
    label: 'Geran Tanah',
    labelEn: 'Land Title',
    icon: '🗺️',
    category: 'HARTANAH',
  },
  PELAN_BANGUNAN: {
    type: 'PELAN_BANGUNAN',
    label: 'Pelan Bangunan (Diluluskan PBT)',
    labelEn: 'Building Plan (PBT Approved)',
    icon: '📐',
    category: 'HARTANAH',
  },
  KELULUSAN_PBT: {
    type: 'KELULUSAN_PBT',
    label: 'Surat Kelulusan PBT',
    labelEn: 'PBT Approval Letter',
    icon: '✅',
    category: 'HARTANAH',
  },
  SPA_TANAH: {
    type: 'SPA_TANAH',
    label: 'SPA Tanah',
    labelEn: 'Land Sale & Purchase Agreement',
    icon: '📝',
    category: 'HARTANAH',
  },
  PERJANJIAN_PEMBINAAN: {
    type: 'PERJANJIAN_PEMBINAAN',
    label: 'Perjanjian Pembinaan',
    labelEn: 'Construction Agreement',
    icon: '🏗️',
    category: 'HARTANAH',
  },
  LESEN_PEMAJU: {
    type: 'LESEN_PEMAJU',
    label: 'Lesen Pemaju (Sah)',
    labelEn: 'Developer License (Valid)',
    icon: '🏢',
    category: 'HARTANAH',
  },
  PENYATA_PINJAMAN_SEMASA: {
    type: 'PENYATA_PINJAMAN_SEMASA',
    label: 'Penyata Pinjaman Semasa',
    labelEn: 'Current Loan Statement',
    icon: '📊',
    category: 'PINJAMAN',
  },
  SEBUT_HARGA_KONTRAKTOR: {
    type: 'SEBUT_HARGA_KONTRAKTOR',
    label: 'Sebut Harga Kontraktor',
    labelEn: 'Contractor Quotation',
    icon: '💼',
    category: 'HARTANAH',
  },
  PELAN_UBAHSUAI: {
    type: 'PELAN_UBAHSUAI',
    label: 'Pelan Ubahsuai (Diluluskan)',
    labelEn: 'Renovation Plan (Approved)',
    icon: '🔧',
    category: 'HARTANAH',
  },
};

/**
 * Get document metadata by type
 */
export function getDocumentMeta(docType: string): DocumentMeta | null {
  return DOCUMENT_TYPES[docType] || null;
}

/**
 * Get all documents for a loan type grouped by category
 */
export function getDocumentsByCategory(
  loanTypeCode: LoanTypeCode,
  items: DocumentChecklistItem[]
): Record<string, (DocumentChecklistItem & { meta: DocumentMeta })[]> {
  const grouped: Record<string, (DocumentChecklistItem & { meta: DocumentMeta })[]> = {};

  for (const item of items) {
    const meta = DOCUMENT_TYPES[item.docType];
    if (!meta) continue;

    const category = meta.category;
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push({ ...item, meta });
  }

  return grouped;
}

/**
 * Category display names
 */
export const CATEGORY_LABELS: Record<string, { my: string; en: string; icon: string }> = {
  PERIBADI: { my: 'Dokumen Peribadi', en: 'Personal Documents', icon: '👤' },
  PEKERJAAN: { my: 'Dokumen Pekerjaan', en: 'Employment Documents', icon: '💼' },
  HARTANAH: { my: 'Dokumen Hartanah', en: 'Property Documents', icon: '🏠' },
  PINJAMAN: { my: 'Dokumen Pinjaman', en: 'Loan Documents', icon: '📋' },
};
