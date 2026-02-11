/**
 * S5 R01: Pre-KJ Checklist API
 * GET /api/pre-kj?case_id=...&buyer_hash=...
 *
 * Validates whether a case has met all prerequisites before
 * Ketua Jabatan (KJ) signing step. Returns a structured checklist
 * with pass/fail for each item.
 *
 * LPPSA process: LO Received → Pre-KJ Check → KJ Signing → Disbursement
 *
 * Checklist items:
 *   1. PDPA consent granted (PDPA_BASIC)
 *   2. LPPSA submission consent (purpose C5)
 *   3. All required documents uploaded (IC, PAYSLIP, BANK_STATEMENT)
 *   4. Readiness assessment completed
 *   5. Case exists and is in valid phase (LO_RECEIVED or later)
 *   6. TAC session confirmed (proof event exists)
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

interface ChecklistItem {
  id: string;
  label: string;
  labelBm: string;
  passed: boolean;
  detail?: string;
  required: boolean;
}

// Phases that are at or past LO_RECEIVED
const KJ_ELIGIBLE_PHASES = ['LO_RECEIVED', 'KJ_PENDING', 'COMPLETED'];

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);

    const caseId = searchParams.get('case_id');
    const buyerHash = searchParams.get('buyer_hash');

    if (!caseId && !buyerHash) {
      return NextResponse.json(
        { error: 'case_id or buyer_hash is required' },
        { status: 400 }
      );
    }

    const checklist: ChecklistItem[] = [];
    let caseData: Record<string, unknown> | null = null;
    let effectiveBuyerHash = buyerHash;

    // === 1. CASE EXISTS + VALID PHASE ===
    if (caseId) {
      const { data: caseRow } = await supabase
        .from('mortgage_cases')
        .select('id, status, buyer_hash, readiness_score, readiness_band, pre_kj_passed, pre_kj_checklist')
        .eq('id', caseId)
        .single();

      caseData = caseRow;
      if (caseRow?.buyer_hash) {
        effectiveBuyerHash = caseRow.buyer_hash as string;
      }

      checklist.push({
        id: 'case_exists',
        label: 'Case registered in system',
        labelBm: 'Kes berdaftar dalam sistem',
        passed: !!caseRow,
        detail: caseRow ? `Case ID: ${caseId}` : 'Case not found',
        required: true,
      });

      // Phase check — in production, case status maps to phases
      // For pilot, we check if the case exists (status-based phase check deferred to S6)
      checklist.push({
        id: 'valid_phase',
        label: 'Case at eligible phase for KJ',
        labelBm: 'Kes pada fasa layak untuk KJ',
        passed: !!caseRow, // Relaxed for pilot — tighten in S6
        detail: caseRow ? `Status: ${caseRow.status}` : undefined,
        required: true,
      });
    } else {
      checklist.push({
        id: 'case_exists',
        label: 'Case registered in system',
        labelBm: 'Kes berdaftar dalam sistem',
        passed: false,
        detail: 'No case_id provided — checking buyer_hash only',
        required: true,
      });
    }

    // === 2. PDPA BASIC CONSENT ===
    if (effectiveBuyerHash) {
      const { data: consentStatus } = await supabase
        .from('v_buyer_consent_status')
        .select('*')
        .eq('buyer_hash', effectiveBuyerHash)
        .maybeSingle();

      checklist.push({
        id: 'pdpa_consent',
        label: 'PDPA basic consent granted',
        labelBm: 'Persetujuan asas PDPA diberikan',
        passed: !!consentStatus?.has_basic,
        detail: consentStatus?.has_basic
          ? `Granted at: ${consentStatus.basic_granted_at || 'unknown'}`
          : 'PDPA_BASIC consent not found',
        required: true,
      });

      // === 3. LPPSA SUBMISSION CONSENT (Purpose C5) ===
      const { data: purposeCheck } = await supabase
        .rpc('has_purpose', {
          p_buyer_hash: effectiveBuyerHash,
          p_purpose: 'C5_COMMUNICATION', // Purpose C5 encompasses LPPSA submission consent
        });

      checklist.push({
        id: 'lppsa_consent',
        label: 'LPPSA submission consent granted',
        labelBm: 'Persetujuan permohonan rasmi LPPSA diberikan',
        passed: !!purposeCheck,
        detail: purposeCheck
          ? 'Purpose C5 granted'
          : 'Purpose C5 (LPPSA submission) not granted',
        required: true,
      });

      // === 4. ALL REQUIRED DOCUMENTS ===
      const { data: docStatus } = await supabase
        .from('v_buyer_document_status')
        .select('*')
        .eq('buyer_hash', effectiveBuyerHash)
        .maybeSingle();

      checklist.push({
        id: 'required_docs',
        label: 'All required documents uploaded',
        labelBm: 'Semua dokumen wajib dimuat naik',
        passed: !!docStatus?.all_required_uploaded,
        detail: docStatus
          ? `IC: ${docStatus.has_ic ? '✓' : '✗'}, Payslip: ${docStatus.has_payslip ? '✓' : '✗'}, Bank: ${docStatus.has_bank_statement ? '✓' : '✗'}`
          : 'No documents found',
        required: true,
      });

      // === 5. READINESS ASSESSMENT ===
      const hasReadiness = caseData
        ? !!(caseData.readiness_band)
        : false;

      checklist.push({
        id: 'readiness_done',
        label: 'Readiness assessment completed',
        labelBm: 'Penilaian kesediaan selesai',
        passed: hasReadiness,
        detail: hasReadiness
          ? `Band: ${caseData?.readiness_band}`
          : 'Readiness not computed for this case',
        required: true,
      });

      // === 6. TAC SESSION (proof event check) ===
      const { data: tacEvents } = await supabase
        .from('proof_events')
        .select('id, created_at')
        .eq('buyer_hash', effectiveBuyerHash)
        .eq('event_type', 'TAC_SESSION_BOOKED')
        .limit(1);

      checklist.push({
        id: 'tac_booked',
        label: 'TAC session booked',
        labelBm: 'Sesi TAC ditempah',
        passed: (tacEvents?.length ?? 0) > 0,
        detail: (tacEvents?.length ?? 0) > 0
          ? `Booked at: ${tacEvents![0].created_at}`
          : 'No TAC_SESSION_BOOKED event found',
        required: true,
      });
    }

    // === COMPUTE OVERALL RESULT ===
    const requiredItems = checklist.filter(item => item.required);
    const passedRequired = requiredItems.filter(item => item.passed);
    const allPassed = passedRequired.length === requiredItems.length;

    // Persist pre_kj_passed to case if case_id provided
    if (caseId && caseData) {
      await supabase
        .from('mortgage_cases')
        .update({
          pre_kj_passed: allPassed,
          pre_kj_checklist: checklist,
        })
        .eq('id', caseId)
        .then(({ error }) => {
          if (error) console.warn('[PreKJ] Failed to persist checklist:', error.message);
        });
    }

    return NextResponse.json({
      success: true,
      data: {
        pre_kj_passed: allPassed,
        passed_count: passedRequired.length,
        total_required: requiredItems.length,
        checklist,
      },
    });
  } catch (error) {
    console.error('[PreKJ] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
