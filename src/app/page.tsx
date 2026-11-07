'use client';

import React from 'react';
import { useWealth, WealthProvider } from '@/context/WealthContext';
import BalanceSheetView from '@/components/views/BalanceSheetView';
import FinancialHealthView from '@/components/views/FinancialHealthView';
import PortfolioView from '@/components/views/PortfolioView';
import CashFlowJournalView from '@/components/views/CashFlowJournalView';
import TaxAndGPFView from '@/components/views/TaxAndGPFView';
import SettingsAndImportView from '@/components/views/SettingsAndImportView';
import {
  Wallet,
  Activity,
  PieChart as PieIcon,
  BookOpen,
  Receipt,
  Settings,
  ShieldCheck,
  Building2,
  Menu,
} from 'lucide-react';

function MainApp() {
  const { activeTab, setActiveTab, database, isLoading } = useWealth();

  if (isLoading || !database) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white animate-bounce shadow-lg">
          <ShieldCheck size={28} />
        </div>
        <div className="mt-4 font-bold text-slate-800 dark:text-slate-100 text-base">
          GovWealth Planner Web
        </div>
        <div className="text-xs text-slate-400 mt-1">กำลังโหลดฐานข้อมูล พ.ศ. ๒๕๖๙...</div>
      </div>
    );
  }

  const navItems = [
    { id: 'balance', label: 'สรุปงบดุลส่วนบุคคล', shortLabel: 'งบดุล', icon: Wallet },
    { id: 'health', label: 'ตรวจสุขภาพการเงิน', shortLabel: 'สุขภาพ', icon: Activity },
    { id: 'portfolio', label: 'พอร์ต ๖ หมวด & สรุป', shortLabel: 'พอร์ต ๖', icon: PieIcon },
    { id: 'cashflow', label: 'กระแสเงินสด', shortLabel: 'กระแสเงิน', icon: BookOpen },
    { id: 'tax', label: 'ภาษี & กบข./RMF', shortLabel: 'ภาษี/กบข.', icon: Receipt },
    { id: 'settings', label: 'ตั้งค่าผู้ใช้ & ข้อมูล', shortLabel: 'ตั้งค่า', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 select-none">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                GovWealth
              </div>
              <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">
                ระบบบริหารความมั่งคั่ง & ภาษี
              </div>
            </div>
          </div>

          {/* User Badge */}
          <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {database.profile.fullName}
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-0.5">
              {database.profile.rank}
            </div>
            <div className="text-[10px] text-emerald-800 dark:text-emerald-400 font-medium truncate mt-0.5 flex items-center gap-1">
              <Building2 size={11} /> {database.profile.organization}
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition text-left ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
          ระบบบริหารการเงินภาครัฐไทย พ.ศ. ๒๕๖๙
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white leading-none">
              GovWealth Planner
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">
              สสจ.นครนายก (พ.ศ. ๒๕๖๙)
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('settings')}
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 text-xs font-bold"
        >
          {database.profile.fullName.slice(0, 2)}
        </button>
      </header>

      {/* Main Content View Container */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'balance' && <BalanceSheetView />}
        {activeTab === 'health' && <FinancialHealthView />}
        {activeTab === 'portfolio' && <PortfolioView />}
        {activeTab === 'cashflow' && <CashFlowJournalView />}
        {activeTab === 'tax' && <TaxAndGPFView />}
        {activeTab === 'settings' && <SettingsAndImportView />}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50 px-2 py-1 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1.5 px-2 rounded-xl transition ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
              <span className="text-[10px] mt-1 leading-none">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default function Home() {
  return (
    <WealthProvider>
      <MainApp />
    </WealthProvider>
  );
}
