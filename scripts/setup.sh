#!/bin/bash

# Puter Claude API Proxy Setup Script
# This script helps you set up the project for local development and deployment

set -e

echo "🚀 Setting up Puter Claude API Proxy..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install worker dependencies
echo "📦 Installing worker dependencies..."
cd worker
npm install
cd ..

# Install docs dependencies
echo "📦 Installing docs dependencies..."
cd docs
npm install
cd ..

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Wrangler CLI..."
    npm install -g wrangler
fi

echo "✅ Wrangler $(wrangler --version) detected"

# Check if user is logged in to Cloudflare
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "🔑 Please log in to Cloudflare:"
    wrangler login
else
    echo "✅ Already logged in to Cloudflare as $(wrangler whoami)"
fi

# Create KV namespaces
echo "🗄️ Creating KV namespaces..."

# Create API_KEYS namespace
echo "Creating API_KEYS namespace..."
API_KEYS_ID=$(wrangler kv:namespace create "API_KEYS" --preview false | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
API_KEYS_PREVIEW_ID=$(wrangler kv:namespace create "API_KEYS" --preview | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

# Create RATE_LIMITS namespace
echo "Creating RATE_LIMITS namespace..."
RATE_LIMITS_ID=$(wrangler kv:namespace create "RATE_LIMITS" --preview false | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
RATE_LIMITS_PREVIEW_ID=$(wrangler kv:namespace create "RATE_LIMITS" --preview | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

# Update wrangler.toml with namespace IDs
echo "📝 Updating wrangler.toml with namespace IDs..."
cd worker

# Create wrangler.toml from example if it doesn't exist
if [ ! -f "wrangler.toml" ]; then
    cp wrangler.toml.example wrangler.toml
fi

# Update namespace IDs in wrangler.toml
sed -i.bak "s/YOUR_API_KEYS_NAMESPACE_ID_HERE/$API_KEYS_ID/g" wrangler.toml
sed -i.bak "s/YOUR_API_KEYS_PREVIEW_NAMESPACE_ID_HERE/$API_KEYS_PREVIEW_ID/g" wrangler.toml
sed -i.bak "s/YOUR_RATE_LIMITS_NAMESPACE_ID_HERE/$RATE_LIMITS_ID/g" wrangler.toml
sed -i.bak "s/YOUR_RATE_LIMITS_PREVIEW_NAMESPACE_ID_HERE/$RATE_LIMITS_PREVIEW_ID/g" wrangler.toml

# Remove backup file
rm wrangler.toml.bak

cd ..

echo "✅ KV namespaces created and configured:"
echo "   API_KEYS: $API_KEYS_ID"
echo "   RATE_LIMITS: $RATE_LIMITS_ID"

# Run tests to make sure everything is working
echo "🧪 Running tests..."
npm run test

echo ""
echo "🎉 Setup complete! Here's what you can do next:"
echo ""
echo "📖 Start development:"
echo "   npm run dev"
echo ""
echo "🚀 Deploy to Cloudflare:"
echo "   npm run deploy"
echo ""
echo "🔧 Worker commands:"
echo "   cd worker"
echo "   npm run dev     # Start local development"
echo "   npm run deploy  # Deploy to Cloudflare Workers"
echo ""
echo "📚 Documentation commands:"
echo "   cd docs"
echo "   npm run dev     # Start local documentation server"
echo "   npm run build   # Build for production"
echo "   npm run deploy  # Deploy to Cloudflare Pages"
echo ""
echo "🔑 Generate your first API key:"
echo "   After deployment, visit your worker URL and use the /v1/keys endpoint"
echo ""
echo "📋 Next steps:"
echo "   1. Update the URLs in the documentation to match your deployment"
echo "   2. Configure your custom domain (optional)"
echo "   3. Set up monitoring and analytics"
echo "   4. Generate API keys for your applications"
echo ""
echo "Happy coding! 🎯"
