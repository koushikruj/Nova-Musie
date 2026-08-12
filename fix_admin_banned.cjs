const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const target = `                  ))}
                </div>
              )}
            </div>
          )}

{/* TAB: AUDIT LOGS */}`;

const replacement = `                  ))}
                </div>
              )}
                </div>
              </div>
            </div>
          )}

{/* TAB: AUDIT LOGS */}`;

content = content.replace(target, replacement);

fs.writeFileSync('src/components/AdminModal.tsx', content);
console.log('Fixed banned list');
