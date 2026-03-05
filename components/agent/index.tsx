// Agent components exports
export { SubmissionKit } from './submission-kit'
export { WhatsAppContactCTA } from './WhatsAppContactCTA'
export type { ContactAttempt, ContactPurpose, BuyerContact, WhatsAppTemplate } from './WhatsAppContactCTA'
export { default as AgentCaseNotification } from './AgentCaseNotification'

// CR-KP-002 Sprint 1 (A8)
export { SPASubmissionChecklist } from './SPASubmissionChecklist'
export type { SPASubmissionChecklistProps, SPAChecklistItem, SPADeadline, SPAWorkflowStep, CaseStage } from './SPASubmissionChecklist'

// CR-KP-002 Sprint 1 (A9) — Portal Kit Copy-Next
export { CopyNextPanel } from './CopyNextPanel'
export type { CopyNextPanelProps, CopySessionSummary } from './CopyNextPanel'

// CR-KP-002 Sprint 1 (A9) — Readiness Score v2 Engine
export { calculateReadinessV2, getV2ComponentGuidance, getBlockingItems, shouldRecalculate, PORTAL_KIT_PROOF_EVENTS } from '@/lib/engine/readiness-score-v2'
export type { ReadinessV2Inputs, ReadinessV2Output, BlockingItem, ValidationResult, KJEndorsementStatus } from '@/lib/engine/readiness-score-v2'
