import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Archive, Trash2, Settings, Search, X, WifiOff } from 'lucide-react';
import { AppSection } from '../types';

interface HeaderProps {
  onOpenSection: (section: AppSection) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isOffline?: boolean;
  activeFolderId?: string | null;
  activeFolderName?: string;
  onClearFolderFilter?: () => void;
  onGoToDefaultPages?: () => void;
  isMobile?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSection,
  searchQuery,
  setSearchQuery,
  isOffline = false,
  onClearFolderFilter,
  onGoToDefaultPages,
  isMobile = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#F9F7F2]/95 backdrop-blur-md border-b border-[#E8E4D9] px-4 h-[57px] flex items-center justify-between transition-colors">
      {/* Top Left: Main text "Pages" */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (onGoToDefaultPages) {
              onGoToDefaultPages();
            } else if (onClearFolderFilter) {
              onClearFolderFilter();
            }
          }}
          className="text-left group focus:outline-none cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#2D2A29] group-hover:text-[#8C8679] transition-colors">
              Pages
            </h1>
            {isOffline && (
              <span className="flex items-center gap-1 text-[11px] font-medium bg-[#F1EDE4] text-[#8C8679] px-2 py-0.5 rounded-full border border-[#E8E4D9]" title="Working offline">
                <WifiOff className="w-3 h-3" />
                <span className="hidden sm:inline">Offline</span>
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Search Input toggle with smooth sliding animation */}
        <AnimatePresence mode="wait">
          {isSearchOpen ? (
            <motion.div
              key="search-input"
              initial={{ width: 36, opacity: 0 }}
              animate={{ width: isMobile ? 180 : 250, opacity: 1 }}
              exit={{ width: 36, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="relative flex items-center overflow-hidden"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                autoFocus
                className="w-full text-sm bg-white text-[#2D2A29] placeholder-[#8C8679] pl-8 pr-7 py-1.5 rounded-lg border border-[#E8E4D9] focus:outline-none focus:ring-2 focus:ring-[#8C8679]/30"
              />
              <Search className="w-4 h-4 text-[#8C8679] absolute left-2.5 shrink-0 pointer-events-none" />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-2 text-[#8C8679] hover:text-[#2D2A29] p-0.5 rounded cursor-pointer"
                title="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="search-button"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-[#433F3E] hover:bg-[#F1EDE4] rounded-lg transition-colors focus:outline-none cursor-pointer"
              title="Search notes"
            >
              <Search className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* 3 Bars Icon (Dropdown Trigger) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`p-2 text-[#2D2A29] hover:bg-[#F1EDE4] rounded-lg transition-colors focus:outline-none cursor-pointer ${
              isMenuOpen ? 'bg-[#F1EDE4]' : ''
            }`}
            aria-label="Menu"
            title="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Dropdown Menu with smooth opening and closing animations */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                key="dropdown-menu"
                initial={{ opacity: 0, scale: 0.92, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -8 }}
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                className="absolute right-0 mt-2 w-52 bg-white border border-[#E8E4D9] rounded-xl shadow-xl py-1.5 z-50 overflow-hidden"
              >
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenSection('archive');
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#2D2A29] hover:bg-[#F9F7F2] flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Archive className="w-4 h-4 text-[#8C8679]" />
                  <span>Archive</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenSection('dumpster');
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#2D2A29] hover:bg-[#F9F7F2] flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-[#8C8679]" />
                  <span>Dumpster</span>
                </button>

                <div className="my-1 border-t border-[#E8E4D9]" />

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenSection('settings');
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#2D2A29] hover:bg-[#F9F7F2] flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#8C8679]" />
                  <span>Settings</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
