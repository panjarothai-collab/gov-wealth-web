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
  AlertCircle,
  Percent,
  RefreshCw,
} from 'lucide-react';
import { AssetCategory } from '@/types/wealth';

export default function PortfolioView() {
  const { database, updateProfile } = useWealth();
  const [isEditingTargets, setIsEditingTargets] = useState(false);

  // Targets state
  const [tCash, setTCash] = useState(database?.profile.targetCashPercent || 10);
  const [tThaiFund, setTThaiFund] = useState(database?.profile.targetThaiFundPercent || 20);
  const [tForeignFund, setTForeignFund] = useState(database?.profile.targetForeignFundPercent || 20);
  const [tThaiStock, setTThaiStock] = useState(database?.profile.targetThaiStockPercent || 20);
  const [tForeignStock, setTForeignStock] = useState(database?.profile.targetForeignStockPercent || 20);
  const [tForex, setTForex] = useState(database?.profile.targetForexPercent || 10);

  if (!database) return null;

  const { allocations, totalInvested } = calculatePortfolioAllocation(
    database.assets,
    database.profile
  );

  const totalTargetPercent =
    tCash + tThaiFund + tForeignFund + tThaiStock + tForeignStock + tForex;

  const handleSaveTargets = (e: React.FormEvent) => {
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
    });
    setIsEditingTargets(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieIcon className="text-emerald-600" size={24} />
            พอร์ตการลงทุน ๖ หมวด & การปรับสมดุล (Rebalancing)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            มูลค่าพอร์ตลงทุนรวมทั้งหมด: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalInvested)} ฿</span>
          </p>
        </div>

        <button
          onClick={() => setIsEditingTargets(!isEditingTargets)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition"
        >
          <Sliders size={16} /> {isEditingTargets ? 'ปิดการตั้งค่า' : 'ปรับสัดส่วนเป้าหมาย'}
        </button>
      </div>

      {/* Edit Targets Drawer / Form */}
      {isEditingTargets && (
        <form onSubmit={handleSaveTargets} className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              กำหนดสัดส่วนเป้าหมายของพอร์ต (รวมต้องได้ 100%)
            </h3>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              Math.abs(totalTargetPercent - 100) < 0.01
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
            }`}>
              ยอดรวม: {totalTargetPercent}% {Math.abs(totalTargetPercent - 100) < 0.01 ? '✓' : '(ขาด/เกิน)'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                เงินสด/สลาก (%)
              </label>
              <input
                type="number"
                value={tCash}
                onChange={(e) => setTCash(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                กองทุนไทย (%)
              </label>
              <input
                type="number"
                value={tThaiFund}
                onChange={(e) => setTThaiFund(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                กองทุน ตปท. (%)
              </label>
              <input
                type="number"
                value={tForeignFund}
                onChange={(e) => setTForeignFund(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                หุ้นไทย (%)
              </label>
              <input
                type="number"
                value={tThaiStock}
                onChange={(e) => setTThaiStock(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                หุ้น ตปท. (%)
              </label>
              <input
                type="number"
                value={tForeignStock}
                onChange={(e) => setTForeignStock(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                FOREX/อื่นๆ (%)
              </label>
              <input
                type="number"
                value={tForex}
                onChange={(e) => setTForex(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditingTargets(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition"
            >
              บันทึกสัดส่วนเป้าหมาย
            </button>
          </div>
        </form>
      )}

      {/* 6 Categories Visual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {allocations.map((alloc) => {
          const isOverweight = alloc.diffPercent > 1.5;
          const isUnderweight = alloc.diffPercent < -1.5;
          const isBalanced = !isOverweight && !isUnderweight;

          return (
            <div
              key={alloc.category}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {alloc.shortName}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                    isBalanced
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isOverweight
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {isBalanced ? (
                      <>
                        <CheckCircle2 size={12} /> สัดส่วนสมดุล
                      </>
                    ) : isOverweight ? (
                      <>
                        <ArrowDownRight size={12} /> เกินเป้า (+{alloc.diffPercent.toFixed(1)}%)
                      </>
                    ) : (
                      <>
                        <ArrowUpRight size={12} /> ต่ำกว่าเป้า ({alloc.diffPercent.toFixed(1)}%)
                      </>
                    )}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(alloc.currentValue)} <span className="text-xs font-normal text-slate-400">฿</span>
                  </div>
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
                  <span className="text-slate-500">ข้อเสนอปรับพอร์ต:</span>
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

      {/* Summary Rebalance Plan */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <RefreshCw className="text-emerald-600" size={20} />
          สรุปคำแนะนำการปรับสมดุลพอร์ต (Portfolio Rebalancing Actions)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
              <tr>
                <th className="py-3 px-4 rounded-l-lg">หมวดสินทรัพย์</th>
                <th className="py-3 px-4 text-right">มูลค่าปัจจุบัน</th>
                <th className="py-3 px-4 text-center">สัดส่วนจริง</th>
                <th className="py-3 px-4 text-center">เป้าหมาย</th>
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
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs font-semibold ${
                      a.diffPercent > 0 ? 'text-amber-600' : a.diffPercent < 0 ? 'text-blue-600' : 'text-slate-400'
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
