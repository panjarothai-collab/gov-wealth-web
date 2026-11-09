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
  Calendar,
  CreditCard,
  TrendingUp,
  Receipt,
  Building2,
  Tag,
  ChevronDown,
  ChevronUp,
  Landmark,
  Calculator,
  CheckCircle2,
} from 'lucide-react';
import {
  JournalEntry,
  JournalType,
  SmartTransactionType,
  REVENUE_CATEGORIES,
  PayrollDetails,
} from '@/types/wealth';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

type ModalTab = 'STANDARD' | 'CREDIT_CARD' | 'INVESTMENT' | 'REVENUE' | 'PAYROLL';

export default function CashFlowJournalView() {
  const { database, addJournalEntry, addPayrollBatch, deleteJournalEntry } = useWealth();

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<number | 'ALL'>('ALL');
  const [selectedYear, setSelectedYear] = useState<number>(2569);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | JournalType>('ALL');

  // Expanded row tracking
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTab, setModalTab] = useState<ModalTab>('STANDARD');

  // Standard Form State
  const [entryType, setEntryType] = useState<JournalType>('รับเงิน (รายได้)');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [entryTitle, setEntryTitle] = useState('');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDebitAccount, setEntryDebitAccount] = useState('');
  const [entryCreditAccount, setEntryCreditAccount] = useState('');
  const [entryTaxTag, setEntryTaxTag] = useState('ไม่ลดหย่อน');
  const [entryNote, setEntryNote] = useState('');
  const [selectedSourceAssetId, setSelectedSourceAssetId] = useState('');

  // Credit Card Form State
  const [ccAction, setCcAction] = useState<'SPEND' | 'PAYMENT'>('SPEND');
  const [ccLiabilityId, setCcLiabilityId] = useState('');
  const [ccBankAssetId, setCcBankAssetId] = useState('');
  const [ccAmount, setCcAmount] = useState('');
  const [ccTitle, setCcTitle] = useState('');
  const [ccNote, setCcNote] = useState('');

  // Investment Form State
  const [invType, setInvType] = useState<'THAI_STOCK' | 'FOREIGN_STOCK' | 'FUND'>('THAI_STOCK');
  const [invSourceAssetId, setInvSourceAssetId] = useState('');
  const [invTargetAssetId, setInvTargetAssetId] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invTitle, setInvTitle] = useState('');
  const [invTaxTag, setInvTaxTag] = useState('ไม่ลดหย่อน');
  const [invNote, setInvNote] = useState('');

  // Revenue & Dividend Form State
  const [revCategory, setRevCategory] = useState<string>('40(1)');
  const [revTitle, setRevTitle] = useState('');
  const [revGrossAmount, setRevGrossAmount] = useState('');
  const [revNetAmount, setRevNetAmount] = useState('');
  const [revCorpTaxRate, setRevCorpTaxRate] = useState<number>(20);
  const [revWithholdingTax, setRevWithholdingTax] = useState('');
  const [revStockSymbol, setRevStockSymbol] = useState('');
  const [revDepositAssetId, setRevDepositAssetId] = useState('');
  const [revNote, setRevNote] = useState('');

  // Civil Servant Payroll Wizard Form State
  const [payrollGross, setPayrollGross] = useState<string>('50000.00');
  const [payrollTax, setPayrollTax] = useState<string>('750.00');
  const [payrollGpfMandatory, setPayrollGpfMandatory] = useState<string>('1500.00');
  const [payrollGpfVoluntary, setPayrollGpfVoluntary] = useState<string>('5000.00');
  const [payrollCoopShares, setPayrollCoopShares] = useState<string>('2000.00');
  const [payrollCoopLoan, setPayrollCoopLoan] = useState<string>('0.00');
  const [payrollOtherDeductions, setPayrollOtherDeductions] = useState<string>('0.00');
  const [payrollBankAssetId, setPayrollBankAssetId] = useState<string>('');

  if (!database) return null;

  // Extract preset accounts
  const availableAccounts = useMemo(() => {
    const fromPresets = database.bankPresets || [];
    const fromAssets = database.assets.map((a) => a.name);
    return Array.from(new Set([...fromPresets, ...fromAssets]));
  }, [database]);

  // Credit Card Liabilities
  const creditCardLiabilities = useMemo(() => {
    return database.liabilities.filter(
      (l) => l.name.toLowerCase().includes('บัตร') || l.lender.toLowerCase().includes('บัตร')
    );
  }, [database.liabilities]);

  // Bank Assets (Cash & Equivalents)
  const bankAssets = useMemo(() => {
    return database.assets.filter(
      (a) => a.category === '1. เงินสดและเทียบเท่า' || a.name.includes('บัญชี') || a.name.includes('เงินสด')
    );
  }, [database.assets]);

  // Investment Assets
  const investmentAssets = useMemo(() => {
    return database.assets.filter(
      (a) => a.category !== '1. เงินสดและเทียบเท่า'
    );
  }, [database.assets]);

  // Two-way calculation for Thai Stock Dividend (40(4)(b))
  const dividendCalc = useMemo(() => {
    if (revCategory !== '40(4)(b)') return null;
    const gross = parseFloat(revGrossAmount) || 0;
    const withholding = parseFloat((gross * 0.10).toFixed(2));
    const net = parseFloat((gross - withholding).toFixed(2));
    // Credit formula: Gross * (CorpRate / (100 - CorpRate))
    const creditFactor = revCorpTaxRate / (100 - revCorpTaxRate);
    const taxCredit = parseFloat((gross * creditFactor).toFixed(2));
    const totalBenefit = parseFloat((withholding + taxCredit).toFixed(2));

    return {
      gross,
      withholding,
      net,
      taxCredit,
      totalBenefit,
      corpRate: revCorpTaxRate,
    };
  }, [revCategory, revGrossAmount, revCorpTaxRate]);

  // Calculate net civil servant salary dynamically
  const payrollNetCalculated = useMemo(() => {
    const gross = parseFloat(payrollGross) || 0;
    const tax = parseFloat(payrollTax) || 0;
    const gpfM = parseFloat(payrollGpfMandatory) || 0;
    const gpfV = parseFloat(payrollGpfVoluntary) || 0;
    const coopS = parseFloat(payrollCoopShares) || 0;
    const coopL = parseFloat(payrollCoopLoan) || 0;
    const other = parseFloat(payrollOtherDeductions) || 0;
    const net = gross - (tax + gpfM + gpfV + coopS + coopL + other);
    return Math.max(0, parseFloat(net.toFixed(2)));
  }, [payrollGross, payrollTax, payrollGpfMandatory, payrollGpfVoluntary, payrollCoopShares, payrollCoopLoan, payrollOtherDeductions]);

  // Filter journal entries
  const filteredEntries = useMemo(() => {
    return database.journalEntries.filter((entry) => {
      const d = parseAppleOrIsoDate(entry.date);
      const entryMonth = d.getMonth() + 1; // 1-12
      const entryYear = d.getFullYear() + 543; // BE

      if (selectedMonth !== 'ALL' && entryMonth !== selectedMonth) {
        return false;
      }
      if (entryYear !== selectedYear) {
        return false;
      }
      if (typeFilter !== 'ALL' && entry.type !== typeFilter) {
        return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = entry.title.toLowerCase().includes(term);
        const matchesDebit = (entry.debitAccountName || '').toLowerCase().includes(term);
        const matchesCredit = (entry.creditAccountName || '').toLowerCase().includes(term);
        const matchesTag = (entry.taxDeductionTag || '').toLowerCase().includes(term);
        const matchesRev = (entry.revenueCategory || '').toLowerCase().includes(term);
        if (!matchesTitle && !matchesDebit && !matchesCredit && !matchesTag && !matchesRev) {
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

  // Handler 1: Standard Entry
  const handleCreateStandardEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(entryAmount);
    if (!entryTitle || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('กรุณากรอกชื่อรายการและจำนวนเงินที่ถูกต้อง (ทศนิยม ๒ ตำแหน่ง)');
      return;
    }

    addJournalEntry({
      date: new Date(entryDate).toISOString(),
      type: entryType,
      smartType: 'STANDARD',
      title: entryTitle,
      amount: parseFloat(parsedAmount.toFixed(2)),
      debitAccountName: entryDebitAccount || 'บัญชีเงินสด/ธนาคาร',
      creditAccountName: entryCreditAccount || (entryType === 'รับเงิน (รายได้)' ? 'รายได้' : 'ค่าใช้จ่าย'),
      taxDeductionTag: entryTaxTag !== 'ไม่ลดหย่อน' ? entryTaxTag : undefined,
      sourceAssetId: selectedSourceAssetId || undefined,
      note: entryNote,
    });

    setEntryTitle('');
    setEntryAmount('');
    setEntryNote('');
    setShowAddModal(false);
  };

  // Handler 2: Credit Card Entry
  const handleCreateCreditCardEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(ccAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('กรุณากรอกจำนวนเงินให้ถูกต้อง');
      return;
    }

    const card = database.liabilities.find((l) => l.id === ccLiabilityId);
    const cardName = card?.name || 'บัตรเครดิต';

    if (ccAction === 'SPEND') {
      addJournalEntry({
        date: new Date(entryDate).toISOString(),
        type: 'จ่ายเงิน (ค่าใช้จ่าย)',
        smartType: 'CREDIT_CARD_SPEND',
        title: ccTitle || `รูดใช้บัตรเครดิต ${cardName}`,
        amount: parseFloat(parsedAmount.toFixed(2)),
        debitAccountName: 'ค่าใช้จ่ายบัตรเครดิต',
        creditAccountName: cardName,
        targetLiabilityId: ccLiabilityId,
        note: ccNote || `บันทึกรูดบัตร (เพิ่มภาระหนี้ ${cardName})`,
      });
    } else {
      const bank = database.assets.find((a) => a.id === ccBankAssetId);
      const bankName = bank?.name || 'บัญชีเงินฝาก';

      addJournalEntry({
        date: new Date(entryDate).toISOString(),
        type: 'จ่ายเงิน (ค่าใช้จ่าย)',
        smartType: 'CREDIT_CARD_PAYMENT',
        title: ccTitle || `ชำระยอดบัตรเครดิต ${cardName}`,
        amount: parseFloat(parsedAmount.toFixed(2)),
        debitAccountName: cardName,
        creditAccountName: bankName,
        targetLiabilityId: ccLiabilityId,
        sourceAssetId: ccBankAssetId,
        note: ccNote || `ชำระหนี้บัตรเครดิต (ตัดเงินจาก ${bankName} และลดยอดหนี้ ${cardName})`,
      });
    }

    setCcAmount('');
    setCcTitle('');
    setCcNote('');
    setShowAddModal(false);
  };

  // Handler 3: Investment Entry
  const handleCreateInvestmentEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(invAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('กรุณากรอกจำนวนเงินลงทุน');
      return;
    }

    const source = database.assets.find((a) => a.id === invSourceAssetId);
    const target = database.assets.find((a) => a.id === invTargetAssetId);
    const typeLabel = invType === 'THAI_STOCK' ? 'หุ้นไทย' : invType === 'FOREIGN_STOCK' ? 'หุ้นต่างประเทศ' : 'กองทุนรวม';

    addJournalEntry({
      date: new Date(entryDate).toISOString(),
      type: 'โอนเงิน',
      smartType: 'INVESTMENT_BUY',
      title: invTitle || `ลงทุน${typeLabel} ${target?.name || ''}`,
      amount: parseFloat(parsedAmount.toFixed(2)),
      debitAccountName: target?.name || `พอร์ตลงทุน${typeLabel}`,
      creditAccountName: source?.name || 'บัญชีเงินฝาก',
      sourceAssetId: invSourceAssetId,
      targetAssetId: invTargetAssetId,
      taxDeductionTag: invTaxTag !== 'ไม่ลดหย่อน' ? invTaxTag : undefined,
      note: invNote || `ซื้อสินทรัพย์ลงทุน (ตัดเงินจาก ${source?.name || '-'} เข้าพอร์ต ${target?.name || '-'})`,
    });

    setInvAmount('');
    setInvTitle('');
    setInvNote('');
    setShowAddModal(false);
  };

  // Handler 4: Revenue & Dividend Entry
  const handleCreateRevenueEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = REVENUE_CATEGORIES.find((c) => c.id === revCategory);

    if (revCategory === '40(4)(b)') {
      if (!dividendCalc || dividendCalc.gross <= 0) {
        alert('กรุณากรอกยอดเงินปันผลรวม (Gross)');
        return;
      }
      const depositAsset = database.assets.find((a) => a.id === revDepositAssetId);
      const stockText = revStockSymbol ? ` (${revStockSymbol})` : '';

      addJournalEntry({
        date: new Date(entryDate).toISOString(),
        type: 'รับเงิน (รายได้)',
        smartType: 'STANDARD',
        title: revTitle || `เงินปันผลหุ้นไทย${stockText} (ม.๔๗ ทวิ)`,
        amount: dividendCalc.net, // Cash received in bank
        debitAccountName: depositAsset?.name || 'บัญชีรับเงินปันผล',
        creditAccountName: 'รายได้เงินปันผล ๔๐(๔)(ข)',
        revenueCategory: '๔๐(๔)(ข) ปันผลหุ้นไทย',
        stockSymbol: revStockSymbol || undefined,
        grossDividendAmount: dividendCalc.gross,
        dividendTaxCreditAmount: dividendCalc.taxCredit,
        corporateTaxRatePercent: dividendCalc.corpRate,
        withholdingTaxAmount: dividendCalc.withholding,
        sourceAssetId: revDepositAssetId || undefined,
        note: revNote || `Gross ฿${formatCurrency(dividendCalc.gross)}, หัก ๑๐% ฿${formatCurrency(dividendCalc.withholding)}, เครดิตภาษี ฿${formatCurrency(dividendCalc.taxCredit)}`,
      });
    } else {
      const parsedAmount = parseFloat(revGrossAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        alert('กรุณากรอกจำนวนเงินได้พึงประเมิน');
        return;
      }
      const depositAsset = database.assets.find((a) => a.id === revDepositAssetId);
      const withheld = parseFloat(revWithholdingTax) || 0;
      const netReceived = parsedAmount - withheld;

      addJournalEntry({
        date: new Date(entryDate).toISOString(),
        type: 'รับเงิน (รายได้)',
        smartType: 'STANDARD',
        title: revTitle || `${cat?.shortName || 'รายได้'}`,
        amount: netReceived > 0 ? netReceived : parsedAmount,
        debitAccountName: depositAsset?.name || 'บัญชีเงินสด/ธนาคาร',
        creditAccountName: cat?.name || 'รายได้',
        revenueCategory: cat?.shortName,
        withholdingTaxAmount: withheld > 0 ? withheld : undefined,
        sourceAssetId: revDepositAssetId || undefined,
        note: revNote,
      });
    }

    setRevTitle('');
    setRevGrossAmount('');
    setRevNetAmount('');
    setRevWithholdingTax('');
    setRevStockSymbol('');
    setRevNote('');
    setShowAddModal(false);
  };

  // Handler 5: Civil Servant Payroll Wizard Entry
  const handleCreatePayrollBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const gross = parseFloat(payrollGross) || 0;
    if (gross <= 0) {
      alert('กรุณาระบุยอดเงินเดือนเต็ม');
      return;
    }

    const details: PayrollDetails = {
      grossSalary: gross,
      withholdingTax: parseFloat(payrollTax) || 0,
      gpfMandatory: parseFloat(payrollGpfMandatory) || 0,
      gpfVoluntary: parseFloat(payrollGpfVoluntary) || 0,
      coopSavingShare: parseFloat(payrollCoopShares) || 0,
      coopLoanPayment: parseFloat(payrollCoopLoan) || 0,
      otherDeductions: parseFloat(payrollOtherDeductions) || 0,
      netSalary: payrollNetCalculated,
      depositAssetId: payrollBankAssetId || undefined,
    };

    addPayrollBatch(details, entryDate);
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
            บันทึกรายการบัญชีคู่ (Double-Entry) พร้อมระบบแยกหมวดภาษี ๔๐(๑)-๔๐(๘), เครดิตภาษีปันผล และ Smart Balance Sync
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

            {/* Type Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
              <span className="text-xs text-slate-500">ประเภท:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-transparent font-medium text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="ALL">ทุกประเภท</option>
                <option value="รับเงิน (รายได้)">รายรับ (+)</option>
                <option value="จ่ายเงิน (ค่าใช้จ่าย)">รายจ่าย (-)</option>
                <option value="โอนเงิน">โอนเงิน (⇄)</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="ค้นหารายการ, บัญชี, หมวดภาษี..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Summary Card for Current Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">กระแสเงินสดรับ (Income)</span>
            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              +{formatCurrency(totalIncome)} ฿
            </div>
          </div>

          <div className="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-100 dark:border-rose-900/40">
            <span className="text-rose-700 dark:text-rose-400 font-medium">กระแสเงินสดจ่าย (Expense)</span>
            <div className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-1">
              -{formatCurrency(totalExpense)} ฿
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${
            netCashFlow >= 0
              ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40'
          }`}>
            <span className="text-slate-600 dark:text-slate-400 font-medium">กระแสเงินสดสุทธิ (Net Cash Flow)</span>
            <div className={`text-lg font-bold mt-1 ${
              netCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)} ฿
            </div>
          </div>
        </div>
      </div>

      {/* Journal Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            รายการบันทึกสมุดรายวัน ({filteredEntries.length} รายการ)
          </span>
          <span className="text-xs text-slate-400">
            แตะที่รายการเพื่อดูรายละเอียดบัญชีคู่และหมวดภาษี
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredEntries.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">
              ไม่พบรายการบันทึกตามเงื่อนไขที่เลือก คลิก &quot;บันทึกรายการใหม่&quot; เพื่อเริ่มต้น
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
                        {entry.smartType === 'CREDIT_CARD_SPEND' || entry.smartType === 'CREDIT_CARD_PAYMENT' ? (
                          <CreditCard size={15} />
                        ) : entry.smartType === 'INVESTMENT_BUY' ? (
                          <TrendingUp size={15} />
                        ) : entry.smartType === 'PAYROLL' ? (
                          <Building2 size={15} />
                        ) : isIncome ? (
                          '+'
                        ) : isExpense ? (
                          '-'
                        ) : (
                          '⇄'
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-white text-sm">
                            {entry.title}
                          </span>
                          {entry.revenueCategory && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {entry.revenueCategory}
                            </span>
                          )}
                          {entry.smartType === 'CREDIT_CARD_SPEND' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              รูดบัตรเครดิต
                            </span>
                          )}
                          {entry.smartType === 'CREDIT_CARD_PAYMENT' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              ชำระหนี้บัตร
                            </span>
                          )}
                          {entry.smartType === 'INVESTMENT_BUY' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              ลงทุนหุ้น/กองทุน
                            </span>
                          )}
                          {entry.smartType === 'PAYROLL' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                              สลิปเงินเดือน
                            </span>
                          )}
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
                    <div className="px-6 pb-4 pt-2 bg-slate-50/60 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-semibold text-slate-500">เดบิต (เข้า):</span>{' '}
                        {entry.debitAccountName || '-'}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">เครดิต (ออก):</span>{' '}
                        {entry.creditAccountName || '-'}
                      </div>
                      {entry.revenueCategory && (
                        <div>
                          <span className="font-semibold text-slate-500">หมวดเงินได้ภาษี:</span>{' '}
                          {entry.revenueCategory}
                        </div>
                      )}
                      {entry.grossDividendAmount ? (
                        <div className="col-span-2 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
                          <span className="font-bold text-emerald-800 dark:text-emerald-300">
                            ข้อมูลเครดิตภาษีเงินปันผล (ม.๔๗ ทวิ):
                          </span>
                          <div className="grid grid-cols-3 gap-2 mt-1 text-slate-700 dark:text-slate-300">
                            <div>ยอด Gross: ฿{formatCurrency(entry.grossDividendAmount)}</div>
                            <div>หัก ณ ที่จ่าย ๑๐%: ฿{formatCurrency(entry.withholdingTaxAmount || 0)}</div>
                            <div className="font-bold text-emerald-600">
                              เครดิตภาษี ({entry.corporateTaxRatePercent || 20}%): +฿{formatCurrency(entry.dividendTaxCreditAmount || 0)}
                            </div>
                          </div>
                        </div>
                      ) : null}
                      {entry.withholdingTaxAmount && !entry.grossDividendAmount && (
                        <div>
                          <span className="font-semibold text-slate-500">ภาษีหัก ณ ที่จ่าย:</span>{' '}
                          ฿{formatCurrency(entry.withholdingTaxAmount)}
                        </div>
                      )}
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

      {/* Modal Add Journal Entry with Smart Tabs */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="text-emerald-600" size={20} />
                บันทึกรายการบัญชี & กระแสเงินสด
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕ ปิด
              </button>
            </div>

            {/* Smart Mode Switcher Tabs */}
            <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl text-xs font-semibold mb-4">
              <button
                type="button"
                onClick={() => setModalTab('STANDARD')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition text-center ${
                  modalTab === 'STANDARD'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ทั่วไป
              </button>
              <button
                type="button"
                onClick={() => setModalTab('CREDIT_CARD')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition text-center flex items-center justify-center gap-1 ${
                  modalTab === 'CREDIT_CARD'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <CreditCard size={13} /> บัตรเครดิต
              </button>
              <button
                type="button"
                onClick={() => setModalTab('INVESTMENT')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition text-center flex items-center justify-center gap-1 ${
                  modalTab === 'INVESTMENT'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <TrendingUp size={13} /> ลงทุนหุ้น/กองทุน
              </button>
              <button
                type="button"
                onClick={() => setModalTab('REVENUE')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition text-center flex items-center justify-center gap-1 ${
                  modalTab === 'REVENUE'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Receipt size={13} /> รายได้ & ปันผล
              </button>
              <button
                type="button"
                onClick={() => setModalTab('PAYROLL')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition text-center flex items-center justify-center gap-1 ${
                  modalTab === 'PAYROLL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 size={13} /> สลิปเงินเดือน
              </button>
            </div>

            {/* Date Picker (Common) */}
            <div className="mb-4">
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

            {/* TAB 1: STANDARD */}
            {modalTab === 'STANDARD' && (
              <form onSubmit={handleCreateStandardEntry} className="space-y-4">
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

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อรายการบันทึก *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ค่าใช้จ่ายประจำวัน, กบข เพิ่ม, ดอกเบี้ยเงินฝาก"
                    value={entryTitle}
                    onChange={(e) => setEntryTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      จำนวนเงิน (บาท) *
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

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      หัก/เพิ่มในบัญชีเงินฝาก (Smart Sync)
                    </label>
                    <select
                      value={selectedSourceAssetId}
                      onChange={(e) => setSelectedSourceAssetId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="">ไม่ระบุบัญชีเชื่อมโยง</option>
                      {bankAssets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (฿{formatCurrency(a.amountTHB)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      บัญชีเดบิต (เข้า)
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
                      บัญชีเครดิต (ออก)
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
                    การลดหย่อนภาษี
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
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                  >
                    บันทึกรายการ
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: CREDIT CARD */}
            {modalTab === 'CREDIT_CARD' && (
              <form onSubmit={handleCreateCreditCardEntry} className="space-y-4">
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setCcAction('SPEND')}
                    className={`py-2 text-xs font-semibold rounded-lg transition ${
                      ccAction === 'SPEND'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    💳 รูดใช้บัตร (เพิ่มหนี้บัตร)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCcAction('PAYMENT')}
                    className={`py-2 text-xs font-semibold rounded-lg transition ${
                      ccAction === 'PAYMENT'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    💵 ชำระค่าบัตร (ตัดเงินบัญชี & ลดยอดหนี้)
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    เลือกบัตรเครดิต *
                  </label>
                  <select
                    required
                    value={ccLiabilityId}
                    onChange={(e) => setCcLiabilityId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="">-- กรุณาเลือกบัตรเครดิต --</option>
                    {creditCardLiabilities.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} (ยอดหนี้ปัจจุบัน: ฿{formatCurrency(l.totalOutstanding)})
                      </option>
                    ))}
                  </select>
                </div>

                {ccAction === 'PAYMENT' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      ตัดเงินจากบัญชีธนาคาร (Source Bank Account) *
                    </label>
                    <select
                      required
                      value={ccBankAssetId}
                      onChange={(e) => setCcBankAssetId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="">-- เลือกบัญชีธนาคารที่ใช้ตัดชำระ --</option>
                      {bankAssets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (ยอดเงินคงเหลือ: ฿{formatCurrency(a.amountTHB)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      จำนวนเงิน (บาท) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={ccAmount}
                      onChange={(e) => setCcAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-rose-600 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      ชื่อรายการ (ถ้ามี)
                    </label>
                    <input
                      type="text"
                      placeholder={ccAction === 'SPEND' ? 'เช่น ทานอาหาร, ค่าน้ำมัน' : 'ชำระเต็มจำนวนรอบบิล'}
                      value={ccTitle}
                      onChange={(e) => setCcTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    บันทึกช่วยจำ (Note)
                  </label>
                  <input
                    type="text"
                    placeholder="หมายเหตุเพิ่มเติม..."
                    value={ccNote}
                    onChange={(e) => setCcNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                  >
                    บันทึกรายการบัตรเครดิต
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: INVESTMENT */}
            {modalTab === 'INVESTMENT' && (
              <form onSubmit={handleCreateInvestmentEntry} className="space-y-4">
                <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setInvType('THAI_STOCK')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                      invType === 'THAI_STOCK' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    หุ้นไทย
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvType('FOREIGN_STOCK')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                      invType === 'FOREIGN_STOCK' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    หุ้นต่างประเทศ
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvType('FUND')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                      invType === 'FUND' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    กองทุนรวม
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      ตัดเงินจากบัญชีธนาคาร (Source) *
                    </label>
                    <select
                      required
                      value={invSourceAssetId}
                      onChange={(e) => setInvSourceAssetId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="">-- เลือกบัญชีตัดเงิน --</option>
                      {bankAssets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (฿{formatCurrency(a.amountTHB)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      เพิ่มเข้าพอร์ตการลงทุน (Target) *
                    </label>
                    <select
                      required
                      value={invTargetAssetId}
                      onChange={(e) => setInvTargetAssetId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="">-- เลือกพอร์ตลงทุน --</option>
                      {investmentAssets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (฿{formatCurrency(a.amountTHB)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      จำนวนเงินลงทุน (บาท) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={invAmount}
                      onChange={(e) => setInvAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      สิทธิลดหย่อนภาษี
                    </label>
                    <select
                      value={invTaxTag}
                      onChange={(e) => setInvTaxTag(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="ไม่ลดหย่อน">ไม่ใช้สิทธิลดหย่อน</option>
                      <option value="ThaiESG">ThaiESG (เพดาน 300,000 บาท)</option>
                      <option value="RMF">RMF (เพดาน 500,000 บาท รวม กบข.)</option>
                      <option value="SSF">SSF (กองทุนรวมเพื่อการออม)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อรายการ / หุ้น / กองทุน
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น DCA ซื้อหุ้น PTT, ซื้อกองทุน K-ThaiESG"
                    value={invTitle}
                    onChange={(e) => setInvTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                  >
                    บันทึกการลงทุน
                  </button>
                </div>
              </form>
            )}

            {/* TAB 4: REVENUE & DIVIDENDS */}
            {modalTab === 'REVENUE' && (
              <form onSubmit={handleCreateRevenueEntry} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    หมวดเงินได้พึงประเมินตามประมวลรัษฎากร (ภ.ง.ด.) *
                  </label>
                  <select
                    required
                    value={revCategory}
                    onChange={(e) => setRevCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                  >
                    {REVENUE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Specific UI for Thai Stock Dividend (40(4)(b)) */}
                {revCategory === '40(4)(b)' ? (
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/50 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <Calculator size={15} />
                      คำนวณเครดิตภาษีเงินปันผลหุ้นไทย (มาตรา ๔๗ ทวิ)
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                          ชื่อย่อหุ้น (Symbol)
                        </label>
                        <input
                          type="text"
                          placeholder="เช่น PTT, ADVANC, BDMS"
                          value={revStockSymbol}
                          onChange={(e) => setRevStockSymbol(e.target.value.toUpperCase())}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                          อัตราภาษีนิติบุคคลของบริษัทจ่ายปันผล
                        </label>
                        <select
                          value={revCorpTaxRate}
                          onChange={(e) => setRevCorpTaxRate(parseFloat(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                        >
                          <option value={20}>20% (อัตราทั่วไป เครดิต 25%)</option>
                          <option value={25}>25% (เครดิต 33.33%)</option>
                          <option value={30}>30% (เครดิต 42.86%)</option>
                          <option value={0}>0% (ไม่ได้รับสิทธิเครดิตภาษี)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                          เงินปันผลรวมก่อนหักภาษี (Gross) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          placeholder="0.00"
                          value={revGrossAmount}
                          onChange={(e) => setRevGrossAmount(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                          บัญชีธนาคารที่รับเงินโอนสุทธิ
                        </label>
                        <select
                          value={revDepositAssetId}
                          onChange={(e) => setRevDepositAssetId(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        >
                          <option value="">-- เลือกบัญชีรับเงิน --</option>
                          {bankAssets.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Dynamic Auto-Calculation Result */}
                    {dividendCalc && dividendCalc.gross > 0 && (
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900 text-xs space-y-1.5">
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                          <span>ภาษีหัก ณ ที่จ่าย ๑๐% (จ่ายแล้ว):</span>
                          <span className="font-semibold text-rose-600">
                            -฿{formatCurrency(dividendCalc.withholding)}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                          <span>เงินโอนสุทธิเข้าบัญชี (Net Received):</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            ฿{formatCurrency(dividendCalc.net)}
                          </span>
                        </div>
                        <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                          <span>เครดิตภาษี ม.๔๗ ทวิ ({dividendCalc.corpRate}%):</span>
                          <span className="font-bold">
                            +฿{formatCurrency(dividendCalc.taxCredit)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-emerald-800 dark:text-emerald-300 font-bold">
                          <span>รวมสิทธิประโยชน์ทางภาษีที่จะได้เคลมคืน:</span>
                          <span>฿{formatCurrency(dividendCalc.totalBenefit)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard Revenue UI */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          เงินได้พึงประเมินรวม (บาท) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          placeholder="0.00"
                          value={revGrossAmount}
                          onChange={(e) => setRevGrossAmount(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          ภาษีหัก ณ ที่จ่าย (ถ้ามี)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.00"
                          placeholder="0.00"
                          value={revWithholdingTax}
                          onChange={(e) => setRevWithholdingTax(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-rose-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        โอนเข้าบัญชีธนาคาร (Smart Sync)
                      </label>
                      <select
                        value={revDepositAssetId}
                        onChange={(e) => setRevDepositAssetId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="">-- เลือกบัญชีรับเงินโอน --</option>
                        {bankAssets.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        ชื่อรายการรายได้
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น เงินเดือน, ค่าเบี้ยประชุม, ค่าตอบแทนวิทยากร"
                        value={revTitle}
                        onChange={(e) => setRevTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    บันทึกช่วยจำ (Note)
                  </label>
                  <input
                    type="text"
                    placeholder="หมายเหตุเพิ่มเติม..."
                    value={revNote}
                    onChange={(e) => setRevNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                  >
                    บันทึกรายได้
                  </button>
                </div>
              </form>
            )}

            {/* TAB 5: CIVIL SERVANT PAYROLL WIZARD */}
            {modalTab === 'PAYROLL' && (
              <form onSubmit={handleCreatePayrollBatch} className="space-y-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300">
                  <span className="font-bold flex items-center gap-1.5 mb-1">
                    <CheckCircle2 size={15} /> ตัวช่วยบันทึกสลิปเงินเดือนข้าราชการแบบครบวงจร
                  </span>
                  ระบบจะแยกรายการบันทึกบัญชีอัตโนมัติ: เงินเดือน ๔๐(๑), ภาษีหัก ณ ที่จ่าย, กบข. บังคับ+สะสมเพิ่ม, หุ้นสหกรณ์, ชำระหนี้ และนำยอดสุทธิฝากเข้าบัญชีธนาคารในคลิกเดียว
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      เงินเดือนรวม (Gross Salary) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={payrollGross}
                      onChange={(e) => setPayrollGross(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      ภาษีหัก ณ ที่จ่าย ภ.ง.ด.๑
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={payrollTax}
                      onChange={(e) => setPayrollTax(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-rose-600 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      กบข. สะสมตามกฎหมาย (๓%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={payrollGpfMandatory}
                      onChange={(e) => setPayrollGpfMandatory(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      กบข. สะสมเพิ่ม (สมัครใจ)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={payrollGpfVoluntary}
                      onChange={(e) => setPayrollGpfVoluntary(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      ค่าหุ้น สหกรณ์ออมทรัพย์
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={payrollCoopShares}
                      onChange={(e) => setPayrollCoopShares(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-blue-600 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      ชำระหนี้เงินกู้ สหกรณ์ออมทรัพย์
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={payrollCoopLoan}
                      onChange={(e) => setPayrollCoopLoan(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-amber-600 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    บัญชีธนาคารรับเงินเดือนสุทธิ (Net Deposit)
                  </label>
                  <select
                    value={payrollBankAssetId}
                    onChange={(e) => setPayrollBankAssetId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="">-- เลือกบัญชีธนาคารรับเงินเดือน --</option>
                    {bankAssets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (คงเหลือปัจจุบัน: ฿{formatCurrency(a.amountTHB)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Net Salary Summary Box */}
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    เงินได้สุทธิเข้าบัญชี (Net Received):
                  </span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    ฿{formatCurrency(payrollNetCalculated)}
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                  >
                    บันทึกสลิปเงินเดือนทั้งหมด
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
