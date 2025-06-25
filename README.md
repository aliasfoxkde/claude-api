# Puter Claude API Proxy

A production-ready API proxy that provides real AI model access through Puter.com, offering seamless compatibility with OpenAI and Anthropic APIs. Features authentic AI responses, accurate token usage tracking, and support for 25+ models including Claude, GPT-4, DeepSeek, and Gemini.

## 🚀 Features

- **Real AI Integration**: Connects to actual AI models via Puter.com (no more mock responses!)
- **Free Claude Access**: Unlimited access to Claude 3.5 Sonnet, Claude Opus, and 25+ other AI models
- **Persistent Authentication**: Server-side credential storage eliminates manual login requirements
- **API Compatibility**: Drop-in replacement for OpenAI and Anthropic APIs
- **Accurate Token Usage**: Real token counting for proper billing and monitoring
- **Model Routing**: Intelligent routing to specific AI providers (Claude, GPT-4, DeepSeek, Gemini, etc.)
- **Streaming Support**: Real-time response streaming with Server-Sent Events
- **Cloudflare Native**: Built specifically for Cloudflare Workers and Pages
- **Interactive Docs**: Comprehensive documentation with live API testing
- **Production Ready**: Rate limiting, authentication, error handling, and monitoring

## 📁 Project Structure

```
├── worker/                 # Cloudflare Worker API proxy
│   ├── src/
│   │   ├── index.ts       # Main worker entry point
│   │   ├── handlers/      # API endpoint handlers
│   │   ├── middleware/    # Authentication & rate limiting
│   │   ├── utils/         # Request/response transformers
│   │   └── types/         # TypeScript type definitions
│   ├── wrangler.toml      # Worker configuration
│   └── package.json       # Worker dependencies
├── docs/                  # Documentation website
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Documentation pages
│   │   └── playground/    # Interactive API testing
│   ├── public/            # Static assets
│   └── package.json       # Docs dependencies
├── .github/
│   └── workflows/         # CI/CD automation
├── examples/              # Integration examples
└── scripts/               # Development utilities
```

## 🛠 Quick Start

### Prerequisites

- Node.js 18+
- Cloudflare account
- Wrangler CLI: `npm install -g wrangler`

### Local Development

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd claude-api
npm install
```

2. **Set up Cloudflare Worker:**
```bash
cd worker
npm install
wrangler login
wrangler kv:namespace create "API_KEYS"
wrangler kv:namespace create "RATE_LIMITS"
```

3. **Configure environment:**
```bash
cp wrangler.toml.example wrangler.toml
# Edit wrangler.toml with your KV namespace IDs
```

4. **Start development:**
```bash
# Terminal 1: Start worker
cd worker
npm run dev

# Terminal 2: Start docs site
cd docs
npm run dev
```

## 🔧 API Endpoints

### OpenAI Compatible
- `POST /v1/chat/completions` - Chat completions
- `GET /v1/models` - List available models

### Claude Compatible
- `POST /v1/messages` - Messages API
- `POST /v1/complete` - Text completion

### Management
- `POST /v1/keys` - Generate API key
- `GET /v1/usage` - Usage statistics

## 📖 Documentation

Visit the interactive documentation at your deployed Cloudflare Pages URL or run locally:

```bash
cd docs
npm run dev
```

## 🚀 Quick Deployment

### Option 1: Automated Script (Recommended)
```bash
# Run the complete deployment script
./scripts/deploy.sh

# Or deploy only the worker
./scripts/deploy.sh --worker-only

# Or deploy only the documentation
./scripts/deploy.sh --docs-only
```

### Option 2: Step by Step

1. **Create KV Namespaces:**
   ```bash
   ./scripts/create-kv-namespaces.sh
   ```

2. **Deploy Worker:**
   ```bash
   npm run deploy
   ```

3. **Deploy Documentation:**
   ```bash
   cd docs && npm run deploy
   ```

### Option 3: GitHub Actions (Automated)
Push to main branch - GitHub Actions will deploy automatically.

### Option 4: Cloudflare Dashboard
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to "Workers & Pages"
3. Click "Create application" → "Pages" → "Connect to Git"
4. Select your repository and configure build settings

## 🧪 Testing Your Deployment

After deployment, test your API:

```bash
# Test all endpoints
./scripts/test-api.sh --base-url https://your-worker.workers.dev/v1

