/**
 * CR-002A: Secure Link Authentication
 * Central export for all auth-related functionality.
 */

// Token Generation
export {
  generateSecureLink,
} from './generate-link';

// Token Validation
export {
  validateToken,
} from './validate-token';
