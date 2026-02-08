/**
 * QR Link Service
 * SF.4: QR Entry Mode Wiring | PRD v3.6.3
 *
 * Manages QR code generation and token validation for buyer onboarding.
 * Tokens encode project, developer, and agent information.
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * QR link token payload
 */
export interface QRLinkPayload {
  /** Project ID */
  projectId: string;
  /** Developer ID */
  developerId: string;
  /** Optional agent ID who created the link */
  agentId?: string;
  /** Project name for display */
  projectName: string;
  /** Developer/company name */
  developerName: string;
  /** Created timestamp */
  createdAt: string;
  /** Expiry timestamp (optional) */
  expiresAt?: string;
  /** Campaign/source tracking */
  source?: string;
}

/**
 * QR link validation result
 */
export interface QRLinkValidation {
  isValid: boolean;
  payload: QRLinkPayload | null;
  error?: string;
  errorCode?: 'INVALID_TOKEN' | 'EXPIRED' | 'MALFORMED' | 'UNKNOWN_PROJECT';
}

/**
 * QR link generation options
 */
export interface QRLinkOptions {
  projectId: string;
  developerId: string;
  projectName: string;
  developerName: string;
  agentId?: string;
  expiresInDays?: number;
  source?: string;
}

// =============================================================================
// TOKEN ENCODING/DECODING
// =============================================================================

/**
 * Encode QR link payload to URL-safe token
 * Uses base64url encoding for simplicity
 */
export function encodeQRToken(payload: QRLinkPayload): string {
  try {
    const jsonString = JSON.stringify(payload);
    // Base64 encode and make URL-safe
    const base64 = btoa(jsonString);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch {
    throw new Error('Failed to encode QR token');
  }
}

/**
 * Decode QR link token to payload
 */
export function decodeQRToken(token: string): QRLinkPayload | null {
  try {
    // Restore base64 padding and characters
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonString = atob(base64);
    return JSON.parse(jsonString) as QRLinkPayload;
  } catch {
    return null;
  }
}

// =============================================================================
// QR LINK SERVICE
// =============================================================================

/**
 * Generate a new QR link
 */
export function generateQRLink(options: QRLinkOptions): {
  token: string;
  url: string;
  payload: QRLinkPayload;
} {
  const now = new Date();
  const expiresAt = options.expiresInDays
    ? new Date(now.getTime() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : undefined;

  const payload: QRLinkPayload = {
    projectId: options.projectId,
    developerId: options.developerId,
    projectName: options.projectName,
    developerName: options.developerName,
    agentId: options.agentId,
    createdAt: now.toISOString(),
    expiresAt,
    source: options.source,
  };

  const token = encodeQRToken(payload);

  // Use relative URL - actual domain added at deployment
  const url = `/q/${token}`;

  return { token, url, payload };
}

/**
 * Validate a QR link token
 */
export function validateQRToken(token: string): QRLinkValidation {
  // Decode token
  const payload = decodeQRToken(token);

  if (!payload) {
    return {
      isValid: false,
      payload: null,
      error: 'Token tidak sah. Sila imbas semula kod QR.',
      errorCode: 'MALFORMED',
    };
  }

  // Check required fields
  if (!payload.projectId || !payload.developerId || !payload.projectName) {
    return {
      isValid: false,
      payload: null,
      error: 'Token tidak lengkap. Sila dapatkan pautan QR baharu.',
      errorCode: 'INVALID_TOKEN',
    };
  }

  // Check expiry
  if (payload.expiresAt) {
    const expiryDate = new Date(payload.expiresAt);
    if (expiryDate < new Date()) {
      return {
        isValid: false,
        payload,
        error: 'Pautan QR ini telah tamat tempoh. Sila dapatkan pautan baharu.',
        errorCode: 'EXPIRED',
      };
    }
  }

  return {
    isValid: true,
    payload,
  };
}

/**
 * Build redirect URL from QR payload
 */
export function buildRedirectUrl(
  payload: QRLinkPayload,
  destination: 'start' | 'prescan' = 'start'
): string {
  const params = new URLSearchParams();

  params.set('dev', payload.developerName);
  params.set('project', payload.projectName);
  params.set('pid', payload.projectId);
  params.set('did', payload.developerId);

  if (payload.agentId) {
    params.set('aid', payload.agentId);
  }

  if (payload.source) {
    params.set('src', payload.source);
  }

  // Mark as QR entry for tracking
  params.set('entry', 'qr');

  const basePath = destination === 'start' ? '/buyer/start' : '/buyer/prescan';
  return `${basePath}?${params.toString()}`;
}

// =============================================================================
// DEMO/MOCK DATA
// =============================================================================

/**
 * Demo QR links for testing
 */
export const DEMO_QR_LINKS = {
  // Seri Maya project link
  seriMaya: generateQRLink({
    projectId: 'PROJ-001',
    developerId: 'DEV-GFR-001',
    projectName: 'Seri Maya Residensi',
    developerName: 'Global Fiz Resources Sdn Bhd',
    agentId: 'AGT-001',
    source: 'demo',
  }),

  // Taman Anggerik project link
  tamanAnggerik: generateQRLink({
    projectId: 'PROJ-002',
    developerId: 'DEV-GFR-001',
    projectName: 'Taman Anggerik',
    developerName: 'Global Fiz Resources Sdn Bhd',
    source: 'demo',
  }),

  // Expired link for testing
  expired: generateQRLink({
    projectId: 'PROJ-003',
    developerId: 'DEV-GFR-001',
    projectName: 'Expired Project',
    developerName: 'Global Fiz Resources Sdn Bhd',
    expiresInDays: -1, // Already expired
    source: 'demo',
  }),
};

// =============================================================================
// PROOF EVENT TYPES
// =============================================================================

/**
 * QR-related proof event types
 */
export type QRProofEventType =
  | 'QR_LINK_GENERATED'
  | 'QR_LINK_SCANNED'
  | 'QR_LINK_VALIDATED'
  | 'QR_LINK_EXPIRED'
  | 'QR_LINK_INVALID';

/**
 * Log QR proof event
 * In production, this would write to telemetry_events
 */
export function logQRProofEvent(
  eventType: QRProofEventType,
  metadata: {
    token?: string;
    projectId?: string;
    developerId?: string;
    agentId?: string;
    source?: string;
    error?: string;
    userAgent?: string;
  }
): void {
  // In demo mode, just log to console
  console.log(`[QRLinkService] ${eventType}`, {
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}
