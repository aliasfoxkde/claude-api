import { Context } from 'hono';
import { z } from 'zod';
import { Env, APIError } from '../types';
import {
  generateAPIKey,
  listAPIKeys,
  revokeAPIKey,
  getAPIKeyUsage
} from '../middleware/auth';
import { getRateLimitStatus } from '../middleware/rate-limit';

// Validation schemas
const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.enum(['chat', 'admin'])).optional().default(['chat']),
  rateLimit: z.object({
    requestsPerMinute: z.number().min(1).max(1000).optional(),
    requestsPerHour: z.number().min(1).max(10000).optional(),
    requestsPerDay: z.number().min(1).max(100000).optional()
  }).optional()
});

/**
 * Handle API key creation
 */
export async function handleCreateAPIKey(c: Context<{ Bindings: Env }>) {
  try {
    const requestBody = await c.req.json();
    
    // Validate request
    const validationResult = createKeySchema.safeParse(requestBody);
    if (!validationResult.success) {
      const error: APIError = {
        error: {
          message: 'Invalid request format',
          type: 'invalid_request_error',
          param: validationResult.error.issues[0]?.path.join('.'),
          code: 'invalid_request'
        }
      };
      return c.json(error, 400);
    }

    const { name, permissions, rateLimit } = validationResult.data;

    // Generate new API key
    const apiKey = await generateAPIKey(c.env, name, permissions, rateLimit);

    // Return the key (this is the only time the full key is returned)
    return c.json({
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key, // Only returned on creation
      permissions: apiKey.permissions,
      createdAt: apiKey.createdAt,
      rateLimit: apiKey.rateLimit,
      isActive: apiKey.isActive
    }, 201);

  } catch (error) {
    console.error('API key creation error:', error);
    
    const apiError: APIError = {
      error: {
        message: 'Failed to create API key',
        type: 'api_error',
        code: 'key_creation_error'
      }
    };
    return c.json(apiError, 500);
  }
}

/**
 * Handle API key listing
 */
export async function handleListAPIKeys(c: Context<{ Bindings: Env }>) {
  try {
    // Check if user has admin permissions
    const apiKey = c.get('apiKey');
    if (!apiKey || !apiKey.permissions.includes('admin')) {
      const error: APIError = {
        error: {
          message: 'Admin permissions required',
          type: 'permission_error',
          code: 'insufficient_permissions'
        }
      };
      return c.json(error, 403);
    }

    const limit = parseInt(c.req.query('limit') || '50');
    const keys = await listAPIKeys(c.env, limit);

    return c.json({
      object: 'list',
      data: keys
    });

  } catch (error) {
    console.error('API key listing error:', error);
    
    const apiError: APIError = {
      error: {
        message: 'Failed to list API keys',
        type: 'api_error',
        code: 'key_listing_error'
      }
    };
    return c.json(apiError, 500);
  }
}

/**
 * Handle API key revocation
 */
export async function handleRevokeAPIKey(c: Context<{ Bindings: Env }>) {
  try {
    const keyId = c.req.param('keyId');
    
    if (!keyId) {
      const error: APIError = {
        error: {
          message: 'Key ID is required',
          type: 'invalid_request_error',
          code: 'missing_key_id'
        }
      };
      return c.json(error, 400);
    }

    // Check if user has admin permissions
    const apiKey = c.get('apiKey');
    if (!apiKey || !apiKey.permissions.includes('admin')) {
      const error: APIError = {
        error: {
          message: 'Admin permissions required',
          type: 'permission_error',
          code: 'insufficient_permissions'
        }
      };
      return c.json(error, 403);
    }

    const success = await revokeAPIKey(c.env, keyId);
    
    if (!success) {
      const error: APIError = {
        error: {
          message: 'API key not found',
          type: 'invalid_request_error',
          code: 'key_not_found'
        }
      };
      return c.json(error, 404);
    }

    return c.json({
      message: 'API key revoked successfully',
      keyId
    });

  } catch (error) {
    console.error('API key revocation error:', error);
    
    const apiError: APIError = {
      error: {
        message: 'Failed to revoke API key',
        type: 'api_error',
        code: 'key_revocation_error'
      }
    };
    return c.json(apiError, 500);
  }
}

/**
 * Handle API key usage statistics
 */
export async function handleAPIKeyUsage(c: Context<{ Bindings: Env }>) {
  try {
    const keyId = c.req.param('keyId');
    
    if (!keyId) {
      const error: APIError = {
        error: {
          message: 'Key ID is required',
          type: 'invalid_request_error',
          code: 'missing_key_id'
        }
      };
      return c.json(error, 400);
    }

    // Check if user has admin permissions or is requesting their own key
    const apiKey = c.get('apiKey');
    if (!apiKey || (!apiKey.permissions.includes('admin') && apiKey.id !== keyId)) {
      const error: APIError = {
        error: {
          message: 'Insufficient permissions',
          type: 'permission_error',
          code: 'insufficient_permissions'
        }
      };
      return c.json(error, 403);
    }

    const usage = await getAPIKeyUsage(c.env, keyId);
    
    if (!usage) {
      const error: APIError = {
        error: {
          message: 'API key not found',
          type: 'invalid_request_error',
          code: 'key_not_found'
        }
      };
      return c.json(error, 404);
    }

    // Get rate limit status
    const rateLimitStatus = await getRateLimitStatus(
      c.env,
      keyId,
      apiKey.rateLimit || {
        requestsPerMinute: parseInt(c.env.MAX_REQUESTS_PER_MINUTE),
        requestsPerHour: parseInt(c.env.MAX_REQUESTS_PER_HOUR),
        requestsPerDay: parseInt(c.env.MAX_REQUESTS_PER_DAY)
      }
    );

    return c.json({
      keyId,
      usage: usage.requests,
      lastUsed: usage.lastUsed,
      rateLimit: rateLimitStatus
    });

  } catch (error) {
    console.error('API key usage error:', error);
    
    const apiError: APIError = {
      error: {
        message: 'Failed to get API key usage',
        type: 'api_error',
        code: 'usage_error'
      }
    };
    return c.json(apiError, 500);
  }
}

/**
 * Handle current API key info (for the authenticated key)
 */
export async function handleCurrentAPIKey(c: Context<{ Bindings: Env }>) {
  try {
    const apiKey = c.get('apiKey');
    
    if (!apiKey) {
      const error: APIError = {
        error: {
          message: 'No API key found in request',
          type: 'authentication_error',
          code: 'missing_api_key'
        }
      };
      return c.json(error, 401);
    }

    // Get usage statistics
    const usage = await getAPIKeyUsage(c.env, apiKey.id);
    
    // Get rate limit status
    const rateLimitStatus = await getRateLimitStatus(
      c.env,
      apiKey.id,
      apiKey.rateLimit || {
        requestsPerMinute: parseInt(c.env.MAX_REQUESTS_PER_MINUTE),
        requestsPerHour: parseInt(c.env.MAX_REQUESTS_PER_HOUR),
        requestsPerDay: parseInt(c.env.MAX_REQUESTS_PER_DAY)
      }
    );

    // Return key info without the actual key value
    const { key, ...keyInfo } = apiKey;
    
    return c.json({
      ...keyInfo,
      usage: usage?.requests,
      lastUsed: usage?.lastUsed,
      rateLimit: rateLimitStatus
    });

  } catch (error) {
    console.error('Current API key error:', error);
    
    const apiError: APIError = {
      error: {
        message: 'Failed to get current API key info',
        type: 'api_error',
        code: 'current_key_error'
      }
    };
    return c.json(apiError, 500);
  }
}
