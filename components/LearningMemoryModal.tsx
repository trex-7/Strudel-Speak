import React, { useState, useEffect } from 'react';
import { Brain, Trash2, Download, Upload, Plus, Sparkles, Check, X, Tag, ShieldCheck, RefreshCcw, Search, BookOpen, AlertCircle } from 'lucide-react';
import { learningMemoryService } from '../services/learningMemoryService';
import { LearnedCorrection } from '../types';

interface LearningMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoryUpdated?: (count: number) => void;
}

export const LearningMemoryModal: React.FC<LearningMemoryModalProps> = ({
  isOpen,
  onClose,
  onMemoryUpdated,
}) => {
  const [corrections, setCorrections] = useState<LearnedCorrection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // New Rule Form State
  const [newIssue, setNewIssue] = useState('');
  const [newFaulty, setNewFaulty] = useState('');
  const [newFixed, setNewFixed] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCorrections();
    }
  }, [isOpen]);

  const loadCorrections = () => {
    setCorrections(learningMemoryService.getAll());
    if (onMemoryUpdated) onMemoryUpdated(learningMemoryService.getCount());
  };

  if (!isOpen) return null;

  const handleDelete = (id: string) => {
    learningMemoryService.removeCorrection(id);
    loadCorrections();
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset learned memory back to standard seed rules?')) {
      learningMemoryService.resetToDefaults();
      loadCorrections();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all AI learned memories? This will wipe user-trained rules.')) {
      learningMemoryService.clearAll();
      loadCorrections();
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(learningMemoryService.exportJson());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `strudelspeak_learned_rules_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = learningMemoryService.importJson(content);
        if (res.success) {
          setImportStatus(`Successfully imported ${res.count} learned rules!`);
          loadCorrections();
        } else {
          setImportStatus(`Import failed: ${res.error}`);
        }
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaulty.trim() || !newFixed.trim()) return;

    learningMemoryService.addCorrection({
      issueDescription: newIssue.trim() || 'Custom user instruction rule',
      faultyCode: newFaulty.trim(),
      fixedCode: newFixed.trim(),
      tags: newTag.trim() ? [newTag.trim(), 'custom-rule'] : ['custom-rule'],
      notes: newNotes.trim() || 'Manually entered learning rule'
    });

    setNewIssue('');
    setNewFaulty('');
    setNewFixed('');
    setNewTag('');
    setNewNotes('');
    setShowAddForm(false);
    loadCorrections();
  };

  // Collect all unique tags
  const allTags = Array.from(new Set(corrections.flatMap(c => c.tags || [])));

  // Filtered list
  const filtered = corrections.filter(c => {
    const matchesSearch = !searchQuery.trim() || 
      c.issueDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.faultyCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.fixedCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = !selectedTag || (c.tags && c.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
      <div className="bg-[#101320] border border-[#262c45] rounded-2xl max-w-3xl w-full p-5 md:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#21273e] pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-700 to-teal-500 rounded-xl text-white shadow-md shadow-purple-900/30">
              <Brain size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">
                  AI Learned Memory Bank
                </h3>
                <span className="text-[10px] bg-teal-950/80 border border-teal-700 text-teal-300 font-mono px-2 py-0.5 rounded-full font-bold">
                  {corrections.length} Active Rules
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Verified line corrections recorded when you mark OK. Injected into all future AI prompts to ensure continuous improvement.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 flex-shrink-0">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search learned patterns, faulty code, or tags..."
              className="w-full bg-[#0a0c14] border border-[#252b42] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Plus size={13} />
              <span>{showAddForm ? 'Cancel' : 'Add Rule'}</span>
            </button>

            <button
              onClick={handleExport}
              className="p-2 bg-[#171b2b] hover:bg-[#20263b] text-gray-300 hover:text-white border border-gray-800 rounded-xl text-xs transition-colors"
              title="Export Learned Memory to JSON"
            >
              <Download size={15} />
            </button>

            <label
              className="p-2 bg-[#171b2b] hover:bg-[#20263b] text-gray-300 hover:text-white border border-gray-800 rounded-xl text-xs cursor-pointer transition-colors"
              title="Import Learned Memory JSON"
            >
              <Upload size={15} />
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            <button
              onClick={handleResetDefaults}
              className="p-2 bg-[#171b2b] hover:bg-[#20263b] text-gray-400 hover:text-amber-300 border border-gray-800 rounded-xl text-xs transition-colors"
              title="Reset to Seed Rules"
            >
              <RefreshCcw size={15} />
            </button>
          </div>
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-shrink-0 no-scrollbar">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all border ${
                selectedTag === null
                  ? 'bg-purple-950 border-purple-500 text-purple-200 font-bold'
                  : 'bg-[#141726] border-gray-800/80 text-gray-400 hover:text-gray-200'
              }`}
            >
              All ({corrections.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-all border flex items-center gap-1 ${
                  selectedTag === tag
                    ? 'bg-teal-950 border-teal-500 text-teal-200 font-bold'
                    : 'bg-[#141726] border-gray-800/80 text-gray-400 hover:text-gray-200'
                }`}
              >
                <Tag size={10} />
                <span>#{tag}</span>
              </button>
            ))}
          </div>
        )}

        {/* Import notification */}
        {importStatus && (
          <div className="p-2.5 bg-purple-950/80 border border-purple-800 rounded-xl text-xs text-purple-200 font-mono flex items-center gap-2">
            <Sparkles size={14} />
            <span>{importStatus}</span>
          </div>
        )}

        {/* Manual Add Rule Form */}
        {showAddForm && (
          <form onSubmit={handleCreateRule} className="bg-[#0b0e18] border border-purple-800/60 rounded-xl p-4 space-y-3 animate-fadeIn flex-shrink-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5">
                <Plus size={13} />
                <span>Teach AI a New Rule or Pattern Fix</span>
              </h4>
              <span className="text-[10px] text-gray-500 font-mono">Will be stored in persistent database</span>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={newIssue}
                onChange={(e) => setNewIssue(e.target.value)}
                placeholder="Issue description (e.g. When asked for acid bass, don't use high notes)"
                className="w-full bg-[#111422] border border-[#262c45] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 font-mono"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-red-400 uppercase font-bold tracking-wider mb-1 block">
                    Defective / Avoid Code:
                  </label>
                  <input
                    type="text"
                    value={newFaulty}
                    onChange={(e) => setNewFaulty(e.target.value)}
                    placeholder="s('808*4')"
                    className="w-full bg-[#111422] border border-red-900/40 rounded-lg px-3 py-2 text-xs text-red-200 placeholder-gray-600 focus:outline-none focus:border-red-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider mb-1 block">
                    Correct / Preferred Code:
                  </label>
                  <input
                    type="text"
                    value={newFixed}
                    onChange={(e) => setNewFixed(e.target.value)}
                    placeholder="s('sub*4').gain(0.85)"
                    className="w-full bg-[#111422] border border-emerald-900/40 rounded-lg px-3 py-2 text-xs text-emerald-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Tag (e.g. bassline, drum, filter)"
                  className="bg-[#111422] border border-[#262c45] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none font-mono"
                />
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Notes / Explanation rule"
                  className="bg-[#111422] border border-[#262c45] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-mono font-bold shadow-md"
              >
                Save Learned Rule
              </button>
            </div>
          </form>
        )}

        {/* Learned Corrections List Container */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[220px]">
          {filtered.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center p-6 bg-[#0a0d16] border border-dashed border-gray-800 rounded-xl text-gray-500 text-xs">
              <Brain size={28} className="text-gray-600 mb-2" />
              <p className="font-semibold">No learned rules match your search.</p>
              <p className="text-[11px] text-gray-600 mt-1">
                Report a line in the editor and click "Mark OK" to automatically train the AI.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const isSeed = item.id.startsWith('seed-');
              return (
                <div
                  key={item.id}
                  className="bg-[#0b0e18] hover:bg-[#0e1220] border border-[#1e2338] hover:border-purple-800/60 rounded-xl p-3.5 transition-all space-y-2 relative group"
                >
                  {/* Top line info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-gray-200">
                          {item.issueDescription}
                        </span>
                        {isSeed ? (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 bg-blue-950 text-blue-300 rounded border border-blue-800">
                            Seed Foundation
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 bg-emerald-950 text-emerald-300 rounded border border-emerald-800 font-bold">
                            User Verified
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
                          💡 {item.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-gray-500 hover:text-red-400 rounded hover:bg-red-950/40 transition-colors"
                        title="Delete this rule"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Code Diff Display */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-red-950/20 border border-red-900/30 px-2.5 py-1.5 rounded text-red-300 truncate" title={item.faultyCode}>
                      <span className="text-[10px] text-red-500 font-bold mr-1">AVOID:</span>
                      {item.faultyCode}
                    </div>
                    <div className="bg-emerald-950/30 border border-emerald-800/40 px-2.5 py-1.5 rounded text-emerald-200 font-semibold truncate" title={item.fixedCode}>
                      <span className="text-[10px] text-emerald-400 font-bold mr-1">VERIFIED:</span>
                      {item.fixedCode}
                    </div>
                  </div>

                  {/* Tags & Timestamp footer */}
                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.tags?.map((t) => (
                        <span key={t} className="text-purple-400/80">#{t}</span>
                      ))}
                    </div>
                    <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="border-t border-[#1c2236] pt-3 flex items-center justify-between text-xs text-gray-400 font-mono flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-teal-400" />
            <span className="text-gray-300">
              Active in Prompt: <strong className="text-teal-300">{Math.min(filtered.length, 8)}</strong> prioritized few-shot examples
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-mono font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
