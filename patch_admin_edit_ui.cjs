const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

// Ensure Edit2 / Pencil icon is imported
if (!content.includes('Edit2')) {
  content = content.replace('X,', 'X,\n  Edit2,');
}

const target = `                        <div className="flex items-center gap-3">
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
                          <div className="mt-4 space-y-2">`;

const replacement = `                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (editingPlaylistId === playlist.id) {
                                setEditingPlaylistId(null);
                              } else {
                                setEditingPlaylistId(playlist.id);
                                setEditPlaylistForm({ name: playlist.name, description: playlist.description || '' });
                                setExpandedPlaylistId(playlist.id);
                              }
                            }}
                            className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors"
                            title="Edit Playlist"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
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
                          
                          {editingPlaylistId === playlist.id && (
                            <div className="mt-4 mb-6 p-4 bg-neutral-900 border border-indigo-500/20 rounded-xl space-y-4">
                              <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Edit Playlist Metadata</h5>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-xs text-neutral-400 font-medium mb-1 block">Playlist Name</label>
                                  <input 
                                    type="text" 
                                    value={editPlaylistForm.name}
                                    onChange={(e) => setEditPlaylistForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-neutral-400 font-medium mb-1 block">Description</label>
                                  <textarea 
                                    value={editPlaylistForm.description}
                                    onChange={(e) => setEditPlaylistForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 min-h-[60px]"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                  <button
                                    onClick={() => setEditingPlaylistId(null)}
                                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (editPlaylistForm.name.trim()) {
                                        updatePlaylist(playlist.id, { 
                                          name: editPlaylistForm.name.trim(),
                                          description: editPlaylistForm.description.trim() 
                                        });
                                        setEditingPlaylistId(null);
                                      }
                                    }}
                                    disabled={!editPlaylistForm.name.trim()}
                                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold transition-colors flex items-center gap-1.5"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="mt-4 space-y-2">`;

const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = target.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
  fs.writeFileSync('src/components/AdminModal.tsx', normalizedContent.replace(normalizedTarget, replacement));
  console.log('Success');
} else {
  console.log('Target not found.');
}
