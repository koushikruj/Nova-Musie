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
    tracks // Need tracks to show track details in playlists
  } = usePlayer();`;
  
content = content.replace(ctxTarget, ctxRep);

fs.writeFileSync('src/components/AdminModal.tsx', content);
