/**
 * CR-007A: Case Assignments List API
 *
 * GET /api/routing/assignments - List case assignments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET: List case assignments with filters
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
    const agentId = searchParams.get('agent_id');
    const assignedBy = searchParams.get('assigned_by');
    const caseId = searchParams.get('case_id');
    const status = searchParams.get('status');
    const assignmentType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('case_assignments')
      .select(`
        *,
        case:mortgage_cases(id, case_ref, buyer_name, property_price, status),
        agent:mortgage_agents(id, name, phone_display, email, is_master_agent),
        assigned_by_agent:mortgage_agents!case_assignments_assigned_by_fkey(id, name)
      `)
      .order('assigned_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (agentId) {
      query = query.eq('agent_id', agentId);
    }
    if (assignedBy) {
      query = query.eq('assigned_by', assignedBy);
    }
    if (caseId) {
      query = query.eq('case_id', caseId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (assignmentType) {
      query = query.eq('assignment_type', assignmentType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message, code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = {
      total: data?.length || 0,
      pending: data?.filter(a => a.status === 'pending').length || 0,
      accepted: data?.filter(a => a.status === 'accepted').length || 0,
      rejected: data?.filter(a => a.status === 'rejected').length || 0,
      completed: data?.filter(a => a.status === 'completed').length || 0,
      auto_assigned: data?.filter(a => a.assignment_type === 'auto').length || 0,
      manual_assigned: data?.filter(a => a.assignment_type === 'manual').length || 0,
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
    console.error('Assignments GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
