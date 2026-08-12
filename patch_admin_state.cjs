const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const target1 = `const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'requests' | 'permissions' | 'banned' | 'activity' | 'settings'>('dashboard');`;
const rep1 = `const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'requests' | 'permissions' | 'banned' | 'activity' | 'settings' | 'playlists'>('dashboard');`;

content = content.replace(target1, rep1);

// Add playlists to context
const ctxTarget = `    banRecords
  } = usePlayer();`;
const ctxRep = `    banRecords,
    playlists,
    createPlaylist,
    deletePlaylist,
    removeTrackFromPlaylist,
    tracks
  } = usePlayer();`;
  
content = content.replace(ctxTarget, ctxRep);

// Add state for playlist management inside Admin Modal
const stateTarget = `  // Ban Modal state`;
const stateRep = `  // Playlist Management state
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // Ban Modal state`;
content = content.replace(stateTarget, stateRep);

fs.writeFileSync('src/components/AdminModal.tsx', content);
console.log("Patched state");
