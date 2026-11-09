// Types for GovWealth Planner Web (พ.ศ. ๒๕๖๙)

export type AssetCategory =
  | '1. เงินสดและเทียบเท่า'
  | '2. กองทุนรวมไทย'
  | '3. กองทุนรวมต่างประเทศ'
  | '4. หุ้นไทย'
  | '5. หุ้นต่างประเทศ'
  | '6. พอร์ต FOREX และอื่นๆ';

export interface AssetCategoryMeta {
  key: AssetCategory;
  shortName: string;
  defaultTargetPercent: number;
  color: string;
  twBadge: string;
}

export const ASSET_CATEGORIES: AssetCategoryMeta[] = [
  {
    key: '1. เงินสดและเทียบเท่า',
    shortName: 'เงินสด/สลาก',
    defaultTargetPercent: 10,
    color: '#0D746D',
    twBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
  },
  {
    key: '2. กองทุนรวมไทย',
    shortName: 'กองทุนไทย',
    defaultTargetPercent: 20,
    color: '#059669',
    twBadge: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-300'
  },
  {
    key: '3. กองทุนรวมต่างประเทศ',
    shortName: 'กองทุน ตปท.',
    defaultTargetPercent: 20,
    color: '#0284C7',
    twBadge: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300'
  },
  {
    key: '4. หุ้นไทย',
    shortName: 'หุ้นไทย',
    defaultTargetPercent: 20,
    color: '#D97706',
    twBadge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
  },
  {
    key: '5. หุ้นต่างประเทศ',
    shortName: 'หุ้น ตปท.',
    defaultTargetPercent: 20,
    color: '#7C3AED',
    twBadge: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300'
  },
  {
    key: '6. พอร์ต FOREX และอื่นๆ',
    shortName: 'FOREX/อื่นๆ',
    defaultTargetPercent: 10,
    color: '#E11D48',
    twBadge: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
  }
];

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  institution: string;
  amountTHB: number;
  amountUSD: number;
  isUSD: boolean;
  notes: string;
}

export interface Liability {
  id: string;
  name: string;
  lender: string;
  totalOutstanding: number;
  monthlyInstallment: number;
  remainingMonths: number;
  paidThisMonth: number;
}

export type JournalType = 'รับเงิน (รายได้)' | 'จ่ายเงิน (ค่าใช้จ่าย)' | 'โอนเงิน';

export type SmartTransactionType =
  | 'STANDARD'
  | 'CREDIT_CARD_SPEND'
  | 'CREDIT_CARD_PAYMENT'
  | 'INVESTMENT_BUY'
  | 'PAYROLL';

export const REVENUE_CATEGORIES = [
  { id: '40(1)', name: '๔๐(๑) เงินเดือน, ค่าจ้าง, โบนัส, เบี้ยเลี้ยง', shortName: '๔๐(๑) เงินเดือน' },
  { id: '40(2)', name: '๔๐(๒) ค่าตอบแทน, เบี้ยประชุม, ค่านายหน้า', shortName: '๔๐(๒) ค่าตอบแทน' },
  { id: '40(3)', name: '๔๐(๓) ค่าลิขสิทธิ์, ค่ากู๊ดวิลล์, สิทธิบัตร', shortName: '๔๐(๓) ลิขสิทธิ์' },
  { id: '40(4)(a)', name: '๔๐(๔)(ก) ดอกเบี้ยเงินฝาก, พันธบัตร, หุ้นกู้', shortName: '๔๐(๔)(ก) ดอกเบี้ย' },
  { id: '40(4)(b)', name: '๔๐(๔)(ข) เงินปันผลหุ้นไทย / กองทุนรวม (มีเครดิตภาษี ม.๔๗ ทวิ)', shortName: '๔๐(๔)(ข) ปันผลหุ้นไทย' },
  { id: '40(5)', name: '๔๐(๕) เงินได้จากการให้เช่าทรัพย์สิน, บ้าน, ที่ดิน', shortName: '๔๐(๕) ค่าเช่า' },
  { id: '40(6)', name: '๔๐(๖) วิชาชีพอิสระ (ประกอบโรคศิลปะ, กฎหมาย, บัญชี)', shortName: '๔๐(๖) วิชาชีพอิสระ' },
  { id: '40(7)', name: '๔๐(๗) เงินได้จากการรับเหมาจัดหาสัมภาระ', shortName: '๔๐(๗) รับเหมา' },
  { id: '40(8)', name: '๔๐(๘) ธุรกิจ, การพาณิชย์, เงินปันผลกองทุนอสังหาฯ', shortName: '๔๐(๘) ธุรกิจ/อื่นๆ' },
] as const;

