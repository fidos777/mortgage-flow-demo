/**
 * S5-B03: Consent Check API
 *
 * GET /api/consent/check?buyer_hash=...&type=PDPA_BASIC — Check specific consent
 *
 * Lightweight check used by useConsentGuard for route-level gates.
 * Returns boolean hasConsent + metadata if consent exists.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConsentService } from '@/lib/services/consent-service';
import { ConsentType, CONSENT_TYPES } from '@/lib/types/consent';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const buyerHash = searchParams.get('buyer_hash');
    const consentType = searchParams.get('type') as ConsentType;

    if (!buyerHash) {
      return NextResponse.json(
        { error: 'buyer_hash query parameter is required' },
        { status: 400 }
      );
    }

    if (!consentType || !CONSENT_TYPES.includes(consentType)) {
      return NextResponse.json(
        { error: `Invalid or missing type. Valid: ${CONSENT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const service = getConsentService();
    const result = await service.checkConsent(buyerHash, consentType);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Consent check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
