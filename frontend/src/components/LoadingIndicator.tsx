export default function LoadingIndicator() {
  return (
    <div className="minecraft-panel p-6 block-pop">
      <div className="flex items-center justify-center space-x-3">
        <div className="relative item-float">
          <div className="w-8 h-8 bg-[#50C878]" style={{ boxShadow: '0 0 20px #50C878, inset 2px 2px 0px rgba(255, 255, 255, 0.3), inset -2px -2px 0px rgba(0, 0, 0, 0.5)' }}></div>
        </div>
        <span className="text-white font-bold minecraft-font text-lg">Generating code...</span>
      </div>
      <p className="text-center text-sm text-gray-400 mt-3 minecraft-font">
        AI is crafting your code • This may take up to 30 seconds
      </p>
      <div className="mt-4 w-full bg-[#1a1a1a] h-3 overflow-hidden" style={{ border: '2px solid #3a3a3a', boxShadow: 'inset 2px 2px 0px rgba(0, 0, 0, 0.5)' }}>
        <div className="h-full xp-bar animate-pulse"></div>
      </div>
    </div>
  );
}
