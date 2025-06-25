import { Context } from 'hono';
import { z } from 'zod';
import { Env, OpenAIChatCompletionRequest, ClaudeMessagesRequest, APIError } from '../types';
import { puterClient } from '../utils/puter-client';
import {
  transformOpenAIToPuter,
  transformPuterToOpenAI,
  transformClaudeToPuter,
  transformPuterToClaude,
  createOpenAIStreamTransformer,
  createClaudeStreamTransformer,
  validateModel
} from '../utils/transformers';

// Validation schemas
const openAIRequestSchema = z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant', 'function', 'tool']),
    content: z.string().nullable(),
    name: z.string().optional(),
    function_call: z.object({
      name: z.string(),
      arguments: z.string()
    }).optional(),
    tool_calls: z.array(z.object({
      id: z.string(),
      type: z.literal('function'),
      function: z.object({
        name: z.string(),
        arguments: z.string()
      })
    })).optional(),
    tool_call_id: z.string().optional()
  })),
  max_tokens: z.number().optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  n: z.number().min(1).max(1).optional(),
  stream: z.boolean().optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  logit_bias: z.record(z.number()).optional(),
  user: z.string().optional(),
  tools: z.array(z.object({
    type: z.literal('function'),
    function: z.object({
      name: z.string(),
      description: z.string(),
      parameters: z.record(z.any())
    })
  })).optional(),
  tool_choice: z.union([
    z.literal('none'),
    z.literal('auto'),
    z.object({
      type: z.literal('function'),
      function: z.object({
        name: z.string()
      })
    })
  ]).optional()
});

const claudeRequestSchema = z.object({
  model: z.string(),
  max_tokens: z.number().min(1),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.union([
      z.string(),
      z.array(z.object({
        type: z.enum(['text', 'image']),
        text: z.string().optional(),
        source: z.object({
          type: z.literal('base64'),
          media_type: z.string(),
          data: z.string()
        }).optional()
      }))
    ])
  })),
  system: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  top_p: z.number().min(0).max(1).optional(),
  top_k: z.number().min(0).optional(),
  stop_sequences: z.array(z.string()).optional(),
  stream: z.boolean().optional(),
  tools: z.array(z.object({
    name: z.string(),
    description: z.string(),
    input_schema: z.record(z.any())
  })).optional(),
  tool_choice: z.object({
    type: z.enum(['auto', 'any', 'tool']),
    name: z.string().optional()
  }).optional()
});

/**
 * Handle OpenAI chat completions endpoint
 */
export async function handleOpenAIChatCompletions(c: Context<{ Bindings: Env }>) {
  try {
    const requestBody = await c.req.json();
    
    // Validate request
    const validationResult = openAIRequestSchema.safeParse(requestBody);
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

    const request: OpenAIChatCompletionRequest = validationResult.data;
    const requestId = c.get('requestId');

    // Validate model
    const validatedModel = validateModel(request.model);
    
    // Transform to Puter format
    const { prompt, options } = transformOpenAIToPuter(request);
    
    // Make request to Puter
    const puterResponse = await puterClient.chat(prompt, options);

    // Handle streaming response
    if (request.stream) {
      const transformer = createOpenAIStreamTransformer(validatedModel, requestId);
      
      // Set headers for streaming
      c.header('Content-Type', 'text/event-stream');
      c.header('Cache-Control', 'no-cache');
      c.header('Connection', 'keep-alive');

      // Create readable stream
      const stream = new ReadableStream({
        async start(controller) {
          try {
            if (Symbol.asyncIterator in puterResponse) {
              for await (const chunk of puterResponse as AsyncIterable<{ text?: string }>) {
                const data = transformer(chunk);
                if (data) {
                  controller.enqueue(new TextEncoder().encode(data));
                }
              }
            }
            
            // Send final chunk
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // Handle non-streaming response
    const response = transformPuterToOpenAI(puterResponse as any, validatedModel, requestId);
    return c.json(response);

  } catch (error) {
    console.error('Chat completion error:', error);
    
    const apiError: APIError = {
      error: {
        message: 'Failed to process chat completion',
        type: 'api_error',
        code: 'processing_error'
      }
    };
    return c.json(apiError, 500);
  }
}

/**
 * Handle Claude messages endpoint
 */
export async function handleClaudeMessages(c: Context<{ Bindings: Env }>) {
  try {
    const requestBody = await c.req.json();
    
    // Validate request
    const validationResult = claudeRequestSchema.safeParse(requestBody);
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

    const request: ClaudeMessagesRequest = validationResult.data;
    const requestId = c.get('requestId');

    // Validate model
    const validatedModel = validateModel(request.model);
    
    // Transform to Puter format
    const { prompt, options } = transformClaudeToPuter(request);
    
    // Make request to Puter
    const puterResponse = await puterClient.chat(prompt, options);

    // Handle streaming response
    if (request.stream) {
      const transformer = createClaudeStreamTransformer(validatedModel, requestId);
      
      // Set headers for streaming
      c.header('Content-Type', 'text/event-stream');
      c.header('Cache-Control', 'no-cache');
      c.header('Connection', 'keep-alive');

      // Create readable stream
      const stream = new ReadableStream({
        async start(controller) {
          try {
            if (Symbol.asyncIterator in puterResponse) {
              for await (const chunk of puterResponse as AsyncIterable<{ text?: string }>) {
                const data = transformer(chunk);
                if (data) {
                  controller.enqueue(new TextEncoder().encode(data));
                }
              }
            }
            
            // Send final chunk
            controller.enqueue(new TextEncoder().encode('event: message_stop\ndata: {}\n\n'));
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // Handle non-streaming response
    const response = transformPuterToClaude(puterResponse as any, validatedModel, requestId);
    return c.json(response);

  } catch (error) {
    console.error('Claude messages error:', error);
    
    const apiError: APIError = {
      error: {
        message: 'Failed to process messages request',
        type: 'api_error',
        code: 'processing_error'
      }
    };
    return c.json(apiError, 500);
  }
}
