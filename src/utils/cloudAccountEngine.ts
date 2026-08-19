import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Note } from '../types';

// Initialize Firebase App & Firestore with configured Database ID
const databaseId =
  (firebaseConfig as any).firestoreDatabaseId ||
  'ai-studio-pages-1b327c90-5e1b-41e0-8e27-cb2c0622fbfe';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app, databaseId);

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
const STORAGE_CURRENT_NOTES = 'pages_notes_v3';

/**
 * Strips undefined values and deep clones data so Firestore never rejects payloads
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === undefined || data === null) return null as any;
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (value === undefined ? null : value))
  );
}

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
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.username === 'string') {
      return parsed;
    }
    return null;
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
  } catch (err) {
    console.error('Failed to set active user session:', err);
  }
}

/**
 * Local accounts vault fallback
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
    console.warn('Cloud check notice, checking local vault:', err);
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

  const appUser: AppUser = {
    username,
    displayName,
    avatarUrl,
    createdAt: now,
    lastSyncedAt: now,
  };

  const cleanedNotes = cleanForFirestore(currentNotes);

  // 1. Save to Cloud Firestore
  try {
    await setDoc(userDocRef, cleanForFirestore({
      username,
      displayName,
      passwordHash,
      avatarUrl,
      createdAt: now,
      lastLoginAt: now,
    }));

    const notesDocRef = doc(db, 'user_notes', username);
    await setDoc(notesDocRef, cleanForFirestore({
      username,
      notes: cleanedNotes,
      updatedAt: now,
    }));
  } catch (cloudErr) {
    console.warn('Firestore write warning:', cloudErr);
  }

  // 2. Save locally
  saveToLocalVault(userRecord);
  setActiveUser(appUser);
  try {
    localStorage.setItem(STORAGE_CURRENT_NOTES, JSON.stringify(currentNotes));
    localStorage.setItem(`${STORAGE_USER_NOTES_PREFIX}${username}`, JSON.stringify(currentNotes));
  } catch {
    // handled
  }

  return { user: appUser, notes: currentNotes };
}

/**
 * Logs in with username & password from ANY device (including a new phone).
 * Pulls notes down from Cloud Firestore.
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
  let remoteNotes: Note[] | null = null;

  // 1. Fetch user profile from Cloud Firestore
  try {
    const userDocRef = doc(db, 'users', username);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      cloudUserData = userSnap.data();
    }
  } catch (err) {
    console.warn('Could not fetch from Firestore, checking offline vault:', err);
  }

  // Fallback to local vault if offline
  if (!cloudUserData) {
    const localVault = getLocalVault();
    if (localVault[username]) {
      cloudUserData = localVault[username];
    }
  }

  if (!cloudUserData) {
    throw new Error(`Account "${username}" not found. Please click "Create Account" first.`);
  }

  // Verify password hash
  if (cloudUserData.passwordHash !== inputHash) {
    throw new Error('Incorrect password. Please try again.');
  }

  // 2. Fetch user notes from Cloud Firestore
  try {
    const notesDocRef = doc(db, 'user_notes', username);
    const notesSnap = await getDoc(notesDocRef);
    if (notesSnap.exists()) {
      const data = notesSnap.data();
      if (Array.isArray(data?.notes)) {
        remoteNotes = data.notes;
      }
    }
  } catch (err) {
    console.warn('Could not fetch remote notes from cloud:', err);
  }

  // Fallback to local cached notes for this user if available
  if (remoteNotes === null) {
    try {
      const cached = localStorage.getItem(`${STORAGE_USER_NOTES_PREFIX}${username}`);
      if (cached) remoteNotes = JSON.parse(cached);
    } catch {
      remoteNotes = [];
    }
  }

  let finalNotes: Note[] = [];

  // Check if current device notes are just initial welcome placeholders
  const isDefaultLocal =
    currentDeviceNotes.length > 0 &&
    currentDeviceNotes.every(
      (n) => n.id === 'n-welcome-guide' || n.id === 'n-feature-showcase'
    );

  if (remoteNotes && remoteNotes.length > 0) {
    if (isDefaultLocal || currentDeviceNotes.length === 0) {
      // Clean switch to user's remote notes
      finalNotes = remoteNotes;
    } else {
      // Merge remote notes with any notes created on this device
      const noteMap = new Map<string, Note>();
      remoteNotes.forEach((n) => noteMap.set(n.id, n));
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
      finalNotes = Array.from(noteMap.values()).sort(
        (a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0)
      );
    }
  } else {
    // If no remote notes yet, use current device notes
    finalNotes = currentDeviceNotes;
  }

  const now = Date.now();

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

  // Set session and save notes
  setActiveUser(appUser);
  try {
    localStorage.setItem(STORAGE_CURRENT_NOTES, JSON.stringify(finalNotes));
    localStorage.setItem(`${STORAGE_USER_NOTES_PREFIX}${username}`, JSON.stringify(finalNotes));
  } catch {
    // handled
  }

  // Upload combined notes back to cloud in background
  try {
    const notesDocRef = doc(db, 'user_notes', username);
    await setDoc(notesDocRef, cleanForFirestore({
      username,
      notes: cleanForFirestore(finalNotes),
      updatedAt: now,
    }));
  } catch (err) {
    console.warn('Initial cloud save notice:', err);
  }

  return { user: appUser, notes: finalNotes };
}

/**
 * Performs a complete bidirectional sync with Cloud Firestore:
 * 1. Pulls latest notes from Firestore.
 * 2. Merges with local device notes.
 * 3. Writes merged notes back to Firestore and local storage.
 * 4. Refreshes user session timestamp.
 */
