const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

// Inject states
const stateInjectionPoint = `  const [customTrackForm, setCustomTrackForm] = useState({ title: '', artist: '', audioUrl: '', albumArt: '' });`;
const newStates = `
  const [showYoutubeImport, setShowYoutubeImport] = useState(false);
  const [youtubeForm, setYoutubeForm] = useState({ url: '', playlistId: '', contentType: 'Music', category: 'General', isFeatured: false, status: 'Published' });
  const [youtubePreview, setYoutubePreview] = useState<any>(null);
  const [isFetchingYoutube, setIsFetchingYoutube] = useState(false);
`;
code = code.replace(stateInjectionPoint, stateInjectionPoint + '\n' + newStates);

// Make sure the default playlist ID is set if it's empty
const effectInjectionPoint = `  const pendingRequestsCount = subscriptionRequests.length;`;
const newEffect = `
  useEffect(() => {
    if (playlists.length > 0 && !youtubeForm.playlistId) {
      setYoutubeForm(prev => ({ ...prev, playlistId: playlists[0].id }));
    }
  }, [playlists, youtubeForm.playlistId]);
`;
code = code.replace(effectInjectionPoint, newEffect + '\n' + effectInjectionPoint);

fs.writeFileSync('src/components/AdminModal.tsx', code);
console.log("Injected states");
