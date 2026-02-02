// lib/orchestrator/case-state.ts
// Case lifecycle state machine aligned with PRD v3.4 Section 14

import { CasePhase } from '@/types/case';

export type CaseEvent =
  | { type: 'PRESCAN_STARTED' }
  | { type: 'PRESCAN_COMPLETE'; band: 'ready' | 'caution' | 'not_ready' }
  | { type: 'DOCS_UPLOADED'; docType: string }
  | { type: 'ALL_DOCS_COMPLETE' }
  | { type: 'IR_APPROVED' }
  | { type: 'TAC_SCHEDULED'; slot: { date: string; time: string } }
  | { type: 'TAC_CONFIRMED'; timestamp: string }
  | { type: 'SUBMITTED_TO_LPPSA' }
  | { type: 'LO_RECEIVED'; loNumber: string }
  | { type: 'KJ_CONFIRMED' }
  | { type: 'DISBURSED' };

// Valid transitions per phase
const VALID_TRANSITIONS: Record<CasePhase, CaseEvent['type'][]> = {
  PRESCAN: ['PRESCAN_STARTED', 'PRESCAN_COMPLETE'],
  PRESCAN_COMPLETE: ['DOCS_UPLOADED'],
  DOCS_PENDING: ['DOCS_UPLOADED', 'ALL_DOCS_COMPLETE'],
  DOCS_COMPLETE: ['IR_APPROVED'],
  IR_REVIEW: ['TAC_SCHEDULED'],
  TAC_SCHEDULED: ['TAC_CONFIRMED'],
  TAC_CONFIRMED: ['SUBMITTED_TO_LPPSA'],
  SUBMITTED: ['LO_RECEIVED'],
  LO_RECEIVED: ['KJ_CONFIRMED'],
  KJ_PENDING: ['KJ_CONFIRMED', 'DISBURSED'],
  COMPLETED: [],
};

// Next phase after event
const NEXT_PHASE: Partial<Record<CaseEvent['type'], CasePhase>> = {
  PRESCAN_COMPLETE: 'PRESCAN_COMPLETE',
  DOCS_UPLOADED: 'DOCS_PENDING',
  ALL_DOCS_COMPLETE: 'DOCS_COMPLETE',
  IR_APPROVED: 'IR_REVIEW',
  TAC_SCHEDULED: 'TAC_SCHEDULED',
  TAC_CONFIRMED: 'TAC_CONFIRMED',
  SUBMITTED_TO_LPPSA: 'SUBMITTED',
  LO_RECEIVED: 'LO_RECEIVED',
  KJ_CONFIRMED: 'KJ_PENDING',
  DISBURSED: 'COMPLETED',
};

/**
 * Check if a transition is valid
 */
export function canTransition(currentPhase: CasePhase, event: CaseEvent): boolean {
  const validEvents = VALID_TRANSITIONS[currentPhase];
  return validEvents?.includes(event.type) ?? false;
}

/**
 * Get next phase after event
 */
export function getNextPhase(currentPhase: CasePhase, event: CaseEvent): CasePhase | null {
  if (!canTransition(currentPhase, event)) {
    return null;
  }
  return NEXT_PHASE[event.type] ?? currentPhase;
}

/**
 * Get human-readable phase label
 */
export function getPhaseLabel(phase: CasePhase): string {
  const labels: Record<CasePhase, string> = {
    PRESCAN: 'Imbasan Awal',
    PRESCAN_COMPLETE: 'Imbasan Selesai',
    DOCS_PENDING: 'Dokumen Pending',
    DOCS_COMPLETE: 'Dokumen Lengkap',
    IR_REVIEW: 'Semakan IR',
    TAC_SCHEDULED: 'TAC Dijadualkan',
    TAC_CONFIRMED: 'TAC Disahkan',
    SUBMITTED: 'Dihantar ke LPPSA',
    LO_RECEIVED: 'LO Diterima',
    KJ_PENDING: 'Menunggu KJ',
    COMPLETED: 'Selesai',
  };
  return labels[phase] || phase;
}

/**
 * Get phase status configuration for UI
 */
export function getPhaseConfig(phase: CasePhase): {
  color: string;
  bgColor: string;
  textColor: string;
} {
  const configs: Record<CasePhase, { color: string; bgColor: string; textColor: string }> = {
    PRESCAN: { color: 'slate', bgColor: 'bg-slate-100', textColor: 'text-slate-600' },
    PRESCAN_COMPLETE: { color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
    DOCS_PENDING: { color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' },
    DOCS_COMPLETE: { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-600' },
    IR_REVIEW: { color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
    TAC_SCHEDULED: { color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
    TAC_CONFIRMED: { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-600' },
    SUBMITTED: { color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
    LO_RECEIVED: { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-600' },
    KJ_PENDING: { color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
    COMPLETED: { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-600' },
  };
  return configs[phase] || configs.PRESCAN;
}

/**
 * Get next action required for a phase
 */
export function getNextAction(phase: CasePhase): string {
  const actions: Record<CasePhase, string> = {
    PRESCAN: 'Lengkapkan imbasan kesediaan',
    PRESCAN_COMPLETE: 'Muat naik dokumen',
    DOCS_PENDING: 'Lengkapkan dokumen yang diperlukan',
    DOCS_COMPLETE: 'Menunggu semakan IR',
    IR_REVIEW: 'Jadualkan sesi TAC',
    TAC_SCHEDULED: 'Hadir sesi TAC',
    TAC_CONFIRMED: 'Agent hantar ke portal LPPSA',
    SUBMITTED: 'Menunggu Surat Tawaran',
    LO_RECEIVED: 'Dapatkan tandatangan KJ',
    KJ_PENDING: 'Menunggu pengesahan KJ',
    COMPLETED: 'Proses selesai',
  };
  return actions[phase] || '';
}
