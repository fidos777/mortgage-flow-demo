// lib/readiness/field-validators.ts
// P0-F: Cross-validation rules for 12 new LPPSA fields
// Companion to cross-validator.ts — validates P0-F fields specifically
// Source: Official LPPSA Borang Permohonan + Pemetaan Medan v2.0

import type { BuyerInfo, SpouseInfo, FamilyContact } from '@/types/case';

/**
 * Validation result for a single field
 */
export interface FieldValidationResult {
  fieldId: string;
  valid: boolean;
  severity: 'error' | 'warning' | 'info';
  message?: string;
  messageMy?: string;
}

/**
 * Validate all P0-F fields on a BuyerInfo object
 * Returns array of validation results (only invalid/warning items)
 */
export function validateP0FFields(buyer: BuyerInfo): FieldValidationResult[] {
  const results: FieldValidationResult[] = [];

  // PERS_006B: Gelaran
  if (buyer.gelaran) {
    const validTitles = ['Datuk', 'Datin', 'Tan Sri', 'Puan Sri', 'Encik', 'Puan', 'Cik', 'Lain-lain'];
    if (!validTitles.includes(buyer.gelaran)) {
      results.push({
        fieldId: 'PERS_006B',
        valid: false,
        severity: 'error',
        message: `Invalid title: ${buyer.gelaran}`,
        messageMy: `Gelaran tidak sah: ${buyer.gelaran}`,
      });
    }
  }

  // PERS_002B: IC Lama (conditional — only validate format if provided)
  if (buyer.icLama) {
    if (!/^[A-Z]?\d{6,8}$/.test(buyer.icLama)) {
      results.push({
        fieldId: 'PERS_002B',
        valid: false,
        severity: 'warning',
        message: 'Old IC format may be incorrect',
        messageMy: 'Format KP Lama mungkin tidak tepat',
      });
    }
  }

  // PERS_012: Phone Pejabat
  if (buyer.phonePejabat) {
    if (!/^0\d{1,2}-?\d{7,8}$/.test(buyer.phonePejabat)) {
      results.push({
        fieldId: 'PERS_012',
        valid: false,
        severity: 'error',
        message: 'Office phone format invalid (expected 03-XXXXXXXX)',
        messageMy: 'Format No Telefon Pejabat tidak sah',
      });
    }
  }

  // EMP_003B: Tarikh Lantikan Pertama
  if (buyer.tarikhLantikanPertama) {
    const dateResult = validateLPPSADate(buyer.tarikhLantikanPertama, 'EMP_003B', 'Tarikh Lantikan Pertama');
    if (dateResult) results.push(dateResult);

    // Cross-check: must be in the past
    if (isDateInFuture(buyer.tarikhLantikanPertama)) {
      results.push({
        fieldId: 'EMP_003B',
        valid: false,
        severity: 'error',
        message: 'First appointment date cannot be in the future',
        messageMy: 'Tarikh lantikan pertama tidak boleh di masa hadapan',
      });
    }
  }

  // EMP_003C: Tarikh Pengesahan Pertama
  if (buyer.tarikhPengesahanPertama) {
    const dateResult = validateLPPSADate(buyer.tarikhPengesahanPertama, 'EMP_003C', 'Tarikh Pengesahan Pertama');
    if (dateResult) results.push(dateResult);

    // Cross-check: must be after EMP_003B
    if (buyer.tarikhLantikanPertama && buyer.tarikhPengesahanPertama) {
      const lantikan = parseLPPSADate(buyer.tarikhLantikanPertama);
      const pengesahan = parseLPPSADate(buyer.tarikhPengesahanPertama);
      if (lantikan && pengesahan && pengesahan < lantikan) {
        results.push({
          fieldId: 'EMP_003C',
          valid: false,
          severity: 'error',
          message: 'Confirmation date must be after appointment date',
          messageMy: 'Tarikh pengesahan mesti selepas tarikh lantikan',
        });
      }
    }
  }

  // EMP_003D: Tarikh Lantikan Sekarang
  if (buyer.tarikhLantikanSekarang) {
    const dateResult = validateLPPSADate(buyer.tarikhLantikanSekarang, 'EMP_003D', 'Tarikh Lantikan Sekarang');
    if (dateResult) results.push(dateResult);
  }

  // EMP_008B: Kumpulan
  if (buyer.kumpulan) {
    const validGroups = ['PENGURUSAN DAN PROFESIONAL', 'SOKONGAN', 'KUMPULAN PELAKSANA'];
    if (!validGroups.includes(buyer.kumpulan)) {
      results.push({
        fieldId: 'EMP_008B',
        valid: false,
        severity: 'error',
        message: `Invalid service group: ${buyer.kumpulan}`,
        messageMy: `Kumpulan perkhidmatan tidak sah: ${buyer.kumpulan}`,
      });
    }
  }

  // EMP_015: Umur Persaraan
  if (buyer.umurPersaraan !== undefined) {
    if (buyer.umurPersaraan < 50 || buyer.umurPersaraan > 65) {
      results.push({
        fieldId: 'EMP_015',
        valid: false,
        severity: 'warning',
        message: `Retirement age ${buyer.umurPersaraan} is unusual (expected 55-62)`,
        messageMy: `Umur persaraan ${buyer.umurPersaraan} luar biasa (jangkaan 55-62)`,
      });
    }
  }

  // EMP_016: Tarikh Persaraan
  if (buyer.tarikhPersaraan) {
    const dateResult = validateLPPSADate(buyer.tarikhPersaraan, 'EMP_016', 'Tarikh Persaraan');
    if (dateResult) results.push(dateResult);

    // Cross-check: must be in the future
    if (!isDateInFuture(buyer.tarikhPersaraan)) {
      results.push({
        fieldId: 'EMP_016',
        valid: false,
        severity: 'error',
        message: 'Retirement date must be in the future',
        messageMy: 'Tarikh persaraan mesti di masa hadapan',
      });
    }
  }

  // EMP_017: Kod Pusat Pembayar
  if (buyer.kodPusatPembayar) {
    if (!/^\d{12}$/.test(buyer.kodPusatPembayar)) {
      results.push({
        fieldId: 'EMP_017',
        valid: false,
        severity: 'error',
        message: 'Payroll center code must be 12 digits',
        messageMy: 'Kod pusat pembayar gaji mesti 12 digit',
      });
    }
  }

  // FIN_001B: Kategori Pinjaman
  if (buyer.kategoriPinjaman) {
    if (!['HARTA PERTAMA', 'HARTA KEDUA'].includes(buyer.kategoriPinjaman)) {
      results.push({
        fieldId: 'FIN_001B',
        valid: false,
        severity: 'error',
        message: 'Loan category must be HARTA PERTAMA or HARTA KEDUA',
        messageMy: 'Kategori pinjaman mesti HARTA PERTAMA atau HARTA KEDUA',
      });
    }
  }

  // Spouse validation (conditional on statusPerkahwinan)
  if (buyer.statusPerkahwinan === 'BERKAHWIN' && buyer.spouse) {
    const spouseResults = validateSpouseInfo(buyer.spouse);
    results.push(...spouseResults);
  }

  // Family contacts validation
  if (buyer.familyContacts) {
    buyer.familyContacts.forEach((contact, i) => {
      const contactResults = validateFamilyContact(contact, i + 1);
      results.push(...contactResults);
    });
  }

  return results;
}

