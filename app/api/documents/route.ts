/**
 * S5 B04: Document List API
 * GET /api/documents?buyer_hash=...
 *
 * Returns uploaded documents for a buyer, uses v_buyer_document_status view
 * for summary and raw rows for details.
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

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const buyerHash = searchParams.get('buyer_hash');
    const caseId = searchParams.get('case_id');

    if (!buyerHash && !caseId) {
      return NextResponse.json(
        { error: 'buyer_hash or case_id is required' },
        { status: 400 }
      );
    }

    // Get document list
    let query = supabase
      .from('case_documents')
      .select('id, document_type, file_name, file_size, mime_type, status, uploaded_at, verified_at')
      .order('uploaded_at', { ascending: false });

    if (buyerHash) {
      query = query.eq('buyer_hash', buyerHash);
    }
    if (caseId) {
      query = query.eq('case_id', caseId);
    }

    const { data: documents, error: docsError } = await query;

    if (docsError) {
      console.error('[Documents] List error:', docsError);
      return NextResponse.json(
        { error: docsError.message },
        { status: 500 }
      );
    }

    // Get summary from view
    let summaryQuery = supabase
      .from('v_buyer_document_status')
      .select('*');

    if (buyerHash) {
      summaryQuery = summaryQuery.eq('buyer_hash', buyerHash);
    }

    const { data: summary } = await summaryQuery.maybeSingle();

    return NextResponse.json({
      success: true,
      data: {
        documents: documents || [],
        summary: summary || {
          docs_uploaded: 0,
          has_ic: false,
          has_payslip: false,
          has_bank_statement: false,
          has_kwsp: false,
          all_required_uploaded: false,
        },
      },
    });
  } catch (error) {
    console.error('[Documents] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
