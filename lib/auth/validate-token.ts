/**
 * CR-002A: Token Validation
 *
 * Validates secure link tokens and manages access lifecycle.
 * Handles expiration, max uses, revocation, and audit logging.
 */

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Types
export type DenialReason =
  | 'invalid'      // Token not found
  | 'expired'      // Token expired
  | 'revoked'      // Token manually revoked
  | 'exhausted'    // Max uses reached
  | 'error';       // Database error

export interface ValidationResult {
  isValid: boolean;
  linkId?: string;
  caseId?: string;
  propertyId?: string;
  accessType?: 'buyer' | 'agent' | 'developer';
  scope?: string;
  denialReason?: DenialReason;
}

export interface AccessLogEntry {
  linkId: string;
  ipAddress?: string;
  userAgent?: string;
  referer?: string;
  accessGranted: boolean;
  denialReason?: DenialReason;
}

// Session cookie config
const SESSION_COOKIE_NAME = 'snang_session';
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

/**
 * Validate a secure link token
 */
export async function validateToken(
  token: string,
  options?: {
    ipAddress?: string;
    userAgent?: string;
    referer?: string;
  }
): Promise<ValidationResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  try {
    // Look up the token
    const { data: link, error } = await supabase
      .from('secure_links')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !link) {
      // Log failed attempt
      await logAccessAttempt(supabase, {
        linkId: '', // Unknown
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        referer: options?.referer,
        accessGranted: false,
        denialReason: 'invalid',
      });

      return { isValid: false, denialReason: 'invalid' };
    }

    // Check status
    if (link.status !== 'active') {
      await logAccessAttempt(supabase, {
        linkId: link.id,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        referer: options?.referer,
        accessGranted: false,
        denialReason: link.status as DenialReason,
      });

      return {
        isValid: false,
        linkId: link.id,
        denialReason: link.status as DenialReason,
      };
    }

    // Check expiration
    const expiresAt = new Date(link.expires_at);
    if (expiresAt < new Date()) {
      // Auto-update status
      await supabase
        .from('secure_links')
        .update({ status: 'expired' })
        .eq('id', link.id);

      await logAccessAttempt(supabase, {
        linkId: link.id,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        referer: options?.referer,
        accessGranted: false,
        denialReason: 'expired',
      });

      return {
        isValid: false,
        linkId: link.id,
        denialReason: 'expired',
      };
    }

    // Check max uses
    if (link.max_uses !== null && link.use_count >= link.max_uses) {
      // Auto-update status
      await supabase
        .from('secure_links')
        .update({ status: 'exhausted' })
        .eq('id', link.id);

      await logAccessAttempt(supabase, {
        linkId: link.id,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        referer: options?.referer,
        accessGranted: false,
        denialReason: 'exhausted',
      });

      return {
        isValid: false,
        linkId: link.id,
        denialReason: 'exhausted',
      };
    }

    // Valid! Update access tracking
    const now = new Date().toISOString();
    const updatedIps = link.ip_addresses || [];
    const updatedAgents = link.user_agents || [];

    if (options?.ipAddress && !updatedIps.includes(options.ipAddress)) {
      updatedIps.push(options.ipAddress);
    }
    if (options?.userAgent && !updatedAgents.includes(options.userAgent)) {
      updatedAgents.push(options.userAgent);
    }

    await supabase
      .from('secure_links')
      .update({
        use_count: link.use_count + 1,
        first_accessed_at: link.first_accessed_at || now,
        last_accessed_at: now,
        ip_addresses: updatedIps,
        user_agents: updatedAgents,
      })
      .eq('id', link.id);

    // Log successful access
    await logAccessAttempt(supabase, {
      linkId: link.id,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      referer: options?.referer,
      accessGranted: true,
    });

    return {
      isValid: true,
      linkId: link.id,
      caseId: link.case_id,
      propertyId: link.property_id,
      accessType: link.access_type,
      scope: link.scope,
    };
  } catch (err) {
    console.error('Token validation error:', err);
    return { isValid: false, denialReason: 'error' };
  }
}

/**
 * Log access attempt for audit trail
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logAccessAttempt(
  supabase: any,
  entry: AccessLogEntry
): Promise<void> {
  try {
    // Only log if we have a link ID (skip for truly invalid tokens)
    if (!entry.linkId) return;

    await supabase.from('link_access_log').insert({
      link_id: entry.linkId,
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
      referer: entry.referer || null,
      access_granted: entry.accessGranted,
      denial_reason: entry.denialReason || null,
    });
  } catch (err) {
    // Don't fail validation if logging fails
    console.error('Failed to log access attempt:', err);
  }
}

/**
 * Create a session cookie after successful token validation
 */
export async function createSessionCookie(
  caseId: string,
  linkId: string,
  accessType: string
): Promise<void> {
  const cookieStore = await cookies();

  // Create session payload
  const sessionData = {
    caseId,
    linkId,
    accessType,
    createdAt: Date.now(),
  };

  // Encode as base64 (in production, use proper JWT with signing)
  const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');

  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * Get current session from cookie
 */
export async function getSession(): Promise<{
  caseId: string;
  linkId: string;
  accessType: string;
  createdAt: number;
} | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) return null;

    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
    );

    // Check if session is still valid (24 hours)
    const sessionAge = Date.now() - sessionData.createdAt;
    if (sessionAge > SESSION_COOKIE_MAX_AGE * 1000) {
      return null;
    }

    return sessionData;
  } catch {
    return null;
  }
}

/**
 * Clear session cookie (logout)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Check if user has valid session for a case
 */
export async function hasAccessToCase(caseId: string): Promise<boolean> {
  const session = await getSession();
  return session?.caseId === caseId;
}

/**
 * Get denial reason message in Bahasa Malaysia
 */
export function getDenialMessageBM(reason: DenialReason): string {
  const messages: Record<DenialReason, string> = {
    invalid: 'Pautan tidak sah atau tidak wujud.',
    expired: 'Pautan ini telah tamat tempoh.',
    revoked: 'Pautan ini telah dibatalkan.',
    exhausted: 'Pautan ini telah mencapai had penggunaan maksimum.',
    error: 'Ralat sistem. Sila cuba sebentar lagi.',
  };
  return messages[reason];
}

/**
 * Get denial reason message in English
 */
export function getDenialMessageEN(reason: DenialReason): string {
  const messages: Record<DenialReason, string> = {
    invalid: 'This link is invalid or does not exist.',
    expired: 'This link has expired.',
    revoked: 'This link has been revoked.',
    exhausted: 'This link has reached its maximum usage limit.',
    error: 'System error. Please try again later.',
  };
  return messages[reason];
}
