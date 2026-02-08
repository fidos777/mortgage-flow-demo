/**
 * Buyer Flow Types
 * CR-008: Buyer Doc-First Flow | PRD v3.6.3
 *
 * Transforms buyer journey from 11 steps (PreScan-first) to 4 steps (Doc-First):
 * 1. PDPA Consent (/buyer/start)
 * 2. Document Upload (/buyer/upload)
 * 3. Upload Confirmation (/buyer/upload-complete)
 * 4. Temujanji Booking (/buyer/temujanji)
 *
 * PreScan becomes OPTIONAL self-check tool, not prerequisite.
 */

// =============================================================================
// BUYER FLOW MODES
// =============================================================================

/**
 * Flow mode determines the buyer journey path
 * CR-008: DOC_FIRST is now the default
 */
export type BuyerFlowMode =
  | 'DOC_FIRST'    // CR-008: Upload → Temujanji (DEFAULT)
  | 'PRESCAN_FIRST'; // Legacy: PreScan → Upload → TAC

export const DEFAULT_FLOW_MODE: BuyerFlowMode = 'DOC_FIRST';

// =============================================================================
// DOCUMENT TYPES (CR-008 SIMPLIFIED)
// =============================================================================

/**
 * Required documents for Doc-First flow
 * Reduced from 7+ categories to 4 core documents
 */
export type DocFirstDocumentType =
  | 'IC'           // MyKad (front & back)
  | 'PAYSLIP'      // Latest payslip
  | 'BANK_STATEMENT' // 3 months bank statement
  | 'KWSP';        // KWSP statement (optional)

export interface DocFirstDocument {
  type: DocFirstDocumentType;
  labelBm: string;
  labelEn: string;
  descriptionBm: string;
  descriptionEn: string;
  required: boolean;
  maxSizeMb: number;
  acceptedFormats: string[];
}

export const DOC_FIRST_DOCUMENTS: Record<DocFirstDocumentType, DocFirstDocument> = {
  IC: {
    type: 'IC',
    labelBm: 'MyKad (Depan & Belakang)',
    labelEn: 'MyKad (Front & Back)',
    descriptionBm: 'Gambar jelas kad pengenalan anda',
    descriptionEn: 'Clear photo of your identification card',
    required: true,
    maxSizeMb: 10,
    acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
  },
  PAYSLIP: {
    type: 'PAYSLIP',
    labelBm: 'Slip Gaji Terkini',
    labelEn: 'Latest Payslip',
    descriptionBm: 'Slip gaji bulan terbaru',
    descriptionEn: 'Most recent monthly payslip',
    required: true,
    maxSizeMb: 10,
    acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
  },
  BANK_STATEMENT: {
    type: 'BANK_STATEMENT',
    labelBm: 'Penyata Bank (3 Bulan)',
    labelEn: 'Bank Statement (3 Months)',
    descriptionBm: 'Penyata bank 3 bulan terakhir',
    descriptionEn: 'Bank statements for last 3 months',
    required: true,
    maxSizeMb: 20,
    acceptedFormats: ['application/pdf'],
  },
  KWSP: {
    type: 'KWSP',
    labelBm: 'Penyata KWSP',
    labelEn: 'KWSP Statement',
    descriptionBm: 'Penyata caruman KWSP terkini',
    descriptionEn: 'Recent KWSP contribution statement',
    required: false,
    maxSizeMb: 10,
    acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
  },
};

// =============================================================================
// UPLOAD STATE
// =============================================================================

export type UploadStatus =
  | 'PENDING'       // Not uploaded
  | 'UPLOADING'     // Upload in progress
  | 'UPLOADED'      // Successfully uploaded
  | 'FAILED'        // Upload failed
  | 'PROCESSING';   // OCR/extraction in progress

export interface UploadedDocument {
  type: DocFirstDocumentType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  status: UploadStatus;
  extractedData?: Record<string, unknown>;
  errorMessage?: string;
}

export interface BuyerUploadState {
  buyerHash: string;
  flowMode: BuyerFlowMode;
  documents: Partial<Record<DocFirstDocumentType, UploadedDocument>>;
  completedAt?: string;
  temujanjiBooked?: boolean;
}

// =============================================================================
// TEMUJANJI (APPOINTMENT) TYPES
// =============================================================================

