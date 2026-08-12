const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "if (!plRes.ok) throw new Error('YouTube API Playlist error');",
  "if (!plRes.ok) throw new Error('YouTube API Playlist error: ' + await plRes.text());"
);

code = code.replace(
  "throw new Error('YouTube API Video error');",
  "throw new Error('YouTube API Video error: ' + await vRes.text());"
);

fs.writeFileSync('server.ts', code);
console.log("Patched");
