import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  FileText,
  Folder as FolderIcon,
  Archive,
  Trash2,
  RotateCcw,
  X,
  ArrowLeft,
  Settings,
  Download,
  Upload,
  Wifi,
  WifiOff,
  ShieldCheck,
  SmartphoneNfc,
  Smartphone,
  Monitor,
  Check,
  CheckCheck,
  LayoutGrid,
  Palette,
  Database,
  Info,
  Sun,
  Moon,
  Paintbrush,
  Type,
} from 'lucide-react';
import { Note, Folder, AppSection, ViewMode, PWAState } from '../types';
import { Header } from './Header';
import { NoteCard } from './NoteCard';
import { NoteEditor } from './NoteEditor';
import { SelectModeBar } from './SelectModeBar';
import { FolderList } from './FolderList';
import { FolderSelectModeBar } from './FolderSelectModeBar';
import { ConfirmationModal } from './ConfirmationModal';
import { formatTimeAgo } from '../utils/storage';

interface DesktopViewProps {
  notes: Note[];
  folders: Folder[];
  selectedNote: Note | null;
  onSelectNote: (id: string) => void;
  onCreateNewPage: () => void;
  onUpdateNote: (updated: Note) => void;
  onOpenSection: (section: AppSection) => void;
  onOpenFolders: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFolderId: string | null;
  onClearFolderFilter: () => void;
  onTogglePin: (id: string) => void;
  onArchiveNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onUnarchiveNote: (id: string) => void;
  onRestoreFromDumpster: (id: string) => void;
  onPermanentDeleteNote: (id: string) => void;
  onEmptyDumpster: () => void;
  onCreateFolder: (folder: Folder) => void;
  onUpdateFolder: (folder: Folder) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteFolders: (folderIds: string[]) => void;
  onMoveNoteToFolder: (noteId: string, folderId: string | null) => void;
  onSelectFolder: (id: string | null) => void;
  activeTab: AppSection | 'folders' | 'editor' | null;
  onCloseTab: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  pwaState: PWAState;
  onTriggerInstall: () => void;
  onImportNotes: (imported: Note[]) => void;
  isOffline?: boolean;
  // Multi-select props for Notes
  isSelectMode: boolean;
  selectedNoteIds: string[];
  onToggleSelectNote: (id: string) => void;
  onLongPressNote: (id: string) => void;
  onCancelSelectMode: () => void;
  onToggleSelectAllUnpinned: () => void;
  onRequestArchiveSelected: () => void;
  onRequestDeleteSelected: () => void;
}