export async function performFullSync(
  currentNotes: Note[],
  userOverride?: AppUser | null
): Promise<{ success: boolean; user: AppUser | null; mergedNotes: Note[]; message: string }> {
  const user = userOverride || getCurrentUser();
  if (!user) {
    return {
      success: false,
      user: null,
      mergedNotes: currentNotes,
      message: 'Please log in to sync notes.',
    };
  }

  let remoteNotes: Note[] | null = null;
  const now = Date.now();

  // 1. Fetch from Firestore
  try {
    const notesDocRef = doc(db, 'user_notes', user.username);
    const snap = await getDoc(notesDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.notes)) {
        remoteNotes = data.notes;
      }
    }
  } catch (err: any) {
    console.warn('Firestore fetch error during sync:', err);
  }

  // 2. Merge logic
  let merged: Note[] = [];
  if (remoteNotes && remoteNotes.length > 0) {
    const map = new Map<string, Note>();
    remoteNotes.forEach((n) => map.set(n.id, n));

    currentNotes.forEach((localN) => {
      const remote = map.get(localN.id);
      if (!remote) {
        map.set(localN.id, localN);
      } else {
        const remoteTime = Number(remote.updatedAt) || 0;
        const localTime = Number(localN.updatedAt) || 0;
        if (localTime > remoteTime) {
          map.set(localN.id, localN);
        }
      }
    });

    merged = Array.from(map.values()).sort(
      (a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0)
    );
  } else {
    merged = currentNotes;
  }

  // 3. Save to Firestore
  let cloudSuccess = false;
  try {
    const notesDocRef = doc(db, 'user_notes', user.username);
    await setDoc(notesDocRef, cleanForFirestore({
      username: user.username,
      notes: cleanForFirestore(merged),
      updatedAt: now,
    }));
    cloudSuccess = true;
  } catch (err: any) {
    console.warn('Firestore write error during sync:', err);
  }

  // 4. Update local storage & user session
  const updatedUser: AppUser = {
    ...user,
    lastSyncedAt: now,
  };
  setActiveUser(updatedUser);

  try {
    localStorage.setItem(STORAGE_CURRENT_NOTES, JSON.stringify(merged));
    localStorage.setItem(`${STORAGE_USER_NOTES_PREFIX}${user.username}`, JSON.stringify(merged));
  } catch {
    // handled
  }

  return {
    success: cloudSuccess,
    user: updatedUser,
    mergedNotes: merged,
    message: cloudSuccess ? 'Synced to Cloud Firestore' : 'Saved locally (Cloud offline)',
  };
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
    await setDoc(notesDocRef, cleanForFirestore({
      username: user.username,
      notes: cleanForFirestore(notes),
      updatedAt: now,
    }));

    const updatedUser: AppUser = { ...user, lastSyncedAt: now };
    setActiveUser(updatedUser);

    return { success: true, timestamp: now };
  } catch (err) {
    console.warn('Cloud sync background notice:', err);
    return { success: false, timestamp: now };
  }
}
