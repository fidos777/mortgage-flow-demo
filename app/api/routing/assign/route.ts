/**
 * CR-007A: Case Assignment API
 *
 * POST /api/routing/assign - Assign a case to an agent (manual or auto)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

interface AssignCaseRequest {
  case_id: string;
  agent_id?: string;         // If provided = manual assignment
  assigned_by?: string;       // Master agent doing the assignment
  priority?: number;          // 1-10, 1 = highest
  notes?: string;
}

/**
 * POST: Assign a case to an agent
 * If agent_id is provided: manual assignment
 * If agent_id is not provided: auto-assignment based on availability
 */
export async function POST(request: NextRequest) {
  try {
    const body: AssignCaseRequest = await request.json();

    // Validate required fields
    if (!body.case_id) {
      return NextResponse.json(
        { error: 'case_id is required' },
        { status: 400 }
      );
    }

    // Check if case exists
    const { data: caseData, error: caseError } = await supabase
      .from('mortgage_cases')
      .select('id, case_ref, developer_id, assigned_agent_id, property_price')
      .eq('id', body.case_id)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json(
        { error: 'Case not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    let assignmentId: string;
    let assignedAgentId: string;

    if (body.agent_id) {
      // Manual assignment
      // Verify agent exists and is available
      const { data: agent, error: agentError } = await supabase
        .from('mortgage_agents')
        .select('id, name, status, max_cases_per_week, current_week_cases')
        .eq('id', body.agent_id)
        .single();

      if (agentError || !agent) {
        return NextResponse.json(
          { error: 'Agent not found', code: 'AGENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      if (agent.status !== 'active') {
        return NextResponse.json(
          { error: 'Agent is not active', code: 'AGENT_INACTIVE' },
          { status: 400 }
        );
      }

      // Check capacity
      if (agent.max_cases_per_week && agent.current_week_cases >= agent.max_cases_per_week) {
        return NextResponse.json(
          { error: 'Agent is at capacity', code: 'AGENT_AT_CAPACITY' },
          { status: 400 }
        );
      }

      // Create manual assignment
      const { data: assignment, error: assignError } = await supabase
        .from('case_assignments')
        .insert({
          case_id: body.case_id,
          agent_id: body.agent_id,
          assigned_by: body.assigned_by || null,
          assignment_type: 'manual',
          status: 'pending',
          priority: body.priority || 5,
          notes: body.notes,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        })
        .select()
        .single();

      if (assignError) {
        console.error('Assignment error:', assignError);
        return NextResponse.json(
          { error: assignError.message, code: 'DB_ERROR' },
          { status: 500 }
        );
      }

      assignmentId = assignment.id;
      assignedAgentId = body.agent_id;

      // Update case
      await supabase
        .from('mortgage_cases')
        .update({
          assigned_agent_id: body.agent_id,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', body.case_id);

      // Increment agent's case count
      await supabase
        .from('mortgage_agents')
        .update({
          current_week_cases: (agent.current_week_cases || 0) + 1,
        })
        .eq('id', body.agent_id);

    } else {
      // Auto-assignment
      const { data: autoResult, error: autoError } = await supabase
        .rpc('auto_assign_case', {
          p_case_id: body.case_id,
          p_assigned_by: body.assigned_by || null,
        });

      if (autoError) {
        console.error('Auto-assign error:', autoError);
        return NextResponse.json(
          { error: autoError.message || 'Auto-assignment failed', code: 'AUTO_ASSIGN_FAILED' },
          { status: 500 }
        );
      }

      assignmentId = autoResult;

      // Get the assignment to return agent info
      const { data: assignment } = await supabase
        .from('case_assignments')
        .select('agent_id')
        .eq('id', assignmentId)
        .single();

      assignedAgentId = assignment?.agent_id;
    }

    // Get full assignment details for response
    const { data: fullAssignment } = await supabase
      .from('case_assignments')
      .select(`
        *,
        agent:mortgage_agents(id, name, phone_display, email),
        assigned_by_agent:mortgage_agents!case_assignments_assigned_by_fkey(id, name)
      `)
      .eq('id', assignmentId)
      .single();

    return NextResponse.json({
      success: true,
      data: fullAssignment,
      message: body.agent_id
        ? `Case manually assigned to agent`
        : `Case auto-assigned to best available agent`,
    }, { status: 201 });
  } catch (error) {
    console.error('Assign case error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
