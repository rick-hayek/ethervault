import React from 'react';
import { Lock, ShieldCheck, KeyRound, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BottomTabNavProps {
    currentView: string;
    setView: (view: any) => void;
    onAddClick?: () => void;
}

export const BottomTabNav: React.FC<BottomTabNavProps> = ({ currentView, setView }) => {
    const { t } = useTranslation();

    const navItems = [
        {
            id: 'vault',
            label: t('layout.nav.vault'),
            icon: Lock,
            activeClass: 'text-primary-600 dark:text-primary-400',
        },
        {
            id: 'security',
            label: t('layout.nav.security'),
            icon: ShieldCheck,
            activeClass: 'text-primary-600 dark:text-primary-400',
        },
        {
            id: 'generator',
            label: t('layout.nav.generator'),
            icon: KeyRound,
            activeClass: 'text-primary-600 dark:text-primary-400',
        },
        {
            id: 'settings',
            label: t('layout.nav.settings'),
            icon: Settings,
            activeClass: 'text-primary-600 dark:text-primary-400',
        },
    ];

    const renderNavItem = (item: typeof navItems[0]) => {
        const isActive = currentView === item.id;
        return (
            <button
                key={item.id}
                onClick={() => setView(item.id)}
                aria-label={item.label}
                className={`relative flex flex-col items-center justify-center transition-all duration-300 ease-out ${isActive
                    ? 'w-[76px] h-14 bg-black/5 dark:bg-white/10 rounded-theme-full text-primary-600 dark:text-primary-400'
                    : 'w-14 h-14 text-slate-800 dark:text-slate-300'
                    }`}
            >
                <div className={`transition-all duration-300 flex items-center justify-center ${isActive ? '-translate-y-2' : ''}`}>
                    <item.icon className="w-6 h-6" strokeWidth={1.2} />
                </div>
                {isActive && (
                    <span className="absolute bottom-[6px] text-[10px] font-normal tracking-wide">
                        {item.label}
                    </span>
                )}
            </button>
        );
    };

    return (
        <div className="md:hidden fixed bottom-6 left-5 right-5 z-40 pointer-events-none pb-safe-area-bottom">
            <nav className="pointer-events-auto flex items-center justify-around px-3 py-2 max-w-sm mx-auto bg-surface-card/60 dark:bg-surface-card/40 backdrop-blur-2xl rounded-theme-full shadow-theme-lg border border-primary-500/10 dark:border-primary-400/10">
                {navItems.map(renderNavItem)}
            </nav>
        </div>
    );
};
