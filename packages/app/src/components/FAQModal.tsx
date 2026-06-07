import React from 'react';
import { X, HelpCircle, ChevronLeft, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBackHandler } from '../hooks/useBackHandler';
import { Portal } from './Portal';

interface FAQModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FAQModal: React.FC<FAQModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();

    useBackHandler('faq-modal', async () => {
        if (isOpen) {
            onClose();
            return true;
        }
        return false;
    });

    if (!isOpen) return null;

    const renderSteps = (steps: string[]) => (
        <ol className="list-decimal pl-5 space-y-2 mt-2">
            {steps.map((step, idx) => (
                <li key={idx} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
                    {step}
                </li>
            ))}
        </ol>
    );

    return (
        <Portal>
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[110] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 w-full md:max-w-2xl h-[100dvh] md:h-auto md:max-h-[90vh] rounded-none md:rounded-[2rem] border-t md:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 flex flex-col">

                    {/* Header */}
                    <div className="px-6 md:px-8 pt-[calc(env(safe-area-inset-top)+4px)] pb-4 md:py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex p-2 bg-blue-500/10 rounded-xl">
                                <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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

                            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white md:pt-0">{t('faq_view.title', 'Help & FAQ')}</h2>
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

                            {/* Info Banner */}
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">{t('faq_view.last_updated', 'Last updated: June 2026')}</p>
                            </div>

                            {/* Section 1: Master Password Security */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                                    {t('faq_view.sections.1.title', '1. Master Password Security')}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {t('faq_view.sections.1.desc', 'EtherVault is a zero-knowledge, local-first password manager. We do not store your master password on any servers. If you forget it, we cannot recover or reset it for you. Please make sure you have memorized your master password.')}
                                </p>
                            </div>

                            {/* Section 2: Cloud Sync & Privacy */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                                    {t('faq_view.sections.2.title', '2. Cloud Sync & Data Privacy')}
                                </h3>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                                        {t('faq_view.sections.2.access_title', 'Isolated App Access Only')}
                                    </h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                        {t('faq_view.sections.2.access_desc', 'EtherVault uses a dedicated sandboxed folder for syncing. We do not have, and cannot request, permission to access any other files, folders, or personal data stored in your cloud drive.')}
                                    </p>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                                        {t('faq_view.sections.2.view_data_title', 'How to View App Data in Google Drive')}
                                    </h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                        {t('faq_view.sections.2.view_data_desc', 'On Google Drive, EtherVault stores encrypted files in a hidden AppData folder to prevent accidental deletion. To view or manage it, go to Google Drive Web > Settings (gear icon) > Settings > Manage Apps. You will see EtherVault listed under your authorized applications.')}
                                    </p>
                                </div>
                            </div>

                            {/* Section 3: Forgot Password / Reset */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                                    {t('faq_view.sections.3.title', '3. Forgot Cloud Password & Clearing Sync Data')}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {t('faq_view.sections.3.desc', 'Because EtherVault is a zero-knowledge password manager, we cannot recover your master password. If you forgot the cloud password, the cloud backup cannot be decrypted. You must clear the cloud data to start syncing again. Choose one of the following methods:')}
                                </p>

                                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex gap-3">
                                    <div className="p-1 bg-amber-100 dark:bg-amber-800/50 rounded-lg h-fit text-amber-600 dark:text-amber-400">
                                        <ShieldAlert className="w-5 h-5 animate-pulse" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-300 leading-tight">
                                            {t('faq_view.sections.3.method1_title', 'Method 1: Manually Delete via Google Drive Settings')}
                                        </h4>
                                        {renderSteps(t('faq_view.sections.3.method1_steps', { returnObjects: true }) as string[] || [])}
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-2xl flex gap-3">
                                    <div className="p-1 bg-blue-100 dark:bg-blue-800/50 rounded-lg h-fit text-blue-600 dark:text-blue-400">
                                        <HelpCircle className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-sm text-blue-800 dark:text-blue-300 leading-tight">
                                            {t('faq_view.sections.3.method2_title', 'Method 2: Force Overwrite via Sync Conflict')}
                                        </h4>
                                        {renderSteps(t('faq_view.sections.3.method2_steps', { returnObjects: true }) as string[] || [])}
                                    </div>
                                </div>
                            </div>

                            <div className="text-center pt-8 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                    {t('faq_view.footer', 'EtherVault Help Center — Keep your vault secure, always.')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
