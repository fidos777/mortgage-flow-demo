// lib/services/mock/case-service.ts
// Mock Case Service - wraps Zustand store for demo mode

import { ICaseService } from '../index';
import { Case, CasePhase, Document, TacSchedule } from '@/types/case';
import { Role } from '@/types/stakeholder';
import { useCaseStore } from '@/lib/store/case-store';
import { transformCaseForRole } from '@/lib/orchestrator/permissions';

export class MockCaseService implements ICaseService {
  async getCases(role: Role): Promise<Case[]> {
    const store = useCaseStore.getState();
    const cases = store.cases;
    
    // PRD compliance: Filter/transform based on role
    if (role === 'developer') {
      // Developer cannot see individual cases
      return [];
    }
    
    return cases.map(c => transformCaseForRole(c, role) as Case).filter(Boolean);
  }
  
  async getCaseById(id: string, role: Role): Promise<Case | null> {
    const store = useCaseStore.getState();
    const caseData = store.getCaseById(id);
    
    if (!caseData) return null;
    
    // PRD compliance: Transform based on role
    if (role === 'developer') {
      return null; // Developer cannot see individual cases
    }
    
    return transformCaseForRole(caseData, role) as Case;
  }
  
  async createCase(data: Partial<Case>): Promise<Case> {
    // For demo, we don't actually create - just return mock
    const newCase: Case = {
      id: `C${Date.now()}`,
      buyer: data.buyer || {
        id: `B${Date.now()}`,
        name: 'Demo User',
        phone: '012-3456789',
      },
      property: data.property || {
        name: 'Demo Property',
        unit: 'A-1-1',
        price: 400000,
        type: 'subsale',
        location: 'Selangor',
      },
      phase: 'PRESCAN',
      priority: 'P3',
      loanType: 'Jenis 1 - Rumah Siap (Subsale)',
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return newCase;
  }
  
  async updatePhase(caseId: string, phase: CasePhase): Promise<void> {
    const store = useCaseStore.getState();
    store.updateCasePhase(caseId, phase);
  }
  
  async addDocument(caseId: string, doc: Document): Promise<void> {
    const store = useCaseStore.getState();
    store.addDocument(caseId, doc);
  }
  
  async scheduleTac(caseId: string, schedule: TacSchedule): Promise<void> {
    const store = useCaseStore.getState();
    store.scheduleTac(caseId, schedule);
  }
  
  async confirmTac(caseId: string): Promise<void> {
    const store = useCaseStore.getState();
    store.confirmTac(caseId);
  }
}
