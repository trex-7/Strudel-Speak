import React, { useState, useEffect } from 'react';
import { FolderOpen, Database, Music, AlertCircle, Cloud, Download, Check, Trash2, Loader2, RefreshCw, Play, Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import { sampleService } from '../services/sampleService';
import { Sample, SampleBank, SampleAssignment } from '../types';

const DRUM_TYPES = ['bd', 'sd', 'hh', 'oh', 'cp', 'mt', 'lt', 'ht'];

export const SampleManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'local' | 'cloud' | 'session'>('cloud');
  const [samples, setSamples] = useState<Sample[]>([]);
  const [banks, setBanks] = useState<SampleBank[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(sampleService.getIsSupported());
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [expandedKits, setExpandedKits] = useState<Set<string>>(new Set());
  const [expandedBanks, setExpandedBanks] = useState<Set<string>>(new Set()); // key: "kit:bank"
  const [assignments, setAssignments] = useState<SampleAssignment[]>([]);

  useEffect(() => {
    refreshSamples();
    if (activeTab === 'cloud') {
        loadBanks();
    }
    setAssignments(sampleService.getAssignments());
  }, [activeTab]);

  const refreshSamples = () => {
    setSamples(sampleService.getLoadedSamples());
  };

  const loadBanks = async () => {
      setLoading(true);
      setError(null);
      try {
          const fetchedBanks = await sampleService.fetchGithubBanks();
          setBanks(fetchedBanks);
      } catch (e: any) {
          setError("Failed to fetch banks from GitHub. API rate limit may be exceeded.");
      } finally {
          setLoading(false);
      }
  };

  const handleLinkFolder = async () => {
    setLoading(true);
    setError(null);
    try {
      await sampleService.linkLocalFolder();
      refreshSamples();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to link folder');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBank = async (bank: SampleBank) => {
      setDownloadProgress(prev => ({ ...prev, [bank.name]: 0 }));
      try {
          await sampleService.downloadBank(bank, (percent) => {
              setDownloadProgress(prev => ({ ...prev, [bank.name]: percent }));
          });
          // Refresh bank state
          const updatedBanks = await sampleService.fetchGithubBanks();
          setBanks(updatedBanks);
          refreshSamples();
      } catch (e: any) {
          setError(`Failed to download ${bank.name}`);
      } finally {
          setDownloadProgress(prev => {
              const next = { ...prev };
              delete next[bank.name];
              return next;
          });
      }
  };

  const handleDeleteBank = async (bankName: string) => {
      if(!confirm(`Delete offline cache for ${bankName}?`)) return;
      await sampleService.deleteBank(bankName);
      const updatedBanks = await sampleService.fetchGithubBanks();
      setBanks(updatedBanks);
  };

  const toggleKit = (kitName: string) => {
      const next = new Set(expandedKits);
      if (next.has(kitName)) next.delete(kitName);
      else next.add(kitName);
      setExpandedKits(next);
  };

  const toggleBank = (kitName: string, bankName: string) => {
      const key = `${kitName}:${bankName}`;
      const next = new Set(expandedBanks);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      setExpandedBanks(next);
  };

  const handleAudition = (sampleName: string) => {
      sampleService.auditionSample(sampleName);
  };

  const handleAssign = (kitName: string, bankName: string, index: number, type: string) => {
      const sampleName = `${kitName}:${bankName}:${index}`;
      sampleService.assignSample({ kitName, sampleName, type });
      setAssignments([...sampleService.getAssignments()]);
  };

  const handleRemoveAssignment = (type: string) => {
      sampleService.removeAssignment(type);
      setAssignments([...sampleService.getAssignments()]);
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] text-gray-300">
      {/* Tabs */}
      <div className="flex border-b border-gray-800">
          <button 
            onClick={() => setActiveTab('cloud')}
            className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-2 ${activeTab === 'cloud' ? 'text-blue-400 bg-[#1e1e1e] border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Cloud size={14} /> GITHUB
          </button>
          <button 
            onClick={() => setActiveTab('session')}
            className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-2 ${activeTab === 'session' ? 'text-purple-400 bg-[#1e1e1e] border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Music size={14} /> SESSION
          </button>
          <button 
            onClick={() => setActiveTab('local')}
            className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-2 ${activeTab === 'local' ? 'text-green-400 bg-[#1e1e1e] border-b-2 border-green-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <FolderOpen size={14} /> LOCAL
          </button>
      </div>

      {/* Cloud Tab */}
      {activeTab === 'cloud' && (
        <div className="flex-1 flex flex-col min-h-0">
             <div className="p-3 border-b border-gray-800 bg-[#0f0f0f] flex justify-between items-center">
                 <p className="text-[10px] text-gray-500">
                     Kits from <code>geikha/tidal-drum-machines</code>.
                     <br/>Download to use offline.
                 </p>
                 <button onClick={loadBanks} className="text-gray-500 hover:text-white" title="Refresh">
                     <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                 </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-2 space-y-2">
                 {loading && banks.length === 0 ? (
                     <div className="text-center py-8 text-xs text-gray-500 flex flex-col items-center">
                         <Loader2 className="animate-spin mb-2" size={20} />
                         Fetching Kits...
                     </div>
                 ) : (
                     banks.map(bank => (
                         <div key={bank.name} className="flex flex-col bg-[#18181b] rounded border border-gray-800 overflow-hidden">
                             <div className="flex items-center justify-between p-2 hover:bg-[#202024] transition-colors cursor-pointer" onClick={() => toggleKit(bank.name)}>
                                 <div className="flex items-center gap-3">
                                     <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${bank.isOffline ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                                         {expandedKits.has(bank.name) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                     </div>
                                     <div className="flex flex-col">
                                         <span className="text-xs font-bold text-gray-300">{bank.name}</span>
                                         <span className="text-[10px] text-gray-600">
                                             {bank.isKit ? `${bank.banks?.length || 0} banks • ` : ''}
                                             {bank.isOffline ? 'Offline Ready' : 'Online Only'}
                                         </span>
                                     </div>
                                 </div>
                                 
                                 <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                     {downloadProgress[bank.name] !== undefined ? (
                                         <div className="text-[10px] font-mono text-blue-400 w-12 text-right">
                                             {downloadProgress[bank.name]}%
                                         </div>
                                     ) : bank.isOffline ? (
                                         <button 
                                            onClick={() => handleDeleteBank(bank.name)}
                                            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                                            title="Delete Cache"
                                         >
                                             <Trash2 size={14} />
                                         </button>
                                     ) : (
                                         <button 
                                            onClick={() => handleDownloadBank(bank)}
                                            className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                                            title="Download Kit"
                                         >
                                             <Download size={14} />
                                         </button>
                                     )}
                                 </div>
                             </div>

                             {expandedKits.has(bank.name) && (
                                 <div className="p-2 bg-[#0f0f0f] border-t border-gray-800 space-y-1">
                                     {bank.banks?.map(subBank => (
                                         <div key={subBank} className="flex flex-col">
                                             <div 
                                                className="flex items-center justify-between p-1.5 rounded hover:bg-gray-800 group cursor-pointer"
                                                onClick={() => toggleBank(bank.name, subBank)}
                                             >
                                                 <div className="flex items-center gap-2">
                                                     {expandedBanks.has(`${bank.name}:${subBank}`) ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                                     <Music size={12} className="text-gray-600" />
                                                     <span className="text-[11px] text-gray-400">{subBank}</span>
                                                 </div>
                                                 <div className="flex items-center gap-1">
                                                     <span className="text-[9px] text-gray-600 mr-2">{bank.bankSamples?.[subBank]?.length || 0} samples</span>
                                                 </div>
                                             </div>
                                             
                                             {expandedBanks.has(`${bank.name}:${subBank}`) && (
                                                 <div className="ml-4 pl-2 border-l border-gray-800 space-y-1 my-1">
                                                     {bank.bankSamples?.[subBank]?.map((sampleFile, idx) => (
                                                         <div key={idx} className="flex items-center justify-between p-1 rounded hover:bg-gray-800/50 group/sample">
                                                             <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{sampleFile}</span>
                                                             <div className="flex items-center gap-1">
                                                                 <button 
                                                                    onClick={() => handleAudition(`${bank.name}:${subBank}:${idx}`)}
                                                                    className="p-1 text-gray-600 hover:text-blue-400"
                                                                    title="Audition"
                                                                 >
                                                                     <Play size={10} />
                                                                 </button>
                                                                 <div className="relative group/menu">
                                                                     <button className="p-1 text-gray-600 hover:text-purple-400" title="Assign to Session">
                                                                         <Plus size={10} />
                                                                     </button>
                                                                     <div className="absolute right-0 bottom-full mb-1 hidden group-hover/menu:flex flex-col bg-[#252529] border border-gray-700 rounded shadow-xl z-50 min-w-[80px]">
                                                                         {DRUM_TYPES.map(type => (
                                                                             <button 
                                                                                key={type}
                                                                                onClick={() => handleAssign(bank.name, subBank, idx, type)}
                                                                                className="px-2 py-1 text-[10px] text-left hover:bg-purple-600 hover:text-white transition-colors"
                                                                             >
                                                                                 Assign to {type.toUpperCase()}
                                                                             </button>
                                                                         ))}
                                                                     </div>
                                                                 </div>
                                                             </div>
                                                         </div>
                                                     ))}
                                                 </div>
                                             )}
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                     ))
                 )}
             </div>
        </div>
      )}

      {/* Session Tab */}
      {activeTab === 'session' && (
          <div className="flex-1 flex flex-col min-h-0">
              <div className="p-3 border-b border-gray-800 bg-[#0f0f0f]">
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Current Session Assignments</h3>
                  <p className="text-[10px] text-gray-500 mt-1">These samples will be used by the AI for code generation.</p>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {assignments.length === 0 ? (
                      <div className="h-32 flex flex-col items-center justify-center text-gray-600 text-xs text-center px-4">
                          <Music size={24} className="mb-2 opacity-20" />
                          <span>No samples assigned yet.</span>
                          <button onClick={() => setActiveTab('cloud')} className="mt-2 text-purple-400 hover:underline">Browse Kits</button>
                      </div>
                  ) : (
                      assignments.map(a => (
                          <div key={a.type} className="flex items-center justify-between p-2 bg-[#1e1e24] rounded border border-purple-900/30">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded bg-purple-900/30 flex items-center justify-center text-[10px] font-bold text-purple-400">
                                      {a.type.toUpperCase()}
                                  </div>
                                  <div className="flex flex-col">
                                      <span className="text-[11px] font-bold text-gray-200">{a.sampleName}</span>
                                      <span className="text-[9px] text-gray-500">Kit: {a.kitName}</span>
                                  </div>
                              </div>
                              <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => handleAudition(a.sampleName)}
                                    className="p-1.5 text-gray-500 hover:text-blue-400"
                                  >
                                      <Play size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleRemoveAssignment(a.type)}
                                    className="p-1.5 text-gray-500 hover:text-red-400"
                                  >
                                      <X size={14} />
                                  </button>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

      {/* Local Tab */}
      {activeTab === 'local' && (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b border-gray-800 bg-[#0f0f0f]">
                {!isSupported ? (
                <div className="p-3 bg-red-900/20 border border-red-900/50 rounded flex items-center gap-2 text-xs text-red-300">
                    <AlertCircle size={14} />
                    Browser not supported
                </div>
                ) : (
                <button
                    onClick={handleLinkFolder}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm py-2 px-4 rounded transition-colors"
                >
                    {loading ? (
                    <span className="animate-pulse">Scanning...</span>
                    ) : (
                    <>
                        <FolderOpen size={16} />
                        Link Local Folder
                    </>
                    )}
                </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {samples.filter(s => s.source === 'local').length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-gray-600 text-xs text-center px-4">
                    <Music size={24} className="mb-2 opacity-20" />
                    <span>No local samples loaded.</span>
                </div>
                ) : (
                samples.filter(s => s.source === 'local').map((sample) => (
                    <div 
                    key={sample.name}
                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-800 group transition-colors cursor-default"
                    >
                    <Music size={12} className="text-gray-500 group-hover:text-green-400" />
                    <span className="text-xs font-mono text-gray-300 truncate select-all">
                        {sample.name}
                    </span>
                    </div>
                ))
                )}
            </div>
        </div>
      )}

      {/* Error / Status Bar */}
      {error && (
        <div className="p-3 bg-red-900/10 border-t border-red-900/20 text-xs text-red-400">
          {error}
        </div>
      )}
      <div className="p-2 border-t border-gray-800 text-[10px] text-gray-600 flex justify-between">
          <span>Loaded Samples: {samples.length}</span>
          <span>IndexedDB: {isSupported ? 'Active' : 'N/A'}</span>
      </div>
    </div>
  );
};
