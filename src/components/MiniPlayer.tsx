import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Music } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const MiniPlayer: React.FC = () => {
  const { currentTrack, isPlaying, togglePlay, next, previous, activeDrawer } = usePlayer();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const mainPlayer = document.getElementById('main-player-controls');
    if (!mainPlayer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // If the main player is not intersecting at all (it's completely scrolled out of view)
        setIsVisible(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '-50px 0px 0px 0px' // Adjust slightly for header
      }
    );

    observer.observe(mainPlayer);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Also force visible if a drawer is open (since it covers the main player on small screens)
  const isDrawerOpen = activeDrawer === 'queue' || activeDrawer === 'playlists';
  const showMiniPlayer = isVisible || isDrawerOpen;

  if (!currentTrack) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 sm:left-auto sm:right-0 sm:w-80 sm:bottom-4 sm:rounded-xl bg-neutral-900/95 backdrop-blur-xl border-t sm:border border-white/10 p-3 flex items-center justify-between z-[60] transition-transform duration-300 shadow-2xl ${
        showMiniPlayer ? 'translate-y-0' : 'translate-y-[150%]'
      }`}
    >
      <div className="flex items-center gap-3 overflow-hidden pr-2 flex-1 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        {currentTrack.albumArt ? (
          <img
            src={currentTrack.albumArt}
            alt={currentTrack.title}
            className="w-10 h-10 rounded shadow-md object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-neutral-800 flex items-center justify-center">
            <Music className="w-5 h-5 text-neutral-500" />
          </div>
        )}
        <div className="flex flex-col truncate">
          <span className="text-sm font-medium text-white truncate">{currentTrack.title}</span>
          <span className="text-xs text-neutral-400 truncate">{currentTrack.artist}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button onClick={previous} className="text-neutral-300 hover:text-white transition-colors">
          <SkipBack className="w-5 h-5 fill-current" />
        </button>
        <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
        </button>
        <button onClick={next} className="text-neutral-300 hover:text-white transition-colors">
          <SkipForward className="w-5 h-5 fill-current" />
        </button>
      </div>
    </div>
  );
};
