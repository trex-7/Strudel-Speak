import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Sparkles, Key, Volume2, AlertCircle, RefreshCw, Radio, BookOpen, Brain, Layers, Crosshair, Wrench, Copy, Check, RotateCcw, Dices, Shuffle, Clock, UserCheck, ShieldAlert, LogOut, Lock, Unlock } from 'lucide-react';
import { strudelService } from './services/strudelService';
import { geminiService } from './services/geminiService';
import { learningMemoryService } from './services/learningMemoryService';
import { Editor } from './components/Editor';
import { CommandBar } from './components/CommandBar';
import { PatternEffectsWorkshop } from './components/PatternEffectsWorkshop';
import { LearningMemoryModal } from './components/LearningMemoryModal';
import { LineDiagnosticModal } from './components/LineDiagnosticModal';
import { CountdownTimer } from './components/CountdownTimer';
import { PatternEffectDemo } from './patternEffects';
import { getRandomInitialPattern, DEFAULT_PATTERNS } from './constants';

const GUEST_SESSION_DURATION = 5 * 60; // 5 minutes in seconds

export const App: React.FC = () => {
  // Start on a random different default pattern at every launch
  const [initialPreset] = useState(() => getRandomInitialPattern());
  const [isPlaying, setIsPlaying] = useState(false);
  const [code, setCode] = useState(initialPreset.code);
  const [isTranslating, setIsTranslating] = useState(false);
  const [lastExplanation, setLastExplanation] = useState<string | null>(
    `[${initialPreset.genre}] ${initialPreset.explanation}`
  );
  const [visualHint, setVisualHint] = useState(initialPreset.visualHint);
  const UNLIMITED_AI_PASSWORD = '2106';

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [isUnlockedWithPassword, setIsUnlockedWithPassword] = useState<boolean>(() => {
    return localStorage.getItem('strudelspeak_unlocked_pw') === '2106';
  });

  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [diagnosticLine, setDiagnosticLine] = useState<{ index: number; content: string } | null>(null);
  const [showLiveTracks, setShowLiveTracks] = useState(false);
  const [showPatternCursors, setShowPatternCursors] = useState(true);
  const [showScanningLaser, setShowScanningLaser] = useState(true);
  const [memoryCount, setMemoryCount] = useState<number>(() => learningMemoryService.getCount());
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [learnedBanner, setLearnedBanner] = useState<string | null>(null);

  // Guest Mode State (Default launched with 5 minute countdown timeout unless unlocked by password 2106)
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    return localStorage.getItem('strudelspeak_unlocked_pw') !== '2106';
  });
  const [guestSecondsRemaining, setGuestSecondsRemaining] = useState(GUEST_SESSION_DURATION);
  const [isGuestTimedOut, setIsGuestTimedOut] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Initialize pattern in Strudel engine on mount
  useEffect(() => {
    strudelService.setPattern(code);

    if (!geminiService.hasKey()) {
      // Don't block the user, but key can be configured via header key icon
    }
  }, []);

  // 5-Minute Guest Mode Countdown Timer
  useEffect(() => {
    if (!isGuestMode || isGuestTimedOut || isTimerPaused) return;

    const timer = setInterval(() => {
      setGuestSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGuestTimedOut(true);
          // Keep audio playback and live coding running! Only disable AI requests.
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGuestMode, isGuestTimedOut, isTimerPaused]);

  // Toggle pause on 5 minute timer
  const handleTogglePauseTimer = () => {
    setIsTimerPaused((prev) => !prev);
  };

  // Reset 5 minute timer
  const handleResetTimer = () => {
    setGuestSecondsRemaining(GUEST_SESSION_DURATION);
    setIsGuestTimedOut(false);
    setIsTimerPaused(false);
    setErrorMessage(null);
  };

  // Play / Stop Toggle (Always functional - never blocked by guest timer)
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

  // Pick a fresh random pattern groove
  const handleRandomPattern = async () => {
    // Pick a random pattern different from current code
    const candidates = DEFAULT_PATTERNS.filter(p => p.code !== code);
    const chosen = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : getRandomInitialPattern();

    setCode(chosen.code);
    strudelService.setPattern(chosen.code);
    setLastExplanation(`[${chosen.genre}] ${chosen.explanation}`);
    setVisualHint(chosen.visualHint);

    if (isPlaying) {
      try {
        await strudelService.play();
      } catch (e) {
        console.warn('Playback error on random pattern switch', e);
      }
    }
  };

  // Reset / shuffle to random groove
  const handleResetDefault = () => {
    handleRandomPattern();
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

    // Check if Guest AI is timed out and not unlocked with password 2106 or personal API key
    if (isGuestMode && isGuestTimedOut && !isUnlockedWithPassword && !geminiService.hasKey()) {
      setShowUnlockModal(true);
      setErrorMessage(
        'Guest AI 5-minute trial reached to limit public server spend. Manual live-coding, synthesis, presets, and audio playback remain 100% active! Enter passcode (pw=2106) for unlimited AI.'
      );
      return;
    }

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

  const handleUnlockPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput.trim() === UNLIMITED_AI_PASSWORD) {
      setIsGuestMode(false);
      setIsGuestTimedOut(false);
      setIsUnlockedWithPassword(true);
      localStorage.setItem('strudelspeak_unlocked_pw', UNLIMITED_AI_PASSWORD);
      setShowUnlockModal(false);
      setPasscodeError(null);
      setErrorMessage(null);
      setLearnedBanner('Unlimited AI Mode Unlocked (Passcode 2106 Verified)');
      setTimeout(() => setLearnedBanner(null), 5000);
    } else {
      setPasscodeError('Incorrect passcode. Enter the valid passcode (2106) to unlock unlimited AI.');
    }
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      geminiService.updateKey(apiKeyInput.trim());
      setIsGuestMode(false);
      setIsGuestTimedOut(false);
      setIsUnlockedWithPassword(true);
      setShowKeyModal(false);
      setErrorMessage(null);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090b10] text-gray-100 overflow-hidden font-sans select-none">
      
      {/* 1. Header & Transport Bar */}
      <header className="h-11 bg-[#0d1017] border-b border-[#1f2438] px-3 md:px-4 flex items-center justify-between flex-shrink-0 z-20">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-teal-400 flex items-center justify-center shadow-md shadow-purple-900/30">
            <Radio size={15} className="text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-bold tracking-tight text-white font-mono">
              StrudelSpeak
            </h1>
            <span className="text-[9px] bg-purple-950/80 border border-purple-800 text-purple-300 px-1.5 py-0.2 rounded font-mono font-semibold hidden sm:inline">
              Live Coding
            </span>

            {/* 5-Minute Countdown Timer Widget */}
            <CountdownTimer
              secondsRemaining={guestSecondsRemaining}
              totalDuration={GUEST_SESSION_DURATION}
              isPaused={isTimerPaused}
              isTimedOut={isGuestTimedOut}
              onTogglePause={handleTogglePauseTimer}
              onReset={handleResetTimer}
              onOpenUnlockModal={() => {
                setPasscodeInput('');
                setPasscodeError(null);
                setShowUnlockModal(true);
              }}
              isUnlockedWithPassword={isUnlockedWithPassword || !isGuestMode}
            />
          </div>
        </div>

        {/* Transport & Controls - Positioned Top Right of Screen */}
        <div className="flex items-center gap-1 md:gap-1.5">
          
          {/* Tracks Inspector Toggle */}
          <button
            onClick={() => setShowLiveTracks(!showLiveTracks)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold transition-all border ${
              showLiveTracks
                ? 'bg-teal-950/80 border-teal-500 text-teal-200'
                : 'bg-[#151926] hover:bg-[#1f2538] border-gray-800 text-gray-400 hover:text-gray-200'
            }`}
            title="Toggle Live Quality Track Strips"
          >
            <Layers size={11} className={showLiveTracks ? 'text-teal-400' : ''} />
            <span className="hidden sm:inline">Tracks</span>
          </button>

          {/* Pattern Follow Cursors Toggle */}
          <button
            onClick={() => setShowPatternCursors(!showPatternCursors)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold transition-all border ${
              showPatternCursors
                ? 'bg-purple-950/80 border-purple-600 text-purple-200'
                : 'bg-[#151926] hover:bg-[#1f2538] border-gray-800 text-gray-400 hover:text-gray-200'
            }`}
            title="Toggle Pattern Follow Cursors"
          >
            <Crosshair size={11} className={showPatternCursors ? 'text-teal-400' : ''} />
            <span className="hidden md:inline">Cursors</span>
          </button>

          {/* Laser Sweep Toggle */}
          <button
            onClick={() => setShowScanningLaser(!showScanningLaser)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold transition-all border ${
              showScanningLaser
                ? 'bg-cyan-950/80 border-cyan-600 text-cyan-200'
                : 'bg-[#151926] hover:bg-[#1f2538] border-gray-800 text-gray-400 hover:text-gray-200'
            }`}
            title="Toggle Laser Playhead Beam"
          >
            <Radio size={11} className={showScanningLaser ? 'text-cyan-400' : ''} />
            <span className="hidden lg:inline">Laser</span>
          </button>

          {/* Quick Line Diagnosis Action */}
          <button
            onClick={() => {
              setDiagnosticLine({ index: 0, content: code.split('\n')[0] || '' });
            }}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold bg-[#141829] hover:bg-[#1f2640] border border-amber-600/50 text-amber-300 hover:text-amber-200 transition-all"
            title="Report defective line and self-heal with AI"
          >
            <Wrench size={11} className="text-amber-400" />
            <span className="hidden sm:inline">Report</span>
          </button>

          <div className="h-3.5 w-px bg-gray-800 mx-0.5"></div>

          {/* AI Memory Bank Button */}
          <button
            onClick={() => setShowMemoryModal(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#151926] hover:bg-[#1f2538] border border-purple-800/70 text-purple-200 hover:text-white font-mono text-[10px] font-semibold transition-all active:scale-95 shadow-sm"
            title="View and manage AI Learned Memory Rules & Self-Corrections"
          >
            <Brain size={11} className="text-teal-400" />
            <span className="hidden sm:inline">Memory</span>
            <span className="bg-teal-500/20 text-teal-300 px-1 py-0.2 rounded font-bold border border-teal-500/40 text-[9px]">
              {memoryCount}
            </span>
          </button>

          {/* Workshop Demos Button */}
          <button
            onClick={() => setShowWorkshopModal(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-purple-950/90 to-slate-900 hover:from-purple-900 hover:to-slate-800 border border-purple-600/70 text-purple-200 hover:text-white font-mono text-[10px] font-semibold transition-all active:scale-95 shadow-sm"
            title="Explore Strudel Pattern Effects Workshop Demos translated from plain English"
          >
            <BookOpen size={11} className="text-teal-400" />
            <span>Workshop</span>
          </button>

          {/* Main Play / Halt Button */}
          <button
            onClick={handlePlayToggle}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-mono text-[11px] font-bold transition-all duration-200 shadow-sm active:scale-95 ${
              isPlaying
                ? 'bg-red-600 hover:bg-red-500 text-white ring-1 ring-red-400 animate-pulse'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black ring-1 ring-emerald-400/60'
            }`}
          >
            {isPlaying ? (
              <>
                <Square size={11} fill="currentColor" />
                <span>HALT</span>
              </>
            ) : (
              <>
                <Play size={11} fill="currentColor" />
                <span>RUN</span>
              </>
            )}
          </button>

          {/* Passcode Unlock / Lock State Button */}
          <button
            onClick={() => {
              setPasscodeInput('');
              setPasscodeError(null);
              setShowUnlockModal(true);
            }}
            className={`p-1 rounded-md border transition-all ${
              isUnlockedWithPassword || !isGuestMode
                ? 'bg-emerald-950/80 text-emerald-300 hover:text-white border-emerald-700/60'
                : 'text-amber-400 hover:text-amber-200 bg-[#151926] hover:bg-[#1f2538] border-amber-800/60'
            }`}
            title={
              isUnlockedWithPassword || !isGuestMode
                ? 'Unlimited AI Mode Active (Passcode 2106 Verified)'
                : 'Enter Password (pw=2106) for Unlimited AI'
            }
          >
            {isUnlockedWithPassword || !isGuestMode ? <Unlock size={12} /> : <Lock size={12} />}
          </button>
        </div>
      </header>

      {/* Guest Mode Expired Banner */}
      {isGuestMode && isGuestTimedOut && !isUnlockedWithPassword && (
        <div className="bg-amber-950/90 border-b border-amber-800/80 px-4 py-2 text-xs text-amber-200 flex items-center justify-between shadow-md z-30">
          <div className="flex items-center gap-2">
            <ShieldAlert size={15} className="text-amber-400 flex-shrink-0" />
            <span>
              <strong>Guest AI Quota Paused (5-Minute Public Limit):</strong> AI prompt generation is paused to protect server spend. <strong>Manual live-coding, audio playback, sound packs, presets, and DSP effects remain 100% active and unlimited.</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setPasscodeInput('');
                setPasscodeError(null);
                setShowUnlockModal(true);
              }}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-mono text-[11px] font-bold rounded transition-all shadow-sm active:scale-95 flex items-center gap-1"
            >
              <Lock size={11} />
              <span>Unlock Unlimited AI (pw=2106)</span>
            </button>
          </div>
        </div>
      )}

      {/* Error alert if any */}
      {errorMessage && (
        <div className="bg-red-950/80 border-b border-red-900/60 px-3 py-1 text-xs text-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[10px] text-red-300 hover:text-white font-mono underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Main Live Strudel Code Window - Maximized */}
      <main className="flex-1 min-h-0 p-1.5 md:p-2 flex flex-col gap-1.5 overflow-hidden">
        <div className="flex-1 min-h-0 h-full">
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
            showLiveTracks={showLiveTracks}
            onToggleLiveTracks={() => setShowLiveTracks(!showLiveTracks)}
            showPatternCursors={showPatternCursors}
            onTogglePatternCursors={() => setShowPatternCursors(!showPatternCursors)}
            showScanningLaser={showScanningLaser}
            onToggleScanningLaser={() => setShowScanningLaser(!showScanningLaser)}
            onOpenMemoryModal={() => setShowMemoryModal(true)}
            memoryCount={memoryCount}
            onMemoryUpdated={(count) => setMemoryCount(count)}
            onReportLine={(lineIdx, content) => setDiagnosticLine({ index: lineIdx, content })}
          />
        </div>

        {/* 3. Bottom English Command & Voice Input Bar */}
        <div className="flex-shrink-0">
          <CommandBar
            onTranslate={handleTranslateEnglish}
            isTranslating={isTranslating}
            onOpenWorkshop={() => setShowWorkshopModal(true)}
            isGuestAiTimedOut={isGuestMode && isGuestTimedOut && !isUnlockedWithPassword && !geminiService.hasKey()}
            onOpenUnlockModal={() => {
              setPasscodeInput('');
              setPasscodeError(null);
              setShowUnlockModal(true);
            }}
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

      {/* Line Diagnostic & Auto-Healing Modal */}
      {diagnosticLine && (
        <LineDiagnosticModal
          isOpen={!!diagnosticLine}
          onClose={() => setDiagnosticLine(null)}
          lineIndex={diagnosticLine.index}
          lineContent={diagnosticLine.content}
          fullPattern={code}
          onApplyFix={(newCode, explanation, visualHint) => {
            setCode(newCode);
            strudelService.setPattern(newCode);
            setLearnedBanner(`Line ${diagnosticLine.index + 1} diagnosed and trained into AI memory`);
            setTimeout(() => setLearnedBanner(null), 5000);
          }}
          onMemoryLearned={(count) => {
            setMemoryCount(count);
          }}
        />
      )}

      {/* Passcode Unlock Modal for Unlimited AI */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#141724] border border-[#262c45] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-950/80 border border-amber-800 rounded-xl text-amber-400">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">Unlock Unlimited AI</h3>
                <p className="text-xs text-gray-400">Access password required to unlock unrestricted AI generation</p>
              </div>
            </div>

            <form onSubmit={handleUnlockPasscode} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">
                  Access Password (pw=2106)
                </label>
                <input
                  type="password"
                  value={passcodeInput}
                  onChange={(e) => {
                    setPasscodeInput(e.target.value);
                    setPasscodeError(null);
                  }}
                  placeholder="Enter password (2106)..."
                  className="w-full bg-[#0a0c14] border border-[#2a3047] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 font-mono tracking-wider"
                  autoFocus
                />
                {passcodeError && (
                  <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {passcodeError}
                  </p>
                )}
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-xl text-[11px] text-amber-300/90 leading-relaxed">
                <strong>Public Quota Guard:</strong> Public guest sessions are capped at 5 minutes to prevent unwanted API quota spend. Entering the access password (<code>2106</code>) removes all timeouts and enables unlimited AI prompt synthesis.
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUnlockModal(false);
                    setShowKeyModal(true);
                  }}
                  className="text-xs text-gray-400 hover:text-white underline font-mono"
                >
                  Or enter Gemini API Key →
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUnlockModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!passcodeInput.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <Unlock size={12} />
                    <span>Unlock Access</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

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

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowKeyModal(false);
                    setPasscodeInput('');
                    setPasscodeError(null);
                    setShowUnlockModal(true);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-200 underline font-mono"
                >
                  ← Unlock with Passcode (2106)
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!apiKeyInput.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-all shadow-md active:scale-95"
                  >
                    Save & Start
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Learned Memory Bank Modal */}
      <LearningMemoryModal
        isOpen={showMemoryModal}
        onClose={() => setShowMemoryModal(false)}
        onMemoryUpdated={(count) => setMemoryCount(count)}
      />
    </div>
  );
};

export default App;

