const fs = require('fs');

const path = 'src/components/LibraryView.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /onValueChange=\{\(v\) => db\.settings\.update\('main', \{ autoLockTime: parseInt\(v\) \}\)\}/;

const replacement = `onValueChange={(v) => {
                      db.settings.update('main', { autoLockTime: parseInt(v) });
                      toast.success(t('settings') + ' ' + t('update', 'Updated'));
                    }}`;

code = code.replace(regex, replacement);

fs.writeFileSync(path, code);
console.log('Added toast for auto lock update.');
