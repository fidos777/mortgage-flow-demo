'use client';

/**
 * Notification Hook
 * Sprint 0, Session S0.5 | PRD v3.6.3 CR-011
 *
 * React hook for consent-aware notification sending.
 *
 * Usage:
 * ```tsx
 * const { send, wouldBeBlocked, getNotifications } = useNotification(buyerHash);
 * ```
 */

import { useState, useCallback } from 'react';
import { getNotificationService, wouldBeBlocked } from '@/lib/services/notification-service';
import {
  Notification,
  NotificationTemplate,
  NotificationChannel,
  NotificationStatus,
  SendNotificationInput,
  SendNotificationResult,
  MessageClass,
  getTemplateClass,
  getRequiredConsent,
} from '@/lib/types/notification';
import { ConsentType } from '@/lib/types/consent';

// =============================================================================
// TYPES
// =============================================================================

export interface UseNotificationReturn {
  /** Send a notification with consent check */
  send: (input: Omit<SendNotificationInput, 'buyerHash'>) => Promise<SendNotificationResult>;

  /** Check if a notification would be blocked */
  checkIfBlocked: (template: NotificationTemplate) => Promise<{
    blocked: boolean;
    reason?: string;
    requiredConsent?: ConsentType;
  }>;

  /** Get notifications for the buyer */
  getNotifications: (options?: {
    limit?: number;
    status?: NotificationStatus;
  }) => Promise<Notification[]>;

  /** Get message class for a template */
  getMessageClass: (template: NotificationTemplate) => MessageClass;

  /** Get required consent for a template */
  getConsentRequired: (template: NotificationTemplate) => ConsentType;

  /** Loading state */
  isLoading: boolean;

  /** Last send result */
  lastResult: SendNotificationResult | null;

  /** Last error */
  error: string | null;
}

export interface UseNotificationOptions {
  /** Auto-retry blocked notifications when consent is granted */
  autoRetryOnConsent?: boolean;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useNotification(
  buyerHash: string,
  options?: UseNotificationOptions
): UseNotificationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<SendNotificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const service = getNotificationService();

  /**
   * Send notification
   */
  const send = useCallback(
    async (input: Omit<SendNotificationInput, 'buyerHash'>): Promise<SendNotificationResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await service.send({
          ...input,
          buyerHash,
        });

        setLastResult(result);

        if (!result.success && result.status === 'CONSENT_BLOCKED') {
          setError(`Notification blocked: Missing ${result.consentMissing} consent`);
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        return {
          success: false,
          notificationId: null,
          status: 'FAILED',
          blockedReason: errorMsg,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [buyerHash, service]
  );

  /**
   * Check if notification would be blocked
   */
  const checkIfBlocked = useCallback(
    async (template: NotificationTemplate) => {
      const result = await wouldBeBlocked(buyerHash, template);
      const messageClass = getTemplateClass(template);
      const requiredConsent = getRequiredConsent(messageClass);

      return {
        ...result,
        requiredConsent: result.blocked ? requiredConsent : undefined,
      };
    },
    [buyerHash]
  );

  /**
   * Get notifications for buyer
   */
  const getNotifications = useCallback(
    async (queryOptions?: { limit?: number; status?: NotificationStatus }) => {
      return service.getNotificationsForBuyer(buyerHash, queryOptions);
    },
    [buyerHash, service]
  );

  /**
   * Get message class for template
   */
  const getMessageClass = useCallback((template: NotificationTemplate): MessageClass => {
    return getTemplateClass(template);
  }, []);

  /**
   * Get required consent for template
   */
  const getConsentRequired = useCallback((template: NotificationTemplate): ConsentType => {
    const messageClass = getTemplateClass(template);
    return getRequiredConsent(messageClass);
  }, []);

  return {
    send,
    checkIfBlocked,
    getNotifications,
    getMessageClass,
    getConsentRequired,
    isLoading,
    lastResult,
    error,
  };
}

// =============================================================================
// CONVENIENCE HOOKS
// =============================================================================

/**
 * Simple hook to check if notification can be sent
 */
export function useCanSendNotification(
  buyerHash: string | null,
  template: NotificationTemplate
): { canSend: boolean | null; checking: boolean; missingConsent?: ConsentType } {
  const [canSend, setCanSend] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [missingConsent, setMissingConsent] = useState<ConsentType | undefined>();

  const check = useCallback(async () => {
    if (!buyerHash) {
      setCanSend(null);
      return;
    }

    setChecking(true);
    try {
      const result = await wouldBeBlocked(buyerHash, template);
      setCanSend(!result.blocked);
      if (result.blocked) {
        const messageClass = getTemplateClass(template);
        setMissingConsent(getRequiredConsent(messageClass));
      } else {
        setMissingConsent(undefined);
      }
    } finally {
      setChecking(false);
    }
  }, [buyerHash, template]);

  // Run check on mount/change
  useState(() => {
    check();
  });

  return { canSend, checking, missingConsent };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useNotification;
