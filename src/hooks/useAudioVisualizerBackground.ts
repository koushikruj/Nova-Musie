import { useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';

export const useAudioVisualizerBackground = () => {
  const { isPlaying, volume, analyserRef } = usePlayer();
  const bgRef = useRef<HTMLImageElement>(null);
  const phaseRef = useRef(0);
  const currentPulseRef = useRef(0);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const bgElement = bgRef.current;
      if (!bgElement) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      let targetPulse = 0;

      if (isPlaying) {
        // Try to get real audio data
        if (analyserRef?.current) {
          if (!dataArrayRef.current || dataArrayRef.current.length !== analyserRef.current.frequencyBinCount) {
            dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
          }
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i];
          }
          const average = sum / dataArrayRef.current.length;
          // Normalize average to 0-1 range
          const amplitude = average / 255;
          
          if (amplitude > 0.05) {
            targetPulse = amplitude * Math.max(0.2, volume);
          }
        }
        
        // Fallback to simulation if no real amplitude data is coming through
        if (targetPulse === 0) {
          phaseRef.current += 0.08;
          const phase = phaseRef.current;
          const bass = Math.sin(phase * 0.5) * Math.sin(phase * 0.8);
          const mid = Math.sin(phase * 1.5);
          const combined = (bass * 0.7 + mid * 0.3);
          
          targetPulse = Math.abs(combined) * Math.max(0.2, volume);
        }

        // Smooth transition
        currentPulseRef.current += (targetPulse - currentPulseRef.current) * 0.2;
      } else {
        currentPulseRef.current += (0 - currentPulseRef.current) * 0.1;
      }

      // Subtle gentle scale expansion without any dimming or opacity modulation
      const scale = 1.2 + (currentPulseRef.current * 0.05);

      bgElement.style.transform = `scale(${scale})`;
      if (bgElement.parentElement) {
        bgElement.parentElement.style.opacity = '0.55';
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, volume, analyserRef]);

  return bgRef;
};
