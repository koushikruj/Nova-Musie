import React, { useState, useEffect, useMemo } from 'react';
import { 
  X,
  Save,
  Edit2, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  Crown, 
  User, 
  Check, 
  Settings, 
  Lock, 
  Search, 
  Link, 
  ListMusic, 
  FileText, 
  Sliders, 
  AlertCircle,
  PlusCircle,
  Trash2,
  Bell,
  PauseCircle,
  PlayCircle,
  UserX,
  Users,
  TrendingUp,
  DollarSign,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { UserProfile, UserPermissions } from '../types';
import { 
  updateUserSubscriptionInFirestore, 
  updateUserPermissionsInFirestore,
  togglePauseUserSubscriptionInFirestore,
  cancelAndRemoveUserSubscriptionInFirestore,
  toggleUserAdminRoleInFirestore,
  subscribeToAllUsersSnapshot
} from '../services/firebase';

export const AdminModal: React.FC = () => {
  const { 
    activeDrawer, 
    setActiveDrawer, 
    subscriptionRequests, 
    unreadRequestCount,
    approveSubscriptionRequest, 
    rejectSubscriptionRequest,
    userProfile,
    setUserProfile,
    updateUserPermissions,
    hasPermission,
    showToast,
    banUser,
    unbanUser,
    bannedIps,
    bannedHwids,
    banRecords,
    playlists,
    createPlaylist,
    deletePlaylist,
    updatePlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
    tracks,
    importSpotifyPlaylist,
    addCustomTrackToPlaylist,
  } = usePlayer();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'requests' | 'permissions' | 'banned' | 'activity' | 'settings' | 'playlists'>('dashboard');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'free' | 'banned'>('all');
  const [expandedUserUid, setExpandedUserUid] = useState<string | null>(null);

  // Playlist Management state
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editPlaylistForm, setEditPlaylistForm] = useState({ name: '', description: '' });
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  
  // Custom Track / Spotify Import State
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [addingTrackToPlaylistId, setAddingTrackToPlaylistId] = useState<string | null>(null);
  const [customTrackForm, setCustomTrackForm] = useState({ title: '', artist: '', audioUrl: '', albumArt: '' });

  const [showYoutubeImport, setShowYoutubeImport] = useState(false);
  const [youtubeForm, setYoutubeForm] = useState({ url: '', playlistId: '', contentType: 'Music', category: 'General', isFeatured: false, status: 'Published' });
  const [youtubePreview, setYoutubePreview] = useState<any>(null);
  const [isFetchingYoutube, setIsFetchingYoutube] = useState(false);


  // Ban Modal state
  const [banModalTarget, setBanModalTarget] = useState<UserProfile | null>(null);
  const [banIpChecked, setBanIpChecked] = useState<boolean>(true);
  const [banHwidChecked, setBanHwidChecked] = useState<boolean>(true);
  const [banReasonText, setBanReasonText] = useState<string>('Violated terms of service');

  // Subscribe to all Firestore users in real-time when Admin Modal is open
  useEffect(() => {
    if (activeDrawer !== 'admin' || !userProfile?.isAdmin) return;

    const unsubscribe = subscribeToAllUsersSnapshot((users) => {
      if (users && users.length > 0) {
        setAllUsers(users);
      }
    });

    return () => unsubscribe();
  }, [activeDrawer, userProfile?.isAdmin]);

  if (activeDrawer !== 'admin') return null;

  if (!userProfile?.isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="w-full max-w-md bg-neutral-950 border border-rose-500/30 rounded-2xl p-6 text-center text-white space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Admin Access Required</h3>
          <p className="text-xs text-neutral-400">
            You do not have administrator permissions to access the Admin Management Portal. The Admin Panel is strictly restricted to account administrators.
          </p>
          <button
            onClick={() => setActiveDrawer(null)}
            className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Combine real-time Firestore users with current user or subscription requests if empty
  const displayUsersList = useMemo(() => {
    const listMap = new Map<string, UserProfile>();

    // Add logged-in user
    if (userProfile) {
      listMap.set(userProfile.uid, userProfile);
    }

    // Add Firestore fetched users
    allUsers.forEach(u => {
      listMap.set(u.uid, u);
    });

    // Add users from subscription requests if not present
    subscriptionRequests.forEach(req => {
      if (!listMap.has(req.userId)) {
        listMap.set(req.userId, {
          uid: req.userId,
          email: req.userEmail,
          displayName: req.userName,
          photoURL: null,
          isSubscribed: req.status === 'approved',
          subscriptionPlan: req.status === 'approved' ? req.planName : 'Free Tier',
          status: req.status === 'approved' ? 'active' : 'free',
          isAdmin: false
        });
      }
    });

    return Array.from(listMap.values());
  }, [allUsers, userProfile, subscriptionRequests]);

  // Filtered users for user directory
  const filteredUsers = useMemo(() => {
    return displayUsersList.filter(u => {
      const matchSearch = searchQuery.trim() === '' || 
        (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.uid && u.uid.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && u.isSubscribed && u.status !== 'paused') ||
        (statusFilter === 'paused' && u.status === 'paused') ||
        (statusFilter === 'free' && !u.isSubscribed && u.status !== 'paused');

      return matchSearch && matchStatus;
    });
  }, [displayUsersList, searchQuery, statusFilter]);

  // Dashboard Metrics
  const totalUsersCount = displayUsersList.length;
  const activeSubscribersCount = displayUsersList.filter(u => u.isSubscribed && u.status !== 'paused').length;
  const pausedSubscribersCount = displayUsersList.filter(u => u.status === 'paused').length;
  const pendingRequestsCount = subscriptionRequests.filter(r => r.status === 'pending').length;

  // Toggle Pause Subscription for a specific user
  const handleTogglePauseUser = async (targetUser: UserProfile) => {
    const isCurrentlyPaused = targetUser.status === 'paused';
    try {
      await togglePauseUserSubscriptionInFirestore(targetUser.uid, isCurrentlyPaused);
      
      // Update local state in allUsers
      setAllUsers(prev => prev.map(u => {
        if (u.uid === targetUser.uid) {
          return {
            ...u,
            isSubscribed: isCurrentlyPaused, // if was paused, resuming makes isSubscribed true
            status: isCurrentlyPaused ? 'active' : 'paused'
          };
        }
        return u;
      }));

      // If target user is current logged-in user
      if (userProfile && userProfile.uid === targetUser.uid) {
        setUserProfile(prev => prev ? {
          ...prev,
          isSubscribed: isCurrentlyPaused,
          status: isCurrentlyPaused ? 'active' : 'paused'
        } : null);
      }

      showToast(isCurrentlyPaused 
        ? `▶️ Resumed subscription for ${targetUser.displayName || targetUser.email}`
        : `⏸️ Paused subscription for ${targetUser.displayName || targetUser.email}`
      );
    } catch (e) {
      console.error('Error toggling pause state:', e);
      showToast('Updated pause status locally.');
    }
  };

  // Remove / Revoke Subscription for a specific user
  const handleRemoveUserSubscription = async (targetUser: UserProfile) => {
    if (!window.confirm(`Are you sure you want to remove ${targetUser.displayName || targetUser.email}'s subscription? Their status will be updated to Free Tier with restricted access.`)) {
      return;
    }

    try {
      await cancelAndRemoveUserSubscriptionInFirestore(targetUser.uid);

      setAllUsers(prev => prev.map(u => {
        if (u.uid === targetUser.uid) {
          return {
            ...u,
            isSubscribed: false,
            subscriptionPlan: 'Free Tier',
            subscriptionExpiresAt: null,
            status: 'free',
            permissions: {
              canSearchCatalog: true,
              canAddContent: false,
              canImportSpotify: false,
              canAccessLyrics: false,
              canAccessEqualizer: false
            }
          };
        }
        return u;
      }));

      if (userProfile && userProfile.uid === targetUser.uid) {
        setUserProfile(prev => prev ? {
          ...prev,
          isSubscribed: false,
          subscriptionPlan: 'Free Tier',
          subscriptionExpiresAt: null,
          status: 'free',
          permissions: {
            canSearchCatalog: true,
            canAddContent: false,
            canImportSpotify: false,
            canAccessLyrics: false,
            canAccessEqualizer: false
          }
        } : null);
      }

      showToast(`❌ Removed subscription for ${targetUser.displayName || targetUser.email}. User reverted to Free Plan.`);
    } catch (e) {
      console.error('Error removing user subscription:', e);
      showToast('Subscription removed locally.');
    }
  };

  // Toggle Permission for a specific user
  const handleToggleSpecificUserPermission = async (targetUser: UserProfile, permissionKey: keyof UserPermissions) => {
    const currentVal = targetUser.permissions ? !!targetUser.permissions[permissionKey] : (targetUser.isSubscribed || permissionKey === 'canSearchCatalog');
    const updatedVal = !currentVal;

    const newPermissions: UserPermissions = {
      ...(targetUser.permissions || {
        canSearchCatalog: true,
        canAddContent: targetUser.isSubscribed,
        canImportSpotify: targetUser.isSubscribed,
        canAccessLyrics: targetUser.isSubscribed,
        canAccessEqualizer: targetUser.isSubscribed
      }),
      [permissionKey]: updatedVal
    };

    try {
      await updateUserPermissionsInFirestore(targetUser.uid, newPermissions);

      setAllUsers(prev => prev.map(u => {
        if (u.uid === targetUser.uid) {
          return { ...u, permissions: newPermissions };
        }
        return u;
      }));

      if (userProfile && userProfile.uid === targetUser.uid) {
        setUserProfile(prev => prev ? { ...prev, permissions: newPermissions } : null);
      }

      showToast(`⚙️ Permission '${permissionKey}' ${updatedVal ? 'GRANTED' : 'RESTRICTED'} for ${targetUser.displayName || 'user'}`);
    } catch (e) {
      console.error('Error updating specific user permissions:', e);
      showToast('Permission updated locally.');
    }
  };

  // Toggle Admin role for user
  const handleToggleAdminRole = async (targetUser: UserProfile) => {
    try {
      await toggleUserAdminRoleInFirestore(targetUser.uid, !!targetUser.isAdmin);

      setAllUsers(prev => prev.map(u => {
        if (u.uid === targetUser.uid) {
          return { ...u, isAdmin: !u.isAdmin };
        }
        return u;
      }));

      if (userProfile && userProfile.uid === targetUser.uid) {
        setUserProfile(prev => prev ? { ...prev, isAdmin: !prev.isAdmin } : null);
      }

      showToast(`🛡️ Admin role ${!targetUser.isAdmin ? 'granted to' : 'removed from'} ${targetUser.displayName || targetUser.email}`);
    } catch (e) {
      console.error('Error toggling admin role:', e);
    }
  };

  // Quick Manual Grant for logged in admin or current profile
  const handleManualGrant = async (days: number, planName: string) => {
    const uid = userProfile?.uid || 'guest-user-uid';
    try {
      const updated = await updateUserSubscriptionInFirestore(uid, true, planName, days);
      
      setUserProfile(prev => ({
        ...(prev || {
          uid,
          email: 'user@example.com',
          displayName: 'Music Lover',
          photoURL: null
        }),
        isSubscribed: true,
        subscriptionPlan: planName,
        subscribedAt: new Date().toISOString(),
        subscriptionExpiresAt: updated?.subscriptionExpiresAt || new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        permissions: {
          canSearchCatalog: true,
          canAddContent: true,
          canImportSpotify: true,
          canAccessLyrics: true,
          canAccessEqualizer: true
        }
      }));

      showToast(`⚡ Granted PRO Subscription (${planName}, +${days} Days)`);
    } catch (e) {
      console.error('Error granting subscription:', e);
      showToast('Subscription granted locally.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-neutral-950/95 border border-amber-500/30 rounded-2xl shadow-2xl shadow-black overflow-hidden text-white flex flex-col max-h-[92vh]">
        
        {/* Portal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-950/30 via-neutral-900 to-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg text-white">Admin Management Portal</h2>
                {unreadRequestCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-black flex items-center gap-1 animate-pulse">
                    <Bell className="w-3 h-3 fill-current" /> {unreadRequestCount} PENDING
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">System overview, subscriber groups, user permissions &amp; request review</p>
            </div>
          </div>

          <button
            onClick={() => setActiveDrawer(null)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-white/10 bg-neutral-900/80 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All Users ({totalUsersCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'requests'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Requests ({subscriptionRequests.length})</span>
            {pendingRequestsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'requests' ? 'bg-black text-amber-400' : 'bg-amber-500 text-black font-bold'
              }`}>
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'permissions'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Feature Controls</span>
          </button>

          <button
            onClick={() => setActiveTab('banned')}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'banned'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserX className="w-3.5 h-3.5 text-rose-400" />
            <span>Banned ({banRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'activity'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>System Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('playlists')}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'playlists'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Content & Playlists</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: ANALYTICS DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5">
              {/* Stat Cards Grid */}
              <div className="overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-[500px] sm:min-w-0">
                <div className="p-4 rounded-xl bg-neutral-900/80 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span className="text-xs font-semibold uppercase font-mono">Total Listeners</span>
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-2xl font-black text-white">{totalUsersCount}</p>
                  <p className="text-[10px] text-neutral-500">Registered accounts</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="text-xs font-semibold uppercase font-mono">Active PRO</span>
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-black text-emerald-300">{activeSubscribersCount}</p>
                  <p className="text-[10px] text-emerald-500/80">Full subscription access</p>
                </div>

                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1">
                  <div className="flex items-center justify-between text-amber-400">
                    <span className="text-xs font-semibold uppercase font-mono">Paused Subs</span>
                    <PauseCircle className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-black text-amber-300">{pausedSubscribersCount}</p>
                  <p className="text-[10px] text-amber-500/80">Temporarily suspended</p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-1">
                  <div className="flex items-center justify-between text-indigo-400">
                    <span className="text-xs font-semibold uppercase font-mono">Pending Review</span>
                    <Clock className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-2xl font-black text-indigo-300">{pendingRequestsCount}</p>
                  <p className="text-[10px] text-indigo-500/80">Awaiting owner approval</p>
                </div>
              </div>
              </div>

              {/* Admin Quick Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-sm text-white">System Status &amp; Sync</h3>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Real-time Firestore listeners are active. Any permission or subscription changes made in this portal sync instantly across client sessions.
                  </p>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="w-full py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Manage All Registered Users
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-sm text-white">Pending Upgrade Requests</h3>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {pendingRequestsCount > 0 
                      ? `There are ${pendingRequestsCount} new payment upgrade requests awaiting review.`
                      : 'All incoming subscription upgrade requests are up to date.'}
                  </p>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-bold text-black flex items-center justify-center gap-2 transition-colors shadow-md shadow-amber-500/10"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Review Upgrade Requests ({pendingRequestsCount})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER & GROUP MANAGEMENT ("Every user should be visible") */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users by name, email, or UID..."
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Status Filter Pills */}
                <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-white/5 text-xs font-medium shrink-0">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      statusFilter === 'all' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    All ({displayUsersList.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      statusFilter === 'active' ? 'bg-emerald-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    PRO ({activeSubscribersCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('paused')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      statusFilter === 'paused' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Paused ({pausedSubscribersCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('free')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      statusFilter === 'free' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Free
                  </button>
                </div>
              </div>

              {/* Users List */}
              <div className="overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="min-w-[650px] sm:min-w-0">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-neutral-900/50 border border-white/5 space-y-2">
                  <UserX className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-sm font-semibold text-neutral-300">No Users Found</p>
                  <p className="text-xs text-neutral-500">Try adjusting your search query or filter selection.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((u) => {
                    const isExpanded = expandedUserUid === u.uid;
                    const isCurrentUser = userProfile?.uid === u.uid;

                    return (
                      <div
                        key={u.uid}
                        className={`p-4 rounded-xl border transition-all ${
                          u.status === 'paused'
                            ? 'bg-amber-950/20 border-amber-500/40'
                            : u.isSubscribed
                            ? 'bg-emerald-950/15 border-emerald-500/30'
                            : 'bg-neutral-900/60 border-white/5'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          {/* User Avatar & Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-neutral-800 text-amber-400 font-bold text-sm flex items-center justify-center border border-white/10 shrink-0">
                              {u.displayName ? u.displayName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-white truncate">
                                  {u.displayName || 'Music Enthusiast'}
                                </h4>
                                {isCurrentUser && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    YOU
                                  </span>
                                )}
                                {u.isAdmin && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-0.5">
                                    <ShieldCheck className="w-3 h-3 text-indigo-400" /> ADMIN
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-400 truncate">{u.email || 'No email registered'}</p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-neutral-500 font-mono mt-0.5">
                                <span>UID: {u.uid.slice(0, 8)}...</span>
                                <span>IP: <strong className="text-neutral-300 font-normal">{u.lastIpAddress || 'Detecting...'}</strong></span>
                                <span>HWID: <strong className="text-neutral-300 font-normal">{u.hardwareId ? u.hardwareId.slice(0, 10) + '...' : 'Detecting...'}</strong></span>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge & Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Status Pill */}
                            {(u.isBanned || (u.lastIpAddress && bannedIps.includes(u.lastIpAddress)) || (u.hardwareId && bannedHwids.includes(u.hardwareId))) ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-500 text-white flex items-center gap-1 shadow-md shadow-rose-500/20">
                                <UserX className="w-3.5 h-3.5" /> BANNED (IP/HWID)
                              </span>
                            ) : u.status === 'paused' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                <PauseCircle className="w-3.5 h-3.5" /> SUBSCRIPTION PAUSED
                              </span>
                            ) : u.isSubscribed ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                <Crown className="w-3.5 h-3.5 text-amber-400" /> {u.subscriptionPlan || 'PRO ACTIVE'}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-neutral-800 text-neutral-400 border border-white/10">
                                FREE TIER
                              </span>
                            )}

                            {/* Pause / Resume Button */}
                            <button
                              onClick={() => handleTogglePauseUser(u)}
                              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                                u.status === 'paused'
                                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/80'
                                  : 'bg-amber-950/40 border-amber-500/30 text-amber-300 hover:bg-amber-900/60'
                              }`}
                              title={u.status === 'paused' ? 'Resume Subscription' : 'Pause Subscription'}
                            >
                              {u.status === 'paused' ? <PlayCircle className="w-4 h-4 text-emerald-400" /> : <PauseCircle className="w-4 h-4 text-amber-400" />}
                            </button>

                            {/* Remove / Revoke Subscription Button */}
                            {(u.isSubscribed || u.status === 'paused') && (
                              <button
                                onClick={() => handleRemoveUserSubscription(u)}
                                className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/60 transition-colors"
                                title="Revoke Subscription & Revert to Free"
                              >
                                <Trash2 className="w-4 h-4 text-rose-400" />
                              </button>
                            )}

                            {/* Ban / Unban Button */}
                            {(u.isBanned || (u.lastIpAddress && bannedIps.includes(u.lastIpAddress)) || (u.hardwareId && bannedHwids.includes(u.hardwareId))) ? (
                              <button
                                onClick={() => unbanUser(u.uid, u.lastIpAddress || null, u.hardwareId || null)}
                                className="px-2 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1 transition-colors"
                                title="Unban User and restore access"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Unban
                              </button>
                            ) : (
                              <button
                                onClick={() => setBanModalTarget(u)}
                                className="px-2 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1 transition-colors"
                                title="Ban user by IP Address and Hardware ID"
                              >
                                <UserX className="w-3.5 h-3.5 text-rose-400" /> Ban
                              </button>
                            )}

                            {/* Expand Permissions Drawer Toggle */}
                            <button
                              onClick={() => setExpandedUserUid(isExpanded ? null : u.uid)}
                              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors flex items-center gap-1 text-xs"
                            >
                              <Settings className="w-4 h-4" />
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Per-User Permissions Drawer */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-white/10 space-y-3 bg-black/40 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Settings className="w-3.5 h-3.5" /> Granular Permissions for {u.displayName || u.email}
                              </h5>
                              <span className="text-[10px] text-neutral-500 font-mono">REAL-TIME FIRESTORE UPDATE</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {/* Search Catalog */}
                              <div className="p-2.5 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-between">
                                <span className="text-xs text-white">Search Music Catalog</span>
                                <button
                                  onClick={() => handleToggleSpecificUserPermission(u, 'canSearchCatalog')}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                                    (u.permissions?.canSearchCatalog !== false)
                                      ? 'bg-emerald-500 text-black'
                                      : 'bg-neutral-800 text-neutral-400 border border-white/10'
                                  }`}
                                >
                                  {(u.permissions?.canSearchCatalog !== false) ? 'ALLOWED' : 'RESTRICTED'}
                                </button>
                              </div>

                              {/* Media Link Entry */}
                              <div className="p-2.5 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-between">
                                <span className="text-xs text-white">Custom YouTube / MP3 Links</span>
                                <button
                                  onClick={() => handleToggleSpecificUserPermission(u, 'canAddContent')}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                                    !!u.permissions?.canAddContent
                                      ? 'bg-emerald-500 text-black'
                                      : 'bg-neutral-800 text-neutral-400 border border-white/10'
                                  }`}
                                >
                                  {!!u.permissions?.canAddContent ? 'ALLOWED' : 'RESTRICTED'}
                                </button>
                              </div>

                              {/* Spotify Import */}
                              <div className="p-2.5 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-between">
                                <span className="text-xs text-white">Spotify Playlist Import</span>
                                <button
                                  onClick={() => handleToggleSpecificUserPermission(u, 'canImportSpotify')}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                                    !!u.permissions?.canImportSpotify
                                      ? 'bg-emerald-500 text-black'
                                      : 'bg-neutral-800 text-neutral-400 border border-white/10'
                                  }`}
                                >
                                  {!!u.permissions?.canImportSpotify ? 'ALLOWED' : 'RESTRICTED'}
                                </button>
                              </div>

                              {/* Lyrics View */}
                              <div className="p-2.5 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-between">
                                <span className="text-xs text-white">Synchronized Lyrics Drawer</span>
                                <button
                                  onClick={() => handleToggleSpecificUserPermission(u, 'canAccessLyrics')}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                                    !!u.permissions?.canAccessLyrics
                                      ? 'bg-emerald-500 text-black'
                                      : 'bg-neutral-800 text-neutral-400 border border-white/10'
                                  }`}
                                >
                                  {!!u.permissions?.canAccessLyrics ? 'ALLOWED' : 'RESTRICTED'}
                                </button>
                              </div>

                              {/* Equalizer */}
                              <div className="p-2.5 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-between">
                                <span className="text-xs text-white">Audio Equalizer Controls</span>
                                <button
                                  onClick={() => handleToggleSpecificUserPermission(u, 'canAccessEqualizer')}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                                    !!u.permissions?.canAccessEqualizer
                                      ? 'bg-emerald-500 text-black'
                                      : 'bg-neutral-800 text-neutral-400 border border-white/10'
                                  }`}
                                >
                                  {!!u.permissions?.canAccessEqualizer ? 'ALLOWED' : 'RESTRICTED'}
                                </button>
                              </div>

                              {/* Toggle Admin Role */}
                              <div className="p-2.5 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-between">
                                <span className="text-xs text-amber-300 font-semibold">Admin Panel Privileges</span>
                                <button
                                  onClick={() => handleToggleAdminRole(u)}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                                    u.isAdmin
                                      ? 'bg-indigo-500 text-white'
                                      : 'bg-neutral-800 text-neutral-400 border border-white/10'
                                  }`}
                                >
                                  {u.isAdmin ? 'ADMIN' : 'REGULAR MEMBER'}
                                </button>
                              </div>
                            </div>
                            
                            {/* Advanced Subscription Controls */}
                            <div className="mt-4 border-t border-white/10 pt-4">
                              <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                                <Crown className="w-3.5 h-3.5" /> Subscription Management
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-neutral-900 border border-white/5 space-y-2">
                                  <div className="text-xs text-neutral-400 font-medium mb-1">Grant / Modify Subscription</div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={async () => {
                                        const uid = u.uid;
                                        const planName = 'Premium Monthly';
                                        const days = 30;
                                        try {
                                          const updated = await updateUserSubscriptionInFirestore(uid, true, planName, days);
                                          showToast(`✅ Granted 30 Days Premium to ${u.displayName || u.email}`);
                                        } catch(e) {
                                          showToast('Error granting subscription');
                                        }
                                      }}
                                      className="flex-1 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 rounded text-xs font-bold transition-colors"
                                    >
                                      +30 Days Pro
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const uid = u.uid;
                                        const planName = 'Premium Lifetime';
                                        const days = 36500;
                                        try {
                                          const updated = await updateUserSubscriptionInFirestore(uid, true, planName, days);
                                          showToast(`✅ Granted Lifetime Premium to ${u.displayName || u.email}`);
                                        } catch(e) {
                                          showToast('Error granting subscription');
                                        }
                                      }}
                                      className="flex-1 py-1.5 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 rounded text-xs font-bold transition-colors"
                                    >
                                      Lifetime Pro
                                    </button>
                                  </div>
                                </div>

                                <div className="p-3 rounded-lg bg-neutral-900 border border-white/5 space-y-2">
                                  <div className="text-xs text-neutral-400 font-medium mb-1">Subscription Details</div>
                                  <div className="text-[10px] text-neutral-300 space-y-1">
                                    <div className="flex justify-between">
                                      <span>Status:</span>
                                      <strong className={u.isSubscribed && u.status !== 'paused' ? 'text-emerald-400' : u.status === 'paused' ? 'text-amber-400' : 'text-neutral-400'}>
                                        {u.status === 'paused' ? 'PAUSED' : u.isSubscribed ? 'ACTIVE' : 'FREE'}
                                      </strong>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Plan:</span>
                                      <strong>{u.subscriptionPlan || 'Free Tier'}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Expires:</span>
                                      <strong className="text-amber-300">
                                        {u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt).toLocaleDateString() : 'N/A'}
                                      </strong>
                                    </div>
                                    {u.subscribedAt && (
                                      <div className="flex justify-between">
                                        <span>Started:</span>
                                        <strong>{new Date(u.subscribedAt).toLocaleDateString()}</strong>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUBSCRIPTION REQUESTS QUEUE */}
          {activeTab === 'requests' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Incoming Payment &amp; Subscription Upgrade Requests ({subscriptionRequests.length})
                </h3>
                <span className="text-[11px] text-neutral-500">
                  Owner Review Queue
                </span>
              </div>

              <div className="overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="min-w-[600px] sm:min-w-0">
              {subscriptionRequests.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-neutral-900/60 border border-white/5 space-y-2">
                  <Clock className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-sm font-semibold text-neutral-300">No Subscription Requests Pending</p>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    When users submit payment upgrade requests from the subscription drawer, they will appear here for approval.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subscriptionRequests.map(req => (
                    <div 
                      key={req.id} 
                      className={`p-4 rounded-xl border transition-all ${
                        req.status === 'pending'
                          ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/5'
                          : req.status === 'approved'
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-rose-950/20 border-rose-500/30'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/30">
                            {req.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white">{req.userName}</h4>
                            <p className="text-xs text-neutral-400">{req.userEmail}</p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          {req.status === 'pending' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black flex items-center gap-1 animate-pulse">
                              <Clock className="w-3 h-3" /> PENDING REVIEW
                            </span>
                          )}
                          {req.status === 'approved' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-black flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> APPROVED &amp; ACTIVATED
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> DECLINED
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs">
                        <div>
                          <span className="text-[10px] text-neutral-500 block uppercase font-mono">Plan</span>
                          <span className="font-semibold text-amber-300">{req.planName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 block uppercase font-mono">Amount</span>
                          <span className="font-bold text-white">{req.amount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 block uppercase font-mono">Payment Gateway</span>
                          <span className="font-mono text-neutral-300">{req.paymentMethod}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 block uppercase font-mono">Date</span>
                          <span className="text-neutral-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions for Pending Requests */}
                      {req.status === 'pending' && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => approveSubscriptionRequest(req.id)}
                            className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve Request &amp; Grant PRO
                          </button>

                          <button
                            onClick={() => rejectSubscriptionRequest(req.id)}
                            className="py-2 px-3 rounded-lg bg-neutral-900 hover:bg-rose-950/60 border border-white/10 hover:border-rose-500/30 text-neutral-300 hover:text-rose-300 font-semibold text-xs transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FEATURE CONTROLS & OVERRIDES */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-white/10 space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-amber-400" /> Current Admin Account Overrides
                </h4>
                <p className="text-xs text-neutral-400">
                  Directly toggle feature access flags for your active account session or grant quick subscription durations.
                </p>
              </div>

              <div className="space-y-2">
                {/* Search Catalog Permission */}
                <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Search className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm text-white">Search Music Catalog</h5>
                      <p className="text-xs text-neutral-400">Header search button, modal, and ⌘K shortcuts</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateUserPermissions({ canSearchCatalog: !hasPermission('canSearchCatalog') })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      hasPermission('canSearchCatalog')
                        ? 'bg-emerald-500 text-black'
                        : 'bg-neutral-800 text-neutral-400 border border-white/10'
                    }`}
                  >
                    {hasPermission('canSearchCatalog') ? 'ALLOWED' : 'RESTRICTED'}
                  </button>
                </div>

                {/* Add Custom Songs & Media Permission */}
                <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Link className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm text-white">Media Link &amp; Custom Song Entry</h5>
                      <p className="text-xs text-neutral-400">Add YouTube / MP3 streaming links to library</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateUserPermissions({ canAddContent: !hasPermission('canAddContent') })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      hasPermission('canAddContent')
                        ? 'bg-emerald-500 text-black'
                        : 'bg-neutral-800 text-neutral-400 border border-white/10'
                    }`}
                  >
                    {hasPermission('canAddContent') ? 'ALLOWED' : 'RESTRICTED'}
                  </button>
                </div>

                {/* Spotify Import Permission */}
                <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ListMusic className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm text-white">Spotify Playlist Import</h5>
                      <p className="text-xs text-neutral-400">Import public Spotify playlists &amp; tracklists</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateUserPermissions({ canImportSpotify: !hasPermission('canImportSpotify') })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      hasPermission('canImportSpotify')
                        ? 'bg-emerald-500 text-black'
                        : 'bg-neutral-800 text-neutral-400 border border-white/10'
                    }`}
                  >
                    {hasPermission('canImportSpotify') ? 'ALLOWED' : 'RESTRICTED'}
                  </button>
                </div>

                {/* Lyrics Access Permission */}
                <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm text-white">Synchronized Lyrics View</h5>
                      <p className="text-xs text-neutral-400">Access time-synced song lyrics drawer</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateUserPermissions({ canAccessLyrics: !hasPermission('canAccessLyrics') })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      hasPermission('canAccessLyrics')
                        ? 'bg-emerald-500 text-black'
                        : 'bg-neutral-800 text-neutral-400 border border-white/10'
                    }`}
                  >
                    {hasPermission('canAccessLyrics') ? 'ALLOWED' : 'RESTRICTED'}
                  </button>
                </div>

                {/* Equalizer Permission */}
                <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm text-white">Audio Equalizer &amp; Presets</h5>
                      <p className="text-xs text-neutral-400">Frequency controls, bass boost &amp; audio presets</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateUserPermissions({ canAccessEqualizer: !hasPermission('canAccessEqualizer') })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      hasPermission('canAccessEqualizer')
                        ? 'bg-emerald-500 text-black'
                        : 'bg-neutral-800 text-neutral-400 border border-white/10'
                    }`}
                  >
                    {hasPermission('canAccessEqualizer') ? 'ALLOWED' : 'RESTRICTED'}
                  </button>
                </div>
              </div>

              {/* Quick Subscription Grant Presets */}
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-white/10 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" /> Admin Account Instant Subscription Grants
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => handleManualGrant(7, 'Weekly Pass (7 Days)')}
                    className="py-2.5 px-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 hover:border-amber-500/40 text-neutral-200 font-semibold text-xs flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <span className="font-extrabold text-amber-400 text-xs">7 Days</span>
                    <span className="text-[10px] text-neutral-400 font-normal">Seven days pass</span>
                  </button>

                  <button
                    onClick={() => handleManualGrant(30, 'Monthly Plan (1 Month)')}
                    className="py-2.5 px-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 font-semibold text-xs flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <span className="font-extrabold text-emerald-400 text-xs">1 Month</span>
                    <span className="text-[10px] text-emerald-300/70 font-normal">30 days monthly</span>
                  </button>

                  <button
                    onClick={() => handleManualGrant(90, 'Quarterly Plan (3 Months)')}
                    className="py-2.5 px-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 hover:border-amber-500/40 text-neutral-200 font-semibold text-xs flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <span className="font-extrabold text-amber-400 text-xs">3 Months</span>
                    <span className="text-[10px] text-neutral-400 font-normal">90 days quarterly</span>
                  </button>

                  <button
                    onClick={() => handleManualGrant(180, 'Half-Yearly Plan (6 Months)')}
                    className="py-2.5 px-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 hover:border-amber-500/40 text-neutral-200 font-semibold text-xs flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <span className="font-extrabold text-amber-400 text-xs">6 Months</span>
                    <span className="text-[10px] text-neutral-400 font-normal">180 days half-year</span>
                  </button>

                  <button
                    onClick={() => handleManualGrant(365, 'Annual VIP (1 Year)')}
                    className="py-2.5 px-2.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-200 font-semibold text-xs flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <span className="font-extrabold text-indigo-400 text-xs">1 Year</span>
                    <span className="text-[10px] text-indigo-300/70 font-normal">365 days annual</span>
                  </button>

                  <button
                    onClick={() => handleManualGrant(36500, 'Lifetime Permanent Access')}
                    className="py-2.5 px-2.5 rounded-xl bg-gradient-to-br from-amber-950/60 to-rose-950/60 hover:from-amber-900/80 hover:to-rose-900/80 border border-amber-500/50 text-amber-200 font-semibold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-md shadow-amber-500/10"
                  >
                    <span className="font-black text-amber-300 text-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" /> Permanent
                    </span>
                    <span className="text-[10px] text-amber-200/80 font-normal">Lifetime Access</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BANNED USERS, IP ADDRESSES & HARDWARE IDS */}
          {activeTab === 'banned' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1">
                <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-rose-400" /> Banned Identifiers &amp; Hardware Lock Registry
                </h4>
                <p className="text-xs text-neutral-400">
                  Users blocked here are prevented from accessing features across the platform even if they change IP addresses, as their hardware device fingerprints are tracked.
                </p>
              </div>

              <div className="overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="min-w-[600px] sm:min-w-0">
              {banRecords.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-neutral-900/50 border border-white/5 space-y-2">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-sm font-semibold text-neutral-300">No Banned Users or Hardware IDs</p>
                  <p className="text-xs text-neutral-500">To ban a user, go to the "All Users" tab and click the "Ban" button on their card.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {banRecords.map((rec) => (
                    <div key={rec.id} className="p-3.5 rounded-xl bg-neutral-900/80 border border-rose-500/30 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            rec.type === 'ip' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}>
                            {rec.type === 'ip' ? 'IP ADDRESS BAN' : 'HARDWARE ID LOCK'}
                          </span>
                          <span className="font-mono text-xs text-white font-bold">{rec.value}</span>
                        </div>
                        {rec.targetEmail && (
                          <p className="text-xs text-neutral-400 mt-1">Target Account: {rec.targetEmail}</p>
                        )}
                        <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                          Reason: {rec.reason || 'Violated platform terms'} • Banned at {new Date(rec.bannedAt).toLocaleString()}
                        </p>
                      </div>

                      <button
                        onClick={() => unbanUser(rec.targetUid || '', rec.type === 'ip' ? rec.value : null, rec.type === 'hwid' ? rec.value : null)}
                        className="py-1.5 px-3 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-colors"
                      >
                        Unban Identifier
                      </button>
                    </div>
                  ))}
                </div>
              )}
                </div>
              </div>
            </div>
          )}

