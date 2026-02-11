/**
 * S5 B06: Proof Events API
 *
 * POST /api/proof-events — Log a proof event
 * GET  /api/proof-events — List proof events for a buyer/case
 *
 * Proof events are immutable audit records of every significant action.
 * Replaces Sprint 0's telemetry_events (never created in production).
 *
 * Event types include:
 *   BUYER:   DOC_UPLOADED, DOC_UPLOAD_FAILED, ALL_REQUIRED_DOCS_UPLOADED,
 *            PRESCAN_COMPLETED, TEMUJANJI_BOOKED, TAC_SESSION_BOOKED,
 *            LPPSA_SUBMISSION_CONSENT_GRANTED
 *   AGENT:   CASE_REVIEWED, DOCS_VERIFIED, BYOD_STARTED
 *   CONSENT: CONSENT_GRANTED, CONSENT_REVOKED, CONSENT_CASE_LINKED
 *   SYSTEM:  READINESS_COMPUTED, CASE_CREATED
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Valid event categories
const VALID_CATEGORIES = ['BUYER', 'AGENT', 'SYSTEM', 'CONSENT'] as const;
const VALID_ACTOR_TYPES = ['buyer', 'agent', 'system'] as const;

interface LogEventRequest {
  event_type: string;
  event_category?: string;
  buyer_hash?: string;
  case_id?: string;
  actor_type?: string;
  actor_id?: string;
  metadata?: Record<string, unknown>;
  session_id?: string;
}

/**
 * POST: Log a proof event
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body: LogEventRequest = await request.json();

    // Validate
    if (!body.event_type) {
      return NextResponse.json(
        { error: 'event_type is required' },
        { status: 400 }
      );
    }

    if (!body.buyer_hash && !body.case_id) {
      return NextResponse.json(
        { error: 'buyer_hash or case_id is required' },
        { status: 400 }
      );
    }

    const category = body.event_category || 'BUYER';
    if (!VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
      return NextResponse.json(
        { error: `event_category must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    const actorType = body.actor_type || 'buyer';
    if (!VALID_ACTOR_TYPES.includes(actorType as typeof VALID_ACTOR_TYPES[number])) {
      return NextResponse.json(
        { error: `actor_type must be one of: ${VALID_ACTOR_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Extract client context from headers
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = request.headers.get('user-agent') || null;

    // Use the log_proof_event function from migration 008
    const { data, error } = await supabase.rpc('log_proof_event', {
      p_event_type: body.event_type,
      p_buyer_hash: body.buyer_hash || null,
      p_case_id: body.case_id || null,
      p_actor_type: actorType,
      p_actor_id: body.actor_id || null,
      p_metadata: body.metadata || {},
      p_ip_address: ip,
      p_user_agent: userAgent,
      p_session_id: body.session_id || null,
      p_event_category: category,
    });

    if (error) {
      console.error('[ProofEvents] Log error:', error);
      return NextResponse.json(
        { error: 'Failed to log proof event', detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { proof_event_id: data },
    }, { status: 201 });
  } catch (error) {
    console.error('[ProofEvents] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET: List proof events for a buyer or case
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);

    const buyerHash = searchParams.get('buyer_hash');
    const caseId = searchParams.get('case_id');
    const eventType = searchParams.get('event_type');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!buyerHash && !caseId) {
      return NextResponse.json(
        { error: 'buyer_hash or case_id is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('proof_events')
      .select('id, event_type, event_category, actor_type, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (buyerHash) {
      query = query.eq('buyer_hash', buyerHash);
    }
    if (caseId) {
      query = query.eq('case_id', caseId);
    }
    if (eventType) {
      query = query.eq('event_type', eventType);
    }
    if (category) {
      query = query.eq('event_category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ProofEvents] List error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      meta: { count: data?.length || 0, limit },
    });
  } catch (error) {
    console.error('[ProofEvents] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