/**
 * Validate spouse information
 */
function validateSpouseInfo(spouse: SpouseInfo): FieldValidationResult[] {
  const results: FieldValidationResult[] = [];

  if (!spouse.name || spouse.name.trim() === '') {
    results.push({
      fieldId: 'JNT_001',
      valid: false,
      severity: 'error',
      message: 'Spouse name is required',
      messageMy: 'Nama suami/isteri diperlukan',
    });
  }

  if (!spouse.ic || !/^\d{12}$/.test(spouse.ic.replace(/-/g, ''))) {
    results.push({
      fieldId: 'JNT_002',
      valid: false,
      severity: 'error',
      message: 'Spouse IC must be 12 digits',
      messageMy: 'No KP suami/isteri mesti 12 digit',
    });
  }

  return results;
}

/**
 * Validate family emergency contact
 */
function validateFamilyContact(contact: FamilyContact, index: number): FieldValidationResult[] {
  const results: FieldValidationResult[] = [];
  const prefix = `FAM_${String(index).padStart(3, '0')}`;

  if (!contact.name || contact.name.trim() === '') {
    results.push({
      fieldId: `${prefix}_NAME`,
      valid: false,
      severity: 'error',
      message: `Family contact ${index} name is required`,
      messageMy: `Nama keluarga ${index} diperlukan`,
    });
  }

  const validHubungan = ['IBU', 'AYAH', 'ADIK-BERADIK', 'ANAK', 'LAIN-LAIN'];
  if (contact.hubungan && !validHubungan.includes(contact.hubungan)) {
    results.push({
      fieldId: `${prefix}_HUBUNGAN`,
      valid: false,
      severity: 'warning',
      message: `Invalid relationship: ${contact.hubungan}`,
      messageMy: `Hubungan tidak sah: ${contact.hubungan}`,
    });
  }

  return results;
}

