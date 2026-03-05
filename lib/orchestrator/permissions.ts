// lib/orchestrator/permissions.ts
// Permission enforcement aligned with PRD v3.4

import { Role, ROLE_PERMISSIONS } from '@/types/stakeholder';
import { Case, BuyerInfo, Document, ConfidenceLevel } from '@/types/case';

/**
 * Check if a role can access a specific resource
 */
export function canAccess(
  role: Role,
  resource: string,
  action: 'view' | 'action'
): boolean {
  const matrix = ROLE_PERMISSIONS[role];
  if (!matrix) return false;
  
  if (action === 'view') {
    if (matrix.cannotView.includes(resource)) return false;
    return matrix.canView.includes(resource);
  }
  
  if (matrix.cannotAction.includes(resource)) return false;
  return matrix.canAction.includes(resource);
}

/**
 * PRD Section 8.3: Convert exact salary to range for Agent view
 */
export function salaryToRange(salary: number): string {
  if (salary <= 3000) return 'RM 2,000 - RM 3,000';
  if (salary <= 4000) return 'RM 3,001 - RM 4,000';
  if (salary <= 5000) return 'RM 4,001 - RM 5,000';
  if (salary <= 6000) return 'RM 5,001 - RM 6,000';
  if (salary <= 8000) return 'RM 6,001 - RM 8,000';
  return 'RM 8,001 ke atas';
}

/**
 * PRD Section 16.3: Convert confidence percentage to label
 * "Readiness score MUST NEVER be displayed... as approval probability"
 * DEC-001: This is a CONCEPT-LEVEL prohibition — no approval prediction engine
 * may exist in any form. See docs/DECISIONS-LOG.md for full rationale.
 */
export function confidenceToLabel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.90) return 'HIGH_CONFIDENCE';
  if (confidence >= 0.70) return 'LOW_CONFIDENCE';
  return 'NEEDS_REVIEW';
}

/**
 * Transform case data based on role permissions
 * This ensures PRD-compliant data exposure
 */
export function transformCaseForRole(caseData: Case, role: Role): Partial<Case> | null {
  switch (role) {
    case 'buyer':
      return transformForBuyer(caseData);
    case 'agent':
      return transformForAgent(caseData);
    case 'developer':
      // PRD Section 9.2: Developer cannot see individual case data
      return null;
    default:
      return caseData;
  }
}

function transformForBuyer(caseData: Case): Partial<Case> {
  return {
    id: caseData.id,
    phase: caseData.phase,
    property: caseData.property,
    // Buyer sees readiness band but NOT score breakdown
    readiness: caseData.readiness ? {
      band: caseData.readiness.band,
      label: caseData.readiness.label,
      guidance: caseData.readiness.guidance,
      // _internalScore intentionally omitted
    } : undefined,
    documents: caseData.documents.map(doc => ({
      id: doc.id,
      type: doc.type,
      name: doc.name,
      status: doc.status,
      // Buyer sees their own doc status but not AI confidence
    })),
    tacSchedule: caseData.tacSchedule,
    createdAt: caseData.createdAt,
    updatedAt: caseData.updatedAt,
  } as Partial<Case>;
}

function transformForAgent(caseData: Case): Partial<Case> {
  return {
    id: caseData.id,
    phase: caseData.phase,
    priority: caseData.priority,
    property: caseData.property,
    buyer: {
      id: caseData.buyer.id,
      name: caseData.buyer.name,
      phone: caseData.buyer.phone,
      occupation: caseData.buyer.occupation,
      // PRD Section 8.3: Income as RANGE only, not exact figure
      incomeRange: caseData.buyer.incomeRange,
      // Exact salary, IC, etc. intentionally omitted
    } as BuyerInfo,
    readiness: caseData.readiness ? {
      band: caseData.readiness.band,
      label: caseData.readiness.label,
      guidance: caseData.readiness.guidance,
      // Score breakdown intentionally omitted
    } : undefined,
    documents: caseData.documents.map(doc => ({
      id: doc.id,
      type: doc.type,
      name: doc.name,
      status: doc.status,
      // PRD compliance: Show confidence LABEL not percentage
      confidenceLevel: doc.confidence 
        ? confidenceToLabel(doc.confidence)
        : undefined,
      // Raw confidence value intentionally omitted
    })),
    tacSchedule: caseData.tacSchedule ? {
      date: caseData.tacSchedule.date,
      time: caseData.tacSchedule.time,
      confirmed: caseData.tacSchedule.confirmed,
      confirmedAt: caseData.tacSchedule.confirmedAt,
      // TAC code NEVER exposed to agent per PRD
    } : undefined,
    kjStatus: caseData.kjStatus,
    kjDays: caseData.kjDays,
    loExpiry: caseData.loExpiry,
    queryRisk: caseData.queryRisk,
    loanType: caseData.loanType,
    createdAt: caseData.createdAt,
    updatedAt: caseData.updatedAt,
  } as Partial<Case>;
}

// =============================================================================
// CR-003: Step-Level Role Enforcement for SPA Workflow
// Steps 1-2: developer/buyer action, agent can view
// Steps 3-6: buyer = read-only, agent = action + attest
// =============================================================================

export type StepAction = 'view' | 'action' | 'attest';

/**
 * CR-003: Determine what a role can do on a given SPA workflow step.
 * Steps 3–6 are agent-owned: buyer becomes read-only, agent can action+attest.
 * All proof events logged with authorityClaimed: false (constitutional constraint).
 */
export function getStepPermissions(
  stepNumber: number,
  role: Role
): { allowed: StepAction[]; readOnly: boolean } {
  // Developer can only view all steps (Level 1 visibility)
  if (role === 'developer') {
    return { allowed: ['view'], readOnly: true };
  }

  // Steps 1-2: original actor flow — buyer can action, agent can view
  if (stepNumber <= 2) {
    if (role === 'buyer') {
      return { allowed: ['view', 'action'], readOnly: false };
    }
    if (role === 'agent') {
      return { allowed: ['view'], readOnly: true };
    }
  }

  // Steps 3-6: agent ownership — buyer = read-only, agent = action + attest
  if (stepNumber >= 3 && stepNumber <= 6) {
    if (role === 'buyer') {
      return { allowed: ['view'], readOnly: true };
    }
    if (role === 'agent') {
      return { allowed: ['view', 'action', 'attest'], readOnly: false };
    }
  }

  // Default: read-only
  return { allowed: ['view'], readOnly: true };
}

/**
 * CR-003: Check if a role can toggle a specific SPA workflow step.
 * Only returns true if the role has 'action' permission on that step.
 */
export function canToggleStep(stepNumber: number, role: Role): boolean {
  const { allowed } = getStepPermissions(stepNumber, role);
  return allowed.includes('action');
}

/**
 * Aggregate case data for Developer view
 * PRD Section 9.2: Developer sees aggregate counts only
 */
export interface DeveloperAggregates {
  totalCases: number;
  byStatus: Record<string, number>;
  completionRate: number;
  avgProcessingDays: number;
}

export function aggregateCasesForDeveloper(cases: Case[]): DeveloperAggregates {
  const byStatus: Record<string, number> = {};
  
  cases.forEach(c => {
    const status = c.phase;
    byStatus[status] = (byStatus[status] || 0) + 1;
  });
  
  const completed = cases.filter(c => c.phase === 'COMPLETED').length;
  const completionRate = cases.length > 0 
    ? Math.round((completed / cases.length) * 100) 
    : 0;
  
  return {
    totalCases: cases.length,
    byStatus,
    completionRate,
    avgProcessingDays: 45, // Mock for demo
  };
}
