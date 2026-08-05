import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, FileText, Folder as FolderIcon } from 'lucide-react';
import { Note, Folder, AppSection } from '../types';
import { Header } from './Header';
import { NoteCard } from './NoteCard';
import { SelectModeBar } from './SelectModeBar';

interface MobileViewProps {
  notes: Note[];
  folders: Folder[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNewPage: () => void;
  onOpenSection: (section: AppSection) => void;
  onOpenFolders: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFolderId: string | null;
  onSelectFolder?: (id: string | null) => void;
  onClearFolderFilter: () => void;
  onTogglePin: (id: string) => void;
  onArchiveNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  isOffline?: boolean;
  // Multi-select props
  isSelectMode: boolean;
  selectedNoteIds: string[];
  onToggleSelectNote: (id: string) => void;
  onLongPressNote: (id: string) => void;
  onCancelSelectMode: () => void;
  onToggleSelectAllUnpinned: () => void;
  onRequestArchiveSelected: () => void;
  onRequestDeleteSelected: () => void;
}

export const MobileView: React.FC<MobileViewProps> = ({
  notes,
  folders,
  selectedNoteId,
  onSelectNote,
  onCreateNewPage,
  onOpenSection,
  onOpenFolders,
  searchQuery,
  setSearchQuery,
  activeFolderId,
  onSelectFolder,
  onClearFolderFilter,
  onArchiveNote,
  onDeleteNote,
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
  // Filter active notes (not archived, not deleted)
  const activeNotes = notes.filter((n) => !n.isArchived && !n.isDeleted);

  const isSearching = searchQuery.trim().length > 0;
  const searchQ = searchQuery.trim().toLowerCase();

  const matchingFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQ)
  );

  const matchingSearchNotes = activeNotes.filter(
    (n) => n.title.toLowerCase().includes(searchQ) || n.content.toLowerCase().includes(searchQ)
  );

  // Apply search & folder filter for default view
  const filteredNotes = activeNotes.filter((n) => {
    if (activeFolderId && n.folderId !== activeFolderId) return false;
    if (searchQuery.trim()) {
      return (
        n.title.toLowerCase().includes(searchQ) ||
        n.content.toLowerCase().includes(searchQ)
      );
    }
    return true;
  });

  // Separate pinned and unpinned
  const pinnedNotes = filteredNotes
    .filter((n) => n.isPinned)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const unpinnedNotes = filteredNotes
    .filter((n) => !n.isPinned)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const activeFolderName = folders.find((f) => f.id === activeFolderId)?.name;

