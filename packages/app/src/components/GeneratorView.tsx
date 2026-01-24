
import React, { useState, useCallback, useEffect } from 'react';
import { RefreshCw, Copy, Check, Info } from 'lucide-react';
import { CryptoService } from '@premium-password-manager/core';

export const GeneratorView: React.FC = () => {
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
    const result = CryptoService.generatePassword(length, options);
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

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">Generator</h1>
        <div className="px-3 py-1 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-violet-100 dark:border-violet-500/20">
          Entropy: ~{getEntropy()} bits
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative group mb-6 md:mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl blur opacity-10 group-hover:opacity-25 transition-opacity duration-500" />
          <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="flex-1 text-lg md:text-2xl font-mono font-bold text-slate-700 dark:text-violet-400 overflow-hidden text-ellipsis whitespace-nowrap tracking-wider">
              {password}
            </span>
            <div className="flex gap-1 md:gap-2 ml-2">
              <button onClick={generatePassword} className="p-2 text-slate-400 hover:text-violet-600 transition-colors active:scale-90"><RefreshCw className="w-5 h-5" /></button>
              <button onClick={handleCopy} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors active:scale-90">{copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}</button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3 px-1">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Length</label>
              <span className="text-xs font-bold text-slate-900 dark:text-white">{length} chars</span>
            </div>
            <input
              type="range" min="8" max="64" value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-violet-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-4">
            {Object.entries(options).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setOptions(prev => ({ ...prev, [key]: !value }))}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${value ? 'bg-violet-50/40 dark:bg-violet-500/5 border-violet-200 dark:border-violet-500/20' : 'bg-transparent border-slate-200 dark:border-slate-800'
                  }`}
              >
                <span className="capitalize font-semibold text-slate-600 dark:text-slate-400 text-xs">{key}</span>
                <div className={`w-8 h-4.5 rounded-full relative transition-colors ${value ? 'bg-violet-600' : 'bg-slate-200 dark:bg-slate-800'}`}>
                  <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${value ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <Info className="w-4 h-4 text-violet-400 shrink-0" />
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold leading-tight">
              Higher entropy makes passwords harder to crack via brute-force.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
