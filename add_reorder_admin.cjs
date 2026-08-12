const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

// Destructure reorderPlaylistTracks
content = content.replace(
  'removeTrackFromPlaylist,',
  'removeTrackFromPlaylist,\n    reorderPlaylistTracks,'
);

// We want to add ChevronUp and ChevronDown buttons next to the X button for removing.
const target = `<button
                                      onClick={() => removeTrackFromPlaylist(playlist.id, trackId)}
                                      className="p-1.5 rounded-md text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                      title="Remove from playlist"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>`;

const replacement = `<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => index > 0 && reorderPlaylistTracks(playlist.id, index, index - 1)}
                                        disabled={index === 0}
                                        className="p-1.5 rounded-md text-neutral-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Move Up"
                                      >
                                        <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                                      </button>
                                      <button
                                        onClick={() => index < playlist.trackIds.length - 1 && reorderPlaylistTracks(playlist.id, index, index + 1)}
                                        disabled={index === playlist.trackIds.length - 1}
                                        className="p-1.5 rounded-md text-neutral-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Move Down"
                                      >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => removeTrackFromPlaylist(playlist.id, trackId)}
                                        className="p-1.5 rounded-md text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                        title="Remove from playlist"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>`;

const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = target.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
  fs.writeFileSync('src/components/AdminModal.tsx', normalizedContent.replace(normalizedTarget, replacement));
  console.log('Success');
} else {
  console.log('Target not found.');
}
