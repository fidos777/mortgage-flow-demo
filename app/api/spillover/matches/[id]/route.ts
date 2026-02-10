/**
 * CR-009C: Single Spillover Match API
 *
 * GET /api/spillover/matches/[id] - Get match details
 * PUT /api/spillover/matches/[id] - Update match status (contacted, converted, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type MatchStatus = 'pending' | 'queued' | 'contacted' | 'interested' | 'viewing' | 'applied' | 'converted' | 'rejected' | 'expired';

interface UpdateMatchRequest {
  status?: MatchStatus;
  matched_agent_id?: string;
  notes?: string;
  new_case_id?: string; // If converted, link to new mortgage case
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Get single match with full details
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('spillover_matches')
      .select(`
        *,
        consent:spillover_consents(
          id,
          case_id,
          buyer_name,
          buyer_phone,
          buyer_email,
          rejection_reason,
          rejection_details,
          matching_criteria,
          consent_timestamp,
          original_developer:developers!spillover_consents_original_developer_id_fkey(id, company_name)
        ),
        matched_property:properties(
          id, name, slug, property_type, address, city, state, postcode,
          price_min, price_max, cover_image_url, description
        ),
        matched_developer:developers(id, company_name, slug, email, phone),
        matched_agent:mortgage_agents(id, name, phone, phone_display, email),
        new_case:mortgage_cases(id, case_ref, status, property_price, loan_amount_requested)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Match not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message, code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // PRIVACY: Remove original developer details from response
    // Category B should not see which Category A developer the lead came from
    if (data.consent) {
      delete data.consent.original_developer;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Spillover match GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update match status
 * Track progress through the conversion funnel
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body: UpdateMatchRequest = await request.json();

    // Check if match exists
    const { data: existing } = await supabase
      .from('spillover_matches')
      .select('id, status, consent_id, matched_property_id, contacted_at, first_response_at')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Match not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (body.status) {
      updateData['status'] = body.status;

      // Auto-set timestamps based on status
      if (body.status === 'contacted' && !existing.contacted_at) {
        updateData['contacted_at'] = new Date().toISOString();
      }
      if (body.status === 'interested' || body.status === 'viewing' || body.status === 'applied') {
        if (!existing.first_response_at) {
          updateData['first_response_at'] = new Date().toISOString();
        }
      }
      if (body.status === 'converted') {
        updateData['converted_at'] = new Date().toISOString();

        // Calculate commission (1% of property price by default)
        const { data: property } = await supabase
          .from('properties')
          .select('price_min')
          .eq('id', existing.matched_property_id)
          .single();

        if (property) {
          const commissionRate = 0.01; // 1%
          const commissionAmount = (property.price_min || 0) * commissionRate;
          updateData['commission_amount'] = commissionAmount;
          updateData['commission_status'] = 'calculated';
        }
      }
    }

    if (body.matched_agent_id) {
      updateData['matched_agent_id'] = body.matched_agent_id;
    }

    if (body.new_case_id) {
      updateData['new_case_id'] = body.new_case_id;
    }

    const { data, error } = await supabase
      .from('spillover_matches')
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

    // If converted, update consent status too
    if (body.status === 'converted') {
      await supabase
        .from('spillover_consents')
        .update({ status: 'converted' })
        .eq('id', existing.consent_id);
    }

    return NextResponse.json({
      success: true,
      data,
      message: `Match status updated to ${body.status || 'updated'}`,
    });
  } catch (error) {
    console.error('Spillover match PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
