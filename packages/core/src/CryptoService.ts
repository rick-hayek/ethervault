import _sodium from 'libsodium-wrappers-sumo';
import { ICryptoService, PasswordGeneratorOptions } from './interfaces';
import { Capacitor } from '@capacitor/core';

/**
 * Instance-based CryptoService implementation.
 * Use getCryptoService() singleton for production, or instantiate directly for testing.
 */
export class CryptoServiceImpl implements ICryptoService {
    private sodium: typeof _sodium | null = null;

    async init(): Promise<void> {
        await _sodium.ready;
        this.sodium = _sodium;
    }

    async getPreferredKdfParams(): Promise<{ opslimit: number; memlimit: number }> {
        if (!this.sodium) await this.init();

        if (Capacitor.isNativePlatform()) {
            return {
                opslimit: this.sodium!.crypto_pwhash_OPSLIMIT_MODERATE,
                memlimit: this.sodium!.crypto_pwhash_MEMLIMIT_MODERATE
            };
        }

        return {
            opslimit: this.sodium!.crypto_pwhash_OPSLIMIT_INTERACTIVE,
            memlimit: this.sodium!.crypto_pwhash_MEMLIMIT_INTERACTIVE
        };
    }

    async deriveKey(password: string, salt: Uint8Array, opslimit?: number, memlimit?: number): Promise<Uint8Array> {
        if (!this.sodium) await this.init();

        const ops = opslimit !== undefined ? opslimit : this.sodium!.crypto_pwhash_OPSLIMIT_INTERACTIVE;
        const mem = memlimit !== undefined ? memlimit : this.sodium!.crypto_pwhash_MEMLIMIT_INTERACTIVE;

        return this.sodium!.crypto_pwhash(
            this.sodium!.crypto_secretbox_KEYBYTES,
            password,
            salt,
            ops,
            mem,
            this.sodium!.crypto_pwhash_ALG_ARGON2ID13
        ) as Uint8Array;
    }

    generateSalt(): Uint8Array {
        if (!this.sodium) throw new Error('Sodium not initialized');
        const salt = this.sodium.randombytes_buf(this.sodium.crypto_pwhash_SALTBYTES) as Uint8Array;
        return new Uint8Array(salt);
    }

    encrypt(message: string, key: Uint8Array): { ciphertext: string; nonce: string } {
        if (!this.sodium) throw new Error('Sodium not initialized');
        const nonce = this.sodium.randombytes_buf(this.sodium.crypto_secretbox_NONCEBYTES) as Uint8Array;
        const ciphertext = this.sodium.crypto_secretbox_easy(message, nonce, key) as Uint8Array;
        return {
            ciphertext: this.sodium.to_base64(ciphertext),
            nonce: this.sodium.to_base64(nonce)
        };
    }

    decrypt(ciphertextBase64: string, nonceBase64: string, key: Uint8Array): string {
        if (!this.sodium) throw new Error('Sodium not initialized');
        const ciphertext = this.sodium.from_base64(ciphertextBase64);
        const nonce = this.sodium.from_base64(nonceBase64);
        const decrypted = this.sodium.crypto_secretbox_open_easy(ciphertext, nonce, key) as Uint8Array;
        return this.sodium.to_string(decrypted);
    }

    encryptBinary(data: Uint8Array, key: Uint8Array): { ciphertext: Uint8Array; nonce: Uint8Array } {
        if (!this.sodium) throw new Error('Sodium not initialized');
        const cleanData = new Uint8Array(data);
        const nonce = this.sodium.randombytes_buf(this.sodium.crypto_secretbox_NONCEBYTES) as Uint8Array;
        const ciphertext = this.sodium.crypto_secretbox_easy(cleanData, nonce, key) as Uint8Array;
        return {
            ciphertext: new Uint8Array(ciphertext),
            nonce: new Uint8Array(nonce)
        };
    }

    decryptBinary(ciphertext: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array {
        if (!this.sodium) throw new Error('Sodium not initialized');
        const cleanCiphertext = new Uint8Array(ciphertext);
        const cleanNonce = new Uint8Array(nonce);
        const decrypted = this.sodium.crypto_secretbox_open_easy(cleanCiphertext, cleanNonce, key) as Uint8Array;
        return new Uint8Array(decrypted);
    }

    generatePassword(
        length: number = 20,
        options: PasswordGeneratorOptions = { uppercase: true, lowercase: true, numbers: true, symbols: true }
    ): string {
        const charset: string[] = [];
        if (options.lowercase) charset.push('abcdefghijklmnopqrstuvwxyz');
        if (options.uppercase) charset.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
        if (options.numbers) charset.push('0123456789');
        if (options.symbols) charset.push('!@#$%^&*()_+~`|}{[]:;?><,./-=');

        const chars = charset.join('');
        if (chars.length === 0) return '';

        let password = '';
        const randomValues = new Uint32Array(length);
        crypto.getRandomValues(randomValues);

        for (let i = 0; i < length; i++) {
            password += chars.charAt(randomValues[i] % chars.length);
        }
        return password;
    }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let _cryptoServiceInstance: CryptoServiceImpl | null = null;

/**
 * Get the singleton CryptoService instance.
 * Lazy initialization on first call.
 */
export function getCryptoService(): CryptoServiceImpl {
    if (!_cryptoServiceInstance) {
        _cryptoServiceInstance = new CryptoServiceImpl();
    }
    return _cryptoServiceInstance;
}

/**
 * Reset the singleton instance (for testing only).
 */
export function resetCryptoService(): void {
    _cryptoServiceInstance = null;
}

// =============================================================================
// Backward-Compatible Static Facade (Deprecated)
// =============================================================================

/**
 * @deprecated Use getCryptoService() or inject CryptoServiceImpl for testing.
 * This static facade is maintained for backward compatibility.
 */
export class CryptoService {
    static async init(): Promise<void> {
        return getCryptoService().init();
    }

    static async deriveKey(password: string, salt: Uint8Array, opslimit?: number, memlimit?: number): Promise<Uint8Array> {
        return getCryptoService().deriveKey(password, salt, opslimit, memlimit);
    }

    static async getPreferredKdfParams(): Promise<{ opslimit: number; memlimit: number }> {
        return getCryptoService().getPreferredKdfParams();
    }

    static generateSalt(): Uint8Array {
        return getCryptoService().generateSalt();
    }

    static encrypt(message: string, key: Uint8Array): { ciphertext: string; nonce: string } {
        return getCryptoService().encrypt(message, key);
    }

    static decrypt(ciphertextBase64: string, nonceBase64: string, key: Uint8Array): string {
        return getCryptoService().decrypt(ciphertextBase64, nonceBase64, key);
    }

    static encryptBinary(data: Uint8Array, key: Uint8Array): { ciphertext: Uint8Array; nonce: Uint8Array } {
        return getCryptoService().encryptBinary(data, key);
    }

    static decryptBinary(ciphertext: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array {
        return getCryptoService().decryptBinary(ciphertext, nonce, key);
    }

    static generatePassword(
        length: number = 20,
        options: PasswordGeneratorOptions = { uppercase: true, lowercase: true, numbers: true, symbols: true }
    ): string {
        return getCryptoService().generatePassword(length, options);
    }
}