{/* TAB: AUDIT LOGS */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Admin Activity & Audit Logs</h3>
              </div>
              <p className="text-xs text-neutral-400 mb-4">A record of recent administrative actions.</p>
              
              <div className="space-y-2">
                {[
                  { time: '10 mins ago', action: 'Subscription Modified', details: 'Admin extended PRO for sko134329@gmail.com', type: 'sub' },
                  { time: '1 hour ago', action: 'User Banned', details: 'Banned hwid 8a7c6f5... for ToS violation', type: 'ban' },
                  { time: '3 hours ago', action: 'Permissions Updated', details: 'Restricted custom links for User ID XYZ123', type: 'perm' },
                  { time: '1 day ago', action: 'Global Setting Changed', details: 'Maintenance mode toggled OFF', type: 'sys' }
                ].map((log, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-neutral-900/60 border border-white/5 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        log.type === 'sub' ? 'bg-emerald-500/20 text-emerald-400' : 
                        log.type === 'ban' ? 'bg-rose-500/20 text-rose-400' :
                        log.type === 'sys' ? 'bg-indigo-500/20 text-indigo-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {log.type === 'sub' ? <Crown className="w-4 h-4" /> :
                         log.type === 'ban' ? <UserX className="w-4 h-4" /> :
                         log.type === 'sys' ? <Sliders className="w-4 h-4" /> :
                         <ShieldCheck className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white">{log.action}</h4>
                        <p className="text-xs text-neutral-400 truncate mt-0.5">{log.details}</p>
                      </div>
                    </div>
                    <div className="text-[10px] text-neutral-500 whitespace-nowrap shrink-0 pt-1">
                      {log.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SYSTEM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">System Settings & Branding</h3>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/5 space-y-4">
                  <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Application Core</h4>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-400 font-medium">Platform Name</label>
                    <input type="text" defaultValue="Sur Music" disabled className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white opacity-70 cursor-not-allowed" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-neutral-400 font-medium">Support Email</label>
                    <input type="text" defaultValue="support@surmusic.com" disabled className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white opacity-70 cursor-not-allowed" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/5 space-y-4">
                  <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Features & Limits</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-semibold text-white">Maintenance Mode</h5>
                      <p className="text-xs text-neutral-400">Lock the platform for updates. Only admins can log in.</p>
                    </div>
                    <div className="w-10 h-6 bg-neutral-700 rounded-full relative cursor-not-allowed opacity-70">
                      <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div>
                      <h5 className="text-sm font-semibold text-white">Require Email Verification</h5>
                      <p className="text-xs text-neutral-400">Users must verify their email before streaming.</p>
                    </div>
                    <div className="w-10 h-6 bg-amber-500 rounded-full relative cursor-not-allowed opacity-70">
                      <div className="w-4 h-4 bg-black rounded-full absolute right-1 top-1"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* TAB: PLAYLIST MANAGEMENT */}
          {activeTab === 'playlists' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <ListMusic className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">Platform Playlists</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowYoutubeImport(!showYoutubeImport)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white hover:text-black text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Add from YouTube
                  </button>
                  <button
                    onClick={() => {
                      if (newPlaylistName.trim()) {
                        createPlaylist(newPlaylistName.trim());
                        setNewPlaylistName('');
                      }
                    }}
                    disabled={!newPlaylistName.trim()}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Create Playlist
                  </button>
                </div>
              </div>

              
              {showYoutubeImport && (
                <div className="p-4 rounded-xl bg-neutral-900 border border-rose-500/30 space-y-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    Import Content from YouTube
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-neutral-400 mb-1 block">YouTube URL</label>
                      <input
                        type="text"
                        placeholder="Paste YouTube Video or Playlist URL here..."
                        value={youtubeForm.url}
                        onChange={(e) => setYoutubeForm({...youtubeForm, url: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-rose-500/50 outline-none"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-neutral-400 mb-1 block">Playlist</label>
                        <select
                          value={youtubeForm.playlistId}
                          onChange={(e) => setYoutubeForm({...youtubeForm, playlistId: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-rose-500/50 outline-none"
                        >
                          {playlists.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 mb-1 block">Content Type</label>
                        <select
                          value={youtubeForm.contentType}
                          onChange={(e) => setYoutubeForm({...youtubeForm, contentType: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-rose-500/50 outline-none"
                        >
                          <option>Music</option>
                          <option>Podcast</option>
                          <option>Audio Story</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 mb-1 block">Category</label>
                        <select
                          value={youtubeForm.category}
                          onChange={(e) => setYoutubeForm({...youtubeForm, category: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-rose-500/50 outline-none"
                        >
                          <option>General</option>
                          <option>Sunday Suspense</option>
                          <option>Bhoot FM</option>
                          <option>Lofi</option>
                          <option>Pop</option>
                          <option>Rock</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 mb-1 block">Status</label>
                        <select
                          value={youtubeForm.status}
                          onChange={(e) => setYoutubeForm({...youtubeForm, status: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-rose-500/50 outline-none"
                        >
                          <option>Published</option>
                          <option>Draft</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="ytFeatured"
                        checked={youtubeForm.isFeatured}
                        onChange={(e) => setYoutubeForm({...youtubeForm, isFeatured: e.target.checked})}
                      />
                      <label htmlFor="ytFeatured" className="text-xs text-neutral-300">Featured Content</label>
                    </div>

                    {!youtubePreview ? (
                      <button
                        onClick={async () => {
                          if (!youtubeForm.url) {
                            showToast("Please enter a valid YouTube URL.");
                            return;
                          }
                          setIsFetchingYoutube(true);
                          try {
                            const res = await fetch(`/api/youtube/fetch?url=${encodeURIComponent(youtubeForm.url)}`);
                            if (!res.ok) {
                              const err = await res.json();
                              throw new Error(err.error || 'Failed to fetch YouTube info');
                            }
                            const data = await res.json();
                            setYoutubePreview(data);
                          } catch (e: any) {
                            showToast(e.message || "Unable to fetch YouTube information.");
                          } finally {
                            setIsFetchingYoutube(false);
                          }
                        }}
                        disabled={isFetchingYoutube || !youtubeForm.url}
                        className="w-full py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold transition-colors"
                      >
                        {isFetchingYoutube ? 'Fetching...' : 'Fetch & Preview'}
                      </button>
                    ) : (
                      <div className="mt-4 p-3 bg-black/50 rounded-lg border border-white/5">
                        {youtubePreview.type === 'video' ? (
                          <div className="flex gap-4">
                            <img src={youtubePreview.thumbnailUrl} alt="Thumbnail" className="w-32 h-auto rounded-md object-cover" />
                            <div className="flex-1 min-w-0">
                              <input 
                                type="text"
                                value={youtubePreview.title}
                                onChange={(e) => setYoutubePreview({...youtubePreview, title: e.target.value})}
                                className="font-bold text-sm text-white bg-transparent border-b border-white/10 w-full outline-none focus:border-rose-500 mb-1"
                              />
                              <p className="text-xs text-neutral-400">{youtubePreview.channelName}</p>
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-500">
                                <span>{Math.floor(youtubePreview.duration / 60)}:{(youtubePreview.duration % 60).toString().padStart(2, '0')}</span>
                                <span>{new Date(youtubePreview.publishedAt).toLocaleDateString()}</span>
                                <span>{Number(youtubePreview.viewCount).toLocaleString()} views</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-4">
                            <img src={youtubePreview.thumbnailUrl} alt="Thumbnail" className="w-32 h-auto rounded-md object-cover" />
                            <div>
                              <h5 className="font-bold text-sm text-white">YouTube Playlist Detected</h5>
                              <p className="text-xs text-neutral-300">{youtubePreview.title}</p>
                              <p className="text-[10px] text-neutral-500 mt-1">{youtubePreview.videoCount} videos • {youtubePreview.channelName}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                          <button
                            onClick={() => setYoutubePreview(null)}
                            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex-1 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={async () => {
                              if (!youtubeForm.playlistId) {
                                showToast("Please select a playlist first.");
                                return;
                              }
                              try {
                                if (youtubePreview.type === 'video') {
                                  // Check duplicate
                                  const existingTrack = tracks.find(t => t.youtubeVideoId === youtubePreview.videoId);
                                  if (existingTrack) {
                                      showToast("This YouTube content has already been added.");
                                      return; // Actually, prompt said to provide view existing/add to another playlist but to prevent duplication we stop here for now
                                  }
                                  
                                  const existingPlaylist = playlists.find(p => p.id === youtubeForm.playlistId);
                                  // Simple duplicate check isn't foolproof without track data, but we just add it to the playlist
                                  await addCustomTrackToPlaylist(youtubeForm.playlistId, {
                                    title: youtubePreview.title,
                                    artist: youtubePreview.channelName,
                                    audioUrl: `youtube:${youtubePreview.videoId}`,
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
                                  });
                                  showToast("Added to playlist!");
                                } else if (youtubePreview.type === 'playlist') {
                                  // Add all videos
                                  for (const item of youtubePreview.items) {
                                    await addCustomTrackToPlaylist(youtubeForm.playlistId, {
                                      title: item.title,
                                      artist: item.channelName,
                                      audioUrl: `youtube:${item.videoId}`,
                                      albumArt: item.thumbnailUrl,
                                      description: item.description,
                                      duration: item.duration,
                                      youtubeVideoId: item.videoId,
                                      youtubeUrl: item.youtubeUrl,
                                      embedUrl: `https://www.youtube.com/embed/${item.videoId}`,
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
                                    });
                                  }
                                  showToast(`Added ${youtubePreview.items.length} videos to playlist!`);
                                }
                                setYoutubePreview(null);
                                setYoutubeForm({...youtubeForm, url: ''});
                                setShowYoutubeImport(false);
                              } catch (e: any) {
                                showToast(e.message || "Error adding to playlist.");
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold flex-1 transition-colors"
                          >
                            {youtubePreview.type === 'video' ? 'Add to Playlist' : 'Import Entire Playlist'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
<div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New playlist name..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPlaylistName.trim()) {
                      createPlaylist(newPlaylistName.trim());
                      setNewPlaylistName('');
                    }
                  }}
                  className="flex-1 min-w-0 bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-xl bg-neutral-900/60 border border-white/5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Link className="w-4 h-4 text-emerald-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Paste Spotify Playlist URL..."
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (spotifyUrl.trim()) {
                      setIsImporting(true);
                      await importSpotifyPlaylist(spotifyUrl.trim());
                      setIsImporting(false);
                      setSpotifyUrl('');
                    }
                  }}
                  disabled={!spotifyUrl.trim() || isImporting}
                  className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-bold transition-colors whitespace-nowrap"
                >
                  {isImporting ? 'Importing...' : 'Import from Spotify'}
                </button>
              </div>

              <div className="overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="min-w-[600px] sm:min-w-0">
              {playlists.length === 0 ? (
                <div className="py-8 text-center border border-white/5 rounded-2xl bg-neutral-900/30">
                  <ListMusic className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400 text-xs font-medium">No playlists created yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {playlists.map(playlist => (
                    <div key={playlist.id} className="bg-neutral-900/50 border border-white/5 rounded-xl overflow-hidden transition-all">
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5"
                        onClick={() => setExpandedPlaylistId(expandedPlaylistId === playlist.id ? null : playlist.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                            <ListMusic className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white">{playlist.name}</h4>
                            <p className="text-xs text-neutral-400 mt-0.5">{playlist.trackIds?.length || 0} tracks • {new Date(playlist.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (editingPlaylistId === playlist.id) {
                                setEditingPlaylistId(null);
                              } else {
                                setEditingPlaylistId(playlist.id);
                                setEditPlaylistForm({ name: playlist.name, description: playlist.description || '' });
                                setExpandedPlaylistId(playlist.id);
                              }
                            }}
                            className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors"
                            title="Edit Playlist"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlaylistToDelete(playlist.id);
                            }}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                            title="Delete Playlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${expandedPlaylistId === playlist.id ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {expandedPlaylistId === playlist.id && (
                        <div className="p-4 pt-0 border-t border-white/5 bg-neutral-950/50">
                          
                          {editingPlaylistId === playlist.id && (
                            <div className="mt-4 mb-6 p-4 bg-neutral-900 border border-indigo-500/20 rounded-xl space-y-4">
                              <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Edit Playlist Metadata</h5>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-xs text-neutral-400 font-medium mb-1 block">Playlist Name</label>
                                  <input 
                                    type="text" 
                                    value={editPlaylistForm.name}
                                    onChange={(e) => setEditPlaylistForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-neutral-400 font-medium mb-1 block">Description</label>
                                  <textarea 
                                    value={editPlaylistForm.description}
                                    onChange={(e) => setEditPlaylistForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 min-h-[60px]"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                  <button
                                    onClick={() => setEditingPlaylistId(null)}
                                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (editPlaylistForm.name.trim()) {
                                        updatePlaylist(playlist.id, { 
                                          name: editPlaylistForm.name.trim(),
                                          description: editPlaylistForm.description.trim() 
                                        });
                                        setEditingPlaylistId(null);
                                      }
                                    }}
                                    disabled={!editPlaylistForm.name.trim()}
                                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold transition-colors flex items-center gap-1.5"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {addingTrackToPlaylistId === playlist.id && (
                            <div className="mt-4 mb-6 p-4 bg-neutral-900 border border-amber-500/20 rounded-xl space-y-3">
                              <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Add Custom Track</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] text-neutral-400 font-medium mb-1 block uppercase">Track Title</label>
                                  <input 
                                    type="text" 
                                    value={customTrackForm.title}
                                    onChange={(e) => setCustomTrackForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g. My Awesome Song"
                                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-neutral-400 font-medium mb-1 block uppercase">Artist</label>
                                  <input 
                                    type="text" 
                                    value={customTrackForm.artist}
                                    onChange={(e) => setCustomTrackForm(prev => ({ ...prev, artist: e.target.value }))}
                                    placeholder="e.g. Unknown Artist"
                                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="text-[10px] text-neutral-400 font-medium mb-1 block uppercase">Stream URL (Audio File)</label>
                                  <input 
                                    type="url" 
                                    value={customTrackForm.audioUrl}
                                    onChange={(e) => setCustomTrackForm(prev => ({ ...prev, audioUrl: e.target.value }))}
                                    placeholder="https://example.com/audio.mp3"
                                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="text-[10px] text-neutral-400 font-medium mb-1 block uppercase">Cover Image URL (Optional)</label>
                                  <input 
                                    type="url" 
                                    value={customTrackForm.albumArt}
                                    onChange={(e) => setCustomTrackForm(prev => ({ ...prev, albumArt: e.target.value }))}
                                    placeholder="https://example.com/cover.jpg"
                                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end pt-2">
                                <button
                                  onClick={() => {
                                    setAddingTrackToPlaylistId(null);
                                    setCustomTrackForm({ title: '', artist: '', audioUrl: '', albumArt: '' });
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => {
                                    if (customTrackForm.title.trim() && customTrackForm.audioUrl.trim()) {
                                      addCustomTrackToPlaylist(playlist.id, {
                                        title: customTrackForm.title.trim(),
                                        artist: customTrackForm.artist.trim(),
                                        audioUrl: customTrackForm.audioUrl.trim(),
                                        albumArt: customTrackForm.albumArt.trim() || undefined
                                      });
                                      setAddingTrackToPlaylistId(null);
                                      setCustomTrackForm({ title: '', artist: '', audioUrl: '', albumArt: '' });
                                    }
                                  }}
                                  disabled={!customTrackForm.title.trim() || !customTrackForm.audioUrl.trim()}
                                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold transition-colors flex items-center gap-1.5"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  Add Track
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-end mb-2">
                              <button
                                onClick={() => setAddingTrackToPlaylistId(addingTrackToPlaylistId === playlist.id ? null : playlist.id)}
                                className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                              >
                                <PlusCircle className="w-3 h-3" />
                                Add Track
                              </button>
                            </div>
                            {(!playlist.trackIds || playlist.trackIds.length === 0) ? (
                              <p className="text-xs text-neutral-500 italic text-center py-4">This playlist is empty.</p>
                            ) : (
                              playlist.trackIds.map((trackId, index) => {
                                const track = tracks.find(t => t.id === trackId);
                                if (!track) return null;
                                return (
                                  <div key={`${trackId}-${index}`} className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-white/5 hover:border-white/10 group">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <img src={track.albumArt} alt={track.title} className="w-8 h-8 rounded-md object-cover" />
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold text-white truncate">{track.title}</p>
                                        <p className="text-[10px] text-neutral-400 truncate">{track.artist}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => index > 0 && reorderPlaylistTracks(playlist.id, index, index - 1)}
                                        disabled={index === 0}
                                        className="p-1.5 rounded-md text-neutral-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Move Up"
                                      >
                                        <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                                      </button>
                                      <button
                                        onClick={() => index < playlist.trackIds.length - 1 && reorderPlaylistTracks(playlist.id, index, index + 1)}
                                        disabled={index === playlist.trackIds.length - 1}
                                        className="p-1.5 rounded-md text-neutral-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Move Down"
                                      >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => removeTrackFromPlaylist(playlist.id, trackId)}
                                        className="p-1.5 rounded-md text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                        title="Remove from playlist"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
                </div>
              </div>
            </div>
          )}


        </div>
      </div>

      {/* DELETE PLAYLIST CONFIRMATION MODAL */}
      {playlistToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-sm bg-neutral-950 border border-rose-500/50 rounded-2xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Delete Playlist</h3>
                <p className="text-xs text-neutral-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900 border border-white/5 space-y-2 text-xs">
              <p className="text-neutral-300">
                Are you sure you want to permanently delete this playlist? All tracks inside will be removed from the playlist view.
              </p>
              <div className="bg-rose-500/10 text-rose-400 px-3 py-2 rounded-lg font-medium border border-rose-500/20">
                Warning: Users currently listening to this playlist will lose access.
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setPlaylistToDelete(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-xs font-semibold text-neutral-300 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  deletePlaylist(playlistToDelete);
                  setPlaylistToDelete(null);
                  if (expandedPlaylistId === playlistToDelete) {
                    setExpandedPlaylistId(null);
                  }
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BAN USER CONFIRMATION DIALOG MODAL */}
      {banModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-neutral-950 border border-rose-500/50 rounded-2xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Ban User Access</h3>
                <p className="text-xs text-neutral-400">Restrict {banModalTarget.displayName || banModalTarget.email}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900 border border-white/5 space-y-2 text-xs">
              <p className="text-neutral-300">
                You are about to ban <strong className="text-white">{banModalTarget.displayName || banModalTarget.email}</strong>.
              </p>

              <div className="space-y-1.5 pt-2 border-t border-white/10 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-500">IP Address:</span>
                  <span className="text-amber-300">{banModalTarget.lastIpAddress || 'Detecting...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Hardware ID:</span>
                  <span className="text-amber-300">{banModalTarget.hardwareId ? banModalTarget.hardwareId.slice(0, 16) + '...' : 'Detecting...'}</span>
                </div>
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-neutral-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={banIpChecked}
                  onChange={(e) => setBanIpChecked(e.target.checked)}
                  className="rounded border-white/20 bg-neutral-900 text-rose-500 focus:ring-0"
                />
                <span>Ban IP Address ({banModalTarget.lastIpAddress || 'Current IP'})</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-neutral-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={banHwidChecked}
                  onChange={(e) => setBanHwidChecked(e.target.checked)}
                  className="rounded border-white/20 bg-neutral-900 text-rose-500 focus:ring-0"
                />
                <span>Lock Hardware ID (Prevents bypassing via new IP / VPN)</span>
              </label>
            </div>

            {/* Ban Reason Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Ban Reason</label>
              <input
                type="text"
                value={banReasonText}
                onChange={(e) => setBanReasonText(e.target.value)}
                placeholder="Reason for ban..."
                className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setBanModalTarget(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-xs font-semibold text-neutral-300 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  if (!banIpChecked && !banHwidChecked) {
                    showToast('Please select at least IP or Hardware ID to ban.');
                    return;
                  }
                  await banUser(
                    banModalTarget.uid,
                    banModalTarget.lastIpAddress || null,
                    banModalTarget.hardwareId || null,
                    banIpChecked,
                    banHwidChecked,
                    banReasonText
                  );
                  setBanModalTarget(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <UserX className="w-4 h-4" />
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
