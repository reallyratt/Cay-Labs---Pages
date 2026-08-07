import React, { useState } from 'react';
import { ArrowLeft, Folder as FolderIcon } from 'lucide-react';
import { Folder, Note } from '../types';
import { FolderList } from './FolderList';
import { FolderSelectModeBar } from './FolderSelectModeBar';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  notes: Note[];
  activeFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (folder: Folder) => void;
  onUpdateFolder: (folder: Folder) => void;
  onDeleteFolders: (folderIds: string[]) => void;
  onMoveNoteToFolder: (noteId: string, folderId: string | null) => void;
}

export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  folders,
  notes,
  activeFolderId,
  onSelectFolder,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolders,
  onMoveNoteToFolder,
}) => {
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeNotes = notes.filter((n) => !n.isArchived && !n.isDeleted);
  const noFolderCount = activeNotes.filter((n) => !n.folderId).length;
  const getFolderNoteCount = (folderId: string) =>
    activeNotes.filter((n) => n.folderId === folderId).length;

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

  return (
    <div className="fixed inset-0 z-50 bg-[#F9F7F2] dark:bg-[#191716] text-[#2D2A29] dark:text-[#F2EFE9] flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Top Page Bar */}
      <div className="sticky top-0 z-40 bg-[#F9F7F2]/95 dark:bg-[#191716]/95 backdrop-blur-md border-b border-[#E8E4D9] dark:border-[#383432] px-4 py-3 flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-2 text-[#2D2A29] dark:text-[#F2EFE9] hover:bg-[#F1EDE4] dark:hover:bg-[#282524] rounded-xl transition-colors flex items-center gap-2 font-semibold text-xs border border-[#E8E4D9] dark:border-[#383432] bg-white dark:bg-[#282524] shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Pages</span>
        </button>
      </div>

      {/* Main Folder Directory Content */}
      <div className="flex-1 max-w-xl w-full mx-auto p-4 flex flex-col overflow-hidden relative">
        <FolderList
          folders={folders}
          activeFolderId={activeFolderId}
          noFolderCount={noFolderCount}
          getFolderNoteCount={getFolderNoteCount}
          onSelectFolder={(id) => {
            onSelectFolder(id);
            onClose();
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
        />
      </div>

      {/* Floating Bar in Select Mode */}
      {selectedFolderIds.length > 0 && (
        <FolderSelectModeBar
          selectedCount={selectedFolderIds.length}
          onCancel={handleCancelFolderSelectMode}
          onEdit={() => {
            if (selectedFolderIds.length === 1) {
              setEditingFolderId(selectedFolderIds[0]);
            }
          }}
          onDeleteSelected={handleDeleteSelectedFolders}
          isDesktop={false}
        />
      )}
    </div>
  );
};
