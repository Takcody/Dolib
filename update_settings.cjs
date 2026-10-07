const fs = require('fs');
let code = fs.readFileSync('src/components/LibraryView.tsx', 'utf8');

const selectTriggerRegex = /<SelectTrigger className="w-full bg-muted\/30">\s*<SelectValue \/>\s*<\/SelectTrigger>/;

const replacement = `<SelectTrigger className="w-full h-11 bg-muted/30">
                        <SelectValue>
                          {settings?.autoLockTime === 0 && t('auto_lock_never', 'Never')}
                          {(settings?.autoLockTime === undefined || settings?.autoLockTime === -1) && t('auto_lock_minimize', 'Immediately upon minimize')}
                          {settings?.autoLockTime === 60000 && t('auto_lock_1m', '1 minute')}
                          {settings?.autoLockTime === 120000 && t('auto_lock_2m', '2 minutes')}
                          {settings?.autoLockTime === 300000 && t('auto_lock_5m', '5 minutes')}
                          {settings?.autoLockTime === 600000 && t('auto_lock_10m', '10 minutes')}
                          {settings?.autoLockTime === 1800000 && t('auto_lock_30m', '30 minutes')}
                        </SelectValue>
                      </SelectTrigger>`;

code = code.replace(selectTriggerRegex, replacement);

fs.writeFileSync('src/components/LibraryView.tsx', code);
console.log('Successfully updated SelectValue in LibraryView.tsx');
