/**
 * CR-007: Properties API
 * S6.3-N5: Added .select() whitelist — no longer returns internal fields
 *
 * GET /api/properties - List all properties (with filters)
 * POST /api/properties - Create a new property
 *
 * === S6.3 API CONTRACT (GET) ===
 * Response data no longer includes internal fields:
 *   qr_generated, qr_url, qr_token, created_at, updated_at
 * Only PROPERTIES_PUBLIC_FIELDS are returned.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// S6.3-N5: Public field whitelist for GET responses
// Excludes: qr_generated, qr_url, qr_token, created_at, updated_at
const PROPERTIES_PUBLIC_FIELDS = `
  id,
  developer_id,
  name,
  slug,
  property_type,
  address,
  city,
  state,
  postcode,
  latitude,
  longitude,
  price_min,
  price_max,
  currency,
  description,
  description_bm,
  total_units,
  available_units,
  completion_date,
  tenure,
  lease_years,
  cover_image_url,
  gallery_urls,
  brochure_url,
  video_url,
  status,
  published_at,
  developer:developers(id, company_name, slug)
`;

// Property types from schema
type PropertyType = 'apartment' | 'condominium' | 'townhouse' | 'semi-d' | 'bungalow' | 'terrace' | 'commercial' | 'mixed';
type PropertyStatus = 'draft' | 'active' | 'sold_out' | 'archived';

interface CreatePropertyRequest {
  developer_id: string;
  name: string;
  slug?: string;
  property_type: PropertyType;
  address: string;
  city: string;
  state: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  price_min?: number;
  price_max?: number;
  description?: string;
  description_bm?: string;
  total_units?: number;
  completion_date?: string;
  tenure?: 'freehold' | 'leasehold';
  lease_years?: number;
  cover_image_url?: string;
  gallery_urls?: string[];
  brochure_url?: string;
  video_url?: string;
  status?: PropertyStatus;
}

/**
 * GET: List properties with optional filters
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
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const propertyType = searchParams.get('property_type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // S6.3-N5: Build query with field whitelist (no internal IDs/fields)
    let query = supabase
      .from('properties')
      .select(PROPERTIES_PUBLIC_FIELDS)
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (developerId) {
      query = query.eq('developer_id', developerId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }
    if (state) {
      query = query.eq('state', state);
    }
    if (propertyType) {
      query = query.eq('property_type', propertyType);
    }

    const { data, error, count } = await query;

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
      meta: {
        count: data?.length || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Properties GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new property
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const body: CreatePropertyRequest = await request.json();

    // Validate required fields
    if (!body.developer_id) {
      return NextResponse.json(
        { error: 'developer_id is required' },
        { status: 400 }
      );
    }
    if (!body.name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }
    if (!body.property_type) {
      return NextResponse.json(
        { error: 'property_type is required' },
        { status: 400 }
      );
    }
    if (!body.address || !body.city || !body.state) {
      return NextResponse.json(
        { error: 'address, city, and state are required' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const slug = body.slug || body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Insert property
    const { data, error } = await supabase
      .from('properties')
      .insert({
        ...body,
        slug,
        status: body.status || 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);

      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A property with this slug already exists', code: 'DUPLICATE_SLUG' },
          { status: 409 }
        );
      }

      // Handle foreign key violation
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Developer not found', code: 'INVALID_DEVELOPER' },
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
    console.error('Properties POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
