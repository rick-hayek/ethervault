import React, { useState } from 'react';
import { Search, Plus, ExternalLink, Copy, Check, Globe, User as UserIcon, Lock, Edit2, User, Key, LogOut, X, Sparkles } from 'lucide-react';
import { getVaultService, PasswordEntry, getCryptoService, SecurityService, VaultStorageItem, Category, CloudService } from '@ethervault/core';
import { useTranslation } from 'react-i18next';
import { CATEGORIES } from '../constants';

// One-time prompt component
const CloudSyncPrompt: React.FC<{
  onGoToSettings: () => void;
  onDismiss: () => void;
  isPremium: boolean;
  onUnlockPremium?: () => void;
}> = ({ onGoToSettings, onDismiss, isPremium, onUnlockPremium }) => {
  const { t } = useTranslation();

  if (!isPremium) {
    return (
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/25 p-4 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
        {/* Ambient gold glow */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="flex items-center gap-4 text-left relative z-10">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold bg-gradient-to-r from-white via-amber-200 to-amber-100 bg-clip-text text-transparent flex items-center gap-1.5">
              {t('vault.sync_prompt.title_premium', 'Sync your vault across devices (Premium)')}
              <span className="text-[7.5px] font-extrabold uppercase tracking-wider text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded bg-amber-500/10 flex items-center gap-0.5 select-none shrink-0">
                <Lock className="w-2.5 h-2.5 shrink-0" />
                PREMIUM
              </span>
            </h3>
            <p className="text-xs text-slate-200 mt-0.5">
              {t('vault.sync_prompt.description', 'Connect to cloud storage to access your passwords anywhere.')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto justify-end relative z-10">
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-200 transition-colors uppercase tracking-wider"
          >
            {t('common.dismiss', 'Dismiss')}
          </button>
          <button
            onClick={onUnlockPremium}
            className="px-5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-xl text-xs font-medium transition-all shadow-md shadow-amber-500/20 active:scale-95 whitespace-nowrap"
          >
            {t('vault.sync_prompt.action_premium', 'Get Premium')}
          </button>
        </div>
      </div>
    );
  }

  // Active premium version (Setup Sync) - keeps the dynamic primary theme color
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-500/20 p-4 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-4 text-left">
        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
            {t('vault.sync_prompt.title', 'Sync your vault across devices')}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            {t('vault.sync_prompt.description', 'Connect to cloud storage to access your passwords anywhere.')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        <button
          onClick={onDismiss}
          className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors uppercase tracking-wider"
        >
          {t('common.dismiss', 'Dismiss')}
        </button>
        <button
          onClick={onGoToSettings}
          className="px-5 py-2 bg-primary-600/85 hover:bg-primary-600 text-white rounded-xl text-xs font-normal transition-all shadow-md shadow-primary-500/20 hover:shadow-primary-500/30 active:scale-95 whitespace-nowrap"
        >
          {t('vault.sync_prompt.action', 'Setup Sync')}
        </button>
      </div>
    </div>
  );
};

interface VaultViewProps {
  passwords: PasswordEntry[];
  activeCategory: Category;
  onCategoryChange: (cat: Category) => void;
  onSearch: (query: string) => void;
  allTags: string[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
  onEdit: (entry: PasswordEntry) => void;
  onAdd: () => void;
  onGoToSettings: () => void;
  onLock: () => void;
  searchQuery: string;
  isSyncEnabled: boolean;
  isPremium?: boolean;
  onUnlockPremium?: () => void;
}

export const VaultView: React.FC<VaultViewProps> = ({
  passwords,
  activeCategory,
  onCategoryChange,
  onSearch,
  allTags,
  activeTag,
  onTagChange,
  onEdit,
  onAdd,
  onGoToSettings,
  onLock,
  searchQuery,
  isSyncEnabled,
  isPremium = false,
  onUnlockPremium
}) => {
  const { t } = useTranslation();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // One-time sync prompt state
  const [showSyncPrompt, setShowSyncPrompt] = useState(() => {
    // If already seen, don't show
    if (localStorage.getItem('ethervault_sync_prompt_seen') === 'true') {
      return false;
    }

    // If sync is already active (configured), auto-dismiss and mark as seen
    if (CloudService.activeProvider) {
      localStorage.setItem('ethervault_sync_prompt_seen', 'true');
      return false;
    }

    return true;
  });

  // Auto-dismiss if sync becomes enabled
  React.useEffect(() => {
    if (isSyncEnabled && showSyncPrompt) {
      localStorage.setItem('ethervault_sync_prompt_seen', 'true');
      setShowSyncPrompt(false);
    }
  }, [isSyncEnabled, showSyncPrompt]);

  const handleDismissPrompt = () => {
    localStorage.setItem('ethervault_sync_prompt_seen', 'true');
    setShowSyncPrompt(false);
  };

  const handleGoToSettings = () => {
    localStorage.setItem('ethervault_sync_prompt_seen', 'true');
    onGoToSettings();
  };

  const handleCopy = (id: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'Secure': return 'text-emerald-500 bg-emerald-500/10';
      case 'Strong': return 'text-blue-500 bg-blue-500/10';
      case 'Medium': return 'text-amber-500 bg-amber-500/10';
      case 'Weak': return 'text-rose-500 bg-rose-500/10';
      default: return 'text-slate-500 bg-slate-500/10';
    }
  }

  const getCategoryColor = (cat: Category) => {
    return 'bg-primary-600/85 text-white';
  }

  return (
    <div className="min-h-full">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm md:hidden flex items-center pt-[calc(env(safe-area-inset-top)+4px)] pb-4 px-4 titlebar transition-all duration-300 min-h-[60px]">
        {isSearchMode ? (
          <div className="flex-1 flex items-center gap-3 animate-in fade-in slide-in-from-right-5 duration-200">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={t('vault.search')}
              className="flex-1 bg-transparent border-none outline-none text-base font-normal text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <button
              onClick={() => {
                setIsSearchMode(false);
                onSearch('');
              }}
              className="p-2 -mr-2 text-slate-500 dark:text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t('vault.title')}</h1>
              <p className="hidden text-slate-500 dark:text-slate-400 mt-0.5 text-xs">{t('vault.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSearchMode(true)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                title={t('vault.search')}
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={onLock}
                className="p-2 -mr-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                title={t('layout.lock_vault', 'Lock Vault')}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </header>

      {/* Desktop Sticky Header */}
      <div className="hidden md:flex flex-col gap-6 sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm px-8 pt-8 pb-4 transition-all">
        <div className="flex flex-row items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t('vault.title')}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs">{t('vault.subtitle')}</p>
          </div>
          <button
            onClick={onAdd}
            className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-xl font-normal text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            {t('vault.add')}
          </button>
        </div>

        {/* Desktop Filters */}
        <div className="space-y-4 bg-white dark:bg-slate-900 p-1.5 rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-2 items-center">
            <div className="relative w-full lg:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder={t('vault.search')}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 outline-none placeholder:text-slate-400 text-sm font-normal"
              />
            </div>

            <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 hidden lg:block" />

            <div className="flex gap-1 overflow-x-auto w-full lg:w-auto p-1 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-normal uppercase tracking-wider whitespace-nowrap transition-all ${activeCategory === cat
                    ? `${getCategoryColor(cat)} shadow-md transform scale-105`
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                  {t(`category.${cat.toLowerCase()}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-4 md:px-8 md:pb-8 space-y-4 md:space-y-6 pt-0 md:pt-2">
        {/* Synchronize Prompt (One-time) */}
        {showSyncPrompt && (
          <CloudSyncPrompt
            onGoToSettings={handleGoToSettings}
            onDismiss={handleDismissPrompt}
            isPremium={isPremium}
            onUnlockPremium={onUnlockPremium}
          />
        )}

        {/* Mobile Category Selection (Fixed, Segmented Control) */}
        <div className="md:hidden bg-[#f0f2f8] dark:bg-slate-900/60 p-1.5 rounded-2xl w-full mb-2">
          <div className="flex w-full">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`flex-1 text-center py-2.5 rounded-xl text-xs sm:text-sm font-normal transition-all duration-200 ${activeCategory === cat
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-normal'
                  : 'text-slate-600 dark:text-slate-400'
                  }`}
              >
                {t(`category.${cat.toLowerCase()}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Password List Container */}
        {passwords.length > 0 ? (
          <>
            <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-sm flex flex-col overflow-hidden">
              {[...passwords].sort((a, b) => a.title.localeCompare(b.title)).map((entry, index) => (
                <React.Fragment key={entry.id}>
                  {/* Desktop View Row */}
                  <div
                    className={`hidden md:flex items-center justify-between p-4 px-6 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group relative ${index === 0 ? 'rounded-t-[24px]' : ''
                      } ${index === passwords.length - 1 ? 'rounded-b-[24px]' : ''}`}
                  >
                    {index > 0 && (
                      <div className="absolute top-0 left-0 right-0 border-t border-slate-100 dark:border-slate-800/80 pointer-events-none" />
                    )}

                    {/* Column 1: Icon & Title */}
                    <div className="flex items-center gap-4 w-1/4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-slate-100 font-normal border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm shrink-0">
                        {entry.icon ? (
                          <img src={entry.icon} alt={entry.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm">{entry.title.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-normal text-slate-900 dark:text-white text-sm truncate pr-2">{entry.title}</h3>
                        <div className="flex items-center gap-1 text-[9px] text-slate-400 font-normal uppercase tracking-wider mt-0.5">
                          <Globe className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[120px]">{entry.website || 'No Website'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Username */}
                    <div className="w-1/4 flex items-center gap-2 pr-4 min-w-0">
                      <User className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span className="text-xs font-normal text-slate-700 dark:text-slate-200 truncate font-mono tracking-tight">{entry.username}</span>
                      <button
                        onClick={() => handleCopy(entry.id, entry.username)}
                        className="p-1 bg-slate-50 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-150 dark:border-slate-700 rounded-lg shadow-sm text-slate-400 hover:text-primary-600 active:scale-90 transition-all opacity-0 group-hover:opacity-100"
                        title="Copy Username"
                      >
                        {copiedId === entry.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Column 3: Password */}
                    <div className="w-1/4 flex items-center gap-2 pr-4 min-w-0">
                      <Key className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span className="text-xs text-slate-400 font-mono tracking-tight">••••••••••••</span>
                      <button
                        onClick={() => handleCopy(`${entry.id}_pwd`, entry.password)}
                        className="p-1 bg-slate-50 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-150 dark:border-slate-700 rounded-lg shadow-sm text-slate-400 hover:text-primary-600 active:scale-90 transition-all opacity-0 group-hover:opacity-100"
                        title="Copy Password"
                      >
                        {copiedId === `${entry.id}_pwd` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Lock className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Column 4: Strength, Last Updated & Actions */}
                    <div className="w-1/4 flex items-center justify-end gap-4 shrink-0">
                      {(() => {
                        const strength = entry.strength || (entry.password ? SecurityService.calculateStrength(entry.password) : 'Medium');
                        return (
                          <div className={`text-[8px] font-normal px-2 py-0.5 rounded-md uppercase tracking-wider ${getStrengthColor(strength)}`}>
                            {t(`vault.strength.${strength}`, strength)}
                          </div>
                        );
                      })()}
                      <span className="text-[9px] text-slate-300 font-normal uppercase tracking-widest hidden lg:inline">
                        {entry.lastUpdated === 'Just now' || entry.lastUpdated === '刚刚' ? t('vault.just_now') : entry.lastUpdated}
                      </span>
                      <button onClick={() => onEdit(entry)} className="p-1.5 text-slate-450 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-all">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Clean Mobile List Item */}
                  <div
                    onClick={() => onEdit(entry)}
                    className={`md:hidden flex items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer relative ${index === 0 ? 'rounded-t-[20px]' : ''
                      } ${index === passwords.length - 1 ? 'rounded-b-[20px]' : ''}`}
                  >
                    {index > 0 && (
                      <div className="absolute top-0 left-0 right-0 border-t border-slate-100 dark:border-slate-800/80 pointer-events-none" />
                    )}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-slate-100 font-normal shrink-0 border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                        {entry.icon ? (
                          <img src={entry.icon} alt={entry.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">{entry.title.charAt(0).toUpperCase()}</span>
                        )}
                      </div>

                      {/* Text Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-normal text-slate-900 dark:text-white text-base truncate leading-tight">{entry.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1 font-normal">{entry.username}</p>
                      </div>
                    </div>

                    {/* Quick Action: Copy Password */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(`${entry.id}_pwd`, entry.password);
                      }}
                      className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95 ${copiedId === `${entry.id}_pwd`
                        ? 'bg-emerald-500 text-white shadow-emerald-500/30 shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                      {copiedId === `${entry.id}_pwd` ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </React.Fragment>
              ))}
            </div>
            {/* Mobile Spacer to clear bottom tab bar */}
            <div className="h-24 md:hidden" />
          </>
        ) : (
          <div className="p-12 text-center text-slate-400 dark:text-slate-600 text-xs">
            {t('vault.empty', 'No credentials found')}
          </div>
        )}
      </div>
    </div>
  );
};
