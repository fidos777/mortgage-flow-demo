// lib/hooks/useAuthorizationGuard.ts
// SF.1: Developer Authorization Enforcement Hook
// PRD v3.6.3 CR-010B — Blocks restricted actions without valid PDPA authorization

'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  checkAuthorization,
  checkAgentAppointment,
  AuthorizationCheck,
  AgentAppointmentCheck,
} from '@/lib/services/developer-auth-service';

/**
 * Hook result for authorization guard
 */
interface UseAuthorizationGuardResult {
  // Current authorization state
  authStatus: AuthorizationCheck | null;
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;

  // Check functions
  checkDeveloperAuth: (developerId: string) => AuthorizationCheck;
  checkAgentAuth: (developerId: string, agentId: string) => AgentAppointmentCheck;

  // Enforcement wrappers
  withAuthGuard: <T>(
    developerId: string,
    action: () => T
  ) => T | { blocked: true; reason: string };

  // UI helpers
  getBlockedMessage: () => string | null;
  getDaysUntilExpiry: () => number | null;
  isExpiringSoon: () => boolean; // <30 days
}

/**
 * Authorization guard hook for developer features
 * Use this in any component that requires valid PDPA authorization
 *
 * @example
 * ```tsx
 * function QRGeneratorButton({ developerId }) {
 *   const { isAuthorized, withAuthGuard, getBlockedMessage } = useAuthorizationGuard();
 *
 *   const handleGenerate = () => {
 *     const result = withAuthGuard(developerId, () => {
 *       // Generate QR code
 *       return generateQR(developerId);
 *     });
 *
 *     if ('blocked' in result) {
 *       toast.error(result.reason);
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleGenerate} disabled={!isAuthorized}>
 *         Generate QR
 *       </button>
 *       {!isAuthorized && <Alert>{getBlockedMessage()}</Alert>}
 *     </>
 *   );
 * }
 * ```
 */
export function useAuthorizationGuard(
  initialDeveloperId?: string
): UseAuthorizationGuardResult {
  const [authStatus, setAuthStatus] = useState<AuthorizationCheck | null>(
    initialDeveloperId ? checkAuthorization(initialDeveloperId) : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check developer authorization
   */
  const checkDeveloperAuth = useCallback(
    (developerId: string): AuthorizationCheck => {
      setIsLoading(true);
      setError(null);

      try {
        const result = checkAuthorization(developerId);
        setAuthStatus(result);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Ralat semasa semak kebenaran';
        setError(message);
        return {
          has_authorization: false,
          reason: message,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Check agent appointment
   */
  const checkAgentAuth = useCallback(
    (developerId: string, agentId: string): AgentAppointmentCheck => {
      return checkAgentAppointment(developerId, agentId);
    },
    []
  );

  /**
   * Wrap an action with authorization guard
   * Returns blocked result if not authorized, otherwise executes action
   */
  const withAuthGuard = useCallback(
    <T>(
      developerId: string,
      action: () => T
    ): T | { blocked: true; reason: string } => {
      const authResult = checkAuthorization(developerId);
      setAuthStatus(authResult);

      if (!authResult.has_authorization) {
        return {
          blocked: true,
          reason:
            authResult.reason ||
            'Sila lengkapkan Kebenaran PDPA sebelum meneruskan.',
        };
      }

      return action();
    },
    []
  );

  /**
   * Get blocked message for UI display
   */
  const getBlockedMessage = useCallback((): string | null => {
    if (!authStatus) return null;
    if (authStatus.has_authorization) return null;
    return authStatus.reason || 'Kebenaran PDPA diperlukan.';
  }, [authStatus]);

  /**
   * Get days until authorization expires
   */
  const getDaysUntilExpiry = useCallback((): number | null => {
    if (!authStatus?.has_authorization) return null;
    return authStatus.days_until_expiry || null;
  }, [authStatus]);

  /**
   * Check if authorization is expiring soon (<30 days)
   */
  const isExpiringSoon = useCallback((): boolean => {
    const days = getDaysUntilExpiry();
    return days !== null && days <= 30;
  }, [getDaysUntilExpiry]);

  // Computed values
  const isAuthorized = useMemo(
    () => authStatus?.has_authorization ?? false,
    [authStatus]
  );

  return {
    authStatus,
    isAuthorized,
    isLoading,
    error,
    checkDeveloperAuth,
    checkAgentAuth,
    withAuthGuard,
    getBlockedMessage,
    getDaysUntilExpiry,
    isExpiringSoon,
  };
}

// =============================================================================
// ENFORCEMENT CONSTANTS
// =============================================================================

/**
 * Actions that require valid developer authorization
 */
export const PROTECTED_ACTIONS = [
  'GENERATE_QR_LINK',
  'CREATE_INVITATION_LINK',
  'VIEW_AGGREGATE_DASHBOARD',
  'EXPORT_PIPELINE_REPORT',
  'CREATE_PROJECT',
  'ASSIGN_AGENT',
] as const;

export type ProtectedAction = (typeof PROTECTED_ACTIONS)[number];

/**
 * Error messages for blocked actions (BM/EN)
 */
export const BLOCKED_MESSAGES: Record<
  ProtectedAction,
  { bm: string; en: string }
> = {
  GENERATE_QR_LINK: {
    bm: 'Sila lengkapkan Kebenaran PDPA sebelum menjana pautan QR.',
    en: 'Please complete PDPA Authorization before generating QR links.',
  },
  CREATE_INVITATION_LINK: {
    bm: 'Sila lengkapkan Kebenaran PDPA sebelum mencipta pautan jemputan.',
    en: 'Please complete PDPA Authorization before creating invitation links.',
  },
  VIEW_AGGREGATE_DASHBOARD: {
    bm: 'Sila lengkapkan Kebenaran PDPA untuk melihat dashboard.',
    en: 'Please complete PDPA Authorization to view dashboard.',
  },
  EXPORT_PIPELINE_REPORT: {
    bm: 'Sila lengkapkan Kebenaran PDPA sebelum mengeksport laporan.',
    en: 'Please complete PDPA Authorization before exporting reports.',
  },
  CREATE_PROJECT: {
    bm: 'Sila lengkapkan Kebenaran PDPA sebelum mencipta projek.',
    en: 'Please complete PDPA Authorization before creating projects.',
  },
  ASSIGN_AGENT: {
    bm: 'Sila lengkapkan Kebenaran PDPA sebelum melantik ejen.',
    en: 'Please complete PDPA Authorization before assigning agents.',
  },
};

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { AuthorizationCheck, AgentAppointmentCheck };
