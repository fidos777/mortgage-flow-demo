// lib/services/cr-kp-002-services.ts
// CR-KP-002 Sprint 1: Service Layer
// Booking, Pipeline, APDL verification, Self-Check DSR calculation

import type { LoanTypeCode } from '@/lib/config/loan-types';
import { getLoanType } from '@/lib/config/loan-types';
import type {
  ApdlCredential,
  ApdlVerificationResult,
  Booking,
  BookingStatus,
  PipelineEntry,
  PipelineSummary,
  SelfCheckInput,
  SelfCheckResult,
  DocumentChecklistItem,
  DocumentChecklistSummary,
} from '@/types/cr-kp-002';
import type { CasePhase, ReadinessBand } from '@/types/case';

// ─── APDL Service ───

/**
 * Verify APDL credential validity
 * In production this would call APDL registry API
 */
export function verifyApdlCredential(
  credential: ApdlCredential
): ApdlVerificationResult {
  const now = new Date();
  const expiry = new Date(credential.expiryDate);

  if (credential.status === 'revoked') {
    return {
      isValid: false,
      status: 'revoked',
      error: 'Pendaftaran APDL telah dibatalkan',
    };
  }

  if (expiry < now) {
    return {
      isValid: false,
      status: 'expired',
      expiryDate: credential.expiryDate,
      error: 'Pendaftaran APDL telah tamat tempoh',
    };
  }

  return {
    isValid: true,
    status: 'active',
    expiryDate: credential.expiryDate,
    companyName: credential.companyName,
  };
}

/**
 * Check if APDL is required for a loan type
 * Jenis 3 (Land + Build) requires APDL verification
 */
export function isApdlRequired(loanTypeCode: LoanTypeCode): boolean {
  return loanTypeCode === 3;
}

// ─── Booking Service ───

/**
 * Generate a unique booking ID
 * Format: QTK-YYYY-NNNNN
 */
export function generateBookingId(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');
  return `QTK-${year}-${seq}`;
}

/**
 * Validate booking data before creation
 */
