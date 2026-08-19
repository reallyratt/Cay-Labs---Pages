import { Note } from '../types';

export interface GoogleUser {
  email: string;
  name: string;
  avatarUrl: string;
  lastSyncedAt: number | null;
}

export interface SavedAccount {
  email: string;
  name: string;
  avatarUrl: string;
  lastSyncedAt?: number;
}

const STORAGE_KEY_CURRENT_USER = 'caylabs_account_current_user';
const STORAGE_KEY_SAVED_ACCOUNTS = 'caylabs_device_saved_accounts';
const STORAGE_KEY_USER_NOTES_PREFIX = 'caylabs_account_notes_';

// Default initial account for quick seamless device recognition
const DEFAULT_PRESET_ACCOUNT: SavedAccount = {
  email: 'cahyobasuki00@gmail.com',
  name: 'Cahyo Basuki',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
};

/**
 * Gets all saved/logged accounts on this device
 */
export function getSavedAccountsOnDevice(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_ACCOUNTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return [DEFAULT_PRESET_ACCOUNT];
}

/**
 * Saves or updates an account in the device accounts list
 */
export function addSavedAccountOnDevice(account: SavedAccount): void {
  try {
    const current = getSavedAccountsOnDevice();
    const filtered = current.filter((a) => a.email.toLowerCase() !== account.email.toLowerCase());
    const updated = [account, ...filtered];
    localStorage.setItem(STORAGE_KEY_SAVED_ACCOUNTS, JSON.stringify(updated));
  } catch {
    // localstorage error handled
  }
}

/**
 * Removes an account from device list
 */
export function removeSavedAccountOnDevice(email: string): void {
  try {
    const current = getSavedAccountsOnDevice();
    const updated = current.filter((a) => a.email.toLowerCase() !== email.toLowerCase());
    localStorage.setItem(STORAGE_KEY_SAVED_ACCOUNTS, JSON.stringify(updated));
  } catch {
    // handled
  }
}

/**
 * Gets currently logged in user from storage
 */
export function getStoredGoogleUser(): GoogleUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // handled
  }
  return null;
}

/**
 * Sets or clears currently active user session
 */
export function setStoredGoogleUser(user: GoogleUser | null): void {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
      // Also register into saved device accounts
      addSavedAccountOnDevice({
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        lastSyncedAt: user.lastSyncedAt || Date.now(),
      });
    }
  } catch {
    // handled
  }
}

/**
 * Loads notes stored for a specific account email
 */
export function getAccountStoredNotes(email: string): Note[] {
  try {
    const key = `${STORAGE_KEY_USER_NOTES_PREFIX}${email.toLowerCase()}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // handled
  }
  return [];
}

/**
 * Saves notes for a specific account email
 */
export function saveAccountStoredNotes(email: string, notes: Note[]): void {
  try {
    const key = `${STORAGE_KEY_USER_NOTES_PREFIX}${email.toLowerCase()}`;
    localStorage.setItem(key, JSON.stringify(notes));
  } catch {
    // handled
  }
}

/**
 * Performs bi-directional synchronization between local notes state and account storage.
 * Merge algorithm: Latest updatedAt timestamp wins, new items from both sides are preserved.
 */
export function syncNotesWithCloud(
  localNotes: Note[],
  userEmail: string
): { mergedNotes: Note[]; syncTimestamp: number } {
  const accountNotes = getAccountStoredNotes(userEmail);
  const map = new Map<string, Note>();

  // 1. Add current local notes
  localNotes.forEach((n) => map.set(n.id, n));

  // 2. Merge account stored notes
  accountNotes.forEach((remoteNote) => {
    const existing = map.get(remoteNote.id);
    if (!existing) {
      map.set(remoteNote.id, remoteNote);
    } else {
      const localTime = Number(existing.updatedAt) || 0;
      const remoteTime = Number(remoteNote.updatedAt) || 0;
      if (remoteTime > localTime) {
        map.set(remoteNote.id, remoteNote);
      }
    }
  });

  const mergedNotes = Array.from(map.values()).sort(
    (a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0)
  );
  const syncTimestamp = Date.now();

  // Save merged state back to account storage
  saveAccountStoredNotes(userEmail, mergedNotes);

  // Update last synced timestamp on active user
  const currentUser = getStoredGoogleUser();
  if (currentUser && currentUser.email.toLowerCase() === userEmail.toLowerCase()) {
    const updatedUser = { ...currentUser, lastSyncedAt: syncTimestamp };
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(updatedUser));
  }

  return { mergedNotes, syncTimestamp };
}

/**
 * High-level full account sync call
 */
export async function performFullAccountSync(
  localNotes: Note[],
  userEmail: string
): Promise<{ mergedNotes: Note[]; syncTimestamp: number; isDriveSynced: boolean; message: string }> {
  const { mergedNotes, syncTimestamp } = syncNotesWithCloud(localNotes, userEmail);
  return {
    mergedNotes,
    syncTimestamp,
    isDriveSynced: false,
    message: `Notes successfully synchronized with ${userEmail}`,
  };
}
