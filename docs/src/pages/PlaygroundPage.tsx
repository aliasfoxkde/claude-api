import React, { useState } from 'react';
import { Send, Copy, CheckCircle, Settings, Zap, AlertCircle } from 'lucide-react';

const PlaygroundPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://your-worker.your-subdomain.workers.dev/v1');
  const [model, setModel] = useState('claude-3-5-sonnet');
  const [messages, setMessages] = useState([
    { role: 'user', content: 'Hello! Can you help me understand how to use this API?' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Settings
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [streaming, setStreaming] = useState(false);

  const models = [
    'claude-3-5-sonnet',
    'claude-sonnet-4',
    'claude-opus-4',
    'gpt-4o',
    'gpt-4o-mini',
    'deepseek-chat',
    'gemini-2.0-flash'
  ];

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !apiKey) return;

    setLoading(true);
    setError('');
    setResponse('');

    const currentMessages = [...messages, { role: 'user', content: newMessage }];
    setMessages(currentMessages);
    setNewMessage('');

    try {
      const requestBody = {
        model,
        messages: currentMessages,
        max_tokens: maxTokens,
        temperature,
        stream: streaming
      };

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `HTTP ${res.status}`);
      }

      if (streaming) {
        const reader = res.body?.getReader();
        if (!reader) throw new Error('Streaming not supported');

        let fullResponse = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  setResponse(fullResponse);
                }
              } catch (e) {
                // Ignore parsing errors for streaming
              }
            }
          }
        }
        
        setMessages([...currentMessages, { role: 'assistant', content: fullResponse }]);
      } else {
        const data = await res.json();
        const assistantMessage = data.choices[0].message.content;
        setResponse(assistantMessage);
        setMessages([...currentMessages, { role: 'assistant', content: assistantMessage }]);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearConversation = () => {
    setMessages([]);
    setResponse('');
    setError('');
  };

  const generateCurlCommand = () => {
    const requestBody = {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: streaming
    };

    return `curl -X POST "${baseUrl}/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}" \\
  -d '${JSON.stringify(requestBody, null, 2)}'`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            API Playground
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Test the Puter Claude API Proxy with an interactive playground. 
            Try different models, adjust parameters, and see real-time responses.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Configuration</span>
                </h2>
              </div>
              <div className="card-content space-y-4">
                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    className="input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Generate an API key from the API Keys page
                  </p>
                </div>

                {/* Base URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base URL
                  </label>
                  <input
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://your-worker.workers.dev/v1"
                    className="input"
                  />
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="select"
                  >
                    {models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Temperature */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature: {temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Focused</span>
                    <span>Creative</span>
                  </div>
                </div>

                {/* Max Tokens */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="4000"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="input"
                  />
                </div>

                {/* Streaming */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="streaming"
                    checked={streaming}
                    onChange={(e) => setStreaming(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="streaming" className="text-sm font-medium text-gray-700">
                    Enable Streaming
                  </label>
                </div>

                {/* Clear Button */}
                <button
                  onClick={clearConversation}
                  className="btn-outline w-full"
                >
                  Clear Conversation
                </button>
              </div>
            </div>

            {/* cURL Command */}
            <div className="card mt-6">
              <div className="card-header">
                <h3 className="card-title text-lg">cURL Command</h3>
              </div>
              <div className="card-content">
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {generateCurlCommand()}
                </pre>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="card h-full">
              <div className="card-header">
                <h2 className="card-title flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Chat Interface</span>
                </h2>
              </div>
              <div className="card-content">
                {/* Messages */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary-50 border-l-4 border-primary-500'
                          : 'bg-gray-50 border-l-4 border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-600 mb-1">
                        {message.role === 'user' ? 'You' : 'Assistant'}
                      </div>
                      <div className="text-gray-900 whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  ))}

                  {/* Current Response */}
                  {(response || loading) && (
                    <div className="bg-gray-50 border-l-4 border-gray-300 p-3 rounded-lg">
                      <div className="font-medium text-sm text-gray-600 mb-1 flex items-center justify-between">
                        <span>Assistant</span>
                        {response && (
                          <button
                            onClick={copyResponse}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {copied ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                      <div className="text-gray-900 whitespace-pre-wrap">
                        {loading && !response ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                            <span>Thinking...</span>
                          </div>
                        ) : (
                          response
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="font-medium text-red-700">Error</span>
                      </div>
                      <div className="text-red-600 mt-1">{error}</div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="input flex-1"
                    disabled={loading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={loading || !newMessage.trim() || !apiKey}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </div>

                {!apiKey && (
                  <p className="text-sm text-amber-600 mt-2 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Please enter your API key to start chatting</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaygroundPage;
