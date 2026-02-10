/**
 * Next.js Middleware
 *
 * Handles:
 * - Request logging for API routes
 * - Security headers
 * - Rate limiting stub (placeholder)
 * - CORS headers for API routes
 */

import { NextRequest, NextResponse } from 'next/server';

// Configuration
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

  // Skip static assets and health checks
  if (CONFIG.skipLogPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Create response
  let response = NextResponse.next();

  // Add security headers
  response = addSecurityHeaders(response);

  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response = addCorsHeaders(request, response);
  }

  // Log API requests
  if (CONFIG.enableLogging && CONFIG.logPaths.some(path => pathname.startsWith(path))) {
    const duration = Date.now() - startTime;
    logRequest(request, response, duration);
  }

  // Rate limiting check (stub)
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

  // Content Security Policy (basic - adjust for production)
  // response.headers.set(
  //   'Content-Security-Policy',
  //   "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;"
  // );

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
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Format log entry
  const logEntry = {
    timestamp: new Date().toISOString(),
    method,
    path: pathname + search,
    ip,
    userAgent: userAgent.substring(0, 100), // Truncate long user agents
    duration: `${duration}ms`,
  };

  // Log to console (in production, send to logging service)
  console.log(`[API] ${method} ${pathname} - ${duration}ms - ${ip}`);

  // In production, you would send this to a logging service:
  // await sendToLoggingService(logEntry);
}

/**
 * Rate limiting check (stub implementation)
 *
 * In production, implement with Redis/Upstash:
 * - Use IP address or user ID as key
 * - Sliding window or token bucket algorithm
 * - Store counts in Redis with TTL
 */
function checkRateLimit(request: NextRequest): { allowed: boolean; retryAfter?: number } {
  // Stub implementation - always allow
  // TODO: Implement with Redis/Upstash for production

  // const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0];
  // const key = `ratelimit:${ip}`;

  // const current = await redis.incr(key);
  // if (current === 1) {
  //   await redis.expire(key, CONFIG.rateLimitWindow);
  // }

  // if (current > CONFIG.rateLimitRequests) {
  //   const ttl = await redis.ttl(key);
  //   return { allowed: false, retryAfter: ttl };
  // }

  return { allowed: true };
}

/**
 * Middleware configuration
 *
 * Match all routes except static files
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
