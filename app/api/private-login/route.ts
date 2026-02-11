// app/api/private-login/route.ts
// Basic password verification + login logging
// Zero external dependencies — uses Web Crypto API

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BASIC_PASSWORD = process.env.BASIC_PASSWORD || '';
const COOKIE_SALT = process.env.AUTH_COOKIE_SALT || 'snang-default-salt-change-me';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

// Generate SHA-256 hash using Web Crypto API (Edge-compatible, no Node crypto needed)
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ ok: false, error: 'Password required' }, { status: 400 });
    }

    if (!BASIC_PASSWORD) {
      console.error('[private-login] BASIC_PASSWORD env not set');
      return NextResponse.json({ ok: false, error: 'System not configured' }, { status: 500 });
    }

    const success = password === BASIC_PASSWORD;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Fingerprint for unique visitor counting
    const fingerprint = (await sha256(`${ip}|${userAgent}`)).substring(0, 16);
    
    // Hash of attempted password (first 8 chars only — for pattern detection, not recovery)
    const passwordHash = (await sha256(password)).substring(0, 8);

    // Log to Supabase (fire-and-forget — don't block login on logging failure)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('private_login_logs').insert({
          ip_address: ip,
          user_agent: userAgent.substring(0, 500), // Truncate long UAs
          success,
          fingerprint,
          attempted_password_hash: passwordHash,
        });
      }
    } catch (logError) {
      console.error('[private-login] Failed to log attempt:', logError);
      // Don't block login on logging failure
    }

    if (!success) {
      return NextResponse.json(
        { ok: false, error: 'Kata laluan salah' },
        { status: 401 }
      );
    }

    // Generate secure session token (hash of password + salt — not the password itself)
    const sessionToken = await sha256(`${BASIC_PASSWORD}|${COOKIE_SALT}`);

    const response = NextResponse.json({ ok: true });

    // Set httpOnly secure cookie with 24h expiry
    response.cookies.set('snang_auth', sessionToken, {
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;

  } catch (error) {
    console.error('[private-login] Error:', error);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

// GET: Check if current session is valid (for client-side redirect logic)
export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/snang_auth=([^;]+)/);
  const token = match?.[1] || '';

  if (!BASIC_PASSWORD) {
    return NextResponse.json({ authenticated: false });
  }

  const expectedToken = await sha256(`${BASIC_PASSWORD}|${COOKIE_SALT}`);
  const authenticated = token === expectedToken;

  return NextResponse.json({ authenticated });
}
