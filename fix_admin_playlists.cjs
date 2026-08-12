const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const target = `                  ))}
                </div>
              )}
            </div>
          )}


        </div>
      </div>

      {/* DELETE PLAYLIST CONFIRMATION MODAL */}`;

const replacement = `                  ))}
                </div>
              )}
                </div>
              </div>
            </div>
          )}


        </div>
      </div>

      {/* DELETE PLAYLIST CONFIRMATION MODAL */}`;

content = content.replace(target, replacement);

fs.writeFileSync('src/components/AdminModal.tsx', content);
console.log('Fixed playlists list');
