import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, signOut, onAuthStateChanged 
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Default mock configuration or check for environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Check if firebase is configured
export const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let app;
let auth;
let db;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
}

// Simulated Local Auth State (Fallback when Firebase is not configured)
class MockAuthService {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
  }

  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    // Trigger immediately with current user
    const localUser = localStorage.getItem('yc_mock_user');
    if (localUser) {
      this.currentUser = JSON.parse(localUser);
    }
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  async signInWithMock(provider) {
    // Generate a beautiful mock user profile
    const name = provider === 'google' ? 'Google Builder' : 'GitHub Hacker';
    const email = `${provider.toLowerCase()}@example.com`;
    const photoURL = provider === 'google' 
      ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150' 
      : 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150';

    const mockUser = {
      uid: `mock_${provider}_${Date.now()}`,
      displayName: name,
      email,
      photoURL,
      isMock: true
    };

    this.currentUser = mockUser;
    localStorage.setItem('yc_mock_user', JSON.stringify(mockUser));
    this.notify();
    return mockUser;
  }

  async signOut() {
    this.currentUser = null;
    localStorage.removeItem('yc_mock_user');
    this.notify();
  }

  notify() {
    this.listeners.forEach(callback => callback(this.currentUser));
  }
}

const mockAuthInstance = new MockAuthService();

// Unified Auth Interface
export async function loginWithProvider(providerName) {
  let user;
  if (isFirebaseConfigured && auth) {
    const provider = providerName === 'google' 
      ? new GoogleAuthProvider() 
      : new GithubAuthProvider();
    const result = await signInWithPopup(auth, provider);
    user = result.user;
  } else {
    user = await mockAuthInstance.signInWithMock(providerName);
  }
  
  if (user) {
    // Automatically sync with backend on login
    await syncUserProfile(user);
  }
  return user;
}

export async function logoutUser() {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  } else {
    await mockAuthInstance.signOut();
  }
}

export function subscribeToAuth(callback) {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        await syncUserProfile(u);
      }
      callback(u);
    });
  } else {
    return mockAuthInstance.onAuthStateChanged(callback);
  }
}

/**
 * Returns the authorization header for API requests.
 */
export function getAuthHeader() {
  if (isFirebaseConfigured && auth && auth.currentUser) {
    return `Bearer ${auth.currentUser.uid}`;
  }
  const localUser = localStorage.getItem('yc_mock_user');
  if (localUser) {
    try {
      const mock = JSON.parse(localUser);
      return `Bearer ${mock.uid}`;
    } catch (e) {
      // Ignored
    }
  }
  return '';
}

// Firestore and Backend operations mapping
export async function syncUserProfile(user, stats, achievements) {
  if (!user) return;
  
  const profileData = {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    lastActive: Date.now(),
    stats: stats || {},
    achievements: achievements || []
  };

  // Sync with Python backend
  try {
    const header = getAuthHeader() || `Bearer ${user.uid}`;
    await fetch('/api/auth/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': header
      },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      })
    });
  } catch (err) {
    console.error("Backend auth sync failed:", err);
  }

  // Legacy Firestore/localStorage sync
  if (isFirebaseConfigured && db) {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, profileData, { merge: true });
    } catch (e) {
      console.error("Firestore sync failed:", e);
    }
  } else {
    // Local fallback sync
    localStorage.setItem(`yc_profile_${user.uid}`, JSON.stringify(profileData));
  }
}

export async function fetchUserProfile(uid) {
  if (isFirebaseConfigured && db) {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return snap.data();
      }
    } catch (e) {
      console.error("Firestore fetch failed:", e);
    }
  }
  
  // Local fallback load
  const localProfile = localStorage.getItem(`yc_profile_${uid}`);
  return localProfile ? JSON.parse(localProfile) : null;
}

