import { Note, Folder } from '../types';

const NOTES_KEY = 'pages_notes_v3';
const FOLDERS_KEY = 'pages_folders_v3';

export const DEFAULT_FOLDERS: Folder[] = [
  { id: 'f-getting-started', name: 'Getting Started with Pages', color: '#3B82F6', icon: 'Sparkles' },
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'n-welcome-guide',
    title: 'Welcome to Pages & User Guide',
    content: `<h2>Welcome to Pages</h2>
<p>Pages is a minimal note-taking application designed with precision formatting tools, clean typography, and dual viewport responsive layouts.</p>

<h4>App Overview & Features Guide</h4>
<ul>
  <li><b>Text Sizing (S1 - S4):</b> Select any line or heading to switch sizes from S1 (Title), S2 (Subheading), S3 (Body Text), to S4 (Subtext).</li>
  <li><b>Text Emphasis:</b> Style text with <b>Bold</b>, <i>Italic</i>, <u>Underline</u>, <s>Strikethrough</s>, or custom color highlights.</li>
  <li><b>List Formatting:</b> Create Bullet Dots, Dashed Stripes, Numbered (1 2 3), or Alphabetical (A B C) lists.</li>
  <li><b>Paintbrush (Continuous Numbering):</b> Click the Paintbrush icon on numbered or alphabetical lists to continue counting from a previous list across paragraph breaks!</li>
  <li><b>Alignment & Indent:</b> Align text left or justified, and use indent arrows to structure nested content.</li>
  <li><b>Folders & Organization:</b> Group your pages into custom categories like <i>Getting Started with Pages</i>.</li>
  <li><b>Pin, Archive & Dumpster:</b> Pin essential pages to the top, archive inactive notes, or soft-delete items to the Dumpster.</li>
  <li><b>Dual View Mode:</b> Switch between Desktop dual-pane and Mobile single-pane views anytime from Settings.</li>
  <li><b>Import / Export:</b> Easily backup and restore your notes as JSON files.</li>
</ul>`,
    isPinned: true,
    isArchived: false,
    isDeleted: false,
    folderId: 'f-getting-started',
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
    color: '#FAF9F6',
    tags: ['welcome', 'guide']
  },
  {
    id: 'n-feature-showcase',
    title: 'Feature Showcase',
    content: `<h1>Feature Showcase & Formatting Demo</h1>
<h2>Exploring Typography & Styling Options</h2>
<p>This note showcases all text formatting capabilities and structural elements available in Pages.</p>

<h4>1. Text Sizes & Heading Levels</h4>
<h1>Size S1 - Large Display Heading</h1>
<h2>Size S2 - Section Header</h2>
<p>Size S3 - Standard Body Paragraph with comfortable line height and tracking.</p>
<h4>Size S4 - Subtle Caption or Meta Subtext</h4>

<h4>2. Text Emphasis & Style Combinations</h4>
<p>Here are single and combined styling examples:</p>
<ul>
  <li>Standard plain text</li>
  <li><b>Bold weight text (700)</b></li>
  <li><i>Italicized emphasis text</i></li>
  <li><u>Underlined key statement</u></li>
  <li><s>Strikethrough completed item</s></li>
  <li><b><i>Bold & Italic combined</i></b></li>
  <li><b><u>Bold & Underlined highlight</u></b></li>
  <li><b><i><u><s>All formatting attributes combined together</s></u></i></b></li>
</ul>

<h4>3. Numbered & Alphabetical Lists with Paintbrush Continuation</h4>
<p>First section using Alphabetical list (A, B, C):</p>
<ol class="list-abc" type="A" style="list-style-type: upper-alpha;">
  <li>Primary step: Initialize setup</li>
  <li>Secondary step: Select desired category</li>
  <li>Tertiary step: Write note content</li>
</ol>

<p>A paragraph break separating the first list section.</p>

<p>Second section continued with the <b>Paintbrush</b> feature (D, E):</p>
<ol class="list-abc" type="A" start="4" style="list-style-type: upper-alpha;">
  <li>Fourth step: Apply formatting styles</li>
  <li>Fifth step: Save and export note</li>
</ol>

<p>First section using Numbered list (1, 2):</p>
<ol class="list-numbers" type="1" style="list-style-type: decimal;">
  <li>First item in numerical list</li>
  <li>Second item in numerical list</li>
</ol>

<p>Another paragraph break before continuing numbers.</p>

<p>Continued Numbered list with Paintbrush (3, 4):</p>
<ol class="list-numbers" type="1" start="3" style="list-style-type: decimal;">
  <li>Third item continuing sequence</li>
  <li>Fourth item continuing sequence</li>
</ol>

<h4>4. Bullet Dots & Dashed Stripes</h4>
<ul class="list-dots" style="list-style-type: disc;">
  <li>Standard bullet point A</li>
  <li>Standard bullet point B</li>
</ul>

<ul class="list-stripes" style="list-style-type: '- ';">
  <li>Dashed stripe item 1</li>
  <li>Dashed stripe item 2</li>
</ul>

<h4>5. Text Alignment</h4>
<p style="text-align: left;">This text block is aligned to the left side by default.</p>
<p style="text-align: justify;">This text block is fully justified across the container width, creating clean geometric margins on both left and right edges of the note view.</p>`,
    isPinned: true,
    isArchived: false,
    isDeleted: false,
    folderId: 'f-getting-started',
    createdAt: Date.now() - 3600000 * 1,
    updatedAt: Date.now() - 3600000 * 1,
    color: '#FAF9F6',
    tags: ['showcase', 'demo']
  }
];

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) {
      saveNotes(INITIAL_NOTES);
      return INITIAL_NOTES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load notes', err);
    return INITIAL_NOTES;
  }
}

export function saveNotes(notes: Note[]): void {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (err) {
    console.error('Failed to save notes', err);
  }
}

export function loadFolders(): Folder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    if (!raw) {
      saveFolders(DEFAULT_FOLDERS);
      return DEFAULT_FOLDERS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load folders', err);
    return DEFAULT_FOLDERS;
  }
}

export function saveFolders(folders: Folder[]): void {
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  } catch (err) {
    console.error('Failed to save folders', err);
  }
}

export function formatTimeAgo(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
