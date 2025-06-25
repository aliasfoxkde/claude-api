import { Context, Next } from 'hono';
import { Env } from '../types';

/**
 * CORS middleware for handling cross-origin requests
 */
export async function corsMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const origin = c.req.header('Origin');
  const allowedOrigins = getAllowedOrigins(c.env);

  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    return handlePreflight(c, origin, allowedOrigins);
  }

  // Set CORS headers for actual requests
  setCORSHeaders(c, origin, allowedOrigins);

  return next();
}

/**
 * Get allowed origins from environment
 */
function getAllowedOrigins(env: Env): string[] {
  const corsOrigins = env.CORS_ORIGINS || '*';
  
  if (corsOrigins === '*') {
    return ['*'];
  }

  return corsOrigins.split(',').map(origin => origin.trim());
}

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | undefined, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  if (allowedOrigins.includes('*')) return true;
  return allowedOrigins.includes(origin);
}

/**
 * Set CORS headers
 */
function setCORSHeaders(c: Context, origin: string | undefined, allowedOrigins: string[]) {
  // Set Access-Control-Allow-Origin
  if (allowedOrigins.includes('*')) {
    c.header('Access-Control-Allow-Origin', '*');
  } else if (origin && isOriginAllowed(origin, allowedOrigins)) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Vary', 'Origin');
  }

  // Set other CORS headers
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent'
  );
  c.header('Access-Control-Expose-Headers', 
    'X-RateLimit-Limit-Minute, X-RateLimit-Limit-Hour, X-RateLimit-Limit-Day, ' +
    'X-RateLimit-Remaining-Minute, X-RateLimit-Remaining-Hour, X-RateLimit-Remaining-Day, ' +
    'X-RateLimit-Reset-Minute, X-RateLimit-Reset-Hour, X-RateLimit-Reset-Day, ' +
    'X-Request-ID'
  );
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Max-Age', '86400'); // 24 hours
}

/**
 * Handle preflight requests
 */
function handlePreflight(c: Context, origin: string | undefined, allowedOrigins: string[]) {
  setCORSHeaders(c, origin, allowedOrigins);
  
  // Return 204 No Content for preflight
  return c.text('', 204);
}

/**
 * Security headers middleware
 */
export async function securityHeadersMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  await next();

  // Add security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy for API responses
  c.header('Content-Security-Policy', 
    "default-src 'none'; " +
    "script-src 'none'; " +
    "style-src 'none'; " +
    "img-src 'none'; " +
    "font-src 'none'; " +
    "connect-src 'none'; " +
    "media-src 'none'; " +
    "object-src 'none'; " +
    "child-src 'none'; " +
    "worker-src 'none'; " +
    "frame-src 'none'; " +
    "base-uri 'none'; " +
    "form-action 'none'"
  );

  // Strict Transport Security (only for HTTPS)
  if (c.req.url.startsWith('https://')) {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
}

/**
 * Request ID middleware
 */
export async function requestIdMiddleware(c: Context, next: Next) {
  const requestId = c.get('requestId') || generateRequestId();
  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);
  
  return next();
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Logging middleware
 */
export async function loggingMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const startTime = Date.now();
  const requestId = c.get('requestId');
  const method = c.req.method;
  const url = c.req.url;
  const userAgent = c.req.header('User-Agent');
  const origin = c.req.header('Origin');
  const apiKey = c.get('apiKey');

  console.log(`[${requestId}] ${method} ${url} - Start`, {
    userAgent,
    origin,
    apiKeyId: apiKey?.id
  });

  await next();

  const duration = Date.now() - startTime;
  const status = c.res.status;

  console.log(`[${requestId}] ${method} ${url} - ${status} (${duration}ms)`, {
    duration,
    status,
    apiKeyId: apiKey?.id
  });
}

/**
 * Error handling middleware
 */
export async function errorHandlingMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error('Unhandled error:', error);
    
    const requestId = c.get('requestId');
    
    return c.json({
      error: {
        message: 'Internal server error',
        type: 'internal_error',
        code: 'internal_server_error',
        request_id: requestId
      }
    }, 500);
  }
}