  const allUnpinnedSelected =
    unpinnedNotes.length > 0 &&
    unpinnedNotes.every((n) => selectedNoteIds.includes(n.id));

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F7F2] pb-28 select-none sm:select-text">
      {/* Mobile Top Header */}
      <Header
        onOpenSection={onOpenSection}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isOffline={isOffline}
        activeFolderId={activeFolderId}
        activeFolderName={activeFolderName}
        onClearFolderFilter={onClearFolderFilter}
        isMobile={true}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 pt-4 max-w-lg mx-auto w-full">
        {isSearching ? (
          /* MOBILE SEARCH RESULTS VIEW */
          <div className="space-y-6">
            {/* FOLDERS SECTION */}
            <div>
              <div className="flex items-center justify-between mb-2.5 px-1 text-left">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#2D2A29] text-left">
                  Folders
                </h2>
                <span className="text-[11px] font-semibold text-[#8C8679]">
                  {matchingFolders.length}
                </span>
              </div>
              {matchingFolders.length === 0 ? (
                <p className="text-xs text-[#8C8679] px-1 py-2">No matching folders</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {matchingFolders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => {
                        if (onSelectFolder) onSelectFolder(folder.id);
                        setSearchQuery('');
                      }}
                      className="p-3 bg-white border border-[#E8E4D9] rounded-xl flex items-center justify-between active:scale-[0.98] transition-transform shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#F1EDE4] flex items-center justify-center text-[#2D2A29]">
                          <FolderIcon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-[#2D2A29]">{folder.name}</span>
                      </div>
                      <span className="text-xs text-[#8C8679]">
                        {activeNotes.filter((n) => n.folderId === folder.id).length} pages
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PAGES SECTION */}
            <div>
              <div className="flex items-center justify-between mb-2.5 px-1 text-left">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#2D2A29] text-left">
                  Pages
                </h2>
                <span className="text-[11px] font-semibold text-[#8C8679]">
                  {matchingSearchNotes.length}
                </span>
              </div>
              {matchingSearchNotes.length === 0 ? (
                <p className="text-xs text-[#8C8679] px-1 py-2">No matching pages</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <AnimatePresence mode="popLayout">
                    {matchingSearchNotes.map((note) => (
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
                          isSelected={selectedNoteId === note.id}
                          isSelectMode={isSelectMode}
                          isChecked={selectedNoteIds.includes(note.id)}
                          onClick={() => {
                            onSelectNote(note.id);
                            setSearchQuery('');
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
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-16 text-[#8C8679]">
            <p className="text-base font-semibold text-[#2D2A29] mb-1">No pages found</p>
            <p className="text-xs mb-4">Tap the + button below to create your first page.</p>
            <button
              onClick={onCreateNewPage}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D2A29] text-[#F9F7F2] text-xs font-semibold rounded-xl hover:bg-[#433F3E] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Page</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Category: Pinned (if any pinned notes) */}
            {pinnedNotes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#2D2A29]">
                    Pinned
                  </h2>
                  <span className="text-[11px] font-semibold text-[#8C8679]">
                    {pinnedNotes.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
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
                          isSelected={selectedNoteId === note.id}
                          isSelectMode={isSelectMode}
                          isChecked={selectedNoteIds.includes(note.id)}
                          onClick={() => onSelectNote(note.id)}
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
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#433F3E]">
                  Everything
                </h2>
                <span className="text-[11px] font-semibold text-[#8C8679]">
                  {unpinnedNotes.length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
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
                        isSelected={selectedNoteId === note.id}
                        isSelectMode={isSelectMode}
                        isChecked={selectedNoteIds.includes(note.id)}
                        onClick={() => onSelectNote(note.id)}
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
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation or Select Mode Bar */}
      {isSelectMode ? (
        <SelectModeBar
          selectedCount={selectedNoteIds.length}
          allUnpinnedSelected={allUnpinnedSelected}
          onCancel={onCancelSelectMode}
          onToggleSelectAllUnpinned={onToggleSelectAllUnpinned}
          onArchiveSelected={onRequestArchiveSelected}
          onDeleteSelected={onRequestDeleteSelected}
          isDesktop={false}
        />
      ) : (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#2D2A29] text-[#F9F7F2] rounded-full px-5 py-2.5 shadow-2xl flex items-center gap-8 border border-[#433F3E]">
          {/* Left: Plus Icon (Create Note) */}
          <button
            onClick={onCreateNewPage}
            className="p-2 bg-[#8C8679] hover:bg-[#a19a8d] text-white rounded-full transition-all transform active:scale-95 shadow-md"
            title="Create New Page"
            aria-label="Create New Page"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Middle: Page Icon (Everything) */}
          <button
            onClick={onClearFolderFilter}
            className={`p-2 transition-colors hover:text-white ${
              !activeFolderId ? 'text-white font-bold' : 'text-[#8C8679]'
            }`}
            title="Everything"
            aria-label="Everything"
          >
            <FileText className="w-5 h-5" />
          </button>

          {/* Right: Folder Icon */}
          <button
            onClick={onOpenFolders}
            className={`p-2 transition-colors hover:text-white ${
              activeFolderId ? 'text-white font-bold' : 'text-[#8C8679]'
            }`}
            title="Folders"
            aria-label="Folders"
          >
            <FolderIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
