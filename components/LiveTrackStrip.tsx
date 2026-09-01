import React, { useState, useMemo } from 'react';
import { Sparkles, AlertTriangle, Check, Volume2, VolumeX, Radio, RotateCcw, Wrench, RefreshCw, ThumbsDown, ThumbsUp, Tag, ChevronDown, ChevronUp, Layers, CheckSquare, Square, Zap, ShieldCheck } from 'lucide-react';
import { trackService } from '../services/trackService';
import { geminiService } from '../services/geminiService';
import { learningMemoryService } from '../services/learningMemoryService';
import { strudelService, CycleInfo } from '../services/strudelService';
import { TrackItem, BatchTrackFixRequest } from '../types';

interface LiveTrackStripProps {
  code: string;
  onChange: (newCode: string) => void;
  isPlaying: boolean;
  cycleInfo: CycleInfo;
  onOpenDetailedLineDiagnosis: (lineIndex: number, lineContent: string) => void;
  onMemoryLearned?: (count: number) => void;
}

export const LiveTrackStrip: React.FC<LiveTrackStripProps> = ({
  code,
  onChange,
  isPlaying,
  cycleInfo,
  onOpenDetailedLineDiagnosis,
  onMemoryLearned,
}) => {
  const [flaggedTrackIds, setFlaggedTrackIds] = useState<Set<string>>(new Set());
  const [fixingTrackId, setFixingTrackId] = useState<string | null>(null);
  const [isBatchFixing, setIsBatchFixing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [recentlyFixedTracks, setRecentlyFixedTracks] = useState<Record<string, { original: string; fixed: string; explanation: string; tag?: string; isLearned: boolean }>>({});
  const [quickFixToast, setQuickFixToast] = useState<string | null>(null);

  // Extract tracks from current active pattern code
  const tracks = useMemo(() => {
    return trackService.extractTracks(code);
  }, [code]);

  // Handle single track checkbox toggle
  const toggleFlagTrack = (track: TrackItem) => {
    setFlaggedTrackIds(prev => {
      const next = new Set(prev);
      if (next.has(track.id)) {
        next.delete(track.id);
      } else {
        next.add(track.id);
      }
      return next;
    });
  };

  // Toggle flag all tracks
  const toggleFlagAll = () => {
    if (flaggedTrackIds.size === tracks.length) {
      setFlaggedTrackIds(new Set());
    } else {
      setFlaggedTrackIds(new Set(tracks.map(t => t.id)));
    }
  };

  // Mute / Unmute track on the fly
  const handleToggleMute = (track: TrackItem) => {
    const updated = trackService.toggleMute(code, track);
    onChange(updated);
    strudelService.setPattern(updated);
  };

  // 1-Click Instant Quick Fix for a specific track on the fly
  const handleInstantQuickFix = async (track: TrackItem, presetReason?: string) => {
    setFixingTrackId(track.id);
    setQuickFixToast(null);

    const issueReason = presetReason || `Track "${track.soundName}" produces bad audio, silent output or wrong rhythm`;
    
    try {
      const diagnosis = await geminiService.diagnoseAndFixLine({
        lineIndex: track.lineIndex,
        lineContent: track.rawCode,
        fullPattern: code,
        issueReason,
        desiredOutcome: 'Fix the track so it grooves nicely in key with alphabetical sample names and clean rhythm'
      });

      // Update code in editor and live audio
      onChange(diagnosis.updatedFullPattern);
      strudelService.setPattern(diagnosis.updatedFullPattern);

      // Record recent fix for 1-click verification & undo
      setRecentlyFixedTracks(prev => ({
        ...prev,
        [track.id]: {
          original: track.rawCode,
          fixed: diagnosis.fixedLine,
          explanation: diagnosis.explanation,
          tag: diagnosis.suggestedTag || track.soundName,
          isLearned: false
        }
      }));

      // Unflag track since it's now fixed
      setFlaggedTrackIds(prev => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });

      setQuickFixToast(`Fixed Track ${track.soundName.toUpperCase()}: ${diagnosis.explanation}`);
      setTimeout(() => setQuickFixToast(null), 5000);
    } catch (err: any) {
      console.error('[Instant Quick Fix Error]', err);
      setQuickFixToast(`Error fixing track: ${err.message || 'Unknown error'}`);
    } finally {
      setFixingTrackId(null);
    }
  };

  // Batch Auto-Fix All Flagged Tracks on the fly
  const handleBatchFixFlagged = async () => {
    const flaggedList = tracks.filter(t => flaggedTrackIds.has(t.id));
    if (flaggedList.length === 0) return;

    setIsBatchFixing(true);
    setQuickFixToast(null);

    try {
      const batchRequest: BatchTrackFixRequest = {
        fullPattern: code,
        flaggedTracks: flaggedList.map(t => ({
          trackIndex: t.trackIndex,
          lineIndex: t.lineIndex,
          code: t.rawCode,
          soundName: t.soundName,
          issueReason: `User flagged track ${t.soundName} as defective on the fly`,
          desiredOutcome: 'Fix sound, timing, and musical harmony'
        }))
      };

      const result = await geminiService.diagnoseAndFixBatchTracks(batchRequest);

      // Update code in editor and live audio
      onChange(result.updatedFullPattern);
      strudelService.setPattern(result.updatedFullPattern);

      // Update recent fixes map
      const newRecent: typeof recentlyFixedTracks = { ...recentlyFixedTracks };
      result.fixedTracks.forEach(ft => {
        const matchingTrack = flaggedList.find(t => t.lineIndex === ft.lineIndex);
        if (matchingTrack) {
          newRecent[matchingTrack.id] = {
            original: ft.originalCode,
            fixed: ft.fixedCode,
            explanation: ft.explanation,
            tag: ft.suggestedTag || matchingTrack.soundName,
            isLearned: false
          };
        }
      });
      setRecentlyFixedTracks(newRecent);

      // Clear flags
      setFlaggedTrackIds(new Set());

      setQuickFixToast(`🪄 Multi-Track Healer: ${result.overallExplanation}`);
      setTimeout(() => setQuickFixToast(null), 6000);
    } catch (err: any) {
      console.error('[Batch Fix Error]', err);
      setQuickFixToast(`Batch fix error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsBatchFixing(false);
    }
  };

  // 1-Click "Mark OK & Train Memory" for a recently fixed track
  const handleMarkOkAndLearn = (trackId: string, track: TrackItem) => {
    const fixInfo = recentlyFixedTracks[trackId];
    if (!fixInfo) return;

    learningMemoryService.addCorrection({
      issueDescription: `Track ${track.soundName.toUpperCase()} bad code report on the fly`,
      faultyCode: fixInfo.original,
      fixedCode: fixInfo.fixed,
      lineIndex: track.lineIndex,
      tags: fixInfo.tag ? [fixInfo.tag, 'on-the-fly-verified'] : ['on-the-fly-verified'],
      notes: `User marked OK on the fly: ${fixInfo.explanation}`
    });

    // Mark as learned
    setRecentlyFixedTracks(prev => ({
      ...prev,
      [trackId]: {
        ...prev[trackId],
        isLearned: true
      }
    }));

    if (onMemoryLearned) {
      onMemoryLearned(learningMemoryService.getCount());
    }

    setQuickFixToast(`🧠 Learned & Saved rule for ${track.soundName.toUpperCase()} to AI Memory!`);
    setTimeout(() => setQuickFixToast(null), 4000);
  };

  // Undo fix for a track
  const handleUndoFix = (trackId: string, track: TrackItem) => {
    const fixInfo = recentlyFixedTracks[trackId];
    if (!fixInfo) return;

    const reverted = trackService.replaceTrack(code, track.lineIndex, fixInfo.original);
    onChange(reverted);
    strudelService.setPattern(reverted);

    setRecentlyFixedTracks(prev => {
      const next = { ...prev };
      delete next[trackId];
      return next;
    });

    setQuickFixToast(`Reverted track ${track.soundName.toUpperCase()} to previous code`);
    setTimeout(() => setQuickFixToast(null), 3000);
  };

  // If no tracks detected (e.g. empty editor)
  if (tracks.length === 0) return null;

  return (
    <div className="bg-[#0b0e1a] border-b border-[#1f263d] text-xs font-mono select-none">
      
      {/* Top Bar / Header of Track Strip */}
      <div className="px-3.5 py-1.5 flex items-center justify-between bg-[#080b14] border-b border-[#181d2e] gap-2 flex-wrap">
        
        {/* Left: Tracks Overview & Live Count */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 text-gray-300 hover:text-white font-bold text-[11px] transition-colors"
          >
            <Layers size={13} className="text-teal-400" />
            <span>LIVE TRACKS ({tracks.length})</span>
            {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>

          <span className="text-gray-700">|</span>

          {/* Master flag all toggle */}
          <button
            onClick={toggleFlagAll}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-amber-300 transition-colors"
            title={flaggedTrackIds.size === tracks.length ? 'Uncheck all' : 'Check all tracks'}
          >
            {flaggedTrackIds.size === tracks.length ? (
              <CheckSquare size={12} className="text-amber-400" />
            ) : flaggedTrackIds.size > 0 ? (
              <CheckSquare size={12} className="text-amber-400 opacity-60" />
            ) : (
              <Square size={12} className="text-gray-600" />
            )}
            <span>Flag All</span>
          </button>
        </div>

        {/* Center / Right: Quick Feedback or Batch Action Bar */}
        <div className="flex items-center gap-2">
          {flaggedTrackIds.size > 0 && (
            <div className="flex items-center gap-1.5 animate-fadeIn">
              <span className="text-[10px] text-amber-400 font-bold bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle size={11} />
                <span>{flaggedTrackIds.size} Flagged Bad</span>
              </span>

              {/* 1-Click Multi-Track Heal */}
              <button
                onClick={handleBatchFixFlagged}
                disabled={isBatchFixing}
                className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-teal-400 hover:from-amber-400 hover:to-teal-300 text-black font-bold text-[10px] rounded-lg shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                {isBatchFixing ? (
                  <>
                    <RefreshCw size={11} className="animate-spin" />
                    <span>Healing {flaggedTrackIds.size} Tracks...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={11} />
                    <span>🪄 1-Click Auto-Fix Flagged ({flaggedTrackIds.size})</span>
                  </>
                )}
              </button>

              {/* Clear flags */}
              <button
                onClick={() => setFlaggedTrackIds(new Set())}
                className="text-[10px] text-gray-500 hover:text-gray-300 px-1.5 py-0.5 rounded"
              >
                Clear
              </button>
            </div>
          )}

          {quickFixToast && (
            <div className="text-[10px] text-teal-300 bg-teal-950/80 border border-teal-800/80 px-2 py-0.5 rounded-full flex items-center gap-1 truncate max-w-xs animate-fadeIn">
              <Sparkles size={10} className="flex-shrink-0 text-teal-400" />
              <span className="truncate">{quickFixToast}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Track Row Cards */}
      {!isCollapsed && (
        <div className="p-2 space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
          {tracks.map((track) => {
            const isFlagged = flaggedTrackIds.has(track.id);
            const isFixing = fixingTrackId === track.id;
            const recentFix = recentlyFixedTracks[track.id];

            return (
              <div
                key={track.id}
                className={`flex items-center justify-between p-1.5 rounded-xl border transition-all gap-2 flex-wrap sm:flex-nowrap ${
                  isFlagged
                    ? 'bg-amber-950/30 border-amber-600/70 shadow-sm shadow-amber-950/50'
                    : recentFix
                    ? 'bg-emerald-950/20 border-emerald-700/60'
                    : 'bg-[#101322] border-[#1d2338] hover:border-[#2f385c]'
                }`}
              >
                {/* Left Section: Checkbox, LED, Badge, Code Snippet */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  
                  {/* ON-THE-FLY CHECKBOX TO REPORT BAD CODE */}
                  <button
                    type="button"
                    onClick={() => toggleFlagTrack(track)}
                    className={`p-1 rounded-md transition-all flex items-center justify-center ${
                      isFlagged
                        ? 'bg-amber-500 text-black shadow-sm shadow-amber-500/50'
                        : 'bg-[#181c2f] text-gray-400 hover:text-white border border-gray-700/70 hover:border-amber-400'
                    }`}
                    title={isFlagged ? 'Track flagged as bad. Click to unflag.' : 'Check box to flag bad code for 1-click fix on the fly'}
                  >
                    {isFlagged ? (
                      <CheckSquare size={13} className="stroke-[2.5]" />
                    ) : (
                      <Square size={13} />
                    )}
                  </button>

                  {/* Sound Category Badge */}
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
                    style={{
                      backgroundColor: `${track.soundColor}20`,
                      color: track.soundColor,
                      border: `1px solid ${track.soundColor}50`
                    }}
                  >
                    {track.soundName}
                  </span>

                  {/* Code Snippet */}
                  <div
                    onClick={() => onOpenDetailedLineDiagnosis(track.lineIndex, track.rawCode)}
                    className="text-gray-300 font-mono text-[11px] truncate flex-1 cursor-pointer hover:text-teal-300 transition-colors"
                    title={`Line ${track.lineIndex + 1}: ${track.rawCode} (Click for deep doctor diagnosis)`}
                  >
                    <span className="text-gray-600 mr-1.5">L{track.lineIndex + 1}:</span>
                    {track.rawCode}
                  </div>
                </div>

                {/* Right Action Controls: 1-Click Report, Preset Fixes, Mute, Doctor */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  
                  {/* If recently fixed: Show "Mark OK (Train Memory)" and "Undo" */}
                  {recentFix ? (
                    <div className="flex items-center gap-1 bg-[#090c14] p-1 rounded-lg border border-emerald-800/80 animate-fadeIn">
                      <button
                        type="button"
                        onClick={() => handleMarkOkAndLearn(track.id, track)}
                        disabled={recentFix.isLearned}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          recentFix.isLearned
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm'
                        }`}
                        title="Mark fix as verified and teach AI memory rule"
                      >
                        {recentFix.isLearned ? (
                          <>
                            <ShieldCheck size={11} />
                            <span>Learned</span>
                          </>
                        ) : (
                          <>
                            <ThumbsUp size={11} />
                            <span>Mark OK & Learn</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUndoFix(track.id, track)}
                        className="p-1 text-gray-400 hover:text-red-400 rounded hover:bg-red-950/40 transition-colors"
                        title="Undo this fix"
                      >
                        <RotateCcw size={11} />
                      </button>
                    </div>
                  ) : (
                    /* Standard On-The-Fly Quick Action Buttons */
                    <div className="flex items-center gap-1">
                      
                      {/* 1-Click 👎 "Report Bad / Fix Track" */}
                      <button
                        type="button"
                        onClick={() => handleInstantQuickFix(track)}
                        disabled={isFixing}
                        className="flex items-center gap-1 px-2 py-1 bg-[#1c2136] hover:bg-purple-900/60 border border-purple-700/60 hover:border-purple-500 text-purple-200 hover:text-white rounded-lg text-[10px] font-bold transition-all active:scale-95 shadow-sm"
                        title="Instant 1-Click AI Fix on the fly"
                      >
                        {isFixing ? (
                          <RefreshCw size={10} className="animate-spin text-teal-400" />
                        ) : (
                          <ThumbsDown size={10} className="text-amber-400" />
                        )}
                        <span>{isFixing ? 'Fixing...' : 'Fix Track'}</span>
                      </button>

                      {/* Quick Preset Dropdown / Chips (Silent, Filter, Rhythm) */}
                      <div className="hidden md:flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleInstantQuickFix(track, 'Track produces no sound / silent sample name')}
                          disabled={isFixing}
                          className="px-1.5 py-0.5 rounded bg-[#131625] hover:bg-[#1d233a] border border-gray-800 text-[9px] text-gray-400 hover:text-gray-200 transition-colors"
                          title="Quick fix if silent"
                        >
                          🔇 Silent
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInstantQuickFix(track, 'Filter sweep or DSP effect is broken / harsh')}
                          disabled={isFixing}
                          className="px-1.5 py-0.5 rounded bg-[#131625] hover:bg-[#1d233a] border border-gray-800 text-[9px] text-gray-400 hover:text-gray-200 transition-colors"
                          title="Quick fix filter / DSP"
                        >
                          🎛️ DSP
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInstantQuickFix(track, 'Rhythm is out of sync or wrong speed')}
                          disabled={isFixing}
                          className="px-1.5 py-0.5 rounded bg-[#131625] hover:bg-[#1d233a] border border-gray-800 text-[9px] text-gray-400 hover:text-gray-200 transition-colors"
                          title="Quick fix rhythm / meter"
                        >
                          ⚡ Rhythm
                        </button>
                      </div>

                      {/* Open Full Doctor Modal */}
                      <button
                        type="button"
                        onClick={() => onOpenDetailedLineDiagnosis(track.lineIndex, track.rawCode)}
                        className="p-1 bg-[#141727] hover:bg-[#1f243d] border border-gray-800 text-gray-400 hover:text-amber-300 rounded-lg transition-colors"
                        title="Open Deep Diagnostic Doctor Modal for this line"
                      >
                        <Wrench size={11} />
                      </button>
                    </div>
                  )}

                  {/* Mute Toggle on the fly */}
                  <button
                    type="button"
                    onClick={() => handleToggleMute(track)}
                    className={`p-1 rounded-lg border transition-all ${
                      track.isMuted
                        ? 'bg-red-950/70 border-red-800 text-red-400'
                        : 'bg-[#141727] border-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                    title={track.isMuted ? 'Unmute track' : 'Mute track on the fly'}
                  >
                    {track.isMuted ? <VolumeX size={11} /> : <Volume2 size={11} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
