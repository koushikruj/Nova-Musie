import React, { useState, useEffect } from 'react';
import { X, LogIn, UserPlus, Flame, AlertCircle, Loader2, Copy, Check, LogOut, Crown, Edit3, Save } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { 
  initFirebaseService, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  fetchOrCreateUserProfile,
  signOut
} from '../services/firebase';

export const AuthModal: React.FC = () => {
  const { activeDrawer, setActiveDrawer, showToast, userProfile, setUserProfile, updateProfileName } = usePlayer();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState<boolean>(false);

  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>('');

  useEffect(() => {
    if (userProfile?.displayName) {
      setEditedName(userProfile.displayName);
    }
  }, [userProfile?.displayName]);

  if (activeDrawer !== 'auth') return null;

  const handleSignOut = async () => {
    try {
      const { auth } = initFirebaseService();
      if (auth) {
        await signOut(auth);
      }
    } catch (e) {
      console.warn('Sign out error:', e);
    } finally {
      setUserProfile(null);
      showToast('Signed out successfully.');
      setActiveDrawer(null);
    }
  };

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const copyDomainToClipboard = () => {
    if (currentDomain) {
      navigator.clipboard.writeText(currentDomain);
      setCopiedDomain(true);
      showToast(`Copied "${currentDomain}" to clipboard!`);
      setTimeout(() => setCopiedDomain(false), 3000);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const { auth } = initFirebaseService();
      if (!auth) throw new Error('Firebase Auth unavailable.');

      let userCred;
      if (mode === 'signin') {
        userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      }

      const profile = await fetchOrCreateUserProfile(userCred.user);
      setUserProfile(profile);
      showToast(`Welcome ${profile.displayName || profile.email}!`);
      setActiveDrawer(null);
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      const code = err?.code || '';
      const msg = err?.message || '';

      if (code === 'auth/email-already-in-use' || msg.includes('email-already-in-use')) {
        setError('This email address is already registered. Switch to Sign In to log into your existing account.');
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found' || msg.includes('invalid-credential')) {
        setError('Invalid email or password. Please verify your credentials.');
      } else if (code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(msg || 'Authentication failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const { auth } = initFirebaseService();
      if (!auth) throw new Error('Firebase Auth unavailable.');

      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const profile = await fetchOrCreateUserProfile(res.user);
      setUserProfile(profile);
      showToast(`Signed in as ${profile.displayName}!`);
      setActiveDrawer(null);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      const code = err?.code || '';
      const msg = err?.message || '';

      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setError(`unauthorized-domain:${currentDomain}`);
      } else if (code === 'auth/popup-closed-by-user') {
        setError('Google Sign-In popup was closed before completing.');
      } else if (code === 'auth/popup-blocked') {
        setError('Google Sign-In popup was blocked by your browser. Please allow popups for this site.');
      } else if (code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled in your Firebase Console (Auth > Sign-in method). Please use Email & Password below.');
      } else {
        setError(msg || 'Google sign-in failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-sm bg-neutral-950/90 border border-white/20 rounded-2xl shadow-2xl shadow-black overflow-hidden text-white flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-base">
              {userProfile ? 'Account Profile' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </h2>
          </div>
          <button
            onClick={() => setActiveDrawer(null)}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {userProfile ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-900 border border-white/10 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-lg shrink-0">
                    {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-white truncate">{userProfile.displayName || 'Music Fan'}</h3>
                      <button
                        onClick={() => setIsEditingName(!isEditingName)}
                        className="p-1 rounded text-neutral-400 hover:text-amber-300 transition-colors"
                        title="Edit Display Name"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {userProfile.isSubscribed ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black">Sur Premi PRO</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 text-neutral-400">You do not have any subscription</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">{userProfile.email || 'Logged in'}</p>
                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5 truncate">UID: {userProfile.uid}</p>
                  </div>
                </div>

                {/* Edit Display Name inline form */}
                {isEditingName && (
                  <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={e => setEditedName(e.target.value)}
                      placeholder="New display name..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-800 border border-amber-500/40 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={async () => {
                        if (editedName.trim()) {
                          await updateProfileName(editedName.trim());
                          setIsEditingName(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => setActiveDrawer('subscription')}
                  className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  View Subscription Status
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Mode Selector */}
              <div className="flex rounded-lg bg-neutral-900 p-1 border border-white/5 text-xs font-medium">
              <button
                onClick={() => setMode('signin')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  mode === 'signin' ? 'bg-amber-500 text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  mode === 'signup' ? 'bg-amber-500 text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className={`p-3 rounded-xl text-xs space-y-2 ${
                error.startsWith('unauthorized-domain:') 
                  ? 'bg-amber-950/70 border border-amber-500/40 text-amber-200' 
                  : 'bg-rose-950/60 border border-rose-500/40 text-rose-200'
              }`}>
                {error.startsWith('unauthorized-domain:') ? (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-300">Firebase Domain Authorization Required</p>
                        <p className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
                          This host domain must be added under <b>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains</b> for Google Sign-In.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-amber-500/20 font-mono text-[11px]">
                      <span className="truncate mr-2 text-amber-200">{error.split(':')[1]}</span>
                      <button
                        type="button"
                        onClick={copyDomainToClipboard}
                        className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded font-sans text-[10px] font-semibold transition-colors shrink-0"
                      >
                        {copiedDomain ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedDomain ? 'Copied' : 'Copy Domain'}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-amber-300/90 font-medium">
                      💡 You can log in or create an account right now using Email &amp; Password below:
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {error.includes('already registered') && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setError(null); }}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-[11px] transition-colors"
                    >
                      Switch to Sign In
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-400 font-medium">Email</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-neutral-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 font-medium">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-neutral-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all mt-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === 'signin' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create Account
                  </>
                )}
              </button>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-2 text-[10px] uppercase text-neutral-500 font-semibold tracking-wider">or</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continue with Google
            </button>
            </>
          )}
          </div>
      </div>
    </div>
  );
};
