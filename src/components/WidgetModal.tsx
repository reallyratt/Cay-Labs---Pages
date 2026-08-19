import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  LayoutTemplate,
  Pin,
  ExternalLink,
  Plus,
  Copy,
  Check,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { Note, Folder } from '../types';

interface WidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  folders: Folder[];
  onSelectNote: (id: string) => void;
  onCreateNewPage: () => void;
}

export const WidgetModal: React.FC<WidgetModalProps> = ({
  isOpen,
  onClose,
  notes,
  folders,
  onSelectNote,
  onCreateNewPage,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string>('auto');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Active notes
  const activeNotes = notes.filter((n) => !n.isArchived && !n.isDeleted);
  const pinnedNotes = activeNotes.filter((n) => n.isPinned);

  const displayNote: Note | undefined =
    selectedNoteId === 'auto'
      ? pinnedNotes[0] || activeNotes[0]
      : activeNotes.find((n) => n.id === selectedNoteId) || activeNotes[0];

  const noteFolder = folders.find((f) => f.id === displayNote?.folderId);

  // Clean preview text without markdown/html
  const cleanPreview = displayNote?.content
    ? displayNote.content.replace(/<[^>]*>?/gm, '').slice(0, 180)
    : 'No notes available yet. Tap "New Page" to create your first note.';

  const handleCopyManifestTag = () => {
    navigator.clipboard.writeText('pages-4x2-note-widget');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#201D1C] border border-[#E8E4D9] dark:border-[#383432] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-[#8C8679] dark:text-[#A8A29A] hover:text-[#2D2A29] dark:hover:text-[#F2EFE9] hover:bg-[#F9F7F2] dark:hover:bg-[#282524] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F9F7F2] dark:bg-[#282524] border border-[#E8E4D9] dark:border-[#383432] flex items-center justify-center shadow-xs text-[#2D2A29] dark:text-[#F2EFE9]">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2D2A29] dark:text-[#F2EFE9]">
                4x2 Mobile Home Screen Widget
              </h3>
              <p className="text-xs text-[#8C8679] dark:text-[#A8A29A]">
                PWA Widget support for Android & Windows PWABuilder packages
              </p>
            </div>
          </div>

          {/* Live 4x2 Widget Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#8C8679] dark:text-[#A8A29A]">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                Live Widget Preview (4 × 2 Grid)
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F1EDE4] dark:bg-[#332F2D] text-[#433F3E] dark:text-[#D5CEC2]">
                Adaptive Card 1.5
              </span>
            </div>

            {/* Realistic 4x2 Android Widget Card */}
            <div className="p-4 rounded-2xl bg-[#F9F7F2] dark:bg-[#191716] border-2 border-[#E8E4D9] dark:border-[#383432] shadow-md space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src="/pwa-192.png"
                    alt="Pages"
                    className="w-8 h-8 rounded-xl shrink-0 shadow-xs"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[#2D2A29] dark:text-[#F2EFE9] truncate">
                      {displayNote?.title || 'Untitled Page'}
                    </h4>
                    <div className="text-[11px] text-[#8C8679] dark:text-[#A8A29A] flex items-center gap-1.5">
                      <span>{noteFolder?.name || 'General'}</span>
                      <span>•</span>
                      <span>{displayNote?.isPinned ? 'Pinned' : 'Recent'}</span>
                    </div>
                  </div>
                </div>
                {displayNote?.isPinned && (
                  <span className="p-1 rounded-md bg-[#2D2A29]/5 dark:bg-[#F2EFE9]/10 text-[#2D2A29] dark:text-[#F2EFE9]">
                    <Pin className="w-3.5 h-3.5 fill-current" />
                  </span>
                )}
              </div>

              {/* Note Content Excerpt */}
              <p className="text-xs text-[#5C5652] dark:text-[#C5BFB5] leading-relaxed line-clamp-3 bg-white/60 dark:bg-[#201D1C]/60 p-2.5 rounded-xl border border-[#E8E4D9]/60 dark:border-[#383432]/60">
                {cleanPreview}
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (displayNote) onSelectNote(displayNote.id);
                    onClose();
                  }}
                  className="py-2 px-3 rounded-xl bg-[#2D2A29] dark:bg-[#F2EFE9] text-white dark:text-[#2D2A29] text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Page</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCreateNewPage();
                    onClose();
                  }}
                  className="py-2 px-3 rounded-xl bg-[#E8E4D9] dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#DDD8CC] dark:hover:bg-[#3E3A38] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Page</span>
                </button>
              </div>
            </div>
          </div>

          {/* Select note to display in preview */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8C8679] dark:text-[#A8A29A]">
              Choose Preview Note
            </label>
            <select
              value={selectedNoteId}
              onChange={(e) => setSelectedNoteId(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-[#F9F7F2] dark:bg-[#282524] border border-[#E8E4D9] dark:border-[#383432] text-xs font-semibold text-[#2D2A29] dark:text-[#F2EFE9] focus:outline-none focus:ring-2 focus:ring-[#8C8679] cursor-pointer"
            >
              <option value="auto">Auto (Latest Pinned or Recent Note)</option>
              {activeNotes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title ? n.title.slice(0, 35) : 'Untitled Note'}
                </option>
              ))}
            </select>
          </div>

          {/* PWABuilder Integration Specs */}
          <div className="p-4 rounded-2xl bg-[#F9F7F2] dark:bg-[#282524] border border-[#E8E4D9] dark:border-[#383432] space-y-2.5 text-xs text-[#5C5652] dark:text-[#C5BFB5]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#2D2A29] dark:text-[#F2EFE9] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                PWABuilder Ready
              </span>
              <button
                type="button"
                onClick={handleCopyManifestTag}
                className="text-[11px] font-semibold text-[#8C8679] hover:text-[#2D2A29] dark:hover:text-[#F2EFE9] flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Widget Tag'}</span>
              </button>
            </div>
            <p className="text-[11px] leading-relaxed">
              When packaging with <strong>PWABuilder</strong> for Google Play Store (TWA/APK) or Windows Store, the widget definition is automatically detected from <code className="px-1.5 py-0.5 bg-[#E8E4D9] dark:bg-[#332F2D] rounded text-[#2D2A29] dark:text-[#F2EFE9]">manifest.json</code> and rendered via <code className="px-1.5 py-0.5 bg-[#E8E4D9] dark:bg-[#332F2D] rounded text-[#2D2A29] dark:text-[#F2EFE9]">/widgets/note-widget.json</code>.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
