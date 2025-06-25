#!/bin/bash

# Create KV Namespaces for Puter Claude API Proxy
# This script creates the required KV namespaces and updates wrangler.toml

set -e

echo "🗄️ Creating KV Namespaces for Puter Claude API Proxy..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI is not installed. Installing..."
    npm install -g wrangler@latest
fi

echo "✅ Wrangler $(wrangler --version) detected"

# Check if user is logged in
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "🔑 Please log in to Cloudflare:"
    wrangler login
else
    echo "✅ Logged in as: $(wrangler whoami)"
fi

echo ""
echo "📝 Creating KV namespaces..."

# Create API_KEYS namespace
echo "Creating API_KEYS namespace..."
API_KEYS_OUTPUT=$(wrangler kv:namespace create "API_KEYS" --preview false)
API_KEYS_ID=$(echo "$API_KEYS_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

echo "Creating API_KEYS preview namespace..."
API_KEYS_PREVIEW_OUTPUT=$(wrangler kv:namespace create "API_KEYS" --preview)
API_KEYS_PREVIEW_ID=$(echo "$API_KEYS_PREVIEW_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

# Create RATE_LIMITS namespace
echo "Creating RATE_LIMITS namespace..."
RATE_LIMITS_OUTPUT=$(wrangler kv:namespace create "RATE_LIMITS" --preview false)
RATE_LIMITS_ID=$(echo "$RATE_LIMITS_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

echo "Creating RATE_LIMITS preview namespace..."
RATE_LIMITS_PREVIEW_OUTPUT=$(wrangler kv:namespace create "RATE_LIMITS" --preview)
RATE_LIMITS_PREVIEW_ID=$(echo "$RATE_LIMITS_PREVIEW_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

echo ""
echo "✅ KV namespaces created successfully!"
echo "📋 Namespace IDs:"
echo "   API_KEYS: $API_KEYS_ID"
echo "   API_KEYS (preview): $API_KEYS_PREVIEW_ID"
echo "   RATE_LIMITS: $RATE_LIMITS_ID"
echo "   RATE_LIMITS (preview): $RATE_LIMITS_PREVIEW_ID"

# Update wrangler.toml with the new namespace IDs
echo ""
echo "📝 Updating wrangler.toml with namespace IDs..."

# Backup original file
cp wrangler.toml wrangler.toml.backup

# Update the namespace IDs
sed -i.tmp "s/your-api-keys-namespace-id/$API_KEYS_ID/g" wrangler.toml
sed -i.tmp "s/your-api-keys-preview-namespace-id/$API_KEYS_PREVIEW_ID/g" wrangler.toml
sed -i.tmp "s/your-rate-limits-namespace-id/$RATE_LIMITS_ID/g" wrangler.toml
sed -i.tmp "s/your-rate-limits-preview-namespace-id/$RATE_LIMITS_PREVIEW_ID/g" wrangler.toml

# Remove temporary file
rm wrangler.toml.tmp

echo "✅ wrangler.toml updated successfully!"
echo ""

# Also update worker/wrangler.toml if it exists
if [ -f "worker/wrangler.toml" ]; then
    echo "📝 Updating worker/wrangler.toml..."
    cp worker/wrangler.toml worker/wrangler.toml.backup
    
    sed -i.tmp "s/YOUR_API_KEYS_NAMESPACE_ID_HERE/$API_KEYS_ID/g" worker/wrangler.toml
    sed -i.tmp "s/YOUR_API_KEYS_PREVIEW_NAMESPACE_ID_HERE/$API_KEYS_PREVIEW_ID/g" worker/wrangler.toml
    sed -i.tmp "s/YOUR_RATE_LIMITS_NAMESPACE_ID_HERE/$RATE_LIMITS_ID/g" worker/wrangler.toml
    sed -i.tmp "s/YOUR_RATE_LIMITS_PREVIEW_NAMESPACE_ID_HERE/$RATE_LIMITS_PREVIEW_ID/g" worker/wrangler.toml
    
    rm worker/wrangler.toml.tmp
    echo "✅ worker/wrangler.toml updated successfully!"
fi

echo ""
echo "🎉 Setup complete! Your KV namespaces are ready."
echo ""
echo "📋 Next steps:"
echo "1. Test your deployment locally: npm run dev"
echo "2. Deploy to Cloudflare: npm run deploy"
echo "3. Test the API endpoints"
echo "4. Generate your first API key"
echo ""
echo "🔧 Configuration saved to:"
echo "   - wrangler.toml (updated with namespace IDs)"
echo "   - wrangler.toml.backup (original backup)"
if [ -f "worker/wrangler.toml.backup" ]; then
    echo "   - worker/wrangler.toml.backup (original backup)"
fi
echo ""
echo "Happy coding! 🚀"
