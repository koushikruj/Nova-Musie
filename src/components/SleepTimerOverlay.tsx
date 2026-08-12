import React, { useEffect, useState } from 'react';
import { Moon, Clock, Plus, X, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const SleepTimerOverlay: React.FC = () => {
  const { sleepTimerSeconds, setSleepTimerSeconds, pause, setVolume, volume, showToast } = usePlayer();
  const [initialVol, setInitialVol] = useState<number>(volume);

  // When sleepTimerSeconds reaches 0, perform smooth volume fade out and auto shutdown
  useEffect(() => {
    if (sleepTimerSeconds === null) return;

    if (sleepTimerSeconds === 5) {
      setInitialVol(volume);
    }

    // Smooth volume fade over last 3 seconds
    if (sleepTimerSeconds <= 3 && sleepTimerSeconds > 0 && volume > 0) {
      setVolume(Math.max(0, volume - 0.25));
    }

    if (sleepTimerSeconds <= 0) {
      pause();
      if (initialVol > 0) {
        setVolume(initialVol); // Restore volume for next time
      }
      setSleepTimerSeconds(null);
      showToast('🌙 Sleep mode activated. Playback turned off.');
    }
  }, [sleepTimerSeconds]);

  if (sleepTimerSeconds === null || sleepTimerSeconds > 300) {
    return null; // Only show when 5 minutes (300s) or less remain
  }

  const mins = Math.floor(sleepTimerSeconds / 60);
  const secs = sleepTimerSeconds % 60;
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  // Calculate progress percentage (300 seconds max for overlay)
  const progressPercent = Math.min(100, Math.max(0, (sleepTimerSeconds / 300) * 100));

  const handleAddMinutes = (addedMins: number) => {
    const newSecs = (sleepTimerSeconds || 0) + addedMins * 60;
    setSleepTimerSeconds(newSecs);
    showToast(`Sleep timer extended by ${addedMins} minutes`);
  };

  const handleCancelTimer = () => {
    setSleepTimerSeconds(null);
    showToast('Sleep timer cancelled');
  };

  return (
    <div className="fixed bottom-24 right-4 sm:right-6 z-40 max-w-sm w-full transition-all duration-500 animate-in fade-in slide-in-from-bottom-5">
      <div className="relative overflow-hidden bg-neutral-950/90 backdrop-blur-2xl border border-indigo-500/40 rounded-2xl p-4 shadow-2xl shadow-indigo-950/50 text-white">
        
        {/* Animated Pulsing Radial Glow Background */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl animate-pulse pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-pulse pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Visualizer Pulsing Moon Icon */}
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 shrink-0 shadow-inner">
              <span className="absolute inset-0 rounded-xl bg-indigo-500/20 animate-ping opacity-30" />
              <Moon className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span>Going to sleep in</span>
              </div>
              <div className="text-2xl font-black font-mono tracking-tight text-white drop-shadow">
                {formattedTime}
              </div>
            </div>
          </div>

          <button
            onClick={handleCancelTimer}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Cancel Sleep Timer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Countdown Progress Bar */}
        <div className="mt-3 relative w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Quick Extend Actions */}
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
          <span className="text-[11px] text-neutral-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-400" /> Need more time?
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleAddMinutes(5)}
              className="px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 font-semibold transition-colors flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" /> 5m
            </button>
            <button
              onClick={() => handleAddMinutes(15)}
              className="px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 font-semibold transition-colors flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" /> 15m
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
