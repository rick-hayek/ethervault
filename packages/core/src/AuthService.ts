import { CryptoService } from './CryptoService';
import { StorageService } from './StorageService';
import { VaultService } from './VaultService';

export class AuthService {
    private static masterKey: Uint8Array | null = null;
    private static isAuthenticated: boolean = false;

    static async setupAccount(password: string): Promise<void> {
        const salt = CryptoService.generateSalt();
        const derivedKey = await CryptoService.deriveKey(password, salt);

        // Store salt as its own entry in metadata
        await StorageService.setItem('metadata', 'salt', salt);
        await StorageService.setItem('metadata', 'setup_complete', true);

        this.masterKey = derivedKey;
        this.isAuthenticated = true;
    }

    static async authenticate(password: string): Promise<boolean> {
        try {
            const salt = await StorageService.getItem('metadata', 'salt');
            if (!salt) return false;

            const derivedKey = await CryptoService.deriveKey(password, salt);
            this.masterKey = derivedKey;
            this.isAuthenticated = true;
            return true;
        } catch (error) {
            console.error('Authentication failed:', error);
            return false;
        }
    }

    static async isAccountSetup(): Promise<boolean> {
        return !!(await StorageService.getItem('metadata', 'setup_complete'));
    }

    static lock() {
        this.masterKey = null;
        this.isAuthenticated = false;
    }

    static getMasterKey(): Uint8Array {
        if (!this.masterKey || !this.isAuthenticated) {
            throw new Error('Vault is locked');
        }
        return this.masterKey;
    }

    static checkAuth(): boolean {
        return this.isAuthenticated;
    }

    static async changeMasterPassword(oldPassword: string, newPassword: string): Promise<boolean> {
        await this.getSodium();
        // 1. Verify old password
        const salt = await StorageService.getItem('metadata', 'salt');
        if (!salt) throw new Error('Account not set up');

        const currentKey = await CryptoService.deriveKey(oldPassword, salt);
        // We compare by trying to get entries (which will throw if the key is wrong)
        // or we could just check if currentKey matches this.masterKey
        if (this.masterKey && !this.sodium!.memcmp(currentKey, this.masterKey)) {
            return false;
        }

        // 2. Derive new key with new salt
        const newSalt = CryptoService.generateSalt();
        const newKey = await CryptoService.deriveKey(newPassword, newSalt);

        // 3. Re-encrypt all entries
        await VaultService.reencryptVault(newKey);

        // 4. Update metadata
        await StorageService.setItem('metadata', 'salt', newSalt);

        // 5. Update session
        this.masterKey = newKey;
        return true;
    }

    private static sodium: any = null;
    private static async getSodium() {
        if (!this.sodium) {
            const _sodium = (await import('libsodium-wrappers-sumo')).default;
            await _sodium.ready;
            this.sodium = _sodium;
        }
        return this.sodium;
    }
}
