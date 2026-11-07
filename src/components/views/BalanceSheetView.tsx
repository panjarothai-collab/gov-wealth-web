'use client';

import React, { useState } from 'react';
import { useWealth } from '@/context/WealthContext';
import {
  calculateNetWorth,
  formatCurrency,
} from '@/lib/wealthEngine';
import { calculateFinancialHealth } from '@/lib/financialHealthEngine';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Wallet,
  Landmark,
  CreditCard,
  Plus,
  Trash2,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { Asset, AssetCategory, ASSET_CATEGORIES, Liability } from '@/types/wealth';

export default function BalanceSheetView() {
  const { database, addAsset, deleteAsset, addLiability, deleteLiability, setActiveTab } = useWealth();
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddLiability, setShowAddLiability] = useState(false);

  // New Asset form state
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetCategory, setNewAssetCategory] = useState<AssetCategory>('1. เงินสดและเทียบเท่า');
  const [newAssetInstitution, setNewAssetInstitution] = useState('');
  const [newAssetAmount, setNewAssetAmount] = useState('');

  // New Liability form state
  const [newLiabName, setNewLiabName] = useState('');
  const [newLiabLender, setNewLiabLender] = useState('');
  const [newLiabTotal, setNewLiabTotal] = useState('');
  const [newLiabMonthly, setNewLiabMonthly] = useState('');
  const [newLiabMonths, setNewLiabMonths] = useState('');

  if (!database) return null;

  const { totalAssets, totalLiabilities, netWorth, debtToEquityRatio } =
    calculateNetWorth(database.assets, database.liabilities, database.profile.usdToThbRate);

  const healthReport = calculateFinancialHealth(
    database.assets,
    database.liabilities,
    database.journalEntries,
    database.taxItems,
    database.profile,
    2026
  );

  // Donut chart data: Assets vs Liabilities
  const donutData = [
    { name: 'สินทรัพย์รวม', value: totalAssets, color: '#059669' }, // Emerald-600
    { name: 'หนี้สินรวม', value: totalLiabilities, color: '#EF4444' }, // Red-500
  ];

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName || !newAssetAmount) return;
    addAsset({
      name: newAssetName,
      category: newAssetCategory,
      institution: newAssetInstitution || 'ทั่วไป',
      amountTHB: parseFloat(newAssetAmount) || 0,
      amountUSD: 0,
      isUSD: false,
      notes: '',
    });
    setNewAssetName('');
    setNewAssetAmount('');
    setNewAssetInstitution('');
    setShowAddAsset(false);
  };

  const handleCreateLiability = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLiabName || !newLiabTotal) return;
    addLiability({
      name: newLiabName,
      lender: newLiabLender || 'สถาบันการเงิน',
      totalOutstanding: parseFloat(newLiabTotal) || 0,
      monthlyInstallment: parseFloat(newLiabMonthly) || 0,
      remainingMonths: parseInt(newLiabMonths) || 12,
      paidThisMonth: 0,
    });
    setNewLiabName('');
    setNewLiabTotal('');
    setNewLiabMonthly('');
    setNewLiabMonths('');
    setShowAddLiability(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome / Status Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-emerald-100 dark:border-emerald-950/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-medium text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            {database.profile.organization}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            สรุปงบดุลและความมั่งคั่งส่วนบุคคล
          </h1>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {database.profile.rank} {database.profile.fullName} (ปี พ.ศ. ๒๕๖๙)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddAsset(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium transition shadow-xs"
          >
            <Plus size={16} /> เพิ่มสินทรัพย์
          </button>
          <button
            onClick={() => setShowAddLiability(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-sm font-medium transition"
          >
            <Plus size={16} /> เพิ่มหนี้สิน
          </button>
        </div>
      </div>

      {/* Financial Health Quick Widget */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-700/40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-300 shrink-0 border border-white/20">
            <Activity size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-emerald-300 font-bold">
                ตรวจสุขภาพทางการเงิน (CFP & ระเบียบข้าราชการ)
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-semibold">
                ๕ อัตราส่วน
              </span>
            </div>
            <div className="text-sm md:text-base font-extrabold mt-0.5 flex flex-wrap items-baseline gap-2">
              <span>คะแนนสุขภาพ: <strong className="text-emerald-300 font-mono text-xl">{healthReport.overallScore}</strong> / ๑๐๐</span>
              <span className="text-xs font-normal text-slate-300">({healthReport.tierName})</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('health')}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-sm shrink-0"
        >
          ดูผลตรวจสุขภาพเชิงลึก ๕ อัตราส่วน <ChevronRight size={14} />
        </button>
      </div>

      {/* Hero Stats & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Donut Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center relative">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 self-start mb-2">
            สัดส่วนโครงสร้างทางการเงิน
          </h2>
          
          <div className="w-full h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${formatCurrency(Number(val))} ฿`, '']}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Net Worth in the center of the donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                ความมั่งคั่งสุทธิ
              </span>
              <span className="text-lg font-bold text-emerald-800 dark:text-emerald-400">
                {formatCurrency(netWorth)}
              </span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400">บาท (THB)</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mt-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
              <span className="text-slate-600 dark:text-slate-400">
                สินทรัพย์: {formatCurrency(totalAssets)} ฿
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-slate-600 dark:text-slate-400">
                หนี้สิน: {formatCurrency(totalLiabilities)} ฿
              </span>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Net Worth Card */}
          <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-emerald-100 text-sm font-medium">ความมั่งคั่งสุทธิ (Net Worth)</span>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Wallet className="text-emerald-200" size={20} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight">
                {formatCurrency(netWorth)} <span className="text-base font-normal text-emerald-200">฿</span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-1">
                หักกลบสินทรัพย์และภาระหนี้สินคงค้างทั้งหมดแล้ว
              </p>
            </div>
          </div>

          {/* Total Assets Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">สินทรัพย์รวมทั้งหมด</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                <Landmark className="text-emerald-600 dark:text-emerald-400" size={20} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(totalAssets)} <span className="text-sm font-normal text-slate-400">฿</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                จากทั้งหมด {database.assets.length} รายการ (๖ หมวดสินทรัพย์)
              </p>
            </div>
          </div>

          {/* Total Liabilities Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">หนี้สินคงค้างรวม</span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center">
                <CreditCard className="text-rose-600 dark:text-rose-400" size={20} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(totalLiabilities)} <span className="text-sm font-normal text-slate-400">฿</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ภาระหนี้สินคงค้าง {database.liabilities.length} รายการ
              </p>
            </div>
          </div>

          {/* D/E Ratio & Financial Health Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">อัตราส่วนหนี้สินต่อทุน (D/E)</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
                <ShieldCheck className="text-amber-600 dark:text-amber-400" size={20} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {debtToEquityRatio.toFixed(2)} <span className="text-sm font-normal text-slate-400">เท่า</span>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                {debtToEquityRatio < 1.0 ? '✓ สถานะการเงินมั่นคงสูง (หนี้สินต่ำกว่าทุน)' : 'ควรเฝ้าระวังภาระผ่อนชำระ'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Asset Classes Breakdown Cards */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="text-emerald-600" size={20} />
          สัดส่วนสินทรัพย์แยก ๖ หมวดมาตรฐาน
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ASSET_CATEGORIES.map((cat) => {
            const items = database.assets.filter((a) => a.category === cat.key);
            const catTotal = items.reduce(
              (sum, a) =>
                sum + (a.isUSD ? (a.amountUSD || 0) * database.profile.usdToThbRate : a.amountTHB),
              0
            );
            const percentOfTotal = totalAssets > 0 ? (catTotal / totalAssets) * 100 : 0;

            return (
              <div
                key={cat.key}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${cat.twBadge}`}>
                    {cat.shortName}
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {percentOfTotal.toFixed(1)}%
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(catTotal)} <span className="text-xs font-normal text-slate-400">฿</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, percentOfTotal)}%`,
                        backgroundColor: cat.color,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>{items.length} รายการบัญชี</span>
                  <span className="text-slate-400">เป้าหมาย {cat.defaultTargetPercent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Assets Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            รายการสินทรัพย์ทั้งหมด ({database.assets.length} รายการ)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
              <tr>
                <th className="py-3 px-4 rounded-l-lg">ชื่อสินทรัพย์ / บัญชี</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4">สถาบัน / แหล่งเงิน</th>
                <th className="py-3 px-4 text-right">มูลค่า (บาท)</th>
                <th className="py-3 px-4 text-center rounded-r-lg">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {database.assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    {asset.name}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                    {asset.category.replace(/^\d+\.\s*/, '')}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {asset.institution || '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(asset.amountTHB)} ฿
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => deleteAsset(asset.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition"
                      title="ลบรายการ"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Liabilities Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          ตารางหนี้สินและภาระผูกพัน ({database.liabilities.length} รายการ)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
              <tr>
                <th className="py-3 px-4 rounded-l-lg">รายการหนี้สิน</th>
                <th className="py-3 px-4">เจ้าหนี้ / สถาบัน</th>
                <th className="py-3 px-4 text-right">ยอดผ่อน / เดือน</th>
                <th className="py-3 px-4 text-center">คงเหลือ (เดือน)</th>
                <th className="py-3 px-4 text-right">ยอดหนี้คงค้าง (บาท)</th>
                <th className="py-3 px-4 text-center rounded-r-lg">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {database.liabilities.map((liab) => (
                <tr key={liab.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    {liab.name}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                    {liab.lender}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">
                    {formatCurrency(liab.monthlyInstallment)} ฿
                  </td>
                  <td className="py-3 px-4 text-center text-xs font-semibold text-amber-600">
                    {liab.remainingMonths} ด.
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-rose-600 dark:text-rose-400">
                    {formatCurrency(liab.totalOutstanding)} ฿
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => deleteLiability(liab.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition"
                      title="ลบรายการ"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Asset */}
      {showAddAsset && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              เพิ่มรายการสินทรัพย์ใหม่
            </h3>
            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อสินทรัพย์ / บัญชี *
                </label>
                <input
                  type="text"
                  required
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  placeholder="เช่น สลากออมสิน, หุ้นกู้, กองทุน K-USXNDQ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  หมวดหมู่สินทรัพย์ ๖ ประเภท *
                </label>
                <select
                  value={newAssetCategory}
                  onChange={(e) => setNewAssetCategory(e.target.value as AssetCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {ASSET_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.key} ({c.shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  สถาบัน / สหกรณ์ / ธนาคาร
                </label>
                <input
                  type="text"
                  value={newAssetInstitution}
                  onChange={(e) => setNewAssetInstitution(e.target.value)}
                  placeholder="เช่น กบข., ธ.กสิกรไทย, InnovestX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  มูลค่าคงเหลือปัจจุบัน (บาท) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newAssetAmount}
                  onChange={(e) => setNewAssetAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddAsset(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm hover:bg-slate-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition"
                >
                  บันทึกสินทรัพย์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Liability */}
      {showAddLiability && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              เพิ่มรายการหนี้สิน / ผ่อนชำระ
            </h3>
            <form onSubmit={handleCreateLiability} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อรายการหนี้สิน *
                </label>
                <input
                  type="text"
                  required
                  value={newLiabName}
                  onChange={(e) => setNewLiabName(e.target.value)}
                  placeholder="เช่น สินเชื่อเคหะ, บัตรเครดิต KTC"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  เจ้าหนี้ / สถาบันการเงิน
                </label>
                <input
                  type="text"
                  value={newLiabLender}
                  onChange={(e) => setNewLiabLender(e.target.value)}
                  placeholder="เช่น ธอส., ธ.กรุงไทย"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ยอดหนี้คงค้าง (บาท) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newLiabTotal}
                    onChange={(e) => setNewLiabTotal(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ผ่อนต่อเดือน (บาท)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newLiabMonthly}
                    onChange={(e) => setNewLiabMonthly(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  จำนวนงวดคงเหลือ (เดือน)
                </label>
                <input
                  type="number"
                  value={newLiabMonths}
                  onChange={(e) => setNewLiabMonths(e.target.value)}
                  placeholder="เช่น 12, 60"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddLiability(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm hover:bg-slate-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition"
                >
                  บันทึกหนี้สิน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
