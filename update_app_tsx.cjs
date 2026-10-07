const fs = require('fs');

const path = 'src/App.tsx';

const newCode = `import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LockScreen } from './components/LockScreen';
import { LibraryView } from './components/LibraryView';
import { OrientationGuard } from './components/OrientationGuard';
import { Toaster } from '@/components/ui/sonner';
import { initSettings, db } from './lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { App as CapApp } from '@capacitor/app';

export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const { i18n } = useTranslation();

  const settings = useLiveQuery(() => db.settings.get('main'));

  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    if (!isLocked && settings?.passcode && settings.autoLockTime && settings.autoLockTime > 0) {
      idleTimeoutRef.current = setTimeout(() => {
        setIsLocked(true);
      }, settings.autoLockTime);
    }
  }, [isLocked, settings?.passcode, settings?.autoLockTime]);

  useEffect(() => {
    if (settings?.autoLockTime && settings.autoLockTime > 0 && !isLocked) {
      window.addEventListener('touchstart', resetIdleTimer);
      window.addEventListener('mousedown', resetIdleTimer);
      window.addEventListener('keydown', resetIdleTimer);

      resetIdleTimer(); // Init

      return () => {
        window.removeEventListener('touchstart', resetIdleTimer);
        window.removeEventListener('mousedown', resetIdleTimer);
        window.removeEventListener('keydown', resetIdleTimer);
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      };
    }
  }, [resetIdleTimer, settings?.autoLockTime, isLocked]);

  useEffect(() => {
    const handleVis = () => {
      if (document.hidden) {
        localStorage.setItem('lastBackgroundTime', Date.now().toString());
      }
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, []);

  useEffect(() => {
    const handleAppStateChange = async ({ isActive }: { isActive: boolean }) => {
      if (!isActive) {
        localStorage.setItem('lastBackgroundTime', Date.now().toString());
      } else {
        const bgTimeStr = localStorage.getItem('lastBackgroundTime');
        if (bgTimeStr) {
          const bgTime = parseInt(bgTimeStr, 10);
          const currentSettings = await db.settings.get('main');

          if (currentSettings?.passcode) {
            const autoLockTime = currentSettings.autoLockTime ?? -1;
            if (autoLockTime === -1) {
              setIsLocked(true);
            } else if (autoLockTime > 0) {
              const elapsed = Date.now() - bgTime;
              if (elapsed >= autoLockTime) {
                setIsLocked(true);
              }
            }
          }
        }
      }
    };

    const listener = CapApp.addListener('appStateChange', handleAppStateChange);
    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  useEffect(() => {
    if (settings) {
      if (settings.isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      if (settings.language && i18n.language !== settings.language) {
        i18n.changeLanguage(settings.language);
      }
    }
  }, [settings?.isDarkMode, settings?.language, i18n]);

  useEffect(() => {
    async function setup() {
      await initSettings();
      const currentSettings = await db.settings.get('main');

      let shouldLock = true;

      if (currentSettings?.passcode) {
        const autoLockTime = currentSettings.autoLockTime ?? -1;
        const bgTimeStr = localStorage.getItem('lastBackgroundTime');

        if (autoLockTime === 0) {
          shouldLock = false;
        } else if (autoLockTime > 0 && bgTimeStr) {
          const bgTime = parseInt(bgTimeStr, 10);
          const elapsed = Date.now() - bgTime;
          if (elapsed < autoLockTime) {
            shouldLock = false;
          }
        }
      }

      setIsLocked(shouldLock);
      setIsReady(true);
    }
    setup();
  }, []);

  if (!isReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background font-sans antialiased transition-colors duration-500">
      <OrientationGuard />
      {isLocked ? (
        <LockScreen onUnlock={() => setIsLocked(false)} />
      ) : (
        <LibraryView />
      )}
      <Toaster
        position="top-center"
        style={{ marginTop: 'max(1.5rem, env(safe-area-inset-top, 0px))' }}
      />
    </main>
  );
}
`;

fs.writeFileSync(path, newCode);
console.log('App.tsx fully rewritten with accurate auto-lock logic.');
