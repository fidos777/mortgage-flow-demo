// lib/services/mock/proof-service.ts
// Mock Proof Service - wraps Zustand store for demo mode

import { IProofService } from '../index';
import { ProofEvent, EVENT_CATEGORIES } from '@/types/proof-event';
import { useCaseStore } from '@/lib/store/case-store';

export class MockProofService implements IProofService {
  async getEvents(caseId?: string): Promise<ProofEvent[]> {
    const store = useCaseStore.getState();
    const events = store.proofEvents;
    
    if (caseId) {
      return events.filter(e => e.caseId === caseId);
    }
    
    return events;
  }
  
  async logEvent(eventData: Omit<ProofEvent, 'id' | 'timestamp' | 'authorityClaimed' | 'category'>): Promise<ProofEvent> {
    const store = useCaseStore.getState();
    
    const event: ProofEvent = {
      ...eventData,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      category: EVENT_CATEGORIES[eventData.eventType],
      // PRD Section 24.4: Non-Authority Guarantee - ALWAYS false
      authorityClaimed: false,
    };
    
    store.addProofEvent(event);
    
    return event;
  }
}
