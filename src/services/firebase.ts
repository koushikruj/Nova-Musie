import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged,
  updateProfile,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  collection,
  query,
  orderBy
} from 'firebase/firestore';
import { UserProfile, SubscriptionRequest, BanRecord } from '../types';
import { getHardwareId, getPublicIpAddress } from '../utils/deviceInfo';

const CONFIG_STORAGE_KEY = 'nova_firebase_config';

export interface FirebaseConfigObject {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const DEFAULT_FIREBASE_CONFIG: FirebaseConfigObject = {
  apiKey: "AIzaSyDa5hlMbQdxgVDZrxX9QmAJ1taco_8g3_Q",
  authDomain: "novamusic-ca7d5.firebaseapp.com",
  projectId: "novamusic-ca7d5",
  storageBucket: "novamusic-ca7d5.firebasestorage.app",
  messagingSenderId: "660291812118",
  appId: "1:660291812118:web:62ccb890ddf7d7bd3aae37"
};

// Fixed Firebase configuration
export function getStoredFirebaseConfig(): FirebaseConfigObject {
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(_config: FirebaseConfigObject): boolean {
  return true;
}

export function clearFirebaseConfig(): void {
  // No-op
}

export function isFirebaseConfigured(): boolean {
  return true;
}

let firebaseAppInstance: FirebaseApp | null = null;
let firebaseAuthInstance: Auth | null = null;
let firestoreDbInstance: Firestore | null = null;

export function initFirebaseService() {
  const config = getStoredFirebaseConfig();
  if (!config) return { app: null, auth: null, db: null };

  try {
    if (!getApps().length) {
      firebaseAppInstance = initializeApp(config);
    } else {
      firebaseAppInstance = getApp();
    }
    firebaseAuthInstance = getAuth(firebaseAppInstance);
    firestoreDbInstance = getFirestore(firebaseAppInstance);
  } catch (e) {
    console.error('Error initializing Firebase with stored config:', e);
  }

  return {
    app: firebaseAppInstance,
    auth: firebaseAuthInstance,
    db: firestoreDbInstance
  };
}

export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged 
};

export async function fetchOrCreateUserProfile(user: User): Promise<UserProfile> {
  const { db } = initFirebaseService();
  const hwid = getHardwareId();
  const currentIp = await getPublicIpAddress();
  const nowIso = new Date().toISOString();

  if (!db) {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Music Fan',
      photoURL: user.photoURL,
      isSubscribed: false,
      subscriptionPlan: 'Free Tier',
      lastIpAddress: currentIp,
      hardwareId: hwid
    };
  }

  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data();
    // Check if subscription has expired
    let isSubscribed = data.isSubscribed ?? false;
    if (isSubscribed && data.subscriptionExpiresAt) {
      const expires = new Date(data.subscriptionExpiresAt).getTime();
      if (Date.now() > expires) {
        isSubscribed = false; // expired
      }
    }

    const isAdmin = data.isAdmin ?? (user.email === 'sko134329@gmail.com');
    const status = data.status || (data.isSubscribed && data.status !== 'paused' ? 'active' : data.status === 'paused' ? 'paused' : 'free');

    const ipHistory: string[] = Array.isArray(data.ipHistory) ? data.ipHistory : [];
    if (currentIp && !ipHistory.includes(currentIp)) {
      ipHistory.push(currentIp);
    }

    // Update login timestamp & device info in background
    setDoc(userRef, {
      lastIpAddress: currentIp,
      hardwareId: hwid,
      ipHistory,
      lastLoginAt: nowIso
    }, { merge: true }).catch(err => console.warn('Error updating device info in Firestore:', err));

