const fs = require('fs');

const path = 'src/lib/i18n.ts';
let code = fs.readFileSync(path, 'utf8');

const translations = {
  en: {
    sort_author: "Author",
    sort_parody: "Parody / Category",
    auto_lock: "Auto-Lock Library",
    auto_lock_never: "Never",
    auto_lock_minimize: "Immediately upon minimize",
    auto_lock_1m: "1 minute",
    auto_lock_2m: "2 minutes",
    auto_lock_5m: "5 minutes",
    auto_lock_10m: "10 minutes",
    auto_lock_30m: "30 minutes",
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
    sort_author: "作者",
    sort_parody: "パロディ / カテゴリ",
    auto_lock: "ライブラリの自動ロック",
    auto_lock_never: "しない",
    auto_lock_minimize: "最小化時にすぐ",
    auto_lock_1m: "1分",
    auto_lock_2m: "2分",
    auto_lock_5m: "5分",
    auto_lock_10m: "10分",
    auto_lock_30m: "30分",
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
    sort_author: "Autor",
    sort_parody: "Parodia / Categoría",
    auto_lock: "Bloqueo automático",
    auto_lock_never: "Nunca",
    auto_lock_minimize: "Inmediatamente al minimizar",
    auto_lock_1m: "1 minuto",
    auto_lock_2m: "2 minutos",
    auto_lock_5m: "5 minutos",
    auto_lock_10m: "10 minutos",
    auto_lock_30m: "30 minutos",
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
    sort_author: "作者",
    sort_parody: "同人 / 类别",
    auto_lock: "自动锁定库",
    auto_lock_never: "从不",
    auto_lock_minimize: "最小化时立即",
    auto_lock_1m: "1分钟",
    auto_lock_2m: "2分钟",
    auto_lock_5m: "5分钟",
    auto_lock_10m: "10分钟",
    auto_lock_30m: "30分钟",
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
    sort_author: "Auteur",
    sort_parody: "Parodie / Catégorie",
    auto_lock: "Verrouillage auto",
    auto_lock_never: "Jamais",
    auto_lock_minimize: "Immédiatement",
    auto_lock_1m: "1 minute",
    auto_lock_2m: "2 minutes",
    auto_lock_5m: "5 minutes",
    auto_lock_10m: "10 minutes",
    auto_lock_30m: "30 minutes",
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
    sort_author: "Autor",
    sort_parody: "Parodie / Kategorie",
    auto_lock: "Automatisch sperren",
    auto_lock_never: "Nie",
    auto_lock_minimize: "Sofort beim Minimieren",
    auto_lock_1m: "1 Minute",
    auto_lock_2m: "2 Minuten",
    auto_lock_5m: "5 Minuten",
    auto_lock_10m: "10 Minuten",
    auto_lock_30m: "30 Minuten",
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
    sort_author: "작가",
    sort_parody: "패러디 / 카테고리",
    auto_lock: "자동 잠금",
    auto_lock_never: "사용 안 함",
    auto_lock_minimize: "최소화 시 즉시",
    auto_lock_1m: "1분",
    auto_lock_2m: "2분",
    auto_lock_5m: "5분",
    auto_lock_10m: "10분",
    auto_lock_30m: "30분",
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
    sort_author: "Autor",
    sort_parody: "Paródia / Categoria",
    auto_lock: "Bloqueio automático",
    auto_lock_never: "Nunca",
    auto_lock_minimize: "Ao minimizar",
    auto_lock_1m: "1 minuto",
    auto_lock_2m: "2 minutos",
    auto_lock_5m: "5 minutos",
    auto_lock_10m: "10 minutos",
    auto_lock_30m: "30 minutos",
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
    sort_author: "Autore",
    sort_parody: "Parodia / Categoria",
    auto_lock: "Blocco automatico",
    auto_lock_never: "Mai",
    auto_lock_minimize: "Alla riduzione",
    auto_lock_1m: "1 minuto",
    auto_lock_2m: "2 minuti",
    auto_lock_5m: "5 minuti",
    auto_lock_10m: "10 minuti",
    auto_lock_30m: "30 minuti",
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
    sort_author: "Автор",
    sort_parody: "Пародия / Категория",
    auto_lock: "Автоблокировка",
    auto_lock_never: "Никогда",
    auto_lock_minimize: "При сворачивании",
    auto_lock_1m: "1 минута",
    auto_lock_2m: "2 минуты",
    auto_lock_5m: "5 минут",
    auto_lock_10m: "10 минут",
    auto_lock_30m: "30 минут",
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

const objStartStr = 'const resources = ';
let objStartIdx = code.indexOf(objStartStr);
let objStr = code.substring(objStartIdx + objStartStr.length, code.indexOf('i18n\n'));
objStr = objStr.trim().replace(/;$/, '');

// Parse the JS object loosely
const script = 'return ' + objStr + ';';
const fn = new Function(script);
const resources = fn();

for (const [lang, translationsObj] of Object.entries(translations)) {
  if (resources[lang] && resources[lang].translation) {
    // Delete any old appended ones if they exist (they might be duplicated)
    Object.keys(translations.en).forEach(k => delete resources[lang].translation[k]);
    // Assign new ones
    Object.assign(resources[lang].translation, translationsObj);
  }
}

const newObjStr = JSON.stringify(resources, null, 2);

code = `import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = ${newObjStr};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
`;

fs.writeFileSync(path, code);
console.log('Cleanly updated i18n.ts with ALL translated keys for all languages using object parsing.');
