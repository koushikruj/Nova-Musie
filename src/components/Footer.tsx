import React, { useState, useEffect } from 'react';
import { Disc3, Headphones, Keyboard, Moon, Globe, Heart, Users, Radio } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const Footer: React.FC = () => {
  const { setActiveDrawer, isPlaying, currentTrack } = usePlayer();

  // Live online users state (defaults to at least 20, increases when users/music are active)
  const [onlineCount, setOnlineCount] = useState<number>(() => {
    return Math.floor(Math.random() * 6) + 20; // Default 20 - 25
  });

  // Simulated live online status jitter (guaranteed >= 20)
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(prev => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const baseMin = isPlaying ? 24 : 20;
        const nextCount = prev + delta;
        return Math.max(baseMin, Math.min(85, nextCount));
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <footer className="w-full bg-neutral-950/80 backdrop-blur-2xl border-t border-white/10 backdrop-saturate-150 mt-auto relative z-20 pt-8 pb-28 sm:pb-24 px-4 sm:px-8 text-neutral-400 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
        
        {/* Left Column: Brand & Audio Engine Badge */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1.5">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center p-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shadow-sm shadow-indigo-500/20">
              <Disc3 className={`w-4 h-4 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            </div>
            <span className="font-extrabold text-sm tracking-widest text-white uppercase flex items-center gap-2">
              NOVA MUSIC
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                v3.2 PRO
              </span>
            </span>
          </div>
          <p className="text-xs text-neutral-400 max-w-xs font-light">
            High-Fidelity Realtime Web Audio & Lossless Streaming Platform.
          </p>
        </div>

        {/* Center Column: Copyright & Designer Attribution */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex items-center gap-2 text-xs text-neutral-300 font-medium">
            <span style={{ fontVariantEmoji: 'text' }}>{'\u00A9\uFE0E'}</span>
            <span>2026 <strong className="text-white font-semibold">Yash</strong>. All rights reserved.</span>
            <span className="text-neutral-600">&bull;</span>
            <span className="flex items-center gap-1 text-neutral-400">
              Crafted with <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" />
            </span>
          </div>

          {/* Quick Utility Shortcut Pills */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={() => setActiveDrawer('shortcuts')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-neutral-300 hover:text-white transition-all duration-200"
              title="Keyboard Shortcuts"
            >
              <Keyboard className="w-3 h-3 text-indigo-400" />
              <span>Shortcuts</span>
            </button>

            <button
              onClick={() => setActiveDrawer('sleep')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-neutral-300 hover:text-white transition-all duration-200"
              title="Sleep Timer"
            >
              <Moon className="w-3 h-3 text-indigo-400" />
              <span>Sleep</span>
            </button>

            <button
              onClick={() => setActiveDrawer('language')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-neutral-300 hover:text-white transition-all duration-200"
              title="Language Settings"
            >
              <Globe className="w-3 h-3 text-indigo-400" />
              <span>Language</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Listener / Online Visitors Status Indicator */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right gap-1.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-xs shadow-sm shadow-emerald-500/10 transition-all duration-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-300">
              <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <strong className="text-white font-bold font-mono">{onlineCount}</strong>
              <span>{isPlaying ? 'Listening Live' : 'Users Online'}</span>
            </span>
          </div>

          <p className="text-[11px] text-neutral-400 flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 inline shrink-0 animate-pulse" />
            <span className="truncate max-w-[180px]">
              {isPlaying && currentTrack ? `Streaming "${currentTrack.title}"` : 'Live Network Active'}
            </span>
          </p>
        </div>

      </div>
    </footer>
  );
};
