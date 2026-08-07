import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, AlertCircle, LogIn } from 'lucide-react';
import { GoogleUser, setStoredGoogleUser } from '../utils/googleSyncEngine';
import { setStoredAccessToken } from '../utils/googleDriveSync';
import { triggerGoogleSignIn } from '../utils/firebaseAuth';

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
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMsg(null);

    try {
      const res = await triggerGoogleSignIn();

      if (res.accessToken) {
        setStoredAccessToken(res.accessToken);
      }

      const user: GoogleUser = {
        email: res.email,
        name: res.name,
        avatarUrl: res.avatarUrl,
        lastSyncedAt: Date.now(),
        driveFolderCreated: true,
      };

      setStoredGoogleUser(user);
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      console.error('Sign in error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in popup was closed before completing.');
      } else {
        setErrorMsg(err?.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setIsAuthenticating(false);
    }
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
          className="bg-white dark:bg-[#201D1C] border border-[#E8E4D9] dark:border-[#383432] rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl relative space-y-6 overflow-hidden"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-[#8C8679] dark:text-[#A8A29A] hover:text-[#2D2A29] dark:hover:text-[#F2EFE9] hover:bg-[#F9F7F2] dark:hover:bg-[#282524] rounded-full transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Google Logo Header */}
          <div className="space-y-3 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-white dark:bg-[#282524] border border-[#E8E4D9] dark:border-[#383432] flex items-center justify-center shadow-xs">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2D2A29] dark:text-[#F2EFE9] tracking-tight">
                Sign in with Google
              </h3>
              <p className="text-xs text-[#8C8679] dark:text-[#A8A29A] mt-1 leading-relaxed">
                Choose an account on your device to connect Google Drive with <span className="font-semibold text-[#2D2A29] dark:text-[#F2EFE9]">App.CayLabs</span>
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Official Google Account Picker Trigger */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              className="w-full py-3.5 px-4 rounded-2xl border border-[#E8E4D9] dark:border-[#383432] bg-white dark:bg-[#282524] hover:bg-[#F9F7F2] dark:hover:bg-[#332F2D] hover:border-[#8C8679] text-[#2D2A29] dark:text-[#F2EFE9] font-bold text-xs transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isAuthenticating ? 'Opening Google Account Chooser...' : 'Select Account on Device'}</span>
              {!isAuthenticating && <LogIn className="w-4 h-4 text-[#8C8679] ml-auto" />}
            </button>

            <p className="text-[11px] text-[#8C8679] dark:text-[#A8A29A] text-center">
              Google will display all accounts saved on your browser or device so you can pick one securely.
            </p>
          </div>

          {/* Privacy & terms footer */}
          <div className="pt-2 border-t border-[#E8E4D9] dark:border-[#383432] text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-[10px] text-[#8C8679] dark:text-[#A8A29A]">
              <Lock className="w-2.5 h-2.5" />
              <span>Official Google OAuth 2.0 Authentication</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
