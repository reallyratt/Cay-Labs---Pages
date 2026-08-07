import { Note } from '../types';
import { getStoredAccessToken, syncWithGoogleDrive } from './googleDriveSync';

export interface GoogleUser {
  email: string;
  name: string;
  avatarUrl: string;
  lastSyncedAt: number | null;
  driveFolderCreated?: boolean;
}

const STORAGE_KEY_USER = 'caylabs_google_user';
const STORAGE_KEY_CLOUD_PREFIX = 'caylabs_cloud_notes_';

/**
 * Gets currently logged in CayLabs / Google user from localStorage.
 */
export function getStoredGoogleUser(): GoogleUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Saves or clears logged in Google user.
 */
export function setStoredGoogleUser(user: GoogleUser | null): void {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY_USER);
  } else {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  }
}

/**
 * Fallback local cloud sync per user email
 */
export function syncNotesWithCloud(
  localNotes: Note[],
  userEmail: string
): { mergedNotes: Note[]; syncTimestamp: number } {
  const cloudKey = `${STORAGE_KEY_CLOUD_PREFIX}${userEmail}`;
  let cloudNotes: Note[] = [];

  try {
    const rawCloud = localStorage.getItem(cloudKey);
    if (rawCloud) {
      cloudNotes = JSON.parse(rawCloud);
    }
  } catch {
    cloudNotes = [];
  }

  const map = new Map<string, Note>();

  // Add all local notes first
  localNotes.forEach((n) => map.set(n.id, n));

  // Merge cloud notes using latest updatedAt timestamp
  cloudNotes.forEach((cNote) => {
    const existing = map.get(cNote.id);
    if (!existing) {
      map.set(cNote.id, cNote);
    } else {
      const localTime = Number(existing.updatedAt) || 0;
      const cloudTime = Number(cNote.updatedAt) || 0;
      if (cloudTime > localTime) {
        map.set(cNote.id, cNote);
      }
    }
  });

  const mergedNotes = Array.from(map.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const syncTimestamp = Date.now();

  // Save merged state back to cloud storage
  try {
    localStorage.setItem(cloudKey, JSON.stringify(mergedNotes));
  } catch {
    // quota handled
  }

  // Update last synced time for user
  const user = getStoredGoogleUser();
  if (user && user.email === userEmail) {
    setStoredGoogleUser({ ...user, lastSyncedAt: syncTimestamp, driveFolderCreated: user.driveFolderCreated ?? false });
  }

  return { mergedNotes, syncTimestamp };
}

/**
 * Full CayLabs Account Sync with Google Drive:
 * 1. Attempts Google Drive sync into App.CayLabs -> Pages -> (Page, Archive, Dumpster).
 * 2. If token is absent or request fails, seamlessly falls back to local account cloud sync.
 */
export async function performFullAccountSync(
  localNotes: Note[],
  userEmail: string
): Promise<{ mergedNotes: Note[]; syncTimestamp: number; isDriveSynced: boolean; message: string }> {
  const token = getStoredAccessToken();

  if (token) {
    try {
      const { mergedNotes, syncTimestamp } = await syncWithGoogleDrive(token, localNotes);
      const user = getStoredGoogleUser();
      if (user) {
        setStoredGoogleUser({
          ...user,
          lastSyncedAt: syncTimestamp,
          driveFolderCreated: true,
        });
      }
      return {
        mergedNotes,
        syncTimestamp,
        isDriveSynced: true,
        message: 'Synced with Google Drive (App.CayLabs/Pages/Page, Archive, Dumpster)',
      };
    } catch (err) {
      console.warn('Google Drive sync error, falling back to local account sync:', err);
    }
  }

  // Fallback to local account sync
  const { mergedNotes, syncTimestamp } = syncNotesWithCloud(localNotes, userEmail);
  return {
    mergedNotes,
    syncTimestamp,
    isDriveSynced: false,
    message: 'Synced locally with CayLabs Account Cloud',
  };
}
