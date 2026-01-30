export { };

declare global {
    interface Window {
        electronAPI?: {
            biometrics: {
                isAvailable: () => Promise<boolean>;
                saveSecret: (secret: string) => Promise<boolean>;
                retrieveSecret: (reason: string) => Promise<string | null>;
                deleteSecret: () => Promise<boolean>;
                hasSavedSecret: () => Promise<boolean>;
            };
            log: {
                info: (...args: any[]) => void;
                warn: (...args: any[]) => void;
                error: (...args: any[]) => void;
                setEnabled: (enabled: boolean) => void;
                openLogFile: () => void;
                getRecentLogs: () => Promise<string[]>;
            };
            clearCache?: () => Promise<boolean>;
            getVersion?: () => Promise<string>;
            utils?: {
                fetchIcon: (url: string) => Promise<string | null>;
                getRedirectUrl?: (url: string) => Promise<string | null>;
            };
            [key: string]: any;
        };
    }
}
