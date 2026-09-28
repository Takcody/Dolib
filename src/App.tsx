import React, { useState, useEffect } from 'react';
import { LockScreen } from './components/LockScreen';
import { LibraryView } from './components/LibraryView';
import { OrientationGuard } from './components/OrientationGuard';
import { Toaster } from '@/components/ui/sonner';
import { initSettings, db } from './lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';

export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const { i18n } = useTranslation();

  const settings = useLiveQuery(() => db.settings.get('main'));

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
      const settings = await db.settings.get('main');
      // If no passcode is set, we'll show the lock screen in "setup mode"
      // which is handled inside LockScreen component
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
