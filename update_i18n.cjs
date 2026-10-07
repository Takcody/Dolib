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
    auto_lock_30m: "30 minutes"
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
    auto_lock_30m: "30分"
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
    auto_lock_30m: "30 minutos"
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
    auto_lock_30m: "30分钟"
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
    auto_lock_30m: "30 minutes"
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
    auto_lock_30m: "30 Minuten"
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
    auto_lock_30m: "30분"
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
    auto_lock_30m: "30 minutos"
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
    auto_lock_30m: "30 minuti"
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
    auto_lock_30m: "30 минут"
  }
};

for (const [lang, keys] of Object.entries(translations)) {
  const langRegex = new RegExp("(^" + lang + ": \\{\\s*translation: \\{\\s*[\\s\\S]*?\"bg_removed\": \"[^\"]+\",\\s*)(\"sort_author\": \"[^\"]+\",\\s*\"sort_parody\": \"[^\"]+\",\\s*\"auto_lock\": \"[^\"]+\",\\s*\"auto_lock_never\": \"[^\"]+\",\\s*\"auto_lock_minimize\": \"[^\"]+\",\\s*\"auto_lock_1m\": \"[^\"]+\",\\s*\"auto_lock_2m\": \"[^\"]+\",\\s*\"auto_lock_5m\": \"[^\"]+\",\\s*\"auto_lock_10m\": \"[^\"]+\",\\s*\"auto_lock_30m\": \"[^\"]+\")", 'm');

  const replacementStr =
    '"sort_author": "' + keys.sort_author + '",\n' +
    '      "sort_parody": "' + keys.sort_parody + '",\n' +
    '      "auto_lock": "' + keys.auto_lock + '",\n' +
    '      "auto_lock_never": "' + keys.auto_lock_never + '",\n' +
    '      "auto_lock_minimize": "' + keys.auto_lock_minimize + '",\n' +
    '      "auto_lock_1m": "' + keys.auto_lock_1m + '",\n' +
    '      "auto_lock_2m": "' + keys.auto_lock_2m + '",\n' +
    '      "auto_lock_5m": "' + keys.auto_lock_5m + '",\n' +
    '      "auto_lock_10m": "' + keys.auto_lock_10m + '",\n' +
    '      "auto_lock_30m": "' + keys.auto_lock_30m + '"';

  code = code.replace(langRegex, (match, p1) => {
    return p1 + replacementStr;
  });
}

fs.writeFileSync(path, code);
console.log('Successfully updated i18n.ts with translated keys.');