    return {
      uid: user.uid,
      email: user.email || data.email || null,
      displayName: user.displayName || data.displayName || 'Music Lover',
      photoURL: user.photoURL || data.photoURL || null,
      isSubscribed: isSubscribed && status !== 'paused',
      subscriptionPlan: (isSubscribed && status !== 'paused') ? (data.subscriptionPlan || 'Premium Monthly') : 'Free Tier',
      subscribedAt: data.subscribedAt || undefined,
      subscriptionExpiresAt: data.subscriptionExpiresAt || null,
      status,
      isAdmin,
      permissions: data.permissions || (
        status === 'paused' ? {
          canSearchCatalog: false,
          canAddContent: false,
          canImportSpotify: false,
          canAccessLyrics: false,
          canAccessEqualizer: false
        } : {
          canSearchCatalog: true,
          canAddContent: isSubscribed && status !== 'paused',
          canImportSpotify: isSubscribed && status !== 'paused',
          canAccessLyrics: isSubscribed && status !== 'paused',
          canAccessEqualizer: isSubscribed && status !== 'paused'
        }
      ),
      lastIpAddress: currentIp,
      hardwareId: hwid,
      ipHistory,
      lastLoginAt: nowIso,
      isBanned: !!data.isBanned,
      bannedIp: !!data.bannedIp,
      bannedHwid: !!data.bannedHwid,
      banReason: data.banReason || null
    };
  } else {
    // Firestore setDoc throws an error if any field value is undefined!
    const isOwnerAdmin = user.email === 'sko134329@gmail.com';
    const initialProfileDoc = {
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || user.email?.split('@')[0] || 'Music Lover',
      photoURL: user.photoURL || null,
      isSubscribed: false,
      subscriptionPlan: 'Free Tier',
      subscribedAt: null,
      subscriptionExpiresAt: null,
      status: 'free',
      isAdmin: isOwnerAdmin,
      permissions: {
        canSearchCatalog: true,
        canAddContent: false,
        canImportSpotify: false,
        canAccessLyrics: false,
        canAccessEqualizer: false
      },
      lastIpAddress: currentIp,
      hardwareId: hwid,
      ipHistory: [currentIp],
      lastLoginAt: nowIso,
      isBanned: false,
      bannedIp: false,
      bannedHwid: false,
      banReason: null
    };
    await setDoc(userRef, initialProfileDoc);
    return {
      uid: user.uid,
      email: initialProfileDoc.email,
      displayName: initialProfileDoc.displayName,
      photoURL: initialProfileDoc.photoURL,
      isSubscribed: false,
      subscriptionPlan: 'Free Tier',
      subscribedAt: undefined,
      subscriptionExpiresAt: null,
      status: 'free',
      isAdmin: isOwnerAdmin,
      permissions: initialProfileDoc.permissions,
      lastIpAddress: currentIp,
      hardwareId: hwid,
      ipHistory: [currentIp],
      lastLoginAt: nowIso,
      isBanned: false,
      bannedIp: false,
      bannedHwid: false,
      banReason: null
    };
  }
}

export async function updateUserSubscriptionInFirestore(
  uid: string, 
  isSubscribed: boolean, 
  plan: string = 'Premium Monthly', 
  daysDuration: number = 30
): Promise<UserProfile | null> {
  const { db } = initFirebaseService();
  
  const now = new Date();
  const expiresAt = isSubscribed 
    ? new Date(now.getTime() + daysDuration * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const updateData = {
    isSubscribed,
    subscriptionPlan: isSubscribed ? plan : 'Free Tier',
    subscribedAt: isSubscribed ? now.toISOString() : null,
    subscriptionExpiresAt: expiresAt,
    status: isSubscribed ? 'active' as const : 'free' as const
  };

  if (db) {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, updateData, { merge: true });
  }

  return {
    uid,
    email: null,
    displayName: null,
    photoURL: null,
    ...updateData,
    subscribedAt: updateData.subscribedAt || undefined
  };
}

export async function updateUserPermissionsInFirestore(uid: string, permissions: any): Promise<void> {
  const { db } = initFirebaseService();
  if (!db || !uid) return;
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { permissions }, { merge: true });
  } catch (err) {
    console.error('Error updating user permissions in Firestore:', err);
  }
}

export async function togglePauseUserSubscriptionInFirestore(uid: string, isCurrentlyPaused: boolean): Promise<void> {
  const { db } = initFirebaseService();
  if (!db || !uid) return;
  try {
    const userRef = doc(db, 'users', uid);
    const updates = isCurrentlyPaused 
      ? { 
          isSubscribed: true, 
          status: 'active',
          permissions: {
            canSearchCatalog: true,
            canAddContent: true,
            canImportSpotify: true,
            canAccessLyrics: true,
            canAccessEqualizer: true
          }
        } 
      : { 
          isSubscribed: false, 
          status: 'paused',
          permissions: {
            canSearchCatalog: false,
            canAddContent: false,
            canImportSpotify: false,
            canAccessLyrics: false,
            canAccessEqualizer: false
          }
        };
    await setDoc(userRef, updates, { merge: true });
  } catch (err) {
    console.error('Error toggling pause state in Firestore:', err);
  }
}

