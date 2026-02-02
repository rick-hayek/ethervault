/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_CONTACT_EMAIL: string;
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
