const fs = require('fs');
let content = fs.readFileSync('src/components/SearchModal.tsx', 'utf8');

const targetRegex = /<div className="space-y-2">[\s\S]*?(?=\{\/\* Load More Related Songs Button \*\/})/;

const replacement = `<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-4">
              {displayResults.map(track => (
                <div
                  key={track.id}
                  className="group relative flex flex-col rounded-xl bg-neutral-900/60 border border-white/5 overflow-hidden hover:bg-emerald-950/20 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/20 hover:-translate-y-1"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-neutral-800">
                    <img
                      src={track.albumArt}
                      alt={track.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={() => {
                            playTrack(track, displayResults);
                            setActiveDrawer(null);
                          }}
                          className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center transform hover:scale-110 transition-all shadow-xl shadow-emerald-900/50 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 duration-300 delay-75"
                          title="Play song immediately"
                        >
                          <Play className="w-5 h-5 fill-current ml-1" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between relative z-10 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-150">
                        <button
                          onClick={() => toggleFavorite(track)}
                          className={\`p-1.5 rounded-full backdrop-blur-md bg-black/40 hover:bg-black/60 transition-colors \${
                            favorites.includes(track.id) ? 'text-rose-500' : 'text-white hover:text-rose-400'
                          }\`}
                          title={favorites.includes(track.id) ? 'Unlike' : 'Like'}
                        >
                          <Heart className={\`w-4 h-4 \${favorites.includes(track.id) ? 'fill-current' : ''}\`} />
                        </button>

                        <div className="flex gap-1.5">
                          {playlists.length > 0 && (
                            <button
                              onClick={() => setPlaylistMenuTrack(track)}
                              className="p-1.5 rounded-full backdrop-blur-md bg-black/40 hover:bg-black/60 text-white transition-colors"
                              title="Add to playlist"
                            >
                              <ListPlus className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => addToQueue(track)}
                            className="p-1.5 rounded-full backdrop-blur-md bg-black/40 hover:bg-black/60 text-white transition-colors"
                            title="Add to queue"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-center bg-neutral-900/50">
                    <h4 className="font-semibold text-sm text-white group-hover:text-emerald-300 transition-colors line-clamp-1" title={track.title}>
                      {track.title}
                    </h4>
                    <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5" title={track.artist}>
                      {track.artist}
                    </p>
                  </div>
                </div>
              ))}
            </div>\n              `;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync('src/components/SearchModal.tsx', content);
  console.log('Success');
} else {
  console.log('Target not found.');
}
