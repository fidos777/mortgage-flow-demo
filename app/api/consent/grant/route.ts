/**
 * S5-B03: Consent Grant API
 *
 * POST /api/consent/grant — Grant one or more consent types for a buyer
 *
 * Supports both single-consent and batch-consent (from consent gate form).
 * Wraps the existing ConsentService which handles Supabase upsert +
 * audit logging + proof event dual-write.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConsentService } from '@/lib/services/consent-service';
import { ConsentType, ConsentPurpose, CONSENT_TYPES, CONSENT_PURPOSES } from '@/lib/types/consent';

interface GrantSingleRequest {
  buyer_hash: string;
  consent_type: ConsentType;
  consent_version: string;
  ip_hash?: string;
  user_agent_hash?: string;
  capture_method?: 'WEB_FORM' | 'API' | 'IMPORT';
  expires_at?: string;
}

interface GrantBatchRequest {
  buyer_hash: string;
  consents: { type: ConsentType; granted: boolean }[];
  consent_version: string;
  ip_hash?: string;
  user_agent_hash?: string;
}

interface GrantPurposesRequest {
  buyer_hash: string;
  purposes: ConsentPurpose[];
  consent_version: string;
  ip_hash?: string;
  user_agent_hash?: string;
  capture_method?: 'WEB_FORM' | 'API' | 'IMPORT';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.buyer_hash) {
      return NextResponse.json(
        { error: 'buyer_hash is required' },
        { status: 400 }
      );
    }

    const service = getConsentService();

    // Route: batch grant with purposes (SF.2 preferred path)
    if (body.purposes && Array.isArray(body.purposes)) {
      const input = body as GrantPurposesRequest;

      if (!input.consent_version) {
        return NextResponse.json(
          { error: 'consent_version is required' },
          { status: 400 }
        );
      }

      // Validate purpose codes
      const invalidPurposes = input.purposes.filter(
        (p: string) => !CONSENT_PURPOSES.includes(p as ConsentPurpose)
      );
      if (invalidPurposes.length > 0) {
        return NextResponse.json(
          { error: `Invalid purpose codes: ${invalidPurposes.join(', ')}` },
          { status: 400 }
        );
      }

      const success = await service.grantPurposes(
        input.buyer_hash,
        input.purposes,
        input.consent_version,
        {
          ipHash: input.ip_hash,
          userAgentHash: input.user_agent_hash,
          captureMethod: input.capture_method || 'WEB_FORM',
        }
      );

      return NextResponse.json({
        success,
        mode: 'purposes',
        buyer_hash: input.buyer_hash,
        purposes_granted: input.purposes,
      }, { status: success ? 201 : 500 });
    }

    // Route: batch grant with consent types (legacy path)
    if (body.consents && Array.isArray(body.consents)) {
      const input = body as GrantBatchRequest;

      if (!input.consent_version) {
        return NextResponse.json(
          { error: 'consent_version is required' },
          { status: 400 }
        );
      }

      const records = await service.grantBatchConsents({
        buyerHash: input.buyer_hash,
        consents: input.consents,
        consentVersion: input.consent_version,
        ipHash: input.ip_hash,
        userAgentHash: input.user_agent_hash,
      });

      return NextResponse.json({
        success: true,
        mode: 'batch',
        data: records,
        count: records.length,
      }, { status: 201 });
    }

    // Route: single consent grant
    const input = body as GrantSingleRequest;

    if (!input.consent_type) {
      return NextResponse.json(
        { error: 'consent_type is required (or use consents[] for batch or purposes[] for SF.2)' },
        { status: 400 }
      );
    }

    if (!CONSENT_TYPES.includes(input.consent_type)) {
      return NextResponse.json(
        { error: `Invalid consent_type: ${input.consent_type}` },
        { status: 400 }
      );
    }

    if (!input.consent_version) {
      return NextResponse.json(
        { error: 'consent_version is required' },
        { status: 400 }
      );
    }

    const record = await service.grantConsent({
      buyerHash: input.buyer_hash,
      consentType: input.consent_type,
      consentVersion: input.consent_version,
      ipHash: input.ip_hash,
      userAgentHash: input.user_agent_hash,
      captureMethod: input.capture_method || 'WEB_FORM',
      expiresAt: input.expires_at,
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Failed to grant consent', code: 'GRANT_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mode: 'single',
      data: record,
    }, { status: 201 });
  } catch (error) {
    console.error('Consent grant error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
