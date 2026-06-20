
import React, { useState } from 'react';
import { X, Github, Mail, Shield, Info, ExternalLink, Globe, ChevronLeft, HelpCircle, Download, RefreshCw, ChevronRight, Check } from 'lucide-react';
import { AppUpdate } from '@capawesome/capacitor-app-update';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useBackHandler } from '../hooks/useBackHandler';
import { Portal } from './Portal';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
    appVersion: string;
    onOpenPrivacy: () => void;
    onOpenFAQ: () => void;
    onOpenTerms: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, appVersion, onOpenPrivacy, onOpenFAQ, onOpenTerms }) => {
    const { t } = useTranslation();
    const isAndroid = Capacitor.getPlatform() === 'android';
    const [updateState, setUpdateState] = useState<'idle' | 'checking' | 'available' | 'updating' | 'no_update' | 'error'>('idle');

    const handleUpdateClick = async () => {
        if (updateState === 'available') {
            const confirmUpdate = window.confirm(t('about.confirm_update'));
            if (confirmUpdate) {
                setUpdateState('updating');
                try {
                    await AppUpdate.performImmediateUpdate();
                } catch (e) {
                    console.error('Update failed', e);
                    setUpdateState('available');
                }
            }
            return;
        }

        setUpdateState('checking');
        try {
            const result = await AppUpdate.getAppUpdateInfo();
            if (result.updateAvailability === 2) {
                setUpdateState('available');
            } else {
                setUpdateState('no_update');
                setTimeout(() => setUpdateState('idle'), 2000);
            }
        } catch (e) {
            console.error('Check update failed', e);
            setUpdateState('error');
            setTimeout(() => setUpdateState('idle'), 2000);
        }
    };

    const openLink = (url: string) => {
        if (window.electronAPI) {
            window.electronAPI.openExternal(url);
        } else {
            window.open(url, '_system');
        }
    };

    useBackHandler('about-modal', async () => {
        if (isOpen) {
            onClose();
            return true;
        }
        return false;
    });

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-950 w-full md:max-w-lg h-[100dvh] md:h-auto md:max-h-[90vh] rounded-none md:rounded-[2rem] border-t md:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 flex flex-col">

                    {/* Header */}
                    <div className="px-6 md:px-8 pt-[calc(env(safe-area-inset-top)+4px)] pb-4 md:py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex p-2 bg-primary-500/10 rounded-xl">
                                <Info className="w-5 h-5 text-primary-600 dark:text-primary-400" />
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

                            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white md:pt-0">{t('about.title', 'About EtherVault')}</h2>
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
                        <div className="space-y-8">

                            {/* App Branding */}
                            <div className="text-center space-y-4 py-4">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">EtherVault</h3>
                                    {appVersion && <p className="text-slate-500 dark:text-slate-400 font-bold mt-1 text-sm">v{appVersion}</p>}
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-sm mx-auto">
                                    {t('about.description', 'A secure, offline-first, cross-platform password manager built for privacy and simplicity.')}
                                </p>
                            </div>

                            {/* Links Section */}
                            <div className="space-y-3">
                                {isAndroid && (
                                    <button
                                        onClick={handleUpdateClick}
                                        disabled={updateState === 'checking' || updateState === 'updating'}
                                        className="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary-500 dark:hover:border-primary-500 transition-all group text-left shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-center justify-center text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors w-8">
                                            {updateState === 'checking' ? <RefreshCw size={20} className="animate-spin" /> : <Download size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-slate-900 dark:text-white font-bold text-sm">
                                                {updateState === 'idle' && t('about.check_update', 'Check for Updates')}
                                                {updateState === 'checking' && t('about.checking_update', 'Checking...')}
                                                {updateState === 'available' && <span className="text-primary-600 dark:text-primary-400">{t('about.update_available', 'Click to update')}</span>}
                                                {updateState === 'updating' && t('about.updating', 'Updating...')}
                                                {updateState === 'no_update' && (
                                                    <span className="text-slate-600 dark:text-slate-400 inline-flex items-center gap-1">
                                                        <Check size={16} className="text-green-500 dark:text-green-400" />
                                                        {t('about.no_update', 'Up to date')}
                                                    </span>
                                                )}
                                                {updateState === 'error' && <span className="text-red-500">{t('about.check_update_failed', 'Failed to check')}</span>}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{t('about.update_desc', 'Get the latest features from Google Play')}</div>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
                                    </button>
                                )}

                                <button
                                    onClick={() => openLink('https://github.com/rick-hayek/ethervault')}
                                    className="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary-500 dark:hover:border-primary-500 transition-all group text-left shadow-sm hover:shadow-md"
                                >
                                    <div className="flex items-center justify-center text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors w-8">
                                        <Github size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-slate-900 dark:text-white font-bold text-sm"> {t('about.opensource', 'Open Source')}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">github.com/rick-hayek/ethervault</div>
                                    </div>
                                    <ExternalLink size={14} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
                                </button>

                                <button
                                    onClick={onOpenFAQ}
                                    className="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary-500 dark:hover:border-primary-500 transition-all group text-left shadow-sm hover:shadow-md"
                                >
                                    <div className="flex items-center justify-center text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors w-8">
                                        <HelpCircle size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-slate-900 dark:text-white font-bold text-sm">{t('about.faq_title', 'Frequently Asked Questions')}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{t('about.faq_desc', 'Read our FAQ for quick solutions.')}</div>
                                    </div>
                                    <ExternalLink size={14} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
                                </button>

                                <button
                                    onClick={() => openLink(`mailto:${import.meta.env.VITE_CONTACT_EMAIL}`)}
                                    className="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary-500 dark:hover:border-primary-500 transition-all group text-left shadow-sm hover:shadow-md"
                                >
                                    <div className="flex items-center justify-center text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors w-8">
                                        <Mail size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-slate-900 dark:text-white font-bold text-sm">{t('about.help_title', 'Help & Support')}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{t('about.contact', 'Contact Us')}: {import.meta.env.VITE_CONTACT_EMAIL}</div>
                                    </div>
                                    <ExternalLink size={14} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
                                </button>
                            </div>

                            {/* Privacy Section */}
                            <div className="bg-primary-50 dark:bg-primary-900/10 p-5 rounded-2xl border border-primary-100 dark:border-primary-500/10">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center shrink-0">
                                        <Shield size={16} className="text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div className="space-y-1 text-left">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('about.privacy_title', 'Privacy & Security')}</h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                            {t('about.privacy_desc', 'Your data is encrypted with AES-256-GCM purely on your device. We do not collect any personal data or analytics.')}
                                        </p>
                                        <div className="pt-2 flex items-center gap-4">
                                            <button
                                                onClick={onOpenPrivacy}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline active:scale-95 transition-all"
                                            >
                                                <span>{t('privacy_view.title', 'Privacy Policy')}</span>
                                                <ExternalLink size={12} />
                                            </button>
                                            <button
                                                onClick={onOpenTerms}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline active:scale-95 transition-all"
                                            >
                                                <span>{t('terms_view.title', 'Terms of Service')}</span>
                                                <ExternalLink size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>



                            <div className="text-center pt-4 pb-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {t('about.footer', '© 2026 EtherVault Team')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
