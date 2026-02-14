import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name');
  if (!name) {
    return NextResponse.json({ error: 'name parameter required' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ data: { logo_url: null } });
  }

  const { data, error } = await supabase
    .from('developers')
    .select('id, company_name, logo_url')
    .ilike('company_name', `%${name}%`)
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ data: { logo_url: null } });
  }

  return NextResponse.json({ data: { logo_url: data.logo_url } });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { developer_name, logo_base64 } = body;

    if (!developer_name || !logo_base64) {
      return NextResponse.json({ error: 'developer_name and logo_base64 required' }, { status: 400 });
    }

    if (!logo_base64.startsWith('data:image/')) {
      return NextResponse.json({ error: 'logo_base64 must be a data:image/* URL' }, { status: 400 });
    }

    if (logo_base64.length > 700000) {
      return NextResponse.json({ error: 'Logo too large (max ~500KB)' }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { data: dev, error: findError } = await supabase
      .from('developers')
      .select('id, company_name')
      .ilike('company_name', `%${developer_name}%`)
      .limit(1)
      .single();

    if (findError || !dev) {
      return NextResponse.json({ error: `Developer "${developer_name}" not found` }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('developers')
      .update({ logo_url: logo_base64 })
      .eq('id', dev.id);

    if (updateError) {
      console.error('[DeveloperLogo] Update failed:', updateError);
      return NextResponse.json({ error: 'Failed to save logo' }, { status: 500 });
    }

    return NextResponse.json({ data: { developer_id: dev.id, company_name: dev.company_name, saved: true } });
  } catch (err) {
    console.error('[DeveloperLogo] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
