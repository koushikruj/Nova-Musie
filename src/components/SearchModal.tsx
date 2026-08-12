import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Play, Plus, Heart, Music, ListPlus, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Track } from '../types';

const RECOMMENDED_SEARCHES = [
  'Top Hits 2026',
  'Arijit Singh',
  'Taylor Swift',
  'Ed Sheeran',
  'The Weeknd',
  'K-Pop Top 50',
  'Lofi Chill Beats',
  'Bollywood Melodies'
];

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
  const [playlistMenuTrack, setPlaylistMenuTrack] = useState<Track | null>(null);
  const [onlineResults, setOnlineResults] = useState<Track[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (activeDrawer === 'search') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [activeDrawer]);

  // Helper to check if a track is already in the user's library
  const normalizeTrackString = (title: string, artist: string) => {
    return `${title} ${artist}`.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  };

  const isTrackInLibrary = (title: string, artist: string) => {
    const target = normalizeTrackString(title, artist);
    if (!target) return false;
    return tracks.some(t => {
      const existing = normalizeTrackString(t.title, t.artist);
      if (!existing) return false;
      return (
        existing === target ||
        (existing.length > 5 && target.includes(existing)) ||
        (target.length > 5 && existing.includes(target))
      );
    });
  };

  // Helper to fetch online search results for a given query & page
  const fetchSearchResults = async (searchQuery: string, pageNum: number): Promise<Track[]> => {
    const combinedResults: Track[] = [];
    const seenKeys = new Set<string>();

    const actualQuery = searchQuery.trim() || 'Top Music Hits';

    // 1. Express backend search endpoint
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(actualQuery)}&page=${pageNum}`);
      if (res.ok) {
        const data: Track[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          data.forEach(t => {
            const key = normalizeTrackString(t.title, t.artist);
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              combinedResults.push(t);
            }
          });
        }
      }
    } catch (err) {
      console.warn('Backend search API unavailable:', err);
    }

    // 2. Client-side YouTube Music (Invidious API) direct search
    try {
      const ytmQuery = pageNum > 1 ? `${actualQuery} related tracks` : actualQuery;
      const ytmRes = await fetch(
        `https://invidious.flokinet.to/api/v1/search?q=${encodeURIComponent(ytmQuery)}&type=video`,
        { signal: AbortSignal.timeout(3500) }
      );
      if (ytmRes.ok) {
        const ytmData = await ytmRes.json();
        if (Array.isArray(ytmData)) {
          ytmData.slice(0, 10).forEach((v: any, idx: number) => {
            if (!v.videoId || !v.title) return;
            const key = normalizeTrackString(v.title, v.author || '');
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              combinedResults.push({
                id: `ytm-client-${v.videoId}-p${pageNum}-${idx}`,
                title: v.title,
                artist: v.author || 'YouTube Music',
                album: 'YouTube Music',
                albumArt: (v.videoThumbnails && v.videoThumbnails.length > 0 && v.videoThumbnails[0].url)
                  ? v.videoThumbnails[0].url
                  : `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
                audioUrl: `youtube:${v.videoId}`,
                duration: Number(v.lengthSeconds) || 210,
                genre: 'YouTube Music',
                year: new Date().getFullYear()
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn('Client-side YouTube search fallback:', e);
    }

    // 3. Client-side iTunes Search API fallback
    try {
      const offset = (pageNum - 1) * 10;
      const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(actualQuery)}&entity=song&limit=10&offset=${offset}`);
      if (itunesRes.ok) {
        const data = await itunesRes.json();
        if (Array.isArray(data.results)) {
          data.results.forEach((s: any, idx: number) => {
            const key = normalizeTrackString(s.trackName, s.artistName);
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              combinedResults.push({
                id: `itunes-${s.trackId || idx}-p${pageNum}-${Date.now()}`,
                title: s.trackName,
                artist: s.artistName,
                album: s.collectionName || 'Single',
                albumArt: s.artworkUrl100 ? s.artworkUrl100.replace('100x100bb', '600x600bb') : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
                audioUrl: s.previewUrl || 'youtube:BEYCEq1m6kk',
                duration: s.trackTimeMillis ? Math.round(s.trackTimeMillis / 1000) : 180,
                genre: s.primaryGenreName || 'Pop',
                year: s.releaseDate ? new Date(s.releaseDate).getFullYear() : 2024
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn('Client-side iTunes fallback:', e);
    }

    return combinedResults;
  };

  // Initial load and live online search trigger
  useEffect(() => {
    if (activeDrawer !== 'search') return;

    setIsSearchingOnline(true);
    setPage(1);

    const timer = setTimeout(async () => {
      const results = await fetchSearchResults(query, 1);
      setOnlineResults(results);
      setIsSearchingOnline(false);
    }, query.trim() ? 300 : 0);

    return () => clearTimeout(timer);
  }, [query, activeDrawer]);

  // Handler for Load More button
  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    const nextPage = page + 1;
    const newResults = await fetchSearchResults(query, nextPage);

    setPage(nextPage);
    setOnlineResults(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const filtered = newResults.filter(r => !existingIds.has(r.id));
      return [...prev, ...filtered];
    });

    setIsLoadingMore(false);
  };

  if (activeDrawer !== 'search') return null;

  // Filter out tracks already in the library
  const displayResults = onlineResults.filter(
    track => !isTrackInLibrary(track.title, track.artist)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 bg-black/70 backdrop-blur-md transition-opacity">
      <div className="w-full max-w-2xl bg-neutral-950/80 backdrop-blur-2xl border border-white/20 backdrop-saturate-150 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[85vh] text-white">
        
        {/* Search Header Input */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for songs, artists, albums..."
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

        {/* Quick Search Tags */}
        <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-none bg-black/20">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Trending:
          </span>
          {RECOMMENDED_SEARCHES.map(item => (
            <button
              key={item}
              onClick={() => setQuery(item)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                query.toLowerCase() === item.toLowerCase()
                  ? 'bg-emerald-500 text-black font-semibold'
                  : 'bg-neutral-900/80 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-white/5'
              }`}
            >
              {item}
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

        {/* Online Search Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {query.trim() ? `Searching for "${query}"` : 'Searching for...'}
            </h3>
            {isSearchingOnline && (
              <span className="text-xs text-neutral-400 flex items-center gap-1 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                Searching...
              </span>
            )}
          </div>

          {displayResults.length === 0 && !isSearchingOnline ? (
            <div className="p-12 text-center text-neutral-500">
              <Music className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
              <p className="text-sm font-medium text-neutral-300">
                {query.trim() ? `No new online songs found for "${query}"` : 'Loading top online songs...'}
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Try searching for another artist, song name, or genre.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayResults.map(track => (
                <div
                  key={track.id}
                  className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 hover:bg-emerald-950/30 hover:border-emerald-500/30 flex items-center justify-between gap-3 group transition-all duration-200"
                >
                  <img
                    src={track.albumArt}
                    alt={track.title}
                    className="w-12 h-12 rounded-lg object-cover shrink-0 shadow"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-white group-hover:text-emerald-300 transition-colors truncate">
                      {track.title}
                    </h4>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {track.artist} • {track.album}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Play live stream */}
                    <button
                      onClick={() => {
                        playTrack(track, displayResults);
                        setActiveDrawer(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold flex items-center gap-1 hover:scale-105 active:scale-95 transition-transform"
                      title="Play song immediately"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Play
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
                        favorites.includes(track.id) ? 'text-rose-500' : 'text-neutral-400 hover:text-white'
                      }`}
                      title={favorites.includes(track.id) ? 'Unlike' : 'Like'}
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(track.id) ? 'fill-current' : ''}`} />
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
              ))}

              {/* Load More Related Songs Button */}
              {displayResults.length > 0 && (
                <div className="pt-4 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-emerald-950/50 border border-white/10 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 font-medium text-xs flex items-center justify-center gap-2 transition-all group"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading More Related Songs...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                        Load More Related Songs
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
