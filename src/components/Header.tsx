import React from 'react';
import { Search, ListMusic, Music2, HelpCircle, Link, Moon, Disc3, RotateCcw } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const Header: React.FC = () => {
  const {
    activeDrawer,
    setActiveDrawer,
    queue,
    currentTrack,
    isPlaying
  } = usePlayer();

  const handleClearCache = async () => {
    if (window.confirm("Are you sure you want to clear browser cache and reset application data?")) {
      try {
        // Clear Local & Session Storage
        localStorage.clear();
        sessionStorage.clear();

        // Clear CacheStorage API if available
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }

        // Clear IndexedDB databases if supported
        if ('indexedDB' in window && indexedDB.databases) {
          const dbs = await indexedDB.databases();
          dbs.forEach(db => {
            if (db.name) indexedDB.deleteDatabase(db.name);
          });
        }
      } catch (e) {
        console.error('Error clearing cache:', e);
      } finally {
        window.location.reload();
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-black/60 backdrop-blur-2xl border-b border-white/10 backdrop-saturate-150 shadow-lg shadow-black/40 px-3 sm:px-6 md:px-8 py-2.5 sm:py-3.5 flex items-center justify-between text-neutral-300 gap-2">
      {/* Left: Saloon Identity & Live Indicator */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <div className="relative flex items-center justify-center bg-indigo-500/20 p-1.5 sm:p-2 rounded-xl text-indigo-400">
          <Disc3 className={`w-5 h-5 sm:w-6 sm:h-6 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-semibold tracking-wider text-xs sm:text-sm text-white uppercase font-mono">NOVA</span>
            <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-widest px-1 sm:px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 border border-white/10">
              MUSIC
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate max-w-[120px] sm:max-w-xs font-light">
            {currentTrack ? `${currentTrack.genre || 'Lounge'} • ${currentTrack.artist}` : 'Minimal Music Player'}
          </p>
        </div>
      </div>

      {/* Center/Right: Action Buttons */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Search button */}
          <button
            onClick={() => setActiveDrawer('search')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
              activeDrawer === 'search'
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-neutral-900/80 text-neutral-300 border-white/5 hover:bg-neutral-800 hover:text-white hover:border-white/20'
            }`}
            title="Search catalog (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden lg:inline-block text-[10px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Playlists & Library button */}
          <button
            onClick={() => setActiveDrawer('playlists')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
              activeDrawer === 'playlists' || activeDrawer === 'library'
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-neutral-900/80 text-neutral-300 border-white/5 hover:bg-neutral-800 hover:text-white hover:border-white/20'
            }`}
            title="Playlists & Library"
          >
            <ListMusic className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Playlists</span>
          </button>

          {/* Queue button */}
          <button
            onClick={() => setActiveDrawer('queue')}
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
              activeDrawer === 'queue'
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-neutral-900/80 text-neutral-300 border-white/5 hover:bg-neutral-800 hover:text-white hover:border-white/20'
            }`}
            title="Playback Queue"
          >
            <Music2 className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Queue</span>
            {queue.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono rounded-full bg-white/15 text-white">
                {queue.length}
              </span>
            )}
          </button>

          {/* Add Content button */}
          <button
            onClick={() => setActiveDrawer('addContent')}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
              activeDrawer === 'addContent'
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-neutral-900/80 text-neutral-400 border-white/5 hover:bg-neutral-800 hover:text-white'
            }`}
            title="Add Media Link"
          >
            <Link className="w-3.5 h-3.5" />
          </button>

          {/* Sleep Timer button */}
          <button
            onClick={() => setActiveDrawer('sleep')}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
              activeDrawer === 'sleep'
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-neutral-900/80 text-neutral-400 border-white/5 hover:bg-neutral-800 hover:text-white'
            }`}
            title="Suspend / Sleep Timer"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>

          {/* Keyboard Shortcuts trigger */}
          <button
            onClick={() => setActiveDrawer('shortcuts')}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
              activeDrawer === 'shortcuts'
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-neutral-900/80 text-neutral-400 border-white/5 hover:bg-neutral-800 hover:text-white'
            }`}
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {/* Clear Browser Cache & Reset button */}
          <button
            onClick={handleClearCache}
            className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border bg-neutral-900/80 text-amber-400 border-amber-500/20 hover:bg-amber-950/40 hover:text-amber-300 hover:border-amber-500/40"
            title="Clear Browser Cache & Reset App Data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Clear Cache</span>
          </button>
        </div>
    </header>
  );
};
