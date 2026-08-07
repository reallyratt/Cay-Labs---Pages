import React from 'react';
import { motion } from 'motion/react';
import { X, Pencil, Trash2 } from 'lucide-react';

interface FolderSelectModeBarProps {
  selectedCount: number;
  onCancel: () => void;
  onEdit: () => void;
  onDeleteSelected: () => void;
  isDesktop?: boolean;
}

export const FolderSelectModeBar: React.FC<FolderSelectModeBarProps> = ({
  selectedCount,
  onCancel,
  onEdit,
  onDeleteSelected,
  isDesktop = false,
}) => {
  const canEdit = selectedCount === 1;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0, scale: 0.88 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 20, opacity: 0, scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className={`flex items-center gap-2.5 z-50 select-none ${
        isDesktop
          ? 'absolute bottom-4 left-1/2 -translate-x-1/2'
          : 'fixed bottom-5 left-1/2 -translate-x-1/2'
      }`}
    >
      {/* 1. Left Circle Button: Edit (Pencil) */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 450, damping: 25, delay: 0.02 }}
        onClick={onEdit}
        disabled={!canEdit}
        className={`p-3 rounded-full transition-colors duration-200 flex items-center justify-center shadow-xl border ${
          canEdit
            ? 'bg-[#2D2A29] hover:bg-[#433F3E] text-[#F9F7F2] border-[#433F3E] active:scale-95 shadow-black/10 cursor-pointer'
            : 'bg-[#E8E4D9] dark:bg-[#282524] text-[#8C8679] dark:text-[#8C8679] border-[#E8E4D9] dark:border-[#383432] cursor-not-allowed opacity-60'
        }`}
        title={canEdit ? 'Edit selected folder' : 'Can only edit 1 folder at a time'}
        aria-label="Edit selected folder"
      >
        <Pencil className="w-4 h-4" />
      </motion.button>

      {/* 2. Middle Group Pill: Cancel [X] | Selected Count Number */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="bg-[#2D2A29] text-[#F9F7F2] rounded-full px-2.5 py-1.5 shadow-2xl flex items-center gap-2 border border-[#433F3E]"
      >
        <button
          onClick={onCancel}
          className="p-1.5 hover:bg-[#433F3E] text-[#8C8679] hover:text-[#F9F7F2] rounded-full transition-colors duration-150 flex items-center justify-center active:scale-90"
          title="Cancel select mode"
          aria-label="Cancel select mode"
        >
          <X className="w-4 h-4" />
        </button>

        <motion.span
          key={selectedCount}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className="text-[#F9F7F2] text-xs font-bold px-1 min-w-[1.25rem] text-center"
        >
          {selectedCount}
        </motion.span>
      </motion.div>

      {/* 3. Right Circle Button: Delete (Trash2) */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 450, damping: 25, delay: 0.02 }}
        onClick={onDeleteSelected}
        disabled={selectedCount === 0}
        className={`p-3 rounded-full transition-colors duration-200 flex items-center justify-center shadow-xl border ${
          selectedCount > 0
            ? 'bg-[#D90429] hover:bg-[#B00020] text-white border-[#D90429] active:scale-95 shadow-red-900/20 cursor-pointer'
            : 'bg-[#E8E4D9] dark:bg-[#282524] text-[#8C8679] dark:text-[#8C8679] border-[#E8E4D9] dark:border-[#383432] cursor-not-allowed opacity-60'
        }`}
        title="Delete selected folders"
        aria-label="Delete selected folders"
      >
        <Trash2 className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
};

