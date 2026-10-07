const fs = require('fs');

const path = 'src/lib/i18n.ts';
let code = fs.readFileSync(path, 'utf8');

const translations = {
  en: {
    export_mode_desc: "Choose an export mode. For large libraries (hundreds or thousands of items), the Metadata Only backup is recommended for small file size and fast sharing.",
    export_compact_title: "Compact Backup (Metadata Only)",
    export_compact_desc: "Lightweight JSON file (~100KB for 1,000 books). Fast & efficient.",
    export_full_title: "Full Archive (With Cover Images)",
    export_full_desc: "Includes full base64 cover images for complete offline backup.",
    import_new_desc: "Import books from a JSON backup file or scan a library QR code directly using your camera.",
    scan_qr_import: "Scan QR Code to Import",
    or_upload_file: "OR UPLOAD FILE"
  },
  ja: {
    export_mode_desc: "エクスポートモードを選択してください。大規模なライブラリの場合は、ファイルサイズが小さく共有が早い「メタデータのみ」のバックアップを推奨します。",
    export_compact_title: "コンパクトバックアップ（メタデータのみ）",
    export_compact_desc: "軽量なJSONファイル（1000冊で約100KB）。高速で効率的です。",
    export_full_title: "完全なアーカイブ（表紙画像付き）",
    export_full_desc: "完全なオフラインバックアップのためのbase64形式の表紙画像を含みます。",
    import_new_desc: "JSONバックアップファイルから本をインポートするか、カメラを使ってライブラリのQRコードを直接スキャンします。",
    scan_qr_import: "QRコードをスキャンしてインポート",
    or_upload_file: "またはファイルをアップロード"
  },
  es: {
    export_mode_desc: "Elija un modo de exportación. Para bibliotecas grandes, se recomienda la copia de seguridad de Solo Metadatos por su tamaño reducido y rapidez.",
    export_compact_title: "Copia de seguridad compacta (Solo metadatos)",
    export_compact_desc: "Archivo JSON ligero (~100KB por 1000 libros). Rápido y eficiente.",
    export_full_title: "Archivo completo (Con portadas)",
    export_full_desc: "Incluye las imágenes de portada en base64 para una copia de seguridad sin conexión completa.",
    import_new_desc: "Importe libros desde un archivo de copia de seguridad JSON o escanee un código QR directamente con su cámara.",
    scan_qr_import: "Escanear código QR para importar",
    or_upload_file: "O SUBIR ARCHIVO"
  },
  zh: {
    export_mode_desc: "选择导出模式。对于大型库，建议使用“仅元数据”备份，以减小文件大小并加快共享速度。",
    export_compact_title: "紧凑备份（仅元数据）",
    export_compact_desc: "轻量级 JSON 文件（1000本书约100KB）。快速高效。",
    export_full_title: "完整存档（含封面图像）",
    export_full_desc: "包含完整的 base64 封面图像，用于完整的离线备份。",
    import_new_desc: "从 JSON 备份文件导入书籍，或直接使用相机扫描库 QR 码。",
    scan_qr_import: "扫描二维码导入",
    or_upload_file: "或上传文件"
  },
  fr: {
    export_mode_desc: "Choisissez un mode d'exportation. Pour les grandes bibliothèques, la sauvegarde Métadonnées Uniquement est recommandée pour sa taille réduite.",
    export_compact_title: "Sauvegarde compacte (Métadonnées uniquement)",
    export_compact_desc: "Fichier JSON léger (~100Ko pour 1000 livres). Rapide et efficace.",
    export_full_title: "Archive complète (Avec images de couverture)",
    export_full_desc: "Inclut les images de couverture en base64 pour une sauvegarde hors ligne complète.",
    import_new_desc: "Importez des livres à partir d'un fichier de sauvegarde JSON ou scannez directement un code QR avec votre caméra.",
    scan_qr_import: "Scanner un code QR pour importer",
    or_upload_file: "OU TÉLÉCHARGER UN FICHIER"
  },
  de: {
    export_mode_desc: "Wählen Sie einen Exportmodus. Für große Bibliotheken wird das Nur-Metadaten-Backup empfohlen, da es klein und schnell zu teilen ist.",
    export_compact_title: "Kompaktes Backup (Nur Metadaten)",
    export_compact_desc: "Leichte JSON-Datei (~100KB für 1000 Bücher). Schnell & effizient.",
    export_full_title: "Vollständiges Archiv (Mit Coverbildern)",
    export_full_desc: "Enthält vollständige Base64-Coverbilder für ein komplettes Offline-Backup.",
    import_new_desc: "Importieren Sie Bücher aus einer JSON-Backup-Datei oder scannen Sie einen Bibliotheks-QR-Code direkt mit Ihrer Kamera.",
    scan_qr_import: "QR-Code scannen zum Importieren",
    or_upload_file: "ODER DATEI HOCHLADEN"
  },
  ko: {
    export_mode_desc: "내보내기 모드를 선택하세요. 대규모 라이브러리의 경우 파일 크기가 작고 공유가 빠른 메타데이터 전용 백업을 권장합니다.",
    export_compact_title: "컴팩트 백업 (메타데이터 전용)",
    export_compact_desc: "가벼운 JSON 파일 (책 1000권에 약 100KB). 빠르고 효율적입니다.",
    export_full_title: "전체 아카이브 (표지 이미지 포함)",
    export_full_desc: "완전한 오프라인 백업을 위한 전체 base64 표지 이미지를 포함합니다.",
    import_new_desc: "JSON 백업 파일에서 책을 가져오거나 카메라를 사용하여 라이브러리 QR 코드를 직접 스캔합니다.",
    scan_qr_import: "QR 코드를 스캔하여 가져오기",
    or_upload_file: "또는 파일 업로드"
  },
  pt: {
    export_mode_desc: "Escolha um modo de exportação. Para bibliotecas grandes, o backup Apenas Metadados é recomendado pelo tamanho reduzido.",
    export_compact_title: "Backup compacto (Apenas metadados)",
    export_compact_desc: "Arquivo JSON leve (~100KB para 1000 livros). Rápido e eficiente.",
    export_full_title: "Arquivo completo (Com imagens de capa)",
    export_full_desc: "Inclui imagens de capa em base64 completas para backup offline total.",
    import_new_desc: "Importe livros de um arquivo de backup JSON ou escaneie um código QR diretamente com sua câmera.",
    scan_qr_import: "Escanear código QR para importar",
    or_upload_file: "OU ENVIAR ARQUIVO"
  },
  it: {
    export_mode_desc: "Scegli una modalità di esportazione. Per librerie grandi, si consiglia il backup Solo Metadati per le dimensioni ridotte e la condivisione rapida.",
    export_compact_title: "Backup compatto (Solo metadati)",
    export_compact_desc: "File JSON leggero (~100KB per 1000 libri). Veloce ed efficiente.",
    export_full_title: "Archivio completo (Con immagini di copertina)",
    export_full_desc: "Include immagini di copertina in base64 per un backup offline completo.",
    import_new_desc: "Importa libri da un file di backup JSON o scansiona un codice QR direttamente con la tua fotocamera.",
    scan_qr_import: "Scansiona codice QR per importare",
    or_upload_file: "O CARICA FILE"
  },
  ru: {
    export_mode_desc: "Выберите режим экспорта. Для больших библиотек рекомендуется резервная копия «Только метаданные» из-за небольшого размера.",
    export_compact_title: "Компактная резервная копия (только метаданные)",
    export_compact_desc: "Легкий JSON-файл (~100 КБ на 1000 книг). Быстро и эффективно.",
    export_full_title: "Полный архив (с обложками)",
    export_full_desc: "Включает полные изображения обложек в формате base64 для полного автономного резервного копирования.",
    import_new_desc: "Импортируйте книги из файла резервной копии JSON или отсканируйте QR-код напрямую с помощью камеры.",
    scan_qr_import: "Сканировать QR-код для импорта",
    or_upload_file: "ИЛИ ЗАГРУЗИТЬ ФАЙЛ"
  }
};

for (const [lang, keys] of Object.entries(translations)) {
  const langRegex = new RegExp("(^" + lang + ": \\{\\s*translation: \\{\\s*[\\s\\S]*?\"auto_lock_30m\": \"[^\"]+\")", 'm');

  const replacementStr =
    ',\n      "export_mode_desc": "' + keys.export_mode_desc + '",\n' +
    '      "export_compact_title": "' + keys.export_compact_title + '",\n' +
    '      "export_compact_desc": "' + keys.export_compact_desc + '",\n' +
    '      "export_full_title": "' + keys.export_full_title + '",\n' +
    '      "export_full_desc": "' + keys.export_full_desc + '",\n' +
    '      "import_new_desc": "' + keys.import_new_desc + '",\n' +
    '      "scan_qr_import": "' + keys.scan_qr_import + '",\n' +
    '      "or_upload_file": "' + keys.or_upload_file + '"';

  code = code.replace(langRegex, (match, p1) => {
    return p1 + replacementStr;
  });
}

fs.writeFileSync(path, code);
console.log('Successfully updated i18n.ts with translated keys for dialogs.');
