import React, { useState } from 'react';
import { Sparkles, AlertTriangle, Check, RefreshCw, X, ArrowRight, Lightbulb, Volume2, ShieldCheck, Tag, ThumbsUp } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { learningMemoryService } from '../services/learningMemoryService';
import { strudelService } from '../services/strudelService';
import { LineDiagnosisRequest, LineDiagnosisResponse } from '../types';

interface LineDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineIndex: number;
  lineContent: string;
  fullPattern: string;
  onApplyFix: (newCode: string, explanation: string, visualHint?: string) => void;
  onMemoryLearned?: (count: number) => void;
}

const ISSUE_PRESETS = [
  { id: 'silent', label: '🔇 No sound / Silent', reason: 'Line produces no sound or is silent' },
  { id: 'bass-overlap', label: '🎸 Bass overlap / muddy sustain', reason: 'Bass notes are sustaining and overlapping into muddy low-end rumble without clipping or voice choking' },
  { id: 'syntax', label: '⚠️ Syntax error / Glitch', reason: 'Syntax error or broken punctuation' },
  { id: 'filter', label: '🎛️ Filter / DSP not working', reason: 'Filter sweep, resonance or DSP effect is not working as expected' },
  { id: 'sound', label: '🥁 Wrong instrument / sample', reason: 'Wrong sound or sample name, want a better instrument' },
  { id: 'rhythm', label: '⚡ Rhythm / Speed issue', reason: 'Rhythm is out of sync or wrong speed / meter' },
  { id: 'harsh', label: '🔊 Too harsh / Clipping', reason: 'Distortion is too harsh or volume is clipping' },
];

