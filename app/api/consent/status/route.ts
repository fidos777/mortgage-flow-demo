/**
 * S5-B03: Consent Status API
 *
 * GET /api/consent/status?buyer_hash=... — Get buyer's full consent status
 *
 * Returns aggregated consent status from v_buyer_consent_status view.
 * Used by client-side consent guard to check if buyer can proceed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConsentService } from '@/lib/services/consent-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const buyerHash = searchParams.get('buyer_hash');

    if (!buyerHash) {
      return NextResponse.json(
        { error: 'buyer_hash query parameter is required' },
        { status: 400 }
      );
    }

    const service = getConsentService();
    const status = await service.getBuyerConsentStatus(buyerHash);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Consent status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
