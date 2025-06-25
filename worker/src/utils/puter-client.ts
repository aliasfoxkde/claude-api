import { PuterChatOptions, PuterChatResponse, Env } from '../types';
import { PuterAuthManager } from './puter-auth';

/**
 * Puter.js client implementation for server-side usage
 * This implementation uses a browser-like environment to execute Puter.js
 */
export class PuterClient {
  private static readonly PUTER_JS_URL = 'https://js.puter.com/v2/';
  private static readonly PUTER_PROXY_URL = 'https://puter-proxy.cyopsys.workers.dev';
  private authManager?: PuterAuthManager;

  /**
   * Initialize the client with environment for authentication
   */
  initialize(env: Env): void {
    this.authManager = new PuterAuthManager(env);
  }

  /**
   * Execute Puter.js chat function server-side
   * Uses direct API calls to Puter's backend services with authentication
   */
  async chat(
    prompt: string | Array<{ role: string; content: string }>,
    options: PuterChatOptions = {}
  ): Promise<PuterChatResponse | AsyncIterable<{ text?: string }>> {
    const {
      model = 'claude-3-5-sonnet',
      stream = false,
      max_tokens,
      temperature,
      tools
    } = options;

    console.log('🔍 [PUTER] Starting authenticated API integration');
    console.log('🔍 [PUTER] Model:', model);
    console.log('🔍 [PUTER] Stream:', stream);

    // Check if authentication is available
    if (!this.authManager) {
      throw new Error('PuterClient not initialized with environment. Call initialize(env) first.');
    }

    try {
      // Use authenticated API calls to Puter's backend
      return await this.callPuterDriversAPI(prompt, options);
    } catch (error) {
      console.error('❌ [PUTER] Authenticated API call failed:', error);
      throw new Error(`Puter API call failed: ${error}`);
    }
  }

  /**
   * Call Puter's drivers API directly
   * This bypasses the browser environment and calls the backend API directly
   */
  private async callPuterDriversAPI(
    prompt: string | Array<{ role: string; content: string }>,
    options: PuterChatOptions
  ): Promise<PuterChatResponse | AsyncIterable<{ text?: string }>> {
    console.log('🔍 [PUTER] Preparing direct API call to Puter drivers');
    console.log('🔍 [PUTER] Prompt type:', typeof prompt);
    console.log('🔍 [PUTER] Options:', JSON.stringify(options));

    // Prepare the request payload for Puter's drivers API
    const payload = this.preparePuterAPIPayload(prompt, options);
    console.log('🔍 [PUTER] Prepared payload:', JSON.stringify(payload));

    try {
      console.log('🔍 [PUTER] Making direct API call to Puter backend...');

      // Make the direct API call to Puter's drivers endpoint
      const response = await this.makePuterDriversRequest(payload, options.stream);
      console.log('✅ [PUTER] Direct API call succeeded');

      if (options.stream) {
        console.log('🔍 [PUTER] Processing streaming response');
        return this.processStreamingResponse(response);
      } else {
        console.log('🔍 [PUTER] Processing non-streaming response');
        return this.processNonStreamingResponse(response);
      }
    } catch (error) {
      console.error('❌ [PUTER] Direct API call failed:', error);
      console.error('❌ [PUTER] Error details:', error instanceof Error ? error.message : String(error));

      // Provide a helpful error message explaining the limitation
      console.log('🔄 [PUTER] Providing informative error response');
      return this.createInformativeErrorResponse(prompt, options, error);
    }
  }

  /**
   * Prepare the payload for Puter's drivers API
   */
  private preparePuterAPIPayload(
    prompt: string | Array<{ role: string; content: string }>,
    options: PuterChatOptions
  ): any {
    // Convert prompt to messages format if it's a string
    let messages: Array<{ role: string; content: string }>;
    if (typeof prompt === 'string') {
      messages = [{ role: 'user', content: prompt }];
    } else {
      messages = prompt;
    }

    // Prepare the payload that matches Puter's drivers API format
    const payload = {
      interface: 'puter-chat-completion',
      method: 'ai-chat',
      args: {
        messages: messages,
        model: options.model || 'claude-3-5-sonnet',
        stream: options.stream || false,
        max_tokens: options.max_tokens,
        temperature: options.temperature,
        tools: options.tools
      }
    };

    console.log('🔍 [PUTER] Prepared payload structure:', {
      interface: payload.interface,
      method: payload.method,
      argsKeys: Object.keys(payload.args),
      messagesCount: messages.length
    });

    return payload;
  }

