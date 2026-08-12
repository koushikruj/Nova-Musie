const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "if (!plRes.ok) throw new Error('YouTube API Playlist error: ' + await plRes.text());",
  "if (!plRes.ok) throw new Error('YouTube API Playlist error');"
);

code = code.replace(
  "throw new Error('YouTube API Video error: ' + await vRes.text());",
  "throw new Error('YouTube API Video error');"
);

fs.writeFileSync('server.ts', code);
console.log("Reverted");
