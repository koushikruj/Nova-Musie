import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Play, Plus, Heart, Music, ListPlus } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Track } from '../types';

export const SearchModal: React.FC = () => {
  const {
    activeDrawer,
    setActiveDrawer,
    tracks,
    playlists,
    favorites,
    playTrack,
    addToQueue,
    toggleFavorite,
    addTrackToPlaylist
  } = usePlayer();

  const [query, setQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [playlistMenuTrack, setPlaylistMenuTrack] = useState<Track | null>(null);
  const [onlineResults, setOnlineResults] = useState<Track[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (activeDrawer === 'search') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [activeDrawer]);

  // Live online track search debounced
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    setIsSearchingOnline(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data: Track[] = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setOnlineResults(data);
            setIsSearchingOnline(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Backend search API unavailable, using client-side iTunes search fallback:', err);
      }

      // Client-side iTunes Search API Fallback (Works on Netlify / Static Hosting without server)
      try {
        const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query.trim())}&entity=song&limit=10`);
        if (itunesRes.ok) {
          const data = await itunesRes.json();
          if (Array.isArray(data.results)) {
            const clientTracks: Track[] = data.results.map((s: any, idx: number) => ({
              id: `itunes-${s.trackId || idx}-${Date.now()}`,
              title: s.trackName,
              artist: s.artistName,
              album: s.collectionName || 'Single',
              albumArt: s.artworkUrl100 ? s.artworkUrl100.replace('100x100bb', '600x600bb') : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
              audioUrl: s.previewUrl || 'youtube:BEYCEq1m6kk',
              duration: s.trackTimeMillis ? Math.round(s.trackTimeMillis / 1000) : 180,
              genre: s.primaryGenreName || 'Pop',
              year: s.releaseDate ? new Date(s.releaseDate).getFullYear() : 2024
            }));
            setOnlineResults(clientTracks);
          }
        }
      } catch (e) {
        console.warn('Client-side iTunes fallback error:', e);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  if (activeDrawer !== 'search') return null;

  // Extract all available genres
  const allGenres = Array.from(new Set(tracks.map(t => t.genre).filter(Boolean)));

  // Filter tracks
  const filteredTracks = tracks.filter(track => {
    const matchesQuery =
      !query.trim() ||
      track.title.toLowerCase().includes(query.toLowerCase()) ||
      track.artist.toLowerCase().includes(query.toLowerCase()) ||
      track.album.toLowerCase().includes(query.toLowerCase()) ||
      track.genre.toLowerCase().includes(query.toLowerCase());

    const matchesGenre = !selectedGenre || track.genre === selectedGenre;

    return matchesQuery && matchesGenre;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 bg-black/70 backdrop-blur-md transition-opacity">
      <div className="w-full max-w-2xl bg-neutral-950/80 backdrop-blur-2xl border border-white/20 backdrop-saturate-150 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[85vh] text-white">
        {/* Search Header Input */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tracks, artists, genres, albums..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-neutral-500 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setActiveDrawer(null)}
            className="px-2.5 py-1 rounded-lg text-xs bg-white/10 hover:bg-white/20 text-neutral-300"
          >
            Esc
          </button>
        </div>

        {/* Genre Tags Filter Pills */}
        <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedGenre(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedGenre === null
                ? 'bg-white text-black font-semibold'
                : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            All Tracks ({tracks.length})
          </button>
          {allGenres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre === selectedGenre ? null : genre)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedGenre === genre
                  ? 'bg-white text-black font-semibold'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Add to Playlist Popup Overlay */}
        {playlistMenuTrack && (
          <div className="p-4 bg-neutral-900 border-b border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
              <span>Add "{playlistMenuTrack.title}" to Playlist:</span>
              <button
                onClick={() => setPlaylistMenuTrack(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {playlists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => {
                    addTrackToPlaylist(pl.id, playlistMenuTrack.id);
                    setPlaylistMenuTrack(null);
                  }}
                  className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-white hover:text-black border border-white/10 text-xs font-medium transition-colors"
                >
                  {pl.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Local Catalog Section */}
          {filteredTracks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 px-1">
                Library Matches ({filteredTracks.length})
              </h3>
              {filteredTracks.map(track => {
                const isLiked = favorites.includes(track.id);
                return (
                  <div
                    key={track.id}
                    className="p-3 rounded-xl bg-neutral-900/50 border border-white/5 hover:bg-neutral-800/80 hover:border-white/10 flex items-center justify-between gap-3 group transition-all duration-200"
                  >
                    <img
                      src={track.albumArt}
                      alt={track.title}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-white group-hover:text-amber-200 transition-colors truncate">
                        {track.title}
                      </h4>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {track.artist} • {track.album}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Play track */}
                      <button
                        onClick={() => {
                          playTrack(track, filteredTracks);
                          setActiveDrawer(null);
                        }}
                        className="p-2 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-transform"
                        title="Play now"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>

                      {/* Add to Queue */}
                      <button
                        onClick={() => addToQueue(track)}
                        className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                        title="Add to queue"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      {/* Favorite Heart */}
                      <button
                        onClick={() => toggleFavorite(track)}
                        className={`p-2 rounded-full transition-colors ${
                          isLiked ? 'text-rose-500' : 'text-neutral-400 hover:text-white'
                        }`}
                        title={isLiked ? 'Unlike' : 'Like'}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      </button>

                      {/* Add to Playlist trigger */}
                      {playlists.length > 0 && (
                        <button
                          onClick={() => setPlaylistMenuTrack(track)}
                          className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                          title="Add to playlist"
                        >
                          <ListPlus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Online Live Spotify Search Section */}
          {query.trim().length >= 2 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Spotify / Online Live Matches
                </h3>
                {isSearchingOnline && (
                  <span className="text-xs text-neutral-400 animate-pulse">Searching online...</span>
                )}
              </div>

              {onlineResults.length === 0 && !isSearchingOnline ? (
                <div className="p-6 text-center text-neutral-500 text-xs">
                  No online tracks found for "{query}"
                </div>
              ) : (
                onlineResults.map(track => (
                  <div
                    key={track.id}
                    className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/10 hover:bg-emerald-900/30 hover:border-emerald-500/30 flex items-center justify-between gap-3 group transition-all duration-200"
                  >
                    <img
                      src={track.albumArt}
                      alt={track.title}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-white group-hover:text-emerald-300 transition-colors truncate">
                        {track.title}
                      </h4>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {track.artist} • {track.album}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          playTrack(track, [track, ...onlineResults]);
                          setActiveDrawer(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold flex items-center gap-1 hover:scale-105 active:scale-95 transition-transform"
                        title="Play live stream"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Play
                      </button>

                      <button
                        onClick={() => addToQueue(track)}
                        className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                        title="Add to queue"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      {/* Favorite Heart for online tracks */}
                      <button
                        onClick={() => toggleFavorite(track)}
                        className={`p-2 rounded-full transition-colors ${
                          favorites.includes(track.id) ? 'text-rose-500' : 'text-neutral-400 hover:text-white'
                        }`}
                        title={favorites.includes(track.id) ? 'Unlike' : 'Like'}
                      >
                        <Heart className={`w-4 h-4 ${favorites.includes(track.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {filteredTracks.length === 0 && onlineResults.length === 0 && !isSearchingOnline && (
            <div className="p-12 text-center text-neutral-500">
              <Music className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Type a track name or artist to search live on Spotify</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
