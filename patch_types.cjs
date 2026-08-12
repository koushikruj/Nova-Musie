const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const target = `  description?: string;
}`;

const replacement = `  description?: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  embedUrl?: string;
  channelName?: string;
  channelId?: string;
  publishedAt?: string;
  viewCount?: string;
  contentType?: string;
  category?: string;
  isFeatured?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/types.ts', code);
console.log("Updated types.ts");
