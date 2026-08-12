import React, { useState, useEffect } from 'react';
import { X, Crown, ShieldCheck, User, Calendar, Clock, PlusCircle, Trash2, Sparkles, RefreshCw, LogOut, Flame, XCircle, CheckCircle2, AlertTriangle, Edit3, Save } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { updateUserSubscriptionInFirestore, initFirebaseService, signOut } from '../services/firebase';

export const SubscriptionModal: React.FC = () => {
  const { activeDrawer, setActiveDrawer, showToast, userProfile, setUserProfile, subscriptionRequests, updateProfileName } = usePlayer();

  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>('');

  useEffect(() => {
    if (userProfile?.displayName) {
      setEditedName(userProfile.displayName);
    }
  }, [userProfile?.displayName]);

  const myRequest = userProfile ? subscriptionRequests.find(r => r.userId === userProfile.uid || r.userEmail === userProfile.email) : undefined;

  const isPaused = userProfile?.status === 'paused';
  const isSubscribed = userProfile ? (userProfile.isSubscribed && !isPaused) : false;
  const planDisplayName = isPaused 
    ? 'Subscription Paused (Restricted Access)' 
    : userProfile?.subscriptionPlan || (myRequest?.status === 'approved' && !isPaused ? myRequest.planName : (isSubscribed ? 'Premium Monthly' : 'You do not have any subscription'));

  // Live timer tick for subscription expiry countdown
  useEffect(() => {
    if (!isSubscribed || isPaused) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const expiryTime = userProfile?.subscriptionExpiresAt 
        ? new Date(userProfile.subscriptionExpiresAt).getTime() 
        : Date.now() + (myRequest?.durationDays || 30) * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const diff = expiryTime - now;

      if (diff <= 0) {
        setTimeLeft(null);
        // Automatically downgrade locally if expired
        setUserProfile(prev => prev ? { ...prev, isSubscribed: false, subscriptionPlan: 'Free Tier' } : null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [isSubscribed, userProfile?.subscriptionExpiresAt, myRequest?.durationDays]);

  if (activeDrawer !== 'subscription') return null;

  const handleSignOut = async () => {
    try {
      const { auth } = initFirebaseService();
      if (auth) {
        const { signOut } = await import('../services/firebase');
        await signOut(auth);
      }
    } catch (e) {
      console.warn('Sign out:', e);
    } finally {
      setUserProfile(null);
      showToast('Signed out successfully.');
      setActiveDrawer(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-neutral-950/90 border border-white/20 rounded-2xl shadow-2xl shadow-black overflow-hidden text-white flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base">User Profile & Subscription</h2>
          </div>
          <button
            onClick={() => setActiveDrawer(null)}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {!userProfile ? (
            <div className="p-6 text-center space-y-4 bg-neutral-900/60 rounded-2xl border border-white/10">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
                <Crown className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Sign In Required</h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  Subscription status and plan details are hidden when you are not logged in. Please sign in to view or manage your subscription.
                </p>
              </div>
              <button
                onClick={() => setActiveDrawer('auth')}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs inline-flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
              >
                <Flame className="w-4 h-4 fill-current" />
                Sign In / Create Account
              </button>
            </div>
          ) : (
            <>
              {/* User Info Card */}
              <div className="p-4 rounded-xl bg-neutral-900 border border-white/5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-lg shrink-0">
                      {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-white truncate">
                          {userProfile?.displayName || 'Music Enthusiast'}
                        </h3>
                        <button
                          onClick={() => setIsEditingName(!isEditingName)}
                          className="p-1 rounded text-neutral-400 hover:text-amber-300 transition-colors"
                          title="Edit Display Name"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {userProfile?.email || 'Logged in via Sur Music'}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5 truncate">
                        UID: {userProfile?.uid}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/30 text-rose-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                    title="Sign Out of Account"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>

                {/* Edit Display Name Input Inline */}
                {isEditingName && (
                  <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={e => setEditedName(e.target.value)}
                      placeholder="Enter new display name..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-800 border border-amber-500/40 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={async () => {
                        if (editedName.trim()) {
                          await updateProfileName(editedName.trim());
                          setIsEditingName(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save
                    </button>
                  </div>
                )}
              </div>

          {/* Current Subscription Status */}
          <div className={`p-4 rounded-xl border transition-all ${
            isPaused
              ? 'bg-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-500/10'
              : isSubscribed 
              ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/10' 
              : 'bg-neutral-900 border-white/10'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Current Plan</span>
              {isPaused ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-black flex items-center gap-1">
                  ⏸️ PAUSED BY ADMIN
                </span>
              ) : isSubscribed ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-black flex items-center gap-1">
                  <Crown className="w-3 h-3 fill-current" /> Sur Premi PRO
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-800 text-neutral-400">
                  You do not have any subscription
                </span>
              )}
            </div>

            <h4 className="text-lg font-bold text-white">
              {planDisplayName}
            </h4>

            {/* Paused Subscription Alert Banner */}
            {isPaused && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2 font-medium">
                <XCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Your subscription is currently <strong>PAUSED</strong> by Administrator. All PRO features are disabled.</span>
              </div>
            )}

            {/* Approved Request Success Banner */}
            {myRequest && myRequest.status === 'approved' && !isPaused && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Subscription request approved &amp; activated by Administrator!</span>
              </div>
            )}

            {/* Duration Live Countdown Timer or Lifetime Badge */}
            {isSubscribed && (userProfile?.subscriptionPlan?.toLowerCase().includes('permanent') || userProfile?.subscriptionPlan?.toLowerCase().includes('lifetime') || (timeLeft && timeLeft.days > 3000)) ? (
              <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2 font-bold">
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                    <div>
                      <div className="text-white text-sm font-extrabold">Permanent VIP Access</div>
                      <div className="text-[10px] text-amber-300 font-normal">Lifetime Subscription Active</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-400 text-black font-mono uppercase shadow-md shadow-amber-500/20">
                    PERMANENT
                  </span>
                </div>
              </div>
            ) : isSubscribed && timeLeft ? (
              <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="flex items-center gap-1 text-amber-400 font-medium">
                    <Clock className="w-3.5 h-3.5" /> Subscription Duration Remaining:
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center pt-1">
                  <div className="bg-neutral-900 p-2 rounded-lg border border-white/5">
                    <span className="block text-lg font-extrabold text-amber-400">{timeLeft.days}</span>
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">Days</span>
                  </div>
                  <div className="bg-neutral-900 p-2 rounded-lg border border-white/5">
                    <span className="block text-lg font-extrabold text-amber-400">{timeLeft.hours}</span>
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">Hours</span>
                  </div>
                  <div className="bg-neutral-900 p-2 rounded-lg border border-white/5">
                    <span className="block text-lg font-extrabold text-amber-400">{timeLeft.minutes}</span>
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">Mins</span>
                  </div>
                  <div className="bg-neutral-900 p-2 rounded-lg border border-white/5">
                    <span className="block text-lg font-extrabold text-amber-400">{timeLeft.seconds}</span>
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">Secs</span>
                  </div>
                </div>

                {userProfile?.subscriptionExpiresAt && (
                  <p className="text-[11px] text-neutral-400 text-right mt-1">
                    Expires on: {new Date(userProfile.subscriptionExpiresAt).toLocaleDateString()} at {new Date(userProfile.subscriptionExpiresAt).toLocaleTimeString()}
                  </p>
                )}

                {/* Pro Expiring Warning Notice Box */}
                {timeLeft && (timeLeft.days < 3 || (timeLeft.days === 3 && timeLeft.hours === 0)) && (
                  <div className="mt-3 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" /> Subscription Expiring Soon
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/30 text-amber-200 font-mono uppercase font-bold border border-amber-500/40">
                        {timeLeft.days}d {timeLeft.hours}h left
                      </span>
                    </div>
                    <p className="text-neutral-300 text-[11px]">
                      Your Pro subscription is set to expire in <strong>{timeLeft.days > 0 ? `${timeLeft.days} days and ${timeLeft.hours} hours` : `${timeLeft.hours} hours`}</strong>. Submit a renewal request to avoid losing uninterrupted access to equalizer, lyrics, and Spotify import.
                    </p>
                    <button
                      onClick={() => setActiveDrawer('payment')}
                      className="w-full py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs transition-transform hover:scale-[1.01] flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Re-apply / Extend Pro Subscription
                    </button>
                  </div>
                )}
              </div>
            ) : !isSubscribed ? (
              <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                {/* Pending Request Status Banner */}
                {myRequest && myRequest.status === 'pending' && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <Clock className="w-4 h-4 animate-spin" /> Subscription Request Pending Review
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono uppercase font-bold">
                        PENDING
                      </span>
                    </div>
                    <p className="text-neutral-300 text-[11px]">
                      Your request for <strong className="text-white">{myRequest.planName}</strong> ({myRequest.amount}) submitted on {new Date(myRequest.createdAt).toLocaleDateString()} is waiting for account administrator approval.
                    </p>
                    <p className="text-[10px] text-amber-400/80 italic">
                      PRO features will activate automatically once approved by the administrator.
                    </p>
                  </div>
                )}

                {/* Declined Request Status Banner */}
                {myRequest && myRequest.status === 'rejected' && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 text-rose-400">
                        <XCircle className="w-4 h-4" /> Subscription Request Declined
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-mono uppercase font-bold">
                        DECLINED
                      </span>
                    </div>
                    <p className="text-neutral-300 text-[11px]">
                      Your request for <strong className="text-white">{myRequest.planName}</strong> was reviewed and declined by the administrator.
                    </p>
                    <p className="text-[10px] text-rose-300/80">
                      You remain on the Free Tier. You can submit a new upgrade request below.
                    </p>
                  </div>
                )}

                {/* Premium Features & Benefits Section */}
                <div className="mt-4 p-4 rounded-xl bg-neutral-900 border border-white/5 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h4 className="text-sm font-bold text-white">Why Upgrade to Sur Premi PRO?</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-amber-300 uppercase">PRO Features</h5>
                      <ul className="space-y-1.5 text-xs text-neutral-300">
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Advanced Music Search</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Spotify Playlist Import</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Custom YouTube/MP3 Links</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Synchronized Lyrics</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Pro Audio Equalizer</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-neutral-400 uppercase">Free Plan Limitations</h5>
                      <ul className="space-y-1.5 text-xs text-neutral-500">
                        <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-rose-400/70" /> Default Playlist Only</li>
                        <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-rose-400/70" /> No Custom Songs</li>
                        <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-rose-400/70" /> No Spotify Import</li>
                        <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-rose-400/70" /> No Search Feature</li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-neutral-400">Unlock your full music experience today.</p>
                    </div>
                    <button
                      onClick={() => setActiveDrawer('payment')}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs transition-transform hover:scale-105 shadow-lg shadow-amber-500/20"
                    >
                      {myRequest?.status === 'pending' ? 'Change Request' : 'Upgrade to PRO'}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
