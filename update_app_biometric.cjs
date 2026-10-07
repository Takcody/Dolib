const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const handleVis = \(\) => \{\n      if \(localStorage\.getItem\('biometricActive'\) === 'true'\) return;/g,
  "const handleVis = () => {\n      // Don't log background time if biometric modal is showing\n      if (localStorage.getItem('biometricActive') === 'true') return;"
);

code = code.replace(
  /const handleAppStateChange = async \(\{ isActive \}: \{ isActive: boolean \}\) => \{\n      if \(localStorage\.getItem\('biometricActive'\) === 'true'\) return;/g,
  `const handleAppStateChange = async ({ isActive }: { isActive: boolean }) => {
      // If we are coming back from a biometric prompt, don't re-lock.
      if (localStorage.getItem('biometricActive') === 'true') {
        if (isActive) {
           // We're back in the app, the biometric promise will resolve momentarily,
           // we MUST clear the background timer so we don't accidentally lock immediately after.
           localStorage.removeItem('lastBackgroundTime');
        }
        return;
      }`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed App.tsx biometric bypass logic.');
