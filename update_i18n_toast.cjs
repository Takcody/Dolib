const fs = require('fs');
let code = fs.readFileSync('src/lib/i18n.ts', 'utf8');

const toastTranslations = {
  en: "Settings updated!",
  ja: "設定を更新しました！",
  es: "¡Ajustes actualizados!",
  zh: "设置已更新！",
  fr: "Paramètres mis à jour !",
  de: "Einstellungen aktualisiert!",
  ko: "설정이 업데이트되었습니다!",
  pt: "Configurações atualizadas!",
  it: "Impostazioni aggiornate!",
  ru: "Настройки обновлены!"
};

const objStartStr = 'const resources = ';
let objStartIdx = code.indexOf(objStartStr);
let objStr = code.substring(objStartIdx + objStartStr.length, code.indexOf('i18n\n'));
objStr = objStr.trim().replace(/;$/, '');

const script = 'return ' + objStr + ';';
const fn = new Function(script);
const resources = fn();

for (const [lang, trans] of Object.entries(toastTranslations)) {
  if (resources[lang] && resources[lang].translation) {
    resources[lang].translation['settings_updated'] = trans;
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

fs.writeFileSync('src/lib/i18n.ts', code);
console.log('Successfully added toast translations.');
