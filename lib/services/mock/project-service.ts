// lib/services/mock/project-service.ts
// Mock Project Service - provides aggregate data for developer view

import { IProjectService } from '../index';
import { useCaseStore } from '@/lib/store/case-store';

export class MockProjectService implements IProjectService {
  async getAggregates(): Promise<{
    totalCases: number;
    byPhase: Record<string, number>;
    conversionRate: number;
  }> {
    const store = useCaseStore.getState();
    const cases = store.cases;
    
    const byPhase = cases.reduce((acc, c) => {
      acc[c.phase] = (acc[c.phase] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const completed = cases.filter(c => c.phase === 'COMPLETED').length;
    const conversionRate = cases.length > 0 
      ? Math.round((completed / cases.length) * 100)
      : 0;
    
    return {
      totalCases: cases.length,
      byPhase,
      conversionRate,
    };
  }
  
  async getProjectInfo(): Promise<{
    name: string;
    location: string;
    totalUnits: number;
    sold: number;
    loanInProgress: number;
  }> {
    const store = useCaseStore.getState();
    return store.projectInfo;
  }
}
