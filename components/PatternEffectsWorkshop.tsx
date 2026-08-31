import React, { useState, useMemo } from 'react';
import { Sparkles, Play, Code, Search, ExternalLink, X, BookOpen, Send, Check, Copy, Wand2, Disc, Layers } from 'lucide-react';
import { PATTERN_EFFECTS_DEMOS, CATEGORIES, PatternEffectDemo } from '../patternEffects';

interface PatternEffectsWorkshopProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDemo: (demo: PatternEffectDemo, autoPlay?: boolean) => void;
  onTranslatePrompt: (prompt: string) => void;
  currentCode?: string;
  isPlaying?: boolean;
}

export const PatternEffectsWorkshop: React.FC<PatternEffectsWorkshopProps> = ({
  isOpen,
  onClose,
  onSelectDemo,
  onTranslatePrompt,
  currentCode,
  isPlaying,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter demos by category and search text
  const filteredDemos = useMemo(() => {
    return PATTERN_EFFECTS_DEMOS.filter((demo) => {
      const matchesCategory =
        selectedCategory === 'All' || demo.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        demo.title.toLowerCase().includes(q) ||
        demo.effectSyntax.toLowerCase().includes(q) ||
        demo.englishPrompt.toLowerCase().includes(q) ||
        demo.explanation.toLowerCase().includes(q) ||
        demo.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleCopyPrompt = (demo: PatternEffectDemo) => {
    navigator.clipboard.writeText(demo.englishPrompt);
    setCopiedId(demo.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0e111a] border border-[#232a42] rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#121624] border-b border-[#21273e] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-teal-400 flex items-center justify-center shadow-lg shadow-purple-900/30">
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono tracking-tight">
                  Strudel Pattern Effects Workshop
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300">
                  English → Strudel
                </span>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                Explore interactive demos based on the official{' '}
                <a
                  href="https://strudel.cc/workshop/pattern-effects/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-400 hover:text-teal-300 underline inline-flex items-center gap-0.5"
                >
                  Strudel Pattern Effects Workshop
                  <ExternalLink size={11} />
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors"
              title="Close Workshop (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="p-4 bg-[#0a0c14] border-b border-[#1c2236] flex flex-col md:flex-row gap-3 items-center justify-between flex-shrink-0">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                    : 'bg-[#151926] text-gray-400 hover:text-gray-200 hover:bg-[#1f2538] border border-gray-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 flex-shrink-0">
            <Search size={14} className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jux, off, vowel, delay, crush..."
              className="w-full bg-[#121624] border border-[#23293f] rounded-xl pl-9 pr-3 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
        </div>

        {/* Demos Grid / Scroll Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#07090f]">
          {filteredDemos.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-500 font-mono text-sm">
              No pattern effects found matching "{searchQuery}".
            </div>
          ) : (
            filteredDemos.map((demo) => {
              const isCurrentlyLoaded = currentCode?.trim() === demo.code.trim();

              return (
                <div
                  key={demo.id}
                  className={`bg-[#0f121d] border rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:border-purple-500/50 hover:shadow-xl ${
                    isCurrentlyLoaded
                      ? 'border-teal-500/70 ring-1 ring-teal-500/30'
                      : 'border-[#1e243a]'
                  }`}
                >
                  {/* Card Header: Title & Syntax Tag */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-gray-500 tracking-wider">
                          {demo.category}
                        </span>
                        <h3 className="text-sm font-bold text-gray-100 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{demo.title}</span>
                        </h3>
                      </div>
                      
                      <span
                        className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border shadow-sm flex-shrink-0"
                        style={{
                          backgroundColor: `${demo.visualHint}18`,
                          borderColor: `${demo.visualHint}50`,
                          color: demo.visualHint,
                        }}
                      >
                        {demo.effectSyntax}
                      </span>
                    </div>

                    {/* Plain English Translation Prompt Box */}
                    <div className="bg-[#151928] border border-[#262e49] rounded-lg p-2.5 my-2.5">
                      <div className="flex items-center justify-between text-[10px] font-mono text-purple-300 font-bold mb-1">
                        <span className="flex items-center gap-1">
                          <Wand2 size={11} className="text-purple-400" />
                          Plain English Directive:
                        </span>
                        <button
                          onClick={() => handleCopyPrompt(demo)}
                          className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                          title="Copy English prompt"
                        >
                          {copiedId === demo.id ? (
                            <>
                              <Check size={10} className="text-emerald-400" />
                              <span className="text-emerald-400 text-[9px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={10} />
                              <span className="text-[9px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-200 italic font-sans leading-relaxed">
                        "{demo.englishPrompt}"
                      </p>
                    </div>

                    {/* Sonic / Mathematical Explanation */}
                    <p className="text-xs text-gray-400 font-sans leading-relaxed mb-3">
                      {demo.explanation}
                    </p>

                    {/* Code Snippet Box */}
                    <div className="bg-[#080910] border border-[#1a1f33] rounded-lg p-2.5 font-mono text-[11px] text-teal-300 overflow-x-auto max-h-36 no-scrollbar select-text leading-5">
                      <pre>{demo.code}</pre>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-[#1a1f33]">
                    {/* Translate via AI button */}
                    <button
                      onClick={() => {
                        onTranslatePrompt(demo.englishPrompt);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181d2f] hover:bg-purple-900/50 border border-purple-800/60 text-purple-200 hover:text-white text-xs font-mono font-medium rounded-lg transition-all active:scale-95 shadow-sm"
                      title="Send this plain English prompt to the AI Translator"
                    >
                      <Sparkles size={12} className="text-purple-400" />
                      <span>Translate English</span>
                    </button>

                    {/* Load & Play Directly button */}
                    <button
                      onClick={() => {
                        onSelectDemo(demo, true);
                        onClose();
                      }}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-all active:scale-95 shadow-md ${
                        isCurrentlyLoaded && isPlaying
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-950/40'
                      }`}
                      title="Load pattern into live Strudel engine and play immediately"
                    >
                      <Play size={12} fill="currentColor" />
                      <span>Load & Play</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer / Stats */}
        <div className="px-5 py-3 bg-[#0d101a] border-t border-[#1d2236] flex items-center justify-between text-xs font-mono text-gray-400 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-purple-300">
              <Layers size={13} />
              <span>{PATTERN_EFFECTS_DEMOS.length} Workshop Demos</span>
            </span>
            <span className="text-gray-700">|</span>
            <span className="text-gray-400">All translations run live in Strudel Web Audio</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#171b2b] hover:bg-gray-800 text-gray-300 hover:text-white rounded-lg text-xs font-mono transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
