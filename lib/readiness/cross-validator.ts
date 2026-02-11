/**
 * S5 R02/R03: Field-Level Cross-Validator
 *
 * Compares case form data against document extracted_data (JSONB)
 * to detect mismatches that indicate data entry errors or fraud.
 *
 * Example: Nur Adilah scenario — buyer declares gred DG9,
 * but employer confirmation letter shows DG41.
 *
 * The cross-validator is a pure function: takes data in, returns
 * mismatch flags out. No DB calls, no side effects.
 *
 * Depends on:
 *   - case_documents.extracted_data (JSONB, populated by OCR or seed)
 *   - mortgage_cases form data (buyer-declared fields)
 *
 * @see PRD v3.6.3 Section 18.4: Field Classification
 */

// =============================================================================
// TYPES
// =============================================================================

export type MismatchSeverity = 'critical' | 'warning' | 'info';

export interface FieldMismatch {
  /** Unique field identifier */
  field: string;
  /** Human-readable field label (BM) */
  labelBm: string;
  /** Human-readable field label (EN) */
  labelEn: string;
  /** Value declared by buyer in form */
  formValue: string;
  /** Value extracted from document */
  docValue: string;
  /** Document type where extracted value was found */
  docType: string;
  /** How serious is this mismatch */
  severity: MismatchSeverity;
  /** Explanation of why this is a mismatch */
  explanation: string;
  /** Explanation in BM */
  explanationBm: string;
}

/**
 * Case form data — the buyer-declared fields.
 * Subset of mortgage_cases row relevant to cross-validation.
 */
export interface CaseFormData {
  gred_jawatan?: string;
  income_declared?: number;
  employer_name?: string;
  ic_number?: string;
  buyer_name?: string;
}

/**
 * Document extracted data — from case_documents.extracted_data JSONB.
 * Keyed by document_type, each containing extracted key-value pairs.
 */
export interface DocumentExtractedData {
  doc_type: string;
  extracted_data: Record<string, string | number | null>;
}

// =============================================================================
// CROSS-VALIDATION RULES
// =============================================================================

interface CrossValidationRule {
  field: string;
  labelBm: string;
  labelEn: string;
  docType: string;
  extractedKey: string;
  severity: MismatchSeverity;
  compare: (formValue: string | number | undefined, docValue: string | number | null) => boolean;
  explanation: string;
  explanationBm: string;
}

