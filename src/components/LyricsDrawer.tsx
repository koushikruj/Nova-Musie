import React, { useEffect, useState, useRef } from 'react';
import { X, Mic2, AlertCircle, Loader2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

interface LyricLine {
  time: number;
  text: string;
}

export const LyricsDrawer: React.FC = () => {
  const {
    currentTrack,
    currentTime,
    activeDrawer,
    setActiveDrawer,
    seek,
  } = usePlayer();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncedLyrics, setSyncedLyrics] = useState<LyricLine[] | null>(null);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeDrawer !== 'lyrics' || !currentTrack) return;

    const fetchLyrics = async () => {
      setIsLoading(true);
      setError(null);
      setSyncedLyrics(null);
      setPlainLyrics(null);
      setActiveLineIndex(-1);

      try {
        const res = await fetch(`/api/lyrics?title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}&language=${encodeURIComponent(currentTrack.genre || '')}`);
        if (res.ok) {
          const data = await res.json();
          if (data.syncedLyrics) {
            setSyncedLyrics(parseLrc(data.syncedLyrics));
            setIsLoading(false);
            return;
          } else if (data.plainLyrics) {
            setPlainLyrics(data.plainLyrics);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Backend lyrics API unavailable, trying direct client-side lrclib API:', err);
      }

      // Direct client-side LRCLIB API Fallback (Works directly in browser on Netlify / static host)
      try {
        const exactRes = await fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(currentTrack.title)}&artist_name=${encodeURIComponent(currentTrack.artist)}`);
        if (exactRes.ok) {
          const data = await exactRes.json();
          if (data.syncedLyrics) {
            setSyncedLyrics(parseLrc(data.syncedLyrics));
            setIsLoading(false);
            return;
          } else if (data.plainLyrics) {
            setPlainLyrics(data.plainLyrics);
            setIsLoading(false);
            return;
          }
        }

        const searchRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(`${currentTrack.title} ${currentTrack.artist}`)}`);
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (Array.isArray(searchData) && searchData.length > 0) {
            const first = searchData[0];
            if (first.syncedLyrics) {
              setSyncedLyrics(parseLrc(first.syncedLyrics));
              setIsLoading(false);
              return;
            } else if (first.plainLyrics) {
              setPlainLyrics(first.plainLyrics);
              setIsLoading(false);
              return;
            }
          }
        }

        setError('No lyrics available for this track');
      } catch (err: any) {
        setError('Lyrics unavailable for this track');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLyrics();
  }, [currentTrack?.id, activeDrawer]);

  useEffect(() => {
    if (!syncedLyrics || syncedLyrics.length === 0) return;

    // Find the current active line
    let newActiveIndex = -1;
    for (let i = 0; i < syncedLyrics.length; i++) {
      if (currentTime >= syncedLyrics[i].time - 0.5) { // Small offset for smoother transition
        newActiveIndex = i;
      } else {
        break;
      }
    }

    if (newActiveIndex !== activeLineIndex) {
      setActiveLineIndex(newActiveIndex);
      
      // Scroll into view
      if (newActiveIndex >= 0 && activeLineRef.current && containerRef.current) {
        activeLineRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentTime, syncedLyrics, activeLineIndex]);

  if (activeDrawer !== 'lyrics') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black transition-all duration-500 overflow-hidden">
      {/* Dynamic blurred background */}
      {currentTrack?.albumArt && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 blur-[80px] scale-110 transition-all duration-1000"
          style={{ backgroundImage: `url(${currentTrack.albumArt})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/90" />

      {/* Close button */}
      <button
        onClick={() => setActiveDrawer(null)}
        className="absolute top-6 right-6 sm:top-8 sm:right-8 z-20 p-3 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white backdrop-blur-md transition-all duration-200 border border-white/5"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Content */}
      <div className="relative z-10 w-full h-full max-w-5xl mx-auto flex flex-col md:flex-row">
        
        {/* Track Info Side (Desktop) */}
        <div className="hidden md:flex flex-col justify-center w-1/3 p-12 lg:p-16 border-r border-white/5">
          <img 
            src={currentTrack?.albumArt} 
            alt={currentTrack?.title}
            className="w-full aspect-square object-cover rounded-2xl shadow-2xl mb-8"
          />
          <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight mb-2">
            {currentTrack?.title}
          </h2>
          <p className="text-lg text-white/60 font-medium">
            {currentTrack?.artist}
          </p>
          <div className="mt-8 flex items-center gap-3 text-emerald-400 bg-emerald-400/10 w-fit px-4 py-2 rounded-full border border-emerald-400/20">
            <Mic2 className="w-5 h-5" />
            <span className="text-sm font-semibold tracking-wide uppercase">Playing Now</span>
          </div>
        </div>

        {/* Mobile Track Info (Header) */}
        <div className="md:hidden pt-12 pb-6 px-6 flex items-center gap-4 border-b border-white/5 bg-black/20 backdrop-blur-md">
          <img 
            src={currentTrack?.albumArt} 
            alt={currentTrack?.title}
            className="w-16 h-16 rounded-lg shadow-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">
              {currentTrack?.title}
            </h2>
            <p className="text-sm text-white/60 truncate">
              {currentTrack?.artist}
            </p>
          </div>
        </div>

        {/* Lyrics Scroll Area */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto scroll-smooth hide-scrollbar px-6 md:px-12 lg:px-20 relative"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Spacer for centering first line */}
          <div className="h-[30vh] md:h-[40vh]" />

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-white/50 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-lg font-medium tracking-wide">Loading lyrics...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-20 text-white/40 space-y-4">
              <AlertCircle className="w-12 h-12 opacity-50" />
              <p className="text-lg text-center max-w-sm">{error}</p>
            </div>
          )}

          {!isLoading && syncedLyrics && (
            <div className="space-y-6 md:space-y-8 pb-[50vh]">
              {syncedLyrics.map((line, idx) => {
                const isActive = idx === activeLineIndex;
                const isPassed = idx < activeLineIndex;
                
                return (
                  <div
                    key={idx}
                    ref={isActive ? activeLineRef : null}
                    onClick={() => seek(line.time)}
                    className={`transition-all duration-500 origin-left ${
                      isActive
                        ? 'text-white text-3xl md:text-4xl lg:text-5xl font-bold scale-100 blur-none opacity-100'
                        : isPassed
                        ? 'text-white/30 text-2xl md:text-3xl lg:text-4xl font-semibold scale-95 blur-[1px] opacity-60 hover:opacity-100 cursor-pointer'
                        : 'text-white/20 text-2xl md:text-3xl lg:text-4xl font-semibold scale-95 blur-[1px] opacity-30 hover:opacity-100 cursor-pointer'
                    }`}
                  >
                    {line.text}
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && !syncedLyrics && plainLyrics && (
            <div className="whitespace-pre-wrap text-xl md:text-2xl text-white/80 leading-relaxed font-medium pb-32 text-center md:text-left max-w-2xl">
              {plainLyrics}
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
};

function parseLrc(lrcStr: string): LyricLine[] {
  const lines = lrcStr.split(/\r?\n/);
  const parsed: LyricLine[] = [];
  
  for (const line of lines) {
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
    let match;
    const times: number[] = [];
    while ((match = timeRegex.exec(line)) !== null) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const msStr = match[3].padEnd(3, "0");
      const ms = parseInt(msStr, 10);
      times.push(min * 60 + sec + ms / 1000);
    }
    
    const text = line.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, "").trim();
    if (text) {
      for (const t of times) {
        parsed.push({ time: t, text });
      }
    }
  }
  
  parsed.sort((a, b) => a.time - b.time);
  return parsed;
}

