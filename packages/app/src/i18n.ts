import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';

const getSystemLanguage = () => {
    const language = navigator.language.toLowerCase();
    if (language.startsWith('zh')) return 'zh';
    if (language.startsWith('ja')) return 'ja';
    return 'en';
};

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            zh: { translation: zh },
            ja: { translation: ja }
        },
        lng: getSystemLanguage(),
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
