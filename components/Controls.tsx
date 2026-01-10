import React from 'react';
import { Play, Square, RefreshCw, Settings2, Sparkles, Zap, Cpu } from 'lucide-react';
import { JamMode } from '../types';
import { AVAILABLE_MODELS } from '../constants';

interface ControlsProps {
  isPlaying: boolean;
  onPlayToggle: () => void;
  chaos: number;
  setChaos: (val: number) => void;
  density: number;
  setDensity: (val: number) => void;
  mode: string;
  onModeToggle: () => void;
  // Jam Buddy Props
  jamMode: JamMode;
  onJamModeChange: (mode: JamMode) => void;
  onSurprise: () => void;
  isJamming: boolean;
  // Model Selection
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onPlayToggle,
  chaos,
  setChaos,
  density,
  setDensity,
  mode,
  onModeToggle,
  jamMode,
  onJamModeChange,
  onSurprise,
  isJamming,
  selectedModel,
  onModelChange
}) => {
  return (
    <div className="h-20 bg-[#18181b] border-t border-gray-800 flex items-center px-4 md:px-6 gap-4 md:gap-8 z-10 select-none overflow-x-auto overflow-y-hidden no-scrollbar">
      {/* Transport */}
      <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
        <button
          onClick={onPlayToggle}
          className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${
            isPlaying 
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-900/50' 
              : 'bg-green-500 hover:bg-green-600 text-black shadow-green-900/50'
          } shadow-lg`}
        >
          {isPlaying ? <Square fill="currentColor" size={16} /> : <Play fill="currentColor" size={18} className="ml-1" />}
        </button>
        <div className="hidden md:flex flex-col">
          <span className="text-xs text-gray-500 font-mono tracking-widest">STATUS</span>
          <span className={`text-sm font-bold font-mono ${isPlaying ? 'text-green-400' : 'text-gray-400'}`}>
            {isPlaying ? 'RUNNING' : 'STOPPED'}
          </span>
        </div>
      </div>

      <div className="h-10 w-px bg-gray-700 mx-2 flex-shrink-0"></div>

      {/* Quick Controls */}
      <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
        
        {/* Sliders Group */}
        <div className="flex gap-4 flex-1 min-w-[200px]">
            <div className="flex flex-col gap-2 flex-1">
            <div className="flex justify-between text-xs font-mono text-gray-400">
                <span>CHAOS</span>
                <span>{Math.round(chaos * 100)}%</span>
            </div>
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={chaos}
                onChange={(e) => setChaos(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            </div>

            <div className="flex flex-col gap-2 flex-1">
            <div className="flex justify-between text-xs font-mono text-gray-400">
                <span>DENSITY</span>
                <span>{Math.round(density * 100)}%</span>
            </div>
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={density}
                onChange={(e) => setDensity(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            </div>
        </div>
        
        {/* Jam Buddy Controls - Always Visible now */}
        <div className="flex items-center gap-2 px-2 py-1.5 md:px-3 md:py-2 bg-[#0f0f0f] rounded-lg border border-gray-800 flex-shrink-0">
            <div className="flex flex-col mr-1 md:mr-2">
                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={10} /> <span className="hidden sm:inline">Jam Buddy</span>
                </span>
                <span className="text-[10px] text-gray-500 hidden sm:inline">Auto-Evolve</span>
            </div>
            
            <select 
                value={jamMode}
                onChange={(e) => onJamModeChange(Number(e.target.value))}
                className="bg-[#27272a] text-xs text-gray-200 rounded px-1 py-1 md:px-2 border border-gray-700 focus:outline-none focus:border-purple-500 w-20 md:w-auto"
            >
                <option value={0}>OFF</option>
                <option value={8}>8 BARS</option>
                <option value={16}>16 BARS</option>
                <option value={32}>32 BARS</option>
            </select>

            <button 
                onClick={onSurprise}
                disabled={isJamming}
                className="ml-1 md:ml-2 flex items-center gap-1.5 px-2 py-1 md:px-3 bg-purple-900/30 hover:bg-purple-800/50 text-purple-200 text-xs rounded border border-purple-800 transition-all active:scale-95 disabled:opacity-50"
                title="Trigger immediate variation"
            >
                <Zap size={12} className={isJamming ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">SURPRISE ME</span>
            </button>
        </div>

        {/* Model Selection */}
        <div className="flex items-center gap-2 px-2 py-1.5 md:px-3 md:py-2 bg-[#0f0f0f] rounded-lg border border-gray-800 flex-shrink-0">
            <div className="flex flex-col mr-1 md:mr-2">
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Cpu size={10} /> <span className="hidden sm:inline">AI Model</span>
                </span>
                <span className="text-[10px] text-gray-500 hidden sm:inline">OpenRouter</span>
            </div>
            
            <select 
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                className="bg-[#27272a] text-xs text-gray-200 rounded px-1 py-1 md:px-2 border border-gray-700 focus:outline-none focus:border-blue-500 w-24 md:w-auto"
            >
                {AVAILABLE_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                ))}
            </select>
        </div>
      </div>

      {/* Modes */}
      <div className="hidden xl:flex gap-2 flex-shrink-0">
        <button 
          onClick={onModeToggle}
          className="flex items-center gap-2 px-3 py-2 bg-[#27272a] hover:bg-[#3f3f46] rounded text-xs font-mono text-gray-300 transition-colors"
        >
          <Settings2 size={14} />
          {mode}
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-[#27272a] hover:bg-[#3f3f46] rounded text-xs font-mono text-gray-300 transition-colors">
          <RefreshCw size={14} />
          RESET
        </button>
      </div>
    </div>
  );
};
