/**
 * Auth Ledger Service
 * Sprint 0, Session S0.4 | PRD v3.6.3 CR-010B
 *
 * Manages developer authentication event logging and tracking.
 * Integrates with PDPA consent system for audit compliance.
 *
 * Key Responsibilities:
 * - Log authentication events (login, logout, MFA, etc.)
 * - Track active sessions
 * - Detect anomalous login patterns
 * - Check account lock status
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getServiceMode } from './index';
import {
  AuthEvent,
  AuthEventType,
  AuthProvider,
  AuthLedgerRow,
  LogAuthEventInput,
  AuthHistoryOptions,
  ActiveSession,
  FailedLoginAttempt,
  toAuthEvent,
  toAuthLedgerInput,
  FAILURE_REASONS,
} from '../types/auth-ledger';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Account lock settings
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_WINDOW_MINUTES = 15;
const AUTO_UNLOCK_MINUTES = 30;

// =============================================================================
// AUTH LEDGER SERVICE CLASS
// =============================================================================

export class AuthLedgerService {
  private supabase: SupabaseClient | null = null;
  private mockEvents: AuthEvent[] = [];
  private mockSessions: Map<string, ActiveSession> = new Map();

  constructor() {
    // Initialize Supabase if credentials available
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    }
  }

  // ===========================================================================
  // EVENT LOGGING
  // ===========================================================================

  /**
   * Log an authentication event
   */
  async logEvent(input: LogAuthEventInput): Promise<AuthEvent | null> {
    const mode = getServiceMode();

    if (mode === 'mock' || !this.supabase) {
      return this.mockLogEvent(input);
    }

    const row = toAuthLedgerInput(input);

    const { data, error } = await this.supabase
      .from('developer_auth_ledger')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('[AuthLedger] Error logging event:', error);
      return null;
    }

    const event = toAuthEvent(data as AuthLedgerRow);

    // Check for auto-lock after failed login
    if (input.eventType === 'LOGIN_FAILED') {
      await this.checkAndLockAccount(input.developerId, input.ipHash);
    }

    return event;
  }

  /**
   * Log successful login
   */
  async logLoginSuccess(
    developerId: string,
    sessionId: string,
    options?: {
      authProvider?: AuthProvider;
      ipHash?: string;
      userAgentHash?: string;
      geoRegion?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<AuthEvent | null> {
    return this.logEvent({
      developerId,
      eventType: 'LOGIN_SUCCESS',
      sessionId,
      authProvider: options?.authProvider,
      ipHash: options?.ipHash,
      userAgentHash: options?.userAgentHash,
      geoRegion: options?.geoRegion,
      metadata: options?.metadata,
    });
  }

  /**
   * Log failed login attempt
   */
  async logLoginFailed(
    developerId: string,
    failureReason: string,
    options?: {
      authProvider?: AuthProvider;
      ipHash?: string;
      userAgentHash?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<AuthEvent | null> {
    return this.logEvent({
      developerId,
      eventType: 'LOGIN_FAILED',
      authProvider: options?.authProvider,
      ipHash: options?.ipHash,
      userAgentHash: options?.userAgentHash,
      failureReason,
      metadata: options?.metadata,
    });
  }

  /**
   * Log logout
   */
  async logLogout(
    developerId: string,
    sessionId: string,
    options?: {
      ipHash?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<AuthEvent | null> {
    return this.logEvent({
      developerId,
      eventType: 'LOGOUT',
      sessionId,
      ipHash: options?.ipHash,
      metadata: options?.metadata,
    });
  }

  /**
   * Log session refresh
   */
  async logSessionRefresh(
    developerId: string,
    sessionId: string,
    options?: {
      ipHash?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<AuthEvent | null> {
    return this.logEvent({
      developerId,
      eventType: 'SESSION_REFRESH',
      sessionId,
      ipHash: options?.ipHash,
      metadata: options?.metadata,
    });
  }

  /**
   * Log MFA events
   */
  async logMfaEvent(
    developerId: string,
    eventType: 'MFA_CHALLENGE' | 'MFA_SUCCESS' | 'MFA_FAILED',
    mfaMethod: string,
    options?: {
      sessionId?: string;
      ipHash?: string;
      failureReason?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<AuthEvent | null> {
    return this.logEvent({
      developerId,
      eventType,
      mfaMethod,
      sessionId: options?.sessionId,
      ipHash: options?.ipHash,
      failureReason: options?.failureReason,
      metadata: options?.metadata,
    });
  }

  // ===========================================================================
  // ACCOUNT LOCK MANAGEMENT
  // ===========================================================================

  /**
   * Check if account is locked
   */
  async isAccountLocked(developerId: string): Promise<boolean> {
    const mode = getServiceMode();

    if (mode === 'mock' || !this.supabase) {
      return this.mockIsAccountLocked(developerId);
    }

    const { data, error } = await this.supabase.rpc('is_account_locked', {
      p_developer_id: developerId,
    });

    if (error) {
      console.error('[AuthLedger] Error checking account lock:', error);
      return false;
    }

    return data === true;
  }

  /**
   * Check failed attempts and lock account if threshold exceeded
   */
  async checkAndLockAccount(developerId: string, ipHash?: string): Promise<boolean> {
    const mode = getServiceMode();

    if (mode === 'mock' || !this.supabase) {
      return this.mockCheckAndLockAccount(developerId);
    }

    // Count recent failed attempts
    const windowStart = new Date(Date.now() - LOCK_WINDOW_MINUTES * 60 * 1000).toISOString();

    const { count, error } = await this.supabase
      .from('developer_auth_ledger')
      .select('*', { count: 'exact', head: true })
      .eq('developer_id', developerId)
      .eq('event_type', 'LOGIN_FAILED')
      .gte('event_timestamp', windowStart);

    if (error) {
      console.error('[AuthLedger] Error checking failed attempts:', error);
      return false;
    }

    if ((count || 0) >= MAX_FAILED_ATTEMPTS) {
      // Lock account
      await this.logEvent({
        developerId,
        eventType: 'ACCOUNT_LOCKED',
        ipHash,
        metadata: {
          reason: 'Too many failed login attempts',
          failedCount: count,
          windowMinutes: LOCK_WINDOW_MINUTES,
        },
      });
      return true;
    }

    return false;
  }

  /**
   * Unlock account (admin action)
   */
  async unlockAccount(
    developerId: string,
    adminId: string,
    reason?: string
  ): Promise<AuthEvent | null> {
    return this.logEvent({
      developerId,
      eventType: 'ACCOUNT_UNLOCKED',
      metadata: {
        unlockedBy: adminId,
        reason: reason || 'Manual unlock by admin',
      },
    });
  }

  // ===========================================================================
  // QUERY METHODS
  // ===========================================================================

  /**
   * Get auth history for a developer
   */
  async getAuthHistory(options: AuthHistoryOptions): Promise<AuthEvent[]> {
    const mode = getServiceMode();

    if (mode === 'mock' || !this.supabase) {
      return this.mockGetAuthHistory(options);
    }

    let query = this.supabase
      .from('developer_auth_ledger')
      .select('*')
      .order('event_timestamp', { ascending: false });

    if (options.developerId) {
      query = query.eq('developer_id', options.developerId);
    }

    if (options.eventTypes && options.eventTypes.length > 0) {
      query = query.in('event_type', options.eventTypes);
    }

    if (options.startDate) {
      query = query.gte('event_timestamp', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('event_timestamp', options.endDate);
    }

    if (options.includeAnomalousOnly) {
      query = query.eq('is_anomalous', true);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AuthLedger] Error fetching auth history:', error);
      return [];
    }

    return (data || []).map((row: AuthLedgerRow) => toAuthEvent(row));
  }

  /**
   * Get active sessions for a developer
   */
  async getActiveSessions(developerId: string): Promise<ActiveSession[]> {
    const mode = getServiceMode();

    if (mode === 'mock' || !this.supabase) {
      return this.mockGetActiveSessions(developerId);
    }

    const { data, error } = await this.supabase
      .from('v_active_sessions')
      .select('*')
      .eq('developer_id', developerId);

    if (error) {
      console.error('[AuthLedger] Error fetching active sessions:', error);
      return [];
    }

    return (data || []).map((row) => ({
      developerId: row.developer_id,
      sessionId: row.session_id,
      sessionStart: row.session_start,
      authProvider: row.auth_provider,
      ipHash: row.ip_hash,
      geoRegion: row.geo_region,
      lastActivity: row.last_activity,
    }));
  }

  /**
   * Get failed login attempts (for security monitoring)
   */
  async getFailedLoginAttempts(): Promise<FailedLoginAttempt[]> {
    const mode = getServiceMode();

    if (mode === 'mock' || !this.supabase) {
      return this.mockGetFailedLoginAttempts();
    }

    const { data, error } = await this.supabase
      .from('v_failed_login_attempts')
      .select('*');

    if (error) {
      console.error('[AuthLedger] Error fetching failed attempts:', error);
      return [];
    }

    return (data || []).map((row) => ({
      developerId: row.developer_id,
      developerHash: row.developer_hash,
      ipHash: row.ip_hash,
      attemptCount: row.attempt_count,
      firstAttempt: row.first_attempt,
      lastAttempt: row.last_attempt,
      failureReasons: row.failure_reasons,
    }));
  }

  // ===========================================================================
  // MOCK IMPLEMENTATIONS
  // ===========================================================================

  private mockLogEvent(input: LogAuthEventInput): AuthEvent {
    const now = new Date().toISOString();
    const event: AuthEvent = {
      id: `mock-auth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      developerId: input.developerId,
      developerHash: `hash-${input.developerId}`,
      eventType: input.eventType,
      eventTimestamp: now,
      sessionId: input.sessionId || null,
      sessionStart: input.sessionId ? now : null,
      sessionDurationSeconds: null,
      authProvider: input.authProvider || 'EMAIL_PASSWORD',
      authMethod: input.authMethod || null,
      mfaMethod: input.mfaMethod || null,
      ipHash: input.ipHash || null,
      userAgentHash: input.userAgentHash || null,
      deviceFingerprint: input.deviceFingerprint || null,
      geoRegion: input.geoRegion || 'MY',
      riskScore: 0,
      riskFactors: [],
      isAnomalous: false,
      consentRecordId: input.consentRecordId || null,
      projectId: input.projectId || null,
      caseId: input.caseId || null,
      failureReason: input.failureReason || null,
      metadata: input.metadata || {},
      createdAt: now,
    };

    this.mockEvents.push(event);

    // Track session in mock
    if (input.eventType === 'LOGIN_SUCCESS' && input.sessionId) {
      this.mockSessions.set(input.sessionId, {
        developerId: input.developerId,
        sessionId: input.sessionId,
        sessionStart: now,
        authProvider: input.authProvider || 'EMAIL_PASSWORD',
        ipHash: input.ipHash || null,
        geoRegion: input.geoRegion || 'MY',
        lastActivity: now,
      });
    }

    if (input.eventType === 'LOGOUT' && input.sessionId) {
      this.mockSessions.delete(input.sessionId);
    }

    console.log('[AuthLedger] Mock event logged:', event.eventType, {
      developerId: event.developerId,
      sessionId: event.sessionId,
    });

    return event;
  }

  private mockIsAccountLocked(developerId: string): boolean {
    const windowStart = Date.now() - AUTO_UNLOCK_MINUTES * 60 * 1000;

    // Check for recent lock event without unlock
    const lockEvent = this.mockEvents
      .filter(
        (e) =>
          e.developerId === developerId &&
          e.eventType === 'ACCOUNT_LOCKED' &&
          new Date(e.eventTimestamp).getTime() > windowStart
      )
      .sort((a, b) => new Date(b.eventTimestamp).getTime() - new Date(a.eventTimestamp).getTime())[0];

    if (!lockEvent) return false;

    // Check for unlock after lock
    const unlockEvent = this.mockEvents.find(
      (e) =>
        e.developerId === developerId &&
        e.eventType === 'ACCOUNT_UNLOCKED' &&
        new Date(e.eventTimestamp).getTime() > new Date(lockEvent.eventTimestamp).getTime()
    );

    return !unlockEvent;
  }

  private mockCheckAndLockAccount(developerId: string): boolean {
    const windowStart = Date.now() - LOCK_WINDOW_MINUTES * 60 * 1000;

    const failedCount = this.mockEvents.filter(
      (e) =>
        e.developerId === developerId &&
        e.eventType === 'LOGIN_FAILED' &&
        new Date(e.eventTimestamp).getTime() > windowStart
    ).length;

    if (failedCount >= MAX_FAILED_ATTEMPTS) {
      this.mockLogEvent({
        developerId,
        eventType: 'ACCOUNT_LOCKED',
        metadata: {
          reason: 'Too many failed login attempts',
          failedCount,
        },
      });
      return true;
    }

    return false;
  }

  private mockGetAuthHistory(options: AuthHistoryOptions): AuthEvent[] {
    let events = [...this.mockEvents];

    if (options.developerId) {
      events = events.filter((e) => e.developerId === options.developerId);
    }

    if (options.eventTypes && options.eventTypes.length > 0) {
      events = events.filter((e) => options.eventTypes!.includes(e.eventType));
    }

    if (options.includeAnomalousOnly) {
      events = events.filter((e) => e.isAnomalous);
    }

    events.sort(
      (a, b) => new Date(b.eventTimestamp).getTime() - new Date(a.eventTimestamp).getTime()
    );

    if (options.limit) {
      events = events.slice(0, options.limit);
    }

    return events;
  }

  private mockGetActiveSessions(developerId: string): ActiveSession[] {
    return Array.from(this.mockSessions.values()).filter(
      (s) => s.developerId === developerId
    );
  }

  private mockGetFailedLoginAttempts(): FailedLoginAttempt[] {
    const windowStart = Date.now() - 24 * 60 * 60 * 1000; // 24 hours

    // Group failed attempts by developer
    const attemptsByDeveloper = new Map<string, AuthEvent[]>();

    this.mockEvents
      .filter(
        (e) =>
          e.eventType === 'LOGIN_FAILED' &&
          new Date(e.eventTimestamp).getTime() > windowStart
      )
      .forEach((e) => {
        const key = e.developerId;
        if (!attemptsByDeveloper.has(key)) {
          attemptsByDeveloper.set(key, []);
        }
        attemptsByDeveloper.get(key)!.push(e);
      });

    // Filter to those with 3+ attempts
    return Array.from(attemptsByDeveloper.entries())
      .filter(([, events]) => events.length >= 3)
      .map(([developerId, events]) => ({
        developerId,
        developerHash: events[0].developerHash || '',
        ipHash: events[0].ipHash || '',
        attemptCount: events.length,
        firstAttempt: events[events.length - 1].eventTimestamp,
        lastAttempt: events[0].eventTimestamp,
        failureReasons: Array.from(new Set(events.map((e) => e.failureReason).filter((r): r is string => r !== null))),
      }));
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let authLedgerInstance: AuthLedgerService | null = null;

export function getAuthLedgerService(): AuthLedgerService {
  if (!authLedgerInstance) {
    authLedgerInstance = new AuthLedgerService();
  }
  return authLedgerInstance;
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick check if account is locked
 */
export async function isAccountLocked(developerId: string): Promise<boolean> {
  return getAuthLedgerService().isAccountLocked(developerId);
}

/**
 * Log a login event (success or failure)
 */
export async function logLogin(
  developerId: string,
  success: boolean,
  options?: {
    sessionId?: string;
    authProvider?: AuthProvider;
    ipHash?: string;
    userAgentHash?: string;
    failureReason?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<AuthEvent | null> {
  const service = getAuthLedgerService();

  if (success) {
    return service.logLoginSuccess(developerId, options?.sessionId || `session-${Date.now()}`, {
      authProvider: options?.authProvider,
      ipHash: options?.ipHash,
      userAgentHash: options?.userAgentHash,
      metadata: options?.metadata,
    });
  } else {
    return service.logLoginFailed(
      developerId,
      options?.failureReason || FAILURE_REASONS.INVALID_CREDENTIALS,
      {
        authProvider: options?.authProvider,
        ipHash: options?.ipHash,
        userAgentHash: options?.userAgentHash,
        metadata: options?.metadata,
      }
    );
  }
}

/**
 * Log logout event
 */
export async function logLogout(
  developerId: string,
  sessionId: string,
  ipHash?: string
): Promise<AuthEvent | null> {
  return getAuthLedgerService().logLogout(developerId, sessionId, { ipHash });
}
