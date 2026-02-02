// lib/services/hooks.ts
// React hooks that wrap the service layer
// These hooks abstract away whether we're using mock or API providers

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Case, CasePhase, Document, TacSchedule } from '@/types/case';
import { ProofEvent, ProofEventType, EVENT_CATEGORIES } from '@/types/proof-event';
import { Role } from '@/types/stakeholder';
import { useCaseStore } from '@/lib/store/case-store';
import { getServiceMode } from './index';
import { getTelemetryService, TelemetryEventType } from './telemetry-service';

/**
 * Hook to get current service mode
 * Useful for conditional UI (e.g., showing "Demo Mode" badge)
 */
export function useServiceMode() {
  return getServiceMode();
}

/**
 * Hook for case operations
 * In demo mode, uses Zustand directly
 * In API mode, would use fetch calls
 */
export function useCases(role: Role) {
  const store = useCaseStore();
  const mode = getServiceMode();
  
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function fetchCases() {
      setLoading(true);
      try {
        if (mode === 'mock') {
          // Mock mode: use Zustand store
          const allCases = store.getCasesForRole(role);
          setCases(allCases);
        } else {
          // API mode: would fetch from backend
          // const service = await getCaseService();
          // const data = await service.getCases(role);
          // setCases(data);
          throw new Error('API mode not yet implemented');
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCases();
  }, [role, mode, store]);
  
  return { cases, loading, error, refetch: () => {} };
}

/**
 * Hook for single case operations
 */
export function useCase(caseId: string, role: Role) {
  const store = useCaseStore();
  const mode = getServiceMode();
  
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (mode === 'mock') {
      const data = store.getCaseById(caseId);
      setCaseData(data || null);
      setLoading(false);
    }
  }, [caseId, role, mode, store]);
  
  const updatePhase = useCallback(async (phase: CasePhase) => {
    store.updateCasePhase(caseId, phase);
    setCaseData(store.getCaseById(caseId) || null);
  }, [caseId, store]);
  
  const scheduleTac = useCallback(async (schedule: TacSchedule) => {
    store.scheduleTac(caseId, schedule);
    setCaseData(store.getCaseById(caseId) || null);
  }, [caseId, store]);
  
  const confirmTac = useCallback(async () => {
    store.confirmTac(caseId);
    setCaseData(store.getCaseById(caseId) || null);
  }, [caseId, store]);
  
  return { caseData, loading, updatePhase, scheduleTac, confirmTac };
}

/**
 * Hook for proof event logging
 * This is the CRITICAL hook that ensures all actions are logged
 */
