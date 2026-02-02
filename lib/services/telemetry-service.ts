// lib/services/telemetry-service.ts
// P3-1: Telemetry + Event Capture (MVP)
// Logs funnel events for pilot data collection

import { getServiceMode } from './index';

/**
 * Telemetry Event Types (MVP)
 * Minimal events to track conversion funnel
 */
export type TelemetryEventType =
  | 'LINK_CREATED'
  | 'LINK_OPENED'
  | 'CONSENT_GIVEN'
  | 'DOC_UPLOADED'
  | 'READINESS_CALCULATED'
  | 'QUERY_SIGNALS_DETECTED'
  | 'DRAFT_VIEWED'
  | 'SUBMISSION_ATTESTED';

/**
 * Telemetry Event structure
 * Privacy-safe: No PII, only operational metadata
 */
export interface TelemetryEvent {
  id: string;
  eventType: TelemetryEventType;
  timestamp: string;

  // Context (anonymized)
  caseId?: string;
  projectId?: string;
  role: 'buyer' | 'agent' | 'developer' | 'system';

  // Safe metadata (no PII)
  metadata?: {
    docType?: string;           // e.g., 'IC', 'SLIP_GAJI'
    readinessBand?: string;     // e.g., 'ready', 'caution'
    dsrBand?: string;           // e.g., 'SIHAT', 'SEDERHANA'
    signalCount?: number;       // Query signals count
    loanType?: string;          // e.g., 'Jenis 1', 'Jenis 3'
    [key: string]: unknown;
  };
}

/**
 * Telemetry Service Interface
 */
export interface ITelemetryService {
  logEvent(event: Omit<TelemetryEvent, 'id' | 'timestamp'>): Promise<void>;
  getEvents(options?: { limit?: number; eventType?: TelemetryEventType }): Promise<TelemetryEvent[]>;
  getEventCounts(): Promise<Record<TelemetryEventType, number>>;
}

// =============================================================================
// Mock Implementation (Demo Mode)
// =============================================================================

class MockTelemetryService implements ITelemetryService {
  private events: TelemetryEvent[] = [];

  async logEvent(event: Omit<TelemetryEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: TelemetryEvent = {
      ...event,
      id: `tel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    };

    this.events.push(fullEvent);

    // Console log in demo mode for visibility
    console.log('[Telemetry]', fullEvent.eventType, fullEvent.metadata || '');

    // In demo, also store in localStorage for persistence across refreshes
    try {
      const stored = localStorage.getItem('qontrek_telemetry') || '[]';
      const allEvents = JSON.parse(stored);
      allEvents.push(fullEvent);
      // Keep last 100 events
      if (allEvents.length > 100) {
        allEvents.splice(0, allEvents.length - 100);
      }
      localStorage.setItem('qontrek_telemetry', JSON.stringify(allEvents));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  async getEvents(options?: { limit?: number; eventType?: TelemetryEventType }): Promise<TelemetryEvent[]> {
    // Load from localStorage
    try {
      const stored = localStorage.getItem('qontrek_telemetry') || '[]';
      const allEvents: TelemetryEvent[] = JSON.parse(stored);

      let filtered = allEvents;
      if (options?.eventType) {
        filtered = filtered.filter(e => e.eventType === options.eventType);
      }

      if (options?.limit) {
        filtered = filtered.slice(-options.limit);
      }

      return filtered;
    } catch {
      return this.events;
    }
  }

  async getEventCounts(): Promise<Record<TelemetryEventType, number>> {
    const events = await this.getEvents();
    const counts: Partial<Record<TelemetryEventType, number>> = {};

    for (const event of events) {
      counts[event.eventType] = (counts[event.eventType] || 0) + 1;
    }

    return counts as Record<TelemetryEventType, number>;
  }
}

// =============================================================================
// Supabase Implementation (Production Mode)
// =============================================================================

class SupabaseTelemetryService implements ITelemetryService {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(url: string, key: string) {
    this.supabaseUrl = url;
    this.supabaseKey = key;
  }

  async logEvent(event: Omit<TelemetryEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/telemetry_events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(fullEvent),
      });

      if (!response.ok) {
        console.error('[Telemetry] Failed to log event:', response.statusText);
      }
    } catch (error) {
      console.error('[Telemetry] Error logging event:', error);
    }
  }

  async getEvents(options?: { limit?: number; eventType?: TelemetryEventType }): Promise<TelemetryEvent[]> {
    let url = `${this.supabaseUrl}/rest/v1/telemetry_events?order=timestamp.desc`;

    if (options?.limit) {
      url += `&limit=${options.limit}`;
    }
    if (options?.eventType) {
      url += `&event_type=eq.${options.eventType}`;
    }

    try {
      const response = await fetch(url, {
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
      });

      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      console.error('[Telemetry] Error fetching events:', error);
    }

    return [];
  }

  async getEventCounts(): Promise<Record<TelemetryEventType, number>> {
    // Use Supabase RPC for aggregation in production
    // For now, fall back to fetching all and counting client-side
    const events = await this.getEvents({ limit: 1000 });
    const counts: Partial<Record<TelemetryEventType, number>> = {};

    for (const event of events) {
      counts[event.eventType] = (counts[event.eventType] || 0) + 1;
    }

    return counts as Record<TelemetryEventType, number>;
  }
}

// =============================================================================
// Service Factory
// =============================================================================

let telemetryService: ITelemetryService | null = null;

/**
 * Get Telemetry Service instance
 */
export function getTelemetryService(config?: {
  supabaseUrl?: string;
  supabaseKey?: string;
}): ITelemetryService {
  if (!telemetryService) {
    const mode = getServiceMode();

    if (mode === 'api' && config?.supabaseUrl && config?.supabaseKey) {
      telemetryService = new SupabaseTelemetryService(
        config.supabaseUrl,
        config.supabaseKey
      );
    } else {
      telemetryService = new MockTelemetryService();
    }
  }

  return telemetryService;
}

// =============================================================================
// React Hook for easy telemetry logging
// =============================================================================

/**
 * Hook for logging telemetry events
 * Usage: const { logEvent } = useTelemetry();
 *        logEvent('CONSENT_GIVEN', { caseId: 'C001' });
 */
export function useTelemetry() {
  const service = getTelemetryService();

  const logEvent = async (
    eventType: TelemetryEventType,
    data?: {
      caseId?: string;
      projectId?: string;
      role?: TelemetryEvent['role'];
      metadata?: TelemetryEvent['metadata'];
    }
  ) => {
    await service.logEvent({
      eventType,
      role: data?.role || 'system',
      caseId: data?.caseId,
      projectId: data?.projectId,
      metadata: data?.metadata,
    });
  };

  return { logEvent, getEvents: service.getEvents.bind(service) };
}
