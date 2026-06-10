
import React, { useState, useCallback, useEffect } from 'react';
import { RefreshCw, Copy, Check, Info, Type, Hash, Code } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCryptoService } from '@ethervault/core';

export const GeneratorView: React.FC = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });

  const generatePassword = useCallback(() => {
    const result = getCryptoService().generatePassword(length, options);
    setPassword(result);
  }, [length, options]);

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getEntropy = () => {
    let poolSize = 0;
    if (options.uppercase) poolSize += 26;
    if (options.lowercase) poolSize += 26;
    if (options.numbers) poolSize += 10;
    if (options.symbols) poolSize += 32;
    if (poolSize === 0) return 0;
    return Math.floor(length * Math.log2(poolSize));
  };

  const CompactOption = ({ icon: Icon, label, value, onClick }: any) => (
    <div
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 px-4 group cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/40 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 text-slate-400 group-hover:text-primary-500 transition-colors">
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 tracking-tight">{label}</span>
      </div>
      <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${value ? 'bg-primary-600/85' : 'bg-slate-200 dark:bg-slate-700'
        }`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-200 ${value ? 'left-[18px]' : 'left-0.5'
          }`} />
      </div>
    </div>
  );

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm px-4 pt-[calc(env(safe-area-inset-top)+4px)] pb-4 md:sticky md:px-8 md:pt-8 transition-all">
        <div className="flex items-center justify-between">
          <div className="block">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{t('generator.title')}</h1>
            <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400 font-medium">{t('generator.subtitle')}</p>
          </div>
          <div className="hidden md:flex">
            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium tracking-wider border border-slate-200 dark:border-slate-700 shadow-sm">
              {t('generator.entropy', { bits: getEntropy() })}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 space-y-4 pb-6 md:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Result Card */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[32px] border-[0.5px] border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex-1 flex flex-col justify-center min-h-[300px]">
              {/* Background Decoration */}

              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-sky-500 rounded-[32px] blur-2xl opacity-5 dark:opacity-10 pointer-events-none" />

              <div className="relative text-center space-y-8 z-10">
                <span className="text-2xl md:text-3xl font-mono font-normal text-slate-800 dark:text-white line-clamp-2 break-all w-full px-4 tracking-tight leading-tight selection:bg-primary-500 selection:text-white min-h-[1.2em]">
                  {password}
                </span>

                <div className="space-y-4 max-w-md mx-auto w-full">
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button
                      onClick={generatePassword}
                      className="flex-1 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-500/50 rounded-2xl font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm hover:shadow-md"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="tracking-wider text-xs">{t('generator.actions.regenerate', 'Regenerate')}</span>
                    </button>
                    <button
                      onClick={handleCopy}
                      className="flex-1 py-2.5 bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 hover:border-primary-200 dark:hover:border-primary-500/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm hover:shadow-md"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span className="tracking-wider text-xs">{copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy')}</span>
                    </button>
                  </div>
                  <div className="md:hidden flex justify-center pt-1">
                    <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] md:text-xs font-medium tracking-wider border border-slate-200 dark:border-slate-700">
                      {t('generator.entropy', { bits: getEntropy() })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Configuration */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white dark:bg-slate-900 border-[0.5px] border-slate-200 dark:border-slate-800 shadow-sm rounded-[24px] md:rounded-[32px] overflow-hidden flex flex-col justify-between h-full">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {/* Length row */}
                <div className="w-full flex items-center justify-between p-3 px-4 gap-4">
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="p-1.5 text-slate-400">
                      <Hash className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 tracking-tight">
                      {t('generator.length')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <input
                      type="range"
                      min="4"
                      max="128"
                      value={length}
                      onChange={(e) => setLength(parseInt(e.target.value))}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchEnd={(e) => e.stopPropagation()}
                      className="w-full max-w-[160px] md:max-w-[200px] h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary-600/85 hover:accent-primary-500 transition-all touch-none"
                    />
                    <input
                      type="number"
                      min="4"
                      max="128"
                      value={length}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) setLength(Math.min(128, Math.max(1, val)));
                      }}
                      className="text-xs font-normal text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl tabular-nums w-16 text-center border-[0.5px] border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {/* Option Toggles */}
                <CompactOption
                  icon={Type}
                  label={t('generator.options.uppercase')}
                  value={options.uppercase}
                  onClick={() => setOptions(prev => ({ ...prev, uppercase: !prev.uppercase }))}
                />
                <CompactOption
                  icon={Type}
                  label={t('generator.options.lowercase')}
                  value={options.lowercase}
                  onClick={() => setOptions(prev => ({ ...prev, lowercase: !prev.lowercase }))}
                />
                <CompactOption
                  icon={Hash}
                  label={t('generator.options.numbers')}
                  value={options.numbers}
                  onClick={() => setOptions(prev => ({ ...prev, numbers: !prev.numbers }))}
                />
                <CompactOption
                  icon={Code}
                  label={t('generator.options.symbols')}
                  value={options.symbols}
                  onClick={() => setOptions(prev => ({ ...prev, symbols: !prev.symbols }))}
                />
              </div>

              {/* Info Footer */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800/80 flex items-start gap-2.5 mt-auto">
                <div className="text-primary-500 shrink-0 pt-0.5">
                  <Info className="w-4 h-4" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {t('generator.info')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
