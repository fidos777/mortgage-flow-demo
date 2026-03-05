// lib/config/field-registry.ts
// P0-F: LPPSA Field Registry v2.0 — 123 Fields Across 14 Sections
// Source: Official LPPSA Borang Permohonan (9-page form)
// CR-KP-002 Sprint 1: Portal Kit Copy-Next field registry rebuild (A9)
// Maps all Pemetaan Medan v2.0 fields with validation, format, and section metadata

import type { FieldClassification } from '@/types/case';
import type { LoanTypeCode } from '@/lib/config/loan-types';

/**
 * Field priority in the v2.0 spec
 */
export type FieldPriority = 'P0' | 'P1' | 'P2';

/**
 * LPPSA Borang section mapping (14 sections per SPPB portal 3.1–3.9 + sub-sections)
 */
export type BorangSection =
  | 'A_PERMOHONAN'      // Section A: Jenis Permohonan (Page 1)
  | 'B_PEMOHON'         // Section B: Maklumat Pemohon (Page 3)
  | 'C_ALAMAT'          // Section C: Alamat (Page 3-4)
  | 'D_PERKHIDMATAN'    // Section D: Maklumat Perkhidmatan (Page 4)
  | 'E_PINJAMAN'        // Section E: Maklumat Pinjaman (Page 6)
  | 'F_HARTANAH'        // Section F: Maklumat Hartanah (Page 6)
  | 'G_KOMITMEN'        // Section G: Komitmen Kewangan (Page 5)
  | 'H_PEGUAM'          // Section H: Maklumat Peguam (Page 7)
  | 'J_INSURANS'        // Section J: Insurans/Takaful (Page 7)
  | 'K_PERAKUAN'        // Section K: Perakuan Pemohon (Page 8)
  | 'L_KELUARGA'        // Section L: Maklumat Suami/Isteri/Keluarga (Page 5)
  | 'M_PEMAJU'          // Section M: Maklumat Kontraktor/Pemaju (Page 7) — Jenis 3 only
  | 'N_WARIS'           // Section N: Waris/Keluarga Terdekat (Page 5)
  | 'P_TANDATANGAN';    // Section P: Tandatangan (Page 9)

/**
 * Readiness score component v2 model (5 components)
 */
export type ReadinessComponent =
  | 'DOKUMEN'       // 35% — Document completeness
  | 'MEDAN'         // 25% — Field completeness
  | 'TANDATANGAN'   // 15% — Signatures collected
  | 'VALIDASI'      // 15% — Cross-field validation passes
  | 'KJ';           // 10% — KJ endorsement readiness

/**
 * Malaysian states dropdown values
 */
export const NEGERI_MALAYSIA = [
  'JOHOR',
  'KEDAH',
  'KELANTAN',
  'MELAKA',
  'NEGERI SEMBILAN',
  'PAHANG',
  'PERAK',
  'PERLIS',
  'PULAU PINANG',
  'SABAH',
  'SARAWAK',
  'SELANGOR',
  'TERENGGANU',
  'WILAYAH PERSEKUTUAN KUALA LUMPUR',
  'WILAYAH PERSEKUTUAN PUTRAJAYA',
  'WILAYAH PERSEKUTUAN LABUAN',
] as const;

/**
 * Hubungan (Family Relationship) dropdown values
 */
export const HUBUNGAN_OPTIONS = [
  'IBU',
  'AYAH',
  'ADIK-BERADIK',
  'ANAK',
  'PASANGAN',
  'LAIN-LAIN',
] as const;

/**
 * Field definition in the LPPSA field registry
 */
export interface FieldDefinition {
  id: string;                          // v2.0 field ID (e.g. EMP_003B)
  nameMy: string;                      // Official Malay field name
  nameEn: string;                      // English field name
  section: BorangSection;              // LPPSA Borang section
  borangPage: number;                  // Physical borang page number
  priority: FieldPriority;             // v2.0 priority
  required: boolean;                   // Wajib in borang?
  conditional?: string;                // Condition for display (if any)
  jenisConditional?: number[];         // Only show for specific Jenis types (e.g. [3] for Jenis 3 only)
  jointConditional?: boolean;          // Only show if joint applicant
  format: string;                      // Expected format
  validation?: RegExp | string;        // Validation pattern
  dropdownValues?: string[];           // Allowed values for dropdown fields
  classification: FieldClassification; // Data origin type
  affectsReadiness: boolean;           // Does this field affect readiness scoring?
  readinessComponent?: ReadinessComponent; // Which scoring component it feeds
  copyNextGroup?: number;              // Group number for Copy-Next panel ordering
  notes?: string;                      // Implementation notes
}

/**
 * Readiness Score v2 Model Configuration
 */
export const READINESS_V2_MODEL = {
  components: {
    DOKUMEN: { weight: 0.35, label: 'Dokumen', labelEn: 'Documents' },
    MEDAN: { weight: 0.25, label: 'Medan', labelEn: 'Fields' },
    TANDATANGAN: { weight: 0.15, label: 'Tandatangan', labelEn: 'Signatures' },
    VALIDASI: { weight: 0.15, label: 'Validasi', labelEn: 'Validation' },
    KJ: { weight: 0.10, label: 'KJ', labelEn: 'KJ Endorsement' },
  },
  thresholds: {
    ready: 0.85,    // ≥85% = Ready
    caution: 0.60,  // 60-84% = Caution
    // <60% = Not Ready
  },
} as const;

/**
 * All 119 fields from Pemetaan Medan v2.0 across 14 sections
 */