export function useProofLogger() {
  const store = useCaseStore();
  const mode = getServiceMode();
  
  const logEvent = useCallback(async (params: {
    eventType: ProofEventType;
    actor: 'buyer' | 'agent' | 'developer' | 'system';
    actorId?: string;
    intent: string;
    caseId: string;
    humanConfirmationRequired?: boolean;
    metadata?: Record<string, unknown>;
  }) => {
    const event: ProofEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType: params.eventType,
      category: EVENT_CATEGORIES[params.eventType],
      actor: params.actor,
      actorId: params.actorId,
      intent: params.intent,
      timestamp: new Date().toISOString(),
      caseId: params.caseId,
      // PRD Section 24.4: Non-Authority Guarantee - ALWAYS false
      authorityClaimed: false,
      humanConfirmationRequired: params.humanConfirmationRequired || false,
      metadata: params.metadata,
    };
    
    if (mode === 'mock') {
      store.addProofEvent(event);
    } else {
      // API mode: would POST to backend
      // const service = await getProofService();
      // await service.logEvent(event);
    }

    // P3-1: Also log to telemetry for funnel tracking
    const telemetryMap: Partial<Record<ProofEventType, TelemetryEventType>> = {
      'DOC_UPLOADED': 'DOC_UPLOADED',
      'READINESS_COMPUTED': 'READINESS_CALCULATED',
      'SUBMISSION_CONFIRMED': 'SUBMISSION_ATTESTED',
      'QUERY_SIGNALS_DETECTED': 'QUERY_SIGNALS_DETECTED',
    };

    const telemetryType = telemetryMap[params.eventType];
    if (telemetryType) {
      const telemetry = getTelemetryService();
      telemetry.logEvent({
        eventType: telemetryType,
        role: params.actor,
        caseId: params.caseId,
        metadata: params.metadata as Record<string, unknown>,
      });
    }

    return event;
  }, [mode, store]);
  
  // Convenience methods for common events
  const logDocumentUploaded = useCallback((caseId: string, docType: string, actorId?: string) => {
    return logEvent({
      eventType: 'DOC_UPLOADED',
      actor: 'buyer',
      actorId,
      intent: `Dokumen ${docType} dimuat naik`,
      caseId,
      humanConfirmationRequired: false,
    });
  }, [logEvent]);
  
  const logFieldAcknowledged = useCallback((caseId: string, fieldKey: string, actorId?: string) => {
    return logEvent({
      eventType: 'FIELD_ACKNOWLEDGED',
      actor: 'buyer',
      actorId,
      intent: `Medan ${fieldKey} disahkan oleh pembeli`,
      caseId,
      humanConfirmationRequired: true,
    });
  }, [logEvent]);
  
  const logReadinessComputed = useCallback((caseId: string, band: string) => {
    return logEvent({
      eventType: 'READINESS_COMPUTED',
      actor: 'system',
      intent: `Isyarat kesediaan dijana: ${band.toUpperCase()}`,
      caseId,
      humanConfirmationRequired: false,
      metadata: { band },
    });
  }, [logEvent]);
  
  const logTacScheduled = useCallback((caseId: string, slot: { date: string; time: string }, actorId?: string) => {
    return logEvent({
      eventType: 'PHASE_TRANSITIONED',
      actor: 'agent',
      actorId,
      intent: `TAC dijadualkan: ${slot.date} ${slot.time}`,
      caseId,
      humanConfirmationRequired: true,
      metadata: slot,
    });
  }, [logEvent]);
  
  const logTacConfirmed = useCallback((caseId: string, actorId?: string) => {
    return logEvent({
      eventType: 'TAC_TIMESTAMP_RECORDED',
      actor: 'buyer',
      actorId,
      intent: 'Pengesahan TAC direkod (timestamp sahaja)',
      caseId,
      humanConfirmationRequired: true,
    });
  }, [logEvent]);
  
  const logSubmissionConfirmed = useCallback((caseId: string, actorId?: string) => {
    return logEvent({
      eventType: 'SUBMISSION_CONFIRMED',
      actor: 'agent',
      actorId,
      intent: 'Agent mengesahkan penghantaran ke portal LPPSA',
      caseId,
      humanConfirmationRequired: true,
    });
  }, [logEvent]);
  
  const logPhaseTransitioned = useCallback((caseId: string, fromPhase: string, toPhase: string) => {
    return logEvent({
      eventType: 'PHASE_TRANSITIONED',
      actor: 'system',
      intent: `Fasa bertukar: ${fromPhase} → ${toPhase}`,
      caseId,
      humanConfirmationRequired: false,
      metadata: { fromPhase, toPhase },
    });
  }, [logEvent]);
  
  const logKjStatusReported = useCallback((caseId: string, status: string, actorId?: string) => {
    return logEvent({
      eventType: 'KJ_STATUS_REPORTED',
      actor: 'buyer',
      actorId,
      intent: `Status KJ dilaporkan: ${status}`,
      caseId,
      humanConfirmationRequired: true,
      metadata: { status },
    });
  }, [logEvent]);
  
  return {
    logEvent,
    logDocumentUploaded,
    logFieldAcknowledged,
    logReadinessComputed,
    logTacScheduled,
    logTacConfirmed,
    logSubmissionConfirmed,
    logPhaseTransitioned,
    logKjStatusReported,
  };
}

/**
 * Hook for project aggregates (developer view)
 */
export function useProjectAggregates() {
  const store = useCaseStore();
  const mode = getServiceMode();
  
  const [aggregates, setAggregates] = useState({
    totalCases: 0,
    byStatus: {} as Record<string, number>,
    conversionRate: 0,
  });
  const [projectInfo, setProjectInfo] = useState(store.projectInfo);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (mode === 'mock') {
      setAggregates(store.getAggregatesForDeveloper());
      setProjectInfo(store.projectInfo);
      setLoading(false);
    }
  }, [mode, store]);
  
  return { aggregates, projectInfo, loading };
}

/**
 * Hook for role management
 */
export function useRole() {
  const store = useCaseStore();
  
  return {
    currentRole: store.currentRole,
    setRole: store.setRole,
  };
}
