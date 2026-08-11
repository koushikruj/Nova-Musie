import React from 'react';
import { X, Trash2, ArrowUp, ArrowDown, Play, Music, Sparkles } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const QueueDrawer: React.FC = () => {
  const {
    queue,
    queueIndex,
    currentTrack,
    isPlaying,
    activeDrawer,
    setActiveDrawer,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    playTrack
  } = usePlayer();

  if (activeDrawer !== 'queue') return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-md transition-opacity duration-300">
      <div className="w-full max-w-md bg-neutral-950/80 backdrop-blur-2xl border-l border-white/15 h-full flex flex-col shadow-2xl shadow-black/80 backdrop-saturate-150 text-white">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-neutral-400" />
            <h2 className="font-semibold text-base tracking-tight">Playback Queue</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
              {queue.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {queue.length > 1 && (
              <button
                onClick={clearQueue}
                className="text-xs text-neutral-400 hover:text-rose-400 px-2 py-1 rounded hover:bg-rose-500/10 transition-colors"
                title="Clear upcoming queue"
              >
                Clear Queue
              </button>
            )}
            <button
              onClick={() => setActiveDrawer(null)}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
          {/* Currently Playing Section */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-semibold mb-2 block">
              Now Playing
            </span>
            {currentTrack ? (
              <div className="p-3 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between gap-3">
                <img
                  src={currentTrack.albumArt}
                  alt={currentTrack.title}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-white truncate">
                    {currentTrack.title}
                  </h3>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">
                    {currentTrack.artist}
                  </p>
                </div>
                {isPlaying && (
                  <div className="flex items-center gap-1 text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-md border border-emerald-500/20 text-xs font-mono">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    <span>PLAYING</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-neutral-500">No song active</p>
            )}
          </div>

          {/* Up Next List */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-semibold mb-2 block">
              Up Next ({Math.max(0, queue.length - queueIndex - 1)})
            </span>

            {queue.length <= 1 ? (
              <div className="p-6 text-center text-neutral-500 border border-dashed border-white/10 rounded-xl">
                <p className="text-xs">Queue is empty after current song.</p>
                <button
                  onClick={() => setActiveDrawer('search')}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors"
                >
                  Add Songs
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {queue.map((track, idx) => {
                  const isCurrent = idx === queueIndex;
                  return (
                    <div
                      key={`${track.id}-${idx}`}
                      className={`p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 group ${
                        isCurrent
                          ? 'bg-white/10 border-white/20'
                          : 'bg-neutral-900/60 border-white/5 hover:bg-neutral-800/80 hover:border-white/10'
                      }`}
                    >
                      <img
                        src={track.albumArt}
                        alt={track.title}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs text-white truncate">
                          {track.title}
                        </h4>
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {track.artist}
                        </p>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        {!isCurrent && (
                          <button
                            onClick={() => playTrack(track, queue)}
                            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10"
                            title="Play now"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}

                        {idx > 0 && (
                          <button
                            onClick={() => reorderQueue(idx, idx - 1)}
                            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10"
                            title="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {idx < queue.length - 1 && (
                          <button
                            onClick={() => reorderQueue(idx, idx + 1)}
                            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10"
                            title="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => removeFromQueue(idx)}
                          className="p-1 rounded text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10"
                          title="Remove from queue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