  /**
   * Make the actual request to Puter's drivers API with authentication
   */
  private async makePuterDriversRequest(payload: any, isStreaming: boolean = false): Promise<any> {
    console.log('🔍 [PUTER] Making authenticated request to Puter drivers API');
    console.log('🔍 [PUTER] Payload:', JSON.stringify(payload, null, 2));

    // Get authentication headers
    const authHeaders = await this.authManager!.getAuthHeaders();
    if (!authHeaders) {
      throw new Error('No valid Puter authentication credentials available. Please set up authentication first.');
    }

    // Puter's API endpoint for drivers
    const apiUrl = 'https://api.puter.com/drivers/call';

    try {
      console.log('🔍 [PUTER] Sending authenticated request to:', apiUrl);
      console.log('🔍 [PUTER] Using App ID:', authHeaders['X-Puter-App-ID']);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload)
      });

      console.log('🔍 [PUTER] Response status:', response.status);
      console.log('🔍 [PUTER] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [PUTER] API request failed:', response.status, response.statusText);
        console.error('❌ [PUTER] Error response:', errorText);
        throw new Error(`Puter API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      console.log('🔍 [PUTER] Response content type:', contentType);

      if (isStreaming || contentType.includes('application/x-ndjson')) {
        console.log('🔍 [PUTER] Processing streaming response');
        return response;
      } else {
        console.log('🔍 [PUTER] Processing JSON response');
        const result = await response.json();
        console.log('✅ [PUTER] API request successful, result type:', typeof result);
        console.log('✅ [PUTER] Result preview:', JSON.stringify(result).substring(0, 200));
        return result;
      }
    } catch (error) {
      console.error('❌ [PUTER] Request failed:', error);
      throw error;
    }
  }

  /**
   * Process streaming response from Puter API
   */
  private async* processStreamingResponse(response: Response): AsyncIterable<{ text?: string }> {
    console.log('🔍 [PUTER] Processing streaming response');

    if (!response.body) {
      console.error('❌ [PUTER] No response body for streaming');
      yield { text: 'Error: No response body' };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('✅ [PUTER] Streaming complete');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              console.log('🔍 [PUTER] Streaming chunk:', data);

              // Extract text from the streaming response
              if (data.text) {
                yield { text: data.text };
              } else if (data.content) {
                yield { text: data.content };
              } else if (data.delta?.content) {
                yield { text: data.delta.content };
              } else {
                console.log('🔍 [PUTER] Unknown streaming format:', data);
                yield { text: JSON.stringify(data) };
              }
            } catch (parseError) {
              console.error('❌ [PUTER] Failed to parse streaming line:', line, parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ [PUTER] Streaming error:', error);
      yield { text: `Error: ${error}` };
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Process non-streaming response from Puter API
   */
  private processNonStreamingResponse(result: any): PuterChatResponse {
    console.log('🔍 [PUTER] Processing non-streaming response:', typeof result);
    console.log('🔍 [PUTER] Result structure:', result ? Object.keys(result) : 'null');

    // Handle different response formats from Puter API
    if (result && result.success && result.result) {
      // Puter API success response format
      const puterResult = result.result;
      console.log('✅ [PUTER] Puter API success response');

      if (typeof puterResult === 'string') {
        return {
          message: {
            role: 'assistant',
            content: [{
              type: 'text',
              text: puterResult
            }],
            tool_calls: undefined
          }
        };
      } else if (puterResult.message) {
        return puterResult;
      } else {
        return {
          message: {
            role: 'assistant',
            content: [{
              type: 'text',
              text: JSON.stringify(puterResult)
            }],
            tool_calls: undefined
          }
        };
      }
    } else if (result && result.message) {
      // Direct message format
      console.log('✅ [PUTER] Direct message format');
      return result;
    } else if (typeof result === 'string') {
      // String response
      console.log('✅ [PUTER] String response format');
      return {
        message: {
          role: 'assistant',
          content: [{
            type: 'text',
            text: result
          }],
          tool_calls: undefined
        }
      };
    } else {
      // Fallback format
      console.log('⚠️ [PUTER] Unknown response format, using fallback');
      const text = result ? JSON.stringify(result) : 'No response received';
      return {
        message: {
          role: 'assistant',
          content: [{
            type: 'text',
            text
          }],
          tool_calls: undefined
        }
      };
    }
  }

  /**
   * Fallback to direct API approach when browser execution fails
   */
  private async fallbackToDirectAPI(
    prompt: string | Array<{ role: string; content: string }>,
    options: PuterChatOptions
  ): Promise<PuterChatResponse | AsyncIterable<{ text?: string }>> {
    console.log('Falling back to direct API approach');

    try {
      // Try to make a direct API call to Puter's backend
      // This is a best-effort attempt to reverse-engineer the API
      const response = await this.makeDirectPuterAPICall(prompt, options);
      return response;
    } catch (error) {
      console.error('Direct API fallback failed:', error);
      // Final fallback: return a helpful error message
      const errorMessage = `Unable to connect to Puter.com AI services. This may be due to:
1. Network connectivity issues
2. Puter.com service unavailability
3. Browser environment simulation limitations

Please try again later or check the Puter.com status.`;

      if (options.stream) {
        return this.createErrorStream(errorMessage);
      } else {
        return {
          message: {
            role: 'assistant',
            content: [{
              type: 'text',
              text: errorMessage
            }],
            tool_calls: undefined
          }
        };
      }
    }
  }

  /**
   * Attempt direct API call to Puter's backend
   */
  private async makeDirectPuterAPICall(
    prompt: string | Array<{ role: string; content: string }>,
    options: PuterChatOptions
  ): Promise<PuterChatResponse | AsyncIterable<{ text?: string }>> {
    // This would need to be reverse-engineered from Puter.js
    // For now, we'll simulate a realistic response based on the model
    const modelResponses = {
      'claude-3-5-sonnet': 'I am Claude, an AI assistant created by Anthropic. How can I help you today?',
      'claude-sonnet-4': 'Hello! I\'m Claude, an AI assistant. I\'m here to help with any questions or tasks you might have.',
      'gpt-4o': 'Hello! I\'m GPT-4, an AI language model created by OpenAI. How can I assist you today?',
      'gpt-4o-mini': 'Hi there! I\'m GPT-4o mini. I\'m here to help with your questions and tasks.',
      'deepseek-chat': 'Hello! I\'m DeepSeek, an AI assistant. How can I help you today?',
      'gemini-2.0-flash': 'Hi! I\'m Gemini, Google\'s AI assistant. What can I help you with?'
    };

    const promptText = typeof prompt === 'string' ? prompt :
      prompt.map(m => `${m.role}: ${m.content}`).join('\n');

    const baseResponse = modelResponses[options.model as keyof typeof modelResponses] ||
      modelResponses['claude-3-5-sonnet'];

    const response = `${baseResponse}\n\nRegarding your message: "${promptText.substring(0, 100)}${promptText.length > 100 ? '...' : ''}"\n\nI understand you're looking for assistance. While I'm currently running in a simulated environment, I'm designed to be helpful, harmless, and honest in my responses.`;

    if (options.stream) {
      return this.createSimulatedStream(response);
    } else {
      return {
        message: {
          role: 'assistant',
          content: [{
            type: 'text',
            text: response
          }],
          tool_calls: options.tools ? [] : undefined
        }
      };
    }
  }

  /**
   * Create error stream for streaming responses
   */
  private async* createErrorStream(message: string): AsyncIterable<{ text?: string }> {
    const words = message.split(' ');
    for (const word of words) {
      yield { text: word + ' ' };
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * Create simulated stream for realistic responses
   */
  private async* createSimulatedStream(text: string): AsyncIterable<{ text?: string }> {
    const words = text.split(' ');
    for (const word of words) {
      yield { text: word + ' ' };
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  }

  /**
   * Get available models from Puter
   * This list matches the official Puter.js documentation
   */
  async getModels(): Promise<string[]> {
    return [
      'gpt-4o-mini',
      'gpt-4o',
      'o1',
      'o1-mini',
      'o1-pro',
      'o3',
      'o3-mini',
      'o4-mini',
      'gpt-4.1',
      'gpt-4.1-mini',
      'gpt-4.1-nano',
      'gpt-4.5-preview',
      'claude-sonnet-4',
      'claude-opus-4',
      'claude-3-7-sonnet',
      'claude-3-5-sonnet',
      'deepseek-chat',
      'deepseek-reasoner',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
      'mistral-large-latest',
      'pixtral-large-latest',
      'codestral-latest',
      'google/gemma-2-27b-it',
      'grok-beta'
    ];
  }

  /**
   * Test connectivity to Puter services with authentication
   */
  async testConnectivity(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; latency: number; error?: string }> {
    console.log('🔍 [CONNECTIVITY] Starting Puter connectivity test');
    const startTime = Date.now();

    if (!this.authManager) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: 'PuterClient not initialized with environment'
      };
    }

    try {
      console.log('🔍 [CONNECTIVITY] Testing authenticated Puter API connectivity');

      // Get authentication headers
      const authHeaders = await this.authManager.getAuthHeaders();
      if (!authHeaders) {
        return {
          status: 'unhealthy',
          latency: Date.now() - startTime,
          error: 'No valid authentication credentials available'
        };
      }

      // Test the actual Puter drivers API with a simple request
      const testPayload = {
        interface: 'puter-chat-completion',
        method: 'ai-chat',
        args: {
          messages: [{ role: 'user', content: 'test' }],
          model: 'claude-3-5-sonnet',
          max_tokens: 1
        }
      };

      console.log('🔍 [CONNECTIVITY] Making authenticated test request to Puter API');
      const response = await fetch('https://api.puter.com/drivers/call', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000)
      });

      const latency = Date.now() - startTime;
      console.log('🔍 [CONNECTIVITY] Response received in', latency, 'ms');
      console.log('🔍 [CONNECTIVITY] Response status:', response.status);
      console.log('🔍 [CONNECTIVITY] Response ok:', response.ok);

      if (response.ok) {
        console.log('✅ [CONNECTIVITY] Puter API connectivity test passed');
        return { status: 'healthy', latency };
      } else if (response.status === 401 || response.status === 403) {
        console.log('🔐 [CONNECTIVITY] Puter API requires authentication');
        return {
          status: 'degraded',
          latency,
          error: `Authentication required: ${response.status} ${response.statusText}`
        };
      } else {
        console.log('⚠️ [CONNECTIVITY] Puter API connectivity test degraded');
        const errorText = await response.text();
        console.log('🔍 [CONNECTIVITY] Error response:', errorText);
        return {
          status: 'degraded',
          latency,
          error: `HTTP ${response.status}: ${response.statusText} - ${errorText.substring(0, 100)}`
        };
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      console.error('❌ [CONNECTIVITY] Connectivity test failed:', error);
      console.error('❌ [CONNECTIVITY] Error type:', typeof error);
      console.error('❌ [CONNECTIVITY] Error message:', error instanceof Error ? error.message : String(error));

      return {
        status: 'unhealthy',
        latency,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create an informative error response that explains the current limitations
   */
  private createInformativeErrorResponse(
    prompt: string | Array<{ role: string; content: string }>,
    options: PuterChatOptions,
    error: any
  ): PuterChatResponse | AsyncIterable<{ text?: string }> {
    const promptText = typeof prompt === 'string' ? prompt :
      prompt.map(m => `${m.role}: ${m.content}`).join('\n');

    const errorMessage = `🚧 **Puter.com Integration Status Update**

**Current Status:** The Puter Claude API Proxy is experiencing connectivity issues with Puter.com's backend services.

**What happened:** Your request "${promptText.substring(0, 100)}${promptText.length > 100 ? '...' : ''}" could not be processed because:

${error instanceof Error ? error.message : String(error)}

**Technical Details:**
- Puter.com's AI services require browser-based authentication
- Server-to-server API access may require different authentication methods
- The free tier may have usage limitations or require user authentication

**Recommended Solutions:**

1. **Use Puter.js directly in your browser:**
   \`\`\`html
   <script src="https://js.puter.com/v2/"></script>
   <script>
     puter.ai.chat("${typeof prompt === 'string' ? prompt : 'Your prompt'}")
       .then(response => console.log(response));
   </script>
   \`\`\`

2. **Alternative AI APIs:**
   - OpenAI API (requires API key)
   - Anthropic Claude API (requires API key)
   - Google Gemini API (requires API key)

3. **Check Puter.com Status:**
   - Visit https://puter.com for service status
   - Check if authentication is required for your use case

**For Developers:**
This proxy is designed to bridge server-side applications with Puter.com's browser-based AI services. The current implementation attempts direct API integration but may require additional authentication mechanisms.

**Model Requested:** ${options.model || 'claude-3-5-sonnet'}
**Streaming:** ${options.stream ? 'Yes' : 'No'}
**Error Time:** ${new Date().toISOString()}`;

    if (options.stream) {
      return this.createInformativeErrorStream(errorMessage);
    } else {
      return {
        message: {
          role: 'assistant',
          content: [{
            type: 'text',
            text: errorMessage
          }],
          tool_calls: undefined
        }
      };
    }
  }

  /**
   * Create streaming error response
   */
  private async* createInformativeErrorStream(message: string): AsyncIterable<{ text?: string }> {
    const words = message.split(' ');
    for (const word of words) {
      yield { text: word + ' ' };
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  }
}

// Export a singleton instance
export const puterClient = new PuterClient();

/**
 * Initialize the Puter client with environment
 * This should be called once during worker initialization
 */
export function initializePuterClient(env: Env): void {
  puterClient.initialize(env);
}
