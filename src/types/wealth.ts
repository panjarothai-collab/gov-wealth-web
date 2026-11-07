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

export interface JournalEntry {
  id: string;
  date: string; // ISO string or YYYY-MM-DD
  type: JournalType;
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
