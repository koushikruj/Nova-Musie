import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { Track, Playlist, RepeatMode, DrawerType, UserProfile, SubscriptionRequest, UserPermissions, BanRecord } from '../types';
import { DEFAULT_TRACKS, DEFAULT_PLAYLISTS } from '../data/defaultTracks';
import { 
  initFirebaseService, 
  onAuthStateChanged, 
  fetchOrCreateUserProfile, 
  updateUserSubscriptionInFirestore,
  updateUserPermissionsInFirestore,
  saveSubscriptionRequestToFirestore,
  updateSubscriptionRequestStatusInFirestore,
  subscribeToUserProfileSnapshot,
  subscribeToSubscriptionRequestsSnapshot,
  subscribeToBannedListSnapshot,
  banUserInFirestore,
  unbanUserInFirestore,
  updateUserProfileNameAndPhoto
} from '../services/firebase';
import { getHardwareId, getPublicIpAddress } from '../utils/deviceInfo';

// Client-side full-length track resolver for static deployments (Netlify, GitHub Pages, etc.)
async function resolveFullTrackClientSide(title: string, artist: string): Promise<{ audioUrl: string; duration: number } | null> {
  const cleanTitle = (title || 'Song').trim();
  const cleanArtist = (artist || '').trim();
  const query = encodeURIComponent(`${cleanTitle} ${cleanArtist}`.trim());

  const endpoints = [
    `https://invidious.flokinet.to/api/v1/search?q=${query}&type=video`,
    `https://invidious.nerdvpn.de/api/v1/search?q=${query}&type=video`,
    `https://iv.melmac.space/api/v1/search?q=${query}&type=video`,
    `https://invidious.projectsegfau.lt/api/v1/search?q=${query}&type=video`,
    `https://pipedapi.kavin.rocks/search?q=${query}&filter=all`
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].videoId) {
          return {
            audioUrl: `youtube:${data[0].videoId}`,
            duration: Number(data[0].lengthSeconds) || 210
          };
        }
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          const first = data.items.find((item: any) => item.type === 'stream' || item.url);
          if (first && first.url) {
            const match = first.url.match(/v=([a-zA-Z0-9_-]{11})/);
            if (match && match[1]) {
              return {
                audioUrl: `youtube:${match[1]}`,
                duration: Number(first.duration) || 210
              };
            }
          }
        }
      }
    } catch (e) {
      // Continue to next endpoint on timeout
    }
  }

  return null;
}

interface PlayerContextType {
  // Player state
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  queue: Track[];
  queueIndex: number;
  isLoading: boolean;
  isBuffering: boolean;
  error: string | null;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;

  // Library & Playlists state
  tracks: Track[];
  playlists: Playlist[];
  favorites: string[];
  recentlyPlayed: Track[];

  // User & Subscription state
  userProfile: UserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  checkFeatureAccess: (featureName?: string) => boolean;
  hasPermission: (permission: 'canSearchCatalog' | 'canAddContent' | 'canImportSpotify' | 'canAccessLyrics' | 'canAccessEqualizer') => boolean;

  // Subscription Requests & Admin Management
  subscriptionRequests: SubscriptionRequest[];
  unreadRequestCount: number;
  createSubscriptionRequest: (data: {
    userId: string;
    userName: string;
    userEmail: string;
    planName: string;
    amount: string;
    durationDays: number;
    paymentMethod: string;
  }) => void;
  approveSubscriptionRequest: (requestId: string) => Promise<void>;
  rejectSubscriptionRequest: (requestId: string) => void;
  updateUserPermissions: (permissions: Partial<UserPermissions>) => void;

  // Enhanced Sleep Timer state
  sleepTimerSeconds: number | null;
  setSleepTimerSeconds: React.Dispatch<React.SetStateAction<number | null>>;

