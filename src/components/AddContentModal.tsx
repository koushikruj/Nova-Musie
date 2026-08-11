import React, { useState } from 'react';
import { X, Plus, Link as LinkIcon, Music, Globe, Loader2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const AddContentModal: React.FC = () => {
  const { activeDrawer, setActiveDrawer, addCustomTrack, showToast } = usePlayer();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [language, setLanguage] = useState('English');
  const [isLoading, setIsLoading] = useState(false);

  if (activeDrawer !== 'addContent') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      showToast('Please provide a URL (YouTube, MP3, or Stream)');
      return;
    }

    setIsLoading(true);
    let finalTitle = title.trim();
    let finalArtist = artist.trim();
    let finalAlbumArt = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop';
    let finalAudioUrl = url.trim();
    let finalDuration = 180;

    try {
      showToast('Fetching metadata...');
      const response = await fetch(`/api/metadata?url=${encodeURIComponent(url.trim())}`);
      if (response.ok) {
        const data = await response.json();
        if (!finalTitle && data.title) finalTitle = data.title;
        if (!finalArtist && data.artist) finalArtist = data.artist;
        if (data.albumArt) finalAlbumArt = data.albumArt;
        if (data.audioUrl) finalAudioUrl = data.audioUrl;
        if (data.duration) finalDuration = data.duration;
      } else {
        throw new Error('Backend metadata unavailable');
      }
    } catch (err) {
      console.warn('Backend metadata fetch failed, using client-side URL parser:', err);
      // Client-side YouTube URL fallback
      const ytMatch = url.trim().match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
      if (ytMatch && ytMatch[1]) {
        finalAudioUrl = `youtube:${ytMatch[1]}`;
        if (!finalTitle) finalTitle = `YouTube Audio (${ytMatch[1]})`;
        if (!finalArtist) finalArtist = 'YouTube Stream';
        finalAlbumArt = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
      }
    } finally {
      setIsLoading(false);
    }

    addCustomTrack({
      title: finalTitle || 'Custom Added Track',
      artist: finalArtist || 'Unknown Artist',
      audioUrl: finalAudioUrl,
      albumArt: finalAlbumArt,
      duration: finalDuration,
      genre: language,
    });
    
    setUrl('');
    setTitle('');
    setArtist('');
    setActiveDrawer(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity">
      <div className="w-full max-w-md bg-neutral-950/80 backdrop-blur-2xl border border-white/20 backdrop-saturate-150 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden text-white">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-base tracking-tight">Add Content Link</h2>
          </div>
          <button
            onClick={() => setActiveDrawer(null)}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-neutral-400 mb-2">
            Add a song link from anywhere (e.g. YouTube, direct MP3, streams).
          </p>
          
          <div>
            <label className="text-xs font-mono uppercase text-neutral-400 mb-1.5 block flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5" /> Media URL *
            </label>
            <input
              type="text"
              placeholder="https://youtube.com/watch?v=... or .mp3 link"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-neutral-900 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-xs font-mono uppercase text-neutral-400 mb-1.5 block">Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Sunday Suspense Episode 1"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-neutral-900 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono uppercase text-neutral-400 mb-1.5 block">Artist (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Radio Mirchi"
                value={artist}
                onChange={e => setArtist(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-neutral-900 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-neutral-400 mb-1.5 block flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Language
              </label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-neutral-900 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 transition-colors appearance-none"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Bengali">Bengali</option>
                <option value="Spanish">Spanish</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
            {isLoading ? 'Fetching...' : 'Add & Play'}
          </button>
        </form>
      </div>
    </div>
  );
};
