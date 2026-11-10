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
  Upload,
  FileImage,
  Eye,
  Sparkles,
  Camera,
  Loader2,
  FileCheck,
  ArrowRightLeft,
  Smartphone,
  Coffee,
  Utensils,
  Scan,
  Check,
} from 'lucide-react';
import {
  JournalEntry,
  JournalType,
  SmartTransactionType,
  REVENUE_CATEGORIES,
  PayrollDetails,
} from '@/types/wealth';
import {
  PRESET_NITAT_SLIP,
  scanSlipWithOCR,
  ScannedMophSlip,
} from '@/lib/mophSlipScanner';
import {
  ScannedBankSlip,
  SlipTransactionCategory,
  PRESET_KBANK_SLIP,
  PRESET_KTB_SLIP,
  scanBankSlipWithOCR,
} from '@/lib/bankSlipScanner';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

type ModalTab = 'STANDARD' | 'BANK_SLIP' | 'CREDIT_CARD' | 'INVESTMENT' | 'REVENUE' | 'PAYROLL';

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

  // Salary Slip OCR Scanner State
  const [slipImagePreview, setSlipImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  const [showSlipImage, setShowSlipImage] = useState(false);
  const [scannedInfo, setScannedInfo] = useState<ScannedMophSlip | null>(null);

  // Bank Transfer Slip Scanner State
  const [bankSlipImage, setBankSlipImage] = useState<string | null>(null);
  const [isBankSlipScanning, setIsBankSlipScanning] = useState(false);
  const [bankSlipProgress, setBankSlipProgress] = useState(0);
  const [bankSlipStatus, setBankSlipStatus] = useState('');
  const [scannedBankSlip, setScannedBankSlip] = useState<ScannedBankSlip | null>(null);
  const [slipMode, setSlipMode] = useState<SlipTransactionCategory>('SELF_TRANSFER');
  const [slipAmount, setSlipAmount] = useState('');
  const [slipDate, setSlipDate] = useState(new Date().toISOString().slice(0, 10));
  const [slipTitle, setSlipTitle] = useState('');
  const [slipSourceAssetId, setSlipSourceAssetId] = useState('');
  const [slipTargetAssetId, setSlipTargetAssetId] = useState('');
  const [slipTargetLiabilityId, setSlipTargetLiabilityId] = useState('');
  const [slipCategory, setSlipCategory] = useState('ค่าอาหารและเครื่องดื่ม');
  const [slipNote, setSlipNote] = useState('');

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
      alert('กรุณากรอกชื่อรายการและจำนวนเงินที่ถูกต้อง (ทศนิยม 2 ตำแหน่ง)');
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
        title: revTitle || `เงินปันผลหุ้นไทย${stockText} (ม.47 ทวิ)`,
        amount: dividendCalc.net, // Cash received in bank
        debitAccountName: depositAsset?.name || 'บัญชีรับเงินปันผล',
        creditAccountName: 'รายได้เงินปันผล 40(4)(ข)',
        revenueCategory: '40(4)(ข) ปันผลหุ้นไทย',
        stockSymbol: revStockSymbol || undefined,
        grossDividendAmount: dividendCalc.gross,
        dividendTaxCreditAmount: dividendCalc.taxCredit,
        corporateTaxRatePercent: dividendCalc.corpRate,
        withholdingTaxAmount: dividendCalc.withholding,
        sourceAssetId: revDepositAssetId || undefined,
        note: revNote || `Gross ฿${formatCurrency(dividendCalc.gross)}, หัก 10% ฿${formatCurrency(dividendCalc.withholding)}, เครดิตภาษี ฿${formatCurrency(dividendCalc.taxCredit)}`,
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

  // Handler: Scan Uploaded Salary Slip Image with OCR
  const handleProcessSlipFile = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setSlipImagePreview(dataUrl);
        setShowSlipImage(true);
      };
      reader.readAsDataURL(file);

      setIsScanning(true);
      setScanProgress(5);
      setScanStatus('กำลังวิเคราะห์โครงสร้างสลิปเงินเดือน สป.สธ...');

      const result = await scanSlipWithOCR(file, (pct, status) => {
        setScanProgress(pct);
        setScanStatus(status);
      });

      setScannedInfo(result);
      if (result.totalGrossIncome > 0) {
        setPayrollGross(result.totalGrossIncome.toFixed(2));
      }
      if (result.withholdingTax > 0) {
        setPayrollTax(result.withholdingTax.toFixed(2));
      }
      if (result.gpfMandatory > 0) {
        setPayrollGpfMandatory(result.gpfMandatory.toFixed(2));
      }
      if (result.gpfVoluntary > 0) {
        setPayrollGpfVoluntary(result.gpfVoluntary.toFixed(2));
      }
      if (result.coopShares > 0) {
        setPayrollCoopShares(result.coopShares.toFixed(2));
      }
      if (result.coopLoan > 0 || result.housingLoan > 0) {
        setPayrollCoopLoan((result.coopLoan + result.housingLoan).toFixed(2));
      }
      if (result.transferDate) {
        setEntryDate(result.transferDate);
      }

      // Auto-match Krungthai Bank
      const ktb = bankAssets.find(
        (a) => a.name.toLowerCase().includes('กรุงไทย') || a.institution?.toLowerCase().includes('กรุงไทย')
      );
      if (ktb) {
        setPayrollBankAssetId(ktb.id);
      }
    } catch (err) {
      console.error('OCR Error:', err);
      alert('ไม่สามารถสแกนอัตโนมัติได้ สามารถกดปุ่ม "ใช้ข้อมูลสลิป ต.ค. 2569" เพื่อกรอกข้อมูลทันที');
    } finally {
      setIsScanning(false);
      setScanProgress(100);
      setScanStatus('ดึงข้อมูลเสร็จสิ้น');
    }
  };

  // Handler: Apply User's Official MOPH Pay Slip Preset (ต.ค. 2569)
  const handleApplyNitatSlipPreset = () => {
    setSlipImagePreview('/sample_moph_slip.png');
    setShowSlipImage(true);
    setScannedInfo(PRESET_NITAT_SLIP);
    setEntryDate(PRESET_NITAT_SLIP.transferDate);
    setPayrollGross(PRESET_NITAT_SLIP.totalGrossIncome.toFixed(2));
    setPayrollTax(PRESET_NITAT_SLIP.withholdingTax.toFixed(2));
    setPayrollGpfMandatory(PRESET_NITAT_SLIP.gpfMandatory.toFixed(2));
    setPayrollGpfVoluntary(PRESET_NITAT_SLIP.gpfVoluntary.toFixed(2));
    setPayrollCoopShares(PRESET_NITAT_SLIP.coopShares.toFixed(2));
    setPayrollCoopLoan(PRESET_NITAT_SLIP.coopLoan.toFixed(2));

    // Auto-match Krungthai Bank
    const ktb = bankAssets.find(
      (a) => a.name.toLowerCase().includes('กรุงไทย') || a.institution?.toLowerCase().includes('กรุงไทย')
    );
    if (ktb) {
      setPayrollBankAssetId(ktb.id);
    }
  };

  // Handlers for Bank Slip Scanner
  const handleApplyScannedBankSlip = (scanned: ScannedBankSlip, previewUrl?: string) => {
    setScannedBankSlip(scanned);
    if (previewUrl) setBankSlipImage(previewUrl);
    setSlipAmount(scanned.amount ? scanned.amount.toFixed(2) : '');
    setSlipDate(scanned.transferDate || new Date().toISOString().slice(0, 10));
    setSlipMode(scanned.suggestedType);
    setSlipCategory(scanned.suggestedCategoryName);

    // Auto-match source bank account in user assets
    const matchedSource = bankAssets.find(
      (a) =>
        (scanned.senderBank && a.name.toLowerCase().includes(scanned.senderBank.toLowerCase())) ||
        (scanned.senderBank.includes('กสิกร') && a.name.includes('กสิกร')) ||
        (scanned.senderBank.includes('กรุงไทย') && a.name.includes('กรุงไทย'))
    );
    if (matchedSource) {
      setSlipSourceAssetId(matchedSource.id);
    } else if (bankAssets.length > 0) {
      setSlipSourceAssetId(bankAssets[0].id);
    }

    // Auto-match target bank account in user assets
    const matchedTarget = bankAssets.find(
      (a) =>
        a.id !== (matchedSource?.id || '') &&
        ((scanned.recipientBankOrPromptPay && a.name.toLowerCase().includes(scanned.recipientBankOrPromptPay.toLowerCase())) ||
          (scanned.recipientBankOrPromptPay.includes('กรุงไทย') && a.name.includes('กรุงไทย')) ||
          (scanned.recipientBankOrPromptPay.includes('พร้อมเพย์') && a.name.includes('กรุงไทย')))
    );
    if (matchedTarget) {
      setSlipTargetAssetId(matchedTarget.id);
    } else {
      const fallbackTarget = bankAssets.find((a) => a.id !== matchedSource?.id);
      if (fallbackTarget) setSlipTargetAssetId(fallbackTarget.id);
    }

    // Auto-match credit card liability if CC payment
    if (creditCardLiabilities.length > 0) {
      setSlipTargetLiabilityId(creditCardLiabilities[0].id);
    }

    // Title and note
    if (scanned.suggestedType === 'SELF_TRANSFER') {
      setSlipTitle(`โอนเงินระหว่างบัญชี (${scanned.senderBank} -> ${scanned.recipientBankOrPromptPay})`);
    } else if (scanned.suggestedType === 'CREDIT_CARD_PAYMENT') {
      setSlipTitle(`ชำระหนี้บัตรเครดิต (${creditCardLiabilities[0]?.name || 'บัตรเครดิต'})`);
    } else {
      setSlipTitle(scanned.memo ? `${scanned.memo} (${scanned.senderBank})` : `ค่าใช้จ่าย (${scanned.suggestedCategoryName})`);
    }
    setSlipNote(scanned.memo ? `บันทึกช่วยจำ: ${scanned.memo}` : '');
  };

  const handleBankSlipFileUpload = async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setBankSlipImage(objectUrl);
    setIsBankSlipScanning(true);
    setBankSlipProgress(10);
    setBankSlipStatus('กำลังเตรียมโมเดล OCR อ่านสลิปโอนเงิน...');

    try {
      const scanned = await scanBankSlipWithOCR(file, (pct, status) => {
        setBankSlipProgress(pct);
        setBankSlipStatus(status);
      });
      handleApplyScannedBankSlip(scanned, objectUrl);
    } catch (err) {
      console.error('Failed to scan bank slip:', err);
      alert('ไม่สามารถอ่านตัวอักษรจากสลิปได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsBankSlipScanning(false);
      setBankSlipProgress(100);
      setBankSlipStatus('อ่านข้อมูลเสร็จสิ้น');
    }
  };

  const handleSaveBankSlipEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(slipAmount);
    if (!amt || amt <= 0) {
      alert('กรุณาระบุจำนวนเงิน');
      return;
    }

    const sourceAsset = database.assets.find((a) => a.id === slipSourceAssetId);
    const targetAsset = database.assets.find((a) => a.id === slipTargetAssetId);
    const targetLiability = database.liabilities.find((l) => l.id === slipTargetLiabilityId);

    if (slipMode === 'SELF_TRANSFER') {
      addJournalEntry({
        date: slipDate,
        type: 'โอนเงิน',
        smartType: 'STANDARD',
        title: slipTitle || 'โอนเงินระหว่างบัญชีตนเอง',
        amount: amt,
        debitAccountName: targetAsset?.name || 'บัญชีปลายทาง',
        creditAccountName: sourceAsset?.name || 'บัญชีต้นทาง',
        sourceAssetId: slipSourceAssetId,
        targetAssetId: slipTargetAssetId,
        note: slipNote || (scannedBankSlip?.memo ? `บันทึกช่วยจำ: ${scannedBankSlip.memo}` : ''),
      });
    } else if (slipMode === 'CREDIT_CARD_PAYMENT') {
      addJournalEntry({
        date: slipDate,
        type: 'จ่ายเงิน (ค่าใช้จ่าย)',
        smartType: 'CREDIT_CARD_PAYMENT',
        title: slipTitle || 'ชำระหนี้บัตรเครดิต',
        amount: amt,
        debitAccountName: targetLiability?.name || 'หนี้บัตรเครดิต',
        creditAccountName: sourceAsset?.name || 'บัญชีเงินฝาก',
        sourceAssetId: slipSourceAssetId,
        targetLiabilityId: slipTargetLiabilityId,
        note: slipNote || (scannedBankSlip?.memo ? `บันทึกช่วยจำ: ${scannedBankSlip.memo}` : ''),
      });
    } else {
      addJournalEntry({
        date: slipDate,
        type: 'จ่ายเงิน (ค่าใช้จ่าย)',
        smartType: 'STANDARD',
        title: slipTitle || 'ค่าใช้จ่ายทั่วไป',
        amount: amt,
        debitAccountName: slipCategory || 'ค่าใช้จ่าย',
        creditAccountName: sourceAsset?.name || 'บัญชีเงินฝาก',
        sourceAssetId: slipSourceAssetId,
        note: slipNote || (scannedBankSlip?.memo ? `บันทึกช่วยจำ: ${scannedBankSlip.memo}` : ''),
      });
    }

    setShowAddModal(false);
    setScannedBankSlip(null);
    setBankSlipImage(null);
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

    // Prevent duplicate payroll imports for the same month
    const targetMonthPrefix = entryDate.substring(0, 7); // e.g. "2026-07"
    const existingInSameMonth = database?.journalEntries.some(
      (j) => j.smartType === 'PAYROLL' && j.date && j.date.startsWith(targetMonthPrefix)
    );

    if (existingInSameMonth) {
      if (
        !confirm(
          `⚠️ แจ้งเตือน: มีรายการเงินเดือนของเดือนนี้ (${targetMonthPrefix}) อยู่ในระบบแล้ว\n\nต้องการบันทึกข้อมูลสลิปนี้ซ้ำอีกครั้งหรือไม่?`
        )
      ) {
        return;
      }
    }

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
            บันทึกรายการบัญชีคู่ (Double-Entry) พร้อมระบบแยกหมวดภาษี 40(1)-40(8), เครดิตภาษีปันผล และ Smart Balance Sync
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setModalTab('BANK_SLIP');
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 text-sm font-semibold transition shadow-xs"
          >
            <Camera size={18} className="text-teal-600 dark:text-teal-400" /> สแกนสลิปโอนเงิน (ใหม่)
          </button>

          <button
            onClick={() => {
              setModalTab('STANDARD');
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition shadow-xs"
          >
            <Plus size={18} /> บันทึกรายการใหม่
          </button>
        </div>
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
                            ข้อมูลเครดิตภาษีเงินปันผล (ม.47 ทวิ):
                          </span>
                          <div className="grid grid-cols-3 gap-2 mt-1 text-slate-700 dark:text-slate-300">
                            <div>ยอด Gross: ฿{formatCurrency(entry.grossDividendAmount)}</div>
                            <div>หัก ณ ที่จ่าย 10%: ฿{formatCurrency(entry.withholdingTaxAmount || 0)}</div>
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
                onClick={() => setModalTab('BANK_SLIP')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition text-center flex items-center justify-center gap-1 ${
                  modalTab === 'BANK_SLIP'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Camera size={13} /> สลิปโอนเงิน (ใหม่)
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

            {/* TAB: BANK TRANSFER SLIP SCANNER */}
            {modalTab === 'BANK_SLIP' && (
              <form onSubmit={handleSaveBankSlipEntry} className="space-y-4">
                {/* Upload & Preset Dropzone */}
                <div className="bg-gradient-to-br from-teal-50 via-emerald-50 to-slate-50 dark:from-teal-950/40 dark:via-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-teal-200 dark:border-teal-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                        <Scan size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>สแกนสลิปโอนเงินธนาคาร (Bank Transfer Slip Scanner)</span>
                          <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-300 text-[10px] font-bold">
                            KBank / Krungthai / PromptPay
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          อัปโหลดรูปสลิปเพื่อดึงยอดเงิน, วันที่, บันทึกช่วยจำ และเลือกประเภทรายการอัตโนมัติ
                        </p>
                      </div>
                    </div>

                    {/* Presets matching user's uploaded slips */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleApplyScannedBankSlip(PRESET_KBANK_SLIP, '/sample_transfer_kbank.jpg')}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700 text-[11px] font-bold transition flex items-center gap-1 shadow-xs"
                      >
                        <Utensils size={12} /> สลิป 1: กสิกร (ค่าข้าว 20฿)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyScannedBankSlip(PRESET_KTB_SLIP, '/sample_transfer_krungthai.jpg')}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700 text-[11px] font-bold transition flex items-center gap-1 shadow-xs"
                      >
                        <Coffee size={12} /> สลิป 2: กรุงไทย (ค่ากาแฟ 20฿)
                      </button>
                    </div>
                  </div>

                  {/* Dropzone file input */}
                  <label className="border-2 border-dashed border-teal-300 dark:border-teal-700 hover:border-teal-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-white/60 dark:bg-slate-800/60 transition group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleBankSlipFileUpload(file);
                      }}
                      className="hidden"
                    />
                    <Upload size={22} className="text-teal-600 dark:text-teal-400 group-hover:scale-110 transition mb-1" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      คลิกเพื่อเลือกไฟล์รูปสลิป หรือลากไฟล์มาวางที่นี่
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      รองรับไฟล์ภาพ JPG, PNG จากแอปธนาคารทุกแห่ง
                    </span>
                  </label>

                  {/* Scanning progress */}
                  {isBankSlipScanning && (
                    <div className="space-y-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-teal-200 dark:border-teal-700">
                      <div className="flex items-center justify-between text-xs font-semibold text-teal-700 dark:text-teal-300">
                        <span className="flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin" /> {bankSlipStatus}
                        </span>
                        <span>{bankSlipProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-600 transition-all duration-300 rounded-full"
                          style={{ width: `${bankSlipProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Parsed Slip Preview & Analysis Result */}
                {scannedBankSlip && (
                  <div className="space-y-3">
                    {/* Information summary & Slip Image side-by-side */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {bankSlipImage && (
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700">
                          <img
                            src={bankSlipImage}
                            alt="Slip Preview"
                            className="max-h-44 object-contain rounded-lg shadow-xs"
                          />
                          <span className="text-[10px] text-slate-400 mt-1">รูปสลิปต้นทาง</span>
                        </div>
                      )}

                      <div className={`${bankSlipImage ? 'md:col-span-2' : 'md:col-span-3'} bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs`}>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                          <span className="text-slate-500">ยอดเงินโอน:</span>
                          <span className="text-xl font-extrabold text-teal-600 dark:text-teal-400">
                            ฿{formatCurrency(scannedBankSlip.amount)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block">ผู้โอน:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {scannedBankSlip.senderName}
                            </span>
                            <span className="text-slate-500 block text-[10px]">{scannedBankSlip.senderBank}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">ผู้รับโอน:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {scannedBankSlip.recipientName}
                            </span>
                            <span className="text-slate-500 block text-[10px]">{scannedBankSlip.recipientBankOrPromptPay}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                          <span className="text-slate-500">บันทึกช่วยจำ (Memo):</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                            {scannedBankSlip.memo || '(ไม่ระบุ)'}
                          </span>
                        </div>

                        {/* Status suggestion alert */}
                        <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[11px] text-teal-800 dark:text-teal-200 flex items-center gap-2">
                          <Sparkles size={14} className="text-teal-600 shrink-0" />
                          <span>
                            {scannedBankSlip.isSelfTransfer
                              ? 'ตรวจพบ: ชื่อผู้โอนและผู้รับตรงกัน (โอนเงินระหว่างบัญชีตนเอง - ความมั่งคั่งสุทธิไม่เปลี่ยน)'
                              : scannedBankSlip.isCreditCardPayment
                              ? 'ตรวจพบ: รายการชำระหนี้บัตรเครดิต (ตัดเงินสดและลดหนี้สิน)'
                              : `ตรวจพบ: ค่าใช้จ่ายทั่วไป (แนะนำหมวด: ${scannedBankSlip.suggestedCategoryName})`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3-Way Mode Selection Buttons */}
                    <div className="space-y-2 pt-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        เลือกประเภทรายการที่ต้องการบันทึก:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Option 1: Self Transfer */}
                        <button
                          type="button"
                          onClick={() => {
                            setSlipMode('SELF_TRANSFER');
                            setSlipTitle(`โอนเงินระหว่างบัญชี (${scannedBankSlip.senderBank} -> ${scannedBankSlip.recipientBankOrPromptPay})`);
                          }}
                          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                            slipMode === 'SELF_TRANSFER'
                              ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 ring-2 ring-teal-500/20'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                              <ArrowRightLeft size={14} className="text-teal-600" /> 1. โอนในบัญชีตัวเอง
                            </span>
                            {slipMode === 'SELF_TRANSFER' && <Check size={14} className="text-teal-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            ย้ายเงินระหว่างบัญชี ไม่นับเป็นรายจ่าย Net Worth คงเดิม
                          </p>
                        </button>

                        {/* Option 2: Expense */}
                        <button
                          type="button"
                          onClick={() => {
                            setSlipMode('EXPENSE');
                            setSlipTitle(scannedBankSlip.memo ? `${scannedBankSlip.memo} (${scannedBankSlip.senderBank})` : `ค่าใช้จ่าย (${scannedBankSlip.suggestedCategoryName})`);
                          }}
                          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                            slipMode === 'EXPENSE'
                              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/20'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                              <Utensils size={14} className="text-amber-600" /> 2. บันทึกเป็นรายจ่าย
                            </span>
                            {slipMode === 'EXPENSE' && <Check size={14} className="text-amber-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            ตัดเงินจากบัญชี และบันทึกเป็นค่าใช้จ่ายตามบันทึกช่วยจำ
                          </p>
                        </button>

                        {/* Option 3: Credit Card Payment */}
                        <button
                          type="button"
                          onClick={() => {
                            setSlipMode('CREDIT_CARD_PAYMENT');
                            setSlipTitle(`ชำระหนี้บัตรเครดิต (${creditCardLiabilities[0]?.name || 'บัตรเครดิต'})`);
                          }}
                          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                            slipMode === 'CREDIT_CARD_PAYMENT'
                              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/20'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                              <CreditCard size={14} className="text-rose-600" /> 3. ชำระหนี้บัตรเครดิต
                            </span>
                            {slipMode === 'CREDIT_CARD_PAYMENT' && <Check size={14} className="text-rose-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            ตัดเงินสดไปลดหนี้คงค้างในบัตรเครดิต ไม่นับจ่ายซ้ำ
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Mode-Specific Input Selectors */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                      {/* Self Transfer Inputs */}
                      {slipMode === 'SELF_TRANSFER' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              บัญชีต้นทาง (ตัดเงินออก) *
                            </label>
                            <select
                              value={slipSourceAssetId}
                              onChange={(e) => setSlipSourceAssetId(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-medium"
                            >
                              <option value="">-- เลือกบัญชีต้นทาง --</option>
                              {bankAssets.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({formatCurrency(a.amountTHB)} ฿)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              บัญชีปลายทาง (รับเงินเข้า) *
                            </label>
                            <select
                              value={slipTargetAssetId}
                              onChange={(e) => setSlipTargetAssetId(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-medium"
                            >
                              <option value="">-- เลือกบัญชีปลายทาง --</option>
                              {bankAssets.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({formatCurrency(a.amountTHB)} ฿)
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Expense Inputs */}
                      {slipMode === 'EXPENSE' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              บัญชีที่ตัดเงิน *
                            </label>
                            <select
                              value={slipSourceAssetId}
                              onChange={(e) => setSlipSourceAssetId(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-medium"
                            >
                              <option value="">-- เลือกบัญชีที่ตัดเงิน --</option>
                              {bankAssets.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({formatCurrency(a.amountTHB)} ฿)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              หมวดหมู่รายจ่าย *
                            </label>
                            <select
                              value={slipCategory}
                              onChange={(e) => setSlipCategory(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-medium"
                            >
                              <option value="ค่าอาหารและเครื่องดื่ม">ค่าอาหารและเครื่องดื่ม (เช่น ค่าข้าว, ค่ากาแฟ)</option>
                              <option value="ค่าเดินทางและยานพาหนะ">ค่าเดินทางและยานพาหนะ (ค่าน้ำมัน, รถไฟฟ้า)</option>
                              <option value="ของใช้ในบ้าน/ส่วนตัว">ของใช้ในบ้าน/ส่วนตัว</option>
                              <option value="สาธารณูปโภค/ค่าใช้จ่ายประจำ">สาธารณูปโภค (ค่าน้ำ, ค่าไฟ, อินเทอร์เน็ต)</option>
                              <option value="ค่ารักษาพยาบาล/สุขภาพ">ค่ารักษาพยาบาล/สุขภาพ</option>
                              <option value="ค่าใช้จ่ายเบ็ดเตล็ด">ค่าใช้จ่ายเบ็ดเตล็ด</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Credit Card Payment Inputs */}
                      {slipMode === 'CREDIT_CARD_PAYMENT' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              บัญชีที่ตัดเงินสด *
                            </label>
                            <select
                              value={slipSourceAssetId}
                              onChange={(e) => setSlipSourceAssetId(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-medium"
                            >
                              <option value="">-- เลือกบัญชีเงินฝาก --</option>
                              {bankAssets.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({formatCurrency(a.amountTHB)} ฿)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              บัตรเครดิตที่ต้องการชำระหนี้ *
                            </label>
                            <select
                              value={slipTargetLiabilityId}
                              onChange={(e) => setSlipTargetLiabilityId(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-medium"
                            >
                              <option value="">-- เลือกบัตรเครดิต --</option>
                              {creditCardLiabilities.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.name} (หนี้ค้าง: {formatCurrency(l.totalOutstanding)} ฿)
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Common editable fields: Date, Title, Amount, Note */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            วันที่ทำรายการ
                          </label>
                          <input
                            type="date"
                            value={slipDate}
                            onChange={(e) => setSlipDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            ชื่อรายการที่บันทึก
                          </label>
                          <input
                            type="text"
                            value={slipTitle}
                            onChange={(e) => setSlipTitle(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            จำนวนเงิน (บาท) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={slipAmount}
                            onChange={(e) => setSlipAmount(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-extrabold text-teal-600 dark:text-teal-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setScannedBankSlip(null);
                          setBankSlipImage(null);
                        }}
                        className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs hover:bg-slate-100 transition"
                      >
                        สแกนสลิปใหม่
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                      >
                        <Check size={16} /> ยืนยันบันทึกรายการลงสมุดบัญชี
                      </button>
                    </div>
                  </div>
                )}
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
                      คำนวณเครดิตภาษีเงินปันผลหุ้นไทย (มาตรา 47 ทวิ)
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
                          <span>ภาษีหัก ณ ที่จ่าย 10% (จ่ายแล้ว):</span>
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
                          <span>เครดิตภาษี ม.47 ทวิ ({dividendCalc.corpRate}%):</span>
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
                {/* Salary Slip OCR Scanner Dropzone */}
                <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-emerald-600 text-white">
                        <Camera size={16} />
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs block">
                          โหลดรูปสลิปเงินเดือน สป.สธ. ดึงข้อมูลอัตโนมัติ (AI & OCR)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          รองรับใบรับรองการจ่ายเงินเดือนและเงินอื่น สป.สธ.
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyNitatSlipPreset}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                    >
                      <Sparkles size={14} /> ใช้ข้อมูลสลิป ต.ค. 2569 ทันที
                    </button>
                  </div>

                  {/* Dropzone & File Input */}
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 rounded-xl bg-white dark:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-300 transition">
                      <Upload size={16} className="text-emerald-600" />
                      <span>คลิกเพื่อเลือกไฟล์รูปภาพสลิป หรือลากไฟล์มาวางที่นี่</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleProcessSlipFile(file);
                        }}
                      />
                    </label>

                    {slipImagePreview && (
                      <button
                        type="button"
                        onClick={() => setShowSlipImage(!showSlipImage)}
                        className="flex items-center gap-1.5 px-3 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
                      >
                        <Eye size={15} className="text-slate-500" />
                        {showSlipImage ? 'ซ่อนรูปสลิป' : 'ดูรูปสลิป'}
                      </button>
                    )}
                  </div>

                  {/* Scanning Progress */}
                  {isScanning && (
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
                          <Loader2 size={14} className="animate-spin text-emerald-600" />
                          {scanStatus}
                        </span>
                        <span className="font-bold text-emerald-600">{scanProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 transition-all duration-300"
                          style={{ width: `${scanProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Slip Preview Accordion */}
                  {showSlipImage && slipImagePreview && (
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between pb-1 px-1 text-[11px] text-slate-500">
                        <span className="font-semibold flex items-center gap-1">
                          <FileCheck size={13} className="text-emerald-600" />
                          ภาพถ่ายสลิปเงินเดือน สป.สธ.
                        </span>
                        <span>เทียบตรวจตัวเลขด้านล่าง</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-700">
                        <img
                          src={slipImagePreview}
                          alt="Salary Slip Preview"
                          className="w-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Detected Slip Info Pill */}
                  {scannedInfo && (
                    <div className="p-2.5 bg-emerald-100/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/80 text-[11px] text-emerald-800 dark:text-emerald-300 flex flex-wrap items-center justify-between gap-1">
                      <span className="font-semibold">
                        ✓ ดึงข้อมูลสำเร็จ: {scannedInfo.employeeName || 'นายนิทัศน์ ปัญจะโรทัย'} (โอนเข้า {scannedInfo.rawDateText || '27/10/2569'})
                      </span>
                      <span>ธ.กรุงไทย สาขานครนายก เลขที่ 2110023333</span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300">
                  <span className="font-bold flex items-center gap-1.5 mb-1">
                    <CheckCircle2 size={15} /> ระบบตรวจและแยกรายการบัญชีคู่อัตโนมัติ (Smart Payroll Batch)
                  </span>
                  บันทึกเงินเดือน 40(1), ภาษีหัก ณ ที่จ่าย ภ.ง.ด.1, กบข. สะสมตามกฎหมาย (3%), กบข. ออมเพิ่ม (10%), ค่าหุ้นสหกรณ์ สสจ.นย. และนำยอดสุทธิฝากเข้าบัญชีกรุงไทยทันที
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
                      ภาษีหัก ณ ที่จ่าย ภ.ง.ด.1
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
                      กบข. สะสมตามกฎหมาย (3%)
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
