'use client';

import React, { useState } from 'react';
import { useWealth } from '@/context/WealthContext';
import {
  calculatePortfolioAllocation,
  formatCurrency,
} from '@/lib/wealthEngine';
import {
  PieChart as PieIcon,
  Sliders,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Sparkles,
  Calendar,
  Wallet,
  ShieldAlert,
  Coins,
} from 'lucide-react';
import { AssetCategory } from '@/types/wealth';

export default function PortfolioView() {
  const { database, updateProfile } = useWealth();
  const [isEditingTargets, setIsEditingTargets] = useState(false);

  // Targets state
  const [tCash, setTCash] = useState(database?.profile.targetCashPercent ?? 10);
  const [tThaiFund, setTThaiFund] = useState(database?.profile.targetThaiFundPercent ?? 20);
  const [tForeignFund, setTForeignFund] = useState(database?.profile.targetForeignFundPercent ?? 20);
  const [tThaiStock, setTThaiStock] = useState(database?.profile.targetThaiStockPercent ?? 20);
  const [tForeignStock, setTForeignStock] = useState(database?.profile.targetForeignStockPercent ?? 20);
  const [tForex, setTForex] = useState(database?.profile.targetForexPercent ?? 10);

  // Expected returns state (% per year)
  const [eCash, setECash] = useState(database?.profile.expectedReturnCash ?? 1.5);
  const [eThaiFund, setEThaiFund] = useState(database?.profile.expectedReturnThaiFund ?? 4.5);
  const [eForeignFund, setEForeignFund] = useState(database?.profile.expectedReturnForeignFund ?? 8.0);
  const [eThaiStock, setEThaiStock] = useState(database?.profile.expectedReturnThaiStock ?? 7.0);
  const [eForeignStock, setEForeignStock] = useState(database?.profile.expectedReturnForeignStock ?? 9.0);
  const [eForex, setEForex] = useState(database?.profile.expectedReturnForex ?? 6.0);

  // Monthly DCA simulation budget
  const [simDcaBudget, setSimDcaBudget] = useState(database?.profile.monthlyDcaBudget ?? 10000);

  if (!database) return null;

  const { allocations, totalInvested, expectedReturnInfo } = calculatePortfolioAllocation(
    database.assets,
    {
      ...database.profile,
      monthlyDcaBudget: simDcaBudget,
    }
  );

  const totalTargetPercent =
    tCash + tThaiFund + tForeignFund + tThaiStock + tForeignStock + tForex;

  const hasToleranceAlert = allocations.some((a) => a.isToleranceExceeded);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (Math.abs(totalTargetPercent - 100) > 0.01) {
      alert(`สัดส่วนเป้าหมายรวมต้องเท่ากับ 100% (ปัจจุบัน: ${totalTargetPercent}%)`);
      return;
    }
    updateProfile({
      targetCashPercent: tCash,
      targetThaiFundPercent: tThaiFund,
      targetForeignFundPercent: tForeignFund,
      targetThaiStockPercent: tThaiStock,
      targetForeignStockPercent: tForeignStock,
      targetForexPercent: tForex,
      expectedReturnCash: eCash,
      expectedReturnThaiFund: eThaiFund,
      expectedReturnForeignFund: eForeignFund,
      expectedReturnThaiStock: eThaiStock,
      expectedReturnForeignStock: eForeignStock,
      expectedReturnForex: eForex,
      monthlyDcaBudget: simDcaBudget,
    });
    setIsEditingTargets(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieIcon className="text-emerald-600" size={24} />
            พอร์ตการลงทุน 6 หมวด & การปรับสมดุล (Rebalancing)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            มูลค่าพอร์ตลงทุนรวมทั้งหมด: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalInvested)} ฿</span>
          </p>
        </div>

        <button
          onClick={() => setIsEditingTargets(!isEditingTargets)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition shadow-xs"
        >
          <Sliders size={16} /> {isEditingTargets ? 'ปิดการตั้งค่า' : 'ปรับสัดส่วน & ผลตอบแทนคาดหวัง'}
        </button>
      </div>

      {/* Hero Section: Academic Expected Return (MPT) & Retirement Wealth Projection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Expected Annual Return */}
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 text-white rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-200">
              <span className="flex items-center gap-1.5">
                <TrendingUp size={16} /> ประมาณการผลตอบแทนเฉลี่ยต่อปี (MPT)
              </span>
              <span className="bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
                6 หมวดมาตรฐาน
              </span>
            </div>

            <div className="mt-4">
              <div className="text-4xl font-extrabold tracking-tight">
                {expectedReturnInfo.expectedAnnualReturnPercent.toFixed(2)}%
                <span className="text-base font-normal text-emerald-200 ml-1.5">ต่อปี</span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-1">
                กำไรคาดหวังเฉลี่ย: <b>฿{formatCurrency(expectedReturnInfo.expectedAnnualProfitTHB)}</b> / ปี (พอร์ตปัจจุบัน)
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-emerald-700/60 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-emerald-300">ผลตอบแทนแท้จริง (Real):</span>
              <div className="text-sm font-bold mt-0.5">
                +{expectedReturnInfo.realReturnPercent.toFixed(2)}% ต่อปี
              </div>
              <span className="text-[10px] text-emerald-400/80">หักเงินเฟ้อ 2.0%</span>
            </div>
            <div className="text-right">
              <span className="text-emerald-300">สัดส่วนเสี่ยง : มั่นคง:</span>
              <div className="text-sm font-bold mt-0.5">
                {tForeignFund + tThaiStock + tForeignStock + tForex}% : {tCash + tThaiFund}%
              </div>
              <span className="text-[10px] text-emerald-400/80">หุ้น/ทางเลือก : เงินสด/กองทุนไทย</span>
            </div>
          </div>
        </div>

        {/* Card 2 & 3: Wealth Accumulation & Retirement Projection */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                การเติบโตทบต้นสู่เป้าหมายเกษียณ (Wealth Accumulation Projection)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                จำลองเงินต้น ฿{formatCurrency(totalInvested)} + ออมสมทบ DCA ฿{formatCurrency(simDcaBudget)}/เดือน (ดอกเบี้ยทบต้น {expectedReturnInfo.expectedAnnualReturnPercent}%)
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Wallet size={14} className="text-emerald-600" />
              <span className="text-slate-500">DCA:</span>
              <span className="font-bold text-slate-900 dark:text-white">฿{formatCurrency(simDcaBudget)}/ด.</span>
            </div>
          </div>

          {/* 3 Milestone Projection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 5 Years */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-medium">อีก 5 ปี (พ.ศ. 2574)</span>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">ระยะสั้น</span>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                ฿{formatCurrency(expectedReturnInfo.fiveYearFV)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                เงินต้น+DCA รวม: ฿{formatCurrency(totalInvested + simDcaBudget * 60)}
              </p>
            </div>

            {/* 10 Years */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-medium">อีก 10 ปี (พ.ศ. 2579)</span>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">ระยะกลาง</span>
              </div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                ฿{formatCurrency(expectedReturnInfo.tenYearFV)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                เงินต้น+DCA รวม: ฿{formatCurrency(totalInvested + simDcaBudget * 120)}
              </p>
            </div>

            {/* Retirement (2588) */}
            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 ring-2 ring-emerald-500/10">
              <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 mb-1 font-semibold">
                <span>วันเกษียณ (พ.ศ. 2588)</span>
                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded">60 ปีบริบูรณ์</span>
              </div>
              <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                ฿{formatCurrency(expectedReturnInfo.retirementYearFV)}
              </div>
              <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400 mt-0.5">
                ระยะเวลาลงทุน: {expectedReturnInfo.yearsToRetire} ปี
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Drawer: Targets & Expected Returns Customizer */}
      {isEditingTargets && (
        <form onSubmit={handleSaveSettings} className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200/60 dark:border-emerald-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                กำหนดสัดส่วนเป้าหมาย (Target %) และ ผลตอบแทนคาดหวัง (Expected Return %)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                กำหนดสัดส่วนเป้าหมายรวม 100% และระบุผลตอบแทนเฉลี่ยต่อปีที่คาดหวังตามหลักวิชาการ
              </p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              Math.abs(totalTargetPercent - 100) < 0.01
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
            }`}>
              สัดส่วนเป้าหมายรวม: {totalTargetPercent}% {Math.abs(totalTargetPercent - 100) < 0.01 ? '✓ ครบ 100%' : '(ขาด/เกิน)'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* 1. Cash */}
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                1. เงินสด/สลาก
              </span>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">สัดส่วนเป้าหมาย (%)</label>
                <input
                  type="number"
                  step="1"
                  value={tCash}
                  onChange={(e) => setTCash(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">ผลตอบแทนคาดหวัง (%/ปี)</label>
                <input
                  type="number"
                  step="0.1"
                  value={eCash}
                  onChange={(e) => setECash(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-semibold text-emerald-600"
                />
              </div>
            </div>

            {/* 2. Thai Fund */}
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-bold text-teal-800 dark:text-teal-300 block">
                2. กองทุนไทย
              </span>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">สัดส่วนเป้าหมาย (%)</label>
                <input
                  type="number"
                  step="1"
                  value={tThaiFund}
                  onChange={(e) => setTThaiFund(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">ผลตอบแทนคาดหวัง (%/ปี)</label>
                <input
                  type="number"
                  step="0.1"
                  value={eThaiFund}
                  onChange={(e) => setEThaiFund(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-semibold text-emerald-600"
                />
              </div>
            </div>

            {/* 3. Foreign Fund */}
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-bold text-sky-800 dark:text-sky-300 block">
                3. กองทุน ตปท.
              </span>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">สัดส่วนเป้าหมาย (%)</label>
                <input
                  type="number"
                  step="1"
                  value={tForeignFund}
                  onChange={(e) => setTForeignFund(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">ผลตอบแทนคาดหวัง (%/ปี)</label>
                <input
                  type="number"
                  step="0.1"
                  value={eForeignFund}
                  onChange={(e) => setEForeignFund(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-semibold text-emerald-600"
                />
              </div>
            </div>

            {/* 4. Thai Stock */}
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                4. หุ้นไทย
              </span>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">สัดส่วนเป้าหมาย (%)</label>
                <input
                  type="number"
                  step="1"
                  value={tThaiStock}
                  onChange={(e) => setTThaiStock(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">ผลตอบแทนคาดหวัง (%/ปี)</label>
                <input
                  type="number"
                  step="0.1"
                  value={eThaiStock}
                  onChange={(e) => setEThaiStock(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-semibold text-emerald-600"
                />
              </div>
            </div>

            {/* 5. Foreign Stock */}
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-bold text-purple-800 dark:text-purple-300 block">
                5. หุ้น ตปท.
              </span>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">สัดส่วนเป้าหมาย (%)</label>
                <input
                  type="number"
                  step="1"
                  value={tForeignStock}
                  onChange={(e) => setTForeignStock(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">ผลตอบแทนคาดหวัง (%/ปี)</label>
                <input
                  type="number"
                  step="0.1"
                  value={eForeignStock}
                  onChange={(e) => setEForeignStock(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-semibold text-emerald-600"
                />
              </div>
            </div>

            {/* 6. FOREX */}
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block">
                6. FOREX/อื่นๆ
              </span>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">สัดส่วนเป้าหมาย (%)</label>
                <input
                  type="number"
                  step="1"
                  value={tForex}
                  onChange={(e) => setTForex(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">ผลตอบแทนคาดหวัง (%/ปี)</label>
                <input
                  type="number"
                  step="0.1"
                  value={eForex}
                  onChange={(e) => setEForex(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-semibold text-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* DCA Budget Setting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-800">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                งบเงินออมเติมใหม่รายเดือนสำหรับจัดพอร์ต (DCA Budget):
              </label>
              <input
                type="number"
                step="1000"
                value={simDcaBudget}
                onChange={(e) => setSimDcaBudget(parseFloat(e.target.value) || 0)}
                className="w-36 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-bold text-emerald-600"
              />
              <span className="text-xs text-slate-500">บาท / เดือน</span>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditingTargets(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
              >
                บันทึกค่าที่กำหนด
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tolerance Band Major Rebalance Alert (If any category exceeded +/- 5%) */}
      {hasToleranceAlert && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900 flex items-start gap-3">
          <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div className="text-xs">
            <span className="font-bold text-amber-900 dark:text-amber-300 text-sm">
              แจ้งเตือนเกณฑ์เบี่ยงเบนพอร์ต (Tolerance Band Alert &gt; ±5%)
            </span>
            <p className="text-amber-800/90 dark:text-amber-400 mt-0.5">
              มีหมวดสินทรัพย์ที่สัดส่วนจริงเบี่ยงเบนเกินเกณฑ์ ±5% จากเป้าหมาย แนะนำพิจารณาปรับพอร์ตใหญ่ (Major Rebalance) โดยการขายทำกำไรหมวดที่เกิน และโยกเข้าหมวดที่ขาดตามตารางสรุปด้านล่าง
            </p>
          </div>
        </div>
      )}

      {/* Smart DCA Rebalancing Box: Rebalance with Fresh Inflow */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Coins className="text-emerald-600" size={20} />
              คำแนะนำจัดสรรเงินออมเติมใหม่รายเดือน (DCA Inflow Rebalancing)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              หลักวิชาการ: จัดสรรเงินออมก้อนใหม่ ฿{formatCurrency(simDcaBudget)} เข้าหมวดที่ขาด (Underweight) ก่อน เพื่อดึงพอร์ตเข้าสู่สมดุลโดยไม่ต้องเสียค่าธรรมเนียมขายของเดิม
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400">งบลงทุนเดือนนี้:</span>
            <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              ฿{formatCurrency(simDcaBudget)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {allocations.map((a) => (
            <div
              key={a.category}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
            >
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }}></span>
                {a.shortName}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                เป้า: {a.targetPercent}% | จริง: {a.actualPercent.toFixed(1)}%
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 flex justify-between items-center">
                <span className="text-[10px] text-slate-500">เติมเดือนนี้:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                  ฿{formatCurrency(a.dcaRecommendedAmount || 0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6 Categories Visual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {allocations.map((alloc) => {
          const isOverweight = alloc.diffPercent > 1.5;
          const isUnderweight = alloc.diffPercent < -1.5;
          const isBalanced = !isOverweight && !isUnderweight;

          return (
            <div
              key={alloc.category}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-xs flex flex-col justify-between ${
                alloc.isToleranceExceeded
                  ? 'border-amber-300 dark:border-amber-800/80 ring-2 ring-amber-500/10'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: alloc.color }}></span>
                    {alloc.shortName}
                  </span>

                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                    alloc.isToleranceExceeded
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                      : isBalanced
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                      : isOverweight
                      ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300'
                      : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {alloc.isToleranceExceeded ? (
                      <>
                        <AlertTriangle size={11} /> หลุดกรอบ ±5%
                      </>
                    ) : isBalanced ? (
                      <>
                        <CheckCircle2 size={11} /> สมดุลแล้ว
                      </>
                    ) : isOverweight ? (
                      <>
                        <ArrowDownRight size={11} /> เกินเป้า (+{alloc.diffPercent.toFixed(1)}%)
                      </>
                    ) : (
                      <>
                        <ArrowUpRight size={11} /> ต่ำกว่าเป้า ({alloc.diffPercent.toFixed(1)}%)
                      </>
                    )}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(alloc.currentValue)} <span className="text-xs font-normal text-slate-400">฿</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    คาดหวัง: <b className="text-emerald-600">{alloc.expectedReturnPercent}%/ปี</b>
                  </span>
                </div>

                {/* Actual vs Target Bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>ปัจจุบัน: <b>{alloc.actualPercent.toFixed(1)}%</b></span>
                    <span>เป้าหมาย: <b>{alloc.targetPercent}%</b></span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, alloc.actualPercent)}%`,
                        backgroundColor: alloc.color,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Rebalance Recommendation Box */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">คำแนะนำปรับพอร์ต:</span>
                  <span className={`font-semibold ${
                    alloc.rebalanceAmount > 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : alloc.rebalanceAmount < 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-500'
                  }`}>
                    {alloc.rebalanceAmount > 0
                      ? `ซื้อเพิ่ม +${formatCurrency(alloc.rebalanceAmount)} ฿`
                      : alloc.rebalanceAmount < 0
                      ? `ขายทำกำไร ${formatCurrency(Math.abs(alloc.rebalanceAmount))} ฿`
                      : 'พอดีเป้าหมาย'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Rebalance Plan Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="text-emerald-600" size={20} />
            สรุปแผนปฏิบัติการปรับสมดุลพอร์ต (Portfolio Rebalancing Actions)
          </h2>
          <span className="text-xs text-slate-400">
            เกณฑ์แจ้งเตือน Tolerance Band: ±5%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
              <tr>
                <th className="py-3 px-4 rounded-l-lg">หมวดสินทรัพย์</th>
                <th className="py-3 px-4 text-right">มูลค่าปัจจุบัน</th>
                <th className="py-3 px-4 text-center">สัดส่วนจริง</th>
                <th className="py-3 px-4 text-center">เป้าหมาย</th>
                <th className="py-3 px-4 text-center">ผลตอบแทนคาดหวัง</th>
                <th className="py-3 px-4 text-center">ส่วนต่าง</th>
                <th className="py-3 px-4 text-right rounded-r-lg">การดำเนินการที่แนะนำ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allocations.map((a) => (
                <tr key={a.category} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color }}></span>
                    {a.shortName}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">
                    {formatCurrency(a.currentValue)} ฿
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                    {a.actualPercent.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500">
                    {a.targetPercent}%
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                    {a.expectedReturnPercent}%/ปี
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs font-semibold ${
                      a.isToleranceExceeded
                        ? 'text-rose-600 font-bold'
                        : a.diffPercent > 0
                        ? 'text-amber-600'
                        : a.diffPercent < 0
                        ? 'text-blue-600'
                        : 'text-slate-400'
                    }`}>
                      {a.diffPercent > 0 ? `+${a.diffPercent.toFixed(1)}%` : `${a.diffPercent.toFixed(1)}%`}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">
                    {a.rebalanceAmount > 0 ? (
                      <span className="text-blue-600 dark:text-blue-400">
                        ซื้อเพิ่ม +{formatCurrency(a.rebalanceAmount)} ฿
                      </span>
                    ) : a.rebalanceAmount < 0 ? (
                      <span className="text-amber-600 dark:text-amber-400">
                        ขาย/โยกออก {formatCurrency(Math.abs(a.rebalanceAmount))} ฿
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        สมดุลแล้ว
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
