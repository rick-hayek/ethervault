/**
 * Interfaces for dependency injection.
 * These interfaces enable mocking services in unit tests.
 */

export interface ICryptoService {
    deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array>;
    generateSalt(): Uint8Array;
    encrypt(message: string, key: Uint8Array): { ciphertext: string; nonce: string };
    decrypt(ciphertextBase64: string, nonceBase64: string, key: Uint8Array): string;
}

export interface IStorageService {
    setItem(storeName: string, key: string, value: any): Promise<void>;
    getItem(storeName: string, key: string): Promise<any>;
    getAll(storeName: string): Promise<any[]>;
    deleteItem(storeName: string, key: string): Promise<void>;
    clear(storeName: string): Promise<void>;
}

export interface IVaultService {
    reencryptVault(newKey: Uint8Array): Promise<void>;
}
