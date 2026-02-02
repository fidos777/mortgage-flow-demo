// lib/kuasaturbo/file-validation.ts
// Document upload validation aligned with PRD v3.4 Section 21

import { CasePhase } from '@/types/case';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  warning?: string;
}

export interface FileInfo {
  name: string;
  type: string;
  size: number;
}

/**
 * PRD Section 21.1: Document Upload Policy by Stage
 * 
 * | Stage       | Screenshot | PDF/Scan | Notes                          |
 * |-------------|------------|----------|--------------------------------|
 * | Prescan     | ✓ Allowed  | ✓ Allowed| Signal-quality data acceptable |
 * | Preparation | ✗ Blocked  | ✓ Required| Evidence-grade required        |
 * | Submission  | ✗ Blocked  | ✓ Required| Must be verifiable             |
 */

// Phases that require PDF/scan (no screenshots)
const EVIDENCE_REQUIRED_PHASES: CasePhase[] = [
  'DOCS_PENDING',
  'DOCS_COMPLETE',
  'IR_REVIEW',
  'TAC_SCHEDULED',
  'TAC_CONFIRMED',
  'SUBMITTED',
];

// Phases that allow screenshots (signal-quality)
const SIGNAL_ALLOWED_PHASES: CasePhase[] = [
  'PRESCAN',
  'PRESCAN_COMPLETE',
];

// File size thresholds
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SCREENSHOT_SIZE_THRESHOLD = 500 * 1024; // 500KB - likely a screenshot

// Accepted MIME types
const ACCEPTED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
];

const PDF_TYPES = ['application/pdf'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];

/**
 * Detect if a file is likely a screenshot based on heuristics
 */
export function isLikelyScreenshot(file: FileInfo): boolean {
  // Not an image? Not a screenshot
  if (!IMAGE_TYPES.includes(file.type)) {
    return false;
  }
  
  // Small image files are likely screenshots
  if (file.size < SCREENSHOT_SIZE_THRESHOLD) {
    return true;
  }
  
  // Check filename patterns common in screenshots
  const screenshotPatterns = [
    /screenshot/i,
    /screen shot/i,
    /IMG_\d+/i,        // iPhone
    /Screenshot_/i,     // Android
    /Capture/i,
    /snip/i,
    /clip/i,
  ];
  
  if (screenshotPatterns.some(pattern => pattern.test(file.name))) {
    return true;
  }
  
  return false;
}

/**
 * Validate file upload based on current workflow phase
 * PRD Section 21.1: Stage-aware validation
 */
export function validateUpload(file: FileInfo, phase: CasePhase): ValidationResult {
  // Check file type
  if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type)) {
    return {
      valid: false,
      reason: `Jenis fail tidak disokong. Sila muat naik PDF atau imej (JPEG, PNG).`,
    };
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      reason: `Fail terlalu besar. Saiz maksimum ialah 10MB.`,
    };
  }
  
  // Check if empty file
  if (file.size === 0) {
    return {
      valid: false,
      reason: `Fail kosong. Sila pilih fail yang sah.`,
    };
  }
  
  // Screenshot detection for evidence-required phases
  const isScreenshot = isLikelyScreenshot(file);
  
  if (EVIDENCE_REQUIRED_PHASES.includes(phase)) {
    if (isScreenshot) {
      return {
        valid: false,
        reason: `Screenshot tidak diterima pada peringkat ini. Sila muat naik dokumen PDF atau scan yang jelas.`,
      };
    }
    
    // Prefer PDF for evidence phases
    if (IMAGE_TYPES.includes(file.type) && !isScreenshot) {
      return {
        valid: true,
        warning: `Untuk kualiti terbaik, PDF disyorkan berbanding imej.`,
      };
    }
  }
  
  // Signal phases allow screenshots with warning
  if (SIGNAL_ALLOWED_PHASES.includes(phase)) {
    if (isScreenshot) {
      return {
        valid: true,
        warning: `Screenshot diterima untuk imbasan awal. Dokumen rasmi diperlukan kemudian.`,
      };
    }
  }
  
  return { valid: true };
}

/**
 * Validate document completeness for a specific document type
 */
export function validateDocumentType(
  docType: string, 
  file: FileInfo, 
  phase: CasePhase
): ValidationResult {
  const baseValidation = validateUpload(file, phase);
  if (!baseValidation.valid) {
    return baseValidation;
  }
  
  // Document-specific validations
  const docRequirements: Record<string, { minSize?: number; preferPdf?: boolean }> = {
    'IC': { minSize: 50 * 1024, preferPdf: false }, // IC can be image
    'SLIP_GAJI': { minSize: 30 * 1024, preferPdf: true },
    'BANK': { minSize: 100 * 1024, preferPdf: true }, // Bank statements should be PDF
    'KWSP': { minSize: 50 * 1024, preferPdf: true },
    'SPA': { minSize: 200 * 1024, preferPdf: true }, // SPA is usually multi-page
    'GERAN': { minSize: 100 * 1024, preferPdf: true },
  };
  
  const requirements = docRequirements[docType];
  if (requirements) {
    if (requirements.minSize && file.size < requirements.minSize) {
      return {
        valid: true,
        warning: `Fail mungkin berkualiti rendah atau tidak lengkap. Pastikan semua halaman disertakan.`,
      };
    }
    
    if (requirements.preferPdf && IMAGE_TYPES.includes(file.type)) {
      return {
        valid: true,
        warning: `PDF disyorkan untuk ${docType}. Pastikan imej jelas dan lengkap.`,
      };
    }
  }
  
  return baseValidation;
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get accepted file types string for input element
 */
export function getAcceptedTypes(): string {
  return ACCEPTED_DOCUMENT_TYPES.join(',');
}
