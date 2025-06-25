import { Context, Next } from 'hono';
import { Env, APIKey, APIError, RateLimit } from '../types';

/**
 * Rate limiting middleware
 */
export async function rateLimitMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const apiKey: APIKey = c.get('apiKey');
  
  // Skip rate limiting if no API key (for public endpoints)
  if (!apiKey) {
    return next();
  }

  const now = Date.now();
  const keyId = apiKey.id;
  
  // Check rate limits for different time windows
  const isAllowed = await checkRateLimit(
    c.env,
    keyId,
    apiKey.rateLimit || {
      requestsPerMinute: parseInt(c.env.MAX_REQUESTS_PER_MINUTE),
      requestsPerHour: parseInt(c.env.MAX_REQUESTS_PER_HOUR),
      requestsPerDay: parseInt(c.env.MAX_REQUESTS_PER_DAY)
    },
    now
  );

  if (!isAllowed.allowed) {
    const error: APIError = {
      error: {
        message: `Rate limit exceeded. ${isAllowed.message}`,
        type: 'rate_limit_error',
        code: 'rate_limit_exceeded'
      }
    };

    // Add rate limit headers
    c.header('X-RateLimit-Limit-Minute', apiKey.rateLimit?.requestsPerMinute.toString() || c.env.MAX_REQUESTS_PER_MINUTE);
    c.header('X-RateLimit-Limit-Hour', apiKey.rateLimit?.requestsPerHour.toString() || c.env.MAX_REQUESTS_PER_HOUR);
    c.header('X-RateLimit-Limit-Day', apiKey.rateLimit?.requestsPerDay.toString() || c.env.MAX_REQUESTS_PER_DAY);
    c.header('X-RateLimit-Remaining-Minute', isAllowed.remaining.minute.toString());
    c.header('X-RateLimit-Remaining-Hour', isAllowed.remaining.hour.toString());
    c.header('X-RateLimit-Remaining-Day', isAllowed.remaining.day.toString());
    c.header('X-RateLimit-Reset-Minute', isAllowed.reset.minute.toString());
    c.header('X-RateLimit-Reset-Hour', isAllowed.reset.hour.toString());
    c.header('X-RateLimit-Reset-Day', isAllowed.reset.day.toString());

    return c.json(error, 429);
  }

  // Increment counters
  await incrementRateLimit(c.env, keyId, now);

  // Add rate limit headers to successful responses
  c.header('X-RateLimit-Limit-Minute', apiKey.rateLimit?.requestsPerMinute.toString() || c.env.MAX_REQUESTS_PER_MINUTE);
  c.header('X-RateLimit-Limit-Hour', apiKey.rateLimit?.requestsPerHour.toString() || c.env.MAX_REQUESTS_PER_HOUR);
  c.header('X-RateLimit-Limit-Day', apiKey.rateLimit?.requestsPerDay.toString() || c.env.MAX_REQUESTS_PER_DAY);
  c.header('X-RateLimit-Remaining-Minute', isAllowed.remaining.minute.toString());
  c.header('X-RateLimit-Remaining-Hour', isAllowed.remaining.hour.toString());
  c.header('X-RateLimit-Remaining-Day', isAllowed.remaining.day.toString());

  return next();
}

/**
 * Check if request is within rate limits
 */
async function checkRateLimit(
  env: Env,
  keyId: string,
  limits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  },
  now: number
): Promise<{
  allowed: boolean;
  message?: string;
  remaining: {
    minute: number;
    hour: number;
    day: number;
  };
  reset: {
    minute: number;
    hour: number;
    day: number;
  };
}> {
  const today = new Date(now).toISOString().split('T')[0];
  const thisHour = Math.floor(now / (1000 * 60 * 60));
  const thisMinute = Math.floor(now / (1000 * 60));

  // Get current counts
  const [minuteCount, hourCount, dayCount] = await Promise.all([
    getRateLimitCount(env, `${keyId}:minute:${thisMinute}`),
    getRateLimitCount(env, `${keyId}:hour:${thisHour}`),
    getRateLimitCount(env, `${keyId}:day:${today}`)
  ]);

  // Calculate remaining requests
  const remaining = {
    minute: Math.max(0, limits.requestsPerMinute - minuteCount),
    hour: Math.max(0, limits.requestsPerHour - hourCount),
    day: Math.max(0, limits.requestsPerDay - dayCount)
  };

  // Calculate reset times
  const reset = {
    minute: (thisMinute + 1) * 60 * 1000,
    hour: (thisHour + 1) * 60 * 60 * 1000,
    day: new Date(today + 'T23:59:59.999Z').getTime()
  };

  // Check limits
  if (minuteCount >= limits.requestsPerMinute) {
    return {
      allowed: false,
      message: `Minute limit of ${limits.requestsPerMinute} requests exceeded`,
      remaining,
      reset
    };
  }

  if (hourCount >= limits.requestsPerHour) {
    return {
      allowed: false,
      message: `Hour limit of ${limits.requestsPerHour} requests exceeded`,
      remaining,
      reset
    };
  }

  if (dayCount >= limits.requestsPerDay) {
    return {
      allowed: false,
      message: `Daily limit of ${limits.requestsPerDay} requests exceeded`,
      remaining,
      reset
    };
  }

  return {
    allowed: true,
    remaining,
    reset
  };
}

