// __tests__/cr-kp-002-boundaries.test.ts
// CR-KP-002 Sprint 1: Boundary Tests
// Tests for DSR calculation, APDL verification, booking validation, and DEC-001 compliance

import {
  calculateSelfCheck,
  calculateMonthlyInstallment,
  verifyApdlCredential,
  validateBooking,
  generateBookingId,
  generateDocumentChecklist,
  calculateChecklistSummary,
  isApdlRequired,
  calculatePipelineSummary,
} from '@/lib/services/cr-kp-002-services';
import type { SelfCheckInput, ApdlCredential, Booking } from '@/types/cr-kp-002';

// ─── DSR Calculation Boundaries ───

describe('calculateSelfCheck', () => {
  const baseInput: SelfCheckInput = {
    gajiPokok: 5000,
    elaunTetap: 500,
    potonganWajib: 550,
    komitmenBulanan: 800,
    hargaHartanah: 350000,
    tempohPinjaman: 30,
    loanTypeCode: 1,
    kategoriPinjaman: 'HARTA PERTAMA',
    umur: 30,
  };

  test('should calculate DSR correctly for first property', () => {
    const result = calculateSelfCheck(baseInput);
    expect(result.pendapatanBersih).toBe(4950); // 5000 + 500 - 550
    expect(result.dsrThreshold).toBe(60);
    expect(result.band).toBeDefined();
    expect(['ready', 'caution', 'not_ready']).toContain(result.band);
  });

  test('should use 50% threshold for second property', () => {
    const input = { ...baseInput, kategoriPinjaman: 'HARTA KEDUA' as const };
    const result = calculateSelfCheck(input);
    expect(result.dsrThreshold).toBe(50);
  });

  test('should flag age at maturity exceeding 90', () => {
    const input = { ...baseInput, umur: 62, tempohPinjaman: 30 };
    const result = calculateSelfCheck(input);
    expect(result.ageAtMaturity).toBe(92);
    expect(result.agePass).toBe(false);
  });

  test('should handle zero income gracefully', () => {
    const input = { ...baseInput, gajiPokok: 0, elaunTetap: 0, potonganWajib: 0 };
    const result = calculateSelfCheck(input);
    expect(result.dsr).toBe(100);
    expect(result.dsrPass).toBe(false);
    expect(result.band).toBe('not_ready');
  });

  test('should respect loan type max tenure', () => {
    // Jenis 6 (Ubahsuai) has max 15 years
    const input = { ...baseInput, loanTypeCode: 6 as const, tempohPinjaman: 20 };
    const result = calculateSelfCheck(input);
    expect(result.maxTenure).toBe(15);
    expect(result.tenurePass).toBe(false);
  });

  // DEC-001: No approval probability
  test('should NOT contain approval probability in result', () => {
    const result = calculateSelfCheck(baseInput);
    const resultKeys = Object.keys(result);
    expect(resultKeys).not.toContain('approvalProbability');
    expect(resultKeys).not.toContain('approvalChance');
    expect(resultKeys).not.toContain('kelulusan');
    expect(resultKeys).not.toContain('kadarKelulusan');
    // Should have band instead
    expect(resultKeys).toContain('band');
    expect(resultKeys).toContain('guidance');
  });
});

// ─── Monthly Installment Calculation ───

describe('calculateMonthlyInstallment', () => {
  test('should calculate correct installment at 4.25%', () => {
    const monthly = calculateMonthlyInstallment(350000, 0.0425, 30);
    // Expected ~RM 1,722 at 4.25% for 30 years
    expect(monthly).toBeGreaterThan(1700);
    expect(monthly).toBeLessThan(1750);
  });

  test('should handle zero interest rate', () => {
    const monthly = calculateMonthlyInstallment(120000, 0, 10);
    expect(monthly).toBe(1000); // 120000 / 120 months
  });
});

// ─── APDL Verification ───

describe('verifyApdlCredential', () => {
  const validCredential: ApdlCredential = {
    id: 'apdl-001',
    developerId: 'dev-001',
    apdlNumber: 'APDL-12345',
    companyName: 'Test Developer Sdn Bhd',
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
    status: 'active',
  };

  test('should validate active APDL', () => {
    const result = verifyApdlCredential(validCredential);
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('active');
  });

  test('should reject expired APDL', () => {
    const expired = {
      ...validCredential,
      expiryDate: new Date('2020-01-01').toISOString(),
    };
    const result = verifyApdlCredential(expired);
    expect(result.isValid).toBe(false);
    expect(result.status).toBe('expired');
  });

  test('should reject revoked APDL', () => {
    const revoked = { ...validCredential, status: 'revoked' as const };
    const result = verifyApdlCredential(revoked);
    expect(result.isValid).toBe(false);
    expect(result.status).toBe('revoked');
  });

  test('Jenis 3 should require APDL', () => {
    expect(isApdlRequired(3)).toBe(true);
    expect(isApdlRequired(1)).toBe(false);
    expect(isApdlRequired(2)).toBe(false);
  });
});

