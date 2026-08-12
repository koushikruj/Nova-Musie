const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target1 = `        if (!plRes.ok) throw new Error('YouTube API Playlist error');`;
const replace1 = `        if (!plRes.ok) {
           const errText = await plRes.text();
           console.error("YouTube API error:", errText);
           let msg = 'YouTube API Playlist error';
           try { const j = JSON.parse(errText); if (j.error && j.error.message) msg = j.error.message; } catch(e){}
           return res.status(plRes.status).json({ error: msg });
        }`;

const target2 = `        if (!vRes.ok) {
           // Handle quota or other API errors
           if (vRes.status === 403) return res.status(403).json({ error: 'YouTube API limit has been reached. Please try again later.' });
           throw new Error('YouTube API Video error');
        }`;
const replace2 = `        if (!vRes.ok) {
           const errText = await vRes.text();
           console.error("YouTube API error:", errText);
           let msg = 'YouTube API Video error';
           try { const j = JSON.parse(errText); if (j.error && j.error.message) msg = j.error.message; } catch(e){}
           return res.status(vRes.status).json({ error: msg });
        }`;

code = code.replace(target1, replace1);
code = code.replace(target2, replace2);

fs.writeFileSync('server.ts', code);
console.log("Patched error handling");
