import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

/**
 * Attempts to lock device orientation to portrait using standard Screen Orientation API
 * and vendor-prefixed implementations.
 */
export async function lockOrientationToPortrait(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const orientation = window.screen?.orientation as any;
    if (orientation && typeof orientation.lock === 'function') {
      await orientation.lock('portrait');
      return true;
    }
    
    const legacyScreen = window.screen as any;
    if (typeof legacyScreen.lockOrientation === 'function') {
      return legacyScreen.lockOrientation('portrait');
    }
    if (typeof legacyScreen.mozLockOrientation === 'function') {
      return legacyScreen.mozLockOrientation('portrait');
    }
    if (typeof legacyScreen.msLockOrientation === 'function') {
      return legacyScreen.msLockOrientation('portrait');
    }
  } catch {
    // Orientation lock may fail if not supported or without user gesture/fullscreen
  }
  return false;
}

export function OrientationGuard() {
  const { t } = useTranslation();
  const [isLandscape, setIsLandscape] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const checkOrientation = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isWiderThanTall = width > height;

    if (!isWiderThanTall) {
      setIsLandscape(false);
      setIsDismissed(false); // Reset dismissal once returned to portrait
      return;
    }

    // Determine if the current environment is a phone, tablet, or device preview in landscape
    const isPhoneLandscapeHeight = height <= 580; // Phone rotated horizontally
    const isTouch = 
      ('ontouchstart' in window) || 
      (navigator.maxTouchPoints > 0) ||
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    
    // Tablet in landscape (e.g. iPad, Galaxy Tab) or phone
    const isTabletOrMobile = isTouch && width <= 1366;

    // Orientation angle if available
    const angle = window.screen?.orientation?.angle ?? (typeof window.orientation === 'number' ? window.orientation : 0);
    const isDeviceAngleLandscape = Math.abs(angle) === 90 || angle === 270;

    // Detect mobile/tablet/device-preview rotated horizontally
    if (isPhoneLandscapeHeight || (isTouch && isDeviceAngleLandscape) || isTabletOrMobile) {
      setIsLandscape(true);
      // Also continuously attempt to enforce orientation lock
      lockOrientationToPortrait();
    } else {
      setIsLandscape(false);
    }
  }, []);

  useEffect(() => {
    // Initial lock attempt
    lockOrientationToPortrait();
    checkOrientation();

    const handleResizeOrChange = () => {
      checkOrientation();
      lockOrientationToPortrait();
    };

    // Browsers often allow orientation lock only after user gesture
    const handleUserGesture = () => {
      lockOrientationToPortrait();
    };

    window.addEventListener('resize', handleResizeOrChange, { passive: true });
    window.addEventListener('orientationchange', handleResizeOrChange, { passive: true });
    window.addEventListener('pointerdown', handleUserGesture, { once: true, passive: true });
    window.addEventListener('touchstart', handleUserGesture, { once: true, passive: true });

    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleResizeOrChange);
    }

    return () => {
      window.removeEventListener('resize', handleResizeOrChange);
      window.removeEventListener('orientationchange', handleResizeOrChange);
      window.removeEventListener('pointerdown', handleUserGesture);
      window.removeEventListener('touchstart', handleUserGesture);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleResizeOrChange);
      }
    };
  }, [checkOrientation]);

  const handleEnforcePortrait = async () => {
    await lockOrientationToPortrait();
    checkOrientation();
  };

  if (!isLandscape || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none"
      >
        <div className="max-w-sm w-full flex flex-col items-center gap-5">
          {/* Animated Rotating Smartphone Icon */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <motion.div
              animate={{ 
                rotate: [90, 90, 0, 0, 90],
                scale: [1, 1.05, 1, 1, 1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 1,
                ease: "easeInOut"
              }}
              className="w-14 h-20 rounded-2xl border-4 border-primary bg-card/80 flex flex-col items-center justify-between p-1.5 shadow-2xl"
            >
              {/* Speaker / Camera Notch */}
              <div className="w-4 h-1 bg-muted-foreground/40 rounded-full" />
              {/* Screen Dolib Icon */}
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center shadow-inner">
                <img src="/icon.png" alt="Dolib" className="w-full h-full object-cover" />
              </div>
              {/* Home indicator bar */}
              <div className="w-6 h-1 bg-muted-foreground/30 rounded-full" />
            </motion.div>

            {/* Rotating Arrow Badge */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md"
            >
              <RotateCw className="w-4 h-4" />
            </motion.div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {t('portrait_only_title')}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              {t('portrait_only_desc')}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 w-full max-w-xs pt-2">
            <Button 
              onClick={handleEnforcePortrait}
              className="w-full gap-2 font-medium shadow-md"
              size="default"
            >
              <Smartphone className="w-4 h-4" />
              {t('portrait_only_title')}
            </Button>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors py-1 cursor-pointer"
            >
              {t('continue_anyway')}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