export function validateBooking(booking: Partial<Booking>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!booking.projectId) errors.push('ID projek diperlukan');
  if (!booking.unitNo) errors.push('No unit diperlukan');
  if (!booking.buyerName) errors.push('Nama pembeli diperlukan');
  if (!booking.buyerPhone) errors.push('No telefon pembeli diperlukan');
  if (!booking.loanTypeCode) errors.push('Jenis pinjaman diperlukan');

  // Validate phone format (Malaysian)
  if (booking.buyerPhone && !/^(\+?60|0)\d{9,10}$/.test(booking.buyerPhone.replace(/[\s-]/g, ''))) {
    errors.push('Format no telefon tidak sah');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get pipeline entry from booking
 */
export function bookingToPipelineEntry(
  booking: Booking,
  readinessBand?: ReadinessBand,
  blockerCount = 0
): PipelineEntry {
  const now = new Date();
  const bookingDate = new Date(booking.createdAt);
  const daysSinceBooking = Math.floor(
    (now.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const updatedDate = new Date(booking.updatedAt);
  const daysSinceLastUpdate = Math.floor(
    (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Map booking status to case phase
  const phaseMap: Record<BookingStatus, CasePhase> = {
    BOOKED: 'PRESCAN',
    PRESCAN_PENDING: 'PRESCAN',
    PRESCAN_DONE: 'PRESCAN_COMPLETE',
    DOCS_COLLECTING: 'DOCS_PENDING',
    DOCS_COMPLETE: 'DOCS_COMPLETE',
    SUBMITTED: 'SUBMITTED',
    KJ_PENDING: 'KJ_PENDING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'PRESCAN', // Show as initial state
  };

  return {
    bookingId: booking.id,
    phase: phaseMap[booking.status] || 'PRESCAN',
    readinessBand,
    daysSinceBooking,
    daysSinceLastUpdate,
    isStale: daysSinceLastUpdate > 14,
    blockerCount,
    nextAction: getNextAction(booking.status),
    nextActionActor: getNextActionActor(booking.status),
  };
}

function getNextAction(status: BookingStatus): string {
  const actions: Record<BookingStatus, string> = {
    BOOKED: 'Hantar jemputan PreScan',
    PRESCAN_PENDING: 'Menunggu pembeli lengkapkan PreScan',
    PRESCAN_DONE: 'Semak hasil PreScan',
    DOCS_COLLECTING: 'Kumpul dokumen',
    DOCS_COMPLETE: 'Hantar untuk semakan IR',
    SUBMITTED: 'Menunggu keputusan',
    KJ_PENDING: 'Tunggu endorsement Ketua Jabatan',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
  };
  return actions[status] || '';
}

function getNextActionActor(status: BookingStatus): 'buyer' | 'agent' | 'developer' | 'system' {
  const actors: Record<BookingStatus, 'buyer' | 'agent' | 'developer' | 'system'> = {
    BOOKED: 'developer',
    PRESCAN_PENDING: 'buyer',
    PRESCAN_DONE: 'agent',
    DOCS_COLLECTING: 'buyer',
    DOCS_COMPLETE: 'agent',
    SUBMITTED: 'system',
    KJ_PENDING: 'buyer',
    COMPLETED: 'system',
    CANCELLED: 'system',
  };
  return actors[status] || 'system';
}

/**
 * Calculate pipeline summary from bookings
 */
export function calculatePipelineSummary(bookings: Booking[]): PipelineSummary {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const byStatus = {} as Record<BookingStatus, number>;
  const byLoanType = {} as Record<number, number>;
  let totalDays = 0;
  let staleCount = 0;
  let completedThisMonth = 0;

  for (const b of bookings) {
    // By status
    byStatus[b.status] = (byStatus[b.status] || 0) + 1;

    // By loan type
    byLoanType[b.loanTypeCode] = (byLoanType[b.loanTypeCode] || 0) + 1;

    // Days in pipeline
    const created = new Date(b.createdAt);
    totalDays += Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

    // Stale check
    const updated = new Date(b.updatedAt);
    if (Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)) > 14) {
      staleCount++;
    }

    // Completed this month
    if (b.status === 'COMPLETED') {
      const completedDate = new Date(b.updatedAt);
      if (completedDate.getMonth() === thisMonth && completedDate.getFullYear() === thisYear) {
        completedThisMonth++;
      }
    }
  }

  return {
    totalBookings: bookings.length,
    byStatus,
    byLoanType,
    staleCount,
    avgDaysInPipeline: bookings.length > 0 ? Math.round(totalDays / bookings.length) : 0,
    completedThisMonth,
  };
}

// ─── Self-Check (DSR Calculation) Service ───

// LPPSA 4.25% fixed rate
const LPPSA_ANNUAL_RATE = 0.0425;
const LPPSA_MONTHLY_RATE = LPPSA_ANNUAL_RATE / 12;
const MAX_AGE_AT_MATURITY = 90; // LPPSA max age at loan maturity

/**
 * Calculate monthly installment using reducing balance formula
 */
export function calculateMonthlyInstallment(
  principal: number,
  annualRate: number,
  tenureYears: number
): number {
  const r = annualRate / 12;
  const n = tenureYears * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/**
 * Self-Check DSR calculation
 * DEC-001: This calculates readiness band, NOT approval probability
 */
export function calculateSelfCheck(input: SelfCheckInput): SelfCheckResult {
  // Calculate net income
  const pendapatanBersih =
    input.gajiPokok +
    (input.elaunTetap || 0) -
    (input.potonganWajib || 0);

  // Calculate LPPSA monthly installment
  const monthlyInstallment = calculateMonthlyInstallment(
    input.hargaHartanah,
    LPPSA_ANNUAL_RATE,
    input.tempohPinjaman
  );

  // Total monthly commitments including new loan
  const totalCommitments = (input.komitmenBulanan || 0) + monthlyInstallment;

  // DSR calculation
  const dsr = pendapatanBersih > 0
    ? (totalCommitments / pendapatanBersih) * 100
    : 100;

  // DSR threshold: 60% for first property, 50% for second
  const dsrThreshold = input.kategoriPinjaman === 'HARTA PERTAMA' ? 60 : 50;
  const dsrPass = dsr <= dsrThreshold;

  // Max tenure from loan type config
  const loanConfig = getLoanType(input.loanTypeCode);
  const maxTenure = loanConfig?.maxTenure || 35;
  const tenurePass = input.tempohPinjaman <= maxTenure;

  // Age at maturity check
  const ageAtMaturity = input.umur + input.tempohPinjaman;
  const agePass = ageAtMaturity <= MAX_AGE_AT_MATURITY;

  // Determine readiness band
  let band: ReadinessBand;
  let guidance: string;

  if (dsrPass && tenurePass && agePass) {
    band = 'ready';
    guidance = `DSR anda ${dsr.toFixed(1)}% — dalam had ${dsrThreshold}%. Sila teruskan dengan permohonan penuh.`;
  } else if (!dsrPass && dsr <= dsrThreshold + 10) {
    band = 'caution';
    guidance = `DSR anda ${dsr.toFixed(1)}% — melebihi had ${dsrThreshold}% sedikit. Pertimbangkan mengurangkan komitmen atau tempoh pinjaman.`;
  } else if (!agePass) {
    band = 'caution';
    guidance = `Umur semasa tamat pinjaman (${ageAtMaturity} tahun) melebihi had ${MAX_AGE_AT_MATURITY} tahun. Kurangkan tempoh pinjaman.`;
  } else if (!tenurePass) {
    band = 'caution';
    guidance = `Tempoh pinjaman ${input.tempohPinjaman} tahun melebihi had ${maxTenure} tahun untuk Jenis ${input.loanTypeCode}.`;
  } else {
    band = 'not_ready';
    guidance = `DSR anda ${dsr.toFixed(1)}% — melebihi had ${dsrThreshold}% dengan ketara. Perlu kurangkan komitmen bulanan sebelum memohon.`;
  }

  return {
    pendapatanBersih,
    dsr: Math.round(dsr * 10) / 10,
    dsrThreshold,
    dsrPass,
    maxTenure,
    tenurePass,
    ageAtMaturity,
    agePass,
    band,
    guidance,
  };
}

// ─── Document Checklist Service ───

/**
 * Generate document checklist for a loan type
 */
export function generateDocumentChecklist(
  loanTypeCode: LoanTypeCode
): DocumentChecklistItem[] {
  const loanConfig = getLoanType(loanTypeCode);
  if (!loanConfig) return [];

  const docLabels: Record<string, string> = {
    IC: 'Salinan Kad Pengenalan',
    SLIP_GAJI_ASAL: 'Slip Gaji Asal (3 bulan terkini)',
    PENYATA_BANK: 'Penyata Bank (3 bulan terkini)',
    SURAT_PENGESAHAN_MAJIKAN: 'Surat Pengesahan Majikan',
    SPA: 'Surat Perjanjian Jual Beli (SPA)',
    GERAN_HAKMILIK: 'Geran Hakmilik / Salinan',
    GERAN_TANAH: 'Geran Tanah',
    PELAN_BANGUNAN: 'Pelan Bangunan (Diluluskan PBT)',
    KELULUSAN_PBT: 'Surat Kelulusan PBT',
    SPA_TANAH: 'SPA Tanah',
    PERJANJIAN_PEMBINAAN: 'Perjanjian Pembinaan',
    LESEN_PEMAJU: 'Lesen Pemaju (Sah)',
    PENYATA_PINJAMAN_SEMASA: 'Penyata Pinjaman Semasa',
    SEBUT_HARGA_KONTRAKTOR: 'Sebut Harga Kontraktor',
    PELAN_UBAHSUAI: 'Pelan Ubahsuai (Diluluskan)',
  };

  return loanConfig.requiredDocs.map(docType => ({
    docType,
    label: docLabels[docType] || docType.replace(/_/g, ' '),
    required: true,
    status: 'pending' as const,
  }));
}

/**
 * Calculate document checklist summary
 */
export function calculateChecklistSummary(
  items: DocumentChecklistItem[]
): DocumentChecklistSummary {
  const requiredItems = items.filter(i => i.required && i.status !== 'not_applicable');
  const completed = requiredItems.filter(
    i => i.status === 'uploaded' || i.status === 'verified'
  ).length;
  const pending = requiredItems.filter(i => i.status === 'pending').length;
  const rejected = requiredItems.filter(i => i.status === 'rejected').length;

  return {
    total: requiredItems.length,
    completed,
    pending,
    rejected,
    completionPct:
      requiredItems.length > 0
        ? Math.round((completed / requiredItems.length) * 100)
        : 0,
  };
}