export const DesktopView: React.FC<DesktopViewProps> = ({
  notes,
  folders,
  selectedNote,
  onSelectNote,
  onCreateNewPage,
  onUpdateNote,
  onOpenSection,
  onOpenFolders,
  searchQuery,
  setSearchQuery,
  activeFolderId,
  onClearFolderFilter,
  onTogglePin,
  onArchiveNote,
  onDeleteNote,
  onUnarchiveNote,
  onRestoreFromDumpster,
  onPermanentDeleteNote,
  onEmptyDumpster,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onDeleteFolders,
  onMoveNoteToFolder,
  onSelectFolder,
  activeTab = 'editor',
  onCloseTab,
  viewMode,
  setViewMode,
  pwaState,
  onTriggerInstall,
  onImportNotes,
  isOffline = false,
  isSelectMode,
  selectedNoteIds,
  onToggleSelectNote,
  onLongPressNote,
  onCancelSelectMode,
  onToggleSelectAllUnpinned,
  onRequestArchiveSelected,
  onRequestDeleteSelected,
}) => {
  // Left sidebar view toggle state: 'notes' or 'folders'
  const [leftSidebarView, setLeftSidebarView] = useState<'notes' | 'folders'>('notes');

  // Track last viewed folder for the right window folder notes grid
  const [lastViewedFolderId, setLastViewedFolderId] = useState<string | null>(null);

  // Multi-select state for Archive & Dumpster tabs
  const [archiveSelectedIds, setArchiveSelectedIds] = useState<string[]>([]);
  const [dumpsterSelectedIds, setDumpsterSelectedIds] = useState<string[]>([]);
  const [isConfirmDumpsterDeleteOpen, setIsConfirmDumpsterDeleteOpen] = useState(false);
  const [isArchiveRestoreOpen, setIsArchiveRestoreOpen] = useState(false);
  const [isArchiveDeleteOpen, setIsArchiveDeleteOpen] = useState(false);
  const [isDumpsterRestoreOpen, setIsDumpsterRestoreOpen] = useState(false);

  // Multi-select state for folders
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);

  // Drag hover feedback state
  const [dragOverLeft, setDragOverLeft] = useState(false);
  const [dragOverRight, setDragOverRight] = useState(false);

  // Right window view mode when in folders: 'editor' or 'folder-notes'
  const [rightWindowMode, setRightWindowMode] = useState<'editor' | 'folder-notes'>('editor');

  // Track if a specific note inside a folder was opened from the folder grid
  const [isFolderNoteOpened, setIsFolderNoteOpened] = useState(false);

  // Settings category state
  const [settingsCategory, setSettingsCategory] = useState<'looks' | 'data' | 'about'>('looks');

  // Screen Mode state
  const [screenMode, setScreenMode] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('pages_screen_mode') as 'light' | 'dark' | 'system') || 'light';
  });

  // Font state
  const [selectedFont, setSelectedFont] = useState<'geist' | 'monospace' | 'system'>(() => {
    return (localStorage.getItem('pages_font_option') as 'geist' | 'monospace' | 'system') || 'geist';
  });

  useEffect(() => {
    localStorage.setItem('pages_screen_mode', screenMode);
    if (screenMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (screenMode === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [screenMode]);

  useEffect(() => {
    localStorage.setItem('pages_font_option', selectedFont);
    if (selectedFont === 'monospace') {
      document.body.style.fontFamily = 'monospace, ui-monospace, SFMono-Regular';
    } else if (selectedFont === 'system') {
      document.body.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    } else {
      document.body.style.fontFamily = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    }
  }, [selectedFont]);

  // Sync activeTab === 'folders' to switch left sidebar to folders view
  useEffect(() => {
    if (activeTab === 'folders') {
      setLeftSidebarView('folders');
    }
  }, [activeTab]);

  // Filter active notes (not archived, not deleted)
  const activeNotes = notes.filter((n) => !n.isArchived && !n.isDeleted);

  // Apply search & folder filter
  const filteredNotes = activeNotes.filter((n) => {
    if (leftSidebarView === 'folders') {
      if (activeFolderId !== null && n.folderId !== activeFolderId) return false;
      if (activeFolderId === null && n.folderId !== null) return false;
    } else if (activeFolderId !== null) {
      if (n.folderId !== activeFolderId) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pinnedNotes = filteredNotes
    .filter((n) => n.isPinned)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const unpinnedNotes = filteredNotes
    .filter((n) => !n.isPinned)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const archivedNotes = notes.filter((n) => n.isArchived && !n.isDeleted);
  const dumpsterNotes = notes.filter((n) => n.isDeleted);

  const isSearching = searchQuery.trim().length > 0;
  const searchQ = searchQuery.trim().toLowerCase();

  const matchingFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQ)
  );

  const matchingSearchNotes = activeNotes.filter(
    (n) => n.title.toLowerCase().includes(searchQ) || n.content.toLowerCase().includes(searchQ)
  );

  const activeFolderName =
    activeFolderId === null
      ? 'Uncategorized'
      : folders.find((f) => f.id === activeFolderId)?.name || 'Unknown Folder';

  const noFolderCount = activeNotes.filter((n) => !n.folderId).length;
  const getFolderNoteCount = (folderId: string) =>
    activeNotes.filter((n) => n.folderId === folderId).length;

  const allUnpinnedSelected =
    unpinnedNotes.length > 0 &&
    unpinnedNotes.every((n) => selectedNoteIds.includes(n.id));

  // Folder selection handlers
  const handleToggleSelectFolder = (id: string) => {
    if (selectedFolderIds.includes(id)) {
      setSelectedFolderIds(selectedFolderIds.filter((item) => item !== id));
    } else {
      setSelectedFolderIds([...selectedFolderIds, id]);
    }
  };

  const handleCancelFolderSelectMode = () => {
    setSelectedFolderIds([]);
  };

  const handleDeleteSelectedFolders = () => {
    if (selectedFolderIds.length > 0) {
      onDeleteFolders(selectedFolderIds);
      setSelectedFolderIds([]);
    }
  };

  // Drag and Drop handlers
  const handleDragOverLeft = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverLeft(true);
  };

  const handleDragLeaveLeft = () => {
    setDragOverLeft(false);
  };

  const handleDropLeft = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverLeft(false);
    const noteId = e.dataTransfer.getData('text/plain');
    if (noteId) {
      const targetNote = notes.find((n) => n.id === noteId);
      if (targetNote) {
        if (targetNote.isArchived) {
          onUnarchiveNote(noteId);
        } else if (targetNote.isDeleted) {
          onRestoreFromDumpster(noteId);
        }
      }
    }
  };

  const handleDragOverRight = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverRight(true);
  };

  const handleDragLeaveRight = () => {
    setDragOverRight(false);
  };

  const handleDropRight = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverRight(false);
    const noteId = e.dataTransfer.getData('text/plain');
    if (noteId) {
      if (activeTab === 'archive') {
        onArchiveNote(noteId);
      } else if (activeTab === 'dumpster') {
        onDeleteNote(noteId);
      }
    }
  };

  const handleExportBackup = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(notes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `pages-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportNotes(parsed);
          alert(`Successfully imported ${parsed.length} pages!`);
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleGoToDefaultPages = () => {
    setLeftSidebarView('notes');
    setIsFolderNoteOpened(false);
    setRightWindowMode('editor');
    onClearFolderFilter();
    if (activeTab !== 'editor') onCloseTab();

    const untitledNote = activeNotes.find(
      (n) => !n.title.trim() || n.title.toLowerCase().includes('untitled')
    );
    if (untitledNote) {
      onSelectNote(untitledNote.id);
    } else if (activeNotes.length > 0) {
      onSelectNote(activeNotes[0].id);
    } else {
      onCreateNewPage();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#F9F7F2] text-[#2D2A29] overflow-hidden">
      {/* Header Bar */}
      <Header
        onOpenSection={onOpenSection}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isOffline={isOffline}
        activeFolderId={activeFolderId}
        activeFolderName={activeFolderName}
        onClearFolderFilter={onClearFolderFilter}
        onGoToDefaultPages={handleGoToDefaultPages}
        isMobile={false}
      />

      {/* Main Split Screen Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Directory Panel (Width: 320px ~ 380px) */}
        <div
          onDragOver={handleDragOverLeft}
          onDragLeave={handleDragLeaveLeft}
          onDrop={handleDropLeft}
          className={`w-80 md:w-96 border-r border-[#E8E4D9] flex flex-col bg-[#F1EDE4]/40 h-full relative shrink-0 transition-all duration-300 ${
            dragOverLeft
              ? 'bg-[#E8E4D9]/80 ring-2 ring-inset ring-[#2D2A29]'
              : ''
          }`}
        >
          {/* Left Sidebar Content Container */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab === 'settings' ? 'settings' : leftSidebarView}-${leftSidebarView === 'folders' && isFolderNoteOpened ? 'folder-notes' : 'folder-list'}-${isSearching ? 'search' : 'normal'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
                className="flex-1 flex flex-col h-full overflow-hidden"
              >
            {activeTab === 'settings' ? (
              /* SETTINGS CATEGORY MENU ON LEFT WINDOW */
              <div className="flex-1 flex flex-col h-full bg-[#F1EDE4]/50 overflow-hidden">
                <div className="p-4 space-y-2.5 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setSettingsCategory('looks')}
                    className={`w-full px-5 py-4 rounded-xl text-sm flex items-center justify-between transition-all cursor-pointer ${
                      settingsCategory === 'looks'
                        ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                        : 'bg-white/60 text-[#433F3E] hover:bg-white border border-[#E8E4D9]/80 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Palette className="w-4.5 h-4.5 text-[#2D2A29]" />
                      <span>Looks</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsCategory('data')}
                    className={`w-full px-5 py-4 rounded-xl text-sm flex items-center justify-between transition-all cursor-pointer ${
                      settingsCategory === 'data'
                        ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                        : 'bg-white/60 text-[#433F3E] hover:bg-white border border-[#E8E4D9]/80 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Database className="w-4.5 h-4.5 text-[#2D2A29]" />
                      <span>Data</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsCategory('about')}
                    className={`w-full px-5 py-4 rounded-xl text-sm flex items-center justify-between transition-all cursor-pointer ${
                      settingsCategory === 'about'
                        ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                        : 'bg-white/60 text-[#433F3E] hover:bg-white border border-[#E8E4D9]/80 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Info className="w-4.5 h-4.5 text-[#2D2A29]" />
                      <span>About</span>
                    </div>
                  </button>
                </div>
              </div>
            ) : isSearching ? (
                /* SEARCH FOCUS MODE ON LEFT WINDOW: FOLDERS */
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="h-[57px] px-4 border-b border-[#E8E4D9] flex items-center justify-between bg-white/60 backdrop-blur-xs shrink-0 select-none">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#2D2A29] text-left">Folders</h2>
                    <span className="text-[11px] font-semibold text-[#8C8679]">({matchingFolders.length})</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24">
                    {matchingFolders.length === 0 ? (
                      <div className="text-center py-10 text-[#8C8679]">
                        <p className="text-xs font-semibold">No matching folders</p>
                      </div>
                    ) : (
                      matchingFolders.map((folder) => (
                        <div
                          key={folder.id}
                          onClick={() => {
                            onSelectFolder(folder.id);
                            setLastViewedFolderId(folder.id);
                            setSearchQuery('');
                            setLeftSidebarView('folders');
                            setRightWindowMode('folder-notes');
                            if (activeTab === 'archive' || activeTab === 'dumpster') onCloseTab();
                          }}
                          className="p-3 bg-white border border-[#E8E4D9] hover:border-[#8C8679]/50 rounded-xl cursor-pointer transition-all flex items-center justify-between shadow-xs hover:shadow-sm"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-[#F1EDE4] flex items-center justify-center text-[#2D2A29] shrink-0">
                              <FolderIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-[#2D2A29] truncate">{folder.name}</h3>
                              <p className="text-[11px] text-[#8C8679] truncate">{getFolderNoteCount(folder.id)} pages</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : leftSidebarView === 'notes' ? (
                /* PAGE DIRECTORY VIEW ON LEFT WINDOW */
                <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 pt-4">
                  {filteredNotes.length === 0 ? (
                    <div className="text-center py-16 text-[#8C8679]">
                      <p className="text-sm font-semibold text-[#2D2A29] mb-1">No pages found</p>
                      <p className="text-xs mb-4">Create your first note to get started.</p>
                      <button
                        onClick={onCreateNewPage}
                        className="px-4 py-2 bg-[#2D2A29] text-white text-xs font-semibold rounded-xl hover:bg-[#433F3E] transition-colors shadow-sm"
                      >
                        Create Page
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Category: Pinned */}
                      {pinnedNotes.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2.5 px-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D2A29]">
                              Pinned
                            </span>
                            <span className="text-[10px] font-semibold text-[#8C8679]">
                              {pinnedNotes.length}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <AnimatePresence mode="popLayout">
                              {pinnedNotes.map((note) => (
                                <motion.div
                                  key={note.id}
                                  layout
                                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                                >
                                  <NoteCard
                                    note={note}
                                    isSelected={activeTab === 'editor' && selectedNote?.id === note.id}
                                    isSelectMode={isSelectMode}
                                    isChecked={selectedNoteIds.includes(note.id)}
                                    onClick={() => {
                                      onSelectNote(note.id);
                                      setRightWindowMode('editor');
                                      if (activeTab !== 'editor') onCloseTab();
                                    }}
                                    onToggleCheck={() => onToggleSelectNote(note.id)}
                                    onLongPress={() => onLongPressNote(note.id)}
                                    onArchive={() => onArchiveNote(note.id)}
                                    onDelete={() => onDeleteNote(note.id)}
                                  />
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}

                      {/* Category: Everything */}
                      <div>
                        <div className="flex items-center justify-between mb-2.5 px-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#433F3E]">
                            Everything
                          </span>
                          <span className="text-[10px] font-semibold text-[#8C8679]">
                            {unpinnedNotes.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <AnimatePresence mode="popLayout">
                            {unpinnedNotes.map((note) => (
                              <motion.div
                                key={note.id}
                                layout
                                initial={{ opacity: 0, y: -10, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                              >
                                <NoteCard
                                  note={note}
                                  isSelected={activeTab === 'editor' && selectedNote?.id === note.id}
                                  isSelectMode={isSelectMode}
                                  isChecked={selectedNoteIds.includes(note.id)}
                                  onClick={() => {
                                    onSelectNote(note.id);
                                    setRightWindowMode('editor');
                                    if (activeTab !== 'editor') onCloseTab();
                                  }}
                                  onToggleCheck={() => onToggleSelectNote(note.id)}
                                  onLongPress={() => onLongPressNote(note.id)}
                                  onArchive={() => onArchiveNote(note.id)}
                                  onDelete={() => onDeleteNote(note.id)}
                                />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : leftSidebarView === 'folders' && isFolderNoteOpened && activeFolderId !== null ? (
                /* FOLDER NOTES VIEW IN LEFT WINDOW (When a note inside a folder is selected) */
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Header for Folder Notes in Left Sidebar */}
                  <div className="h-[57px] px-4 border-b border-[#E8E4D9] flex items-center justify-between bg-white/60 backdrop-blur-xs shrink-0 select-none">
                    <h2 className="text-base font-bold text-[#2D2A29] truncate min-w-0 pr-2">{activeFolderName}</h2>
                    <span className="text-xs font-semibold text-[#8C8679] shrink-0">({filteredNotes.length})</span>
                  </div>

                  {/* Note Cards List for Selected Folder */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24">
                    {filteredNotes.length === 0 ? (
                      <div className="text-center py-16 text-[#8C8679] flex flex-col items-center justify-center">
                        <p className="text-sm font-semibold text-[#2D2A29]">Nothing to view here</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredNotes.map((note) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            isSelected={activeTab === 'editor' && selectedNote?.id === note.id}
                            isSelectMode={isSelectMode}
                            isChecked={selectedNoteIds.includes(note.id)}
                            onClick={() => {
                              onSelectNote(note.id);
                              setRightWindowMode('editor');
                              if (activeTab !== 'editor') onCloseTab();
                            }}
                            onToggleCheck={() => onToggleSelectNote(note.id)}
                            onLongPress={() => onLongPressNote(note.id)}
                            onArchive={() => onArchiveNote(note.id)}
                            onDelete={() => onDeleteNote(note.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* FOLDER DIRECTORY VIEW ON LEFT WINDOW */
                <FolderList
                  folders={folders}
                  activeFolderId={lastViewedFolderId}
                  noFolderCount={noFolderCount}
                  getFolderNoteCount={getFolderNoteCount}
                  onSelectFolder={(id) => {
                    onSelectFolder(id);
                    setLastViewedFolderId(id);
                    setRightWindowMode('folder-notes');
                    setIsFolderNoteOpened(false);
                    if (activeTab === 'archive' || activeTab === 'dumpster') {
                      onCloseTab();
                    }
                  }}
                  onCreateFolder={onCreateFolder}
                  onUpdateFolder={onUpdateFolder}
                  onDeleteFolders={handleDeleteSelectedFolders}
                  onMoveNoteToFolder={onMoveNoteToFolder}
                  selectedFolderIds={selectedFolderIds}
                  onToggleSelectFolder={handleToggleSelectFolder}
                  onCancelFolderSelectMode={handleCancelFolderSelectMode}
                  onStartEditingFolder={(id) => setEditingFolderId(id)}
                  editingFolderId={editingFolderId}
                  setEditingFolderId={setEditingFolderId}
                  isCreating={isCreatingFolder}
                  setIsCreating={setIsCreatingFolder}
                />
              )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Floating Action Bars inside Left Sidebar */}
          <AnimatePresence mode="wait">
            {activeTab === 'settings' ? null : leftSidebarView === 'folders' && selectedFolderIds.length > 0 ? (
              /* Folder Select Mode Floating Bar */
              <FolderSelectModeBar
                key="folder-select-bar"
                selectedCount={selectedFolderIds.length}
                onCancel={handleCancelFolderSelectMode}
                onEdit={() => {
                  if (selectedFolderIds.length === 1) {
                    setEditingFolderId(selectedFolderIds[0]);
                  }
                }}
                onDeleteSelected={handleDeleteSelectedFolders}
                isDesktop={true}
              />
            ) : isSelectMode ? (
              /* Note Select Mode Floating Bar */
              <SelectModeBar
                key="note-select-bar"
                selectedCount={selectedNoteIds.length}
                allUnpinnedSelected={allUnpinnedSelected}
                onCancel={onCancelSelectMode}
                onToggleSelectAllUnpinned={onToggleSelectAllUnpinned}
                onArchiveSelected={onRequestArchiveSelected}
                onDeleteSelected={onRequestDeleteSelected}
                isDesktop={true}
              />
            ) : (
              /* Default Navigation Floating Bar */
              <motion.div
                key="nav-bar"
                initial={{ y: 20, opacity: 0, scale: 0.88 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-[#2D2A29] text-[#F9F7F2] rounded-full px-3 py-1.5 shadow-xl flex items-center gap-5 border border-[#433F3E] select-none"
              >
                {/* Left: Plus Icon (Create Note or Folder) */}
                <button
                  onClick={() => {
                    if (leftSidebarView === 'folders') {
                      if (activeFolderId !== null) {
                        onCreateNewPage();
                      } else {
                        setIsCreatingFolder(true);
                      }
                    } else {
                      onCreateNewPage();
                    }
                  }}
                  className="p-1.5 bg-[#8C8679] hover:bg-[#a19a8d] text-white rounded-full transition-all transform active:scale-95 shadow-md flex items-center justify-center"
                  title={leftSidebarView === 'folders' && activeFolderId === null ? 'Create New Folder' : 'Create New Page'}
                  aria-label={leftSidebarView === 'folders' && activeFolderId === null ? 'Create New Folder' : 'Create New Page'}
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Middle: Page Icon (Page View) */}
                <button
                  onClick={() => {
                    onClearFolderFilter();
                    setLeftSidebarView('notes');
                    setRightWindowMode('editor');
                    if (activeTab !== 'editor') onCloseTab();
                  }}
                  className={`p-1.5 transition-colors hover:text-white flex items-center justify-center ${
                    leftSidebarView === 'notes'
                      ? 'text-white font-bold'
                      : 'text-[#8C8679]'
                  }`}
                  title="Page Directory"
                  aria-label="Page Directory"
                >
                  <FileText className="w-4 h-4" />
                </button>

                {/* Right: Folder Icon (Folder View) */}
                <button
                  onClick={() => {
                    if (activeTab === 'archive' || activeTab === 'dumpster') {
                      onCloseTab();
                    }
                    setLeftSidebarView('folders');
                    setIsFolderNoteOpened(false);
                    setRightWindowMode('folder-notes');
                  }}
                  className={`p-1.5 transition-colors hover:text-white flex items-center justify-center ${
                    leftSidebarView === 'folders'
                      ? 'text-white font-bold'
                      : 'text-[#8C8679]'
                  }`}
                  title="Folder Directory"
                  aria-label="Folder Directory"
                >
                  <FolderIcon className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side Window: Renders Note Editor or Folder Notes Grid */}
        <div className="flex-1 h-full bg-[#F9F7F2] overflow-hidden relative">
          <AnimatePresence mode="wait">
            {(!activeTab || activeTab === 'editor' || activeTab === 'folders') && (
              <motion.div
                key={`${leftSidebarView}-${rightWindowMode}-${isSearching ? 'search' : 'normal'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
                className="h-full w-full"
              >
                {isSearching ? (
                  /* SEARCH FOCUS MODE ON RIGHT WINDOW: PAGES */
                  <div className="h-full w-full flex flex-col bg-[#F9F7F2] overflow-y-auto">
                    <div className="sticky top-0 z-20 h-[57px] px-6 bg-[#F9F7F2]/95 backdrop-blur-md border-b border-[#E8E4D9] flex items-center justify-between text-left select-none">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#2D2A29] text-left">Pages</h2>
                      <span className="text-xs font-semibold text-[#8C8679]">{matchingSearchNotes.length} matching</span>
                    </div>

                    <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-4 pb-24">
                      {matchingSearchNotes.length === 0 ? (
                        <div className="text-center py-20 text-[#8C8679] border-2 border-dashed border-[#E8E4D9] rounded-2xl bg-white/50 p-8 flex flex-col items-center justify-center">
                          <FileText className="w-10 h-10 text-[#8C8679] mb-2 opacity-60" />
                          <p className="text-sm font-semibold text-[#2D2A29]">No pages matching "{searchQuery}"</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
                          <AnimatePresence mode="popLayout">
                            {matchingSearchNotes.map((note) => (
                              <motion.div
                                key={note.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                                className="h-full flex flex-col"
                              >
                                <NoteCard
                                  note={note}
                                  isSelected={selectedNote?.id === note.id}
                                  isSelectMode={isSelectMode}
                                  isChecked={selectedNoteIds.includes(note.id)}
                                  onClick={() => {
                                    onSelectNote(note.id);
                                    setSearchQuery('');
                                    setLeftSidebarView('notes');
                                    setRightWindowMode('editor');
                                    if (activeTab !== 'editor') onCloseTab();
                                  }}
                                  onToggleCheck={() => onToggleSelectNote(note.id)}
                                  onLongPress={() => onLongPressNote(note.id)}
                                  onArchive={() => onArchiveNote(note.id)}
                                  onDelete={() => onDeleteNote(note.id)}
                                />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </div>
                ) : leftSidebarView === 'folders' && rightWindowMode === 'folder-notes' ? (
                  /* FOLDER NOTES GRID ON RIGHT WINDOW */
                  <div className="h-full w-full flex flex-col bg-[#F9F7F2] overflow-y-auto">
                    {/* Folder Header */}
                    <div className="sticky top-0 z-20 h-[57px] px-6 bg-[#F9F7F2]/95 backdrop-blur-md border-b border-[#E8E4D9] flex items-center justify-between">
                      <h2 className="text-base font-bold text-[#2D2A29]">
                        {lastViewedFolderId === null
                          ? 'Uncategorized'
                          : folders.find((f) => f.id === lastViewedFolderId)?.name || 'Folder'}
                      </h2>
                      <span className="text-xs font-semibold text-[#8C8679]">
                        {
                          activeNotes.filter((n) =>
                            lastViewedFolderId === null ? !n.folderId : n.folderId === lastViewedFolderId
                          ).length
                        }
                      </span>
                    </div>

                    {/* Symmetric Cards Grid */}
                    <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-4">
                      {activeNotes.filter((n) =>
                        lastViewedFolderId === null ? !n.folderId : n.folderId === lastViewedFolderId
                      ).length === 0 ? (
                        <div className="text-center py-20 text-[#8C8679] border-2 border-dashed border-[#E8E4D9] rounded-2xl bg-white/50 p-8 flex flex-col items-center justify-center">
                          <FolderIcon className="w-10 h-10 text-[#8C8679] mb-2 opacity-60" />
                          <p className="text-sm font-semibold text-[#2D2A29]">Nothing to view here</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-fr">
                          {activeNotes
                            .filter((n) =>
                              lastViewedFolderId === null ? !n.folderId : n.folderId === lastViewedFolderId
                            )
                            .map((note) => (
                              <div key={note.id} className="h-full flex flex-col">
                                <NoteCard
                                  note={note}
                                  isSelected={selectedNote?.id === note.id}
                                  isSelectMode={isSelectMode}
                                  isChecked={selectedNoteIds.includes(note.id)}
                                  onClick={() => {
                                    onSelectNote(note.id);
                                    onSelectFolder(lastViewedFolderId);
                                    setIsFolderNoteOpened(true);
                                    setRightWindowMode('editor');
                                  }}
                                  onToggleCheck={() => onToggleSelectNote(note.id)}
                                  onLongPress={() => onLongPressNote(note.id)}
                                  onArchive={() => onArchiveNote(note.id)}
                                  onDelete={() => onDeleteNote(note.id)}
                                />
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Note Editor */
                  <NoteEditor
                    key={selectedNote ? selectedNote.id : 'no-note'}
                    note={selectedNote}
                    folders={folders}
                    onUpdateNote={onUpdateNote}
                    onArchiveNote={onArchiveNote}
                    onDeleteNote={onDeleteNote}
                    onTogglePin={onTogglePin}
                    isMobileView={false}
                  />
                )}
              </motion.div>
            )}

            {/* TAB 2: ARCHIVE DIRECTORY TAB */}
            {activeTab === 'archive' && (
              <motion.div
                key="archive-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
                onDragOver={handleDragOverRight}
                onDragLeave={handleDragLeaveRight}
                onDrop={handleDropRight}
                className={`h-full w-full flex flex-col bg-[#F9F7F2] overflow-y-auto transition-colors relative ${
                  dragOverRight
                    ? 'bg-[#E8E4D9]/60 ring-2 ring-dashed ring-[#8C8679]'
                    : ''
                }`}
              >
                {/* Tab Header */}
                <div className="sticky top-0 z-30 h-[57px] px-6 bg-[#F9F7F2]/95 backdrop-blur-md border-b border-[#E8E4D9] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold tracking-tight text-[#2D2A29]">Archive</h2>
                  </div>
                  <span className="text-xs font-semibold text-[#8C8679]">
                    {archivedNotes.length}
                  </span>
                </div>

                {/* Tab Body Content */}
                <div className="flex-1 max-w-3xl w-full mx-auto p-6 space-y-3 pb-28">
                  {archivedNotes.length === 0 ? (
                    <div className="text-center py-20 text-[#8C8679] border-2 border-dashed border-[#E8E4D9] rounded-2xl bg-white/50 p-8">
                      <Archive className="w-12 h-12 mx-auto mb-3 text-[#8C8679]" />
                      <p className="text-base font-bold text-[#2D2A29]">Archive is empty</p>
                      <p className="text-xs mt-1">
                        Pages you archive will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {archivedNotes.map((note) => {
                        const isSelected = archiveSelectedIds.includes(note.id);
                        return (
                          <div
                            key={note.id}
                            onClick={() => {
                              if (archiveSelectedIds.includes(note.id)) {
                                setArchiveSelectedIds(archiveSelectedIds.filter((id) => id !== note.id));
                              } else {
                                setArchiveSelectedIds([...archiveSelectedIds, note.id]);
                              }
                            }}
                            className={`group relative bg-white border rounded-xl p-4 flex items-center justify-between gap-4 transition-all shadow-sm cursor-pointer ${
                              isSelected
                                ? 'border-[#2D2A29] bg-[#F1EDE4]'
                                : 'border-[#E8E4D9] hover:border-[#8C8679]/50'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-[#2D2A29] truncate">
                                {note.title.trim() || 'Untitled Page'}
                              </h4>
                              <p className="text-xs text-[#8C8679] line-clamp-1 mt-0.5">
                                {note.content.trim() || 'Empty content'}
                              </p>
                              <span className="text-[10px] text-[#8C8679] block mt-1">
                                Archived {formatTimeAgo(note.updatedAt)}
                              </span>
                            </div>

                            {/* Circle checkbox on hover or selected */}
                            <div className="shrink-0 flex items-center">
                              <div
                                className={`w-5 h-5 rounded-full border transition-all duration-150 flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-[#2D2A29] border-[#2D2A29] text-white scale-105'
                                    : 'border-[#8C8679] bg-white text-transparent opacity-0 group-hover:opacity-100 hover:border-[#2D2A29]'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Floating Multi-Select Bar for Archive */}
                <AnimatePresence>
                  {archiveSelectedIds.length > 0 && (
                    <motion.div
                      initial={{ y: 20, opacity: 0, scale: 0.88 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: 20, opacity: 0, scale: 0.88 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-50 select-none"
                    >
                      {/* Left Action: Unarchive */}
                      <button
                        type="button"
                        onClick={() => setIsArchiveRestoreOpen(true)}
                        className="p-3 rounded-full bg-[#2D2A29] hover:bg-[#433F3E] text-[#F9F7F2] border border-[#433F3E] shadow-xl active:scale-95 transition-colors cursor-pointer"
                        title="Unarchive selected pages"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      {/* Middle Pill */}
                      <div className="bg-[#2D2A29] text-[#F9F7F2] rounded-full px-2.5 py-1.5 shadow-2xl flex items-center gap-2 border border-[#433F3E]">
                        <button
                          type="button"
                          onClick={() => setArchiveSelectedIds([])}
                          className="p-1.5 hover:bg-[#433F3E] text-[#8C8679] hover:text-[#F9F7F2] rounded-full transition-colors active:scale-90 cursor-pointer"
                          title="Deselect all"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <span className="text-[#F9F7F2] text-xs font-bold px-1 min-w-[1.25rem] text-center">
                          {archiveSelectedIds.length}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            if (archiveSelectedIds.length === archivedNotes.length) {
                              setArchiveSelectedIds([]);
                            } else {
                              setArchiveSelectedIds(archivedNotes.map((n) => n.id));
                            }
                          }}
                          className={`p-1.5 transition-colors active:scale-90 cursor-pointer ${
                            archiveSelectedIds.length === archivedNotes.length
                              ? 'text-white font-bold'
                              : 'text-[#8C8679] hover:text-white'
                          }`}
                          title={archiveSelectedIds.length === archivedNotes.length ? 'Deselect all' : 'Select all'}
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Right Action: Delete to Dumpster */}
                      <button
                        type="button"
                        onClick={() => setIsArchiveDeleteOpen(true)}
                        className="p-3 rounded-full bg-[#2D2A29] hover:bg-[#D90429] text-[#F9F7F2] border border-[#433F3E] shadow-xl active:scale-95 transition-colors cursor-pointer"
                        title="Move selected to dumpster"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Archive Restore Confirmation Dialog */}
                <ConfirmationModal
                  isOpen={isArchiveRestoreOpen}
                  title={`Restore ${archiveSelectedIds.length} ${archiveSelectedIds.length === 1 ? 'item' : 'items'}?`}
                  description={`${archiveSelectedIds.length === 1 ? 'Selected item' : 'Selected items'} will be moved to Uncategorized Pages.`}
                  confirmLabel="Restore"
                  confirmVariant="primary"
                  onConfirm={() => {
                    archiveSelectedIds.forEach((id) => onUnarchiveNote(id));
                    setArchiveSelectedIds([]);
                    setIsArchiveRestoreOpen(false);
                  }}
                  onCancel={() => setIsArchiveRestoreOpen(false)}
                />

                {/* Archive Move to Dumpster Confirmation Dialog */}
                <ConfirmationModal
                  isOpen={isArchiveDeleteOpen}
                  title={`Delete ${archiveSelectedIds.length} ${archiveSelectedIds.length === 1 ? 'item' : 'items'}?`}
                  description={`${archiveSelectedIds.length === 1 ? 'Selected item' : 'Selected items'} will be moved to dumpster.`}
                  confirmLabel="Delete"
                  confirmVariant="danger"
                  onConfirm={() => {
                    archiveSelectedIds.forEach((id) => onDeleteNote(id));
                    setArchiveSelectedIds([]);
                    setIsArchiveDeleteOpen(false);
                  }}
                  onCancel={() => setIsArchiveDeleteOpen(false)}
                />
              </motion.div>
            )}

            {/* TAB 3: DUMPSTER (TRASH) TAB */}
            {activeTab === 'dumpster' && (
              <motion.div
                key="trash-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
                onDragOver={handleDragOverRight}
                onDragLeave={handleDragLeaveRight}
                onDrop={handleDropRight}
                className={`h-full w-full flex flex-col bg-[#F9F7F2] overflow-y-auto transition-colors relative ${
                  dragOverRight
                    ? 'bg-[#FFE3E3]/50 ring-2 ring-dashed ring-[#D90429]'
                    : ''
                }`}
              >
                {/* Tab Header */}
                <div className="sticky top-0 z-30 h-[57px] px-6 bg-[#F9F7F2]/95 backdrop-blur-md border-b border-[#E8E4D9] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold tracking-tight text-[#2D2A29]">Dumpster</h2>
                  </div>
                  <span className="text-xs font-semibold text-[#8C8679]">
                    {dumpsterNotes.length}
                  </span>
                </div>

                {/* Tab Body Content */}
                <div className="flex-1 max-w-3xl w-full mx-auto p-6 space-y-3 pb-28">
                  {dumpsterNotes.length === 0 ? (
                    <div className="text-center py-20 text-[#8C8679] border-2 border-dashed border-[#E8E4D9] rounded-2xl bg-white/50 p-8">
                      <Trash2 className="w-12 h-12 mx-auto mb-3 text-[#8C8679]" />
                      <p className="text-base font-bold text-[#2D2A29]">Dumpster is clean</p>
                      <p className="text-xs mt-1">
                        Deleted pages will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dumpsterNotes.map((note) => {
                        const isSelected = dumpsterSelectedIds.includes(note.id);
                        return (
                          <div
                            key={note.id}
                            onClick={() => {
                              if (dumpsterSelectedIds.includes(note.id)) {
                                setDumpsterSelectedIds(dumpsterSelectedIds.filter((id) => id !== note.id));
                              } else {
                                setDumpsterSelectedIds([...dumpsterSelectedIds, note.id]);
                              }
                            }}
                            className={`group relative bg-white border rounded-xl p-4 flex items-center justify-between gap-4 transition-all shadow-sm cursor-pointer ${
                              isSelected
                                ? 'border-[#2D2A29] bg-[#F1EDE4]'
                                : 'border-[#E8E4D9] hover:border-[#8C8679]/50'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-[#2D2A29] truncate line-through opacity-70">
                                {note.title.trim() || 'Untitled Page'}
                              </h4>
                              <p className="text-xs text-[#8C8679] line-clamp-1 mt-0.5">
                                {note.content.trim() || 'Empty content'}
                              </p>
                              <span className="text-[10px] text-[#8C8679] block mt-1">
                                Deleted {formatTimeAgo(note.updatedAt)}
                              </span>
                            </div>

                            {/* Circle button on hover or when selected */}
                            <div className="shrink-0 flex items-center">
                              <div
                                className={`w-5 h-5 rounded-full border transition-all duration-150 flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-[#2D2A29] border-[#2D2A29] text-white scale-105'
                                    : 'border-[#8C8679] bg-white text-transparent opacity-0 group-hover:opacity-100 hover:border-[#2D2A29]'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Floating Multi-Select Bar for Dumpster */}
                <AnimatePresence>
                  {dumpsterSelectedIds.length > 0 && (
                    <motion.div
                      initial={{ y: 20, opacity: 0, scale: 0.88 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-50 select-none"
                    >
                      {/* Left Action: Restore */}
                      <button
                        type="button"
                        onClick={() => setIsDumpsterRestoreOpen(true)}
                        className="p-3 rounded-full bg-[#2D2A29] hover:bg-[#433F3E] text-[#F9F7F2] border border-[#433F3E] shadow-xl active:scale-95 transition-colors cursor-pointer"
                        title="Restore selected pages"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      {/* Middle Pill */}
                      <div className="bg-[#2D2A29] text-[#F9F7F2] rounded-full px-2.5 py-1.5 shadow-2xl flex items-center gap-2 border border-[#433F3E]">
                        <button
                          type="button"
                          onClick={() => setDumpsterSelectedIds([])}
                          className="p-1.5 hover:bg-[#433F3E] text-[#8C8679] hover:text-[#F9F7F2] rounded-full transition-colors active:scale-90 cursor-pointer"
                          title="Deselect all"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <span className="text-[#F9F7F2] text-xs font-bold px-1 min-w-[1.25rem] text-center">
                          {dumpsterSelectedIds.length}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            if (dumpsterSelectedIds.length === dumpsterNotes.length) {
                              setDumpsterSelectedIds([]);
                            } else {
                              setDumpsterSelectedIds(dumpsterNotes.map((n) => n.id));
                            }
                          }}
                          className={`p-1.5 transition-colors active:scale-90 cursor-pointer ${
                            dumpsterSelectedIds.length === dumpsterNotes.length
                              ? 'text-white font-bold'
                              : 'text-[#8C8679] hover:text-white'
                          }`}
                          title={dumpsterSelectedIds.length === dumpsterNotes.length ? 'Deselect all' : 'Select all'}
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Right Action: Permanent Delete */}
                      <button
                        type="button"
                        onClick={() => setIsConfirmDumpsterDeleteOpen(true)}
                        className="p-3 rounded-full bg-[#2D2A29] hover:bg-[#D90429] text-[#F9F7F2] border border-[#433F3E] shadow-xl active:scale-95 transition-colors cursor-pointer"
                        title="Permanently delete selected pages"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Restore Confirmation Dialog */}
                <ConfirmationModal
                  isOpen={isDumpsterRestoreOpen}
                  title={`Restore ${dumpsterSelectedIds.length} ${dumpsterSelectedIds.length === 1 ? 'item' : 'items'}?`}
                  description={`${dumpsterSelectedIds.length === 1 ? 'Selected item' : 'Selected items'} will be moved to Uncategorized Pages.`}
                  confirmLabel="Restore"
                  confirmVariant="primary"
                  onConfirm={() => {
                    dumpsterSelectedIds.forEach((id) => onRestoreFromDumpster(id));
                    setDumpsterSelectedIds([]);
                    setIsDumpsterRestoreOpen(false);
                  }}
                  onCancel={() => setIsDumpsterRestoreOpen(false)}
                />

                {/* Permanent Delete Confirmation Dialog */}
                <ConfirmationModal
                  isOpen={isConfirmDumpsterDeleteOpen}
                  title={`Permanently delete ${dumpsterSelectedIds.length} ${dumpsterSelectedIds.length === 1 ? 'item' : 'items'}?`}
                  description={`${dumpsterSelectedIds.length === 1 ? 'Selected item' : 'Selected items'} will be permanently deleted.`}
                  confirmLabel="Delete"
                  confirmVariant="danger"
                  onConfirm={() => {
                    dumpsterSelectedIds.forEach((id) => onPermanentDeleteNote(id));
                    setDumpsterSelectedIds([]);
                    setIsConfirmDumpsterDeleteOpen(false);
                  }}
                  onCancel={() => setIsConfirmDumpsterDeleteOpen(false)}
                />
              </motion.div>
            )}

            {/* TAB 4: SETTINGS TAB */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
                className="h-full w-full flex flex-col bg-[#F9F7F2] overflow-y-auto"
              >
                <div className="sticky top-0 z-30 h-[57px] px-6 bg-[#F9F7F2]/95 backdrop-blur-md border-b border-[#E8E4D9] flex items-center justify-between shrink-0 select-none">
                  <h2 className="text-base font-bold tracking-tight text-[#2D2A29] capitalize">
                    {settingsCategory}
                  </h2>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`settings-category-${settingsCategory}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeInOut' }}
                    className="flex-1 max-w-2xl w-full mx-auto p-6 space-y-6"
                  >
                    {settingsCategory === 'looks' && (
                      <div className="space-y-6">
                        {/* Screen Mode */}
                        <div className="bg-white rounded-2xl p-5 border border-[#E8E4D9] shadow-xs space-y-3">
                          <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] block">
                            Screen Mode
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            <button
                              type="button"
                              onClick={() => setScreenMode('dark')}
                              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                                screenMode === 'dark'
                                  ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                  : 'bg-[#F9F7F2] text-[#2D2A29] border-[#E8E4D9] hover:bg-[#F1EDE4]'
                              }`}
                            >
                              <Moon className="w-4 h-4" />
                              <span className="text-xs font-bold">Dark</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setScreenMode('light')}
                              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                                screenMode === 'light'
                                  ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                  : 'bg-[#F9F7F2] text-[#2D2A29] border-[#E8E4D9] hover:bg-[#F1EDE4]'
                              }`}
                            >
                              <Sun className="w-4 h-4" />
                              <span className="text-xs font-bold">Light</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setScreenMode('system')}
                              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                                screenMode === 'system'
                                  ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                  : 'bg-[#F9F7F2] text-[#2D2A29] border-[#E8E4D9] hover:bg-[#F1EDE4]'
                              }`}
                            >
                              <Paintbrush className="w-4 h-4" />
                              <span className="text-xs font-bold">System</span>
                            </button>
                          </div>
                        </div>

                        {/* Layout Mode */}
                        <div className="bg-white rounded-2xl p-5 border border-[#E8E4D9] shadow-xs space-y-3">
                          <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] block">
                            Layout Mode
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            <button
                              type="button"
                              onClick={() => setViewMode('mobile')}
                              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                                viewMode === 'mobile'
                                  ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                  : 'bg-[#F9F7F2] text-[#2D2A29] border-[#E8E4D9] hover:bg-[#F1EDE4]'
                              }`}
                            >
                              <Smartphone className="w-4 h-4" />
                              <span className="text-xs font-bold">Mobile</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setViewMode('desktop')}
                              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                                viewMode === 'desktop'
                                  ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                  : 'bg-[#F9F7F2] text-[#2D2A29] border-[#E8E4D9] hover:bg-[#F1EDE4]'
                              }`}
                            >
                              <Monitor className="w-4 h-4" />
                              <span className="text-xs font-bold">Desktop</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setViewMode('auto')}
                              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                                viewMode === 'auto'
                                  ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                  : 'bg-[#F9F7F2] text-[#2D2A29] border-[#E8E4D9] hover:bg-[#F1EDE4]'
                              }`}
                            >
                              <Paintbrush className="w-4 h-4" />
                              <span className="text-xs font-bold">System</span>
                            </button>
                          </div>
                        </div>

                        {/* Font Mode Selection */}
                        <div className="bg-white rounded-2xl p-5 border border-[#E8E4D9] shadow-xs space-y-3">
                          <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] block">
                            Font Mode
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            <button
                              type="button"
                              onClick={() => setSelectedFont('geist')}
                              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                                selectedFont === 'geist'
                                  ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                  : 'bg-[#F9F7F2] text-[#2D2A29] border-[#E8E4D9] hover:bg-[#F1EDE4]'
                              }`}
                            >
                              <span className="text-base font-bold italic font-serif leading-none h-4 flex items-center justify-center select-none">T</span>
                              <span className="text-xs font-bold">Geist</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedFont('monospace')}
                              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                                selectedFont === 'monospace'
                                  ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                  : 'bg-[#F9F7F2] text-[#2D2A29] border-[#E8E4D9] hover:bg-[#F1EDE4]'
                              }`}
                            >
                              <span className="text-base font-bold font-mono leading-none h-4 flex items-center justify-center select-none">T</span>
                              <span className="text-xs font-bold font-mono">Monospace</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedFont('system')}
                              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                                selectedFont === 'system'
                                  ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                  : 'bg-[#F9F7F2] text-[#2D2A29] border-[#E8E4D9] hover:bg-[#F1EDE4]'
                              }`}
                            >
                              <Paintbrush className="w-4 h-4" />
                              <span className="text-xs font-bold">System</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  {settingsCategory === 'data' && (
                    <div className="space-y-6">
                      {/* Account Sync */}
                      <div className="bg-white rounded-2xl p-5 border border-[#E8E4D9] shadow-xs space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] block">
                          Account
                        </label>
                        <div className="bg-[#F9F7F2] border border-[#E8E4D9] rounded-xl p-4 flex items-center justify-between opacity-85">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white border border-[#E8E4D9] flex items-center justify-center font-bold text-sm text-[#2D2A29] shadow-xs">
                              G
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#2D2A29]">
                                Login to CayLabs account via google
                              </div>
                              <span className="text-[11px] text-[#8C8679]">
                                Sync your notes seamlessly across devices
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8679] bg-[#E8E4D9]/80 px-2.5 py-1 rounded-full">
                            coming soon
                          </span>
                        </div>
                      </div>

                      {/* Your Data (Export / Import) */}
                      <div className="bg-white rounded-2xl p-5 border border-[#E8E4D9] shadow-xs space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] block">
                          Your Data
                        </label>
                        <p className="text-xs text-[#8C8679]">
                          Export all your pages as JSON backup or import a saved backup file.
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={handleExportBackup}
                            className="flex-1 py-3 bg-[#F1EDE4] hover:bg-white hover:border-[#8C8679] text-[#2D2A29] border border-[#E8E4D9] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                            <span>Export Data</span>
                          </button>

                          <label className="flex-1 py-3 bg-[#F1EDE4] hover:bg-white hover:border-[#8C8679] text-[#2D2A29] border border-[#E8E4D9] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer">
                            <Upload className="w-4 h-4" />
                            <span>Import Data</span>
                            <input
                              type="file"
                              accept=".json"
                              onChange={handleFileImport}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsCategory === 'about' && (
                    <div className="bg-white rounded-2xl p-6 border border-[#E8E4D9] shadow-xs flex flex-col justify-between min-h-[280px]">
                      <div className="space-y-3">
                        <h3 className="text-2xl font-bold tracking-tight text-[#2D2A29]">
                          Pages
                        </h3>
                        <p className="text-sm font-medium text-[#433F3E] leading-relaxed">
                          leave this Pages, start writing effectively.
                        </p>
                      </div>

                      <div className="pt-8 border-t border-[#E8E4D9] text-left space-y-1">
                        <p className="text-xs font-semibold text-[#8C8679]">
                          Authorized by CayLabs
                        </p>
                        <p className="text-[11px] font-bold text-[#8C8679]/80">
                          v0.7 Beta
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

            {/* TAB 5: PWA WIDGETS TAB */}
            {activeTab === 'widgets' && (
              <motion.div
                key="widgets-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
                className="h-full w-full flex flex-col bg-[#F9F7F2] overflow-y-auto"
              >
                <div className="sticky top-0 z-30 bg-[#F9F7F2]/95 backdrop-blur-md border-b border-[#E8E4D9] px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onCloseTab}
                      className="p-1.5 text-[#2D2A29] hover:bg-[#F1EDE4] rounded-xl transition-colors flex items-center gap-1.5 font-semibold text-xs border border-[#E8E4D9] bg-white shadow-sm"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Note</span>
                    </button>
                    <div className="h-4 w-px bg-[#E8E4D9]" />
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-5 h-5 text-[#8C8679]" />
                      <h2 className="text-base font-bold tracking-tight">PWA Web App Widgets</h2>
                    </div>
                  </div>
                </div>

                <div className="flex-1 max-w-3xl w-full mx-auto p-6 space-y-6">
                  <div className="bg-white rounded-2xl p-6 border border-[#E8E4D9] shadow-sm space-y-3">
                    <h4 className="text-sm font-bold text-[#2D2A29]">Recent Pages Widget</h4>
                    <p className="text-xs text-[#8C8679]">Quick preview of your latest active pages</p>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {notes.slice(0, 4).map((n) => (
                        <div
                          key={n.id}
                          className="p-3 bg-[#F9F7F2] border border-[#E8E4D9] rounded-xl text-left"
                        >
                          <h5 className="text-xs font-bold truncate text-[#2D2A29]">
                            {n.title || 'Untitled'}
                          </h5>
                          <p className="text-[11px] text-[#8C8679] line-clamp-1 mt-1">
                            {n.content || 'Empty note'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
