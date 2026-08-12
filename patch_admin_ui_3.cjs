const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

// Replace deletion logic
const deleteTarget = `                            onClick={(e) => {
                              e.stopPropagation();
                              if(window.confirm(\`Are you sure you want to delete "\${playlist.name}"?\`)) {
                                deletePlaylist(playlist.id);
                              }
                            }}`;
const deleteReplacement = `                            onClick={(e) => {
                              e.stopPropagation();
                              setPlaylistToDelete(playlist.id);
                            }}`;
content = content.replace(deleteTarget, deleteReplacement);


// Add Spotify Import below Create Playlist
const createSectionTarget = `                <input
                  type="text"
                  placeholder="New playlist name..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPlaylistName.trim()) {
                      createPlaylist(newPlaylistName.trim());
                      setNewPlaylistName('');
                    }
                  }}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>`;
const createSectionReplacement = `                <input
                  type="text"
                  placeholder="New playlist name..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPlaylistName.trim()) {
                      createPlaylist(newPlaylistName.trim());
                      setNewPlaylistName('');
                    }
                  }}
                  className="flex-1 min-w-0 bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-xl bg-neutral-900/60 border border-white/5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Link className="w-4 h-4 text-emerald-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Paste Spotify Playlist URL..."
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (spotifyUrl.trim()) {
                      setIsImporting(true);
                      await importSpotifyPlaylist(spotifyUrl.trim());
                      setIsImporting(false);
                      setSpotifyUrl('');
                    }
                  }}
                  disabled={!spotifyUrl.trim() || isImporting}
                  className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-bold transition-colors whitespace-nowrap"
                >
                  {isImporting ? 'Importing...' : 'Import from Spotify'}
                </button>
              </div>`;
content = content.replace(createSectionTarget, createSectionReplacement);


// Add Custom Track form in expanded playlist
const addTrackTarget = `                          <div className="mt-4 space-y-2">`;
const addTrackReplacement = `                          {addingTrackToPlaylistId === playlist.id && (
                            <div className="mt-4 mb-6 p-4 bg-neutral-900 border border-amber-500/20 rounded-xl space-y-3">
                              <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Add Custom Track</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] text-neutral-400 font-medium mb-1 block uppercase">Track Title</label>
                                  <input 
                                    type="text" 
                                    value={customTrackForm.title}
                                    onChange={(e) => setCustomTrackForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g. My Awesome Song"
                                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-neutral-400 font-medium mb-1 block uppercase">Artist</label>
                                  <input 
                                    type="text" 
                                    value={customTrackForm.artist}
                                    onChange={(e) => setCustomTrackForm(prev => ({ ...prev, artist: e.target.value }))}
                                    placeholder="e.g. Unknown Artist"
                                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="text-[10px] text-neutral-400 font-medium mb-1 block uppercase">Stream URL (Audio File)</label>
                                  <input 
                                    type="url" 
                                    value={customTrackForm.audioUrl}
                                    onChange={(e) => setCustomTrackForm(prev => ({ ...prev, audioUrl: e.target.value }))}
                                    placeholder="https://example.com/audio.mp3"
                                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="text-[10px] text-neutral-400 font-medium mb-1 block uppercase">Cover Image URL (Optional)</label>
                                  <input 
                                    type="url" 
                                    value={customTrackForm.albumArt}
                                    onChange={(e) => setCustomTrackForm(prev => ({ ...prev, albumArt: e.target.value }))}
                                    placeholder="https://example.com/cover.jpg"
                                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end pt-2">
                                <button
                                  onClick={() => {
                                    setAddingTrackToPlaylistId(null);
                                    setCustomTrackForm({ title: '', artist: '', audioUrl: '', albumArt: '' });
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => {
                                    if (customTrackForm.title.trim() && customTrackForm.audioUrl.trim()) {
                                      addCustomTrackToPlaylist(playlist.id, {
                                        title: customTrackForm.title.trim(),
                                        artist: customTrackForm.artist.trim(),
                                        audioUrl: customTrackForm.audioUrl.trim(),
                                        albumArt: customTrackForm.albumArt.trim() || undefined
                                      });
                                      setAddingTrackToPlaylistId(null);
                                      setCustomTrackForm({ title: '', artist: '', audioUrl: '', albumArt: '' });
                                    }
                                  }}
                                  disabled={!customTrackForm.title.trim() || !customTrackForm.audioUrl.trim()}
                                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold transition-colors flex items-center gap-1.5"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  Add Track
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-end mb-2">
                              <button
                                onClick={() => setAddingTrackToPlaylistId(addingTrackToPlaylistId === playlist.id ? null : playlist.id)}
                                className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                              >
                                <PlusCircle className="w-3 h-3" />
                                Add Track
                              </button>
                            </div>`;
content = content.replace(addTrackTarget, addTrackReplacement);

// Add Deletion Confirmation Modal at the bottom
const bottomTarget = `      {/* BAN USER CONFIRMATION DIALOG MODAL */}`;
const bottomReplacement = `      {/* DELETE PLAYLIST CONFIRMATION MODAL */}
      {playlistToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-sm bg-neutral-950 border border-rose-500/50 rounded-2xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Delete Playlist</h3>
                <p className="text-xs text-neutral-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900 border border-white/5 space-y-2 text-xs">
              <p className="text-neutral-300">
                Are you sure you want to permanently delete this playlist? All tracks inside will be removed from the playlist view.
              </p>
              <div className="bg-rose-500/10 text-rose-400 px-3 py-2 rounded-lg font-medium border border-rose-500/20">
                Warning: Users currently listening to this playlist will lose access.
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setPlaylistToDelete(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-xs font-semibold text-neutral-300 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  deletePlaylist(playlistToDelete);
                  setPlaylistToDelete(null);
                  if (expandedPlaylistId === playlistToDelete) {
                    setExpandedPlaylistId(null);
                  }
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BAN USER CONFIRMATION DIALOG MODAL */}`;
content = content.replace(bottomTarget, bottomReplacement);

fs.writeFileSync('src/components/AdminModal.tsx', content);
console.log('Patched UI 3');