// ─── Booking Validation ───

describe('validateBooking', () => {
  test('should validate complete booking', () => {
    const result = validateBooking({
      projectId: 'proj-001',
      unitNo: 'A-12-03',
      buyerName: 'Ahmad bin Abdullah',
      buyerPhone: '0123456789',
      loanTypeCode: 1,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject booking without required fields', () => {
    const result = validateBooking({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('should validate Malaysian phone format', () => {
    const base = {
      projectId: 'p1',
      unitNo: 'U1',
      buyerName: 'Test',
      loanTypeCode: 1 as const,
    };

    // Valid formats
    expect(validateBooking({ ...base, buyerPhone: '0123456789' }).valid).toBe(true);
    expect(validateBooking({ ...base, buyerPhone: '+60123456789' }).valid).toBe(true);

    // Invalid format
    expect(validateBooking({ ...base, buyerPhone: '12345' }).valid).toBe(false);
  });

  test('should generate unique booking IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateBookingId()));
    expect(ids.size).toBe(100); // All unique
    for (const id of ids) {
      expect(id).toMatch(/^QTK-\d{4}-\d{5}$/);
    }
  });
});

// ─── Document Checklist ───

describe('generateDocumentChecklist', () => {
  test('should generate checklist for Jenis 1 (Subsale)', () => {
    const checklist = generateDocumentChecklist(1);
    expect(checklist.length).toBeGreaterThan(0);
    expect(checklist.every(item => item.status === 'pending')).toBe(true);
    expect(checklist.some(item => item.docType === 'IC')).toBe(true);
    expect(checklist.some(item => item.docType === 'SLIP_GAJI_ASAL')).toBe(true);
    expect(checklist.some(item => item.docType === 'SPA')).toBe(true);
  });

  test('should generate checklist for Jenis 3 (Tanah + Bina)', () => {
    const checklist = generateDocumentChecklist(3);
    expect(checklist.some(item => item.docType === 'SPA_TANAH')).toBe(true);
    expect(checklist.some(item => item.docType === 'PERJANJIAN_PEMBINAAN')).toBe(true);
  });

  test('should calculate summary correctly', () => {
    const items = generateDocumentChecklist(1);
    // Mark some as uploaded
    items[0].status = 'uploaded';
    items[1].status = 'verified';
    items[2].status = 'rejected';

    const summary = calculateChecklistSummary(items);
    expect(summary.completed).toBe(2); // uploaded + verified
    expect(summary.rejected).toBe(1);
    expect(summary.pending).toBe(items.length - 3);
    expect(summary.completionPct).toBeGreaterThan(0);
  });
});

// ─── Pipeline Summary ───

describe('calculatePipelineSummary', () => {
  test('should handle empty bookings', () => {
    const summary = calculatePipelineSummary([]);
    expect(summary.totalBookings).toBe(0);
    expect(summary.avgDaysInPipeline).toBe(0);
  });
});

// ─── DEC-001 Compliance: No Approval Prediction ───

describe('DEC-001: No Approval Probability', () => {
  test('SelfCheckResult should use readiness bands, not approval probability', () => {
    const input: SelfCheckInput = {
      gajiPokok: 5000,
      elaunTetap: 500,
      potonganWajib: 550,
      komitmenBulanan: 800,
      hargaHartanah: 350000,
      tempohPinjaman: 30,
      loanTypeCode: 1,
      kategoriPinjaman: 'HARTA PERTAMA',
      umur: 30,
    };

    const result = calculateSelfCheck(input);

    // Must have readiness band
    expect(['ready', 'caution', 'not_ready']).toContain(result.band);

    // Must NOT have any approval prediction terminology
    const resultString = JSON.stringify(result).toLowerCase();
    expect(resultString).not.toContain('approval');
    expect(resultString).not.toContain('probability');
    expect(resultString).not.toContain('kelulusan');
    expect(resultString).not.toContain('peluang');
  });
});
