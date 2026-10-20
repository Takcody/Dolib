const fs = require('fs');
const filePath = 'src/lib/i18n.ts';

const dictionary = {
  en: {
    library_stats: "Library Statistics",
    total_books: "Total Books",
    unique_authors: "Unique Artists",
    unique_circles: "Unique Circles",
    unique_parodies: "Unique Categories",
    size_distribution: "Book Size Distribution",
    collection_details: "Collection Details",
    books_with_covers: "Covers Saved",
    anthologies_count: "Anthologies",
    qr_tap_zoom: "Tap QR code to enlarge",
    qr_page_indicator: "Page {{current}} of {{total}}",
    qr_prev_page: "Previous",
    qr_next_page: "Next",
    qr_auto_play: "Auto-Play",
  },
  ja: {
    library_stats: "ライブラリ統計",
    total_books: "総本数",
    unique_authors: "作者数",
    unique_circles: "サークル数",
    unique_parodies: "カテゴリ・作品数",
    size_distribution: "本のサイズ分布",
    collection_details: "コレクション詳細",
    books_with_covers: "表紙保存数",
    anthologies_count: "合同誌数",
    qr_tap_zoom: "タップしてQRコードを拡大",
    qr_page_indicator: "ページ {{current}} / {{total}}",
    qr_prev_page: "前へ",
    qr_next_page: "次へ",
    qr_auto_play: "自動再生",
  },
  es: {
    library_stats: "Estadísticas de la biblioteca",
    total_books: "Libros totales",
    unique_authors: "Artistas únicos",
    unique_circles: "Círculos únicos",
    unique_parodies: "Categorías únicas",
    size_distribution: "Distribución de tamaños",
    collection_details: "Detalles de la colección",
    books_with_covers: "Portadas guardadas",
    anthologies_count: "Antologías",
    qr_tap_zoom: "Toca el QR para ampliar",
    qr_page_indicator: "Página {{current}} de {{total}}",
    qr_prev_page: "Anterior",
    qr_next_page: "Siguiente",
    qr_auto_play: "Auto-reproducción",
  },
  zh: {
    library_stats: "图库统计",
    total_books: "藏书总量",
    unique_authors: "作者数量",
    unique_circles: "社团数量",
    unique_parodies: "分类/原作数量",
    size_distribution: "开本尺寸分布",
    collection_details: "收藏详情",
    books_with_covers: "包含封面",
    anthologies_count: "合集/合订本",
    qr_tap_zoom: "点击二维码放大",
    qr_page_indicator: "第 {{current}} / {{total}} 页",
    qr_prev_page: "上一页",
    qr_next_page: "下一页",
    qr_auto_play: "自动播放",
  },
  fr: {
    library_stats: "Statistiques de la bibliothèque",
    total_books: "Nombre total de livres",
    unique_authors: "Artistes uniques",
    unique_circles: "Cercles uniques",
    unique_parodies: "Catégories uniques",
    size_distribution: "Distribution des formats",
    collection_details: "Détails de la collection",
    books_with_covers: "Couvertures enregistrées",
    anthologies_count: "Anthologies",
    qr_tap_zoom: "Appuyez sur le QR pour agrandir",
    qr_page_indicator: "Page {{current}} sur {{total}}",
    qr_prev_page: "Précédent",
    qr_next_page: "Suivant",
    qr_auto_play: "Lecture auto",
  },
  de: {
    library_stats: "Bibliotheksstatistiken",
    total_books: "Bücher insgesamt",
    unique_authors: "Einzigartige Künstler",
    unique_circles: "Einzigartige Zirkel",
    unique_parodies: "Einzigartige Kategorien",
    size_distribution: "Größenverteilung",
    collection_details: "Sammlungsdetails",
    books_with_covers: "Cover gespeichert",
    anthologies_count: "Anthologien",
    qr_tap_zoom: "Tippe auf QR-Code zum Vergrößern",
    qr_page_indicator: "Seite {{current}} von {{total}}",
    qr_prev_page: "Zurück",
    qr_next_page: "Weiter",
    qr_auto_play: "Auto-Wiedergabe",
  },
  ko: {
    library_stats: "라이브러리 통계",
    total_books: "총 도서 수",
    unique_authors: "작가 수",
    unique_circles: "서클 수",
    unique_parodies: "카테고리/작품 수",
    size_distribution: "도서 규격 분포",
    collection_details: "컬렉션 상세",
    books_with_covers: "표지 저장됨",
    anthologies_count: "앤솔로지 수",
    qr_tap_zoom: "터치하여 QR 코드 확대",
    qr_page_indicator: "{{current}} / {{total}} 페이지",
    qr_prev_page: "이전",
    qr_next_page: "다음",
    qr_auto_play: "자동 재생",
  },
  pt: {
    library_stats: "Estatísticas da biblioteca",
    total_books: "Total de livros",
    unique_authors: "Artistas únicos",
    unique_circles: "Círculos únicos",
    unique_parodies: "Categorias únicas",
    size_distribution: "Distribuição de tamanhos",
    collection_details: "Detalhes da coleção",
    books_with_covers: "Capas salvas",
    anthologies_count: "Antologias",
    qr_tap_zoom: "Toque no QR para ampliar",
    qr_page_indicator: "Página {{current}} de {{total}}",
    qr_prev_page: "Anterior",
    qr_next_page: "Próximo",
    qr_auto_play: "Auto-reprodução",
  },
  it: {
    library_stats: "Statistiche libreria",
    total_books: "Libri totali",
    unique_authors: "Artisti unici",
    unique_circles: "Cerchi unici",
    unique_parodies: "Categorie uniche",
    size_distribution: "Distribuzione formati",
    collection_details: "Dettagli collezione",
    books_with_covers: "Copertine salvate",
    anthologies_count: "Antologie",
    qr_tap_zoom: "Tocca il QR per ingrandire",
    qr_page_indicator: "Pagina {{current}} di {{total}}",
    qr_prev_page: "Precedente",
    qr_next_page: "Successivo",
    qr_auto_play: "Riproduzione auto",
  },
  ru: {
    library_stats: "Статистика библиотеки",
    total_books: "Всего книг",
    unique_authors: "Уникальных авторов",
    unique_circles: "Уникальных кружков",
    unique_parodies: "Уникальных категорий",
    size_distribution: "Распределение размеров",
    collection_details: "Детали коллекции",
    books_with_covers: "Обложек сохранено",
    anthologies_count: "Антологий",
    qr_tap_zoom: "Нажмите на QR для увеличения",
    qr_page_indicator: "Страница {{current}} из {{total}}",
    qr_prev_page: "Назад",
    qr_next_page: "Вперед",
    qr_auto_play: "Автопоказ",
  }
};

let content = fs.readFileSync(filePath, 'utf8');

for (const lang of Object.keys(dictionary)) {
  const langBlockRegex = new RegExp(`("${lang}":\\s*{\\s*"translation":\\s*{)([\\s\\S]*?)(^\\s*}\\s*})`, 'm');
  const match = content.match(langBlockRegex);

  if (match) {
    let blockContent = match[2];
    const langKeys = dictionary[lang];

    for (const key of Object.keys(langKeys)) {
      const val = langKeys[key];
      const keyRegex = new RegExp(`("${key}":\\s*")[^"]*(")`);

      if (keyRegex.test(blockContent)) {
        blockContent = blockContent.replace(keyRegex, `$1${val}$2`);
      } else {
        blockContent = `\n      "${key}": "${val}",` + blockContent;
      }
    }

    content = content.replace(match[0], `${match[1]}${blockContent}${match[3]}`);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Clean translation sync complete!');
