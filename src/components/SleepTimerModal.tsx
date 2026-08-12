import React, { useState } from 'react';
import { X, Moon, Clock, Sparkles } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const SleepTimerModal: React.FC = () => {
  const { activeDrawer, setActiveDrawer, sleepTimerSeconds, setSleepTimerSeconds, showToast } = usePlayer();
  const [customMinutes, setCustomMinutes] = useState<string>('');

  if (activeDrawer !== 'sleep') return null;

  const handleSetTimer = (minutes: number) => {
    setSleepTimerSeconds(minutes * 60);
    showToast(`🌙 Sleep timer set for ${minutes} minutes`);
    setActiveDrawer(null);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(customMinutes, 10);
    if (num && num > 0) {
      handleSetTimer(num);
      setCustomMinutes('');
    }
  };

  const handleCancelTimer = () => {
    setSleepTimerSeconds(null);
    showToast('Sleep timer cancelled');
    setActiveDrawer(null);
  };

  const minsLeft = sleepTimerSeconds ? Math.ceil(sleepTimerSeconds / 60) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity">
      <div className="w-full max-w-sm bg-neutral-950/90 backdrop-blur-2xl border border-indigo-500/30 backdrop-saturate-150 rounded-2xl shadow-2xl shadow-black overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-indigo-950/20">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-base tracking-tight">Enhanced Sleep Timer</h2>
          </div>
          <button
            onClick={() => setActiveDrawer(null)}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {minsLeft !== null ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 mb-1 shadow-inner">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">{minsLeft} minutes remaining</h3>
                <p className="text-xs text-indigo-300 mt-1">A visual countdown HUD will appear in the last 5 minutes.</p>
              </div>
              <button
                onClick={handleCancelTimer}
                className="mt-4 w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-rose-950/40 text-rose-300 border border-white/10 hover:border-rose-500/30 font-medium text-xs transition-colors"
              >
                Cancel Timer
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-neutral-400 text-center">Select duration to automatically suspend playback:</p>
              
              <div className="grid grid-cols-3 gap-2.5">
                {[5, 15, 30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => handleSetTimer(mins)}
                    className="py-3 px-2 rounded-xl bg-neutral-900/90 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-950/40 transition-all flex flex-col items-center gap-0.5 group"
                  >
                    <span className="text-base font-bold text-white group-hover:text-indigo-300">{mins}</span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Mins</span>
                  </button>
                ))}
              </div>

              {/* Custom Minutes Input */}
              <form onSubmit={handleCustomSubmit} className="pt-2 flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Custom minutes..."
                  min={1}
                  max={480}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="flex-1 p-2 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!customMinutes}
                  className="px-3 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-black font-bold text-xs disabled:opacity-40 transition-all"
                >
                  Set
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
