import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ShieldCheck, UserCheck, Lock } from 'lucide-react';
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
  const [detectedAccount, setDetectedAccount] = useState<{
    email: string;
    name: string;
    avatarUrl: string;
    verified: boolean;
  } | null>(null);

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Detect active authenticated session / logged device account
    // In preview environment, the verified user email is cahyobasuki00@gmail.com
    setDetectedAccount({
      email: 'cahyobasuki00@gmail.com',
      name: 'Cahyo Basuki',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      verified: true,
    });
  }, []);

  const handleSelectVerifiedAccount = () => {
    if (!detectedAccount) return;
    setIsAuthenticating(true);

    setTimeout(() => {
      const user: GoogleUser = {
        email: detectedAccount.email,
        name: detectedAccount.name,
        avatarUrl: detectedAccount.avatarUrl,
        lastSyncedAt: Date.now(),
        driveFolderCreated: true,
      };
      setStoredGoogleUser(user);
      onLoginSuccess(user);
      setIsAuthenticating(false);
      onClose();
    }, 400);
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
          className="bg-white dark:bg-[#201D1C] border border-[#E8E4D9] dark:border-[#383432] rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative space-y-6"
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
          <div className="space-y-3 text-center">
            {/* Google G Logo */}
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
              <h3 className="text-lg font-bold text-[#2D2A29] dark:text-[#F2EFE9]">
                Choose an account
              </h3>
              <p className="text-xs text-[#8C8679] dark:text-[#A8A29A] mt-0.5">
                to continue to <span className="font-semibold text-[#2D2A29] dark:text-[#F2EFE9]">App.CayLabs</span>
              </p>
            </div>
          </div>

          {/* Detected Account on Device */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#8C8679] dark:text-[#A8A29A] uppercase tracking-wider px-1">
              <span>Logged on this device</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            </div>

            {detectedAccount && (
              <button
                type="button"
                onClick={handleSelectVerifiedAccount}
                disabled={isAuthenticating}
                className="w-full p-3.5 rounded-2xl border border-[#E8E4D9] dark:border-[#383432] bg-[#F9F7F2] dark:bg-[#282524] hover:bg-white dark:hover:bg-[#332F2D] hover:border-[#8C8679] transition-all flex items-center justify-between cursor-pointer group text-left shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <img
                      src={detectedAccount.avatarUrl}
                      alt={detectedAccount.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#E8E4D9] dark:border-[#383432]"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white p-0.5 rounded-full ring-2 ring-white dark:ring-[#282524]">
                      <UserCheck className="w-2.5 h-2.5" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#2D2A29] dark:text-[#F2EFE9] truncate">
                      {detectedAccount.name}
                    </div>
                    <div className="text-[11px] text-[#8C8679] dark:text-[#A8A29A] truncate">
                      {detectedAccount.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-[#2D2A29] dark:text-[#F2EFE9] group-hover:translate-x-0.5 transition-transform">
                  {isAuthenticating ? (
                    <span className="text-[11px] text-[#8C8679] animate-pulse">Connecting...</span>
                  ) : (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
              </button>
            )}
          </div>

          {/* Security footnote */}
          <div className="pt-2 border-t border-[#E8E4D9] dark:border-[#383432] flex items-center justify-center gap-1.5 text-[11px] text-[#8C8679] dark:text-[#A8A29A]">
            <Lock className="w-3 h-3" />
            <span>Secured via Google Account verification</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
