/**
 * CR-009C: Spillover Matches API
 *
 * GET /api/spillover/matches - List matches for a developer/agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET: List spillover matches
 * Category B developers see their potential leads
 * Agents see their assigned matches
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { searchParams } = new URL(request.url);

    // Query parameters
    const developerId = searchParams.get('developer_id');
    const agentId = searchParams.get('agent_id');
    const consentId = searchParams.get('consent_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('spillover_matches')
      .select(`
        *,
        consent:spillover_consents(
          id,
          buyer_name,
          buyer_phone,
          buyer_email,
          rejection_reason,
          matching_criteria,
          consent_timestamp
        ),
        matched_property:properties(id, name, slug, price_min, price_max, city, state, property_type, cover_image_url),
        matched_developer:developers(id, company_name, slug),
        matched_agent:mortgage_agents(id, name, phone_display, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (developerId) {
      query = query.eq('matched_developer_id', developerId);
    }
    if (agentId) {
      query = query.eq('matched_agent_id', agentId);
    }
    if (consentId) {
      query = query.eq('consent_id', consentId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message, code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // Calculate pipeline stats
    const stats = {
      total: data?.length || 0,
      pending: data?.filter(m => m.status === 'pending').length || 0,
      contacted: data?.filter(m => m.status === 'contacted').length || 0,
      interested: data?.filter(m => m.status === 'interested').length || 0,
      converted: data?.filter(m => m.status === 'converted').length || 0,
      rejected: data?.filter(m => m.status === 'rejected').length || 0,
      total_commission: data?.reduce((sum, m) => sum + (m.commission_amount || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      data,
      meta: {
        stats,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Spillover matches GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
