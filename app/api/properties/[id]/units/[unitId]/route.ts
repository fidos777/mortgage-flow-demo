/**
 * CR-007: Single Unit API
 *
 * GET /api/properties/[id]/units/[unitId] - Get unit by ID
 * PUT /api/properties/[id]/units/[unitId] - Update unit
 * DELETE /api/properties/[id]/units/[unitId] - Delete unit
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type UnitStatus = 'available' | 'reserved' | 'booked' | 'sold' | 'unavailable';

interface UpdateUnitRequest {
  unit_no?: string;
  block?: string;
  floor?: number;
  unit_type?: string;
  built_up_sqft?: number;
  land_sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking_lots?: number;
  price?: number;
  booking_fee?: number;
  status?: UnitStatus;
  reserved_until?: string;
  reserved_by?: string;
}

interface RouteParams {
  params: Promise<{ id: string; unitId: string }>;
}

/**
 * GET: Get single unit by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: propertyId, unitId } = await params;

    const { data, error } = await supabase
      .from('property_units')
      .select(`
        *,
        property:properties(id, name, slug, developer_id)
      `)
      .eq('id', unitId)
      .eq('property_id', propertyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Unit not found', code: 'NOT_FOUND' },
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
    console.error('Unit GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update unit
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: propertyId, unitId } = await params;
    const body: UpdateUnitRequest = await request.json();

    // Check if unit exists
    const { data: existing } = await supabase
      .from('property_units')
      .select('id, status')
      .eq('id', unitId)
      .eq('property_id', propertyId)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Unit not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'unit_no', 'block', 'floor', 'unit_type', 'built_up_sqft', 'land_sqft',
      'bedrooms', 'bathrooms', 'parking_lots', 'price', 'booking_fee',
      'status', 'reserved_until', 'reserved_by'
    ];

    for (const field of allowedFields) {
      if (body[field as keyof UpdateUnitRequest] !== undefined) {
        updateData[field] = body[field as keyof UpdateUnitRequest];
      }
    }

    // If status changes to available, clear reservation
    if (body.status === 'available') {
      updateData['reserved_until'] = null;
      updateData['reserved_by'] = null;
    }

    const { data, error } = await supabase
      .from('property_units')
      .update(updateData)
      .eq('id', unitId)
      .eq('property_id', propertyId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message, code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // Update property available_units count if status changed
    if (body.status && body.status !== existing.status) {
      const { data: unitCounts } = await supabase
        .from('property_units')
        .select('status')
        .eq('property_id', propertyId);

      if (unitCounts) {
        const availableUnits = unitCounts.filter(u => u.status === 'available').length;

        await supabase
          .from('properties')
          .update({ available_units: availableUnits })
          .eq('id', propertyId);
      }
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Unit PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete unit
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: propertyId, unitId } = await params;

    // Check if unit exists
    const { data: existing } = await supabase
      .from('property_units')
      .select('id, status')
      .eq('id', unitId)
      .eq('property_id', propertyId)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Unit not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Prevent deletion of sold units
    if (existing.status === 'sold') {
      return NextResponse.json(
        { error: 'Cannot delete a sold unit', code: 'CANNOT_DELETE_SOLD' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('property_units')
      .delete()
      .eq('id', unitId)
      .eq('property_id', propertyId);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message, code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // Update property unit counts
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
      message: 'Unit deleted',
    });
  } catch (error) {
    console.error('Unit DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
