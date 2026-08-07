import JSZip from 'jszip';
import { Note } from '../types';

/**
 * Converts HTML content to plain text by replacing paragraph breaks and stripping tags.
 */
function htmlToPlainText(html: string): string {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n');
  return (temp.textContent || temp.innerText || '').trim();
}

/**
 * Exports notes into a single .zip file containing individual .txt files.
 * @param notes Array of active notes to export.
 * @param formatCoded If true, preserves HTML/formatting tags in the txt files; if false, exports plain text.
 */
export async function exportNotesToZip(notes: Note[], formatCoded: boolean): Promise<void> {
  const zip = new JSZip();
  const filenameCountMap: Record<string, number> = {};

  const activeNotes = notes.filter((n) => !n.isDeleted);
  const notesToExport = activeNotes.length > 0 ? activeNotes : notes;

  notesToExport.forEach((note, index) => {
    let rawTitle = note.title.trim() || `Page ${index + 1}`;
    let safeFilename = rawTitle.replace(/[\/\\?%*:|"<>]/g, '_');

    if (filenameCountMap[safeFilename]) {
      const count = filenameCountMap[safeFilename];
      filenameCountMap[safeFilename] = count + 1;
      safeFilename = `${safeFilename}_${count}`;
    } else {
      filenameCountMap[safeFilename] = 1;
    }

    const fileContent = formatCoded ? note.content : htmlToPlainText(note.content);
    zip.file(`${safeFilename}.txt`, fileContent || '');
  });

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const timestamp = `${hh}.${min}.${dd}.${mm}.${yyyy}`;
  const zipFilename = `Pages.CayLabs[${timestamp}].zip`;

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports notes from a single .txt file or a .zip archive containing .txt files.
 */
export async function importNotesFromFile(
  file: File,
  existingNotes: Note[]
): Promise<{ mergedNotes: Note[]; importedCount: number }> {
  const newNotesToInsert: { title: string; content: string }[] = [];

  if (file.name.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file);
    const txtFiles = Object.keys(zip.files).filter(
      (filename) => !zip.files[filename].dir && filename.endsWith('.txt')
    );

    for (const filename of txtFiles) {
      const content = await zip.files[filename].async('string');
      const cleanTitle = filename.replace(/\.txt$/i, '').replace(/^.*[\\\/]/, '');
      newNotesToInsert.push({ title: cleanTitle, content });
    }
  } else if (file.name.endsWith('.txt')) {
    const content = await file.text();
    const cleanTitle = file.name.replace(/\.txt$/i, '');
    newNotesToInsert.push({ title: cleanTitle, content });
  } else if (file.name.endsWith('.json')) {
    // Fallback for json backup files
    try {
      const content = await file.text();
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        const imported = parsed.map((item: any) => ({
          id: item.id || 'imported_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          title: item.title || 'Imported Page',
          content: item.content || '',
          isPinned: !!item.isPinned,
          isArchived: !!item.isArchived,
          isDeleted: !!item.isDeleted,
          folderId: item.folderId || null,
          createdAt: item.createdAt || Date.now(),
          updatedAt: item.updatedAt || Date.now(),
        }));

        const existingIds = new Set(existingNotes.map((n) => n.id));
        const filteredNew = imported.filter((n: Note) => !existingIds.has(n.id));
        return {
          mergedNotes: [...existingNotes, ...filteredNew],
          importedCount: filteredNew.length,
        };
      }
    } catch {
      // ignore JSON parse failure and proceed
    }
  }

  if (newNotesToInsert.length === 0) {
    return { mergedNotes: existingNotes, importedCount: 0 };
  }

  const now = Date.now();
  const createdNotes: Note[] = newNotesToInsert.map((item, idx) => ({
    id: `imported_${now}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
    title: item.title || 'Imported Page',
    content: item.content.trim().startsWith('<') ? item.content : `<p>${item.content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`,
    isPinned: false,
    isArchived: false,
    isDeleted: false,
    folderId: null,
    createdAt: now,
    updatedAt: now,
  }));

  return {
    mergedNotes: [...existingNotes, ...createdNotes],
    importedCount: createdNotes.length,
  };
}
