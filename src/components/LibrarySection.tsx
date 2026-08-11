import React from 'react';
import { Play, Music, ListMusic, History, Heart } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Track } from '../types';

export const LibrarySection: React.FC = () => {
  const { playlists, recentlyPlayed, playPlaylist, playTrack, favorites, tracks, currentTrack, queue, toggleFavorite } = usePlayer();

  const allTracksMap = new Map<string, Track>();
  tracks.forEach(t => allTracksMap.set(t.id, t));
  if (currentTrack) allTracksMap.set(currentTrack.id, currentTrack);
  if (recentlyPlayed) recentlyPlayed.forEach(t => allTracksMap.set(t.id, t));
  if (queue) queue.forEach(t => allTracksMap.set(t.id, t));

  const favoriteTracks = favorites
    .map(id => allTracksMap.get(id))
    .filter((t): t is Track => t !== undefined);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-8 pb-10">
      {/* Liked Songs / Favorites Section */}
      {favoriteTracks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-current" />
              <h2 className="text-xl font-semibold tracking-tight text-white">Liked Songs</h2>
              <span className="text-xs text-neutral-400 font-mono">({favoriteTracks.length})</span>
            </div>
            <button
              onClick={() => playTrack(favoriteTracks[0], favoriteTracks)}
              className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Play Favorites
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {favoriteTracks.slice(0, 5).map((track) => (
              <div
                key={track.id}
                className="group cursor-pointer rounded-xl bg-white/5 hover:bg-white/10 p-3 transition-colors duration-200 relative"
              >
                <div 
                  onClick={() => playTrack(track, favoriteTracks)}
                  className="relative aspect-square rounded-lg overflow-hidden mb-3"
                >
                  <img
                    src={track.albumArt || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400'}
                    alt={track.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                      <Play className="w-5 h-5 fill-current translate-x-0.5" />
                    </div>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-1">
                  <div onClick={() => playTrack(track, favoriteTracks)} className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm text-white truncate">{track.title}</h3>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">{track.artist}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(track);
                    }}
                    className="p-1 text-rose-500 hover:text-rose-400 transition-colors"
                    title="Remove from favorites"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <History className="w-5 h-5 text-neutral-400" />
            <h2 className="text-xl font-semibold tracking-tight text-white">Recently Played</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recentlyPlayed.slice(0, 5).map((track) => (
              <div 
                key={track.id} 
                onClick={() => playTrack(track)}
                className="group cursor-pointer rounded-xl bg-white/5 hover:bg-white/10 p-3 transition-colors duration-200"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                  <img 
                    src={track.albumArt || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400'} 
                    alt={track.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                      <Play className="w-5 h-5 fill-current translate-x-0.5" />
                    </div>
                  </div>
                </div>
                <h3 className="font-medium text-sm text-white truncate">{track.title}</h3>
                <p className="text-xs text-neutral-400 truncate mt-0.5">{track.artist}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Playlists */}
      {playlists.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <ListMusic className="w-5 h-5 text-neutral-400" />
            <h2 className="text-xl font-semibold tracking-tight text-white">Your Playlists</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {playlists.map((playlist) => (
              <div 
                key={playlist.id} 
                onClick={() => playPlaylist(playlist)}
                className="group cursor-pointer rounded-xl bg-white/5 hover:bg-white/10 p-4 transition-colors duration-200 flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-lg bg-indigo-500/20 flex shrink-0 items-center justify-center relative overflow-hidden text-indigo-400">
                  <Music className="w-8 h-8 opacity-50" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                    <Play className="w-6 h-6 fill-white text-white" />
                  </div>
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="font-medium text-white truncate">{playlist.name}</h3>
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{playlist.description || `${playlist.trackIds.length} tracks`}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
