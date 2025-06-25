# Integration Examples

This directory contains comprehensive examples showing how to integrate the Puter Claude API Proxy with popular AI libraries and frameworks.

## Quick Start Examples

### OpenAI SDK
- [Basic Chat](./openai/basic-chat.js) - Simple chat completion
- [Streaming](./openai/streaming.js) - Real-time streaming responses
- [Function Calling](./openai/function-calling.js) - Tool usage examples
- [Vision](./openai/vision.js) - Image analysis with Claude

### Anthropic SDK
- [Basic Messages](./anthropic/basic-messages.js) - Simple message API
- [Streaming](./anthropic/streaming.js) - Real-time streaming
- [Tool Use](./anthropic/tool-use.js) - Function calling with Claude
- [System Messages](./anthropic/system-messages.js) - System prompt examples

## Framework Integrations

### LangChain
- [Chat Model](./langchain/chat-model.js) - LangChain ChatModel integration
- [Chains](./langchain/chains.js) - Building chains with Claude
- [Agents](./langchain/agents.js) - Agent examples with tools

### LlamaIndex
- [Query Engine](./llamaindex/query-engine.js) - Document Q&A
- [Chat Engine](./llamaindex/chat-engine.js) - Conversational AI
- [Custom LLM](./llamaindex/custom-llm.js) - Custom LLM integration

### Vercel AI SDK
- [Chat UI](./vercel-ai/chat-ui.tsx) - React chat interface
- [Streaming UI](./vercel-ai/streaming-ui.tsx) - Streaming chat UI
- [Tool Calling](./vercel-ai/tool-calling.tsx) - Interactive tools

## Platform Examples

### Node.js
- [Express Server](./nodejs/express-server.js) - REST API server
- [CLI Tool](./nodejs/cli-tool.js) - Command-line interface
- [Batch Processing](./nodejs/batch-processing.js) - Bulk operations

### Python
- [FastAPI Server](./python/fastapi-server.py) - Python REST API
- [Jupyter Notebook](./python/jupyter-example.ipynb) - Interactive notebook
- [Data Analysis](./python/data-analysis.py) - Data processing with Claude

### Browser
- [Vanilla JavaScript](./browser/vanilla-js.html) - Pure JS implementation
- [React App](./browser/react-app.tsx) - React integration
- [Vue App](./browser/vue-app.vue) - Vue.js integration

## Advanced Examples

### Production Patterns
- [Error Handling](./advanced/error-handling.js) - Robust error handling
- [Rate Limiting](./advanced/rate-limiting.js) - Client-side rate limiting
- [Caching](./advanced/caching.js) - Response caching strategies
- [Monitoring](./advanced/monitoring.js) - Usage tracking and metrics

### Security
- [API Key Management](./security/api-key-management.js) - Secure key handling
- [Request Validation](./security/request-validation.js) - Input sanitization
- [CORS Configuration](./security/cors-config.js) - Cross-origin setup

### Performance
- [Connection Pooling](./performance/connection-pooling.js) - Efficient connections
- [Batch Requests](./performance/batch-requests.js) - Bulk operations
- [Parallel Processing](./performance/parallel-processing.js) - Concurrent requests

## Testing Examples

### Unit Tests
- [API Client Tests](./testing/api-client.test.js) - Client library tests
- [Response Validation](./testing/response-validation.test.js) - Response format tests
- [Error Scenarios](./testing/error-scenarios.test.js) - Error handling tests

### Integration Tests
- [End-to-End](./testing/e2e.test.js) - Full workflow tests
- [Load Testing](./testing/load-testing.js) - Performance testing
- [Compatibility](./testing/compatibility.test.js) - SDK compatibility tests

## Migration Guides

### From OpenAI API
- [Migration Script](./migration/from-openai.js) - Automated migration
- [Compatibility Layer](./migration/openai-compat.js) - Drop-in replacement
- [Feature Mapping](./migration/feature-mapping.md) - Feature comparison

### From Anthropic API
- [Migration Script](./migration/from-anthropic.js) - Automated migration
- [Compatibility Layer](./migration/anthropic-compat.js) - Drop-in replacement
- [Feature Mapping](./migration/anthropic-mapping.md) - Feature comparison

## Environment Setup

Each example includes:
- Environment variable configuration
- Dependency installation instructions
- Step-by-step setup guide
- Troubleshooting tips

## Running Examples

1. **Set up your API key:**
   ```bash
   export PUTER_CLAUDE_API_KEY="your-api-key-here"
   export PUTER_CLAUDE_BASE_URL="https://your-worker.your-subdomain.workers.dev/v1"
   ```

2. **Install dependencies:**
   ```bash
   cd examples/[category]/[example]
   npm install
   ```

3. **Run the example:**
   ```bash
   npm start
   # or
   node index.js
   # or
   python main.py
   ```

## Contributing

To add a new example:

1. Create a new directory under the appropriate category
2. Include a `README.md` with setup instructions
3. Add a `package.json` or requirements file
4. Include error handling and best practices
5. Add comments explaining key concepts
6. Test with the actual API proxy

## Support

If you encounter issues with any examples:

1. Check the [troubleshooting guide](../docs/troubleshooting.md)
2. Verify your API key and base URL
3. Review the example's README for specific requirements
4. Open an issue with details about your setup

## License

All examples are provided under the MIT License. Feel free to use them as starting points for your own projects.
