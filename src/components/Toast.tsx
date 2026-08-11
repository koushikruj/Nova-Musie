import React from 'react';
import { usePlayer } from '../context/PlayerContext';

export const Toast: React.FC = () => {
  const { toastMessage } = usePlayer();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none transition-all duration-300">
      <div className="px-4 py-2 rounded-full bg-neutral-900/90 border border-white/20 text-white font-medium text-xs shadow-2xl backdrop-blur-md flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
};
