import {
  OpenAIChatCompletionRequest,
  OpenAIChatCompletionResponse,
  ClaudeMessagesRequest,
  ClaudeMessagesResponse,
  PuterChatOptions,
  PuterChatResponse,
  OpenAIMessage
} from '../types';
import { nanoid } from 'nanoid';

/**
 * Transform OpenAI chat completion request to Puter format
 */
export function transformOpenAIToPuter(request: OpenAIChatCompletionRequest): {
  prompt: string | Array<{ role: string; content: string }>;
  options: PuterChatOptions;
} {
  // Convert OpenAI messages to Puter format
  const messages = request.messages.map(msg => ({
    role: msg.role === 'system' ? 'system' : msg.role,
    content: msg.content || ''
  }));

  // Map OpenAI model names to Puter model names
  const modelMap: Record<string, string> = {
    // OpenAI models
    'gpt-4': 'gpt-4o',
    'gpt-4-turbo': 'gpt-4o',
    'gpt-4-turbo-preview': 'gpt-4o',
    'gpt-3.5-turbo': 'gpt-4o-mini',
    'gpt-3.5-turbo-16k': 'gpt-4o-mini',

    // Claude models (normalize to Puter naming)
    'claude-3-5-sonnet': 'claude-3-5-sonnet',
    'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet',
    'claude-3-5-sonnet-20240620': 'claude-3-5-sonnet',
    'claude-3-sonnet': 'claude-3-5-sonnet',
    'claude-3-sonnet-20240229': 'claude-sonnet-4',
    'claude-3-opus': 'claude-opus-4',
    'claude-3-opus-20240229': 'claude-opus-4',
    'claude-3-haiku': 'claude-sonnet-4',
    'claude-3-haiku-20240307': 'claude-sonnet-4',

    // Anthropic API naming
    'anthropic.claude-3-5-sonnet-20241022-v2:0': 'claude-3-5-sonnet',
    'anthropic.claude-3-sonnet-20240229-v1:0': 'claude-sonnet-4',
    'anthropic.claude-3-opus-20240229-v1:0': 'claude-opus-4',
    'anthropic.claude-3-haiku-20240307-v1:0': 'claude-sonnet-4'
  };

  const puterModel = modelMap[request.model] || request.model;

  // Transform tools if present
  const tools = request.tools?.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters,
      strict: true
    }
  }));

  return {
    prompt: messages.length === 1 ? messages[0].content : messages,
    options: {
      model: puterModel,
      stream: request.stream || false,
      max_tokens: request.max_tokens,
      temperature: request.temperature,
      tools
    }
  };
}

/**
 * Transform Puter response to OpenAI chat completion format
 */