export interface PayrollDetails {
  grossSalary: number;
  withholdingTax: number;
  gpfMandatory: number;
  gpfVoluntary: number;
  coopSavingShare: number;
  coopLoanPayment: number;
  otherDeductions: number;
  netSalary: number;
  depositAssetId?: string;
}

export interface JournalEntry {
  id: string;
  date: string; // ISO string or YYYY-MM-DD
  type: JournalType;
  smartType?: SmartTransactionType;
  title: string;
  amount: number;
  debitAccountName: string;
  creditAccountName: string;
  revenueCategory?: string;
  taxDeductionTag?: string;
  grossDividendAmount?: number;
  withholdingTaxAmount?: number;
  dividendTaxCreditAmount?: number;
  corporateTaxRatePercent?: number;
  stockSymbol?: string;
  sourceAssetId?: string;
  targetAssetId?: string;
  targetLiabilityId?: string;
  destinationAssetID?: string;
  note?: string;
}

export interface TaxItem {
  id: string;
  date: string; // ISO string
  deductionType: string; // 'กบข.', 'RMF', 'ThaiESG', 'ประกันชีวิต', etc.
  fundCode: string;
  amount: number;
  assetClassName?: string;
}

export interface UserCategory {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  defaultAmount?: number;
  revenueCategory?: string;
  taxDeductionTag?: string;
}

export interface UserProfile {
  fullName: string;
  organization: string;
  rank: string;
  currentMonthlySalary: number;
  gpfRatePercent: number; // 3% - 15%
  targetCashPercent: number;
  targetThaiFundPercent: number;
  targetForeignFundPercent: number;
  targetThaiStockPercent: number;
  targetForeignStockPercent: number;
  targetForexPercent: number;
  usdToThbRate: number;
  isOnboarded: boolean;
}

export interface HistoricalRecord {
  id: string;
  buddhistYear: number;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  totalRevenue: number;
  totalExpenses: number;
  netCashFlow: number;
  netSavingsRatePercent: number;
  roaPercent: number;
  roePercent: number;
  deRatio: number;
}

export type HealthStatusLevel = 'EXCELLENT' | 'WARNING' | 'DANGER';

export interface FinancialRatioDetail {
  id: string;
  nameTh: string;
  nameEn: string;
  value: number;
  unit: string;
  formattedValue: string;
  benchmarkText: string;
  status: HealthStatusLevel;
  score: number; // 0 - 100
  civilServantNote: string;
  academicRationale: string;
}

export interface ActionablePrescription {
  id: string;
  type: 'EMERGENCY_FUND' | 'DEBT_OPTIMIZATION' | 'GPF_SAVINGS' | 'PASSIVE_INCOME';
  title: string;
  description: string;
  recommendedActionAmount?: number;
  priority: 'HIGH' | 'MEDIUM' | 'INFO';
}

export interface FinancialHealthReport {
  overallScore: number;
  tierName: string;
  tierColor: string;
  calculatedAt: string;
  monthlyIncomeBaseline: number;
  monthlyExpenseBaseline: number;
  monthlyDebtBaseline: number;
  liquidAssetsTotal: number;
  totalAssets: number;
  totalLiabilities: number;
  ratios: {
    basicLiquidity: FinancialRatioDetail;
    debtServiceRatio: FinancialRatioDetail;
    savingsRatio: FinancialRatioDetail;
    debtToAssetRatio: FinancialRatioDetail;
    survivalRatio: FinancialRatioDetail;
  };
  prescriptions: ActionablePrescription[];
}

export interface FullWealthDatabase {
  version: number;
  exportedAt: number;
  profile: UserProfile;
  assets: Asset[];
  liabilities: Liability[];
  journalEntries: JournalEntry[];
  taxItems: TaxItem[];
  bankPresets?: string[];
  historicalRecords?: HistoricalRecord[];
}
