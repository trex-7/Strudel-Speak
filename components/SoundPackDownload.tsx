import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Music, 
  Archive, 
  Loader2, 
  Check, 
  Play, 
  ChevronDown, 
  ChevronUp, 
  FileCode, 
  Sparkles,
  Volume2,
  AlertCircle
} from 'lucide-react';
import { soundDownloadService, SoundItem, SoundPackProgress } from '../services/soundDownloadService';

interface SoundPackDownloadProps {
  code: string;
  title?: string;
  variant?: 'chat' | 'compact' | 'toolbar';
  className?: string;
}

export const SoundPackDownload: React.FC<SoundPackDownloadProps> = ({
  code,
  title = 'AI Beat',
  variant = 'chat',
  className = ''
}) => {
  const [sounds, setSounds] = useState<SoundItem[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<SoundPackProgress | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [downloadingSingleId, setDownloadingSingleId] = useState<string | null>(null);

  // Parse sounds whenever code changes
  useEffect(() => {
    if (!code) {
      setSounds([]);
      return;
    }
    const detected = soundDownloadService.extractSounds(code);
    setSounds(detected);
  }, [code]);

  const handleDownloadZip = async () => {
    if (sounds.length === 0 || isDownloading) return;

    setIsDownloading(true);
    setErrorMessage(null);
    setDownloadSuccess(false);

    try {
      await soundDownloadService.downloadSoundPack(code, title, (progress) => {
        setDownloadProgress(progress);
      });

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err: any) {
      console.error('[SoundPackDownload] Download error:', err);
      setErrorMessage(err.message || 'Failed to generate sound pack ZIP.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  const handleDownloadSingle = async (sound: SoundItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingSingleId(sound.id);
    try {
      await soundDownloadService.downloadSingleSound(sound);
    } catch (err: any) {
      setErrorMessage(`Failed to download ${sound.id}: ${err.message}`);
    } finally {
      setDownloadingSingleId(null);
    }
  };

  const handlePreviewAudio = async (sound: SoundItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewingId === sound.id) return;

    setPreviewingId(sound.id);
    try {
      const blob = await soundDownloadService.resolveSoundBlob(sound);
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setPreviewingId(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setPreviewingId(null);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.warn('[SoundPackDownload] Audio playback error:', err);
      setPreviewingId(null);
    }
  };

  if (sounds.length === 0) {
    return null;
  }

  // --- TOOLBAR / COMPACT VARIANT ---
  if (variant === 'toolbar') {
    return (
      <div className={`relative flex items-center ${className}`}>
        <button
          onClick={handleDownloadZip}
          disabled={isDownloading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 hover:border-blue-400 active:scale-95 transition-all shadow-sm disabled:opacity-50"
          title={`Download ZIP with all ${sounds.length} sounds used in this beat`}
        >
          {isDownloading ? (
            <>
              <Loader2 size={13} className="animate-spin text-blue-400" />
              <span>{downloadProgress ? `${downloadProgress.percent}%` : 'Packing...'}</span>
            </>
          ) : downloadSuccess ? (
            <>
              <Check size={13} className="text-green-400" />
              <span className="text-green-300">Downloaded!</span>
            </>
          ) : (
            <>
              <Archive size={13} className="text-blue-400" />
              <span>Sound Pack ({sounds.length})</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // --- CHAT MESSAGE EMBED VARIANT ---
  return (
    <div
      className={`mt-2.5 rounded-xl border border-blue-900/40 bg-[#121620] p-3 text-gray-200 shadow-md transition-all ${className}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-blue-900/60 border border-blue-500/30 flex items-center justify-center text-blue-300 flex-shrink-0">
            <Archive size={13} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-100 tracking-tight">
                Sounds Used
              </span>
              <span className="text-[10px] font-mono bg-blue-950/80 text-blue-300 border border-blue-800/60 px-1.5 py-0.2 rounded-full">
                {sounds.length} {sounds.length === 1 ? 'sound' : 'sounds'}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 truncate">
              WAV samples ready to download & use in any DAW
            </span>
          </div>
        </div>

        {/* Primary Download Button */}
        <button
          onClick={handleDownloadZip}
          disabled={isDownloading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-sm flex-shrink-0 ${
            downloadSuccess
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-60'
          }`}
          title="Download all sounds, pattern code & README as a ZIP"
        >
          {isDownloading ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>{downloadProgress ? `${downloadProgress.percent}%` : 'Packing...'}</span>
            </>
          ) : downloadSuccess ? (
            <>
              <Check size={13} />
              <span>ZIP Saved!</span>
            </>
          ) : (
            <>
              <Download size={13} />
              <span>Download Sounds</span>
            </>
          )}
        </button>
      </div>

      {/* Progress Bar (Visible while downloading) */}
      {isDownloading && downloadProgress && (
        <div className="mt-2.5 space-y-1">
          <div className="flex justify-between text-[10px] text-gray-400 font-mono">
            <span>{downloadProgress.isGeneratingZip ? 'Building ZIP archive...' : `Fetching ${downloadProgress.currentSound || 'samples'}...`}</span>
            <span>{downloadProgress.completed}/{downloadProgress.total}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-200"
              style={{ width: `${downloadProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Sound Badges & Quick Action Chips */}
      <div className="mt-2 flex flex-wrap gap-1.5 items-center">
        {sounds.slice(0, isExpanded ? sounds.length : 6).map((sound) => (
          <div
            key={sound.id}
            className="group flex items-center gap-1 bg-[#1a1f2c] hover:bg-[#22293a] border border-blue-900/40 rounded-md px-2 py-0.5 text-[11px] font-mono text-gray-300 transition-all"
          >
            <span className="text-blue-300 font-semibold">{sound.id}</span>

            {/* Quick Preview Sound Button */}
            <button
              onClick={(e) => handlePreviewAudio(sound, e)}
              className="p-0.5 text-gray-500 hover:text-green-400 transition-colors ml-0.5"
              title={`Listen to preview of ${sound.id}`}
            >
              {previewingId === sound.id ? (
                <Volume2 size={11} className="text-green-400 animate-pulse" />
              ) : (
                <Play size={10} />
              )}
            </button>

            {/* Quick Single WAV Download */}
            <button
              onClick={(e) => handleDownloadSingle(sound, e)}
              className="p-0.5 text-gray-500 hover:text-blue-400 transition-colors opacity-60 group-hover:opacity-100"
              title={`Download individual WAV (${sound.id})`}
            >
              {downloadingSingleId === sound.id ? (
                <Loader2 size={10} className="animate-spin text-blue-400" />
              ) : (
                <Download size={10} />
              )}
            </button>
          </div>
        ))}

        {sounds.length > 6 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 px-1 py-0.5 font-medium"
          >
            {isExpanded ? (
              <>
                <span>Less</span>
                <ChevronUp size={11} />
              </>
            ) : (
              <>
                <span>+{sounds.length - 6} more</span>
                <ChevronDown size={11} />
              </>
            )}
          </button>
        )}
      </div>

      {/* Error Display */}
      {errorMessage && (
        <div className="mt-2 p-2 bg-red-950/60 border border-red-900/60 rounded text-[11px] text-red-300 flex items-center gap-1.5">
          <AlertCircle size={12} className="text-red-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
