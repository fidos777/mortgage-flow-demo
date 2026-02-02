// __tests__/permissions.test.ts
// Unit tests for PRD Section 7-13 role-based access control
// Run with: npx vitest run __tests__/permissions.test.ts

import { describe, it, expect } from 'vitest';
import { 
  canAccess, 
  transformCaseForRole, 
  salaryToRange, 
  confidenceToLabel,
  aggregateCasesForDeveloper,
  ROLE_PERMISSIONS
} from '../lib/orchestrator/permissions';
import { Case } from '../types/case';

describe('Permissions - PRD Section 7-13 Compliance', () => {
  
  // Mock case data for testing
  const mockCase: Case = {
    id: 'C001',
    buyer: {
      id: 'B001',
      name: 'Ahmad bin Ali',
      phone: '012-3456789',
      basicSalary: 4500,
      incomeRange: 'RM 4,001 - RM 5,000',
      occupation: 'Pegawai Tadbir',
      employer: 'Jabatan Pendidikan',
      grade: 'N41',
    },
    property: {
      name: 'Residensi Harmoni',
      unit: 'A-12-03',
      price: 450000,
      type: 'subsale',
      location: 'Selangor',
    },
    phase: 'TAC_SCHEDULED',
    priority: 'P2',
    loanType: 'Jenis 1 - Rumah Siap (Subsale)',
    documents: [
      { id: 'D1', type: 'IC', name: 'IC.pdf', status: 'verified', confidence: 0.95 },
      { id: 'D2', type: 'SLIP_GAJI', name: 'slip.pdf', status: 'verified', confidence: 0.72 },
    ],
    tacSchedule: {
      date: '3 Feb 2026',
      time: '10:00 AM',
      confirmed: false,
      code: 'TAC-ABC123', // Should be hidden from agent
    },
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-31T00:00:00Z',
  };

  describe('salaryToRange - PRD Section 9.1', () => {
    it('should convert exact salary to range ≤3000', () => {
      expect(salaryToRange(2500)).toBe('RM 3,000 ke bawah');
      expect(salaryToRange(3000)).toBe('RM 3,000 ke bawah');
    });

    it('should convert to range 3001-4000', () => {
      expect(salaryToRange(3500)).toBe('RM 3,001 - RM 4,000');
    });

    it('should convert to range 4001-5000', () => {
      expect(salaryToRange(4500)).toBe('RM 4,001 - RM 5,000');
    });

    it('should convert to range 5001-6000', () => {
      expect(salaryToRange(5500)).toBe('RM 5,001 - RM 6,000');
    });

    it('should convert to range 6001-8000', () => {
      expect(salaryToRange(7000)).toBe('RM 6,001 - RM 8,000');
    });

    it('should convert to range 8001+', () => {
      expect(salaryToRange(10000)).toBe('RM 8,001 ke atas');
      expect(salaryToRange(50000)).toBe('RM 8,001 ke atas');
    });
  });

  describe('confidenceToLabel - PRD Section 11.3', () => {
    it('should label ≥90% as HIGH_CONFIDENCE', () => {
      expect(confidenceToLabel(0.90)).toBe('HIGH_CONFIDENCE');
      expect(confidenceToLabel(0.95)).toBe('HIGH_CONFIDENCE');
      expect(confidenceToLabel(1.0)).toBe('HIGH_CONFIDENCE');
    });

    it('should label 70-89% as LOW_CONFIDENCE', () => {
      expect(confidenceToLabel(0.70)).toBe('LOW_CONFIDENCE');
      expect(confidenceToLabel(0.85)).toBe('LOW_CONFIDENCE');
      expect(confidenceToLabel(0.89)).toBe('LOW_CONFIDENCE');
    });

    it('should label <70% as NEEDS_REVIEW', () => {
      expect(confidenceToLabel(0.69)).toBe('NEEDS_REVIEW');
      expect(confidenceToLabel(0.50)).toBe('NEEDS_REVIEW');
      expect(confidenceToLabel(0.10)).toBe('NEEDS_REVIEW');
    });
  });

  describe('canAccess - Role Permission Matrix', () => {
    describe('Buyer permissions', () => {
      it('should allow buyer to view own status', () => {
        expect(canAccess('buyer', 'own_case', 'view')).toBe(true);
      });

      it('should allow buyer to upload documents', () => {
        expect(canAccess('buyer', 'documents', 'upload')).toBe(true);
      });

      it('should DENY buyer access to scoring breakdown', () => {
        expect(canAccess('buyer', 'scoring_breakdown', 'view')).toBe(false);
      });

      it('should DENY buyer ability to submit to LPPSA', () => {
        expect(canAccess('buyer', 'lppsa_submission', 'submit')).toBe(false);
      });
    });

    describe('Agent permissions', () => {
      it('should allow agent to view case status', () => {
        expect(canAccess('agent', 'case_status', 'view')).toBe(true);
      });

      it('should allow agent to schedule TAC', () => {
        expect(canAccess('agent', 'tac_schedule', 'create')).toBe(true);
      });

      it('should DENY agent access to TAC code', () => {
        expect(canAccess('agent', 'tac_code', 'view')).toBe(false);
      });

      it('should DENY agent access to exact salary', () => {
        expect(canAccess('agent', 'exact_salary', 'view')).toBe(false);
      });

      it('should DENY agent ability to approve/reject', () => {
        expect(canAccess('agent', 'application', 'approve')).toBe(false);
        expect(canAccess('agent', 'application', 'reject')).toBe(false);
      });
    });

    describe('Developer permissions', () => {
      it('should allow developer to view aggregates', () => {
        expect(canAccess('developer', 'project_aggregates', 'view')).toBe(true);
      });

      it('should DENY developer access to case details', () => {
        expect(canAccess('developer', 'case_details', 'view')).toBe(false);
      });

      it('should DENY developer access to buyer info', () => {
        expect(canAccess('developer', 'buyer_info', 'view')).toBe(false);
      });

      it('should DENY developer access to documents', () => {
        expect(canAccess('developer', 'documents', 'view')).toBe(false);
      });
    });
  });

  describe('transformCaseForRole', () => {
    describe('Agent transformation', () => {
      it('should hide exact salary, show range only', () => {
        const transformed = transformCaseForRole(mockCase, 'agent');
        
        expect(transformed?.buyer.basicSalary).toBeUndefined();
        expect(transformed?.buyer.incomeRange).toBeDefined();
      });

      it('should hide TAC code', () => {
        const transformed = transformCaseForRole(mockCase, 'agent');
        
        expect(transformed?.tacSchedule?.code).toBeUndefined();
        expect(transformed?.tacSchedule?.date).toBeDefined();
        expect(transformed?.tacSchedule?.time).toBeDefined();
      });

      it('should convert confidence to labels', () => {
        const transformed = transformCaseForRole(mockCase, 'agent');
        
        transformed?.documents.forEach(doc => {
          // Confidence should be label, not number
          expect(typeof doc.confidenceLabel).toBe('string');
          expect(['HIGH_CONFIDENCE', 'LOW_CONFIDENCE', 'NEEDS_REVIEW']).toContain(doc.confidenceLabel);
        });
      });
    });

    describe('Developer transformation', () => {
      it('should return null (no individual case access)', () => {
        const transformed = transformCaseForRole(mockCase, 'developer');
        expect(transformed).toBeNull();
      });
    });

    describe('Buyer transformation', () => {
      it('should hide scoring breakdown', () => {
        const caseWithScore = {
          ...mockCase,
          readiness: {
            band: 'ready',
            label: 'READY',
            guidance: 'Continue',
            _internalScore: 85,
          },
        };
        
        const transformed = transformCaseForRole(caseWithScore, 'buyer');
        
        expect(transformed?.readiness?.band).toBeDefined();
        expect(transformed?.readiness?._internalScore).toBeUndefined();
      });
    });
  });

  describe('aggregateCasesForDeveloper', () => {
    const mockCases: Case[] = [
      { ...mockCase, id: 'C001', phase: 'TAC_SCHEDULED' },
      { ...mockCase, id: 'C002', phase: 'DOCS_PENDING' },
      { ...mockCase, id: 'C003', phase: 'COMPLETED' },
      { ...mockCase, id: 'C004', phase: 'COMPLETED' },
      { ...mockCase, id: 'C005', phase: 'SUBMITTED' },
    ];

    it('should return only aggregate counts', () => {
      const aggregates = aggregateCasesForDeveloper(mockCases);
      
      expect(aggregates.totalCases).toBe(5);
      expect(aggregates.byPhase['COMPLETED']).toBe(2);
      expect(aggregates.byPhase['TAC_SCHEDULED']).toBe(1);
    });

    it('should calculate conversion rate', () => {
      const aggregates = aggregateCasesForDeveloper(mockCases);
      
      // 2 completed out of 5 = 40%
      expect(aggregates.conversionRate).toBe(40);
    });

    it('should NOT include any individual identifiers', () => {
      const aggregates = aggregateCasesForDeveloper(mockCases);
      
      // Should not have these properties
      expect(aggregates).not.toHaveProperty('cases');
      expect(aggregates).not.toHaveProperty('buyers');
      expect(aggregates).not.toHaveProperty('names');
      expect(aggregates).not.toHaveProperty('phones');
    });
  });
});
