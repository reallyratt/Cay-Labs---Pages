import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Trash2, X, Check, CheckCheck, Archive } from 'lucide-react';
import { Note } from '../types';
import { formatTimeAgo } from '../utils/storage';
import { ConfirmationModal } from './ConfirmationModal';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  archivedNotes: Note[];
  onUnarchiveNote: (id: string) => void;
  onDeleteNoteToDumpster: (id: string) => void;
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  onClose,
  archivedNotes,
  onUnarchiveNote,
  onDeleteNoteToDumpster,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isConfirmRestoreOpen, setIsConfirmRestoreOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const allSelected =
    archivedNotes.length > 0 && selectedIds.length === archivedNotes.length;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(archivedNotes.map((n) => n.id));
    }
  };

  const count = selectedIds.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
        className="fixed inset-0 z-50 bg-[#F9F7F2] text-[#2D2A29] flex flex-col overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-40 bg-[#F9F7F2]/95 backdrop-blur-md border-b border-[#E8E4D9] px-6 h-[57px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-[#2D2A29]">Archive</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#8C8679]">
              {archivedNotes.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#8C8679] hover:text-[#2D2A29] hover:bg-[#E8E4D9]/60 rounded-lg transition-colors cursor-pointer"
              title="Close Archive"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 space-y-4 pb-28">
          {archivedNotes.length === 0 ? (
            <div className="text-center py-20 text-[#8C8679]">
              <Archive className="w-12 h-12 mx-auto mb-3 text-[#8C8679]" />
              <p className="text-base font-semibold text-[#2D2A29]">Archive is empty</p>
              <p className="text-xs mt-1">Pages you archive will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {archivedNotes.map((note) => {
                const isSelected = selectedIds.includes(note.id);
                return (
                  <div
                    key={note.id}
                    onClick={() => toggleSelect(note.id)}
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

        {/* Floating Multi-Select Bar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.88 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-50 select-none"
            >
              {/* Left Action: Unarchive */}
              <button
                type="button"
                onClick={() => setIsConfirmRestoreOpen(true)}
                className="p-3 rounded-full bg-[#2D2A29] hover:bg-[#433F3E] text-[#F9F7F2] border border-[#433F3E] shadow-xl active:scale-95 transition-colors cursor-pointer"
                title="Unarchive selected pages"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Middle Pill */}
              <div className="bg-[#2D2A29] text-[#F9F7F2] rounded-full px-2.5 py-1.5 shadow-2xl flex items-center gap-2 border border-[#433F3E]">
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="p-1.5 hover:bg-[#433F3E] text-[#8C8679] hover:text-[#F9F7F2] rounded-full transition-colors active:scale-90 cursor-pointer"
                  title="Deselect all"
                >
                  <X className="w-4 h-4" />
                </button>

                <span className="text-[#F9F7F2] text-xs font-bold px-1 min-w-[1.25rem] text-center">
                  {selectedIds.length}
                </span>

                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className={`p-1.5 transition-colors active:scale-90 cursor-pointer ${
                    allSelected ? 'text-white font-bold' : 'text-[#8C8679] hover:text-white'
                  }`}
                  title={allSelected ? 'Deselect all' : 'Select all'}
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              </div>

              {/* Right Action: Delete to Dumpster */}
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="p-3 rounded-full bg-[#2D2A29] hover:bg-[#D90429] text-[#F9F7F2] border border-[#433F3E] shadow-xl active:scale-95 transition-colors cursor-pointer"
                title="Move selected to dumpster"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Restore Confirmation Modal */}
        <ConfirmationModal
          isOpen={isConfirmRestoreOpen}
          title={`Restore ${count} ${count === 1 ? 'item' : 'items'}?`}
          description={`${count === 1 ? 'Selected item' : 'Selected items'} will be moved to Uncategorized Pages.`}
          confirmLabel="Restore"
          confirmVariant="primary"
          onConfirm={() => {
            selectedIds.forEach((id) => onUnarchiveNote(id));
            setSelectedIds([]);
            setIsConfirmRestoreOpen(false);
          }}
          onCancel={() => setIsConfirmRestoreOpen(false)}
        />

        {/* Delete to Dumpster Confirmation Modal */}
        <ConfirmationModal
          isOpen={isConfirmDeleteOpen}
          title={`Delete ${count} ${count === 1 ? 'item' : 'items'}?`}
          description={`${count === 1 ? 'Selected item' : 'Selected items'} will be moved to dumpster.`}
          confirmLabel="Delete"
          confirmVariant="danger"
          onConfirm={() => {
            selectedIds.forEach((id) => onDeleteNoteToDumpster(id));
            setSelectedIds([]);
            setIsConfirmDeleteOpen(false);
          }}
          onCancel={() => setIsConfirmDeleteOpen(false)}
        />
      </motion.div>
    </AnimatePresence>
  );
};
