'use client';

import React, { useState } from 'react';
import { useWealth } from '@/context/WealthContext';
import {
  calculateTaxAssessment,
  formatCurrency,
  formatBuddhistDate,
} from '@/lib/wealthEngine';
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
} from 'lucide-react';

export default function TaxAndGPFView() {
  const { database } = useWealth();
  const [includeDividends, setIncludeDividends] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'gpf' | 'simulator' | 'brackets'>('summary');

  // Interactive Tax Simulation state
  const [simThaiEsg, setSimThaiEsg] = useState<number>(0);
  const [simRmfGpfExtra, setSimRmfGpfExtra] = useState<number>(0);

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
            คำนวณภาษีเงินได้บุคคลธรรมดา ภ.ง.ด. ๙๐/๙๑ ประจำปี พ.ศ. ๒๕๖๙ พร้อมระบบเปรียบเทียบสิทธิเงินปันผล Side-by-Side
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
                  เงินปันผลหุ้นไทย & เครดิตภาษี (มาตรา ๔๗ ทวิ)
                </h3>
              </div>
              <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">
                {dividendEntries.length} รายการบันทึก
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-5">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">๑. เงินปันผลรวม (Gross)</span>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {formatCurrency(taxResult.dividendGross)} ฿
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">๒. หัก ณ ที่จ่าย ๑๐%</span>
                <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
                  {formatCurrency(taxResult.dividendWithheld)} ฿
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">๓. รับสุทธิเข้าบัญชี (Net)</span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(taxResult.dividendNetReceived)} ฿
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">๔. เครดิตภาษี ม.๔๗ ทวิ</span>
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
                      ทางเลือกที่ ๑: นำเงินปันผลมารวมยื่นแบบ (ภ.ง.ด. ๙๐)
                    </div>
                    <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                      {taxResult.dividendComparison.withDividendsRefund < 0
                        ? `ได้รับคืนภาษี ฿${formatCurrency(Math.abs(taxResult.dividendComparison.withDividendsRefund))}`
                        : `ต้องชำระภาษี ฿${formatCurrency(taxResult.dividendComparison.withDividendsRefund)}`}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      ดึงเครดิตภาษี ม.๔๗ ทวิ คืน + ขอคืนภาษีหัก ณ ที่จ่าย ๑๐%
                    </p>
                  </div>

                  {/* Option B */}
                  <div className={`p-4 rounded-xl border ${
                    !taxResult.dividendComparison.recommendInclude
                      ? 'bg-white dark:bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  }`}>
                    <div className="text-xs font-semibold text-slate-500 mb-1">
                      ทางเลือกที่ ๒: ไม่นำมารวมยื่น (ใช้สิทธิ์ Final Tax ๑๐%)
                    </div>
                    <div className="text-lg font-extrabold text-slate-700 dark:text-slate-300">
                      {taxResult.dividendComparison.withoutDividendsRefund < 0
                        ? `ได้รับคืนภาษี ฿${formatCurrency(Math.abs(taxResult.dividendComparison.withoutDividendsRefund))}`
                        : `ต้องชำระภาษี ฿${formatCurrency(taxResult.dividendComparison.withoutDividendsRefund)}`}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      ปล่อยให้หัก ณ ที่จ่าย ๑๐% เป็นภาษีงวดสุดท้าย ไม่กระทบฐานภาษี
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
                  เปิดใช้นำเงินปันผลมารวมคำนวณภาษีในการประเมินนี้ (ภ.ง.ด. ๙๐)
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  สูตร Gross-up ตาม ม.๔๗ ทวิ เครดิตภาษี: +฿{formatCurrency(taxResult.dividendTaxCredit)}
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
              สรุปภาษีสุทธิประจำปี พ.ศ. ๒๕๖๙
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">๑. ภาษีคำนวณทั้งปี</span>
                <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                  {formatCurrency(taxResult.computedTax)} ฿
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">๒. หัก ณ ที่จ่ายแล้ว</span>
                <div className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-1">
                  -{formatCurrency(taxResult.taxPaidWithheld)} ฿
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">๓. เครดิตภาษีปันผล</span>
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
                  ๔. {taxResult.netTaxPayableOrRefund > 0 ? 'ภาษีที่ต้องจ่ายเพิ่ม' : 'ภาษีที่ได้รับคืน'}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-500">เงินได้พึงประเมินรวม:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(taxResult.totalGrossIncome)} ฿</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-500">ลดหย่อน กบข. ({taxResult.gpfItemsCount} งวด):</span>
                <span className="font-bold text-emerald-600">-{formatCurrency(taxResult.gpfDeduction)} ฿</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-500">ลดหย่อน ThaiESG:</span>
                <span className="font-bold text-emerald-600">-{formatCurrency(taxResult.thaiEsgDeduction)} ฿</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-500">เงินได้สุทธิคำนวณภาษี:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(taxResult.netTaxableIncome)} ฿</span>
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
                สะสมตามกฎหมาย ๓% + ออมเพิ่ม (รวม {gpfItems.length} รายการบันทึก)
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/20 text-right">
              <span className="text-xs text-emerald-200">เพดานสิทธิ์ กบข. ตามกฎหมาย (๓๐% ไม่เกิน ๕ แสน)</span>
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
                    <th className="py-3 px-4 text-right rounded-r-lg">จำนวนเงิน (บาท)</th>
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
                อัตราภาษีเงินได้บุคคลธรรมดาแบบขั้นบันได (ภ.ง.ด. ๙๐/๙๑)
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
