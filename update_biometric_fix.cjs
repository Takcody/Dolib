const fs = require('fs');

let lockScreenCode = fs.readFileSync('src/components/LockScreen.tsx', 'utf8');

lockScreenCode = lockScreenCode.replace(
  /await NativeBiometric\.verifyIdentity\(\{/g,
  "localStorage.setItem('biometricActive', 'true');\n      await NativeBiometric.verifyIdentity({"
);

lockScreenCode = lockScreenCode.replace(
  /onUnlock\(\);\n    \} catch/g,
  "localStorage.removeItem('biometricActive');\n      onUnlock();\n    } catch"
);

lockScreenCode = lockScreenCode.replace(
  /\} catch \(err: any\) \{\n      console\.log\('Biometric verification canceled/g,
  "} catch (err: any) {\n      localStorage.removeItem('biometricActive');\n      console.log('Biometric verification canceled"
);

fs.writeFileSync('src/components/LockScreen.tsx', lockScreenCode);

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace(
  /const handleVis = \(\) => \{\n      if \(document\.hidden\)/g,
  "const handleVis = () => {\n      if (localStorage.getItem('biometricActive') === 'true') return;\n      if (document.hidden)"
);

appCode = appCode.replace(
  /const handleAppStateChange = async \(\{ isActive \}: \{ isActive: boolean \}\) => \{\n      if \(\!isActive\) \{/g,
  "const handleAppStateChange = async ({ isActive }: { isActive: boolean }) => {\n      if (localStorage.getItem('biometricActive') === 'true') return;\n      if (!isActive) {"
);

fs.writeFileSync('src/App.tsx', appCode);

console.log('Patched biometric race conditions.');
