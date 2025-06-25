import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Plus, 
  Copy, 
  CheckCircle, 
  Trash2, 
  Eye, 
  EyeOff,
  AlertCircle,
  Calendar,
  Activity
} from 'lucide-react';

interface APIKey {
  id: string;
  name: string;
  key?: string;
  permissions: string[];
  createdAt: string;
  lastUsed?: string;
  isActive: boolean;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
}

const APIKeysPage: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [baseUrl, setBaseUrl] = useState('https://your-worker.your-subdomain.workers.dev/v1');
  const [adminKey, setAdminKey] = useState('');
  
  // Form state
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState(['chat']);
  const [customRateLimit, setCustomRateLimit] = useState(false);
  const [rateLimitMinute, setRateLimitMinute] = useState(60);
  const [rateLimitHour, setRateLimitHour] = useState(1000);
  const [rateLimitDay, setRateLimitDay] = useState(10000);

  // UI state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const loadAPIKeys = async () => {
    if (!adminKey) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${baseUrl}/keys`, {
        headers: {
          'Authorization': `Bearer ${adminKey}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setApiKeys(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const createAPIKey = async () => {
    if (!newKeyName.trim() || !adminKey) return;

    setLoading(true);
    setError('');

    try {
      const requestBody: any = {
        name: newKeyName,
        permissions: newKeyPermissions
      };

      if (customRateLimit) {
        requestBody.rateLimit = {
          requestsPerMinute: rateLimitMinute,
          requestsPerHour: rateLimitHour,
          requestsPerDay: rateLimitDay
        };
      }

      const response = await fetch(`${baseUrl}/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const newKey = await response.json();
      setApiKeys([newKey, ...apiKeys]);
      
      // Reset form
      setNewKeyName('');
      setNewKeyPermissions(['chat']);
      setCustomRateLimit(false);
      setShowCreateForm(false);

      // Show the new key
      setVisibleKeys(new Set([newKey.id]));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const revokeAPIKey = async (keyId: string) => {
    if (!adminKey || !confirm('Are you sure you want to revoke this API key?')) return;

    setLoading(true);

    try {
      const response = await fetch(`${baseUrl}/keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminKey}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      setApiKeys(apiKeys.filter(key => key.id !== keyId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke API key');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (adminKey) {
      loadAPIKeys();
    }
  }, [adminKey]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            API Key Management
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate, manage, and monitor your API keys for the Puter Claude API Proxy.
          </p>
        </div>

        {/* Admin Key Input */}
        {!adminKey && (
          <div className="card mb-8">
            <div className="card-header">
              <h2 className="card-title">Admin Authentication</h2>
              <p className="card-description">
                Enter your admin API key to manage API keys
              </p>
            </div>
            <div className="card-content">
              <div className="flex space-x-4">
                <input
                  type="password"
                  placeholder="Enter admin API key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="input flex-1"
                />
                <input
                  type="url"
                  placeholder="Base URL"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="input w-80"
                />
              </div>
            </div>
          </div>
        )}

        {adminKey && (
          <>
            {/* Create New Key */}
            <div className="card mb-8">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="card-title">Create New API Key</h2>
                    <p className="card-description">
                      Generate a new API key with custom permissions and rate limits
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Key</span>
                  </button>
                </div>
              </div>

              {showCreateForm && (
                <div className="card-content border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Key Name
                      </label>
                      <input
                        type="text"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g., My App Key"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Permissions
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newKeyPermissions.includes('chat')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewKeyPermissions([...newKeyPermissions, 'chat']);
                              } else {
                                setNewKeyPermissions(newKeyPermissions.filter(p => p !== 'chat'));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">Chat API Access</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newKeyPermissions.includes('admin')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewKeyPermissions([...newKeyPermissions, 'admin']);
                              } else {
                                setNewKeyPermissions(newKeyPermissions.filter(p => p !== 'admin'));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">Admin Access</span>
                        </label>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-2 mb-4">
                        <input
                          type="checkbox"
                          checked={customRateLimit}
                          onChange={(e) => setCustomRateLimit(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm font-medium">Custom Rate Limits</span>
                      </label>

                      {customRateLimit && (
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Per Minute
                            </label>
                            <input
                              type="number"
                              value={rateLimitMinute}
                              onChange={(e) => setRateLimitMinute(parseInt(e.target.value))}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Per Hour
                            </label>
                            <input
                              type="number"
                              value={rateLimitHour}
                              onChange={(e) => setRateLimitHour(parseInt(e.target.value))}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Per Day
                            </label>
                            <input
                              type="number"
                              value={rateLimitDay}
                              onChange={(e) => setRateLimitDay(parseInt(e.target.value))}
                              className="input"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createAPIKey}
                      disabled={!newKeyName.trim() || loading}
                      className="btn-primary"
                    >
                      Create Key
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="alert-error mb-6">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {/* API Keys List */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title flex items-center space-x-2">
                  <Key className="w-5 h-5" />
                  <span>Your API Keys</span>
                </h2>
                <button
                  onClick={loadAPIKeys}
                  disabled={loading}
                  className="btn-outline btn-sm"
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              <div className="card-content">
                {apiKeys.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Key className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No API keys found. Create your first key to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900">{key.name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>Created {formatDate(key.createdAt)}</span>
                              </span>
                              {key.lastUsed && (
                                <span className="flex items-center space-x-1">
                                  <Activity className="w-3 h-3" />
                                  <span>Last used {formatDate(key.lastUsed)}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`badge ${key.isActive ? 'badge-success' : 'badge-error'}`}>
                              {key.isActive ? 'Active' : 'Revoked'}
                            </span>
                            {key.isActive && (
                              <button
                                onClick={() => revokeAPIKey(key.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* API Key Display */}
                        {key.key && (
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              API Key
                            </label>
                            <div className="flex items-center space-x-2">
                              <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                                {visibleKeys.has(key.id) ? key.key : '••••••••••••••••••••••••••••••••'}
                              </code>
                              <button
                                onClick={() => toggleKeyVisibility(key.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {visibleKeys.has(key.id) ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => copyToClipboard(key.key!, key.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {copiedKey === key.id ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Permissions and Rate Limits */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Permissions:</span>
                            <div className="flex space-x-1 mt-1">
                              {key.permissions.map((permission) => (
                                <span key={permission} className="badge badge-secondary">
                                  {permission}
                                </span>
                              ))}
                            </div>
                          </div>
                          {key.rateLimit && (
                            <div>
                              <span className="font-medium text-gray-700">Rate Limits:</span>
                              <div className="text-gray-600 mt-1">
                                {key.rateLimit.requestsPerMinute}/min, {key.rateLimit.requestsPerHour}/hour, {key.rateLimit.requestsPerDay}/day
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default APIKeysPage;
