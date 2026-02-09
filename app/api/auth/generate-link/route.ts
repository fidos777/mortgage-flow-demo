/**
 * CR-002A: Generate Secure Link API
 *
 * POST /api/auth/generate-link
 *
 * Generates a secure tokenized link for buyer portal access.
 * Returns link URL and QR code URL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSecureLink, revokeLink, getLinksForCase } from '@/lib/auth/generate-link';

// Request body types
interface GenerateLinkRequest {
  caseId: string;
  propertyId?: string;
  createdBy: string;
  expiresInDays?: number;
  maxUses?: number | null;
}

interface RevokeLinkRequest {
  linkId: string;
  revokedBy: string;
  reason?: string;
}

/**
 * POST: Generate a new secure link
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateLinkRequest = await request.json();

    // Validate required fields
    if (!body.caseId) {
      return NextResponse.json(
        { error: 'caseId is required' },
        { status: 400 }
      );
    }

    if (!body.createdBy) {
      return NextResponse.json(
        { error: 'createdBy is required' },
        { status: 400 }
      );
    }

    // Generate the link
    const result = await generateSecureLink({
      caseId: body.caseId,
      propertyId: body.propertyId,
      createdBy: body.createdBy,
      expiresInDays: body.expiresInDays || 7,
      maxUses: body.maxUses ?? null,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message, code: result.error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        linkId: result.data.linkId,
        token: result.data.token,
        url: result.data.fullUrl,
        qrUrl: result.data.qrUrl,
        expiresAt: result.data.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Generate link API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET: Get all active links for a case
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json(
        { error: 'caseId query parameter is required' },
        { status: 400 }
      );
    }

    const links = await getLinksForCase(caseId);

    return NextResponse.json({
      success: true,
      data: links.map((link) => ({
        id: link.id,
        url: link.fullUrl,
        expiresAt: link.expiresAt.toISOString(),
        useCount: link.useCount,
        createdAt: link.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get links API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Revoke an existing link
 */
export async function DELETE(request: NextRequest) {
  try {
    const body: RevokeLinkRequest = await request.json();

    if (!body.linkId) {
      return NextResponse.json(
        { error: 'linkId is required' },
        { status: 400 }
      );
    }

    if (!body.revokedBy) {
      return NextResponse.json(
        { error: 'revokedBy is required' },
        { status: 400 }
      );
    }

    const success = await revokeLink(body.linkId, body.revokedBy, body.reason);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to revoke link. It may not exist or is already revoked.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Link revoked successfully',
    });
  } catch (error) {
    console.error('Revoke link API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
