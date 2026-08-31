import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, Radio, AlertCircle, Volume2 } from 'lucide-react';

interface CommandBarProps {
  onTranslate: (englishPrompt: string) => void;
  isTranslating: boolean;
  onOpenWorkshop?: () => void;
  className?: string;
}

const QUICK_COMMANDS = [
  { label: '🪞 jux(rev) Stereo', prompt: 'Take the acid bassline and apply stereo juxtaposition (jux) with reverse so the left channel plays forward and the right channel plays in reverse' },
  { label: '🗣️ Vowel Formant', prompt: 'Turn the synth into a talking vocoder effect using cycling vowel formants (a, o, e, i)' },
  { label: '⏳ 1/16 Canon Offset', prompt: 'Create a canon echo melody by offsetting a copy of the synth by 1/16th of a cycle transposed up by 4 semitones' },
  { label: '🌊 Resonant Acid Sweep', prompt: 'Add a sweeping low-pass filter to the 303 acid line that opens and closes smoothly over 4 bars with high resonance' },
  { label: '🥁 4th Cycle Drum Fill', prompt: 'Every 4 cycles double the speed of the snare and hi-hats to make an energetic drum roll fill' },
  { label: '👾 8-Bit Lo-Fi Crush', prompt: 'Bitcrush the drums into a gritty vintage 8-bit arcade sampler sound using crush and coarse' },
  { label: '🌌 Dub Ping-Pong Delay', prompt: 'Add a deep dub techno ping-pong echo delay with high feedback and cavernous reverb to the chords' },
  { label: '🔪 16-Grain Chop', prompt: 'Chop the synth lead into 16 micro-sliced granular stutter chunks using chop' },
  { label: '⚡ Trap Ply Ratchet', prompt: 'Apply trap hi-hat ratchets using ply to multiply triggers by 2x and 4x across the bar' },
  { label: '🔇 Mute Kick', prompt: 'Mute the kick drum' },
  { label: '💥 Drop Beat', prompt: 'Unmute the kick and drop the beat with sub impact' }
];

export const CommandBar: React.FC<CommandBarProps> = ({
  onTranslate,
  isTranslating,
  onOpenWorkshop,
  className = '',
}) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [micVolume, setMicVolume] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<any>(null);

  useEffect(() => {
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

        const current = (finalText || interimText).trim();
        if (current) {
          setTranscript(current);
          setText(current);

          if (finalText) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              handleDispatch(finalText.trim());
            }, 600);
          } else if (interimText) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (interimText.trim().length > 3) {
                handleDispatch(interimText.trim());
              }
            }, 1800);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[Speech Recognition]', event.error);
        if (event.error === 'not-allowed') {
          setAudioError('Microphone permission denied.');
        } else if (event.error !== 'no-speech') {
          setAudioError(`Voice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        stopVolumeMeter();
      };

      recognitionRef.current = recognition;
    } catch (e) {
      setIsSupported(false);
    }

    return () => {
      stopRecognition();
      stopVolumeMeter();
    };
  }, []);

  const handleDispatch = (cmdText: string) => {
    if (!cmdText || isTranslating) return;
    setTranscript('');
    setText('');
    onTranslate(cmdText);
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

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(checkVolume);
      };
      checkVolume();
    } catch (e) {
      // ignore
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
      // ignore
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isTranslating) return;
    const cmd = text.trim();
    handleDispatch(cmd);
  };

  return (
    <div className={`bg-[#12141f] border border-[#23283b] rounded-xl p-3 shadow-xl ${className}`}>
      
      {/* Quick Action Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
        {onOpenWorkshop && (
          <button
            type="button"
            onClick={onOpenWorkshop}
            className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-900/60 hover:bg-purple-800 text-purple-200 hover:text-white border border-purple-600 transition-all active:scale-95 flex items-center gap-1 shadow-sm"
          >
            <span>📚 Workshop Demos</span>
          </button>
        )}
        <span className="text-[10px] font-mono uppercase text-gray-400 font-bold flex-shrink-0 mr-1 flex items-center gap-1">
          <Sparkles size={11} className="text-purple-400" />
          Quick Actions:
        </span>
        {QUICK_COMMANDS.map((action, idx) => (
          <button
            key={idx}
            onClick={() => handleDispatch(action.prompt)}
            disabled={isTranslating}
            className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-mono bg-[#1a1e2f] hover:bg-purple-900/40 border border-gray-700/60 hover:border-purple-500/50 text-gray-200 hover:text-purple-200 transition-all active:scale-95 disabled:opacity-50"
            title={`Translate: "${action.prompt}"`}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Main English Prompt & Mic Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Voice Button */}
        {isSupported && (
          <button
            type="button"
            onClick={toggleListening}
            disabled={isTranslating}
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95 shadow-md ${
              isListening
                ? 'bg-red-600 text-white shadow-red-500/40 ring-2 ring-red-400 animate-pulse'
                : 'bg-[#1e2337] hover:bg-purple-700 text-purple-300 hover:text-white border border-purple-800/40'
            }`}
            title={isListening ? 'Listening live... Click to stop' : 'Click to Speak English Command'}
          >
            {isListening ? (
              <Radio size={20} className="animate-spin" />
            ) : (
              <Mic size={20} />
            )}
          </button>
        )}

        {/* Text Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isTranslating}
            placeholder={
              isListening
                ? `Listening... ${transcript ? `"${transcript}"` : 'Say your command in English...'}`
                : 'Type or speak in English (e.g. "mute 909 kick", "add 303 acid bass", "speed up to 135 bpm")...'
            }
            className={`w-full bg-[#0a0c14] border text-gray-100 placeholder-gray-500 text-sm rounded-xl px-4 py-2.5 focus:outline-none transition-all ${
              isListening
                ? 'border-red-500/70 ring-1 ring-red-500/40'
                : 'border-[#2a3047] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40'
            }`}
          />
        </div>

        {/* Submit / Translate Button */}
        <button
          type="submit"
          disabled={!text.trim() || isTranslating}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 flex-shrink-0"
        >
          {isTranslating ? (
            <>
              <Sparkles size={14} className="animate-spin" />
              <span>Translating...</span>
            </>
          ) : (
            <>
              <span>Translate</span>
              <Send size={13} />
            </>
          )}
        </button>
      </form>

      {/* Mic Audio Feedback / Error */}
      {audioError && (
        <div className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
          <AlertCircle size={13} />
          <span>{audioError}</span>
        </div>
      )}
    </div>
  );
};
