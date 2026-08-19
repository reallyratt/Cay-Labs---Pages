import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Cloud,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { Note } from '../types';
import {
  AppUser,
  createAccount,
  loginAccount,
} from '../utils/cloudAccountEngine';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AppUser, mergedNotes: Note[]) => void;
  currentNotes?: Note[];
}

export const GoogleAuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentNotes = [],
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setDisplayName('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        const { user, notes } = await loginAccount(username, password, currentNotes);
        setSuccessMsg(`Welcome back, ${user.displayName}! Notes synced.`);
        setTimeout(() => {
          onLoginSuccess(user, notes);
          onClose();
          resetForm();
        }, 400);
      } else {
        const { user, notes } = await createAccount(
          username,
          password,
          displayName,
          currentNotes
        );
        setSuccessMsg(`Account created! Welcome, ${user.displayName}.`);
        setTimeout(() => {
          onLoginSuccess(user, notes);
          onClose();
          resetForm();
        }, 400);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err?.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

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
          className="bg-white dark:bg-[#201D1C] border border-[#E8E4D9] dark:border-[#383432] rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl relative space-y-5 overflow-hidden"
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
          <div className="space-y-1.5 text-center pt-1">
            <div className="mx-auto w-11 h-11 rounded-2xl bg-[#F9F7F2] dark:bg-[#282524] border border-[#E8E4D9] dark:border-[#383432] flex items-center justify-center shadow-xs text-[#2D2A29] dark:text-[#F2EFE9]">
              <Cloud className="w-5 h-5 text-[#8C8679] dark:text-[#A8A29A]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2D2A29] dark:text-[#F2EFE9] tracking-tight">
                {activeTab === 'login' ? 'Sign In to Pages' : 'Create an Account'}
              </h3>
              <p className="text-xs text-[#8C8679] dark:text-[#A8A29A]">
                {activeTab === 'login'
                  ? 'Access and sync your notes from any phone or computer'
                  : 'Get your personal cloud storage to access notes anywhere'}
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="bg-[#F9F7F2] dark:bg-[#191716] p-1 rounded-2xl border border-[#E8E4D9] dark:border-[#383432] flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleTabChange('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] shadow-xs'
                  : 'text-[#8C8679] hover:text-[#2D2A29] dark:hover:text-[#F2EFE9]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('register')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white dark:bg-[#282524] text-[#2D2A29] dark:text-[#F2EFE9] shadow-xs'
                  : 'text-[#8C8679] hover:text-[#2D2A29] dark:hover:text-[#F2EFE9]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Username Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#433F3E] dark:text-[#D5CEC2] block">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8C8679] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. cahyo"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#383432] bg-[#F9F7F2] dark:bg-[#191716] text-xs text-[#2D2A29] dark:text-[#F2EFE9] placeholder-[#8C8679] focus:outline-none focus:ring-2 focus:ring-[#8C8679]"
                />
              </div>
            </div>

            {/* Display Name (Only in Register) */}
            {activeTab === 'register' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#433F3E] dark:text-[#D5CEC2] block">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cahyo Basuki"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#383432] bg-[#F9F7F2] dark:bg-[#191716] text-xs text-[#2D2A29] dark:text-[#F2EFE9] placeholder-[#8C8679] focus:outline-none focus:ring-2 focus:ring-[#8C8679]"
                />
              </div>
            )}

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#433F3E] dark:text-[#D5CEC2] block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C8679] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={activeTab === 'register' ? 'Min 4 characters' : 'Enter password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#383432] bg-[#F9F7F2] dark:bg-[#191716] text-xs text-[#2D2A29] dark:text-[#F2EFE9] placeholder-[#8C8679] focus:outline-none focus:ring-2 focus:ring-[#8C8679]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8679] hover:text-[#2D2A29] dark:hover:text-[#F2EFE9] p-0.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !username.trim() || !password.trim()}
              className="w-full py-3 bg-[#2D2A29] dark:bg-[#F2EFE9] text-white dark:text-[#2D2A29] text-xs font-bold rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-40"
            >
              {isLoading ? (
                <span>Synchronizing...</span>
              ) : activeTab === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Log In &amp; Load Notes</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account &amp; Sync</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="pt-2 border-t border-[#E8E4D9] dark:border-[#383432] flex items-center justify-between text-[10px] text-[#8C8679] dark:text-[#A8A29A]">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Password-protected Cloud Storage
            </span>
            <span>Pages Cloud</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