export function transformPuterToOpenAI(
  puterResponse: PuterChatResponse,
  model: string,
  requestId?: string,
  originalPrompt?: string | Array<{ role: string; content: string }>
): OpenAIChatCompletionResponse {
  const content = puterResponse.message.content
    .filter(c => c.type === 'text')
    .map(c => c.text)
    .join('');

  return {
    id: requestId || `chatcmpl-${nanoid()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content,
        tool_calls: puterResponse.message.tool_calls?.map(tc => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments
          }
        }))
      },
      finish_reason: puterResponse.message.tool_calls ? 'tool_calls' : 'stop'
    }],
    usage: {
      prompt_tokens: originalPrompt ? estimateTokenCount(typeof originalPrompt === 'string' ? originalPrompt : JSON.stringify(originalPrompt)) : 0,
      completion_tokens: estimateTokenCount(content),
      total_tokens: 0 // Will be calculated below
    }
  };

  // Calculate total tokens
  response.usage.total_tokens = response.usage.prompt_tokens + response.usage.completion_tokens;

  return response;
}

/**
 * Transform Claude messages request to Puter format
 */
export function transformClaudeToPuter(request: ClaudeMessagesRequest): {
  prompt: string | Array<{ role: string; content: string }>;
  options: PuterChatOptions;
} {
  // Convert Claude messages to Puter format
  const messages: Array<{ role: string; content: string }> = [];
  
  // Add system message if present
  if (request.system) {
    messages.push({ role: 'system', content: request.system });
  }

  // Convert Claude messages
  request.messages.forEach(msg => {
    const content = typeof msg.content === 'string' 
      ? msg.content 
      : msg.content.filter(c => c.type === 'text').map(c => c.text).join('');
    
    messages.push({
      role: msg.role,
      content
    });
  });

  // Map Claude model names to Puter model names (same as OpenAI mapping)
  const modelMap: Record<string, string> = {
    // Claude models (normalize to Puter naming)
    'claude-3-5-sonnet': 'claude-3-5-sonnet',
    'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet',
    'claude-3-5-sonnet-20240620': 'claude-3-5-sonnet',
    'claude-3-sonnet': 'claude-3-5-sonnet',
    'claude-3-sonnet-20240229': 'claude-sonnet-4',
    'claude-3-opus': 'claude-opus-4',
    'claude-3-opus-20240229': 'claude-opus-4',
    'claude-3-haiku': 'claude-sonnet-4',
    'claude-3-haiku-20240307': 'claude-sonnet-4',

    // Anthropic API naming
    'anthropic.claude-3-5-sonnet-20241022-v2:0': 'claude-3-5-sonnet',
    'anthropic.claude-3-sonnet-20240229-v1:0': 'claude-sonnet-4',
    'anthropic.claude-3-opus-20240229-v1:0': 'claude-opus-4',
    'anthropic.claude-3-haiku-20240307-v1:0': 'claude-sonnet-4'
  };

  const puterModel = modelMap[request.model] || request.model;

  // Transform tools if present
  const tools = request.tools?.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
      strict: true
    }
  }));

  return {
    prompt: messages.length === 1 ? messages[0].content : messages,
    options: {
      model: puterModel,
      stream: request.stream || false,
      max_tokens: request.max_tokens,
      temperature: request.temperature,
      tools
    }
  };
}

/**
 * Transform Puter response to Claude messages format
 */
export function transformPuterToClaude(
  puterResponse: PuterChatResponse,
  model: string,
  requestId?: string,
  originalPrompt?: string | Array<{ role: string; content: string }>
): ClaudeMessagesResponse {
  const textContent = puterResponse.message.content
    .filter(c => c.type === 'text')
    .map(c => c.text)
    .join('');

  const content: Array<{ type: 'text' | 'tool_use'; text?: string; id?: string; name?: string; input?: Record<string, any> }> = [
    { type: 'text', text: textContent }
  ];

  // Add tool use content if present
  if (puterResponse.message.tool_calls) {
    puterResponse.message.tool_calls.forEach(tc => {
      content.push({
        type: 'tool_use',
        id: tc.id,
        name: tc.function.name,
        input: JSON.parse(tc.function.arguments)
      });
    });
  }

  return {
    id: requestId || `msg_${nanoid()}`,
    type: 'message',
    role: 'assistant',
    content,
    model,
    stop_reason: puterResponse.message.tool_calls ? 'tool_use' : 'end_turn',
    usage: {
      input_tokens: originalPrompt ? estimateTokenCount(typeof originalPrompt === 'string' ? originalPrompt : JSON.stringify(originalPrompt)) : 0,
      output_tokens: estimateTokenCount(textContent)
    }
  };
}

/**
 * Create streaming response transformer for OpenAI format
 */
export function createOpenAIStreamTransformer(model: string, requestId?: string) {
  const id = requestId || `chatcmpl-${nanoid()}`;
  let isFirst = true;

  return (chunk: { text?: string }) => {
    if (!chunk.text) return '';

    const delta = isFirst 
      ? { role: 'assistant', content: chunk.text }
      : { content: chunk.text };

    isFirst = false;

    const streamChunk = {
      id,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{
        index: 0,
        delta,
        finish_reason: null
      }]
    };

    return `data: ${JSON.stringify(streamChunk)}\n\n`;
  };
}

/**
 * Create streaming response transformer for Claude format
 */
export function createClaudeStreamTransformer(model: string, requestId?: string) {
  const id = requestId || `msg_${nanoid()}`;
  let isFirst = true;

  return (chunk: { text?: string }) => {
    if (!chunk.text) return '';

    if (isFirst) {
      isFirst = false;
      const startEvent = {
        type: 'message_start',
        message: {
          id,
          type: 'message',
          role: 'assistant',
          content: [],
          model,
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 0, output_tokens: 0 }
        }
      };
      return `event: message_start\ndata: ${JSON.stringify(startEvent)}\n\n`;
    }

    const deltaEvent = {
      type: 'content_block_delta',
      index: 0,
      delta: {
        type: 'text_delta',
        text: chunk.text
      }
    };

    return `event: content_block_delta\ndata: ${JSON.stringify(deltaEvent)}\n\n`;
  };
}

/**
 * Validate and sanitize model name
 */
export function validateModel(model: string): string {
  const validModels = [
    'claude-sonnet-4',
    'claude-opus-4',
    'claude-3-5-sonnet',
    'claude-3-7-sonnet',
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
    'deepseek-chat',
    'deepseek-reasoner',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];

  if (validModels.includes(model)) {
    return model;
  }

  // Default to Claude Sonnet 4 for unknown models
  return 'claude-sonnet-4';
}

/**
 * Estimate token count for text
 * This is a rough approximation - actual token counts may vary by model
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;

  // Rough approximation: 1 token ≈ 4 characters for English text
  // This varies by model and language, but provides a reasonable estimate
  const charCount = text.length;
  const wordCount = text.split(/\s+/).length;

  // Use a more sophisticated estimation:
  // - Average English word is ~4.7 characters
  // - Most tokenizers split on word boundaries and subwords
  // - Punctuation and special characters affect tokenization

  // Conservative estimate: 0.75 tokens per word
  const estimatedTokens = Math.ceil(wordCount * 0.75);

  // Minimum of 1 token for non-empty text
  return Math.max(1, estimatedTokens);
}
