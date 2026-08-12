const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const importStatement = `import path from 'path';\n`;
if (!code.includes('import axios')) {
    // Wait, axios isn't installed. I can just use native fetch.
}

const newEndpoint = `
  // --- YOUTUBE DATA API ENDPOINT ---
  app.get('/api/youtube/fetch', async (req: Request, res: Response) => {
    try {
      const url = req.query.url ? String(req.query.url).trim() : '';
      if (!url) return res.status(400).json({ error: 'URL is required' });

      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'YOUTUBE_API_KEY is not configured on the server.' });
      }

      // Check for Playlist
      const playlistMatch = url.match(/[?&]list=([^#\\&\\?]+)/);
      if (playlistMatch && playlistMatch[1]) {
        const playlistId = playlistMatch[1];
        
        // Fetch playlist details
        const plRes = await fetch(\`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=\${playlistId}&key=\${apiKey}\`);
        if (!plRes.ok) throw new Error('YouTube API Playlist error');
        const plData = await plRes.json();
        
        if (!plData.items || plData.items.length === 0) {
          return res.status(404).json({ error: 'Playlist not found or is private' });
        }
        const plSnippet = plData.items[0].snippet;

        // Fetch playlist items
        let items: any[] = [];
        let nextPageToken = '';
        // Fetch up to 50 items for preview
        const itemsRes = await fetch(\`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=\${playlistId}&key=\${apiKey}\`);
        if (itemsRes.ok) {
           const itemsData = await itemsRes.json();
           
           // To get duration and view count, we need the actual video details
           const videoIds = itemsData.items.map((i: any) => i.contentDetails.videoId).filter(Boolean);
           
           if (videoIds.length > 0) {
             const videosRes = await fetch(\`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=\${videoIds.join(',')}&key=\${apiKey}\`);
             if (videosRes.ok) {
                const videosData = await videosRes.json();
                items = videosData.items.map((v: any) => {
                    const durationStr = v.contentDetails?.duration || 'PT0S';
                    // Parse ISO 8601 duration
                    const match = durationStr.match(/PT(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)S)?/);
                    let seconds = 0;
                    if (match) {
                        seconds += (parseInt(match[1]) || 0) * 3600;
                        seconds += (parseInt(match[2]) || 0) * 60;
                        seconds += (parseInt(match[3]) || 0);
                    }
                    return {
                        videoId: v.id,
                        youtubeUrl: \`https://youtube.com/watch?v=\${v.id}\`,
                        title: v.snippet.title,
                        description: v.snippet.description,
                        channelName: v.snippet.channelTitle,
                        channelId: v.snippet.channelId,
                        thumbnailUrl: v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url,
                        duration: seconds,
                        publishedAt: v.snippet.publishedAt,
                        viewCount: v.statistics?.viewCount || '0'
                    };
                });
             }
           }
        }

        return res.json({
          type: 'playlist',
          title: plSnippet.title,
          channelName: plSnippet.channelTitle,
          thumbnailUrl: plSnippet.thumbnails?.maxres?.url || plSnippet.thumbnails?.high?.url || plSnippet.thumbnails?.default?.url,
          videoCount: items.length,
          items: items
        });
      }

      // Check for Video
      const ytMatch = url.match(/(?:youtube\\.com\\/(?:[^/]+\\/.+\\/|(?:v|e(?:mbed)?)\\/|.*[?&]v=)|youtu\\.be\\/)([^"&?\\/\\s]{11})/i);
      if (ytMatch && ytMatch[1]) {
        const videoId = ytMatch[1];
        const vRes = await fetch(\`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=\${videoId}&key=\${apiKey}\`);
        if (!vRes.ok) {
           // Handle quota or other API errors
           if (vRes.status === 403) return res.status(403).json({ error: 'YouTube API limit has been reached. Please try again later.' });
           throw new Error('YouTube API Video error');
        }
        const vData = await vRes.json();
        
        if (!vData.items || vData.items.length === 0) {
          return res.status(404).json({ error: 'This YouTube video could not be found or is private.' });
        }
        const v = vData.items[0];

        const durationStr = v.contentDetails?.duration || 'PT0S';
        const match = durationStr.match(/PT(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)S)?/);
        let seconds = 0;
        if (match) {
            seconds += (parseInt(match[1]) || 0) * 3600;
            seconds += (parseInt(match[2]) || 0) * 60;
            seconds += (parseInt(match[3]) || 0);
        }

        return res.json({
          type: 'video',
          videoId: v.id,
          youtubeUrl: \`https://youtube.com/watch?v=\${v.id}\`,
          embedUrl: \`https://www.youtube.com/embed/\${v.id}\`,
          title: v.snippet.title,
          description: v.snippet.description,
          channelName: v.snippet.channelTitle,
          channelId: v.snippet.channelId,
          thumbnailUrl: v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url,
          duration: seconds,
          publishedAt: v.snippet.publishedAt,
          viewCount: v.statistics?.viewCount || '0'
        });
      }

      return res.status(400).json({ error: 'Please enter a valid YouTube URL.' });

    } catch (error: any) {
      console.error('YouTube API proxy error:', error);
      res.status(500).json({ error: 'Unable to fetch YouTube information. Please try again.' });
    }
  });
`;

if (!code.includes('/api/youtube/fetch')) {
    code = code.replace(
        `app.get('/api/metadata', async (req: Request, res: Response) => {`,
        newEndpoint + `\n  app.get('/api/metadata', async (req: Request, res: Response) => {`
    );
    fs.writeFileSync('server.ts', code);
    console.log("Injected youtube api endpoint into server.ts");
}
