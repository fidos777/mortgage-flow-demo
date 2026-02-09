/**
 * Hooks Index
 * Sprint 0, Sessions S0.3-S0.5 | PRD v3.6.3
 * Updated: Session 1 - Animation Foundation
 *
 * Exports all custom React hooks.
 */

// Animation (Session 1)
export {
  useAnimationCapability,
  useAnimationToggle,
  useFPSMonitor,
  useAnimateOnScroll,
  useAnimationState,
  type AnimationCapability,
} from './use-animation';

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
