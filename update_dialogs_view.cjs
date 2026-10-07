const fs = require('fs');
let code = fs.readFileSync('src/components/LibraryView.tsx', 'utf8');

// Replace Export text
code = code.replace(
  /<p className="text-xs text-muted-foreground leading-relaxed">\s*Choose an export mode\. For large libraries \(hundreds or thousands of items\), the <strong>Metadata Only<\/strong> backup is recommended\nfor small file size and fast sharing\.\s*<\/p>/,
  '<p className="text-xs text-muted-foreground leading-relaxed">\n                {t(\'export_mode_desc\')}\n              </p>'
);

code = code.replace(
  /<div className="font-semibold text-xs">Compact Backup \(Metadata Only\)<\/div>/,
  '<div className="font-semibold text-xs">{t(\'export_compact_title\')}</div>'
);

code = code.replace(
  /<div className="text-\[11px\] text-muted-foreground font-normal">Lightweight JSON file \(~100KB for 1,000 books\)\. Fast & efficient\.<\/div>/,
  '<div className="text-[11px] text-muted-foreground font-normal">{t(\'export_compact_desc\')}</div>'
);

code = code.replace(
  /<div className="font-semibold text-xs">Full Archive \(With Cover Images\)<\/div>/,
  '<div className="font-semibold text-xs">{t(\'export_full_title\')}</div>'
);

code = code.replace(
  /<div className="text-\[11px\] text-muted-foreground font-normal">Includes full base64 cover images for complete offline backup\.<\/div>/,
  '<div className="text-[11px] text-muted-foreground font-normal">{t(\'export_full_desc\')}</div>'
);

// Replace Import text
code = code.replace(
  /<p className="text-xs text-muted-foreground">\s*Import books from a JSON backup file or scan a library QR code directly using your camera\.\s*<\/p>/,
  '<p className="text-xs text-muted-foreground">\n                {t(\'import_new_desc\')}\n              </p>'
);

code = code.replace(
  /<span>Scan QR Code to Import<\/span>/,
  '<span>{t(\'scan_qr_import\')}</span>'
);

code = code.replace(
  /<span className="bg-popover px-2 text-muted-foreground">OR UPLOAD FILE<\/span>/,
  '<span className="bg-popover px-2 text-muted-foreground">{t(\'or_upload_file\')}</span>'
);

fs.writeFileSync('src/components/LibraryView.tsx', code);
console.log('Successfully updated translations in LibraryView.tsx');
