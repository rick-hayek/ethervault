
import React, { useState } from 'react';
import { ShieldCheck, Key, Fingerprint, ChevronRight, Lock, Eye, EyeOff, X, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SecurityService } from '@ethervault/core';
import appLogo from '../../assets/logo.png';

interface WelcomeViewProps {
  onComplete: (masterKey: string, bioEnabled: boolean) => void;
  biometricsSupported?: boolean;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onComplete, biometricsSupported = false }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [masterKey, setMasterKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');
  const [bioEnabled, setBioEnabled] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

  const handleNext = () => {
    if (step === 1) {
      if (masterKey.length < 8) {
        setError(t('welcome.error.length'));
        return;
      }

      // Enforce complexity
      const strength = SecurityService.calculateStrength(masterKey);
      if (strength === 'Weak' || strength === 'Medium') {
        setError(t('welcome.error.weak', 'Password is too weak. Use a mix of letters, numbers, and symbols.'));
        return;
      }
      if (masterKey !== confirmKey) {
        setError(t('welcome.error.match'));
        return;
      }
      setError('');

      setIsWarningModalOpen(true);
    } else {
      onComplete(masterKey, bioEnabled);
    }
  };

  const handleConfirmWarning = () => {
    setIsWarningModalOpen(false);
    if (!biometricsSupported) {
      onComplete(masterKey, false);
    } else {
      setStep(2);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 titlebar">
      <div className="max-w-md w-full no-drag">
        {/* Progress Bar - Only show if biometrics supported (multi-step) */}
        {biometricsSupported && (
          <div className="flex gap-2 mb-6 md:mb-8">
            <div className={`h-1 flex-1 rounded-full transition-all duration-700 ${step >= 1 ? 'bg-slate-900 dark:bg-white' : 'bg-slate-200 dark:bg-slate-800'}`} />
            <div className={`h-1 flex-1 rounded-full transition-all duration-700 ${step >= 2 ? 'bg-slate-900 dark:bg-white' : 'bg-slate-200 dark:bg-slate-800'}`} />
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-xl animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-6 md:mb-8 text-center">
            <img
              src={appLogo}
              alt="EtherVault Logo"
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl shadow-lg mx-auto mb-4 md:mb-6 transition-transform duration-500"
            />
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-1.5 tracking-tight">
              {step === 1 ? t('welcome.step1.title') : t('welcome.step2.title')}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
              {step === 1
                ? t('welcome.step1.subtitle')
                : t('welcome.step2.subtitle')}
            </p>
          </div>

          {step === 1 && (
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-1.5">
                <label className="text-[9px] md:text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] px-1">{t('welcome.master_key')}</label>
                <div className="relative group">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white" />
                  <input
                    type={showKey ? "text" : "password"}
                    value={masterKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[\x21-\x7E]*$/.test(val)) {
                        setMasterKey(val);
                      }
                    }}
                    placeholder={t('welcome.key_placeholder')}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl md:rounded-2xl py-3.5 md:py-4 pl-12 pr-12 outline-none focus:border-slate-400 transition-all text-slate-900 dark:text-white font-medium text-sm md:text-base"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    {showKey ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] md:text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] px-1">{t('welcome.verify_key')}</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white" />
                  <input
                    type={showKey ? "text" : "password"}
                    value={confirmKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[\x21-\x7E]*$/.test(val)) {
                        setConfirmKey(val);
                      }
                    }}
                    placeholder={t('welcome.repeat_placeholder')}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl md:rounded-2xl py-3.5 md:py-4 pl-12 pr-4 outline-none focus:border-slate-400 transition-all text-slate-900 dark:text-white font-medium text-sm md:text-base"
                  />
                </div>
              </div>

              {error && <p className="text-rose-500 text-[10px] font-medium uppercase tracking-wider text-center animate-pulse">{error}</p>}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 md:space-y-6 py-1">
              <div
                onClick={() => setBioEnabled(!bioEnabled)}
                className={`p-4 md:p-6 rounded-[1.5rem] md:rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 md:gap-6 ${bioEnabled
                  ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-white/5'
                  : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'
                  }`}
              >
                <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all ${bioEnabled ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  <Fingerprint className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold text-base md:text-lg transition-colors ${bioEnabled ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{t('welcome.biometric')}</h4>
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium italic">{t('welcome.biometric_subtitle')}</p>
                </div>
                <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all ${bioEnabled ? 'bg-slate-900 border-slate-900 dark:bg-white dark:border-white' : 'border-slate-200 dark:border-slate-700'}`}>
                  {bioEnabled && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900" />}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full mt-6 md:mt-10 flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-medium text-sm md:text-base shadow-xl transition-all active:scale-[0.98] hover:opacity-90"
          >
            {(step === 1 && biometricsSupported) ? t('welcome.next') : t('welcome.start')}
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {isWarningModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl p-6 relative overflow-hidden text-white flex flex-col space-y-5">
            {/* Top gradient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-amber-500/10 blur-2xl rounded-full pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => setIsWarningModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/80 transition-all active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title Header */}
            <div className="text-center space-y-2 mt-2">
              <div className="inline-flex p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 mb-2">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-white via-amber-200 to-amber-100 bg-clip-text text-transparent">
                {t('welcome.warning_modal.title', 'Master Password Warning')}
              </h2>
            </div>

            {/* Warning Message */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t('welcome.warning_modal.warning_title', 'Security Warning')}
              </h4>
              <p className="text-[10.5px] text-slate-350 leading-relaxed font-medium">
                {t('welcome.warning_modal.warning_desc', 'EtherVault is a zero-knowledge, local-first password manager. We do not store your master password on any servers. If you forget it, we cannot recover or reset it for you. Please make sure you have memorized your master password.')}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setIsWarningModalOpen(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all active:scale-[0.98]"
              >
                {t('welcome.warning_modal.action_back', 'Go Back')}
              </button>
              <button
                onClick={handleConfirmWarning}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20"
              >
                {t('welcome.warning_modal.action_continue', 'Continue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
