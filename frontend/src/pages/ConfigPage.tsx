import { useState, useEffect } from 'react';
import { Generation, GenerationConfig } from '../types/index';
import { validatePrompt } from '../utils/validation';
import { saveGeneration, getHistory, deleteGeneration, getPreferences, savePreferences } from '../utils/storage';
import { generateCode, modifyCode } from '../services/api';
import PromptInput from '../components/PromptInput';
import CodeDisplay from '../components/CodeDisplay';
import GenerationHistory from '../components/GenerationHistory';
import ConfigurationPanel from '../components/ConfigurationPanel';
import LoadingIndicator from '../components/LoadingIndicator';
import ErrorMessage from '../components/ErrorMessage';
import UsageIndicator from '../components/UsageIndicator';
import axios from 'axios';

const STORAGE_KEY = 'minecraft_generator_current_config';

export default function ConfigPage() {
  const [prompt, setPrompt] = useState('');
  const [config, setConfig] = useState<GenerationConfig>({
    minecraftVersion: '1.20',
    pluginAPI: 'spigot',
    skriptVersion: '2.8'
  });
  const [currentGeneration, setCurrentGeneration] = useState<Generation | null>(null);
  const [history, setHistory] = useState<Generation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(3);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/usage', {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });
      setUsageCount(response.data.count);
      setUsageLimit(response.data.limit);
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  };

  useEffect(() => {
    const prefs = getPreferences();
    setConfig({
      minecraftVersion: prefs.defaultMinecraftVersion,
      pluginAPI: prefs.defaultPluginAPI,
      skriptVersion: prefs.defaultSkriptVersion
    });
    
    const allHistory = getHistory();
    setHistory(allHistory.filter(gen => gen.resourceType === 'config'));
    
    // Clear current generation on page load for fresh start
    localStorage.removeItem(STORAGE_KEY);
    setCurrentGeneration(null);
    setPrompt('');
  }, []);

  useEffect(() => {
    if (currentGeneration) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentGeneration));
    }
    // Don't restore from localStorage - always start fresh
  }, [currentGeneration]);

  const handleGenerate = async () => {
    setError(null);
    const validation = validatePrompt(prompt);
    if (!validation.valid) {
      setError(validation.error || 'Invalid prompt');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await generateCode({
        prompt,
        resourceType: 'config',
        config
      });

      if (!response.success) {
        setError(response.error || 'Generation failed');
        return;
      }

      const generation: Generation = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        prompt,
        resourceType: 'config',
        code: response.code!,
        filename: response.filename!,
        language: response.language!,
        config
      };

      setCurrentGeneration(generation);
      saveGeneration(generation);
      const allHistory = getHistory();
      setHistory(allHistory.filter(gen => gen.resourceType === 'config'));
      await fetchUsage();
      
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleHistorySelect = (generation: Generation) => {
    setCurrentGeneration(generation);
    setPrompt(generation.prompt);
    setConfig(generation.config);
  };

  const handleHistoryDelete = (id: string) => {
    deleteGeneration(id);
    const allHistory = getHistory();
    setHistory(allHistory.filter(gen => gen.resourceType === 'config'));
    if (currentGeneration?.id === id) {
      setCurrentGeneration(null);
    }
  };

  const handleConfigChange = (newConfig: GenerationConfig) => {
    setConfig(newConfig);
    savePreferences({
      defaultMinecraftVersion: newConfig.minecraftVersion,
      defaultPluginAPI: newConfig.pluginAPI,
      defaultSkriptVersion: newConfig.skriptVersion
    });
  };

  const handleCodeUpdate = (updatedCode: string) => {
    if (currentGeneration) {
      const updatedGeneration = {
        ...currentGeneration,
        code: updatedCode
      };
      setCurrentGeneration(updatedGeneration);
      
      const updatedHistory = history.map(gen => 
        gen.id === currentGeneration.id ? updatedGeneration : gen
      );
      const allHistory = getHistory();
      const otherHistory = allHistory.filter(gen => gen.resourceType !== 'config');
      localStorage.setItem('minecraft_generator_history', JSON.stringify([...updatedHistory, ...otherHistory]));
      setHistory(updatedHistory);
    }
  };

  const handleModifyWithAI = async (modificationPrompt: string, currentCode: string) => {
    setError(null);
    setIsModifying(true);

    try {
      const response = await modifyCode(modificationPrompt, currentCode, 'config');

      if (!response.success) {
        setError(response.error || 'Modification failed');
        return;
      }

      if (currentGeneration) {
        const modifiedGeneration: Generation = {
          ...currentGeneration,
          code: response.code!,
          timestamp: Date.now()
        };

        setCurrentGeneration(modifiedGeneration);
        saveGeneration(modifiedGeneration);
        const allHistory = getHistory();
        setHistory(allHistory.filter(gen => gen.resourceType === 'config'));
      }
      
      await fetchUsage();
      
    } catch (err) {
      setError('An unexpected error occurred during modification. Please try again.');
    } finally {
      setIsModifying(false);
    }
  };

  const handleNewChat = () => {
    setCurrentGeneration(null);
    setPrompt('');
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <UsageIndicator 
            count={usageCount} 
            limit={usageLimit} 
            isAuthenticated={isAuthenticated}
          />
          <button
            onClick={handleNewChat}
            className="minecraft-btn minecraft-gold px-6 py-3 font-bold minecraft-font transition hover:scale-105"
            title="Start a new chat"
          >
            <span className="glow-gold">✨</span> New Chat
          </button>
        </div>

        <ConfigurationPanel
          config={config}
          onChange={handleConfigChange}
          resourceType="config"
        />

        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          resourceType="config"
        />

        {error && <ErrorMessage message={error} onRetry={handleGenerate} />}

        {isGenerating && <LoadingIndicator />}

        {currentGeneration && !isGenerating && (
          <CodeDisplay 
            generation={currentGeneration} 
            onCodeUpdate={handleCodeUpdate}
            onModifyWithAI={handleModifyWithAI}
            isModifying={isModifying}
          />
        )}
      </div>

      <div className="lg:col-span-1">
        <GenerationHistory
          history={history}
          onSelect={handleHistorySelect}
          onDelete={handleHistoryDelete}
          currentId={currentGeneration?.id}
        />
      </div>
    </div>
  );
}
