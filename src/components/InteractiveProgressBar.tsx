import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { usePlayer } from '../context/PlayerContext';

interface InteractiveProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  isPlaying: boolean;
}

const BAR_COUNT = 64;

export const InteractiveProgressBar: React.FC<InteractiveProgressBarProps> = ({
  currentTime,
  duration,
  onSeek,
  isPlaying
}) => {
  const { currentTrack, analyserRef } = usePlayer();
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);
  const [hoverSeekPos, setHoverSeekPos] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [audioRealFactor, setAudioRealFactor] = useState<number>(1);

  // Deterministic organic waveform generation per track
  const staticWaveform = useMemo(() => {
    const trackId = currentTrack?.id || 'default-track';
    let hash = 0;
    for (let i = 0; i < trackId.length; i++) {
      hash = (hash << 5) - hash + trackId.charCodeAt(i);
      hash |= 0;
    }

    const bars: number[] = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      const seed = Math.abs(Math.sin(hash + i * 0.38));
      const envelope = Math.sin(((i + 1) / (BAR_COUNT + 1)) * Math.PI);
      const height = Math.max(20, Math.min(100, Math.floor((seed * 75 + 25) * (0.35 + 0.65 * envelope))));
      bars.push(height);
    }
    return bars;
  }, [currentTrack?.id]);

  // Real-time audio analyzer pulse for waveform interactivity when playing
  useEffect(() => {
    if (!isPlaying || !analyserRef?.current) return;
    let animId: number;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateAudioPulse = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < 32; i++) {
          sum += dataArray[i];
        }
        const avg = sum / 32;
        setAudioRealFactor(0.85 + (avg / 255) * 0.45);
      }
      animId = requestAnimationFrame(updateAudioPulse);
    };

    updateAudioPulse();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, analyserRef]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatDelta = (hoverSecs: number, currentSecs: number) => {
    const diff = Math.round(hoverSecs - currentSecs);
    if (Math.abs(diff) < 1) return '';
    const sign = diff > 0 ? '+' : '-';
    const abs = Math.abs(diff);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    return m > 0 ? `${sign}${m}m ${s}s` : `${sign}${s}s`;
  };

  const calculateTargetSeconds = useCallback((clientX: number) => {
    if (!progressBarRef.current || !duration) return { targetTime: 0, offsetX: 0, percent: 0 };
    const rect = progressBarRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const percent = offsetX / rect.width;
    const targetTime = percent * duration;
    return { targetTime, offsetX, percent };
  }, [duration]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    const { targetTime, offsetX } = calculateTargetSeconds(e.clientX);
    setHoverSeekTime(targetTime);
    setHoverSeekPos(offsetX);
  };

  const handleMouseLeave = () => {
    if (!isDragging) {
      setHoverSeekTime(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const { targetTime, offsetX } = calculateTargetSeconds(e.clientX);
    setHoverSeekTime(targetTime);
    setHoverSeekPos(offsetX);
    onSeek(targetTime);
  };

  // Window drag listeners for seamless scrubbing beyond container bounds
  useEffect(() => {
    if (!isDragging) return;

    const onWindowMouseMove = (e: MouseEvent) => {
      const { targetTime, offsetX } = calculateTargetSeconds(e.clientX);
      setHoverSeekTime(targetTime);
      setHoverSeekPos(offsetX);
      onSeek(targetTime);
    };

    const onWindowMouseUp = () => {
      setIsDragging(false);
      setHoverSeekTime(null);
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [isDragging, calculateTargetSeconds, onSeek]);

  // Touch event support for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      setIsDragging(true);
      const { targetTime, offsetX } = calculateTargetSeconds(e.touches[0].clientX);
      setHoverSeekTime(targetTime);
      setHoverSeekPos(offsetX);
      onSeek(targetTime);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      const { targetTime, offsetX } = calculateTargetSeconds(e.touches[0].clientX);
      setHoverSeekTime(targetTime);
      setHoverSeekPos(offsetX);
      onSeek(targetTime);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setHoverSeekTime(null);
  };

  const progressPercent = duration ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const hoverPercent = duration && hoverSeekTime !== null ? Math.min(100, Math.max(0, (hoverSeekTime / duration) * 100)) : null;

  return (
    <div className="w-full my-2 select-none">
      <div
        ref={progressBarRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-12 flex flex-col justify-end group cursor-pointer py-1"
      >
        {/* Hover Time & Amplitude Preview Tooltip */}
        {hoverSeekTime !== null && (
          <div
            className="absolute -top-10 transform -translate-x-1/2 px-2.5 py-1 rounded-lg bg-neutral-900/95 border border-white/20 text-white shadow-xl pointer-events-none z-30 flex items-center gap-2 backdrop-blur-md transition-transform duration-75 ease-out animate-in fade-in zoom-in-95"
            style={{ left: `${hoverSeekPos}px` }}
          >
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-mono font-bold leading-tight tracking-wide text-white">
                {formatTime(hoverSeekTime)}
              </span>
              {formatDelta(hoverSeekTime, currentTime) && (
                <span className="text-[9px] font-mono text-neutral-400 leading-none">
                  {formatDelta(hoverSeekTime, currentTime)}
                </span>
              )}
            </div>
            {/* Tooltip Downward Arrow */}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-neutral-900 border-r border-b border-white/20 rotate-45" />
          </div>
        )}

        {/* Integrated Waveform Visualization Canvas / Bars */}
        <div className="w-full h-8 flex items-end justify-between gap-[2px] px-0.5 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
          {staticWaveform.map((baseHeight, idx) => {
            const barIndexPercent = (idx / BAR_COUNT) * 100;
            const isPlayed = barIndexPercent <= progressPercent;
            const isHoveredRange =
              hoverPercent !== null &&
              ((hoverPercent >= progressPercent && barIndexPercent >= progressPercent && barIndexPercent <= hoverPercent) ||
                (hoverPercent < progressPercent && barIndexPercent <= progressPercent && barIndexPercent >= hoverPercent));

            // Dynamic height scaling with audio pulse
            const dynamicHeight = isPlaying && isPlayed
              ? Math.min(100, Math.max(15, baseHeight * audioRealFactor))
              : baseHeight;

            let barBgClass = 'bg-neutral-700/60';
            if (isPlayed) {
              barBgClass = 'bg-gradient-to-t from-white/80 to-white';
            } else if (isHoveredRange) {
              barBgClass = 'bg-indigo-400/80 shadow-[0_0_8px_rgba(129,140,248,0.5)]';
            }

            return (
              <div
                key={idx}
                className={`flex-1 rounded-full transition-all duration-150 ${barBgClass}`}
                style={{
                  height: `${dynamicHeight}%`,
                  minWidth: '2px'
                }}
              />
            );
          })}
        </div>

        {/* Minimal Timeline Scrubber Track */}
        <div className="relative w-full h-1.5 bg-neutral-800/80 rounded-full overflow-hidden mt-1 transition-all duration-200 group-hover:h-2">
          {/* Progress Fill */}
          <div
            className="h-full bg-gradient-to-r from-neutral-200 via-white to-white rounded-full transition-all duration-75 relative"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Glow sweep effect */}
            <div className="absolute inset-0 bg-white/30 animate-pulse" />
          </div>

          {/* Hover Preview Overlay Track */}
          {hoverPercent !== null && (
            <div
              className="absolute top-0 bottom-0 bg-indigo-400/30 transition-all duration-75 pointer-events-none"
              style={{
                left: `${Math.min(progressPercent, hoverPercent)}%`,
                width: `${Math.abs(hoverPercent - progressPercent)}%`
              }}
            />
          )}
        </div>

        {/* Interactive Scrub Handle / Thumb (Visible on Hover or Drag) */}
        <div
          className={`absolute bottom-0 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] border border-neutral-900 pointer-events-none transform -translate-x-1/2 transition-all duration-150 ${
            isDragging
              ? 'scale-125 bg-indigo-300 shadow-[0_0_14px_rgba(165,180,252,0.9)] opacity-100 z-20'
              : 'opacity-0 group-hover:opacity-100 group-hover:scale-110 z-10'
          }`}
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      {/* Time Labels */}
      <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mt-0.5">
        <span className="hover:text-white transition-colors">{formatTime(currentTime)}</span>
        <span className="hover:text-white transition-colors">{formatTime(duration)}</span>
      </div>
    </div>
  );
};
