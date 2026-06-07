import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, CloudDownload } from 'lucide-react';
import { Portal } from './Portal';

interface CloudVaultFoundModalProps {
    onClose: () => void;
    onConfirm: () => void;
}

export const CloudVaultFoundModal: React.FC<CloudVaultFoundModalProps> = ({ onClose, onConfirm }) => {
    const { t } = useTranslation();

    return (
        <Portal>
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-blue-200 dark:border-blue-900/30 shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                    
                    <div className="flex flex-col items-center text-center space-y-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                            <CloudDownload className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {t('sync.found_modal.title', 'Cloud Vault Found')}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                                {t('sync.found_modal.description', 'An existing encrypted vault was found in your cloud storage. To sync, we must import the security settings and key from the cloud.')}
                            </p>
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl mt-4 text-left space-y-2">
                                <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                                    <Shield className="w-3.5 h-3.5" />
                                    {t('sync.found_modal.warning_label', 'Security Notice')}
                                </p>
                                <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
                                    {t('sync.found_modal.warning_text', 'Once imported, you must log in with the password used on the cloud vault. If you forgot the cloud password, select Cancel now. Check our Help/FAQ on how to clear cloud data to start a new sync.')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                        >
                            {t('common.cancel', 'Cancel')}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all active:scale-95"
                        >
                            {t('sync.found_modal.confirm', 'Connect & Import')}
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
