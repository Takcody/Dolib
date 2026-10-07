const fs = require('fs');

// App.tsx Fix
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const handleAppStateChange = async[\s\S]*?const listener = CapApp\.addListener/m;
const replacement = `const handleAppStateChange = async ({ isActive }: { isActive: boolean }) => {
      if (isActive) {
        if (localStorage.getItem('biometricActive') === 'true') {
          localStorage.removeItem('biometricActive');
          localStorage.removeItem('lastBackgroundTime');
          return;
        }

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
          localStorage.removeItem('lastBackgroundTime');
        }
      } else {
        if (localStorage.getItem('biometricActive') !== 'true') {
          localStorage.setItem('lastBackgroundTime', Date.now().toString());
        }
      }
    };

    const listener = CapApp.addListener`;

appCode = appCode.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', appCode);


// LibraryView Toast Fix
let libCode = fs.readFileSync('src/components/LibraryView.tsx', 'utf8');
libCode = libCode.replace(/toast\.success\(t\('settings'\) \+ ' ' \+ t\('update', 'Updated'\)\);/g, "toast.success(t('settings_updated', 'Settings updated!'));");
fs.writeFileSync('src/components/LibraryView.tsx', libCode);

console.log('App.tsx and LibraryView.tsx patched.');
