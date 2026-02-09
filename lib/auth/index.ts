/**
 * CR-002A: Secure Link Authentication
 *
 * Central export for all auth-related functionality.
 */

// Token Generation
export {
  generateSecureLink,
  generateToken,
  hashToken,
  buildLinkUrl,
  buildQrUrl,
  generateBatchLinks,
  revokeLink,
  getLinksForCase,
  type GenerateLinkOptions,
  type GeneratedLink,
  type GenerateLinkError,
} from './generate-link';

// Token Validation
export {
  validateToken,
  createSessionCookie,
  getSession,
  clearSession,
  hasAccessToCase,
  getDenialMessageBM,
  getDenialMessageEN,
  type ValidationResult,
  type DenialReason,
} from './validate-token';