export const ALL_FIELDS: FieldDefinition[] = [
  // ============================================================================
  // SECTION A: A_PERMOHONAN (3 fields) — Jenis Permohonan
  // ============================================================================
  {
    id: 'APP_001',
    nameMy: 'Jenis Pembiayaan',
    nameEn: 'Type of Financing',
    section: 'A_PERMOHONAN',
    borangPage: 1,
    priority: 'P0',
    required: true,
    format: 'Dropdown',
    dropdownValues: [
      'Jenis 1 - Membeli Rumah Yang Telah Siap',
      'Jenis 2 - Membina Rumah Di Atas Tanah Sendiri',
      'Jenis 3 - Membeli Rumah Dalam Pembinaan',
      'Jenis 4 - Membeli Tanah Untuk Pembinaan Rumah',
      'Jenis 5 - Menyelesaikan Hutang Pinjaman Bank',
      'Jenis 6 - Membina Rumah Di Tanah Pinjaman Kerajaan',
      'Jenis 7 - Kerja Ubahsuai Rumah Kediaman',
    ],
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 1,
    notes: 'Determines visibility of developer/contractor section (Jenis 3 only)',
  },
  {
    id: 'APP_002',
    nameMy: 'Kategori Pinjaman',
    nameEn: 'Loan Category',
    section: 'A_PERMOHONAN',
    borangPage: 1,
    priority: 'P0',
    required: true,
    format: 'Dropdown',
    dropdownValues: ['HARTA PERTAMA', 'HARTA KEDUA'],
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 1,
    notes: 'CRITICAL: HARTA PERTAMA = DSR ≤ 60%, HARTA KEDUA = DSR ≤ 50%',
  },
  {
    id: 'APP_003',
    nameMy: 'Pembiayaan Bersama',
    nameEn: 'Joint Financing',
    section: 'A_PERMOHONAN',
    borangPage: 1,
    priority: 'P1',
    required: true,
    format: 'Dropdown',
    dropdownValues: ['Ya', 'Tidak'],
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 1,
    notes: 'Shows L_KELUARGA section if Ya',
  },

  // ============================================================================
  // SECTION B: B_PEMOHON (15 fields) — Maklumat Pemohon
  // ============================================================================
  {
    id: 'PERS_001',
    nameMy: 'Nama Penuh',
    nameEn: 'Full Name',
    section: 'B_PEMOHON',
    borangPage: 3,
    priority: 'P0',
    required: true,
    format: 'Text, HURUF BESAR',
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 2,
    notes: 'Auto-populated from registration system',
  },
  {
    id: 'PERS_002',
    nameMy: 'No KP Baru',
    nameEn: 'New IC Number',
    section: 'B_PEMOHON',
    borangPage: 3,
    priority: 'P0',
    required: true,
    format: '12-digit YYMMDD-PB-XXXX',
    validation: /^\d{12}$/,
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 2,
    notes: 'Auto from registration, 12-digit format',
  },
  {
    id: 'PERS_002B',
    nameMy: 'No KP Lama / Polis / Tentera',
    nameEn: 'Old IC / Police / Military Number',
    section: 'B_PEMOHON',
    borangPage: 3,
    priority: 'P1',
    required: false,
    conditional: 'Only if pemohon has old-format IC',
    format: 'Alphanumeric (e.g. A123456)',
    validation: /^[A-Z]?\d{6,8}$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 2,
    notes: 'Conditional field — only shows if applicable',
  },
  {
    id: 'PERS_003',
    nameMy: 'Tarikh Lahir',
    nameEn: 'Date of Birth',
    section: 'B_PEMOHON',
    borangPage: 3,
    priority: 'P0',
    required: true,
    format: 'DD-MM-YYYY',
    validation: /^\d{2}-\d{2}-\d{4}$/,
    classification: 'SYSTEM_DERIVED',
    affectsReadiness: false,
    copyNextGroup: 2,
    notes: 'Derived from PERS_002',
  },
  {
    id: 'PERS_004',
    nameMy: 'Jantina',
    nameEn: 'Gender',
    section: 'B_PEMOHON',
    borangPage: 3,
    priority: 'P0',
    required: true,
    format: 'Dropdown',
    dropdownValues: ['LELAKI', 'PEREMPUAN'],
    classification: 'SYSTEM_DERIVED',
    affectsReadiness: false,
    copyNextGroup: 2,
    notes: 'Derived from PERS_002',
  },
  {
    id: 'PERS_005',
    nameMy: 'Bangsa',
    nameEn: 'Race',
    section: 'B_PEMOHON',
    borangPage: 3,
    priority: 'P1',
    required: true,
    format: 'Dropdown',
    dropdownValues: ['MELAYU', 'CINA', 'INDIA', 'LAIN-LAIN'],
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 2,
  },
  {
    id: 'PERS_006',
    nameMy: 'Agama',
    nameEn: 'Religion',
    section: 'B_PEMOHON',
    borangPage: 3,
    priority: 'P1',
    required: true,
    format: 'Dropdown',
    dropdownValues: ['ISLAM', 'KRISTIAN', 'BUDDHA', 'HINDU', 'LAIN-LAIN'],
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 2,
  },
  {
    id: 'PERS_006B',
    nameMy: 'Gelaran',
    nameEn: 'Title/Salutation',
    section: 'B_PEMOHON',
    borangPage: 3,
    priority: 'P1',
    required: false,
    format: 'Dropdown',
    dropdownValues: ['Datuk', 'Datin', 'Tan Sri', 'Puan Sri', 'Encik', 'Puan', 'Cik', 'Lain-lain'],
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 2,
    notes: 'First field in SPPB portal Section 3.1',
  },
  {
    id: 'PERS_007',
    nameMy: 'Status Perkahwinan',
    nameEn: 'Marital Status',
    section: 'B_PEMOHON',
    borangPage: 3,
    priority: 'P0',
    required: true,
    format: 'Dropdown',
    dropdownValues: ['BUJANG', 'BERKAHWIN', 'JANDA', 'DUDA'],
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 2,
    notes: 'Conditional: BERKAHWIN shows L_KELUARGA section',
  },
  {
    id: 'PERS_008',
    nameMy: 'Bilangan Tanggungan',
    nameEn: 'Number of Dependents',
    section: 'B_PEMOHON',
    borangPage: 3,
    priority: 'P1',
    required: true,
    format: 'Integer',
    validation: /^\d{1,2}$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 2,
  },
  {
    id: 'PERS_009',
    nameMy: 'No Telefon Bimbit',
    nameEn: 'Mobile Phone',
    section: 'B_PEMOHON',
    borangPage: 3,
    priority: 'P0',
    required: true,
    format: 'Phone (e.g. 012-34567890)',
    validation: /^0\d{1,2}-?\d{7,8}$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 2,
  },
  {
    id: 'PERS_010',
    nameMy: 'Email',
    nameEn: 'Email Address',
    section: 'B_PEMOHON',
    borangPage: 3,
    priority: 'P1',
    required: false,
    format: 'Email',
    validation: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 2,
  },
  {
    id: 'PERS_011',
    nameMy: 'No Telefon Rumah',
    nameEn: 'Home Phone',
    section: 'B_PEMOHON',
    borangPage: 3,
    priority: 'P1',
    required: false,
    format: 'Phone (e.g. 03-87654321)',
    validation: /^0\d{1,2}-?\d{7,8}$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 2,
  },
  {
    id: 'PERS_012',
    nameMy: 'No Telefon Pejabat / Rumah',
    nameEn: 'Office / Home Phone',
    section: 'B_PEMOHON',
    borangPage: 3,
    priority: 'P0',
    required: true,
    format: 'Phone (e.g. 03-87654321)',
    validation: /^0\d{1,2}-?\d{7,8}$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 2,
  },
  {
    id: 'PERS_013',
    nameMy: 'Kewarganegaraan',
    nameEn: 'Citizenship',
    section: 'B_PEMOHON',
    borangPage: 3,
    priority: 'P0',
    required: true,
    format: 'Dropdown',
    dropdownValues: ['WARGANEGARA MALAYSIA'],
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 2,
    notes: 'Default: WARGANEGARA MALAYSIA',
  },

  // ============================================================================
  // SECTION C: C_ALAMAT (14 fields) — Alamat (2 addresses: Surat-Menyurat + Tetap)
  // ============================================================================
  {
    id: 'ADDR_001',
    nameMy: 'No Rumah / Lot (Surat-Menyurat)',
    nameEn: 'House / Lot Number (Correspondence)',
    section: 'C_ALAMAT',
    borangPage: 3,
    priority: 'P0',
    required: true,
    format: 'Alphanumeric',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 3,
  },
  {
    id: 'ADDR_002',
    nameMy: 'Nama Jalan (Surat-Menyurat)',
    nameEn: 'Street Name (Correspondence)',
    section: 'C_ALAMAT',
    borangPage: 3,
    priority: 'P0',
    required: true,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 3,
  },
  {
    id: 'ADDR_003',
    nameMy: 'Taman / Kampung / Kawasan (Surat-Menyurat)',
    nameEn: 'Residential Area / Village (Correspondence)',
    section: 'C_ALAMAT',
    borangPage: 3,
    priority: 'P1',
    required: false,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 3,
  },
  {
    id: 'ADDR_004',
    nameMy: 'Bandar (Surat-Menyurat)',
    nameEn: 'City (Correspondence)',
    section: 'C_ALAMAT',
    borangPage: 3,
    priority: 'P0',
    required: true,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 3,
  },
  {
    id: 'ADDR_005',
    nameMy: 'Poskod (Surat-Menyurat)',
    nameEn: 'Postal Code (Correspondence)',
    section: 'C_ALAMAT',
    borangPage: 3,
    priority: 'P0',
    required: true,
    format: '5-digit',
    validation: /^\d{5}$/,
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 3,
  },
  {
    id: 'ADDR_006',
    nameMy: 'Negeri (Surat-Menyurat)',
    nameEn: 'State (Correspondence)',
    section: 'C_ALAMAT',
    borangPage: 3,
    priority: 'P0',
    required: true,
    format: 'Dropdown',
    dropdownValues: NEGERI_MALAYSIA as unknown as string[],
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 3,
  },
  {
    id: 'ADDR_007',
    nameMy: 'Daerah (Surat-Menyurat)',
    nameEn: 'District (Correspondence)',
    section: 'C_ALAMAT',
    borangPage: 3,
    priority: 'P1',
    required: false,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 3,
  },
  {
    id: 'ADDR_008',
    nameMy: 'No Rumah / Lot (Alamat Tetap)',
    nameEn: 'House / Lot Number (Permanent)',
    section: 'C_ALAMAT',
    borangPage: 4,
    priority: 'P0',
    required: true,
    format: 'Alphanumeric',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 3,
  },
  {
    id: 'ADDR_009',
    nameMy: 'Nama Jalan (Alamat Tetap)',
    nameEn: 'Street Name (Permanent)',
    section: 'C_ALAMAT',
    borangPage: 4,
    priority: 'P0',
    required: true,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 3,
  },
  {
    id: 'ADDR_010',
    nameMy: 'Taman / Kampung / Kawasan (Alamat Tetap)',
    nameEn: 'Residential Area / Village (Permanent)',
    section: 'C_ALAMAT',
    borangPage: 4,
    priority: 'P1',
    required: false,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 3,
  },
  {
    id: 'ADDR_011',
    nameMy: 'Bandar (Alamat Tetap)',
    nameEn: 'City (Permanent)',
    section: 'C_ALAMAT',
    borangPage: 4,
    priority: 'P0',
    required: true,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 3,
  },
  {
    id: 'ADDR_012',
    nameMy: 'Poskod (Alamat Tetap)',
    nameEn: 'Postal Code (Permanent)',
    section: 'C_ALAMAT',
    borangPage: 4,
    priority: 'P0',
    required: true,
    format: '5-digit',
    validation: /^\d{5}$/,
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 3,
  },
  {
    id: 'ADDR_013',
    nameMy: 'Negeri (Alamat Tetap)',
    nameEn: 'State (Permanent)',
    section: 'C_ALAMAT',
    borangPage: 4,
    priority: 'P0',
    required: true,
    format: 'Dropdown',
    dropdownValues: NEGERI_MALAYSIA as unknown as string[],
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 3,
  },
  {
    id: 'ADDR_014',
    nameMy: 'Daerah (Alamat Tetap)',
    nameEn: 'District (Permanent)',
    section: 'C_ALAMAT',
    borangPage: 4,
    priority: 'P1',
    required: false,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 3,
  },

  // ============================================================================
  // SECTION D: D_PERKHIDMATAN (12 fields) — Maklumat Perkhidmatan (Employment)
  // ============================================================================
  {
    id: 'EMP_001',
    nameMy: 'Nama Majikan / Jabatan',
    nameEn: 'Employer Name / Department',
    section: 'D_PERKHIDMATAN',
    borangPage: 4,
    priority: 'P0',
    required: true,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 4,
  },
  {
    id: 'EMP_002',
    nameMy: 'Gred Jawatan',
    nameEn: 'Job Grade',
    section: 'D_PERKHIDMATAN',
    borangPage: 4,
    priority: 'P1',
    required: true,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 4,
  },
  {
    id: 'EMP_003',
    nameMy: 'Jawatan',
    nameEn: 'Position',
    section: 'D_PERKHIDMATAN',
    borangPage: 4,
    priority: 'P0',
    required: true,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 4,
  },
  {
    id: 'EMP_003B',
    nameMy: 'Tarikh Lantikan Skim Perkhidmatan Pertama',
    nameEn: 'First Service Scheme Appointment Date',
    section: 'D_PERKHIDMATAN',
    borangPage: 4,
    priority: 'P0',
    required: true,
    format: 'DD-MM-YYYY',
    validation: /^\d{2}-\d{2}-\d{4}$/,
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'VALIDASI',
    copyNextGroup: 4,
    notes: 'Used to derive total service years',
  },
  {
    id: 'EMP_003C',
    nameMy: 'Tarikh Pengesahan Skim Perkhidmatan Pertama',
    nameEn: 'First Service Scheme Confirmation Date',
    section: 'D_PERKHIDMATAN',
    borangPage: 4,
    priority: 'P0',
    required: true,
    format: 'DD-MM-YYYY',
    validation: /^\d{2}-\d{2}-\d{4}$/,
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'VALIDASI',
    copyNextGroup: 4,
    notes: 'Must be after EMP_003B',
  },
  {
    id: 'EMP_003D',
    nameMy: 'Tarikh Lantikan Skim Perkhidmatan Sekarang',
    nameEn: 'Current Service Scheme Appointment Date',
    section: 'D_PERKHIDMATAN',
    borangPage: 4,
    priority: 'P0',
    required: true,
    format: 'DD-MM-YYYY',
    validation: /^\d{2}-\d{2}-\d{4}$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 4,
    notes: 'May differ from first if promoted/transferred',
  },
  {
    id: 'EMP_004',
    nameMy: 'Status Perkhidmatan',
    nameEn: 'Employment Status',
    section: 'D_PERKHIDMATAN',
    borangPage: 4,
    priority: 'P0',
    required: true,
    format: 'Dropdown',
    dropdownValues: ['TETAP', 'KONTRAK', 'SEMENTARA'],
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 4,
  },
  {
    id: 'EMP_005',
    nameMy: 'Skim Perkhidmatan',
    nameEn: 'Service Scheme',
    section: 'D_PERKHIDMATAN',
    borangPage: 4,
    priority: 'P1',
    required: false,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 4,
  },
  {
    id: 'EMP_008B',
    nameMy: 'Kumpulan Perkhidmatan',
    nameEn: 'Service Group',
    section: 'D_PERKHIDMATAN',
    borangPage: 4,
    priority: 'P0',
    required: true,
    format: 'Dropdown',
    dropdownValues: [
      'PENGURUSAN DAN PROFESIONAL',
      'SOKONGAN',
      'KUMPULAN PELAKSANA',
    ],
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 4,
  },
  {
    id: 'EMP_015',
    nameMy: 'Umur Persaraan Wajib',
    nameEn: 'Mandatory Retirement Age',
    section: 'D_PERKHIDMATAN',
    borangPage: 4,
    priority: 'P0',
    required: true,
    format: 'Integer TAHUN (e.g. 60)',
    validation: /^\d{2}$/,
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'VALIDASI',
    copyNextGroup: 4,
    notes: 'Standard: 60 (awam), 58 (polis/tentera)',
  },
  {
    id: 'EMP_016',
    nameMy: 'Tarikh Persaraan Wajib',
    nameEn: 'Mandatory Retirement Date',
    section: 'D_PERKHIDMATAN',
    borangPage: 4,
    priority: 'P0',
    required: true,
    format: 'DD-MM-YYYY',
    validation: /^\d{2}-\d{2}-\d{4}$/,
    classification: 'SYSTEM_DERIVED',
    affectsReadiness: true,
    readinessComponent: 'VALIDASI',
    copyNextGroup: 4,
    notes: 'Can be derived from DOB + umurPersaraan',
  },
  {
    id: 'EMP_017',
    nameMy: 'Kod Pusat Pembayar Gaji',
    nameEn: 'Payroll Center Code',
    section: 'D_PERKHIDMATAN',
    borangPage: 4,
    priority: 'P0',
    required: true,
    format: '12-digit code (e.g. 107002312011)',
    validation: /^\d{12}$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 4,
    notes: 'Links to specific govt ministry/department for salary deduction',
  },

  // ============================================================================
  // SECTION E: E_PINJAMAN (10 fields) — Maklumat Pinjaman (Financing)
  // ============================================================================
  {
    id: 'FIN_001',
    nameMy: 'Amaun Pembiayaan Dipohon',
    nameEn: 'Financing Amount Requested',
    section: 'E_PINJAMAN',
    borangPage: 6,
    priority: 'P0',
    required: true,
    format: 'RM (numeric)',
    validation: /^\d+(\.\d{2})?$/,
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 5,
  },
  {
    id: 'FIN_001B',
    nameMy: 'Kategori Pinjaman',
    nameEn: 'Loan Category',
    section: 'E_PINJAMAN',
    borangPage: 6,
    priority: 'P0',
    required: true,
    format: 'Dropdown',
    dropdownValues: ['HARTA PERTAMA', 'HARTA KEDUA'],
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'VALIDASI',
    copyNextGroup: 5,
    notes: 'CRITICAL: HARTA PERTAMA = DSR ≤ 60%, HARTA KEDUA = DSR ≤ 50%',
  },
  {
    id: 'FIN_002',
    nameMy: 'Tempoh Pembiayaan',
    nameEn: 'Financing Tenure',
    section: 'E_PINJAMAN',
    borangPage: 6,
    priority: 'P0',
    required: true,
    format: 'Integer TAHUN (years)',
    validation: /^\d{1,2}$/,
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 5,
  },
  {
    id: 'FIN_003',
    nameMy: 'Harga Hartanah',
    nameEn: 'Property Price',
    section: 'E_PINJAMAN',
    borangPage: 6,
    priority: 'P0',
    required: true,
    format: 'RM (numeric)',
    validation: /^\d+(\.\d{2})?$/,
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 5,
  },
  {
    id: 'FIN_004',
    nameMy: 'Wang Pendahuluan / Deposit',
    nameEn: 'Down Payment / Deposit',
    section: 'E_PINJAMAN',
    borangPage: 6,
    priority: 'P0',
    required: true,
    format: 'RM (numeric)',
    validation: /^\d+(\.\d{2})?$/,
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 5,
  },
  {
    id: 'FIN_005',
    nameMy: 'Cara Bayaran Balik',
    nameEn: 'Mode of Repayment',
    section: 'E_PINJAMAN',
    borangPage: 6,
    priority: 'P0',
    required: true,
    format: 'Dropdown',
    dropdownValues: ['POTONGAN GAJI'],
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 5,
    notes: 'LPPSA standard: POTONGAN GAJI only',
  },
  {
    id: 'FIN_006',
    nameMy: 'Pernah Memiliki Rumah Sebelum?',
    nameEn: 'Previously Owned Property?',
    section: 'E_PINJAMAN',
    borangPage: 6,
    priority: 'P1',
    required: true,
    format: 'Dropdown',
    dropdownValues: ['Ya', 'Tidak'],
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 5,
  },
  {
    id: 'FIN_007',
    nameMy: 'Butiran Pinjaman Sedia Ada',
    nameEn: 'Details of Existing Loan',
    section: 'E_PINJAMAN',
    borangPage: 6,
    priority: 'P1',
    required: false,
    conditional: 'If FIN_006 = Ya',
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 5,
  },
  {
    id: 'FIN_008',
    nameMy: 'Jumlah Potongan Gaji Bulanan Sedia Ada',
    nameEn: 'Existing Monthly Salary Deduction',
    section: 'E_PINJAMAN',
    borangPage: 6,
    priority: 'P1',
    required: false,
    format: 'RM (numeric)',
    validation: /^\d+(\.\d{2})?$/,
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 5,
  },
  {
    id: 'FIN_009',
    nameMy: 'Baki Pinjaman Sedia Ada',
    nameEn: 'Remaining Balance of Existing Loan',
    section: 'E_PINJAMAN',
    borangPage: 6,
    priority: 'P1',
    required: false,
    format: 'RM (numeric)',
    validation: /^\d+(\.\d{2})?$/,
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 5,
  },

  // ============================================================================
  // SECTION F: F_HARTANAH (14 fields) — Maklumat Hartanah (Property)
  // ============================================================================
  {
    id: 'PROP_001',
    nameMy: 'Jenis Hartanah',
    nameEn: 'Property Type',
    section: 'F_HARTANAH',
    borangPage: 6,
    priority: 'P0',
    required: true,
    format: 'Dropdown',
    dropdownValues: ['RUMAH BERKEMBAR', 'RUMAH BARIS', 'RUMAH SEMI-D', 'RUMAH TERES', 'RUMAH TUNGGAL', 'RUMAH KEDIAMAN LAIN'],
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 6,
  },
  {
    id: 'PROP_002',
    nameMy: 'Status Pembinaan',
    nameEn: 'Construction Status',
    section: 'F_HARTANAH',
    borangPage: 6,
    priority: 'P1',
    required: true,
    format: 'Dropdown',
    dropdownValues: ['SIAP', 'DALAM PEMBINAAN'],
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 6,
  },
  {
    id: 'PROP_003',
    nameMy: 'Nama Projek / Taman',
    nameEn: 'Project / Development Name',
    section: 'F_HARTANAH',
    borangPage: 6,
    priority: 'P1',
    required: false,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 6,
  },
  {
    id: 'PROP_004',
    nameMy: 'Alamat Hartanah',
    nameEn: 'Property Address',
    section: 'F_HARTANAH',
    borangPage: 6,
    priority: 'P0',
    required: true,
    format: 'Text (structured: No Rumah, Jalan, Bandar, Poskod, Negeri)',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 6,
  },
  {
    id: 'PROP_005',
    nameMy: 'No Lot / Hakmilik',
    nameEn: 'Lot / Title Number',
    section: 'F_HARTANAH',
    borangPage: 6,
    priority: 'P1',
    required: true,
    format: 'Alphanumeric',
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 6,
  },
  {
    id: 'PROP_006',
    nameMy: 'Keluasan',
    nameEn: 'Built-up Area',
    section: 'F_HARTANAH',
    borangPage: 6,
    priority: 'P1',
    required: true,
    format: 'Integer sq ft',
    validation: /^\d+$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 6,
  },
  {
    id: 'PROP_007',
    nameMy: 'Mukim / Daerah',
    nameEn: 'Mukim / District',
    section: 'F_HARTANAH',
    borangPage: 6,
    priority: 'P1',
    required: false,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 6,
  },
  {
    id: 'PROP_008',
    nameMy: 'Negeri Hartanah',
    nameEn: 'State (Property)',
    section: 'F_HARTANAH',
    borangPage: 6,
    priority: 'P0',
    required: true,
    format: 'Dropdown',
    dropdownValues: NEGERI_MALAYSIA as unknown as string[],
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 6,
  },
  {
    id: 'PROP_009',
    nameMy: 'Tahun Siap',
    nameEn: 'Year of Completion',
    section: 'F_HARTANAH',
    borangPage: 6,
    priority: 'P1',
    required: false,
    format: 'YYYY',
    validation: /^\d{4}$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 6,
  },
  {
    id: 'PROP_010',
    nameMy: 'No Hakmilik / Geran',
    nameEn: 'Title / Deed Number',
    section: 'F_HARTANAH',
    borangPage: 6,
    priority: 'P1',
    required: false,
    format: 'Alphanumeric',
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 6,
  },

  // PROP_011-014: Additional property fields
  {
    id: 'PROP_011',
    nameMy: 'Jenis Rumah',
    nameEn: 'House Type',
    section: 'F_HARTANAH',
    borangPage: 6,
    priority: 'P1',
    required: false,
    format: 'Dropdown',
    dropdownValues: ['TERES', 'BERKEMBAR', 'BANGLO', 'APARTMENT', 'KONDOMINIUM', 'FLAT', 'TOWNHOUSE', 'LAIN-LAIN'],
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 6,
  },
  {
    id: 'PROP_012',
    nameMy: 'Keluasan Tanah (kps)',
    nameEn: 'Land Area (sqft)',
    section: 'F_HARTANAH',
    borangPage: 6,
    priority: 'P2',
    required: false,
    format: 'Numeric',
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 6,
  },
  {
    id: 'PROP_013',
    nameMy: 'Keluasan Binaan (kps)',
    nameEn: 'Built-up Area (sqft)',
    section: 'F_HARTANAH',
    borangPage: 6,
    priority: 'P2',
    required: false,
    format: 'Numeric',
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 6,
  },
  {
    id: 'PROP_014',
    nameMy: 'Jenis Pinjaman Hartanah',
    nameEn: 'Property Loan Type',
    section: 'F_HARTANAH',
    borangPage: 6,
    priority: 'P0',
    required: true,
    format: 'Dropdown',
    dropdownValues: ['INDUK', 'TAMBAHAN'],
    classification: 'DERIVED',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 6,
    jenisConditional: [3],
    notes: 'Auto-defaults to INDUK when Jenis 3. Agent can override to TAMBAHAN if applicable.',
  },

  // ============================================================================
  // SECTION G: G_KOMITMEN (8 fields) — Komitmen Kewangan (Financial Commitments)
  // ============================================================================
  {
    id: 'KOM_001',
    nameMy: 'Gaji Pokok Bulanan',
    nameEn: 'Basic Monthly Salary',
    section: 'G_KOMITMEN',
    borangPage: 5,
    priority: 'P0',
    required: true,
    format: 'RM (numeric)',
    validation: /^\d+(\.\d{2})?$/,
    classification: 'AI_EXTRACTED',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 7,
  },
  {
    id: 'KOM_002',
    nameMy: 'Elaun Tetap',
    nameEn: 'Fixed Allowance',
    section: 'G_KOMITMEN',
    borangPage: 5,
    priority: 'P1',
    required: false,
    format: 'RM (numeric)',
    validation: /^\d+(\.\d{2})?$/,
    classification: 'AI_EXTRACTED',
    affectsReadiness: false,
    copyNextGroup: 7,
  },
  {
    id: 'KOM_003',
    nameMy: 'Pendapatan Lain',
    nameEn: 'Other Income',
    section: 'G_KOMITMEN',
    borangPage: 5,
    priority: 'P1',
    required: false,
    format: 'RM (numeric)',
    validation: /^\d+(\.\d{2})?$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 7,
  },
  {
    id: 'KOM_004',
    nameMy: 'Jumlah Pendapatan Kasar',
    nameEn: 'Gross Income Total',
    section: 'G_KOMITMEN',
    borangPage: 5,
    priority: 'P0',
    required: true,
    format: 'RM (numeric)',
    validation: /^\d+(\.\d{2})?$/,
    classification: 'SYSTEM_DERIVED',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 7,
    notes: 'Auto-calculated: KOM_001 + KOM_002 + KOM_003',
  },
  {
    id: 'KOM_005',
    nameMy: 'Potongan Wajib',
    nameEn: 'Mandatory Deductions',
    section: 'G_KOMITMEN',
    borangPage: 5,
    priority: 'P1',
    required: false,
    format: 'RM (numeric)',
    validation: /^\d+(\.\d{2})?$/,
    classification: 'AI_EXTRACTED',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 7,
    notes: 'KWSP, PERKESO, etc.',
  },
  {
    id: 'KOM_006',
    nameMy: 'Komitmen Sedia Ada',
    nameEn: 'Existing Commitments',
    section: 'G_KOMITMEN',
    borangPage: 5,
    priority: 'P1',
    required: false,
    format: 'RM (numeric)',
    validation: /^\d+(\.\d{2})?$/,
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 7,
    notes: 'Loans, credit cards, etc.',
  },
  {
    id: 'KOM_007',
    nameMy: 'Jumlah Komitmen Bulanan',
    nameEn: 'Total Monthly Commitment',
    section: 'G_KOMITMEN',
    borangPage: 5,
    priority: 'P0',
    required: true,
    format: 'RM (numeric)',
    validation: /^\d+(\.\d{2})?$/,
    classification: 'SYSTEM_DERIVED',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 7,
    notes: 'Auto-calculated: KOM_005 + KOM_006 + proposed loan payment',
  },
  {
    id: 'KOM_008',
    nameMy: 'DSR',
    nameEn: 'Debt Service Ratio',
    section: 'G_KOMITMEN',
    borangPage: 5,
    priority: 'P0',
    required: true,
    format: 'Percentage (0-100)',
    validation: /^\d+(\.\d{2})?$/,
    classification: 'SYSTEM_DERIVED',
    affectsReadiness: true,
    readinessComponent: 'VALIDASI',
    copyNextGroup: 7,
    notes: 'System-calculated: KOM_007 / KOM_004',
  },

  // ============================================================================
  // SECTION H: H_PEGUAM (7 fields) — Maklumat Peguam (Lawyer)
  // ============================================================================
  {
    id: 'LAW_001',
    nameMy: 'Nama Firma Guaman',
    nameEn: 'Law Firm Name',
    section: 'H_PEGUAM',
    borangPage: 7,
    priority: 'P0',
    required: true,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 8,
  },
  {
    id: 'LAW_002',
    nameMy: 'Nama Peguam',
    nameEn: 'Lawyer Name',
    section: 'H_PEGUAM',
    borangPage: 7,
    priority: 'P0',
    required: true,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 8,
  },
  {
    id: 'LAW_003',
    nameMy: 'Alamat Firma',
    nameEn: 'Law Firm Address',
    section: 'H_PEGUAM',
    borangPage: 7,
    priority: 'P0',
    required: true,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 8,
  },
  {
    id: 'LAW_004',
    nameMy: 'No Telefon Firma',
    nameEn: 'Law Firm Phone',
    section: 'H_PEGUAM',
    borangPage: 7,
    priority: 'P0',
    required: true,
    format: 'Phone (e.g. 03-87654321)',
    validation: /^0\d{1,2}-?\d{7,8}$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 8,
  },
  {
    id: 'LAW_005',
    nameMy: 'No Faks',
    nameEn: 'Fax Number',
    section: 'H_PEGUAM',
    borangPage: 7,
    priority: 'P1',
    required: false,
    format: 'Phone (e.g. 03-87654321)',
    validation: /^0\d{1,2}-?\d{7,8}$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 8,
  },
  {
    id: 'LAW_006',
    nameMy: 'Email Peguam',
    nameEn: 'Lawyer Email',
    section: 'H_PEGUAM',
    borangPage: 7,
    priority: 'P1',
    required: false,
    format: 'Email',
    validation: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 8,
  },
  {
    id: 'LAW_007',
    nameMy: 'Rujukan Fail Peguam',
    nameEn: 'Lawyer File Reference',
    section: 'H_PEGUAM',
    borangPage: 7,
    priority: 'P0',
    required: true,
    format: 'Alphanumeric',
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 8,
  },

  // ============================================================================
  // SECTION J: J_INSURANS (4 fields) — Insurans/Takaful
  // ============================================================================
  {
    id: 'INS_001',
    nameMy: 'Pilihan Insurans / Takaful',
    nameEn: 'Insurance / Takaful Choice',
    section: 'J_INSURANS',
    borangPage: 7,
    priority: 'P0',
    required: true,
    format: 'Dropdown',
    dropdownValues: ['INSURANS', 'TAKAFUL'],
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 9,
  },
  {
    id: 'INS_002',
    nameMy: 'Nama Syarikat Insurans / Takaful',
    nameEn: 'Insurance / Takaful Company Name',
    section: 'J_INSURANS',
    borangPage: 7,
    priority: 'P0',
    required: true,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 9,
  },
  {
    id: 'INS_003',
    nameMy: 'No Polisi (jika ada)',
    nameEn: 'Policy Number (if existing)',
    section: 'J_INSURANS',
    borangPage: 7,
    priority: 'P1',
    required: false,
    format: 'Alphanumeric',
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 9,
  },
  {
    id: 'INS_004',
    nameMy: 'Anggaran Premium',
    nameEn: 'Estimated Premium',
    section: 'J_INSURANS',
    borangPage: 7,
    priority: 'P1',
    required: false,
    format: 'RM (numeric)',
    validation: /^\d+(\.\d{2})?$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 9,
  },

  // ============================================================================
  // SECTION K: K_PERAKUAN (3 fields) — Perakuan Pemohon (Declaration)
  // ============================================================================
  {
    id: 'DEC_001',
    nameMy: 'Perakuan Pemohon',
    nameEn: 'Applicant Declaration',
    section: 'K_PERAKUAN',
    borangPage: 8,
    priority: 'P0',
    required: true,
    format: 'Checkbox',
    dropdownValues: ['Saya mengaku maklumat di atas adalah benar'],
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'TANDATANGAN',
    copyNextGroup: 10,
  },
  {
    id: 'DEC_002',
    nameMy: 'Persetujuan CCRIS / CTOS',
    nameEn: 'CCRIS / CTOS Consent',
    section: 'K_PERAKUAN',
    borangPage: 8,
    priority: 'P0',
    required: true,
    format: 'Checkbox',
    dropdownValues: ['Saya bersetuju LPPSA menyemak rekod CCRIS/CTOS saya'],
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'TANDATANGAN',
    copyNextGroup: 10,
  },
  {
    id: 'DEC_003',
    nameMy: 'Tarikh Perakuan',
    nameEn: 'Declaration Date',
    section: 'K_PERAKUAN',
    borangPage: 8,
    priority: 'P0',
    required: true,
    format: 'DD-MM-YYYY',
    validation: /^\d{2}-\d{2}-\d{4}$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 10,
  },

  // ============================================================================
  // SECTION L: L_KELUARGA (12 fields) — Maklumat Suami/Isteri/Keluarga (Spouse)
  // ALL fields marked with jointConditional: true
  // ============================================================================
  {
    id: 'JNT_001',
    nameMy: 'Nama Suami/Isteri',
    nameEn: 'Spouse Name',
    section: 'L_KELUARGA',
    borangPage: 5,
    priority: 'P0',
    required: true,
    conditional: 'Only if PERS_007 = BERKAHWIN',
    jointConditional: true,
    format: 'Text, HURUF BESAR',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 11,
  },
  {
    id: 'JNT_002',
    nameMy: 'No KP Baru (Suami/Isteri)',
    nameEn: 'Spouse IC Number',
    section: 'L_KELUARGA',
    borangPage: 5,
    priority: 'P0',
    required: true,
    conditional: 'Only if PERS_007 = BERKAHWIN',
    jointConditional: true,
    format: '12-digit YYMMDD-PB-XXXX',
    validation: /^\d{12}$/,
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 11,
  },
  {
    id: 'JNT_003',
    nameMy: 'Alamat Suami/Isteri',
    nameEn: 'Spouse Address',
    section: 'L_KELUARGA',
    borangPage: 5,
    priority: 'P1',
    required: false,
    conditional: 'Only if PERS_007 = BERKAHWIN',
    jointConditional: true,
    format: 'Text (structured)',
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 11,
  },
  {
    id: 'JNT_004',
    nameMy: 'No Telefon Bimbit (Suami/Isteri)',
    nameEn: 'Spouse Mobile Phone',
    section: 'L_KELUARGA',
    borangPage: 5,
    priority: 'P1',
    required: false,
    conditional: 'Only if PERS_007 = BERKAHWIN',
    jointConditional: true,
    format: 'Phone (e.g. 012-34567890)',
    validation: /^0\d{1,2}-?\d{7,8}$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 11,
  },
  {
    id: 'JNT_005',
    nameMy: 'No Telefon Pejabat (Suami/Isteri)',
    nameEn: 'Spouse Office Phone',
    section: 'L_KELUARGA',
    borangPage: 5,
    priority: 'P1',
    required: false,
    conditional: 'Only if PERS_007 = BERKAHWIN',
    jointConditional: true,
    format: 'Phone (e.g. 03-87654321)',
    validation: /^0\d{1,2}-?\d{7,8}$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 11,
  },
  {
    id: 'JNT_006',
    nameMy: 'Nama Majikan (Suami/Isteri)',
    nameEn: 'Spouse Employer Name',
    section: 'L_KELUARGA',
    borangPage: 5,
    priority: 'P1',
    required: false,
    conditional: 'Only if PERS_007 = BERKAHWIN',
    jointConditional: true,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 11,
  },
  {
    id: 'JNT_007',
    nameMy: 'Jawatan (Suami/Isteri)',
    nameEn: 'Spouse Position',
    section: 'L_KELUARGA',
    borangPage: 5,
    priority: 'P1',
    required: false,
    conditional: 'Only if PERS_007 = BERKAHWIN',
    jointConditional: true,
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 11,
  },
  {
    id: 'JNT_008',
    nameMy: 'Gaji Pokok (Suami/Isteri)',
    nameEn: 'Spouse Basic Salary',
    section: 'L_KELUARGA',
    borangPage: 5,
    priority: 'P1',
    required: false,
    conditional: 'Only if PERS_007 = BERKAHWIN',
    jointConditional: true,
    format: 'RM (numeric)',
    validation: /^\d+(\.\d{2})?$/,
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 11,
  },
  {
    id: 'JNT_009',
    nameMy: 'Elaun Tetap (Suami/Isteri)',
    nameEn: 'Spouse Fixed Allowance',
    section: 'L_KELUARGA',
    borangPage: 5,
    priority: 'P1',
    required: false,
    conditional: 'Only if PERS_007 = BERKAHWIN',
    jointConditional: true,
    format: 'RM (numeric)',
    validation: /^\d+(\.\d{2})?$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 11,
  },
  {
    id: 'JNT_010',
    nameMy: 'Tarikh Lantikan (Suami/Isteri)',
    nameEn: 'Spouse Appointment Date',
    section: 'L_KELUARGA',
    borangPage: 5,
    priority: 'P1',
    required: false,
    conditional: 'Only if PERS_007 = BERKAHWIN',
    jointConditional: true,
    format: 'DD-MM-YYYY',
    validation: /^\d{2}-\d{2}-\d{4}$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 11,
  },
  {
    id: 'JNT_011',
    nameMy: 'Status Perkhidmatan (Suami/Isteri)',
    nameEn: 'Spouse Employment Status',
    section: 'L_KELUARGA',
    borangPage: 5,
    priority: 'P1',
    required: false,
    conditional: 'Only if PERS_007 = BERKAHWIN',
    jointConditional: true,
    format: 'Dropdown',
    dropdownValues: ['TETAP', 'KONTRAK', 'SEMENTARA'],
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 11,
  },
  {
    id: 'JNT_012',
    nameMy: 'Kod Pusat Pembayar Gaji (Suami/Isteri)',
    nameEn: 'Spouse Payroll Center Code',
    section: 'L_KELUARGA',
    borangPage: 5,
    priority: 'P1',
    required: false,
    conditional: 'Only if PERS_007 = BERKAHWIN',
    jointConditional: true,
    format: '12-digit code',
    validation: /^\d{12}$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 11,
  },

  // ============================================================================
  // SECTION M: M_PEMAJU (8 fields) — Maklumat Kontraktor/Pemaju
  // ALL fields marked with jenisConditional: [3] for Jenis 3 only
  // ============================================================================
  {
    id: 'DEV_001',
    nameMy: 'Nama Pemaju',
    nameEn: 'Developer Name',
    section: 'M_PEMAJU',
    borangPage: 7,
    priority: 'P0',
    required: true,
    conditional: 'Only for Jenis 3 (Rumah Dalam Pembinaan)',
    jenisConditional: [3],
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 12,
  },
  {
    id: 'DEV_002',
    nameMy: 'No Pendaftaran Syarikat Pemaju',
    nameEn: 'Developer Company Registration Number',
    section: 'M_PEMAJU',
    borangPage: 7,
    priority: 'P0',
    required: true,
    conditional: 'Only for Jenis 3',
    jenisConditional: [3],
    format: 'Alphanumeric',
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 12,
  },
  {
    id: 'DEV_003',
    nameMy: 'Alamat Berdaftar Pemaju',
    nameEn: 'Developer Registered Address',
    section: 'M_PEMAJU',
    borangPage: 7,
    priority: 'P0',
    required: true,
    conditional: 'Only for Jenis 3',
    jenisConditional: [3],
    format: 'Text',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 12,
  },
  {
    id: 'DEV_004',
    nameMy: 'No Telefon Pemaju',
    nameEn: 'Developer Phone Number',
    section: 'M_PEMAJU',
    borangPage: 7,
    priority: 'P0',
    required: true,
    conditional: 'Only for Jenis 3',
    jenisConditional: [3],
    format: 'Phone (e.g. 03-87654321)',
    validation: /^0\d{1,2}-?\d{7,8}$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 12,
  },
  {
    id: 'DEV_005',
    nameMy: 'No Lesen Pemaju (DL)',
    nameEn: 'Developer License (DL) Number',
    section: 'M_PEMAJU',
    borangPage: 7,
    priority: 'P0',
    required: true,
    conditional: 'Only for Jenis 3',
    jenisConditional: [3],
    format: 'Alphanumeric',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'VALIDASI',
    copyNextGroup: 12,
    notes: 'Must be valid and not expired',
  },
  {
    id: 'DEV_006',
    nameMy: 'Tarikh Tamat Lesen Pemaju (DL)',
    nameEn: 'DL Expiry Date',
    section: 'M_PEMAJU',
    borangPage: 7,
    priority: 'P0',
    required: true,
    conditional: 'Only for Jenis 3',
    jenisConditional: [3],
    format: 'DD-MM-YYYY',
    validation: /^\d{2}-\d{2}-\d{4}$/,
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'VALIDASI',
    copyNextGroup: 12,
  },
  {
    id: 'DEV_007',
    nameMy: 'No Permit Iklan (AP)',
    nameEn: 'Advertising Permit (AP) Number',
    section: 'M_PEMAJU',
    borangPage: 7,
    priority: 'P0',
    required: true,
    conditional: 'Only for Jenis 3',
    jenisConditional: [3],
    format: 'Alphanumeric',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'VALIDASI',
    copyNextGroup: 12,
    notes: 'Must be valid and not expired',
  },
  {
    id: 'DEV_008',
    nameMy: 'Tarikh Tamat Permit Iklan (AP)',
    nameEn: 'AP Expiry Date',
    section: 'M_PEMAJU',
    borangPage: 7,
    priority: 'P0',
    required: true,
    conditional: 'Only for Jenis 3',
    jenisConditional: [3],
    format: 'DD-MM-YYYY',
    validation: /^\d{2}-\d{2}-\d{4}$/,
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'VALIDASI',
    copyNextGroup: 12,
  },

  // ============================================================================
  // SECTION N: N_WARIS (10 fields) — Waris/Keluarga Terdekat (Emergency Contacts)
  // ============================================================================
  {
    id: 'FAM_001',
    nameMy: 'Nama Waris 1',
    nameEn: 'Emergency Contact 1 Name',
    section: 'N_WARIS',
    borangPage: 5,
    priority: 'P0',
    required: true,
    format: 'Text, HURUF BESAR',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 13,
  },
  {
    id: 'FAM_002',
    nameMy: 'No KP Waris 1',
    nameEn: 'Emergency Contact 1 IC Number',
    section: 'N_WARIS',
    borangPage: 5,
    priority: 'P0',
    required: true,
    format: '12-digit YYMMDD-PB-XXXX',
    validation: /^\d{12}$/,
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 13,
  },
  {
    id: 'FAM_003',
    nameMy: 'Hubungan Waris 1',
    nameEn: 'Emergency Contact 1 Relationship',
    section: 'N_WARIS',
    borangPage: 5,
    priority: 'P0',
    required: true,
    format: 'Dropdown',
    dropdownValues: HUBUNGAN_OPTIONS as unknown as string[],
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 13,
  },
  {
    id: 'FAM_004',
    nameMy: 'Alamat Waris 1',
    nameEn: 'Emergency Contact 1 Address',
    section: 'N_WARIS',
    borangPage: 5,
    priority: 'P0',
    required: true,
    format: 'Text (structured)',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 13,
  },
  {
    id: 'FAM_005',
    nameMy: 'No Telefon Waris 1',
    nameEn: 'Emergency Contact 1 Phone',
    section: 'N_WARIS',
    borangPage: 5,
    priority: 'P0',
    required: true,
    format: 'Phone (e.g. 012-34567890)',
    validation: /^0\d{1,2}-?\d{7,8}$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 13,
  },
  {
    id: 'FAM_006',
    nameMy: 'Nama Waris 2',
    nameEn: 'Emergency Contact 2 Name',
    section: 'N_WARIS',
    borangPage: 5,
    priority: 'P1',
    required: false,
    format: 'Text, HURUF BESAR',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'MEDAN',
    copyNextGroup: 13,
  },
  {
    id: 'FAM_007',
    nameMy: 'No KP Waris 2',
    nameEn: 'Emergency Contact 2 IC Number',
    section: 'N_WARIS',
    borangPage: 5,
    priority: 'P1',
    required: false,
    format: '12-digit YYMMDD-PB-XXXX',
    validation: /^\d{12}$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 13,
  },
  {
    id: 'FAM_008',
    nameMy: 'Hubungan Waris 2',
    nameEn: 'Emergency Contact 2 Relationship',
    section: 'N_WARIS',
    borangPage: 5,
    priority: 'P1',
    required: false,
    format: 'Dropdown',
    dropdownValues: HUBUNGAN_OPTIONS as unknown as string[],
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 13,
  },
  {
    id: 'FAM_009',
    nameMy: 'Alamat Waris 2',
    nameEn: 'Emergency Contact 2 Address',
    section: 'N_WARIS',
    borangPage: 5,
    priority: 'P1',
    required: false,
    format: 'Text (structured)',
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 13,
  },
  {
    id: 'FAM_010',
    nameMy: 'No Telefon Waris 2',
    nameEn: 'Emergency Contact 2 Phone',
    section: 'N_WARIS',
    borangPage: 5,
    priority: 'P1',
    required: false,
    format: 'Phone (e.g. 012-34567890)',
    validation: /^0\d{1,2}-?\d{7,8}$/,
    classification: 'USER_INPUT',
    affectsReadiness: false,
    copyNextGroup: 13,
  },

  // ============================================================================
  // SECTION P: P_TANDATANGAN (3 fields) — Tandatangan (Signatures)
  // ============================================================================
  {
    id: 'SIG_001',
    nameMy: 'Tandatangan Pemohon',
    nameEn: 'Applicant Signature',
    section: 'P_TANDATANGAN',
    borangPage: 9,
    priority: 'P0',
    required: true,
    format: 'Signature Capture',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'TANDATANGAN',
    copyNextGroup: 14,
  },
  {
    id: 'SIG_002',
    nameMy: 'Tandatangan Saksi',
    nameEn: 'Witness Signature',
    section: 'P_TANDATANGAN',
    borangPage: 9,
    priority: 'P0',
    required: true,
    format: 'Signature Capture',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'TANDATANGAN',
    copyNextGroup: 14,
  },
  {
    id: 'SIG_003',
    nameMy: 'Cop Rasmi Jabatan',
    nameEn: 'Official Department Stamp',
    section: 'P_TANDATANGAN',
    borangPage: 9,
    priority: 'P0',
    required: true,
    format: 'Document / Stamp Capture',
    classification: 'USER_INPUT',
    affectsReadiness: true,
    readinessComponent: 'DOKUMEN',
    copyNextGroup: 14,
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all fields
 */
export function getAllFields(): FieldDefinition[] {
  return ALL_FIELDS;
}

/**
 * Get fields by section
 */
export function getFieldsBySection(section: BorangSection): FieldDefinition[] {
  return ALL_FIELDS.filter(f => f.section === section);
}

/**
 * Get fields by Jenis (loan type)
 */
export function getFieldsByJenis(jenisCode: LoanTypeCode): FieldDefinition[] {
  return ALL_FIELDS.filter(f => {
    if (!f.jenisConditional) return true; // Include all non-conditional fields
    return f.jenisConditional.includes(jenisCode);
  });
}

/**
 * Get joint applicant conditional fields
 */
export function getJointFields(): FieldDefinition[] {
  return ALL_FIELDS.filter(f => f.jointConditional === true);
}

/**
 * Get fields by readiness component
 */
export function getFieldsByReadinessComponent(
  component: ReadinessComponent
): FieldDefinition[] {
  return ALL_FIELDS.filter(f => f.readinessComponent === component);
}

/**
 * Get Copy-Next groups (fields organized by copyNextGroup for panel ordering)
 */
export function getCopyNextGroups(): Record<number, FieldDefinition[]> {
  const groups: Record<number, FieldDefinition[]> = {};
  ALL_FIELDS.forEach(f => {
    if (f.copyNextGroup) {
      if (!groups[f.copyNextGroup]) {
        groups[f.copyNextGroup] = [];
      }
      groups[f.copyNextGroup].push(f);
    }
  });
  return groups;
}

/**
 * Get fields that affect readiness scoring
 */
export function getReadinessFields(): FieldDefinition[] {
  return ALL_FIELDS.filter(f => f.affectsReadiness);
}

/**
 * Get field by ID
 */
export function getFieldById(id: string): FieldDefinition | undefined {
  return ALL_FIELDS.find(f => f.id === id);
}

/**
 * Validate a field value against its definition
 */
export function validateFieldValue(
  fieldId: string,
  value: string
): { valid: boolean; error?: string } {
  const field = getFieldById(fieldId);
  if (!field) return { valid: false, error: `Unknown field: ${fieldId}` };

  if (field.required && (!value || value.trim() === '')) {
    return { valid: false, error: `${field.nameMy} diperlukan` };
  }

  if (!value || value.trim() === '') return { valid: true }; // Optional empty

  if (field.dropdownValues && !field.dropdownValues.includes(value)) {
    return { valid: false, error: `Nilai tidak sah untuk ${field.nameMy}` };
  }

  if (field.validation instanceof RegExp && !field.validation.test(value)) {
    return { valid: false, error: `Format tidak sah untuk ${field.nameMy}. Format: ${field.format}` };
  }

  return { valid: true };
}

/**
 * Calculate readiness score using v2 model (5 components)
 *
 * @param completedFieldIds Array of completed field IDs
 * @param completedDocIds Array of completed document IDs
 * @param signatures Array of signature field IDs collected
 * @param validationPasses Number of validation checks that passed
 * @param kjReady Whether KJ endorsement is ready
 * @param totalFields Total number of applicable fields
 * @param totalDocs Total number of required documents
 * @param totalSignatures Total number of required signatures
 * @param totalValidations Total number of validation checks
 * @returns Readiness score 0-1.0
 */
export function calculateReadinessScore(
  completedFieldIds: string[],
  completedDocIds: string[],
  signatures: string[],
  validationPasses: number,
  kjReady: boolean,
  totalFields: number,
  totalDocs: number,
  totalSignatures: number,
  totalValidations: number
): number {
  const medenScore = totalFields > 0 ? completedFieldIds.length / totalFields : 0;
  const dokumenScore = totalDocs > 0 ? completedDocIds.length / totalDocs : 0;
  const tandatanganScore = totalSignatures > 0 ? signatures.length / totalSignatures : 0;
  const validasiScore = totalValidations > 0 ? validationPasses / totalValidations : 0;
  const kjScore = kjReady ? 1.0 : 0.0;

  const weighted =
    (dokumenScore * READINESS_V2_MODEL.components.DOKUMEN.weight) +
    (medenScore * READINESS_V2_MODEL.components.MEDAN.weight) +
    (tandatanganScore * READINESS_V2_MODEL.components.TANDATANGAN.weight) +
    (validasiScore * READINESS_V2_MODEL.components.VALIDASI.weight) +
    (kjScore * READINESS_V2_MODEL.components.KJ.weight);

  return Math.min(1.0, Math.max(0.0, weighted));
}

/**
 * Derive service years from EMP_003B (first appointment date)
 * Returns the service years bucket for readiness scoring
 */
export function deriveServiceYears(tarikhLantikanPertama: string): '0-2' | '3-4' | '5+' {
  const parts = tarikhLantikanPertama.split('-');
  if (parts.length !== 3) return '0-2';

  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const year = parseInt(parts[2]);
  const appointmentDate = new Date(year, month, day);
  const now = new Date();

  const diffYears = (now.getTime() - appointmentDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  if (diffYears >= 5) return '5+';
  if (diffYears >= 3) return '3-4';
  return '0-2';
}

/**
 * Calculate remaining years to retirement from EMP_016
 * Used to cap max loan tenure
 */
export function deriveRemainingServiceYears(tarikhPersaraan: string): number {
  const parts = tarikhPersaraan.split('-');
  if (parts.length !== 3) return 0;

  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const year = parseInt(parts[2]);
  const retirementDate = new Date(year, month, day);
  const now = new Date();

  const diffYears = (retirementDate.getTime() - now.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.max(0, Math.floor(diffYears));
}

/**
 * Get DSR threshold based on kategori pinjaman (FIN_001B)
 * HARTA PERTAMA: 60% | HARTA KEDUA: 50%
 */
export function getDsrThreshold(kategori: 'HARTA PERTAMA' | 'HARTA KEDUA'): number {
  return kategori === 'HARTA PERTAMA' ? 60 : 50;
}
