import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Radio, Zap, AlertCircle, Play, Sliders, ChevronRight } from 'lucide-react';

interface VoiceLiveControlProps {
  onCommand: (commandText: string) => void;
  isGenerating: boolean;
  className?: string;
  isCompact?: boolean;
}

// Quick stage performance vocal prompts for immediate 1-tap triggering or vocal inspiration
const PERFORMANCE_QUICK_ACTIONS = [
  { label: 'Mute 909 Kick', prompt: 'Mute the 909 kick drum', icon: '🔇', color: 'border-red-500/30 text-red-300 hover:bg-red-950/40' },
  { label: 'Drop & Unmute', prompt: 'Bring back the kick drum and drop the beat with heavy sub impact', icon: '💥', color: 'border-amber-500/30 text-amber-300 hover:bg-amber-950/40' },
  { label: 'Add Acid Bassline', prompt: 'Add an energetic 303 acid bassline in D minor with resonant filter sweeps', icon: '🧪', color: 'border-green-500/30 text-green-300 hover:bg-green-950/40' },
  { label: '16th Hi-Hats', prompt: 'Add 16th closed hi-hats with sizzling offbeat open hats', icon: '🎩', color: 'border-blue-500/30 text-blue-300 hover:bg-blue-950/40' },
  { label: 'Juno Chord Stab', prompt: 'Add a lush vintage polyphonic Juno minor chord stab on the 2nd and 4th beats', icon: '🎹', color: 'border-purple-500/30 text-purple-300 hover:bg-purple-950/40' },
  { label: 'Riser Sweep FX', prompt: 'Add a tension-building rising filter sweep FX for the breakdown buildup', icon: '🚀', color: 'border-pink-500/30 text-pink-300 hover:bg-pink-950/40' },
  { label: 'Breakdown (Cut Drums)', prompt: 'Breakdown: mute all drums, leave only synths and ambient riser sweep', icon: '🌌', color: 'border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/40' },
  { label: '135 BPM Speedup', prompt: 'Speed up the tempo to 135 BPM with rolling percussion', icon: '⏩', color: 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/40' },
  { label: 'Heavy Delay Snare', prompt: 'Add syncopated claps with heavy stereo delay and reverb', icon: '🎛️', color: 'border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40' },
];

export const VoiceLiveControl: React.FC<VoiceLiveControlProps> = ({
  onCommand,
  isGenerating,
  className = '',
  isCompact = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [micVolume, setMicVolume] = useState(0);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<any>(null);

  useEffect(() => {
    // Check Speech Recognition support in browser
    const win = typeof window !== 'undefined' ? (window as any) : null;
    const SpeechRecognition = win?.SpeechRecognition || win?.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setAudioError(null);
        startVolumeMeter();
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += trans;
          } else {
            interimText += trans;
          }
        }

        const currentText = (finalText || interimText).trim();
        if (currentText) {
          setTranscript(currentText);

          // If final speech was detected, or after silence in continuous mode, dispatch
          if (finalText) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              handleDispatchSpokenText(finalText.trim());
            }, 600);
          } else if (interimText) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (interimText.trim().length > 3) {
                handleDispatchSpokenText(interimText.trim());
              }
            }, 1800);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[VoiceLiveControl] Recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setAudioError('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (event.error !== 'no-speech') {
          setAudioError(`Voice error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // If we intended to keep listening (toggle mode) and didn't manually stop
        if (isListening && !isPushToTalkActive) {
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
          stopVolumeMeter();
        }
      };

      recognitionRef.current = recognition;
    } catch (e: any) {
      console.warn('[VoiceLiveControl] Setup error:', e);
      setIsSupported(false);
    }

    return () => {
      stopRecognition();
      stopVolumeMeter();
    };
  }, []);

  const handleDispatchSpokenText = (text: string) => {
    if (!text || isGenerating) return;
    setTranscript('');
    onCommand(text);
  };

  const startVolumeMeter = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(normalized);
        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('[VoiceLiveControl] Mic meter note:', e);
    }
  };

  const stopVolumeMeter = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setMicVolume(0);
  };

  const startRecognition = () => {
    setAudioError(null);
    setTranscript('');
    try {
      recognitionRef.current?.start();
      setIsListening(true);
    } catch (e) {
      console.warn('[VoiceLiveControl] Start recognition error:', e);
    }
  };

  const stopRecognition = () => {
    clearTimeout(silenceTimerRef.current);
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      // ignore
    }
    setIsListening(false);
    stopVolumeMeter();
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };

  // Push to Talk Handlers
  const handleMouseDown = () => {
    setIsPushToTalkActive(true);
    startRecognition();
  };

  const handleMouseUp = () => {
    setIsPushToTalkActive(false);
    setTimeout(() => {
      stopRecognition();
    }, 400);
  };

  if (!isSupported) {
    return (
      <div className={`p-3 bg-[#18181b] border border-gray-800 rounded-xl ${className}`}>
        <div className="flex items-center gap-2 text-xs text-amber-300">
          <AlertCircle size={14} />
          <span>Speech Recognition is not supported in this browser. Use Chrome/Edge for real-time voice control.</span>
        </div>
      </div>
    );
  }

  // --- COMPACT HEADER / CONTROLS VARIANT ---
  if (isCompact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={toggleListening}
          disabled={isGenerating}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 shadow-sm ${
            isListening
              ? 'bg-red-500/20 text-red-300 border-red-500/60 shadow-red-500/20 shadow-md animate-pulse'
              : 'bg-purple-900/30 text-purple-200 border-purple-600/40 hover:bg-purple-900/50 hover:border-purple-500'
          }`}
          title={isListening ? 'Click to stop voice listening' : 'Click for Hands-Free Live Voice Coding'}
        >
          {isListening ? (
            <>
              <Radio size={13} className="text-red-400 animate-ping" />
              <span>Listening ({micVolume}%)</span>
            </>
          ) : (
            <>
              <Mic size={13} className="text-purple-400" />
              <span>Voice Live</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // --- FULL LIVE PERFORMANCE VOICE HUB ---
  return (
    <div className={`bg-[#14161f] border border-purple-900/40 rounded-xl p-3.5 shadow-xl text-white ${className}`}>
      
      {/* Top Banner: Voice Status & Main Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-800/80">
        <div className="flex items-center gap-3">
          {/* Main Pulsing Mic Button */}
          <div className="relative">
            <button
              onClick={toggleListening}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              disabled={isGenerating}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg active:scale-90 ${
                isListening
                  ? 'bg-red-600 text-white shadow-red-500/40 ring-4 ring-red-500/30 animate-pulse'
                  : 'bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/50'
              }`}
              title="Click to toggle or HOLD to Push-to-Talk"
            >
              {isListening ? <Radio size={20} className="animate-spin" /> : <Mic size={20} />}
            </button>

            {/* Audio volume reaction ring */}
            {isListening && (
              <span
                className="absolute -inset-1 rounded-xl border-2 border-red-400 pointer-events-none transition-all duration-75"
                style={{
                  opacity: Math.min(1, micVolume / 40),
                  transform: `scale(${1 + (micVolume / 150)})`,
                }}
              />
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-gray-100 flex items-center gap-1.5">
                Voice Live Performer
                <span className="text-[10px] bg-purple-950/80 border border-purple-800/80 text-purple-300 font-mono px-1.5 py-0.2 rounded-full">
                  LIVE
                </span>
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {isListening
                ? `Listening live... (Mic signal: ${micVolume}%)`
                : 'Click or HOLD button to speak musical directions'}
            </span>
          </div>
        </div>

        {/* Mode Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleListening}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              isListening
                ? 'bg-red-950/60 border-red-600 text-red-300 hover:bg-red-900/60'
                : 'bg-[#1e2333] border-purple-700/50 text-purple-300 hover:bg-[#272e42]'
            }`}
          >
            {isListening ? (
              <>
                <MicOff size={13} />
                <span>Stop Listening</span>
              </>
            ) : (
              <>
                <Radio size={13} />
                <span>Start Hands-Free</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Speech Recognition Transcript Box */}
      {isListening && (
        <div className="mt-3 p-2.5 bg-black/60 border border-purple-500/40 rounded-lg flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Volume2 size={15} className="text-purple-400 flex-shrink-0 animate-pulse" />
            <span className="text-xs font-mono text-purple-200 truncate">
              {transcript ? `"${transcript}"` : 'Listening for directions (e.g. "mute 909 kick", "add acid bass")...'}
            </span>
          </div>
          {transcript && (
            <button
              onClick={() => handleDispatchSpokenText(transcript)}
              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 rounded text-[11px] font-bold text-white transition-all flex-shrink-0 active:scale-95"
            >
              Send Now
            </button>
          )}
        </div>
      )}

      {/* Error alert */}
      {audioError && (
        <div className="mt-2 p-2 bg-red-950/60 border border-red-900/70 rounded text-xs text-red-300 flex items-center gap-2">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{audioError}</span>
        </div>
      )}

      {/* Performer Voice Cheatsheet / 1-Tap Trigger Chips */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Sparkles size={12} className="text-purple-400" />
            Stage Voice Cheatsheet & 1-Tap Actions
          </span>
          <span className="text-[10px] text-gray-500 font-mono">Speak or Tap</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {PERFORMANCE_QUICK_ACTIONS.map((action, idx) => (
            <button
              key={idx}
              onClick={() => onCommand(action.prompt)}
              disabled={isGenerating}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left text-xs transition-all active:scale-95 bg-[#181d2a] ${action.color} disabled:opacity-50`}
              title={`Voice command: "${action.prompt}"`}
            >
              <span className="text-sm flex-shrink-0">{action.icon}</span>
              <span className="font-medium text-[11px] truncate">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