/**
 * Get current rate limit count for a key
 */
async function getRateLimitCount(env: Env, key: string): Promise<number> {
  try {
    const count = await env.RATE_LIMITS.get(key);
    return count ? parseInt(count) : 0;
  } catch (error) {
    console.error('Error getting rate limit count:', error);
    return 0;
  }
}

/**
 * Increment rate limit counters
 */
async function incrementRateLimit(env: Env, keyId: string, now: number): Promise<void> {
  const today = new Date(now).toISOString().split('T')[0];
  const thisHour = Math.floor(now / (1000 * 60 * 60));
  const thisMinute = Math.floor(now / (1000 * 60));

  const minuteKey = `${keyId}:minute:${thisMinute}`;
  const hourKey = `${keyId}:hour:${thisHour}`;
  const dayKey = `${keyId}:day:${today}`;

  // Increment counters with appropriate TTL
  await Promise.all([
    incrementCounter(env, minuteKey, 60), // 1 minute TTL
    incrementCounter(env, hourKey, 3600), // 1 hour TTL
    incrementCounter(env, dayKey, 86400) // 1 day TTL
  ]);
}

/**
 * Increment a counter in KV with TTL
 */
async function incrementCounter(env: Env, key: string, ttl: number): Promise<void> {
  try {
    const current = await env.RATE_LIMITS.get(key);
    const count = current ? parseInt(current) + 1 : 1;
    
    await env.RATE_LIMITS.put(key, count.toString(), {
      expirationTtl: ttl
    });
  } catch (error) {
    console.error('Error incrementing counter:', error);
  }
}

/**
 * Get rate limit status for an API key
 */
export async function getRateLimitStatus(
  env: Env,
  keyId: string,
  limits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  }
): Promise<{
  limits: {
    minute: number;
    hour: number;
    day: number;
  };
  used: {
    minute: number;
    hour: number;
    day: number;
  };
  remaining: {
    minute: number;
    hour: number;
    day: number;
  };
  reset: {
    minute: number;
    hour: number;
    day: number;
  };
}> {
  const now = Date.now();
  const today = new Date(now).toISOString().split('T')[0];
  const thisHour = Math.floor(now / (1000 * 60 * 60));
  const thisMinute = Math.floor(now / (1000 * 60));

  const [minuteCount, hourCount, dayCount] = await Promise.all([
    getRateLimitCount(env, `${keyId}:minute:${thisMinute}`),
    getRateLimitCount(env, `${keyId}:hour:${thisHour}`),
    getRateLimitCount(env, `${keyId}:day:${today}`)
  ]);

  return {
    limits: {
      minute: limits.requestsPerMinute,
      hour: limits.requestsPerHour,
      day: limits.requestsPerDay
    },
    used: {
      minute: minuteCount,
      hour: hourCount,
      day: dayCount
    },
    remaining: {
      minute: Math.max(0, limits.requestsPerMinute - minuteCount),
      hour: Math.max(0, limits.requestsPerHour - hourCount),
      day: Math.max(0, limits.requestsPerDay - dayCount)
    },
    reset: {
      minute: (thisMinute + 1) * 60 * 1000,
      hour: (thisHour + 1) * 60 * 60 * 1000,
      day: new Date(today + 'T23:59:59.999Z').getTime()
    }
  };
}
