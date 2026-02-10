/**
 * CR-007: Developers API
 *
 * GET /api/developers - List all developers
 * GET /api/developers?id=xxx - Get single developer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/**
 * GET: List developers or get single developer
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Query parameters
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const withStats = searchParams.get('with_stats') === 'true';

    // Single developer query
    if (id) {
      let query = supabase
        .from('developers')
        .select(`
          *,
          properties:properties(id, name, slug, status, price_min, price_max)
        `)
        .eq('id', id)
        .single();

      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Developer not found', code: 'NOT_FOUND' },
            { status: 404 }
          );
        }
        console.error('Supabase error:', error);
        return NextResponse.json(
          { error: error.message, code: 'DB_ERROR' },
          { status: 500 }
        );
      }

      // Get stats if requested
      let stats = null;
      if (withStats) {
        const { data: statsData } = await supabase
          .rpc('get_developer_stats', { p_developer_id: id });
        stats = statsData?.[0] || null;
      }

      return NextResponse.json({
        success: true,
        data: {
          ...data,
          stats,
        },
      });
    }

    // List developers query
    let query = supabase
      .from('developers')
      .select('*')
      .order('company_name', { ascending: true });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (status) {
      query = query.eq('status', status);
    } else {
      // Default to active only
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;

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
      },
    });
  } catch (error) {
    console.error('Developers GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
