import React, { useState } from 'react';
import { X, Music2, Sparkles, Loader2, ArrowRight, CheckCircle2, Link2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

interface SpotifyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (playlistId: string) => void;
}

export const SpotifyImportModal: React.FC<SpotifyImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { importSpotifyPlaylist, playPlaylist } = usePlayer();
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotifyUrl.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const imported = await importSpotifyPlaylist(spotifyUrl.trim());
    setIsSubmitting(false);

    if (imported) {
      setSpotifyUrl('');
      onClose();
      if (onSuccess) {
        onSuccess(imported.id);
      } else {
        playPlaylist(imported);
      }
    } else {
      setErrorMsg('Could not import Spotify playlist. Please check the URL or ID format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all">
      <div className="w-full max-w-md bg-neutral-950/85 backdrop-blur-2xl border border-emerald-500/40 backdrop-saturate-150 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950/80 via-neutral-900 to-neutral-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Music2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                Spotify Auto-Importer
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Instant
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">Auto-create a Nova playlist from Spotify</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-emerald-400" />
              Spotify Playlist Link or ID
            </label>
            <input
              type="text"
              placeholder="e.g. https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all font-mono"
              required
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !spotifyUrl.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Fetching Tracks...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Auto-Create Playlist</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
