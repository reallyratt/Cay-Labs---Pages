import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="confirmation-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 bg-[#2D2A29]/40 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          onClick={onCancel}
        >
          <motion.div
            key="confirmation-card"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F9F7F2] border border-[#E8E4D9] rounded-2xl w-full max-w-sm p-6 shadow-2xl relative text-[#2D2A29] space-y-4"
          >
            <h3 className="text-base font-bold tracking-tight text-[#2D2A29]">{title}</h3>
            <p className="text-xs text-[#8C8679] leading-relaxed">{description}</p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E4D9]">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-semibold text-[#8C8679] hover:text-[#2D2A29] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors shadow-sm text-white cursor-pointer ${
                  confirmVariant === 'danger'
                    ? 'bg-[#D90429] hover:bg-[#B00020]'
                    : 'bg-[#2D2A29] hover:bg-[#433F3E]'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

