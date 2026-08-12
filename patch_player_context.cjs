const fs = require('fs');
let content = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');

// Add updatePlaylist to interface
const interfaceTarget = `  deletePlaylist: (playlistId: string) => void;`;
const interfaceReplacement = `  deletePlaylist: (playlistId: string) => void;
  updatePlaylist: (playlistId: string, updates: Partial<Playlist>) => void;`;

content = content.replace(interfaceTarget, interfaceReplacement);

// Add updatePlaylist function
const fnTarget = `  const deletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(pl => pl.id !== playlistId));
    showToast('Deleted playlist');
  };`;

const fnReplacement = `  const deletePlaylist = (playlistId: string) => {
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
      showToast(\`Updated playlist "\${updates.name}"\`);
    } else {
      showToast('Updated playlist');
    }
  };`;

content = content.replace(fnTarget, fnReplacement);

// Add to returned context
const retTarget = `        deletePlaylist,`;
const retReplacement = `        deletePlaylist,
        updatePlaylist,`;

content = content.replace(retTarget, retReplacement);

fs.writeFileSync('src/context/PlayerContext.tsx', content);
console.log("Patched PlayerContext.tsx");
