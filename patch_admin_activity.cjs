const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

// Wrap Audit Logs
content = content.replace(
  '              <div className="space-y-2">',
  '              <div className="overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: \'touch\' }}>\n                <div className="space-y-2 min-w-[500px] sm:min-w-0">'
);
// End of audit logs
const auditEndTarget = `                  </div>
                ))}
              </div>
            </div>
          )}`;
const auditEndReplacement = `                  </div>
                ))}
              </div>
              </div>
            </div>
          )}`;
content = content.replace(auditEndTarget, auditEndReplacement);

// Wrap Content & Playlists
content = content.replace(
  '              {playlists.length === 0 ? (',
  '              <div className="overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: \'touch\' }}>\n                <div className="min-w-[600px] sm:min-w-0">\n              {playlists.length === 0 ? ('
);

// End of playlists
const playlistsEndTarget = `                          <div className="mt-4 space-y-2">`;
// Wait, I need to find the end of the `playlists` mapping.
