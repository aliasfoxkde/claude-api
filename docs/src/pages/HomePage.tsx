import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Zap, 
  Shield, 
  Globe, 
  Code, 
  CheckCircle,
  ExternalLink,
  Copy,
  Terminal
} from 'lucide-react';

const HomePage: React.FC = () => {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const features = [
    {
      icon: Zap,
      title: 'Free Claude Access',
      description: 'Unlimited access to Claude 3.5 Sonnet and Claude Opus through Puter.com\'s free service.'
    },
    {
      icon: Code,
      title: 'API Compatibility',
      description: 'Drop-in replacement for OpenAI and Anthropic APIs. No code changes required.'
    },
    {
      icon: Globe,
      title: 'Global Edge Network',
      description: 'Deployed on Cloudflare\'s global edge network for optimal performance worldwide.'
    },
    {
      icon: Shield,
      title: 'Production Ready',
      description: 'Built-in rate limiting, authentication, error handling, and comprehensive monitoring.'
    }
  ];

  const quickStartCode = `npm install openai
# or
npm install @anthropic-ai/sdk`;

  const openaiExample = `import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://your-worker.your-subdomain.workers.dev/v1',
  apiKey: 'your-generated-key'
});

const response = await openai.chat.completions.create({
  model: 'claude-3-5-sonnet',
  messages: [{ role: 'user', content: 'Hello!' }]
});`;

  const claudeExample = `import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  baseURL: 'https://your-worker.your-subdomain.workers.dev/v1',
  apiKey: 'your-generated-key'
});

const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet',
  max_tokens: 1000,
  messages: [{ role: 'user', content: 'Hello!' }]
});`;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Free Claude API with
              <span className="text-primary-600"> OpenAI Compatibility</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A comprehensive API wrapper for Puter.com's free Claude service, providing seamless 
              compatibility with existing AI client libraries and full deployment to Cloudflare's platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/docs/getting-started"
                className="btn-primary btn-lg inline-flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/playground"
                className="btn-outline btn-lg inline-flex items-center space-x-2"
              >
                <Terminal className="w-5 h-5" />
                <span>Try Playground</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Puter Claude API Proxy?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built specifically for developers who want free Claude access without compromising 
              on performance, compatibility, or production readiness.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Use your existing OpenAI or Anthropic SDK code with just a URL change. 
              No API keys from OpenAI or Anthropic required.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* OpenAI Example */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">OpenAI SDK</h3>
                <p className="card-description">
                  Use the official OpenAI SDK with our proxy
                </p>
              </div>
              <div className="card-content">
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{openaiExample}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(openaiExample, 'openai')}
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {copiedCode === 'openai' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Claude Example */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Anthropic SDK</h3>
                <p className="card-description">
                  Use the official Anthropic SDK with our proxy
                </p>
              </div>
              <div className="card-content">
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{claudeExample}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(claudeExample, 'claude')}
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {copiedCode === 'claude' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              to="/docs/getting-started"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <span>View Full Setup Guide</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Production-Ready from Day One
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">API Key Management</h3>
                    <p className="text-gray-600">Generate, manage, and revoke API keys with granular permissions and rate limits.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Rate Limiting</h3>
                    <p className="text-gray-600">Built-in rate limiting with per-minute, per-hour, and per-day limits.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Error Handling</h3>
                    <p className="text-gray-600">Comprehensive error handling with detailed error messages and proper HTTP status codes.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Monitoring & Analytics</h3>
                    <p className="text-gray-600">Built-in logging, metrics, and usage analytics for monitoring your API usage.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 p-8 rounded-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Deployment Options
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  <span className="text-gray-700">Cloudflare Workers (Recommended)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  <span className="text-gray-700">Cloudflare Pages for Documentation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  <span className="text-gray-700">GitHub Actions for CI/CD</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  <span className="text-gray-700">Custom Domain Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Deploy your own Puter Claude API proxy in minutes and start using Claude for free 
            with your existing AI applications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/docs/getting-started"
              className="bg-white text-primary-600 hover:bg-gray-50 btn btn-lg inline-flex items-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="https://github.com/yourusername/puter-claude-api-proxy"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-primary-300 text-white hover:bg-primary-700 btn btn-lg inline-flex items-center space-x-2"
            >
              <span>View on GitHub</span>
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
