import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Trash2, Archive } from 'lucide-react';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
  isSelected?: boolean; // Currently active note in editor
  isSelectMode?: boolean; // Multi-select mode active
  isChecked?: boolean; // Multi-select checked state
  onClick: () => void;
  onToggleCheck?: (e: React.MouseEvent | React.TouchEvent) => void;
  onLongPress?: () => void;
  onArchive?: (e?: React.MouseEvent) => void;
  onDelete?: (e?: React.MouseEvent) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isSelected = false,
  isSelectMode = false,
  isChecked = false,
  onClick,
  onToggleCheck,
  onLongPress,
  onArchive,
  onDelete,
}) => {
  // Swipe and long press gesture refs and states
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [startX, setStartX] = useState<number | null>(null);
  const [startY, setStartY] = useState<number | null>(null);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Clear press timer
  const cancelTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Touch Start (Mobile & Touch Devices)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSelectMode) return;
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setStartY(touch.clientY);
    setIsSwiping(false);
    setOffsetX(0);

    // Long press detection (500ms)
    cancelTimer();
    timerRef.current = setTimeout(() => {
      if (onLongPress) {
        onLongPress();
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(40);
        }
      }
    }, 500);
  };

  // Touch Move (Swipe handling)
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === null || startY === null || isSelectMode) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - startX;
    const diffY = touch.clientY - startY;

    // Cancel long press if moved significantly
    if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
      cancelTimer();
    }

    // Only swipe if horizontal drag is dominant
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 15) {
      setIsSwiping(true);
      setOffsetX(diffX);
    }
  };

  // Touch End (Swipe finish)
  const handleTouchEnd = () => {
    cancelTimer();
    if (isSwiping && !isSelectMode) {
      if (offsetX > 75) {
        // Swiped Right -> Delete to dumpster
        if (onDelete) onDelete();
      } else if (offsetX < -75) {
        // Swiped Left -> Move to archive
        if (onArchive) onArchive();
      }
    }
    setStartX(null);
    setStartY(null);
    setOffsetX(0);
    setIsSwiping(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isSelectMode) {
      e.stopPropagation();
      if (onToggleCheck) onToggleCheck(e);
      return;
    }
    onClick();
  };

  // Drag and drop handlers for desktop
  const handleDragStart = (e: React.DragEvent) => {
    if (isSelectMode) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', note.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative overflow-hidden rounded-xl h-full flex flex-col">
      {/* Swipe Background Action Indicators for Mobile */}
      {isSwiping && (
        <div className="absolute inset-0 flex items-center justify-between px-4 rounded-xl text-xs font-bold text-white transition-opacity">
          {/* Right swipe indicator (Delete) */}
          <div
            className={`flex items-center gap-1.5 transition-opacity ${
              offsetX > 0 ? 'opacity-100 text-[#D90429]' : 'opacity-0'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </div>

          {/* Left swipe indicator (Archive) */}
          <div
            className={`flex items-center gap-1.5 transition-opacity ${
              offsetX < 0 ? 'opacity-100 text-[#8C8679]' : 'opacity-0'
            }`}
          >
            <span>Archive</span>
            <Archive className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Main Card Surface */}
      <div
        draggable={!isSelectMode}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: isSwiping ? `translateX(${offsetX}px)` : 'none',
          transition: isSwiping ? 'none' : 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`group relative cursor-pointer rounded-xl px-4 py-3 border text-left flex items-start justify-between gap-3 w-full h-full min-h-[88px] transition-all duration-200 ease-out select-none ${
          isDragging
            ? 'opacity-30 scale-90 -translate-y-1 border-dashed border-[#8C8679] shadow-lg ring-2 ring-[#8C8679]/30'
            : isSelectMode && isChecked
            ? 'bg-[#F1EDE4] border-[#2D2A29] ring-1 ring-[#2D2A29]'
            : isSelected && !isSelectMode
            ? 'bg-white border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-sm'
            : 'bg-white border-[#E8E4D9] hover:border-[#8C8679]/40 hover:shadow-sm'
        }`}
      >
        {/* Content Preview Container */}
        <div className="min-w-0 flex-1 space-y-1">
          {/* Note Title */}
          <h3 className="text-sm font-bold text-[#2D2A29] truncate group-hover:text-[#8C8679] transition-colors">
            {note.title.trim() || 'Untitled Page'}
          </h3>

          {/* Text preview up to 2 lines */}
          <p className="text-xs text-[#8C8679] line-clamp-2 font-normal leading-snug">
            {note.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || 'No additional content'}
          </p>
        </div>

        {/* Right side Single Selection Circle */}
        <div className="shrink-0 flex items-center pt-0.5">
          {isSelectMode ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleCheck) onToggleCheck(e);
              }}
              className={`w-5 h-5 rounded-full border transition-all duration-150 flex items-center justify-center ${
                isChecked
                  ? 'bg-[#2D2A29] border-[#2D2A29] text-white scale-105'
                  : 'border-[#8C8679] bg-white text-transparent hover:border-[#2D2A29]'
              }`}
              title={isChecked ? 'Deselect page' : 'Select page'}
            >
              <AnimatePresence mode="wait">
                {isChecked && (
                  <motion.div
                    key="checked-icon"
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
          ) : onLongPress ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLongPress();
              }}
              className="w-5 h-5 rounded-full border border-[#8C8679] bg-white text-transparent opacity-0 group-hover:opacity-100 hover:border-[#2D2A29] transition-all duration-150 flex items-center justify-center"
              title="Select page"
              aria-label="Select page"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
