// types/cr-kp-002.ts
// CR-KP-002 Sprint 1: Foundation Types
// Booking, Pipeline, APDL, and Self-Check domain types

import type { LoanTypeCode } from '@/lib/config/loan-types';
import type { CasePhase, ReadinessBand, StructuredAddress, KategoriPinjaman, Gelaran } from './case';

// ─── A2: APDL Credential Types ───

export interface ApdlCredential {
  id: string;
  developerId: string;
  apdlNumber: string;        // APDL registration number
  companyName: string;
  expiryDate: string;         // ISO date
  status: ApdlStatus;
  verifiedAt?: string;
  lastChecked?: string;
}

export type ApdlStatus = 'active' | 'expired' | 'pending_verification' | 'revoked';

export interface ApdlVerificationResult {
  isValid: boolean;
  status: ApdlStatus;
  expiryDate?: string;
  companyName?: string;
  error?: string;
}

// ─── A3: Booking Types ───

export interface Booking {
  id: string;                 // QTK-YYYY-NNNNN format
  projectId: string;
  projectName: string;
  unitNo: string;
  buyerName: string;
  buyerPhone: string;
  buyerIc?: string;           // Only visible to agent, never to developer
  loanTypeCode: LoanTypeCode;
  bookingDate: string;        // ISO date
  bookingAmount?: number;     // RM
  status: BookingStatus;
  source: BookingSource;
  agentId?: string;
  agentName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus =
  | 'BOOKED'
  | 'PRESCAN_PENDING'
  | 'PRESCAN_DONE'
  | 'DOCS_COLLECTING'
  | 'DOCS_COMPLETE'
  | 'SUBMITTED'
  | 'KJ_PENDING'
  | 'COMPLETED'
  | 'CANCELLED';

export type BookingSource =
  | 'wa_buyer'       // WhatsApp from buyer
  | 'wa_agent'       // WhatsApp from agent
  | 'social'         // Social media link
  | 'direct'         // Direct booking
  | 'qr_link';       // QR/tracked link

// ─── A3: Pipeline Types ───

export interface PipelineEntry {
  bookingId: string;
  caseId?: string;            // Linked after PreScan
  phase: CasePhase;
  readinessBand?: ReadinessBand;
  daysSinceBooking: number;
  daysSinceLastUpdate: number;
  isStale: boolean;           // >14 days no update
  blockerCount: number;
  nextAction?: string;
  nextActionActor?: 'buyer' | 'agent' | 'developer' | 'system';
}

export interface PipelineSummary {
  totalBookings: number;
  byStatus: Record<BookingStatus, number>;
  byLoanType: Record<number, number>;
  staleCount: number;
  avgDaysInPipeline: number;
  completedThisMonth: number;
}

// ─── A4: Self-Check (PreScan) Types ───

export interface SelfCheckInput {
  gajiPokok: number;          // RM — Gaji Pokok (basic salary)
  elaunTetap?: number;        // RM — Elaun Tetap (fixed allowances)
  potonganWajib?: number;     // RM — Potongan Wajib (mandatory deductions: EPF, SOCSO, tax)
  komitmenBulanan?: number;   // RM — Komitmen Bulanan (monthly commitments: car, personal loans)
  hargaHartanah: number;      // RM — Harga Hartanah (property price)
  tempohPinjaman: number;     // Tahun — Tempoh Pinjaman (loan tenure)
  loanTypeCode: LoanTypeCode;
  kategoriPinjaman: KategoriPinjaman;
  umur: number;               // Age in years
}

export interface SelfCheckResult {
  pendapatanBersih: number;   // RM — Pendapatan Bersih (net income)
  dsr: number;                // % — Debt Service Ratio
  dsrThreshold: number;       // % — DSR threshold (60% first, 50% second)
  dsrPass: boolean;           // DSR within threshold
  maxTenure: number;          // Maximum eligible tenure
  tenurePass: boolean;        // Requested tenure within max
  ageAtMaturity: number;      // Age at loan maturity
  agePass: boolean;           // Age at maturity ≤ retirement age
  band: ReadinessBand;
  guidance: string;           // BM guidance text
  // DEC-001: NO approval probability. Only readiness band.
}

// ─── A4: Buyer Application Form Types ───

export interface BuyerApplicationData {
  // Section A: Pemohon (Applicant)
  nama: string;
  icBaru: string;
  icLama?: string;
  gelaran?: Gelaran;
  tarikhLahir?: string;
  bangsa?: string;
  agama?: string;
  jantina?: 'LELAKI' | 'PEREMPUAN';
  statusPerkahwinan?: 'BUJANG' | 'BERKAHWIN';

  // Section B: Alamat
  alamatSuratMenyurat?: StructuredAddress;
  alamatTetap?: StructuredAddress;
  telefon?: string;
  telefonPejabat?: string;
  email?: string;

  // Section C: Pekerjaan (Employment)
  namaJawatan?: string;
  namaMajikan?: string;
  alamatMajikan?: string;
  tarikhLantikan?: string;
  gred?: string;
  kumpulan?: string;

  // Section D: Pendapatan (Income)
  gajiPokok?: number;
  elaunTetap?: number;
  pendapatanLain?: number;

  // Section E: Pinjaman (Loan details)
  loanTypeCode: LoanTypeCode;
  kategoriPinjaman: KategoriPinjaman;
  jumlahPinjaman?: number;
  tempohPinjaman?: number;

  // Meta
  completedSections: string[];
  lastSavedAt?: string;
}

// ─── A5: Pipeline Action Types ───

export type PipelineAction =
  | 'SEND_REMINDER'           // Send reminder to buyer
  | 'REQUEST_DOCS'            // Request specific documents
  | 'ESCALATE_TO_AGENT'       // Escalate case to agent
  | 'SCHEDULE_TAC'            // Schedule TAC appointment
  | 'MARK_STALE'              // Mark case as stale
  | 'ARCHIVE';                // Archive completed case

export interface PipelineActionRequest {
  bookingId: string;
  action: PipelineAction;
  actor: 'developer' | 'agent' | 'system';
  note?: string;
  targetDate?: string;
}

export interface PipelineActionResult {
  success: boolean;
  action: PipelineAction;
  message: string;
  timestamp: string;
}

// ─── A7: Document Checklist Types ───

export interface DocumentChecklistItem {
  docType: string;            // e.g. 'IC', 'SLIP_GAJI_ASAL', 'SPA'
  label: string;              // BM display name
  required: boolean;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected' | 'not_applicable';
  uploadedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  loanTypeSpecific?: LoanTypeCode[]; // Only required for specific loan types
}

export interface DocumentChecklistSummary {
  total: number;
  completed: number;
  pending: number;
  rejected: number;
  completionPct: number;
}
