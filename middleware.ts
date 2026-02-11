/**
 * Next.js Middleware
 *
 * Handles:
 * 1. Password wall for strategy concealment (pilot phase)
 * 2. Request logging for API routes
 * 3. Security headers
 * 4. Rate limiting stub (placeholder)
 * 5. CORS headers for API routes
 */

import { NextRequest, NextResponse } from 'next/server';

// ─── Password Wall Config ──────────────────────────────────────────────
const BASIC_PASSWORD = process.env.BASIC_PASSWORD || '';
const COOKIE_SALT = process.env.AUTH_COOKIE_SALT || 'snang-default-salt-change-me';

// SHA-256 using Web Crypto (Edge Runtime compatible)
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Routes that DON'T need password protection
const PUBLIC_PATHS = [
  '/protected-login',     // Login page itself
  '/api/',                // All API routes (have their own auth)
  '/q/',                  // QR / secure link buyer entry
  '/buyer/',              // Buyer flow (accessed via secure links)
  '/_next/',              // Next.js internals
  '/favicon',             // Static assets
  '/manifest',            // PWA manifest
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(prefix => pathname.startsWith(prefix));
}

// ─── Existing Config ───────────────────────────────────────────────────
const CONFIG = {
  // Enable request logging
  enableLogging: process.env.NODE_ENV === 'development' || process.env.ENABLE_REQUEST_LOGGING === 'true',

  // Rate limiting (stub - implement with Redis/Upstash in production)
  rateLimitEnabled: false,
  rateLimitRequests: 100, // requests per window
  rateLimitWindow: 60, // seconds

  // Paths to log
  logPaths: ['/api/'],

  // Paths to skip logging
  skipLogPaths: ['/api/health', '/_next/', '/favicon.ico'],
};

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();

  // ── Step 1: Password wall check ──────────────────────────────────
  // Skip if no password configured (password wall disabled)
  if (BASIC_PASSWORD && !isPublicPath(pathname)) {
    const authCookie = request.cookies.get('snang_auth');
    let authenticated = false;

    if (authCookie?.value) {
      const expectedToken = await sha256(`${BASIC_PASSWORD}|${COOKIE_SALT}`);
      authenticated = authCookie.value === expectedToken;
    }

    if (!authenticated) {
      // Not authenticated — redirect to login
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/protected-login';
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Step 2: Skip static assets and health checks ─────────────────
  if (CONFIG.skipLogPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Create response
  let response = NextResponse.next();

  // ── Step 3: Security headers ─────────────────────────────────────
  response = addSecurityHeaders(response);

  // ── Step 4: CORS headers for API routes ──────────────────────────
  if (pathname.startsWith('/api/')) {
    response = addCorsHeaders(request, response);
  }

  // ── Step 5: Log API requests ─────────────────────────────────────
  if (CONFIG.enableLogging && CONFIG.logPaths.some(path => pathname.startsWith(path))) {
    const duration = Date.now() - startTime;
    logRequest(request, response, duration);
  }

  // ── Step 6: Rate limiting check (stub) ───────────────────────────
  if (CONFIG.rateLimitEnabled && pathname.startsWith('/api/')) {
    const rateLimitResult = checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retryAfter),
          },
        }
      );
    }
  }

  return response;
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
  );

  return response;
}

/**
 * Add CORS headers for API routes
 */
function addCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin');

  // Allowed origins (configure for production)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://snang.my',
    'https://www.snang.my',
    'https://snang-my.vercel.app',
  ];

  // Check if origin is allowed
  if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development')) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return response;
}

/**
 * Log request details
 */
function logRequest(request: NextRequest, response: NextResponse, duration: number): void {
  const { pathname, search } = request.nextUrl;
  const method = request.method;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown';

  // Format log entry
  console.log(`[API] ${method} ${pathname} - ${duration}ms - ${ip}`);
}

/**
 * Rate limiting check (stub implementation)
 */
function checkRateLimit(request: NextRequest): { allowed: boolean; retryAfter?: number } {
  // Stub implementation - always allow
  return { allowed: true };
}

/**
 * Middleware configuration
 *
 * Match all routes except static files
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
