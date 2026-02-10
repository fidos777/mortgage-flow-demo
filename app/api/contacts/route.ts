/**
 * CR-004: Contact Attempts API
 *
 * GET /api/contacts - List contact attempts (with filters)
 * POST /api/contacts - Log a new contact attempt (WhatsApp CTA click)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type ContactType = 'whatsapp' | 'call' | 'sms' | 'email';
type ContactDirection = 'outbound' | 'inbound';
type ContactStatus = 'initiated' | 'opened' | 'responded' | 'no_response' | 'failed';

interface LogContactRequest {
  case_id: string;
  agent_id: string;
  contact_type: ContactType;
  contact_direction?: ContactDirection;
  whatsapp_number?: string;
  whatsapp_message_template?: string;
  deep_link_url?: string;
  source_page?: string;
  notes?: string;
}

/**
 * GET: List contact attempts with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Query parameters
    const caseId = searchParams.get('case_id');
    const agentId = searchParams.get('agent_id');
    const contactType = searchParams.get('contact_type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('contact_attempts')
      .select(`
        *,
        agent:mortgage_agents(id, name, phone_display)
      `)
      .order('initiated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (caseId) {
      query = query.eq('case_id', caseId);
    }
    if (agentId) {
      query = query.eq('agent_id', agentId);
    }
    if (contactType) {
      query = query.eq('contact_type', contactType);
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

    // Calculate summary stats
    const stats = {
      total: data?.length || 0,
      initiated: data?.filter(c => c.status === 'initiated').length || 0,
      responded: data?.filter(c => c.status === 'responded').length || 0,
      no_response: data?.filter(c => c.status === 'no_response').length || 0,
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
    console.error('Contacts GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST: Log a new contact attempt
 */
export async function POST(request: NextRequest) {
  try {
    const body: LogContactRequest = await request.json();

    // Validate required fields
    if (!body.case_id) {
      return NextResponse.json(
        { error: 'case_id is required' },
        { status: 400 }
      );
    }
    if (!body.agent_id) {
      return NextResponse.json(
        { error: 'agent_id is required' },
        { status: 400 }
      );
    }
    if (!body.contact_type) {
      return NextResponse.json(
        { error: 'contact_type is required' },
        { status: 400 }
      );
    }

    // Get client info from headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const userAgent = request.headers.get('user-agent');
    const sourceIp = forwardedFor ? forwardedFor.split(',')[0].trim() : null;

    // Insert contact attempt
    const { data, error } = await supabase
      .from('contact_attempts')
      .insert({
        case_id: body.case_id,
        agent_id: body.agent_id,
        contact_type: body.contact_type,
        contact_direction: body.contact_direction || 'outbound',
        whatsapp_number: body.whatsapp_number,
        whatsapp_message_template: body.whatsapp_message_template,
        deep_link_url: body.deep_link_url,
        source_page: body.source_page,
        source_ip: sourceIp,
        user_agent: userAgent,
        notes: body.notes,
        status: 'initiated',
        clicked_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);

      // Handle foreign key violations
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Invalid case_id or agent_id', code: 'INVALID_REFERENCE' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message, code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    }, { status: 201 });
  } catch (error) {
    console.error('Contacts POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
