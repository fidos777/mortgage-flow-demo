/**
 * CR-007A: Agent Team API
 *
 * GET /api/routing/team - Get team hierarchy for master agents
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET: Get team hierarchy
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
    const masterAgentId = searchParams.get('master_agent_id');
    const developerId = searchParams.get('developer_id');

    if (masterAgentId) {
      // Get specific master agent's team
      const { data: master, error: masterError } = await supabase
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
          total_cases_handled,
          cases_approved,
          rating
        `)
        .eq('id', masterAgentId)
        .single();

      if (masterError || !master) {
        return NextResponse.json(
          { error: 'Master agent not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      // Get team members
      const { data: team, error: teamError } = await supabase
        .from('mortgage_agents')
        .select(`
          id,
          name,
          phone_display,
          email,
          status,
          max_cases_per_week,
          current_week_cases,
          total_cases_handled,
          cases_approved,
          rating,
          auto_assign_enabled
        `)
        .eq('master_agent_id', masterAgentId)
        .order('name');

      if (teamError) {
        console.error('Team query error:', teamError);
        return NextResponse.json(
          { error: teamError.message, code: 'DB_ERROR' },
          { status: 500 }
        );
      }

      // Calculate team stats
      const teamStats = {
        team_size: team?.length || 0,
        active_members: team?.filter(m => m.status === 'active').length || 0,
        total_capacity: team?.reduce((sum, m) => sum + (m.max_cases_per_week || 20), 0) || 0,
        current_load: team?.reduce((sum, m) => sum + (m.current_week_cases || 0), 0) || 0,
        total_cases_handled: team?.reduce((sum, m) => sum + (m.total_cases_handled || 0), 0) || 0,
        total_approved: team?.reduce((sum, m) => sum + (m.cases_approved || 0), 0) || 0,
        avg_rating: team && team.length > 0
          ? Math.round((team.filter(m => m.rating).reduce((sum, m) => sum + (m.rating || 0), 0) /
              team.filter(m => m.rating).length) * 100) / 100
          : null,
      };

      // Add utilization to each team member
      const teamWithUtilization = team?.map(member => ({
        ...member,
        available_slots: (member.max_cases_per_week || 20) - (member.current_week_cases || 0),
        utilization_pct: member.max_cases_per_week
          ? Math.round(((member.current_week_cases || 0) / member.max_cases_per_week) * 100)
          : 0,
      }));

      return NextResponse.json({
        success: true,
        data: {
          master_agent: master,
          team: teamWithUtilization,
          stats: teamStats,
        },
      });
    }

    // Get all teams (for admin view)
    let teamsQuery = supabase
      .from('agent_teams')
      .select('*');

    if (developerId) {
      teamsQuery = teamsQuery.eq('developer_id', developerId);
    }

    const { data: teams, error: teamsError } = await teamsQuery;

    if (teamsError) {
      console.error('Teams query error:', teamsError);
      return NextResponse.json(
        { error: teamsError.message, code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: teams,
      meta: {
        count: teams?.length || 0,
      },
    });
  } catch (error) {
    console.error('Team GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
