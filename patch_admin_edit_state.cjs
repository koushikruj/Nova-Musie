const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const target = `  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');`;

const replacement = `  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editPlaylistForm, setEditPlaylistForm] = useState({ name: '', description: '' });`;

content = content.replace(target, replacement);

const ctxTarget = `    deletePlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
    tracks`;

const ctxReplacement = `    deletePlaylist,
    updatePlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
    tracks`;

content = content.replace(ctxTarget, ctxReplacement);

fs.writeFileSync('src/components/AdminModal.tsx', content);
