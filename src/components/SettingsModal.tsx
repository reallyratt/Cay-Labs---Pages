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
} from 'lucide-react';
import { ViewMode, PWAState, Note } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  pwaState: PWAState;
  onTriggerInstall: () => void;
  notes: Note[];
  onImportNotes: (imported: Note[]) => void;
}

type CategoryTab = 'looks' | 'data' | 'about';
type ScreenMode = 'light' | 'dark' | 'system';
type FontOption = 'geist' | 'monospace' | 'system';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  viewMode,
  setViewMode,
  pwaState,
  onTriggerInstall,
  notes,
  onImportNotes,
}) => {
  const [activeTab, setActiveTab] = useState<CategoryTab>('looks');

  // Screen Mode state
  const [screenMode, setScreenMode] = useState<ScreenMode>(() => {
    return (localStorage.getItem('pages_screen_mode') as ScreenMode) || 'light';
  });

  // Font state
  const [selectedFont, setSelectedFont] = useState<FontOption>(() => {
    return (localStorage.getItem('pages_font_option') as FontOption) || 'geist';
  });

  useEffect(() => {
    localStorage.setItem('pages_screen_mode', screenMode);
    if (screenMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (screenMode === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [screenMode]);

  useEffect(() => {
    localStorage.setItem('pages_font_option', selectedFont);
    if (selectedFont === 'monospace') {
      document.body.style.fontFamily = 'monospace, ui-monospace, SFMono-Regular';
    } else if (selectedFont === 'system') {
      document.body.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    } else {
      document.body.style.fontFamily = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    }
  }, [selectedFont]);

  if (!isOpen) return null;

  const handleExport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(notes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `pages-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportNotes(parsed);
          alert(`Successfully imported ${parsed.length} pages!`);
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
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
          className="bg-[#F9F7F2] border border-[#E8E4D9] rounded-2xl w-full max-w-2xl h-[520px] max-h-[90vh] shadow-2xl relative text-[#2D2A29] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4D9] shrink-0 bg-[#F9F7F2]">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#8C8679]" />
              <h2 className="text-lg font-bold tracking-tight text-[#2D2A29]">Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8C8679] hover:text-[#2D2A29] hover:bg-[#E8E4D9]/60 rounded-lg transition-colors cursor-pointer"
              title="Close Settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Split View Body */}
          <div className="flex flex-1 min-h-0">
            {/* Left Category Navigation Sidebar */}
            <div className="w-44 bg-[#F1EDE4] border-r border-[#E8E4D9] p-3 flex flex-col gap-1.5 shrink-0 select-none">
              <button
                onClick={() => setActiveTab('looks')}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'looks'
                    ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                    : 'text-[#433F3E] hover:bg-[#E8E4D9]/70 border border-transparent font-medium'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Looks</span>
              </button>

              <button
                onClick={() => setActiveTab('data')}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'data'
                    ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                    : 'text-[#433F3E] hover:bg-[#E8E4D9]/70 border border-transparent font-medium'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Data</span>
              </button>

              <button
                onClick={() => setActiveTab('about')}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'about'
                    ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                    : 'text-[#433F3E] hover:bg-[#E8E4D9]/70 border border-transparent font-medium'
                }`}
              >
                <Info className="w-4 h-4" />
                <span>About</span>
              </button>
            </div>

            {/* Right Panel Content */}
            <div className="flex-1 p-6 overflow-y-auto bg-white space-y-6">
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
                    <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] block">
                      Screen Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        onClick={() => setScreenMode('dark')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          screenMode === 'dark'
                            ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                            : 'bg-[#F9F7F2] text-[#2D2A29] border-[#E8E4D9] hover:bg-[#F1EDE4]'
                        }`}
                      >
                        <Moon className="w-4 h-4" />
                        <span className="text-xs font-bold">Dark</span>
                      </button>

                      <button
                        onClick={() => setScreenMode('light')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          screenMode === 'light'
                            ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                            : 'bg-[#F9F7F2] text-[#2D2A29] border-[#E8E4D9] hover:bg-[#F1EDE4]'
                        }`}
                      >
                        <Sun className="w-4 h-4" />
                        <span className="text-xs font-bold">Light</span>
                      </button>

                      <button
                        onClick={() => setScreenMode('system')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          screenMode === 'system'
                            ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                            : 'bg-[#F9F7F2] text-[#2D2A29] border-[#E8E4D9] hover:bg-[#F1EDE4]'
                        }`}
                      >
                        <Paintbrush className="w-4 h-4" />
                        <span className="text-xs font-bold">System</span>
                      </button>
                    </div>
                  </div>

                  {/* Layout Mode */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] block">
                      Layout Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        onClick={() => setViewMode('mobile')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          viewMode === 'mobile'
                            ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                            : 'bg-[#F9F7F2] text-[#2D2A29] border-[#E8E4D9] hover:bg-[#F1EDE4]'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span className="text-xs font-bold">Mobile</span>
                      </button>

                      <button
                        onClick={() => setViewMode('desktop')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          viewMode === 'desktop'
                            ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                            : 'bg-[#F9F7F2] text-[#2D2A29] border-[#E8E4D9] hover:bg-[#F1EDE4]'
                        }`}
                      >
                        <Monitor className="w-4 h-4" />
                        <span className="text-xs font-bold">Desktop</span>
                      </button>

                      <button
                        onClick={() => setViewMode('auto')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          viewMode === 'auto'
                            ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                            : 'bg-[#F9F7F2] text-[#2D2A29] border-[#E8E4D9] hover:bg-[#F1EDE4]'
                        }`}
                      >
                        <Paintbrush className="w-4 h-4" />
                        <span className="text-xs font-bold">System</span>
                      </button>
                    </div>
                  </div>

                  {/* Font Mode Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] block">
                      Font Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        onClick={() => setSelectedFont('geist')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          selectedFont === 'geist'
                            ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                            : 'bg-[#F9F7F2] text-[#2D2A29] border-[#E8E4D9] hover:bg-[#F1EDE4]'
                        }`}
                      >
                        <span className="text-base font-bold italic font-serif leading-none h-4 flex items-center justify-center select-none">T</span>
                        <span className="text-xs font-bold">Geist</span>
                      </button>

                      <button
                        onClick={() => setSelectedFont('monospace')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          selectedFont === 'monospace'
                            ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                            : 'bg-[#F9F7F2] text-[#2D2A29] border-[#E8E4D9] hover:bg-[#F1EDE4]'
                        }`}
                      >
                        <span className="text-base font-bold font-mono leading-none h-4 flex items-center justify-center select-none">T</span>
                        <span className="text-xs font-bold font-mono">Monospace</span>
                      </button>

                      <button
                        onClick={() => setSelectedFont('system')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          selectedFont === 'system'
                            ? 'bg-white text-[#2D2A29] border-[#8C8679] ring-2 ring-[#8C8679]/20 shadow-xs font-bold'
                            : 'bg-[#F9F7F2] text-[#2D2A29] border-[#E8E4D9] hover:bg-[#F1EDE4]'
                        }`}
                      >
                        <Paintbrush className="w-4 h-4" />
                        <span className="text-xs font-bold">System</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="space-y-6">
                  {/* Account Login Section */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] block">
                      Account Sync
                    </label>
                    <div className="bg-[#F9F7F2] border border-[#E8E4D9] rounded-xl p-4 flex items-center justify-between opacity-80">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border border-[#E8E4D9] flex items-center justify-center font-bold text-xs text-[#433F3E]">
                          G
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#2D2A29]">
                            Login to CayLabs account via Google
                          </div>
                          <span className="text-[11px] text-[#8C8679]">
                            Sync your notes seamlessly across devices
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8679] bg-[#E8E4D9]/80 px-2.5 py-1 rounded-full">
                        coming soon
                      </span>
                    </div>
                  </div>

                  {/* Your Data (Export / Import) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#433F3E] block">
                      Your Data
                    </label>
                    <p className="text-xs text-[#8C8679]">
                      Export all your pages as JSON backup or import a saved backup file.
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={handleExport}
                        className="flex-1 py-2.5 bg-[#F1EDE4] hover:bg-white hover:border-[#8C8679] text-[#2D2A29] border border-[#E8E4D9] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export Backup</span>
                      </button>

                      <label className="flex-1 py-2.5 bg-[#F1EDE4] hover:bg-white hover:border-[#8C8679] text-[#2D2A29] border border-[#E8E4D9] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>Import Backup</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileImport}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="h-full flex flex-col justify-between py-2 space-y-8">
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold tracking-tight text-[#2D2A29]">
                      Pages
                    </h3>
                    <p className="text-sm font-medium text-[#433F3E] leading-relaxed">
                      leave this Pages, start writing effectively.
                    </p>
                  </div>

                  <div className="pt-8 border-t border-[#E8E4D9] text-left space-y-1">
                    <p className="text-xs font-semibold text-[#8C8679]">
                      Authorized by CayLabs
                    </p>
                    <p className="text-[11px] font-bold text-[#8C8679]/80">
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
    </AnimatePresence>
  );
};
