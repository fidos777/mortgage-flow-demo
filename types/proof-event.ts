// types/proof-event.ts
// Proof event types aligned with PRD v3.4 Section 24

export type ProofEventCategory =
  | 'FACT'      // Evidence-backed events
  | 'DECLARE'   // Human-declared events
  | 'DERIVED';  // System-computed events

export type ProofEventType =
  // FACT events
  | 'DOC_UPLOADED'
  | 'DOC_VERIFIED'
  | 'PAYLOAD_HASH_LOCKED'
  | 'TAC_TIMESTAMP_RECORDED'
  | 'SUBMISSION_CONFIRMED'
  // DECLARE events
  | 'BUYER_STATUS_DECLARED'
  | 'AGENT_STATUS_ENTERED'
  | 'KJ_STATUS_REPORTED'
  | 'FIELD_ACKNOWLEDGED'
  // DERIVED events
  | 'READINESS_COMPUTED'
  | 'MISMATCH_DETECTED'
  | 'CONFIDENCE_SCORED'
  | 'PHASE_TRANSITIONED'
  | 'QUERY_SIGNALS_DETECTED'
  // SF.1: Developer Authorization events (CR-010B)
  | 'DEVELOPER_AUTHORIZED'
  | 'DEVELOPER_AUTH_UPDATED'
  | 'DEVELOPER_AUTH_EXPIRED'
  | 'DEVELOPER_AUTH_REVOKED'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  // SF.4: QR Entry events
  | 'QR_LINK_GENERATED'
  | 'QR_LINK_SCANNED'
  | 'QR_LINK_VALIDATED'
  | 'QR_LINK_EXPIRED'
  | 'QR_LINK_INVALID'
  | 'QR_ENTRY_COMPLETED';

export interface ProofEvent {
  id: string;
  eventType: ProofEventType;
  category: ProofEventCategory;
  actor: 'buyer' | 'agent' | 'developer' | 'system';
  actorId?: string;
  intent: string;
  timestamp: string;
  caseId: string;
  
  // PRD Section 24.4: Non-Authority Guarantee
  // This field is ALWAYS false - constitutional constraint
  authorityClaimed: false;
  
  humanConfirmationRequired: boolean;
  payloadHash?: string;
  
  // Additional metadata
  metadata?: Record<string, unknown>;
}

// Event category mapping
export const EVENT_CATEGORIES: Record<ProofEventType, ProofEventCategory> = {
  DOC_UPLOADED: 'FACT',
  DOC_VERIFIED: 'FACT',
  PAYLOAD_HASH_LOCKED: 'FACT',
  TAC_TIMESTAMP_RECORDED: 'FACT',
  SUBMISSION_CONFIRMED: 'FACT',
  BUYER_STATUS_DECLARED: 'DECLARE',
  AGENT_STATUS_ENTERED: 'DECLARE',
  KJ_STATUS_REPORTED: 'DECLARE',
  FIELD_ACKNOWLEDGED: 'DECLARE',
  READINESS_COMPUTED: 'DERIVED',
  MISMATCH_DETECTED: 'DERIVED',
  CONFIDENCE_SCORED: 'DERIVED',
  PHASE_TRANSITIONED: 'DERIVED',
  QUERY_SIGNALS_DETECTED: 'DERIVED',
  // SF.1: Developer Authorization events
  DEVELOPER_AUTHORIZED: 'DECLARE',
  DEVELOPER_AUTH_UPDATED: 'DECLARE',
  DEVELOPER_AUTH_EXPIRED: 'DERIVED',
  DEVELOPER_AUTH_REVOKED: 'DECLARE',
  UNAUTHORIZED_ACCESS_ATTEMPT: 'FACT',
  // SF.4: QR Entry events
  QR_LINK_GENERATED: 'FACT',
  QR_LINK_SCANNED: 'FACT',
  QR_LINK_VALIDATED: 'DERIVED',
  QR_LINK_EXPIRED: 'DERIVED',
  QR_LINK_INVALID: 'DERIVED',
  QR_ENTRY_COMPLETED: 'FACT',
};

// Human-readable event descriptions
export const EVENT_DESCRIPTIONS: Record<ProofEventType, string> = {
  DOC_UPLOADED: 'Dokumen dimuat naik',
  DOC_VERIFIED: 'Dokumen disahkan',
  PAYLOAD_HASH_LOCKED: 'Data dikunci untuk TAC',
  TAC_TIMESTAMP_RECORDED: 'Pengesahan TAC direkod',
  SUBMISSION_CONFIRMED: 'Penghantaran disahkan',
  BUYER_STATUS_DECLARED: 'Status diisytihar oleh pembeli',
  AGENT_STATUS_ENTERED: 'Status dimasukkan oleh ejen',
  KJ_STATUS_REPORTED: 'Status KJ dilaporkan',
  FIELD_ACKNOWLEDGED: 'Medan disemak',
  READINESS_COMPUTED: 'Isyarat kesediaan dijana',
  MISMATCH_DETECTED: 'Ketidakpadanan dikesan',
  CONFIDENCE_SCORED: 'Keyakinan dinilai',
  PHASE_TRANSITIONED: 'Fasa bertukar',
  QUERY_SIGNALS_DETECTED: 'Isyarat pertanyaan dikesan',
  // SF.1: Developer Authorization events
  DEVELOPER_AUTHORIZED: 'Kebenaran PDPA pemaju ditandatangani',
  DEVELOPER_AUTH_UPDATED: 'Kebenaran PDPA pemaju dikemaskini',
  DEVELOPER_AUTH_EXPIRED: 'Kebenaran PDPA pemaju tamat tempoh',
  DEVELOPER_AUTH_REVOKED: 'Kebenaran PDPA pemaju dibatalkan',
  UNAUTHORIZED_ACCESS_ATTEMPT: 'Cubaan akses tanpa kebenaran',
  // SF.4: QR Entry events
  QR_LINK_GENERATED: 'Pautan QR dijana',
  QR_LINK_SCANNED: 'Kod QR diimbas',
  QR_LINK_VALIDATED: 'Pautan QR disahkan',
  QR_LINK_EXPIRED: 'Pautan QR tamat tempoh',
  QR_LINK_INVALID: 'Pautan QR tidak sah',
  QR_ENTRY_COMPLETED: 'Kemasukan QR selesai',
};
