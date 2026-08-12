import { GoogleGenAI } from "@google/genai";
import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import yts from 'yt-search';



async function processLyrics(text: string, language: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY || !text) return text;
  const langLower = String(language || '').toLowerCase();
  
  if (langLower !== 'hindi' && langLower !== 'bengali') {
    return text; // No transliteration needed for English or others
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    let prompt = "";
    if (langLower === 'hindi') {
      prompt = `Transliterate the following lyrics into Hinglish (Latin alphabet representing conversational Hindi). Preserve all exact timestamp tags (e.g. [00:12.34]) and line breaks without any modifications. Do not translate the meaning, only transliterate the script. If the text is already Hinglish or English, leave it as is. Do not use markdown formatting or markdown code blocks in your response. Just output the raw lyrics text.\n\nLyrics:\n${text}`;
    } else if (langLower === 'bengali') {
      prompt = `Ensure the following lyrics are written in the Bengali script (Bengali alphabet). If they are in Latin/English characters, transliterate them to Bengali script. Preserve all exact timestamp tags (e.g. [00:12.34]) and line breaks without any modifications. Do not translate the meaning, only transliterate the script. Do not use markdown formatting or markdown code blocks in your response. Just output the raw lyrics text.\n\nLyrics:\n${text}`;
    }
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || text;
  } catch (error) {
    console.error("Lyrics processing error:", error);
    return text;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory data store for backend API demonstration
  let tracks = [
    {
      id: 'track-1',
      title: 'Midnight Rain & Nova Chill',
      artist: 'Velvet Lounge',
      album: 'Nocturne Echoes',
      albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
      audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
      duration: 145,
      genre: 'Lo-Fi / Chill',
      year: 2024
    },
    {
      id: 'track-2',
      title: 'Neon Horizon',
      artist: 'Cyber Noir',
      album: 'Synthetic Dreams',
      albumArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800&auto=format&fit=crop',
      audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=chill-abstract-intention-12099.mp3',
      duration: 132,
      genre: 'Synthwave',
      year: 2024
    },
    {
      id: 'track-3',
      title: 'Acoustic Solitude',
      artist: 'Ember & Strings',
      album: 'Fireside Sessions',
      albumArt: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=800&auto=format&fit=crop',
      audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=flute-and-guitar-acoustic-chill-11438.mp3',
      duration: 168,
      genre: 'Acoustic',
      year: 2023
    },
    {
      id: 'track-4',
      title: 'Velvet Jazz After Dark',
      artist: 'The Midnight Trio',
      album: 'Nova After Hours',
      albumArt: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800&auto=format&fit=crop',
      audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f60f68.mp3?filename=smooth-waters-115977.mp3',
      duration: 195,
      genre: 'Smooth Jazz',
      year: 2024
    }
  ];

  let playlists = [
    {
      id: 'playlist-nova-classics',
      name: 'Nova Essentials',
      description: 'The definitive minimal lounge and lo-fi curation.',
      coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
      trackIds: ['track-1', 'track-2', 'track-4'],
      createdAt: new Date().toISOString()
    }
  ];

  // API Routes
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Nova Radio Engine',
      timestamp: new Date().toISOString(),
      activeListeners: Math.floor(12 + Math.random() * 48)
    });
  });

  // Spotify Playlist / Track / Album Import Endpoint
  app.post('/api/spotify/playlist', async (req: Request, res: Response) => {
    try {
      const { spotifyUrl } = req.body;
      if (!spotifyUrl || typeof spotifyUrl !== 'string') {
        return res.status(400).json({ error: 'Please provide a valid Spotify URL or ID.' });
      }

      // Extract Spotify ID and Type (playlist, track, album)
      let type = 'playlist';
      let spotifyId = '';

      const match = spotifyUrl.match(/(playlist|track|album)[/:]([a-zA-Z0-9]{22})/);
      if (match) {
        type = match[1];
        spotifyId = match[2];
      } else if (/^[a-zA-Z0-9]{22}$/.test(spotifyUrl.trim())) {
        spotifyId = spotifyUrl.trim();
      } else {
        return res.status(400).json({ error: 'Could not extract a valid 22-character Spotify ID.' });
      }

      console.log(`Processing Spotify Import for Type: ${type}, ID: ${spotifyId}`);

      let playlistName = type === 'track' ? 'Spotify Single Track' : 'Imported Spotify Playlist';
      let playlistDesc = 'Auto-created from Spotify curation';
      let coverImage = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop';
      let rawTracks: Array<{ title: string; artist: string; duration?: number; spotifyPreview?: string }> = [];

      // Royalty-free fallback audio streams if previews are restricted
      const fallbackAudioUrls = [
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3'
      ];

      // Step 1: Fetch Spotify oEmbed Metadata
      try {
        const oembedRes = await fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/${type}/${spotifyId}`);
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          if (oembedData.title) playlistName = oembedData.title;
          if (oembedData.thumbnail_url) coverImage = oembedData.thumbnail_url;
        }
      } catch (e) {
        console.warn('oEmbed fetch error:', e);
      }

      // Step 2: Fetch Spotify Embed Page & Extract NEXT_DATA Tracklist
      try {
        const embedRes = await fetch(`https://open.spotify.com/embed/${type}/${spotifyId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });

        if (embedRes.ok) {
          const html = await embedRes.text();
          const matchData = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);

          if (matchData) {
            const nextData = JSON.parse(matchData[1]);
            const entity = nextData?.props?.pageProps?.state?.data?.entity || nextData?.props?.pageProps?.entity;

            if (entity) {
              if (entity.name) playlistName = entity.name;
              else if (entity.title) playlistName = entity.title;

              if (entity.subtitle) playlistDesc = entity.subtitle;
              else if (entity.description) playlistDesc = entity.description.replace(/<[^>]*>?/gm, '');

              if (entity.coverArt?.sources?.[0]?.url) {
                coverImage = entity.coverArt.sources[0].url;
              }

              if (type === 'track') {
                const trackTitle = entity.title || entity.name;
                const trackArtist = entity.artists?.[0]?.name || entity.subtitle || 'Spotify Artist';
                if (trackTitle) {
                  rawTracks.push({
                    title: trackTitle,
                    artist: trackArtist,
                    duration: entity.duration ? Math.round(entity.duration / 1000) : 180,
                    spotifyPreview: entity.audioPreview?.url
                  });
                }
              } else if (Array.isArray(entity.trackList)) {
                entity.trackList.forEach((t: any) => {
                  const trackTitle = t.title || t.name;
                  const trackArtist = t.subtitle || t.artists?.[0]?.name || 'Spotify Artist';
                  if (trackTitle) {
                    rawTracks.push({
                      title: trackTitle,
                      artist: trackArtist,
                      duration: t.duration ? Math.round(t.duration / 1000) : 180,
                      spotifyPreview: t.audioPreview?.url
                    });
                  }
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('Embed scraping error:', err);
      }

      // Step 3: If rawTracks is empty, search iTunes directly for the playlistName to get real songs
      if (rawTracks.length === 0) {
        console.log(`No direct tracklist in embed, searching iTunes for playlist name: "${playlistName}"`);
        try {
          const searchTerm = playlistName && playlistName !== 'Imported Spotify Playlist' ? playlistName : 'Top Hits';
          const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song&limit=15`);
          if (itunesRes.ok) {
            const data = await itunesRes.json();
            if (Array.isArray(data.results)) {
              data.results.forEach((s: any) => {
                if (s.trackName && s.artistName) {
                  rawTracks.push({
                    title: s.trackName,
                    artist: s.artistName,
                    duration: s.trackTimeMillis ? Math.round(s.trackTimeMillis / 1000) : 180,
                    spotifyPreview: s.previewUrl
                  });
                }
              });
            }
          }
        } catch (e) {
          console.warn('iTunes direct search fallback error:', e);
        }
      }

      // Step 4: Enrich raw tracks via iTunes Search API and YouTube Search to get full audio
      const enrichedTracks = await Promise.all(
        rawTracks.slice(0, 30).map(async (t, idx) => {
          const query = `${t.title} ${t.artist}`;
          let itunesMatch: any = null;
          let ytMatch: any = null;

          try {
            const [itunesRes, ytRes] = await Promise.all([
              fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`).catch(() => null),
              yts(query).catch(() => null)
            ]);

            if (itunesRes && itunesRes.ok) {
              const data = await itunesRes.json();
              if (data.results?.[0]) {
                itunesMatch = data.results[0];
              }
            }

            if (ytRes && ytRes.videos && ytRes.videos.length > 0) {
              ytMatch = ytRes.videos[0];
            }
          } catch (e) {
            // Silently fall back to raw track data
          }

          const trackTitle = itunesMatch?.trackName || t.title;
          const trackArtist = itunesMatch?.artistName || t.artist;
          const trackAlbum = itunesMatch?.collectionName || playlistName;
          const trackArt = itunesMatch?.artworkUrl100
            ? itunesMatch.artworkUrl100.replace('100x100bb', '600x600bb')
            : coverImage;
          
          let trackAudio = null;
          let trackDuration = itunesMatch?.trackTimeMillis ? Math.round(itunesMatch.trackTimeMillis / 1000) : (t.duration || 180);
          
          if (ytMatch && ytMatch.videoId) {
            trackAudio = `youtube:${ytMatch.videoId}`;
            trackDuration = ytMatch.seconds || trackDuration;
          } else {
            try {
              const fallbackYt = await yts(trackTitle).catch(() => null);
              if (fallbackYt && fallbackYt.videos && fallbackYt.videos.length > 0) {
                trackAudio = `youtube:${fallbackYt.videos[0].videoId}`;
                trackDuration = fallbackYt.videos[0].seconds || 210;
              } else {
                trackAudio = 'youtube:BEYCEq1m6kk';
                trackDuration = 210;
              }
            } catch (e) {
              trackAudio = 'youtube:BEYCEq1m6kk';
              trackDuration = 210;
            }
          }

          const trackGenre = itunesMatch?.primaryGenreName || 'Pop';
          const trackYear = itunesMatch?.releaseDate ? new Date(itunesMatch.releaseDate).getFullYear() : 2024;

          return {
            id: `spotify-${spotifyId}-${idx}-${Date.now()}`,
            title: trackTitle,
            artist: trackArtist,
            album: trackAlbum,
            albumArt: trackArt,
            audioUrl: trackAudio,
            duration: trackDuration,
            genre: trackGenre,
            year: trackYear
          };
        })
      );

      return res.status(200).json({
        success: true,
        playlist: {
          id: `playlist-spotify-${spotifyId}-${Date.now()}`,
          name: playlistName,
          description: playlistDesc,
          coverImage: enrichedTracks[0]?.albumArt || coverImage,
          trackIds: enrichedTracks.map(t => t.id),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          spotifyId: spotifyId
        },
        tracks: enrichedTracks
      });

    } catch (error: any) {
      console.error('Error importing Spotify playlist:', error);
      res.status(500).json({ error: error?.message || 'Failed to import Spotify playlist.' });
    }
  });

  // Spotify & YouTube Music / Online Live Track Search Endpoint
  app.get('/api/spotify/search', async (req: Request, res: Response) => {
    try {
      const q = req.query.q ? String(req.query.q).trim() : 'Top Music Hits';
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const offset = (page - 1) * 10;

      console.log(`Live online track search for: "${q}" (Page ${page})`);

      // Determine query variations for pagination/related content
      let searchQuery = q;
      if (page === 2) searchQuery = `${q} song audio`;
      else if (page === 3) searchQuery = `${q} remix playlist`;
      else if (page > 3) searchQuery = `${q} related tracks`;

      // Parallel fetch: Direct YouTube Music search + iTunes metadata search
      const ytPromise = yts(searchQuery).catch(() => null);
      const itunesPromise = fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=10&offset=${offset}`)
        .then(r => r.ok ? r.json() : { results: [] })
        .catch(() => ({ results: [] }));

      const [ytData, itunesData] = await Promise.all([ytPromise, itunesPromise]);

      const searchResults: any[] = [];
      const seenKeys = new Set<string>();

      // 1. YouTube Music direct search results
      if (ytData && ytData.videos && ytData.videos.length > 0) {
        ytData.videos.slice(0, 10).forEach((v: any, idx: number) => {
          if (!v.videoId) return;
          const key = `${v.title}-${v.author?.name}`.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            searchResults.push({
              id: `ytm-${v.videoId}-p${page}-${idx}`,
              title: v.title,
              artist: v.author?.name || 'YouTube Music Artist',
              album: 'YouTube Music',
              albumArt: v.image || v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
              audioUrl: `youtube:${v.videoId}`,
              duration: v.seconds || 210,
              genre: 'YouTube Music',
              year: new Date().getFullYear(),
              description: `YouTube Music track: ${v.title}`
            });
          }
        });
      }

      // 2. iTunes / Spotify metadata search results
      if (itunesData && Array.isArray(itunesData.results)) {
        const itunesPromises = itunesData.results.slice(0, 10).map(async (s: any, idx: number) => {
          const key = `${s.trackName}-${s.artistName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (seenKeys.has(key)) return null;
          seenKeys.add(key);

          const query = `${s.trackName} ${s.artistName}`;
          let trackAudio = null;
          let trackDuration = s.trackTimeMillis ? Math.round(s.trackTimeMillis / 1000) : 180;

          try {
            const ytRes = await yts(query);
            if (ytRes && ytRes.videos && ytRes.videos.length > 0) {
              trackAudio = `youtube:${ytRes.videos[0].videoId}`;
              trackDuration = ytRes.videos[0].seconds || trackDuration;
            }
          } catch (e) {}

          if (!trackAudio) {
            try {
              const fallbackYt = await yts(s.trackName).catch(() => null);
              if (fallbackYt && fallbackYt.videos && fallbackYt.videos.length > 0) {
                trackAudio = `youtube:${fallbackYt.videos[0].videoId}`;
                trackDuration = fallbackYt.videos[0].seconds || 210;
              } else {
                trackAudio = 'youtube:BEYCEq1m6kk';
                trackDuration = 210;
              }
            } catch (e) {
              trackAudio = 'youtube:BEYCEq1m6kk';
              trackDuration = 210;
            }
          }

          return {
            id: `search-${s.trackId || idx}-p${page}-${Date.now()}`,
            title: s.trackName,
            artist: s.artistName,
            album: s.collectionName || 'Single',
            albumArt: s.artworkUrl100 ? s.artworkUrl100.replace('100x100bb', '600x600bb') : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
            audioUrl: trackAudio,
            duration: trackDuration,
            genre: s.primaryGenreName || 'Pop',
            year: s.releaseDate ? new Date(s.releaseDate).getFullYear() : 2024,
            description: `Live Spotify track import for ${s.trackName} by ${s.artistName}`
          };
        });

        const resolvedItunes = await Promise.all(itunesPromises);
        resolvedItunes.forEach(t => {
          if (t && t.title && t.artist) searchResults.push(t);
        });
      }

      return res.json(searchResults);
    } catch (err: any) {
      console.error('Live track search error:', err);
      return res.status(500).json({ error: 'Failed to perform live song search' });
    }
  });

  app.get('/api/tracks', (req: Request, res: Response) => {
    const search = req.query.q ? String(req.query.q).toLowerCase() : '';
    if (search) {
      const filtered = tracks.filter(t =>
        t.title.toLowerCase().includes(search) ||
        t.artist.toLowerCase().includes(search) ||
        t.album.toLowerCase().includes(search) ||
        t.genre.toLowerCase().includes(search)
      );
      return res.json(filtered);
    }
    res.json(tracks);
  });

  app.get('/api/tracks/:id', (req: Request, res: Response) => {
    const track = tracks.find(t => t.id === req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    res.json(track);
  });

  app.post('/api/tracks', (req: Request, res: Response) => {
    const { title, artist, album, albumArt, audioUrl, duration, genre, year } = req.body;
    if (!title || !artist || !audioUrl) {
      return res.status(400).json({ error: 'Title, artist, and audioUrl are required.' });
    }

    const newTrack = {
      id: `track-${Date.now()}`,
      title,
      artist,
      album: album || 'Single',
      albumArt: albumArt || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
      audioUrl,
      duration: duration || 180,
      genre: genre || 'Lounge',
      year: year || new Date().getFullYear()
    };

    tracks.unshift(newTrack);
    res.status(201).json(newTrack);
  });

  app.delete('/api/tracks/:id', (req: Request, res: Response) => {
    tracks = tracks.filter(t => t.id !== req.params.id);
    res.json({ success: true, message: 'Track deleted' });
  });

  app.get('/api/playlists', (req: Request, res: Response) => {
    res.json(playlists);
  });

  app.post('/api/playlists', (req: Request, res: Response) => {
    const { name, description, coverImage, trackIds } = req.body;
    const newPlaylist = {
      id: `playlist-${Date.now()}`,
      name: name || 'New Playlist',
      description: description || '',
      coverImage: coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
      trackIds: Array.isArray(trackIds) ? trackIds : [],
      createdAt: new Date().toISOString()
    };

    playlists.unshift(newPlaylist);
    res.status(201).json(newPlaylist);
  });

  app.get('/api/stats', (req: Request, res: Response) => {
    res.json({
      trackCount: tracks.length,
      playlistCount: playlists.length,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    });
  });

  app.get('/api/lyrics', async (req: Request, res: Response) => {
    try {
      const { title, artist, language } = req.query;
      if (!title || !artist) {
        return res.status(400).json({ error: 'Title and artist are required' });
      }

      // Try exact match first
      const exactRes = await fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(String(title))}&artist_name=${encodeURIComponent(String(artist))}`);
      if (exactRes.ok) {
        const data = await exactRes.json();
        if (data.syncedLyrics) data.syncedLyrics = await processLyrics(data.syncedLyrics, String(language || ''));
        if (data.plainLyrics) data.plainLyrics = await processLyrics(data.plainLyrics, String(language || ''));
        return res.json(data);
      }

      // Fallback to search
      const q = `${title} ${artist}`;
      const searchRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`);
      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data && data.length > 0) {
          let first = data[0];
          if (first.syncedLyrics) first.syncedLyrics = await processLyrics(first.syncedLyrics, String(language || ''));
          if (first.plainLyrics) first.plainLyrics = await processLyrics(first.plainLyrics, String(language || ''));
          return res.json(first);
        }
      }

      return res.status(404).json({ error: 'Lyrics not found' });
    } catch (error: any) {
      console.error('Lyrics fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch lyrics' });
    }
  });


  app.get('/api/metadata', async (req: Request, res: Response) => {
    try {
      const url = req.query.url ? String(req.query.url).trim() : '';
      if (!url) return res.status(400).json({ error: 'URL is required' });

      let title = 'Unknown Title';
      let artist = 'Unknown Artist';
      let albumArt = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop';
      let duration = 180;
      let finalAudioUrl = url;

      // Check if YouTube URL
      const ytMatch = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
      
      if (ytMatch && ytMatch[1]) {
        const videoId = ytMatch[1];
        try {
          const ytData = await yts({ videoId });
          if (ytData) {
            title = ytData.title || title;
            artist = ytData.author?.name || artist;
            albumArt = ytData.image || ytData.thumbnail || albumArt;
            duration = ytData.seconds || duration;
            finalAudioUrl = `youtube:${videoId}`;
          }
        } catch (ytErr) {
          console.error('yt-search error:', ytErr);
          finalAudioUrl = `youtube:${videoId}`;
        }
      } else {
        // Fallback for direct MP3 or stream
        try {
          const urlObj = new URL(url);
          const pathname = urlObj.pathname;
          const filename = pathname.split('/').pop();
          if (filename) {
            title = decodeURIComponent(filename).replace(/\.[^/.]+$/, ""); // Remove extension
          } else {
            title = urlObj.hostname;
          }
        } catch (e) {
          // Invalid URL, keep defaults
        }
      }

      return res.json({
        title,
        artist,
        albumArt,
        duration,
        audioUrl: finalAudioUrl
      });
    } catch (err: any) {
      console.error('Metadata fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch metadata' });
    }
  });

  // Track full resolution endpoint
  app.post('/api/tracks/resolve-full', async (req: Request, res: Response) => {
    try {
      const { title, artist } = req.body;
      const cleanTitle = (title || 'Song').trim();
      const cleanArtist = (artist || '').trim();
      const query = `${cleanTitle} ${cleanArtist}`.trim();
      
      let ytRes = await yts(query).catch(() => null);
      if (!ytRes || !ytRes.videos || ytRes.videos.length === 0) {
        ytRes = await yts(cleanTitle).catch(() => null);
      }
      if (ytRes && ytRes.videos && ytRes.videos.length > 0) {
        const topVideo = ytRes.videos[0];
        return res.json({
          success: true,
          audioUrl: `youtube:${topVideo.videoId}`,
          duration: topVideo.seconds || 210
        });
      }
      return res.json({
        success: true,
        audioUrl: 'youtube:BEYCEq1m6kk',
        duration: 210
      });
    } catch (err: any) {
      console.error('Track resolve-full error:', err);
      return res.json({
        success: true,
        audioUrl: 'youtube:BEYCEq1m6kk',
        duration: 210
      });
    }
  });

  // CORS-free audio proxy endpoint for Web Audio API Equalizer
  app.get('/api/proxy-audio', async (req: Request, res: Response) => {
    try {
      const targetUrl = req.query.url ? String(req.query.url) : '';
      if (!targetUrl) return res.status(400).send('URL is required');

      const audioRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', audioRes.headers.get('content-type') || 'audio/mpeg');
      const arrayBuffer = await audioRes.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.error('Audio proxy error:', err);
      res.status(500).send('Proxy audio error');
    }
  });

  // Vite middleware for dev or static serving for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nova Music Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
