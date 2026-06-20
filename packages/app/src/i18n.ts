import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zh from './locales/zh.json';
import zhTW from './locales/zh-TW.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';
import de from './locales/de.json';
import it from './locales/it.json';
import th from './locales/th.json';
import ru from './locales/ru.json';
import ar from './locales/ar.json';
const getSystemLanguage = () => {
    const language = navigator.language.toLowerCase();
    if (language.startsWith('zh-tw') || language.startsWith('zh-hk') || language.startsWith('zh-mo') || language.startsWith('zh-hant')) return 'zh-TW';
    if (language.startsWith('zh')) return 'zh';
    if (language.startsWith('ja')) return 'ja';
    if (language.startsWith('ko')) return 'ko';
    if (language.startsWith('es')) return 'es';
    if (language.startsWith('fr')) return 'fr';
    if (language.startsWith('pt')) return 'pt';
    if (language.startsWith('de')) return 'de';
    if (language.startsWith('it')) return 'it';
    if (language.startsWith('th')) return 'th';
    if (language.startsWith('ru')) return 'ru';
    if (language.startsWith('ar')) return 'ar';
    return 'en';
};

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            zh: { translation: zh },
            'zh-TW': { translation: zhTW },
            ja: { translation: ja },
            ko: { translation: ko },
            es: { translation: es },
            fr: { translation: fr },
            pt: { translation: pt },
            de: { translation: de },
            it: { translation: it },
            th: { translation: th },
            ru: { translation: ru },
            ar: { translation: ar }
        },
        lng: getSystemLanguage(),
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
