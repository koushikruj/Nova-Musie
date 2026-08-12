const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const endPlaylistsTarget = `                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}`;
const endPlaylistsReplacement = `                      )}
                    </div>
                  ))}
                </div>
              )}
                </div>
              </div>
            </div>
          )}`;

content = content.replace(endPlaylistsTarget, endPlaylistsReplacement);

fs.writeFileSync('src/components/AdminModal.tsx', content);
console.log('Done playlists wrapper');
