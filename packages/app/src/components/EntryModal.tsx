import React, { useState } from 'react';
import { Lock, ChevronLeft, X, Globe, User as UserIcon, Copy, Trash2, ChevronDown, Phone, Mail, MessageSquare, Eye, EyeOff, Paperclip, Loader2, FileText, Download } from 'lucide-react';
import { PasswordEntry, SecurityService, Category, getVaultService } from '@ethervault/core';
import { useTranslation } from 'react-i18next';
import { CATEGORIES } from '../constants';
import { Portal } from './Portal';
import { CustomDropdown } from './CustomDropdown';

export interface EntryModalProps {
    entry: PasswordEntry | null;
    onClose: () => void;
    onSave: (entry: PasswordEntry) => void;
    onDelete: (id: string) => void;
    isPremium: boolean;
    onUnlockPremium: () => void;
}

export const EntryModal: React.FC<EntryModalProps> = ({ entry, onClose, onSave, onDelete, isPremium, onUnlockPremium }) => {
    const { t } = useTranslation();
    const categoryOptions = CATEGORIES.map(c => ({
        value: c,
        label: t(`category.${c.toLowerCase()}`)
    }));

    const [formData, setFormData] = useState<Partial<PasswordEntry>>(() => {
        if (entry) return { ...entry };
        return {
            id: crypto.randomUUID(),
            title: '',
            username: '',
            password: '',
            website: '',
            category: 'All',
            tags: [],
            strength: 'Medium',
            lastUpdated: t('vault.just_now', 'Just now'),
            recoveryPhone: '',
            recoveryEmail: '',
            note: '',
            attachments: []
        };
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showAdditionalFields, setShowAdditionalFields] = useState(
        // Auto-expand if any additional field has content
        !!(entry?.recoveryPhone || entry?.recoveryEmail || entry?.note)
    );
    const [showAttachmentsSection, setShowAttachmentsSection] = useState(
        !!(entry?.attachments && entry.attachments.length > 0)
    );
    const [newlyAddedAttachmentIds, setNewlyAddedAttachmentIds] = useState<string[]>([]);
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
    const [isDownloadingAttachment, setIsDownloadingAttachment] = useState<string | null>(null);

    const handleCancel = async () => {
        for (const attId of newlyAddedAttachmentIds) {
            try {
                await getVaultService().deleteAttachment(formData.id!, attId);
            } catch (e) {
                console.error('Failed to revert new attachment on cancel', e);
            }
        }
        onClose();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert(t('vault.attachment.error_size', 'File size exceeds 10MB limit.'));
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            try {
                setIsUploadingAttachment(true);
                const arr = new Uint8Array(reader.result as ArrayBuffer);

                const metadata = await getVaultService().addAttachment(formData.id!, file.name, arr, file.type);

                setFormData(prev => ({
                    ...prev,
                    attachments: [...(prev.attachments || []), metadata]
                }));
                setNewlyAddedAttachmentIds(prev => [...prev, metadata.id]);
            } catch (e: any) {
                alert(t('vault.attachment.upload_failed', 'Failed to upload attachment: ') + e.message);
            } finally {
                setIsUploadingAttachment(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleDownloadAttachment = async (attachmentId: string) => {
        try {
            setIsDownloadingAttachment(attachmentId);
            const { metadata, data } = await getVaultService().getAttachment(formData.id!, attachmentId);

            const blob = new Blob([data], { type: metadata.mimeType });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = metadata.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e: any) {
            alert(t('vault.attachment.download_failed', 'Failed to download attachment: ') + e.message);
        } finally {
            setIsDownloadingAttachment(null);
        }
    };

    const handleDeleteAttachment = async (attachmentId: string) => {
        try {
            await getVaultService().deleteAttachment(formData.id!, attachmentId);

            const updatedAttachments = (formData.attachments || []).filter(a => a.id !== attachmentId);
            setFormData(prev => ({ ...prev, attachments: updatedAttachments }));

            setNewlyAddedAttachmentIds(prev => prev.filter(id => id !== attachmentId));
        } catch (e: any) {
            alert(t('vault.attachment.delete_failed', 'Failed to delete attachment: ') + e.message);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title?.trim()) {
            alert(t('vault.error.title_required', 'Title field must not be empty'));
            return;
        }

        const result: PasswordEntry = {
            ...formData as PasswordEntry,
            id: formData.id || entry?.id || crypto.randomUUID(),
            lastUpdated: t('vault.just_now', 'Just now'),
            strength: formData.password ? SecurityService.calculateStrength(formData.password) : 'Weak'
        };
        onSave(result);
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 w-full md:max-w-lg h-[100dvh] md:h-auto md:max-h-[90vh] rounded-none md:rounded-[2rem] border-t md:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 flex flex-col">
                    <div className="px-6 md:px-8 pt-[calc(env(safe-area-inset-top)+4px)] pb-4 md:py-6 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex p-2 bg-slate-900 dark:bg-white rounded-xl">
                                <Lock className="w-5 h-5 text-white dark:text-slate-900" />
                            </div>

                            {/* Mobile Back Button */}
                            <button onClick={handleCancel} className="md:hidden p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <ChevronLeft className="w-6 h-6" />
                            </button>

                            {/* Mobile Drag Handle */}
                            <div className="md:hidden w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto absolute left-0 right-0 top-3 pointer-events-none" />

                            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white md:pt-0">{entry ? t('vault.edit_credential') : t('vault.new_credential')}</h2>
                        </div>
                        <button onClick={handleCancel} className="hidden md:block p-2 -mr-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-white/50 dark:bg-slate-800/50 rounded-full md:bg-transparent">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="pt-4 px-6 pb-6 md:p-8 space-y-5 overflow-y-auto overscroll-contain pb-safe-area-bottom">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-1">{t('vault.entry.title')}</label>
                                <input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 px-4 outline-none focus:border-primary-500 transition-all text-base md:text-sm text-slate-900 dark:text-white font-medium shadow-sm"
                                    placeholder={t('vault.entry.title_placeholder')}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-1">{t('vault.entry.category')}</label>
                                <CustomDropdown
                                    value={formData.category || 'All'}
                                    onChange={val => setFormData({ ...formData, category: val as Category })}
                                    options={categoryOptions}
                                    fullWidth={true}
                                    buttonClassName="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 px-4 outline-none focus:border-primary-500 transition-all text-base md:text-sm text-slate-900 dark:text-white font-medium shadow-sm flex items-center justify-between text-left select-none"
                                    menuClassName="absolute left-0 z-50 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl overflow-hidden py-1 animate-in fade-in duration-150"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-1">{t('vault.entry.website')}</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    value={formData.website}
                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-primary-500 transition-all text-base md:text-sm text-slate-900 dark:text-white font-medium shadow-sm"
                                    placeholder={t('vault.entry.website_placeholder')}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-1">{t('vault.entry.username_email')}</label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-12 pr-12 outline-none focus:border-primary-500 transition-all text-base md:text-sm text-slate-900 dark:text-white font-medium shadow-sm"
                                    placeholder={t('vault.entry.username_placeholder')}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(formData.username || '');
                                        // Optional: Show toast or feedback
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-primary-500 transition-colors"
                                    title={t('common.copy')}
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-1">{t('vault.entry.password')}</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (/^[\x21-\x7E]*$/.test(val)) {
                                            setFormData({ ...formData, password: val });
                                        }
                                    }}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-12 pr-20 outline-none focus:border-primary-500 transition-all text-base md:text-sm text-slate-900 dark:text-white font-mono shadow-sm"
                                    placeholder={t('vault.entry.password_placeholder')}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-1.5 text-slate-400 hover:text-primary-500 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(formData.password || '');
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-primary-500 transition-colors"
                                        title={t('common.copy')}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Collapsible Additional Fields Section */}
                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setShowAdditionalFields(!showAdditionalFields)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                            >
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                    {t('vault.entry.additional_info', 'Additional Information')}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showAdditionalFields ? 'rotate-180' : ''}`} />
                            </button>

                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showAdditionalFields ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
                                    {/* Recovery Phone */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-1">
                                            {t('vault.entry.recovery_phone', 'Recovery Phone')}
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="tel"
                                                value={formData.recoveryPhone || ''}
                                                onChange={e => setFormData({ ...formData, recoveryPhone: e.target.value })}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary-500 transition-all text-base md:text-sm text-slate-900 dark:text-white font-medium shadow-sm"
                                                placeholder={t('vault.entry.recovery_phone_placeholder', '+1 234 567 8900')}
                                            />
                                        </div>
                                    </div>

                                    {/* Recovery Email */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-1">
                                            {t('vault.entry.recovery_email', 'Recovery Email')}
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="email"
                                                value={formData.recoveryEmail || ''}
                                                onChange={e => setFormData({ ...formData, recoveryEmail: e.target.value })}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary-500 transition-all text-base md:text-sm text-slate-900 dark:text-white font-medium shadow-sm"
                                                placeholder={t('vault.entry.recovery_email_placeholder', 'backup@email.com')}
                                            />
                                        </div>
                                    </div>

                                    {/* Note */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-1">
                                            {t('vault.entry.note', 'Note')}
                                        </label>
                                        <div className="relative">
                                            <MessageSquare className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                            <textarea
                                                value={formData.note || ''}
                                                onChange={e => setFormData({ ...formData, note: e.target.value })}
                                                rows={3}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary-500 transition-all text-base md:text-sm text-slate-900 dark:text-white font-medium shadow-sm resize-none"
                                                placeholder={t('vault.entry.note_placeholder', 'Add notes or comments...')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Attachments Section */}
                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isPremium) {
                                        onUnlockPremium();
                                        return;
                                    }
                                    setShowAttachmentsSection(!showAttachmentsSection);
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                        {t('vault.entry.attachments', 'Attachments')}
                                    </span>
                                    {!isPremium && (
                                        <span className="text-[7.5px] font-extrabold uppercase tracking-wider text-primary-400 border border-primary-500/30 px-1.5 py-0.5 rounded bg-primary-500/10 flex items-center gap-0.5 select-none shrink-0">
                                            <Lock className="w-2 h-2 shrink-0" />
                                            PREMIUM
                                        </span>
                                    )}
                                </div>
                                {isPremium && (
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showAttachmentsSection ? 'rotate-180' : ''}`} />
                                )}
                            </button>

                            {isPremium && showAttachmentsSection && (
                                <div className="p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
                                    {formData.attachments && formData.attachments.length > 0 ? (
                                        <div className="space-y-2">
                                            {formData.attachments.map((att) => (
                                                <div key={att.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{att.name}</p>
                                                            <p className="text-xs text-slate-400">{(att.size / 1024).toFixed(1)} KB</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={isDownloadingAttachment === att.id}
                                                            onClick={() => handleDownloadAttachment(att.id)}
                                                            className="p-1.5 text-slate-500 hover:text-primary-500 dark:text-slate-400 dark:hover:text-primary-400 transition-colors disabled:opacity-50"
                                                            title={t('vault.attachment.download', 'Download / View')}
                                                        >
                                                            {isDownloadingAttachment === att.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Download className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteAttachment(att.id)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                                                            title={t('common.delete', 'Delete')}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 text-center py-2">{t('vault.attachment.no_attachments', 'No attachments yet.')}</p>
                                    )}

                                    <div className="flex items-center justify-center">
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="attachment-file-input"
                                            disabled={isUploadingAttachment}
                                        />
                                        <label
                                            htmlFor="attachment-file-input"
                                            className="cursor-pointer w-full py-2.5 px-4 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
                                        >
                                            {isUploadingAttachment ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                                            ) : (
                                                <Paperclip className="w-4 h-4" />
                                            )}
                                            {isUploadingAttachment ? t('vault.attachment.uploading', 'Uploading...') : t('vault.attachment.add', 'Add File Attachment')}
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 flex gap-3 pb-8 md:pb-0">
                            {entry && showDeleteConfirm ? (
                                <div className="flex-1 flex-row flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm font-medium"
                                    >
                                        {t('common.cancel', 'Cancel')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDelete(entry.id)}
                                        className="flex-1 px-4 py-4 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-all text-sm font-medium shadow-lg shadow-rose-500/20"
                                    >
                                        {t('common.confirm_delete', 'Delete')}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {entry && (
                                        <button
                                            type="button"
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="flex items-center justify-center px-5 py-4 rounded-xl border border-rose-100 dark:border-rose-900/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="px-6 py-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                    >
                                        {t('common.cancel', 'Cancel')}
                                    </button>

                                    <button
                                        type="submit"
                                        className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-medium shadow-xl hover:opacity-90 active:scale-[0.98] transition-all"
                                    >
                                        {entry ? t('vault.update') : t('vault.save')}
                                    </button>
                                </>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </Portal>
    );
};
