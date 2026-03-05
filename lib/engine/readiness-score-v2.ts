// lib/engine/readiness-score-v2.ts
// CR-KP-002 Sprint 1 (A9) — Readiness Score v2 Engine
// 5-component weighted model: Dokumen 35%, Medan 25%, Tandatangan 15%, Validasi 15%, KJ 10%
// DEC-001: This is a READINESS score, NEVER approval probability
// Replaces the v1 4-component model (lib/kuasaturbo/readiness-score.ts) for new flows
// v1 kept for backward compatibility with existing self-check UI

import { ReadinessResult, ReadinessBand } from '@/types/case';
import {
  READINESS_V2_MODEL,
  ALL_FIELDS,
  getFieldsByJenis,
  getJointFields,
  getFieldsByReadinessComponent,
  type ReadinessComponent,
  type FieldDefinition,
} from '@/lib/config/field-registry';
import type { LoanTypeCode } from '@/lib/config/loan-types';

// ============================================================================
// Types
// ============================================================================

/**
 * Input payload for v2 readiness calculation
 * Sourced from case data, not manual self-check form
 */
export interface ReadinessV2Inputs {
  jenisCode: LoanTypeCode;
  hasJointApplicant: boolean;

  // Component inputs
  completedFieldIds: string[];     // MEDAN: Which fields are filled
  completedDocIds: string[];       // DOKUMEN: Which documents are uploaded
  collectedSignatureIds: string[]; // TANDATANGAN: Which signatures collected
  validationResults: ValidationResult[]; // VALIDASI: Cross-field validation outcomes
  kjEndorsement: KJEndorsementStatus;    // KJ: KJ endorsement state
}

export interface ValidationResult {
  ruleId: string;
  passed: boolean;
  severity: 'error' | 'warning';
}

export type KJEndorsementStatus =
  | 'not_started'        // Haven't engaged KJ yet
  | 'pending_signature'  // KJ aware, signature pending
  | 'signed'             // KJ signed Surat Pengesahan
  | 'submitted';         // Signed and submitted to LPPSA

/**
 * Detailed v2 readiness output
 */
export interface ReadinessV2Output {
  result: ReadinessResult;
  components: {
    dokumen: ComponentScore;
    medan: ComponentScore;
    tandatangan: ComponentScore;
    validasi: ComponentScore;
    kj: ComponentScore;
  };
  applicableFields: number;
  applicableDocs: number;
  applicableSignatures: number;
  applicableValidations: number;
  missingFieldIds: string[];
  missingDocIds: string[];
  missingSignatureIds: string[];
  failedValidationIds: string[];
  version: 'v2.0';
  calculatedAt: string;
}

interface ComponentScore {
  raw: number;        // 0-1.0
  weighted: number;   // raw × weight
  weight: number;     // from READINESS_V2_MODEL
  label: string;
  labelEn: string;
  completed: number;
  total: number;
}

// ============================================================================
// Proof Events (A9: Portal Kit proof events)
// ============================================================================

export const PORTAL_KIT_PROOF_EVENTS = {
  PORTAL_KIT_STARTED: 'portal_kit_started',
  PORTAL_SECTION_MARKED_COMPLETE: 'portal_section_marked_complete',
  PORTAL_COPY_SESSION_SUMMARY: 'portal_copy_session_summary',
} as const;

// ============================================================================
// Core Calculation
// ============================================================================

/**
 * Calculate readiness using v2 5-component model
 *
 * DEC-001: Output is a READINESS SIGNAL, not approval probability.
 * The score measures document/field/signature completeness — how ready
 * the application package is for submission. It does NOT predict
 * whether LPPSA will approve the loan.
 */
