import { Env, PuterAuthCredentials, PuterAuthStatus } from '../types';

/**
 * Puter Authentication Manager
 * Handles storing, retrieving, and validating Puter authentication credentials
 */
export class PuterAuthManager {
  private static readonly AUTH_KEY = 'puter_credentials';
  private static readonly AUTH_STATUS_KEY = 'puter_auth_status';
  
  constructor(private env: Env) {}

  /**
   * Store Puter authentication credentials
   */
  async storeCredentials(appId: string, authToken: string): Promise<void> {
    const credentials: PuterAuthCredentials = {
      appId,
      authToken,
      createdAt: new Date().toISOString(),
      isValid: true,
      // Puter tokens typically don't have explicit expiration, but we'll track usage
      lastUsed: new Date().toISOString()
    };

    await this.env.PUTER_AUTH.put(
      PuterAuthManager.AUTH_KEY,
      JSON.stringify(credentials)
    );

    console.log('✅ [PUTER_AUTH] Credentials stored successfully');
  }

  /**
   * Get user app token for API calls
   */
  async getUserAppToken(): Promise<string | null> {
    const credentials = await this.getCredentials();
    if (!credentials) {
      return null;
    }

    // If we already have a user app token, return it
    if (credentials.userAppToken) {
      return credentials.userAppToken;
    }

    try {
      console.log('🔍 [PUTER_AUTH] Getting user app token');

      // Get user app token using the auth token
      const response = await fetch('https://api.puter.com/auth/get-user-app-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `puter_auth_token=${credentials.authToken}`,
          'Referer': 'https://puter.com/',
          'Origin': 'https://puter.com'
        },
        body: JSON.stringify({
          app_uid: credentials.appId
        })
      });

      if (response.ok) {
        const tokenData = await response.json();
        const userAppToken = tokenData.token;

        if (userAppToken) {
          // Store the user app token
          credentials.userAppToken = userAppToken;
          await this.env.PUTER_AUTH.put(
            PuterAuthManager.AUTH_KEY,
            JSON.stringify(credentials)
          );

          console.log('✅ [PUTER_AUTH] User app token obtained and stored');
          return userAppToken;
        }
      }

