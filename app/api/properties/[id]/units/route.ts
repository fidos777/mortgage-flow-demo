/**
 * CR-007: Property Units API
 *
 * GET /api/properties/[id]/units - List all units for a property
 * POST /api/properties/[id]/units - Create a new unit
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type UnitStatus = 'available' | 'reserved' | 'booked' | 'sold' | 'unavailable';

interface CreateUnitRequest {
  unit_no: string;
  block?: string;
  floor?: number;
  unit_type?: string;
  built_up_sqft?: number;
  land_sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking_lots?: number;
  price: number;
  booking_fee?: number;
  status?: UnitStatus;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: List all units for a property
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: propertyId } = await params;
    const { searchParams } = new URL(request.url);

    // Query parameters
    const status = searchParams.get('status');
    const block = searchParams.get('block');
    const unitType = searchParams.get('unit_type');

    // Verify property exists
    const { data: property } = await supabase
      .from('properties')
      .select('id, name')
      .eq('id', propertyId)
      .single();

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build query
    let query = supabase
      .from('property_units')
      .select('*')
      .eq('property_id', propertyId)
      .order('block', { ascending: true })
      .order('floor', { ascending: true })
      .order('unit_no', { ascending: true });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (block) {
      query = query.eq('block', block);
    }
    if (unitType) {
      query = query.eq('unit_type', unitType);
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
      available: data?.filter(u => u.status === 'available').length || 0,
      reserved: data?.filter(u => u.status === 'reserved').length || 0,
      booked: data?.filter(u => u.status === 'booked').length || 0,
      sold: data?.filter(u => u.status === 'sold').length || 0,
    };

    return NextResponse.json({
      success: true,
      data,
      meta: {
        property: property.name,
        stats,
      },
    });
  } catch (error) {
    console.error('Units GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new unit
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: propertyId } = await params;
    const body: CreateUnitRequest = await request.json();

    // Validate required fields
    if (!body.unit_no) {
      return NextResponse.json(
        { error: 'unit_no is required' },
        { status: 400 }
      );
    }
    if (!body.price) {
      return NextResponse.json(
        { error: 'price is required' },
        { status: 400 }
      );
    }

    // Verify property exists
    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .single();

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Insert unit
    const { data, error } = await supabase
      .from('property_units')
      .insert({
        property_id: propertyId,
        ...body,
        status: body.status || 'available',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);

      // Handle unique constraint violation (duplicate unit_no for property)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A unit with this number already exists in this property', code: 'DUPLICATE_UNIT' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: error.message, code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // Update property available_units count
    const { data: unitCounts } = await supabase
      .from('property_units')
      .select('status')
      .eq('property_id', propertyId);

    if (unitCounts) {
      const totalUnits = unitCounts.length;
      const availableUnits = unitCounts.filter(u => u.status === 'available').length;

      await supabase
        .from('properties')
        .update({
          total_units: totalUnits,
          available_units: availableUnits,
        })
        .eq('id', propertyId);
    }

    return NextResponse.json({
      success: true,
      data,
    }, { status: 201 });
  } catch (error) {
    console.error('Units POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