export const LineDiagnosticModal: React.FC<LineDiagnosticModalProps> = ({
  isOpen,
  onClose,
  lineIndex,
  lineContent,
  fullPattern,
  onApplyFix,
  onMemoryLearned,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('silent');
  const [customReason, setCustomReason] = useState<string>('');
  const [desiredOutcome, setDesiredOutcome] = useState<string>('');
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<LineDiagnosisResponse | null>(null);
  const [markedOk, setMarkedOk] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentReasonText = customReason.trim() || ISSUE_PRESETS.find(p => p.id === selectedPreset)?.reason || 'Line is not working properly';

  const handleDiagnoseAndFix = async () => {
    setIsDiagnosing(true);
    setErrorMessage(null);
    setMarkedOk(false);

    try {
      const request: LineDiagnosisRequest = {
        lineIndex,
        lineContent,
        fullPattern,
        issueReason: currentReasonText,
        desiredOutcome: desiredOutcome.trim() || undefined
      };

      const result = await geminiService.diagnoseAndFixLine(request);
      setDiagnosisResult(result);

      // Audition fix live in Strudel audio engine immediately
      strudelService.setPattern(result.updatedFullPattern);
    } catch (err: any) {
      console.error('[Line Diagnosis Error]', err);
      setErrorMessage(err.message || 'Failed to diagnose and fix line');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleMarkOkAndRemember = () => {
    if (!diagnosisResult) return;

    // 1. Record into persistent learning memory
    const saved = learningMemoryService.addCorrection({
      issueDescription: currentReasonText + (desiredOutcome ? ` (Target: ${desiredOutcome})` : ''),
      faultyCode: lineContent,
      fixedCode: diagnosisResult.fixedLine,
      fullPatternContext: diagnosisResult.updatedFullPattern,
      lineIndex,
      tags: diagnosisResult.suggestedTag ? [diagnosisResult.suggestedTag, 'user-verified'] : ['user-verified'],
      notes: `Diagnosed: ${diagnosisResult.diagnosis}. ${diagnosisResult.explanation}`
    });

    setMarkedOk(true);

    // 2. Apply to editor and state
    onApplyFix(
      diagnosisResult.updatedFullPattern,
      `[AI Self-Correction Learned] ${diagnosisResult.explanation}`,
      diagnosisResult.visualHint || '#00ffcc'
    );

    if (onMemoryLearned) {
      onMemoryLearned(learningMemoryService.getCount());
    }

    // Close after short feedback delay
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleApplyWithoutLearning = () => {
    if (!diagnosisResult) return;
    onApplyFix(
      diagnosisResult.updatedFullPattern,
      `[AI Fix Applied] ${diagnosisResult.explanation}`,
      diagnosisResult.visualHint || '#00ffcc'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#111422] border border-[#272e48] rounded-2xl max-w-xl w-full p-5 md:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#21273e] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-950/70 border border-amber-600/60 rounded-xl text-amber-400">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>Report & Fix Line #{lineIndex + 1}</span>
                <span className="text-[10px] bg-purple-950 border border-purple-800 text-purple-300 px-2 py-0.5 rounded font-semibold">
                  Self-Healing Engine
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Diagnose why this line didn't reach the desired outcome and train the AI memory.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Faulty Line Display */}
        <div className="bg-[#090b12] border border-[#1e2338] rounded-xl p-3 font-mono text-xs">
          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
            <span>Reported Line:</span>
            <span className="text-amber-400/90 font-semibold">Line {lineIndex + 1}</span>
          </div>
          <div className="text-amber-200 bg-amber-950/20 px-2.5 py-1.5 rounded border border-amber-900/30 overflow-x-auto whitespace-pre">
            {lineContent.trim() || '// [Empty Line]'}
          </div>
        </div>

        {/* Issue Presets */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
            <Lightbulb size={13} className="text-amber-400" />
            <span>What went wrong with this line?</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ISSUE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setSelectedPreset(preset.id);
                  if (customReason === preset.reason) setCustomReason('');
                }}
                className={`px-2.5 py-2 rounded-xl text-left text-xs font-mono transition-all border ${
                  selectedPreset === preset.id
                    ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-sm'
                    : 'bg-[#151928] border-gray-800/80 text-gray-400 hover:text-gray-200 hover:bg-[#1a2033]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Details / Desired Outcome */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-mono text-gray-400 mb-1 block">
              Issue description (optional):
            </label>
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="e.g. 808 numeric name is silent"
              className="w-full bg-[#0a0c14] border border-[#252b42] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-mono text-gray-400 mb-1 block">
              Desired musical outcome (optional):
            </label>
            <input
              type="text"
              value={desiredOutcome}
              onChange={(e) => setDesiredOutcome(e.target.value)}
              placeholder="e.g. Deep punchy sub with resonance"
              className="w-full bg-[#0a0c14] border border-[#252b42] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
        </div>

        {/* Action Button: Ask AI to Fix Line */}
        {!diagnosisResult && (
          <div className="pt-2">
            <button
              onClick={handleDiagnoseAndFix}
              disabled={isDiagnosing}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-teal-500 hover:from-purple-500 hover:to-teal-400 text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all disabled:opacity-50"
            >
              {isDiagnosing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Diagnosing & Generating Surgical Correction...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Ask AI to Diagnose & Fix Line #{lineIndex + 1}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-red-950/70 border border-red-800/80 rounded-xl text-xs text-red-200 font-mono">
            {errorMessage}
          </div>
        )}

        {/* Diagnosis & Proposed Fix View */}
        {diagnosisResult && (
          <div className="space-y-3 bg-[#0d101a] border border-[#22283f] rounded-xl p-4 animate-fadeIn">
            
            {/* Diagnosis Headline */}
            <div className="flex items-start gap-2">
              <Sparkles size={15} className="text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-mono font-bold text-teal-300">
                  Diagnosis: {diagnosisResult.diagnosis}
                </h4>
                <p className="text-xs text-gray-300 mt-0.5">
                  {diagnosisResult.explanation}
                </p>
              </div>
            </div>

            {/* Side-by-side / Before & After Diff */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono pt-1">
              {/* Before */}
              <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-2.5">
                <div className="text-[10px] text-red-400 font-bold uppercase mb-1 flex items-center gap-1">
                  <span>❌ Original Defective Line:</span>
                </div>
                <div className="text-red-300 whitespace-pre-wrap break-all">
                  {diagnosisResult.originalLine}
                </div>
              </div>

              {/* After */}
              <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-lg p-2.5">
                <div className="text-[10px] text-emerald-400 font-bold uppercase mb-1 flex items-center gap-1">
                  <span>✅ AI Corrected Line (Auditioning Live):</span>
                </div>
                <div className="text-emerald-200 font-semibold whitespace-pre-wrap break-all">
                  {diagnosisResult.fixedLine}
                </div>
              </div>
            </div>

            {/* Live Audio Feedback Badge */}
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 bg-[#090b12] px-3 py-1.5 rounded-lg border border-gray-800">
              <span className="flex items-center gap-1.5 text-teal-300">
                <Volume2 size={13} className="text-teal-400 animate-pulse" />
                <span>Live Audio Stream Synced & Playing Correction</span>
              </span>
              {diagnosisResult.suggestedTag && (
                <span className="flex items-center gap-1 text-[10px] text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800 font-semibold">
                  <Tag size={10} />
                  <span>#{diagnosisResult.suggestedTag}</span>
                </span>
              )}
            </div>

            {/* Verification & Learning Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              
              {/* MARK OK & REMEMBER (Core Learning Button) */}
              <button
                type="button"
                onClick={handleMarkOkAndRemember}
                disabled={markedOk}
                className={`flex-1 w-full py-2.5 px-4 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                  markedOk
                    ? 'bg-emerald-600 text-white shadow-emerald-900/50 ring-2 ring-emerald-400'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black'
                }`}
              >
                {markedOk ? (
                  <>
                    <Check size={15} />
                    <span>🧠 Learned & Saved to AI Memory!</span>
                  </>
                ) : (
                  <>
                    <ThumbsUp size={14} />
                    <span>✅ Mark OK & Save to AI Memory</span>
                  </>
                )}
              </button>

              {/* Try Another Fix */}
              <button
                type="button"
                onClick={handleDiagnoseAndFix}
                disabled={isDiagnosing || markedOk}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-[#171b2c] hover:bg-[#20263d] border border-gray-700/80 text-gray-300 font-mono text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                title="Ask AI for an alternative fix"
              >
                <RefreshCw size={13} className={isDiagnosing ? 'animate-spin' : ''} />
                <span>Try Another</span>
              </button>

              {/* Apply without permanent learning */}
              <button
                type="button"
                onClick={handleApplyWithoutLearning}
                disabled={markedOk}
                className="w-full sm:w-auto px-3 py-2.5 text-gray-400 hover:text-white font-mono text-xs transition-colors"
              >
                Apply Only
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
