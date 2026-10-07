const fs = require('fs');
let code = fs.readFileSync('android/app/build.gradle', 'utf8');
code = code.replace(/project\.hasProperty\('APP_VERSION_CODE'\) \? project\.APP_VERSION_CODE\.toInteger\(\) : 4/g, "project.hasProperty('APP_VERSION_CODE') ? project.APP_VERSION_CODE.toInteger() : 5");
fs.writeFileSync('android/app/build.gradle', code);
console.log('Bumped versionCode to 5.');
