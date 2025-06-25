import { Context } from 'hono';
import { Env, ModelInfo } from '../types';
import { puterClient } from '../utils/puter-client';

/**
 * Handle models listing endpoint (OpenAI compatible)
 */
export async function handleModels(c: Context<{ Bindings: Env }>) {
  try {
    // Get available models from Puter
    const puterModels = await puterClient.getModels();
    
    // Transform to OpenAI format
    const models: ModelInfo[] = puterModels.map(modelId => ({
      id: modelId,
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: getModelOwner(modelId),
      permission: [{
        id: `modelperm-${modelId}`,
        object: 'model_permission',
        created: Math.floor(Date.now() / 1000),
        allow_create_engine: false,
        allow_sampling: true,
        allow_logprobs: false,
        allow_search_indices: false,
        allow_view: true,
        allow_fine_tuning: false,
        organization: '*',
        group: null,
        is_blocking: false
      }]
    }));

    return c.json({
      object: 'list',
      data: models
    });

  } catch (error) {
    console.error('Models listing error:', error);
    
    return c.json({
      error: {
        message: 'Failed to retrieve models',
        type: 'api_error',
        code: 'models_error'
      }
    }, 500);
  }
}

/**
 * Get model owner/provider based on model ID
 */
function getModelOwner(modelId: string): string {
  if (modelId.startsWith('claude')) {
    return 'anthropic';
  } else if (modelId.startsWith('gpt') || modelId.startsWith('o1') || modelId.startsWith('o3') || modelId.startsWith('o4')) {
    return 'openai';
  } else if (modelId.startsWith('deepseek')) {
    return 'deepseek';
  } else if (modelId.startsWith('gemini')) {
    return 'google';
  } else if (modelId.includes('llama')) {
    return 'meta';
  } else if (modelId.startsWith('mistral') || modelId.startsWith('pixtral') || modelId.startsWith('codestral')) {
    return 'mistralai';
  } else if (modelId.includes('gemma')) {
    return 'google';
  } else if (modelId.startsWith('grok')) {
    return 'xai';
  } else {
    return 'puter';
  }
}

/**
 * Handle model details endpoint
 */
export async function handleModelDetails(c: Context<{ Bindings: Env }>) {
  try {
    const modelId = c.req.param('model');
    
    if (!modelId) {
      return c.json({
        error: {
          message: 'Model ID is required',
          type: 'invalid_request_error',
          code: 'missing_model_id'
        }
      }, 400);
    }

    // Get available models from Puter
    const puterModels = await puterClient.getModels();
    
    // Check if model exists
    if (!puterModels.includes(modelId)) {
      return c.json({
        error: {
          message: `Model '${modelId}' not found`,
          type: 'invalid_request_error',
          code: 'model_not_found'
        }
      }, 404);
    }

    // Return model details
    const model: ModelInfo = {
      id: modelId,
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: getModelOwner(modelId),
      permission: [{
        id: `modelperm-${modelId}`,
        object: 'model_permission',
        created: Math.floor(Date.now() / 1000),
        allow_create_engine: false,
        allow_sampling: true,
        allow_logprobs: false,
        allow_search_indices: false,
        allow_view: true,
        allow_fine_tuning: false,
        organization: '*',
        group: null,
        is_blocking: false
      }]
    };

    return c.json(model);

  } catch (error) {
    console.error('Model details error:', error);
    
    return c.json({
      error: {
        message: 'Failed to retrieve model details',
        type: 'api_error',
        code: 'model_details_error'
      }
    }, 500);
  }
}

/**
 * Get model capabilities and information
 */
export async function getModelCapabilities() {
  return {
    'claude-sonnet-4': {
      name: 'Claude Sonnet 4',
      description: 'Optimal balance of intelligence, cost, and speed for most applications',
      provider: 'anthropic',
      capabilities: ['text', 'vision', 'function_calling'],
      context_window: 200000,
      max_output_tokens: 4096,
      supports_streaming: true,
      supports_tools: true
    },
    'claude-opus-4': {
      name: 'Claude Opus 4',
      description: 'Most intelligent model for complex tasks, with the best performance for reasoning, coding, and content generation',
      provider: 'anthropic',
      capabilities: ['text', 'vision', 'function_calling'],
      context_window: 200000,
      max_output_tokens: 4096,
      supports_streaming: true,
      supports_tools: true
    },
    'claude-3-5-sonnet': {
      name: 'Claude 3.5 Sonnet',
      description: 'High-performance model balancing intelligence and speed',
      provider: 'anthropic',
      capabilities: ['text', 'vision', 'function_calling'],
      context_window: 200000,
      max_output_tokens: 4096,
      supports_streaming: true,
      supports_tools: true
    },
    'gpt-4o': {
      name: 'GPT-4o',
      description: 'OpenAI\'s flagship model with multimodal capabilities',
      provider: 'openai',
      capabilities: ['text', 'vision', 'function_calling'],
      context_window: 128000,
      max_output_tokens: 4096,
      supports_streaming: true,
      supports_tools: true
    },
    'gpt-4o-mini': {
      name: 'GPT-4o Mini',
      description: 'Faster and more affordable version of GPT-4o',
      provider: 'openai',
      capabilities: ['text', 'vision', 'function_calling'],
      context_window: 128000,
      max_output_tokens: 16384,
      supports_streaming: true,
      supports_tools: true
    },
    'o1': {
      name: 'OpenAI o1',
      description: 'Advanced reasoning model for complex problem-solving',
      provider: 'openai',
      capabilities: ['text', 'reasoning'],
      context_window: 200000,
      max_output_tokens: 100000,
      supports_streaming: false,
      supports_tools: false
    },
    'deepseek-chat': {
      name: 'DeepSeek Chat',
      description: 'High-performance chat model from DeepSeek',
      provider: 'deepseek',
      capabilities: ['text', 'function_calling'],
      context_window: 64000,
      max_output_tokens: 4096,
      supports_streaming: true,
      supports_tools: true
    },
    'gemini-2.0-flash': {
      name: 'Gemini 2.0 Flash',
      description: 'Google\'s latest multimodal model',
      provider: 'google',
      capabilities: ['text', 'vision', 'function_calling'],
      context_window: 1000000,
      max_output_tokens: 8192,
      supports_streaming: true,
      supports_tools: true
    }
  };
}
