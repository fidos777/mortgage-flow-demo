import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Generate agent notification for a new/updated case
// Body: { case_id: string }
// Returns: { notification, wa_link, agent }
export async function POST(req: NextRequest) {
  try {
    const { case_id } = await req.json();

    if (!case_id) {
      return NextResponse.json(
        { error: 'case_id required' },
        { status: 400 }
      );
    }

    // Fetch case with property and agent info
    const { data: caseData, error: caseError } = await supabase
      .from('mortgage_cases')
      .select(`
        id,
        case_ref,
        buyer_name,
        status,
        property_id,
        agent_id,
        properties (
          name
        ),
        mortgage_agents (
          name,
          phone,
          email
        )
      `)
      .eq('id', case_id)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json(
        { error: 'Case not found', details: caseError?.message },
        { status: 404 }
      );
    }

    const propertyName = (caseData as any).properties?.name || 'Hartanah';
    const agentName = (caseData as any).mortgage_agents?.name || 'Ejen';
    const agentPhone = (caseData as any).mortgage_agents?.phone || null;
    const caseRef = caseData.case_ref || case_id.slice(0, 8);
    const buyerName = caseData.buyer_name || 'Pembeli';

    // Build notification message (BM)
    const message = [
      `🏠 *Kes Baru Diterima*`,
      ``,
      `Rujukan: ${caseRef}`,
      `Pembeli: ${buyerName}`,
      `Hartanah: ${propertyName}`,
      `Status: ${caseData.status || 'new'}`,
      ``,
      `Sila semak kes ini di panel ejen:`,
      `https://snang.my/agent`,
      ``,
      `— Snang.my | AI bantu prepare, MANUSIA submit`
    ].join('\n');

    // Generate wa.me deep link if agent has phone
    let waLink: string | null = null;
    if (agentPhone) {
      // Normalize Malaysian phone: remove spaces, dashes, leading 0, add 60
      const cleanPhone = agentPhone
        .replace(/[\s\-\(\)]/g, '')
        .replace(/^0/, '60')
        .replace(/^\+/, '');
      waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    }

    // Log proof event
    await supabase.from('proof_events').insert({
      case_id,
      event_type: 'AGENT_NOTIFICATION_GENERATED',
      actor: 'system',
      payload: {
        notification_type: 'whatsapp_case_alert',
        agent_name: agentName,
        agent_phone: agentPhone ? '***' + agentPhone.slice(-4) : null,
        case_ref: caseRef,
        property_name: propertyName,
        has_wa_link: !!waLink
      }
    });

    return NextResponse.json({
      notification: {
        case_id,
        case_ref: caseRef,
        buyer_name: buyerName,
        property_name: propertyName,
        status: caseData.status,
        message,
        created_at: new Date().toISOString()
      },
      agent: {
        name: agentName,
        phone_masked: agentPhone ? '***' + agentPhone.slice(-4) : null,
        has_phone: !!agentPhone
      },
      wa_link: waLink
    });
  } catch (err: any) {
    console.error('Agent notification error:', err);
    return NextResponse.json(
      { error: 'Failed to generate notification', details: err.message },
      { status: 500 }
    );
  }
}

// GET: List recent notifications for cases
// Query: ?limit=10
export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');

    const { data, error } = await supabase
      .from('proof_events')
      .select('id, case_id, payload, created_at')
      .eq('event_type', 'AGENT_NOTIFICATION_GENERATED')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 50));

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch notifications', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      notifications: data || [],
      count: data?.length || 0
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: err.message },
      { status: 500 }
    );
  }
}
