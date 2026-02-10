/**
 * CR-007: Single Property API
 *
 * GET /api/properties/[id] - Get property by ID
 * PUT /api/properties/[id] - Update property
 * DELETE /api/properties/[id] - Delete property
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type PropertyStatus = 'draft' | 'active' | 'sold_out' | 'archived';

interface UpdatePropertyRequest {
  name?: string;
  slug?: string;
  property_type?: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  price_min?: number;
  price_max?: number;
  description?: string;
  description_bm?: string;
  total_units?: number;
  available_units?: number;
  completion_date?: string;
  tenure?: 'freehold' | 'leasehold';
  lease_years?: number;
  cover_image_url?: string;
  gallery_urls?: string[];
  brochure_url?: string;
  video_url?: string;
  status?: PropertyStatus;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Get single property by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        developer:developers(id, company_name, slug, email, phone),
        units:property_units(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Property not found', code: 'NOT_FOUND' },
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
    console.error('Property GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update property
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body: UpdatePropertyRequest = await request.json();

    // Check if property exists
    const { data: existing } = await supabase
      .from('properties')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Property not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'name', 'slug', 'property_type', 'address', 'city', 'state', 'postcode',
      'latitude', 'longitude', 'price_min', 'price_max', 'description',
      'description_bm', 'total_units', 'available_units', 'completion_date',
      'tenure', 'lease_years', 'cover_image_url', 'gallery_urls', 'brochure_url',
      'video_url', 'status'
    ];

    for (const field of allowedFields) {
      if (body[field as keyof UpdatePropertyRequest] !== undefined) {
        updateData[field] = body[field as keyof UpdatePropertyRequest];
      }
    }

    // Handle status change to active -> set published_at
    if (body.status === 'active' && !updateData['published_at']) {
      updateData['published_at'] = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('properties')
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

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Property PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete property (soft delete by setting status to archived)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    // Check if property exists
    const { data: existing } = await supabase
      .from('properties')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Property not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (hardDelete) {
      // Hard delete - actually remove from database
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json(
          { error: error.message, code: 'DB_ERROR' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Property permanently deleted',
      });
    } else {
      // Soft delete - archive the property
      const { data, error } = await supabase
        .from('properties')
        .update({ status: 'archived' })
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

      return NextResponse.json({
        success: true,
        message: 'Property archived',
        data,
      });
    }
  } catch (error) {
    console.error('Property DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
