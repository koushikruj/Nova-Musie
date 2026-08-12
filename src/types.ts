export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  audioUrl: string;
  duration: number; // in seconds
  genre: string;
  year?: number;
  isFavorite?: boolean;
  addedAt?: string;
  description?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  trackIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0 to 1
  isMuted: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  queue: Track[];
  queueIndex: number;
  isLoading: boolean;
  isBuffering: boolean;
  error: string | null;
}

export interface LibraryData {
  favorites: string[]; // track ids
  playlists: Playlist[];
  recentlyPlayed: Track[];
}

export type DrawerType = 
  | 'queue' 
  | 'playlists' 
  | 'search' 
  | 'library' 
  | 'admin' 
  | 'shortcuts' 
  | 'lyrics' 
  | 'addContent' 
  | 'sleep' 
  | 'language' 
  | 'subscription' 
  | 'auth' 
  | 'payment' 
  | null;

export interface UserPermissions {
  canSearchCatalog?: boolean;
  canAddContent?: boolean;
  canImportSpotify?: boolean;
  canAccessLyrics?: boolean;
  canAccessEqualizer?: boolean;
}

export interface SubscriptionRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planName: string;
  amount: string;
  durationDays: number;
  paymentMethod: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isSubscribed: boolean;
  subscriptionPlan?: string;
  subscribedAt?: string;
  subscriptionExpiresAt?: string | null; // ISO timestamp string or null if free
  status?: 'active' | 'paused' | 'cancelled' | 'free';
  isAdmin?: boolean; // Controls visibility of Admin Management Panel
  permissions?: UserPermissions;
  // Security & Device Identification
  lastIpAddress?: string | null;
  hardwareId?: string | null;
  ipHistory?: string[];
  lastLoginAt?: string | null;
  isBanned?: boolean;
  bannedIp?: boolean;
  bannedHwid?: boolean;
  banReason?: string | null;
}

export interface BanRecord {
  id: string; // IP or Hardware ID
  type: 'ip' | 'hwid';
  value: string;
  bannedBy: string;
  bannedAt: string;
  targetUid?: string;
  targetEmail?: string;
  reason?: string;
}


