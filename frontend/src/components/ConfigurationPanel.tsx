import { GenerationConfig, ResourceType } from '../types/index';

interface ConfigurationPanelProps {
  config: GenerationConfig;
  onChange: (config: GenerationConfig) => void;
  resourceType: ResourceType;
}

export default function ConfigurationPanel({ config, onChange, resourceType }: ConfigurationPanelProps) {
  return (
    <div className="minecraft-panel p-6 pixel-fade-in">
      <h2 className="text-xl font-bold mb-4 text-[#50C878] minecraft-font">Configuration</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2 minecraft-font">
            Minecraft Version
          </label>
          <select
            value={config.minecraftVersion}
            onChange={(e) => onChange({ ...config, minecraftVersion: e.target.value })}
            className="w-full px-3 py-2 minecraft-input text-gray-100 focus:outline-none minecraft-font"
          >
            <option value="1.19">1.19</option>
            <option value="1.20">1.20</option>
            <option value="1.21">1.21</option>
          </select>
        </div>

        {resourceType === 'plugin' && (
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 minecraft-font">
              Plugin API
            </label>
            <select
              value={config.pluginAPI}
              onChange={(e) => onChange({ ...config, pluginAPI: e.target.value as any })}
              className="w-full px-3 py-2 minecraft-input text-gray-100 focus:outline-none minecraft-font"
            >
              <option value="spigot">Spigot</option>
              <option value="paper">Paper</option>
              <option value="bukkit">Bukkit</option>
            </select>
          </div>
        )}

        {resourceType === 'skript' && (
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 minecraft-font">
              Skript Version
            </label>
            <select
              value={config.skriptVersion}
              onChange={(e) => onChange({ ...config, skriptVersion: e.target.value })}
              className="w-full px-3 py-2 minecraft-input text-gray-100 focus:outline-none minecraft-font"
            >
              <option value="2.7">2.7</option>
              <option value="2.8">2.8</option>
              <option value="2.9">2.9</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
