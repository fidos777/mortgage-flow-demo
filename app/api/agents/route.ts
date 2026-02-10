/**
 * CR-004: Mortgage Agents API
 *
 * GET /api/agents - List all agents (with filters)
 * GET /api/agents?id=xxx - Get single agent with metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET: List agents or get single agent
 */
export async function GET(request: NextRequest) {
  // Initialize Supabase client inside handler (not at module level)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  try {
    const { searchParams } = new URL(request.url);

    // Query parameters
    const id = searchParams.get('id');
    const developerId = searchParams.get('developer_id');
    const status = searchParams.get('status');
    const isMaster = searchParams.get('is_master');
    const withMetrics = searchParams.get('with_metrics') === 'true';

    // Single agent query
    if (id) {
      const { data, error } = await supabase
        .from('mortgage_agents')
        .select(`
          *,
          developer:developers(id, company_name, slug)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Agent not found', code: 'NOT_FOUND' },
            { status: 404 }
          );
        }
        console.error('Supabase error:', error);
        return NextResponse.json(
          { error: error.message, code: 'DB_ERROR' },
          { status: 500 }
        );
      }

      // Get contact metrics if requested
      let metrics = null;
      if (withMetrics) {
        const { data: metricsData } = await supabase
          .from('agent_contact_metrics')
          .select('*')
          .eq('agent_id', id)
          .single();
        metrics = metricsData;
      }

      return NextResponse.json({
        success: true,
        data: {
          ...data,
          metrics,
        },
      });
    }

    // List agents query
    let query = supabase
      .from('mortgage_agents')
      .select(`
        id,
        name,
        phone_display,
        email,
        developer_id,
        is_master_agent,
        max_active_cases,
        status,
        total_cases_handled,
        cases_approved,
        avg_response_time_hours,
        rating,
        created_at
      `)
      .order('name', { ascending: true });

    // Apply filters
    if (developerId) {
      query = query.eq('developer_id', developerId);
    }
    if (status) {
      query = query.eq('status', status);
    } else {
      // Default to active only
      query = query.eq('status', 'active');
    }
    if (isMaster === 'true') {
      query = query.eq('is_master_agent', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message, code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      meta: {
        count: data?.length || 0,
      },
    });
  } catch (error) {
    console.error('Agents GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
