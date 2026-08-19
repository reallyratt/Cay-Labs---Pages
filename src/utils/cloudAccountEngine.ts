import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Note, Folder } from '../types';

// Initialize Firebase App & Firestore
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

export interface AppUser {
  username: string;
  displayName: string;
  avatarUrl: string;
  createdAt: number;
  lastSyncedAt: number;
}

const STORAGE_ACTIVE_USER = 'pages_active_user_session';
const STORAGE_LOCAL_ACCOUNTS = 'pages_local_accounts_vault';
const STORAGE_USER_NOTES_PREFIX = 'pages_cloud_notes_';

/**
 * Fast, secure client-side SHA-256 password hashing
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_pages_salt_secure_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates and sanitizes username
 */
export function sanitizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
}

/**
 * Gets currently logged in user session from storage
 */
export function getCurrentUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Sets or clears active user session
 */
export function setActiveUser(user: AppUser | null): void {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_ACTIVE_USER);
    } else {
      localStorage.setItem(STORAGE_ACTIVE_USER, JSON.stringify(user));
    }
  } catch {
    // handled
  }
}

/**
 * Local accounts vault fallback (ensures offline reliability)
 */
interface VaultAccount {
  username: string;
  displayName: string;
  passwordHash: string;
  avatarUrl: string;
  createdAt: number;
  lastSyncedAt: number;
}

