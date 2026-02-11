/**
 * S5-B03: Consent Revoke API
 *
 * POST /api/consent/revoke — Revoke a consent type for a buyer
 *
 * PDPA 2010 Section 38: Buyer has the right to withdraw consent.
 * Revocation must be acknowledged and effective immediately.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConsentService } from '@/lib/services/consent-service';
import { ConsentType, CONSENT_TYPES } from '@/lib/types/consent';

interface RevokeRequest {
  buyer_hash: string;
  consent_type: ConsentType;
  reason?: string;
  ip_hash?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RevokeRequest = await request.json();

    if (!body.buyer_hash) {
      return NextResponse.json(
        { error: 'buyer_hash is required' },
        { status: 400 }
      );
    }

    if (!body.consent_type || !CONSENT_TYPES.includes(body.consent_type)) {
      return NextResponse.json(
        { error: `Invalid or missing consent_type. Valid: ${CONSENT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const service = getConsentService();
    const success = await service.revokeConsent({
      buyerHash: body.buyer_hash,
      consentType: body.consent_type,
      reason: body.reason,
      ipHash: body.ip_hash,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to revoke consent', code: 'REVOKE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      buyer_hash: body.buyer_hash,
      consent_type: body.consent_type,
      revoked_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Consent revoke error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
