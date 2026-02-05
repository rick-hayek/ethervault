import React from 'react';
import { X, Shield, ChevronLeft, Lock } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { useBackHandler } from '../hooks/useBackHandler';
import { Portal } from './Portal';

interface PrivacyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();

    useBackHandler('privacy-modal', async () => {
        if (isOpen) {
            onClose();
            return true;
        }
        return false;
    });

    const openLink = (url: string) => {
        if (window.electronAPI) {
            window.electronAPI.openExternal(url);
        } else {
            window.open(url, '_system');
        }
    };

    if (!isOpen) return null;

    const renderPoints = (points: string[]) => (
        <ul className="list-disc pl-5 space-y-2 mt-2">
            {points.map((point, idx) => (
                <li key={idx} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
                    <span className="text-slate-900 dark:text-white font-medium">{point.split(':')[0]}:</span>
                    {point.split(':').slice(1).join(':')}
                </li>
            ))}
        </ul>
    );

    const renderList = (items: string[]) => (
        <ul className="list-disc pl-5 space-y-2 mt-2">
            {items.map((item, idx) => (
                <li key={idx} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
                    <span className="text-slate-900 dark:text-white font-medium">{item.split(':')[0]}:</span>
                    {item.split(':').slice(1).join(':')}
                </li>
            ))}
        </ul>
    );

    return (
        <Portal>
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 w-full md:max-w-2xl h-[100dvh] md:h-auto md:max-h-[90vh] rounded-none md:rounded-[2rem] border-t md:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 flex flex-col">

                    {/* Header */}
                    <div className="px-6 md:px-8 pt-[calc(env(safe-area-inset-top)+4px)] pb-4 md:py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex p-2 bg-emerald-500/10 rounded-xl">
                                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>

                            {/* Mobile Back Button */}
                            <button
                                onClick={onClose}
                                className="md:hidden p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>

                            {/* Mobile Drag Handle */}
                            <div className="md:hidden w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto absolute left-0 right-0 top-3 pointer-events-none" />

                            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white md:pt-0">{t('privacy_view.title')}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="hidden md:block p-2 -mr-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-white/50 dark:bg-slate-800/50 rounded-full md:bg-transparent"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 [&::-webkit-scrollbar]:hidden">
                        <div className="space-y-8 pb-8">

                            {/* Intro */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('privacy_view.last_updated')}</p>
                                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                    {t('privacy_view.intro')}
                                </p>
                                <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                    <div className="flex gap-3">
                                        <div className="p-1 bg-emerald-100 dark:bg-emerald-800/50 rounded-lg h-fit">
                                            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 leading-tight">
                                            {t('privacy_view.summary')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 1: Data Collection (Custom Layout) */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('privacy_view.sections.1.title')}</h3>

                                <div className="pl-4 border-l-2 border-indigo-500 space-y-2">
                                    <h4 className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{t('privacy_view.sections.1.local_title')}</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{t('privacy_view.sections.1.local_desc')}</p>
                                </div>

                                <div className="pl-4 border-l-2 border-slate-300 dark:border-slate-700 space-y-2">
                                    <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">{t('privacy_view.sections.1.server_title')}</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{t('privacy_view.sections.1.server_desc')}</p>
                                </div>
                            </div>

                            {/* Section 2: Cloud Sync */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('privacy_view.sections.2.title')}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{t('privacy_view.sections.2.desc')}</p>
                                {renderPoints(t('privacy_view.sections.2.points', { returnObjects: true }) as string[])}
                            </div>

                            {/* Section 3: Biometric */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('privacy_view.sections.3.title')}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{t('privacy_view.sections.3.desc')}</p>
                                {renderPoints(t('privacy_view.sections.3.points', { returnObjects: true }) as string[])}
                            </div>

                            {/* Section 4: Third Party */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('privacy_view.sections.4.title')}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{t('privacy_view.sections.4.desc')}</p>
                                {renderPoints(t('privacy_view.sections.4.points', { returnObjects: true }) as string[])}
                            </div>

                            {/* Section 5: Device Permissions */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('privacy_view.sections.5.title')}</h3>
                                {renderList(t('privacy_view.sections.5.lists', { returnObjects: true }) as string[])}
                            </div>

                            {/* Section 6: Logs */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('privacy_view.sections.6.title')}</h3>
                                {renderList(t('privacy_view.sections.6.lists', { returnObjects: true }) as string[])}
                            </div>

                            {/* Section 7: Changes */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('privacy_view.sections.7.title')}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{t('privacy_view.sections.7.desc')}</p>
                            </div>

                            {/* Section 8: Contact */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('privacy_view.sections.8.title')}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                    <Trans
                                        i18nKey="privacy_view.sections.8.desc"
                                        components={[
                                            <button
                                                key="0"
                                                onClick={() => openLink('https://github.com/rick-hayek/ethervault')}
                                                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                                            >
                                                GitHub
                                            </button>
                                        ]}
                                    />
                                </p>
                            </div>

                            <div className="text-center pt-8 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {t('privacy_view.footer')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
