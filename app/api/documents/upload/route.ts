/**
 * S5 B04: Document Upload API
 * POST /api/documents/upload
 *
 * Receives FormData with file + metadata, stores to Supabase Storage,
 * creates case_documents row, and logs proof event.
 *
 * Dual-key: buyer_hash is required, case_id is optional (backfilled later).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VALID_DOC_TYPES = ['IC', 'PAYSLIP', 'BANK_STATEMENT', 'KWSP'] as const;
type DocumentType = typeof VALID_DOC_TYPES[number];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const buyerHash = formData.get('buyer_hash') as string | null;
    const documentType = formData.get('document_type') as string | null;
    const caseId = formData.get('case_id') as string | null;

    // === VALIDATION ===

    if (!buyerHash) {
      return NextResponse.json(
        { error: 'buyer_hash is required' },
        { status: 400 }
      );
    }

    if (!documentType || !VALID_DOC_TYPES.includes(documentType as DocumentType)) {
      return NextResponse.json(
        { error: `document_type must be one of: ${VALID_DOC_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'file is required' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum ${MAX_FILE_SIZE / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // === UPLOAD TO SUPABASE STORAGE ===

    // Generate unique storage path: buyer_hash/doc_type/timestamp_filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${buyerHash}/${documentType}/${timestamp}_${safeName}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: storageError } = await supabase.storage
      .from('case-documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) {
      console.error('[Documents] Storage upload error:', storageError);
      return NextResponse.json(
        { error: 'Failed to upload file to storage', detail: storageError.message },
        { status: 500 }
      );
    }

    // === CREATE case_documents ROW ===

    const { data: docRow, error: dbError } = await supabase
      .from('case_documents')
      .insert({
        buyer_hash: buyerHash,
        case_id: caseId || null,
        document_type: documentType,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
        status: 'UPLOADED',
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Documents] DB insert error:', dbError);
      // Clean up storage on DB failure
      await supabase.storage.from('case-documents').remove([storagePath]);
      return NextResponse.json(
        { error: 'Failed to record document', detail: dbError.message },
        { status: 500 }
      );
    }

    // === LOG PROOF EVENT ===

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = request.headers.get('user-agent') || null;

    await supabase.rpc('log_proof_event', {
      p_event_type: 'DOC_UPLOADED',
      p_buyer_hash: buyerHash,
      p_case_id: caseId || null,
      p_actor_type: 'buyer',
      p_metadata: {
        document_id: docRow.id,
        document_type: documentType,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      },
      p_ip_address: ip,
      p_user_agent: userAgent,
      p_event_category: 'BUYER',
    });

    return NextResponse.json({
      success: true,
      data: {
        id: docRow.id,
        document_type: docRow.document_type,
        file_name: docRow.file_name,
        file_size: docRow.file_size,
        status: docRow.status,
        uploaded_at: docRow.uploaded_at,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[Documents] Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
