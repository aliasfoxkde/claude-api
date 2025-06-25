import { Context } from 'hono';
import { z } from 'zod';
import { Env, APIError } from '../types';
import { PuterAuthManager } from '../utils/puter-auth';

// Validation schema for authentication setup
const authSetupSchema = z.object({
  appId: z.string().min(1, 'App ID is required'),
  authToken: z.string().min(1, 'Auth token is required')
});

/**
 * Setup Puter authentication credentials
 * This endpoint allows administrators to configure Puter authentication
 */
export async function handlePuterAuthSetup(c: Context<{ Bindings: Env }>) {
  try {
    const requestBody = await c.req.json();
    
    // Validate request
    const validationResult = authSetupSchema.safeParse(requestBody);
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

    const { appId, authToken } = validationResult.data;
    const authManager = new PuterAuthManager(c.env);

    // Store the credentials
    await authManager.storeCredentials(appId, authToken);

    // Validate the credentials immediately
    const authStatus = await authManager.validateCredentials();

    if (authStatus.isAuthenticated) {
      return c.json({
        success: true,
        message: 'Puter authentication configured successfully',
        status: authStatus
      });
    } else {
      // Credentials were stored but validation failed
      return c.json({
        success: false,
        message: 'Credentials stored but validation failed',
        status: authStatus,
        warning: 'The provided credentials may be invalid or expired'
      }, 400);
    }
  } catch (error) {
    console.error('Puter auth setup error:', error);
    
    const apiError: APIError = {
      error: {
        message: 'Failed to setup Puter authentication',
        type: 'api_error',
        code: 'auth_setup_error'
      }
    };
    return c.json(apiError, 500);
  }
}

/**
 * Get current Puter authentication status
 */
export async function handlePuterAuthStatus(c: Context<{ Bindings: Env }>) {
  try {
    const authManager = new PuterAuthManager(c.env);
    const authStatus = await authManager.getAuthStatus();

    return c.json({
      success: true,
      status: authStatus
    });
  } catch (error) {
    console.error('Puter auth status error:', error);
    
    const apiError: APIError = {
      error: {
        message: 'Failed to get Puter authentication status',
        type: 'api_error',
        code: 'auth_status_error'
      }
    };
    return c.json(apiError, 500);
  }
}

/**
 * Validate current Puter authentication credentials
 */
export async function handlePuterAuthValidate(c: Context<{ Bindings: Env }>) {
  try {
    const authManager = new PuterAuthManager(c.env);
    const authStatus = await authManager.validateCredentials();

    return c.json({
      success: true,
      status: authStatus,
      message: authStatus.isAuthenticated 
        ? 'Authentication credentials are valid'
        : 'Authentication credentials are invalid or expired'
    });
  } catch (error) {
    console.error('Puter auth validation error:', error);
    
    const apiError: APIError = {
      error: {
        message: 'Failed to validate Puter authentication',
        type: 'api_error',
        code: 'auth_validation_error'
      }
    };
    return c.json(apiError, 500);
  }
}

/**
 * Clear Puter authentication credentials
 */
export async function handlePuterAuthClear(c: Context<{ Bindings: Env }>) {
  try {
    const authManager = new PuterAuthManager(c.env);
    await authManager.clearCredentials();

    return c.json({
      success: true,
      message: 'Puter authentication credentials cleared successfully'
    });
  } catch (error) {
    console.error('Puter auth clear error:', error);
    
    const apiError: APIError = {
      error: {
        message: 'Failed to clear Puter authentication',
        type: 'api_error',
        code: 'auth_clear_error'
      }
    };
    return c.json(apiError, 500);
  }
}

/**
 * Refresh Puter authentication token
 */
export async function handlePuterAuthRefresh(c: Context<{ Bindings: Env }>) {
  try {
    const authManager = new PuterAuthManager(c.env);
    const refreshed = await authManager.refreshToken();

    if (refreshed) {
      const authStatus = await authManager.getAuthStatus();
      return c.json({
        success: true,
        message: 'Authentication token refreshed successfully',
        status: authStatus
      });
    } else {
      return c.json({
        success: false,
        message: 'Token refresh not available or failed',
        note: 'Token refresh may not be supported by Puter.com yet'
      }, 400);
    }
  } catch (error) {
    console.error('Puter auth refresh error:', error);
    
    const apiError: APIError = {
      error: {
        message: 'Failed to refresh Puter authentication',
        type: 'api_error',
        code: 'auth_refresh_error'
      }
    };
    return c.json(apiError, 500);
  }
}
