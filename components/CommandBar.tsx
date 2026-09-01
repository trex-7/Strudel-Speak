import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Sparkles, Radio, AlertCircle } from 'lucide-react';

interface CommandBarProps {
  onTranslate: (englishPrompt: string) => void;
  isTranslating: boolean;
  onOpenWorkshop?: () => void;
  className?: string;
}

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
    <div className={`bg-[#12141f] border border-[#23283b] rounded-xl p-2 shadow-lg ${className}`}>
      
      {/* Main English Prompt & Mic Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        {/* Voice Button */}
        {isSupported && (
          <button
            type="button"
            onClick={toggleListening}
            disabled={isTranslating}
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all active:scale-95 shadow-sm ${
              isListening
                ? 'bg-red-600 text-white shadow-red-500/40 ring-1 ring-red-400 animate-pulse'
                : 'bg-[#1e2337] hover:bg-purple-700 text-purple-300 hover:text-white border border-purple-800/40'
            }`}
            title={isListening ? 'Listening live... Click to stop' : 'Click to Speak English Command'}
          >
            {isListening ? (
              <Radio size={16} className="animate-spin" />
            ) : (
              <Mic size={16} />
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
            className={`w-full bg-[#0a0c14] border text-gray-100 placeholder-gray-500 text-xs rounded-lg px-3 py-1.5 focus:outline-none transition-all ${
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
          className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95 flex-shrink-0"
        >
          {isTranslating ? (
            <>
              <Sparkles size={12} className="animate-spin" />
              <span>Translating...</span>
            </>
          ) : (
            <>
              <span>Translate</span>
              <Send size={11} />
            </>
          )}
        </button>
      </form>

      {/* Mic Audio Feedback / Error */}
      {audioError && (
        <div className="mt-1 text-[11px] text-red-400 flex items-center gap-1.5">
          <AlertCircle size={12} />
          <span>{audioError}</span>
        </div>
      )}
    </div>
  );
};