const RULES: CrossValidationRule[] = [
  {
    field: 'gred_jawatan',
    labelBm: 'Gred Jawatan',
    labelEn: 'Position Grade',
    // Check KWSP (which may carry employer confirmation data) and EMPLOYER_CONFIRMATION
    docType: 'KWSP',
    extractedKey: 'gred_jawatan',
    severity: 'critical',
    compare: (form, doc) => {
      if (!form || !doc) return true; // No mismatch if either missing
      return String(form).toUpperCase().trim() === String(doc).toUpperCase().trim();
    },
    explanation: 'Position grade declared by buyer does not match employer confirmation letter.',
    explanationBm: 'Gred jawatan yang diisytiharkan pembeli tidak sepadan dengan surat pengesahan majikan.',
  },
  {
    field: 'income_declared',
    labelBm: 'Pendapatan Diisytiharkan',
    labelEn: 'Declared Income',
    docType: 'PAYSLIP',
    extractedKey: 'basic_salary',
    severity: 'critical',
    compare: (form, doc) => {
      if (!form || !doc) return true;
      const formNum = Number(form);
      const docNum = Number(doc);
      if (isNaN(formNum) || isNaN(docNum)) return true;
      // Allow 10% tolerance for rounding
      const tolerance = docNum * 0.1;
      return Math.abs(formNum - docNum) <= tolerance;
    },
    explanation: 'Declared income differs from payslip basic salary by more than 10%.',
    explanationBm: 'Pendapatan yang diisytiharkan berbeza lebih 10% daripada gaji asas slip gaji.',
  },
  {
    field: 'ic_number',
    labelBm: 'Nombor IC',
    labelEn: 'IC Number',
    docType: 'IC',
    extractedKey: 'ic_number',
    severity: 'critical',
    compare: (form, doc) => {
      if (!form || !doc) return true;
      // Normalize: remove dashes and spaces
      const normalize = (v: string | number) => String(v).replace(/[-\s]/g, '');
      return normalize(form) === normalize(doc);
    },
    explanation: 'IC number declared does not match the uploaded IC document.',
    explanationBm: 'Nombor IC yang diisytiharkan tidak sepadan dengan dokumen IC yang dimuat naik.',
  },
  {
    field: 'buyer_name',
    labelBm: 'Nama Pembeli',
    labelEn: 'Buyer Name',
    docType: 'IC',
    extractedKey: 'full_name',
    severity: 'warning',
    compare: (form, doc) => {
      if (!form || !doc) return true;
      // Case-insensitive comparison, trim whitespace
      return String(form).toUpperCase().trim() === String(doc).toUpperCase().trim();
    },
    explanation: 'Buyer name does not match the name on uploaded IC.',
    explanationBm: 'Nama pembeli tidak sepadan dengan nama pada IC yang dimuat naik.',
  },
  {
    field: 'employer_name',
    labelBm: 'Nama Majikan',
    labelEn: 'Employer Name',
    docType: 'KWSP',
    extractedKey: 'employer_name',
    severity: 'warning',
    compare: (form, doc) => {
      if (!form || !doc) return true;
      // Fuzzy match: check if one contains the other (employer names vary)
      const formUpper = String(form).toUpperCase().trim();
      const docUpper = String(doc).toUpperCase().trim();
      return formUpper === docUpper ||
        formUpper.includes(docUpper) ||
        docUpper.includes(formUpper);
    },
    explanation: 'Employer name declared does not match employer confirmation letter.',
    explanationBm: 'Nama majikan yang diisytiharkan tidak sepadan dengan surat pengesahan majikan.',
  },
];

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Cross-validate case form data against document extracted fields.
 *
 * @param formData - Buyer-declared form data from mortgage_cases
 * @param documents - Array of document extracted data from case_documents
 * @returns Array of field mismatches (empty = all clear)
 */
export function crossValidateFields(
  formData: CaseFormData,
  documents: DocumentExtractedData[],
): FieldMismatch[] {
  const mismatches: FieldMismatch[] = [];

  // Index documents by type for O(1) lookup
  const docsByType = new Map<string, DocumentExtractedData>();
  for (const doc of documents) {
    docsByType.set(doc.doc_type, doc);
  }

  for (const rule of RULES) {
    const doc = docsByType.get(rule.docType);
    if (!doc || !doc.extracted_data) continue;

    const formValue = formData[rule.field as keyof CaseFormData];
    const docValue = doc.extracted_data[rule.extractedKey];

    // Skip if either side has no data
    if (formValue === undefined || formValue === null) continue;
    if (docValue === undefined || docValue === null) continue;

    // Run comparison — returns true if values MATCH
    const matches = rule.compare(formValue, docValue);

    if (!matches) {
      mismatches.push({
        field: rule.field,
        labelBm: rule.labelBm,
        labelEn: rule.labelEn,
        formValue: String(formValue),
        docValue: String(docValue),
        docType: rule.docType,
        severity: rule.severity,
        explanation: rule.explanation,
        explanationBm: rule.explanationBm,
      });
    }
  }

  return mismatches;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Count mismatches by severity
 */
export function countBySeverity(mismatches: FieldMismatch[]): Record<MismatchSeverity, number> {
  return {
    critical: mismatches.filter(m => m.severity === 'critical').length,
    warning: mismatches.filter(m => m.severity === 'warning').length,
    info: mismatches.filter(m => m.severity === 'info').length,
  };
}

/**
 * Check if any critical mismatches exist
 */
export function hasCriticalMismatch(mismatches: FieldMismatch[]): boolean {
  return mismatches.some(m => m.severity === 'critical');
}
