import React, { useEffect, useRef, useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Sparkles, Activity, Waves, Palette, Disc, Orbit } from 'lucide-react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  volume: number;
}

type VisualizerMode = 'bars' | 'mirror' | 'wave' | 'radial' | 'particles';
type ColorTheme = 'neon' | 'amber' | 'emerald' | 'violet' | 'aurora' | 'monochrome';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

const COLOR_THEMES: Record<ColorTheme, { name: string; stops: string[]; glow: string; peak: string }> = {
  neon: {
    name: 'Cyber Neon',
    stops: ['#06b6d4', '#a855f7', '#ec4899'],
    glow: 'rgba(236, 72, 153, 0.45)',
    peak: '#f472b6'
  },
  emerald: {
    name: 'Emerald Pulse',
    stops: ['#10b981', '#06b6d4', '#3b82f6'],
    glow: 'rgba(16, 185, 129, 0.45)',
    peak: '#34d399'
  },
  aurora: {
    name: 'Aurora Borealis',
    stops: ['#22c55e', '#06b6d4', '#8b5cf6'],
    glow: 'rgba(6, 182, 212, 0.45)',
    peak: '#38bdf8'
  },
  amber: {
    name: 'Sunset Gold',
    stops: ['#f59e0b', '#f97316', '#ef4444'],
    glow: 'rgba(249, 115, 22, 0.45)',
    peak: '#fbbf24'
  },
  violet: {
    name: 'Violet Dreams',
    stops: ['#6366f1', '#8b5cf6', '#d946ef'],
    glow: 'rgba(139, 92, 246, 0.45)',
    peak: '#c084fc'
  },
  monochrome: {
    name: 'Silver Glow',
    stops: ['#f8fafc', '#94a3b8', '#475569'],
    glow: 'rgba(248, 250, 252, 0.35)',
    peak: '#ffffff'
  }
};

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying, volume }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { analyserRef } = usePlayer();
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const [mode, setMode] = useState<VisualizerMode>('bars');
  const [themeKey, setThemeKey] = useState<ColorTheme>('neon');
  const [showThemePicker, setShowThemePicker] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;
    const barsCount = 52;

    // Smooth state arrays
    const barHeights = new Array(barsCount).fill(3);
    const peakPositions = new Array(barsCount).fill(3);
    const peakVelocities = new Array(barsCount).fill(0);

    // Particle pool
    const particles: Particle[] = [];

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = 68 * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const render = () => {
      const width = canvas.width / Math.min(window.devicePixelRatio || 1, 2);
      const height = 68;
      ctx.clearRect(0, 0, width, height);

      const theme = COLOR_THEMES[themeKey];
      let useRealData = false;
      let bassEnergy = 0;

      if (isPlaying && analyserRef?.current) {
        if (!dataArrayRef.current || dataArrayRef.current.length !== analyserRef.current.frequencyBinCount) {
          dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
        }
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        let sum = 0;
        let bassSum = 0;
        const binCount = dataArrayRef.current.length;
        for (let i = 0; i < binCount; i++) {
          sum += dataArrayRef.current[i];
          if (i < binCount * 0.15) bassSum += dataArrayRef.current[i];
        }
        if (sum > 0) {
          useRealData = true;
          bassEnergy = (bassSum / (binCount * 0.15 * 255)) * Math.max(0.2, volume);
        }
      }

      const centerY = height / 2;
      const maxBarHeight = height * 0.82;

      // Create gradient for current mode & theme
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, theme.stops[0]);
      gradient.addColorStop(0.5, theme.stops[1]);
      gradient.addColorStop(1, theme.stops[2]);

      // Draw subtle beat-reactive ambient glow background
      if (isPlaying && bassEnergy > 0.3) {
        const bgGlow = ctx.createRadialGradient(width / 2, centerY, 5, width / 2, centerY, width * 0.6);
        bgGlow.addColorStop(0, theme.glow.replace('0.45', (bassEnergy * 0.25).toFixed(2)));
        bgGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = bgGlow;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.save();
      if (isPlaying) {
        ctx.shadowColor = theme.glow;
        ctx.shadowBlur = 12;
      }

      // Spawn beat particles when music is playing and energy spikes
      if (isPlaying && (bassEnergy > 0.4 || Math.random() < 0.2)) {
        if (particles.length < 40) {
          particles.push({
            x: Math.random() * width,
            y: height - 5,
            vx: (Math.random() - 0.5) * 1.2,
            vy: -Math.random() * 1.5 - 0.8 - bassEnergy * 2,
            size: Math.random() * 2.5 + 1,
            color: theme.stops[Math.floor(Math.random() * theme.stops.length)],
            alpha: 1,
            life: 0,
            maxLife: 30 + Math.random() * 30
          });
        }
      }

      // Render Floating Particles
      for (let p = particles.length - 1; p >= 0; p--) {
        const pt = particles[p];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life++;
        pt.alpha = 1 - pt.life / pt.maxLife;

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fill();

        if (pt.life >= pt.maxLife || pt.y < 0) {
          particles.splice(p, 1);
        }
      }
      ctx.globalAlpha = 1;

      // --- VISUALIZER MODES ---
      if (mode === 'radial') {
        // --- MODE 1: CIRCULAR RADIAL SPECTRUM ---
        const radius = Math.min(width, height) * 0.28;
        const centerX = width / 2;

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;

        // Outer radial frequency spokes
        for (let i = 0; i < barsCount; i++) {
          let v = 3;
          if (isPlaying) {
            if (useRealData && dataArrayRef.current) {
              const bin = Math.floor(i * (dataArrayRef.current.length * 0.4) / barsCount);
              v = Math.max(3, (dataArrayRef.current[bin] / 255) * maxBarHeight * 0.5 * Math.max(0.2, volume));
            } else {
              v = Math.max(3, (Math.sin(phase + i * 0.25) * 0.5 + 0.5) * maxBarHeight * 0.4 * Math.max(0.2, volume));
            }
          }

          const angle = (i / barsCount) * Math.PI * 2 + phase * 0.2;
          const x1 = centerX + Math.cos(angle) * radius;
          const y1 = centerY + Math.sin(angle) * radius;
          const x2 = centerX + Math.cos(angle) * (radius + v);
          const y2 = centerY + Math.sin(angle) * (radius + v);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // Spoke tip glow dot
          if (isPlaying && v > 8) {
            ctx.beginPath();
            ctx.arc(x2, y2, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = theme.peak;
            ctx.fill();
          }
        }

        // Inner glowing pulsing core
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * (0.8 + bassEnergy * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = theme.peak;
        ctx.lineWidth = 1;
        ctx.stroke();

      } else if (mode === 'particles') {
        // --- MODE 2: CYBER STARLIGHT PULSE ---
        const count = 36;
        for (let i = 0; i < count; i++) {
          let v = 0;
          if (isPlaying) {
            if (useRealData && dataArrayRef.current) {
              const bin = Math.floor(i * (dataArrayRef.current.length * 0.4) / count);
              v = (dataArrayRef.current[bin] / 255) * Math.max(0.2, volume);
            } else {
              v = (Math.sin(phase + i * 0.4) * 0.5 + 0.5) * Math.max(0.2, volume);
            }
          }

          const x = (i / count) * width + (width / count) / 2;
          const pulseY = centerY + Math.sin(phase * 1.5 + i * 0.5) * (height * 0.3) * v;
          const orbRadius = Math.max(2, 3 + v * 8);

          // Glowing orb
          const orbGrad = ctx.createRadialGradient(x, pulseY, 0, x, pulseY, orbRadius * 2);
          orbGrad.addColorStop(0, theme.peak);
          orbGrad.addColorStop(0.5, theme.stops[i % theme.stops.length]);
          orbGrad.addColorStop(1, 'transparent');

          ctx.beginPath();
          ctx.arc(x, pulseY, orbRadius, 0, Math.PI * 2);
          ctx.fillStyle = orbGrad;
          ctx.fill();

          // Vertical signal beam line
          if (v > 0.2) {
            ctx.beginPath();
            ctx.moveTo(x, pulseY - v * 15);
            ctx.lineTo(x, pulseY + v * 15);
            ctx.strokeStyle = theme.stops[i % theme.stops.length];
            ctx.lineWidth = 1;
            ctx.globalAlpha = v * 0.8;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }

      } else if (mode === 'wave') {
        // --- MODE 3: SMOOTH AUDIO WAVEFORM WITH DUAL LAYER & GLOW ---
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = gradient;

        const sliceWidth = width / barsCount;
        let x = 0;

        // Wave fill gradient underneath
        const waveFillGrad = ctx.createLinearGradient(0, centerY - maxBarHeight / 2, 0, centerY + maxBarHeight / 2);
        waveFillGrad.addColorStop(0, theme.stops[0]);
        waveFillGrad.addColorStop(1, 'transparent');

        ctx.beginPath();
        for (let i = 0; i < barsCount; i++) {
          let v = 0;
          if (isPlaying) {
            if (useRealData && dataArrayRef.current) {
              const bin = Math.floor(i * (dataArrayRef.current.length * 0.4) / barsCount);
              v = (dataArrayRef.current[bin] / 255) * Math.max(0.2, volume);
            } else {
              v = (Math.sin(phase + i * 0.3) * 0.5 + 0.5) * Math.max(0.2, volume);
            }
          }

          const y = centerY + Math.sin(phase * 1.3 + i * 0.25) * v * (maxBarHeight / 2);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          x += sliceWidth;
        }

        ctx.stroke();

        // Glowing node dots
        x = 0;
        for (let i = 0; i < barsCount; i += 3) {
          let v = 0;
          if (isPlaying) {
            if (useRealData && dataArrayRef.current) {
              const bin = Math.floor(i * (dataArrayRef.current.length * 0.4) / barsCount);
              v = (dataArrayRef.current[bin] / 255) * Math.max(0.2, volume);
            } else {
              v = (Math.sin(phase + i * 0.3) * 0.5 + 0.5) * Math.max(0.2, volume);
            }
          }
          const y = centerY + Math.sin(phase * 1.3 + i * 0.25) * v * (maxBarHeight / 2);

          ctx.beginPath();
          ctx.arc(i * sliceWidth, y, isPlaying ? 3 : 1.5, 0, Math.PI * 2);
          ctx.fillStyle = theme.peak;
          ctx.fill();
        }

      } else if (mode === 'mirror') {
        // --- MODE 4: MIRRORED DUAL SPECTRUM ---
        const barWidth = (width / barsCount) * 0.75;
        const gap = (width / barsCount) * 0.25;

        ctx.fillStyle = gradient;

        for (let i = 0; i < barsCount; i++) {
          let target = 3;
          if (isPlaying) {
            if (useRealData && dataArrayRef.current) {
              const centerIdx = Math.abs(i - barsCount / 2);
              const bin = Math.floor(centerIdx * (dataArrayRef.current.length * 0.35) / (barsCount / 2));
              const val = dataArrayRef.current[bin] / 255;
              target = Math.max(4, val * maxBarHeight * Math.max(0.2, volume));
            } else {
              const dist = Math.abs(i - barsCount / 2);
              const val = Math.sin(phase + dist * 0.3) * 0.5 + 0.5;
              target = Math.max(4, val * maxBarHeight * Math.max(0.2, volume));
            }
          }

          barHeights[i] += (target - barHeights[i]) * 0.25;
          const h = barHeights[i];
          const bx = i * (barWidth + gap);

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(bx, centerY - h / 2, barWidth, h, 2);
          } else {
            ctx.rect(bx, centerY - h / 2, barWidth, h);
          }
          ctx.fill();
        }

      } else {
        // --- MODE 5: SPECTRUM BARS WITH FLOATING PEAKS & REFLECTION ---
        const barWidth = Math.max(2, (width / barsCount) - 2.5);
        const gap = 2.5;

        for (let i = 0; i < barsCount; i++) {
          let target = 3;

          if (isPlaying) {
            if (useRealData && dataArrayRef.current) {
              const bin = Math.floor(i * (dataArrayRef.current.length * 0.45) / barsCount);
              const val = dataArrayRef.current[bin] / 255;
              target = Math.max(4, val * maxBarHeight * Math.max(0.2, volume));
            } else {
              const s1 = Math.sin(phase + i * 0.2);
              const s2 = Math.cos(phase * 1.4 + i * 0.35);
              const val = Math.abs(s1 * 0.6 + s2 * 0.4);
              target = Math.max(4, val * maxBarHeight * Math.max(0.2, volume));
            }
          }

          barHeights[i] += (target - barHeights[i]) * 0.25;
          const h = barHeights[i];

          // Update floating peak dots logic
          if (h > peakPositions[i]) {
            peakPositions[i] = h;
            peakVelocities[i] = 0;
          } else {
            peakVelocities[i] += 0.25; // gravity
            peakPositions[i] -= peakVelocities[i];
            if (peakPositions[i] < 3) peakPositions[i] = 3;
          }

          const bx = i * (barWidth + gap);

          // Main Bar Gradient
          const barGrad = ctx.createLinearGradient(0, height, 0, height - h);
          barGrad.addColorStop(0, theme.stops[0]);
          barGrad.addColorStop(0.6, theme.stops[1]);
          barGrad.addColorStop(1, theme.stops[2]);

          ctx.fillStyle = barGrad;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(bx, height - h, barWidth, h, [3, 3, 0, 0]);
          } else {
            ctx.rect(bx, height - h, barWidth, h);
          }
          ctx.fill();

          // Draw Floating Peak Line
          if (isPlaying && peakPositions[i] > 4) {
            const peakY = height - peakPositions[i] - 2;
            ctx.fillStyle = theme.peak;
            ctx.fillRect(bx, Math.max(0, peakY), barWidth, 1.8);
          }
        }
      }

      ctx.restore();

      phase += 0.07;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [isPlaying, volume, analyserRef, mode, themeKey]);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center my-2 group">
      {/* Visualizer Header Bar with Control Pills */}
      <div className="w-full flex items-center justify-between px-1 mb-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-1.5" />

        {/* Mode & Theme Selector Buttons */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <div className="flex items-center bg-black/60 backdrop-blur-xl p-0.5 rounded-xl border border-white/15 shadow-md">
            <button
              onClick={() => setMode('bars')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
                mode === 'bars'
                  ? 'bg-white/25 text-white shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Spectrum Bars with Floating Peaks"
            >
              <Activity className="w-3 h-3 inline mr-1" />
              Bars
            </button>

            <button
              onClick={() => setMode('mirror')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
                mode === 'mirror'
                  ? 'bg-white/25 text-white shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Mirrored Center Spectrum"
            >
              Mirror
            </button>

            <button
              onClick={() => setMode('wave')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
                mode === 'wave'
                  ? 'bg-white/25 text-white shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Smooth Audio Waveform"
            >
              <Waves className="w-3 h-3 inline mr-1" />
              Wave
            </button>

            <button
              onClick={() => setMode('radial')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
                mode === 'radial'
                  ? 'bg-white/25 text-white shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Circular Radial Ring Spectrum"
            >
              <Disc className="w-3 h-3 inline mr-1" />
              Radial
            </button>

            <button
              onClick={() => setMode('particles')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
                mode === 'particles'
                  ? 'bg-white/25 text-white shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Cyber Starlight Pulse Particles"
            >
              <Orbit className="w-3 h-3 inline mr-1" />
              Orbit
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              className="p-1.5 rounded-xl bg-black/60 backdrop-blur-xl border border-white/15 text-neutral-300 hover:text-white transition-colors shadow-md"
              title="Change Visualizer Color Theme"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {showThemePicker && (
              <div className="absolute right-0 top-8 z-40 p-2 rounded-2xl bg-neutral-950/95 backdrop-blur-2xl border border-white/20 shadow-2xl flex flex-col gap-1.5 w-40 animate-in fade-in zoom-in-95 duration-150">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-1">
                  Color Themes
                </span>
                {(Object.keys(COLOR_THEMES) as ColorTheme[]).map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      setThemeKey(t);
                      setShowThemePicker(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      themeKey === t
                        ? 'bg-white/20 text-white font-semibold'
                        : 'text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{COLOR_THEMES[t].name}</span>
                    <span
                      className="w-3 h-3 rounded-full border border-white/30 shadow-xs"
                      style={{ background: COLOR_THEMES[t].stops[0] }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Display Stage */}
      <div className="w-full relative px-2 py-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/60 group-hover:border-white/25 transition-all duration-300 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-16 block rounded-xl transition-opacity duration-300"
        />
      </div>
    </div>
  );
};
