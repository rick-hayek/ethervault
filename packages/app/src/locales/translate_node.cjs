const fs = require('fs');
const path = require('path');
const https = require('https');

const srcFile = '/Users/rick/src/ethervault/packages/app/src/locales/en.json';
const localesDir = '/Users/rick/src/ethervault/packages/app/src/locales';

const targets = {
    'nl': 'nl.json'
    // 'it': 'it.json',
    // 'th': 'th.json',
    // 'ru': 'ru.json',
    // 'ar': 'ar.json'
};

async function translateText(text, targetLang) {
    if (!text || typeof text !== 'string') return text;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json && json[0]) {
                        resolve(json[0].map(x => x[0]).join(''));
                    } else {
                        resolve(text);
                    }
                } catch (e) {
                    resolve(text);
                }
            });
        }).on('error', () => resolve(text));
    });
}

// recursively translate
async function translateObj(obj, lang) {
    if (typeof obj === 'string') {
        // avoid translating placeholders like {{...}}
        const translated = await translateText(obj, lang);
        return translated;
    } else if (Array.isArray(obj)) {
        const arr = [];
        for (const item of obj) {
            arr.push(await translateObj(item, lang));
        }
        return arr;
    } else if (typeof obj === 'object' && obj !== null) {
        const newObj = {};
        for (const [k, v] of Object.entries(obj)) {
            newObj[k] = await translateObj(v, lang);
        }
        return newObj;
    }
    return obj;
}

async function run() {
    const enData = JSON.parse(fs.readFileSync(srcFile, 'utf8'));

    // Process languages sequentially to avoid hammering the API
    for (const [lang, filename] of Object.entries(targets)) {
        console.log(`Translating to ${lang}...`);
        try {
            const translatedData = await translateObj(enData, lang);
            fs.writeFileSync(path.join(localesDir, filename), JSON.stringify(translatedData, null, 4) + '\n', 'utf8');
            console.log(`Finished ${lang}`);
        } catch (e) {
            console.error(`Error on ${lang}:`, e);
        }
    }
}

run().catch(console.error);
