import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <div className="text-center space-y-12">
      {/* Hero Section */}
      <div className="space-y-6">
        <h2 className="text-4xl font-bold text-white minecraft-font">
          Choose Your Resource Type
        </h2>
        <p className="text-gray-400 text-lg minecraft-font max-w-2xl mx-auto">
          Work on multiple projects simultaneously. Each type has its own workspace with separate history and code persistence.
        </p>
      </div>

      {/* Resource Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Plugin Card */}
        <Link to="/plugin" className="block">
          <div className="minecraft-panel p-8 hover:scale-105 transition-transform duration-200 cursor-pointer block-pop">
            <div className="text-6xl mb-4 glow-emerald">⚡</div>
            <h3 className="text-2xl font-bold text-[#50C878] minecraft-font mb-3">
              Plugin
            </h3>
            <p className="text-gray-400 minecraft-font text-sm mb-4">
              Create Spigot/Paper plugins with Java
            </p>
            <ul className="text-left text-gray-500 text-xs space-y-2 minecraft-font">
              <li>• Full Java code generation</li>
              <li>• Maven project structure</li>
              <li>• Build & compile to JAR</li>
              <li>• Auto-fix compilation errors</li>
            </ul>
            <div className="mt-6 minecraft-btn minecraft-emerald px-6 py-3 text-white font-bold minecraft-font inline-block">
              Start Plugin →
            </div>
          </div>
        </Link>

        {/* Skript Card */}
        <Link to="/skript" className="block">
          <div className="minecraft-panel p-8 hover:scale-105 transition-transform duration-200 cursor-pointer block-pop">
            <div className="text-6xl mb-4 glow-diamond">◆</div>
            <h3 className="text-2xl font-bold text-[#5DADE2] minecraft-font mb-3">
              Skript
            </h3>
            <p className="text-gray-400 minecraft-font text-sm mb-4">
              Generate Skript scripts easily
            </p>
            <ul className="text-left text-gray-500 text-xs space-y-2 minecraft-font">
              <li>• Skript 2.8 compatible</li>
              <li>• Event-driven scripts</li>
              <li>• Commands & functions</li>
              <li>• Easy to customize</li>
            </ul>
            <div className="mt-6 minecraft-btn minecraft-diamond px-6 py-3 text-white font-bold minecraft-font inline-block">
              Start Skript →
            </div>
          </div>
        </Link>

        {/* Config Card */}
        <Link to="/config" className="block">
          <div className="minecraft-panel p-8 hover:scale-105 transition-transform duration-200 cursor-pointer block-pop">
            <div className="text-6xl mb-4 glow-gold">⚙</div>
            <h3 className="text-2xl font-bold text-[#F4D03F] minecraft-font mb-3">
              Config
            </h3>
            <p className="text-gray-400 minecraft-font text-sm mb-4">
              Create YAML configuration files
            </p>
            <ul className="text-left text-gray-500 text-xs space-y-2 minecraft-font">
              <li>• YAML format</li>
              <li>• Plugin configurations</li>
              <li>• Server settings</li>
              <li>• Custom structures</li>
            </ul>
            <div className="mt-6 minecraft-btn minecraft-gold px-6 py-3 text-white font-bold minecraft-font inline-block">
              Start Config →
            </div>
          </div>
        </Link>
      </div>

      {/* Features Section */}
      <div className="mt-16 minecraft-panel p-8 max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold text-white minecraft-font mb-6">
          ✨ Multi-Page Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="space-y-2">
            <div className="text-[#50C878] font-bold minecraft-font flex items-center gap-2">
              <span className="glow-emerald">↻</span> Separate Workspaces
            </div>
            <p className="text-gray-400 text-sm minecraft-font">
              Each resource type has its own workspace. Work on a plugin and skript at the same time!
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-[#5DADE2] font-bold minecraft-font flex items-center gap-2">
              <span className="glow-diamond">◈</span> Independent Storage
            </div>
            <p className="text-gray-400 text-sm minecraft-font">
              Code and history are saved separately for each type. Switch between pages without losing work.
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-[#F4D03F] font-bold minecraft-font flex items-center gap-2">
              <span className="glow-gold">≡</span> Persistent History
            </div>
            <p className="text-gray-400 text-sm minecraft-font">
              Each page maintains its own generation history. Access your previous work anytime.
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-[#50C878] font-bold minecraft-font flex items-center gap-2">
              <span className="glow-emerald">★</span> No Regeneration
            </div>
            <p className="text-gray-400 text-sm minecraft-font">
              Refresh the page or close your browser - your code will still be there when you return!
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {!isAuthenticated && (
        <div className="minecraft-panel p-6 max-w-2xl mx-auto">
          <p className="text-gray-400 minecraft-font mb-4 flex items-center justify-center gap-2">
            <span className="glow-emerald">◆</span> Free users get 3 daily generations per resource type
          </p>
          <p className="text-gray-500 minecraft-font text-sm">
            Login with Discord to get 50 daily uses!
          </p>
        </div>
      )}
    </div>
  );
}
