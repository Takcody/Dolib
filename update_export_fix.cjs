const fs = require('fs');
let code = fs.readFileSync('src/components/LibraryView.tsx', 'utf8');
code = code.replace(/Choose an export mode\. For large libraries \(hundreds or thousands of items\), the <strong>Metadata Only<\/strong> backup is recommended\s*for small file size and fast sharing\./g, '{t(\'export_mode_desc\')}');
fs.writeFileSync('src/components/LibraryView.tsx', code);
console.log('Fixed export description.');
