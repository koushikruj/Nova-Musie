const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

// Insert tab button
const tabTarget = `            <span>System Settings</span>
          </button>
        </div>`;
const tabReplacement = `            <span>System Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('playlists')}
            className={\`py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all whitespace-nowrap \${
              activeTab === 'playlists'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }\`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Content & Playlists</span>
          </button>
        </div>`;

content = content.replace(tabTarget, tabReplacement);

// Insert the tab content
const contentTarget = `        </div>
      </div>
    </div>
  );
};`;
const contentReplacement = `        </div>
      </div>
    </div>
  );
};`;

// Wait, earlier I found the exact end of the tabs using `{/* TAB: SYSTEM SETTINGS */}` block
const settingsEndRegex = /\{\/\* TAB: SYSTEM SETTINGS \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;

const playlistContent = `
          {/* TAB: PLAYLIST MANAGEMENT */}
          {activeTab === 'playlists' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <ListMusic className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">Platform Playlists</h3>
                </div>
                <button
                  onClick={() => {
                    if (newPlaylistName.trim()) {
                      createPlaylist(newPlaylistName.trim());
                      setNewPlaylistName('');
                    }
                  }}
                  disabled={!newPlaylistName.trim()}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Create
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
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
              </div>

              {playlists.length === 0 ? (
                <div className="py-8 text-center border border-white/5 rounded-2xl bg-neutral-900/30">
                  <ListMusic className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400 text-xs font-medium">No playlists created yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {playlists.map(playlist => (
                    <div key={playlist.id} className="bg-neutral-900/50 border border-white/5 rounded-xl overflow-hidden transition-all">
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5"
                        onClick={() => setExpandedPlaylistId(expandedPlaylistId === playlist.id ? null : playlist.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                            <ListMusic className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white">{playlist.name}</h4>
                            <p className="text-xs text-neutral-400 mt-0.5">{playlist.trackIds?.length || 0} tracks • {new Date(playlist.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if(window.confirm(\`Are you sure you want to delete "\${playlist.name}"?\`)) {
                                deletePlaylist(playlist.id);
                              }
                            }}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                            title="Delete Playlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <ChevronDown className={\`w-4 h-4 text-neutral-500 transition-transform \${expandedPlaylistId === playlist.id ? 'rotate-180' : ''}\`} />
                        </div>
                      </div>

                      {expandedPlaylistId === playlist.id && (
                        <div className="p-4 pt-0 border-t border-white/5 bg-neutral-950/50">
                          <div className="mt-4 space-y-2">
                            {(!playlist.trackIds || playlist.trackIds.length === 0) ? (
                              <p className="text-xs text-neutral-500 italic text-center py-4">This playlist is empty.</p>
                            ) : (
                              playlist.trackIds.map((trackId, index) => {
                                const track = tracks.find(t => t.id === trackId);
                                if (!track) return null;
                                return (
                                  <div key={\`\${trackId}-\${index}\`} className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-white/5 hover:border-white/10 group">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <img src={track.albumArt} alt={track.title} className="w-8 h-8 rounded-md object-cover" />
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold text-white truncate">{track.title}</p>
                                        <p className="text-[10px] text-neutral-400 truncate">{track.artist}</p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => removeTrackFromPlaylist(playlist.id, trackId)}
                                      className="p-1.5 rounded-md text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                      title="Remove from playlist"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
`;

const match = content.match(settingsEndRegex);
if (match) {
  content = content.replace(settingsEndRegex, match[0] + playlistContent);
  fs.writeFileSync('src/components/AdminModal.tsx', content);
  console.log('Success');
} else {
  console.log('Could not find settings end');
}
