import React, { useState, useEffect } from 'react';
import { FolderOpen, Database, Music, AlertCircle, Cloud, Download, Check, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { sampleService } from '../services/sampleService';
import { Sample, SampleBank } from '../types';

export const SampleManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'local' | 'cloud'>('cloud');
  const [samples, setSamples] = useState<Sample[]>([]);
  const [banks, setBanks] = useState<SampleBank[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(sampleService.getIsSupported());
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    refreshSamples();
    if (activeTab === 'cloud') {
        loadBanks();
    }
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
                     Banks from <code>tidalcycles/Dirt-Samples</code>.
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
                         Fetching Banks...
                     </div>
                 ) : (
                     banks.map(bank => (
                         <div key={bank.name} className="flex items-center justify-between p-2 bg-[#18181b] rounded border border-gray-800 hover:border-gray-700">
                             <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${bank.isOffline ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                                     {bank.name.substring(0, 2).toUpperCase()}
                                 </div>
                                 <div className="flex flex-col">
                                     <span className="text-xs font-bold text-gray-300">{bank.name}</span>
                                     <span className="text-[10px] text-gray-600">{bank.isOffline ? 'Offline Ready' : 'Online Only'}</span>
                                 </div>
                             </div>
                             
                             <div className="flex items-center gap-2">
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
                                        title="Download Bank"
                                     >
                                         <Download size={14} />
                                     </button>
                                 )}
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
