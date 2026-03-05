// types/case.ts
// Core case entity types aligned with PRD v3.7.1
// L-1: Updated with proper loan type support
// P0-F: Added 12 critical LPPSA fields per Pemetaan Medan v2.0
// A9: Readiness v2 (5-component model), structured address, expanded field set

import type { LoanTypeCode } from '@/lib/config/loan-types';

export type CasePhase =
  | 'PRESCAN'
  | 'PRESCAN_COMPLETE'
  | 'DOCS_PENDING'
  | 'DOCS_COMPLETE'
  | 'IR_REVIEW'
  | 'TAC_SCHEDULED'
  | 'TAC_CONFIRMED'
  | 'SUBMITTED'
  | 'LO_RECEIVED'
  | 'KJ_PENDING'
  | 'COMPLETED';

export type ReadinessBand = 'ready' | 'caution' | 'not_ready';

export type DocStatus = 'pending' | 'uploaded' | 'verified' | 'rejected';

export type ConfidenceLevel = 'HIGH_CONFIDENCE' | 'LOW_CONFIDENCE' | 'NEEDS_REVIEW';

export interface Document {
  id: string;
  type: string;
  name: string;
  status: DocStatus;
  confidence?: number;
  confidenceLevel?: ConfidenceLevel;
  source?: string;
  uploadedAt?: string;
}

export interface ReadinessResult {
  band: ReadinessBand;
  label: string;
  guidance: string;
  // NOTE: Score is internal only, never exposed to UI per PRD Section 16.3
  // DEC-001: This is a readiness score, NEVER approval probability
  _internalScore?: number;
  // A9: Readiness v2 — 5-component breakdown (internal only)
  _breakdownV2?: {
    dokumen: number;       // 35% — Document completeness (0-1.0)
    medan: number;         // 25% — Field completeness (0-1.0)
    tandatangan: number;   // 15% — Signatures collected (0-1.0)
    validasi: number;      // 15% — Cross-field validation passes (0-1.0)
    kj: number;            // 10% — KJ endorsement readiness (0 or 1.0)
  };
  // Legacy 4-component breakdown (pre-A9, kept for backward compatibility)
  _breakdown?: {
    componentA: number; // Rule Coverage (0-30)
    componentB: number; // Income Pattern (0-25)
    componentC: number; // Commitment Signal (0-25)
    componentD: number; // Property Context (0-20)
  };
}

export interface TacSchedule {
  date: string;
  time: string;
  confirmed?: boolean;
  confirmedAt?: string;
}

export interface Property {
  name: string;
  unit: string;
  price: number;
  type: 'subsale' | 'new_project' | 'land_build';
  location: string;
}

// P0-F: Gelaran (title/salutation) as per LPPSA Borang Permohonan Page 3
export type Gelaran = 'Datuk' | 'Datin' | 'Tan Sri' | 'Puan Sri' | 'Encik' | 'Puan' | 'Cik' | 'Lain-lain';

// P0-F: Kumpulan Perkhidmatan (service group)
export type KumpulanPerkhidmatan =
  | 'PENGURUSAN DAN PROFESIONAL'
  | 'SOKONGAN'
  | 'KUMPULAN PELAKSANA';

// P0-F: Kategori Pinjaman — affects DSR threshold (60% first, 50% second)
export type KategoriPinjaman = 'HARTA PERTAMA' | 'HARTA KEDUA';

// A9: Structured Malaysian address (replaces generic Baris 1/2/3)
export interface StructuredAddress {
  noRumah?: string;            // ADDR_001: No Rumah / Lot
  namaJalan?: string;          // ADDR_002: Nama Jalan
  taman?: string;              // ADDR_003: Taman / Kampung / Kawasan
  bandar?: string;             // ADDR_004: Bandar
  poskod?: string;             // ADDR_005: Poskod (5-digit)
  negeri?: string;             // ADDR_006: Negeri (16 Malaysian states)
  daerah?: string;             // ADDR_007: Daerah
}

// P0-F: Spouse/Joint applicant information (LPPSA Borang Page 5, Section L)
export interface SpouseInfo {
  name: string;                // JNT_001: Nama Suami/Isteri
  ic: string;                  // JNT_002: No KP Baru (spouse)
  address?: string;            // JNT_003: Alamat (legacy, flat string)
  addressStructured?: StructuredAddress; // A9: Structured address
  phone?: string;              // JNT_004: No Telefon Bimbit
  phonePejabat?: string;       // JNT_005: No Telefon Pejabat/Rumah
  // A9: Extended joint applicant fields
  employer?: string;           // JNT_006: Nama Majikan
  jawatan?: string;            // JNT_007: Jawatan
  gajiPokok?: number;          // JNT_008: Gaji Pokok (RM)
  elaunTetap?: number;         // JNT_009: Elaun Tetap (RM)
  tarikhLantikan?: string;     // JNT_010: Tarikh Lantikan
  statusPerkhidmatan?: string; // JNT_011: Status Perkhidmatan
  kodPusatPembayar?: string;   // JNT_012: Kod Pusat Pembayar Gaji
}

