# 🚀 Complete Deployment Guide

This guide will walk you through deploying your Puter Claude API Proxy to Cloudflare Workers and Pages.

## 📋 Prerequisites

- ✅ Cloudflare account
- ✅ GitHub repository with your code
- ✅ Node.js 18+ installed
- ✅ Git configured

## 🎯 Quick Start (5 Minutes)

### Step 1: Clone and Setup
```bash
git clone https://github.com/yourusername/puter-claude-api-proxy.git
cd puter-claude-api-proxy
npm install
```

### Step 2: Deploy Everything
```bash
# This script does everything for you
./scripts/deploy.sh
```

That's it! The script will:
- ✅ Install dependencies
- ✅ Check authentication
- ✅ Create KV namespaces
- ✅ Run tests
- ✅ Deploy worker
- ✅ Deploy documentation
- ✅ Provide next steps

## 🔧 Manual Setup (If You Prefer Control)

### Step 1: Install Wrangler
```bash
npm install -g wrangler@latest
wrangler login
```

### Step 2: Create KV Namespaces
```bash
./scripts/create-kv-namespaces.sh
```

### Step 3: Deploy Worker
```bash
npm run deploy
```

### Step 4: Deploy Documentation
```bash
cd docs
npm run build
wrangler pages publish dist --project-name=puter-claude-docs
```

## 🧪 Test Your Deployment

### Basic Test
```bash
curl https://your-worker.workers.dev/health
```

### Complete Test Suite
```bash
./scripts/test-api.sh --base-url https://your-worker.workers.dev/v1
```

### Generate First API Key
```bash
curl -X POST https://your-worker.workers.dev/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"name": "Admin Key", "permissions": ["chat", "admin"]}'
```

## 🔑 Using Your API

### With OpenAI SDK
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://your-worker.workers.dev/v1',
  apiKey: 'your-generated-key'
});

const response = await openai.chat.completions.create({
  model: 'claude-3-5-sonnet',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

### With Anthropic SDK
```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  baseURL: 'https://your-worker.workers.dev/v1',
  apiKey: 'your-generated-key'
});

const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet',
  max_tokens: 1000,
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

## 🎛️ Configuration

### Environment Variables (wrangler.toml)
```toml
[vars]
ENVIRONMENT = "production"
MAX_REQUESTS_PER_MINUTE = "100"
MAX_REQUESTS_PER_HOUR = "5000"
MAX_REQUESTS_PER_DAY = "50000"
CORS_ORIGINS = "https://yourdomain.com"
```

### Custom Domain Setup
1. Go to Cloudflare Dashboard
2. Workers & Pages → Your Worker → Triggers
3. Add Custom Domain
4. Update DNS as instructed

## 📊 Monitoring

### View Logs
```bash
wrangler tail
```

### Check Analytics
- Cloudflare Dashboard → Analytics & Logs
- Worker Analytics
- Real User Monitoring

### API Usage
```bash
curl https://your-worker.workers.dev/v1/keys/current \
  -H "Authorization: Bearer your-api-key"
```

## 🔄 Updates and Maintenance

### Update Code
```bash
git pull origin main
./scripts/deploy.sh
```

### Update Dependencies
```bash
npm update
cd worker && npm update
cd ../docs && npm update
```

### Backup Configuration
```bash
# Your KV data is automatically backed up by Cloudflare
# Export important API keys and settings
```

## 🚨 Troubleshooting

### Common Issues

**Build Fails**
- Check `wrangler.toml` configuration
- Ensure KV namespaces are created
- Verify Node.js version (18+)

**Authentication Errors**
- Run `wrangler login` again
- Check API key permissions
- Verify CORS settings

**Rate Limiting Issues**
- Check KV namespace configuration
- Verify rate limit settings
- Monitor usage patterns

**API Errors**
- Check Cloudflare Workers logs
- Verify Puter.com service status
- Test with different models

### Getting Help

1. **Check Logs**: `wrangler tail`
2. **Test API**: `./scripts/test-api.sh`
3. **Review Docs**: `scripts/cloudflare-setup.md`
4. **GitHub Issues**: Report bugs and get help

## 🎉 Success Checklist

After deployment, verify:

- [ ] Health endpoint responds: `/health`
- [ ] Models endpoint works: `/models`
- [ ] Can create API keys: `/v1/keys`
- [ ] Chat completion works: `/v1/chat/completions`
- [ ] Claude messages work: `/v1/messages`
- [ ] Documentation site loads
- [ ] API playground functions
- [ ] Rate limiting active
- [ ] CORS configured correctly

## 🔮 Next Steps

1. **Generate API Keys** for your applications
2. **Update Client Code** to use new base URL
3. **Set Up Monitoring** and alerts
4. **Configure Custom Domains** for production
5. **Scale Rate Limits** based on usage
6. **Add Team Members** with appropriate permissions

## 📚 Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Puter.com Documentation](https://docs.puter.com)
- [OpenAI SDK Documentation](https://github.com/openai/openai-node)
- [Anthropic SDK Documentation](https://github.com/anthropics/anthropic-sdk-typescript)

---

🎯 **Ready to build amazing AI applications with free Claude access!**

Need help? Check the troubleshooting section or open an issue on GitHub.
