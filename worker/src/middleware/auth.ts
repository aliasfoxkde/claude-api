import { Context, Next } from 'hono';
import { Env, APIKey, APIError } from '../types';
import { nanoid } from 'nanoid';

/**
 * Generate a new API key
 */
export async function generateAPIKey(
  env: Env,
  name: string,
  permissions: string[] = ['chat'],
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  }
): Promise<APIKey> {
  const id = nanoid();
  const key = `pk-${nanoid(32)}`;
  
  const apiKey: APIKey = {
    id,
    name,
    key,
    permissions,
    createdAt: new Date().toISOString(),
    rateLimit: rateLimit || {
      requestsPerMinute: parseInt(env.MAX_REQUESTS_PER_MINUTE),
      requestsPerHour: parseInt(env.MAX_REQUESTS_PER_HOUR),
      requestsPerDay: parseInt(env.MAX_REQUESTS_PER_DAY)
    },
    isActive: true
  };

  // Store in KV
  await env.API_KEYS.put(key, JSON.stringify(apiKey));
  await env.API_KEYS.put(`id:${id}`, key); // For lookup by ID

  return apiKey;
}

/**
 * Validate API key and return key data
 */
export async function validateAPIKey(env: Env, key: string): Promise<APIKey | null> {
  if (!key || !key.startsWith('pk-')) {
    return null;
  }

  try {
    const keyData = await env.API_KEYS.get(key);
    if (!keyData) {
      return null;
    }

    const apiKey: APIKey = JSON.parse(keyData);
    
    // Check if key is active
    if (!apiKey.isActive) {
      return null;
    }

    // Update last used timestamp
    apiKey.lastUsed = new Date().toISOString();
    await env.API_KEYS.put(key, JSON.stringify(apiKey));

    return apiKey;
  } catch (error) {
    console.error('Error validating API key:', error);
    return null;
  }
}

/**
 * Authentication middleware
 */
export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  // Skip auth for certain endpoints
  const path = new URL(c.req.url).pathname;
  const publicPaths = [
    '/health', '/v1/health',
    '/health/ready', '/v1/health/ready',
    '/health/live', '/v1/health/live',
    '/metrics', '/v1/metrics',
    '/models', '/v1/models'
  ];

  if (publicPaths.some(publicPath => path === publicPath || path.startsWith(publicPath + '/'))) {
    return next();
  }

  // Special case: Allow first API key creation without authentication
  if ((path === '/v1/keys' || path === '/keys') && c.req.method === 'POST') {
    try {
      // Check if any API keys exist
      const existingKeys = await listAPIKeys(c.env, 1);
      if (existingKeys.length === 0) {
        // No API keys exist, allow creation without auth
        return next();
      }
    } catch (error) {
      // If we can't check existing keys, allow creation (fail open for first key)
      console.warn('Could not check existing API keys, allowing key creation:', error);
      return next();
    }
  }

  // Extract API key from Authorization header or query parameter
  let apiKey = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!apiKey) {
    apiKey = c.req.query('api_key');
  }

  if (!apiKey) {
    const error: APIError = {
      error: {
        message: 'No API key provided',
        type: 'authentication_error',
        code: 'missing_api_key'
      }
    };
    return c.json(error, 401);
  }

  // Validate the API key
  const keyData = await validateAPIKey(c.env, apiKey);
  
  if (!keyData) {
    const error: APIError = {
      error: {
        message: 'Invalid API key',
        type: 'authentication_error',
        code: 'invalid_api_key'
      }
    };
    return c.json(error, 401);
  }

  // Check permissions for the endpoint
  const requiredPermission = getRequiredPermission(path);
  if (requiredPermission && !keyData.permissions.includes(requiredPermission)) {
    const error: APIError = {
      error: {
        message: `Insufficient permissions. Required: ${requiredPermission}`,
        type: 'permission_error',
        code: 'insufficient_permissions'
      }
    };
    return c.json(error, 403);
  }

  // Store API key data in context for use by other middleware/handlers
  c.set('apiKey', keyData);
  c.set('requestId', nanoid());
  c.set('startTime', Date.now());

  return next();
}

/**
 * Get required permission for an endpoint
 */
function getRequiredPermission(path: string): string | null {
  if (path.startsWith('/v1/chat/completions') || path.startsWith('/chat/completions') ||
      path.startsWith('/v1/messages') || path === '/messages') {
    return 'chat';
  }

  if (path.startsWith('/v1/keys') || path.startsWith('/keys')) {
    return 'admin';
  }

  return null;
}

/**
 * List API keys (admin only)
 */
export async function listAPIKeys(env: Env, limit = 50): Promise<Omit<APIKey, 'key'>[]> {
  const keys: Omit<APIKey, 'key'>[] = [];
  
  // This is a simplified implementation
  // In production, you might want to use a more efficient method
  // to list keys, possibly with pagination
  
  const list = await env.API_KEYS.list({ limit });
  
  for (const item of list.keys) {
    if (!item.name.startsWith('id:')) {
      try {
        const keyData = await env.API_KEYS.get(item.name);
        if (keyData) {
          const apiKey: APIKey = JSON.parse(keyData);
          const { key, ...keyWithoutSecret } = apiKey;
          keys.push(keyWithoutSecret);
        }
      } catch (error) {
        console.error('Error parsing API key:', error);
      }
    }
  }

  return keys;
}

/**
 * Revoke an API key
 */
export async function revokeAPIKey(env: Env, keyId: string): Promise<boolean> {
  try {
    // Get the actual key from the ID
    const keyValue = await env.API_KEYS.get(`id:${keyId}`);
    if (!keyValue) {
      return false;
    }

    // Get the key data
    const keyData = await env.API_KEYS.get(keyValue);
    if (!keyData) {
      return false;
    }

    const apiKey: APIKey = JSON.parse(keyData);
    apiKey.isActive = false;

    // Update the key data
    await env.API_KEYS.put(keyValue, JSON.stringify(apiKey));
    
    return true;
  } catch (error) {
    console.error('Error revoking API key:', error);
    return false;
  }
}

/**
 * Get API key usage statistics
 */
export async function getAPIKeyUsage(env: Env, keyId: string): Promise<{
  requests: {
    today: number;
    thisHour: number;
    thisMinute: number;
  };
  lastUsed?: string;
} | null> {
  try {
    const keyValue = await env.API_KEYS.get(`id:${keyId}`);
    if (!keyValue) {
      return null;
    }

    const keyData = await env.API_KEYS.get(keyValue);
    if (!keyData) {
      return null;
    }

    const apiKey: APIKey = JSON.parse(keyData);
    
    // Get rate limit data
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    const thisHour = Math.floor(now / (1000 * 60 * 60));
    const thisMinute = Math.floor(now / (1000 * 60));

    const [todayCount, hourCount, minuteCount] = await Promise.all([
      env.RATE_LIMITS.get(`${keyId}:day:${today}`),
      env.RATE_LIMITS.get(`${keyId}:hour:${thisHour}`),
      env.RATE_LIMITS.get(`${keyId}:minute:${thisMinute}`)
    ]);

    return {
      requests: {
        today: parseInt(todayCount || '0'),
        thisHour: parseInt(hourCount || '0'),
        thisMinute: parseInt(minuteCount || '0')
      },
      lastUsed: apiKey.lastUsed
    };
  } catch (error) {
    console.error('Error getting API key usage:', error);
    return null;
  }
}
