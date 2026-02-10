/**
 * CR-007A: Single Assignment API
 *
 * GET /api/routing/assignments/[id] - Get assignment details
 * PUT /api/routing/assignments/[id] - Update assignment (accept/reject/complete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type AssignmentStatus = 'pending' | 'accepted' | 'rejected' | 'reassigned' | 'completed' | 'expired';

interface UpdateAssignmentRequest {
  status?: AssignmentStatus;
  rejection_reason?: string;
  rejection_notes?: string;
  notes?: string;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Get single assignment with full details
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('case_assignments')
      .select(`
        *,
        case:mortgage_cases(
          id, case_ref, buyer_name, buyer_phone, buyer_email,
          property_price, loan_amount_requested, status,
          property:properties(id, name, slug, city, state)
        ),
        agent:mortgage_agents(id, name, phone, phone_display, email, is_master_agent, rating),
        assigned_by_agent:mortgage_agents!case_assignments_assigned_by_fkey(id, name),
        previous_agent:mortgage_agents!case_assignments_previous_agent_id_fkey(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Assignment not found', code: 'NOT_FOUND' },
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
    console.error('Assignment GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update assignment status (accept/reject/complete)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body: UpdateAssignmentRequest = await request.json();

    // Get existing assignment
    const { data: existing, error: existingError } = await supabase
      .from('case_assignments')
      .select('id, status, agent_id, case_id')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        { error: 'Assignment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (body.status) {
      updateData['status'] = body.status;

      // Auto-set timestamps based on status
      if (body.status === 'accepted') {
        updateData['accepted_at'] = new Date().toISOString();
      } else if (body.status === 'rejected') {
        updateData['rejected_at'] = new Date().toISOString();
        updateData['rejection_reason'] = body.rejection_reason || null;
        updateData['rejection_notes'] = body.rejection_notes || null;

        // Decrement agent's case count on rejection
        await supabase
          .from('mortgage_agents')
          .update({
            current_week_cases: supabase.rpc('greatest', { a: 0, b: 'current_week_cases - 1' }),
          })
          .eq('id', existing.agent_id);

        // Actually do the decrement properly
        const { data: agent } = await supabase
          .from('mortgage_agents')
          .select('current_week_cases')
          .eq('id', existing.agent_id)
          .single();

        if (agent) {
          await supabase
            .from('mortgage_agents')
            .update({
              current_week_cases: Math.max(0, (agent.current_week_cases || 0) - 1),
            })
            .eq('id', existing.agent_id);
        }

        // Clear agent from case
        await supabase
          .from('mortgage_cases')
          .update({
            assigned_agent_id: null,
            assigned_at: null,
          })
          .eq('id', existing.case_id);

      } else if (body.status === 'completed') {
        updateData['completed_at'] = new Date().toISOString();

        // Update case status
        await supabase
          .from('mortgage_cases')
          .update({ status: 'completed' })
          .eq('id', existing.case_id);

        // Update agent stats
        await supabase
          .from('mortgage_agents')
          .update({
            total_cases_handled: supabase.rpc('coalesce_add', { field: 'total_cases_handled', add: 1 }),
          })
          .eq('id', existing.agent_id);

        // Increment completed cases properly
        const { data: agent } = await supabase
          .from('mortgage_agents')
          .select('total_cases_handled')
          .eq('id', existing.agent_id)
          .single();

        if (agent) {
          await supabase
            .from('mortgage_agents')
            .update({
              total_cases_handled: (agent.total_cases_handled || 0) + 1,
            })
            .eq('id', existing.agent_id);
        }
      }
    }

    if (body.notes !== undefined) {
      updateData['notes'] = body.notes;
    }

    const { data, error } = await supabase
      .from('case_assignments')
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

    return NextResponse.json({
      success: true,
      data,
      message: `Assignment ${body.status || 'updated'}`,
    });
  } catch (error) {
    console.error('Assignment PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
