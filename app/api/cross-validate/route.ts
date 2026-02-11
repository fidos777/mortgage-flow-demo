/**
 * S5 R03: Cross-Validation API
 * GET /api/cross-validate?case_id=...&buyer_hash=...
 *
 * Fetches case form data + document extracted_data from DB,
 * runs cross-validator, returns mismatch flags.
 *
 * Used by the Agent Readiness Panel to display data discrepancy alerts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  crossValidateFields,
  countBySeverity,
  hasCriticalMismatch,
  type CaseFormData,
  type DocumentExtractedData,
} from '@/lib/readiness/cross-validator';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

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

    // === 1. Fetch case form data ===
    let formData: CaseFormData = {};
    let effectiveBuyerHash = buyerHash;

    if (caseId) {
      const { data: caseRow } = await supabase
        .from('mortgage_cases')
        .select('buyer_hash, buyer_name, buyer_ic, income_declared, form_data')
        .eq('id', caseId)
        .single();

      if (caseRow) {
        effectiveBuyerHash = caseRow.buyer_hash || buyerHash;
        // form_data is a JSONB column with buyer-declared fields
        const fd = (caseRow.form_data as Record<string, unknown>) || {};
        formData = {
          gred_jawatan: fd.gred_jawatan as string | undefined,
          income_declared: (caseRow.income_declared as number | undefined) ?? (fd.income_declared as number | undefined),
          employer_name: fd.employer_name as string | undefined,
          // Fall back to flat columns if form_data doesn't have them
          ic_number: (fd.ic_number as string | undefined) ?? (caseRow.buyer_ic as string | undefined),
          buyer_name: (fd.buyer_name as string | undefined) ?? (caseRow.buyer_name as string | undefined),
        };
      }
    }

    // === 2. Fetch document extracted data ===
    const docQuery = supabase
      .from('case_documents')
      .select('document_type, extracted_data')
      .not('extracted_data', 'is', null);

    if (caseId) {
      docQuery.eq('case_id', caseId);
    } else if (effectiveBuyerHash) {
      docQuery.eq('buyer_hash', effectiveBuyerHash);
    }

    const { data: docRows } = await docQuery;

    const documents: DocumentExtractedData[] = (docRows || []).map(row => ({
      doc_type: row.document_type,
      extracted_data: (row.extracted_data as Record<string, string | number | null>) || {},
    }));

    // === 3. Run cross-validation ===
    const mismatches = crossValidateFields(formData, documents);
    const counts = countBySeverity(mismatches);
    const hasCritical = hasCriticalMismatch(mismatches);

    return NextResponse.json({
      success: true,
      data: {
        mismatches,
        summary: {
          total: mismatches.length,
          ...counts,
          has_critical: hasCritical,
        },
        // Metadata for agent panel
        form_fields_checked: Object.keys(formData).filter(k => formData[k as keyof CaseFormData] !== undefined).length,
        documents_with_extractions: documents.length,
      },
    });
  } catch (error) {
    console.error('[CrossValidate] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
