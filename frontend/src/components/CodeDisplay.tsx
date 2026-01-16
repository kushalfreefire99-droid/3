import { Generation } from '../types/index';
import { useState, useEffect } from 'react';

interface CodeDisplayProps {
  generation: Generation;
  onCodeUpdate?: (updatedCode: string) => void;
  onModifyWithAI?: (modificationPrompt: string, currentCode: string) => void;
  onBuildJar?: () => void;
  onViewAllFiles?: () => void;
  isModifying?: boolean;
  isBuilding?: boolean;
  buildUsage?: { count: number; limit: number };
}

export default function CodeDisplay({ generation, onCodeUpdate, onModifyWithAI, onBuildJar, onViewAllFiles, isModifying, isBuilding, buildUsage }: CodeDisplayProps) {
  const [displayedCode, setDisplayedCode] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState('');
  const [showModifyPrompt, setShowModifyPrompt] = useState(false);
  const [modifyPrompt, setModifyPrompt] = useState('');

  useEffect(() => {
    setDisplayedCode('');
    setIsTyping(true);
    setIsEditing(false);
    setShowModifyPrompt(false);
    
    const code = generation.code;
    let currentIndex = 0;
    
    const typingInterval = setInterval(() => {
      if (currentIndex < code.length) {
        setDisplayedCode(code.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 10);

    return () => clearInterval(typingInterval);
  }, [generation.code]);

  const handleCopy = () => {
    const codeToCopy = isEditing ? editedCode : generation.code;
    navigator.clipboard.writeText(codeToCopy);
    alert('Code copied to clipboard!');
  };

  const handleDownload = () => {
    const codeToDownload = isEditing ? editedCode : generation.code;
    const blob = new Blob([codeToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generation.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEdit = () => {
    setEditedCode(generation.code);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (onCodeUpdate) {
      onCodeUpdate(editedCode);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedCode('');
  };

  const handleModifyWithAI = () => {
    if (modifyPrompt.trim() && onModifyWithAI) {
      onModifyWithAI(modifyPrompt, generation.code);
      setModifyPrompt('');
      setShowModifyPrompt(false);
    }
  };

  return (
    <div className="minecraft-panel p-6 pixel-fade-in">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-[#50C878] minecraft-font">Generated Code</h2>
        <div className="flex gap-2 flex-wrap">
          {!isEditing ? (
            <>
              {generation.resourceType === 'plugin' && onViewAllFiles && (
                <button
                  onClick={onViewAllFiles}
                  disabled={isTyping}
                  className="minecraft-btn minecraft-diamond px-4 py-2 text-white font-bold text-sm minecraft-font disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="mr-1">📁</span> View All Files
                </button>
              )}
              {generation.resourceType === 'plugin' && onBuildJar && (
                <button
                  onClick={onBuildJar}
                  disabled={isTyping || isBuilding}
                  className="minecraft-btn minecraft-gold px-4 py-2 text-white font-bold text-sm minecraft-font disabled:opacity-50 disabled:cursor-not-allowed"
                  title={buildUsage ? `${buildUsage.count}/${buildUsage.limit} builds used today` : 'Build JAR file'}
                >
                  <span className="mr-1">⚙</span> {isBuilding ? 'Building...' : 'Build JAR'}
                </button>
              )}
              <button
                onClick={() => setShowModifyPrompt(!showModifyPrompt)}
                disabled={isTyping || isModifying}
                className="minecraft-btn px-4 py-2 text-white font-bold text-sm minecraft-font disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', boxShadow: 'inset 2px 2px 0px rgba(255, 255, 255, 0.3), inset -2px -2px 0px rgba(0, 0, 0, 0.5), 4px 4px 0px rgba(0, 0, 0, 0.3)' }}
              >
                <span className="mr-1">✨</span> Modify with AI
              </button>
              <button
                onClick={handleEdit}
                disabled={isTyping}
                className="minecraft-btn minecraft-panel-hover px-4 py-2 text-white font-bold text-sm minecraft-font disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="mr-1">✎</span> Edit
              </button>
              <button
                onClick={handleCopy}
                className="minecraft-btn minecraft-panel-hover px-4 py-2 text-white font-bold text-sm minecraft-font"
              >
                <span className="mr-1">⎘</span> Copy
              </button>
              <button
                onClick={handleDownload}
                className="minecraft-btn minecraft-emerald px-4 py-2 text-white font-bold text-sm minecraft-font"
              >
                <span className="mr-1">↓</span> Download
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                className="minecraft-btn minecraft-panel-hover px-4 py-2 text-white font-bold text-sm minecraft-font"
              >
                <span className="mr-1">✕</span> Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="minecraft-btn minecraft-emerald px-4 py-2 text-white font-bold text-sm minecraft-font"
              >
                <span className="mr-1">✓</span> Save
              </button>
            </>
          )}
        </div>
      </div>

      {showModifyPrompt && !isEditing && (
        <div className="mb-4 p-4 minecraft-panel">
          <label className="block text-sm font-bold text-gray-300 mb-2 minecraft-font">
            Describe what you want to change:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={modifyPrompt}
              onChange={(e) => setModifyPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleModifyWithAI()}
              placeholder="e.g., Add error handling, Change variable names, Add comments..."
              className="flex-1 px-3 py-2 minecraft-input text-gray-100 placeholder-gray-500 focus:outline-none text-sm minecraft-font"
              disabled={isModifying}
            />
            <button
              onClick={handleModifyWithAI}
              disabled={!modifyPrompt.trim() || isModifying}
              className="minecraft-btn px-4 py-2 text-white font-bold text-sm minecraft-font disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', boxShadow: 'inset 2px 2px 0px rgba(255, 255, 255, 0.3), inset -2px -2px 0px rgba(0, 0, 0, 0.5), 4px 4px 0px rgba(0, 0, 0, 0.3)' }}
            >
              {isModifying ? 'Modifying...' : 'Apply'}
            </button>
          </div>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-gray-400 minecraft-font">
          <span className="font-bold text-gray-300">Filename:</span> {generation.filename}
        </div>
        <div className="flex items-center gap-4">
          {buildUsage && generation.resourceType === 'plugin' && (
            <div className="text-xs text-gray-500 minecraft-font">
              Builds: {buildUsage.count}/{buildUsage.limit} today
            </div>
          )}
          {isTyping && (
            <div className="flex items-center gap-2 text-[#50C878] text-sm minecraft-font font-bold">
              <div className="w-2 h-2 bg-[#50C878] animate-pulse" style={{ boxShadow: '0 0 10px #50C878' }}></div>
              <span>Generating...</span>
            </div>
          )}
          {isBuilding && (
            <div className="flex items-center gap-2 text-[#f4d03f] text-sm minecraft-font font-bold">
              <div className="w-2 h-2 bg-[#f4d03f] animate-pulse" style={{ boxShadow: '0 0 10px #f4d03f' }}></div>
              <span>Building JAR...</span>
            </div>
          )}
          {isModifying && (
            <div className="flex items-center gap-2 text-purple-400 text-sm minecraft-font font-bold">
              <div className="w-2 h-2 bg-purple-400 animate-pulse" style={{ boxShadow: '0 0 10px #9b59b6' }}></div>
              <span>AI is modifying...</span>
            </div>
          )}
          {isEditing && (
            <div className="flex items-center gap-2 text-[#5dade2] text-sm minecraft-font font-bold">
              <div className="w-2 h-2 bg-[#5dade2] animate-pulse" style={{ boxShadow: '0 0 10px #5dade2' }}></div>
              <span>Editing Mode</span>
            </div>
          )}
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={editedCode}
          onChange={(e) => setEditedCode(e.target.value)}
          className="w-full h-96 minecraft-input p-4 text-sm text-gray-100 font-mono focus:outline-none resize-none"
          spellCheck={false}
        />
      ) : (
        <div className="minecraft-panel p-4 overflow-x-auto">
          <pre className="text-sm text-gray-100 font-mono">
            <code className={isTyping ? 'typing-cursor' : ''}>
              {displayedCode}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
}