function getLocalVault(): Record<string, VaultAccount> {
  try {
    const raw = localStorage.getItem(STORAGE_LOCAL_ACCOUNTS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToLocalVault(acc: VaultAccount): void {
  try {
    const vault = getLocalVault();
    vault[acc.username] = acc;
    localStorage.setItem(STORAGE_LOCAL_ACCOUNTS, JSON.stringify(vault));
  } catch {
    // handled
  }
}

/**
 * Creates a brand new user account in Cloud Firestore.
 * Checks if the username is taken across all devices.
 */
export async function createAccount(
  rawUsername: string,
  rawPassword: string,
  rawDisplayName?: string,
  currentNotes: Note[] = []
): Promise<{ user: AppUser; notes: Note[] }> {
  const username = sanitizeUsername(rawUsername);

  if (!username || username.length < 3) {
    throw new Error('Username must be at least 3 characters (letters, numbers, underscores).');
  }

  if (!rawPassword || rawPassword.length < 4) {
    throw new Error('Password must be at least 4 characters.');
  }

  const passwordHash = await hashPassword(rawPassword);
  const displayName = rawDisplayName?.trim() || rawUsername.trim();
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    displayName
  )}&background=8C8679&color=fff&bold=true`;

  const userDocRef = doc(db, 'users', username);
  let userExistsInCloud = false;

  try {
    const existingSnap = await getDoc(userDocRef);
    if (existingSnap.exists()) {
      userExistsInCloud = true;
    }
  } catch (err) {
    console.warn('Cloud check error, checking local vault:', err);
    const vault = getLocalVault();
    if (vault[username]) {
      userExistsInCloud = true;
    }
  }

  if (userExistsInCloud) {
    throw new Error(`Username "${username}" is already taken. Please choose another username.`);
  }

  const now = Date.now();
  const userRecord: VaultAccount = {
    username,
    displayName,
    passwordHash,
    avatarUrl,
    createdAt: now,
    lastSyncedAt: now,
  };

  // 1. Save to Cloud Firestore
  try {
    await setDoc(userDocRef, {
      username,
      displayName,
      passwordHash,
      avatarUrl,
      createdAt: now,
      lastLoginAt: now,
    });

    const notesDocRef = doc(db, 'user_notes', username);
    await setDoc(notesDocRef, {
      username,
      notes: currentNotes,
      updatedAt: now,
    });
  } catch (cloudErr) {
    console.warn('Firestore write warning, saving locally:', cloudErr);
  }

  // 2. Save locally
  saveToLocalVault(userRecord);
  localStorage.setItem(`${STORAGE_USER_NOTES_PREFIX}${username}`, JSON.stringify(currentNotes));

  const appUser: AppUser = {
    username,
    displayName,
    avatarUrl,
    createdAt: now,
    lastSyncedAt: now,
  };

  setActiveUser(appUser);
  return { user: appUser, notes: currentNotes };
}

/**
 * Logs in with username & password from ANY device (even a brand new phone!).
 * Pulls all your notes down from Cloud Firestore.
 */
export async function loginAccount(
  rawUsername: string,
  rawPassword: string,
  currentDeviceNotes: Note[] = []
): Promise<{ user: AppUser; notes: Note[] }> {
  const username = sanitizeUsername(rawUsername);

  if (!username) {
    throw new Error('Please enter your username.');
  }

  if (!rawPassword) {
    throw new Error('Please enter your password.');
  }

  const inputHash = await hashPassword(rawPassword);
  let cloudUserData: any = null;
  let cloudNotes: Note[] = [];

  // 1. Fetch user from Cloud Firestore
  try {
    const userDocRef = doc(db, 'users', username);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      cloudUserData = userSnap.data();
    }
  } catch (err) {
    console.warn('Could not fetch from Firestore, checking offline cache:', err);
  }

  // 2. If cloud check didn't succeed, check local vault
  if (!cloudUserData) {
    const localVault = getLocalVault();
    if (localVault[username]) {
      cloudUserData = localVault[username];
    }
  }

  if (!cloudUserData) {
    throw new Error(`Account "${username}" not found. Please click "Create Account" first.`);
  }

  // 3. Verify password
  if (cloudUserData.passwordHash !== inputHash) {
    throw new Error('Incorrect password. Please try again.');
  }

  // 4. Fetch user notes from Cloud Firestore
  try {
    const notesDocRef = doc(db, 'user_notes', username);
    const notesSnap = await getDoc(notesDocRef);
    if (notesSnap.exists()) {
      const data = notesSnap.data();
      if (Array.isArray(data?.notes)) {
        cloudNotes = data.notes;
      }
    }
  } catch (err) {
    console.warn('Could not fetch remote notes:', err);
    try {
      const cached = localStorage.getItem(`${STORAGE_USER_NOTES_PREFIX}${username}`);
      if (cached) cloudNotes = JSON.parse(cached);
    } catch {
      cloudNotes = [];
    }
  }

  // 5. Merge Cloud Notes with any active device notes
  const noteMap = new Map<string, Note>();

  // Add cloud notes first
  cloudNotes.forEach((n) => noteMap.set(n.id, n));

  // Merge any new local notes from this device
  currentDeviceNotes.forEach((localN) => {
    const remote = noteMap.get(localN.id);
    if (!remote) {
      noteMap.set(localN.id, localN);
    } else {
      const remoteTime = Number(remote.updatedAt) || 0;
      const localTime = Number(localN.updatedAt) || 0;
      if (localTime > remoteTime) {
        noteMap.set(localN.id, localN);
      }
    }
  });

  const mergedNotes = Array.from(noteMap.values()).sort(
    (a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0)
  );

  const now = Date.now();

  // Save merged state back to cloud & local
  try {
    const notesDocRef = doc(db, 'user_notes', username);
    await setDoc(notesDocRef, {
      username,
      notes: mergedNotes,
      updatedAt: now,
    });
  } catch {
    // handled
  }

  localStorage.setItem(`${STORAGE_USER_NOTES_PREFIX}${username}`, JSON.stringify(mergedNotes));

  const appUser: AppUser = {
    username: cloudUserData.username || username,
    displayName: cloudUserData.displayName || username,
    avatarUrl:
      cloudUserData.avatarUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        cloudUserData.displayName || username
      )}&background=8C8679&color=fff&bold=true`,
    createdAt: cloudUserData.createdAt || now,
    lastSyncedAt: now,
  };

  setActiveUser(appUser);
  return { user: appUser, notes: mergedNotes };
}

/**
 * Synchronizes notes to Cloud Firestore in the background
 */
export async function syncNotesToCloud(
  notes: Note[],
  userOverride?: AppUser | null
): Promise<{ success: boolean; timestamp: number }> {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return { success: false, timestamp: Date.now() };
  }

  const now = Date.now();

  // 1. Local backup
  try {
    localStorage.setItem(`${STORAGE_USER_NOTES_PREFIX}${user.username}`, JSON.stringify(notes));
  } catch {
    // handled
  }

  // 2. Cloud Firestore backup
  try {
    const notesDocRef = doc(db, 'user_notes', user.username);
    await setDoc(notesDocRef, {
      username: user.username,
      notes,
      updatedAt: now,
    });

    const updatedUser: AppUser = { ...user, lastSyncedAt: now };
    setActiveUser(updatedUser);

    return { success: true, timestamp: now };
  } catch (err) {
    console.warn('Cloud sync background error:', err);
    return { success: false, timestamp: now };
  }
}
