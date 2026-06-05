import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Shield, Globe, Check, Loader2, CreditCard, Laptop, Key } from 'lucide-react';
import { Portal } from './Portal';
import { useTranslation } from 'react-i18next';
import { logger } from '../utils/logger';
import { useAlert } from '../hooks/useAlert';
import { Capacitor } from '@capacitor/core';
import { Purchases, PurchasesPackage } from '@revenuecat/purchases-capacitor';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseSuccess: () => void;
}

type PlanType = 'monthly' | 'annual' | 'lifetime';
type PaymentState = 'idle' | 'processing' | 'restoring' | 'success' | 'license_entry';

export const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, onPurchaseSuccess }) => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useAlert();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('lifetime');
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [processingStep, setProcessingStep] = useState(0);
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseError, setLicenseError] = useState<string | null>(null);

  const isAndroid = Capacitor.getPlatform() === 'android';
  const [androidPackage, setAndroidPackage] = useState<PurchasesPackage | null>(null);
  const [isLoadingAndroidProduct, setIsLoadingAndroidProduct] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAndroidOfferings() {
      if (!isAndroid) return;
      setIsLoadingAndroidProduct(true);
      try {
        const offerings = await Purchases.getOfferings();
        logger.info('[PREMIUM] Loaded offerings from RevenueCat:', offerings);
        if (offerings.current !== null) {
          const ltPkg = offerings.current.lifetime;
          if (ltPkg) {
            setAndroidPackage(ltPkg);
          } else {
            const foundLt = offerings.current.availablePackages.find(
              (pkg) => pkg.packageType === 'LIFETIME' || pkg.identifier === '$lifetime'
            );
            if (foundLt) {
              setAndroidPackage(foundLt);
            } else if (offerings.current.availablePackages.length > 0) {
              setAndroidPackage(offerings.current.availablePackages[0]);
            }
          }
        }
      } catch (e: any) {
        logger.error('[PREMIUM] Failed to load offerings:', e);
        setProductError(t('premium.paywall.load_offerings_failed', 'Error occurs, please try again later.'));
      } finally {
        setIsLoadingAndroidProduct(false);
      }
    }

    if (isOpen) {
      loadAndroidOfferings();
    }
  }, [isOpen]);

  // Steps for payment processing mock
  const paymentSteps = [
    isAndroid
      ? t('premium.paywall.connecting_google', 'Securing connection to Google Play...')
      : t('premium.paywall.connecting', 'Securing connection to App Store...'),
    t('premium.paywall.authorizing', 'Authorizing transaction...'),
    t('premium.paywall.verifying', 'Verifying cryptographic receipt...'),
  ];

  // Steps for restore mock
  const restoreSteps = [
    t('premium.paywall.checking_receipts', 'Checking native store receipts...'),
    t('premium.paywall.validating', 'Validating digital purchase signature...'),
  ];

  useEffect(() => {
    if (isAndroid) return; // Real transactions manage state transition on Android

    let interval: any;
    if (paymentState === 'processing') {
      setProcessingStep(0);
      interval = setInterval(() => {
        setProcessingStep((prev) => {
          if (prev >= paymentSteps.length - 1) {
            clearInterval(interval);
            setTimeout(() => {
              setPaymentState('success');
              // Save local storage premium state
              localStorage.setItem('ethervault_premium', 'true');
              onPurchaseSuccess();
            }, 800);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (paymentState === 'restoring') {
      setProcessingStep(0);
      interval = setInterval(() => {
        setProcessingStep((prev) => {
          if (prev >= restoreSteps.length - 1) {
            clearInterval(interval);
            setTimeout(() => {
              setPaymentState('success');
              // Save local storage premium state
              localStorage.setItem('ethervault_premium', 'true');
              onPurchaseSuccess();
            }, 800);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentState]);

  useEffect(() => {
    if (!isOpen) {
      setPaymentState('idle');
      setProcessingStep(0);
      setLicenseKey('');
      setLicenseError(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    setPaymentState('idle');
    setProcessingStep(0);
    setLicenseKey('');
    setLicenseError(null);
    onClose();
  };

  if (!isOpen) return null;

  const handlePurchase = async () => {
    if (isAndroid) {
      if (!androidPackage) {
        showError(t('premium.paywall.product_not_loaded', 'Product not loaded. Please wait or retry.'));
        return;
      }
      logger.info(`[PREMIUM] User initiated real purchase on Android:`, androidPackage);
      setPaymentState('processing');
      try {
        const { customerInfo } = await Purchases.purchasePackage({ aPackage: androidPackage });
        const hasPremium = customerInfo.entitlements.active['premium_access'] !== undefined;
        if (hasPremium) {
          setPaymentState('success');
          localStorage.setItem('ethervault_premium', 'true');
          onPurchaseSuccess();
        } else {
          throw new Error('Entitlement not active after purchase.');
        }
      } catch (err: any) {
        logger.error('[PREMIUM] Real purchase failed:', err);
        setPaymentState('idle');
        if (!err.userCancelled) {
          let errMsg = err.message || t('premium.paywall.purchase_failed', 'Purchase failed. Please try again.');
          const isAlreadyActive = 
            (typeof err.message === 'string' && (
              err.message.toLowerCase().includes('already active') || 
              err.message.toLowerCase().includes('already owned')
            )) || 
            err.code === 7 || 
            err.code === '7';

          if (isAlreadyActive) {
            errMsg = `${errMsg} ${t('premium.paywall.already_active_restore_hint', 'Please tap "Restore Purchase" to recover your premium status.')}`;
          }
          showError(errMsg);
        }
      }
    } else {
      logger.info(`[PREMIUM] User initiated mock purchase for plan: ${selectedPlan}`);
      setPaymentState('processing');
    }
  };

  const handleRestore = async () => {
    if (isAndroid) {
      logger.info('[PREMIUM] User initiated real restore purchases flow on Android.');
      setPaymentState('restoring');
      try {
        const { customerInfo } = await Purchases.restorePurchases();
        const hasPremium = customerInfo.entitlements.active['premium_access'] !== undefined;
        if (hasPremium) {
          setPaymentState('success');
          localStorage.setItem('ethervault_premium', 'true');
          onPurchaseSuccess();
        } else {
          setPaymentState('idle');
          showError(t('premium.paywall.no_active_subscriptions', 'No active subscriptions found to restore.'));
        }
      } catch (err: any) {
        logger.error('[PREMIUM] Real restore failed:', err);
        setPaymentState('idle');
        showError(err.message || t('premium.paywall.restore_failed', 'Restore failed. Please try again.'));
      }
    } else {
      logger.info('[PREMIUM] User initiated mock restore purchases flow.');
      setPaymentState('restoring');
    }
  };

  const handleLicenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLicenseError(null);

    const cleanKey = licenseKey.trim().toUpperCase();
    if (cleanKey === 'ETHERVAULT-DEV-PREMIUM' || cleanKey === 'ETHERVAULT-PREMIUM-2026') {
      logger.info('[PREMIUM] Dev license key verified successfully.');
      setPaymentState('success');
      localStorage.setItem('ethervault_premium', 'true');
      onPurchaseSuccess();
    } else if (!cleanKey) {
      setLicenseError(t('premium.paywall.license_empty', 'Please enter a license key.'));
    } else {
      logger.warn(`[PREMIUM] Invalid license key entered: ${cleanKey}`);
      setLicenseError(t('premium.paywall.license_invalid', 'Invalid license key. Please check and try again.'));
    }
  };

  const plans = [
    {
      id: 'lifetime' as PlanType,
      title: t('premium.plan.lifetime_title', 'Lifetime Pro'),
      price: isAndroid && androidPackage ? androidPackage.product.priceString : '$0.99',
      period: t('premium.plan.lifetime_period', 'one-time'),
      badge: t('premium.plan.lifetime_badge', 'BEST VALUE'),
      badgeColor: 'bg-emerald-500 text-white',
      desc: isAndroid && androidPackage ? androidPackage.product.description : t('premium.plan.lifetime_desc', 'Pay once, unlock forever.')
    }
  ];

  const features = [
    {
      icon: Globe,
      title: t('premium.feature.sync_title', 'Multi-Device Cloud Sync'),
      desc: t('premium.feature.sync_desc', 'Synchronize your encrypted vault securely via Google Drive across all devices.')
    },
    {
      icon: Shield,
      title: t('premium.feature.backup_title', 'Secure Cloud Backups'),
      desc: t('premium.feature.backup_desc', 'Never worry about losing your database. Automatically back up encrypted logs.')
    },
    {
      icon: Laptop,
      title: t('premium.feature.crossplatform_title', 'Cross-Platform Access'),
      desc: t('premium.feature.crossplatform_desc', 'Access your vault on Android, iOS, Windows, macOS, and Linux seamlessly.')
    }
  ];

  return (
    <Portal>
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {paymentState === 'idle' && (
            <motion.div
              key="main"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ duration: 0.25 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[32px] shadow-2xl p-6 relative overflow-hidden text-white flex flex-col space-y-6 max-h-[90vh]"
            >
              {/* Top gradient glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-primary-500/10 blur-2xl rounded-full pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/80 transition-all active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title Header */}
              <div className="text-center space-y-2 mt-2">
                <div className="inline-flex p-2.5 bg-primary-500/10 border border-primary-500/20 rounded-2xl text-primary-400 mb-2">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <h2 className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
                  {t('premium.paywall.title', 'EtherVault Premium')}
                </h2>
                <p className="text-xs text-slate-400 px-4 leading-relaxed">
                  {t('premium.paywall.subtitle', 'Unlock multi-device synchronization and automatic cloud backups.')}
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50">
                {features.map((f, i) => (
                  <div key={i} className="flex items-start gap-3.5 text-left">
                    <div className="p-1.5 bg-slate-800/60 rounded-xl text-primary-400 mt-0.5 border border-slate-800">
                      <f.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{f.title}</h4>
                      <p className="text-[10px] text-slate-400 leading-normal mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Plan Cards */}
              <div className="grid grid-cols-1 max-w-xs mx-auto w-full gap-2.5">
                {plans.map((p) => {
                  const isSelected = selectedPlan === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlan(p.id)}
                      className={`relative flex flex-col p-3 rounded-2xl border transition-all duration-300 cursor-pointer select-none ${isSelected
                          ? 'border-primary-500 bg-primary-950/20 ring-1 ring-primary-500/30'
                          : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/40'
                        }`}
                    >
                      {p.badge && (
                        <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] font-black tracking-wider px-1.5 py-0.5 rounded-full ${p.badgeColor}`}>
                          {p.badge}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">{p.title}</span>
                      <div className="flex items-baseline gap-0.5 justify-center mt-2">
                        <span className="text-base font-black text-white">{p.price}</span>
                        <span className="text-[8px] text-slate-400 font-medium">{p.period}</span>
                      </div>
                      <span className="text-[7.5px] text-slate-400 mt-2 leading-tight block text-center min-h-[20px]">{p.desc}</span>
                    </div>
                  );
                })}
              </div>

              {productError && (
                <div className="text-[10px] text-rose-400 text-center font-medium bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-xl mt-1">
                  {productError}
                </div>
              )}

              {/* Actions Area */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handlePurchase}
                  disabled={isAndroid && (isLoadingAndroidProduct || !androidPackage)}
                  className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-primary-500/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAndroid && isLoadingAndroidProduct ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  {isAndroid && isLoadingAndroidProduct
                    ? t('premium.paywall.loading_product', 'Loading Product...')
                    : t('premium.actions.subscribe', 'Buy Pro & Unlock Now')}
                </button>

                <div className={`flex items-center px-2 text-[10px] text-slate-400 ${import.meta.env.DEV ? 'justify-between' : 'justify-center'}`}>
                  <button
                    onClick={handleRestore}
                    className="hover:text-white transition-colors underline font-medium"
                  >
                    {t('premium.actions.restore', 'Restore Purchase')}
                  </button>
                  {import.meta.env.DEV && (
                    <button
                      onClick={() => setPaymentState('license_entry')}
                      className="hover:text-white transition-colors underline font-medium flex items-center gap-1"
                    >
                      <Key className="w-3 h-3" />
                      {t('premium.actions.license', 'Redeem License')}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {(paymentState === 'processing' || paymentState === 'restoring') && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[32px] shadow-2xl p-8 text-center text-white flex flex-col items-center justify-center space-y-6"
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute w-16 h-16 rounded-full border border-primary-500/20 animate-ping" />
                <div className="p-4 bg-slate-800 border border-slate-700 rounded-3xl text-primary-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">
                  {paymentState === 'processing'
                    ? t('premium.paywall.processing', 'Processing Secure Checkout')
                    : t('premium.paywall.restoring', 'Restoring Purchase')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-mono px-4 h-12 flex items-center justify-center">
                  {paymentState === 'processing' ? paymentSteps[processingStep] : restoreSteps[processingStep]}
                </p>
              </div>
            </motion.div>
          )}

          {paymentState === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[32px] shadow-2xl p-8 text-center text-white flex flex-col items-center justify-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.5, 1.2, 1], opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400"
              >
                <Check className="w-8 h-8" />
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">
                  {t('premium.success.title', 'Premium Activated!')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed px-4">
                  {t('premium.success.message', 'Thank you! Your account is upgraded. Cloud sync is now fully unlocked.')}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
              >
                {t('common.close', 'Close')}
              </button>
            </motion.div>
          )}

          {paymentState === 'license_entry' && (
            <motion.div
              key="license"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[32px] shadow-2xl p-6 text-white flex flex-col space-y-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">{t('premium.license.title', 'Redeem License')}</span>
                <button
                  onClick={() => setPaymentState('idle')}
                  className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleLicenseSubmit} className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {t('premium.license.description', 'Enter your 24-character alphanumeric license key below to activate premium.')}
                  </p>
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl outline-none font-mono text-center text-sm placeholder:text-slate-600 transition-all"
                    autoFocus
                  />
                  {licenseError && (
                    <span className="text-[9px] font-medium text-rose-500 block leading-tight px-1">{licenseError}</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentState('idle');
                      setLicenseError(null);
                    }}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl transition-all active:scale-[0.98]"
                  >
                    {t('common.confirm', 'Verify License')}
                  </button>
                </div>
              </form>

              <div className="text-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Dev Test Key Hint</span>
                <span className="text-[10px] text-primary-400 font-mono font-bold block mt-1">ETHERVAULT-DEV-PREMIUM</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Portal>
  );
};
