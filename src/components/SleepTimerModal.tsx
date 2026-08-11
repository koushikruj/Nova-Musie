import React, { useState, useEffect } from 'react';
import { X, Moon, Clock, Play } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const SleepTimerModal: React.FC = () => {
  const { activeDrawer, setActiveDrawer, pause, showToast } = usePlayer();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev && prev <= 1) {
            pause();
            showToast('Playback suspended');
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 60000); // Check every minute
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeLeft, pause, showToast]);

  if (activeDrawer !== 'sleep') return null;

  const handleSetTimer = (minutes: number) => {
    setTimeLeft(minutes);
    showToast(`Playback will suspend in ${minutes} minutes`);
    setActiveDrawer(null);
  };

  const handleCancelTimer = () => {
    setTimeLeft(null);
    showToast('Suspend timer cancelled');
    setActiveDrawer(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity">
      <div className="w-full max-w-sm bg-neutral-950/80 backdrop-blur-2xl border border-white/20 backdrop-saturate-150 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden text-white">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-base tracking-tight">Suspend Playback</h2>
          </div>
          <button
            onClick={() => setActiveDrawer(null)}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {timeLeft !== null ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 mb-2">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">{timeLeft} minutes left</h3>
              <p className="text-sm text-neutral-400">until playback is suspended.</p>
              <button
                onClick={handleCancelTimer}
                className="mt-6 w-full py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors"
              >
                Cancel Timer
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-neutral-400 mb-6 text-center">Select when you want to suspend the playback.</p>
              <div className="grid grid-cols-2 gap-3">
                {[5, 15, 30, 45, 60, 120].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => handleSetTimer(mins)}
                    className="py-3 px-4 rounded-xl bg-neutral-900/80 border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all flex flex-col items-center gap-1"
                  >
                    <span className="text-lg font-bold text-white">{mins}</span>
                    <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Minutes</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
