import React, { useState } from 'react';
import { X, Plus, Play, Shuffle, Trash2, Heart, Music, FolderPlus, Check, Sparkles, Music2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Playlist, Track } from '../types';
import { SpotifyImportModal } from './SpotifyImportModal';

export const PlaylistDrawer: React.FC = () => {
  const {
    activeDrawer,
    setActiveDrawer,
    playlists,
    favorites,
    tracks,
    currentTrack,
    recentlyPlayed,
    queue,
    playPlaylist,
    playTrack,
    createPlaylist,
    deletePlaylist,
    removeTrackFromPlaylist,
    toggleFavorite
  } = usePlayer();

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | 'favorites' | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [showSpotifyModal, setShowSpotifyModal] = useState<boolean>(false);
  const [newPlName, setNewPlName] = useState<string>('');
  const [newPlDesc, setNewPlDesc] = useState<string>('');

  if (activeDrawer !== 'playlists' && activeDrawer !== 'library') return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlName.trim()) return;
    const created = createPlaylist(newPlName, newPlDesc);
    setNewPlName('');
    setNewPlDesc('');
    setShowCreateForm(false);
    setSelectedPlaylistId(created.id);
  };

  const allTracksMap = new Map<string, Track>();
  tracks.forEach(t => allTracksMap.set(t.id, t));
  if (currentTrack) allTracksMap.set(currentTrack.id, currentTrack);
  if (recentlyPlayed) recentlyPlayed.forEach(t => allTracksMap.set(t.id, t));
  if (queue) queue.forEach(t => allTracksMap.set(t.id, t));

  const favoriteTracks = favorites
    .map(id => allTracksMap.get(id))
    .filter((t): t is Track => t !== undefined);

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);
  const selectedPlaylistTracks = selectedPlaylist
    ? selectedPlaylist.trackIds.map(id => tracks.find(t => t.id === id)).filter((t): t is Track => t !== undefined)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-md transition-opacity duration-300">
      <div className="w-full max-w-lg bg-neutral-950/80 backdrop-blur-2xl border-l border-white/15 h-full flex flex-col shadow-2xl shadow-black/80 backdrop-saturate-150 text-white">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-neutral-400" />
            <h2 className="font-semibold text-base tracking-tight">Library & Playlists</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSpotifyModal(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Auto-create playlist from Spotify link"
            >
              <Music2 className="w-3.5 h-3.5" />
              <span>Import Spotify</span>
            </button>
            <button
              onClick={() => setShowCreateForm(prev => !prev)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>New Playlist</span>
            </button>
            <button
              onClick={() => setActiveDrawer(null)}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Create Playlist Form Modal inline */}
        {showCreateForm && (
          <form onSubmit={handleCreateSubmit} className="p-4 bg-neutral-900/90 border-b border-white/10 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">
              Create New Playlist
            </h3>
            <input
              type="text"
              placeholder="Playlist Name"
              value={newPlName}
              onChange={e => setNewPlName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-neutral-800 border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
              required
            />
            <input
              type="text"
              placeholder="Description (Optional)"
              value={newPlDesc}
              onChange={e => setNewPlDesc(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-neutral-800 border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1 rounded-md text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded-md bg-white text-black text-xs font-semibold hover:bg-neutral-200"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
          {/* If viewing a specific playlist */}
          {selectedPlaylistId ? (
            <div>
              <button
                onClick={() => setSelectedPlaylistId(null)}
                className="text-xs text-neutral-400 hover:text-white mb-4 flex items-center gap-1"
              >
                ← Back to Playlists
              </button>

              {selectedPlaylistId === 'favorites' ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Heart className="w-5 h-5 text-rose-500 fill-current" />
                        Favorites Collection
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1">
                        {favoriteTracks.length} saved songs
                      </p>
                    </div>

                    {favoriteTracks.length > 0 && (
                      <button
                        onClick={() => playTrack(favoriteTracks[0], favoriteTracks)}
                        className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-neutral-200"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Play All
                      </button>
                    )}
                  </div>

                  {favoriteTracks.length === 0 ? (
                    <p className="text-xs text-neutral-500 py-6 text-center">No favorites added yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {favoriteTracks.map(track => (
                        <div
                          key={track.id}
                          className="p-2.5 rounded-xl bg-neutral-900/60 border border-white/5 hover:bg-neutral-800/80 flex items-center justify-between gap-3 group"
                        >
                          <img
                            src={track.albumArt}
                            alt={track.title}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-xs text-white truncate">{track.title}</h4>
                            <p className="text-[11px] text-neutral-400 truncate mt-0.5">{track.artist}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => playTrack(track, favoriteTracks)}
                              className="p-1 rounded text-neutral-400 hover:text-white"
                              title="Play"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                            <button
                              onClick={() => toggleFavorite(track)}
                              className="p-1 rounded text-rose-500 hover:text-rose-400"
                              title="Remove from favorites"
                            >
                              <Heart className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : selectedPlaylist ? (
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedPlaylist.coverImage}
                        alt={selectedPlaylist.name}
                        className="w-14 h-14 rounded-xl object-cover border border-white/10"
                      />
                      <div>
                        <h3 className="text-base font-bold text-white">{selectedPlaylist.name}</h3>
                        <p className="text-xs text-neutral-400 mt-0.5">{selectedPlaylist.description}</p>
                        <p className="text-[10px] text-neutral-500 font-mono mt-1">
                          {selectedPlaylistTracks.length} tracks
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => deletePlaylist(selectedPlaylist.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Delete playlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {selectedPlaylistTracks.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => playPlaylist(selectedPlaylist)}
                        className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-neutral-200"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Play Playlist
                      </button>
                    </div>
                  )}

                  {selectedPlaylistTracks.length === 0 ? (
                    <p className="text-xs text-neutral-500 py-6 text-center">
                      Playlist is empty. Add tracks from Search or Catalog.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedPlaylistTracks.map(track => (
                        <div
                          key={track.id}
                          className="p-2.5 rounded-xl bg-neutral-900/60 border border-white/5 hover:bg-neutral-800/80 flex items-center justify-between gap-3 group"
                        >
                          <img
                            src={track.albumArt}
                            alt={track.title}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-xs text-white truncate">{track.title}</h4>
                            <p className="text-[11px] text-neutral-400 truncate mt-0.5">{track.artist}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => playTrack(track, selectedPlaylistTracks)}
                              className="p-1 rounded text-neutral-400 hover:text-white"
                              title="Play song"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                            <button
                              onClick={() => removeTrackFromPlaylist(selectedPlaylist.id, track.id)}
                              className="p-1 rounded text-neutral-400 hover:text-rose-400"
                              title="Remove song from playlist"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <>
              {/* Favorites Collection Card */}
              <div
                onClick={() => setSelectedPlaylistId('favorites')}
                className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-neutral-900 to-neutral-900 border border-rose-500/20 hover:border-rose-500/40 cursor-pointer transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <Heart className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white group-hover:text-rose-300 transition-colors">
                      Favorites Collection
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {favoriteTracks.length} saved track{favoriteTracks.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <span className="text-xs text-neutral-400 font-mono">View →</span>
              </div>

              {/* Custom Playlists Grid */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-semibold mb-3 block">
                  User Playlists ({playlists.length})
                </span>

                <div className="grid grid-cols-1 gap-2.5">
                  {playlists.map(pl => (
                    <div
                      key={pl.id}
                      onClick={() => setSelectedPlaylistId(pl.id)}
                      className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 hover:bg-neutral-800/80 hover:border-white/10 cursor-pointer transition-all duration-200 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={pl.coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop'}
                          alt={pl.name}
                          className="w-12 h-12 rounded-lg object-cover border border-white/10"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-white group-hover:text-amber-200 transition-colors truncate">
                            {pl.name}
                          </h4>
                          <p className="text-xs text-neutral-400 truncate mt-0.5">
                            {pl.description || `${pl.trackIds.length} tracks`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playPlaylist(pl);
                          }}
                          className="p-2 rounded-full bg-white/10 hover:bg-white text-white hover:text-black transition-colors"
                          title="Play playlist"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <SpotifyImportModal
        isOpen={showSpotifyModal}
        onClose={() => setShowSpotifyModal(false)}
        onSuccess={(playlistId) => {
          setSelectedPlaylistId(playlistId);
        }}
      />
    </div>
  );
};
