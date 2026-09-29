import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Delete, Fingerprint, ShieldAlert, Languages, ShieldCheck, Lock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const { t, i18n } = useTranslation();
  const [passcode, setPasscode] = useState('');
  const [storedPasscode, setStoredPasscode] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [tempPasscode, setTempPasscode] = useState('');
  const [customBg, setCustomBg] = useState<string | undefined>(undefined);
  const [bgDim, setBgDim] = useState(60);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    async function checkPasscode() {
      const settings = await db.settings.get('main');
      if (settings?.passcode) {
        setStoredPasscode(settings.passcode);
      } else {
        setIsSettingUp(true);
      }
      if (settings?.customBackground) {
        setCustomBg(settings.customBackground);
      }
      if (settings?.isDarkMode) {
        setIsDarkMode(true);
      }
      if (typeof settings?.backgroundDim === 'number') {
        setBgDim(settings.backgroundDim);
      }
    }
    checkPasscode();
  }, []);

  const handleFingerprintUnlock = async () => {
    try {
      const result = await NativeBiometric.isAvailable();
      if (!result.isAvailable) {
        toast.error('Biometric authentication is not available on this device');
        return;
      }

      localStorage.setItem('biometricActive', 'true');
      await NativeBiometric.verifyIdentity({
        reason: 'Unlock Dolib Library',
        title: t('use_fingerprint') || 'Biometric Authentication',
        subtitle: 'Scan your fingerprint or face to unlock',
        description: 'Confirm your identity to continue',
      });

      onUnlock();
    } catch (err: any) {
      console.log('Biometric verification canceled or failed', err);
      const msg = err?.message || String(err);
      if (!msg.includes('cancel') && !msg.includes('Cancel') && !msg.includes('10')) {
        toast.error('Biometric authentication failed');
      }
    }
  };

  const handleNumberClick = (num: string) => {
    if (passcode.length < 6) {
      const newPasscode = passcode + num;
      setPasscode(newPasscode);
      setError(false);

      if (newPasscode.length === 6) {
        if (isSettingUp) {
          if (setupStep === 1) {
            setTempPasscode(newPasscode);
            setPasscode('');
            setSetupStep(2);
          } else {
            if (newPasscode === tempPasscode) {
              savePasscode(newPasscode);
            } else {
              setError(true);
              setPasscode('');
              setSetupStep(1);
            }
          }
        } else {
          if (newPasscode === storedPasscode) {
            onUnlock();
          } else {
            setError(true);
            setPasscode('');
            setTimeout(() => setError(false), 500);
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    setPasscode(passcode.slice(0, -1));
  };

  const savePasscode = async (code: string) => {
    await db.settings.update('main', { passcode: code });
    onUnlock();
  };

  const handleLanguageChange = async (lang: string) => {
    await db.settings.update('main', { language: lang });
    i18n.changeLanguage(lang);
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'es', name: 'Español' },
    { code: 'zh', name: '简体中文' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ko', name: '한국어' },
    { code: 'pt', name: 'Português' },
    { code: 'it', name: 'Italiano' },
    { code: 'ru', name: 'Русский' },
  ];

  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

  return (
    <div 
      className={cn(
        "fixed inset-0 bg-background z-50 flex flex-col items-center justify-between overflow-y-auto overflow-x-hidden select-none transition-colors duration-300",
        customBg && "bg-cover bg-center bg-no-repeat"
      )}
      style={{
        ...(customBg ? { backgroundImage: `url(${customBg})` } : {}),
        paddingTop: 'max(1.5rem, calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 1rem))',
        paddingBottom: 'max(1.5rem, calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 1rem))',
        paddingLeft: 'max(1rem, calc(var(--safe-area-inset-left, env(safe-area-inset-left, 0px)) + 1rem))',
        paddingRight: 'max(1rem, calc(var(--safe-area-inset-right, env(safe-area-inset-right, 0px)) + 1rem))',
      }}
    >
      {customBg && (
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundColor: isDarkMode ? '#000000' : '#ffffff',
            opacity: isDarkMode ? (bgDim / 100) : (bgDim * 0.4 / 100),
            backdropFilter: 'blur(2px)'
          }}
        />
      )}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg flex flex-col items-center h-full flex-grow my-auto justify-between gap-4 sm:gap-6 md:gap-8 py-4"
      >
        <div className="w-full flex flex-col items-center gap-2">
          {isSettingUp && (
            <div className="mb-2 sm:mb-4 flex justify-center w-full">
              <Select value={i18n.language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[160px] sm:w-[180px] md:w-[200px] bg-muted/50 border-none h-9 sm:h-10 text-xs sm:text-sm">
                  <Languages className="w-4 h-4 mr-2 shrink-0" />
                  <SelectValue placeholder={t('language')} />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-22 md:h-22 lg:w-24 lg:h-24 bg-primary/10 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-3 sm:mb-4 overflow-hidden shadow-inner transition-all duration-300">
              <img src="/icon.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-foreground transition-all duration-300">
              {isSettingUp 
                ? (setupStep === 1 ? t('set_passcode') : t('confirm_passcode_title'))
                : t('enter_passcode')}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base mt-1 max-w-[220px] sm:max-w-[280px] md:max-w-[340px] leading-relaxed transition-all duration-300">
              {isSettingUp 
                ? t('setup_passcode_desc')
                : t('locked_desc')}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center w-full gap-6 sm:gap-8 md:gap-10">
          <div className="flex gap-3 sm:gap-4 md:gap-5">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={cn(
                  "w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full border-2 transition-all duration-200",
                  passcode.length > i 
                    ? "bg-primary border-primary scale-110" 
                    : "border-muted-foreground/30"
                )}
              />
            ))}
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-destructive text-xs sm:text-sm md:text-base font-medium flex items-center gap-1.5 absolute -mt-6 sm:-mt-7"
            >
              <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 shrink-0" />
              {isSettingUp ? t('passcodes_dont_match') : t('incorrect_passcode')}
            </motion.p>
          )}

          <div className="grid grid-cols-3 gap-x-4 sm:gap-x-6 md:gap-x-8 gap-y-3 sm:gap-y-4 md:gap-y-6 w-full px-2 sm:px-4">
            {numbers.map((num, i) => {
              if (num === '') return <div key={i} />;
              if (num === 'back') {
                return (
                  <Button
                    key={i}
                    variant="ghost"
                    size="icon"
                    className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-22 lg:w-22 rounded-full mx-auto transition-transform active:scale-95"
                    onClick={handleBackspace}
                  >
                    <Delete className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                  </Button>
                );
              }
              return (
                <Button
                  key={i}
                  variant="outline"
                  className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-22 lg:w-22 text-xl sm:text-2xl md:text-3xl font-semibold rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-150 mx-auto border-muted-foreground/20 active:scale-95"
                  onClick={() => handleNumberClick(num)}
                >
                  {num}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="w-full flex flex-col items-center gap-1.5 pt-4">
          <Button
            variant="ghost"
            size="lg"
            className="text-muted-foreground flex items-center gap-2 text-sm sm:text-base md:text-lg h-12 sm:h-14 md:h-16 px-6 sm:px-8 rounded-full hover:bg-muted/50"
            onClick={handleFingerprintUnlock}
          >
            <Fingerprint className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 shrink-0" />
            {t('use_fingerprint')}
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="text-xs sm:text-sm md:text-base text-muted-foreground/70 hover:text-muted-foreground transition-colors underline underline-offset-2 cursor-pointer py-3 mt-2"
              >
                {t('privacy_terms')}
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-xs sm:max-w-md md:max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  {t('freeware_title')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed py-1">
                <section className="bg-muted/40 p-2.5 rounded-lg border border-border/50">
                  <h4 className="font-semibold text-foreground text-xs mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                    {t('freeware_license')}
                  </h4>
                  <p>
                    {t('freeware_desc')}
                  </p>
                </section>

                <section className="bg-muted/40 p-2.5 rounded-lg border border-border/50">
                  <h4 className="font-semibold text-foreground text-xs mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
                    {t('privacy_policy')}
                  </h4>
                  <ul className="list-disc pl-3.5 space-y-1 mt-1 text-[11px]">
                    <li>{t('privacy_point_1')}</li>
                    <li>{t('privacy_point_2')}</li>
                    <li>{t('privacy_point_3')}</li>
                    <li>{t('privacy_point_4')}</li>
                  </ul>
                </section>
              </div>
              <DialogFooter showCloseButton />
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>
    </div>
  );
}