// P0-F: Family emergency contact (LPPSA Borang Page 5)
export interface FamilyContact {
  name: string;                // FAM_001: Nama
  ic: string;                  // FAM_002: No KP Baru
  hubungan: string;            // FAM_003: Hubungan (IBU/AYAH/ADIK-BERADIK/ANAK/LAIN-LAIN)
  address?: string;            // FAM_004: Alamat (legacy, flat string)
  addressStructured?: StructuredAddress; // A9: Structured address
  phone?: string;              // FAM_005: Telefon
}

export interface BuyerInfo {
  id: string;
  name: string;
  phone: string;
  ic?: string;
  email?: string;
  // PRD Section 8.3: Agent cannot see exact salary
  // Only income range is exposed
  incomeRange?: string;
  occupation?: string;
  employer?: string;
  grade?: string;

  // =========================================================================
  // P0-F → A9: Expanded from 12 to 119 fields per Pemetaan Medan LPPSA v2.0
  // Source: Official LPPSA Borang Permohonan (9-page form)
  // Full field registry: lib/config/field-registry.ts
  // =========================================================================

  // --- ADDR (Address) Fields — A9: Structured Malaysian address ---
  alamatSuratMenyurat?: StructuredAddress; // C_ALAMAT: Alamat Surat-Menyurat
  alamatTetap?: StructuredAddress;         // C_ALAMAT: Alamat Tetap

  // --- PERS (Personal) Fields ---
  gelaran?: Gelaran;              // PERS_006B: Title/salutation
  icLama?: string;                // PERS_002B: No KP Lama/Polis/Tentera (conditional)
  phonePejabat?: string;          // PERS_012: No Telefon Pejabat/Rumah

  // --- EMP (Employment) Fields ---
  tarikhLantikanPertama?: string;    // EMP_003B: Tarikh Lantikan Skim Perkhidmatan Pertama (DD-MM-YYYY)
  tarikhPengesahanPertama?: string;  // EMP_003C: Tarikh Pengesahan Skim Perkhidmatan Pertama (DD-MM-YYYY)
  tarikhLantikanSekarang?: string;   // EMP_003D: Tarikh Lantikan Skim Perkhidmatan Sekarang (DD-MM-YYYY)
  kumpulan?: KumpulanPerkhidmatan;   // EMP_008B: Kumpulan (service group)
  umurPersaraan?: number;            // EMP_015: Umur Persaraan Wajib (integer TAHUN, e.g. 60)
  tarikhPersaraan?: string;          // EMP_016: Tarikh Persaraan Wajib (DD-MM-YYYY)
  kodPusatPembayar?: string;         // EMP_017: Kod Pusat Pembayar Gaji (12-digit code)

  // --- FIN (Financing) Fields ---
  kategoriPinjaman?: KategoriPinjaman; // FIN_001B: HARTA PERTAMA / HARTA KEDUA — affects DSR threshold

  // --- JNT (Joint/Spouse) Fields ---
  statusPerkahwinan?: 'BUJANG' | 'BERKAHWIN';  // PERS_007
  spouse?: SpouseInfo;                           // JNT_001-005
  familyContacts?: FamilyContact[];              // FAM_001-010 (up to 2 contacts)
}

export interface Case {
  id: string;
  buyer: BuyerInfo;
  property: Property;
  phase: CasePhase;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  loanType: string;
  loanTypeCode?: LoanTypeCode; // L-1: Typed loan type code (1-7)
  readiness?: ReadinessResult;
  documents: Document[];
  tacSchedule?: TacSchedule;
  kjStatus?: 'pending' | 'received' | 'overdue';
  kjDays?: number;
  loExpiry?: number;
  queryRisk?: 'none' | 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

// Extracted field from documents (KuasaTurbo output)
export interface ExtractedField {
  key: string;
  value: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  source: string;
  acknowledged: boolean;
}

// PRD Section 18.4: Field Classification
export type FieldClassification =
  | 'USER_INPUT'      // Entered by buyer/agent
  | 'AI_EXTRACTED'    // Extracted by system
  | 'SYSTEM_DERIVED'  // Calculated by system
  | 'LPPSA_GENERATED'
  | 'DEVELOPER_SOURCED';  // Entered by developer (APDL/Section M) // Created by LPPSA
