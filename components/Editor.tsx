import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Play, Copy, Check, RotateCcw, Sparkles, Terminal, Activity, Zap, Eye, Crosshair, Radio } from 'lucide-react';
import { strudelService, CycleInfo } from '../services/strudelService';
import { analyzePatternLine, ParsedLine, MiniStepToken, SOUND_COLORS } from '../services/patternTokenizer';

interface EditorProps {
  code: string;
  onChange: (code: string) => void;
  onEvaluate?: () => void;
  isPlaying?: boolean;
  isTranslating?: boolean;
  lastExplanation?: string | null;
  visualHint?: string;
  onResetDefault?: () => void;
}

export const Editor: React.FC<EditorProps> = ({
  code,
  onChange,
  onEvaluate,
  isPlaying = false,
  isTranslating = false,
  lastExplanation,
  visualHint = '#00ffcc',
  onResetDefault,
}) => {
  const [copied, setCopied] = useState(false);
  const [showPatternCursors, setShowPatternCursors] = useState(true);
  const [showRhythmGutter, setShowRhythmGutter] = useState(true);
  const [showScanningLaser, setShowScanningLaser] = useState(true);

  const [cycleInfo, setCycleInfo] = useState<CycleInfo>({
    cycle: 0,
    phase: 0,
    beat: 1,
    step16: 0,
    step8: 0,
    cps: 0.5,
    bpm: 120,
    isPlaying: false,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lineGutterRef = useRef<HTMLDivElement>(null);

  // Sync scrolling between textarea, syntax overlay, and line gutter
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (overlayRef.current) {
      overlayRef.current.scrollTop = scrollTop;
      overlayRef.current.scrollLeft = scrollLeft;
    }
    if (lineGutterRef.current) {
      lineGutterRef.current.scrollTop = scrollTop;
    }
  };

  // Subscribe to real-time Strudel cycle playhead updates (60fps)
  useEffect(() => {
    const unsubscribe = strudelService.onCycle((info) => {
      setCycleInfo(info);
    });
    return unsubscribe;
  }, []);

  const rawLines = useMemo(() => code.split('\n'), [code]);

  // Parse lines to detect active instruments, mini-notation steps, & token cursors
  const parsedLines = useMemo<ParsedLine[]>(() => {
    return rawLines.map((line, idx) => {
      return analyzePatternLine(
        line,
        idx,
        cycleInfo.cycle,
        cycleInfo.phase,
        isPlaying
      );
    });
  }, [rawLines, cycleInfo.cycle, cycleInfo.phase, isPlaying]);

  // Handle Ctrl+Enter / Cmd+Enter to evaluate
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onEvaluate?.();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const playheadPercent = isPlaying ? cycleInfo.phase * 100 : 0;

  return (
    <div className="w-full h-full flex flex-col bg-[#080a10] border border-[#1e243a] rounded-xl overflow-hidden shadow-2xl transition-all duration-300 relative select-none">
      
      {/* 1. Real-time Rhythmic Cycle Progress Rail */}
      <div className="h-1 w-full bg-[#121626] relative overflow-hidden">
        {isPlaying && (
          <div
            className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-purple-500 shadow-[0_0_12px_#00ffcc] transition-all ease-linear"
            style={{
              width: `${playheadPercent}%`,
              transitionDuration: '16ms',
            }}
          />
        )}
      </div>

      {/* 2. Editor Header & Strudel Live HUD */}
      <div className="bg-[#0e111d] px-3.5 py-2 border-b border-[#1c2236] flex items-center justify-between select-none flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block"></span>
          </div>

          <div className="h-3.5 w-px bg-gray-800 mx-0.5"></div>

          <div className="flex items-center gap-2">
            <Terminal size={13} className="text-purple-400" />
            <span className="text-xs font-mono font-semibold text-gray-200">
              main.strudel
            </span>
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800/80 text-purple-300 font-bold tracking-wider">
              REPL
            </span>
          </div>

          {/* Real-time Strudel Playhead & Beat Monitor */}
          {isPlaying ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#070912] border border-cyan-900/50 text-[11px] font-mono">
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <Activity size={12} className="text-cyan-400 animate-pulse" />
                CYC: {cycleInfo.cycle.toFixed(2)}
              </span>

              <span className="text-gray-700">|</span>

              {/* 4-Beat Indicator */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400 font-semibold mr-0.5">BEAT:</span>
                {[1, 2, 3, 4].map((b) => {
                  const isCurrent = cycleInfo.beat === b;
                  return (
                    <span
                      key={b}
                      className={`w-3.5 h-3.5 flex items-center justify-center rounded text-[9px] font-bold transition-all duration-75 ${
                        isCurrent
                          ? b === 1
                            ? 'bg-amber-400 text-black shadow-[0_0_8px_#f59e0b] scale-110'
                            : 'bg-teal-400 text-black shadow-[0_0_8px_#14b8a6] scale-110'
                          : 'bg-gray-800/80 text-gray-500'
                      }`}
                    >
                      {b}
                    </span>
                  );
                })}
              </div>

              <span className="text-gray-700 hidden sm:inline">|</span>

              {/* 16-Step Sequencer Indicator */}
              <div className="hidden sm:flex items-center gap-0.5" title="16-Step Phase">
                {Array.from({ length: 16 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-2 rounded-[1px] transition-all ${
                      cycleInfo.step16 === i
                        ? 'bg-purple-400 shadow-[0_0_6px_#c084fc] scale-125'
                        : i % 4 === 0
                        ? 'bg-gray-700'
                        : 'bg-gray-800/60'
                    }`}
                  />
                ))}
              </div>

              <span className="text-gray-700 hidden md:inline">|</span>

              {/* BPM */}
              <span className="text-[10px] text-gray-400 font-mono hidden md:inline">
                {cycleInfo.bpm} BPM
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-900/60 border border-gray-800 text-[10px] text-gray-500 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
              <span>STOPPED</span>
            </div>
          )}

          {isTranslating && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-800/80 text-[10px] text-blue-300 font-mono animate-pulse">
              <Sparkles size={11} className="animate-spin" />
              <span className="hidden sm:inline">TRANSLATING...</span>
            </div>
          )}
        </div>

        {/* Header HUD Toggles & Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Pattern Follow Cursors Toggle */}
          <button
            onClick={() => setShowPatternCursors(!showPatternCursors)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold transition-all border ${
              showPatternCursors
                ? 'bg-purple-950/70 border-purple-600 text-purple-200'
                : 'bg-gray-900/50 border-gray-800 text-gray-500 hover:text-gray-400'
            }`}
            title="Toggle Pattern Follow Cursors"
          >
            <Crosshair size={11} className={showPatternCursors ? 'text-teal-400' : ''} />
            <span className="hidden lg:inline">Cursors</span>
          </button>

          {/* Laser Sweep Toggle */}
          <button
            onClick={() => setShowScanningLaser(!showScanningLaser)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold transition-all border ${
              showScanningLaser
                ? 'bg-cyan-950/70 border-cyan-700 text-cyan-200'
                : 'bg-gray-900/50 border-gray-800 text-gray-500 hover:text-gray-400'
            }`}
            title="Toggle Laser Playhead Beam"
          >
            <Radio size={11} className={showScanningLaser ? 'text-cyan-400' : ''} />
            <span className="hidden lg:inline">Laser</span>
          </button>

          {onEvaluate && (
            <button
              onClick={onEvaluate}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-semibold bg-[#181d30] hover:bg-purple-600 border border-gray-700/60 hover:border-purple-500 text-gray-200 hover:text-white rounded-md transition-all active:scale-95 shadow-sm"
              title="Evaluate / Run Code (Ctrl + Enter)"
            >
              <Play size={11} fill="currentColor" />
              <span>EVAL</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-gray-200 rounded hover:bg-gray-800 transition-colors"
            title="Copy Code"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>

          {onResetDefault && (
            <button
              onClick={onResetDefault}
              className="p-1.5 text-gray-400 hover:text-gray-200 rounded hover:bg-gray-800 transition-colors"
              title="Reset to Initial Pattern"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* AI Explanation Toast */}
      {lastExplanation && (
        <div className="bg-[#101424] border-b border-purple-900/40 px-3.5 py-1.5 flex items-center justify-between text-xs text-purple-200 font-mono">
          <div className="flex items-center gap-2 truncate">
            <Sparkles size={12} className="text-purple-400 flex-shrink-0" />
            <span className="font-semibold text-purple-300 text-[11px]">AI:</span>
            <span className="text-gray-300 truncate text-[11px]">{lastExplanation}</span>
          </div>
          <span className="text-[10px] text-gray-500 flex-shrink-0 ml-2 font-mono">Live Sync</span>
        </div>
      )}

      {/* 3. Main Code Body with Real-time Pattern Follow Cursors & Syntax Highlighting */}
      <div className="flex-1 flex overflow-hidden font-mono text-sm leading-6 relative bg-[#060810]">
        
        {/* Global Strudel Scanning Laser Cursor Beam */}
        {isPlaying && showScanningLaser && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20"
            style={{
              left: `calc(56px + (100% - 56px) * ${cycleInfo.phase})`,
              transition: 'left 16ms linear',
            }}
          >
            {/* Vertical Laser Line */}
            <div className="w-[2px] h-full bg-gradient-to-b from-teal-400 via-cyan-400/70 to-purple-500 shadow-[0_0_8px_#00ffcc,0_0_16px_rgba(0,255,204,0.4)]" />
            
            {/* Top Playhead Diamond */}
            <div className="absolute -top-1 -left-[3px] w-2 h-2 bg-teal-300 rotate-45 shadow-[0_0_6px_#00ffcc]" />
          </div>
        )}

        {/* Line Gutter: Line Numbers + Per-Line Rhythm Sequencer LEDs */}
        <div
          ref={lineGutterRef}
          className="w-14 py-3 bg-[#080b14] border-r border-[#161a29] text-gray-600 select-none flex-shrink-0 z-10 overflow-hidden"
        >
          {parsedLines.map((line, idx) => {
            const isLineTriggered = isPlaying && line.isTriggering;
            const subCount = Math.min(line.totalSubdivisions, 8);

            return (
              <div
                key={idx}
                className="h-6 px-1.5 flex items-center justify-between text-xs transition-colors duration-75"
              >
                {/* Micro Step Dots for this line's rhythm pattern */}
                {line.hasPattern && showRhythmGutter && isPlaying ? (
                  <div className="flex items-center gap-[2px]" title={`Line ${idx + 1} pattern rhythm`}>
                    {Array.from({ length: subCount }).map((_, stepIdx) => {
                      const isCurStep = line.activeStepIndex === stepIdx;
                      return (
                        <span
                          key={stepIdx}
                          className={`w-1 h-1 rounded-full transition-all duration-75 ${
                            isCurStep
                              ? 'scale-150 shadow-[0_0_6px_currentColor]'
                              : 'opacity-20'
                          }`}
                          style={{
                            backgroundColor: line.soundColor,
                            color: line.soundColor,
                          }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full opacity-0" />
                )}

                {/* Line Number with reactive flash */}
                <span
                  className={`font-mono text-[11px] pr-1 transition-colors duration-75 ${
                    isLineTriggered
                      ? 'text-white font-bold'
                      : 'text-gray-600'
                  }`}
                  style={{
                    color: isLineTriggered ? line.soundColor : undefined,
                  }}
                >
                  {idx + 1}
                </span>
              </div>
            );
          })}
        </div>

        {/* Code Canvas Container */}
        <div className="flex-1 relative h-full overflow-hidden">
          
          {/* Syntax & Pattern Cursors Overlay Layer */}
          <div
            ref={overlayRef}
            className="absolute inset-0 p-3 font-mono text-sm leading-6 overflow-auto pointer-events-none whitespace-pre select-none tab-4 z-1"
          >
            {parsedLines.map((line, lineIdx) => {
              const isLineTriggered = isPlaying && line.isTriggering;

              return (
                <div
                  key={lineIdx}
                  className="h-6 flex items-center relative transition-colors duration-75 rounded-[2px]"
                  style={{
                    backgroundColor: isLineTriggered
                      ? `${line.soundColor}12` // Subtle 7% row highlight on trigger
                      : 'transparent',
                  }}
                >
                  {/* Per-line scanning micro-cursor playhead under pattern lines */}
                  {isPlaying && showPatternCursors && line.hasPattern && (
                    <div
                      className="absolute top-0 bottom-0 pointer-events-none"
                      style={{
                        left: `${cycleInfo.phase * 100}%`,
                        transition: 'left 16ms linear',
                      }}
                    >
                      <div
                        className="w-1 h-full opacity-60 blur-[1px]"
                        style={{ backgroundColor: line.soundColor }}
                      />
                    </div>
                  )}

                  {/* Render Syntax Tokens with Live Mini-Notation Pattern Cursors */}
                  {line.tokens.map((token, tokIdx) => {
                    if (token.type === 'comment') {
                      return (
                        <span key={tokIdx} className="text-gray-500 italic">
                          {token.text}
                        </span>
                      );
                    }

                    if (token.type === 'function') {
                      return (
                        <span key={tokIdx} className="text-cyan-300 font-semibold">
                          {token.text}
                        </span>
                      );
                    }

                    if (token.type === 'effect') {
                      return (
                        <span key={tokIdx} className="text-purple-400 font-medium">
                          {token.text}
                        </span>
                      );
                    }

                    if (token.type === 'number') {
                      return (
                        <span key={tokIdx} className="text-amber-300">
                          {token.text}
                        </span>
                      );
                    }

                    if (token.type === 'punctuation') {
                      return (
                        <span key={tokIdx} className="text-gray-400">
                          {token.text}
                        </span>
                      );
                    }

                    // Mini-Notation String with Tokenized Step Cursors!
                    if (token.isMiniString) {
                      const quote = token.text[0];
                      const closingQuote = token.text[token.text.length - 1];
                      const inner = token.text.slice(1, -1);
                      const activeStep = token.activeStep;

                      return (
                        <span key={tokIdx} className="inline">
                          <span className="text-emerald-400/80">{quote}</span>

                          {/* If no steps or not playing, render standard string */}
                          {!activeStep || !isPlaying || !showPatternCursors ? (
                            <span className="text-emerald-300">{inner}</span>
                          ) : (
                            // Render mini-steps with character-exact active cursor follow
                            <span className="inline">
                              {renderInteractiveMiniSteps(inner, activeStep, line.soundColor)}
                            </span>
                          )}

                          <span className="text-emerald-400/80">{closingQuote}</span>
                        </span>
                      );
                    }

                    // Default plain text (spaces, indentation, etc.)
                    return (
                      <span key={tokIdx} className="text-gray-300">
                        {token.text}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Interactive Textarea Layer (for live editing & typing) */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="w-full h-full p-3 bg-transparent text-transparent caret-teal-400 font-mono text-sm leading-6 resize-none focus:outline-none focus:ring-0 selection:bg-purple-600/40 selection:text-white tab-4 relative z-2 whitespace-pre"
            placeholder="// Speak or type English commands below to translate into Strudel code live..."
          />
        </div>
      </div>

      {/* 4. Bottom Status & Engine Information */}
      <div className="bg-[#090c16] px-3.5 py-1.5 border-t border-[#181d2e] flex justify-between items-center text-[11px] font-mono text-gray-400 select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-purple-300">
            <Zap size={11} className="text-amber-400" />
            <span>Strudel Pattern Engine</span>
          </span>
          <span className="text-gray-700">|</span>
          <span className="text-teal-400 flex items-center gap-1">
            <Crosshair size={11} />
            <span>Pattern Cursors Active</span>
          </span>
          <span className="text-gray-700 hidden sm:inline">|</span>
          <span className="text-gray-400 hidden sm:inline">{rawLines.length} lines</span>
        </div>

        <div className="flex items-center gap-3">
          <span>Run: <kbd className="bg-gray-800/90 text-gray-300 px-1.5 py-0.5 rounded border border-gray-700 text-[10px]">Ctrl+Enter</kbd></span>
        </div>
      </div>
    </div>
  );
};

/**
 * Helper: Renders mini-notation tokens with character-exact active step highlights
 * without modifying character count or causing layout shifts in the monospace editor.
 */
function renderInteractiveMiniSteps(
  rawContent: string,
  activeStepInfo: { currentStep: number; totalSteps: number; activeText: string; isRest: boolean; startChar: number; endChar: number },
  color: string
): React.ReactNode {
  const { startChar, endChar, isRest } = activeStepInfo;

  if (startChar < 0 || endChar <= startChar || endChar > rawContent.length) {
    return <span className="text-emerald-300">{rawContent}</span>;
  }

  const prefix = rawContent.slice(0, startChar);
  const active = rawContent.slice(startChar, endChar);
  const suffix = rawContent.slice(endChar);

  return (
    <>
      {prefix && <span className="text-emerald-300/80">{prefix}</span>}
      <span
        className="font-semibold transition-colors duration-75 rounded-[2px]"
        style={{
          backgroundColor: isRest ? 'rgba(100, 116, 139, 0.3)' : `${color}40`,
          color: isRest ? '#94a3b8' : '#ffffff',
          textShadow: isRest ? 'none' : `0 0 8px ${color}`,
        }}
      >
        {active}
      </span>
      {suffix && <span className="text-emerald-300/80">{suffix}</span>}
    </>
  );
}
