import React, { useState, useEffect } from 'react';
import { Play, Square, Sparkles, Key, Volume2, AlertCircle, RefreshCw, Radio, BookOpen } from 'lucide-react';
import { strudelService } from './services/strudelService';
import { geminiService } from './services/geminiService';
import { Editor } from './components/Editor';
import { CommandBar } from './components/CommandBar';
import { PatternEffectsWorkshop } from './components/PatternEffectsWorkshop';
import { PatternEffectDemo } from './patternEffects';
import { INITIAL_PATTERN } from './constants';

export const App: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [code, setCode] = useState(INITIAL_PATTERN);
  const [isTranslating, setIsTranslating] = useState(false);
  const [lastExplanation, setLastExplanation] = useState<string | null>(
    'Default live groove loaded: 909 Drums, 808 Sub, 303 Acid Bassline, and Juno Chords.'
  );
  const [visualHint, setVisualHint] = useState('#00ffcc');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize pattern in Strudel engine on mount
  useEffect(() => {
    strudelService.setPattern(code);

    if (!geminiService.hasKey()) {
      // Don't block the user, but key can be configured via header key icon
    }
  }, []);

  // Play / Stop Toggle
  const handlePlayToggle = async () => {
    try {
      if (isPlaying) {
        strudelService.stop();
        setIsPlaying(false);
      } else {
        await strudelService.play();
        setIsPlaying(true);
      }
    } catch (e: any) {
      console.warn('[App] Playback error:', e);
      setErrorMessage(e.message || 'Error starting audio playback');
    }
  };

  // Evaluate / Run Code manually (e.g. from editor Ctrl+Enter)
  const handleEvaluate = async () => {
    strudelService.setPattern(code);
    if (!isPlaying) {
      await strudelService.play();
      setIsPlaying(true);
    }
  };

  // Reset to initial groove
  const handleResetDefault = () => {
    setCode(INITIAL_PATTERN);
    strudelService.setPattern(INITIAL_PATTERN);
    setLastExplanation('Reset back to initial default groove.');
  };

  // Select demo from Pattern Effects Workshop
  const handleSelectDemo = async (demo: PatternEffectDemo, autoPlay = true) => {
    setCode(demo.code);
    setLastExplanation(`[Pattern Effect: ${demo.title}] ${demo.explanation}`);
    setVisualHint(demo.visualHint);
    strudelService.setPattern(demo.code);

    if (autoPlay) {
      try {
        if (!isPlaying) {
          await strudelService.play();
          setIsPlaying(true);
        }
      } catch (e) {
        console.warn('Playback on select demo error', e);
      }
    }
  };

  // AI Translation from English to Strudel Code
  const handleTranslateEnglish = async (englishPrompt: string) => {
    if (!englishPrompt.trim() || isTranslating) return;

    setIsTranslating(true);
    setErrorMessage(null);

    try {
      // Translate using Gemini (or intelligent local pattern effects translator fallback)
      const result = await geminiService.generatePattern(englishPrompt, code, 0.2);

      // Realtime update of the code in the editor
      setCode(result.code);
      setLastExplanation(result.explanation);
      if (result.visualHint) setVisualHint(result.visualHint);

      // Instantly evaluate into the playing Strudel audio engine
      strudelService.setPattern(result.code);

      // If not yet playing, start playback automatically so user hears the result immediately
      if (!isPlaying) {
        await strudelService.play();
        setIsPlaying(true);
      }
    } catch (err: any) {
      console.error('[Translation Error]', err);
      setErrorMessage(err.message || 'Failed to translate English command into Strudel code.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      geminiService.updateKey(apiKeyInput.trim());
      setShowKeyModal(false);
      setErrorMessage(null);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090b10] text-gray-100 overflow-hidden font-sans select-none">
      
      {/* 1. Header & Transport Bar */}
      <header className="h-14 bg-[#0d1017] border-b border-[#1f2438] px-4 md:px-6 flex items-center justify-between flex-shrink-0 z-20">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-teal-400 flex items-center justify-center shadow-lg shadow-purple-900/30">
            <Radio size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white font-mono">
                StrudelSpeak
              </h1>
              <span className="text-[10px] bg-purple-950/80 border border-purple-800 text-purple-300 px-1.5 py-0.2 rounded font-mono font-semibold">
                Pattern Effects
              </span>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block">
              English-driven Strudel pattern synthesizer & workshop
            </p>
          </div>
        </div>

        {/* Transport & Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Workshop Demos Button */}
          <button
            onClick={() => setShowWorkshopModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-950/90 to-slate-900 hover:from-purple-900 hover:to-slate-800 border border-purple-600/70 text-purple-200 hover:text-white font-mono text-xs font-semibold transition-all active:scale-95 shadow-md"
            title="Explore Strudel Pattern Effects Workshop Demos translated from plain English"
          >
            <BookOpen size={14} className="text-teal-400" />
            <span className="hidden md:inline">Pattern Effects Workshop</span>
            <span className="md:hidden">Workshop</span>
          </button>

          {/* Main Play / Halt Button */}
          <button
            onClick={handlePlayToggle}
            className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-lg font-mono text-xs font-bold transition-all duration-200 shadow-md active:scale-95 ${
              isPlaying
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/40 ring-2 ring-red-500/40 animate-pulse'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-950/50 ring-2 ring-emerald-400/40'
            }`}
          >
            {isPlaying ? (
              <>
                <Square size={13} fill="currentColor" />
                <span>HALT</span>
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" />
                <span>RUN (Ctrl+Enter)</span>
              </>
            )}
          </button>

          {/* Key / Settings */}
          <button
            onClick={() => setShowKeyModal(true)}
            className="p-2 text-gray-400 hover:text-white rounded-lg bg-[#151926] hover:bg-[#1f2538] border border-gray-800 transition-colors"
            title="Configure Gemini API Key"
          >
            <Key size={15} />
          </button>
        </div>
      </header>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="bg-red-950/80 border-b border-red-900/60 px-4 py-2 text-xs text-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[11px] text-red-300 hover:text-white font-mono underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Main Live Strudel Code Window */}
      <main className="flex-1 min-h-0 p-3 md:p-4 flex flex-col gap-3">
        <div className="flex-1 min-h-0">
          <Editor
            code={code}
            onChange={(newCode) => {
              setCode(newCode);
              strudelService.setPattern(newCode);
            }}
            onEvaluate={handleEvaluate}
            isPlaying={isPlaying}
            isTranslating={isTranslating}
            lastExplanation={lastExplanation}
            visualHint={visualHint}
            onResetDefault={handleResetDefault}
          />
        </div>

        {/* 3. Bottom English Command & Voice Input Bar */}
        <div className="flex-shrink-0">
          <CommandBar
            onTranslate={handleTranslateEnglish}
            isTranslating={isTranslating}
            onOpenWorkshop={() => setShowWorkshopModal(true)}
          />
        </div>
      </main>

      {/* Pattern Effects Workshop Modal */}
      <PatternEffectsWorkshop
        isOpen={showWorkshopModal}
        onClose={() => setShowWorkshopModal(false)}
        onSelectDemo={handleSelectDemo}
        onTranslatePrompt={handleTranslateEnglish}
        currentCode={code}
        isPlaying={isPlaying}
      />

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#141724] border border-[#262c45] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-950/80 border border-purple-800 rounded-xl text-purple-400">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">Gemini API Key</h3>
                <p className="text-xs text-gray-400">Enables real-time English to Strudel translation</p>
              </div>
            </div>

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Enter your Gemini API key (AIzaSy...)"
                className="w-full bg-[#0a0c14] border border-[#2a3047] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                {geminiService.hasKey() && (
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!apiKeyInput.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-all shadow-md active:scale-95"
                >
                  Save & Start
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

