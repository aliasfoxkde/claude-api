#!/bin/bash

# Puter Claude API Proxy Deployment Script
# This script handles the complete deployment process

set -e

echo "🚀 Deploying Puter Claude API Proxy..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    # Check wrangler
    if ! command -v wrangler &> /dev/null; then
        print_warning "Wrangler CLI not found. Installing locally..."
        npm install wrangler@latest
        print_status "Using local wrangler via npx"
        WRANGLER_CMD="npx wrangler"
    else
        WRANGLER_CMD="wrangler"
        print_success "Wrangler CLI found: $(wrangler --version)"
    fi
    
    print_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Root dependencies
    npm install
    
    # Worker dependencies
    cd worker
    npm install
    cd ..
    
    # Docs dependencies
    cd docs
    npm install
    cd ..
    
    print_success "Dependencies installed"
}

# Check authentication
check_auth() {
    print_status "Checking Cloudflare authentication..."
    
    if ! wrangler whoami &> /dev/null; then
        print_warning "Not logged in to Cloudflare. Please log in:"
        wrangler login
    else
        print_success "Logged in as: $(wrangler whoami)"
    fi
}

# Create KV namespaces if they don't exist
setup_kv_namespaces() {
    print_status "Setting up KV namespaces..."
    
    # Check if namespaces are already configured
    if grep -q "your-api-keys-namespace-id" wrangler.toml; then
        print_warning "KV namespaces not configured. Running setup script..."
        ./scripts/create-kv-namespaces.sh
    else
        print_success "KV namespaces already configured"
    fi
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Worker tests
    cd worker
    npm test
    cd ..
    
    # Docs tests (if they exist)
    if [ -f "docs/package.json" ] && grep -q "test" docs/package.json; then
        cd docs
        npm test
        cd ..
    fi
    
    print_success "Tests passed"
}

# Build projects
build_projects() {
    print_status "Building projects..."
    
    # Build worker
    cd worker
    npm run build
    cd ..
    
    # Build docs
    cd docs
    npm run build
    cd ..
    
    print_success "Build completed"
}

# Deploy worker
deploy_worker() {
    print_status "Deploying Worker to Cloudflare..."
    
    # Deploy using the root wrangler.toml
    wrangler deploy
    
    print_success "Worker deployed successfully"
}

# Deploy documentation
deploy_docs() {
    print_status "Deploying documentation to Cloudflare Pages..."
    
    cd docs
    
    # Check if Pages project exists, if not, create it
    if ! wrangler pages project list | grep -q "puter-claude-docs"; then
        print_warning "Pages project not found. Creating..."
        wrangler pages project create puter-claude-docs
    fi
    
    # Deploy to Pages
    wrangler pages publish dist --project-name=puter-claude-docs
    
    cd ..
    
    print_success "Documentation deployed successfully"
}

# Generate first admin API key
generate_admin_key() {
    print_status "Generating admin API key..."
    
    # Get the worker URL
    WORKER_URL=$(wrangler whoami | grep -o 'https://[^/]*\.workers\.dev' | head -1)
    if [ -z "$WORKER_URL" ]; then
        WORKER_URL="https://your-worker.your-subdomain.workers.dev"
    fi
    
    print_warning "To generate your first admin API key, run this command after deployment:"
    echo ""
    echo "curl -X POST \"$WORKER_URL/v1/keys\" \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -d '{\"name\": \"Admin Key\", \"permissions\": [\"chat\", \"admin\"]}'"
    echo ""
    print_warning "Note: The first API key creation doesn't require authentication."
    print_warning "After creating the first key, all subsequent operations will require authentication."
}

# Main deployment function
main() {
    echo "🎯 Starting deployment process..."
    echo ""
    
    # Parse command line arguments
    SKIP_TESTS=false
    WORKER_ONLY=false
    DOCS_ONLY=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --worker-only)
                WORKER_ONLY=true
                shift
                ;;
            --docs-only)
                DOCS_ONLY=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Usage: $0 [--skip-tests] [--worker-only] [--docs-only]"
                exit 1
                ;;
        esac
    done
    
    # Run deployment steps
    check_prerequisites
    install_dependencies
    check_auth
    
    if [ "$DOCS_ONLY" = false ]; then
        setup_kv_namespaces
    fi
    
    if [ "$SKIP_TESTS" = false ]; then
        run_tests
    fi
    
    build_projects
    
    if [ "$DOCS_ONLY" = false ]; then
        deploy_worker
    fi
    
    if [ "$WORKER_ONLY" = false ]; then
        deploy_docs
    fi
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    
    if [ "$DOCS_ONLY" = false ]; then
        # Get deployment URLs
        WORKER_URL=$(wrangler whoami | grep -o 'https://[^/]*\.workers\.dev' | head -1)
        if [ -z "$WORKER_URL" ]; then
            WORKER_URL="https://your-worker.your-subdomain.workers.dev"
        fi
        
        echo "📋 Deployment Information:"
        echo "   🔧 Worker URL: $WORKER_URL"
        echo "   📚 Documentation: https://puter-claude-docs.pages.dev"
        echo ""
        echo "🔑 Next Steps:"
        echo "   1. Generate your first API key (see command above)"
        echo "   2. Test the API endpoints"
        echo "   3. Update documentation URLs if needed"
        echo "   4. Set up custom domains (optional)"
        echo ""
        
        generate_admin_key
    fi
    
    echo "🎯 Happy coding!"
}

# Run main function
main "$@"
