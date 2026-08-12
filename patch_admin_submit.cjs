const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const targetVideo = `                                  await addCustomTrackToPlaylist(youtubeForm.playlistId, {
                                    title: youtubePreview.title,
                                    artist: youtubePreview.channelName,
                                    audioUrl: youtubePreview.youtubeUrl,
                                    albumArt: youtubePreview.thumbnailUrl
                                  });`;

const replacementVideo = `                                  await addCustomTrackToPlaylist(youtubeForm.playlistId, {
                                    title: youtubePreview.title,
                                    artist: youtubePreview.channelName,
                                    audioUrl: youtubePreview.youtubeUrl,
                                    albumArt: youtubePreview.thumbnailUrl,
                                    description: youtubePreview.description,
                                    duration: youtubePreview.duration,
                                    youtubeVideoId: youtubePreview.videoId,
                                    youtubeUrl: youtubePreview.youtubeUrl,
                                    embedUrl: youtubePreview.embedUrl,
                                    channelName: youtubePreview.channelName,
                                    channelId: youtubePreview.channelId,
                                    publishedAt: youtubePreview.publishedAt,
                                    viewCount: youtubePreview.viewCount,
                                    contentType: youtubeForm.contentType,
                                    category: youtubeForm.category,
                                    isFeatured: youtubeForm.isFeatured,
                                    status: youtubeForm.status,
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString()
                                  });`;

code = code.replace(targetVideo, replacementVideo);

const targetPlaylist = `                                    await addCustomTrackToPlaylist(youtubeForm.playlistId, {
                                      title: item.title,
                                      artist: item.channelName,
                                      audioUrl: item.youtubeUrl,
                                      albumArt: item.thumbnailUrl
                                    });`;

const replacementPlaylist = `                                    await addCustomTrackToPlaylist(youtubeForm.playlistId, {
                                      title: item.title,
                                      artist: item.channelName,
                                      audioUrl: item.youtubeUrl,
                                      albumArt: item.thumbnailUrl,
                                      description: item.description,
                                      duration: item.duration,
                                      youtubeVideoId: item.videoId,
                                      youtubeUrl: item.youtubeUrl,
                                      embedUrl: \`https://www.youtube.com/embed/\${item.videoId}\`,
                                      channelName: item.channelName,
                                      channelId: item.channelId,
                                      publishedAt: item.publishedAt,
                                      viewCount: item.viewCount,
                                      contentType: youtubeForm.contentType,
                                      category: youtubeForm.category,
                                      isFeatured: youtubeForm.isFeatured,
                                      status: youtubeForm.status,
                                      createdAt: new Date().toISOString(),
                                      updatedAt: new Date().toISOString()
                                    });`;

code = code.replace(targetPlaylist, replacementPlaylist);

fs.writeFileSync('src/components/AdminModal.tsx', code);
console.log("Updated AdminModal.tsx submission payload");
