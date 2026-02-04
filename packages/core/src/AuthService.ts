import { ICryptoService, IStorageService, IVaultService } from './interfaces';
import { CryptoService } from './CryptoService';
import { StorageService } from './StorageService';

/**
 * AuthService implementation with dependency injection.
 * Use `authService` singleton for production, or create instances with mocks for testing.
 */
export class AuthServiceImpl {
    private masterKey: Uint8Array | null = null;
    private isAuthenticated: boolean = false;
    private sodium: any = null;
    private vaultServiceGetter?: () => IVaultService;

    constructor(
        private cryptoService: ICryptoService,
        private storageService: IStorageService,
        vaultService?: IVaultService | (() => IVaultService)
    ) {
        // Support lazy loading to avoid circular dependency
        if (typeof vaultService === 'function') {
            this.vaultServiceGetter = vaultService;
        } else if (vaultService) {
            this.vaultServiceGetter = () => vaultService;
        }
    }

    private getVaultService(): IVaultService {
        if (!this.vaultServiceGetter) {
            throw new Error('VaultService not configured');
        }
        return this.vaultServiceGetter();
    }

    async setupAccount(password: string): Promise<void> {
        const salt = this.cryptoService.generateSalt();
        const derivedKey = await this.cryptoService.deriveKey(password, salt);

        // Store salt
        await this.storageService.setItem('metadata', 'salt', salt);
        await this.storageService.setItem('metadata', 'setup_complete', true);

        // Create Verifier (Encrypted string "VALID")
        const { ciphertext, nonce } = this.cryptoService.encrypt('VALID', derivedKey);
        await this.storageService.setItem('metadata', 'auth_verifier', { payload: ciphertext, nonce });

        this.masterKey = derivedKey;
        this.isAuthenticated = true;
    }

    async setSalt(salt: Uint8Array): Promise<void> {
        await this.storageService.setItem('metadata', 'salt', salt);
    }

    async authenticate(password: string): Promise<boolean> {
        try {
            const salt = await this.storageService.getItem('metadata', 'salt');
            if (!salt) return false;

            const derivedKey = await this.cryptoService.deriveKey(password, salt);

            // 1. Check for Verifier (New Standard)
            const verifier = await this.storageService.getItem('metadata', 'auth_verifier');
            if (verifier && verifier.payload && verifier.nonce) {
                try {
                    const decrypted = this.cryptoService.decrypt(verifier.payload, verifier.nonce, derivedKey);
                    if (decrypted === 'VALID') {
                        this.masterKey = derivedKey;
                        this.isAuthenticated = true;
                        return true;
                    }
                } catch {
                    // FIX: Don't fail immediately. Verifier might be stale (e.g. after bug).
                    // Fall through to legacy check to see if we can decrypt the vault.
                    console.warn('[AUTH] Verifier failed. Falling back to vault decryption check.');
                }
            }

            // 2. Legacy Fallback (Check against actual Vault Data)
            // If no verifier exists, check if we can decrypt a vault item
            const vaultItems = await this.storageService.getAll('vault');
            if (vaultItems.length > 0) {
                const testItem = vaultItems[0];
                try {
                    this.cryptoService.decrypt(testItem.payload, testItem.nonce, derivedKey);
                    // Success! Migrate to Verifier for future O(1) checks
                    const { ciphertext, nonce } = this.cryptoService.encrypt('VALID', derivedKey);
                    await this.storageService.setItem('metadata', 'auth_verifier', { payload: ciphertext, nonce });

                    this.masterKey = derivedKey;
                    this.isAuthenticated = true;
                    return true;
                } catch {
                    return false; // Decryption failed
                }
            }

            // 3. Empty Vault + No Verifier = REJECT
            // This is a security measure: we cannot verify the password without data.
            // The user must have set up their account incorrectly or data was wiped.
            // Do NOT accept any password here - it would create a verifier for the wrong password.
            console.warn('[AUTH] Cannot authenticate: No verifier and no vault data to validate against.');
            return false;
        } catch (error) {
            console.error('Authentication failed:', error);
            return false;
        }
    }

    async isAccountSetup(): Promise<boolean> {
        return !!(await this.storageService.getItem('metadata', 'setup_complete'));
    }

    lock() {
        this.masterKey = null;
        this.isAuthenticated = false;
    }

    getMasterKey(): Uint8Array {
        if (!this.masterKey || !this.isAuthenticated) {
            throw new Error('Vault is locked');
        }
        return this.masterKey;
    }

    checkAuth(): boolean {
        return this.isAuthenticated;
    }

    async verifyPassword(password: string): Promise<boolean> {
        // 1. If already authenticated, check against in-memory key (Secure & Correct)
        if (this.isAuthenticated && this.masterKey) {
            try {
                const sodium = await this.getSodium();
                const salt = await this.storageService.getItem('metadata', 'salt');
                if (!salt) return false;

                const checkKey = await this.cryptoService.deriveKey(password, salt);
                return sodium.memcmp(checkKey, this.masterKey);
            } catch (e) {
                console.error('Password verification error:', e);
                return false;
            }
        }

        // 2. If not authenticated, fall back to standard authentication attempt
        // Note: This WILL set the masterKey if successful.
        return this.authenticate(password);
    }

