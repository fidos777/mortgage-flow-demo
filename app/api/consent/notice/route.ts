/**
 * S5-B03: PDPA Notice API
 *
 * GET /api/consent/notice?locale=bm|en — Get current PDPA notice for display
 *
 * Returns the latest active PDPA notice version in the requested locale.
 * Used by the consent gate UI component to display notice text.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConsentService } from '@/lib/services/consent-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = (searchParams.get('locale') as 'bm' | 'en') || 'bm';

    if (locale !== 'bm' && locale !== 'en') {
      return NextResponse.json(
        { error: 'locale must be bm or en' },
        { status: 400 }
      );
    }

    const service = getConsentService();
    const notice = await service.getNoticeForDisplay(locale);

    if (!notice) {
      return NextResponse.json(
        { error: 'No active PDPA notice version found', code: 'NO_NOTICE' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notice,
    });
  } catch (error) {
    console.error('Consent notice error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
