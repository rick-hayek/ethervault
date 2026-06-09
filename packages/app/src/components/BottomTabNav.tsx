import React from 'react';
import { Lock, ShieldCheck, KeyRound, Settings, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BottomTabNavProps {
    currentView: string;
    setView: (view: any) => void;
    onAddClick?: () => void;
}

export const BottomTabNav: React.FC<BottomTabNavProps> = ({ currentView, setView, onAddClick }) => {
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
                className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${isActive ? item.activeClass : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
            >
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'scale-110' : ''}`}>
                    <item.icon className="w-5 h-5" strokeWidth={1.2} />
                </div>
                <span className={`text-[9px] font-normal uppercase tracking-wider transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 absolute bottom-2'
                    }`}>
                    {item.label}
                </span>
            </button>
        );
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-2 pt-2 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-200/60 dark:border-slate-800/50 backdrop-blur-xl safe-area-bottom">
            <nav className="flex items-center justify-between max-w-sm mx-auto">
                {navItems.slice(0, 2).map(renderNavItem)}

                {onAddClick && (
                    <button
                        onClick={onAddClick}
                        className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20 shadow-sm hover:shadow-md active:scale-95 transition-all"
                    >
                        <Plus className="w-7 h-7" strokeWidth={1.2} />
                    </button>
                )}

                {navItems.slice(2, 4).map(renderNavItem)}
            </nav>
        </div>
    );
};
