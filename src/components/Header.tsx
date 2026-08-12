import React from 'react';
import { Search, ListMusic, Music2, HelpCircle, Link, Moon, Disc3, RotateCcw, Crown, Flame, ShieldCheck, Bell, AlertTriangle, RefreshCw } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const Header: React.FC = () => {
  const {
    activeDrawer,
    setActiveDrawer,
    queue,
    currentTrack,
    isPlaying,
    userProfile,
    hasPermission,
    unreadRequestCount,
    subscriptionRequests
  } = usePlayer();

  const handleClearCache = async () => {
    if (window.confirm("Are you sure you want to clear browser cache and reset application data?")) {
      try {
        // Clear Local & Session Storage
        localStorage.clear();
        sessionStorage.clear();

        // Clear CacheStorage API if available
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }

        // Clear IndexedDB databases if supported
        if ('indexedDB' in window && indexedDB.databases) {
          const dbs = await indexedDB.databases();
          dbs.forEach(db => {
            if (db.name) indexedDB.deleteDatabase(db.name);
          });
        }
      } catch (e) {
        console.error('Error clearing cache:', e);
      } finally {
        window.location.reload();
      }
    }
  };

  // Compute Pro Subscription Expiration State (Warning when <= 3 days)
  const now = Date.now();
  const expiresAtMs = userProfile?.subscriptionExpiresAt ? new Date(userProfile.subscriptionExpiresAt).getTime() : null;
  const diffMs = expiresAtMs ? expiresAtMs - now : null;
  const daysRemaining = diffMs !== null ? diffMs / (1000 * 60 * 60 * 24) : null;
  const isExpiringSoon = !!(
    userProfile?.isSubscribed && 
    userProfile.status !== 'paused' && 
    daysRemaining !== null && 
    daysRemaining > 0 && 
    daysRemaining <= 3
  );

  const daysInt = daysRemaining !== null ? Math.floor(daysRemaining) : 0;
  const hoursInt = daysRemaining !== null ? Math.floor((daysRemaining * 24) % 24) : 0;
  const timeString = daysInt > 0 ? `${daysInt}d ${hoursInt}h` : `${Math.max(1, hoursInt)}h`;

  return (
    <div className="sticky top-0 z-30 w-full">
      {/* Expiration Warning Banner (Displayed when Pro subscription expires within 3 days) */}
      {isExpiringSoon && (
        <div className="w-full bg-gradient-to-r from-amber-950 via-rose-950 to-amber-950 border-b border-amber-500/50 px-3 sm:px-6 py-2 text-xs text-amber-200 flex items-center justify-between shadow-lg backdrop-blur-md z-40">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce shrink-0" />
            <span className="text-[11px] sm:text-xs">
              <strong className="text-amber-300">Warning:</strong> Your Pro subscription expires in <strong className="text-white font-bold bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">{timeString}</strong> ({expiresAtMs ? new Date(expiresAtMs).toLocaleDateString() : ''}). Re-apply now to ensure continuous access!
            </span>
          </div>
          <button
            onClick={() => setActiveDrawer('payment')}
            className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[11px] transition-all hover:scale-105 flex items-center gap-1.5 shrink-0 shadow-md shadow-amber-500/20"
            title="Submit subscription renewal / re-apply request"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-apply Now
          </button>
        </div>
      )}

      <header className="w-full bg-black/60 backdrop-blur-2xl border-b border-white/10 backdrop-saturate-150 shadow-lg shadow-black/40 px-3 sm:px-6 md:px-8 py-2.5 sm:py-3.5 flex items-center justify-between text-neutral-300 gap-2">
        {/* Left: Sur Music Identity & Live Indicator */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <div className="relative flex items-center justify-center bg-indigo-500/20 p-1.5 sm:p-2 rounded-xl text-indigo-400">
          <Disc3 className={`w-5 h-5 sm:w-6 sm:h-6 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-semibold tracking-wider text-xs sm:text-sm text-white uppercase font-mono">NOVA</span>
            <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-widest px-1 sm:px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 border border-white/10">
              MUSIC
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate max-w-[120px] sm:max-w-xs font-light">
            {currentTrack ? `${currentTrack.genre || 'Lounge'} • ${currentTrack.artist}` : 'Minimal Music Player'}
          </p>
        </div>
      </div>

      {/* Center/Right: Action Buttons */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Admin Management & Subscription Request Notification Button (Only rendered for users with admin access) */}
          {userProfile?.isAdmin && (
            <button
              onClick={() => setActiveDrawer('admin')}
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                unreadRequestCount > 0
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 shadow-md shadow-amber-500/10'
                  : activeDrawer === 'admin'
                  ? 'bg-white/15 text-white border-white/30'
                  : 'bg-neutral-900 text-neutral-300 border-white/10 hover:text-white hover:bg-neutral-800'
              }`}
              title="Admin Management & Subscription Requests"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline text-[11px]">Admin</span>
              
              {/* Notification Badge counter / pulse dot */}
              {unreadRequestCount > 0 ? (
                <span className="flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[10px] font-bold bg-amber-500 text-black animate-pulse">
                  {unreadRequestCount}
                </span>
              ) : subscriptionRequests.length > 0 ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              ) : null}
            </button>
          )}

          {/* Subscription Status & Profile Button (Only visible when logged in) */}
          {userProfile && (
            <button
              onClick={() => setActiveDrawer('subscription')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border relative group ${
                userProfile.status === 'paused'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 shadow-sm shadow-amber-500/10'
                  : userProfile.isSubscribed
                  ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-600/20 text-amber-300 border-amber-500/40 hover:border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                  : 'bg-neutral-900/90 text-neutral-400 border-white/10 hover:text-neutral-200 hover:bg-neutral-800/90 hover:border-white/20'
              }`}
              title="Subscription Status (Real-time Firestore sync)"
            >
              {/* Real-time sync indicator dot */}
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  userProfile.status === 'paused'
                    ? 'bg-amber-400'
                    : userProfile.isSubscribed
                    ? 'bg-amber-400'
                    : 'bg-neutral-500'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  userProfile.status === 'paused'
                    ? 'bg-amber-500'
                    : userProfile.isSubscribed
                    ? 'bg-amber-400'
                    : 'bg-neutral-400'
                }`}></span>
              </span>

              <Crown className={`w-3.5 h-3.5 ${
                userProfile.status === 'paused'
                  ? 'text-amber-400'
                  : userProfile.isSubscribed
                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                  : 'text-neutral-500'
              }`} />

              <div className="flex items-center gap-1.5">
                <span className="hidden md:inline font-medium">
                  {userProfile.status === 'paused'
                    ? 'Paused'
                    : userProfile.isSubscribed
                    ? 'PRO Subscriber'
                    : 'Free Plan'}
                </span>
                
                <span className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                  userProfile.status === 'paused'
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                    : userProfile.isSubscribed
                    ? 'bg-amber-400 text-black font-extrabold shadow-sm'
                    : 'bg-white/10 text-neutral-300 border border-white/10 font-mono'
                }`}>
                  {userProfile.status === 'paused' ? 'PAUSED' : userProfile.isSubscribed ? 'PRO' : 'FREE'}
                </span>
              </div>
            </button>
          )}

          {/* Account / Auth Button */}
          <button
            onClick={() => setActiveDrawer('auth')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border bg-neutral-900/80 text-amber-400 border-amber-500/20 hover:bg-amber-950/40 hover:border-amber-500/40"
            title="Account & Authentication"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden lg:inline text-[11px]">{userProfile ? (userProfile.displayName || 'Account') : 'Sign In'}</span>
            {userProfile && (
              <span className={`hidden sm:inline-block text-[8px] font-mono uppercase font-bold px-1.5 py-0.2 rounded border ${
                userProfile.status === 'paused'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : userProfile.isSubscribed
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                  : 'bg-white/5 text-neutral-400 border-white/10'
              }`}>
                {userProfile.status === 'paused' ? 'PAUSED' : userProfile.isSubscribed ? 'PRO' : 'FREE'}
              </span>
            )}
          </button>

          {/* Search button (visible if user has search catalog permission) */}
          {hasPermission('canSearchCatalog') && (
            <button
              onClick={() => setActiveDrawer('search')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                activeDrawer === 'search'
                  ? 'bg-white/15 text-white border-white/30'
                  : 'bg-neutral-900/80 text-neutral-300 border-white/5 hover:bg-neutral-800 hover:text-white hover:border-white/20'
              }`}
              title="Search catalog (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden lg:inline-block text-[10px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Playlists & Library button */}
          <button
            onClick={() => setActiveDrawer('playlists')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
              activeDrawer === 'playlists' || activeDrawer === 'library'
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-neutral-900/80 text-neutral-300 border-white/5 hover:bg-neutral-800 hover:text-white hover:border-white/20'
            }`}
            title="Playlists & Library"
          >
            <ListMusic className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Playlists</span>
          </button>

          {/* Queue button */}
          <button
            onClick={() => setActiveDrawer('queue')}
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
              activeDrawer === 'queue'
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-neutral-900/80 text-neutral-300 border-white/5 hover:bg-neutral-800 hover:text-white hover:border-white/20'
            }`}
            title="Playback Queue"
          >
            <Music2 className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Queue</span>
            {queue.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono rounded-full bg-white/15 text-white">
                {queue.length}
              </span>
            )}
          </button>

          {/* Sleep Timer button */}
          <button
            onClick={() => setActiveDrawer('sleep')}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
              activeDrawer === 'sleep'
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-neutral-900/80 text-neutral-400 border-white/5 hover:bg-neutral-800 hover:text-white'
            }`}
            title="Suspend / Sleep Timer"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>

          {/* Keyboard Shortcuts trigger */}
          <button
            onClick={() => setActiveDrawer('shortcuts')}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
              activeDrawer === 'shortcuts'
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-neutral-900/80 text-neutral-400 border-white/5 hover:bg-neutral-800 hover:text-white'
            }`}
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {/* Clear Browser Cache & Reset button */}
          <button
            onClick={handleClearCache}
            className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border bg-neutral-900/80 text-amber-400 border-amber-500/20 hover:bg-amber-950/40 hover:text-amber-300 hover:border-amber-500/40"
            title="Clear Browser Cache & Reset App Data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Clear Cache</span>
          </button>
        </div>
      </header>
    </div>
  );
};

