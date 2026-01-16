import { useState, useEffect } from 'react';
import { Generation, GenerationConfig } from '../types/index';
import { validatePrompt } from '../utils/validation';
import { saveGeneration, getHistory, deleteGeneration, getPreferences, savePreferences } from '../utils/storage';
import { generateCode, modifyCode, getBuildUsage, generatePluginFiles, enhancePrompt } from '../services/api';
import PromptInput from '../components/PromptInput';
import CodeDisplay from '../components/CodeDisplay';
import GenerationHistory from '../components/GenerationHistory';
import ConfigurationPanel from '../components/ConfigurationPanel';
import LoadingIndicator from '../components/LoadingIndicator';
import ErrorMessage from '../components/ErrorMessage';
import UsageIndicator from '../components/UsageIndicator';
import BuildProgressBar from '../components/BuildProgressBar';
import MultiFileDisplay from '../components/MultiFileDisplay';
import ProToggle from '../components/ProToggle';
import axios from 'axios';

const STORAGE_KEY = 'minecraft_generator_current_plugin';

export default function PluginPage() {
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
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState({ progress: 0, stage: 'Initializing', eta: 45 });
  const [buildError, setBuildError] = useState<string | null>(null);
  const [detailedBuildError, setDetailedBuildError] = useState<string | null>(null);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(3);
  const [buildUsage, setBuildUsage] = useState({ count: 0, limit: 10 });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showMultiFile, setShowMultiFile] = useState(false);
  const [pluginFiles, setPluginFiles] = useState<Array<{ name: string; content: string; type: string }>>([]);
  const [usePro, setUsePro] = useState(false);
  const [proUsage, setProUsage] = useState({ count: 0, limit: 3 });
  const [hasProSubscription, setHasProSubscription] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    fetchUsage();
    fetchBuildUsage();
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
      
      // Update Pro usage
      if (response.data.proCount !== undefined) {
        setProUsage({
          count: response.data.proCount,
          limit: response.data.proLimit
        });
      }
      
      // Update Pro subscription status
      if (response.data.hasProSubscription !== undefined) {
        setHasProSubscription(response.data.hasProSubscription);
        localStorage.setItem('has_pro_subscription', response.data.hasProSubscription ? 'true' : 'false');
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  };

  const fetchBuildUsage = async () => {
    try {
      const usage = await getBuildUsage();
      setBuildUsage(usage);
    } catch (err) {
      console.error('Failed to fetch build usage:', err);
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
    setHistory(allHistory.filter(gen => gen.resourceType === 'plugin'));
    
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
        resourceType: 'plugin',
        config
      }, usePro);

      if (!response.success) {
        setError(response.error || 'Generation failed');
        return;
      }

      const generation: Generation = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        prompt,
        resourceType: 'plugin',
        code: response.code!,
        filename: response.filename!,
        language: response.language!,
        config
      };

      setCurrentGeneration(generation);
      saveGeneration(generation);
      const allHistory = getHistory();
      setHistory(allHistory.filter(gen => gen.resourceType === 'plugin'));
      await fetchUsage();
      
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt || prompt.trim().length < 3) {
      setError('Please enter a prompt first');
      return;
    }

    setIsEnhancing(true);
    setError(null);

    try {
      const response = await enhancePrompt(prompt, 'plugin');

      if (!response.success) {
        setError(response.error || 'Failed to enhance prompt');
        return;
      }

      // Extract just the user-facing part (remove technical requirements)
      const enhanced = response.enhancedPrompt || prompt;
      const userFriendlyPart = enhanced.split('REQUIREMENTS')[0].replace('Create an ADVANCED, PROFESSIONAL Minecraft plugin: ', '').trim();
      
      setPrompt(userFriendlyPart);
      
    } catch (err) {
      setError('Failed to enhance prompt. Please try again.');
    } finally {
      setIsEnhancing(false);
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
    setHistory(allHistory.filter(gen => gen.resourceType === 'plugin'));
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
      const otherHistory = allHistory.filter(gen => gen.resourceType !== 'plugin');
      localStorage.setItem('minecraft_generator_history', JSON.stringify([...updatedHistory, ...otherHistory]));
      setHistory(updatedHistory);
    }
  };

  const handleModifyWithAI = async (modificationPrompt: string, currentCode: string) => {
    setError(null);
    setIsModifying(true);

    try {
      const response = await modifyCode(modificationPrompt, currentCode, 'plugin', usePro);

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
        setHistory(allHistory.filter(gen => gen.resourceType === 'plugin'));
      }
      
      await fetchUsage();
      
    } catch (err) {
      setError('An unexpected error occurred during modification. Please try again.');
    } finally {
      setIsModifying(false);
    }
  };

  const extractPluginName = (code: string): string => {
    const classMatch = code.match(/public\s+class\s+(\w+)/);
    if (classMatch) {
      return classMatch[1];
    }
    return prompt.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20) || 'Plugin';
  };

  const extractMainClass = (code: string): string => {
    const packageMatch = code.match(/package\s+([\w.]+);/);
    const packageName = packageMatch ? packageMatch[1] : 'com.coderslab.plugin';
    
    const classMatch = code.match(/public\s+class\s+(\w+)/);
    const className = classMatch ? classMatch[1] : 'Main';
    
    return `${packageName}.${className}`;
  };

  const handleBuildJar = async () => {
    if (!currentGeneration) return;

    setError(null);
    setBuildError(null);
    setDetailedBuildError(null);
    setIsBuilding(true);
    setBuildProgress({ progress: 0, stage: 'Initializing', eta: 45 });

    const buildId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const eventSource = new EventSource(`/api/build/progress/${buildId}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setBuildProgress(data);
    };
    
    eventSource.onerror = () => {
      eventSource.close();
    };

    try {
      const pluginName = extractPluginName(currentGeneration.code);
      const mainClass = extractMainClass(currentGeneration.code);

      const response = await axios.post(
        '/api/build/plugin',
        {
          pluginName,
          version: '1.0.0',
          minecraftVersion: config.minecraftVersion,
          apiType: config.pluginAPI || 'spigot',
          mainClass,
          javaCode: currentGeneration.code
        },
        {
          responseType: 'blob',
          timeout: 120000,
          headers: {
            'X-Build-Id': buildId
          }
        }
      );

      eventSource.close();

      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `coderslab_${pluginName.toLowerCase()}_${Date.now()}.jar`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await fetchBuildUsage();

    } catch (err) {
      eventSource.close();
      
      if (axios.isAxiosError(err)) {
        let errorMsg = 'Plugin build failed. Please try again.';
        let detailedError = '';
        
        if (err.response?.status === 503) {
          errorMsg = 'Maven is not installed on the server. Please download the source code instead.';
        } else if (err.response?.data) {
          if (err.response.data instanceof Blob) {
            const text = await err.response.data.text();
            try {
              const errorData = JSON.parse(text);
              errorMsg = errorData.error || errorMsg;
              detailedError = errorData.details || '';
            } catch {
              detailedError = text;
            }
          } else if (typeof err.response.data === 'object' && err.response.data.error) {
            errorMsg = err.response.data.error;
            detailedError = err.response.data.details || '';
          }
        } else if (err.message.includes('timeout')) {
          errorMsg = 'Build timeout - the compilation took too long. Try simplifying your code.';
        }
        
        setBuildError(errorMsg);
        if (detailedError) {
          setDetailedBuildError(detailedError);
        }
      } else {
        setBuildError('An unexpected error occurred during build. Please try again.');
      }
    } finally {
      setIsBuilding(false);
    }
  };

  const handleAutoFix = async () => {
    if (!currentGeneration || !detailedBuildError) return;

    setIsAutoFixing(true);
    setError(null);

    try {
      const errorLines = detailedBuildError.split('\n');
      const errorTypes = new Set<string>();
      const criticalErrors: string[] = [];
      
      for (const line of errorLines) {
        if (line.includes('[ERROR]') && line.includes('.java:')) {
          const errorMatch = line.match(/\[ERROR\].*\.java:\[\d+,\d+\]\s*(.+)/);
          if (errorMatch && errorMatch[1]) {
            const errorMsg = errorMatch[1].trim();
            if (!errorTypes.has(errorMsg.substring(0, 50))) {
              errorTypes.add(errorMsg.substring(0, 50));
              criticalErrors.push(errorMsg);
              if (criticalErrors.length >= 3) break;
            }
          }
        }
      }
      
      const errorSummary = criticalErrors.length > 0 
        ? criticalErrors.join('; ')
        : 'Multiple compilation errors detected';
      
      const fixPrompt = `Fix Java compilation errors: ${errorSummary.substring(0, 800)}. Ensure code compiles for Minecraft plugin.`;

      const response = await modifyCode(fixPrompt, currentGeneration.code, 'plugin', usePro, true); // isAutoFix = true

      if (!response.success) {
        setError(response.error || 'Auto-fix failed');
        setIsAutoFixing(false);
        return;
      }

      // Update the generation with fixed code
      const fixedGeneration: Generation = {
        ...currentGeneration,
        code: response.code!,
        timestamp: Date.now()
      };

      setCurrentGeneration(fixedGeneration);
      saveGeneration(fixedGeneration);
      const allHistory = getHistory();
      setHistory(allHistory.filter(gen => gen.resourceType === 'plugin'));

      setBuildError(null);
      setDetailedBuildError(null);
      await fetchUsage();

      // Mark auto-fixing as complete
      setIsAutoFixing(false);
      
      // Wait a moment for React to update the UI with the new code
      // This ensures the code display shows the fixed code before rebuild starts
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Now trigger rebuild with the fixed generation
      await handleBuildJarWithGeneration(fixedGeneration);

    } catch (err) {
      setError('Auto-fix failed. Please try manually editing the code.');
      setIsAutoFixing(false);
    }
  };

  const handleBuildJarWithGeneration = async (generation: Generation) => {
    if (!generation) return;

    setError(null);
    setBuildError(null);
    setDetailedBuildError(null);
    setIsBuilding(true);
    setBuildProgress({ progress: 0, stage: 'Initializing', eta: 45 });

    const buildId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const eventSource = new EventSource(`/api/build/progress/${buildId}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setBuildProgress(data);
    };
    
    eventSource.onerror = () => {
      eventSource.close();
    };

    try {
      const pluginName = extractPluginName(generation.code);
      const mainClass = extractMainClass(generation.code);

      const response = await axios.post(
        '/api/build/plugin',
        {
          pluginName,
          version: '1.0.0',
          minecraftVersion: config.minecraftVersion,
          apiType: config.pluginAPI || 'spigot',
          mainClass,
          javaCode: generation.code
        },
        {
          responseType: 'blob',
          timeout: 120000,
          headers: {
            'X-Build-Id': buildId
          }
        }
      );

      eventSource.close();

      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `coderslab_${pluginName.toLowerCase()}_${Date.now()}.jar`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await fetchBuildUsage();

    } catch (err) {
      eventSource.close();
      
      if (axios.isAxiosError(err)) {
        let errorMsg = 'Plugin build failed. Please try again.';
        let detailedError = '';
        
        if (err.response?.status === 503) {
          errorMsg = 'Maven is not installed on the server. Please download the source code instead.';
        } else if (err.response?.data) {
          if (err.response.data instanceof Blob) {
            const text = await err.response.data.text();
            try {
              const errorData = JSON.parse(text);
              errorMsg = errorData.error || errorMsg;
              detailedError = errorData.details || '';
            } catch {
              detailedError = text;
            }
          } else if (typeof err.response.data === 'object' && err.response.data.error) {
            errorMsg = err.response.data.error;
            detailedError = err.response.data.details || '';
          }
        } else if (err.message.includes('timeout')) {
          errorMsg = 'Build timeout - the compilation took too long. Try simplifying your code.';
        }
        
        setBuildError(errorMsg);
        if (detailedError) {
          setDetailedBuildError(detailedError);
        }
      } else {
        setBuildError('An unexpected error occurred during build. Please try again.');
      }
    } finally {
      setIsBuilding(false);
    }
  };

  const handleViewAllFiles = async () => {
    if (!currentGeneration) return;

    try {
      const pluginName = extractPluginName(currentGeneration.code);
      const mainClass = extractMainClass(currentGeneration.code);

      const response = await generatePluginFiles({
        pluginName,
        version: '1.0.0',
        minecraftVersion: config.minecraftVersion,
        apiType: config.pluginAPI || 'spigot',
        mainClass,
        javaCode: currentGeneration.code
      });

      if (response.success && response.files) {
        setPluginFiles(response.files);
        setShowMultiFile(true);
      } else {
        setError(response.error || 'Failed to generate plugin files');
      }
    } catch (err) {
      setError('Failed to generate plugin files. Please try again.');
    }
  };

  const handleDownloadAllFiles = () => {
    let allContent = '';
    pluginFiles.forEach(file => {
      allContent += `\n\n========== ${file.name} ==========\n\n${file.content}`;
    });

    const blob = new Blob([allContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coderslab_plugin_files_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleNewChat = () => {
    setCurrentGeneration(null);
    setPrompt('');
    setError(null);
    setBuildError(null);
    setDetailedBuildError(null);
    setShowMultiFile(false);
    setPluginFiles([]);
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
            className="minecraft-btn minecraft-emerald px-6 py-3 font-bold minecraft-font transition hover:scale-105"
            title="Start a new chat"
          >
            <span className="glow-emerald">✨</span> New Chat
          </button>
        </div>

        <ProToggle
          usePro={usePro}
          onToggle={setUsePro}
          proUsage={proUsage}
          hasProSubscription={hasProSubscription}
          isAuthenticated={isAuthenticated}
        />

        <ConfigurationPanel
          config={config}
          onChange={handleConfigChange}
          resourceType="plugin"
        />

        <div className="mb-4">
          <button
            onClick={handleEnhancePrompt}
            disabled={isEnhancing || !prompt || prompt.trim().length < 3}
            className="minecraft-btn minecraft-panel-hover px-4 py-2 text-white font-bold text-sm minecraft-font disabled:opacity-50 disabled:cursor-not-allowed"
            title="Make your prompt more detailed and specific for better results"
          >
            {isEnhancing ? '✨ Enhancing...' : '✨ Enhance Prompt'}
          </button>
          <span className="ml-3 text-sm text-gray-400">
            Click to make your prompt more detailed for advanced plugins
          </span>
        </div>

        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          resourceType="plugin"
        />

        {error && !isBuilding && <ErrorMessage message={error} onRetry={handleGenerate} />}

        {isGenerating && <LoadingIndicator />}

        {(isBuilding || buildError) && (
          <BuildProgressBar 
            progress={buildProgress.progress}
            stage={buildProgress.stage}
            eta={buildProgress.eta}
            error={buildError || undefined}
            detailedError={detailedBuildError || undefined}
            onAutoFix={handleAutoFix}
            isFixing={isAutoFixing}
            currentCode={currentGeneration?.code}
          />
        )}

        {showMultiFile && pluginFiles.length > 0 ? (
          <div>
            <button
              onClick={() => setShowMultiFile(false)}
              className="minecraft-btn minecraft-panel-hover px-4 py-2 text-white font-bold text-sm minecraft-font mb-4"
            >
              <span className="mr-1">←</span> Back to Code
            </button>
            <MultiFileDisplay 
              files={pluginFiles.map(f => ({
                name: f.name,
                content: f.content,
                language: f.type,
                icon: f.name.endsWith('.java') ? '☕' : 
                      f.name.endsWith('.xml') ? '📄' : 
                      f.name.endsWith('.yml') ? '⚙' : 
                      f.name.endsWith('.md') ? '📖' : '📝'
              }))}
              onDownloadAll={handleDownloadAllFiles}
            />
          </div>
        ) : currentGeneration && !isGenerating && (
          <CodeDisplay 
            generation={currentGeneration} 
            onCodeUpdate={handleCodeUpdate}
            onModifyWithAI={handleModifyWithAI}
            isModifying={isModifying}
            onBuildJar={handleBuildJar}
            onViewAllFiles={handleViewAllFiles}
            isBuilding={isBuilding}
            buildUsage={buildUsage}
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