    async changeMasterPassword(oldPassword: string, newPassword: string): Promise<boolean> {
        const sodium = await this.getSodium();
        // 1. Verify old password
        const salt = await this.storageService.getItem('metadata', 'salt');
        if (!salt) throw new Error('Account not set up');

        const currentKey = await this.cryptoService.deriveKey(oldPassword, salt);
        // Compare against in-memory key
        if (this.masterKey && !sodium.memcmp(currentKey, this.masterKey)) {
            return false;
        }

        // 2. Derive new key with new salt
        const newSalt = this.cryptoService.generateSalt();
        const newKey = await this.cryptoService.deriveKey(newPassword, newSalt);

        // 3. Re-encrypt all entries
        await this.getVaultService().reencryptVault(newKey);

        // 4. Update metadata
        await this.storageService.setItem('metadata', 'salt', newSalt);

        // FIX: Update Verifier with new key
        const { ciphertext, nonce } = this.cryptoService.encrypt('VALID', newKey);
        await this.storageService.setItem('metadata', 'auth_verifier', { payload: ciphertext, nonce });

        // 5. Update session
        this.masterKey = newKey;
        return true;
    }

    private async getSodium() {
        if (!this.sodium) {
            const _sodium = (await import('libsodium-wrappers-sumo')).default;
            await _sodium.ready;
            this.sodium = _sodium;
        }
        return this.sodium;
    }

    /**
     * Import cloud credentials (salt + verifier) during sync.
     * Used when adopting a cloud vault on a new device.
     * 
     * IMPORTANT: Both salt AND verifier are required. Without a verifier,
     * the user cannot authenticate after salt import.
     */
    async importCloudCredentials(saltB64: string, verifierJson: string): Promise<void> {
        // Validate verifier is present and valid
        if (!verifierJson || !verifierJson.trim()) {
            throw new Error('MISSING_VERIFIER: Cloud vault has no password verifier. Cannot sync without it.');
        }

        let verifier;
        try {
            verifier = JSON.parse(verifierJson);
            if (!verifier.payload || !verifier.nonce) {
                throw new Error('Invalid verifier structure');
            }
        } catch (e) {
            throw new Error('INVALID_VERIFIER: Cloud vault has invalid password verifier. Cannot sync.');
        }

        // Decode base64 salt
        const saltBytes = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));

        // Store both salt and verifier atomically
        await this.storageService.setItem('metadata', 'salt', saltBytes);
        await this.storageService.setItem('metadata', 'auth_verifier', verifier);

        // Clear current auth state (force re-login)
        this.masterKey = null;
        this.isAuthenticated = false;

        console.log('[AuthService] Imported cloud credentials. Re-login required.');
    }

    /**
     * Derive a key using a specific salt (for decrypting cloud data with cloud password).
     */
    async deriveKeyWithSalt(password: string, saltB64: string): Promise<Uint8Array> {
        const saltBytes = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
        return this.cryptoService.deriveKey(password, saltBytes);
    }

    /**
     * Get the current salt as base64 string
     */
    async getSaltBase64(): Promise<string | null> {
        const salt = await this.storageService.getItem('metadata', 'salt');
        if (!salt) return null;

        let saltArr = salt;
        if (!(salt instanceof Uint8Array)) {
            saltArr = new Uint8Array(Object.values(salt));
        }

        return btoa(String.fromCharCode(...saltArr));
    }

    /**
     * Get the current verifier as JSON string
     */
    async getVerifierJson(): Promise<string | null> {
        const verifier = await this.storageService.getItem('metadata', 'auth_verifier');
        if (!verifier) return null;
        return JSON.stringify(verifier);
    }
}

// ============================================================================
// Singleton instance for production use
// ============================================================================

let _authServiceInstance: AuthServiceImpl | null = null;

/**
 * Get the singleton AuthService instance.
 * Uses lazy initialization to allow VaultService to be loaded first.
 */
export function getAuthService(): AuthServiceImpl {
    if (!_authServiceInstance) {
        // Lazy load VaultService to avoid circular dependency
        const vaultServiceGetter = () => {
            const { VaultService } = require('./VaultService');
            return VaultService;
        };
        _authServiceInstance = new AuthServiceImpl(
            CryptoService,
            StorageService,
            vaultServiceGetter
        );
    }
    return _authServiceInstance;
}

/**
 * Reset the singleton instance (useful for testing).
 */
export function resetAuthService(): void {
    _authServiceInstance = null;
}

// ============================================================================
// Backward compatible static class facade
// ============================================================================

/**
 * @deprecated Use `getAuthService()` or inject `AuthServiceImpl` for better testability.
 * This static class is maintained for backward compatibility.
 */
export class AuthService {
    static async setupAccount(password: string): Promise<void> {
        return getAuthService().setupAccount(password);
    }

    static async setSalt(salt: Uint8Array): Promise<void> {
        return getAuthService().setSalt(salt);
    }

    static async authenticate(password: string): Promise<boolean> {
        return getAuthService().authenticate(password);
    }

    static async isAccountSetup(): Promise<boolean> {
        return getAuthService().isAccountSetup();
    }

    static lock(): void {
        return getAuthService().lock();
    }

    static getMasterKey(): Uint8Array {
        return getAuthService().getMasterKey();
    }

    static checkAuth(): boolean {
        return getAuthService().checkAuth();
    }

    static async verifyPassword(password: string): Promise<boolean> {
        return getAuthService().verifyPassword(password);
    }

    static async changeMasterPassword(oldPassword: string, newPassword: string): Promise<boolean> {
        return getAuthService().changeMasterPassword(oldPassword, newPassword);
    }

    static async importCloudCredentials(saltB64: string, verifierJson: string): Promise<void> {
        return getAuthService().importCloudCredentials(saltB64, verifierJson);
    }

    static async deriveKeyWithSalt(password: string, saltB64: string): Promise<Uint8Array> {
        return getAuthService().deriveKeyWithSalt(password, saltB64);
    }

    static async getSaltBase64(): Promise<string | null> {
        return getAuthService().getSaltBase64();
    }

    static async getVerifierJson(): Promise<string | null> {
        return getAuthService().getVerifierJson();
    }
}
