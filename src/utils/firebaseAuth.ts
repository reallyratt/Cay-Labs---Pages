import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Configure Google OAuth Provider
export const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
// Force Google's native account chooser picker on device
provider.setCustomParameters({
  prompt: 'select_account',
});

let cachedAccessToken: string | null = null;

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export function setCachedAccessToken(token: string | null): void {
  cachedAccessToken = token;
}

/**
 * Trigger authentic Google Sign-In with native account picker
 */
export async function triggerGoogleSignIn(): Promise<{
  email: string;
  name: string;
  avatarUrl: string;
  accessToken: string | null;
}> {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;

    if (token) {
      cachedAccessToken = token;
    }

    const u = result.user;
    return {
      email: u.email || 'user@gmail.com',
      name: u.displayName || 'Google User',
      avatarUrl: u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || 'G')}&background=8C8679&color=fff`,
      accessToken: token,
    };
  } catch (err: any) {
    console.error('Google Sign In failed:', err);
    throw err;
  }
}

/**
 * Sign out from Google
 */
export async function logoutGoogle(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out error:', err);
  }
  cachedAccessToken = null;
}
