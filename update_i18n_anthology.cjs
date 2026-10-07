const fs = require('fs');
let code = fs.readFileSync('src/lib/i18n.ts', 'utf8');

const translations = {
  en: {
    circle: "Circle",
    sort_circle: "Circle",
    anthology: "Anthology",
    sort_anthology: "Anthology"
  },
  ja: {
    circle: "サークル",
    sort_circle: "サークル",
    anthology: "アンソロジー",
    sort_anthology: "アンソロジー"
  },
  es: {
    circle: "Círculo",
    sort_circle: "Círculo",
    anthology: "Antología",
    sort_anthology: "Antología"
  },
  zh: {
    circle: "社团",
    sort_circle: "社团",
    anthology: "合集",
    sort_anthology: "合集"
  },
  fr: {
    circle: "Cercle",
    sort_circle: "Cercle",
    anthology: "Anthologie",
    sort_anthology: "Anthologie"
  },
  de: {
    circle: "Zirkel",
    sort_circle: "Zirkel",
    anthology: "Anthologie",
    sort_anthology: "Anthologie"
  },
  ko: {
    circle: "서클",
    sort_circle: "서클",
    anthology: "앤솔로지",
    sort_anthology: "앤솔로지"
  },
  pt: {
    circle: "Círculo",
    sort_circle: "Círculo",
    anthology: "Antologia",
    sort_anthology: "Antologia"
  },
  it: {
    circle: "Circolo",
    sort_circle: "Circolo",
    anthology: "Antologia",
    sort_anthology: "Antologia"
  },
  ru: {
    circle: "Кружок",
    sort_circle: "Кружок",
    anthology: "Антология",
    sort_anthology: "Антология"
  }
};

const objStartStr = 'const resources = ';
let objStartIdx = code.indexOf(objStartStr);
let objStr = code.substring(objStartIdx + objStartStr.length, code.indexOf('i18n\n'));
objStr = objStr.trim().replace(/;$/, '');

const script = 'return ' + objStr + ';';
const fn = new Function(script);
const resources = fn();

for (const [lang, trans] of Object.entries(translations)) {
  if (resources[lang] && resources[lang].translation) {
    Object.assign(resources[lang].translation, trans);
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
console.log('Added translations for circle and anthology');
