
import React, { useMemo } from 'react';
import { ShieldAlert, ShieldCheck, RefreshCcw, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PasswordEntry } from '@premium-password-manager/core';

interface SecurityDashboardProps {
  passwords: PasswordEntry[];
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ passwords }) => {
  const stats = useMemo(() => {
    const weak = passwords.filter(p => p.strength === 'Weak').length;
    const medium = passwords.filter(p => p.strength === 'Medium').length;
    const strong = passwords.filter(p => p.strength === 'Strong' || p.strength === 'Secure').length;

    const score = Math.round((strong / passwords.length) * 100) || 0;

    return {
      weak,
      medium,
      strong,
      score,
      total: passwords.length
    };
  }, [passwords]);

  const chartData = [
    { name: 'Weak', value: stats.weak, color: '#f43f5e' },
    { name: 'Medium', value: stats.medium, color: '#f59e0b' },
    { name: 'Strong', value: stats.strong, color: '#10b981' },
  ];

  return (
    <div className="space-y-4 md:space-y-5 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Security Health</h1>
          <p className="hidden md:block text-slate-500 dark:text-slate-400 text-xs mt-0.5">Real-time analysis of your credential vault.</p>
        </div>
        <button className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20 active:scale-95 transition-all">
          <RefreshCcw className="w-3 h-3" />
          FULL SCAN
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main Score Card - Optimized padding to prevent truncation */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-32 h-32 md:w-36 md:h-36 flex items-center justify-center shrink-0 p-2">
              <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="44"
                  fill="none" stroke="currentColor" strokeWidth="8"
                  className="text-slate-100 dark:text-slate-800"
                />
                <circle
                  cx="50" cy="50" r="44"
                  fill="none" stroke="currentColor" strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={2 * Math.PI * 44 * (1 - stats.score / 100)}
                  strokeLinecap="round"
                  className="text-emerald-500 transition-all duration-1000 ease-out shadow-sm"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white block">{stats.score}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Protection Status</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">
                  {stats.score > 80 ? "Your digital vault is robust. Maintain strong 2FA everywhere." : "Immediate action recommended for weak credentials."}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto sm:mx-0">
                <div className="px-2 py-2 bg-rose-50 dark:bg-rose-500/5 rounded-xl border border-rose-100 dark:border-rose-500/10 text-center">
                  <span className="block text-sm font-bold text-rose-600">{stats.weak}</span>
                  <span className="text-[8px] font-bold text-rose-400 uppercase tracking-tighter">Weak</span>
                </div>
                <div className="px-2 py-2 bg-amber-50 dark:bg-amber-500/5 rounded-xl border border-amber-100 dark:border-amber-500/10 text-center">
                  <span className="block text-sm font-bold text-amber-600">{stats.medium}</span>
                  <span className="text-[8px] font-bold text-amber-400 uppercase tracking-tighter">Reuse</span>
                </div>
                <div className="px-2 py-2 bg-emerald-50 dark:bg-emerald-500/5 rounded-xl border border-emerald-100 dark:border-emerald-500/10 text-center">
                  <span className="block text-sm font-bold text-emerald-600">{stats.strong}</span>
                  <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">Safe</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Chart - Compact */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
          <div className="w-full h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={35} outerRadius={45} paddingAngle={4} dataKey="value">
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Issues - High Density List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Security Alerts</span>
          </div>
          <span className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full">2 ACTION ITEMS</span>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          <div className="p-4 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500"><AlertCircle className="w-4 h-4" /></div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Compromised Password: Instagram</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Found in a known data breach. Change immediately.</p>
              </div>
            </div>
            <button className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-100 transition-all">RESOLVE</button>
          </div>
          <div className="p-4 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500"><RefreshCcw className="w-4 h-4" /></div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Reused Password: 3 Accounts</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Reusing passwords across Work and Personal accounts.</p>
              </div>
            </div>
            <button className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">AUDIT</button>
          </div>
        </div>
      </div>
    </div>
  );
};
