import { Note } from '../types';
import { GoogleUser, setStoredGoogleUser, getStoredGoogleUser } from './googleSyncEngine';

const STORAGE_KEY_TOKEN = 'caylabs_google_access_token';

export interface DriveFolderInfo {
  appCayLabsId: string;
  pagesFolderId: string;
  pageFolderId: string;
  archiveFolderId: string;
  dumpsterFolderId: string;
}

export function getStoredAccessToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
}

export function setStoredAccessToken(token: string | null): void {
  if (!token) {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  } else {
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
  }
}

/**
 * Searches for or creates a folder on Google Drive
 */
async function getOrCreateFolder(
  accessToken: string,
  folderName: string,
  parentId?: string
): Promise<string> {
  const parentQuery = parentId ? `'${parentId}' in parents` : `'root' in parents`;
  const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and ${parentQuery} and trashed = false`;

  // Search existing
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Create folder if not found
  const createMetadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    createMetadata.parents = [parentId];
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createMetadata),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create folder ${folderName} on Google Drive`);
  }

  const createdData = await createRes.json();
  return createdData.id;
}

/**
 * Ensures the App.CayLabs -> Pages -> (Page, Archive, Dumpster) folder hierarchy exists
 */
export async function ensureDriveFolderStructure(accessToken: string): Promise<DriveFolderInfo> {
  // 1. Root level: App.CayLabs
  const appCayLabsId = await getOrCreateFolder(accessToken, 'App.CayLabs');

  // 2. Inside App.CayLabs: Pages
  const pagesFolderId = await getOrCreateFolder(accessToken, 'Pages', appCayLabsId);

  // 3. Inside Pages: Page, Archive, Dumpster
  const pageFolderId = await getOrCreateFolder(accessToken, 'Page', pagesFolderId);
  const archiveFolderId = await getOrCreateFolder(accessToken, 'Archive', pagesFolderId);
  const dumpsterFolderId = await getOrCreateFolder(accessToken, 'Dumpster', pagesFolderId);

  return {
    appCayLabsId,
    pagesFolderId,
    pageFolderId,
    archiveFolderId,
    dumpsterFolderId,
  };
}

/**
 * Helper to list JSON files in a drive folder
 */
async function listFilesInFolder(accessToken: string, folderId: string): Promise<Array<{ id: string; name: string; modifiedTime: string }>> {
  const query = `'${folderId}' in parents and trashed = false`;
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) return [];
  const data = await res.json();
  return data.files || [];
}

/**
 * Helper to read JSON file content from drive
 */
async function readNoteFileFromDrive(accessToken: string, fileId: string): Promise<Note | null> {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Helper to upload/update note JSON file in drive folder
 */
async function uploadNoteToDrive(
  accessToken: string,
  folderId: string,
  note: Note,
  existingFileId?: string
): Promise<string> {
  const filename = `page_${note.id}.json`;
  const metadata = {
    name: filename,
    mimeType: 'application/json',
    parents: existingFileId ? undefined : [folderId],
  };

  const fileContent = JSON.stringify(note, null, 2);

  if (existingFileId) {
    // Update content
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: fileContent,
      }
    );
    if (res.ok) return existingFileId;
  }

  // Multipart upload for new file
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const body =
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    throw new Error('Failed to upload file to Google Drive');
  }

  const created = await res.json();
  return created.id;
}

/**
 * Syncs local notes with Google Drive folder structure:
 * App.CayLabs -> Pages -> (Page, Archive, Dumpster)
 */
export async function syncWithGoogleDrive(
  accessToken: string,
  localNotes: Note[]
): Promise<{ mergedNotes: Note[]; syncTimestamp: number; folders: DriveFolderInfo }> {
  // 1. Ensure folders exist
  const folders = await ensureDriveFolderStructure(accessToken);

  // 2. Fetch remote notes from 3 subfolders
  const [pageFiles, archiveFiles, dumpsterFiles] = await Promise.all([
    listFilesInFolder(accessToken, folders.pageFolderId),
    listFilesInFolder(accessToken, folders.archiveFolderId),
    listFilesInFolder(accessToken, folders.dumpsterFolderId),
  ]);

  const remoteNotesMap = new Map<string, { note: Note; fileId: string; folderId: string }>();

  const processFiles = async (files: Array<{ id: string; name: string }>, folderId: string, isArchived: boolean, isDeleted: boolean) => {
    for (const file of files) {
      if (file.name.endsWith('.json')) {
        const parsed = await readNoteFileFromDrive(accessToken, file.id);
        if (parsed && parsed.id) {
          remoteNotesMap.set(parsed.id, {
            note: { ...parsed, isArchived, isDeleted },
            fileId: file.id,
            folderId,
          });
        }
      }
    }
  };

  await Promise.all([
    processFiles(pageFiles, folders.pageFolderId, false, false),
    processFiles(archiveFiles, folders.archiveFolderId, true, false),
    processFiles(dumpsterFiles, folders.dumpsterFolderId, false, true),
  ]);

  // 3. Merge local & remote notes
  const mergedMap = new Map<string, Note>();
  localNotes.forEach((n) => mergedMap.set(n.id, n));

  remoteNotesMap.forEach(({ note: remoteNote }) => {
    const existingLocal = mergedMap.get(remoteNote.id);
    if (!existingLocal) {
      mergedMap.set(remoteNote.id, remoteNote);
    } else {
      const localTime = Number(existingLocal.updatedAt) || 0;
      const remoteTime = Number(remoteNote.updatedAt) || 0;
      if (remoteTime > localTime) {
        mergedMap.set(remoteNote.id, remoteNote);
      }
    }
  });

  const mergedNotes = Array.from(mergedMap.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  // 4. Push updated/new notes to Drive
  for (const note of mergedNotes) {
    const targetFolderId = note.isDeleted
      ? folders.dumpsterFolderId
      : note.isArchived
      ? folders.archiveFolderId
      : folders.pageFolderId;

    const remoteRecord = remoteNotesMap.get(note.id);

    try {
      if (remoteRecord) {
        // Check if folder changed
        if (remoteRecord.folderId !== targetFolderId) {
          // Delete old file and upload to new folder
          await fetch(`https://www.googleapis.com/drive/v3/files/${remoteRecord.fileId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          await uploadNoteToDrive(accessToken, targetFolderId, note);
        } else {
          // Update file content
          await uploadNoteToDrive(accessToken, targetFolderId, note, remoteRecord.fileId);
        }
      } else {
        // Upload new file
        await uploadNoteToDrive(accessToken, targetFolderId, note);
      }
    } catch (err) {
      console.warn(`Drive sync failed for note ${note.id}:`, err);
    }
  }

  const syncTimestamp = Date.now();

  // Update stored user
  const user = getStoredGoogleUser();
  if (user) {
    setStoredGoogleUser({ ...user, lastSyncedAt: syncTimestamp });
  }

  return { mergedNotes, syncTimestamp, folders };
}
