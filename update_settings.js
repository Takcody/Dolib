const fs = require('fs');
let code = fs.readFileSync('src/components/LibraryView.tsx', 'utf8');

const securityRegex = /<div className="space-y-4">\s*<h3 className="text-sm font-medium">\{t\('security'\)\}<\/h3>\s*<div className="space-y-2">[\s\S]*?<Button className="w-full" onClick=\{handleUpdatePasscode\}>[\s\S]*?<\/Button>\s*<\/div>\s*<\/div>/;

const matchSecurity = code.match(securityRegex);
if (!matchSecurity) {
    console.error('Security section not found');
    process.exit(1);
}
const securitySection = matchSecurity[0];

// Remove security section from current place
code = code.replace(securitySection, '');

// The auto-lock dropdown to append to security section
const autoLockUI = `
                  <div className="pt-4 border-t border-border/40 space-y-2">
                    <p className="text-sm font-medium">{t('auto_lock', 'Auto-Lock Library')}</p>
                    <Select
                      value={settings?.autoLockTime?.toString() || '-1'}
                      onValueChange={(v) => db.settings.update('main', { autoLockTime: parseInt(v) })}
                    >
                      <SelectTrigger className="w-full bg-muted/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">{t('auto_lock_never', 'Never')}</SelectItem>
                        <SelectItem value="-1">{t('auto_lock_minimize', 'Immediately upon minimize')}</SelectItem>
                        <SelectItem value="60000">{t('auto_lock_1m', '1 minute')}</SelectItem>
                        <SelectItem value="120000">{t('auto_lock_2m', '2 minutes')}</SelectItem>
                        <SelectItem value="300000">{t('auto_lock_5m', '5 minutes')}</SelectItem>
                        <SelectItem value="600000">{t('auto_lock_10m', '10 minutes')}</SelectItem>
                        <SelectItem value="1800000">{t('auto_lock_30m', '30 minutes')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
`;

const newSecuritySection = securitySection.replace('</div>\n              </div>', '</div>\n' + autoLockUI + '\n              </div>');

const aboutRegex = /<div className="pt-4 border-t space-y-2">\s*<h3 className="text-sm font-medium">\{t\('about'\)\}<\/h3>/;
code = code.replace(aboutRegex, newSecuritySection + '\n\n              <div className="pt-4 border-t space-y-2">\n                <h3 className="text-sm font-medium">{t(\'about\')}</h3>');

fs.writeFileSync('src/components/LibraryView.tsx', code);
console.log('Successfully updated Settings in LibraryView.tsx');
