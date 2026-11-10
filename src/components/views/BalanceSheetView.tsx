'use client';

import React, { useState } from 'react';
import { useWealth } from '@/context/WealthContext';
import {
  calculateNetWorth,
  calculatePortfolioAllocation,
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
  Pencil,
  X,
  Check,
  Filter,
} from 'lucide-react';
import { Asset, AssetCategory, ASSET_CATEGORIES, Liability } from '@/types/wealth';

export default function BalanceSheetView() {
  const { database, addAsset, updateAsset, deleteAsset, addLiability, deleteLiability, setActiveTab } = useWealth();
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddLiability, setShowAddLiability] = useState(false);

  // Category Filter State
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<AssetCategory | 'ALL'>('ALL');

  // Edit Asset Modal State
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<AssetCategory>('1. เงินสดและเทียบเท่า');
  const [editInstitution, setEditInstitution] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const handleStartEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setEditName(asset.name);
    setEditCategory(asset.category);
    setEditInstitution(asset.institution || '');
    setEditAmount(asset.amountTHB.toString());
    setEditNotes(asset.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    const parsedAmount = parseFloat(editAmount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      alert('กรุณากรอกจำนวนเงินให้ถูกต้อง');
      return;
    }

    updateAsset(editingAsset.id, {
      name: editName.trim() || editingAsset.name,
      category: editCategory,
      institution: editInstitution.trim(),
      amountTHB: parsedAmount,
      notes: editNotes.trim(),
    });

    setEditingAsset(null);
  };

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

  const { allocations, totalGpfValue, gpfPlan } = calculatePortfolioAllocation(
    database.assets,
    database.profile
  );

  const existingGpfAsset = database.assets.find(
    (a) => a.isGpf || a.name.toLowerCase().includes('กบข') || a.institution.toLowerCase().includes('กบข')
  );

  const [showQuickGpfModal, setShowQuickGpfModal] = useState(false);
  const [quickGpfAmount, setQuickGpfAmount] = useState(
    existingGpfAsset?.amountTHB ? String(existingGpfAsset.amountTHB) : ''
  );

  // Total GPF deductions in taxItems (e.g. from payroll slips)
  const totalGpfInRecords = database.taxItems
    .filter((t) => t.deductionType === 'กบข.' || t.fundCode.toLowerCase().includes('gpf'))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const handleSaveQuickGpf = (amount: number) => {
    if (amount <= 0) return;
    if (existingGpfAsset) {
      updateAsset(existingGpfAsset.id, {
        name: 'กองทุนบำเหน็จบำนาญข้าราชการ (กบข.)',
        amountTHB: amount,
        notes: `แผน กบข. Look-Through: หุ้นไทย ${gpfPlan.thaiStockPercent}%, หุ้น ตปท. ${gpfPlan.foreignStockPercent}%, ทองคำ ${gpfPlan.goldPercent}%`,
        isGpf: true,
      });
    } else {
      addAsset({
        name: 'กองทุนบำเหน็จบำนาญข้าราชการ (กบข.)',
        category: '2. กองทุนรวมไทย',
        institution: 'กองทุนบำเหน็จบำนาญข้าราชการ (กบข.)',
        amountTHB: amount,
        amountUSD: 0,
        isUSD: false,
        notes: `แผน กบข. Look-Through: หุ้นไทย ${gpfPlan.thaiStockPercent}%, หุ้น ตปท. ${gpfPlan.foreignStockPercent}%, ทองคำ ${gpfPlan.goldPercent}%`,
        isGpf: true,
      });
    }
    setShowQuickGpfModal(false);
  };

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
            {database.profile.rank} {database.profile.fullName} (ปี พ.ศ. 2569)
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
                5 อัตราส่วน
              </span>
            </div>
            <div className="text-sm md:text-base font-extrabold mt-0.5 flex flex-wrap items-baseline gap-2">
              <span>คะแนนสุขภาพ: <strong className="text-emerald-300 font-mono text-xl">{healthReport.overallScore}</strong> / 100</span>
              <span className="text-xs font-normal text-slate-300">({healthReport.tierName})</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('health')}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-sm shrink-0"
        >
          ดูผลตรวจสุขภาพเชิงลึก 5 อัตราส่วน <ChevronRight size={14} />
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
                จากทั้งหมด {database.assets.length} รายการ (6 หมวดสินทรัพย์)
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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="text-emerald-600" size={20} />
            สัดส่วนสินทรัพย์แยก 6 หมวดมาตรฐาน
            {totalGpfValue > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                {database.assets.some((a) => a.isGpfDecomposed) ? 'กบข. แยก ๓ แผนจริง Active' : 'Look-Through กบข. Active'}
              </span>
            )}
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuickGpfModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition flex items-center gap-1.5"
            >
              <ShieldCheck size={14} /> {existingGpfAsset ? 'ปรับยอดสะสม กบข.' : 'บันทึกยอดสะสม กบข.'}
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className="text-xs text-slate-500 hover:text-emerald-600 font-semibold transition"
            >
              ดูพอร์ตการลงทุน & Rebalancing →
            </button>
          </div>
        </div>

        {/* Quick GPF Setup Banner if no GPF asset exists */}
        {!existingGpfAsset && (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 dark:from-emerald-950/60 dark:to-teal-950/40 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5 shadow-xs">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <span>ทำไมหมวดหุ้นไทย / หุ้น ตปท. / ทองคำ ยังเป็น 0.00 ฿?</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-[11px] font-bold">
                      ขั้นตอนแนะนำ
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    ปัจจุบันในสมุดบัญชีมีเพียง <b>เงินสด/สลาก (เงินเดือนสุทธิ {formatCurrency(totalAssets)} ฿)</b> แต่ยังไม่มีรายการ <b>ยอดเงินสะสม กบข.</b>
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1">
                    👉 เพียงคุณกรอก <b>"ยอดเงินสะสม กบข. รวม"</b> (ดูได้จากแอป My GPF หรือใบแจ้งยอด กบข.) ระบบจะกระจายเข้า <b>หุ้นไทย 35%, หุ้น ตปท. 40%, ทองคำ 25%</b> ให้ทันที!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowQuickGpfModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  <Plus size={16} /> บันทึกยอดสะสม กบข. ตอนนี้
                </button>
                {totalGpfInRecords > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSaveQuickGpf(totalGpfInRecords)}
                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold text-xs transition"
                  >
                    ดึงจากสลิป ({formatCurrency(totalGpfInRecords)} ฿)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allocations.map((alloc) => {
            const meta = ASSET_CATEGORIES.find((c) => c.key === alloc.category);
            const items = database.assets.filter((a) => a.category === alloc.category);
            const percentOfTotal = totalAssets > 0 ? (alloc.currentValue / totalAssets) * 100 : 0;
            const isSelected = selectedCategoryFilter === alloc.category;

            return (
              <div
                key={alloc.category}
                onClick={() => {
                  setSelectedCategoryFilter((prev) => (prev === alloc.category ? 'ALL' : alloc.category));
                }}
                className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 select-none ${
                  isSelected
                    ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40 shadow-md scale-[1.01]'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-xs'
                }`}
                title={`คลิกเพื่อกรองตารางสินทรัพย์เฉพาะหมวด ${alloc.category}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${meta?.twBadge || ''}`}>
                    {alloc.shortName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isSelected && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold animate-pulse">
                        กำลังเลือก
                      </span>
                    )}
                    {alloc.gpfDecomposedValue > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                        +กบข.
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {percentOfTotal.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(alloc.currentValue)} <span className="text-xs font-normal text-slate-400">฿</span>
                  </div>
                  {alloc.gpfDecomposedValue > 0 && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                      (ตรง: {formatCurrency(alloc.directValue)} | กบข.: +{formatCurrency(alloc.gpfDecomposedValue)})
                    </div>
                  )}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, percentOfTotal)}%`,
                        backgroundColor: alloc.color,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span className={isSelected ? 'text-emerald-700 dark:text-emerald-400 font-bold' : ''}>
                    {items.length} รายการบัญชี {isSelected ? '(คลิกเพื่อยกเลิก)' : '(คลิกเพื่อดู)'}
                  </span>
                  <span className="text-slate-400">เป้าหมาย {alloc.targetPercent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Assets Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {selectedCategoryFilter === 'ALL' ? (
                <>รายการสินทรัพย์ทั้งหมด ({database.assets.length} รายการ)</>
              ) : (
                <>
                  รายการสินทรัพย์: <span className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedCategoryFilter}</span> ({
                    database.assets.filter((a) => a.category === selectedCategoryFilter).length
                  } รายการ)
                </>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedCategoryFilter === 'ALL'
                ? 'คลิกการ์ดสัดส่วน 6 หมวดด้านบนเพื่อกรองดูเฉพาะหมวด หรือกดปุ่มดินสอ ✏️ เพื่อแก้ไข/ปรับยอดเงินจริง'
                : 'กำลังกรองแสดงเฉพาะหมวดที่เลือก คลิกการ์ดซ้ำหรือกดปุ่มเพื่อดูทั้งหมด'}
            </p>
          </div>

          {selectedCategoryFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedCategoryFilter('ALL')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <X size={14} /> แสดงทั้งหมด ({database.assets.length})
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
              <tr>
                <th className="py-3 px-4 rounded-l-lg">ชื่อสินทรัพย์ / บัญชี</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4">สถาบัน / แหล่งเงิน</th>
                <th className="py-3 px-4 text-right">มูลค่า (บาท)</th>
                <th className="py-3 px-4 text-center rounded-r-lg w-24">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {database.assets
                .filter((a) => selectedCategoryFilter === 'ALL' || a.category === selectedCategoryFilter)
                .map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{asset.name}</span>
                        {asset.isGpfDecomposed && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                            กบข.
                          </span>
                        )}
                      </div>
                      {asset.units && asset.nav ? (
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                          {asset.units.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} หน่วย @ {asset.nav.toFixed(4)} ฿
                        </div>
                      ) : asset.notes ? (
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">{asset.notes}</div>
                      ) : null}
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
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleStartEdit(asset)}
                          className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 p-1.5 rounded-lg transition"
                          title="แก้ไข / ปรับยอดเงินจริง"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบสินทรัพย์ "${asset.name}"?`)) {
                              deleteAsset(asset.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 p-1.5 rounded-lg transition"
                          title="ลบรายการ"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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
                  หมวดหมู่สินทรัพย์ 6 ประเภท *
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
      {/* Quick GPF Modal */}
      {showQuickGpfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-600 text-white">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  บันทึกยอดเงินสะสม กบข.
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickGpfModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              กรอกยอดเงินสะสม กบข. รวมทั้งหมดของคุณ (ดูได้จากแอป My GPF หรือสลิปเงินเดือน) ระบบจะนำยอดนี้มากระจายเข้าสู่ <b>หุ้นไทย 35%, หุ้นต่างประเทศ 40%, ทองคำ 25%</b> ให้ทันที
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                ยอดเงิน กบข. สะสมรวม (บาท):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="100"
                  value={quickGpfAmount}
                  onChange={(e) => setQuickGpfAmount(e.target.value)}
                  placeholder="เช่น 350000 หรือ 500000"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-base font-bold text-slate-900 dark:text-white"
                />
                <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold">฿</span>
              </div>
            </div>

            {totalGpfInRecords > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">
                  หรือใช้ยอดสะสมจากสลิปเงินเดือน:
                </span>
                <button
                  type="button"
                  onClick={() => setQuickGpfAmount(String(totalGpfInRecords))}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {formatCurrency(totalGpfInRecords)} ฿
                </button>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowQuickGpfModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(quickGpfAmount);
                  if (val > 0) {
                    handleSaveQuickGpf(val);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
              >
                บันทึกเข้าพอร์ตทันที
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Asset & Adjust Balance Modal */}
      {editingAsset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center shadow-xs">
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    แก้ไขสินทรัพย์ & ปรับยอดเงินจริง
                  </h3>
                  <p className="text-xs text-slate-500">
                    ปรับยอดเงินในบัญชีให้ตรงกับความเป็นจริง (ไม่ต้องลงรายจ่ายย้อนหลัง)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingAsset(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อสินทรัพย์ / บัญชี *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    หมวดหมู่สินทรัพย์ *
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as AssetCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {ASSET_CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.key}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    สถาบัน / ธนาคาร
                  </label>
                  <input
                    type="text"
                    value={editInstitution}
                    onChange={(e) => setEditInstitution(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Highlighted Balance Input */}
              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4">
                <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1.5 flex items-center justify-between">
                  <span>มูลค่าเงินคงเหลือจริงปัจจุบัน (บาท) *</span>
                  <span className="text-[11px] font-normal text-emerald-700 dark:text-emerald-400">
                    ยอดเดิม: {formatCurrency(editingAsset.amountTHB)} ฿
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 rounded-xl border-2 border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-900 text-xl font-black text-emerald-800 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600">
                    ฿
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-2 leading-relaxed">
                  💡 กรอกยอดเงินที่เหลือจริงในแอปธนาคารหรือพอร์ตปัจจุบัน ระบบจะปรับปรุงยอดสินทรัพย์สุทธิและพอร์ตโฟลิโอให้ตรงทันทีโดยไม่ต้องบันทึกรายการย้อนหลัง
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  บันทึกย่อ (Notes)
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="เช่น ปรับยอดเงินจริงในบัญชี ณ ปัจจุบัน"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <Check size={14} /> บันทึกการปรับยอด
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
