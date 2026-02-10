/**
 * CR-004: Single Contact Attempt API
 *
 * GET /api/contacts/[id] - Get contact attempt by ID
 * PUT /api/contacts/[id] - Update contact status (mark as responded, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type ContactStatus = 'initiated' | 'opened' | 'responded' | 'no_response' | 'failed';

interface UpdateContactRequest {
  status?: ContactStatus;
  responded_at?: string;
  notes?: string;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Get single contact attempt by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { id } = await params;

    const { data, error } = await supabase
      .from('contact_attempts')
      .select(`
        *,
        agent:mortgage_agents(id, name, phone, phone_display, email)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Contact attempt not found', code: 'NOT_FOUND' },
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
    console.error('Contact GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update contact attempt status
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { id } = await params;
    const body: UpdateContactRequest = await request.json();

    // Check if contact exists
    const { data: existing } = await supabase
      .from('contact_attempts')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Contact attempt not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (body.status) {
      updateData['status'] = body.status;

      // Auto-set responded_at if status changes to 'responded'
      if (body.status === 'responded' && !body.responded_at) {
        updateData['responded_at'] = new Date().toISOString();
      }
    }

    if (body.responded_at) {
      updateData['responded_at'] = body.responded_at;
    }

    if (body.notes !== undefined) {
      updateData['notes'] = body.notes;
    }

    const { data, error } = await supabase
      .from('contact_attempts')
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

    // If marked as responded, update agent metrics
    if (body.status === 'responded') {
      // Get agent's current stats
      const { data: agentData } = await supabase
        .from('contact_attempts')
        .select('agent_id, initiated_at, responded_at')
        .eq('agent_id', data.agent_id)
        .eq('status', 'responded');

      if (agentData && agentData.length > 0) {
        // Calculate average response time in hours
        const responseTimes = agentData
          .filter(c => c.responded_at && c.initiated_at)
          .map(c => {
            const initiated = new Date(c.initiated_at).getTime();
            const responded = new Date(c.responded_at).getTime();
            return (responded - initiated) / (1000 * 60 * 60); // hours
          });

        const avgResponseTime = responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : null;

        // Update agent metrics
        await supabase
          .from('mortgage_agents')
          .update({
            avg_response_time_hours: avgResponseTime ? Math.round(avgResponseTime * 100) / 100 : null,
          })
          .eq('id', data.agent_id);
      }
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Contact PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
