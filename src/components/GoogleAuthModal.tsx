import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Trash2,
  Mail,
  AlertCircle,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  GoogleUser,
  SavedAccount,
  getSavedAccountsOnDevice,
  addSavedAccountOnDevice,
  removeSavedAccountOnDevice,
  setStoredGoogleUser,
  syncNotesWithCloud,
} from '../utils/googleSyncEngine';
import { Note } from '../types';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: GoogleUser) => void;
  currentNotes?: Note[];
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentNotes = [],
}) => {
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSavedAccounts(getSavedAccountsOnDevice());
      setErrorMsg(null);
    }
  }, [isOpen]);

  const handleSelectAccount = (account: SavedAccount) => {
    setIsAuthenticating(true);
    setErrorMsg(null);

    const user: GoogleUser = {
      email: account.email,
      name: account.name,
      avatarUrl: account.avatarUrl,
      lastSyncedAt: Date.now(),
    };

    setStoredGoogleUser(user);
    const { mergedNotes } = syncNotesWithCloud(currentNotes, user.email);
    onLoginSuccess(user);
    setIsAuthenticating(false);
    onClose();
  };

  const handleCreateNewAccountLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsAuthenticating(true);
    setErrorMsg(null);

    const displayName =
      nameInput.trim() ||
      cleanEmail
        .split('@')[0]
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName
    )}&background=8C8679&color=fff&bold=true`;

    const newAccount: SavedAccount = {
      email: cleanEmail,
      name: displayName,
      avatarUrl: avatar,
      lastSyncedAt: Date.now(),
    };

    addSavedAccountOnDevice(newAccount);

    const user: GoogleUser = {
      email: cleanEmail,
      name: displayName,
      avatarUrl: avatar,
      lastSyncedAt: Date.now(),
    };

    setStoredGoogleUser(user);
    syncNotesWithCloud(currentNotes, user.email);
    onLoginSuccess(user);
    setIsAuthenticating(false);
    onClose();
  };

  const handleRemoveAccount = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    removeSavedAccountOnDevice(email);
    setSavedAccounts(getSavedAccountsOnDevice());
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#201D1C] border border-[#E8E4D9] dark:border-[#383432] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-5 overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-[#8C8679] dark:text-[#A8A29A] hover:text-[#2D2A29] dark:hover:text-[#F2EFE9] hover:bg-[#F9F7F2] dark:hover:bg-[#282524] rounded-full transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="space-y-2 text-center pt-1">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-[#F9F7F2] dark:bg-[#282524] border border-[#E8E4D9] dark:border-[#383432] flex items-center justify-center shadow-xs text-[#2D2A29] dark:text-[#F2EFE9]">
              <Sparkles className="w-5 h-5 text-[#8C8679] dark:text-[#A8A29A]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2D2A29] dark:text-[#F2EFE9] tracking-tight">
                Account Sync
              </h3>
              <p className="text-xs text-[#8C8679] dark:text-[#A8A29A] mt-0.5">
                Choose your account to instantly sync notes across devices
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Content Area */}
          <div className="overflow-y-auto space-y-4 pr-0.5 custom-scrollbar">
            {/* Accounts on device */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#8C8679] dark:text-[#A8A29A] px-1">
                <span>Select Account</span>
                <span>{savedAccounts.length} saved</span>
              </div>

              <div className="space-y-2">
                {savedAccounts.map((acc) => (
                  <div
                    key={acc.email}
                    onClick={() => handleSelectAccount(acc)}
                    className="w-full p-3 rounded-2xl border border-[#E8E4D9] dark:border-[#383432] bg-[#F9F7F2] dark:bg-[#282524] hover:bg-white dark:hover:bg-[#332F2D] hover:border-[#8C8679] dark:hover:border-[#8C8679] transition-all flex items-center justify-between cursor-pointer group shadow-2xs text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={acc.avatarUrl}
                        alt={acc.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#E8E4D9] dark:border-[#383432] flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-[#2D2A29] dark:text-[#F2EFE9] truncate">
                          {acc.name}
                        </div>
                        <div className="text-[11px] text-[#8C8679] dark:text-[#A8A29A] truncate">
                          {acc.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 pl-2">
                      <span className="text-[11px] font-semibold text-[#8C8679] group-hover:text-[#2D2A29] dark:group-hover:text-[#F2EFE9] transition-colors flex items-center gap-1">
                        Log in <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                      {savedAccounts.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveAccount(e, acc.email)}
                          className="p-1 text-[#8C8679] hover:text-red-500 rounded-md transition-colors ml-1 cursor-pointer"
                          title="Remove from device"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add or switch email */}
            {!isAddingNew ? (
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="w-full py-2.5 px-3 rounded-2xl border border-dashed border-[#E8E4D9] dark:border-[#383432] hover:border-[#8C8679] bg-transparent hover:bg-[#F9F7F2] dark:hover:bg-[#282524] transition-all flex items-center justify-center gap-2 text-xs font-bold text-[#2D2A29] dark:text-[#F2EFE9] cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#8C8679]" />
                <span>Use another email address</span>
              </button>
            ) : (
              <form
                onSubmit={handleCreateNewAccountLogin}
                className="p-4 rounded-2xl border border-[#E8E4D9] dark:border-[#383432] bg-[#F9F7F2] dark:bg-[#282524] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2D2A29] dark:text-[#F2EFE9]">
                    Enter your email
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="text-[11px] text-[#8C8679] hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8C8679] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="your.name@gmail.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#383432] bg-white dark:bg-[#1C1A19] text-xs text-[#2D2A29] dark:text-[#F2EFE9] placeholder-[#8C8679] focus:outline-none focus:ring-2 focus:ring-[#8C8679]"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Display Name (optional)"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#383432] bg-white dark:bg-[#1C1A19] text-xs text-[#2D2A29] dark:text-[#F2EFE9] placeholder-[#8C8679] focus:outline-none focus:ring-2 focus:ring-[#8C8679]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!emailInput.trim() || isAuthenticating}
                  className="w-full py-2.5 bg-[#2D2A29] dark:bg-[#F2EFE9] text-white dark:text-[#2D2A29] text-xs font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
                >
                  {isAuthenticating ? 'Connecting & Syncing...' : 'Sign In & Sync Notes'}
                </button>
              </form>
            )}
          </div>

          {/* Footer note */}
          <div className="pt-2 border-t border-[#E8E4D9] dark:border-[#383432] flex items-center justify-between text-[10px] text-[#8C8679] dark:text-[#A8A29A]">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Instant Account Persistence
            </span>
            <span>Pages by CayLabs</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
