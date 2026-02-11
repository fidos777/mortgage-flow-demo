/**
 * S5-B02: Readiness Scoring API
 *
 * POST /api/readiness — Compute DSR + readiness band, persist to mortgage_cases
 *
 * This endpoint mirrors the client-side calculateReadiness() from
 * lib/kuasaturbo/readiness-score.ts, running it server-side so results
 * are persisted and auditable. The client-side version remains for
 * instant preview; this endpoint is the source of truth.
 *
 * PRD Section 16: Readiness is ADVISORY only. Score is internal,
 * only band + guidance are returned to caller.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

interface ReadinessRequest {
  // Case linkage (optional — if provided, persists result to DB)
  case_id?: string;

  // Employment
  employment_type: 'tetap' | 'kontrak' | '';
  employment_scheme?: string;
  service_years: string; // '0-2', '3-4', '5+'
  age_range: string;     // 'below35', '35-49', '50-55', '56+'

  // Financial
  income_range: string;       // '2000-3000', '3001-4000', etc.
  commitment_range: string;   // '0-30', '31-40', '41-50', '51+'
  existing_loan: 'yes' | 'no' | '';

  // Property
  property_price?: number;
}

type ReadinessBand = 'ready' | 'caution' | 'not_ready';

// ============================================================================
// Readiness Algorithm (server-side mirror of lib/kuasaturbo/readiness-score.ts)
// PRD Appendix A: Deterministic — same input ALWAYS produces same output
// ============================================================================

function calculateRuleCoverage(req: ReadinessRequest): number {
  let score = 0;
  if (req.employment_type === 'tetap') score += 20;
  else if (req.employment_type === 'kontrak') score += 8;

  if (req.service_years === '5+') score += 10;
  else if (req.service_years === '3-4') score += 6;
  else if (req.service_years === '0-2') score += 2;

  if (req.age_range === '50-55') score -= 2;
  else if (req.age_range === '56+') score -= 5;

  return Math.max(0, Math.min(30, score));
}

function calculateIncomePattern(req: ReadinessRequest): number {
  let score = 0;
  const incomeScores: Record<string, number> = {
    '8001+': 18, '6001-8000': 15, '5001-6000': 12,
    '4001-5000': 9, '3001-4000': 6, '2000-3000': 5,
  };
  score += incomeScores[req.income_range] || 5;
  if (req.employment_type === 'tetap') score += 7;
  else if (req.employment_type === 'kontrak') score += 3;
  return Math.min(25, score);
}

function calculateCommitmentSignal(req: ReadinessRequest): number {
  const scores: Record<string, number> = {
    '0-30': 25, '31-40': 18, '41-50': 10, '51+': 4,
  };
  return scores[req.commitment_range] || 0;
}

function calculatePropertyContext(req: ReadinessRequest): number {
  let score = 0;
  const incomeMidpoints: Record<string, number> = {
    '8001+': 10000, '6001-8000': 7000, '5001-6000': 5500,
    '4001-5000': 4500, '3001-4000': 3500, '2000-3000': 2500,
  };
  const monthlyIncome = incomeMidpoints[req.income_range] || 4000;
  const annualIncome = monthlyIncome * 12;
  const propertyPrice = req.property_price || 450000;
  const priceMultiple = propertyPrice / annualIncome;

  if (priceMultiple < 5) score += 20;
  else if (priceMultiple < 7) score += 15;
  else if (priceMultiple < 10) score += 10;
  else score += 5;

  if (req.existing_loan === 'yes') score -= 8;
  return Math.max(0, Math.min(20, score));
}

function computeDSR(req: ReadinessRequest): number | null {
  // DSR estimation based on commitment_range midpoint and income_range midpoint
  const incomeMidpoints: Record<string, number> = {
    '8001+': 10000, '6001-8000': 7000, '5001-6000': 5500,
    '4001-5000': 4500, '3001-4000': 3500, '2000-3000': 2500,
  };
  const commitmentMidpoints: Record<string, number> = {
    '0-30': 15, '31-40': 35, '41-50': 45, '51+': 60,
  };

  const income = incomeMidpoints[req.income_range];
  const commitPct = commitmentMidpoints[req.commitment_range];

  if (!income || commitPct === undefined) return null;
  return commitPct; // Already a percentage
}

function calculateReadiness(req: ReadinessRequest): {
  score: number;
  band: ReadinessBand;
  label: string;
  guidance: string;
  dsr_ratio: number | null;
  breakdown: { a: number; b: number; c: number; d: number };
} {
  const a = calculateRuleCoverage(req);
  const b = calculateIncomePattern(req);
  const c = calculateCommitmentSignal(req);
  const d = calculatePropertyContext(req);
  const totalScore = Math.min(100, Math.max(0, a + b + c + d));
  const dsr = computeDSR(req);

  let band: ReadinessBand;
  let label: string;
  let guidance: string;

  if (totalScore >= 70) {
    band = 'ready';
    label = 'READY TO CONTINUE';
    guidance = 'Anda boleh meneruskan ke proses tempahan dan penyediaan dokumen.';
  } else if (totalScore >= 50) {
    band = 'caution';
    label = 'CONTINUE WITH CAUTION';
    guidance = 'Anda boleh meneruskan dengan perhatian kepada item yang ditandakan.';
  } else {
    band = 'not_ready';
    label = 'NOT READY TO PROCEED';
    guidance = 'Sila selesaikan perkara yang ditandakan sebelum meneruskan.';
  }

  return {
    score: totalScore,
    band,
    label,
    guidance,
    dsr_ratio: dsr,
    breakdown: { a, b, c, d },
  };
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: ReadinessRequest = await request.json();

    // Validate required fields
    if (!body.employment_type || !body.income_range || !body.commitment_range) {
      return NextResponse.json(
        { error: 'employment_type, income_range, and commitment_range are required' },
        { status: 400 }
      );
    }

    // Compute readiness
    const result = calculateReadiness(body);

    // If case_id provided, persist to DB
    let persistedToCase = false;
    if (body.case_id) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );

      const { error } = await supabase
        .from('mortgage_cases')
        .update({
          readiness_score: result.score,
          readiness_band: result.band,
          dsr_ratio: result.dsr_ratio,
          income_declared: getIncomeMidpoint(body.income_range),
          readiness_computed_at: new Date().toISOString(),
        })
        .eq('id', body.case_id);

      if (error) {
        console.error('Readiness persist error:', error);
        // Non-fatal: return result even if persist fails
      } else {
        persistedToCase = true;
      }
    }

    // R02 FIX: PRD Section 16.3 — Score NEVER exposed in API response.
    // Score + breakdown are persisted to mortgage_cases.readiness_score (server-only).
    // Developer dashboard reads from DB, not from this endpoint.
    return NextResponse.json({
      success: true,
      data: {
        band: result.band,
        label: result.label,
        guidance: result.guidance,
        dsr_ratio: result.dsr_ratio,
      },
      persisted: persistedToCase,
      case_id: body.case_id || null,
    });
  } catch (error) {
    console.error('Readiness POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper: get income midpoint from range string
function getIncomeMidpoint(range: string): number {
  const midpoints: Record<string, number> = {
    '8001+': 10000, '6001-8000': 7000, '5001-6000': 5500,
    '4001-5000': 4500, '3001-4000': 3500, '2000-3000': 2500,
  };
  return midpoints[range] || 4000;
}
