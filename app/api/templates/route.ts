/**
 * CR-004: WhatsApp Templates API
 *
 * GET /api/templates - List all active WhatsApp message templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET: List WhatsApp templates
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
    const category = searchParams.get('category');
    const code = searchParams.get('code');
    const includeInactive = searchParams.get('include_inactive') === 'true';

    // Single template by code
    if (code) {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('code', code)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Template not found', code: 'NOT_FOUND' },
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
    }

    // List templates
    let query = supabase
      .from('whatsapp_templates')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message, code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // Group by category for easier consumption
    const grouped = data?.reduce((acc, template) => {
      const cat = template.category;
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(template);
      return acc;
    }, {} as Record<string, typeof data>);

    return NextResponse.json({
      success: true,
      data,
      grouped,
      meta: {
        count: data?.length || 0,
        categories: Object.keys(grouped || {}),
      },
    });
  } catch (error) {
    console.error('Templates GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