      console.log('❌ [PUTER_AUTH] Failed to get user app token:', response.status);
      return null;
    } catch (error) {
      console.error('❌ [PUTER_AUTH] Error getting user app token:', error);
      return null;
    }
  }

  /**
   * Retrieve stored Puter authentication credentials
   */
  async getCredentials(): Promise<PuterAuthCredentials | null> {
    try {
      const credentialsData = await this.env.PUTER_AUTH.get(PuterAuthManager.AUTH_KEY);
      
      if (!credentialsData) {
        console.log('ℹ️ [PUTER_AUTH] No credentials found');
        return null;
      }

      const credentials: PuterAuthCredentials = JSON.parse(credentialsData);
      
      // Update last used timestamp
      credentials.lastUsed = new Date().toISOString();
      await this.env.PUTER_AUTH.put(
        PuterAuthManager.AUTH_KEY,
        JSON.stringify(credentials)
      );

      console.log('✅ [PUTER_AUTH] Credentials retrieved successfully');
      return credentials;
    } catch (error) {
      console.error('❌ [PUTER_AUTH] Error retrieving credentials:', error);
      return null;
    }
  }

  /**
   * Validate stored credentials by making a test API call
   */
  async validateCredentials(): Promise<PuterAuthStatus> {
    const credentials = await this.getCredentials();
    
    if (!credentials) {
      return {
        isAuthenticated: false,
        error: 'No credentials stored'
      };
    }

    try {
      console.log('🔍 [PUTER_AUTH] Validating credentials with test API call');

      // Use cookie-based authentication (working approach)

      // Make a test API call to validate the credentials
      const testPayload = {
        interface: 'puter-chat-completion',
        method: 'complete',
        test_mode: false,
        args: {
          messages: [{ role: 'user', content: 'test' }],
          model: 'claude-3-5-sonnet',
          max_tokens: 1
        }
      };

      const response = await fetch('https://api.puter.com/drivers/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `puter_auth_token=${credentials.authToken}`,
          'User-Agent': 'PuterProxy/1.0',
          'Referer': 'https://puter.com/',
          'Origin': 'https://puter.com'
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000)
      });

      const isValid = response.ok || response.status === 429; // 429 = rate limited but auth is valid
      
      // Update credential validity
      credentials.isValid = isValid;
      credentials.lastUsed = new Date().toISOString();
      
      await this.env.PUTER_AUTH.put(
        PuterAuthManager.AUTH_KEY,
        JSON.stringify(credentials)
      );

      if (isValid) {
        console.log('✅ [PUTER_AUTH] Credentials validation successful');
        return {
          isAuthenticated: true,
          appId: credentials.appId,
          lastUsed: credentials.lastUsed,
          expiresAt: credentials.expiresAt
        };
      } else {
        console.log('❌ [PUTER_AUTH] Credentials validation failed:', response.status, response.statusText);
        const errorText = await response.text().catch(() => 'Unknown error');
        return {
          isAuthenticated: false,
          appId: credentials.appId,
          error: `Validation failed: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`
        };
      }
    } catch (error) {
      console.error('❌ [PUTER_AUTH] Credentials validation error:', error);
      return {
        isAuthenticated: false,
        appId: credentials?.appId,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  /**
   * Clear stored credentials
   */
  async clearCredentials(): Promise<void> {
    await this.env.PUTER_AUTH.delete(PuterAuthManager.AUTH_KEY);
    await this.env.PUTER_AUTH.delete(PuterAuthManager.AUTH_STATUS_KEY);
    console.log('✅ [PUTER_AUTH] Credentials cleared');
  }

  /**
   * Get authentication status without making external calls
   */
  async getAuthStatus(): Promise<PuterAuthStatus> {
    const credentials = await this.getCredentials();
    
    if (!credentials) {
      return {
        isAuthenticated: false,
        error: 'No credentials stored'
      };
    }

    return {
      isAuthenticated: credentials.isValid,
      appId: credentials.appId,
      lastUsed: credentials.lastUsed,
      expiresAt: credentials.expiresAt,
      error: credentials.isValid ? undefined : 'Credentials marked as invalid'
    };
  }

  /**
   * Refresh authentication token (if Puter supports token refresh)
   * This attempts to refresh the token using Puter's authentication API
   */
  async refreshToken(): Promise<boolean> {
    console.log('🔄 [PUTER_AUTH] Attempting token refresh');

    const credentials = await this.getCredentials();
    if (!credentials) {
      console.log('❌ [PUTER_AUTH] No credentials to refresh');
      return false;
    }

    try {
      // Attempt to refresh using Puter's auth API
      // This is based on typical OAuth2/JWT refresh patterns
      const refreshPayload = {
        grant_type: 'refresh_token',
        app_id: credentials.appId,
        refresh_token: credentials.authToken
      };

      console.log('🔄 [PUTER_AUTH] Making refresh request to Puter auth API');
      const response = await fetch('https://api.puter.com/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PuterProxy/1.0'
        },
        body: JSON.stringify(refreshPayload),
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const refreshData = await response.json();

        // Update credentials with new token
        if (refreshData.access_token || refreshData.auth_token) {
          const newToken = refreshData.access_token || refreshData.auth_token;
          await this.storeCredentials(credentials.appId, newToken);
          console.log('✅ [PUTER_AUTH] Token refreshed successfully');
          return true;
        }
      }

      console.log('⚠️ [PUTER_AUTH] Token refresh not supported or failed:', response.status);
      return false;
    } catch (error) {
      console.log('⚠️ [PUTER_AUTH] Token refresh error (may not be supported):', error);
      return false;
    }
  }

  /**
   * Get authentication headers for Puter API calls
   */
  async getAuthHeaders(): Promise<Record<string, string> | null> {
    const credentials = await this.getCredentials();

    if (!credentials || !credentials.isValid) {
      return null;
    }

    return {
      'Content-Type': 'application/json',
      'Cookie': `puter_auth_token=${credentials.authToken}`,
      'User-Agent': 'PuterProxy/1.0',
      'Referer': 'https://puter.com/',
      'Origin': 'https://puter.com'
    };
  }
}
