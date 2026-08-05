import React, { useState, useEffect } from 'react';
import { Note, Folder, ViewMode, AppSection } from './types';
import { loadNotes, saveNotes, loadFolders, saveFolders } from './utils/storage';
import { usePWA, registerServiceWorker } from './utils/pwa';
import { MobileView } from './components/MobileView';
import { DesktopView } from './components/DesktopView';
import { NoteEditor } from './components/NoteEditor';
import { FolderModal } from './components/FolderModal';
import { ArchiveModal } from './components/ArchiveModal';
import { DumpsterModal } from './components/DumpsterModal';
import { SettingsModal } from './components/SettingsModal';
import { ConfirmationModal } from './components/ConfirmationModal';

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('auto');
  const [isWindowMobile, setIsWindowMobile] = useState<boolean>(false);

  // Multi-select state
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [prevSelectedNoteIds, setPrevSelectedNoteIds] = useState<string[] | null>(null);
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null);

  // Active section or tab
  const [activeModal, setActiveModal] = useState<AppSection | 'folders' | null>(null);
  // Mobile active editor screen overlay
  const [isMobileEditing, setIsMobileEditing] = useState<boolean>(false);

  const { pwaState, triggerInstall } = usePWA();

  // Initialize data and register Service Worker
  useEffect(() => {
    registerServiceWorker();
    const loadedNotes = loadNotes();
    const loadedFolders = loadFolders();
    setNotes(loadedNotes);
    setFolders(loadedFolders);

    // Select welcome note by default if available
    if (loadedNotes.length > 0) {
      setSelectedNoteId(loadedNotes[0].id);
    }
  }, []);

  // Screen size auto detect listener
  useEffect(() => {
    const checkMobile = () => {
      setIsWindowMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Save notes whenever state changes
  const updateNotesState = (newNotes: Note[]) => {
    setNotes(newNotes);
    saveNotes(newNotes);
  };

  const updateFoldersState = (newFolders: Folder[]) => {
    setFolders(newFolders);
    saveFolders(newFolders);
  };

  // Determine current effective layout
  const isMobileLayout =
    viewMode === 'mobile' ? true : viewMode === 'desktop' ? false : isWindowMobile;

  // Selected note object
  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  // Multi-select handlers
  const isSelectMode = selectedNoteIds.length > 0;

  const handleToggleSelectNote = (id: string) => {
    setPrevSelectedNoteIds(null);
    if (selectedNoteIds.includes(id)) {
      setSelectedNoteIds(selectedNoteIds.filter((item) => item !== id));
    } else {
      setSelectedNoteIds([...selectedNoteIds, id]);
    }
  };

  const handleLongPressNote = (id: string) => {
    if (!selectedNoteIds.includes(id)) {
      setSelectedNoteIds([...selectedNoteIds, id]);
    }
  };

  const handleCancelSelectMode = () => {
    setSelectedNoteIds([]);
    setPrevSelectedNoteIds(null);
  };

  const handleToggleSelectAllUnpinned = () => {
    const activeUnpinned = notes.filter((n) => {
      if (n.isArchived || n.isDeleted || n.isPinned) return false;
      if (activeFolderId && n.folderId !== activeFolderId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const unpinnedIds = activeUnpinned.map((n) => n.id);
    const allSelected = unpinnedIds.length > 0 && unpinnedIds.every((id) => selectedNoteIds.includes(id));

    if (allSelected) {
      if (prevSelectedNoteIds !== null) {
        setSelectedNoteIds(prevSelectedNoteIds);
        setPrevSelectedNoteIds(null);
      } else {
        setSelectedNoteIds(selectedNoteIds.filter((id) => !unpinnedIds.includes(id)));
      }
    } else {
      setPrevSelectedNoteIds(selectedNoteIds);
      const combined = Array.from(new Set([...selectedNoteIds, ...unpinnedIds]));
      setSelectedNoteIds(combined);
    }
  };

  const handleConfirmArchiveSelected = () => {
    const newNotes = notes.map((n) =>
      selectedNoteIds.includes(n.id)
        ? { ...n, isArchived: true, isPinned: false, updatedAt: Date.now() }
        : n
    );
    updateNotesState(newNotes);
    setSelectedNoteIds([]);
    setPrevSelectedNoteIds(null);
    setConfirmAction(null);
  };

  const handleConfirmDeleteSelected = () => {
    const newNotes = notes.map((n) =>
      selectedNoteIds.includes(n.id)
        ? { ...n, isDeleted: true, isPinned: false, updatedAt: Date.now() }
        : n
    );
    updateNotesState(newNotes);
    setSelectedNoteIds([]);
    setPrevSelectedNoteIds(null);
    setConfirmAction(null);
  };

  // Actions
  const handleSelectNote = (id: string) => {
    if (isSelectMode) {
      handleToggleSelectNote(id);
      return;
    }
    setSelectedNoteId(id);
    if (isMobileLayout) {
      setIsMobileEditing(true);
    }
  };

  const handleCreateNewPage = () => {
    const newNote: Note = {
      id: `n-${Date.now()}`,
      title: '',
      content: '',
      isPinned: false,
      isArchived: false,
      isDeleted: false,
      folderId: activeFolderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newNote, ...notes];
    updateNotesState(updated);
    setSelectedNoteId(newNote.id);
    if (isMobileLayout) {
      setIsMobileEditing(true);
    }
  };

  const handleUpdateNote = (updated: Note) => {
    const newNotes = notes.map((n) => (n.id === updated.id ? updated : n));
    updateNotesState(newNotes);
  };

  const handleTogglePin = (id: string) => {
    const newNotes = notes.map((n) =>
      n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: Date.now() } : n
    );
    updateNotesState(newNotes);
  };

  const handleArchiveNote = (id: string) => {
    const newNotes = notes.map((n) =>
      n.id === id ? { ...n, isArchived: true, isPinned: false, updatedAt: Date.now() } : n
    );
    updateNotesState(newNotes);
    if (selectedNoteId === id) {
      setIsMobileEditing(false);
    }
  };

  const handleUnarchiveNote = (id: string) => {
    const newNotes = notes.map((n) =>
      n.id === id ? { ...n, isArchived: false, updatedAt: Date.now() } : n
    );
    updateNotesState(newNotes);
  };

  const handleDeleteNoteToDumpster = (id: string) => {
    const newNotes = notes.map((n) =>
      n.id === id ? { ...n, isDeleted: true, isPinned: false, updatedAt: Date.now() } : n
    );
    updateNotesState(newNotes);
    if (selectedNoteId === id) {
      setIsMobileEditing(false);
    }
  };

  const handleRestoreFromDumpster = (id: string) => {
    const newNotes = notes.map((n) =>
      n.id === id ? { ...n, isDeleted: false, isArchived: false, updatedAt: Date.now() } : n
    );
    updateNotesState(newNotes);
  };

  const handlePermanentDeleteNote = (id: string) => {
    const newNotes = notes.filter((n) => n.id !== id);
    updateNotesState(newNotes);
  };

  const handleEmptyDumpster = () => {
    if (window.confirm('Are you sure you want to permanently delete all pages in the dumpster?')) {
      const newNotes = notes.filter((n) => !n.isDeleted);
      updateNotesState(newNotes);
    }
  };

  const handleCreateFolder = (folder: Folder) => {
    const updated = [...folders, folder];
    updateFoldersState(updated);
  };

  const handleUpdateFolder = (updatedFolder: Folder) => {
    const updated = folders.map((f) => (f.id === updatedFolder.id ? updatedFolder : f));
    updateFoldersState(updated);
  };

  const handleDeleteFolder = (folderId: string) => {
    const updated = folders.filter((f) => f.id !== folderId);
    updateFoldersState(updated);
    if (activeFolderId === folderId) setActiveFolderId(null);
  };

  const handleDeleteFolders = (folderIds: string[]) => {
    const updated = folders.filter((f) => !folderIds.includes(f.id));
    updateFoldersState(updated);
    if (activeFolderId && folderIds.includes(activeFolderId)) setActiveFolderId(null);
  };

  const handleMoveNoteToFolder = (noteId: string, folderId: string | null) => {
    const updated = notes.map((n) =>
      n.id === noteId ? { ...n, folderId, updatedAt: Date.now() } : n
    );
    updateNotesState(updated);
  };

  const handleImportNotes = (imported: Note[]) => {
    updateNotesState(imported);
    if (imported.length > 0) setSelectedNoteId(imported[0].id);
  };

  const archivedNotes = notes.filter((n) => n.isArchived && !n.isDeleted);
  const dumpsterNotes = notes.filter((n) => n.isDeleted);

  return (
    <div className="w-full min-h-screen bg-[#F9F7F2] text-[#2D2A29] font-sans antialiased">
      {/* Layout Rendering according to dual customized view requirements */}
      {isMobileLayout ? (
        <>
          {/* If editing a note on mobile screen, show full screen NoteEditor */}
          {isMobileEditing ? (
            <div className="fixed inset-0 z-40 bg-[#F9F7F2]">
              <NoteEditor
                note={selectedNote}
                folders={folders}
                onUpdateNote={handleUpdateNote}
                onCloseMobile={() => setIsMobileEditing(false)}
                onArchiveNote={handleArchiveNote}
                onDeleteNote={handleDeleteNoteToDumpster}
                onTogglePin={handleTogglePin}
                isMobileView={true}
              />
            </div>
          ) : (
            <MobileView
              notes={notes}
              folders={folders}
              selectedNoteId={selectedNoteId}
              onSelectNote={handleSelectNote}
              onCreateNewPage={handleCreateNewPage}
              onOpenSection={(section) => setActiveModal(section)}
              onOpenFolders={() => setActiveModal('folders')}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeFolderId={activeFolderId}
              onSelectFolder={(id) => setActiveFolderId(id)}
              onClearFolderFilter={() => setActiveFolderId(null)}
              onTogglePin={handleTogglePin}
              onArchiveNote={handleArchiveNote}
              onDeleteNote={handleDeleteNoteToDumpster}
              isOffline={pwaState.isOffline}
              isSelectMode={isSelectMode}
              selectedNoteIds={selectedNoteIds}
              onToggleSelectNote={handleToggleSelectNote}
              onLongPressNote={handleLongPressNote}
              onCancelSelectMode={handleCancelSelectMode}
              onToggleSelectAllUnpinned={handleToggleSelectAllUnpinned}
              onRequestArchiveSelected={() => setConfirmAction('archive')}
              onRequestDeleteSelected={() => setConfirmAction('delete')}
            />
          )}

          {/* On Mobile, sections open as full screen modals */}
          <FolderModal
            isOpen={activeModal === 'folders'}
            onClose={() => setActiveModal(null)}
            folders={folders}
            notes={notes}
            activeFolderId={activeFolderId}
            onSelectFolder={(id) => setActiveFolderId(id)}
            onCreateFolder={handleCreateFolder}
            onUpdateFolder={handleUpdateFolder}
            onDeleteFolders={handleDeleteFolders}
            onMoveNoteToFolder={handleMoveNoteToFolder}
          />

          <ArchiveModal
            isOpen={activeModal === 'archive'}
            onClose={() => setActiveModal(null)}
            archivedNotes={archivedNotes}
            onUnarchiveNote={handleUnarchiveNote}
            onDeleteNoteToDumpster={handleDeleteNoteToDumpster}
          />

          <DumpsterModal
            isOpen={activeModal === 'dumpster'}
            onClose={() => setActiveModal(null)}
            dumpsterNotes={dumpsterNotes}
            onRestoreNote={handleRestoreFromDumpster}
            onPermanentDeleteNote={handlePermanentDeleteNote}
            onEmptyDumpster={handleEmptyDumpster}
          />

          <SettingsModal
            isOpen={activeModal === 'settings'}
            onClose={() => setActiveModal(null)}
            viewMode={viewMode}
            setViewMode={setViewMode}
            pwaState={pwaState}
            onTriggerInstall={triggerInstall}
            notes={notes}
            onImportNotes={handleImportNotes}
          />
        </>
      ) : (
        /* Desktop View - Right Window renders activeTab directly */
        <DesktopView
          notes={notes}
          folders={folders}
          selectedNote={selectedNote}
          onSelectNote={handleSelectNote}
          onCreateNewPage={handleCreateNewPage}
          onUpdateNote={handleUpdateNote}
          onOpenSection={(section) => setActiveModal(section)}
          onOpenFolders={() => setActiveModal('folders')}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeFolderId={activeFolderId}
          onClearFolderFilter={() => setActiveFolderId(null)}
          onTogglePin={handleTogglePin}
          onArchiveNote={handleArchiveNote}
          onDeleteNote={handleDeleteNoteToDumpster}
          onUnarchiveNote={handleUnarchiveNote}
          onRestoreFromDumpster={handleRestoreFromDumpster}
          onPermanentDeleteNote={handlePermanentDeleteNote}
          onEmptyDumpster={handleEmptyDumpster}
          onCreateFolder={handleCreateFolder}
          onUpdateFolder={handleUpdateFolder}
          onDeleteFolder={handleDeleteFolder}
          onDeleteFolders={handleDeleteFolders}
          onMoveNoteToFolder={handleMoveNoteToFolder}
          onSelectFolder={(id) => setActiveFolderId(id)}
          activeTab={activeModal || 'editor'}
          onCloseTab={() => setActiveModal(null)}
          viewMode={viewMode}
          setViewMode={setViewMode}
          pwaState={pwaState}
          onTriggerInstall={triggerInstall}
          onImportNotes={handleImportNotes}
          isOffline={pwaState.isOffline}
          isSelectMode={isSelectMode}
          selectedNoteIds={selectedNoteIds}
          onToggleSelectNote={handleToggleSelectNote}
          onLongPressNote={handleLongPressNote}
          onCancelSelectMode={handleCancelSelectMode}
          onToggleSelectAllUnpinned={handleToggleSelectAllUnpinned}
          onRequestArchiveSelected={() => setConfirmAction('archive')}
          onRequestDeleteSelected={() => setConfirmAction('delete')}
        />
      )}

      {/* Confirmation Modals for Bulk Actions */}
      <ConfirmationModal
        isOpen={confirmAction === 'archive'}
        title={`Archive ${selectedNoteIds.length} ${selectedNoteIds.length === 1 ? 'item' : 'items'}?`}
        description={`Selected ${selectedNoteIds.length === 1 ? 'item' : 'items'} will be moved to Archive.`}
        confirmLabel="Archive"
        onConfirm={handleConfirmArchiveSelected}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmationModal
        isOpen={confirmAction === 'delete'}
        title={`Delete ${selectedNoteIds.length} ${selectedNoteIds.length === 1 ? 'item' : 'items'}?`}
        description={`Selected ${selectedNoteIds.length === 1 ? 'item' : 'items'} will first be moved to "Dumpster".`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleConfirmDeleteSelected}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
