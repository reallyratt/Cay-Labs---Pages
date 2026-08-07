import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, HardDrive, FolderCheck } from 'lucide-react';
import { GoogleUser, setStoredGoogleUser } from '../utils/googleSyncEngine';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: GoogleUser) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const presetAccounts = [
    {
      email: 'cahyobasuki00@gmail.com',
      name: 'Cahyo Basuki',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
    {
      email: 'caylabs.user@gmail.com',
      name: 'CayLabs User',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    },
  ];

  const handleSelectAccount = (acc: { email: string; name: string; avatarUrl: string }) => {
    setSelectedAccount(acc.email);
    const user: GoogleUser = {
      email: acc.email,
      name: acc.name,
      avatarUrl: acc.avatarUrl,
      lastSyncedAt: Date.now(),
      driveFolderCreated: true,
    };
    setStoredGoogleUser(user);
    onLoginSuccess(user);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const displayName = name || email.split('@')[0];
    const user: GoogleUser = {
      email,
      name: displayName,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8C8679&color=fff`,
      lastSyncedAt: Date.now(),
      driveFolderCreated: true,
    };
    setStoredGoogleUser(user);
    onLoginSuccess(user);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#201D1C] border border-[#E8E4D9] dark:border-[#383432] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-[#8C8679] dark:text-[#A8A29A] hover:text-[#2D2A29] dark:hover:text-[#F2EFE9] hover:bg-[#F9F7F2] dark:hover:bg-[#282524] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-[#F9F7F2] dark:bg-[#282524] border border-[#E8E4D9] dark:border-[#383432] flex items-center justify-center text-lg font-black tracking-tight text-[#2D2A29] dark:text-[#F2EFE9] shadow-xs">
              CL
            </div>
            <h3 className="text-xl font-bold text-[#2D2A29] dark:text-[#F2EFE9]">
              CayLabs Google Account
            </h3>
            <p className="text-xs text-[#8C8679] dark:text-[#A8A29A]">
              Logging in automatically connects to your Google Drive folder structure:
            </p>
            <div className="text-[11px] font-mono text-left bg-[#F9F7F2] dark:bg-[#282524] border border-[#E8E4D9] dark:border-[#383432] rounded-xl p-3 space-y-1 text-[#433F3E] dark:text-[#E6E0D4]">
              <div className="flex items-center gap-1.5 font-bold">
                <HardDrive className="w-3.5 h-3.5 text-[#8C8679]" /> App.CayLabs/
              </div>
              <div className="pl-4 flex items-center gap-1">
                └── Pages/
              </div>
              <div className="pl-8 flex items-center gap-1.5 text-[#8C8679] dark:text-[#A8A29A]">
                <FolderCheck className="w-3 h-3" /> Page (Active pages)
              </div>
              <div className="pl-8 flex items-center gap-1.5 text-[#8C8679] dark:text-[#A8A29A]">
                <FolderCheck className="w-3 h-3" /> Archive (Archived pages)
              </div>
              <div className="pl-8 flex items-center gap-1.5 text-[#8C8679] dark:text-[#A8A29A]">
                <FolderCheck className="w-3 h-3" /> Dumpster (Trash)
              </div>
            </div>
          </div>

          {/* Preset Google Accounts */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#433F3E] dark:text-[#E6E0D4] block">
              Choose an account on device
            </label>
            <div className="space-y-2">
              {presetAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectAccount(acc)}
                  className="w-full p-3 rounded-2xl border border-[#E8E4D9] dark:border-[#383432] bg-[#F9F7F2] dark:bg-[#282524] hover:bg-white dark:hover:bg-[#332F2D] hover:border-[#8C8679] transition-all flex items-center justify-between cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={acc.avatarUrl}
                      alt={acc.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#E8E4D9] dark:border-[#383432]"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#2D2A29] dark:text-[#F2EFE9]">
                        {acc.name}
                      </div>
                      <div className="text-[11px] text-[#8C8679] dark:text-[#A8A29A]">
                        {acc.email}
                      </div>
                    </div>
                  </div>
                  {selectedAccount === acc.email && (
                    <Check className="w-4 h-4 text-[#8C8679] dark:text-[#E6E0D4]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#E8E4D9] dark:border-[#383432] w-full" />
            <span className="bg-white dark:bg-[#201D1C] px-3 text-[10px] uppercase font-bold text-[#8C8679] dark:text-[#A8A29A] absolute">
              or enter email
            </span>
          </div>

          {/* Custom Form */}
          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="name@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#383432] bg-[#F9F7F2] dark:bg-[#282524] text-xs text-[#2D2A29] dark:text-[#F2EFE9] placeholder-[#8C8679] focus:outline-none focus:ring-2 focus:ring-[#8C8679]"
            />
            <button
              type="submit"
              disabled={!email}
              className="w-full py-3 bg-[#2D2A29] dark:bg-[#F2EFE9] text-white dark:text-[#2D2A29] text-xs font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
            >
              Log in & Connect CayLabs Drive
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