export async function cancelAndRemoveUserSubscriptionInFirestore(uid: string): Promise<void> {
  const { db } = initFirebaseService();
  if (!db || !uid) return;
  try {
    const userRef = doc(db, 'users', uid);
    const updates = {
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
    await setDoc(userRef, updates, { merge: true });
  } catch (err) {
    console.error('Error canceling user subscription in Firestore:', err);
  }
}

export async function toggleUserAdminRoleInFirestore(uid: string, currentIsAdmin: boolean): Promise<void> {
  const { db } = initFirebaseService();
  if (!db || !uid) return;
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { isAdmin: !currentIsAdmin }, { merge: true });
  } catch (err) {
    console.error('Error toggling admin role in Firestore:', err);
  }
}

export async function saveSubscriptionRequestToFirestore(request: SubscriptionRequest): Promise<void> {
  const { db } = initFirebaseService();
  if (!db) return;
  try {
    const reqRef = doc(db, 'subscription_requests', request.id);
    await setDoc(reqRef, request);
  } catch (err) {
    console.error('Error saving subscription request to Firestore:', err);
  }
}

export async function updateSubscriptionRequestStatusInFirestore(requestId: string, status: 'approved' | 'rejected'): Promise<void> {
  const { db } = initFirebaseService();
  if (!db) return;
  try {
    const reqRef = doc(db, 'subscription_requests', requestId);
    await updateDoc(reqRef, { status });
  } catch (err) {
    console.error('Error updating subscription request status in Firestore:', err);
  }
}

export function subscribeToUserProfileSnapshot(uid: string, onUpdate: (data: any) => void): () => void {
  const { db } = initFirebaseService();
  if (!db) return () => {};

  const userRef = doc(db, 'users', uid);
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data());
    }
  }, (err) => {
    console.warn('UserProfile real-time snapshot listener error:', err);
  });
}

export async function updateUserProfileNameAndPhoto(uid: string, displayName: string, photoURL?: string): Promise<void> {
  const { auth, db } = initFirebaseService();
  
  if (auth && auth.currentUser && auth.currentUser.uid === uid) {
    try {
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL: photoURL || null
      });
    } catch (err) {
      console.warn('Error updating Firebase Auth profile:', err);
    }
  }

  if (db && uid) {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        displayName,
        photoURL: photoURL || null
      }, { merge: true });
    } catch (err) {
      console.error('Error updating user profile in Firestore:', err);
    }
  }
}

