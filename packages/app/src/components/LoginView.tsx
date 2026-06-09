import React, { useState } from 'react';
import { ShieldCheck, Lock, Fingerprint, ChevronRight, Eye, EyeOff, X, AlertTriangle, Settings, Mail, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BiometricService } from '../utils/BiometricService';
import { Capacitor } from '@capacitor/core';
import { getStorageService } from '@ethervault/core';
import appLogo from '../../assets/logo.png';
import { useAlert } from '../hooks/useAlert';

interface LoginViewProps {
  onLogin: (masterKey: string) => Promise<boolean> | boolean;
  bioEnabled: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, bioEnabled }) => {
  const { t } = useTranslation();
  const { showError } = useAlert();
  const [key, setKey] = useState('');
  const [error, setError] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isBioLoading, setIsBioLoading] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'immaxgreat@gmail.com';

  const getResetSteps = () => {
    const isDesktop = !!(window as any).electronAPI;
    const currentPlatform = isDesktop ? 'desktop' : Capacitor.getPlatform();

    if (currentPlatform === 'android') {
      return [
        t('login.reset_modal.android_step1', "Go to your device's System Settings."),
        t('login.reset_modal.android_step2', 'Navigate to Apps > EtherVault > Storage.'),
        t('login.reset_modal.android_step3', "Tap 'Clear Storage' or 'Clear Data' to delete the database."),
        t('login.reset_modal.android_step4', 'Relaunch the app to set up a new master password.')
      ];
    } else if (currentPlatform === 'ios') {
      return [
        t('login.reset_modal.ios_step1', "Press and hold the EtherVault icon on your Home Screen."),
        t('login.reset_modal.ios_step2', "Tap 'Remove App' then 'Delete App' to uninstall and wipe all local storage."),
        t('login.reset_modal.ios_step3', "Reinstall EtherVault from the App Store."),
        t('login.reset_modal.ios_step4', "Relaunch the app to set up a new master password.")
      ];
    } else if (currentPlatform === 'desktop') {
      return [
        t('login.reset_modal.desktop_step1', "Close the EtherVault application."),
        t('login.reset_modal.desktop_step2', "Go to the AppData folder (macOS: '~/Library/Application Support/EtherVault', Windows: '%APPDATA%\\EtherVault')."),
        t('login.reset_modal.desktop_step3', "Delete the entire 'EtherVault' folder to delete database and config."),
        t('login.reset_modal.desktop_step4', "Relaunch the app to set up a new master password.")
      ];
    } else {
      return [
        t('login.reset_modal.web_step1', "Open your browser's Developer Tools (F12)."),
        t('login.reset_modal.web_step2', "Go to the Application or Storage tab."),
        t('login.reset_modal.web_step3', "Select IndexedDB, find 'EtherVaultDB', and click 'Delete database', then clear Local Storage."),
        t('login.reset_modal.web_step4', "Reload the webpage to set up a new master password.")
      ];
    }
  };

  const handleProgrammaticReset = async () => {
    const confirmMessage = t('login.reset_modal.confirm_reset', 'WARNING: This will permanently delete all your local credentials and reset the app. This cannot be undone! Are you absolutely sure?');
    if (window.confirm(confirmMessage)) {
      try {
        // 1. Close active database connection
        const storageService = getStorageService();
        await storageService.close();

        // 2. Delete IndexedDB database
        await new Promise<void>((resolve, reject) => {
          const req = indexedDB.deleteDatabase('EtherVaultDB');
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
          req.onblocked = () => {
            console.warn('Database delete request blocked. Force reloading...');
            resolve();
          };
        });

        // 3. Clear localStorage
        localStorage.clear();

        // 4. Force reload
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear data programmatically:', error);
        showError(t('login.reset_modal.reset_failed', 'Automatic reset failed. Please use the manual steps instead.'));
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const success = await onLogin(key);
    if (!success) {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleBioAuth = async () => {
    setIsBioLoading(true);
    try {
      const secret = await BiometricService.retrieveSecret();
      if (secret) {
        const success = await onLogin(secret);
        if (!success) {
          setError(true);
          setTimeout(() => setError(false), 2000);
        }
      }
    } catch (e) {
      console.error('Bio auth failed', e);
      setError(true);
    } finally {
      setIsBioLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden titlebar">
      <div className="max-w-md w-full relative z-10 text-center no-drag">
        <img
          src={appLogo}
          alt="EtherVault Logo"
          className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl shadow-2xl mx-auto mb-6 md:mb-8 transition-transform duration-500"
        />

        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-1.5 tracking-tighter">EtherVault</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6 md:mb-10 text-[10px] md:text-xs font-medium uppercase tracking-widest">{t('login.locked_local_db')}</p>

        <div className={`bg-white dark:bg-slate-900 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-xl transition-all duration-300`}>
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] md:text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] px-1">{t('login.master_password')}</label>
              <div className="relative group">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${error ? 'text-rose-500' : 'text-slate-400 group-focus-within:text-primary-500'}`} />
                <input
                  type={showKey ? "text" : "password"}
                  value={key}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[\x21-\x7E]*$/.test(val)) {
                      setKey(val);
                    }
                  }}
                  placeholder={t('login.unlock_placeholder')}
                  autoFocus
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl md:rounded-2xl py-3.5 md:py-4 pl-12 pr-12 outline-none focus:border-primary-500 transition-all text-slate-900 dark:text-white font-medium text-center tracking-widest text-sm md:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  {showKey ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
                </button>
              </div>
              <div className="flex justify-between items-center px-1 mt-2">
                {error ? (
                  <p className="text-rose-500 text-[10px] font-semibold uppercase tracking-wider">{t('login.invalid_key')}</p>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-[10px] font-bold text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors uppercase tracking-wider cursor-pointer active:scale-95"
                >
                  {t('login.forgot_password', 'Forgot Password?')}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-primary-600/85 hover:bg-primary-600 text-white py-3.5 md:py-4 rounded-xl md:rounded-2xl font-medium text-sm md:text-base shadow-xl shadow-primary-500/20 transition-all active:scale-[0.98]"
            >
              {t('login.access_vault')}
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </form>

          {bioEnabled && (
            <>
              <div className="flex items-center gap-3 md:gap-4 my-6 md:my-8">
                <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800" />
                <span className="text-[8px] md:text-[9px] font-medium text-slate-400 uppercase tracking-[0.3em]">{t('login.secure_id')}</span>
                <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800" />
              </div>

              <button
                onClick={handleBioAuth}
                disabled={isBioLoading}
                className="w-full flex items-center justify-center gap-3 py-3 md:py-4 rounded-xl md:rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary-500/50 dark:hover:border-primary-500/50 text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 font-medium text-sm md:text-base transition-all active:scale-[0.98] group"
              >
                <Fingerprint className={`w-5 h-5 md:w-6 md:h-6 ${isBioLoading ? 'animate-pulse' : ''}`} />
                {isBioLoading ? t('login.system_auth') : t('login.unlock_bio')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Reset Vault Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl p-6 relative overflow-hidden text-white flex flex-col space-y-5">
            {/* Top gradient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-rose-500/10 blur-2xl rounded-full pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/80 transition-all active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title Header */}
            <div className="text-center space-y-2 mt-2">
              <div className="inline-flex p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 mb-2">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-white via-rose-200 to-rose-100 bg-clip-text text-transparent">
                {t('login.reset_modal.title', 'Forgot Master Password?')}
              </h2>
            </div>

            {/* Warning Message */}
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-left">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t('login.reset_modal.warning_title', 'Security Warning')}
              </h4>
              <p className="text-[10px] text-slate-350 leading-relaxed font-medium">
                {t('login.reset_modal.warning_desc', 'EtherVault is a zero-knowledge, local-first password manager. We do not store your master password on any servers. If you forget it, we cannot recover or reset it for you. ALL credentials stored in this local vault will be permanently lost if you reset.')}
              </p>
            </div>

            {/* Reset Steps */}
            <div className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 text-left text-white">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Settings className="w-3.5 h-3.5 text-primary-400" />
                {t('login.reset_modal.steps_title', 'How to Reset / Start Fresh')}
              </h4>
              <ol className="list-decimal list-inside text-[10px] text-slate-400 space-y-1.5 leading-relaxed">
                {getResetSteps().map((step, idx) => (
                  <li key={idx} className="pl-1 text-slate-300">
                    <span className="text-slate-400">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Contact Support */}
            <div className="flex items-center gap-3.5 bg-slate-950/20 p-3 rounded-2xl border border-slate-800/40 text-left">
              <div className="p-2 bg-slate-800 rounded-xl text-primary-400">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider leading-none mb-1">
                  {t('login.reset_modal.support_title', 'Need Assistance?')}
                </h5>
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-[10px] text-primary-400 hover:underline break-all block leading-tight font-medium"
                >
                  {contactEmail}
                </a>
              </div>
            </div>

            {/* Close action */}
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-250 text-xs font-semibold rounded-xl transition-all"
            >
              {t('common.close', 'Close')}
            </button>

            {/* Inconspicuous One-Click Reset Link */}
            <div className="text-center pt-1">
              <button
                onClick={handleProgrammaticReset}
                className="text-[9px] text-slate-600 hover:text-rose-500/80 transition-colors uppercase tracking-wider underline cursor-pointer active:scale-95"
              >
                {t('login.reset_modal.action_reset', 'One-Click Reset (Destructive)')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
