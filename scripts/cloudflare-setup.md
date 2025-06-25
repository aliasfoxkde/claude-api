# Cloudflare Setup Guide

This guide will help you set up your Puter Claude API Proxy on Cloudflare Workers and Pages.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **GitHub Account**: Your code should be in a GitHub repository
3. **Node.js 18+**: For local development

## Step 1: Create KV Namespaces

You need to create KV namespaces for API key storage and rate limiting.

### Option A: Using Wrangler CLI (Recommended)

1. Install Wrangler globally:
   ```bash
   npm install -g wrangler@latest
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Create KV namespaces:
   ```bash
   # Create API_KEYS namespace
   wrangler kv:namespace create "API_KEYS"
   wrangler kv:namespace create "API_KEYS" --preview

   # Create RATE_LIMITS namespace
   wrangler kv:namespace create "RATE_LIMITS"
   wrangler kv:namespace create "RATE_LIMITS" --preview
   ```

4. Copy the namespace IDs from the output and update your `wrangler.toml` file.

### Option B: Using Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account
3. Go to "Workers & Pages" → "KV"
4. Create two namespaces:
   - `API_KEYS`
   - `RATE_LIMITS`
5. Copy the namespace IDs and update your `wrangler.toml` file

## Step 2: Update Configuration

1. **Update wrangler.toml**: Replace the placeholder namespace IDs with your actual IDs:
   ```toml
   [[kv_namespaces]]
   binding = "API_KEYS"
   id = "your-actual-api-keys-namespace-id"
   preview_id = "your-actual-api-keys-preview-namespace-id"

   [[kv_namespaces]]
   binding = "RATE_LIMITS"
   id = "your-actual-rate-limits-namespace-id"
   preview_id = "your-actual-rate-limits-preview-namespace-id"
   ```

2. **Update environment variables**: Modify the CORS_ORIGINS and other settings as needed.

## Step 3: Deploy Worker

### Option A: Using GitHub Integration (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to "Workers & Pages"
3. Click "Create application"
4. Select "Pages" tab
5. Click "Connect to Git"
6. Select your GitHub repository
7. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: Leave empty (we're deploying a Worker, not static files)
   - **Root directory**: Leave empty
8. Add environment variables if needed
9. Click "Save and Deploy"

### Option B: Using Wrangler CLI

1. From your project root:
   ```bash
   npm run deploy
   ```

## Step 4: Set Up Documentation Site (Optional)

1. Create a new Pages project for documentation
2. Connect to the same GitHub repository
3. Configure build settings:
   - **Build command**: `cd docs && npm install && npm run build`
   - **Build output directory**: `docs/dist`
   - **Root directory**: Leave empty
4. Add environment variables:
   - `VITE_API_BASE_URL`: Your Worker URL

## Step 5: Configure Custom Domain (Optional)

1. In your Worker settings, go to "Triggers"
2. Add a custom domain
3. Update your DNS settings as instructed
4. Update CORS_ORIGINS in your wrangler.toml

## Step 6: Test Your Deployment

1. Visit your Worker URL
2. Test the health endpoint: `GET /health`
3. Generate an API key: `POST /v1/keys`
4. Test chat completion: `POST /v1/chat/completions`

## Troubleshooting

### Build Fails with "Missing entry-point"

- Make sure your `wrangler.toml` has the correct `main` field pointing to your entry file
- Ensure the file path is correct relative to the project root

### KV Namespace Errors

- Verify your namespace IDs are correct in `wrangler.toml`
- Make sure you have both production and preview namespace IDs

### CORS Errors

- Update the `CORS_ORIGINS` environment variable with your actual domains
- Make sure to include both your documentation site and any client applications

### Rate Limiting Issues

- Check that your KV namespaces are properly configured
- Verify the rate limiting middleware is working by checking the response headers

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `ENVIRONMENT` | Deployment environment | `production` |
| `API_VERSION` | API version | `v1` |
| `MAX_REQUESTS_PER_MINUTE` | Rate limit per minute | `100` |
| `MAX_REQUESTS_PER_HOUR` | Rate limit per hour | `5000` |
| `MAX_REQUESTS_PER_DAY` | Rate limit per day | `50000` |
| `CORS_ORIGINS` | Allowed CORS origins | `https://yourdomain.com` |

## Security Considerations

1. **API Keys**: Store securely and rotate regularly
2. **Rate Limiting**: Adjust limits based on your needs
3. **CORS**: Only allow necessary origins
4. **Monitoring**: Set up alerts for unusual activity

## Support

If you encounter issues:

1. Check the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
2. Review the [Wrangler CLI documentation](https://developers.cloudflare.com/workers/wrangler/)
3. Open an issue in the GitHub repository
