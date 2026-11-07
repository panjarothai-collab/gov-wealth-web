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
} from 'lucide-react';

export default function TaxAndGPFView() {
  const { database } = useWealth();
  const [includeDividends, setIncludeDividends] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'gpf' | 'brackets'>('summary');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="text-emerald-600" size={24} />
            การวางแผนภาษี & สิทธิ กบข. / RMF / ThaiESG
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            คำนวณภาษีเงินได้บุคคลธรรมดา ภ.ง.ด. ๙๐/๙๑ ประจำปี พ.ศ. ๒๕๖๙ แบบอัตราก้าวหน้า
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
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
                  ปันผล & เครดิตภาษี (มาตรา ๔๗ ทวิ)
                </h3>
              </div>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-300">
                ๑ รายการบันทึก
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-5">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">๑. เงินปันผลรวม (Gross)</span>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {formatCurrency(taxResult.dividendGross > 0 ? taxResult.dividendGross : 2800)} ฿
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">๒. หัก ณ ที่จ่าย ๑๐%</span>
                <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
                  280.00 ฿
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">๓. รับสุทธิเข้าบัญชี</span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  2,520.00 ฿
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">๔. เครดิตภาษี ม.๔๗ ทวิ</span>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {formatCurrency(taxResult.dividendTaxCredit > 0 ? taxResult.dividendTaxCredit : 700)} ฿
                </div>
              </div>
            </div>

            {/* Toggle switch for dividend inclusion */}
            <div className="flex items-center justify-between p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  นำเงินปันผลมารวมคำนวณภาษีปลายปี (ภ.ง.ด. ๙๐)
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  สูตร Gross-up ตาม ม.๔๗ ทวิ รวมสิทธิขอคืนภาษีทั้งสิ้น:{' '}
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(280 + (taxResult.dividendTaxCredit > 0 ? taxResult.dividendTaxCredit : 700))} ฿
                  </span>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-500">เงินได้พึงประเมินรวม:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(taxResult.totalGrossIncome)} ฿</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-500">หักค่าใช้จ่าย + ลดหย่อนรวม:</span>
                <span className="font-bold text-emerald-600">-{formatCurrency(taxResult.totalDeductions)} ฿</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-500">เงินได้สุทธิคำนวณภาษี:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(taxResult.netTaxableIncome)} ฿</span>
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
                สะสมตามกฎหมาย ๓% + ออมเพิ่ม ๑๐% (รวม {gpfItems.length} รายการ ม.ค. – ก.ย. ๒๕๖๙)
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/20 text-right">
              <span className="text-xs text-emerald-200">เพดานสิทธิ์ กบข. ตามกฎหมาย</span>
              <div className="text-xl font-bold">500,000.00 ฿</div>
              <span className="text-[11px] text-emerald-300">
                เหลือสิทธิ์เพิ่มเติม: {formatCurrency(500000 - taxResult.gpfDeduction)} ฿
              </span>
            </div>
          </div>

          {/* GPF Breakdown Table (The 18 items) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">
              ประวัติรายการหักลดหย่อน กบข. รายเดือน ({gpfItems.length} รายการ)
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
                อัตราภาษีเงินได้บุคคลธรรมดาแบบขั้นบันได
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
