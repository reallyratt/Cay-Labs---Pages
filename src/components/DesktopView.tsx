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
import { exportNotesToZip, importNotesFromFile } from '../utils/backupEngine';
import {
  GoogleUser,
  getStoredGoogleUser,
  setStoredGoogleUser,
  performFullAccountSync,
} from '../utils/googleSyncEngine';
import { GoogleAuthModal } from './GoogleAuthModal';
import { RefreshCw, LogOut, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';

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
  screenMode: 'light' | 'dark' | 'system';
  setScreenMode: (mode: 'light' | 'dark' | 'system') => void;
  selectedFont: 'geist' | 'monospace' | 'system';
  setSelectedFont: (font: 'geist' | 'monospace' | 'system') => void;
  fontScope: 'all' | 'editor';
  setFontScope: (scope: 'all' | 'editor') => void;
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
  screenMode,
  setScreenMode,
  selectedFont,
  setSelectedFont,
  fontScope,
  setFontScope,
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

  // Google Sync & Backup state
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(getStoredGoogleUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExportExpanded, setIsExportExpanded] = useState(false);
  const [exportFormatCoded, setExportFormatCoded] = useState(false);
  const [importStatus, setImportStatus] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    setGoogleUser(getStoredGoogleUser());
  }, [activeTab]);

  const handleManualSync = async () => {
    if (!googleUser) return;
    setIsSyncing(true);
    try {
      const { mergedNotes } = await performFullAccountSync(notes, googleUser.email);
      onImportNotes(mergedNotes);
      setGoogleUser(getStoredGoogleUser());
    } finally {
      setIsSyncing(false);
    }
  };

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

  const handleExportBackup = async () => {
    await exportNotesToZip(notes, exportFormatCoded);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus(null);
    try {
      const { mergedNotes, importedCount } = await importNotesFromFile(file, notes);
      if (importedCount > 0 || mergedNotes.length > notes.length) {
        const added = importedCount || (mergedNotes.length - notes.length);
        onImportNotes(mergedNotes);
        setImportStatus({
          text: `Import successful! ${added} page${added === 1 ? '' : 's'} added.`,
          isError: false,
        });
      } else {
        setImportStatus({
          text: 'Import completed: All pages in file are already up to date.',
          isError: false,
        });
      }
      e.target.value = '';
    } catch (err) {
      console.error('Import failed:', err);
      setImportStatus({
        text: 'Import failed: Invalid file format or corrupted backup.',
        isError: true,
      });
    }
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
    <div className="h-screen flex flex-col bg-[#F9F7F2] dark:bg-[#191716] text-[#2D2A29] dark:text-[#F2EFE9] overflow-hidden">
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
          className={`w-80 md:w-96 border-r border-[#E8E4D9] dark:border-[#383432] flex flex-col bg-[#F1EDE4]/40 dark:bg-[#201D1C]/40 h-full relative shrink-0 transition-all duration-300 ${
            dragOverLeft
              ? 'bg-[#E8E4D9]/80 dark:bg-[#383432]/80 ring-2 ring-inset ring-[#2D2A29] dark:ring-[#F2EFE9]'
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
              <div className="flex-1 flex flex-col h-full bg-[#F1EDE4]/50 dark:bg-[#201D1C]/50 overflow-hidden">
                <div className="p-4 space-y-2.5 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setSettingsCategory('looks')}
                    className={`w-full px-5 py-4 rounded-xl text-sm flex items-center justify-between transition-all cursor-pointer ${
                      settingsCategory === 'looks'
                        ? 'bg-white dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                        : 'bg-white/60 dark:bg-[#282524]/60 text-[#433F3E] dark:text-[#E6E0D4] hover:bg-white dark:hover:bg-[#282524] border border-[#E8E4D9]/80 dark:border-[#383432]/80 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Palette className="w-4.5 h-4.5 text-[#2D2A29] dark:text-[#F2EFE9]" />
                      <span>Looks</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsCategory('data')}
                    className={`w-full px-5 py-4 rounded-xl text-sm flex items-center justify-between transition-all cursor-pointer ${
                      settingsCategory === 'data'
                        ? 'bg-white dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                        : 'bg-white/60 dark:bg-[#282524]/60 text-[#433F3E] dark:text-[#E6E0D4] hover:bg-white dark:hover:bg-[#282524] border border-[#E8E4D9]/80 dark:border-[#383432]/80 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Database className="w-4.5 h-4.5 text-[#2D2A29] dark:text-[#F2EFE9]" />
                      <span>Data</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsCategory('about')}
                    className={`w-full px-5 py-4 rounded-xl text-sm flex items-center justify-between transition-all cursor-pointer ${
                      settingsCategory === 'about'
                        ? 'bg-white dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                        : 'bg-white/60 dark:bg-[#282524]/60 text-[#433F3E] dark:text-[#E6E0D4] hover:bg-white dark:hover:bg-[#282524] border border-[#E8E4D9]/80 dark:border-[#383432]/80 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Info className="w-4.5 h-4.5 text-[#2D2A29] dark:text-[#F2EFE9]" />
                      <span>About</span>
                    </div>
                  </button>
                </div>
              </div>
            ) : isSearching ? (
                /* SEARCH FOCUS MODE ON LEFT WINDOW: FOLDERS */
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="h-[57px] px-4 border-b border-[#E8E4D9] dark:border-[#383432] flex items-center justify-between bg-white/60 dark:bg-[#282524]/60 backdrop-blur-xs shrink-0 select-none">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#2D2A29] dark:text-[#F2EFE9] text-left">Folders</h2>
                    <span className="text-[11px] font-semibold text-[#8C8679] dark:text-[#A8A29A]">({matchingFolders.length})</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24">
                    {matchingFolders.length === 0 ? (
                      <div className="text-center py-10 text-[#8C8679] dark:text-[#A8A29A]">
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
                          className="p-3 bg-white dark:bg-[#282524] border border-[#E8E4D9] dark:border-[#383432] hover:border-[#8C8679]/50 rounded-xl cursor-pointer transition-all flex items-center justify-between shadow-xs hover:shadow-sm"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-[#F1EDE4] dark:bg-[#332F2D] flex items-center justify-center text-[#2D2A29] dark:text-[#F2EFE9] shrink-0">
                              <FolderIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-[#2D2A29] dark:text-[#F2EFE9] truncate">{folder.name}</h3>
                              <p className="text-[11px] text-[#8C8679] dark:text-[#A8A29A] truncate">{getFolderNoteCount(folder.id)} pages</p>
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
                    <div className="text-center py-16 text-[#8C8679] dark:text-[#A8A29A]">
                      <p className="text-sm font-semibold text-[#2D2A29] dark:text-[#F2EFE9] mb-1">No pages found</p>
                      <p className="text-xs mb-4">Create your first note to get started.</p>
                      <button
                        onClick={onCreateNewPage}
                        className="px-4 py-2 bg-[#2D2A29] dark:bg-[#F2EFE9] text-white dark:text-[#191716] text-xs font-semibold rounded-xl hover:bg-[#433F3E] dark:hover:bg-[#E6E0D4] transition-colors shadow-sm"
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
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D2A29] dark:text-[#F2EFE9]">
                              Pinned
                            </span>
                            <span className="text-[10px] font-semibold text-[#8C8679] dark:text-[#A8A29A]">
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
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#433F3E] dark:text-[#E6E0D4]">
                            Everything
                          </span>
                          <span className="text-[10px] font-semibold text-[#8C8679] dark:text-[#A8A29A]">
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
                  <div className="h-[57px] px-4 border-b border-[#E8E4D9] dark:border-[#383432] flex items-center justify-between bg-white/60 dark:bg-[#282524]/60 backdrop-blur-xs shrink-0 select-none">
                    <h2 className="text-base font-bold text-[#2D2A29] dark:text-[#F2EFE9] truncate min-w-0 pr-2">{activeFolderName}</h2>
                    <span className="text-xs font-semibold text-[#8C8679] dark:text-[#A8A29A] shrink-0">({filteredNotes.length})</span>
                  </div>

                  {/* Note Cards List for Selected Folder */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24">
                    {filteredNotes.length === 0 ? (
                      <div className="text-center py-16 text-[#8C8679] dark:text-[#A8A29A] flex flex-col items-center justify-center">
                        <p className="text-sm font-semibold text-[#2D2A29] dark:text-[#F2EFE9]">Nothing to view here</p>
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
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-[#2D2A29] dark:bg-[#242120] text-[#F9F7F2] dark:text-[#F2EFE9] rounded-full px-3 py-1.5 shadow-xl flex items-center gap-5 border border-[#433F3E] dark:border-[#3D3836] select-none"
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
        <div className="flex-1 h-full bg-[#F9F7F2] dark:bg-[#191716] overflow-hidden relative">
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
                  <div className="h-full w-full flex flex-col bg-[#F9F7F2] dark:bg-[#191716] overflow-y-auto">
                    <div className="sticky top-0 z-20 h-[57px] px-6 bg-[#F9F7F2]/95 dark:bg-[#191716]/95 backdrop-blur-md border-b border-[#E8E4D9] dark:border-[#383432] flex items-center justify-between text-left select-none">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#2D2A29] dark:text-[#F2EFE9] text-left">Pages</h2>
                      <span className="text-xs font-semibold text-[#8C8679] dark:text-[#A8A29A]">{matchingSearchNotes.length} matching</span>
                    </div>

                    <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-4 pb-24">
                      {matchingSearchNotes.length === 0 ? (
                        <div className="text-center py-20 text-[#8C8679] dark:text-[#A8A29A] border-2 border-dashed border-[#E8E4D9] dark:border-[#383432] rounded-2xl bg-white/50 dark:bg-[#282524]/50 p-8 flex flex-col items-center justify-center">
                          <FileText className="w-10 h-10 text-[#8C8679] dark:text-[#A8A29A] mb-2 opacity-60" />
                          <p className="text-sm font-semibold text-[#2D2A29] dark:text-[#F2EFE9]">No pages matching "{searchQuery}"</p>
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
                className={`h-full w-full flex flex-col bg-[#F9F7F2] dark:bg-[#191716] overflow-y-auto transition-colors relative ${
                  dragOverRight
                    ? 'bg-[#E8E4D9]/60 dark:bg-[#383432]/60 ring-2 ring-dashed ring-[#8C8679] dark:ring-[#A8A29A]'
                    : ''
                }`}
              >
                {/* Tab Header */}
                <div className="sticky top-0 z-30 h-[57px] px-6 bg-[#F9F7F2]/95 dark:bg-[#191716]/95 backdrop-blur-md border-b border-[#E8E4D9] dark:border-[#383432] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold tracking-tight text-[#2D2A29] dark:text-[#F2EFE9]">Archive</h2>
                  </div>
                  <span className="text-xs font-semibold text-[#8C8679] dark:text-[#A8A29A]">
                    {archivedNotes.length}
                  </span>
                </div>

                {/* Tab Body Content */}
                <div className="flex-1 max-w-3xl w-full mx-auto p-6 space-y-3 pb-28">
                  {archivedNotes.length === 0 ? (
                    <div className="text-center py-20 text-[#8C8679] dark:text-[#A8A29A] border-2 border-dashed border-[#E8E4D9] dark:border-[#383432] rounded-2xl bg-white/50 dark:bg-[#282524]/50 p-8">
                      <Archive className="w-12 h-12 mx-auto mb-3 text-[#8C8679] dark:text-[#A8A29A]" />
                      <p className="text-base font-bold text-[#2D2A29] dark:text-[#F2EFE9]">Archive is empty</p>
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
                            className={`group relative bg-white dark:bg-[#282524] border rounded-xl p-4 flex items-center justify-between gap-4 transition-all shadow-sm cursor-pointer ${
                              isSelected
                                ? 'border-[#2D2A29] dark:border-[#F2EFE9] bg-[#F1EDE4] dark:bg-[#332F2D]'
                                : 'border-[#E8E4D9] dark:border-[#383432] hover:border-[#8C8679]/50'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-[#2D2A29] dark:text-[#F2EFE9] line-clamp-3 break-words whitespace-pre-wrap">
                                {note.title.trim() || 'Untitled Page'}
                              </h4>
                              <p className="text-xs text-[#8C8679] dark:text-[#A8A29A] line-clamp-1 mt-0.5">
                                {note.content.trim() || 'Empty content'}
                              </p>
                              <span className="text-[10px] text-[#8C8679] dark:text-[#A8A29A] block mt-1">
                                Archived {formatTimeAgo(note.updatedAt)}
                              </span>
                            </div>

                            {/* Circle checkbox on hover or selected */}
                            <div className="shrink-0 flex items-center">
                              <div
                                className={`w-5 h-5 rounded-full border transition-all duration-150 flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-[#2D2A29] dark:bg-[#F2EFE9] border-[#2D2A29] dark:border-[#F2EFE9] text-white dark:text-[#191716] scale-105'
                                    : 'border-[#8C8679] bg-white dark:bg-[#282524] text-transparent opacity-0 group-hover:opacity-100 hover:border-[#2D2A29] dark:hover:border-[#F2EFE9]'
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
                className={`h-full w-full flex flex-col bg-[#F9F7F2] dark:bg-[#191716] overflow-y-auto transition-colors relative ${
                  dragOverRight
                    ? 'bg-[#FFE3E3]/50 dark:bg-[#5C1D24]/50 ring-2 ring-dashed ring-[#D90429]'
                    : ''
                }`}
              >
                {/* Tab Header */}
                <div className="sticky top-0 z-30 h-[57px] px-6 bg-[#F9F7F2]/95 dark:bg-[#191716]/95 backdrop-blur-md border-b border-[#E8E4D9] dark:border-[#383432] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold tracking-tight text-[#2D2A29] dark:text-[#F2EFE9]">Dumpster</h2>
                  </div>
                  <span className="text-xs font-semibold text-[#8C8679] dark:text-[#A8A29A]">
                    {dumpsterNotes.length}
                  </span>
                </div>

                {/* Tab Body Content */}
                <div className="flex-1 max-w-3xl w-full mx-auto p-6 space-y-3 pb-28">
                  {dumpsterNotes.length === 0 ? (
                    <div className="text-center py-20 text-[#8C8679] dark:text-[#A8A29A] border-2 border-dashed border-[#E8E4D9] dark:border-[#383432] rounded-2xl bg-white/50 dark:bg-[#282524]/50 p-8">
                      <Trash2 className="w-12 h-12 mx-auto mb-3 text-[#8C8679] dark:text-[#A8A29A]" />
                      <p className="text-base font-bold text-[#2D2A29] dark:text-[#F2EFE9]">Dumpster is clean</p>
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
                            className={`group relative bg-white dark:bg-[#282524] border rounded-xl p-4 flex items-center justify-between gap-4 transition-all shadow-sm cursor-pointer ${
                              isSelected
                                ? 'border-[#2D2A29] dark:border-[#F2EFE9] bg-[#F1EDE4] dark:bg-[#332F2D]'
                                : 'border-[#E8E4D9] dark:border-[#383432] hover:border-[#8C8679]/50'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-[#2D2A29] dark:text-[#F2EFE9] line-clamp-3 break-words whitespace-pre-wrap line-through opacity-70">
                                {note.title.trim() || 'Untitled Page'}
                              </h4>
                              <p className="text-xs text-[#8C8679] dark:text-[#A8A29A] line-clamp-1 mt-0.5">
                                {note.content.trim() || 'Empty content'}
                              </p>
                              <span className="text-[10px] text-[#8C8679] dark:text-[#A8A29A] block mt-1">
                                Deleted {formatTimeAgo(note.updatedAt)}
                              </span>
                            </div>

                            {/* Circle button on hover or when selected */}
                            <div className="shrink-0 flex items-center">
                              <div
                                className={`w-5 h-5 rounded-full border transition-all duration-150 flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-[#2D2A29] dark:bg-[#F2EFE9] border-[#2D2A29] dark:border-[#F2EFE9] text-white dark:text-[#191716] scale-105'
                                    : 'border-[#8C8679] bg-white dark:bg-[#282524] text-transparent opacity-0 group-hover:opacity-100 hover:border-[#2D2A29] dark:hover:border-[#F2EFE9]'
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
                className="h-full w-full flex flex-col bg-[#F9F7F2] dark:bg-[#191716] overflow-y-auto"
              >
                <div className="sticky top-0 z-30 h-[57px] px-6 bg-[#F9F7F2]/95 dark:bg-[#191716]/95 backdrop-blur-md border-b border-[#E8E4D9] dark:border-[#383432] flex items-center justify-between shrink-0 select-none">
                  <h2 className="text-base font-bold tracking-tight text-[#2D2A29] dark:text-[#F2EFE9] capitalize">
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
                        <div className="bg-white dark:bg-[#282524] rounded-2xl p-5 border border-[#E8E4D9] dark:border-[#383432] shadow-xs space-y-3">
                          <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] dark:text-[#E6E0D4] block">
                            Screen Mode
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            <button
                              type="button"
                              onClick={() => setScreenMode('dark')}
                              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                                screenMode === 'dark'
                                  ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                  : 'bg-[#F9F7F2] dark:bg-[#201D1C] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#282524]'
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
                                  ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                  : 'bg-[#F9F7F2] dark:bg-[#201D1C] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#282524]'
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
                                  ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                  : 'bg-[#F9F7F2] dark:bg-[#201D1C] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#282524]'
                              }`}
                            >
                              <Paintbrush className="w-4 h-4" />
                              <span className="text-xs font-bold">System</span>
                            </button>
                          </div>
                        </div>

                        {/* Layout Mode */}
                        <div className="bg-white dark:bg-[#282524] rounded-2xl p-5 border border-[#E8E4D9] dark:border-[#383432] shadow-xs space-y-3">
                          <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] dark:text-[#E6E0D4] block">
                            Layout Mode
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            <button
                              type="button"
                              onClick={() => setViewMode('mobile')}
                              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                                viewMode === 'mobile'
                                  ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                  : 'bg-[#F9F7F2] dark:bg-[#201D1C] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#282524]'
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
                                  ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                  : 'bg-[#F9F7F2] dark:bg-[#201D1C] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#282524]'
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
                                  ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                  : 'bg-[#F9F7F2] dark:bg-[#201D1C] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#282524]'
                              }`}
                            >
                              <Paintbrush className="w-4 h-4" />
                              <span className="text-xs font-bold">System</span>
                            </button>
                          </div>
                        </div>

                        {/* Font Mode Selection */}
                        <div className="bg-white dark:bg-[#282524] rounded-2xl p-5 border border-[#E8E4D9] dark:border-[#383432] shadow-xs space-y-3">
                          <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] dark:text-[#E6E0D4] block">
                            Font Mode
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            <button
                              type="button"
                              onClick={() => setSelectedFont('geist')}
                              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                                selectedFont === 'geist'
                                  ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                  : 'bg-[#F9F7F2] dark:bg-[#201D1C] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#282524]'
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
                                  ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                  : 'bg-[#F9F7F2] dark:bg-[#201D1C] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#282524]'
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
                                  ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                  : 'bg-[#F9F7F2] dark:bg-[#201D1C] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#282524]'
                              }`}
                            >
                              <Paintbrush className="w-4 h-4" />
                              <span className="text-xs font-bold">System</span>
                            </button>
                          </div>

                          {/* Apply Font Target Scope */}
                          <div className="pt-2 border-t border-[#E8E4D9]/60 dark:border-[#383432]/60">
                            <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] dark:text-[#E6E0D4] block mb-2.5">
                              APPLICATION
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => setFontScope('all')}
                                className={`p-3.5 rounded-xl border flex items-center justify-center text-center transition-all cursor-pointer ${
                                  fontScope === 'all'
                                    ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                    : 'bg-[#F9F7F2] dark:bg-[#201D1C] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#282524]'
                                }`}
                              >
                                <span className="text-xs font-bold">PAGES</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setFontScope('editor')}
                                className={`p-3.5 rounded-xl border flex items-center justify-center text-center transition-all cursor-pointer ${
                                  fontScope === 'editor'
                                    ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                                    : 'bg-[#F9F7F2] dark:bg-[#201D1C] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#282524]'
                                }`}
                              >
                                <span className="text-xs font-bold">PAGE</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {settingsCategory === 'data' && (
                    <div className="space-y-6">
                      {/* Account Sync */}
                      <div className="bg-white dark:bg-[#282524] rounded-2xl p-5 border border-[#E8E4D9] dark:border-[#383432] shadow-xs space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] dark:text-[#E6E0D4] block">
                          Account Sync
                        </label>
                        <div className="bg-[#F9F7F2] dark:bg-[#201D1C] border border-[#E8E4D9] dark:border-[#383432] rounded-xl p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {googleUser?.avatarUrl ? (
                              <img
                                src={googleUser.avatarUrl}
                                alt={googleUser.name}
                                className="w-9 h-9 rounded-full object-cover border border-[#E8E4D9] dark:border-[#383432]"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-white dark:bg-[#282524] border border-[#E8E4D9] dark:border-[#383432] flex items-center justify-center font-black text-xs text-[#2D2A29] dark:text-[#F2EFE9] shadow-xs">
                                CL
                              </div>
                            )}
                            <div>
                              <div className="text-xs font-bold text-[#2D2A29] dark:text-[#F2EFE9]">
                                {googleUser ? googleUser.name : 'CayLabs Account'}
                              </div>
                              <span className="text-[11px] text-[#8C8679] dark:text-[#A8A29A] block">
                                {googleUser ? googleUser.email : 'Sync your notes seamlessly across devices via Google'}
                              </span>
                            </div>
                          </div>

                          {googleUser ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleManualSync}
                                disabled={isSyncing}
                                className="px-3 py-1.5 bg-[#F1EDE4] dark:bg-[#332F2D] hover:bg-white dark:hover:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border border-[#E8E4D9] dark:border-[#383432] text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                                <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setStoredGoogleUser(null);
                                  setGoogleUser(null);
                                }}
                                className="p-1.5 text-[#8C8679] dark:text-[#A8A29A] hover:text-[#2D2A29] dark:hover:text-[#F2EFE9] rounded-lg transition-colors cursor-pointer"
                                title="Sign out"
                              >
                                <LogOut className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsAuthModalOpen(true)}
                              className="px-3.5 py-2 bg-[#2D2A29] dark:bg-[#F2EFE9] text-white dark:text-[#2D2A29] text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                            >
                              Login
                            </button>
                          )}
                        </div>
                      </div>

                      {/* BACKUP (Export / Import) */}
                      <div className="bg-white dark:bg-[#282524] rounded-2xl p-5 border border-[#E8E4D9] dark:border-[#383432] shadow-xs space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] dark:text-[#E6E0D4] block">
                          BACKUP
                        </label>
                        <p className="text-xs text-[#8C8679] dark:text-[#A8A29A] leading-relaxed">
                          Export every pages into .txt zipped file or import a saved backup file.
                        </p>
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          {/* Export Button (Expandable) */}
                          <button
                            type="button"
                            onClick={() => setIsExportExpanded((prev) => !prev)}
                            className={`py-2.5 px-4 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                              isExportExpanded
                                ? 'bg-[#F9F7F2] dark:bg-[#332F2D] border-[#8C8679] text-[#2D2A29] dark:text-[#F2EFE9]'
                                : 'bg-[#F1EDE4] dark:bg-[#332F2D] border-[#E8E4D9] dark:border-[#383432] text-[#2D2A29] dark:text-[#F2EFE9] hover:bg-[#F9F7F2] dark:hover:bg-[#282524]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Download className="w-4 h-4" />
                              <span>Export</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExportExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Import Button */}
                          <label className="py-2.5 px-4 bg-[#F1EDE4] dark:bg-[#332F2D] hover:bg-[#F9F7F2] dark:hover:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border border-[#E8E4D9] dark:border-[#383432] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer">
                            <Upload className="w-4 h-4" />
                            <span>Import</span>
                            <input
                              type="file"
                              accept=".txt,.zip,.json"
                              onChange={handleFileImport}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* Import Status Feedback Message */}
                        <AnimatePresence>
                          {importStatus && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 border ${
                                importStatus.isError
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              }`}
                            >
                              {importStatus.isError ? (
                                <AlertCircle className="w-4 h-4 shrink-0" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                              )}
                              <span>{importStatus.text}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Expandable Export Option Panel */}
                        <AnimatePresence>
                          {isExportExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 rounded-2xl bg-[#F9F7F2] dark:bg-[#201D1C] border border-[#E8E4D9] dark:border-[#383432] space-y-4">
                                {/* Format Coded Toggle Option */}
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <div className="text-xs font-bold text-[#2D2A29] dark:text-[#F2EFE9]">
                                      Export with Format Coded
                                    </div>
                                    <div className="text-[11px] text-[#8C8679] dark:text-[#A8A29A]">
                                      Preserve text formatting, sizes & HTML tags in exported .txt files
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setExportFormatCoded((prev) => !prev)}
                                    className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                                      exportFormatCoded ? 'bg-[#2D2A29] dark:bg-[#F2EFE9]' : 'bg-[#E8E4D9] dark:bg-[#383432]'
                                    }`}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded-full bg-white dark:bg-[#201D1C] transition-transform ${
                                        exportFormatCoded ? 'translate-x-5' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                </div>

                                {/* Full-width Export trigger button */}
                                <button
                                  type="button"
                                  onClick={handleExportBackup}
                                  className="w-full py-3 bg-[#2D2A29] dark:bg-[#F2EFE9] text-white dark:text-[#2D2A29] text-xs font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Export</span>
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {settingsCategory === 'about' && (
                    <div className="bg-white dark:bg-[#282524] rounded-2xl p-6 border border-[#E8E4D9] dark:border-[#383432] shadow-xs flex flex-col justify-between min-h-[280px]">
                      <div className="space-y-3">
                        <h3 className="text-2xl font-bold tracking-tight text-[#2D2A29] dark:text-[#F2EFE9]">
                          Pages
                        </h3>
                        <p className="text-sm font-medium text-[#433F3E] dark:text-[#E6E0D4] leading-relaxed">
                          leave this Pages, start writing effectively.
                        </p>
                      </div>

                      <div className="pt-8 border-t border-[#E8E4D9] dark:border-[#383432] text-left space-y-1">
                        <p className="text-xs font-semibold text-[#8C8679] dark:text-[#A8A29A]">
                          Authorized by CayLabs
                        </p>
                        <p className="text-[11px] font-bold text-[#8C8679]/80 dark:text-[#A8A29A]/80">
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
                className="h-full w-full flex flex-col bg-[#F9F7F2] dark:bg-[#191716] overflow-y-auto"
              >
                <div className="sticky top-0 z-30 bg-[#F9F7F2]/95 dark:bg-[#191716]/95 backdrop-blur-md border-b border-[#E8E4D9] dark:border-[#383432] px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onCloseTab}
                      className="p-1.5 text-[#2D2A29] dark:text-[#F2EFE9] hover:bg-[#F1EDE4] dark:hover:bg-[#282524] rounded-xl transition-colors flex items-center gap-1.5 font-semibold text-xs border border-[#E8E4D9] dark:border-[#383432] bg-white dark:bg-[#282524] shadow-sm"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Note</span>
                    </button>
                    <div className="h-4 w-px bg-[#E8E4D9] dark:bg-[#383432]" />
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-5 h-5 text-[#8C8679] dark:text-[#A8A29A]" />
                      <h2 className="text-base font-bold tracking-tight text-[#2D2A29] dark:text-[#F2EFE9]">PWA Web App Widgets</h2>
                    </div>
                  </div>
                </div>

                <div className="flex-1 max-w-3xl w-full mx-auto p-6 space-y-6">
                  <div className="bg-white dark:bg-[#282524] rounded-2xl p-6 border border-[#E8E4D9] dark:border-[#383432] shadow-sm space-y-3">
                    <h4 className="text-sm font-bold text-[#2D2A29] dark:text-[#F2EFE9]">Recent Pages Widget</h4>
                    <p className="text-xs text-[#8C8679] dark:text-[#A8A29A]">Quick preview of your latest active pages</p>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {notes.slice(0, 4).map((n) => (
                        <div
                          key={n.id}
                          className="p-3 bg-[#F9F7F2] dark:bg-[#201D1C] border border-[#E8E4D9] dark:border-[#383432] rounded-xl text-left"
                        >
                          <h5 className="text-xs font-bold truncate text-[#2D2A29] dark:text-[#F2EFE9]">
                            {n.title || 'Untitled'}
                          </h5>
                          <p className="text-[11px] text-[#8C8679] dark:text-[#A8A29A] line-clamp-1 mt-1">
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
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={async (user) => {
          setGoogleUser(user);
          const { mergedNotes } = await performFullAccountSync(notes, user.email);
          onImportNotes(mergedNotes);
        }}
      />
    </div>
  );
};
