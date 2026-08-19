import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Smartphone,
  Monitor,
  SmartphoneNfc,
  Download,
  Upload,
  X,
  Palette,
  Database,
  Info,
  Sun,
  Moon,
  Paintbrush,
  Type,
  Check,
  RefreshCw,
  LogOut,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ViewMode, PWAState, Note } from '../types';
import { exportNotesToZip, importNotesFromFile } from '../utils/backupEngine';
import {
  AppUser,
  getCurrentUser,
  setActiveUser,
  syncNotesToCloud,
} from '../utils/cloudAccountEngine';
import { GoogleAuthModal } from './GoogleAuthModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  screenMode: 'light' | 'dark' | 'system';
  setScreenMode: (mode: 'light' | 'dark' | 'system') => void;
  selectedFont: 'geist' | 'monospace' | 'system';
  setSelectedFont: (font: 'geist' | 'monospace' | 'system') => void;
  fontScope: 'all' | 'editor';
  setFontScope: (scope: 'all' | 'editor') => void;
  pwaState: PWAState;
  onTriggerInstall: () => void;
  notes: Note[];
  onImportNotes: (imported: Note[]) => void;
}

type CategoryTab = 'looks' | 'data' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  viewMode,
  setViewMode,
  screenMode,
  setScreenMode,
  selectedFont,
  setSelectedFont,
  fontScope,
  setFontScope,
  pwaState,
  onTriggerInstall,
  notes,
  onImportNotes,
}) => {
  const [activeTab, setActiveTab] = useState<CategoryTab>('looks');

  // User & Sync State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(getCurrentUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState<string | null>(null);

  // Backup Export Option & Import Status State
  const [isExportExpanded, setIsExportExpanded] = useState(false);
  const [exportFormatCoded, setExportFormatCoded] = useState(false);
  const [importStatus, setImportStatus] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    setSyncStatusText(null);
    try {
      const res = await syncNotesToCloud(notes, currentUser);
      if (res.success) {
        setSyncStatusText('All notes synced to cloud!');
      } else {
        setSyncStatusText('Saved locally.');
      }
      setCurrentUser(getCurrentUser());
      setTimeout(() => setSyncStatusText(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportClick = async () => {
    await exportNotesToZip(notes, exportFormatCoded);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus(null);
    try {
      const { mergedNotes, importedCount } = await importNotesFromFile(file, notes);
      if (importedCount > 0 || mergedNotes.length > notes.length) {
        const added = importedCount || (mergedNotes.length - notes.length);
        onImportNotes(mergedNotes);
        setImportStatus({
          text: `Import successful! ${added} page${added === 1 ? '' : 's'} added.`,
          isError: false,
        });
      } else {
        setImportStatus({
          text: 'Import completed: All pages in file are already up to date.',
          isError: false,
        });
      }
      e.target.value = '';
    } catch (err) {
      console.error('Import failed:', err);
      setImportStatus({
        text: 'Import failed: Invalid file format or corrupted backup.',
        isError: true,
      });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="settings-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
        className="fixed inset-0 z-50 bg-[#2D2A29]/40 backdrop-blur-sm flex items-center justify-center p-4 select-none"
        onClick={onClose}
      >
        <motion.div
          key="settings-popup-card"
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#F9F7F2] dark:bg-[#201D1C] border border-[#E8E4D9] dark:border-[#383432] rounded-2xl w-full max-w-2xl h-[520px] max-h-[90vh] shadow-2xl relative text-[#2D2A29] dark:text-[#F2EFE9] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4D9] dark:border-[#383432] shrink-0 bg-[#F9F7F2] dark:bg-[#201D1C]">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#8C8679] dark:text-[#A8A29A]" />
              <h2 className="text-lg font-bold tracking-tight text-[#2D2A29] dark:text-[#F2EFE9]">Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8C8679] dark:text-[#A8A29A] hover:text-[#2D2A29] dark:hover:text-[#F2EFE9] hover:bg-[#E8E4D9]/60 dark:hover:bg-[#383432]/60 rounded-lg transition-colors cursor-pointer"
              title="Close Settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Split View Body */}
          <div className="flex flex-1 min-h-0">
            {/* Left Category Navigation Sidebar */}
            <div className="w-44 bg-[#F1EDE4] dark:bg-[#191716] border-r border-[#E8E4D9] dark:border-[#383432] p-3 flex flex-col gap-1.5 shrink-0 select-none">
              <button
                onClick={() => setActiveTab('looks')}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'looks'
                    ? 'bg-white dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                    : 'text-[#433F3E] dark:text-[#A8A29A] hover:bg-[#E8E4D9]/70 dark:hover:bg-[#282524]/70 border border-transparent font-medium'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Looks</span>
              </button>

              <button
                onClick={() => setActiveTab('data')}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'data'
                    ? 'bg-white dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                    : 'text-[#433F3E] dark:text-[#A8A29A] hover:bg-[#E8E4D9]/70 dark:hover:bg-[#282524]/70 border border-transparent font-medium'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Data</span>
              </button>

              <button
                onClick={() => setActiveTab('about')}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'about'
                    ? 'bg-white dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                    : 'text-[#433F3E] dark:text-[#A8A29A] hover:bg-[#E8E4D9]/70 dark:hover:bg-[#282524]/70 border border-transparent font-medium'
                }`}
              >
                <Info className="w-4 h-4" />
                <span>About</span>
              </button>
            </div>

            {/* Right Panel Content */}
            <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-[#201D1C] space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`settings-modal-tab-${activeTab}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: 'easeInOut' }}
                >
                  {activeTab === 'looks' && (
                <div className="space-y-6">
                  {/* Screen Mode */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] dark:text-[#E6E0D4] block">
                      Screen Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        onClick={() => setScreenMode('dark')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          screenMode === 'dark'
                            ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                            : 'bg-[#F9F7F2] dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#332F2D]'
                        }`}
                      >
                        <Moon className="w-4 h-4" />
                        <span className="text-xs font-bold">Dark</span>
                      </button>

                      <button
                        onClick={() => setScreenMode('light')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          screenMode === 'light'
                            ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                            : 'bg-[#F9F7F2] dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#332F2D]'
                        }`}
                      >
                        <Sun className="w-4 h-4" />
                        <span className="text-xs font-bold">Light</span>
                      </button>

                      <button
                        onClick={() => setScreenMode('system')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          screenMode === 'system'
                            ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                            : 'bg-[#F9F7F2] dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#332F2D]'
                        }`}
                      >
                        <Paintbrush className="w-4 h-4" />
                        <span className="text-xs font-bold">System</span>
                      </button>
                    </div>
                  </div>

                  {/* Layout Mode */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] dark:text-[#E6E0D4] block">
                      Layout Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        onClick={() => setViewMode('mobile')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          viewMode === 'mobile'
                            ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                            : 'bg-[#F9F7F2] dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#332F2D]'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span className="text-xs font-bold">Mobile</span>
                      </button>

                      <button
                        onClick={() => setViewMode('desktop')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          viewMode === 'desktop'
                            ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                            : 'bg-[#F9F7F2] dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#332F2D]'
                        }`}
                      >
                        <Monitor className="w-4 h-4" />
                        <span className="text-xs font-bold">Desktop</span>
                      </button>

                      <button
                        onClick={() => setViewMode('auto')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          viewMode === 'auto'
                            ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                            : 'bg-[#F9F7F2] dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#332F2D]'
                        }`}
                      >
                        <Paintbrush className="w-4 h-4" />
                        <span className="text-xs font-bold">System</span>
                      </button>
                    </div>
                  </div>

                  {/* Font Mode Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] dark:text-[#E6E0D4] block">
                      Font Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        onClick={() => setSelectedFont('geist')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          selectedFont === 'geist'
                            ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                            : 'bg-[#F9F7F2] dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#332F2D]'
                        }`}
                      >
                        <span className="text-base font-bold italic font-serif leading-none h-4 flex items-center justify-center select-none">T</span>
                        <span className="text-xs font-bold">Geist</span>
                      </button>

                      <button
                        onClick={() => setSelectedFont('monospace')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          selectedFont === 'monospace'
                            ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                            : 'bg-[#F9F7F2] dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#332F2D]'
                        }`}
                      >
                        <span className="text-base font-bold font-mono leading-none h-4 flex items-center justify-center select-none">T</span>
                        <span className="text-xs font-bold font-mono">Monospace</span>
                      </button>

                      <button
                        onClick={() => setSelectedFont('system')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          selectedFont === 'system'
                            ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                            : 'bg-[#F9F7F2] dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#332F2D]'
                        }`}
                      >
                        <Paintbrush className="w-4 h-4" />
                        <span className="text-xs font-bold">System</span>
                      </button>
                    </div>

                    {/* Apply Font Target Scope */}
                    <div className="pt-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] dark:text-[#E6E0D4] block mb-2">
                        APPLICATION
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setFontScope('all')}
                          className={`p-3 rounded-xl border flex items-center justify-center text-center transition-all cursor-pointer ${
                            fontScope === 'all'
                              ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                              : 'bg-[#F9F7F2] dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#332F2D]'
                          }`}
                        >
                          <span className="text-xs font-bold">PAGES</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFontScope('editor')}
                          className={`p-3 rounded-xl border flex items-center justify-center text-center transition-all cursor-pointer ${
                            fontScope === 'editor'
                              ? 'bg-white dark:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                              : 'bg-[#F9F7F2] dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] border-[#E8E4D9] dark:border-[#383432] hover:bg-[#F1EDE4] dark:hover:bg-[#332F2D]'
                          }`}
                        >
                          <span className="text-xs font-bold">PAGE</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="space-y-6">
                  {/* Account Login Section */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] dark:text-[#E6E0D4] block">
                      Cloud Account Sync
                    </label>
                    <div className="bg-[#F9F7F2] dark:bg-[#191716] border border-[#E8E4D9] dark:border-[#383432] rounded-xl p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {currentUser?.avatarUrl ? (
                          <img
                            src={currentUser.avatarUrl}
                            alt={currentUser.displayName}
                            className="w-9 h-9 rounded-full object-cover border border-[#E8E4D9] dark:border-[#383432]"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-white dark:bg-[#282524] border border-[#E8E4D9] dark:border-[#383432] flex items-center justify-center font-black text-xs text-[#2D2A29] dark:text-[#F2EFE9] shadow-xs">
                            CL
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-bold text-[#2D2A29] dark:text-[#F2EFE9]">
                            {currentUser ? currentUser.displayName : 'Pages Cloud Account'}
                          </div>
                          <span className="text-[11px] text-[#8C8679] dark:text-[#A8A29A] block">
                            {currentUser
                              ? `@${currentUser.username} • Cloud Synced`
                              : 'Log in to sync your notes across devices'}
                          </span>
                          {syncStatusText && (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                              {syncStatusText}
                            </span>
                          )}
                        </div>
                      </div>

                      {currentUser ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleManualSync}
                            disabled={isSyncing}
                            className="px-3 py-1.5 bg-[#F1EDE4] dark:bg-[#282524] hover:bg-white dark:hover:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border border-[#E8E4D9] dark:border-[#383432] text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveUser(null);
                              setCurrentUser(null);
                            }}
                            className="p-1.5 text-[#8C8679] dark:text-[#A8A29A] hover:text-[#2D2A29] dark:hover:text-[#F2EFE9] rounded-lg transition-colors cursor-pointer"
                            title="Sign out"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAuthModalOpen(true)}
                          className="px-3.5 py-2 bg-[#2D2A29] dark:bg-[#F2EFE9] text-white dark:text-[#2D2A29] text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                        >
                          Log In / Register
                        </button>
                      )}
                    </div>
                  </div>

                  {/* BACKUP (Export / Import) */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] dark:text-[#E6E0D4] block">
                      BACKUP
                    </label>
                    <p className="text-xs text-[#8C8679] dark:text-[#A8A29A] leading-relaxed">
                      Export every pages into .txt zipped file or import a saved backup file.
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {/* Export Button (Expandable) */}
                      <button
                        type="button"
                        onClick={() => setIsExportExpanded((prev) => !prev)}
                        className={`py-2.5 px-4 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                          isExportExpanded
                            ? 'bg-white dark:bg-[#332F2D] border-[#8C8679] text-[#2D2A29] dark:text-[#F2EFE9]'
                            : 'bg-[#F1EDE4] dark:bg-[#282524] border-[#E8E4D9] dark:border-[#383432] text-[#2D2A29] dark:text-[#F2EFE9] hover:bg-white dark:hover:bg-[#332F2D]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          <span>Export</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExportExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Import Button */}
                      <label className="py-2.5 px-4 bg-[#F1EDE4] dark:bg-[#282524] hover:bg-white dark:hover:bg-[#332F2D] text-[#2D2A29] dark:text-[#F2EFE9] border border-[#E8E4D9] dark:border-[#383432] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>Import</span>
                        <input
                          type="file"
                          accept=".txt,.zip,.json"
                          onChange={handleFileImport}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Import Status Feedback Message */}
                    <AnimatePresence>
                      {importStatus && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 border ${
                            importStatus.isError
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {importStatus.isError ? (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          )}
                          <span>{importStatus.text}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Expandable Export Option Panel */}
                    <AnimatePresence>
                      {isExportExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 rounded-2xl bg-[#F9F7F2] dark:bg-[#191716] border border-[#E8E4D9] dark:border-[#383432] space-y-4">
                            {/* Format Coded Toggle Option */}
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-xs font-bold text-[#2D2A29] dark:text-[#F2EFE9]">
                                  Export with Format Coded
                                </div>
                                <div className="text-[11px] text-[#8C8679] dark:text-[#A8A29A]">
                                  Preserve text formatting, sizes & HTML tags in exported .txt files
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setExportFormatCoded((prev) => !prev)}
                                className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                                  exportFormatCoded ? 'bg-[#2D2A29] dark:bg-[#F2EFE9]' : 'bg-[#E8E4D9] dark:bg-[#383432]'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full bg-white dark:bg-[#201D1C] transition-transform ${
                                    exportFormatCoded ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Full-width Export trigger button */}
                            <button
                              type="button"
                              onClick={handleExportClick}
                              className="w-full py-3 bg-[#2D2A29] dark:bg-[#F2EFE9] text-white dark:text-[#2D2A29] text-xs font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                              <span>Export</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="h-full flex flex-col justify-between py-2 space-y-8">
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold tracking-tight text-[#2D2A29] dark:text-[#F2EFE9]">
                      Pages
                    </h3>
                    <p className="text-sm font-medium text-[#433F3E] dark:text-[#E6E0D4] leading-relaxed">
                      leave this Pages, start writing effectively.
                    </p>
                  </div>

                  <div className="pt-8 border-t border-[#E8E4D9] dark:border-[#383432] text-left space-y-1">
                    <p className="text-xs font-semibold text-[#8C8679] dark:text-[#A8A29A]">
                      Authorized by CayLabs
                    </p>
                    <p className="text-[11px] font-bold text-[#8C8679]/80 dark:text-[#A8A29A]/80">
                      v0.7 Beta
                    </p>
                  </div>
                </div>
              )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentNotes={notes}
        onLoginSuccess={(user, mergedNotes) => {
          setCurrentUser(user);
          onImportNotes(mergedNotes);
        }}
      />
    </AnimatePresence>
  );
};
