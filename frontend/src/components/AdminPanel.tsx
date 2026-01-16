import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

interface AdminPanelProps {
  token: string;
  admin: { id: string; username: string };
  onLogout: () => void;
}

interface Config {
  discordPluginWebhook: string;
  discordSkriptWebhook: string;
  discordConfigWebhook: string;
  subscriptionPrice: number;
  subscriptionDurationDays: number;
  publicSharingEnabled: boolean;
  freeDailyGenerations: number;
  freeDailyBuilds: number;
}

interface Subscription {
  id: string;
  userId: string;
  discordId: string;
  discordUsername: string;
  startDate: number;
  expiryDate: number;
  status: 'active' | 'expired';
  price: number;
}

interface User {
  id: string;
  discordId?: string;
  discordUsername?: string;
  isVerified: boolean;
  createdAt: number;
  lastActive: number;
  hasSubscription: boolean;
}

interface Resource {
  id: string;
  type: 'plugin' | 'skript' | 'config';
  name: string;
  filename: string;
  userId: string;
  userIp: string;
  isPublic: boolean;
  viewCount: number;
  createdAt: number;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ token, admin, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ totalGenerations: 0, totalBuilds: 0, totalUsers: 0, activeSubscriptions: 0 });
  const [config, setConfig] = useState<Config | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Form states
  const [newSubUsername, setNewSubUsername] = useState('');

  const fetchStats = async () => {
    try {
      const response = await fetch(getApiUrl('/api/admin/stats'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (activeTab === 'config') fetchConfig();
    if (activeTab === 'subscriptions') fetchSubscriptions();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'resources') fetchResources();
  }, [activeTab]);

  const fetchConfig = async () => {
    try {
      const response = await fetch(getApiUrl('/api/admin/config'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setConfig(data.config);
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch(getApiUrl('/api/admin/subscriptions'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setSubscriptions(data.subscriptions);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(getApiUrl('/api/admin/users'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await fetch(getApiUrl('/api/admin/resources'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setResources(data.resources);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    setLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/admin/config'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      const data = await response.json();
      if (data.success) {
        setMessage('✓ Configuration saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('✕ Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const grantSubscription = async () => {
    if (!newSubUsername.trim()) {
      setMessage('✕ Discord username is required');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/admin/subscriptions'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          discordUsername: newSubUsername.trim()
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessage('✓ Subscription granted successfully!');
        setNewSubUsername('');
        fetchSubscriptions();
        fetchStats();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`✕ ${data.error || 'Failed to grant subscription'}`);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      setMessage('✕ Failed to grant subscription');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const revokeSubscription = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this subscription?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/admin/subscriptions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMessage('✓ Subscription revoked successfully!');
        fetchSubscriptions();
        fetchStats();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('✕ Failed to revoke subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    onLogout();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatTimeRemaining = (expiryDate: number) => {
    const now = Date.now();
    const diff = expiryDate - now;
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
              CodersLab Admin
            </h1>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Logged in as</p>
                <p className="text-white font-semibold">{admin.username}</p>
              </div>
              <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen p-4">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-4 py-3 rounded-lg transition ${
                activeTab === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full text-left px-4 py-3 rounded-lg transition ${
                activeTab === 'users' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              👥 Users
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`w-full text-left px-4 py-3 rounded-lg transition ${
                activeTab === 'subscriptions' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              💎 Subscriptions
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`w-full text-left px-4 py-3 rounded-lg transition ${
                activeTab === 'config' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              ⚙️ Configuration
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`w-full text-left px-4 py-3 rounded-lg transition ${
                activeTab === 'resources' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              📦 Resources
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${message.startsWith('✓') ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
              {message}
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Dashboard</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Generations</p>
                      <p className="text-3xl font-bold text-white mt-2">{stats.totalGenerations}</p>
                    </div>
                    <div className="text-4xl">✎</div>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Builds</p>
                      <p className="text-3xl font-bold text-white mt-2">{stats.totalBuilds}</p>
                    </div>
                    <div className="text-4xl">🔨</div>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Users</p>
                      <p className="text-3xl font-bold text-white mt-2">{stats.totalUsers}</p>
                    </div>
                    <div className="text-4xl">👥</div>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Active Subscriptions</p>
                      <p className="text-3xl font-bold text-white mt-2">{stats.activeSubscriptions}</p>
                    </div>
                    <div className="text-4xl">💎</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Welcome to CodersLab Admin Panel</h3>
                <p className="text-gray-400 mb-4">
                  Manage your Minecraft code generator platform. Stats update in real-time every 5 seconds.
                </p>
                <div className="text-sm text-gray-500">
                  <p>• View usage statistics and monitor system activity</p>
                  <p>• Manage user subscriptions and access</p>
                  <p>• Configure Discord webhooks and system settings</p>
                  <p>• Monitor generated resources</p>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Users ({users.length})</h2>
              
              <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Discord Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Discord ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Verified</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Last Active</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Subscription</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 text-sm text-gray-300 font-semibold">{user.discordUsername || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-400 font-mono text-xs">{user.discordId || '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          {user.isVerified ? (
                            <span className="px-2 py-1 bg-green-900 text-green-200 rounded">Yes</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{formatDate(user.lastActive)}</td>
                        <td className="px-6 py-4 text-sm">
                          {user.hasSubscription ? (
                            <span className="px-2 py-1 bg-green-900 text-green-200 rounded">Active</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Subscriptions</h2>
              
              {/* Grant Subscription Form */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-white mb-4">🎁 Grant Pro Subscription</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Grant a Pro subscription to a user by their Discord username. User must have logged in at least once.
                </p>
                <div className="mb-4">
                  <label className="block text-gray-400 text-sm mb-2">Discord Username</label>
                  <input
                    type="text"
                    placeholder="e.g., username#1234 or username"
                    value={newSubUsername}
                    onChange={(e) => setNewSubUsername(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the Discord username exactly as it appears (case-insensitive)
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    <p>📅 Duration: <span className="text-white font-bold">{config?.subscriptionDurationDays || 30} days</span></p>
                    <p>💰 Price: <span className="text-white font-bold">₹{config?.subscriptionPrice || 299}</span></p>
                  </div>
                  <button
                    onClick={grantSubscription}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-8 py-3 rounded-lg transition disabled:opacity-50 font-bold shadow-lg"
                    style={{ boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)' }}
                  >
                    {loading ? '⏳ Granting...' : '⚡ Grant Pro Subscription'}
                  </button>
                </div>
              </div>

              {/* Subscriptions List */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Discord Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Discord ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Start Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Expiry Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Time Left</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 text-sm text-gray-300 font-semibold">{sub.discordUsername}</td>
                        <td className="px-6 py-4 text-sm text-gray-400 font-mono text-xs">{sub.discordId}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{formatDate(sub.startDate)}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{formatDate(sub.expiryDate)}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{formatTimeRemaining(sub.expiryDate)}</td>
                        <td className="px-6 py-4 text-sm">
                          {sub.status === 'active' && sub.expiryDate > Date.now() ? (
                            <span className="px-2 py-1 bg-green-900 text-green-200 rounded">Active</span>
                          ) : (
                            <span className="px-2 py-1 bg-red-900 text-red-200 rounded">Expired</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {sub.status === 'active' && (
                            <button
                              onClick={() => revokeSubscription(sub.id)}
                              disabled={loading}
                              className="text-red-400 hover:text-red-300 disabled:opacity-50"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Configuration Tab */}
          {activeTab === 'config' && config && (
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Configuration</h2>
              
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-6">
                {/* Discord Webhooks */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Discord Webhooks</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Plugin Webhook URL</label>
                      <input
                        type="text"
                        value={config.discordPluginWebhook}
                        onChange={(e) => setConfig({ ...config, discordPluginWebhook: e.target.value })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Skript Webhook URL (Forum)</label>
                      <input
                        type="text"
                        value={config.discordSkriptWebhook}
                        onChange={(e) => setConfig({ ...config, discordSkriptWebhook: e.target.value })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Config Webhook URL</label>
                      <input
                        type="text"
                        value={config.discordConfigWebhook}
                        onChange={(e) => setConfig({ ...config, discordConfigWebhook: e.target.value })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Subscription Settings */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Subscription Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Price (₹)</label>
                      <input
                        type="number"
                        value={config.subscriptionPrice}
                        onChange={(e) => setConfig({ ...config, subscriptionPrice: parseInt(e.target.value) })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Duration (days)</label>
                      <input
                        type="number"
                        value={config.subscriptionDurationDays}
                        onChange={(e) => setConfig({ ...config, subscriptionDurationDays: parseInt(e.target.value) })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Usage Limits */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Free User Limits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Daily Generations</label>
                      <input
                        type="number"
                        value={config.freeDailyGenerations}
                        onChange={(e) => setConfig({ ...config, freeDailyGenerations: parseInt(e.target.value) })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Daily Builds</label>
                      <input
                        type="number"
                        value={config.freeDailyBuilds}
                        onChange={(e) => setConfig({ ...config, freeDailyBuilds: parseInt(e.target.value) })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Public Sharing */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Public Sharing</h3>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.publicSharingEnabled}
                      onChange={(e) => setConfig({ ...config, publicSharingEnabled: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-gray-300">Enable public resource sharing to Discord</span>
                  </label>
                </div>

                {/* Save Button */}
                <button
                  onClick={saveConfig}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Resources ({resources.length})</h2>
              
              <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Filename</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">User IP</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Public</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Views</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {resources.map((resource) => (
                      <tr key={resource.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded ${
                            resource.type === 'plugin' ? 'bg-emerald-900 text-emerald-200' :
                            resource.type === 'skript' ? 'bg-blue-900 text-blue-200' :
                            'bg-yellow-900 text-yellow-200'
                          }`}>
                            {resource.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{resource.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{resource.filename}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{resource.userIp}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{formatDate(resource.createdAt)}</td>
                        <td className="px-6 py-4 text-sm">
                          {resource.isPublic ? (
                            <span className="px-2 py-1 bg-green-900 text-green-200 rounded">Yes</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{resource.viewCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
