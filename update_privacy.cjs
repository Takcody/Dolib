const fs = require('fs');

const path = 'src/lib/i18n.ts';
let code = fs.readFileSync(path, 'utf8');

const privacyTranslations = {
  ja: {
    privacy_terms: "フリーウェアライセンスとプライバシーポリシー",
    freeware_title: "フリーウェアライセンスとプライバシーポリシー",
    freeware_license: "フリーウェアライセンス",
    freeware_desc: "Dolibは、いかなる種類の保証もない「現状有姿」で提供されるフリーソフトウェアです。個人的なライブラリを自由に使用、共有、バックアップする許可が与えられます。",
    privacy_policy: "プライバシーとオフラインポリシー",
    privacy_point_1: "100%ローカルストレージ：すべての本のタイトル、メタデータ、写真、カスタム背景、ロック設定は、デバイスのローカルストレージ内に保持されます。",
    privacy_point_2: "データ送信ゼロ：Dolibは、外部サーバーやクラウドサービスにユーザーデータを送信、アップロード、同期、または送信しません。",
    privacy_point_3: "カメラの使用：カメラへのアクセスは、バーコード/ISBNのスキャンと本の表紙の撮影のためにスマホ上でローカルにのみ使用されます。動画や写真がデバイスから出ることはありません。",
    privacy_point_4: "追跡や分析なし：このアプリケーションには、広告トラッカー、分析ツール、サードパーティのテレメトリは含まれていません。"
  },
  es: {
    privacy_terms: "Licencia de freeware y política de privacidad",
    freeware_title: "Licencia de freeware y política de privacidad",
    freeware_license: "Licencia de freeware",
    freeware_desc: "Dolib es software gratuito que se proporciona \"tal cual\" sin garantía de ningún tipo. Se le concede permiso para usar, compartir y realizar copias de seguridad de su biblioteca personal libremente.",
    privacy_policy: "Política de privacidad y sin conexión",
    privacy_point_1: "Almacenamiento 100% local: todos los títulos de libros, metadatos, fotos, fondos personalizados y configuraciones de bloqueo permanecen en el almacenamiento local de su dispositivo.",
    privacy_point_2: "Cero transmisión de datos: Dolib no envía, carga, sincroniza ni transmite ningún dato del usuario a servidores externos o servicios en la nube.",
    privacy_point_3: "Uso de la cámara: el acceso a la cámara se usa estrictamente a nivel local en su teléfono para escanear códigos de barras/ISBN y tomar fotos de portadas. Ningún video o foto sale de su dispositivo.",
    privacy_point_4: "Sin seguimiento ni análisis: esta aplicación no contiene rastreadores de anuncios, herramientas de análisis ni telemetría de terceros."
  },
  zh: {
    privacy_terms: "免费软件许可和隐私政策",
    freeware_title: "免费软件许可和隐私政策",
    freeware_license: "免费软件许可",
    freeware_desc: "Dolib 是一款“按原样”提供的免费软件，没有任何形式的保证。我们授权您自由使用、共享和备份您的个人库。",
    privacy_policy: "隐私和离线政策",
    privacy_point_1: "100% 本地存储：所有书名、元数据、照片、自定义背景和锁定设置都保留在您设备的本地存储中。",
    privacy_point_2: "零数据传输：Dolib 不会向外部服务器或云服务发送、上传、同步或传输任何用户数据。",
    privacy_point_3: "相机使用：相机访问权限严格用于本地扫描条形码/ISBN和拍摄书籍封面。视频或照片绝不会离开您的设备。",
    privacy_point_4: "无跟踪或分析：此应用程序不包含广告跟踪器、分析工具或第三方遥测。"
  },
  fr: {
    privacy_terms: "Licence de logiciel gratuit et politique de confidentialité",
    freeware_title: "Licence de logiciel gratuit et politique de confidentialité",
    freeware_license: "Licence de logiciel gratuit",
    freeware_desc: "Dolib est un logiciel gratuit fourni \"en l'état\" sans aucune garantie. Vous êtes autorisé à utiliser, partager et sauvegarder librement votre bibliothèque personnelle.",
    privacy_policy: "Politique de confidentialité et hors ligne",
    privacy_point_1: "Stockage 100% local : Tous les titres de livres, métadonnées, photos, arrière-plans personnalisés et paramètres de verrouillage restent sur votre appareil dans le stockage local.",
    privacy_point_2: "Aucune transmission de données : Dolib n'envoie, ne télécharge, ne synchronise ni ne transmet aucune donnée utilisateur vers des serveurs externes ou des services cloud.",
    privacy_point_3: "Utilisation de la caméra : L'accès à la caméra est strictement utilisé localement sur votre téléphone pour scanner les codes-barres/ISBN et prendre des photos des couvertures. Aucune vidéo ou photo ne quitte votre appareil.",
    privacy_point_4: "Aucun suivi ni analyse : Cette application ne contient aucun traceur publicitaire, outil d'analyse ou télémétrie tierce."
  },
  de: {
    privacy_terms: "Freeware-Lizenz & Datenschutzrichtlinie",
    freeware_title: "Freeware-Lizenz & Datenschutzrichtlinie",
    freeware_license: "Freeware-Lizenz",
    freeware_desc: "Dolib ist kostenlose Software, die ohne jegliche Gewährleistung \"wie besehen\" zur Verfügung gestellt wird. Sie haben die Erlaubnis, Ihre persönliche Bibliothek frei zu nutzen, zu teilen und zu sichern.",
    privacy_policy: "Datenschutz- und Offline-Richtlinie",
    privacy_point_1: "100% lokaler Speicher: Alle Buchtitel, Metadaten, Fotos, benutzerdefinierten Hintergründe und Sperreinstellungen bleiben in der lokalen Speicherung Ihres Geräts.",
    privacy_point_2: "Null Datenübertragung: Dolib sendet, lädt, synchronisiert oder überträgt keine Benutzerdaten auf externe Server oder Cloud-Dienste.",
    privacy_point_3: "Kameranutzung: Der Kamerazugriff wird auf Ihrem Telefon ausschließlich lokal zum Scannen von Barcodes/ISBNs und Fotografieren von Buchumschlägen verwendet. Weder Videos noch Fotos verlassen Ihr Gerät.",
    privacy_point_4: "Kein Tracking oder Analytics: Diese Anwendung enthält keine Werbe-Tracker, Analyse-Tools oder Telemetrie von Drittanbietern."
  },
  ko: {
    privacy_terms: "프리웨어 라이선스 및 개인정보 보호정책",
    freeware_title: "프리웨어 라이선스 및 개인정보 보호정책",
    freeware_license: "프리웨어 라이선스",
    freeware_desc: "Dolib은 어떠한 형태의 보증도 없이 \"있는 그대로\" 제공되는 무료 소프트웨어입니다. 개인 라이브러리를 자유롭게 사용, 공유 및 백업할 수 있는 권한이 부여됩니다.",
    privacy_policy: "개인정보 보호 및 오프라인 정책",
    privacy_point_1: "100% 로컬 스토리지: 모든 책 제목, 메타데이터, 사진, 사용자 지정 배경 및 잠금 설정은 장치의 로컬 스토리지 내에 유지됩니다.",
    privacy_point_2: "데이터 전송 제로: Dolib은 외부 서버나 클라우드 서비스에 사용자 데이터를 보내거나, 업로드하거나, 동기화하거나, 전송하지 않습니다.",
    privacy_point_3: "카메라 사용: 카메라 액세스는 휴대폰에서 바코드/ISBN 스캔 및 책 표지 촬영을 위해 로컬에서만 엄격하게 사용됩니다. 비디오나 사진은 절대 기기를 벗어나지 않습니다.",
    privacy_point_4: "추적 또는 분석 없음: 이 애플리케이션에는 광고 추적기, 분석 도구 또는 타사 원격 측정 데이터가 포함되어 있지 않습니다."
  },
  pt: {
    privacy_terms: "Licença Freeware e Política de Privacidade",
    freeware_title: "Licença Freeware e Política de Privacidade",
    freeware_license: "Licença Freeware",
    freeware_desc: "O Dolib é um software gratuito fornecido \"como está\", sem garantia de qualquer tipo. É-lhe concedida permissão para usar, partilhar e fazer backup da sua biblioteca pessoal livremente.",
    privacy_policy: "Política de Privacidade e Offline",
    privacy_point_1: "Armazenamento 100% local: Todos os títulos de livros, metadados, fotos, fundos personalizados e configurações de bloqueio permanecem no armazenamento local do seu dispositivo.",
    privacy_point_2: "Zero Transmissão de Dados: O Dolib não envia, faz upload, sincroniza ou transmite quaisquer dados do utilizador para servidores externos ou serviços cloud.",
    privacy_point_3: "Utilização da Câmara: O acesso à câmara é estritamente usado localmente no seu telemóvel para digitalizar códigos de barras/ISBN e tirar fotos das capas dos livros. Nenhum vídeo ou foto sai do seu dispositivo.",
    privacy_point_4: "Sem Rastreamento ou Analytics: Esta aplicação não contém rastreadores de anúncios, ferramentas de análise ou telemetria de terceiros."
  },
  it: {
    privacy_terms: "Licenza Freeware e Informativa sulla Privacy",
    freeware_title: "Licenza Freeware e Informativa sulla Privacy",
    freeware_license: "Licenza Freeware",
    freeware_desc: "Dolib è un software gratuito fornito \"così com'è\" senza garanzie di alcun tipo. Ti è concesso il permesso di utilizzare, condividere e fare il backup della tua libreria personale liberamente.",
    privacy_policy: "Informativa sulla privacy e offline",
    privacy_point_1: "Archiviazione 100% locale: Tutti i titoli dei libri, metadati, foto, sfondi personalizzati e impostazioni di blocco rimangono sul tuo dispositivo nello spazio di archiviazione locale.",
    privacy_point_2: "Nessuna trasmissione dati: Dolib non invia, carica, sincronizza o trasmette alcun dato dell'utente a server esterni o servizi cloud.",
    privacy_point_3: "Utilizzo fotocamera: L'accesso alla fotocamera viene utilizzato esclusivamente a livello locale sul telefono per scansionare codici a barre/ISBN e fotografare le copertine dei libri. Nessun video o foto lascia mai il tuo dispositivo.",
    privacy_point_4: "Nessun tracciamento o analisi: Questa applicazione non contiene tracciatori pubblicitari, strumenti di analisi o telemetria di terze parti."
  },
  ru: {
    privacy_terms: "Лицензия Freeware и Политика конфиденциальности",
    freeware_title: "Лицензия Freeware и Политика конфиденциальности",
    freeware_license: "Лицензия Freeware",
    freeware_desc: "Dolib — это бесплатное программное обеспечение, предоставляемое «как есть» без каких-либо гарантий. Вы получаете разрешение свободно использовать, делиться и создавать резервные копии своей личной библиотеки.",
    privacy_policy: "Политика конфиденциальности и автономной работы",
    privacy_point_1: "100% локальное хранение: все названия книг, метаданные, фотографии, пользовательские фоны и настройки блокировки остаются на вашем устройстве в локальном хранилище.",
    privacy_point_2: "Нулевая передача данных: Dolib не отправляет, не загружает, не синхронизирует и не передает какие-либо пользовательские данные на внешние серверы или в облачные сервисы.",
    privacy_point_3: "Использование камеры: доступ к камере используется строго локально на вашем телефоне для сканирования штрих-кодов/ISBN и фотографирования обложек книг. Видео и фотографии никогда не покидают ваше устройство.",
    privacy_point_4: "Отсутствие отслеживания и аналитики: это приложение не содержит рекламных трекеров, аналитических инструментов или телеметрии сторонних разработчиков."
  }
};

const objStartStr = 'const resources = ';
let objStartIdx = code.indexOf(objStartStr);
let objStr = code.substring(objStartIdx + objStartStr.length, code.indexOf('i18n\n'));
objStr = objStr.trim().replace(/;$/, '');

const script = 'return ' + objStr + ';';
const fn = new Function(script);
const resources = fn();

for (const [lang, translationsObj] of Object.entries(privacyTranslations)) {
  if (resources[lang] && resources[lang].translation) {
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
console.log('Successfully added privacy translations for all languages.');
