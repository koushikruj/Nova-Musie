import { useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';

export const useKeyboardShortcuts = () => {
  const {
    togglePlay,
    seek,
    currentTime,
    duration,
    volume,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    setActiveDrawer,
    activeDrawer
  } = usePlayer();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keybindings if user is typing inside an input or textarea
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }

      // Cmd+K or Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveDrawer(activeDrawer === 'search' ? null : 'search');
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(0, currentTime - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(Math.min(duration || 0, currentTime + 5));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.05));
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          toggleShuffle();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          cycleRepeat();
          break;
        case 'q':
        case 'Q':
          e.preventDefault();
          setActiveDrawer(activeDrawer === 'queue' ? null : 'queue');
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          setActiveDrawer(activeDrawer === 'playlists' ? null : 'playlists');
          break;
        case '?':
          e.preventDefault();
          setActiveDrawer(activeDrawer === 'shortcuts' ? null : 'shortcuts');
          break;
        case 'Escape':
          if (activeDrawer) {
            e.preventDefault();
            setActiveDrawer(null);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    togglePlay,
    seek,
    currentTime,
    duration,
    volume,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    setActiveDrawer,
    activeDrawer
  ]);
};
