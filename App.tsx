import React, { useEffect, useRef } from 'react';
import { Send, Music, Zap, Terminal, Key, Database, MessageSquare, Monitor, LayoutTemplate } from 'lucide-react';
import { strudelService } from './services/strudelService';
import { openRouterService } from './services/openRouterService';
import { vscodeService } from './services/vscodeService';
import { jamBuddyService } from './services/jamBuddyService';
import { sampleService } from './services/sampleService';
import { StrudelEditor } from './components/Editor';
import { Visualizer } from './components/Visualizer';
import { Controls } from './components/Controls';
import { SampleManager } from './components/SampleManager';
import { AdminConsole } from './components/AdminConsole';
import { ChatMessage, AppMode, StrudelPattern, JamMode } from './types';
import { useAppStore } from './store/appStore';
import { INITIAL_PATTERN } from './constants';

const App: React.FC = () => {
  // Zustand store
  const {
    mode, setMode,
    sidebarTab, setSidebarTab,
    isPlaying, setIsPlaying,
    code, setCode,
    messages, addMessage,
    input, setInput,
    isGenerating, setIsGenerating,
    visualHint, setVisualHint,
    chaos, setChaos,
    density, setDensity,
    apiKey, setApiKey,
    selectedModel, setSelectedModel,
    showKeyModal, setShowKeyModal,
    showAdmin, setShowAdmin,
    isVSCode, setIsVSCode,
    jamMode, setJamMode,
    isJamming, setIsJamming
  } = useAppStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialization
  useEffect(() => {
    // Detect VS Code
    const inVSCode = vscodeService.getIsConnected();
    setIsVSCode(inVSCode);
    if (inVSCode) {
        setMode(AppMode.SIMPLE); // Default to simple in VS Code (Editor is external)
    }

    // Check for API Key
    if (!openRouterService.hasKey()) {
      // Try to load from environment variable
      const envKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY;
      if (envKey) {
        openRouterService.updateKey(envKey);
      } else {
        setShowKeyModal(true);
      }
    }

    // Set initial pattern
    // strudelService.setPattern(code);
    // VS Code: restore state if available
    const savedState = vscodeService.getState();
    if (savedState) {
        if(savedState.code) {
            setCode(savedState.code);
            strudelService.setPattern(savedState.code);
        }
    }

    // Init Jam Buddy Callback
    jamBuddyService.setCallback((result) => {
        setCode(result.code);
        if(result.visualHint) setVisualHint(result.visualHint);

        // Add a small notification message to chat without disrupting too much
        addMessage({
            role: 'assistant',
            content: `[Jam Buddy] ${result.explanation}`,
            metadata: { code: result.code }
        });
    });

  }, [code, addMessage, setCode, setIsVSCode, setMode, setShowKeyModal, setVisualHint]);

  // Sync model with Jam Buddy
  useEffect(() => {
      jamBuddyService.setModel(selectedModel);
  }, [selectedModel]);

  // Save state to VS Code when code changes
  useEffect(() => {
    if (vscodeService.getIsConnected()) {
        vscodeService.saveState({ code, messages });
    }
  }, [code, messages]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handlers
  const handlePlayToggle = () => {
    if (isPlaying) {
      strudelService.stop();
    } else {
      strudelService.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    strudelService.setPattern(newCode);
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openRouterService.updateKey(apiKey);
    setShowKeyModal(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMsg = input;
    setInput('');
    addMessage({ role: 'user', content: userMsg });
    setIsGenerating(true);

    try {
      const result: StrudelPattern = await openRouterService.generatePattern(
        userMsg,
        code,
        chaos,
        selectedModel
      );

      // Success
      addMessage({
        role: 'assistant',
        content: result.explanation,
        metadata: { code: result.code }
      });
      
      setCode(result.code);
      strudelService.setPattern(result.code);
      if (result.visualHint) setVisualHint(result.visualHint);

    } catch (err: any) {
      addMessage({
        role: 'system',
        content: `Error: ${err.message}`,
        type: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Jam Buddy Handlers
  const handleJamModeChange = (mode: JamMode) => {
      setJamMode(mode);
      jamBuddyService.setMode(mode);
  };
  
  const handleSurprise = async () => {
      setIsJamming(true);
      await jamBuddyService.triggerSurprise(chaos || 0.3, selectedModel);
      setIsJamming(false);
  };

  if (showAdmin) {
      return <AdminConsole onClose={() => setShowAdmin(false)} />;
  }

  // --- VS CODE LAYOUT ---
  if (isVSCode) {
    return (
      <div className="flex flex-col h-screen w-screen bg-[#09090b] text-white overflow-hidden font-sans">
        {/* Top: Header + Chat + Controls */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#121212]">
             {/* Header */}
            <div className="h-10 border-b border-gray-800 flex items-center justify-between px-4 bg-[#0f0f0f]">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-blue-600 rounded flex items-center justify-center">
                        <Music size={12} className="text-white" />
                    </div>
                    <span className="font-bold text-sm tracking-tight">Strudel<span className="text-purple-400">Speak</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-[10px] bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded border border-blue-900/50">
                        VS CODE EXTENSION
                    </div>
                    <select 
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="bg-[#18181b] text-[10px] text-gray-300 rounded px-1 py-0.5 border border-gray-700 focus:outline-none focus:border-blue-500"
                    >
                        <option value="anthropic/claude-3.5-sonnet">Claude 3.5</option>
                        <option value="google/gemini-2.0-flash-001">Gemini 2.0</option>
                        <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                        <option value="deepseek/deepseek-chat">DeepSeek</option>
                    </select>
                </div>
            </div>

            {/* Chat Area (Pinned Top) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[95%] rounded-lg p-2 text-xs ${
                        msg.role === 'user' 
                          ? 'bg-purple-900/40 text-purple-100 border border-purple-700/50' 
                          : msg.type === 'error'
                            ? 'bg-red-900/20 text-red-200 border border-red-800/50'
                            : 'bg-gray-800 text-gray-200 border border-gray-700'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.metadata?.code && (
                          <div className="mt-1 flex items-center gap-2">
                             <span className="text-[10px] font-mono bg-black/30 px-1 rounded opacity-70">{'> Code Updated'}</span>
                             <button 
                                onClick={() => vscodeService.insertCode(msg.metadata!.code!)}
                                className="text-[10px] text-blue-300 hover:text-white underline"
                             >
                                Insert
                             </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isGenerating && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 animate-pulse">
                      <Zap size={12} />
                      <span>Thinking...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
            </div>

            {/* Input & Sliders */}
            <div className="p-3 border-t border-gray-800 bg-[#18181b]">
                 <form onSubmit={handleSendMessage} className="relative mb-3">
                   <input
                     type="text"
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     placeholder="Describe pattern..."
                     className="w-full bg-[#09090b] border border-gray-700 rounded-lg pl-3 pr-8 py-2 text-xs focus:outline-none focus:border-purple-500"
                   />
                   <button 
                    type="submit"
                    disabled={isGenerating || !input.trim()}
                    className="absolute right-1 top-1 p-1 text-gray-400 hover:text-white disabled:opacity-50"
                   >
                     <Send size={14} />
                   </button>
                 </form>

                 <div className="flex gap-4">
                     <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[10px] text-gray-500">CHAOS ({Math.round(chaos * 100)}%)</label>
                        <input type="range" min="0" max="1" step="0.01" value={chaos} onChange={(e) => setChaos(parseFloat(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                     </div>
                     <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[10px] text-gray-500">DENSITY ({Math.round(density * 100)}%)</label>
                        <input type="range" min="0" max="1" step="0.01" value={density} onChange={(e) => setDensity(parseFloat(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                     </div>
                 </div>
            </div>
        </div>

        {/* Bottom: Visualizer (Pinned Bottom) */}
        <div className="h-48 border-t border-gray-800 relative">
            <Visualizer color={visualHint} isPlaying={isPlaying} isJamming={isJamming} />
            <div className="absolute top-2 left-2">
                 <button
                    onClick={handlePlayToggle}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isPlaying ? 'bg-red-500 text-white' : 'bg-green-500 text-black'
                    }`}
                 >
                    {isPlaying ? <div className="w-2 h-2 bg-current rounded-sm" /> : <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-current border-b-4 border-b-transparent ml-0.5" />}
                 </button>
            </div>
        </div>
      </div>
    );
  }

  // --- WEB LAYOUT ---
  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090b] text-white overflow-hidden font-sans">
      
      {/* Header */}
      <header className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-[#0f0f0f]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Music size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Strudel<span className="text-purple-400">Speak</span></span>
          {/* Secret Admin Toggle */}
          <button 
            onClick={() => setShowAdmin(true)} 
            className="text-xs text-gray-600 ml-2 border border-gray-800 rounded px-2 py-0.5 hover:text-red-400 hover:border-red-900 transition-colors"
            title="Open Admin Console"
          >
            v1.0.0
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex bg-[#18181b] rounded-lg p-1 border border-gray-800">
             <button 
                onClick={() => setMode(AppMode.SIMPLE)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${mode === AppMode.SIMPLE ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
             >
                <LayoutTemplate size={14} />
                SIMPLE
             </button>
             <button 
                onClick={() => setMode(AppMode.ADVANCED)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${mode === AppMode.ADVANCED ? 'bg-purple-900/50 text-purple-100 border border-purple-700/50 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
             >
                <Monitor size={14} />
                ADVANCED
             </button>
          </div>
          <div className="h-4 w-px bg-gray-800"></div>
          <button 
            onClick={() => setShowKeyModal(true)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Key size={18} />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar - Always visible in Web Mode */}
        <div className="w-80 md:w-96 flex flex-col border-r border-gray-800 bg-[#121212]">
           
           {/* Sidebar Tabs */}
           <div className="flex border-b border-gray-800">
             <button 
               onClick={() => setSidebarTab('chat')}
               className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${sidebarTab === 'chat' ? 'text-purple-400 border-b-2 border-purple-400 bg-[#18181b]' : 'text-gray-500 hover:text-gray-300'}`}
             >
               <MessageSquare size={14} />
               AI COMPOSER
             </button>
             <button 
               onClick={() => setSidebarTab('samples')}
               className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${sidebarTab === 'samples' ? 'text-blue-400 border-b-2 border-blue-400 bg-[#18181b]' : 'text-gray-500 hover:text-gray-300'}`}
             >
               <Database size={14} />
               SAMPLES
             </button>
           </div>
           
           {sidebarTab === 'chat' ? (
             <>
               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[90%] rounded-lg p-3 text-sm ${
                        msg.role === 'user' 
                          ? 'bg-purple-900/40 text-purple-100 border border-purple-700/50' 
                          : msg.type === 'error'
                            ? 'bg-red-900/20 text-red-200 border border-red-800/50'
                            : 'bg-gray-800 text-gray-200 border border-gray-700'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.metadata?.code && (
                          <div className="mt-2 text-xs font-mono bg-black/30 p-2 rounded opacity-70">
                             {'> Code Updated'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isGenerating && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 animate-pulse">
                      <Zap size={12} />
                      <span>Thinking...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
               </div>

               <div className="p-4 border-t border-gray-800 bg-[#0f0f0f]">
                 <form onSubmit={handleSendMessage} className="relative">
                   <input
                     type="text"
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     placeholder="Describe a beat..."
                     className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                   />
                   <button 
                    type="submit"
                    disabled={isGenerating || !input.trim()}
                    className="absolute right-2 top-2 p-1 text-gray-400 hover:text-white disabled:opacity-50"
                   >
                     <Send size={16} />
                   </button>
                 </form>
               </div>
             </>
           ) : (
             <SampleManager />
           )}
        </div>

        {/* Center: Visualizer & Code */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0c0c0e] relative">
          
          {/* Visualizer Area */}
          <div className={`transition-all duration-300 ease-in-out ${mode === AppMode.ADVANCED ? 'h-1/2' : 'h-full'} p-4 relative`}>
             <Visualizer color={visualHint} isPlaying={isPlaying} isJamming={isJamming} />
             {/* Large Play Button Overlay in Simple Mode */}
             {mode === AppMode.SIMPLE && !isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/50 p-4 rounded-full backdrop-blur-sm">
                        <span className="text-gray-400 text-sm font-mono">PRESS PLAY TO START ENGINE</span>
                    </div>
                </div>
             )}
          </div>

          {/* Editor Area */}
          <div className={`transition-all duration-300 ease-in-out ${mode === AppMode.ADVANCED ? 'h-1/2 opacity-100' : 'h-0 opacity-0 overflow-hidden'} border-t border-gray-800`}>
             <div className="h-full p-4">
               <StrudelEditor code={code} onChange={handleCodeChange} />
             </div>
          </div>

          {/* Floating Toggle if hidden (Mobile/Simple) */}
          {mode === AppMode.SIMPLE && (
             <button 
               onClick={() => setMode(AppMode.ADVANCED)}
               className="absolute bottom-4 right-4 bg-gray-800 hover:bg-gray-700 text-gray-300 p-3 rounded-full shadow-lg z-20 transition-all transform hover:scale-105"
               title="Open Code Editor"
             >
               <Terminal size={20} />
             </button>
          )}

        </div>

      </div>

      {/* Footer Controls (Web Mode) */}
      <Controls 
        isPlaying={isPlaying}
        onPlayToggle={handlePlayToggle}
        chaos={chaos}
        setChaos={setChaos}
        density={density}
        setDensity={setDensity}
        mode={mode}
        onModeToggle={() => setMode(mode === AppMode.SIMPLE ? AppMode.ADVANCED : AppMode.SIMPLE)}
        jamMode={jamMode}
        onJamModeChange={handleJamModeChange}
        onSurprise={handleSurprise}
        isJamming={isJamming}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#18181b] p-8 rounded-xl border border-gray-700 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Key className="text-purple-500" />
              API Key Required
            </h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              To use the AI composition features, please enter your OpenRouter API Key.
              This key is stored locally in your browser.
            </p>
            <form onSubmit={handleApiKeySubmit}>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste OpenRouter API Key here..."
                className="w-full bg-[#0f0f0f] border border-gray-700 rounded p-3 text-sm mb-4 focus:border-purple-500 focus:outline-none"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Get Key
                </a>
                <button
                  type="submit"
                  disabled={!apiKey}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Initialize Engine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
