import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Folder as FolderIcon, FileText } from 'lucide-react';
import { Folder } from '../types';

interface FolderListProps {
  folders: Folder[];
  activeFolderId: string | null;
  noFolderCount: number;
  getFolderNoteCount: (folderId: string) => number;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (folder: Folder) => void;
  onUpdateFolder: (folder: Folder) => void;
  onDeleteFolders: (folderIds: string[]) => void;
  onMoveNoteToFolder: (noteId: string, folderId: string | null) => void;
  selectedFolderIds: string[];
  onToggleSelectFolder: (id: string) => void;
  onCancelFolderSelectMode: () => void;
  onStartEditingFolder: (id: string) => void;
  isCreating?: boolean;
  setIsCreating?: (creating: boolean) => void;
  editingFolderId?: string | null;
  setEditingFolderId?: (id: string | null) => void;
}

export const FolderList: React.FC<FolderListProps> = ({
  folders,
  activeFolderId,
  noFolderCount,
  getFolderNoteCount,
  onSelectFolder,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolders,
  onMoveNoteToFolder,
  selectedFolderIds,
  onToggleSelectFolder,
  onCancelFolderSelectMode,
  onStartEditingFolder,
  isCreating: externalIsCreating,
  setIsCreating: externalSetIsCreating,
  editingFolderId: externalEditingFolderId,
  setEditingFolderId: externalSetEditingFolderId,
}) => {
  // Folder creation state
  const [internalIsCreating, setInternalIsCreating] = useState(false);
  const isCreating = externalIsCreating ?? internalIsCreating;
  const setIsCreating = externalSetIsCreating ?? setInternalIsCreating;

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Folder edit inline state
  const [internalEditingFolderId, setInternalEditingFolderId] = useState<string | null>(null);
  const editingFolderId = externalEditingFolderId ?? internalEditingFolderId;
  const setEditingFolderId = externalSetEditingFolderId ?? setInternalEditingFolderId;

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Drag over target tracking
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | 'NO_FOLDER'>(null);

  const isFolderSelectMode = selectedFolderIds.length > 0;

  // Alphabetical sorting for custom folders (case-insensitive)
  const sortedFolders = [...folders].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  // Sync edit title & description whenever editingFolderId changes
  useEffect(() => {
    if (editingFolderId) {
      const folderToEdit = folders.find((f) => f.id === editingFolderId);
      if (folderToEdit) {
        setEditTitle(folderToEdit.name);
        setEditDescription(folderToEdit.description || '');
      }
    }
  }, [editingFolderId, folders]);

  // Handle Create Folder Submit
  const handleSaveNewFolder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTitle.trim()) return;
    const folder: Folder = {
      id: `f-${Date.now()}`,
      name: newTitle.trim(),
      description: newDescription.trim() || undefined,
    };
    onCreateFolder(folder);
    setNewTitle('');
    setNewDescription('');
    setIsCreating(false);
  };

  // Handle Edit Folder Submit
  const handleSaveEditFolder = (folder: Folder, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editTitle.trim()) return;
    const updated: Folder = {
      ...folder,
      name: editTitle.trim(),
      description: editDescription.trim() || undefined,
    };
    onUpdateFolder(updated);
    setEditingFolderId(null);
    onCancelFolderSelectMode();
  };

  // Drag and drop handlers on folder items
  const handleFolderDragOver = (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(targetId === null ? 'NO_FOLDER' : targetId);
  };

  const handleFolderDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleFolderDrop = (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    setDragOverFolderId(null);
    const noteId = e.dataTransfer.getData('text/plain');
    if (noteId) {
      onMoveNoteToFolder(noteId, targetId);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 select-none">
      {/* Top Row: Uncategorized item */}
      <motion.div
        layout
        onDragOver={(e) => handleFolderDragOver(e, null)}
        onDragLeave={handleFolderDragLeave}
        onDrop={(e) => handleFolderDrop(e, null)}
        onClick={() => onSelectFolder(null)}
        className={`w-full px-4 py-3 rounded-xl flex items-center justify-between transition-colors border cursor-pointer shadow-xs ${
          dragOverFolderId === 'NO_FOLDER'
            ? 'bg-[#E8E4D9] dark:bg-[#383432] border-[#2D2A29] dark:border-[#F2EFE9] ring-2 ring-[#2D2A29] dark:ring-[#F2EFE9]'
            : activeFolderId === null
            ? 'bg-white dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
            : 'bg-white dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#332F2D]'
        }`}
      >
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-semibold truncate">Uncategorized</span>
            <span className="text-[11px] font-semibold shrink-0 ml-2 text-[#8C8679] dark:text-[#A8A29A]">
              {noFolderCount}
            </span>
          </div>
        </div>
        <div className="w-5 shrink-0" />
      </motion.div>

      {/* Inline New Folder Creation Card */}
      <AnimatePresence mode="popLayout">
        {isCreating && (
          <motion.form
            key="new-folder-form"
            layout
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            onSubmit={handleSaveNewFolder}
            className="bg-white dark:bg-[#282524] border border-[#2D2A29] dark:border-[#8C8679] rounded-xl p-3 shadow-md space-y-2 relative my-2 overflow-hidden"
          >
            {/* Top Left: X Button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="p-1 text-[#8C8679] dark:text-[#A8A29A] hover:text-[#2D2A29] dark:hover:text-[#F2EFE9] hover:bg-[#F1EDE4] dark:hover:bg-[#332F2D] rounded-lg transition-colors cursor-pointer"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Inputs */}
            <div className="space-y-1.5">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Name"
                autoFocus
                className="w-full text-xs font-bold text-[#2D2A29] dark:text-[#F2EFE9] bg-[#F9F7F2] dark:bg-[#1C1A19] border border-[#E8E4D9] dark:border-[#383432] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2D2A29] dark:focus:ring-[#F2EFE9]"
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description"
                rows={newDescription ? 2 : 1}
                className="w-full text-xs text-[#2D2A29] dark:text-[#F2EFE9] bg-[#F9F7F2] dark:bg-[#1C1A19] border border-[#E8E4D9] dark:border-[#383432] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2D2A29] dark:focus:ring-[#F2EFE9] resize-none"
              />
            </div>

            {/* Bottom Right: Checkmark Button without circle background */}
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="p-1 text-[#2D2A29] dark:text-[#F2EFE9] hover:text-[#433F3E] dark:hover:text-[#E6E0D4] disabled:opacity-30 transition-colors flex items-center justify-center cursor-pointer"
                title="Save Folder"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Vertical Custom Folder List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sortedFolders.map((folder) => {
            const isSelected = activeFolderId === folder.id;
            const isChecked = selectedFolderIds.includes(folder.id);
            const isEditingThis = editingFolderId === folder.id;
            const isDragOverThis = dragOverFolderId === folder.id;
            const noteCount = getFolderNoteCount(folder.id);

            if (isEditingThis) {
              /* Inline Editing Form Card */
              return (
                <motion.form
                  key={`edit-${folder.id}`}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  onSubmit={(e) => handleSaveEditFolder(folder, e)}
                  className="bg-white dark:bg-[#282524] border-2 border-[#2D2A29] dark:border-[#8C8679] rounded-xl p-3 shadow-md space-y-2 relative overflow-hidden my-2"
                >
                  {/* Top Left: X Button */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setEditingFolderId(null)}
                      className="p-1 text-[#8C8679] dark:text-[#A8A29A] hover:text-[#2D2A29] dark:hover:text-[#F2EFE9] hover:bg-[#F1EDE4] dark:hover:bg-[#332F2D] rounded-lg transition-colors cursor-pointer"
                      title="Cancel edit"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Form Inputs */}
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Name"
                      autoFocus
                      className="w-full text-xs font-bold text-[#2D2A29] dark:text-[#F2EFE9] bg-[#F9F7F2] dark:bg-[#1C1A19] border border-[#E8E4D9] dark:border-[#383432] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2D2A29] dark:focus:ring-[#F2EFE9]"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description"
                      rows={editDescription ? 2 : 1}
                      className="w-full text-xs text-[#2D2A29] dark:text-[#F2EFE9] bg-[#F9F7F2] dark:bg-[#1C1A19] border border-[#E8E4D9] dark:border-[#383432] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2D2A29] dark:focus:ring-[#F2EFE9] resize-none"
                    />
                  </div>

                  {/* Bottom Right: Checkmark Button without circle background */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={!editTitle.trim()}
                      className="p-1 text-[#2D2A29] dark:text-[#F2EFE9] hover:text-[#433F3E] dark:hover:text-[#E6E0D4] disabled:opacity-30 transition-colors flex items-center justify-center cursor-pointer"
                      title="Save Changes"
                    >
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </div>
                </motion.form>
              );
            }

            /* Standard Folder Card */
            return (
              <motion.div
                key={folder.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                onDragLeave={handleFolderDragLeave}
                onDrop={(e) => handleFolderDrop(e, folder.id)}
                onClick={() => {
                  if (isFolderSelectMode) {
                    onToggleSelectFolder(folder.id);
                  } else {
                    onSelectFolder(folder.id);
                  }
                }}
                className={`group relative w-full px-4 py-3 rounded-xl flex items-start justify-between transition-colors border cursor-pointer shadow-xs ${
                  isDragOverThis
                    ? 'bg-[#E8E4D9] dark:bg-[#383432] border-[#2D2A29] dark:border-[#F2EFE9] ring-2 ring-[#2D2A29] dark:ring-[#F2EFE9]'
                    : isChecked
                    ? 'bg-[#F1EDE4] dark:bg-[#383432] border-[#2D2A29] dark:border-[#F2EFE9] ring-1 ring-[#2D2A29] dark:ring-[#F2EFE9]'
                    : isSelected && !isFolderSelectMode
                    ? 'bg-white dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                    : 'bg-white dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#332F2D]'
                }`}
              >
                {/* Folder Details */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-bold truncate">{folder.name}</span>
                    <span className="text-[11px] font-semibold shrink-0 ml-2 text-[#8C8679] dark:text-[#A8A29A]">
                      {noteCount}
                    </span>
                  </div>
                  {folder.description && (
                    <p className="text-xs mt-1 line-clamp-2 leading-snug font-normal text-[#8C8679] dark:text-[#A8A29A]">
                      {folder.description}
                    </p>
                  )}
                </div>

                {/* Selection Circle/Dot on hover or when in select mode */}
                <div className="shrink-0 flex items-center pt-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isCreating) {
                        onToggleSelectFolder(folder.id);
                      }
                    }}
                    disabled={isCreating}
                    className={`w-5 h-5 rounded-full border transition-all duration-150 flex items-center justify-center ${
                      isChecked
                        ? 'bg-[#2D2A29] dark:bg-[#F2EFE9] border-[#2D2A29] dark:border-[#F2EFE9] text-white dark:text-[#191716] scale-105'
                        : isFolderSelectMode
                        ? 'border-[#8C8679] bg-white dark:bg-[#282524] text-transparent hover:border-[#2D2A29] dark:hover:border-[#F2EFE9]'
                        : isCreating
                        ? 'opacity-0 pointer-events-none'
                        : 'border-[#8C8679] bg-white dark:bg-[#282524] text-transparent opacity-0 group-hover:opacity-100 hover:border-[#2D2A29] dark:hover:border-[#F2EFE9]'
                    }`}
                    title={isChecked ? 'Deselect folder' : 'Select folder'}
                  >
                    <AnimatePresence mode="wait">
                      {isChecked && (
                        <motion.div
                          key="checked-folder-icon"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

