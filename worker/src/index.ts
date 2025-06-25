import { Hono } from 'hono';
import { Env } from './types';

// Middleware imports
import {
  corsMiddleware,
  securityHeadersMiddleware,
  requestIdMiddleware,
  loggingMiddleware,
  errorHandlingMiddleware
} from './middleware/cors';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rate-limit';

// Handler imports
import { handleOpenAIChatCompletions, handleClaudeMessages } from './handlers/chat';
import { handleModels, handleModelDetails } from './handlers/models';
import {
  handleCreateAPIKey,
  handleListAPIKeys,
  handleRevokeAPIKey,
  handleAPIKeyUsage,
  handleCurrentAPIKey
} from './handlers/keys';
import {
  handleHealth,
  handleReadiness,
  handleLiveness,
  handleMetrics
} from './handlers/health';

// Create Hono app
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', errorHandlingMiddleware);
app.use('*', corsMiddleware);
app.use('*', securityHeadersMiddleware);
app.use('*', requestIdMiddleware);
app.use('*', loggingMiddleware);

// Health endpoints (no auth required) - both versioned and unversioned
app.get('/health', handleHealth);
app.get('/v1/health', handleHealth);
app.get('/health/ready', handleReadiness);
app.get('/v1/health/ready', handleReadiness);
app.get('/health/live', handleLiveness);
app.get('/v1/health/live', handleLiveness);
app.get('/metrics', handleMetrics);
app.get('/v1/metrics', handleMetrics);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Puter Claude API Proxy',
    version: '1.0.0',
    description: 'A comprehensive API wrapper for Puter.com\'s free Claude API service',
    endpoints: {
      openai: {
        chat_completions: ['POST /v1/chat/completions', 'POST /chat/completions'],
        models: ['GET /v1/models', 'GET /models']
      },
      claude: {
        messages: ['POST /v1/messages', 'POST /messages']
      },
      management: {
        create_key: ['POST /v1/keys', 'POST /keys'],
        list_keys: ['GET /v1/keys', 'GET /keys'],
        revoke_key: ['DELETE /v1/keys/:keyId', 'DELETE /keys/:keyId'],
        key_usage: ['GET /v1/keys/:keyId/usage', 'GET /keys/:keyId/usage'],
        current_key: ['GET /v1/keys/current', 'GET /keys/current']
      },
      health: {
        health: ['GET /health', 'GET /v1/health'],
        readiness: ['GET /health/ready', 'GET /v1/health/ready'],
        liveness: ['GET /health/live', 'GET /v1/health/live'],
        metrics: ['GET /metrics', 'GET /v1/metrics']
      }
    },
    features: [
      'OpenAI SDK Compatible',
      'Anthropic SDK Compatible',
      'Free Claude Access via Puter.com',
      'Rate Limiting & API Key Management',
      'Both versioned (/v1/*) and unversioned endpoints'
    ],
    documentation: 'https://your-docs-site.pages.dev',
    github: 'https://github.com/yourusername/puter-claude-api-proxy'
  });
});

// Apply auth and rate limiting to protected endpoints (both versioned and unversioned)
app.use('/v1/*', authMiddleware);
app.use('/v1/*', rateLimitMiddleware);
app.use('/chat/*', authMiddleware);
app.use('/chat/*', rateLimitMiddleware);
app.use('/messages', authMiddleware);
app.use('/messages', rateLimitMiddleware);
app.use('/keys', authMiddleware);
app.use('/keys/*', authMiddleware);

// OpenAI-compatible endpoints - both versioned and unversioned
app.post('/v1/chat/completions', handleOpenAIChatCompletions);
app.post('/chat/completions', handleOpenAIChatCompletions);
app.get('/v1/models', handleModels);
app.get('/models', handleModels);
app.get('/v1/models/:model', handleModelDetails);
app.get('/models/:model', handleModelDetails);

// Claude-compatible endpoints - both versioned and unversioned
app.post('/v1/messages', handleClaudeMessages);
app.post('/messages', handleClaudeMessages);

// API key management endpoints - both versioned and unversioned
app.post('/v1/keys', handleCreateAPIKey);
app.post('/keys', handleCreateAPIKey);
app.get('/v1/keys', handleListAPIKeys);
app.get('/keys', handleListAPIKeys);
app.delete('/v1/keys/:keyId', handleRevokeAPIKey);
app.delete('/keys/:keyId', handleRevokeAPIKey);
app.get('/v1/keys/:keyId/usage', handleAPIKeyUsage);
app.get('/keys/:keyId/usage', handleAPIKeyUsage);
app.get('/v1/keys/current', handleCurrentAPIKey);
app.get('/keys/current', handleCurrentAPIKey);

// Legacy OpenAI endpoints (redirects)
app.post('/v1/completions', (c) => {
  return c.json({
    error: {
      message: 'The /v1/completions endpoint is deprecated. Please use /v1/chat/completions instead.',
      type: 'invalid_request_error',
      code: 'endpoint_deprecated'
    }
  }, 410);
});

// Handle 404s
app.notFound((c) => {
  return c.json({
    error: {
      message: 'Endpoint not found',
      type: 'invalid_request_error',
      code: 'endpoint_not_found'
    }
  }, 404);
});

// Handle method not allowed
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  
  return c.json({
    error: {
      message: 'Internal server error',
      type: 'internal_error',
      code: 'internal_server_error',
      request_id: c.get('requestId')
    }
  }, 500);
});

// Export the app
export default app;
