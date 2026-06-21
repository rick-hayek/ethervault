export interface AttachmentMetadata {
    id: string;          // UUID
    name: string;        // E.g., "passport.jpg"
    size: number;        // Size in bytes
    mimeType: string;    // E.g., "image/jpeg"
    nonce: string;       // Base64 nonce used to encrypt the file bytes
    updatedAt: number;   // Timestamp
}

export interface PasswordEntry {
    id: string;
    title: string;
    username: string;
    password?: string;
    website?: string;
    url?: string;
    notes?: string;
    category: Category;
    tags?: string[];
    otpSecret?: string;
    strength?: 'Secure' | 'Strong' | 'Medium' | 'Weak';
    lastUpdated?: string;
    createdAt: number;
    updatedAt: number;
    favorite: boolean;
    icon?: string;
    // Recovery and additional info
    recoveryPhone?: string;
    recoveryEmail?: string;
    note?: string;
    attachments?: AttachmentMetadata[];
}

export type Category = 'All' | 'Personal' | 'Work' | 'Others';

export type CloudProvider = 'none' | 'dropbox' | 'google' | 'drive' | 'webdav' | 'icloud' | 'onedrive';

export type ThemeId = 'default' | 'kawaii' | 'cyberpunk' | 'steel' | 'fresh' | 'retro' | 'ocean' | 'noir';

export interface AppSettings {
    biometricsEnabled: boolean;
    autoLockTimeout: number;
    theme: 'dark' | 'light' | 'system';
    cloudProvider: CloudProvider;
    lastSync: string;
    masterLogEnabled?: boolean;
    /** @deprecated Use activeTheme instead. Kept for migration only. */
    themeColor?: string;
    activeTheme?: ThemeId;
    isPremium: boolean;
}

export interface VaultStorageItem {
    id: string;
    payload: string;
    nonce: string;
    category: Category;
    createdAt: number;
    updatedAt: number;
    favorite: boolean;
    icon?: string;
}

export interface LocalAttachmentItem {
    id: string;
    entryId: string;
    ciphertext: Uint8Array;
    nonce: Uint8Array;
}

export interface CloudAttachmentItem {
    id: string;
    ciphertext: string;  // Base64
    nonce: string;       // Base64
}

export interface Logger {
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
}
