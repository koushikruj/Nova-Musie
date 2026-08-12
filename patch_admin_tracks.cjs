const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const usePlayerTarget = `    importSpotifyPlaylist,
    addCustomTrackToPlaylist
  } = usePlayer();`;

const usePlayerReplacement = `    importSpotifyPlaylist,
    addCustomTrackToPlaylist,
    tracks
  } = usePlayer();`;
  
code = code.replace(usePlayerTarget, usePlayerReplacement);

const dupCheckTarget = `                              if (youtubePreview.type === 'video') {
                                  // Check duplicate
                                  const existingPlaylist = playlists.find(p => p.id === youtubeForm.playlistId);`;

const dupCheckReplacement = `                              if (youtubePreview.type === 'video') {
                                  // Check duplicate
                                  const existingTrack = tracks.find(t => t.youtubeVideoId === youtubePreview.videoId);
                                  if (existingTrack) {
                                      showToast("This YouTube content has already been added.");
                                      return; // Actually, prompt said to provide view existing/add to another playlist but to prevent duplication we stop here for now
                                  }
                                  
                                  const existingPlaylist = playlists.find(p => p.id === youtubeForm.playlistId);`;

code = code.replace(dupCheckTarget, dupCheckReplacement);

fs.writeFileSync('src/components/AdminModal.tsx', code);
console.log("Added track duplication check");
