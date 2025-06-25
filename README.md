# Puter Claude API Proxy

A comprehensive API wrapper for Puter.com's free Claude 3.5 Sonnet API service, providing seamless compatibility with existing AI client libraries and full deployment to Cloudflare's platform.

## 🚀 Features

- **Free Claude Access**: Unlimited access to Claude 3.5 Sonnet and Claude Opus through Puter.com
- **API Compatibility**: Drop-in replacement for OpenAI and Anthropic APIs
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

## 🚀 Deployment

### Automated (Recommended)
Push to main branch - GitHub Actions will deploy automatically.

### Manual
```bash
# Deploy worker
cd worker
npm run deploy

# Deploy docs
cd docs
npm run build
wrangler pages publish dist
```

## 🔑 API Key Management

Generate API keys through the documentation interface or API:

```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"name": "my-app", "permissions": ["chat"]}'
```

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- Documentation: [Your Cloudflare Pages URL]
- Issues: GitHub Issues
- Discord: [Your Discord Server]

---

Built with ❤️ for the AI developer community