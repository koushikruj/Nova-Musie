import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  PlusCircle,
  AlertCircle,
  Mic2,
  FastForward,
  Rewind
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useDominantColor } from '../hooks/useDominantColor';
import { AudioVisualizer } from './AudioVisualizer';
import { InteractiveProgressBar } from './InteractiveProgressBar';

export const MainPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeatMode,
    favorites,
    isLoading,
    isBuffering,
    error,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleFavorite,
    setActiveDrawer,
    activeDrawer
  } = usePlayer();

  if (!currentTrack) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-400">
        <p className="text-lg">No track loaded</p>
        <button
          onClick={() => setActiveDrawer('search')}
          className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm"
        >
          Browse Catalog
        </button>
      </div>
    );
  }

  const isLiked = favorites.includes(currentTrack.id);
  const dominantColors = useDominantColor(currentTrack?.albumArt, currentTrack?.id);

  return (
    <main id="main-player-controls" className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full text-white select-none">
      {/* Frosted Glass Player Card Container with Evolving Album-Matched Outer Glow */}
      <div
        className="w-full bg-neutral-900/50 backdrop-blur-2xl border rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-saturate-150 transition-all duration-700 relative overflow-hidden"
        style={{
          borderColor: `rgba(${dominantColors.rgb}, ${isPlaying ? '0.35' : '0.18'})`,
          boxShadow: `0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 ${isPlaying ? '45px' : '22px'} rgba(${dominantColors.rgb}, ${isPlaying ? '0.3' : '0.12'})`
        }}
      >
        {/* Ambient subtle glow background inside card evolving with album art */}
        <div
          className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-1000 opacity-25"
          style={{ background: dominantColors.primary }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-1000 opacity-20"
          style={{ background: dominantColors.secondary }}
        />

        {/* Alert banner for error */}
        {error && (
          <div className="w-full mb-4 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-200 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Main Responsive Grid Layout (Stacked on Mobile, 2-Column on Desktop) */}
        <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10 py-1 relative z-10">
        {/* Left Column: Album Artwork Container */}
        <div className="relative group shrink-0">
          {/* Glow halo around artwork when playing */}
          <div
            className={`absolute -inset-1 rounded-3xl blur-2xl transition-all duration-700 ${
              isPlaying ? 'opacity-50 scale-105' : 'opacity-15 scale-95'
            }`}
            style={{
              background: `radial-gradient(circle, rgba(${dominantColors.rgb}, 0.8) 0%, ${dominantColors.secondary} 100%)`
            }}
          />

          {/* Artwork Image */}
          <div className="relative w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]">
            <img
              src={currentTrack.albumArt}
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100 filter grayscale-[15%]'
              }`}
              loading="eager"
              onError={(e) => {
                // Fallback artwork if image fails
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop';
              }}
            />

            {/* Audio Quality indicator */}
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-neutral-300">
              HQ Audio
            </div>

            {/* Loading / Buffering spinner overlay */}
            {(isLoading || isBuffering) && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Track Details, Scrubber, and Controls */}
        <div className="flex-1 w-full max-w-md lg:max-w-lg flex flex-col items-center lg:items-start text-center lg:text-left">
          {/* Audio Wave Visualizer */}
          <AudioVisualizer isPlaying={isPlaying} volume={isMuted ? 0 : volume} />

          {/* Track Metadata */}
          <div className="mt-2 mb-3 w-full">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white line-clamp-1">
              {currentTrack.title}
            </h1>
            <p className="text-sm sm:text-base font-medium text-neutral-400 mt-1 line-clamp-1">
              {currentTrack.artist}
            </p>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              {currentTrack.album} {currentTrack.year ? `• ${currentTrack.year}` : ''}
            </p>
          </div>

          {/* Seek Scrubber & Time */}
          <InteractiveProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={seek}
            isPlaying={isPlaying}
          />

          {/* Primary Playback Controls */}
          <div className="flex items-center justify-center lg:justify-start w-full gap-2 sm:gap-4 lg:gap-5 my-3">
            {/* Shuffle Button */}
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition-colors duration-200 ${
                shuffle
                  ? 'text-white bg-white/10'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title={shuffle ? 'Shuffle On' : 'Shuffle Off'}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Previous Track */}
            <button
              onClick={previous}
              className="p-2 text-neutral-300 hover:text-white transition-transform duration-150 active:scale-90"
              title="Previous Track (Left Arrow)"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Skip Backward 10s */}
            <button
              onClick={() => seek(Math.max(0, currentTime - 10))}
              className="p-2 text-neutral-400 hover:text-white transition-transform duration-150 active:scale-90"
              title="Rewind 10s"
            >
              <Rewind className="w-4 h-4" />
            </button>

            {/* Play/Pause Main Button */}
            <button
              onClick={togglePlay}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none shrink-0"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Skip Forward 10s */}
            <button
              onClick={() => seek(Math.min(duration || 0, currentTime + 10))}
              className="p-2 text-neutral-400 hover:text-white transition-transform duration-150 active:scale-90"
              title="Fast Forward 10s"
            >
              <FastForward className="w-4 h-4" />
            </button>

            {/* Next Track */}
            <button
              onClick={next}
              className="p-2 text-neutral-300 hover:text-white transition-transform duration-150 active:scale-90"
              title="Next Track (Right Arrow)"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Repeat Cycle Button */}
            <button
              onClick={cycleRepeat}
              className={`p-2 rounded-full transition-colors duration-200 relative ${
                repeatMode !== 'off'
                  ? 'text-white bg-white/10'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Secondary Controls Bar (Favorites, Volume, Add to Playlist) */}
          <div className="flex items-center justify-between w-full pt-3 border-t border-white/5 text-neutral-400 text-xs">
            {/* Favorite Heart Button */}
            <button
              onClick={() => toggleFavorite(currentTrack)}
              className={`p-2 rounded-full transition-all duration-200 active:scale-125 ${
                isLiked ? 'text-rose-500' : 'text-neutral-400 hover:text-white'
              }`}
              title={isLiked ? 'Remove from Favorites' : 'Add to Favorites'}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group">
              <button
                onClick={toggleMute}
                className="p-1 hover:text-white transition-colors"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-neutral-500" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 sm:w-20 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white hover:bg-neutral-700 transition-all"
                title="Volume (Up/Down Arrow)"
              />
            </div>

            <div className="flex items-center gap-1">
              {/* Lyrics Button */}
              <button
                onClick={() => setActiveDrawer('lyrics')}
                className={`p-2 rounded-full transition-colors ${
                  activeDrawer === 'lyrics' ? 'text-emerald-400 bg-emerald-400/10' : 'hover:text-white'
                }`}
                title="Lyrics"
              >
                <Mic2 className="w-5 h-5" />
              </button>

              {/* Add track to playlist button */}
              <button
                onClick={() => setActiveDrawer('playlists')}
                className="p-2 rounded-full hover:text-white transition-colors"
                title="Add song to playlist"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
  );
};
