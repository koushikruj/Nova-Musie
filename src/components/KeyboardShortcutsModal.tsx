import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const KeyboardShortcutsModal: React.FC = () => {
  const { activeDrawer, setActiveDrawer, hasPermission } = usePlayer();

  if (activeDrawer !== 'shortcuts') return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause' },
    { key: '←', desc: 'Seek Backward 5s' },
    { key: '→', desc: 'Seek Forward 5s' },
    { key: '↑', desc: 'Increase Volume' },
    { key: '↓', desc: 'Decrease Volume' },
    { key: 'M', desc: 'Toggle Mute' },
    { key: 'S', desc: 'Toggle Shuffle' },
    { key: 'R', desc: 'Cycle Repeat (Off / All / One)' },
    { key: 'Q', desc: 'Toggle Playback Queue' },
    { key: 'L', desc: 'Toggle Playlists & Library' },
    ...(hasPermission('canSearchCatalog') ? [{ key: '⌘ K / Ctrl K', desc: 'Open Catalog Search' }] : []),
    { key: '?', desc: 'Keyboard Shortcuts Menu' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity">
      <div className="w-full max-w-md bg-neutral-950/80 backdrop-blur-2xl border border-white/20 backdrop-saturate-150 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col text-white">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-neutral-400" />
            <h2 className="font-semibold text-base">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setActiveDrawer(null)}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/60 border border-white/5 text-xs"
            >
              <span className="text-neutral-300 font-medium">{sc.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[11px] border border-white/10">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
