import { ResourceType, RESOURCE_TYPES } from '../types/index';

interface ResourceTypeSelectorProps {
  selected: ResourceType;
  onChange: (type: ResourceType) => void;
}

export default function ResourceTypeSelector({ selected, onChange }: ResourceTypeSelectorProps) {
  const types: ResourceType[] = ['plugin', 'config', 'skript', 'datapack', 'commandblock'];

  return (
    <div className="minecraft-panel p-6 pixel-fade-in">
      <h2 className="text-xl font-bold mb-4 text-[#50C878] minecraft-font">Select Resource Type</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {types.map((type) => {
          const metadata = RESOURCE_TYPES[type];
          return (
            <button
              key={type}
              onClick={() => onChange(type)}
              className={`minecraft-btn p-4 transition-all ${
                selected === type
                  ? 'minecraft-emerald'
                  : 'minecraft-panel-hover'
              }`}
            >
              <div className="font-bold text-sm text-white minecraft-font">{metadata.displayName}</div>
              <div className="text-xs text-gray-300 mt-1 minecraft-font">{metadata.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
