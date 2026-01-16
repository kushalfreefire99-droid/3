interface UsageIndicatorProps {
  count: number;
  limit: number;
  isAuthenticated: boolean;
}

export default function UsageIndicator({ count, limit, isAuthenticated }: UsageIndicatorProps) {
  const remaining = limit - count;
  const percentage = (count / limit) * 100;
  
  const getBarClass = () => {
    if (percentage >= 90) return 'health-bar';
    if (percentage >= 70) return 'minecraft-gold';
    return 'xp-bar';
  };

  return (
    <div className="minecraft-panel p-4 block-pop">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-300 text-sm font-bold minecraft-font">Daily Usage</span>
          {isAuthenticated && (
            <span className="text-xs minecraft-emerald text-white px-2 py-1 minecraft-font font-bold">
              Premium
            </span>
          )}
        </div>
        <span className="text-white font-bold text-sm minecraft-font">
          {count} / {limit}
        </span>
      </div>
      
      <div className="w-full bg-[#1a1a1a] h-4 overflow-hidden" style={{ border: '2px solid #3a3a3a', boxShadow: 'inset 2px 2px 0px rgba(0, 0, 0, 0.5)' }}>
        <div
          className={`h-full ${getBarClass()} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <p className="text-xs text-gray-500 mt-2 minecraft-font">
        {remaining > 0 ? (
          <>
            {remaining} generation{remaining !== 1 ? 's' : ''} remaining today
          </>
        ) : (
          <>
            {isAuthenticated ? 'Daily limit reached' : 'Login to continue'}
          </>
        )}
      </p>
    </div>
  );
}
