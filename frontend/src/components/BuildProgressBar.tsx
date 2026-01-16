import { useState } from 'react';

interface BuildProgressBarProps {
  progress: number;
  stage: string;
  eta: number;
  error?: string;
  detailedError?: string;
  onAutoFix?: () => void;
  isFixing?: boolean;
  currentCode?: string;
}

export default function BuildProgressBar({ progress, stage, eta, error, detailedError, onAutoFix, isFixing, currentCode }: BuildProgressBarProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');

  const formatETA = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleChatGPTHelp = async () => {
    setCopyStatus('copying');

    // Validate that we have the necessary data
    if (!error && !currentCode) {
      setCopyStatus('error');
      alert('Error: No error message or code available to send to ChatGPT.');
      setTimeout(() => setCopyStatus('idle'), 2000);
      return;
    }

    // Create a formatted prompt for ChatGPT
    const prompt = `I'm getting a compilation error in my Minecraft plugin. Can you help me fix it?

**Error:**
${error || 'Build failed'}

${detailedError ? `**Detailed Error:**
\`\`\`
${detailedError}
\`\`\`

` : ''}**Current Code:**
\`\`\`java
${currentCode || 'No code available'}
\`\`\`

Please provide the corrected code that fixes these compilation errors.`;

    try {
      // Check if clipboard API is available
      if (!navigator.clipboard) {
        throw new Error('Clipboard API not available');
      }

      // Copy prompt to clipboard
      await navigator.clipboard.writeText(prompt);
      
      setCopyStatus('success');
      
      // Open ChatGPT in new tab
      const chatWindow = window.open('https://chatgpt.com/', '_blank');
      
      if (!chatWindow) {
        // Popup was blocked
        alert('✅ Prompt copied to clipboard!\n\n⚠️ Popup blocked. Please allow popups or manually open:\nhttps://chatgpt.com/\n\nThen paste (Ctrl+V or Cmd+V) the prompt.');
      } else {
        // Success - show brief notification
        setTimeout(() => {
          alert('✅ Prompt copied to clipboard!\n\n📋 ChatGPT is now open in a new tab.\n\n👉 Paste the prompt (Ctrl+V or Cmd+V) and send it to get help fixing your code.');
        }, 500);
      }
      
      // Reset status after 3 seconds
      setTimeout(() => setCopyStatus('idle'), 3000);
      
    } catch (err) {
      // Handle clipboard errors
      console.error('Failed to copy to clipboard:', err);
      setCopyStatus('error');
      
      // Provide fallback options
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      const fallbackMsg = `❌ Failed to copy to clipboard: ${errorMsg}\n\n📋 Please copy this prompt manually:\n\n${prompt.substring(0, 500)}...\n\n(Full prompt is too long to display. Try using a different browser or enabling clipboard permissions.)`;
      
      alert(fallbackMsg);
      
      // Still try to open ChatGPT
      window.open('https://chatgpt.com/', '_blank');
      
      // Reset status after 3 seconds
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  };

  // Get button text based on copy status
  const getButtonText = () => {
    switch (copyStatus) {
      case 'copying':
        return 'Copying...';
      case 'success':
        return 'Copied!';
      case 'error':
        return 'Failed';
      default:
        return 'Ask ChatGPT';
    }
  };

  // Get button style based on copy status
  const getButtonClass = () => {
    const baseClass = 'minecraft-btn px-4 py-2 text-white font-bold text-sm transition-all';
    switch (copyStatus) {
      case 'copying':
        return `${baseClass} minecraft-panel opacity-70 cursor-wait`;
      case 'success':
        return `${baseClass} minecraft-emerald`;
      case 'error':
        return `${baseClass} bg-red-600 hover:bg-red-700`;
      default:
        return `${baseClass} minecraft-diamond`;
    }
  };

  if (error) {
    return (
      <div className="minecraft-panel p-4 mb-4 border-2 border-red-500">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-6 h-6 bg-red-500 flex items-center justify-center text-white font-bold text-lg">
            ✕
          </div>
          <span className="text-lg text-red-400">
            <span className="font-bold">Build Failed</span>
          </span>
        </div>
        <div className="text-sm text-gray-300 leading-relaxed mb-3">
          {error}
        </div>
        
        {detailedError && (
          <details className="mb-3">
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 font-bold">
              Show detailed error
            </summary>
            <div className="mt-2 p-3 bg-black/30 rounded text-xs text-gray-400 font-mono overflow-x-auto max-h-48 overflow-y-auto">
              <pre>{detailedError}</pre>
            </div>
          </details>
        )}
        
        <div className="flex gap-2 flex-wrap items-center">
          {onAutoFix && (
            <button
              onClick={onAutoFix}
              disabled={isFixing}
              className="minecraft-btn minecraft-emerald px-4 py-2 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="mr-1 glow-emerald">⚡</span> {isFixing ? 'Fixing...' : 'Fix with AI'}
            </button>
          )}
          <button
            onClick={handleChatGPTHelp}
            disabled={copyStatus === 'copying'}
            className={getButtonClass()}
            title="Copy error and code to clipboard, then open ChatGPT"
          >
            <span className="mr-1 glow-diamond">
              {copyStatus === 'copying' ? '⏳' : copyStatus === 'success' ? '✓' : copyStatus === 'error' ? '✕' : '◆'}
            </span> 
            {getButtonText()}
          </button>
          <div className="text-xs text-gray-500">
            <span className="font-bold">Tip:</span> <span className="font-normal ml-1">You can also manually edit the code or download the source.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="minecraft-panel p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[#f4d03f] minecraft-font">
          <span className="font-bold">{stage}</span>
        </span>
        <span className="text-xs text-gray-400 minecraft-font">
          <span className="font-bold">ETA:</span> <span className="font-normal">{formatETA(eta)}</span>
        </span>
      </div>
      
      {/* Progress bar container */}
      <div className="relative h-6 minecraft-panel overflow-hidden">
        {/* Progress fill */}
        <div
          className="absolute top-0 left-0 h-full transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(135deg, #f4d03f 0%, #f39c12 100%)',
            boxShadow: 'inset 2px 2px 0px rgba(255, 255, 255, 0.3), inset -2px -2px 0px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Animated shine effect */}
          <div
            className="absolute top-0 left-0 h-full w-full opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%)',
              animation: 'shine 2s infinite'
            }}
          />
        </div>
        
        {/* Progress text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold minecraft-font text-white">
            {progress}%
          </span>
        </div>
      </div>
      
      {/* Build stages indicator */}
      <div className="mt-3 flex justify-between text-xs minecraft-font">
        <span className={progress >= 10 ? 'text-[#50C878] font-bold' : 'text-gray-500 font-normal'}>Setup</span>
        <span className={progress >= 40 ? 'text-[#50C878] font-bold' : 'text-gray-500 font-normal'}>Config</span>
        <span className={progress >= 45 ? 'text-[#50C878] font-bold' : 'text-gray-500 font-normal'}>Compile</span>
        <span className={progress >= 95 ? 'text-[#50C878] font-bold' : 'text-gray-500 font-normal'}>Package</span>
        <span className={progress >= 100 ? 'text-[#50C878] font-bold' : 'text-gray-500 font-normal'}>Done</span>
      </div>
    </div>
  );
}
