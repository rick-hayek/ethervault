import { PasswordEntry } from './types';

export type Strength = 'Secure' | 'Strong' | 'Medium' | 'Weak';

export interface AuditAlert {
    type: 'compromised' | 'reused' | 'weak';
    entryIds: string[];
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
}

export interface AuditResult {
    score: number;
    weakCount: number;
    reusedCount: number;
    secureCount: number;
    alerts: AuditAlert[];
}

export class SecurityService {
    static calculateStrength(password: string): Strength {
        if (!password) return 'Weak';

        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (password.length >= 16) score++;

        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score >= 6) return 'Secure';
        if (score >= 4) return 'Strong';
        if (score >= 2) return 'Medium';
        return 'Weak';
    }

    static performAudit(entries: PasswordEntry[]): AuditResult {
        if (entries.length === 0) {
            return {
                score: 100,
                weakCount: 0,
                reusedCount: 0,
                secureCount: 0,
                alerts: []
            };
        }

        const passwordMap = new Map<string, string[]>();
        const weakEntries: PasswordEntry[] = [];
        const secureEntries: PasswordEntry[] = [];

        entries.forEach(entry => {
            if (!entry.password) return;

            // Check reused
            const existing = passwordMap.get(entry.password) || [];
            existing.push(entry.id);
            passwordMap.set(entry.password, existing);

            // Check strength
            const strength = this.calculateStrength(entry.password);
            if (strength === 'Weak') {
                weakEntries.push(entry);
            } else if (strength === 'Secure' || strength === 'Strong') {
                secureEntries.push(entry);
            }
        });

        const reusedAlerts: AuditAlert[] = [];
        let totalReusedCount = 0;

        passwordMap.forEach((ids, password) => {
            if (ids.length > 1) {
                totalReusedCount += ids.length;
                const titles = entries
                    .filter(e => ids.includes(e.id))
                    .map(e => e.title)
                    .slice(0, 3)
                    .join(', ');

                reusedAlerts.push({
                    type: 'reused',
                    entryIds: ids,
                    title: `Reused Password: ${ids.length} Accounts`,
                    description: `Used for ${titles}${ids.length > 3 ? ' and more' : ''}.`,
                    severity: 'medium'
                });
            }
        });

        const weakAlerts: AuditAlert[] = weakEntries.map(entry => ({
            type: 'weak',
            entryIds: [entry.id],
            title: `Weak Password: ${entry.title}`,
            description: 'This password is too short or lacks complexity.',
            severity: 'high'
        }));

        const alerts = [...weakAlerts, ...reusedAlerts];

        // Simple score calculation: 100 - (percentage of problematic entries * 2)
        const problemCount = weakEntries.length + (totalReusedCount / 2); // reuse is less severe than weak
        const score = Math.max(0, Math.min(100, Math.round(100 - (problemCount / entries.length * 100))));

        return {
            score,
            weakCount: weakEntries.length,
            reusedCount: totalReusedCount,
            secureCount: secureEntries.length,
            alerts
        };
    }
}
