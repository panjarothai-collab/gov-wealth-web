'use client';

import React, { useState } from 'react';
import { useWealth } from '@/context/WealthContext';
import {
  calculateTaxAssessment,
  formatCurrency,
  formatBuddhistDate,
} from '@/lib/wealthEngine';
import {
  GpfPlanType,
  GpfPlanWeights,
  GPF_PRESET_PLANS,
  DEFAULT_GPF_PLAN,
} from '@/types/wealth';
import {
  Receipt,
  ShieldCheck,
  TrendingUp,
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  Calculator,
  Sliders,
  Sparkles,
  ArrowRight,
  PieChart as PieIcon,
  Save,
  Check,
  Layers,
  Trash2,
} from 'lucide-react';

export default function TaxAndGPFView() {
  const { database, updateProfile, addAsset, updateAsset, setActiveTab, deleteTaxItem } = useWealth();
  const [includeDividends, setIncludeDividends] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'gpf' | 'simulator' | 'brackets'>('summary');

  // Interactive Tax Simulation state
  const [simThaiEsg, setSimThaiEsg] = useState<number>(0);
  const [simRmfGpfExtra, setSimRmfGpfExtra] = useState<number>(0);

  // GPF Plan Configuration state
  const gpfPlanFromProfile = database?.profile?.gpfPlan || DEFAULT_GPF_PLAN;
  const [planType, setPlanType] = useState<GpfPlanType>(gpfPlanFromProfile.planType || 'DIY');
  const [planName, setPlanName] = useState<string>(gpfPlanFromProfile.planName || 'แผนผสมเอง (Member DIY)');
  const [thaiStock, setThaiStock] = useState<number>(gpfPlanFromProfile.thaiStockPercent ?? 35);
  const [foreignStock, setForeignStock] = useState<number>(gpfPlanFromProfile.foreignStockPercent ?? 40);
  const [gold, setGold] = useState<number>(gpfPlanFromProfile.goldPercent ?? 25);
  const [thaiBond, setThaiBond] = useState<number>(gpfPlanFromProfile.thaiBondPercent ?? 0);
  const [foreignBond, setForeignBond] = useState<number>(gpfPlanFromProfile.foreignBondPercent ?? 0);
  const [cash, setCash] = useState<number>(gpfPlanFromProfile.cashPercent ?? 0);

  // Existing GPF asset in assets list
  const existingGpfAsset = database?.assets?.find(
    (a) => a.isGpf || a.name.toLowerCase().includes('กบข') || a.institution.toLowerCase().includes('กบข')
  );

  const [gpfBalance, setGpfBalance] = useState<number>(
    existingGpfAsset?.amountTHB || gpfPlanFromProfile.totalBalance || 0
  );
  const [isSavedToast, setIsSavedToast] = useState(false);

  if (!database) return null;

  const taxResult = calculateTaxAssessment(
    database.journalEntries,
    database.taxItems,
    database.profile,
    includeDividends
  );

  const gpfItems = database.taxItems.filter(
    (t) => t.deductionType === 'กบข.' || t.fundCode.toLowerCase().includes('gpf')
  );

  const dividendEntries = database.journalEntries.filter(
    (e) => e.grossDividendAmount && e.grossDividendAmount > 0
  );

  // Simulation calculations
  const marginalRate = (taxResult.marginalTaxRatePercent || 0) / 100;
  const simTotalDeduction = simThaiEsg + simRmfGpfExtra;
  const simTaxSavings = simTotalDeduction * marginalRate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="text-emerald-600" size={24} />
            การวางแผนภาษี & สิทธิ กบข. / ThaiESG / เครดิตปันผล
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            คำนวณภาษีเงินได้บุคคลธรรมดา ภ.ง.ด. 90/91 ประจำปี พ.ศ. 2569 พร้อมระบบเปรียบเทียบสิทธิเงินปันผล Side-by-Side
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('summary')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'summary'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            สรุปภาษี & ปันผล
          </button>
          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              activeSubTab === 'simulator'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles size={13} /> ตัวจำลองลดหย่อน
          </button>
          <button
            onClick={() => setActiveSubTab('gpf')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'gpf'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            สิทธิ กบข. ({gpfItems.length} รายการ)
          </button>
          <button
            onClick={() => setActiveSubTab('brackets')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'brackets'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            ตารางขั้นบันไดภาษี
          </button>
        </div>
      </div>

      {activeSubTab === 'summary' && (
        <div className="space-y-6">
          {/* Card 1: Dividend & Tax Credit Sec. 47 bis */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  เงินปันผลหุ้นไทย & เครดิตภาษี (มาตรา 47 ทวิ)
                </h3>
              </div>
              <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">
                {dividendEntries.length} รายการบันทึก
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-5">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">1. เงินปันผลรวม (Gross)</span>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {formatCurrency(taxResult.dividendGross)} ฿
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">2. หัก ณ ที่จ่าย 10%</span>
                <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
                  {formatCurrency(taxResult.dividendWithheld)} ฿
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">3. รับสุทธิเข้าบัญชี (Net)</span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(taxResult.dividendNetReceived)} ฿
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">4. เครดิตภาษี ม.47 ทวิ</span>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {formatCurrency(taxResult.dividendTaxCredit)} ฿
                </div>
              </div>
            </div>

            {/* Side-by-Side Dividend Advisor Card */}
            {taxResult.dividendComparison ? (
              <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 border border-emerald-200 dark:border-emerald-800/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-600 text-white">
                      <Calculator size={16} />
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      ผลการวิเคราะห์เปรียบเทียบ: ยื่นรวม vs ไม่รวมยื่น (Side-by-Side Advisor)
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    taxResult.dividendComparison.recommendInclude
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}>
                    {taxResult.dividendComparison.recommendInclude ? '✓ แนะนำยื่นรวม' : '✓ แนะนำแยกยื่น (Final Tax)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option A */}
                  <div className={`p-4 rounded-xl border ${
                    taxResult.dividendComparison.recommendInclude
                      ? 'bg-white dark:bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  }`}>
                    <div className="text-xs font-semibold text-slate-500 mb-1">
                      ทางเลือกที่ 1: นำเงินปันผลมารวมยื่นแบบ (ภ.ง.ด. 90)
                    </div>
                    <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                      {taxResult.dividendComparison.withDividendsRefund < 0
                        ? `ได้รับคืนภาษี ฿${formatCurrency(Math.abs(taxResult.dividendComparison.withDividendsRefund))}`
                        : `ต้องชำระภาษี ฿${formatCurrency(taxResult.dividendComparison.withDividendsRefund)}`}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      ดึงเครดิตภาษี ม.47 ทวิ คืน + ขอคืนภาษีหัก ณ ที่จ่าย 10%
                    </p>
                  </div>

                  {/* Option B */}
                  <div className={`p-4 rounded-xl border ${
                    !taxResult.dividendComparison.recommendInclude
                      ? 'bg-white dark:bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  }`}>
                    <div className="text-xs font-semibold text-slate-500 mb-1">
                      ทางเลือกที่ 2: ไม่นำมารวมยื่น (ใช้สิทธิ์ Final Tax 10%)
                    </div>
                    <div className="text-lg font-extrabold text-slate-700 dark:text-slate-300">
                      {taxResult.dividendComparison.withoutDividendsRefund < 0
                        ? `ได้รับคืนภาษี ฿${formatCurrency(Math.abs(taxResult.dividendComparison.withoutDividendsRefund))}`
                        : `ต้องชำระภาษี ฿${formatCurrency(taxResult.dividendComparison.withoutDividendsRefund)}`}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      ปล่อยให้หัก ณ ที่จ่าย 10% เป็นภาษีงวดสุดท้าย ไม่กระทบฐานภาษี
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">คำแนะนำวิชาการ: </span>
                    {taxResult.dividendComparison.recommendationText}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Toggle switch for dividend inclusion */}
            <div className="flex items-center justify-between p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900 mt-4">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  เปิดใช้นำเงินปันผลมารวมคำนวณภาษีในการประเมินนี้ (ภ.ง.ด. 90)
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  สูตร Gross-up ตาม ม.47 ทวิ เครดิตภาษี: +฿{formatCurrency(taxResult.dividendTaxCredit)}
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDividends}
                  onChange={(e) => setIncludeDividends(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Card 2: Net Tax Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">
              สรุปภาษีสุทธิประจำปี พ.ศ. 2569
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">1. ภาษีคำนวณทั้งปี</span>
                <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                  {formatCurrency(taxResult.computedTax)} ฿
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">2. หัก ณ ที่จ่ายแล้ว</span>
                <div className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-1">
                  -{formatCurrency(taxResult.taxPaidWithheld)} ฿
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">3. เครดิตภาษีปันผล</span>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  -{formatCurrency(includeDividends ? taxResult.dividendTaxCredit : 0)} ฿
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${
                taxResult.netTaxPayableOrRefund > 0
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900'
              }`}>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  4. {taxResult.netTaxPayableOrRefund > 0 ? 'ภาษีที่ต้องจ่ายเพิ่ม' : 'ภาษีที่ได้รับคืน'}
                </span>
                <div className={`text-xl font-extrabold mt-1 ${
                  taxResult.netTaxPayableOrRefund > 0
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}>
                  {formatCurrency(Math.abs(taxResult.netTaxPayableOrRefund))} ฿
                </div>
              </div>
            </div>

            {/* Income & Deduction Breakdown row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-500">เงินได้พึงประเมินรวม:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(taxResult.totalGrossIncome)} ฿</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-500">หักค่าใช้จ่ายตามกฎหมาย:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">-{formatCurrency(taxResult.totalExpenseDeduction)} ฿</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-500">หักค่าลดหย่อนรวม:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">-{formatCurrency(taxResult.totalDeductions)} ฿</span>
              </div>
              <div className="flex justify-between p-3 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <span className="text-emerald-800 dark:text-emerald-300 font-semibold">เงินได้สุทธิคำนวณภาษี:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(taxResult.netTaxableIncome)} ฿</span>
              </div>
            </div>
          </div>

          {/* Card 2.1: Detailed Income by Category & Deductions Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <FileText className="text-emerald-600" size={18} />
                  แจกแจงเงินได้พึงประเมินแยกตามหมวด (ม.40(1) - 40(8)) และการหักค่าใช้จ่ายตามกฎหมาย
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  คำนวณหักค่าใช้จ่ายตามอัตราที่ประมวลรัษฎากรกำหนด สำหรับการยื่นแบบ ภ.ง.ด. 90/91
                </p>
              </div>
            </div>

            {/* Income Categories Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-medium">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">หมวดเงินได้ตามกฎหมาย</th>
                    <th className="py-2.5 px-3">รายละเอียดเงินได้</th>
                    <th className="py-2.5 px-3 text-right">เงินได้พึงประเมิน (Gross)</th>
                    <th className="py-2.5 px-3">เกณฑ์หักค่าใช้จ่ายตามกฎหมาย</th>
                    <th className="py-2.5 px-3 text-right">ค่าใช้จ่ายที่หักได้</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">เงินได้หลังหักค่าใช้จ่าย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {taxResult.revenueCategoriesList.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-bold text-emerald-800 dark:text-emerald-400">
                        {cat.categoryCode}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {cat.categoryName}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(cat.grossAmount)} ฿
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {cat.expenseRateText}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                        -{formatCurrency(cat.expenseDeduction)} ฿
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(cat.netIncomeAfterExpense)} ฿
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 dark:border-slate-700 font-bold bg-slate-50/50 dark:bg-slate-800/30">
                    <td colSpan={2} className="py-3 px-3 text-slate-900 dark:text-white">
                      รวมเงินได้พึงประเมินทุกหมวด
                    </td>
                    <td className="py-3 px-3 text-right text-slate-900 dark:text-white">
                      {formatCurrency(taxResult.totalGrossIncome)} ฿
                    </td>
                    <td className="py-3 px-3 text-slate-500">รวมหักค่าใช้จ่ายตามกฎหมาย</td>
                    <td className="py-3 px-3 text-right text-rose-600 dark:text-rose-400">
                      -{formatCurrency(taxResult.totalExpenseDeduction)} ฿
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-700 dark:text-emerald-400 text-sm">
                      {formatCurrency(taxResult.totalIncomeAfterExpense)} ฿
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Deductions Breakdown Table */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                <ShieldCheck className="text-emerald-600" size={17} />
                รายการหักลดหย่อนภาษีตามกฎหมาย (Tax Deductions & Allowances)
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-medium">
                    <tr>
                      <th className="py-2.5 px-3 rounded-l-lg">รายการหักลดหย่อน</th>
                      <th className="py-2.5 px-3">สิทธิประโยชน์ / คำอธิบาย</th>
                      <th className="py-2.5 px-3">เพดานสิทธิ์ตามกฎหมาย</th>
                      <th className="py-2.5 px-3 text-right rounded-r-lg">จำนวนเงินที่ลดหย่อน (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {taxResult.deductionsList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                          {item.name}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {item.note || '-'}
                        </td>
                        <td className="py-3 px-3 text-emerald-700 dark:text-emerald-400 font-medium">
                          {item.maxCapText || '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          -{formatCurrency(item.amount)} ฿
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 dark:border-slate-700 font-bold bg-slate-50/50 dark:bg-slate-800/30">
                      <td colSpan={3} className="py-3 px-3 text-slate-900 dark:text-white">
                        รวมรายการหักลดหย่อนทั้งสิ้น
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-700 dark:text-emerald-400 text-sm">
                        -{formatCurrency(taxResult.totalDeductions)} ฿
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Final Calculation Formula Callout */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  สูตรคำนวณเงินได้สุทธิเพื่อนำไปคำนวณภาษีตามขั้นบันได:
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  [เงินได้หลังหักค่าใช้จ่าย <strong>฿{formatCurrency(taxResult.totalIncomeAfterExpense)}</strong>] − [ค่าลดหย่อนรวม <strong>฿{formatCurrency(taxResult.totalDeductions)}</strong>] = <span className="text-emerald-800 dark:text-emerald-300 font-bold">เงินได้สุทธิคำนวณภาษี</span>
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] text-slate-500">เงินได้สุทธิคำนวณภาษี (Net Taxable Income)</span>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(taxResult.netTaxableIncome)} ฿
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: TAX SIMULATOR */}
      {activeSubTab === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="text-emerald-600" size={20} />
                  ตัวจำลองการวางแผนลดหย่อนภาษีเชิงรุก (Proactive Tax Deduction Optimizer)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  ทดสอบการซื้อ ThaiESG หรือเพิ่มเงินออม กบข. / RMF เพื่อดูยอดภาษีประหยัดได้ตามฐานภาษีจริงของคุณ
                </p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs">
                <span className="text-slate-500">ฐานภาษีขั้นสูงสุดปัจจุบัน: </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  {taxResult.marginalTaxRatePercent}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Slider 1: ThaiESG */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    🌿 ลงทุน ThaiESG เพิ่มเติม
                  </span>
                  <span className="text-emerald-600 font-bold text-sm">
                    ฿{formatCurrency(simThaiEsg)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300000"
                  step="5000"
                  value={simThaiEsg}
                  onChange={(e) => setSimThaiEsg(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>0 ฿</span>
                  <span>เพดานกฎหมาย 300,000 ฿ (ไม่เกิน 30% ของเงินได้)</span>
                </div>
              </div>

              {/* Slider 2: GPF / RMF */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    🛡️ ออมเพิ่ม กบข. / RMF เพิ่มเติม
                  </span>
                  <span className="text-emerald-600 font-bold text-sm">
                    ฿{formatCurrency(simRmfGpfExtra)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, 500000 - taxResult.gpfDeduction)}
                  step="5000"
                  value={simRmfGpfExtra}
                  onChange={(e) => setSimRmfGpfExtra(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>0 ฿</span>
                  <span>สิทธิ์คงเหลือ: ฿{formatCurrency(Math.max(0, 500000 - taxResult.gpfDeduction))}</span>
                </div>
              </div>
            </div>

            {/* Simulation Result Card */}
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div>
                <div className="text-xs text-emerald-100 flex items-center gap-1">
                  <Sparkles size={14} /> ผลลัพธ์จากการวางแผนลดหย่อนภาษี
                </div>
                <div className="text-2xl font-black mt-1">
                  ประหยัดภาษีทันที ฿{formatCurrency(simTaxSavings)}
                </div>
                <p className="text-xs text-emerald-100/90 mt-0.5">
                  จากยอดลดหย่อนเพิ่มเติมรวม ฿{formatCurrency(simTotalDeduction)} (ที่ฐานภาษี {taxResult.marginalTaxRatePercent}%)
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/20 text-right">
                <span className="text-[11px] text-emerald-200">ภาษีสุทธิหลังวางแผนลดหย่อน</span>
                <div className="text-xl font-bold">
                  ฿{formatCurrency(Math.max(0, taxResult.computedTax - simTaxSavings))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'gpf' && (
        <div className="space-y-6">
          {/* GPF Plan Configuration & Look-Through Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Sliders size={16} /> การตั้งค่าแผนการลงทุน กบข. สมาชิก (GPF Investment Plan)
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  แผนการลงทุน & การกระจายสัดส่วนพอร์ตอัตโนมัติ (Look-Through)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  ระบบจะนำยอดเงินสะสม กบข. ของคุณมากระจายเข้าสู่ 6 หมวดสินทรัพย์หลักตามสัดส่วนของแผนที่เลือก เพื่อสะท้อนความเสี่ยงและผลตอบแทนพอร์ตรวมอย่างถูกต้อง
                </p>
              </div>

              {isSavedToast ? (
                <div className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
                  <CheckCircle2 size={16} /> บันทึกแผนและซิงค์ยอด กบข. เรียบร้อยแล้ว!
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const totalPercent = thaiStock + foreignStock + gold + thaiBond + foreignBond + cash;
                    if (Math.abs(totalPercent - 100) > 0.01) {
                      alert(`สัดส่วนแผน กบข. รวมต้องเท่ากับ 100% (ปัจจุบัน: ${totalPercent}%)`);
                      return;
                    }

                    const updatedPlan: GpfPlanWeights = {
                      planType,
                      planName,
                      thaiStockPercent: thaiStock,
                      foreignStockPercent: foreignStock,
                      goldPercent: gold,
                      thaiBondPercent: thaiBond,
                      foreignBondPercent: foreignBond,
                      cashPercent: cash,
                      totalBalance: gpfBalance,
                      lastUpdated: new Date().toISOString(),
                    };

                    updateProfile({ gpfPlan: updatedPlan });

                    if (gpfBalance > 0) {
                      if (existingGpfAsset) {
                        updateAsset(existingGpfAsset.id, {
                          name: 'กองทุนบำเหน็จบำนาญข้าราชการ (กบข.)',
                          amountTHB: gpfBalance,
                          notes: `แผน กบข. Look-Through: หุ้นไทย ${thaiStock}%, หุ้น ตปท. ${foreignStock}%, ทองคำ ${gold}%`,
                          isGpf: true,
                        });
                      } else {
                        addAsset({
                          name: 'กองทุนบำเหน็จบำนาญข้าราชการ (กบข.)',
                          category: '2. กองทุนรวมไทย',
                          institution: 'กองทุนบำเหน็จบำนาญข้าราชการ (กบข.)',
                          amountTHB: gpfBalance,
                          amountUSD: 0,
                          isUSD: false,
                          notes: `แผน กบข. Look-Through: หุ้นไทย ${thaiStock}%, หุ้น ตปท. ${foreignStock}%, ทองคำ ${gold}%`,
                          isGpf: true,
                        });
                      }
                    }

                    setIsSavedToast(true);
                    setTimeout(() => setIsSavedToast(false), 3500);
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition"
                >
                  <Save size={16} /> บันทึกแผน & ซิงค์พอร์ตสินทรัพย์
                </button>
              )}
            </div>

            {/* Plan Preset Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                เลือกรูปแบบแผนการลงทุน กบข.:
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(GPF_PRESET_PLANS) as GpfPlanType[]).map((key) => {
                  const preset = GPF_PRESET_PLANS[key];
                  const isSelected = planType === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        const p = GPF_PRESET_PLANS[key];
                        if (!p) return;
                        setPlanType(key);
                        setPlanName(p.planName);
                        setThaiStock(p.thaiStockPercent);
                        setForeignStock(p.foreignStockPercent);
                        setGold(p.goldPercent);
                        setThaiBond(p.thaiBondPercent);
                        setForeignBond(p.foreignBondPercent);
                        setCash(p.cashPercent);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {preset.planName.split('(')[0].trim()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Asset Allocation Sliders / Number Inputs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  สัดส่วนสินทรัพย์ในแผน กบข. (รวมต้องเท่ากับ 100%):
                </span>
                {(() => {
                  const tot = thaiStock + foreignStock + gold + thaiBond + foreignBond + cash;
                  const is100 = Math.abs(tot - 100) < 0.01;
                  return (
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                        is100
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {is100 ? '✓ รวมครบ 100%' : `⚠ รวม ${tot}% (ขาด/เกิน ${100 - tot}%)`}
                    </span>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. หุ้นไทย */}
                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/50">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block mb-1">
                    หุ้นไทย
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={thaiStock}
                      onChange={(e) => {
                        setThaiStock(parseFloat(e.target.value) || 0);
                        setPlanType('DIY');
                        setPlanName('แผนผสมเอง (Member DIY)');
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-amber-700/80 dark:text-amber-400 mt-1 block">
                    กระจายเข้าหมวด 4
                  </span>
                </div>

                {/* 2. หุ้นต่างประเทศ */}
                <div className="p-3 bg-purple-50/60 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-800/50">
                  <span className="text-xs font-bold text-purple-800 dark:text-purple-300 block mb-1">
                    หุ้นต่างประเทศ
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={foreignStock}
                      onChange={(e) => {
                        setForeignStock(parseFloat(e.target.value) || 0);
                        setPlanType('DIY');
                        setPlanName('แผนผสมเอง (Member DIY)');
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-purple-700/80 dark:text-purple-400 mt-1 block">
                    กระจายเข้าหมวด 5
                  </span>
                </div>

                {/* 3. ทองคำ */}
                <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-800/50">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block mb-1">
                    ทองคำ / ทางเลือก
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={gold}
                      onChange={(e) => {
                        setGold(parseFloat(e.target.value) || 0);
                        setPlanType('DIY');
                        setPlanName('แผนผสมเอง (Member DIY)');
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-rose-700/80 dark:text-rose-400 mt-1 block">
                    กระจายเข้าหมวด 6
                  </span>
                </div>

                {/* 4. ตราสารหนี้ไทย */}
                <div className="p-3 bg-teal-50/60 dark:bg-teal-950/20 rounded-xl border border-teal-200 dark:border-teal-800/50">
                  <span className="text-xs font-bold text-teal-800 dark:text-teal-300 block mb-1">
                    ตราสารหนี้ไทย
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={thaiBond}
                      onChange={(e) => {
                        setThaiBond(parseFloat(e.target.value) || 0);
                        setPlanType('DIY');
                        setPlanName('แผนผสมเอง (Member DIY)');
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-teal-700/80 dark:text-teal-400 mt-1 block">
                    กระจายเข้าหมวด 2
                  </span>
                </div>

                {/* 5. ตราสารหนี้ ตปท. */}
                <div className="p-3 bg-sky-50/60 dark:bg-sky-950/20 rounded-xl border border-sky-200 dark:border-sky-800/50">
                  <span className="text-xs font-bold text-sky-800 dark:text-sky-300 block mb-1">
                    ตราสารหนี้ ตปท.
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={foreignBond}
                      onChange={(e) => {
                        setForeignBond(parseFloat(e.target.value) || 0);
                        setPlanType('DIY');
                        setPlanName('แผนผสมเอง (Member DIY)');
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-sky-700/80 dark:text-sky-400 mt-1 block">
                    กระจายเข้าหมวด 3
                  </span>
                </div>

                {/* 6. เงินฝาก / ตลาดเงิน */}
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                    เงินฝาก/ตลาดเงิน
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={cash}
                      onChange={(e) => {
                        setCash(parseFloat(e.target.value) || 0);
                        setPlanType('DIY');
                        setPlanName('แผนผสมเอง (Member DIY)');
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400 mt-1 block">
                    กระจายเข้าหมวด 1
                  </span>
                </div>
              </div>
            </div>

            {/* Total GPF Accumulated Balance & Look-Through Simulation Preview */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  ยอดเงินสะสม กบข. รวมปัจจุบัน (บาท):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="100"
                    value={gpfBalance || ''}
                    onChange={(e) => setGpfBalance(parseFloat(e.target.value) || 0)}
                    placeholder="เช่น 500000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">฿</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  อ้างอิงจากแอป My GPF หรือสลิปเงินเดือน (เมื่อบันทึกจะซิงค์เข้าสินทรัพย์ กบข. ทันที)
                </p>
              </div>

              {/* Look-Through Allocation Preview */}
              <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers size={14} className="text-emerald-600" /> ผลการกระจายเข้าพอร์ตแบบ Look-Through (จากยอด ฿{formatCurrency(gpfBalance)}):
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('portfolio')}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    ดูพอร์ตรวม 6 หมวด <ArrowRight size={12} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                    <div className="text-[11px] text-slate-500">หมวด 4. หุ้นไทย ({thaiStock}%)</div>
                    <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                      ฿{formatCurrency((gpfBalance * thaiStock) / 100)}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                    <div className="text-[11px] text-slate-500">หมวด 5. หุ้น ตปท. ({foreignStock}%)</div>
                    <div className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                      ฿{formatCurrency((gpfBalance * foreignStock) / 100)}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                    <div className="text-[11px] text-slate-500">หมวด 6. ทองคำ/อื่นๆ ({gold}%)</div>
                    <div className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                      ฿{formatCurrency((gpfBalance * gold) / 100)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GPF Allowance Hero Card */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold">
                <ShieldCheck size={16} /> สิทธิลดหย่อนกองทุนบำเหน็จบำนาญข้าราชการ (กบข.)
              </div>
              <h2 className="text-3xl font-extrabold mt-2">
                {formatCurrency(taxResult.gpfDeduction)} <span className="text-lg font-normal text-emerald-200">฿</span>
              </h2>
              <p className="text-xs text-emerald-200/80 mt-1">
                สะสมตามกฎหมาย 3% + ออมเพิ่ม (รวม {gpfItems.length} รายการบันทึก)
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/20 text-right">
              <span className="text-xs text-emerald-200">เพดานสิทธิ์ กบข. ตามกฎหมาย (30% ไม่เกิน 5 แสน)</span>
              <div className="text-xl font-bold">500,000.00 ฿</div>
              <span className="text-[11px] text-emerald-300">
                เหลือสิทธิ์เพิ่มเติม: {formatCurrency(500000 - taxResult.gpfDeduction)} ฿
              </span>
            </div>
          </div>

          {/* GPF Breakdown Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">
              ประวัติรายการหักลดหย่อน กบข. ({gpfItems.length} รายการ)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
                  <tr>
                    <th className="py-3 px-4 rounded-l-lg">วันที่หักเงินเดือน</th>
                    <th className="py-3 px-4">ชื่อรายการ / สัดส่วน</th>
                    <th className="py-3 px-4">ประเภทลดหย่อน</th>
                    <th className="py-3 px-4 text-right">จำนวนเงิน (บาท)</th>
                    <th className="py-3 px-4 text-center rounded-r-lg w-16">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {gpfItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {formatBuddhistDate(item.date)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {item.fundCode}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.deductionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(item.amount)} ฿
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `ต้องการลบรายการ กบข. ประจำวันที่ ${formatBuddhistDate(item.date)} ยอด ${formatCurrency(item.amount)} บาท หรือไม่?\n\n(ระบบจะปรับลดมูลค่าพอร์ต กบข. ในงบดุลให้สอดคล้องกันโดยอัตโนมัติ)`
                              )
                            ) {
                              deleteTaxItem(item.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="ลบรายการสิทธิลดหย่อนนี้"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 dark:border-slate-700 font-bold">
                    <td colSpan={3} className="py-3 px-4 text-slate-900 dark:text-white">
                      รวมสิทธิลดหย่อน กบข. ทั้งสิ้น ({gpfItems.length} รายการ)
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 text-base">
                      {formatCurrency(taxResult.gpfDeduction)} ฿
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'brackets' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                อัตราภาษีเงินได้บุคคลธรรมดาแบบขั้นบันได (ภ.ง.ด. 90/91)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ฐานเงินได้สุทธิคำนวณภาษี: <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(taxResult.netTaxableIncome)} ฿</span>
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
                <tr>
                  <th className="py-3 px-4 rounded-l-lg">ขั้นเงินได้สุทธิ (บาท)</th>
                  <th className="py-3 px-4 text-center">อัตราภาษี</th>
                  <th className="py-3 px-4 text-right">เงินได้ในขั้นนี้ (บาท)</th>
                  <th className="py-3 px-4 text-right rounded-r-lg">ภาษีที่คำนวณได้ (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {taxResult.taxBracketBreakdown.map((row) => (
                  <tr key={row.bracket} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">
                      {row.bracket}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-600 dark:text-slate-400">
                      {(row.rate * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">
                      {formatCurrency(row.amountInBracket)} ฿
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-rose-600 dark:text-rose-400">
                      {formatCurrency(row.tax)} ฿
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 dark:border-slate-700 font-bold">
                  <td colSpan={3} className="py-3 px-4 text-slate-900 dark:text-white">
                    รวมภาษีที่ต้องชำระตามอัตราก้าวหน้าทั้งปี
                  </td>
                  <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400 text-base">
                    {formatCurrency(taxResult.computedTax)} ฿
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
