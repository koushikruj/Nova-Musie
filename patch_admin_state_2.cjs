const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

// Fix horizontal scrolling in tabs
content = content.replace(
  '<div className="flex border-b border-white/10 bg-neutral-900/80 p-1.5 gap-1 overflow-x-auto">',
  '<div className="flex flex-wrap border-b border-white/10 bg-neutral-900/80 p-1.5 gap-1.5">'
);

// Add state for playlist deletion and track addition
const stateTarget = `  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editPlaylistForm, setEditPlaylistForm] = useState({ name: '', description: '' });`;

const stateReplacement = `  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editPlaylistForm, setEditPlaylistForm] = useState({ name: '', description: '' });
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  
  // Custom Track / Spotify Import State
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [addingTrackToPlaylistId, setAddingTrackToPlaylistId] = useState<string | null>(null);
  const [customTrackForm, setCustomTrackForm] = useState({ title: '', artist: '', audioUrl: '', albumArt: '' });`;

content = content.replace(stateTarget, stateReplacement);

// Add importSpotifyPlaylist, addCustomTrackToPlaylist to context
const ctxTarget = `    deletePlaylist,
    updatePlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
    tracks
  } = usePlayer();`;

const ctxReplacement = `    deletePlaylist,
    updatePlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
    tracks,
    importSpotifyPlaylist,
    addCustomTrackToPlaylist
  } = usePlayer();`;

content = content.replace(ctxTarget, ctxReplacement);

fs.writeFileSync('src/components/AdminModal.tsx', content);
console.log('Patched state 2');
