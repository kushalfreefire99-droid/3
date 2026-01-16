import { useState } from 'react';

interface ProToggleProps {
  usePro: boolean;
  onToggle: (usePro: boolean) => void;
  proUsage: { count: number; limit: number };
  hasProSubscription: boolean;
  isAuthenticated: boolean;
}

export default function ProToggle({ usePro, onToggle, proUsage, hasProSubscription, isAuthenticated }: ProToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const canUsePro = isAuthenticated && proUsage.count < proUsage.limit;
  const proRemaining = proUsage.limit - proUsage.count;

  const handleToggle = () => {
    if (!isAuthenticated) {
      alert('⚠️ Pro version requires Discord authentication.\n\nPlease login to access Pro features:\n• All verified users get 3 Pro uses daily\n• Pro subscription gives 50 Pro uses daily');
      return;
    }

    if (!canUsePro) {
      if (hasProSubscription) {
        alert(`❌ Daily Pro limit reached!\n\nYou've used all ${proUsage.limit} Pro generations today.\nYour limit will reset tomorrow.`);
      } else {
        alert(`❌ Daily Pro limit reached!\n\nYou've used all ${proUsage.limit} Pro generations today.\n\n✨ Upgrade to Pro subscription for 50 daily Pro uses!\nContact admin for subscription.`);
      }
      return;
    }

    onToggle(!usePro);
  };

  return (
    <div className="relative">
      <div className="minecraft-panel p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Info Section */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold minecraft-font text-gray-300">
                AI Model
              </span>
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="w-4 h-4 bg-gray-600 text-white text-xs font-bold rounded-full hover:bg-gray-500 transition-colors"
              >
                ?
              </button>
            </div>
            
            <div className="text-xs text-gray-400 minecraft-font">
              {usePro ? (
                <span className="text-purple-400 font-bold">
                  ⚡ Pro: Best quality, detailed code
                </span>
              ) : (
                <span className="text-emerald-400 font-bold">
                  ⚡ Free: Fast, optimized generation
                </span>
              )}
            </div>

            {/* Pro Usage Counter */}
            {isAuthenticated && (
              <div className="mt-2 text-xs minecraft-font">
                <span className="text-gray-500">Pro Uses: </span>
                <span className={`font-bold ${proRemaining > 0 ? 'text-purple-400' : 'text-red-400'}`}>
                  {proRemaining}
                </span>
                <span className="text-gray-600"> / {proUsage.limit}</span>
                {!hasProSubscription && (
                  <span className="ml-2 text-emerald-500 text-xs">
                    (Verified)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Toggle Switch */}
          <button
            onClick={handleToggle}
            disabled={!canUsePro && usePro}
            className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
              usePro 
                ? 'bg-gradient-to-r from-purple-600 to-purple-800' 
                : 'bg-gradient-to-r from-emerald-600 to-emerald-800'
            } ${!canUsePro && usePro ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
            style={{
              boxShadow: usePro 
                ? '0 0 10px rgba(168, 85, 247, 0.5)' 
                : '0 0 10px rgba(16, 185, 129, 0.5)'
            }}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 ${
                usePro ? 'right-1' : 'left-1'
              }`}
              style={{
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                {usePro ? '⚡' : '✓'}
              </div>
            </div>
          </button>
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 minecraft-panel bg-gray-900 border-2 border-gray-700 z-10 text-xs minecraft-font">
            <div className="space-y-2">
              <div>
                <span className="text-emerald-400 font-bold">Free Version:</span>
                <p className="text-gray-400 mt-1">Fast generation with optimized AI model. Perfect for quick prototypes.</p>
              </div>
              <div>
                <span className="text-purple-400 font-bold">Pro Version:</span>
                <p className="text-gray-400 mt-1">Best quality AI model with detailed, comprehensive code generation.</p>
              </div>
              <div className="pt-2 border-t border-gray-700">
                <p className="text-yellow-400 font-bold">Pro Limits:</p>
                <p className="text-gray-400 mt-1">• All verified users: 3 Pro uses daily</p>
                <p className="text-gray-400">• Pro subscription: 50 Pro uses daily</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
