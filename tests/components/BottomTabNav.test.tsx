import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomTabNav } from '../../packages/app/src/components/BottomTabNav';

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const map: Record<string, string> = {
                'layout.nav.vault': 'Vault',
                'layout.nav.security': 'Security',
                'layout.nav.generator': 'Generator',
                'layout.nav.settings': 'Settings',
            };
            return map[key] || key;
        },
    }),
}));

describe('BottomTabNav', () => {
    it('renders 4 navigation tabs evenly without the middle plus button', () => {
        const setView = vi.fn();
        render(<BottomTabNav currentView="vault" setView={setView} />);

        // Check tabs exist
        expect(screen.getByText('Vault')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Security/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Generator/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Settings/i })).toBeInTheDocument();

        // Ensure exactly 4 buttons exist in nav
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(4);
    });

    it('triggers setView when tapping a tab', () => {
        const setView = vi.fn();
        render(<BottomTabNav currentView="vault" setView={setView} />);

        const securityBtn = screen.getByRole('button', { name: /Security/i });
        fireEvent.click(securityBtn);

        expect(setView).toHaveBeenCalledWith('security');
    });
});

