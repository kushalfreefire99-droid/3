import { useState } from 'react';

interface FileTab {
  name: string;
  content: string;
  language: string;
  icon: string;
}

interface MultiFileDisplayProps {
  files: FileTab[];
  onDownloadAll?: () => void;
}

export default function MultiFileDisplay({ files, onDownloadAll }: MultiFileDisplayProps) {
  const [activeTab, setActiveTab] = useState(0);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('Code copied to clipboard!');
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (files.length === 0) return null;

  const currentFile = files[activeTab];

  return (
    <div className="minecraft-panel p-6 pixel-fade-in">
      {/* Header with tabs */}
      <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-[#50C878] minecraft-font mb-3">
            <span className="font-bold">Plugin Files</span>
          </h2>
          
          {/* File tabs */}
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`minecraft-btn px-4 py-2 text-sm minecraft-font transition-all ${
                  activeTab === index
                    ? 'minecraft-emerald'
                    : 'minecraft-panel-hover'
                }`}
              >
                <span className="mr-2">{file.icon}</span>
                <span className={activeTab === index ? 'font-bold' : 'font-normal'}>
                  {file.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          {onDownloadAll && (
            <button
              onClick={onDownloadAll}
              className="minecraft-btn minecraft-diamond px-4 py-2 text-white text-sm minecraft-font"
            >
              <span className="mr-1">📦</span>
              <span className="font-bold">Download All</span>
            </button>
          )}
          <button
            onClick={() => handleCopy(currentFile.content)}
            className="minecraft-btn minecraft-panel-hover px-4 py-2 text-white text-sm minecraft-font"
          >
            <span className="mr-1">⎘</span>
            <span className="font-bold">Copy</span>
          </button>
          <button
            onClick={() => handleDownload(currentFile.name, currentFile.content)}
            className="minecraft-btn minecraft-emerald px-4 py-2 text-white text-sm minecraft-font"
          >
            <span className="mr-1">↓</span>
            <span className="font-bold">Download</span>
          </button>
        </div>
      </div>

      {/* File info */}
      <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-gray-400 minecraft-font">
          <span className="font-bold text-gray-300">File:</span>{' '}
          <span className="font-normal">{currentFile.name}</span>
          <span className="mx-2">•</span>
          <span className="font-bold text-gray-300">Type:</span>{' '}
          <span className="font-normal">{currentFile.language}</span>
        </div>
        <div className="text-xs text-gray-500 minecraft-font">
          <span className="font-bold">{activeTab + 1}</span>
          <span className="font-normal"> of </span>
          <span className="font-bold">{files.length}</span>
          <span className="font-normal"> files</span>
        </div>
      </div>

      {/* Code display */}
      <div className="minecraft-panel p-4 overflow-x-auto">
        <pre className="text-sm text-gray-100 font-mono">
          <code>{currentFile.content}</code>
        </pre>
      </div>

      {/* Navigation hints */}
      <div className="mt-3 flex justify-between items-center text-xs text-gray-500 minecraft-font">
        <div>
          {activeTab > 0 && (
            <button
              onClick={() => setActiveTab(activeTab - 1)}
              className="hover:text-[#50C878] transition-colors"
            >
              <span className="font-bold">← Previous:</span>{' '}
              <span className="font-normal">{files[activeTab - 1].name}</span>
            </button>
          )}
        </div>
        <div>
          {activeTab < files.length - 1 && (
            <button
              onClick={() => setActiveTab(activeTab + 1)}
              className="hover:text-[#50C878] transition-colors"
            >
              <span className="font-bold">Next:</span>{' '}
              <span className="font-normal">{files[activeTab + 1].name}</span>
              <span className="font-bold"> →</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