# Test with API keys
./scripts/test-api.sh --api-key pk-your-key --admin-key pk-admin-key
```

## 🔑 API Key Management

### First API Key (No Auth Required)
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"name": "Admin Key", "permissions": ["chat", "admin"]}'
```

### Subsequent Keys (Requires Admin Key)
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/v1/keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-key" \
  -d '{"name": "my-app", "permissions": ["chat"]}'
```

### Via Documentation Interface
Visit your deployed documentation site and use the API Keys page for a user-friendly interface.

## 🔐 Puter Authentication Setup

The proxy requires Puter.com authentication credentials to access AI models. Set this up once after deployment:

### 1. Get Your Puter Credentials

Visit [puter.com](https://puter.com) and sign in. Open browser developer tools and find:
- **Auth Token**: From localStorage `auth_token` or cookie `puter_auth_token`
- **User UUID**: From localStorage `user.uuid`

### 2. Configure Authentication

```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/v1/puter/auth/setup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-api-key" \
  -d '{
    "appId": "your-user-uuid",
    "authToken": "your-puter-auth-token"
  }'
```

### 3. Verify Authentication

```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/v1/puter/auth/validate \
  -H "Authorization: Bearer your-admin-api-key"
```

### 4. Check Status

```bash
curl https://your-worker.your-subdomain.workers.dev/health
```

The health endpoint will show `puter_auth: authenticated` when properly configured.

## 📊 Usage Examples

### OpenAI SDK
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://your-worker.your-subdomain.workers.dev/v1',
  apiKey: 'your-generated-key'
});

const response = await openai.chat.completions.create({
  model: 'claude-3-5-sonnet',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

### Anthropic SDK
```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  baseURL: 'https://your-worker.your-subdomain.workers.dev/v1',
  apiKey: 'your-generated-key'
});

const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet',
  max_tokens: 1000,
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

## 🔧 Troubleshooting

### Build Fails with "Missing entry-point"
- Ensure `wrangler.toml` exists in the root directory
- Check that `main = "worker/src/index.ts"` points to the correct file
- Run `./scripts/create-kv-namespaces.sh` to set up KV namespaces

### KV Namespace Errors
- Verify namespace IDs in `wrangler.toml` are correct
- Ensure you have both production and preview namespace IDs
- Check Cloudflare dashboard for namespace status

### API Key Issues
- First API key creation doesn't require authentication
- Subsequent operations require admin permissions
- Check rate limits and API key permissions

### CORS Errors
- Update `CORS_ORIGINS` in `wrangler.toml`
- Include your documentation site and client domains
- Redeploy after making changes

### Rate Limiting
- Check KV namespace configuration
- Verify rate limiting headers in responses
- Adjust limits in environment variables

### Common Commands
```bash
# Check deployment status
wrangler whoami
wrangler kv:namespace list

# View logs
wrangler tail

# Test locally
npm run dev

# Redeploy
./scripts/deploy.sh
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Documentation**: [Your Cloudflare Pages URL]
- **Issues**: GitHub Issues
- **Setup Guide**: `scripts/cloudflare-setup.md`
- **Testing**: `scripts/test-api.sh --help`

## 🎯 What's Next?

After successful deployment:

1. **Generate API Keys**: Create keys for your applications
2. **Update Client Code**: Change base URLs in your existing apps
3. **Monitor Usage**: Check Cloudflare Analytics and logs
4. **Custom Domains**: Set up custom domains for production
5. **Scale**: Adjust rate limits based on your needs

---

Built with ❤️ for the AI developer community. Powered by [Puter.com](https://puter.com) and [Cloudflare](https://cloudflare.com).