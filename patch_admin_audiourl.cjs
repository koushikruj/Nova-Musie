const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

// Replace audioUrl: youtubePreview.youtubeUrl -> audioUrl: `youtube:${youtubePreview.videoId}`
code = code.replace(
  'audioUrl: youtubePreview.youtubeUrl,',
  'audioUrl: `youtube:${youtubePreview.videoId}`,'
);

// Replace audioUrl: item.youtubeUrl -> audioUrl: `youtube:${item.videoId}`
code = code.replace(
  'audioUrl: item.youtubeUrl,',
  'audioUrl: `youtube:${item.videoId}`,'
);

fs.writeFileSync('src/components/AdminModal.tsx', code);
console.log("Fixed audioUrl in AdminModal");
