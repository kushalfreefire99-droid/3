import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import PluginPage from './pages/PluginPage';
import SkriptPage from './pages/SkriptPage';
import ConfigPage from './pages/ConfigPage';
import AdminPage from './pages/AdminPage';
import AuthCallback from './pages/AuthCallback';
import AuthModal from './components/AuthModal';
import axios from 'axios';
import { getApiUrl } from './config/api';

function Navigation() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [discordUser, setDiscordUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [dailyUsage, setDailyUsage] = useState({ count: 0, limit: 50 });
  const [resetTimer, setResetTimer] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsage();
      // Refresh usage every 3 seconds for real-time updates
      const interval = setInterval(fetchUsage, 3000);
      
      // Listen for custom usage update events
      const handleUsageUpdate = () => {
        fetchUsage();
      };
      window.addEventListener('usageUpdated', handleUsageUpdate);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('usageUpdated', handleUsageUpdate);
      };
    }
  }, [isAuthenticated]);

  // Update reset timer every second
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setResetTimer(`${hours}h ${minutes}m ${seconds}s`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('discord_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setDiscordUser(user);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to parse user data:', err);
        handleLogout();
      }
    }
  };

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(getApiUrl('/api/usage'), {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });
      
      if (response.data) {
        setDailyUsage({
          count: response.data.count || 0,
          limit: response.data.limit || 50
        });
        
        // Update subscription info in user object
        if (response.data.hasProSubscription !== undefined && discordUser) {
          const updatedUser = {
            ...discordUser,
            hasProSubscription: response.data.hasProSubscription,
            subscriptionExpiry: response.data.subscriptionExpiry
          };
          setDiscordUser(updatedUser);
          localStorage.setItem('discord_user', JSON.stringify(updatedUser));
        }
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('discord_user');
    setIsAuthenticated(false);
    setDiscordUser(null);
    window.location.reload();
  };

  const isActive = (path: string) => location.pathname === path;
  const isAdminPage = location.pathname === '/admin';

  if (isAdminPage) {
    return null;
  }

  return (
    <>
      <header className="mb-12 text-center pixel-fade-in">
        <div className="inline-block mb-6 item-float">
          <Link to="/">
            <div className="minecraft-panel p-1 cursor-pointer hover:scale-105 transition-transform">
              <div className="bg-[#1a1a1a] px-8 py-6">
                <h1 className="text-6xl font-bold minecraft-font text-[#50C878]">
                  CodersLab
                </h1>
              </div>
            </div>
          </Link>
        </div>
        <p className="text-gray-300 text-lg minecraft-font mb-2">
          Minecraft Code Generator
        </p>
        <p className="text-gray-500 text-sm minecraft-font">
          Craft plugins, configs & scripts with AI
        </p>
        
        {/* Navigation Tabs */}
        {location.pathname !== '/' && (
          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <Link to="/plugin">
              <button className={`minecraft-btn px-6 py-3 font-bold minecraft-font transition ${
                isActive('/plugin') ? 'minecraft-emerald' : 'minecraft-panel-hover'
              }`}>
                <span className="glow-emerald">⚡</span> Plugin
              </button>
            </Link>
            <Link to="/skript">
              <button className={`minecraft-btn px-6 py-3 font-bold minecraft-font transition ${
                isActive('/skript') ? 'minecraft-diamond' : 'minecraft-panel-hover'
              }`}>
                <span className="glow-diamond">◆</span> Skript
              </button>
            </Link>
            <Link to="/config">
              <button className={`minecraft-btn px-6 py-3 font-bold minecraft-font transition ${
                isActive('/config') ? 'minecraft-gold' : 'minecraft-panel-hover'
              }`}>
                <span className="glow-gold">⚙</span> Config
              </button>
            </Link>
          </div>
        )}
        
        {/* Discord Login Button */}
        {!isAuthenticated && location.pathname !== '/' && (
          <div className="mt-6 block-pop">
            <button
              onClick={() => setShowAuthModal(true)}
              className="minecraft-btn minecraft-diamond inline-flex items-center gap-3 px-8 py-4 text-white font-bold text-lg"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span className="minecraft-font">Login for 50 Daily Uses</span>
            </button>
          </div>
        )}
        
        {/* Logged in status with Discord username, usage counter, reset timer, and logout */}
        {isAuthenticated && discordUser && location.pathname !== '/' && (
          <div className="mt-6 inline-flex items-center gap-4 px-6 py-3 minecraft-panel block-pop">
            {/* Discord Avatar */}
            {discordUser.avatar && (
              <img 
                src={`https://cdn.discordapp.com/avatars/${discordUser.discordId}/${discordUser.avatar}.png?size=64`}
                alt={discordUser.username}
                className="w-10 h-10 rounded-lg border-2 border-[#50C878]"
                style={{ imageRendering: 'pixelated' }}
              />
            )}
            
            {/* Username and Status */}
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#50C878] animate-pulse" style={{ boxShadow: '0 0 8px #50C878' }}></div>
                <span className="text-[#50C878] font-bold minecraft-font text-sm">
                  {discordUser.username}
                </span>
              </div>
              <span className="text-gray-400 text-xs minecraft-font">Verified Member</span>
              
              {/* Pro Subscription Badge */}
              {discordUser.hasProSubscription && discordUser.subscriptionExpiry && (
                <div className="mt-1 flex items-center gap-1">
                  <span className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-purple-800 text-white text-xs font-bold minecraft-font rounded" style={{ boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)' }}>
                    ⚡ PRO
                  </span>
                  <span className="text-xs text-gray-500 minecraft-font">
                    {(() => {
                      const now = Date.now();
                      const expiry = discordUser.subscriptionExpiry;
                      const diff = expiry - now;
                      if (diff <= 0) return 'Expired';
                      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                      return `${days}d left`;
                    })()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Usage Counter with Reset Timer */}
            <div className="flex flex-col items-center px-4 py-2 minecraft-panel bg-gray-800/50">
              <span className="text-xs text-gray-500 minecraft-font">Daily Uses</span>
              <span className="text-lg font-bold minecraft-font" style={{
                color: dailyUsage.count >= dailyUsage.limit ? '#ef4444' : '#50C878'
              }}>
                {dailyUsage.limit - dailyUsage.count}
              </span>
              <span className="text-xs text-gray-600 minecraft-font mt-1">
                Resets in {resetTimer}
              </span>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="ml-2 px-4 py-2 minecraft-btn minecraft-panel-hover font-bold minecraft-font text-sm hover:text-red-400 transition-colors"
              title="Logout"
            >
              <span className="text-red-400">✕</span> Logout
            </button>
          </div>
        )}
      </header>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen minecraft-bg">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Navigation />
          
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/plugin" element={<PluginPage />} />
            <Route path="/skript" element={<SkriptPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>

          {/* Footer */}
          <footer className="mt-12 text-center border-t-4 border-[#3a3a3a] pt-6">
            <div className="space-y-2 minecraft-font">
              <p className="text-gray-400 font-bold">
                Made with <span className="text-red-500">♥</span> by <span className="text-[#50C878]">Seazon</span>
              </p>
              <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
                Proudly built in 
                <span className="inline-flex items-center gap-1 text-red-500 font-bold">
                  Nepal
                </span>
              </p>
              <p className="text-gray-600 text-xs">
                CodersLab • Built with React & TypeScript
              </p>
            </div>
          </footer>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
