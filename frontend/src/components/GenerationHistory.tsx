import { Generation } from '../types/index';

interface GenerationHistoryProps {
  history: Generation[];
  onSelect: (generation: Generation) => void;
  onDelete: (id: string) => void;
  currentId?: string;
}

export default function GenerationHistory({ history, onSelect, onDelete, currentId }: GenerationHistoryProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="minecraft-panel p-6 sticky top-6 pixel-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#50C878] minecraft-font">History</h2>
        <div className="flex items-center gap-1 text-xs text-gray-500 minecraft-font" title="Saved locally on your computer only">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Local Only</span>
        </div>
      </div>
      
      {history.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm mb-2 minecraft-font">No generations yet</p>
          <p className="text-gray-600 text-xs minecraft-font">Your history is saved locally</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
          {history.map((gen) => (
            <div
              key={gen.id}
              className={`p-3 cursor-pointer transition-all minecraft-panel-hover ${
                gen.id === currentId
                  ? 'minecraft-emerald'
                  : ''
              }`}
              onClick={() => onSelect(gen)}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold text-white uppercase minecraft-font">
                  {gen.resourceType}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(gen.id);
                  }}
                  className="text-red-500 hover:text-red-400 text-xs font-bold minecraft-font"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-300 line-clamp-2 mb-1 minecraft-font">
                {gen.prompt}
              </p>
              <p className="text-xs text-gray-500 minecraft-font">
                {formatDate(gen.timestamp)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
