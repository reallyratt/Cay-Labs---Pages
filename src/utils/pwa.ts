import { useState, useEffect } from 'react';
import { PWAState } from '../types';

let deferredPrompt: any = null;

export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  }
}

export function usePWA(): {
  pwaState: PWAState;
  triggerInstall: () => Promise<boolean>;
} {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstalled: false,
    canInstall: false,
    isOffline: !navigator.onLine,
  });

  useEffect(() => {
    // Check standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    
    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setPwaState((prev) => ({ ...prev, canInstall: true, isInstalled: false }));
    };

    const handleAppInstalled = () => {
      deferredPrompt = null;
      setPwaState((prev) => ({ ...prev, canInstall: false, isInstalled: true }));
    };

    const handleOnline = () => {
      setPwaState((prev) => ({ ...prev, isOffline: false }));
    };

    const handleOffline = () => {
      setPwaState((prev) => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setPwaState({
      isInstalled: isStandalone,
      canInstall: !!deferredPrompt,
      isOffline: !navigator.onLine,
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome === 'accepted') {
      setPwaState((prev) => ({ ...prev, canInstall: false, isInstalled: true }));
      return true;
    }
    return false;
  };

  return { pwaState, triggerInstall };
}
