/**
 * CR-007A: Available Agents API
 *
 * GET /api/routing/available - Get agents available for assignment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/**
 * GET: Get available agents sorted by availability
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Query parameters
    const developerId = searchParams.get('developer_id');
    const excludeMaster = searchParams.get('exclude_master') !== 'false';

    // Get available agents using the DB function
    const { data: availableAgents, error: rpcError } = await supabase
      .rpc('get_available_agents', {
        p_developer_id: developerId || null,
        p_price_range: null,
        p_state: null,
      });

    if (rpcError) {
      console.error('RPC error:', rpcError);
      // Fallback to direct query
      let query = supabase
        .from('mortgage_agents')
        .select(`
          id,
          name,
          phone_display,
          email,
          is_master_agent,
          developer_id,
          max_cases_per_week,
          current_week_cases,
          status,
          rating,
          auto_assign_enabled
        `)
        .eq('status', 'active')
        .eq('auto_assign_enabled', true);

      if (excludeMaster) {
        query = query.eq('is_master_agent', false);
      }
      if (developerId) {
        query = query.eq('developer_id', developerId);
      }

      const { data, error } = await query.order('current_week_cases', { ascending: true });

      if (error) {
        return NextResponse.json(
          { error: error.message, code: 'DB_ERROR' },
          { status: 500 }
        );
      }

      // Calculate availability for each agent
      const agentsWithAvailability = data?.map(agent => ({
        ...agent,
        available_slots: (agent.max_cases_per_week || 20) - (agent.current_week_cases || 0),
        utilization_pct: agent.max_cases_per_week
          ? Math.round(((agent.current_week_cases || 0) / agent.max_cases_per_week) * 100)
          : 0,
        availability_score: agent.max_cases_per_week
          ? Math.round((1 - (agent.current_week_cases || 0) / agent.max_cases_per_week) * 100) / 100
          : 1.00,
      }));

      return NextResponse.json({
        success: true,
        data: agentsWithAvailability,
        meta: {
          count: agentsWithAvailability?.length || 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: availableAgents,
      meta: {
        count: availableAgents?.length || 0,
      },
    });
  } catch (error) {
    console.error('Available agents GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
