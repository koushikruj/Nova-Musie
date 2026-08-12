const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const targetButtons = `<button
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
                </button>`;

const replaceButtons = `<div className="flex gap-2">
                  <button
                    onClick={() => setShowYoutubeImport(!showYoutubeImport)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white hover:text-black text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Add from YouTube
                  </button>
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
                    Create Playlist
                  </button>
                </div>`;

code = code.replace(targetButtons, replaceButtons);

// Add the YouTube Import form
const targetFormArea = `<div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New playlist name..."`;

const youtubeFormMarkup = `
              {showYoutubeImport && (
                <div className="p-4 rounded-xl bg-neutral-900 border border-rose-500/30 space-y-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    Import Content from YouTube
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-neutral-400 mb-1 block">YouTube URL</label>
                      <input
                        type="text"
                        placeholder="Paste YouTube Video or Playlist URL here..."
                        value={youtubeForm.url}
                        onChange={(e) => setYoutubeForm({...youtubeForm, url: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-rose-500/50 outline-none"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-neutral-400 mb-1 block">Playlist</label>
                        <select
                          value={youtubeForm.playlistId}
                          onChange={(e) => setYoutubeForm({...youtubeForm, playlistId: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-rose-500/50 outline-none"
                        >
                          {playlists.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 mb-1 block">Content Type</label>
                        <select
                          value={youtubeForm.contentType}
                          onChange={(e) => setYoutubeForm({...youtubeForm, contentType: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-rose-500/50 outline-none"
                        >
                          <option>Music</option>
                          <option>Podcast</option>
                          <option>Audio Story</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 mb-1 block">Category</label>
                        <select
                          value={youtubeForm.category}
                          onChange={(e) => setYoutubeForm({...youtubeForm, category: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-rose-500/50 outline-none"
                        >
                          <option>General</option>
                          <option>Sunday Suspense</option>
                          <option>Bhoot FM</option>
                          <option>Lofi</option>
                          <option>Pop</option>
                          <option>Rock</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 mb-1 block">Status</label>
                        <select
                          value={youtubeForm.status}
                          onChange={(e) => setYoutubeForm({...youtubeForm, status: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-rose-500/50 outline-none"
                        >
                          <option>Published</option>
                          <option>Draft</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="ytFeatured"
                        checked={youtubeForm.isFeatured}
                        onChange={(e) => setYoutubeForm({...youtubeForm, isFeatured: e.target.checked})}
                      />
                      <label htmlFor="ytFeatured" className="text-xs text-neutral-300">Featured Content</label>
                    </div>

                    {!youtubePreview ? (
                      <button
                        onClick={async () => {
                          if (!youtubeForm.url) {
                            showToast("Please enter a valid YouTube URL.");
                            return;
                          }
                          setIsFetchingYoutube(true);
                          try {
                            const res = await fetch(\`/api/youtube/fetch?url=\${encodeURIComponent(youtubeForm.url)}\`);
                            if (!res.ok) {
                              const err = await res.json();
                              throw new Error(err.error || 'Failed to fetch YouTube info');
                            }
                            const data = await res.json();
                            setYoutubePreview(data);
                          } catch (e: any) {
                            showToast(e.message || "Unable to fetch YouTube information.");
                          } finally {
                            setIsFetchingYoutube(false);
                          }
                        }}
                        disabled={isFetchingYoutube || !youtubeForm.url}
                        className="w-full py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold transition-colors"
                      >
                        {isFetchingYoutube ? 'Fetching...' : 'Fetch & Preview'}
                      </button>
                    ) : (
                      <div className="mt-4 p-3 bg-black/50 rounded-lg border border-white/5">
                        {youtubePreview.type === 'video' ? (
                          <div className="flex gap-4">
                            <img src={youtubePreview.thumbnailUrl} alt="Thumbnail" className="w-32 h-auto rounded-md object-cover" />
                            <div className="flex-1 min-w-0">
                              <input 
                                type="text"
                                value={youtubePreview.title}
                                onChange={(e) => setYoutubePreview({...youtubePreview, title: e.target.value})}
                                className="font-bold text-sm text-white bg-transparent border-b border-white/10 w-full outline-none focus:border-rose-500 mb-1"
                              />
                              <p className="text-xs text-neutral-400">{youtubePreview.channelName}</p>
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-500">
                                <span>{Math.floor(youtubePreview.duration / 60)}:{(youtubePreview.duration % 60).toString().padStart(2, '0')}</span>
                                <span>{new Date(youtubePreview.publishedAt).toLocaleDateString()}</span>
                                <span>{Number(youtubePreview.viewCount).toLocaleString()} views</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-4">
                            <img src={youtubePreview.thumbnailUrl} alt="Thumbnail" className="w-32 h-auto rounded-md object-cover" />
                            <div>
                              <h5 className="font-bold text-sm text-white">YouTube Playlist Detected</h5>
                              <p className="text-xs text-neutral-300">{youtubePreview.title}</p>
                              <p className="text-[10px] text-neutral-500 mt-1">{youtubePreview.videoCount} videos • {youtubePreview.channelName}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                          <button
                            onClick={() => setYoutubePreview(null)}
                            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex-1 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={async () => {
                              if (!youtubeForm.playlistId) {
                                showToast("Please select a playlist first.");
                                return;
                              }
                              try {
                                if (youtubePreview.type === 'video') {
                                  // Check duplicate
                                  const existingPlaylist = playlists.find(p => p.id === youtubeForm.playlistId);
                                  // Simple duplicate check isn't foolproof without track data, but we just add it to the playlist
                                  await addCustomTrackToPlaylist(youtubeForm.playlistId, {
                                    title: youtubePreview.title,
                                    artist: youtubePreview.channelName,
                                    audioUrl: youtubePreview.youtubeUrl,
                                    albumArt: youtubePreview.thumbnailUrl
                                  });
                                  showToast("Added to playlist!");
                                } else if (youtubePreview.type === 'playlist') {
                                  // Add all videos
                                  for (const item of youtubePreview.items) {
                                    await addCustomTrackToPlaylist(youtubeForm.playlistId, {
                                      title: item.title,
                                      artist: item.channelName,
                                      audioUrl: item.youtubeUrl,
                                      albumArt: item.thumbnailUrl
                                    });
                                  }
                                  showToast(\`Added \${youtubePreview.items.length} videos to playlist!\`);
                                }
                                setYoutubePreview(null);
                                setYoutubeForm({...youtubeForm, url: ''});
                                setShowYoutubeImport(false);
                              } catch (e: any) {
                                showToast(e.message || "Error adding to playlist.");
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold flex-1 transition-colors"
                          >
                            {youtubePreview.type === 'video' ? 'Add to Playlist' : 'Import Entire Playlist'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
`;

code = code.replace(targetFormArea, youtubeFormMarkup + targetFormArea);

fs.writeFileSync('src/components/AdminModal.tsx', code);
console.log("Injected UI");