  // UI state
  activeDrawer: DrawerType;
  setActiveDrawer: (drawer: DrawerType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toastMessage: string | null;
  showToast: (message: string) => void;

  // Device & Ban Enforcement State
  currentIp: string;
  currentHwid: string;
  bannedIps: string[];
  bannedHwids: string[];
  banRecords: BanRecord[];
  isCurrentSessionBanned: boolean;
  banUser: (targetUid: string, targetIp: string | null, targetHwid: string | null, banIp: boolean, banHwid: boolean, reason?: string) => Promise<void>;
  unbanUser: (targetUid: string, targetIp: string | null, targetHwid: string | null) => Promise<void>;

  // User Profile Editing
  updateProfileName: (displayName: string, photoURL?: string) => Promise<void>;

  // Actions
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  playTrack: (track: Track, customQueue?: Track[]) => void;
  playPlaylist: (playlist: Playlist, startTrackId?: string) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  toggleFavorite: (trackOrId: string | Track) => void;
  createPlaylist: (name: string, desc?: string) => Playlist;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  reorderPlaylistTracks: (playlistId: string, fromIndex: number, toIndex: number) => void;
  addCustomTrackToPlaylist: (playlistId: string, track: Partial<Track>) => void;
  deletePlaylist: (playlistId: string) => void;
  updatePlaylist: (playlistId: string, updates: Partial<Playlist>) => void;
  importSpotifyPlaylist: (spotifyUrl: string) => Promise<Playlist | null>;
  addCustomTrack: (track: Partial<Track>) => void;
}


const STORAGE_KEYS = {
  TRACKS: 'nova_tracks_v3',
  PLAYLISTS: 'nova_playlists_v3',
  FAVORITES: 'nova_favorites_v3',
  STATE: 'nova_player_state_v3',
  RECENTLY_PLAYED: 'nova_recently_played_v3',
  SUBSCRIPTION_REQUESTS: 'nova_subscription_requests_v1'
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Audio element reference
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Playback speed state
  const [playbackRate, setPlaybackRateState] = useState<number>(1);

  // Tracks & Library state
  const [tracks, setTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRACKS);
      if (saved) return JSON.parse(saved);
      return DEFAULT_TRACKS;
    } catch {
      return DEFAULT_TRACKS;
    }
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      return saved ? JSON.parse(saved) : DEFAULT_PLAYLISTS;
    } catch {
      return DEFAULT_PLAYLISTS;
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return [DEFAULT_TRACKS[0].id, DEFAULT_TRACKS[1].id];
    } catch {
      return [DEFAULT_TRACKS[0].id, DEFAULT_TRACKS[1].id];
    }
  });

  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECENTLY_PLAYED);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Player state
  const savedState = (() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STATE);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();
  
  const initialCurrentTrack = savedState?.currentTrack || DEFAULT_TRACKS[0];
  const initialQueue = savedState?.queue && savedState.queue.length > 0 ? savedState.queue : DEFAULT_TRACKS;
  const initialQueueIndex = savedState?.queueIndex !== undefined ? savedState.queueIndex : 0;
  
  const [currentTrack, setCurrentTrack] = useState<Track | null>(initialCurrentTrack);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(initialCurrentTrack?.duration || 0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [shuffle, setShuffle] = useState<boolean>(savedState?.shuffle || false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(savedState?.repeatMode || 'off');
  const [queue, setQueue] = useState<Track[]>(initialQueue);
  const [queueIndex, setQueueIndex] = useState<number>(initialQueueIndex);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const firstTrackIsYoutube = initialCurrentTrack?.audioUrl?.startsWith('youtube:');
  const [isYoutube, setIsYoutube] = useState<boolean>(firstTrackIsYoutube);
  const [youtubeId, setYoutubeId] = useState<string | null>(firstTrackIsYoutube ? initialCurrentTrack.audioUrl.replace('youtube:', '') : null);

  // User & Subscription state - strictly null when not logged in
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Enhanced Sleep Timer State (in seconds)
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number | null>(null);

  // UI state
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const ytPlayerRef = useRef<YouTubePlayer | null>(null);
  const ytTimeIntervalRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Device & Ban Enforcement State
  const [currentIp, setCurrentIp] = useState<string>('127.0.0.1');
  const currentHwid = useMemo(() => getHardwareId(), []);
  const [bannedIps, setBannedIps] = useState<string[]>([]);
  const [bannedHwids, setBannedHwids] = useState<string[]>([]);
  const [banRecords, setBanRecords] = useState<BanRecord[]>([]);

  // Fetch Public IP on mount
  useEffect(() => {
    getPublicIpAddress().then(ip => {
      if (ip) setCurrentIp(ip);
    });
  }, []);

  // Listen to global banned identifiers snapshot in Firestore
  useEffect(() => {
    const unsubscribe = subscribeToBannedListSnapshot((ips, hwids, records) => {
      setBannedIps(ips);
      setBannedHwids(hwids);
      setBanRecords(records);
    });
    return () => unsubscribe();
  }, []);

  // Real-time calculation of session ban status
  const isCurrentSessionBanned = useMemo(() => {
    if (userProfile?.isBanned) return true;
    if (currentIp && bannedIps.includes(currentIp)) return true;
    if (currentHwid && bannedHwids.includes(currentHwid)) return true;
    return false;
  }, [userProfile?.isBanned, currentIp, bannedIps, currentHwid, bannedHwids]);

  // Pause playback immediately if session becomes banned
  useEffect(() => {
    if (isCurrentSessionBanned && isPlaying) {
      pause();
    }
  }, [isCurrentSessionBanned, isPlaying]);

  const banUser = async (
    targetUid: string, 
    targetIp: string | null, 
    targetHwid: string | null, 
    banIp: boolean, 
    banHwid: boolean, 
    reason?: string
  ) => {
    await banUserInFirestore(targetUid, targetIp, targetHwid, banIp, banHwid, userProfile?.uid || 'admin', reason);
    showToast(`🚫 Ban applied to ${banIp ? 'IP' : ''} ${banHwid ? 'HWID' : ''}`);
  };

  const unbanUser = async (targetUid: string, targetIp: string | null, targetHwid: string | null) => {
    await unbanUserInFirestore(targetUid, targetIp, targetHwid);
    showToast('✅ User unbanned');
  };

  const updateProfileName = async (displayName: string, photoURL?: string) => {
    if (!userProfile?.uid) return;
    await updateUserProfileNameAndPhoto(userProfile.uid, displayName, photoURL);
    setUserProfile(prev => prev ? ({ ...prev, displayName, photoURL: photoURL || prev.photoURL }) : null);
    showToast(`Updated display name to "${displayName}"`);
  };

  // Subscription Requests & Admin Management State
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);

  // Gate Feature Access for Free vs Subscribed Users
  const checkFeatureAccess = useCallback((featureName: string = 'this feature'): boolean => {
    if (userProfile?.isSubscribed && userProfile.status !== 'paused') {
      return true;
    }
    if (userProfile?.status === 'paused') {
      showToast('⏸️ Your subscription is currently paused.');
      setActiveDrawer('subscription');
      return false;
    }
    // Free user attempted a PRO feature
    showToast(`🔒 Subscribe to Nova Premium to access ${featureName}`);
    setActiveDrawer('subscription');
    return false;
  }, [userProfile?.isSubscribed, userProfile?.status, showToast]);

  const hasPermission = useCallback((permission: 'canSearchCatalog' | 'canAddContent' | 'canImportSpotify' | 'canAccessLyrics' | 'canAccessEqualizer'): boolean => {
    if (!userProfile) return false;

    // RULE 1: If subscription is paused by admin, ALL features are completely blocked
    if (userProfile.status === 'paused') {
      return false;
    }

    // RULE 2: Explicit permission override in userProfile.permissions
    if (userProfile.permissions && typeof userProfile.permissions[permission] === 'boolean') {
      return userProfile.permissions[permission]!;
    }

    // RULE 3: Active PRO Subscribers have access to all features
    if (userProfile.isSubscribed) {
      return true;
    }

    // RULE 4: Free users only have access to catalog search (unless restricted)
    if (permission === 'canSearchCatalog') return true;

    return false;
  }, [userProfile]);

  // Sync User Profile to localStorage
  useEffect(() => {
    try {
      if (userProfile) {
        localStorage.setItem('nova_user_profile', JSON.stringify(userProfile));
      } else {
        localStorage.removeItem('nova_user_profile');
        localStorage.removeItem('saloon_user_profile');
      }
    } catch (e) {
      console.error('Failed saving user profile', e);
    }
  }, [userProfile]);

  // Firebase Auth Observer
  useEffect(() => {
    const { auth } = initFirebaseService();
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await fetchOrCreateUserProfile(user);
        setUserProfile(profile);
      } else {
        // Clear all user profile state and cached local storage on logout/unauthenticated
        setUserProfile(null);
        setSubscriptionRequests([]);
        try {
          localStorage.removeItem('nova_user_profile');
          localStorage.removeItem('saloon_user_profile');
          localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION_REQUESTS);
        } catch (e) {
          console.error('Failed clearing profile on logout', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore Listener for User Profile & Subscription Status
  useEffect(() => {
    if (!userProfile?.uid) return;

    const unsubscribe = subscribeToUserProfileSnapshot(userProfile.uid, (data) => {
      if (!data) return;

      let isSubscribed = data.isSubscribed ?? false;
      if (isSubscribed && data.subscriptionExpiresAt) {
        const expires = new Date(data.subscriptionExpiresAt).getTime();
        if (Date.now() > expires) {
          isSubscribed = false;
        }
      }

      const updatedStatus = data.status || (isSubscribed ? 'active' : 'free');
      const effectiveSubscribed = isSubscribed && updatedStatus !== 'paused';
      const updatedPlan = effectiveSubscribed ? (data.subscriptionPlan || 'Premium Monthly') : 'Free Tier';
      const updatedExpiresAt = data.subscriptionExpiresAt || null;

      setUserProfile(prev => {
        const becameSubscribed = (!prev?.isSubscribed) && effectiveSubscribed;
        const becamePaused = prev?.status !== 'paused' && updatedStatus === 'paused';
        const becameRevoked = (prev?.isSubscribed || prev?.status === 'paused') && !effectiveSubscribed && updatedStatus === 'free';

        // Check if profile changed
        if (
          prev?.isSubscribed !== effectiveSubscribed ||
          prev?.status !== updatedStatus ||
          prev?.subscriptionPlan !== updatedPlan ||
          prev?.subscriptionExpiresAt !== updatedExpiresAt ||
          JSON.stringify(prev?.permissions) !== JSON.stringify(data.permissions)
        ) {
          if (becameSubscribed) {
            showToast('🎉 Real-time Update: Pro Subscription Approved & Activated!');
          } else if (becamePaused) {
            showToast('⏸️ Real-time Update: Your subscription has been PAUSED by Admin. Feature access disabled.');
          } else if (becameRevoked) {
            showToast('❌ Real-time Update: Your subscription has been REVOKED/RESTRICTED.');
          }

          const updatedProfile: UserProfile = {
            ...(prev || {
              uid: userProfile.uid,
              email: data.email || null,
              displayName: data.displayName || 'Music Fan',
              photoURL: null
            }),
            isSubscribed: effectiveSubscribed,
            subscriptionPlan: updatedPlan,
            subscribedAt: data.subscribedAt || prev?.subscribedAt,
            subscriptionExpiresAt: updatedExpiresAt,
            status: updatedStatus,
            isAdmin: data.isAdmin ?? prev?.isAdmin ?? (data.email === 'sko134329@gmail.com'),
            permissions: data.permissions || (
              updatedStatus === 'paused' ? {
                canSearchCatalog: false,
                canAddContent: false,
                canImportSpotify: false,
                canAccessLyrics: false,
                canAccessEqualizer: false
              } : {
                canSearchCatalog: true,
                canAddContent: effectiveSubscribed,
                canImportSpotify: effectiveSubscribed,
                canAccessLyrics: effectiveSubscribed,
                canAccessEqualizer: effectiveSubscribed
              }
            )
          };

          try {
            localStorage.setItem('nova_user_profile', JSON.stringify(updatedProfile));
          } catch (e) {
            console.error('Failed to sync profile to localStorage', e);
          }

          return updatedProfile;
        }
        return prev;
      });
    });

    return () => unsubscribe();
  }, [userProfile?.uid, showToast]);

  // Real-time Firestore Listener for Subscription Requests (only for logged-in users)
  useEffect(() => {
    if (!userProfile?.uid) {
      setSubscriptionRequests([]);
      return;
    }

    const unsubscribe = subscribeToSubscriptionRequestsSnapshot((requests) => {
      if (requests && requests.length > 0) {
        setSubscriptionRequests(requests);
        try {
          localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_REQUESTS, JSON.stringify(requests));
        } catch (e) {
          console.error('Failed to sync subscription requests', e);
        }
      }
    });

    return () => unsubscribe();
  }, [userProfile?.uid]);

  // Sleep Timer Seconds Ticker
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (sleepTimerSeconds !== null && sleepTimerSeconds > 0) {
      interval = setInterval(() => {
        setSleepTimerSeconds((prev) => (prev && prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sleepTimerSeconds]);

  const createSubscriptionRequest = useCallback((data: {
    userId: string;
    userName: string;
    userEmail: string;
    planName: string;
    amount: string;
    durationDays: number;
    paymentMethod: string;
  }) => {
    const newReq: SubscriptionRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      planName: data.planName,
      amount: data.amount,
      durationDays: data.durationDays,
      paymentMethod: data.paymentMethod,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    setSubscriptionRequests(prev => {
      const updated = [newReq, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_REQUESTS, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save subscription requests', e);
      }
      return updated;
    });

    saveSubscriptionRequestToFirestore(newReq);

    showToast('📩 Subscription request sent to Account Owner!');
  }, [showToast]);

  const approveSubscriptionRequest = useCallback(async (requestId: string) => {
    let targetReq: SubscriptionRequest | undefined;

    setSubscriptionRequests(prev => {
      const updated = prev.map(req => {
        if (req.id === requestId) {
          targetReq = req;
          return { ...req, status: 'approved' as const };
        }
        return req;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_REQUESTS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    updateSubscriptionRequestStatusInFirestore(requestId, 'approved');

    if (targetReq) {
      const req: SubscriptionRequest = targetReq;
      const days = req.durationDays || 30;
      const planName = req.planName || 'Premium VIP Monthly';
      const uid = req.userId || userProfile?.uid || 'guest-uid';

      try {
        const updated = await updateUserSubscriptionInFirestore(uid, true, planName, days);
        const expiry = updated?.subscriptionExpiresAt || new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

        setUserProfile(prev => {
          const baseProfile = prev || {
            uid: uid,
            email: req.userEmail || 'user@example.com',
            displayName: req.userName || 'Music Enthusiast',
            photoURL: null,
            isAdmin: false
          };

          const updatedProfile: UserProfile = {
            ...baseProfile,
            isSubscribed: true,
            subscriptionPlan: planName,
            subscribedAt: new Date().toISOString(),
            subscriptionExpiresAt: expiry,
            permissions: {
              canSearchCatalog: true,
              canAddContent: true,
              canImportSpotify: true,
              canAccessLyrics: true,
              canAccessEqualizer: true
            }
          };

          try {
            localStorage.setItem('nova_user_profile', JSON.stringify(updatedProfile));
          } catch (e) {
            console.error('Failed to save updated profile to localStorage', e);
          }

          return updatedProfile;
        });

        showToast(`✅ Request Approved! Upgraded ${req.userName} to ${planName}.`);
      } catch (err) {
        console.error('Error approving request:', err);
        showToast('Subscription request approved.');
      }
    }
  }, [userProfile?.uid, showToast]);

  const rejectSubscriptionRequest = useCallback((requestId: string) => {
    setSubscriptionRequests(prev => {
      const updated = prev.map(req => {
        if (req.id === requestId) {
          return { ...req, status: 'rejected' as const };
        }
        return req;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_REQUESTS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    updateSubscriptionRequestStatusInFirestore(requestId, 'rejected');

    showToast('❌ Subscription request declined.');
  }, [showToast]);

  const updateUserPermissions = useCallback((newPermissions: Partial<UserPermissions>) => {
    setUserProfile(prev => {
      if (!prev) return null;
      const mergedPermissions = {
        ...(prev.permissions || {
          canSearchCatalog: true,
          canAddContent: prev.isSubscribed,
          canImportSpotify: prev.isSubscribed,
          canAccessLyrics: prev.isSubscribed,
          canAccessEqualizer: prev.isSubscribed
        }),
        ...newPermissions
      };

      if (prev.uid) {
        updateUserPermissionsInFirestore(prev.uid, mergedPermissions);
      }

      return {
        ...prev,
        permissions: mergedPermissions
      };
    });
    showToast('⚙️ User permissions updated!');
  }, [showToast]);

  const unreadRequestCount = useMemo(() => {
    return subscriptionRequests.filter(r => r.status === 'pending').length;
  }, [subscriptionRequests]);

  // Web Audio Context initialization for audio visualizer
  const initWebAudio = useCallback(() => {
    if (!audioRef.current) return;

    if (!audioContextRef.current) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        if (!mediaSourceRef.current) {
          mediaSourceRef.current = ctx.createMediaElementSource(audioRef.current);
        }
        const source = mediaSourceRef.current;
        source.connect(analyser);
        analyser.connect(ctx.destination);
      } catch (err) {
        console.warn('Web Audio initialization error:', err);
      }
    }

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setPlaybackRate === 'function') {
      try {
        ytPlayerRef.current.setPlaybackRate(rate);
      } catch (e) {
        console.warn('Failed to set YouTube playback rate:', e);
      }
    }
  }, []);

  // Sync state to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRACKS, JSON.stringify(tracks));
    } catch (e) {
      console.error('Failed to save tracks', e);
    }
  }, [tracks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    } catch (e) {
      console.error('Failed to save playlists', e);
    }
  }, [playlists]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites', e);
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify(recentlyPlayed));
    } catch (e) {
      console.error('Failed to save recently played', e);
    }
  }, [recentlyPlayed]);

  useEffect(() => {
    try {
      const state = {
        currentTrack,
        queue,
        queueIndex,
        shuffle,
        repeatMode
      };
      localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state', e);
    }
  }, [currentTrack, queue, queueIndex, shuffle, repeatMode]);

  // Auto-migrate any existing preview tracks in user library to full tracks
  useEffect(() => {
    const previewTracks = tracks.filter(t => 
      t.audioUrl.includes('itunes-assets') || 
      t.audioUrl.includes('.p.m4a') || 
      t.audioUrl.includes('preview')
    );

    if (previewTracks.length > 0) {
      previewTracks.forEach(async (track) => {
        let resolvedData: { audioUrl: string; duration: number } | null = null;
        try {
          const res = await fetch('/api/tracks/resolve-full', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: track.title, artist: track.artist })
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.audioUrl) resolvedData = { audioUrl: data.audioUrl, duration: data.duration };
          }
        } catch (e) {}

        if (!resolvedData) {
          resolvedData = await resolveFullTrackClientSide(track.title, track.artist);
        }

        if (resolvedData && resolvedData.audioUrl) {
          setTracks(prev => prev.map(t => t.id === track.id ? { ...t, audioUrl: resolvedData!.audioUrl, duration: resolvedData!.duration } : t));
        }
      });
    }
  }, []);

  // Audio HTML element creation & listener wiring
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
      setIsLoading(false);
      setError(null);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
      setIsLoading(false);
      setIsPlaying(true);
      initWebAudio();
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      handleTrackEndRef.current();
    };

    const handleError = (e: Event) => {
      if (!audio.src || audio.src === '' || audio.src === window.location.href) {
        return;
      }
      console.warn('Audio playback error encountered on track:', audio.src, e);
      setIsLoading(false);
      setIsBuffering(false);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, [initWebAudio]);

  // Update Media Session API
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'Sur Music',
        artwork: [
          { src: currentTrack.albumArt, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      try {
        navigator.mediaSession.setActionHandler('play', () => { play(); });
        navigator.mediaSession.setActionHandler('pause', () => { pause(); });
        navigator.mediaSession.setActionHandler('previoustrack', () => { previous(); });
        navigator.mediaSession.setActionHandler('nexttrack', () => { next(); });
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            seek(details.seekTime);
          }
        });
      } catch (e) {
        console.warn('MediaSession handler setup failed', e);
      }
    }
  }, [currentTrack]);

  // Audio Playback Actions
  const play = async () => {
    setError(null);
    initWebAudio();

    if (isYoutube && ytPlayerRef.current) {
      if (audioRef.current) audioRef.current.pause();
      ytPlayerRef.current.playVideo();
      setIsPlaying(true);
      return;
    }

    if (audioRef.current) {
      if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
      try {
        audioRef.current.playbackRate = playbackRate;
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err: any) {
        console.warn('Play error or autoplay restriction triggered', err);
        setIsPlaying(false);
        if (err?.name !== 'NotAllowedError') {
          showToast('Click play to start audio playback');
        }
      }
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (ytPlayerRef.current) {
      ytPlayerRef.current.pauseVideo();
    }
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const setVolume = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : clamped;
    }
    if (ytPlayerRef.current) {
      ytPlayerRef.current.setVolume((isMuted ? 0 : clamped) * 100);
    }
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.volume = nextMuted ? 0 : volume;
    }
    if (ytPlayerRef.current) {
      if (nextMuted) {
        ytPlayerRef.current.mute();
      } else {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(volume * 100);
      }
    }
  };

  const seek = (seconds: number) => {
    const target = Math.max(0, Math.min(duration || 0, seconds));
    setCurrentTime(target);
    if (!isYoutube && audioRef.current) {
      audioRef.current.currentTime = target;
    }
    if (isYoutube && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(target, true);
    }
  };

  const toggleShuffle = () => {
    setShuffle(prev => {
      const nextVal = !prev;
      showToast(nextVal ? 'Shuffle On' : 'Shuffle Off');
      return nextVal;
    });
  };

  const cycleRepeat = () => {
    setRepeatMode(prev => {
      let nextMode: RepeatMode = 'off';
      if (prev === 'off') nextMode = 'all';
      else if (prev === 'all') nextMode = 'one';
      else nextMode = 'off';

      const labelMap = { off: 'Repeat Off', all: 'Repeat All', one: 'Repeat Track' };
      showToast(labelMap[nextMode]);
      return nextMode;
    });
  };

  const loadTrack = useCallback(async (track: Track, autoPlay: boolean = true) => {
    setIsLoading(true);
    setCurrentTime(0);
    setError(null);

    // Pause both audio sources immediately
    if (audioRef.current) audioRef.current.pause();
    if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo();

    // Check if this track is a preview snippet or non-youtube URL that needs full track resolution
    const needsResolution = (!track.audioUrl.startsWith('youtube:') || track.audioUrl === 'youtube:BEYCEq1m6kk') && (
      track.audioUrl.includes('itunes-assets') || 
      track.audioUrl.includes('.p.m4a') || 
      track.audioUrl.includes('preview') ||
      track.audioUrl.includes('apple.com') ||
      track.audioUrl.includes('scdn.co')
    );

    let targetTrack = track;

    if (needsResolution) {
      let resolvedData: { audioUrl: string; duration: number } | null = null;
      try {
        const res = await fetch('/api/tracks/resolve-full', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: track.title, artist: track.artist })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.audioUrl && data.audioUrl.startsWith('youtube:')) {
            resolvedData = { audioUrl: data.audioUrl, duration: data.duration || 210 };
          }
        }
      } catch (err) {
        console.warn('Backend auto-resolve error, attempting client-side full track resolution:', err);
      }

      if (!resolvedData) {
        resolvedData = await resolveFullTrackClientSide(track.title, track.artist);
      }

      if (resolvedData && resolvedData.audioUrl) {
        targetTrack = {
          ...track,
          audioUrl: resolvedData.audioUrl,
          duration: resolvedData.duration || 210
        };
        // Persist resolved full track into state so preview URL is permanently replaced
        setTracks(prev => prev.map(t => t.id === track.id ? targetTrack : t));
        setQueue(prev => prev.map(t => t.id === track.id ? targetTrack : t));
      }
    }

    setCurrentTrack(targetTrack);
    setDuration(targetTrack.duration || 210);

    // Record to recently played
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(t => t.id !== targetTrack.id);
      return [targetTrack, ...filtered].slice(0, 20);
    });

    const checkYoutube = targetTrack.audioUrl.startsWith('youtube:');
    setIsYoutube(checkYoutube);

    if (checkYoutube) {
      const videoId = targetTrack.audioUrl.replace('youtube:', '');
      setYoutubeId(videoId);
      setIsLoading(false);
      if (autoPlay) {
        setIsPlaying(true);
        if (ytPlayerRef.current) {
          try {
            if (typeof ytPlayerRef.current.loadVideoById === 'function') {
              ytPlayerRef.current.loadVideoById(videoId);
            }
            ytPlayerRef.current.playVideo();
          } catch (e) {
            console.warn('YouTube playVideo error:', e);
          }
        }
      } else {
        setIsPlaying(false);
      }
      return;
    }

    // Direct HTTP audio fallback (only for long audio URLs)
    setYoutubeId(null);
    if (audioRef.current) {
      // Use direct audio URL for static hosting (Netlify, GitHub Pages) without proxy 404
      const audioSource = targetTrack.audioUrl;

      audioRef.current.src = audioSource;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.load();

      if (autoPlay) {
        initWebAudio();
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        }).catch((err: any) => {
          setIsLoading(false);
          setIsPlaying(false);
          if (err?.name === 'NotAllowedError') {
            console.log('Autoplay restriction: User click required to play track');
          } else {
            console.warn('Playback load error for track URL:', targetTrack.audioUrl, err);
          }
        });
      } else {
        setIsLoading(false);
      }
    }
  }, [initWebAudio, isMuted, volume, playbackRate]);

  const playTrack = (track: Track, customQueue?: Track[]) => {
    let targetQueue = customQueue || queue;
    if (!targetQueue || targetQueue.length === 0) {
      targetQueue = tracks;
    }

    let foundIdx = targetQueue.findIndex(t => t.id === track.id);
    if (foundIdx === -1) {
      targetQueue = [track, ...targetQueue];
      foundIdx = 0;
    }

    setQueue(targetQueue);
    setQueueIndex(foundIdx);
    loadTrack(track, true);
    showToast(`Playing ${track.title}`);
  };

  const playPlaylist = (playlist: Playlist, startTrackId?: string) => {
    const playlistTracks = playlist.trackIds
      .map(id => tracks.find(t => t.id === id))
      .filter((t): t is Track => t !== undefined);

    if (playlistTracks.length === 0) {
      showToast('Playlist is empty');
      return;
    }

    let startTrack = playlistTracks[0];
    if (startTrackId) {
      const found = playlistTracks.find(t => t.id === startTrackId);
      if (found) startTrack = found;
    }

    let finalQueue = [...playlistTracks];
    if (shuffle) {
      finalQueue = [...playlistTracks].sort(() => Math.random() - 0.5);
    }

    const startIdx = finalQueue.findIndex(t => t.id === startTrack.id);
    setQueue(finalQueue);
    setQueueIndex(startIdx !== -1 ? startIdx : 0);
    loadTrack(startTrack, true);
    showToast(`Playing playlist: ${playlist.name}`);
  };

  const next = () => {
    if (!queue || queue.length === 0) return;

    if (repeatMode === 'one' && currentTrack) {
      seek(0);
      play();
      return;
    }

    let nextIdx = queueIndex + 1;

    if (shuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (nextIdx >= queue.length) {
      if (repeatMode === 'all') {
        nextIdx = 0;
      } else {
        pause();
        showToast('Reached end of queue');
        return;
      }
    }

    setQueueIndex(nextIdx);
    const nextTrack = queue[nextIdx];
    if (nextTrack) {
      loadTrack(nextTrack, true);
    }
  };

  const previous = () => {
    if (!queue || queue.length === 0) return;

    if (currentTime > 3) {
      seek(0);
      return;
    }

    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = repeatMode === 'all' ? queue.length - 1 : 0;
    }

    setQueueIndex(prevIdx);
    const prevTrack = queue[prevIdx];
    if (prevTrack) {
      loadTrack(prevTrack, true);
    }
  };

  const handleTrackEndRef = useRef(() => {});
  useEffect(() => {
    handleTrackEndRef.current = () => {
      if (repeatMode === 'one' && currentTrack) {
        seek(0);
        play();
      } else {
        next();
      }
    };
  });

  const toggleFavorite = (trackOrId: string | Track) => {
    let trackId: string;
    let trackObj: Track | undefined;

    if (typeof trackOrId === 'string') {
      trackId = trackOrId;
      trackObj = tracks.find(t => t.id === trackId) || (currentTrack?.id === trackId ? currentTrack : undefined);
    } else {
      trackId = trackOrId.id;
      trackObj = trackOrId;
    }

    if (trackObj) {
      setTracks(prev => {
        if (!prev.some(t => t.id === trackObj!.id)) {
          return [trackObj!, ...prev];
        }
        return prev;
      });
    }

    setFavorites(prev => {
      const exists = prev.includes(trackId);
      let updated: string[];
      if (exists) {
        updated = prev.filter(id => id !== trackId);
        showToast('Removed from Favorites');
      } else {
        updated = [trackId, ...prev];
        const title = trackObj ? `"${trackObj.title}"` : 'Song';
        showToast(`Added ${title} to Favorites`);
      }
      return updated;
    });
  };

  const createPlaylist = (name: string, description?: string): Playlist => {
    const newPl: Playlist = {
      id: `playlist-${Date.now()}`,
      name: name.trim() || 'New Playlist',
      description: description || 'Custom user playlist',
      coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
      trackIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setPlaylists(prev => [newPl, ...prev]);
    showToast(`Created playlist "${newPl.name}"`);
    return newPl;
  };

  const addToQueue = (track: Track) => {
    setQueue(prev => [...prev, track]);
    showToast(`Added "${track.title}" to queue`);
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => {
      if (index < 0 || index >= prev.length) return prev;
      const nextQueue = [...prev];
      nextQueue.splice(index, 1);
      return nextQueue;
    });
    setQueueIndex(prev => {
      if (index < prev) return Math.max(0, prev - 1);
      if (index === prev) return Math.max(0, Math.min(prev, queue.length - 2));
      return prev;
    });
    showToast('Removed track from queue');
  };

  const clearQueue = () => {
    setQueue(prev => (queueIndex < prev.length ? [prev[queueIndex]] : []));
    setQueueIndex(0);
    showToast('Cleared upcoming queue');
  };

  const reorderQueue = (fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) return prev;
      const nextQueue = [...prev];
      const [moved] = nextQueue.splice(fromIndex, 1);
      nextQueue.splice(toIndex, 0, moved);
      return nextQueue;
    });
    setQueueIndex(prev => {
      if (prev === fromIndex) return toIndex;
      if (fromIndex < prev && toIndex >= prev) return prev - 1;
      if (fromIndex > prev && toIndex <= prev) return prev + 1;
      return prev;
    });
  };

  const addTrackToPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(prev =>
      prev.map(pl => {
        if (pl.id === playlistId) {
          if (pl.trackIds.includes(trackId)) return pl;
          return {
            ...pl,
            trackIds: [...pl.trackIds, trackId],
            updatedAt: new Date().toISOString()
          };
        }
        return pl;
      })
    );
    showToast('Added song to playlist');
  };

  const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(prev =>
      prev.map(pl => {
        if (pl.id === playlistId) {
          return {
            ...pl,
            trackIds: pl.trackIds.filter(id => id !== trackId),
            updatedAt: new Date().toISOString()
          };
        }
        return pl;
      })
    );
    showToast('Removed song from playlist');
  };

  const reorderPlaylistTracks = (playlistId: string, fromIndex: number, toIndex: number) => {
    setPlaylists(prev =>
      prev.map(pl => {
        if (pl.id !== playlistId) return pl;
        const nextTrackIds = [...pl.trackIds];
        if (fromIndex < 0 || fromIndex >= nextTrackIds.length || toIndex < 0 || toIndex >= nextTrackIds.length) return pl;
        const [moved] = nextTrackIds.splice(fromIndex, 1);
        nextTrackIds.splice(toIndex, 0, moved);
        return {
          ...pl,
          trackIds: nextTrackIds,
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(pl => pl.id !== playlistId));
    showToast('Deleted playlist');
  };

  const updatePlaylist = (playlistId: string, updates: Partial<Playlist>) => {
    setPlaylists(prev => prev.map(pl => {
      if (pl.id === playlistId) {
        return { ...pl, ...updates, updatedAt: new Date().toISOString() };
      }
      return pl;
    }));
    if (updates.name) {
      showToast(`Updated playlist "${updates.name}"`);
    } else {
      showToast('Updated playlist');
    }
  };

  const addCustomTrackToPlaylist = (playlistId: string, trackInput: Partial<Track>) => {
    const newTrack: Track = {
      id: `custom-track-${Date.now()}`,
      title: trackInput.title?.trim() || 'Custom Song',
      artist: trackInput.artist?.trim() || 'Unknown Artist',
      album: trackInput.album?.trim() || 'Single',
      albumArt: trackInput.albumArt?.trim() || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
      audioUrl: trackInput.audioUrl?.trim() || '',
      duration: trackInput.duration || 210,
      genre: trackInput.genre?.trim() || 'Custom',
      year: trackInput.year || new Date().getFullYear()
    };

    setTracks(prev => [newTrack, ...prev]);
    addTrackToPlaylist(playlistId, newTrack.id);
  };

  const addCustomTrack = (track: Partial<Track>) => {
    const newTrack: Track = {
      id: `custom-${Date.now()}`,
      title: track.title || 'Unknown Title',
      artist: track.artist || 'Unknown Artist',
      album: track.album || 'Single',
      albumArt: track.albumArt || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
      audioUrl: track.audioUrl || '',
      duration: track.duration || 180,
      genre: track.genre || 'Custom',
      year: track.year || new Date().getFullYear()
    };
    setTracks(prev => [newTrack, ...prev]);
    setQueue(prev => [...prev, newTrack]);
    playTrack(newTrack);
    showToast(`Added track "${newTrack.title}"`);
  };

  const importSpotifyPlaylist = async (spotifyUrl: string): Promise<Playlist | null> => {
    try {
      showToast('Importing Spotify playlist...');
      const response = await fetch('/api/spotify/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotifyUrl })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.playlist && data.tracks) {
          const importedTracks: Track[] = data.tracks;
          const importedPlaylist: Playlist = data.playlist;

          setTracks(prevTracks => {
            const existingIds = new Set(prevTracks.map(t => t.id));
            const newUnique = importedTracks.filter(t => !existingIds.has(t.id));
            return [...newUnique, ...prevTracks];
          });

          setPlaylists(prev => [importedPlaylist, ...prev]);
          showToast(`Imported "${importedPlaylist.name}" (${importedTracks.length} tracks)`);
          return importedPlaylist;
        }
      }
    } catch (err) {
      console.warn('Backend Spotify import API unavailable, trying client-side oEmbed fallback:', err);
    }

    // Client-side Spotify oEmbed + iTunes Fallback (Works on Netlify / Static Host)
    try {
      let type = 'playlist';
      let spotifyId = '';
      const match = spotifyUrl.match(/(playlist|track|album)[/:]([a-zA-Z0-9]{22})/);
      if (match) {
        type = match[1];
        spotifyId = match[2];
      } else if (/^[a-zA-Z0-9]{22}$/.test(spotifyUrl.trim())) {
        spotifyId = spotifyUrl.trim();
      }

      let playlistTitle = 'Spotify Playlist';
      let coverImg = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop';

      if (spotifyId) {
        try {
          const oembedRes = await fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/${type}/${spotifyId}`);
          if (oembedRes.ok) {
            const oembedData = await oembedRes.json();
            if (oembedData.title) playlistTitle = oembedData.title;
            if (oembedData.thumbnail_url) coverImg = oembedData.thumbnail_url;
          }
        } catch (e) {}
      }

      // Fetch sample tracks from iTunes using the playlistTitle
      const searchTerm = playlistTitle && playlistTitle !== 'Spotify Playlist' ? playlistTitle : 'Top Hits';
      const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song&limit=10`);
      let clientTracks: Track[] = [];

      if (itunesRes.ok) {
        const itunesData = await itunesRes.json();
        if (Array.isArray(itunesData.results) && itunesData.results.length > 0) {
          clientTracks = itunesData.results.map((s: any, idx: number) => ({
            id: `spotify-client-${spotifyId || 'pl'}-${idx}-${Date.now()}`,
            title: s.trackName,
            artist: s.artistName,
            album: s.collectionName || playlistTitle,
            albumArt: s.artworkUrl100 ? s.artworkUrl100.replace('100x100bb', '600x600bb') : coverImg,
            audioUrl: s.previewUrl || 'youtube:BEYCEq1m6kk',
            duration: s.trackTimeMillis ? Math.round(s.trackTimeMillis / 1000) : 180,
            genre: s.primaryGenreName || 'Pop',
            year: s.releaseDate ? new Date(s.releaseDate).getFullYear() : 2024
          }));
        }
      }

      if (clientTracks.length === 0) {
        console.warn('Could not resolve playlist tracks from iTunes.');
        // Add a dummy track so it doesn't crash, and warn the user
        clientTracks.push({
            id: `spotify-client-${spotifyId || 'pl'}-fallback-${Date.now()}`,
            title: playlistTitle !== 'Spotify Playlist' ? `Tracks for ${playlistTitle} (Preview)` : 'Imported Spotify Content',
            artist: 'Spotify Import (Fallback Mode)',
            album: playlistTitle,
            albumArt: coverImg,
            audioUrl: 'youtube:BEYCEq1m6kk',
            duration: 180,
            genre: 'Import',
            year: new Date().getFullYear()
        });
        setTimeout(() => showToast("Static hosting detected. Showing fallback tracks. Deploy a Node.js backend for real Spotify tracks."), 1000);
      }

      const clientPlaylist: Playlist = {
        id: `playlist-spotify-${spotifyId || Date.now()}`,
        name: playlistTitle,
        description: 'Imported Spotify curation',
        coverImage: clientTracks[0]?.albumArt || coverImg,
        trackIds: clientTracks.map(t => t.id),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setTracks(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const newUnique = clientTracks.filter(t => !existingIds.has(t.id));
        return [...newUnique, ...prev];
      });

      setPlaylists(prev => [clientPlaylist, ...prev]);
      showToast(`Imported "${clientPlaylist.name}" (${clientTracks.length} tracks)`);
      return clientPlaylist;

    } catch (err: any) {
      console.error('Spotify import client fallback error:', err);
      showToast('Failed to import Spotify playlist. Check link and try again.');
      return null;
    }
  };

  const onYtReady = (event: { target: YouTubePlayer }) => {
    ytPlayerRef.current = event.target;
    event.target.setVolume(isMuted ? 0 : volume * 100);
    if (typeof event.target.setPlaybackRate === 'function') {
      try {
        event.target.setPlaybackRate(playbackRate);
      } catch (e) {}
    }
    if (isPlaying || isLoading) {
      try {
        event.target.playVideo();
      } catch (e) {}
    }
  };

  const onYtStateChange = (event: { target: YouTubePlayer, data: number }) => {
    if (event.data === 1) {
      setIsPlaying(true);
      setIsBuffering(false);
      setIsLoading(false);
      if (ytTimeIntervalRef.current) clearInterval(ytTimeIntervalRef.current);
      ytTimeIntervalRef.current = window.setInterval(async () => {
        if (ytPlayerRef.current) {
          const time = await ytPlayerRef.current.getCurrentTime();
          setCurrentTime(time);
        }
      }, 1000);
    } else if (event.data === 2) {
      setIsPlaying(false);
      if (ytTimeIntervalRef.current) clearInterval(ytTimeIntervalRef.current);
    } else if (event.data === 3) {
      setIsBuffering(true);
    } else if (event.data === 0) {
      if (ytTimeIntervalRef.current) clearInterval(ytTimeIntervalRef.current);
      handleTrackEndRef.current();
    }
  };

  const onYtError = (event: any) => {
    console.warn("YouTube player error:", event.data);
    setIsLoading(false);
    setIsBuffering(false);
    setIsPlaying(false);
    next();
  };

  useEffect(() => {
    return () => {
      if (ytTimeIntervalRef.current) clearInterval(ytTimeIntervalRef.current);
    };
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        shuffle,
        repeatMode,
        queue,
        queueIndex,
        isLoading,
        isBuffering,
        error,
        analyserRef,
        audioContextRef,
        playbackRate,
        setPlaybackRate,
        tracks,
        playlists,
        favorites,
        recentlyPlayed,
        userProfile,
        setUserProfile,
        checkFeatureAccess,
        hasPermission,
        subscriptionRequests,
        unreadRequestCount,
        createSubscriptionRequest,
        approveSubscriptionRequest,
        rejectSubscriptionRequest,
        updateUserPermissions,
        sleepTimerSeconds,
        setSleepTimerSeconds,
        activeDrawer,
        setActiveDrawer,
        searchQuery,
        setSearchQuery,
        toastMessage,
        showToast,
        currentIp,
        currentHwid,
        bannedIps,
        bannedHwids,
        banRecords,
        isCurrentSessionBanned,
        banUser,
        unbanUser,
        updateProfileName,
        play,
        pause,
        togglePlay,
        next,
        previous,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeat,
        playTrack,
        playPlaylist,
        addToQueue,
        removeFromQueue,
        clearQueue,
        reorderQueue,
        toggleFavorite,
        createPlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        reorderPlaylistTracks,
        addCustomTrackToPlaylist,
        deletePlaylist,
        updatePlaylist,
        addCustomTrack,
        importSpotifyPlaylist
      }}
    >
      {children}
      {youtubeId && (
        <div className="fixed top-0 -left-[9999px] w-[300px] h-[300px] opacity-0 pointer-events-none z-[-100]">
          <YouTube
            videoId={youtubeId}
            opts={{
              height: '300',
              width: '300',
              playerVars: {
                autoplay: 1,
                controls: 0,
                disablekb: 1,
                fs: 0,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3,
                enablejsapi: 1,
                origin: typeof window !== 'undefined' ? window.location.origin : undefined
              },
            }}
            onReady={onYtReady}
            onStateChange={onYtStateChange}
            onError={onYtError}
          />
        </div>
      )}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
