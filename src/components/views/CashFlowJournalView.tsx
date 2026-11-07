'use client';

import React, { useState, useMemo } from 'react';
import { useWealth } from '@/context/WealthContext';
import {
  formatBuddhistDate,
  formatCurrency,
  parseAppleOrIsoDate,
} from '@/lib/wealthEngine';
import {
  BookOpen,
  Plus,
  Trash2,
  Filter,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { JournalEntry, JournalType } from '@/types/wealth';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function CashFlowJournalView() {
  const { database, addJournalEntry, deleteJournalEntry } = useWealth();

  // Month & Year Filter state (Default: All or current month of 2569)
  const [selectedMonth, setSelectedMonth] = useState<number | 'ALL'>('ALL');
  const [selectedYear, setSelectedYear] = useState<number>(2569);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | JournalType>('ALL');

  // Expanded row tracking for compact view
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New Journal Entry Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [entryType, setEntryType] = useState<JournalType>('รับเงิน (รายได้)');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [entryTitle, setEntryTitle] = useState('');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDebitAccount, setEntryDebitAccount] = useState('');
  const [entryCreditAccount, setEntryCreditAccount] = useState('');
  const [entryTaxTag, setEntryTaxTag] = useState('ไม่ลดหย่อน');
  const [entryNote, setEntryNote] = useState('');

  if (!database) return null;

  // Extract preset accounts from bankPresets or assets
  const availableAccounts = useMemo(() => {
    const fromPresets = database.bankPresets || [];
    const fromAssets = database.assets.map((a) => a.name);
    return Array.from(new Set([...fromPresets, ...fromAssets]));
  }, [database]);

  // Filter journal entries
  const filteredEntries = useMemo(() => {
    return database.journalEntries.filter((entry) => {
      const d = parseAppleOrIsoDate(entry.date);
      const entryMonth = d.getMonth() + 1; // 1-12
      const entryYear = d.getFullYear() + 543; // BE

      // Filter by Month
      if (selectedMonth !== 'ALL' && entryMonth !== selectedMonth) {
        return false;
      }
      // Filter by Year
      if (entryYear !== selectedYear) {
        return false;
      }
      // Filter by Type
      if (typeFilter !== 'ALL' && entryType !== typeFilter) {
        return false;
      }
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = entry.title.toLowerCase().includes(term);
        const matchesDebit = (entry.debitAccountName || '').toLowerCase().includes(term);
        const matchesCredit = (entry.creditAccountName || '').toLowerCase().includes(term);
        const matchesTag = (entry.taxDeductionTag || '').toLowerCase().includes(term);
        if (!matchesTitle && !matchesDebit && !matchesCredit && !matchesTag) {
          return false;
        }
      }

      return true;
    });
  }, [database.journalEntries, selectedMonth, selectedYear, typeFilter, searchTerm]);

  // Monthly summary calculations
  const totalIncome = filteredEntries
    .filter((e) => e.type === 'รับเงิน (รายได้)')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpense = filteredEntries
    .filter((e) => e.type === 'จ่ายเงิน (ค่าใช้จ่าย)')
    .reduce((sum, e) => sum + e.amount, 0);

  const netCashFlow = totalIncome - totalExpense;

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(entryAmount);
    if (!entryTitle || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('กรุณากรอกชื่อรายการและจำนวนเงินที่ถูกต้อง (ทศนิยม ๒ ตำแหน่ง)');
      return;
    }

    addJournalEntry({
      date: new Date(entryDate).toISOString(),
      type: entryType,
      title: entryTitle,
      amount: parseFloat(parsedAmount.toFixed(2)),
      debitAccountName: entryDebitAccount || 'บัญชีเงินสด/ธนาคาร',
      creditAccountName: entryCreditAccount || (entryType === 'รับเงิน (รายได้)' ? 'รายได้' : 'ค่าใช้จ่าย'),
      taxDeductionTag: entryTaxTag !== 'ไม่ลดหย่อน' ? entryTaxTag : undefined,
      note: entryNote,
    });

    setEntryTitle('');
    setEntryAmount('');
    setEntryNote('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="text-emerald-600" size={24} />
            สมุดรายวันและกระแสเงินสด (Cash Flow Journal)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            บันทึกรายการบัญชีคู่ (Double-Entry) พร้อมระบบเลือกดูรายเดือน / รายปี พ.ศ.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition shadow-xs"
        >
          <Plus size={18} /> บันทึกรายการใหม่
        </button>
      </div>

      {/* Filter Bar: Month & Year Selector + Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
              <Calendar size={16} className="text-emerald-600" />
              <span className="text-xs text-slate-500">ปี พ.ศ.</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value={2569}>2569</option>
                <option value={2568}>2568</option>
                <option value={2570}>2570</option>
              </select>
            </div>

            {/* Month Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
              <span className="text-xs text-slate-500">เดือน:</span>
              <select
                value={selectedMonth}
                onChange={(e) =>
                  setSelectedMonth(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))
                }
                className="bg-transparent font-medium text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="ALL">ทุกเดือน (ทั้งปี)</option>
                {THAI_MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
              <Filter size={14} className="text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">ทุกประเภทรายการ</option>
                <option value="รับเงิน (รายได้)">รายได้</option>
                <option value="จ่ายเงิน (ค่าใช้จ่าย)">ค่าใช้จ่าย</option>
                <option value="โอนเงิน">โอนระหว่างบัญชี</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อรายการ, บัญชี, กบข..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Cash Flow Summary for Selected Period */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                รายรับรวม (ช่วงที่เลือก)
              </span>
              <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                +{formatCurrency(totalIncome)} ฿
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700">
              <ArrowDownLeft size={18} />
            </div>
          </div>

          <div className="bg-rose-50/60 dark:bg-rose-950/20 rounded-xl p-3 border border-rose-100 dark:border-rose-900 flex items-center justify-between">
            <div>
              <span className="text-xs text-rose-800 dark:text-rose-300 font-medium">
                รายจ่ายรวม (ช่วงที่เลือก)
              </span>
              <div className="text-lg font-bold text-rose-700 dark:text-rose-400 mt-0.5">
                -{formatCurrency(totalExpense)} ฿
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900 flex items-center justify-center text-rose-700">
              <ArrowUpRight size={18} />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                กระแสเงินสดสุทธิ (Net Cash Flow)
              </span>
              <div className={`text-lg font-bold mt-0.5 ${
                netCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
              }`}>
                {netCashFlow >= 0 ? `+${formatCurrency(netCashFlow)}` : formatCurrency(netCashFlow)} ฿
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600">
              <RefreshCw size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Journal Table (Compact with Expandable Row Detail) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            รายการบันทึก ({filteredEntries.length} รายการ)
          </span>
          <span className="text-xs text-slate-400">
            *คลิกที่รายการเพื่อดูรายละเอียดบัญชีแยกประเภท
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredEntries.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              ไม่พบรายการบันทึกตามเงื่อนไขที่เลือก
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isExpanded = expandedId === entry.id;
              const isIncome = entry.type === 'รับเงิน (รายได้)';
              const isExpense = entry.type === 'จ่ายเงิน (ค่าใช้จ่าย)';

              return (
                <div key={entry.id} className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  {/* Summary Row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="p-4 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                        isIncome
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isExpense
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {isIncome ? '+' : isExpense ? '-' : '⇄'}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white text-sm">
                            {entry.title}
                          </span>
                          {entry.taxDeductionTag && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <Tag size={10} /> {entry.taxDeductionTag}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {formatBuddhistDate(entry.date)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`text-base font-bold ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isExpense
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {isIncome ? '+' : isExpense ? '-' : ''}
                          {formatCurrency(entry.amount)} ฿
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                          {entry.debitAccountName}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`ยืนยันการลบรายการ "${entry.title}"?`)) {
                            deleteJournalEntry(entry.id);
                          }
                        }}
                        className="text-slate-300 hover:text-rose-500 p-1.5 transition"
                        title="ลบรายการ"
                      >
                        <Trash2 size={16} />
                      </button>

                      {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <div className="px-6 pb-4 pt-1 bg-slate-50/60 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-semibold text-slate-500">บัญชีเดบิต (เข้า):</span>{' '}
                        {entry.debitAccountName || '-'}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">บัญชีเครดิต (ออก):</span>{' '}
                        {entry.creditAccountName || '-'}
                      </div>
                      {entry.revenueCategory && (
                        <div>
                          <span className="font-semibold text-slate-500">หมวดเงินได้ภาษี:</span>{' '}
                          {entry.revenueCategory}
                        </div>
                      )}
                      {entry.grossDividendAmount ? (
                        <div>
                          <span className="font-semibold text-slate-500">เงินปันผล Gross:</span>{' '}
                          {formatCurrency(entry.grossDividendAmount)} ฿ (เครดิตภาษี: +{formatCurrency(entry.dividendTaxCreditAmount || 0)} ฿)
                        </div>
                      ) : null}
                      {entry.note && (
                        <div className="col-span-2">
                          <span className="font-semibold text-slate-500">บันทึกช่วยจำ:</span>{' '}
                          {entry.note}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Add Journal Entry */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="text-emerald-600" size={20} />
              บันทึกรายการบัญชีรายวันใหม่
            </h3>

            <form onSubmit={handleCreateEntry} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {(['รับเงิน (รายได้)', 'จ่ายเงิน (ค่าใช้จ่าย)', 'โอนเงิน'] as JournalType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEntryType(t)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                      entryType === t
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t.replace(/\s*\(.*\)/, '')}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    วันที่ทำรายการ *
                  </label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    จำนวนเงิน (บาท) * บังคับทศนิยม ๒ ตำแหน่ง
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={entryAmount}
                    onChange={(e) => setEntryAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อรายการบันทึก *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เงินเดือน, ค่าใช้จ่ายประจำวัน, กบข เพิ่ม, ค่าผ่อนบ้าน"
                  value={entryTitle}
                  onChange={(e) => setEntryTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    บัญชีเดบิต (รับเข้า)
                  </label>
                  <input
                    type="text"
                    list="account-list"
                    placeholder="เช่น บัญชีกรุงไทย"
                    value={entryDebitAccount}
                    onChange={(e) => setEntryDebitAccount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    บัญชีเครดิต (จ่ายออก)
                  </label>
                  <input
                    type="text"
                    list="account-list"
                    placeholder="เช่น บัญชีเงินเดือน"
                    value={entryCreditAccount}
                    onChange={(e) => setEntryCreditAccount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <datalist id="account-list">
                {availableAccounts.map((acc) => (
                  <option key={acc} value={acc} />
                ))}
              </datalist>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  การลดหย่อนภาษี (Auto-Sync ลดหย่อนภาษี)
                </label>
                <select
                  value={entryTaxTag}
                  onChange={(e) => setEntryTaxTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="ไม่ลดหย่อน">ไม่ลดหย่อนภาษี</option>
                  <option value="กบข.">กบข. (ตามกฎหมาย 3% หรือ สะสมเพิ่ม)</option>
                  <option value="RMF">กองทุนรวมเพื่อการเลี้ยงชีพ (RMF)</option>
                  <option value="ThaiESG">กองทุนรวมไทยเพื่อความยั่งยืน (ThaiESG)</option>
                  <option value="ประกันชีวิต">เบี้ยประกันชีวิต / สุขภาพ</option>
                  <option value="ดอกเบี้ยบ้าน">ดอกเบี้ยเงินกู้ยืมเพื่อที่อยู่อาศัย</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  บันทึกช่วยจำ (Note)
                </label>
                <input
                  type="text"
                  placeholder="หมายเหตุเพิ่มเติม..."
                  value={entryNote}
                  onChange={(e) => setEntryNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition"
                >
                  บันทึกรายการ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