export type TemujanjiStatus =
  | 'PENDING'       // Awaiting booking
  | 'BOOKED'        // Slot selected
  | 'CONFIRMED'     // Agent confirmed
  | 'RESCHEDULED'   // Changed by buyer/agent
  | 'COMPLETED'     // Meeting done
  | 'CANCELLED';    // Cancelled

export interface TemujanjiSlot {
  id: string;
  date: string;        // ISO date
  timeStart: string;   // HH:mm
  timeEnd: string;     // HH:mm
  available: boolean;
  agentId?: string;
  agentName?: string;
}

export interface Temujanji {
  id: string;
  buyerHash: string;
  caseId?: string;
  slotId: string;
  scheduledDate: string;
  scheduledTimeStart: string;
  scheduledTimeEnd: string;
  status: TemujanjiStatus;
  agentId?: string;
  agentName?: string;
  notes?: string;
  bookedAt: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

// =============================================================================
// CR-008 PROOF EVENTS
// =============================================================================

/**
 * New proof event types for CR-008 Doc-First flow
 */
export type CR008ProofEventType =
  // Document Events
  | 'DOC_FIRST_STARTED'          // Buyer entered upload flow
  | 'DOC_UPLOADED'               // Individual doc uploaded
  | 'DOC_UPLOAD_FAILED'          // Upload failed
  | 'DOC_EXTRACTION_STARTED'     // OCR/extraction started
  | 'DOC_EXTRACTION_COMPLETED'   // OCR/extraction done
  | 'ALL_REQUIRED_DOCS_UPLOADED' // All required docs complete
  // Temujanji Events
  | 'TEMUJANJI_FLOW_STARTED'     // Buyer entered booking flow
  | 'TEMUJANJI_SLOT_SELECTED'    // Buyer selected a slot
  | 'TEMUJANJI_BOOKED'           // Booking confirmed
  | 'TEMUJANJI_CONFIRMED'        // Agent confirmed
  | 'TEMUJANJI_RESCHEDULED'      // Appointment rescheduled
  | 'TEMUJANJI_COMPLETED'        // Meeting completed
  | 'TEMUJANJI_CANCELLED';       // Appointment cancelled

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get required documents for Doc-First flow
 */
export function getRequiredDocuments(): DocFirstDocumentType[] {
  return (Object.keys(DOC_FIRST_DOCUMENTS) as DocFirstDocumentType[])
    .filter(key => DOC_FIRST_DOCUMENTS[key].required);
}

/**
 * Check if all required documents are uploaded
 */
export function hasAllRequiredDocuments(
  documents: Partial<Record<DocFirstDocumentType, UploadedDocument>>
): boolean {
  const required = getRequiredDocuments();
  return required.every(
    docType => documents[docType]?.status === 'UPLOADED'
  );
}

/**
 * Calculate upload progress percentage
 */
export function calculateUploadProgress(
  documents: Partial<Record<DocFirstDocumentType, UploadedDocument>>
): number {
  const required = getRequiredDocuments();
  const uploaded = required.filter(
    docType => documents[docType]?.status === 'UPLOADED'
  ).length;
  return Math.round((uploaded / required.length) * 100);
}

/**
 * Get document config by type
 */
export function getDocumentConfig(type: DocFirstDocumentType): DocFirstDocument {
  return DOC_FIRST_DOCUMENTS[type];
}

// =============================================================================
// FLOW ROUTING
// =============================================================================

/**
 * Get next route based on current state
 */
export function getNextRoute(
  currentRoute: string,
  state: BuyerUploadState
): string {
  const routes = {
    '/buyer/start': '/buyer/upload',
    '/buyer/upload': hasAllRequiredDocuments(state.documents)
      ? '/buyer/upload-complete'
      : '/buyer/upload',
    '/buyer/upload-complete': '/buyer/temujanji',
    '/buyer/temujanji': state.temujanjiBooked
      ? '/buyer'
      : '/buyer/temujanji',
  };

  return routes[currentRoute as keyof typeof routes] || '/buyer';
}

// =============================================================================
// DISCLAIMER
// =============================================================================

export const DOC_FIRST_DISCLAIMER = {
  bm: 'Dokumen ini dikumpulkan untuk menyediakan permohonan LPPSA anda. Sistem ini tidak membuat sebarang keputusan kelulusan.',
  en: 'These documents are collected to prepare your LPPSA application. This system does not make any approval decisions.',
} as const;