export async function banUserInFirestore(
  targetUid: string, 
  targetIp: string | null, 
  targetHwid: string | null, 
  banIp: boolean, 
  banHwid: boolean, 
  adminUid: string,
  reason: string = 'Violated platform terms'
): Promise<void> {
  const { db } = initFirebaseService();
  if (!db || !targetUid) return;

  const nowIso = new Date().toISOString();

  try {
    // 1. Mark user doc as banned
    const userRef = doc(db, 'users', targetUid);
    await setDoc(userRef, {
      isBanned: true,
      bannedIp: banIp,
      bannedHwid: banHwid,
      banReason: reason,
      bannedAt: nowIso
    }, { merge: true });

    // 2. Add to banned_identifiers collection
    if (banIp && targetIp) {
      const safeIpDocId = `IP_${targetIp.replace(/[:.]/g, '_')}`;
      const ipRef = doc(db, 'banned_identifiers', safeIpDocId);
      await setDoc(ipRef, {
        id: safeIpDocId,
        type: 'ip',
        value: targetIp,
        bannedBy: adminUid,
        bannedAt: nowIso,
        targetUid,
        reason
      });
    }

    if (banHwid && targetHwid) {
      const safeHwidDocId = `HWID_${targetHwid.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const hwidRef = doc(db, 'banned_identifiers', safeHwidDocId);
      await setDoc(hwidRef, {
        id: safeHwidDocId,
        type: 'hwid',
        value: targetHwid,
        bannedBy: adminUid,
        bannedAt: nowIso,
        targetUid,
        reason
      });
    }
  } catch (err) {
    console.error('Error banning user in Firestore:', err);
  }
}

export async function unbanUserInFirestore(
  targetUid: string, 
  targetIp: string | null, 
  targetHwid: string | null
): Promise<void> {
  const { db } = initFirebaseService();
  if (!db || !targetUid) return;

  try {
    // 1. Unmark user doc
    const userRef = doc(db, 'users', targetUid);
    await setDoc(userRef, {
      isBanned: false,
      bannedIp: false,
      bannedHwid: false,
      banReason: null
    }, { merge: true });

    // 2. Remove from banned_identifiers
    if (targetIp) {
      const safeIpDocId = `IP_${targetIp.replace(/[:.]/g, '_')}`;
      const ipRef = doc(db, 'banned_identifiers', safeIpDocId);
      await deleteDoc(ipRef).catch(() => {});
    }

    if (targetHwid) {
      const safeHwidDocId = `HWID_${targetHwid.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const hwidRef = doc(db, 'banned_identifiers', safeHwidDocId);
      await deleteDoc(hwidRef).catch(() => {});
    }
  } catch (err) {
    console.error('Error unbanning user in Firestore:', err);
  }
}

export function subscribeToBannedListSnapshot(onUpdate: (bannedIps: string[], bannedHwids: string[], banRecords: BanRecord[]) => void): () => void {
  const { db } = initFirebaseService();
  if (!db) return () => {};

  try {
    const colRef = collection(db, 'banned_identifiers');
    return onSnapshot(colRef, (snapshot) => {
      const bannedIps: string[] = [];
      const bannedHwids: string[] = [];
      const banRecords: BanRecord[] = [];

      snapshot.docs.forEach(d => {
        const data = d.data() as BanRecord;
        banRecords.push(data);
        if (data.type === 'ip' && data.value) {
          bannedIps.push(data.value);
        } else if (data.type === 'hwid' && data.value) {
          bannedHwids.push(data.value);
        }
      });

      onUpdate(bannedIps, bannedHwids, banRecords);
    }, (err) => {
      console.warn('Banned identifiers listener error:', err);
    });
  } catch (err) {
    console.warn('Failed setting up banned identifiers listener:', err);
    return () => {};
  }
}

export function subscribeToAllUsersSnapshot(onUpdate: (users: UserProfile[]) => void): () => void {
  const { db } = initFirebaseService();
  if (!db) return () => {};

  try {
    const usersCol = collection(db, 'users');
    return onSnapshot(usersCol, (snapshot) => {
      const users: UserProfile[] = snapshot.docs.map(d => {
        const data = d.data();
        let isSubscribed = data.isSubscribed ?? false;
        if (isSubscribed && data.subscriptionExpiresAt) {
          const expires = new Date(data.subscriptionExpiresAt).getTime();
          if (Date.now() > expires) {
            isSubscribed = false;
          }
        }
        return {
          uid: d.id,
          email: data.email || null,
          displayName: data.displayName || 'User',
          photoURL: data.photoURL || null,
          isSubscribed,
          subscriptionPlan: data.subscriptionPlan || (isSubscribed ? 'Premium Monthly' : 'Free Tier'),
          subscribedAt: data.subscribedAt || undefined,
          subscriptionExpiresAt: data.subscriptionExpiresAt || null,
          status: data.status || (isSubscribed ? 'active' : 'free'),
          isAdmin: !!data.isAdmin,
          permissions: data.permissions || {
            canSearchCatalog: true,
            canAddContent: isSubscribed,
            canImportSpotify: isSubscribed,
            canAccessLyrics: isSubscribed,
            canAccessEqualizer: isSubscribed
          },
          lastIpAddress: data.lastIpAddress || null,
          hardwareId: data.hardwareId || null,
          ipHistory: Array.isArray(data.ipHistory) ? data.ipHistory : [],
          lastLoginAt: data.lastLoginAt || null,
          isBanned: !!data.isBanned,
          bannedIp: !!data.bannedIp,
          bannedHwid: !!data.bannedHwid,
          banReason: data.banReason || null
        };
      });
      onUpdate(users);
    }, (err) => {
      console.warn('AllUsers snapshot listener error:', err);
    });
  } catch (err) {
    console.warn('Failed setting up all users snapshot listener:', err);
    return () => {};
  }
}

export function subscribeToSubscriptionRequestsSnapshot(onUpdate: (requests: SubscriptionRequest[]) => void): () => void {
  const { db } = initFirebaseService();
  if (!db) return () => {};

  try {
    const q = query(collection(db, 'subscription_requests'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const requests: SubscriptionRequest[] = snapshot.docs.map(d => d.data() as SubscriptionRequest);
      onUpdate(requests);
    }, (err) => {
      console.warn('SubscriptionRequests real-time snapshot listener error:', err);
    });
  } catch (err) {
    console.warn('Failed setting up subscription requests listener:', err);
    return () => {};
  }
}
