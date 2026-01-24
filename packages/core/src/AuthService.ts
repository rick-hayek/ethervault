import { CryptoService } from './CryptoService';
import { StorageService } from './StorageService';

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
}
