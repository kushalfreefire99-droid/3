import { ResourceType, RESOURCE_TYPES } from '../types/index';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  resourceType: ResourceType;
}

export default function PromptInput({ value, onChange, onGenerate, isGenerating, resourceType }: PromptInputProps) {
  const metadata = RESOURCE_TYPES[resourceType];
  const charCount = value.length;
  const isValid = charCount >= 10 && charCount <= 5000;

  return (
    <div className="minecraft-panel p-6 pixel-fade-in">
      <h2 className="text-xl font-bold mb-4 text-[#50C878] minecraft-font">Describe What You Want</h2>
      
      <div className="mb-4">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Example: ${metadata.examplePrompts[0]}`}
          className="w-full h-32 px-4 py-3 minecraft-input text-gray-100 placeholder-gray-500 focus:outline-none resize-none minecraft-font"
          disabled={isGenerating}
        />
        <div className="flex justify-between items-center mt-2">
          <div className="text-sm text-gray-400 minecraft-font">
            {charCount}/5000 characters (minimum 10)
          </div>
          {!isValid && charCount > 0 && (
            <div className="text-sm text-red-500 minecraft-font font-bold">
              {charCount < 10 ? 'Too short' : 'Too long'}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-bold text-gray-300 mb-2 minecraft-font">Example prompts:</p>
        <div className="space-y-1">
          {metadata.examplePrompts.map((example, index) => (
            <button
              key={index}
              onClick={() => onChange(example)}
              className="block text-sm text-[#50C878] hover:text-[#60D888] hover:underline text-left minecraft-font transition-colors"
              disabled={isGenerating}
            >
              • {example}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={!isValid || isGenerating}
        className={`w-full py-4 px-4 font-bold transition-all minecraft-font text-lg ${
          !isValid || isGenerating
            ? 'minecraft-panel opacity-50 cursor-not-allowed text-gray-500'
            : 'minecraft-btn minecraft-emerald text-white'
        }`}
      >
        {isGenerating ? 'Generating...' : 'Generate Code'}
      </button>
    </div>
  );
}
