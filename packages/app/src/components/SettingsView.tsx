
import React, { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import {
  Fingerprint,
  Shield,
  Sparkles,
  Clock,
  Moon,
  Smartphone,
  Cloud,
  Check,
  RefreshCcw,
  Database,
  Lock,
  Globe,
  Bell,
  Languages,
  FileText,
  Activity,
  X,
  Trash2,
  Loader2,
  Info,
  ChevronLeft,
  ChevronRight,
  Palette,
  Send,
  CloudUpload,
  Download
} from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Portal } from './Portal';
import { useTranslation } from 'react-i18next';
import { BiometricService } from '../utils/BiometricService';
import { AppSettings, CloudProvider, getAuthService, getVaultService, CloudService, getCryptoService, NETWORK_TIMEOUT_MS, SecurityService } from '@ethervault/core';
import { ImportModal } from './ImportModal';
import { ExportModal } from './ExportModal';
import { SyncWarningModal } from './SyncWarningModal';
import { SyncConflictModal, ConflictResolution } from './SyncConflictModal';
import { CloudVaultFoundModal } from './CloudVaultFoundModal';
import { AboutModal } from './AboutModal';
import { PrivacyModal } from './PrivacyModal';
import { TermsModal } from './TermsModal';
import { FAQModal } from './FAQModal';
import { useAlert } from '../hooks/useAlert';
import { useBackHandler } from '../hooks/useBackHandler';
import { useTheme } from '../hooks/ThemeContext';
import { MobileFileService } from '../utils/MobileFileService';
import { CustomDropdown } from './CustomDropdown';

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  onDataChange: () => void;
  biometricsSupported?: boolean;
  onUnlockPremium?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings, onDataChange, biometricsSupported = false, onUnlockPremium }) => {
  const { t, i18n } = useTranslation();
  const { activeTheme, setTheme, allThemes } = useTheme();

  const dropdownBtnClass = "bg-surface border border-primary-500/10 dark:border-primary-400/10 text-xs text-primary-600 dark:text-primary-400 rounded-theme py-1.5 px-3 outline-none hover:border-primary-500/30 transition-all flex items-center justify-between w-40 select-none font-medium";
  const dropdownMenuClass = "absolute right-0 z-50 w-48 bg-surface-card border border-primary-500/10 dark:border-primary-400/10 rounded-theme-lg shadow-theme-lg overflow-hidden py-1 animate-in fade-in duration-150";

  // Modals State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isFAQModalOpen, setIsFAQModalOpen] = useState(false);


  // Sync Warning State
  const [isSyncWarningModalOpen, setIsSyncWarningModalOpen] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<CloudProvider | null>(null);

  // Connection State
  const [cloudConnected, setCloudConnected] = useState(() => CloudService.isSyncEnabled());

  // Use Ref to track syncing state in event listeners (avoiding stale closures)
  const [isSyncing, _setIsSyncing] = useState(false);
  const isSyncingRef = React.useRef(false);
  const setIsSyncing = (value: boolean) => {
    isSyncingRef.current = value;
    _setIsSyncing(value);
  };

  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeStatus, setPasswordChangeStatus] = useState('');

  // Premium Banner Hidden State
  const [isPremiumBannerDismissed, setIsPremiumBannerDismissed] = useState(() => {
    return localStorage.getItem('ethervault_hide_premium_banner') === 'true';
  });

  // Use Ref to track mounting state to prevent auto-sync on view load
  const isMountingRef = React.useRef(true);

  useEffect(() => {
    isMountingRef.current = true;

    // Subscribe to CloudService connection changes
    const unsubscribe = CloudService.onConnectionChange((connected) => {
      logger.info(`[SettingsView] onConnectionChange event: connected=${connected}, mounting=${isMountingRef.current}`);
      setCloudConnected(connected);

      // SKIP the immediate callback that runs on mount.
      if (isMountingRef.current) {
        logger.info('[SettingsView] Skipping auto-sync on mount/initial subscription.');
        return;
      }

      // Auto-trigger setup when connection is fully established (e.g. after Deep Link)
      if (connected && !isSyncingRef.current) {
        const activeId = CloudService.activeProvider?.id as CloudProvider;
        if (activeId) {
          logger.info('[SettingsView] Connection confirmed (Update). Scheduling sync resume for:', activeId);
          // Use setTimeout to yield to render cycle and ensure state updates flush
          setTimeout(() => {
            if (!isSyncingRef.current) {
              logger.info('[SettingsView] Executing auto-sync...');
              connectToProvider(activeId);
            }
          }, 500);
        } else {
          logger.warn('[SettingsView] Connected but no active provider ID found.');
        }
      }
    });

    // Unblock updates after the initial synchronous callback has fired
    isMountingRef.current = false;

    return () => unsubscribe();
  }, []); // Remove dependencies to avoid stale closures if possible, or verify safe

  // Auto-sync trigger: When navigated from conflict resolution re-login
  useEffect(() => {
    const pendingSync = localStorage.getItem('ethervault_pending_sync');
    if (pendingSync === 'true' && settings.cloudProvider !== 'none') {
      localStorage.removeItem('ethervault_pending_sync');
      logger.info('[SettingsView] Pending sync detected, auto-triggering sync.');
      // Small delay to allow UI to render first
      setTimeout(() => {
        handleSync(settings.cloudProvider);
      }, 500);
    }
  }, [settings.cloudProvider]); // Trigger when cloud provider is set

  const { showAlert, showSuccess, showError, showWarning, showInfo } = useAlert();

  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<string[]>([]);
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string>(__APP_VERSION__);
  const [isSendingLogs, setIsSendingLogs] = useState(false);

  // Conflict Resolution State
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictCloudMeta, setConflictCloudMeta] = useState<{ salt: string; verifier: string; opslimit?: number; memlimit?: number } | null>(null);
  const [localEntryCount, setLocalEntryCount] = useState(0);

  // Cloud Vault Found State (Empty Local Vault case)
  const [isCloudVaultFoundModalOpen, setIsCloudVaultFoundModalOpen] = useState(false);
  const [foundCloudMeta, setFoundCloudMeta] = useState<{ salt: string; verifier: string; opslimit?: number; memlimit?: number } | null>(null);
  const [foundProvider, setFoundProvider] = useState<CloudProvider | null>(null);

  // Biometric Modal State
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [bioPassword, setBioPassword] = useState('');
  const [bioError, setBioError] = useState<string | null>(null);

  useBackHandler('settings-view', async () => {
    if (isCacheConfirmOpen) { setIsCacheConfirmOpen(false); return true; }
    if (isActivityModalOpen) { setIsActivityModalOpen(false); return true; }
    if (isPasswordModalOpen) { setIsPasswordModalOpen(false); return true; }
    if (isBioModalOpen) { setIsBioModalOpen(false); return true; }
    if (isExportModalOpen) { setIsExportModalOpen(false); return true; }
    if (isImportModalOpen) { setIsImportModalOpen(false); return true; }
    if (isSyncWarningModalOpen) { setIsSyncWarningModalOpen(false); return true; }
    if (isConflictModalOpen) { setIsConflictModalOpen(false); return true; }
    if (isCloudVaultFoundModalOpen) { setIsCloudVaultFoundModalOpen(false); return true; }
    if (isPrivacyModalOpen) { setIsPrivacyModalOpen(false); return true; }
    if (isFAQModalOpen) { setIsFAQModalOpen(false); return true; }
    return false;
  }, true); // Enabled by default

  useEffect(() => {
    // Runtime check for version (Desktop overrides Web build version)
    const checkVersion = async () => {
      if (window.electronAPI?.getVersion) {
        const ver = await window.electronAPI.getVersion();
        setAppVersion(ver);
      }
    };
    checkVersion();
  }, []);

  const fetchLogs = async () => {
    if (logger.getRecentLogs) {
      const logs = await logger.getRecentLogs();
      setActivityLogs(logs);
    }
  };

  const handleSendLogReport = async () => {
    setIsSendingLogs(true);
    try {
      const email = import.meta.env.VITE_CONTACT_EMAIL || 'support@ethervault.app';

      // 1. Electron Desktop Environment
      if (window.electronAPI?.sendLogReport) {
        const result = await window.electronAPI.sendLogReport(email);
        if (result) {
          showSuccess(t('settings.success.log_report_sent', 'Log report save prompted successfully!'));
        }
        return;
      }

      // 2. Mobile (Capacitor Native) Environment
      if (Capacitor.isNativePlatform()) {
        const logs = await logger.getRecentLogs();
        const logContent = logs.length > 0 ? [...logs].reverse().join('\n') : 'No logs recorded.';

        // Compress using CompressionStream
        const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
        const compressionStream = new CompressionStream('gzip');
        const compressedStream = blob.stream().pipeThrough(compressionStream);
        const compressedBlob = await new Response(compressedStream).blob();

        // Convert Blob to base64
        const blobToBase64 = (b: Blob): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = reader.result as string;
              resolve(res.substring(res.indexOf(',') + 1));
            };
            reader.onerror = reject;
            reader.readAsDataURL(b);
          });
        };

        const base64Data = await blobToBase64(compressedBlob);
        const filename = 'ethervault-logs.gz';

        // Write file to Cache directory
        const fileResult = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache
        });

        // Share the file
        await Share.share({
          title: 'EtherVault Logs',
          text: 'Support Report: Logs from EtherVault.',
          url: fileResult.uri,
          dialogTitle: 'Share Log Report'
        });

        showSuccess(t('settings.success.log_report_shared', 'Logs compressed and ready to share!'));
        return;
      }

      // 3. Web (Browser) Fallback
      const logs = await logger.getRecentLogs();
      const logContent = logs.length > 0 ? [...logs].reverse().join('\n') : 'No logs recorded.';

      const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
      const compressedBlob = await new Response(blob.stream().pipeThrough(new CompressionStream('gzip'))).blob();

      // Download file
      const url = URL.createObjectURL(compressedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ethervault-logs.gz';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Open mailto link
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent('EtherVault Log Report')}&body=${encodeURIComponent('Please attach the downloaded ethervault-logs.gz file to this email.')}`;
      window.open(mailtoUrl, '_blank');

      showSuccess(t('settings.success.log_report_downloaded', 'Logs downloaded. Please attach them to the support email.'));
    } catch (e: any) {
      console.error('Failed to send log report:', e);
      showError(t('settings.error.log_report_failed', `Failed to send log report: ${e.message || e}`));
    } finally {
      setIsSendingLogs(false);
    }
  };

  const [isCacheConfirmOpen, setIsCacheConfirmOpen] = useState(false);

  const performClearCache = async () => {
    // 1. Clear Local Storage Logs
    localStorage.removeItem('ethervault_logs');

    // 2. Clear Electron Cache
    if (window.electronAPI?.clearCache) {
      await window.electronAPI.clearCache();
    }

    // 3. Clear State immediately
    setActivityLogs([]);

    // 4. Close the confirmation modal
    setIsCacheConfirmOpen(false);

    // 5. Show Feedback
    setCacheMessage(t('settings.success.cache_cleared') || 'Cache Cleared!');
    setTimeout(() => setCacheMessage(null), 2000);
  };

  useEffect(() => {
    if (isActivityModalOpen) {
      fetchLogs();
    }
  }, [isActivityModalOpen]);

  // Wrapper to fetch entries for export
  const ExportModalWrapper = ({ onClose }: { onClose: () => void }) => {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
      getVaultService().getEntries()
        .then(data => {
          setEntries(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load entries for export:', err);
          setLoading(false);
          setError('Failed to decrypt vault data. Please log in again with the correct master password.');
        });
    }, []);

    if (error) {
      return (
        <Portal>
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-surface-card w-full max-w-sm rounded-theme-lg border border-rose-200 dark:border-rose-900/30 shadow-theme-lg p-6 text-center space-y-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center mx-auto text-rose-500">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Export Failed</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{error}</p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-medium rounded-xl uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        </Portal>
      );
    }

    if (loading) return null;

    return (
      <ExportModal
        entries={entries}
        onClose={onClose}
        onExport={async (format) => {
          try {
            const date = new Date().toISOString().split('T')[0];
            const filename = `ethervault-backup-${date}.${format}`;
            let content = '';

            if (format === 'json') {
              const cleanedEntries = entries.map(({ tags, lastUpdated, favorite, ...rest }) => rest);
              content = JSON.stringify(cleanedEntries, null, 2);
            } else {
              const headers = ['Title', 'Username', 'Password', 'Website', 'Category', 'Notes'];
              const rows = entries.map(e =>
                [e.title, e.username, e.password, e.website, e.category, e.notes]
                  .map(field => `"${(field || '').replace(/"/g, '""')}"`) // Escape quotes
                  .join(',')
              );
              content = [headers.join(','), ...rows].join('\n');
            }

            // Mobile Native Export
            if (await MobileFileService.exportFile(filename, content)) {
              showSuccess(t('export.success_mobile', 'Export successful! Saved to device storage (Downloads/Documents).'));
              onClose();
              return;
            }

            const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            onClose();
          } catch (err: any) {
            console.error('Export failed', err);
            showError(err.message || 'Export failed');
          }
        }}
      />
    );
  };

  const toggleBiometrics = async () => {
    // If disabling
    if (settings.biometricsEnabled) {
      const success = await BiometricService.deleteSecret();
      if (success) {
        setSettings({ ...settings, biometricsEnabled: false });
        localStorage.removeItem('ethervault_bio'); // Clear legacy flag if any
      } else {
        showError(t('settings.error.failed'));
      }
      return;
    }

    // If enabling, check if available first
    const available = await BiometricService.isAvailable();
    if (!available) {
      showError(t('settings.error.no_bio', 'Biometrics not available on this device.'));
      return;
    }

    // Open modal to get password
    setIsBioModalOpen(true);
    setBioPassword('');
    setBioError(null);
  };

  const handleBioConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setBioError(null);

    // Verify password against current auth
    const isValid = await getAuthService().verifyPassword(bioPassword);
    if (!isValid) {
      setBioError(t('settings.error.incorrect'));
      return;
    }

    // Save secret
    const success = await BiometricService.saveSecret(bioPassword);
    if (success) {
      setSettings({ ...settings, biometricsEnabled: true });
      localStorage.setItem('ethervault_bio', 'true'); // legacy/flag
      setIsBioModalOpen(false);
      showSuccess(t('settings.success.biometric_enabled'));
    } else {
      setBioError(t('settings.error.failed'));
    }
  };

  const connectToProvider = async (provider: CloudProvider) => {
    logger.info('[SettingsView] connectToProvider called for:', provider);
    setIsSyncing(true);
    try {
      CloudService.useProvider(provider);
      const connected = await CloudService.connect();
      logger.info('[SettingsView] CloudService.connect result:', connected);

      if (!connected) {
        console.warn('Failed to connect to provider', provider);
        logger.info('[SettingsView] Calling showError with literal string...');
        showError(t('settings.cloud.connection_failed', 'Connection failed. Please check your network.'));
        return;
      }

      // WAIT FOR NATIVE AUTH:
      // If connected is true (flow started) but sync not enabled (token missing),
      // we must wait for the deep link callback (onConnectionChange) to resume.
      if (!CloudService.isSyncEnabled()) {
        logger.info('[SettingsView] Native Auth started. Waiting for redirect/token...');
        return;
      }

      // Check if cloud has existing metadata
      const cloudMeta = await CloudService.fetchMetadata();

      if (cloudMeta?.salt) {
        // Cloud has data - check if salt matches local
        const localSalt = await getAuthService().getSaltBase64();

        if (localSalt && cloudMeta.salt !== localSalt) {
          // Salt mismatch - check if we have local entries
          const localEntries = await getVaultService().getEncryptedEntries();

          if (localEntries.length > 0) {
            // CONFLICT: Both local and cloud have different salts
            setLocalEntryCount(localEntries.length);
            setConflictCloudMeta(cloudMeta);
            setIsConflictModalOpen(true);
            return;
          } else {
            // No local entries - show confirmation modal to prevent lockouts
            setFoundCloudMeta(cloudMeta);
            setFoundProvider(provider);
            setIsCloudVaultFoundModalOpen(true);
            return;
          }
        }
      }

      // No conflict - proceed normally
      setSettings({ ...settings, cloudProvider: provider, lastSync: t('sync.syncing') });

      // Auto-trigger sync after successful connection
      const entries = await getVaultService().getEncryptedEntries();
      const result = await CloudService.sync(entries);

      if (result && result.updatedEntries.length > 0) {
        await getVaultService().processCloudEntries(result.updatedEntries);
        onDataChange(); // Refresh UI with new entries
      }

      setSettings({ ...settings, cloudProvider: provider, lastSync: t('sync.just_now') });
    } catch (e: any) {
      console.error('Provider connection error', e);

      // Handle specific errors
      if (e.message?.includes('MISSING_VERIFIER') || e.message?.includes('INVALID_VERIFIER')) {
        showError(t('sync.error.missing_verifier',
          'Cloud vault is missing password verification data. Please sync from the original device first to update cloud metadata.'));
      } else {
        // Show FULL error details for debugging
        const errorMsg = e instanceof Error ? e.message : String(e);
        showError(`${t('settings.error.failed')} (${errorMsg})`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncConfirm = () => {
    if (pendingProvider) {
      localStorage.setItem(`ethervault_sync_warning_${pendingProvider}`, 'true');
      setIsSyncWarningModalOpen(false);
      connectToProvider(pendingProvider);
      setPendingProvider(null);
    }
  };

  const handleConflictResolve = async (resolution: ConflictResolution, cloudPassword?: string) => {
    if (resolution === 'cancel') {
      setIsConflictModalOpen(false);
      setConflictCloudMeta(null);
      return;
    }

    setIsSyncing(true);

    try {
      switch (resolution) {
        case 'merge':
          if (!cloudPassword || !conflictCloudMeta) {
            showError(t('sync.error.missing_password', 'Cloud password is required for merge.'));
            setIsSyncing(false);
            return;
          }

          // 1. Derive cloud key
          const cloudKey = await getAuthService().deriveKeyWithSalt(cloudPassword, conflictCloudMeta.salt, conflictCloudMeta.opslimit, conflictCloudMeta.memlimit);

          // 2. Download all cloud entries
          const cloudEntries = await CloudService.downloadAllEntries();

          if (cloudEntries.length === 0) {
            showError(t('sync.error.no_cloud_entries', 'No cloud entries found to merge.'));
            setIsSyncing(false);
            return;
          }

          // 3. Merge: decrypt with cloud key, re-encrypt with local key
          const mergedCount = await getVaultService().mergeCloudEntries(cloudEntries, cloudKey);

          // CRITICAL: Validate merge succeeded before clearing cloud
          // If cloudEntries existed but mergedCount is 0, decryption failed (wrong password)
          if (mergedCount === 0) {
            showError(t('sync.error.wrong_password', 'Incorrect cloud password. Decryption failed. Please try again.'));
            setIsSyncing(false);
            return; // Do NOT clear cloud data! Keep modal open for retry
          }

          // 4. Clear cloud and re-upload with local credentials
          await CloudService.clearRemoteData();

          // 5. Trigger full sync to upload merged data
          const localEntries = await getVaultService().getEncryptedEntries();
          await CloudService.sync(localEntries);

          setSettings({ ...settings, cloudProvider: pendingProvider || settings.cloudProvider, lastSync: t('sync.just_now') });
          onDataChange();
          setIsConflictModalOpen(false); // Close modal on success
          setConflictCloudMeta(null); // Cleanup
          showSuccess(t('sync.merge_complete', `Successfully merged ${mergedCount} entries from cloud.`));
          break;

        case 'use_cloud':
          if (!conflictCloudMeta) return;

          // Cloud Conflict Password Verification: Verify cloud password BEFORE clearing local vault
          // This prevents data loss if user doesn't know the cloud password
          if (!cloudPassword) {
            showError(t('sync.error.password_required', 'Cloud password is required to verify access before switching.'));
            return;
          }

          // Derive key with cloud salt (same as merge case)
          const useCloudKey = await getAuthService().deriveKeyWithSalt(cloudPassword, conflictCloudMeta.salt, conflictCloudMeta.opslimit, conflictCloudMeta.memlimit);

          // Download cloud entries and try to decrypt one to verify password
          const useCloudEntries = await CloudService.downloadAllEntries();
          if (useCloudEntries.length > 0) {
            try {
              getCryptoService().decrypt(useCloudEntries[0].payload, useCloudEntries[0].nonce, useCloudKey);
            } catch (e) {
              showError(t('sync.error.wrong_password', 'Incorrect cloud password. Decryption failed.'));
              return;
            }
          }

          // Password verified - now safe to clear local and adopt cloud
          await getVaultService().clearLocalVault();
          await getAuthService().importCloudCredentials(conflictCloudMeta.salt, conflictCloudMeta.verifier, conflictCloudMeta.opslimit, conflictCloudMeta.memlimit);

          showSuccess(t('sync.use_cloud_complete', 'Switched to cloud vault. Please log in again with your cloud password.'));
          setIsConflictModalOpen(false);
          setConflictCloudMeta(null);
          localStorage.setItem('ethervault_pending_sync', 'true');
          window.location.reload();
          break;

        case 'use_local':
          // Clear cloud and upload local data
          await CloudService.clearRemoteData();

          // Trigger sync to upload local data
          const entries = await getVaultService().getEncryptedEntries();
          await CloudService.sync(entries);

          setSettings({ ...settings, cloudProvider: pendingProvider || settings.cloudProvider, lastSync: t('sync.just_now') });
          setIsConflictModalOpen(false); // Close modal on success
          setConflictCloudMeta(null);
          showSuccess(t('sync.use_local_complete', 'Cloud has been overwritten with local data.'));
          break;
      }
    } catch (e: any) {
      console.error('Conflict resolution error:', e);
      if (e.message?.includes('wrong secret key') || e.message?.includes('decryption failed')) {
        showError(t('sync.error.wrong_password', 'Incorrect cloud password. Decryption failed.'));
      } else {
        showError(t('settings.error.failed'));
      }
    } finally {
      setIsSyncing(false);
      // NOTE: Do NOT clear conflictCloudMeta here, as we might be in a retry-able error state (wrong password)
    }
  };

  const handleCloudVaultFoundConfirm = async () => {
    if (!foundCloudMeta || !foundProvider) return;
    setIsSyncing(true);
    setIsCloudVaultFoundModalOpen(false);
    try {
      await getAuthService().importCloudCredentials(foundCloudMeta.salt, foundCloudMeta.verifier, foundCloudMeta.opslimit, foundCloudMeta.memlimit);
      setSettings({ ...settings, cloudProvider: foundProvider, lastSync: t('sync.just_now') });

      showSuccess(
        t('sync.credentials_imported', 'Cloud vault found. Please log in again with your original password.'),
        undefined,
        () => {
          localStorage.setItem('ethervault_pending_sync', 'true');
          window.location.reload();
        }
      );
    } catch (e: any) {
      console.error('Failed to import cloud credentials:', e);
      showError(t('settings.error.failed'));
    } finally {
      setIsSyncing(false);
      setFoundCloudMeta(null);
      setFoundProvider(null);
    }
  };

  const handleCloudVaultFoundCancel = () => {
    setIsCloudVaultFoundModalOpen(false);
    setFoundCloudMeta(null);
    setFoundProvider(null);
  };

  const handleSyncClick = (provider: CloudProvider) => {
    if (provider !== 'none' && !settings.isPremium) {
      onUnlockPremium?.();
      return;
    }
    handleSync(provider);
  };

  const handleSync = async (provider: CloudProvider) => {
    // If same provider, Force Sync
    if (settings.cloudProvider === provider) {
      setIsSyncing(true);
      try {
        // Ensure we're connected before syncing
        const connected = await CloudService.connect();
        logger.info('[SettingsView] handleSync: connect result:', connected);

        if (!connected) {
          showError(t('settings.cloud.connection_failed', 'Connection failed. Please check your network.'));
          return;
        }

        const entries = await getVaultService().getEncryptedEntries();

        // // Race sync against timeout logic (using shared constant)
        // const syncPromise = CloudService.sync(entries);
        // const timeoutPromise = new Promise<any>((_, reject) =>
        //   setTimeout(() => reject(new Error('SYNC_TIMEOUT')), NETWORK_TIMEOUT_MS)
        // );

        // const result = await Promise.race([syncPromise, timeoutPromise]);

        // Directly await sync, allowing it to take as long as needed for large batches
        // We removed the artificial timeout because batch uploads can take minutes
        const result = await CloudService.sync(entries);

        if (result && result.updatedEntries.length > 0) {
          await getVaultService().processCloudEntries(result.updatedEntries);
          setSettings({ ...settings, lastSync: t('sync.just_now') }); // Update timestamp
          onDataChange(); // Refresh UI with new entries
        }
        setSettings({ ...settings, lastSync: t('sync.just_now') });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } catch (err: any) {
        if (err.message === 'SALT_UPDATED') {
          // Force reload to clear memory and re-login with new salt
          showInfo(
            t('sync.salt_updated') || 'Cloud security settings updated. You must log in again.',
            undefined,
            () => {
              localStorage.setItem('ethervault_pending_sync', 'true');
              window.location.reload();
            }
          );
          return;
        }

        if (err.message?.includes('SALT_CONFLICT')) {
          logger.warn('[SettingsView] Salt conflict detected during sync. Triggering resolution flow.');
          connectToProvider(settings.cloudProvider);
          return;
        }
        console.error('Sync failed', err);
        logger.error('[SettingsView] Sync failed', err);

        if (err.message === 'SYNC_TIMEOUT') {
          showError(t('settings.cloud.connection_failed', 'Connection failed. Please check your network.'));
        } else {
          showError(err.message || t('settings.error.failed', 'Operation failed.'));
        }
      } finally {
        setIsSyncing(false);
      }
      return;
    }

    // Switch Provider Logic
    if (provider === 'none') {
      setSettings({ ...settings, cloudProvider: provider, lastSync: '' });
      return;
    }

    // Check for First Time Warning
    const hasSeenWarning = localStorage.getItem(`ethervault_sync_warning_${provider}`);
    if (!hasSeenWarning) {
      setPendingProvider(provider);
      setIsSyncWarningModalOpen(true);
      return;
    }

    // Already authorized, connect immediately
    connectToProvider(provider);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (passwordForm.new !== passwordForm.confirm) {
      setError(t('settings.error.match'));
      return;
    }

    // Item 13: Add password length validation (same as WelcomeView)
    if (passwordForm.new.length < 8) {
      setError(t('welcome.error.length', 'Password must be at least 8 characters'));
      return;
    }

    // Enforce complexity
    const strength = SecurityService.calculateStrength(passwordForm.new);
    if (strength === 'Weak' || strength === 'Medium') {
      setError(t('welcome.error.weak', 'Password is too weak. Use a mix of letters, numbers, and symbols.'));
      return;
    }

    setIsChangingPassword(true);
    setPasswordChangeStatus(t('settings.status.encrypting', 'Re-encrypting vault...'));

    try {
      // Allow UI to update
      await new Promise(r => setTimeout(r, 50));

      const result = await getAuthService().changeMasterPassword(passwordForm.old, passwordForm.new);
      if (result) {
        // Item 1: Update biometric secret if enabled
        if (settings.biometricsEnabled) {
          try {
            setPasswordChangeStatus(t('settings.status.updating_bio', 'Updating biometric secret...'));
            await BiometricService.deleteSecret();
            const saved = await BiometricService.saveSecret(passwordForm.new);
            if (!saved) {
              // Biometric save failed - disable it to prevent broken state
              setSettings({ ...settings, biometricsEnabled: false });
              localStorage.removeItem('ethervault_bio');
              logger.warn('[SettingsView] Biometric secret update failed after password change. Disabling biometrics.');
            }
          } catch (e) {
            logger.error('[SettingsView] Failed to update biometric secret', e);
          }
        }

        // If cloud is connected, we must clear old data as key has changed
        if (CloudService.isSyncEnabled()) {
          try {
            setPasswordChangeStatus(t('settings.status.resyncing', 'Syncing new data to cloud...'));
            await CloudService.clearRemoteData();
            const entries = await getVaultService().getEncryptedEntries();
            await CloudService.sync(entries);
            logger.info('[SettingsView] Cloud data reset and re-synced after password change.');
          } catch (e) {
            logger.error('[SettingsView] Failed to reset cloud after password change', e);
          }
        }

        setSuccess(true);
        setPasswordChangeStatus(t('settings.status.done', 'Done!'));
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordForm({ old: '', new: '', confirm: '' });
          setSuccess(false);
          setIsChangingPassword(false);
          setPasswordChangeStatus('');
        }, 1500);
      } else {
        setError(t('settings.error.incorrect'));
        setIsChangingPassword(false);
      }
    } catch (err: any) {
      setError(err.message || t('settings.error.failed'));
      setIsChangingPassword(false);
    }
  };

  const CompactSetting = ({ icon: Icon, label, value, onClick, type = 'toggle' }: any) => (
    <div
      onClick={type === 'toggle' ? onClick : undefined}
      className={`bg-surface-card border-[0.5px] border-primary-500/10 dark:border-primary-400/10 p-3 rounded-theme flex items-center justify-between group transition-all ${type === 'toggle' ? 'cursor-pointer active:scale-[0.99] hover:border-primary-500/30' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-primary-500 transition-colors">
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 tracking-tight">{label}</span>
      </div>
      {type === 'toggle' ? (
        <div className={`w-10 h-6 rounded-full relative transition-all duration-300 ${value ? 'bg-primary-600/85' : 'bg-slate-200 dark:bg-slate-700'}`}>
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${value ? 'right-1' : 'left-1'}`} />
        </div>
      ) : (
        <button onClick={(e) => { e.stopPropagation(); onClick?.(); }} disabled={!onClick} className="text-[10px] font-medium text-primary-600 dark:text-primary-400 capitalize disabled:cursor-default px-2 py-1">
          {value}
        </button>
      )}
    </div>
  );



  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-sm px-4 pt-[calc(env(safe-area-inset-top)+4px)] pb-4 md:sticky md:px-8 md:pt-8 transition-all">
        <div className="flex items-center justify-between">
          <div className="block">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              {t('settings.title')}
              {!import.meta.env.DEV && settings.isPremium && (
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 select-none">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-500 animate-pulse animate-duration-1000" />
                  Premium
                </span>
              )}
            </h1>
            <p className="hidden md:block text-slate-500 dark:text-slate-400 text-xs mt-0.5">{t('settings.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 space-y-4 pb-6 md:pb-8">
        {/* Premium Status Banner */}
        {settings.isPremium ? (
          import.meta.env.DEV && (
            <div className="bg-gradient-to-r from-slate-900 via-primary-950/10 to-slate-900 border border-primary-500/20 p-5 rounded-[24px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-2xl text-primary-400 shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {t('premium.banner.active_title', 'EtherVault Premium Active')}
                    <span className="text-[8px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-1.5 py-0.5 rounded">
                      ACTIVE
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-200 mt-1 leading-relaxed">
                    {t('premium.banner.active_desc', 'Thank you for supporting us! You have full access to cross-device synchronization and automatic cloud backups.')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('ethervault_premium');
                  localStorage.removeItem('ethervault_hide_premium_banner');
                  setIsPremiumBannerDismissed(false);
                  setSettings({ ...settings, isPremium: false });
                  showSuccess('Premium status removed. Sync provider will disconnect.');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 text-xs font-semibold rounded-xl transition-all self-end sm:self-auto border border-slate-700/50 hover:border-slate-600 shrink-0"
              >
                {t('premium.banner.mock_refund', 'Mock Refund / Downgrade')}
              </button>
            </div>
          )
        ) : (
          !isPremiumBannerDismissed && (
            <div className="bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/25 p-5 rounded-[24px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
              {/* Ambient gold glow */}
              <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

              {/* Dismiss button */}
              <button
                onClick={() => {
                  localStorage.setItem('ethervault_hide_premium_banner', 'true');
                  setIsPremiumBannerDismissed(true);
                }}
                className="absolute top-3 right-3 text-slate-500 hover:text-slate-200 transition-colors p-1.5 rounded-full hover:bg-white/5 z-20"
                title={t('common.dismiss', 'Dismiss')}
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-4 text-left relative z-10">
                <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-amber-400 shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex-1 text-left pr-4">
                  <h3 className="text-sm font-bold bg-gradient-to-r from-white via-amber-200 to-amber-100 bg-clip-text text-transparent">
                    {t('premium.banner.upgrade_title', 'Upgrade to Premium')}
                  </h3>
                  <p className="text-[10px] text-slate-200 mt-1 leading-relaxed">
                    {t('premium.banner.upgrade_desc', 'Unlock secure multi-device synchronization via Google Drive to access your vault on mobile and desktop anytime.')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onUnlockPremium?.()}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-black rounded-xl transition-all active:scale-[0.98] shadow-md shadow-amber-500/20 self-end sm:self-auto shrink-0 relative z-10"
              >
                {t('premium.banner.get_premium', 'Get Premium')}
              </button>
            </div>
          )
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Cloud Config - Tighter */}
          <div className="lg:col-span-5 bg-surface-card p-6 rounded-theme-lg border-[0.5px] border-primary-500/10 dark:border-primary-400/10 shadow-theme space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400">{t('settings.sync_provider')}</h2>
              {settings.lastSync && <span className="text-[8px] text-emerald-500 font-medium uppercase">{settings.lastSync}</span>}
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'google', name: 'Google Drive', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'hover:border-blue-200 dark:hover:border-blue-800', icon: () => (
                    <svg viewBox="0 0 87.3 78" className="w-6 h-6">
                      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
                      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
                      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
                      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
                      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
                      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
                    </svg>
                  )
                },
                // OneDrive (Postponed)
                // {
                //   id: 'onedrive', name: 'OneDrive', color: 'text-[#0078D4]', bg: 'bg-[#0078D4]/10', border: 'hover:border-[#0078D4]/30', icon: () => (...)
                // }
              ].map(p => {
                const isActive = settings.cloudProvider === p.id;

                return (
                  <div
                    key={p.id}
                    className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${isActive
                      ? 'border-primary-500/50 bg-primary-50/50 dark:bg-primary-500/10 dark:border-primary-500/30 shadow-md ring-1 ring-primary-500/20'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'
                      } ${!settings.isPremium ? 'opacity-80 border-dashed hover:border-slate-300 dark:hover:border-slate-700' : ''}`}
                  >
                    <div className="p-4 flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl shrink-0 ${isActive ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-white dark:bg-slate-800'}`}>
                        <p.icon />
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-medium text-slate-900 dark:text-white leading-none">{p.name}</h3>
                            {!settings.isPremium && (
                              <span className="text-[7.5px] font-extrabold uppercase tracking-wider text-primary-400 border border-primary-500/30 px-1.5 py-0.5 rounded bg-primary-500/10 flex items-center gap-0.5 select-none">
                                <Lock className="w-2 h-2 shrink-0" />
                                PREMIUM
                              </span>
                            )}
                          </div>
                          {isActive && cloudConnected && (
                            <span className="flex items-center gap-1 text-[9px] font-medium text-emerald-500 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {t('settings.cloud.connected')}
                            </span>
                          )}
                          {isActive && !cloudConnected && (
                            <span className="flex items-center gap-1 text-[9px] font-medium text-amber-500 uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {t('settings.cloud.paused', 'Paused')}
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[90%]">
                          {isActive
                            ? t('settings.cloud.connected_desc', { provider: p.name })
                            : t('settings.cloud.connect_desc', { provider: p.name })
                          }
                        </p>

                        {isActive && settings.lastSync && (
                          <div className="mt-3 flex items-center gap-1.5 text-[9px] font-medium text-slate-400">
                            <RefreshCcw className="w-3 h-3 text-slate-300" />
                            {t('settings.cloud.last_synced')} <span className="text-slate-600 dark:text-slate-300 font-medium">
                              {settings.lastSync === 'Just now' || settings.lastSync === '刚刚'
                                ? t('sync.just_now')
                                : settings.lastSync}
                            </span>
                          </div>
                        )}

                        <div className="mt-4 flex items-center gap-2">
                          {isActive && cloudConnected ? (
                            <>
                              <button
                                onClick={() => handleSyncClick(p.id as CloudProvider)}
                                disabled={isSyncing}
                                className="flex-1 py-2.5 bg-primary-600/85 hover:bg-primary-600 text-white text-[11px] font-medium rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-sm shadow-primary-200 dark:shadow-none"
                              >
                                <RefreshCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                                {isSyncing ? t('settings.cloud.syncing') : t('settings.cloud.sync_now')}
                              </button>
                              <button
                                onClick={() => handleSyncClick('none')} // Disconnect
                                disabled={isSyncing}
                                className="px-4 py-2.5 bg-surface-card border border-primary-500/10 dark:border-primary-400/10 text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-900/50 text-[11px] font-medium rounded-theme transition-all active:scale-95"
                              >
                                {t('settings.cloud.disconnect')}
                              </button>
                            </>
                          ) : isActive && !cloudConnected ? (
                            <button
                              onClick={() => handleSyncClick(p.id as CloudProvider)} // Will trigger connect flow
                              disabled={isSyncing}
                              className="w-full py-2.5 bg-amber-500 text-white text-xs font-medium rounded-xl hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm shadow-amber-500/20 disabled:opacity-50 disabled:cursor-wait"
                            >
                              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                              {t('settings.cloud.reconnect', 'Resume Connection')}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSyncClick(p.id as CloudProvider)}
                              disabled={isSyncing}
                              className="w-full py-2.5 bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20 text-xs font-medium rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait shadow-sm hover:shadow-md"
                            >
                              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                              {!settings.isPremium ? (
                                <>
                                  <Lock className="w-4 h-4 mr-1" />
                                  {t('settings.cloud.unlock_premium', 'Unlock with Premium')}
                                </>
                              ) : (
                                t('settings.cloud.connect_account')
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DEV ONLY BUTTON - Only visible in development mode */}
            {import.meta.env.DEV && CloudService.activeProvider?.isConnected() && (
              <button
                onClick={async () => {
                  if (confirm('DANGER: This will PERMANENTLY DELETE all cloud data. Are you sure?')) {
                    try {
                      const provider = CloudService.activeProvider as any;
                      if (provider && typeof provider.clearRemoteData === 'function') {
                        await provider.clearRemoteData();
                        showSuccess('Cloud data wiped successfully.');
                      }
                    } catch (e) {
                      showError('Failed to wipe data.');
                    }
                  }
                }}
                className="w-full py-2 mt-2 border border-rose-200 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-[9px] font-medium rounded-xl uppercase tracking-widest transition-colors"
              >
                Reset Cloud Data (Dev)
              </button>
            )}
          </div>

          {/* Access Settings */}
          <div className="lg:col-span-7 space-y-4">
            {/* Preferences Section */}
            <div className="space-y-1.5">
              <h3 className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400 pl-1">{t('settings.preferences', 'Preferences')}</h3>

              <div className="bg-surface-card border-[0.5px] border-primary-500/10 dark:border-primary-400/10 rounded-theme shadow-theme flex flex-col">
                {biometricsSupported && (
                  <button
                    onClick={toggleBiometrics}
                    className="w-full flex items-center justify-between p-3 px-4 hover:bg-primary-500/5 dark:hover:bg-primary-400/5 rounded-t-[20px] transition-colors text-left group"
                  >
                    <div className="flex items-center gap-[18px]">
                      <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-primary-500 transition-colors">
                        <Fingerprint className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </div>
                      <span className="text-xs font-normal text-slate-700 dark:text-slate-300 tracking-tight">{t('settings.option.biometric')}</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-all duration-300 ${settings.biometricsEnabled ? 'bg-primary-600/85' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm ${settings.biometricsEnabled ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                  </button>
                )}

                {/* Language Selector */}
                <div className={`w-full flex items-center justify-between p-3 px-4 group relative ${!biometricsSupported ? 'rounded-t-[20px]' : ''}`}>
                  {biometricsSupported && (
                    <div className="absolute top-0 left-[60px] right-0 border-t border-slate-100 dark:border-slate-800/80 pointer-events-none" />
                  )}
                  <div className="flex items-center gap-[18px]">
                    <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-primary-500 transition-colors">
                      <Languages className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-normal text-slate-700 dark:text-slate-300 tracking-tight">{t('settings.option.language')}</span>
                  </div>
                  <CustomDropdown
                    value={i18n.language}
                    onChange={(val) => i18n.changeLanguage(val)}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'es', label: 'Español' },
                      { value: 'fr', label: 'Français' },
                      { value: 'de', label: 'Deutsch' },
                      { value: 'it', label: 'Italiano' },
                      { value: 'ja', label: '日本語' },
                      { value: 'ko', label: '한국어' },
                      { value: 'pt', label: 'Português' },
                      { value: 'ru', label: 'Русский' },
                      { value: 'th', label: 'ไทย' },
                      { value: 'ar', label: 'العربية' },
                      { value: 'zh', label: '简体中文' },
                      { value: 'zh-TW', label: '繁體中文' }
                    ]}
                    buttonClassName={dropdownBtnClass}
                    menuClassName={dropdownMenuClass}
                  />
                </div>

                {/* Lock Timer Dropdown */}
                <div className="w-full flex items-center justify-between p-3 px-4 group relative rounded-b-[20px]">
                  <div className="absolute top-0 left-[60px] right-0 border-t border-slate-100 dark:border-slate-800/80 pointer-events-none" />

                  <div className="flex items-center gap-[18px]">
                    <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-primary-500 transition-colors">
                      <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-normal text-slate-700 dark:text-slate-300 tracking-tight">{t('settings.option.lock_timer')}</span>
                  </div>
                  <CustomDropdown
                    value={settings.autoLockTimeout}
                    onChange={(val) => setSettings({ ...settings, autoLockTimeout: Number(val) })}
                    options={[1, 5, 15, 30, 60].map(val => ({
                      value: val,
                      label: val === 60 ? t('settings.option.time.1h') : t(`settings.option.time.${val}m`)
                    }))}
                    buttonClassName={dropdownBtnClass}
                    menuClassName={dropdownMenuClass}
                  />
                </div>
              </div>
            </div>
            {/* Appearance Section */}
            <div className="space-y-1.5">
              <h3 className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400 pl-1">{t('layout.appearance', 'Appearance')}</h3>

              <div className="bg-surface-card border-[0.5px] border-primary-500/10 dark:border-primary-400/10 rounded-theme shadow-theme flex flex-col">
                {/* Mode Option */}
                <button
                  onClick={() => {
                    if (activeTheme === 'noir') return;
                    const next = settings.theme === 'dark' ? 'light' : (settings.theme === 'light' ? 'system' : 'dark');
                    setSettings({ ...settings, theme: next });
                  }}
                  disabled={activeTheme === 'noir'}
                  className={`w-full flex items-center justify-between p-3 px-4 rounded-t-theme rounded-b-none transition-colors text-left group ${
                    activeTheme === 'noir'
                      ? 'opacity-60 cursor-not-allowed'
                      : 'hover:bg-primary-500/5 dark:hover:bg-primary-400/5'
                  }`}
                >
                  <div className="flex items-center gap-[18px]">
                    <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-primary-500 transition-colors">
                      <Moon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-normal text-slate-700 dark:text-slate-300 tracking-tight">{t('settings.option.theme_mode', 'Mode')}</span>
                  </div>
                  <span className="text-[10px] font-normal text-primary-600 dark:text-primary-400 capitalize px-2 py-1">
                    {settings.theme === 'system' ? t('settings.theme.system', 'System') :
                      settings.theme === 'light' ? t('settings.theme.light', 'Light') :
                        t('settings.theme.dark', 'Dark')}
                  </span>
                </button>

                {/* Theme Style Option */}
                <div className="w-full flex items-center justify-between p-3 px-4 group relative rounded-b-theme rounded-t-none border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-[18px]">
                    <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-primary-500 transition-colors">
                      <Palette className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-normal text-slate-700 dark:text-slate-300 tracking-tight">{t('theme.section_title', 'Theme')}</span>
                  </div>
                  <CustomDropdown
                    value={activeTheme}
                    onChange={(themeId) => {
                      const selectedTheme = allThemes.find(t => t.id === themeId);
                      if (selectedTheme?.premium && !settings.isPremium) {
                        onUnlockPremium?.();
                      } else {
                        setTheme(themeId);
                      }
                    }}
                    options={allThemes.map(theme => {
                      const isLocked = theme.premium && !settings.isPremium;
                      return {
                        value: theme.id,
                        label: (
                          <span className="flex items-center gap-1.5">
                            <span className="text-xs leading-none shrink-0">{theme.emoji}</span>
                            <span>{t(theme.nameKey, theme.id)}</span>
                            {isLocked && (
                              <span className="ml-1 text-[6.5px] font-extrabold uppercase tracking-wider text-primary-400 border border-primary-500/30 px-1 py-0.25 rounded bg-primary-500/10 inline-flex items-center gap-0.5 select-none shrink-0">
                                <Lock className="w-1.5 h-1.5 shrink-0" />
                                PREMIUM
                              </span>
                            )}
                          </span>
                        )
                      };
                    })}
                    buttonClassName={dropdownBtnClass}
                    menuClassName={dropdownMenuClass}
                  />
                </div>
              </div>
            </div>


            {/* Data Management Section */}
            <div className="space-y-1.5">
              <h3 className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400 pl-1">{t('settings.data_management', 'Data Management')}</h3>

              <div className="bg-surface-card border-[0.5px] border-primary-500/10 dark:border-primary-400/10 rounded-theme shadow-theme flex flex-col">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="w-full flex items-center justify-between p-3 px-4 hover:bg-primary-500/5 dark:hover:bg-primary-400/5 rounded-t-[20px] transition-colors text-left group"
                >
                  <div className="flex items-center gap-[18px]">
                    <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                      <CloudUpload className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-normal text-slate-700 dark:text-slate-300 tracking-tight">{t('settings.import', 'Import')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                    <span className="text-xs font-normal">CSV / JSON</span>
                    <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                </button>

                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="w-full flex items-center justify-between p-3 px-4 hover:bg-primary-500/5 dark:hover:bg-primary-400/5 rounded-b-[20px] transition-colors text-left group relative"
                >
                  {/* Indented Divider line bypassing the icon */}
                  <div className="absolute top-0 left-[60px] right-0 border-t border-slate-100 dark:border-slate-800/80 pointer-events-none" />

                  <div className="flex items-center gap-[18px]">
                    <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                      <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-normal text-slate-700 dark:text-slate-300 tracking-tight">{t('settings.export', 'Export')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                    <span className="text-xs font-normal">CSV / JSON</span>
                    <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                </button>
              </div>
            </div>

            {/* Log Management Section */}
            <div className="space-y-1.5">
              <h3 className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400 pl-1">{t('settings.log_management', 'Log Management')}</h3>

              <div className="bg-surface-card border-[0.5px] border-primary-500/10 dark:border-primary-400/10 rounded-theme shadow-theme flex flex-col">
                {/* Master Log Settings */}
                <div className={`w-full flex items-center justify-between p-3 px-4 group rounded-t-[20px] ${!(settings.masterLogEnabled ?? false) ? 'rounded-b-[20px]' : ''}`}>
                  <div className="flex items-center gap-[18px]">
                    <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-primary-500 transition-colors">
                      <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-normal text-slate-700 dark:text-slate-300 tracking-tight">{t('settings.option.master_log')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(settings.masterLogEnabled ?? false) && window.electronAPI && (
                      <button onClick={() => logger.openLogFile()} className="text-[9px] font-medium text-slate-400 hover:text-primary-500 transition-colors px-2">{t('settings.option.open_log')}</button>
                    )}
                    <button
                      onClick={() => {
                        const newValue = !(settings.masterLogEnabled ?? false);
                        setSettings({ ...settings, masterLogEnabled: newValue });
                        logger.setEnabled(newValue);
                      }}
                      className={`w-8 h-4 rounded-full relative transition-all ${settings.masterLogEnabled ?? false ? 'bg-primary-600/85' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${(settings.masterLogEnabled ?? false) ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>

                {/* Recent Activity Button */}
                {(settings.masterLogEnabled ?? false) && (
                  <button
                    onClick={() => setIsActivityModalOpen(true)}
                    className="w-full flex items-center justify-between p-3 px-4 hover:bg-primary-500/5 dark:hover:bg-primary-400/5 transition-colors text-left group relative"
                  >
                    {/* Indented Divider */}
                    <div className="absolute top-0 left-[60px] right-0 border-t border-slate-100 dark:border-slate-800/80 pointer-events-none" />

                    <div className="flex items-center gap-[18px]">
                      <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-primary-500 transition-colors">
                        <Activity className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </div>
                      <span className="text-xs font-normal text-slate-700 dark:text-slate-300 tracking-tight">{t('settings.option.recent_activity')}</span>
                    </div>
                    <div className="p-1.5 rounded-lg text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    </div>
                  </button>
                )}

                {/* Clear Cache Button */}
                {(settings.masterLogEnabled ?? false) && (
                  <button
                    onClick={() => setIsCacheConfirmOpen(true)}
                    className="w-full flex items-center justify-between p-3 px-4 hover:bg-primary-500/5 dark:hover:bg-primary-400/5 rounded-b-[20px] transition-colors text-left group relative"
                  >
                    {/* Indented Divider */}
                    <div className="absolute top-0 left-[60px] right-0 border-t border-slate-100 dark:border-slate-800/80 pointer-events-none" />

                    <div className="flex items-center gap-[18px]">
                      <div className="p-1.5 rounded-lg text-rose-400 group-hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </div>
                      <span className="text-xs font-normal text-slate-700 dark:text-slate-300 tracking-tight">{t('settings.clear_cache', 'Clear App Cache')}</span>
                    </div>
                    <span className="text-[9px] font-medium uppercase text-rose-300 group-hover:text-rose-500 tracking-widest">{t('common.clear', 'Clean')}</span>
                  </button>
                )}
              </div>
              {(settings.masterLogEnabled ?? false) && cacheMessage && (
                <p className="text-[10px] font-medium text-center text-emerald-500 uppercase tracking-widest animate-in fade-in slide-in-from-bottom-1 mt-1">
                  {cacheMessage}
                </p>
              )}
            </div>

            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full py-3 bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 text-primary-600 dark:text-primary-400 text-[11px] font-normal rounded-2xl hover:bg-primary-100 transition-all flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              {t('settings.change_password')}
            </button>

            {/* About Section */}
            <div className="bg-surface-card border-[0.5px] border-primary-500/10 dark:border-primary-400/10 rounded-theme shadow-theme flex flex-col">
              <button
                onClick={() => setIsAboutModalOpen(true)}
                className="w-full flex items-center justify-between p-3 px-4 hover:bg-primary-500/5 dark:hover:bg-primary-400/5 rounded-theme transition-colors text-left group"
              >
                <div className="flex items-center gap-[18px]">
                  <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                    <Info className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-normal text-slate-700 dark:text-slate-300 tracking-tight">{t('about.title', 'About')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  <span className="text-[10px] font-normal group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">v{appVersion}</span>
                  <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {
          isPasswordModalOpen && (
            <Portal>
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="relative bg-surface-card w-full max-w-md rounded-theme-lg border border-primary-500/10 dark:border-primary-400/10 shadow-theme-lg overflow-hidden p-8 animate-in zoom-in-95 duration-200">

                  {/* Loading Overlay */}
                  {isChangingPassword && (
                    <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-in fade-in duration-200 p-6 text-center">
                      <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t('settings.processing', 'Processing...')}</h3>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">{passwordChangeStatus}</p>
                    </div>
                  )}

                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">{t('settings.password_modal.title')}</h2>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-1">{t('settings.password_modal.current')}</label>
                      <input
                        type="password"
                        required
                        value={passwordForm.old}
                        onChange={e => {
                          const val = e.target.value;
                          if (/^[\x21-\x7E]*$/.test(val)) {
                            setPasswordForm({ ...passwordForm, old: val });
                          }
                        }}
                        className="w-full bg-surface border border-primary-500/10 dark:border-primary-400/10 rounded-theme py-2.5 px-4 outline-none focus:border-primary-500 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-1">{t('settings.password_modal.new')}</label>
                      <input
                        type="password"
                        required
                        value={passwordForm.new}
                        onChange={e => {
                          const val = e.target.value;
                          if (/^[\x21-\x7E]*$/.test(val)) {
                            setPasswordForm({ ...passwordForm, new: val });
                          }
                        }}
                        className="w-full bg-surface border border-primary-500/10 dark:border-primary-400/10 rounded-theme py-2.5 px-4 outline-none focus:border-primary-500 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-1">{t('settings.password_modal.confirm')}</label>
                      <input
                        type="password"
                        required
                        value={passwordForm.confirm}
                        onChange={e => {
                          const val = e.target.value;
                          if (/^[\x21-\x7E]*$/.test(val)) {
                            setPasswordForm({ ...passwordForm, confirm: val });
                          }
                        }}
                        className="w-full bg-surface border border-primary-500/10 dark:border-primary-400/10 rounded-theme py-2.5 px-4 outline-none focus:border-primary-500 transition-all text-sm"
                      />
                    </div>

                    {error && <p className="text-rose-500 text-[10px] font-medium uppercase text-center pt-2">{error}</p>}
                    {success && <p className="text-emerald-500 text-[10px] font-medium uppercase text-center pt-2">{t('settings.success.password')}</p>}

                    <div className="flex gap-3 pt-6">
                      <button
                        type="button"
                        onClick={() => { setIsPasswordModalOpen(false); setError(null); }}
                        className="flex-1 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                      >
                        {t('settings.password_modal.cancel')}
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-medium rounded-xl hover:opacity-90 transition-all"
                      >
                        {t('settings.password_modal.save')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </Portal>
          )
        }

        <div className="flex items-center justify-center md:justify-end pt-2 border-t border-slate-100 dark:border-slate-900">
          <span className="text-[8px] font-medium text-slate-300 dark:text-slate-800 uppercase tracking-[0.5em]">{t('settings.encryption')}</span>
        </div>



        {
          isBioModalOpen && (
            <Portal>
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-surface-card w-full max-w-md rounded-theme-lg border border-primary-500/10 dark:border-primary-400/10 shadow-theme-lg overflow-hidden p-8 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                      <Fingerprint className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">{t('settings.biometric_modal.title')}</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('settings.biometric_modal.description')}</p>
                    </div>
                  </div>

                  <form onSubmit={handleBioConfirm} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-1">{t('login.master_password')}</label>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          value={bioPassword}
                          onChange={e => {
                            const val = e.target.value;
                            if (/^[\x21-\x7E]*$/.test(val)) {
                              setBioPassword(val);
                            }
                          }}
                          className="w-full bg-surface border border-primary-500/10 dark:border-primary-400/10 rounded-theme py-3 px-4 outline-none focus:border-primary-500 transition-all text-sm font-medium"
                          placeholder={t('login.unlock_placeholder')}
                          autoFocus
                        />
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    {bioError && <p className="text-rose-500 text-[10px] font-medium uppercase text-center pt-2">{bioError}</p>}

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => { setIsBioModalOpen(false); setBioError(null); }}
                        className="flex-1 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-primary-600/85 hover:bg-primary-600 text-white text-[10px] font-medium rounded-xl hover:shadow-lg transition-all active:scale-95"
                      >
                        {t('settings.biometric_modal.enable')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </Portal>
          )
        }

        {
          isExportModalOpen && (
            <ExportModalWrapper
              onClose={() => setIsExportModalOpen(false)}
            />
          )
        }

        {
          isImportModalOpen && (
            <ImportModal
              onClose={() => setIsImportModalOpen(false)}
              onImport={async (entries) => {
                // Let the ImportModal handle the try-catch so it can show the error state
                for (const entry of entries) {
                  const { id, createdAt, updatedAt, ...rest } = entry;
                  await getVaultService().addEntry(rest);
                }
                setIsImportModalOpen(false);
                setSettings({ ...settings, lastSync: 'Imported just now' });
                onDataChange();
              }}
            />
          )
        }

        {
          isSyncWarningModalOpen && pendingProvider && (
            <SyncWarningModal
              providerName={pendingProvider === 'google' ? 'Google Drive' : pendingProvider}
              onClose={() => {
                setIsSyncWarningModalOpen(false);
                setPendingProvider(null);
              }}
              onConfirm={handleSyncConfirm}
            />
          )
        }

        {/* Salt Conflict Resolution Modal */}
        <SyncConflictModal
          isOpen={isConflictModalOpen}
          localEntryCount={localEntryCount}
          onResolve={handleConflictResolve}
        />

        {
          isActivityModalOpen && (
            <Portal>
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setIsActivityModalOpen(false)}>
                <div className="bg-surface-card w-full h-[100dvh] md:h-[600px] md:max-w-2xl flex flex-col rounded-none md:rounded-theme-lg border-t md:border border-primary-500/10 dark:border-primary-400/10 shadow-theme-lg overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-6 md:px-8 pt-[calc(env(safe-area-inset-top)+4px)] pb-4 md:py-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="hidden md:flex p-2 bg-primary-50 dark:bg-slate-800 rounded-xl text-primary-500">
                        <Activity className="w-5 h-5" />
                      </div>

                      {/* Mobile Back Button */}
                      <button onClick={() => setIsActivityModalOpen(false)} className="md:hidden p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                      </button>

                      <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('settings.activity_modal.title')}</h2>
                        <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">~/Library/Logs/EtherVault/main.log</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSendLogReport}
                        disabled={isSendingLogs}
                        className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all disabled:opacity-50"
                      >
                        {isSendingLogs ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span className="hidden sm:inline">{t('common.processing', 'Sending...')}</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>{t('settings.send_log', 'Send Log')}</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setIsActivityModalOpen(false)}
                        className="hidden md:block p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto scrollbar-hide p-6 bg-slate-50 dark:bg-slate-950 font-mono text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    {activityLogs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <Activity className="w-12 h-12 mb-4 opacity-20" />
                        <p>{t('settings.activity_modal.empty')}</p>
                      </div>
                    ) : (
                      activityLogs.map((log, index) => {
                        let colorClass = "text-slate-600 dark:text-slate-400";
                        if (log.includes('[error]') || log.includes('error:')) colorClass = "text-rose-500";
                        if (log.includes('[warn]') || log.includes('warn:')) colorClass = "text-amber-500";
                        if (log.includes('[info]') || log.includes('info:')) colorClass = "text-emerald-600 dark:text-emerald-400";

                        // Highlight our custom tags
                        const highlightedLog = log.replace(/(\[AUTH\]|\[VAULT\]|\[DATA\])/g, '<span class="font-bold text-primary-500">$1</span>');

                        return (
                          <div key={index} className={`flex items-start gap-3 border-b border-primary-500/5 dark:border-primary-400/5 pb-1 ${colorClass}`}>
                            <span className="opacity-50 select-none w-6 shrink-0 text-right">{index + 1}</span>
                            <span className="break-all" dangerouslySetInnerHTML={{ __html: highlightedLog }} />
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="hidden md:flex p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 items-center justify-between">
                    <button
                      onClick={fetchLogs}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-500/10 transition-all"
                    >
                      <RefreshCcw className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">{t('settings.activity_modal.refresh')}</span>
                    </button>
                    <button
                      onClick={() => setIsActivityModalOpen(false)}
                      className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium rounded-xl hover:opacity-90 transition-all uppercase tracking-wider"
                    >
                      {t('settings.activity_modal.close')}
                    </button>
                  </div>
                </div>
              </div>
            </Portal>
          )
        }
      </div>

      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} appVersion={appVersion} onOpenPrivacy={() => setIsPrivacyModalOpen(true)} onOpenTerms={() => setIsTermsModalOpen(true)} onOpenFAQ={() => setIsFAQModalOpen(true)} />
      <PrivacyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
      <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
      <FAQModal isOpen={isFAQModalOpen} onClose={() => setIsFAQModalOpen(false)} />
      {isCloudVaultFoundModalOpen && (
        <CloudVaultFoundModal
          onClose={handleCloudVaultFoundCancel}
          onConfirm={handleCloudVaultFoundConfirm}
        />
      )}

      {isCacheConfirmOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsCacheConfirmOpen(false)} />
            <div className="relative bg-surface-card w-full max-w-sm rounded-theme-lg shadow-theme-lg overflow-hidden animate-in zoom-in-95 duration-300 p-6 space-y-6">
              <div className="space-y-2 text-center">
                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('settings.clear_cache')}?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('settings.clear_cache_desc', 'This will remove local logs and temporary data. Your vault data will NOT be deleted.')}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsCacheConfirmOpen(false)}
                  className="flex-1 px-4 py-3 rounded-theme border border-primary-500/10 dark:border-primary-400/10 text-slate-500 font-medium hover:bg-primary-500/5 dark:hover:bg-primary-400/5 transition-all font-mono text-sm"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={performClearCache}
                  className="flex-1 px-4 py-3 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 font-mono text-sm"
                >
                  {t('common.confirm_delete', 'Confirm')}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
