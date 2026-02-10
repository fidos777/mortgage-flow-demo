/**
 * CR-009C: Single Spillover Consent API
 *
 * GET /api/spillover/consent/[id] - Get consent details
 * PUT /api/spillover/consent/[id] - Update consent (buyer accepts/declines)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

interface UpdateConsentRequest {
  consent_given: boolean;
  declined_reason?: string;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Get single consent with matches
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('spillover_consents')
      .select(`
        *,
        original_property:properties!spillover_consents_original_property_id_fkey(id, name, slug, city, state),
        original_developer:developers!spillover_consents_original_developer_id_fkey(id, company_name),
        matches:spillover_matches(
          id,
          match_score,
          status,
          contacted_at,
          converted_at,
          commission_amount,
          matched_property:properties(id, name, slug, price_min, price_max, city, state, property_type),
          matched_developer:developers(id, company_name),
          matched_agent:mortgage_agents(id, name, phone_display)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Spillover consent not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message, code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Spillover consent GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update consent decision (buyer accepts or declines)
 * If accepted, triggers matching algorithm
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body: UpdateConsentRequest = await request.json();

    // Validate
    if (body.consent_given === undefined) {
      return NextResponse.json(
        { error: 'consent_given is required' },
        { status: 400 }
      );
    }

    // Check if consent exists and is pending
    const { data: existing } = await supabase
      .from('spillover_consents')
      .select('id, status, expires_at')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Spillover consent not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existing.status !== 'pending') {
      return NextResponse.json(
        { error: 'Consent has already been processed', code: 'ALREADY_PROCESSED' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(existing.expires_at) < new Date()) {
      await supabase
        .from('spillover_consents')
        .update({ status: 'expired' })
        .eq('id', id);

      return NextResponse.json(
        { error: 'Spillover consent has expired', code: 'EXPIRED' },
        { status: 400 }
      );
    }

    // Get client IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const sourceIp = forwardedFor ? forwardedFor.split(',')[0].trim() : null;

    // Update consent
    const updateData: Record<string, unknown> = {
      consent_given: body.consent_given,
      consent_timestamp: new Date().toISOString(),
      consent_ip: sourceIp,
      status: body.consent_given ? 'consented' : 'declined',
    };

    if (!body.consent_given && body.declined_reason) {
      updateData['declined_reason'] = body.declined_reason;
    }

    const { data, error } = await supabase
      .from('spillover_consents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message, code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // If consent given, trigger matching
    let matches = null;
    if (body.consent_given) {
      // Call the matching function
      const { data: matchResults, error: matchError } = await supabase
        .rpc('find_spillover_matches', { p_consent_id: id, p_limit: 5 });

      if (matchError) {
        console.error('Matching error:', matchError);
      } else if (matchResults && matchResults.length > 0) {
        // Insert matches
        const matchInserts = matchResults.map((match: { property_id: string; developer_id: string; match_score: number }, index: number) => ({
          consent_id: id,
          matched_property_id: match.property_id,
          matched_developer_id: match.developer_id,
          match_score: match.match_score,
          priority_rank: index + 1,
          display_order: index + 1,
          status: 'pending',
        }));

        const { data: insertedMatches, error: insertError } = await supabase
          .from('spillover_matches')
          .insert(matchInserts)
          .select();

        if (insertError) {
          console.error('Match insert error:', insertError);
        } else {
          matches = insertedMatches;

          // Update consent status to matched
          await supabase
            .from('spillover_consents')
            .update({ status: 'matched' })
            .eq('id', id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data,
      matches,
      message: body.consent_given
        ? `Consent recorded. ${matches?.length || 0} matching properties found.`
        : 'Consent declined.',
    });
  } catch (error) {
    console.error('Spillover consent PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
