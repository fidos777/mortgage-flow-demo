/**
 * Hooks Index
 * Sprint 0, Sessions S0.3-S0.5 | PRD v3.6.3
 *
 * Exports all custom React hooks.
 */

// Consent Guard (S0.3)
export {
  useConsentGuard,
  useBuyerHash,
  useHasConsent,
  type UseConsentGuardOptions,
  type ConsentGuardState,
} from './useConsentGuard';

// Auth Ledger (S0.4)
export {
  useAuthLedger,
  useAccountLockStatus,
  type UseAuthLedgerReturn,
} from './useAuthLedger';

// Notification (S0.5)
export {
  useNotification,
  useCanSendNotification,
  type UseNotificationReturn,
} from './useNotification';
