/**
 * Interfaces for dependency injection.
 * These interfaces enable mocking services in unit tests.
 */

import type { PasswordEntry, VaultStorageItem } from './types';

export type PasswordStrength = 'Secure' | 'Strong' | 'Medium' | 'Weak';

export interface PasswordGeneratorOptions {
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
}

export interface ICryptoService {
    init(): Promise<void>;
    deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array>;
    generateSalt(): Uint8Array;
    encrypt(message: string, key: Uint8Array): { ciphertext: string; nonce: string };
    decrypt(ciphertextBase64: string, nonceBase64: string, key: Uint8Array): string;
    encryptBinary(data: Uint8Array, key: Uint8Array): { ciphertext: Uint8Array; nonce: Uint8Array };
    decryptBinary(ciphertext: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array;
    generatePassword(length?: number, options?: PasswordGeneratorOptions): string;
}

export interface IStorageService {
    init(): Promise<IDBDatabase>;
    setItem(storeName: string, key: string, value: any): Promise<void>;
    getItem(storeName: string, key: string): Promise<any>;
    getAll(storeName: string): Promise<any[]>;
    deleteItem(storeName: string, key: string): Promise<void>;
    clear(storeName: string): Promise<void>;
    close(): Promise<void>;
}

export interface IAuthService {
    getMasterKey(): Uint8Array;
}

export interface ISecurityService {
    calculateStrength(password: string): PasswordStrength;
}

export interface ICloudService {
    uploadEntry(entry: VaultStorageItem): Promise<any>;
    deleteEntry(id: string): Promise<any>;
    uploadAttachment?(id: string, ciphertext: string, nonce: string): Promise<boolean>;
    downloadAttachment?(id: string): Promise<import('./types').CloudAttachmentItem | null>;
    deleteAttachment?(id: string): Promise<boolean>;
}

export interface IVaultService {
    setInitialEntries(entries: PasswordEntry[]): Promise<void>;
    getEncryptedEntries(): Promise<VaultStorageItem[]>;
    getEntries(): Promise<PasswordEntry[]>;
    addEntry(entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<PasswordEntry>;
    updateEntry(id: string, updates: Partial<PasswordEntry>): Promise<PasswordEntry>;
    deleteEntry(id: string): Promise<void>;
    exportVault(key: Uint8Array): Promise<string>;
    importVault(encryptedJson: string, key: Uint8Array): Promise<void>;
    reencryptVault(newKey: Uint8Array): Promise<void>;
    processCloudEntries(items: VaultStorageItem[]): Promise<void>;
    mergeCloudEntries(cloudEntries: VaultStorageItem[], cloudKey: Uint8Array): Promise<number>;
    clearLocalVault(): Promise<void>;
    addAttachment(entryId: string, name: string, data: Uint8Array, mimeType: string): Promise<import('./types').AttachmentMetadata>;
    getAttachment(entryId: string, attachmentId: string): Promise<{ metadata: import('./types').AttachmentMetadata; data: Uint8Array }>;
    deleteAttachment(entryId: string, attachmentId: string): Promise<void>;
}


