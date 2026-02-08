'use client';

/**
 * Auth Ledger Hook
 * Sprint 0, Session S0.4 | PRD v3.6.3 CR-010B
 *
 * React hook for auth event logging and account status checking.
 *
 * Usage:
 * ```tsx
 * const { logLogin, logLogout, isLocked, checkAccountStatus } = useAuthLedger();
 * ```
 */

import { useState, useCallback } from 'react';
import { getAuthLedgerService } from '@/lib/services/auth-ledger';
import {
  AuthEvent,
  AuthEventType,
  AuthProvider,
  AuthHistoryOptions,
  ActiveSession,
  FailedLoginAttempt,
} from '@/lib/types/auth-ledger';

// =============================================================================
// TYPES
// =============================================================================

export interface UseAuthLedgerReturn {
  /** Log a successful login */
  logLoginSuccess: (
    developerId: string,
    sessionId: string,
    options?: {
      authProvider?: AuthProvider;
      ipHash?: string;
      userAgentHash?: string;
      geoRegion?: string;
    }
  ) => Promise<AuthEvent | null>;

  /** Log a failed login attempt */
  logLoginFailed: (
    developerId: string,
    failureReason: string,
    options?: {
      authProvider?: AuthProvider;
      ipHash?: string;
      userAgentHash?: string;
    }
  ) => Promise<AuthEvent | null>;

  /** Log a logout event */
  logLogout: (
    developerId: string,
    sessionId: string,
    ipHash?: string
  ) => Promise<AuthEvent | null>;

  /** Log a session refresh */
  logSessionRefresh: (
    developerId: string,
    sessionId: string,
    ipHash?: string
  ) => Promise<AuthEvent | null>;

  /** Log MFA event */
  logMfaEvent: (
    developerId: string,
    eventType: 'MFA_CHALLENGE' | 'MFA_SUCCESS' | 'MFA_FAILED',
    mfaMethod: string,
    options?: {
      sessionId?: string;
      ipHash?: string;
      failureReason?: string;
    }
  ) => Promise<AuthEvent | null>;

  /** Check if account is locked */
  checkAccountLocked: (developerId: string) => Promise<boolean>;

  /** Unlock account (admin) */
  unlockAccount: (
    developerId: string,
    adminId: string,
    reason?: string
  ) => Promise<AuthEvent | null>;

  /** Get auth history */
  getAuthHistory: (options: AuthHistoryOptions) => Promise<AuthEvent[]>;

  /** Get active sessions */
  getActiveSessions: (developerId: string) => Promise<ActiveSession[]>;

  /** Get failed login attempts (security monitoring) */
  getFailedLoginAttempts: () => Promise<FailedLoginAttempt[]>;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useAuthLedger(): UseAuthLedgerReturn {
  const service = getAuthLedgerService();

  const logLoginSuccess = useCallback(
    async (
      developerId: string,
      sessionId: string,
      options?: {
        authProvider?: AuthProvider;
        ipHash?: string;
        userAgentHash?: string;
        geoRegion?: string;
      }
    ) => {
      return service.logLoginSuccess(developerId, sessionId, options);
    },
    [service]
  );

  const logLoginFailed = useCallback(
    async (
      developerId: string,
      failureReason: string,
      options?: {
        authProvider?: AuthProvider;
        ipHash?: string;
        userAgentHash?: string;
      }
    ) => {
      return service.logLoginFailed(developerId, failureReason, options);
    },
    [service]
  );

  const logLogout = useCallback(
    async (developerId: string, sessionId: string, ipHash?: string) => {
      return service.logLogout(developerId, sessionId, { ipHash });
    },
    [service]
  );

  const logSessionRefresh = useCallback(
    async (developerId: string, sessionId: string, ipHash?: string) => {
      return service.logSessionRefresh(developerId, sessionId, { ipHash });
    },
    [service]
  );

  const logMfaEvent = useCallback(
    async (
      developerId: string,
      eventType: 'MFA_CHALLENGE' | 'MFA_SUCCESS' | 'MFA_FAILED',
      mfaMethod: string,
      options?: {
        sessionId?: string;
        ipHash?: string;
        failureReason?: string;
      }
    ) => {
      return service.logMfaEvent(developerId, eventType, mfaMethod, options);
    },
    [service]
  );

  const checkAccountLocked = useCallback(
    async (developerId: string) => {
      return service.isAccountLocked(developerId);
    },
    [service]
  );

  const unlockAccount = useCallback(
    async (developerId: string, adminId: string, reason?: string) => {
      return service.unlockAccount(developerId, adminId, reason);
    },
    [service]
  );

  const getAuthHistory = useCallback(
    async (options: AuthHistoryOptions) => {
      return service.getAuthHistory(options);
    },
    [service]
  );

  const getActiveSessions = useCallback(
    async (developerId: string) => {
      return service.getActiveSessions(developerId);
    },
    [service]
  );

  const getFailedLoginAttempts = useCallback(async () => {
    return service.getFailedLoginAttempts();
  }, [service]);

  return {
    logLoginSuccess,
    logLoginFailed,
    logLogout,
    logSessionRefresh,
    logMfaEvent,
    checkAccountLocked,
    unlockAccount,
    getAuthHistory,
    getActiveSessions,
    getFailedLoginAttempts,
  };
}

// =============================================================================
// SIMPLE ACCOUNT STATUS HOOK
// =============================================================================

/**
 * Simple hook to check account lock status
 */
export function useAccountLockStatus(developerId: string | null) {
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const service = getAuthLedgerService();

  const checkStatus = useCallback(async () => {
    if (!developerId) {
      setIsLocked(null);
      return;
    }

    setIsChecking(true);
    try {
      const locked = await service.isAccountLocked(developerId);
      setIsLocked(locked);
    } catch (error) {
      console.error('[useAccountLockStatus] Error checking status:', error);
      setIsLocked(false);
    } finally {
      setIsChecking(false);
    }
  }, [developerId, service]);

  return { isLocked, isChecking, checkStatus };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useAuthLedger;
