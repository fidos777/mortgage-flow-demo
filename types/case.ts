// types/case.ts
// Core case entity types aligned with PRD v3.6.1
// L-1: Updated with proper loan type support

import type { LoanTypeCode } from '@/lib/config/loan-types';

export type CasePhase =
  | 'PRESCAN'
  | 'PRESCAN_COMPLETE'
  | 'DOCS_PENDING'
  | 'DOCS_COMPLETE'
  | 'IR_REVIEW'
  | 'TAC_SCHEDULED'
  | 'TAC_CONFIRMED'
  | 'SUBMITTED'
  | 'LO_RECEIVED'
  | 'KJ_PENDING'
  | 'COMPLETED';

export type ReadinessBand = 'ready' | 'caution' | 'not_ready';

export type DocStatus = 'pending' | 'uploaded' | 'verified' | 'rejected';

export type ConfidenceLevel = 'HIGH_CONFIDENCE' | 'LOW_CONFIDENCE' | 'NEEDS_REVIEW';

export interface Document {
  id: string;
  type: string;
  name: string;
  status: DocStatus;
  confidence?: number;
  confidenceLevel?: ConfidenceLevel;
  source?: string;
  uploadedAt?: string;
}

export interface ReadinessResult {
  band: ReadinessBand;
  label: string;
  guidance: string;
  // NOTE: Score is internal only, never exposed to UI per PRD Section 16.3
  _internalScore?: number;
  // PRD Appendix A: 4-component breakdown (internal only)
  _breakdown?: {
    componentA: number; // Rule Coverage (0-30)
    componentB: number; // Income Pattern (0-25)
    componentC: number; // Commitment Signal (0-25)
    componentD: number; // Property Context (0-20)
  };
}

export interface TacSchedule {
  date: string;
  time: string;
  confirmed?: boolean;
  confirmedAt?: string;
}

export interface Property {
  name: string;
  unit: string;
  price: number;
  type: 'subsale' | 'new_project' | 'land_build';
  location: string;
}

export interface BuyerInfo {
  id: string;
  name: string;
  phone: string;
  ic?: string;
  email?: string;
  // PRD Section 8.3: Agent cannot see exact salary
  // Only income range is exposed
  incomeRange?: string;
  occupation?: string;
  employer?: string;
  grade?: string;
}

export interface Case {
  id: string;
  buyer: BuyerInfo;
  property: Property;
  phase: CasePhase;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  loanType: string;
  loanTypeCode?: LoanTypeCode; // L-1: Typed loan type code (1-7)
  readiness?: ReadinessResult;
  documents: Document[];
  tacSchedule?: TacSchedule;
  kjStatus?: 'pending' | 'received' | 'overdue';
  kjDays?: number;
  loExpiry?: number;
  queryRisk?: 'none' | 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

// Extracted field from documents (KuasaTurbo output)
export interface ExtractedField {
  key: string;
  value: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  source: string;
  acknowledged: boolean;
}

// PRD Section 18.4: Field Classification
export type FieldClassification =
  | 'USER_INPUT'      // Entered by buyer/agent
  | 'AI_EXTRACTED'    // Extracted by system
  | 'SYSTEM_DERIVED'  // Calculated by system
  | 'LPPSA_GENERATED'; // Created by LPPSA
