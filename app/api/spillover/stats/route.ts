/**
 * CR-009C: Spillover Stats API
 *
 * GET /api/spillover/stats - Get spillover pipeline statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/**
 * GET: Get spillover statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Query parameters
    const developerId = searchParams.get('developer_id');
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, all

    // Calculate date range
    let startDate: Date | null = null;
    if (period !== 'all') {
      startDate = new Date();
      const days = parseInt(period.replace('d', ''));
      startDate.setDate(startDate.getDate() - days);
    }

    // Get consent stats
    let consentQuery = supabase
      .from('spillover_consents')
      .select('id, consent_given, status, rejection_reason, created_at');

    if (developerId) {
      consentQuery = consentQuery.eq('original_developer_id', developerId);
    }
    if (startDate) {
      consentQuery = consentQuery.gte('created_at', startDate.toISOString());
    }

    const { data: consents, error: consentError } = await consentQuery;

    if (consentError) {
      console.error('Consent query error:', consentError);
      return NextResponse.json(
        { error: consentError.message, code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // Get match stats
    let matchQuery = supabase
      .from('spillover_matches')
      .select('id, status, match_score, commission_amount, commission_status, created_at, converted_at');

    if (developerId) {
      matchQuery = matchQuery.eq('matched_developer_id', developerId);
    }
    if (startDate) {
      matchQuery = matchQuery.gte('created_at', startDate.toISOString());
    }

    const { data: matches, error: matchError } = await matchQuery;

    if (matchError) {
      console.error('Match query error:', matchError);
      return NextResponse.json(
        { error: matchError.message, code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // Calculate consent funnel
    const consentStats = {
      total_requests: consents?.length || 0,
      consented: consents?.filter(c => c.consent_given === true).length || 0,
      declined: consents?.filter(c => c.consent_given === false && c.status === 'declined').length || 0,
      pending: consents?.filter(c => c.status === 'pending').length || 0,
      expired: consents?.filter(c => c.status === 'expired').length || 0,
      consent_rate: 0,
      rejection_breakdown: {} as Record<string, number>,
    };

    // Calculate consent rate
    const decidedConsents = consentStats.consented + consentStats.declined;
    if (decidedConsents > 0) {
      consentStats.consent_rate = Math.round((consentStats.consented / decidedConsents) * 100);
    }

    // Rejection reason breakdown
    consents?.forEach(c => {
      if (c.rejection_reason) {
        consentStats.rejection_breakdown[c.rejection_reason] =
          (consentStats.rejection_breakdown[c.rejection_reason] || 0) + 1;
      }
    });

    // Calculate match funnel
    const matchStats = {
      total_matches: matches?.length || 0,
      pending: matches?.filter(m => m.status === 'pending').length || 0,
      contacted: matches?.filter(m => m.status === 'contacted').length || 0,
      interested: matches?.filter(m => m.status === 'interested').length || 0,
      viewing: matches?.filter(m => m.status === 'viewing').length || 0,
      applied: matches?.filter(m => m.status === 'applied').length || 0,
      converted: matches?.filter(m => m.status === 'converted').length || 0,
      rejected: matches?.filter(m => m.status === 'rejected').length || 0,
      conversion_rate: 0,
      avg_match_score: 0,
    };

    // Calculate conversion rate
    const contactedMatches = matches?.filter(m =>
      ['contacted', 'interested', 'viewing', 'applied', 'converted', 'rejected'].includes(m.status)
    ).length || 0;
    if (contactedMatches > 0) {
      matchStats.conversion_rate = Math.round((matchStats.converted / contactedMatches) * 100);
    }

    // Calculate average match score
    const scoredMatches = matches?.filter(m => m.match_score > 0) || [];
    if (scoredMatches.length > 0) {
      matchStats.avg_match_score = Math.round(
        (scoredMatches.reduce((sum, m) => sum + m.match_score, 0) / scoredMatches.length) * 100
      ) / 100;
    }

    // Calculate revenue stats
    const revenueStats = {
      total_commission: matches?.reduce((sum, m) => sum + (m.commission_amount || 0), 0) || 0,
      paid_commission: matches?.filter(m => m.commission_status === 'paid')
        .reduce((sum, m) => sum + (m.commission_amount || 0), 0) || 0,
      pending_commission: matches?.filter(m => m.commission_status === 'pending' || m.commission_status === 'calculated')
        .reduce((sum, m) => sum + (m.commission_amount || 0), 0) || 0,
      avg_commission_per_conversion: 0,
    };

    if (matchStats.converted > 0) {
      revenueStats.avg_commission_per_conversion = Math.round(
        revenueStats.total_commission / matchStats.converted
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        period,
        consent_funnel: consentStats,
        match_funnel: matchStats,
        revenue: revenueStats,
      },
    });
  } catch (error) {
    console.error('Spillover stats GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
