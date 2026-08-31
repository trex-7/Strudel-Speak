import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderOpen, 
  Database, 
  Music, 
  AlertCircle, 
  Cloud, 
  Download, 
  Check, 
  Trash2, 
  Loader2, 
  RefreshCw, 
  Upload, 
  Copy, 
  Search,
  HardDrive,
  Sparkles,
  Play,
  Volume2
} from 'lucide-react';
import { sampleService } from '../services/sampleService';
import { embeddedSoundBank, EMBEDDED_SOUND_CATALOG, EmbeddedSoundInfo } from '../services/embeddedSoundBank';
import { Sample, SampleBank } from '../types';

export const SampleManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'demo' | 'cloud' | 'local'>('demo');
  const [samples, setSamples] = useState<Sample[]>([]);
  const [banks, setBanks] = useState<SampleBank[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [copiedSample, setCopiedSample] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingSound, setPlayingSound] = useState<string | null>(null);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setError('Failed to fetch banks catalogue.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleAuditionSound = async (soundName: string) => {
    setPlayingSound(soundName);
    try {
      await embeddedSoundBank.playSound(soundName);
    } catch (e) {
      // ignore
    } finally {
      setTimeout(() => {
        setPlayingSound(null);
      }, 500);
    }
  };

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const count = await sampleService.loadFiles(e.target.files);
      refreshSamples();
      showNotification(`Successfully imported ${count} samples!`);
    } catch (err: any) {
      setError(err.message || 'Failed to process selected folder.');
    } finally {
      setLoading(false);
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const count = await sampleService.loadFiles(e.target.files);
      refreshSamples();
      showNotification(`Successfully imported ${count} audio files!`);
    } catch (err: any) {
      setError(err.message || 'Failed to process files.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLinkFolderClick = async () => {
    setError(null);
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      try {
        // @ts-ignore
        const dirHandle = await window.showDirectoryPicker();
        setLoading(true);
        const count = await sampleService.loadFromDirectoryHandle(dirHandle);
        refreshSamples();
        showNotification(`Linked local directory: ${count} audio samples registered!`);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      } finally {
        setLoading(false);
      }
    }
    folderInputRef.current?.click();
  };

  const handleCopyCode = (name: string, syntax?: string) => {
    const code = syntax || `s("${name}")`;
    navigator.clipboard.writeText(code);
    setCopiedSample(name);
    showNotification(`Copied to clipboard: ${code}`);
    setTimeout(() => setCopiedSample(null), 2000);
  };

  const handleDownloadBank = async (bankName: string) => {
    setError(null);
    try {
      await sampleService.downloadBank(bankName, (progress) => {
        setDownloadProgress((prev) => ({ ...prev, [bankName]: progress }));
      });
      showNotification(`Bank '${bankName}' downloaded for offline use!`);
      const updatedBanks = await sampleService.fetchGithubBanks();
      setBanks(updatedBanks);
      refreshSamples();
    } catch (err: any) {
      setError(err.message || `Failed to download bank ${bankName}`);
    } finally {
      setDownloadProgress((prev) => {
        const next = { ...prev };
        delete next[bankName];
        return next;
      });
    }
  };

  const handleDeleteBank = async (bankName: string) => {
    await sampleService.deleteBank(bankName);
    const updatedBanks = await sampleService.fetchGithubBanks();
    setBanks(updatedBanks);
    refreshSamples();
  };

  const handleDeleteLocalSample = async (sampleName: string) => {
    await sampleService.deleteLocalSample(sampleName);
    refreshSamples();
    showNotification(`Removed sample '${sampleName}'`);
  };

  // Filtered lists
  const filteredDemoSounds = EMBEDDED_SOUND_CATALOG.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.aliases.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const localSamples = samples.filter((s) => s.source === 'local');
  const filteredLocalSamples = localSamples.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#121212] text-gray-300 select-none">
      {/* Hidden File / Folder Inputs */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderSelect}
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFilesSelect}
        multiple
        accept="audio/*,.wav,.mp3,.ogg,.flac,.aif,.aiff,.m4a"
        className="hidden"
      />

      {/* Tabs Header */}
      <div className="flex border-b border-gray-800 bg-[#0d0d0d]">
        <button
          onClick={() => {
            setActiveTab('demo');
            setSearchQuery('');
          }}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'demo'
              ? 'text-purple-400 bg-[#18181b] border-b-2 border-purple-400'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Sparkles size={13} className="text-purple-400" />
          <span>DEMO KIT ({EMBEDDED_SOUND_CATALOG.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('cloud');
            setSearchQuery('');
          }}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'cloud'
              ? 'text-blue-400 bg-[#18181b] border-b-2 border-blue-400'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Cloud size={13} />
          <span>DIRT</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('local');
            setSearchQuery('');
          }}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'local'
              ? 'text-green-400 bg-[#18181b] border-b-2 border-green-400'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <HardDrive size={13} />
          <span>CUSTOM {localSamples.length > 0 && `(${localSamples.length})`}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-2 border-b border-gray-800 bg-[#141416] flex items-center gap-2">
        <Search size={14} className="text-gray-500 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            activeTab === 'demo'
              ? 'Filter demo sounds (kick, acid, juno, riser)...'
              : activeTab === 'cloud'
              ? 'Filter sound banks (e.g. 808, bd, rave)...'
              : 'Filter loaded samples...'
          }
          className="w-full bg-transparent text-xs text-gray-200 placeholder-gray-600 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-[10px] text-gray-500 hover:text-gray-300 font-mono"
          >
            CLEAR
          </button>
        )}
      </div>

      {/* 1. EMBEDDED DEMO SOUND SET TAB */}
      {activeTab === 'demo' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-3 border-b border-gray-800 bg-[#0f0f0f] flex justify-between items-center">
            <div>
              <p className="text-[11px] font-bold text-gray-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Preloaded Studio Demo Bank
              </p>
              <p className="text-[10px] text-gray-400">
                100% offline & instant. Tap play to audition or copy snippet.
              </p>
            </div>
            <span className="text-[10px] bg-purple-950/80 border border-purple-800 text-purple-300 px-2 py-0.5 rounded font-mono">
              READY
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
            {filteredDemoSounds.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500">
                No demo sounds match "{searchQuery}"
              </div>
            ) : (
              filteredDemoSounds.map((item) => {
                const isPlaying = playingSound === item.name;
                const categoryColor =
                  item.category === 'drums'
                    ? 'border-blue-900/60 bg-blue-950/30 text-blue-300'
                    : item.category === 'synths'
                    ? 'border-purple-900/60 bg-purple-950/30 text-purple-300'
                    : 'border-pink-900/60 bg-pink-950/30 text-pink-300';

                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2 bg-[#18181b] hover:bg-[#202026] rounded-lg border border-gray-800/80 hover:border-gray-700 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Audition Button */}
                      <button
                        onClick={() => handleAuditionSound(item.name)}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                          isPlaying
                            ? 'bg-purple-600 text-white scale-105'
                            : 'bg-gray-800 hover:bg-purple-700 text-gray-300 hover:text-white'
                        }`}
                        title={`Audition sound: ${item.name}`}
                      >
                        {isPlaying ? <Volume2 size={13} className="animate-pulse" /> : <Play size={12} className="ml-0.5" />}
                      </button>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-gray-100">
                            {item.name}
                          </span>
                          <span className={`text-[9px] font-mono px-1 py-0.2 rounded border uppercase ${categoryColor}`}>
                            {item.category}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 truncate">
                          {item.description}
                        </span>
                      </div>
                    </div>

                    {/* Copy Strudel Code */}
                    <button
                      onClick={() => handleCopyCode(item.name, item.syntaxExample)}
                      className="p-1.5 rounded text-gray-500 hover:text-purple-300 hover:bg-purple-950/50 transition-colors flex-shrink-0"
                      title={`Copy syntax: ${item.syntaxExample}`}
                    >
                      {copiedSample === item.name ? (
                        <Check size={13} className="text-green-400" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. Cloud Dirt-Samples Tab */}
      {activeTab === 'cloud' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-3 border-b border-gray-800 bg-[#0f0f0f] flex justify-between items-center">
            <div>
              <p className="text-[11px] font-medium text-gray-300">
                TidalCycles Dirt-Samples
              </p>
              <p className="text-[10px] text-gray-500">
                Stream live or download banks for instant offline playback.
              </p>
            </div>
            <button
              onClick={loadBanks}
              className="p-1.5 text-gray-500 hover:text-white rounded bg-gray-900 border border-gray-800 transition-colors"
              title="Refresh Bank List"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
            {loading && banks.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-500 flex flex-col items-center">
                <Loader2 className="animate-spin mb-2 text-blue-400" size={22} />
                Loading sound banks catalogue...
              </div>
            ) : filteredBanks.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500">
                No banks match "{searchQuery}"
              </div>
            ) : (
              filteredBanks.map((bank) => (
                <div
                  key={bank.name}
                  className="flex items-center justify-between p-2.5 bg-[#18181b] rounded-lg border border-gray-800/80 hover:border-gray-700 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-bold font-mono ${
                        bank.isOffline
                          ? 'bg-green-950 text-green-400 border border-green-800/50'
                          : 'bg-gray-800/80 text-gray-400'
                      }`}
                    >
                      {bank.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-200 truncate font-mono">
                          {bank.name}
                        </span>
                        <button
                          onClick={() => handleCopyCode(bank.name)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-gray-500 hover:text-blue-400 flex items-center gap-1"
                          title="Copy s('bank') snippet"
                        >
                          {copiedSample === bank.name ? (
                            <Check size={11} className="text-green-400" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {bank.isOffline ? (
                          <span className="text-green-400 font-medium">Offline Cached</span>
                        ) : (
                          'Ready to stream/download'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {downloadProgress[bank.name] !== undefined ? (
                      <div className="flex items-center gap-1.5 text-xs text-blue-400">
                        <Loader2 size={13} className="animate-spin" />
                        <span className="font-mono text-[10px]">{downloadProgress[bank.name]}%</span>
                      </div>
                    ) : bank.isOffline ? (
                      <button
                        onClick={() => handleDeleteBank(bank.name)}
                        className="p-1.5 text-gray-500 hover:text-red-400 rounded hover:bg-gray-800 transition-colors"
                        title="Delete from offline cache"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDownloadBank(bank.name)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-[#27272a] hover:bg-blue-600 text-gray-300 hover:text-white rounded transition-colors"
                        title="Save for offline usage"
                      >
                        <Download size={12} />
                        Download
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. Custom Local Samples Tab */}
      {activeTab === 'local' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-3 border-b border-gray-800 bg-[#0f0f0f] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-200">Custom Audio Files</span>
              <button
                onClick={() => sampleService.clearAllCustomSamples().then(refreshSamples)}
                className="text-[10px] text-gray-500 hover:text-red-400"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleLinkFolderClick}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#1e1e24] hover:bg-[#282830] border border-gray-700/60 rounded text-xs font-medium text-purple-300 transition-all shadow-sm"
              >
                <FolderOpen size={14} />
                Link Folder
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#1e1e24] hover:bg-[#282830] border border-gray-700/60 rounded text-xs font-medium text-blue-300 transition-all shadow-sm"
              >
                <Upload size={14} />
                Add Files
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
            {filteredLocalSamples.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Music className="mx-auto mb-2 text-gray-600" size={28} />
                <p className="text-xs text-gray-400 font-medium">No custom samples loaded</p>
                <p className="text-[11px] text-gray-600 mt-1">
                  Drag and drop audio files anywhere or link a folder.
                </p>
              </div>
            ) : (
              filteredLocalSamples.map((sample) => (
                <div
                  key={sample.name}
                  className="flex items-center justify-between p-2.5 bg-[#18181b] rounded-lg border border-gray-800/80 hover:border-gray-700 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded bg-green-950/60 border border-green-800/40 flex items-center justify-center text-green-400 text-xs font-mono">
                      WAV
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-mono font-medium text-gray-200 truncate">
                        {sample.name}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {sample.bank}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyCode(sample.name)}
                      className="p-1 text-gray-500 hover:text-green-400 transition-colors"
                      title="Copy Strudel code"
                    >
                      {copiedSample === sample.name ? (
                        <Check size={13} className="text-green-400" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteLocalSample(sample.name)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete local sample"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMsg && (
        <div className="p-2.5 bg-green-950/60 border-t border-green-800/50 text-xs text-green-300 flex items-center gap-2 animate-fadeIn">
          <Check size={14} className="text-green-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-2.5 bg-red-950/50 border-t border-red-900/40 text-xs text-red-300 flex items-center gap-2 animate-fadeIn">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}

      {/* Footer Info */}
      <div className="p-2 border-t border-gray-800/80 bg-[#0d0d0d] text-[10px] text-gray-500 flex justify-between font-mono">
        <span>Active Demo Sounds: {EMBEDDED_SOUND_CATALOG.length}</span>
        <span>Local Audio Engine: Ready</span>
      </div>
    </div>
  );
};