export function calculateReadinessV2(inputs: ReadinessV2Inputs): ReadinessV2Output {
  // 1. Determine applicable fields based on Jenis and joint status
  const applicableFields = getApplicableFields(inputs.jenisCode, inputs.hasJointApplicant);
  const readinessFields = applicableFields.filter(f => f.affectsReadiness);

  // 2. Calculate each component
  const medan = calculateMedanScore(inputs.completedFieldIds, readinessFields);
  const dokumen = calculateDokumenScore(inputs.completedDocIds);
  const tandatangan = calculateTandatanganScore(inputs.collectedSignatureIds);
  const validasi = calculateValidasiScore(inputs.validationResults);
  const kj = calculateKJScore(inputs.kjEndorsement);

  // 3. Weighted total
  const totalWeighted =
    dokumen.weighted + medan.weighted + tandatangan.weighted +
    validasi.weighted + kj.weighted;

  const clampedScore = Math.min(1.0, Math.max(0.0, totalWeighted));

  // 4. Classify band
  const band = scoreToBand(clampedScore);
  const { label, guidance } = getBandContent(band);

  // 5. Compute missing items
  const readinessFieldIds = readinessFields.map(f => f.id);
  const missingFieldIds = readinessFieldIds.filter(id => !inputs.completedFieldIds.includes(id));

  const signatureFields = getFieldsByReadinessComponent('TANDATANGAN');
  const missingSignatureIds = signatureFields
    .map(f => f.id)
    .filter(id => !inputs.collectedSignatureIds.includes(id));

  const failedValidationIds = inputs.validationResults
    .filter(v => !v.passed)
    .map(v => v.ruleId);

  return {
    result: {
      band,
      label,
      guidance,
      _internalScore: Math.round(clampedScore * 100),
      _breakdownV2: {
        dokumen: dokumen.raw,
        medan: medan.raw,
        tandatangan: tandatangan.raw,
        validasi: validasi.raw,
        kj: kj.raw,
      },
    },
    components: { dokumen, medan, tandatangan, validasi, kj },
    applicableFields: readinessFields.length,
    applicableDocs: dokumen.total,
    applicableSignatures: tandatangan.total,
    applicableValidations: validasi.total,
    missingFieldIds,
    missingDocIds: [], // Populated by caller from document checklist
    missingSignatureIds,
    failedValidationIds,
    version: 'v2.0',
    calculatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Component Calculators
// ============================================================================

function calculateMedanScore(
  completedIds: string[],
  readinessFields: FieldDefinition[]
): ComponentScore {
  const total = readinessFields.length;
  const completed = readinessFields.filter(f => completedIds.includes(f.id)).length;
  const raw = total > 0 ? completed / total : 0;
  const weight = READINESS_V2_MODEL.components.MEDAN.weight;

  return {
    raw,
    weighted: raw * weight,
    weight,
    label: READINESS_V2_MODEL.components.MEDAN.label,
    labelEn: READINESS_V2_MODEL.components.MEDAN.labelEn,
    completed,
    total,
  };
}

function calculateDokumenScore(completedDocIds: string[]): ComponentScore {
  // Document count comes from document-checklist.ts, approximated here
  // In production, caller provides total required docs for the Jenis type
  const total = Math.max(completedDocIds.length, 9); // Minimum 9 base docs
  const completed = completedDocIds.length;
  const raw = total > 0 ? Math.min(1.0, completed / total) : 0;
  const weight = READINESS_V2_MODEL.components.DOKUMEN.weight;

  return {
    raw,
    weighted: raw * weight,
    weight,
    label: READINESS_V2_MODEL.components.DOKUMEN.label,
    labelEn: READINESS_V2_MODEL.components.DOKUMEN.labelEn,
    completed,
    total,
  };
}

function calculateTandatanganScore(collectedIds: string[]): ComponentScore {
  const signatureFields = getFieldsByReadinessComponent('TANDATANGAN');
  const total = signatureFields.length;
  const completed = signatureFields.filter(f => collectedIds.includes(f.id)).length;
  const raw = total > 0 ? completed / total : 0;
  const weight = READINESS_V2_MODEL.components.TANDATANGAN.weight;

  return {
    raw,
    weighted: raw * weight,
    weight,
    label: READINESS_V2_MODEL.components.TANDATANGAN.label,
    labelEn: READINESS_V2_MODEL.components.TANDATANGAN.labelEn,
    completed,
    total,
  };
}

function calculateValidasiScore(results: ValidationResult[]): ComponentScore {
  const total = results.length;
  const completed = results.filter(r => r.passed).length;
  const raw = total > 0 ? completed / total : 0;
  const weight = READINESS_V2_MODEL.components.VALIDASI.weight;

  return {
    raw,
    weighted: raw * weight,
    weight,
    label: READINESS_V2_MODEL.components.VALIDASI.label,
    labelEn: READINESS_V2_MODEL.components.VALIDASI.labelEn,
    completed,
    total,
  };
}

function calculateKJScore(status: KJEndorsementStatus): ComponentScore {
  // KJ is binary: 1.0 if signed or submitted, 0 otherwise
  const isReady = status === 'signed' || status === 'submitted';
  const raw = isReady ? 1.0 : 0.0;
  const weight = READINESS_V2_MODEL.components.KJ.weight;

  return {
    raw,
    weighted: raw * weight,
    weight,
    label: READINESS_V2_MODEL.components.KJ.label,
    labelEn: READINESS_V2_MODEL.components.KJ.labelEn,
    completed: isReady ? 1 : 0,
    total: 1,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function getApplicableFields(
  jenisCode: LoanTypeCode,
  hasJoint: boolean
): FieldDefinition[] {
  let fields = getFieldsByJenis(jenisCode);

  if (!hasJoint) {
    fields = fields.filter(f => !f.jointConditional);
  }

  return fields;
}

function scoreToBand(score: number): ReadinessBand {
  if (score >= READINESS_V2_MODEL.thresholds.ready) return 'ready';
  if (score >= READINESS_V2_MODEL.thresholds.caution) return 'caution';
  return 'not_ready';
}

function getBandContent(band: ReadinessBand): { label: string; guidance: string } {
  switch (band) {
    case 'ready':
      return {
        label: 'SEDIA UNTUK DITERUSKAN',
        guidance: 'Pakej permohonan hampir lengkap. Anda boleh meneruskan ke proses Copy-Next.',
      };
    case 'caution':
      return {
        label: 'PERLU PERHATIAN',
        guidance: 'Beberapa item masih belum lengkap. Sila semak senarai yang ditandakan.',
      };
    case 'not_ready':
      return {
        label: 'BELUM SEDIA',
        guidance: 'Sila lengkapkan item yang ditandakan sebelum meneruskan.',
      };
  }
}

/**
 * Get component-level guidance messages (BM)
 * Returns actionable items for each weak component
 */
export function getV2ComponentGuidance(output: ReadinessV2Output): string[] {
  const guidance: string[] = [];

  if (output.components.dokumen.raw < 0.8) {
    guidance.push(
      `${output.components.dokumen.total - output.components.dokumen.completed} dokumen masih belum dimuat naik.`
    );
  }

  if (output.components.medan.raw < 0.8) {
    guidance.push(
      `${output.missingFieldIds.length} medan borang belum diisi.`
    );
  }

  if (output.components.tandatangan.raw < 1.0) {
    guidance.push(
      `${output.missingSignatureIds.length} tandatangan masih diperlukan.`
    );
  }

  if (output.components.validasi.raw < 1.0 && output.failedValidationIds.length > 0) {
    guidance.push(
      `${output.failedValidationIds.length} semakan silang gagal — sila betulkan.`
    );
  }

  if (output.components.kj.raw === 0) {
    guidance.push('Surat Pengesahan KJ belum diperoleh.');
  }

  return guidance;
}

// ============================================================================
// Blocking Items (V1: structured blockers for agent action queue)
// ============================================================================

/**
 * Structured blocking item — tells the agent exactly what's blocking readiness
 * and who needs to act on it.
 */
export interface BlockingItem {
  type: 'DOC' | 'FIELD' | 'VALIDATION' | 'KJ';
  fieldId: string;
  reason: string;
  action: string;
  actor: 'buyer' | 'agent' | 'kj' | 'developer';
}

/**
 * Extract structured blocking items from a readiness v2 output.
 * Returns actionable items sorted by actor priority (buyer → agent → kj).
 */
export function getBlockingItems(output: ReadinessV2Output, inputs: ReadinessV2Inputs): BlockingItem[] {
  const items: BlockingItem[] = [];

  // Missing documents
  for (const docId of output.missingDocIds) {
    items.push({
      type: 'DOC',
      fieldId: docId,
      reason: `Dokumen ${docId} belum dimuat naik`,
      action: 'Muat naik dokumen yang diperlukan',
      actor: 'buyer',
    });
  }

  // Missing fields
  for (const fieldId of output.missingFieldIds) {
    const field = ALL_FIELDS.find(f => f.id === fieldId);
    items.push({
      type: 'FIELD',
      fieldId,
      reason: `${field?.nameMy ?? fieldId} belum diisi`,
      action: `Isi medan ${field?.nameMy ?? fieldId}`,
      actor: field?.classification === 'DEVELOPER_SOURCED' ? 'developer' : 'agent',
    });
  }

  // Failed validations
  for (const ruleId of output.failedValidationIds) {
    const result = inputs.validationResults.find(v => v.ruleId === ruleId);
    items.push({
      type: 'VALIDATION',
      fieldId: ruleId,
      reason: `Semakan silang gagal: ${ruleId}`,
      action: 'Betulkan data yang bercanggah',
      actor: 'agent',
    });
  }

  // KJ endorsement
  if (output.components.kj.raw === 0) {
    items.push({
      type: 'KJ',
      fieldId: 'KJ_ENDORSEMENT',
      reason: 'Surat Pengesahan KJ belum diperoleh',
      action: 'Dapatkan tandatangan Ketua Jabatan',
      actor: 'kj',
    });
  }

  return items;
}

/**
 * Auto-invalidation: detect if readiness should be recalculated
 */
export function shouldRecalculate(
  previous: ReadinessV2Output | null,
  currentFieldCount: number,
  currentDocCount: number
): boolean {
  if (!previous) return true;
  if (currentFieldCount !== previous.applicableFields) return true;
  if (currentDocCount !== previous.applicableDocs) return true;
  return false;
}
