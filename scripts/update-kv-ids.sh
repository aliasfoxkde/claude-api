#!/bin/bash

# Script to update KV namespace IDs in wrangler.toml
# Run this after creating KV namespaces in Cloudflare Dashboard

echo "🔧 KV Namespace ID Updater"
echo ""

# Check if wrangler.toml exists
if [ ! -f "wrangler.toml" ]; then
    echo "❌ wrangler.toml not found in current directory"
    exit 1
fi

echo "📋 You need to create KV namespaces in Cloudflare Dashboard first:"
echo "   1. Go to https://dash.cloudflare.com"
echo "   2. Navigate to: Workers & Pages → KV"
echo "   3. Create namespace: API_KEYS"
echo "   4. Create namespace: RATE_LIMITS"
echo "   5. Copy the namespace IDs"
echo ""

# Prompt for API_KEYS namespace ID
read -p "🔑 Enter your API_KEYS namespace ID: " API_KEYS_ID
if [ -z "$API_KEYS_ID" ]; then
    echo "❌ API_KEYS namespace ID is required"
    exit 1
fi

# Prompt for RATE_LIMITS namespace ID
read -p "⏱️  Enter your RATE_LIMITS namespace ID: " RATE_LIMITS_ID
if [ -z "$RATE_LIMITS_ID" ]; then
    echo "❌ RATE_LIMITS namespace ID is required"
    exit 1
fi

echo ""
echo "🔄 Updating wrangler.toml..."

# Backup original file
cp wrangler.toml wrangler.toml.backup
echo "✅ Backup created: wrangler.toml.backup"

# Update the namespace IDs
sed -i.tmp "s/your-api-keys-namespace-id/$API_KEYS_ID/g" wrangler.toml
sed -i.tmp "s/your-api-keys-preview-namespace-id/$API_KEYS_ID/g" wrangler.toml
sed -i.tmp "s/your-rate-limits-namespace-id/$RATE_LIMITS_ID/g" wrangler.toml
sed -i.tmp "s/your-rate-limits-preview-namespace-id/$RATE_LIMITS_ID/g" wrangler.toml

# Remove temp file
rm wrangler.toml.tmp

echo "✅ wrangler.toml updated successfully!"
echo ""
echo "📝 Updated namespace IDs:"
echo "   API_KEYS: $API_KEYS_ID"
echo "   RATE_LIMITS: $RATE_LIMITS_ID"
echo ""
echo "🚀 Next steps:"
echo "   1. git add wrangler.toml"
echo "   2. git commit -m 'Update KV namespace IDs for production'"
echo "   3. git push origin main"
echo "   4. Cloudflare will automatically redeploy"
echo ""
echo "🧪 After deployment, test with:"
echo "   curl https://claude-api.your-subdomain.workers.dev/health"