// =============================================================================
// Date Helpers (LPPSA uses DD-MM-YYYY format)
// =============================================================================

function validateLPPSADate(
  dateStr: string,
  fieldId: string,
  fieldName: string
): FieldValidationResult | null {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return {
      fieldId,
      valid: false,
      severity: 'error',
      message: `${fieldName} must be DD-MM-YYYY format`,
      messageMy: `${fieldName} mesti dalam format DD-MM-YYYY`,
    };
  }
  const parsed = parseLPPSADate(dateStr);
  if (!parsed || isNaN(parsed.getTime())) {
    return {
      fieldId,
      valid: false,
      severity: 'error',
      message: `${fieldName} is not a valid date`,
      messageMy: `${fieldName} bukan tarikh yang sah`,
    };
  }
  return null;
}

function parseLPPSADate(dateStr: string): Date | null {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const year = parseInt(parts[2]);
  const d = new Date(year, month, day);
  if (d.getDate() !== day || d.getMonth() !== month || d.getFullYear() !== year) return null;
  return d;
}

function isDateInFuture(dateStr: string): boolean {
  const d = parseLPPSADate(dateStr);
  if (!d) return false;
  return d.getTime() > Date.now();
}

/**
 * Get completeness percentage for P0-F fields
 * Returns 0-100 indicating how many of the 12 critical fields are filled
 */
export function getP0FCompleteness(buyer: BuyerInfo): {
  percentage: number;
  filled: number;
  total: number;
  missing: string[];
} {
  const fieldChecks: Array<{ id: string; filled: boolean }> = [
    { id: 'PERS_006B', filled: !!buyer.gelaran },
    { id: 'PERS_012', filled: !!buyer.phonePejabat },
    { id: 'EMP_003B', filled: !!buyer.tarikhLantikanPertama },
    { id: 'EMP_003C', filled: !!buyer.tarikhPengesahanPertama },
    { id: 'EMP_003D', filled: !!buyer.tarikhLantikanSekarang },
    { id: 'EMP_008B', filled: !!buyer.kumpulan },
    { id: 'EMP_015', filled: buyer.umurPersaraan !== undefined },
    { id: 'EMP_016', filled: !!buyer.tarikhPersaraan },
    { id: 'EMP_017', filled: !!buyer.kodPusatPembayar },
    { id: 'FIN_001B', filled: !!buyer.kategoriPinjaman },
    // PERS_002B is conditional (not counted as missing if not applicable)
    // JNT_001-005 conditional on BERKAHWIN status
  ];

  // Add spouse check if married
  if (buyer.statusPerkahwinan === 'BERKAHWIN') {
    fieldChecks.push({ id: 'JNT_001', filled: !!buyer.spouse?.name });
    fieldChecks.push({ id: 'JNT_002', filled: !!buyer.spouse?.ic });
  }

  const filled = fieldChecks.filter(f => f.filled).length;
  const total = fieldChecks.length;
  const missing = fieldChecks.filter(f => !f.filled).map(f => f.id);

  return {
    percentage: total > 0 ? Math.round((filled / total) * 100) : 0,
    filled,
    total,
    missing,
  };
}
