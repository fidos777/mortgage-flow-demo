/**
 * CR-002A: Secure Link Generation
 *
 * Generates cryptographically secure tokens for buyer portal access.
 * Tokens are URL-safe and stored in Supabase for validation.
 */

import { createClient } from '@supabase/supabase-js';
import { randomBytes, createHash } from 'crypto';

// Types
export interface GenerateLinkOptions {
  caseId: string;
  propertyId?: string;
  createdBy: string;
  expiresInDays?: number;
  maxUses?: number | null;
  accessType?: 'buyer' | 'agent' | 'developer';
  scope?: 'full' | 'view_only' | 'documents_only';
}

export interface GeneratedLink {
  linkId: string;
  token: string;
  fullUrl: string;
  qrUrl: string;
  expiresAt: Date;
}

export interface GenerateLinkError {
  code: 'INVALID_CASE' | 'DB_ERROR' | 'TOKEN_COLLISION' | 'UNAUTHORIZED';
  message: string;
}

// Constants
const TOKEN_LENGTH = 32; // 32 bytes = 64 hex characters
const DEFAULT_EXPIRY_DAYS = 7;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://snang.my';

/**
 * Generate a cryptographically secure token
 */
export function generateToken(): string {
  return randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Generate SHA-256 hash of token for secure storage (optional security layer)
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Build the full secure link URL
 */
export function buildLinkUrl(token: string, baseUrl: string = BASE_URL): string {
  return `${baseUrl}/q/${token}`;
}

/**
 * Build QR code URL using external service
 * Uses QR Server API (free, no auth required)
 */
export function buildQrUrl(linkUrl: string, size: number = 300): string {
  const encodedUrl = encodeURIComponent(linkUrl);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}&format=png&margin=10`;
}

/**
 * Main function: Generate a secure link for a mortgage case
 */
export async function generateSecureLink(
  options: GenerateLinkOptions
): Promise<{ success: true; data: GeneratedLink } | { success: false; error: GenerateLinkError }> {
  const {
    caseId,
    propertyId,
    createdBy,
    expiresInDays = DEFAULT_EXPIRY_DAYS,
    maxUses = null,
    accessType = 'buyer',
    scope = 'full',
  } = options;

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Generate token
  const token = generateToken();
  const tokenHash = hashToken(token);

  // Calculate expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  // Build URLs
  const fullUrl = buildLinkUrl(token);
  const qrUrl = buildQrUrl(fullUrl);

  try {
    // Insert into database
    const { data, error } = await supabase
      .from('secure_links')
      .insert({
        token,
        token_hash: tokenHash,
        case_id: caseId || null,       // null for unit-level QR codes (before case exists)
        property_id: propertyId || null,
        access_type: accessType,
        scope,
        expires_at: expiresAt.toISOString(),
        max_uses: maxUses,
        created_by: createdBy,
        qr_generated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase error:', error);

      // Handle unique constraint violation (token collision - extremely rare)
      if (error.code === '23505') {
        return {
          success: false,
          error: {
            code: 'TOKEN_COLLISION',
            message: 'Token collision occurred. Please retry.',
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: error.message,
        },
      };
    }

    return {
      success: true,
      data: {
        linkId: data.id,
        token,
        fullUrl,
        qrUrl,
        expiresAt,
      },
    };
  } catch (err) {
    console.error('Generate link error:', err);
    return {
      success: false,
      error: {
        code: 'DB_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
    };
  }
}

/**
 * Generate multiple links for batch QR code printing
 */
export async function generateBatchLinks(
  cases: Array<{ caseId: string; propertyId?: string }>,
  createdBy: string,
  options?: Partial<GenerateLinkOptions>
): Promise<{
  success: Array<GeneratedLink>;
  failed: Array<{ caseId: string; error: GenerateLinkError }>;
}> {
  const results = {
    success: [] as GeneratedLink[],
    failed: [] as Array<{ caseId: string; error: GenerateLinkError }>,
  };

  for (const { caseId, propertyId } of cases) {
    const result = await generateSecureLink({
      caseId,
      propertyId,
      createdBy,
      ...options,
    });

    if (result.success === true) {
      results.success.push(result.data);
    } else {
      results.failed.push({ caseId, error: result.error });
    }
  }

  return results;
}

/**
 * Revoke an existing link
 */
export async function revokeLink(
  linkId: string,
  revokedBy: string,
  reason?: string
): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error } = await supabase
    .from('secure_links')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy,
      revoked_reason: reason || null,
    })
    .eq('id', linkId)
    .eq('status', 'active');

  return !error;
}

/**
 * Get all active links for a case
 */
export async function getLinksForCase(caseId: string): Promise<Array<{
  id: string;
  token: string;
  fullUrl: string;
  expiresAt: Date;
  useCount: number;
  createdAt: Date;
}>> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from('secure_links')
    .select('id, token, expires_at, use_count, created_at')
    .eq('case_id', caseId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((link) => ({
    id: link.id,
    token: link.token,
    fullUrl: buildLinkUrl(link.token),
    expiresAt: new Date(link.expires_at),
    useCount: link.use_count,
    createdAt: new Date(link.created_at),
  }));
}
