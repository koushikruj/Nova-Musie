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

export type DrawerType = 'queue' | 'playlists' | 'search' | 'library' | 'admin' | 'shortcuts' | 'lyrics' | 'addContent' | 'sleep' | 'language' | null;
