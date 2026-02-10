/**
 * CR-002A: Token Validation API
 *
 * GET /api/auth/validate/[token]
 *
 * Validates a secure link token and returns session data.
 * Use this endpoint for programmatic validation (AJAX/fetch).
 * For redirect-based validation, use /q/[token] instead.
 *
 * Query params:
 * - createSession=true: Also set session cookie on successful validation
 *
 * Response (success):
 * {
 *   valid: true,
 *   session: {
 *     caseId: string,
 *     propertyId?: string,
 *     accessType: 'buyer' | 'agent' | 'developer',
 *     scope?: string,
 *     expiresAt: string (ISO date)
 *   }
 * }
 *
 * Response (failure):
 * {
 *   valid: false,
 *   reason: 'invalid' | 'expired' | 'revoked' | 'exhausted' | 'error',
 *   message: string (localized),
 *   messageEN: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  validateToken,
  createSessionCookie,
  getDenialMessageBM,
  getDenialMessageEN,
} from '@/lib/auth/validate-token';

interface RouteParams {
  params: Promise<{ token: string }>;
}

/**
 * GET: Validate a token and return session info
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(request.url);
    const createSession = searchParams.get('createSession') === 'true';

    // Get request metadata for logging
    const headersList = await headers();
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';
    const referer = headersList.get('referer') || undefined;

    // Validate the token
    const result = await validateToken(token, {
      ipAddress,
      userAgent,
      referer,
    });

    // Return validation result
    if (!result.isValid) {
      const reason = result.denialReason || 'invalid';
      return NextResponse.json(
        {
          valid: false,
          reason,
          message: getDenialMessageBM(reason),
          messageEN: getDenialMessageEN(reason),
        },
        { status: 401 }
      );
    }

    // Create session cookie if requested
    if (createSession && result.caseId && result.linkId && result.accessType) {
      await createSessionCookie(
        result.caseId,
        result.linkId,
        result.accessType
      );
    }

    // Calculate session expiry (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return NextResponse.json({
      valid: true,
      session: {
        caseId: result.caseId,
        propertyId: result.propertyId || null,
        accessType: result.accessType,
        scope: result.scope || null,
        linkId: result.linkId,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Token validation API error:', error);
    return NextResponse.json(
      {
        valid: false,
        reason: 'error',
        message: getDenialMessageBM('error'),
        messageEN: getDenialMessageEN('error'),
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Validate token with additional context
 *
 * Body:
 * {
 *   token: string,
 *   createSession?: boolean,
 *   checkpoint?: string // For OTP checkpoint tracking (future)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, createSession = false, checkpoint } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'token is required' },
        { status: 400 }
      );
    }

    // Get request metadata for logging
    const headersList = await headers();
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';
    const referer = headersList.get('referer') || undefined;

    // Validate the token
    const result = await validateToken(token, {
      ipAddress,
      userAgent,
      referer,
    });

    // Return validation result
    if (!result.isValid) {
      const reason = result.denialReason || 'invalid';
      return NextResponse.json(
        {
          valid: false,
          reason,
          message: getDenialMessageBM(reason),
          messageEN: getDenialMessageEN(reason),
          checkpoint: checkpoint || null,
        },
        { status: 401 }
      );
    }

    // Create session cookie if requested
    if (createSession && result.caseId && result.linkId && result.accessType) {
      await createSessionCookie(
        result.caseId,
        result.linkId,
        result.accessType
      );
    }

    // Calculate session expiry (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return NextResponse.json({
      valid: true,
      session: {
        caseId: result.caseId,
        propertyId: result.propertyId || null,
        accessType: result.accessType,
        scope: result.scope || null,
        linkId: result.linkId,
        expiresAt,
      },
      checkpoint: checkpoint || null,
      // Placeholder for future OTP requirement
      requiresOtp: false,
      otpCheckpoints: ['document_submission', 'consent_signing', 'data_export'],
    });
  } catch (error) {
    console.error('Token validation API error:', error);
    return NextResponse.json(
      {
        valid: false,
        reason: 'error',
        message: getDenialMessageBM('error'),
        messageEN: getDenialMessageEN('error'),
      },
      { status: 500 }
    );
  }
}
