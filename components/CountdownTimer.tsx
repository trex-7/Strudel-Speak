import React from 'react';
import { Clock, Pause, Play, RotateCcw, Lock, Unlock, ShieldCheck, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  secondsRemaining: number;
  totalDuration?: number; // default 300 (5 minutes)
  isPaused: boolean;
  isTimedOut: boolean;
  onTogglePause: () => void;
  onReset: () => void;
  onOpenUnlockModal: () => void;
  isUnlockedWithPassword?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  secondsRemaining,
  totalDuration = 300,
  isPaused,
  isTimedOut,
  onTogglePause,
  onReset,
  onOpenUnlockModal,
  isUnlockedWithPassword = false,
}) => {
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const percentage = Math.max(0, Math.min(100, (secondsRemaining / totalDuration) * 100));

  if (isUnlockedWithPassword) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 font-mono text-[11px] shadow-sm">
        <ShieldCheck size={13} className="text-emerald-400" />
        <span className="font-semibold">Unlimited AI</span>
        <span className="text-[9px] bg-emerald-900/80 text-emerald-200 px-1.5 py-0.2 rounded border border-emerald-600/50 font-bold flex items-center gap-1">
          <Unlock size={9} />
          PASSCODE 2106
        </span>
      </div>
    );
  }

  const isLowTime = secondsRemaining <= 60 && !isTimedOut;

  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-1 rounded-md border font-mono text-xs transition-all shadow-sm select-none ${
        isTimedOut
          ? 'bg-amber-950/90 border-amber-600/80 text-amber-200'
          : isLowTime
          ? 'bg-rose-950/80 border-rose-600 text-rose-200 animate-pulse'
          : isPaused
          ? 'bg-slate-900/90 border-slate-700 text-slate-300'
          : 'bg-indigo-950/70 border-indigo-700/70 text-indigo-200'
      }`}
    >
      {/* Icon & Label */}
      <div className="flex items-center gap-1.5">
        {isTimedOut ? (
          <AlertTriangle size={13} className="text-amber-400 animate-bounce" />
        ) : (
          <Clock size={13} className={isLowTime ? 'text-rose-400' : 'text-indigo-400'} />
        )}
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
          {isTimedOut ? 'Trial Expired' : '5m Timer'}
        </span>
      </div>

      {/* Time Display */}
      <div
        className={`font-bold tabular-nums tracking-wider px-1.5 py-0.5 rounded text-[12px] ${
          isTimedOut
            ? 'bg-amber-900/80 text-amber-200 border border-amber-700/50'
            : isLowTime
            ? 'bg-rose-900/80 text-rose-100 border border-rose-600/50'
            : 'bg-[#121624] text-white border border-indigo-900/60'
        }`}
      >
        {formattedTime}
      </div>

      {/* Mini Progress Bar */}
      <div className="w-12 h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/10 hidden sm:block">
        <div
          className={`h-full transition-all duration-1000 ${
            isTimedOut
              ? 'bg-amber-500'
              : isLowTime
              ? 'bg-rose-500'
              : 'bg-gradient-to-r from-indigo-500 to-teal-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-1">
        {!isTimedOut && (
          <button
            onClick={onTogglePause}
            className="p-1 hover:bg-white/10 rounded text-gray-300 hover:text-white transition-colors"
            title={isPaused ? 'Resume 5m Countdown' : 'Pause 5m Countdown'}
          >
            {isPaused ? <Play size={11} /> : <Pause size={11} />}
          </button>
        )}

        <button
          onClick={onReset}
          className="p-1 hover:bg-white/10 rounded text-gray-300 hover:text-white transition-colors"
          title="Reset Countdown to 5:00"
        >
          <RotateCcw size={11} />
        </button>

        <button
          onClick={onOpenUnlockModal}
          className="p-1 hover:bg-amber-900/60 rounded text-amber-300 hover:text-amber-100 transition-colors border border-amber-700/30"
          title="Enter password (pw=2106) for unlimited AI access"
        >
          <Lock size={11} />
        </button>
      </div>
    </div>
  );
};
