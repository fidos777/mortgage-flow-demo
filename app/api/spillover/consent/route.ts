/**
 * CR-009C: Spillover Consent API
 *
 * POST /api/spillover/consent - Create spillover consent when buyer is ineligible
 * GET /api/spillover/consent - List spillover consents (filtered by developer/status)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type RejectionReason = 'dsr_exceeded' | 'income_insufficient' | 'credit_score_low' | 'age_restriction' | 'property_sold' | 'other';
type ConsentStatus = 'pending' | 'consented' | 'declined' | 'matched' | 'contacted' | 'converted' | 'expired';

interface CreateConsentRequest {
  case_id: string;
  buyer_name: string;
  buyer_phone?: string;
  buyer_email?: string;
  original_property_id?: string;
  original_developer_id: string;
  rejection_reason: RejectionReason;
  rejection_details?: Record<string, unknown>;
  matching_criteria: {
    price_min?: number;
    price_max?: number;
    preferred_states?: string[];
    preferred_cities?: string[];
    property_types?: string[];
    max_dsr?: number;
    income_bracket?: string;
  };
  expires_in_days?: number;
}

interface UpdateConsentRequest {
  consent_given: boolean;
  declined_reason?: string;
}

/**
 * GET: List spillover consents
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
    const status = searchParams.get('status');
    const caseId = searchParams.get('case_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('spillover_consents')
      .select(`
        *,
        original_property:properties!spillover_consents_original_property_id_fkey(id, name, slug),
        original_developer:developers!spillover_consents_original_developer_id_fkey(id, company_name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (developerId) {
      query = query.eq('original_developer_id', developerId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (caseId) {
      query = query.eq('case_id', caseId);
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
      consented: data?.filter(c => c.consent_given === true).length || 0,
      declined: data?.filter(c => c.consent_given === false).length || 0,
      pending: data?.filter(c => c.status === 'pending').length || 0,
      converted: data?.filter(c => c.status === 'converted').length || 0,
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
    console.error('Spillover consent GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new spillover consent request
 * Called when buyer is deemed ineligible for Category A property
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const body: CreateConsentRequest = await request.json();

    // Validate required fields
    if (!body.case_id) {
      return NextResponse.json(
        { error: 'case_id is required' },
        { status: 400 }
      );
    }
    if (!body.buyer_name) {
      return NextResponse.json(
        { error: 'buyer_name is required' },
        { status: 400 }
      );
    }
    if (!body.original_developer_id) {
      return NextResponse.json(
        { error: 'original_developer_id is required' },
        { status: 400 }
      );
    }
    if (!body.rejection_reason) {
      return NextResponse.json(
        { error: 'rejection_reason is required' },
        { status: 400 }
      );
    }
    if (!body.matching_criteria || Object.keys(body.matching_criteria).length === 0) {
      return NextResponse.json(
        { error: 'matching_criteria is required with at least one criterion' },
        { status: 400 }
      );
    }

    // Calculate expiry (default 30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (body.expires_in_days || 30));

    // Get client IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const sourceIp = forwardedFor ? forwardedFor.split(',')[0].trim() : null;

    // Insert consent request (status = pending until buyer decides)
    const { data, error } = await supabase
      .from('spillover_consents')
      .insert({
        case_id: body.case_id,
        buyer_name: body.buyer_name,
        buyer_phone: body.buyer_phone,
        buyer_email: body.buyer_email,
        original_property_id: body.original_property_id || null,
        original_developer_id: body.original_developer_id,
        rejection_reason: body.rejection_reason,
        rejection_details: body.rejection_details || {},
        matching_criteria: body.matching_criteria,
        consent_given: false, // Will be updated when buyer responds
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);

      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Invalid case_id, property_id, or developer_id', code: 'INVALID_REFERENCE' },
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
      message: 'Spillover consent request created. Awaiting buyer decision.',
    }, { status: 201 });
  } catch (error) {
    console.error('Spillover consent POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
