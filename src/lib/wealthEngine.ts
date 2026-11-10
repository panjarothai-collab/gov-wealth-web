import {
  Asset,
  AssetCategory,
  ASSET_CATEGORIES,
  Liability,
  JournalEntry,
  TaxItem,
  UserProfile,
  GpfPlanWeights,
  DEFAULT_GPF_PLAN,
} from '@/types/wealth';

// Reference date for Apple Cocoa timestamp (2001-01-01 00:00:00 UTC)
export const APPLE_EPOCH_OFFSET_SECONDS = 978307200;

export function parseAppleOrIsoDate(val: number | string | Date): Date {
  if (val instanceof Date) return val;
  if (typeof val === 'number') {
    // If it's Apple Cocoa timestamp (e.g. ~800,000,000)
    if (val < 2000000000) {
      return new Date((val + APPLE_EPOCH_OFFSET_SECONDS) * 1000);
    }
    // If it's standard Unix millisecond timestamp
    return new Date(val);
  }
  return new Date(val);
}

export function formatBuddhistDate(dateInput: number | string | Date): string {
  const d = parseAppleOrIsoDate(dateInput);
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export interface NetWorthResult {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  debtToEquityRatio: number;
}

export function calculateNetWorth(
  assets: Asset[],
  liabilities: Liability[],
  usdRate: number = 36.5
): NetWorthResult {
  const totalAssets = assets.reduce((sum, a) => {
    const val = a.isUSD ? (a.amountUSD || 0) * usdRate : (a.amountTHB || 0);
    return sum + val;
  }, 0);

  const totalLiabilities = liabilities.reduce(
    (sum, l) => sum + (l.totalOutstanding || 0),
    0
  );

  const netWorth = totalAssets - totalLiabilities;
  const debtToEquityRatio = netWorth > 0 ? totalLiabilities / netWorth : 0;

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    debtToEquityRatio,
  };
}

export interface CategoryAllocation {
  category: AssetCategory;
  shortName: string;
  color: string;
  currentValue: number;
  directValue: number;
  gpfDecomposedValue: number;
  actualPercent: number;
  targetPercent: number;
  diffPercent: number;
  rebalanceAmount: number; // positive = buy more, negative = trim/sell
  expectedReturnPercent: number;
  isToleranceExceeded: boolean; // Math.abs(diffPercent) > 5.0%
  dcaRecommendedAmount?: number;
}

export function isGpfAsset(a: Asset): boolean {
  if (a.isGpf) return true;
  const name = (a.name || '').toLowerCase();
  const inst = (a.institution || '').toLowerCase();
  return name.includes('กบข') || name.includes('gpf') || inst.includes('กบข') || inst.includes('gpf');
}

export interface PortfolioExpectedReturnInfo {
  expectedAnnualReturnPercent: number;
  expectedAnnualProfitTHB: number;
  realReturnPercent: number;
  inflationRatePercent: number;
  fiveYearFV: number;
  tenYearFV: number;
  retirementYearFV: number;
  retirementYear: number;
  yearsToRetire: number;
  monthlyDcaBudget: number;
}

export function calculateFutureValue(
  principal: number,
  monthlyDca: number,
  annualRatePercent: number,
  years: number
): number {
  const r = annualRatePercent / 100;
  const n = 12;
  const t = years;
  if (r <= 0) {
    return principal + monthlyDca * n * t;
  }
  const monthlyRate = r / n;
  const totalMonths = n * t;
  const fvPrincipal = principal * Math.pow(1 + monthlyRate, totalMonths);
  const fvAnnuity = monthlyDca * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
  return Math.round((fvPrincipal + fvAnnuity) * 100) / 100;
}

export function calculatePortfolioAllocation(
  assets: Asset[],
  profile: UserProfile
): {
  allocations: CategoryAllocation[];
  totalInvested: number;
  totalGpfValue: number;
  gpfPlan: GpfPlanWeights;
  expectedReturnInfo: PortfolioExpectedReturnInfo;
} {
  const usdRate = profile.usdToThbRate || 36.5;
  const totalInvested = assets.reduce((sum, a) => {
    return sum + (a.isUSD ? (a.amountUSD || 0) * usdRate : (a.amountTHB || 0));
  }, 0);

  const targetMap: Record<AssetCategory, number> = {
    '1. เงินสดและเทียบเท่า': profile.targetCashPercent || 10,
    '2. กองทุนรวมไทย': profile.targetThaiFundPercent || 20,
    '3. กองทุนรวมต่างประเทศ': profile.targetForeignFundPercent || 20,
    '4. หุ้นไทย': profile.targetThaiStockPercent || 20,
    '5. หุ้นต่างประเทศ': profile.targetForeignStockPercent || 20,
    '6. พอร์ต FOREX และอื่นๆ': profile.targetForexPercent || 10,
  };

  const expectedReturnMap: Record<AssetCategory, number> = {
    '1. เงินสดและเทียบเท่า': profile.expectedReturnCash ?? 1.5,
    '2. กองทุนรวมไทย': profile.expectedReturnThaiFund ?? 4.5,
    '3. กองทุนรวมต่างประเทศ': profile.expectedReturnForeignFund ?? 8.0,
    '4. หุ้นไทย': profile.expectedReturnThaiStock ?? 7.0,
    '5. หุ้นต่างประเทศ': profile.expectedReturnForeignStock ?? 9.0,
    '6. พอร์ต FOREX และอื่นๆ': profile.expectedReturnForex ?? 6.0,
  };

  const monthlyDcaBudget = profile.monthlyDcaBudget || 10000;
  const gpfPlan = profile.gpfPlan || DEFAULT_GPF_PLAN;

  // Separate non-GPF assets vs GPF assets
  const nonGpfAssets = assets.filter((a) => !isGpfAsset(a));
  const gpfAssets = assets.filter((a) => isGpfAsset(a));

  const totalGpfValue = gpfAssets.reduce((sum, a) => {
    return sum + (a.isUSD ? (a.amountUSD || 0) * usdRate : (a.amountTHB || 0));
  }, 0);

  // GPF Look-Through Weight Map
  const gpfWeightMap: Record<AssetCategory, number> = {
    '1. เงินสดและเทียบเท่า': (gpfPlan.cashPercent || 0) / 100,
    '2. กองทุนรวมไทย': (gpfPlan.thaiBondPercent || 0) / 100,
    '3. กองทุนรวมต่างประเทศ': (gpfPlan.foreignBondPercent || 0) / 100,
    '4. หุ้นไทย': (gpfPlan.thaiStockPercent || 0) / 100,
    '5. หุ้นต่างประเทศ': (gpfPlan.foreignStockPercent || 0) / 100,
    '6. พอร์ต FOREX และอื่นๆ': (gpfPlan.goldPercent || 0) / 100,
  };

  // 1. Initial Category Allocations with Look-Through Decomposition
  let rawAllocations = ASSET_CATEGORIES.map((meta) => {
    const catDirectAssets = nonGpfAssets.filter((a) => a.category === meta.key);
    const directValue = catDirectAssets.reduce((sum, a) => {
      return sum + (a.isUSD ? (a.amountUSD || 0) * usdRate : (a.amountTHB || 0));
    }, 0);

    const gpfWeight = gpfWeightMap[meta.key] || 0;
    const gpfDecomposedValue = Math.round(totalGpfValue * gpfWeight * 100) / 100;
    const currentValue = directValue + gpfDecomposedValue;

    const actualPercent =
      totalInvested > 0 ? (currentValue / totalInvested) * 100 : 0;
    const targetPercent = targetMap[meta.key] || meta.defaultTargetPercent;
    const diffPercent = actualPercent - targetPercent;
    const targetValue = (targetPercent / 100) * totalInvested;
    const rebalanceAmount = targetValue - currentValue;
    const expectedReturnPercent = expectedReturnMap[meta.key] ?? meta.defaultExpectedReturnPercent;
    const isToleranceExceeded = Math.abs(diffPercent) > 5.0;

    return {
      category: meta.key,
      shortName: meta.shortName,
      color: meta.color,
      currentValue,
      directValue,
      gpfDecomposedValue,
      actualPercent,
      targetPercent,
      diffPercent,
      rebalanceAmount,
      expectedReturnPercent,
      isToleranceExceeded,
    };
  });

  // 2. Smart DCA Inflow Distribution:
  // Allocate monthlyDcaBudget preferentially to underweight categories (diffPercent < 0)
  const deficitAllocations = rawAllocations.filter((a) => a.rebalanceAmount > 0);
  const totalDeficit = deficitAllocations.reduce((sum, a) => sum + a.rebalanceAmount, 0);

  const allocations: CategoryAllocation[] = rawAllocations.map((alloc) => {
    let dcaRecommendedAmount = 0;
    if (totalDeficit > 0 && alloc.rebalanceAmount > 0) {
      dcaRecommendedAmount = Math.round((alloc.rebalanceAmount / totalDeficit) * monthlyDcaBudget * 100) / 100;
    } else {
      // If fully balanced or no deficit, allocate by target percentage
      dcaRecommendedAmount = Math.round(((alloc.targetPercent / 100) * monthlyDcaBudget) * 100) / 100;
    }
    return {
      ...alloc,
      dcaRecommendedAmount,
    };
  });

  // 3. Expected Annual Return Calculation (MPT Weighted Average)
  // E(Rp) = sum( TargetWeight_i * E(R_i) )
  const expectedAnnualReturnPercent = allocations.reduce((sum, a) => {
    return sum + (a.targetPercent / 100) * a.expectedReturnPercent;
  }, 0);

  const roundedExpectedReturn = Math.round(expectedAnnualReturnPercent * 100) / 100;
  const expectedAnnualProfitTHB = Math.round(totalInvested * (roundedExpectedReturn / 100) * 100) / 100;

  const inflationRatePercent = 2.0; // ค่าเฉลี่ยเงินเฟ้อระยะยาวของไทย
  const realReturnPercent = Math.round((roundedExpectedReturn - inflationRatePercent) * 100) / 100;

  // 4. Future Value Retirement Projections
  const retirementYear = 2588;
  const currentYear = 2569;
  const yearsToRetire = Math.max(1, retirementYear - currentYear); // 19 years

  const fiveYearFV = calculateFutureValue(totalInvested, monthlyDcaBudget, roundedExpectedReturn, 5);
  const tenYearFV = calculateFutureValue(totalInvested, monthlyDcaBudget, roundedExpectedReturn, 10);
  const retirementYearFV = calculateFutureValue(totalInvested, monthlyDcaBudget, roundedExpectedReturn, yearsToRetire);

  const expectedReturnInfo: PortfolioExpectedReturnInfo = {
    expectedAnnualReturnPercent: roundedExpectedReturn,
    expectedAnnualProfitTHB,
    realReturnPercent,
    inflationRatePercent,
    fiveYearFV,
    tenYearFV,
    retirementYearFV,
    retirementYear,
    yearsToRetire,
    monthlyDcaBudget,
  };

  return { allocations, totalInvested, totalGpfValue, gpfPlan, expectedReturnInfo };
}

export interface RevenueCategoryBreakdown {
  categoryCode: string;
  categoryName: string;
  grossAmount: number;
  expenseRateText: string;
  expenseDeduction: number;
  netIncomeAfterExpense: number;
}

export interface TaxDeductionBreakdown {
  name: string;
  amount: number;
  maxCapText?: string;
  note?: string;
}

export interface TaxAssessmentResult {
  salaryAnnual: number;
  rentIncomeGross: number;
  rentExpenseDeduction: number;
  rentIncomeNet: number;
  dividendGross: number;
  dividendWithheld: number;
  dividendTaxCredit: number;
  dividendNetReceived: number;
  totalGrossIncome: number;
  totalExpenseDeduction: number;
  totalIncomeAfterExpense: number;
  standardExpenseDeduction: number;
  personalAllowance: number;
  gpfDeduction: number;
  gpfItemsCount: number;
  thaiEsgDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netTaxableIncome: number;
  computedTax: number;
  taxPaidWithheld: number;
  dividendTaxCreditAmount: number;
  netTaxPayableOrRefund: number; // positive = pay more, negative = refund
  taxBracketBreakdown: {
    bracket: string;
    rate: number;
    amountInBracket: number;
    tax: number;
  }[];
  marginalTaxRatePercent: number;
  revenueCategoriesList: RevenueCategoryBreakdown[];
  deductionsList: TaxDeductionBreakdown[];
  dividendComparison?: {
    withDividendsRefund: number;
    withoutDividendsRefund: number;
    advantageAmount: number;
    recommendInclude: boolean;
    recommendationText: string;
  };
}

export function calculateTaxAssessment(
  journalEntries: JournalEntry[],
  taxItems: TaxItem[],
  profile: UserProfile,
  includeDividendsInAssessment: boolean = true
): TaxAssessmentResult {
  // 1. Income 40(1) Salary
  const salaryJournal = journalEntries
    .filter(
      (e) =>
        e.type === 'รับเงิน (รายได้)' &&
        (e.revenueCategory?.includes('40(1)') || e.title.includes('เงินเดือน'))
    )
    .reduce((sum, e) => sum + e.amount, 0);

  const salaryAnnual =
    salaryJournal > 0
      ? salaryJournal
      : (profile.currentMonthlySalary || 0) * 12;

  // 40(1) Expense deduction: 50% max 100,000 THB
  const standardExpenseDeduction = Math.min(salaryAnnual * 0.5, 100000);
  const salaryNetAfterExpense = Math.max(0, salaryAnnual - standardExpenseDeduction);

  // 2. Income 40(5) Rent (เช่น ค่าเช่าผาผึ้ง)
  const rentEntries = journalEntries.filter(
    (e) =>
      e.type === 'รับเงิน (รายได้)' &&
      (e.revenueCategory?.includes('40(5)') || e.title.includes('ค่าเช่า') || e.title.includes('ผาผึ้ง'))
  );
  const rentIncomeGross = rentEntries.reduce((sum, e) => sum + e.amount, 0);
  // Rental of houses/buildings has a 30% standard expense deduction under Section 40(5)
  const rentExpenseDeduction = rentIncomeGross * 0.30;
  const rentIncomeNet = Math.max(0, rentIncomeGross - rentExpenseDeduction);

  // 3. Dividends 40(4)
  const dividendEntries = journalEntries.filter(
    (e) =>
      e.grossDividendAmount &&
      e.grossDividendAmount > 0 &&
      e.type === 'รับเงิน (รายได้)'
  );

  let dividendGross = 0;
  let dividendWithheld = 0;
  let dividendTaxCredit = 0;

  if (includeDividendsInAssessment) {
    dividendEntries.forEach((e) => {
      const gross = e.grossDividendAmount || e.amount;
      const corpRate = e.corporateTaxRatePercent || 20;
      dividendGross += gross;
      dividendWithheld += e.withholdingTaxAmount || gross * 0.1;
      dividendTaxCredit +=
        e.dividendTaxCreditAmount || (gross * corpRate) / (100 - corpRate);
    });
  }

  // 4. Other Revenue Categories (e.g. 40(2), 40(6), 40(8))
  const otherRevenueEntries = journalEntries.filter(
    (e) =>
      e.type === 'รับเงิน (รายได้)' &&
      !e.revenueCategory?.includes('40(1)') &&
      !e.title.includes('เงินเดือน') &&
      !e.revenueCategory?.includes('40(5)') &&
      !e.title.includes('ค่าเช่า') &&
      !e.title.includes('ผาผึ้ง') &&
      !e.grossDividendAmount
  );
  const otherRevenueGross = otherRevenueEntries.reduce((sum, e) => sum + e.amount, 0);
  const otherRevenueExpense = otherRevenueGross * 0.5; // default 50%
  const otherRevenueNet = Math.max(0, otherRevenueGross - otherRevenueExpense);

  const totalGrossIncome =
    salaryAnnual +
    rentIncomeGross +
    otherRevenueGross +
    (includeDividendsInAssessment ? dividendGross + dividendTaxCredit : 0);

  const totalExpenseDeduction =
    standardExpenseDeduction + rentExpenseDeduction + otherRevenueExpense;

  const totalIncomeAfterExpense =
    salaryNetAfterExpense +
    rentIncomeNet +
    otherRevenueNet +
    (includeDividendsInAssessment ? dividendGross + dividendTaxCredit : 0);

  // 5. Tax Deductions (ค่าลดหย่อนตามกฎหมาย)
  const personalAllowance = 60000;

  // GPF Deductions
  const gpfItems = taxItems.filter(
    (t) => t.deductionType === 'กบข.' || t.fundCode.toLowerCase().includes('gpf')
  );
  const gpfItemsCount = gpfItems.length;
  const gpfTotalDeduction = gpfItems.reduce((sum, t) => sum + t.amount, 0);
  // Cap at 30% of salary, max 500,000 THB (พ.ศ. 2569)
  const gpfCap = Math.min(salaryAnnual * 0.30, 500000);
  const gpfDeduction = Math.min(gpfTotalDeduction, gpfCap);

  // Thai ESG Deductions (Up to 30% of salary, max 300,000 THB)
  const thaiEsgItems = taxItems.filter(
    (t) => t.deductionType === 'ThaiESG' || t.fundCode.toLowerCase().includes('thaiesg')
  );
  const thaiEsgTotal = thaiEsgItems.reduce((sum, t) => sum + t.amount, 0);
  const thaiEsgCap = Math.min(salaryAnnual * 0.30, 300000);
  const thaiEsgDeduction = Math.min(thaiEsgTotal, thaiEsgCap);

  // Other tax items
  const otherItems = taxItems.filter(
    (t) =>
      t.deductionType !== 'กบข.' &&
      t.deductionType !== 'ThaiESG' &&
      !t.fundCode.toLowerCase().includes('gpf') &&
      !t.fundCode.toLowerCase().includes('thaiesg')
  );
  const otherDeductions = otherItems.reduce((sum, t) => sum + t.amount, 0);

  const totalDeductions =
    personalAllowance +
    gpfDeduction +
    thaiEsgDeduction +
    otherDeductions;

  const netTaxableIncome = Math.max(0, totalIncomeAfterExpense - totalDeductions);

  // Structured breakdown lists for UI display
  const revenueCategoriesList: RevenueCategoryBreakdown[] = [
    {
      categoryCode: 'มาตรา 40(1)',
      categoryName: 'เงินเดือนข้าราชการประจำปี',
      grossAmount: salaryAnnual,
      expenseRateText: 'หัก 50% (เพดานไม่เกิน 100,000 บาท)',
      expenseDeduction: standardExpenseDeduction,
      netIncomeAfterExpense: salaryNetAfterExpense,
    },
  ];

  if (rentIncomeGross > 0) {
    revenueCategoriesList.push({
      categoryCode: 'มาตรา 40(5)',
      categoryName: 'เงินได้จากการให้เช่าทรัพย์สิน (ค่าเช่าผาผึ้ง/อาคาร/สิ่งปลูกสร้าง)',
      grossAmount: rentIncomeGross,
      expenseRateText: 'หักค่าใช้จ่ายเป็นการเหมา 30%',
      expenseDeduction: rentExpenseDeduction,
      netIncomeAfterExpense: rentIncomeNet,
    });
  }

  if (includeDividendsInAssessment && dividendGross > 0) {
    revenueCategoriesList.push({
      categoryCode: 'มาตรา 40(4)(ข)',
      categoryName: 'เงินปันผลหุ้นไทย (Gross-up รวมเครดิตภาษี ม.47 ทวิ)',
      grossAmount: dividendGross + dividendTaxCredit,
      expenseRateText: 'กฎหมายไม่ให้หักค่าใช้จ่าย (แต่ได้เครดิตภาษี)',
      expenseDeduction: 0,
      netIncomeAfterExpense: dividendGross + dividendTaxCredit,
    });
  }

  if (otherRevenueGross > 0) {
    revenueCategoriesList.push({
      categoryCode: 'เงินได้หมวดอื่นๆ',
      categoryName: 'รายได้อื่นๆ ที่บันทึกในระบบ',
      grossAmount: otherRevenueGross,
      expenseRateText: 'หักค่าใช้จ่ายตามเกณฑ์ 50%',
      expenseDeduction: otherRevenueExpense,
      netIncomeAfterExpense: otherRevenueNet,
    });
  }

  const deductionsList: TaxDeductionBreakdown[] = [
    {
      name: 'ค่าลดหย่อนส่วนตัวผู้มีเงินได้',
      amount: personalAllowance,
      maxCapText: 'ตามสิทธิตามกฎหมาย 60,000 บาท',
      note: 'สิทธิลดหย่อนพื้นฐานสำหรับผู้มีเงินได้ทุกคน',
    },
    {
      name: `เงินสะสม กบข. (${gpfItemsCount} งวด)`,
      amount: gpfDeduction,
      maxCapText: 'สูงสุด 30% ของเงินได้ (ไม่เกิน 500,000 บาท)',
      note: 'เงินสะสม กบข. ภาคบังคับและออมเพิ่มที่หักจากเงินเดือน',
    },
  ];

  if (thaiEsgDeduction > 0) {
    deductionsList.push({
      name: 'กองทุนรวมไทยเพื่อความยั่งยืน (ThaiESG)',
      amount: thaiEsgDeduction,
      maxCapText: 'สูงสุด 30% ของเงินได้ (ไม่เกิน 300,000 บาท)',
      note: 'สิทธิลดหย่อนการลงทุน ThaiESG',
    });
  }

  if (otherDeductions > 0) {
    deductionsList.push({
      name: 'สิทธิลดหย่อนอื่นๆ เพิ่มเติม',
      amount: otherDeductions,
      maxCapText: 'ตามเกณฑ์สรรพากร',
      note: 'ประกันชีวิต, ดอกเบี้ยบ้าน หรือเงินบริจาค',
    });
  }

  // 4. Tax Brackets (Thailand Progressive Tax)
  const brackets = [
    { limit: 150000, rate: 0.0, label: '0 - 150,000 บาท' },
    { limit: 150000, rate: 0.05, label: '150,001 - 300,000 บาท' },
    { limit: 200000, rate: 0.10, label: '300,001 - 500,000 บาท' },
    { limit: 250000, rate: 0.15, label: '500,001 - 750,000 บาท' },
    { limit: 250000, rate: 0.20, label: '750,001 - 1,000,000 บาท' },
    { limit: 1000000, rate: 0.25, label: '1,000,001 - 2,000,000 บาท' },
    { limit: 3000000, rate: 0.30, label: '2,000,001 - 5,000,000 บาท' },
    { limit: Infinity, rate: 0.35, label: 'เกิน 5,000,000 บาท ขึ้นไป' },
  ];

  let remainingTaxable = netTaxableIncome;
  let computedTax = 0;
  let marginalTaxRatePercent = 0;
  const taxBracketBreakdown = [];

  for (const b of brackets) {
    if (remainingTaxable <= 0) {
      taxBracketBreakdown.push({
        bracket: b.label,
        rate: b.rate,
        amountInBracket: 0,
        tax: 0,
      });
      continue;
    }

    const chunk = Math.min(remainingTaxable, b.limit);
    const taxInChunk = chunk * b.rate;
    computedTax += taxInChunk;
    remainingTaxable -= chunk;
    marginalTaxRatePercent = Math.round(b.rate * 100);

    taxBracketBreakdown.push({
      bracket: b.label,
      rate: b.rate,
      amountInBracket: chunk,
      tax: taxInChunk,
    });
  }

  // 5. Withholding tax
  const taxWithheldFromJournal = journalEntries
    .filter((e) => e.title.includes('ภาษีหัก') || e.withholdingTaxAmount)
    .reduce(
      (sum, e) => sum + (e.withholdingTaxAmount || (e.title.includes('ภาษี') ? e.amount : 0)),
      0
    );

  const taxPaidWithheld =
    taxWithheldFromJournal > 0 ? taxWithheldFromJournal : 0;

  const netTaxPayableOrRefund =
    computedTax - taxPaidWithheld - (includeDividendsInAssessment ? dividendTaxCredit : 0);

  // 6. Side-by-Side Dividend Comparison Calculation
  let dividendComparison: TaxAssessmentResult['dividendComparison'] = undefined;
  if (dividendGross > 0) {
    // Calculate scenario without dividends
    const taxableNoDiv = Math.max(0, salaryAnnual - totalDeductions);
    let remNoDiv = taxableNoDiv;
    let taxNoDiv = 0;
    for (const b of brackets) {
      if (remNoDiv <= 0) break;
      const c = Math.min(remNoDiv, b.limit);
      taxNoDiv += c * b.rate;
      remNoDiv -= c;
    }
    const refundNoDiv = taxNoDiv - taxPaidWithheld;

    // Calculate scenario with dividends
    const taxableWithDiv = Math.max(0, salaryAnnual + dividendGross + dividendTaxCredit - totalDeductions);
    let remWithDiv = taxableWithDiv;
    let taxWithDiv = 0;
    for (const b of brackets) {
      if (remWithDiv <= 0) break;
      const c = Math.min(remWithDiv, b.limit);
      taxWithDiv += c * b.rate;
      remWithDiv -= c;
    }
    // Withholding tax for dividend (10%) is already paid and credited
    const refundWithDiv = taxWithDiv - taxPaidWithheld - dividendTaxCredit - dividendWithheld;

    // Advantage amount (negative means refund is greater)
    const advantageAmount = Math.abs(refundNoDiv - refundWithDiv);
    const recommendInclude = refundWithDiv < refundNoDiv; // refundWithDiv is more negative (bigger refund) or smaller tax

    dividendComparison = {
      withDividendsRefund: refundWithDiv,
      withoutDividendsRefund: refundNoDiv,
      advantageAmount,
      recommendInclude,
      recommendationText: recommendInclude
        ? `แนะนำให้นำเงินปันผลมารวมคำนวณภาษี เพราะฐานภาษีของท่าน (${marginalTaxRatePercent}%) ต่ำกว่าอัตราภาษีนิติบุคคล จะได้รับเงินคืนภาษีเพิ่มขึ้น ฿${advantageAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `แนะนำไม่นำเงินปันผลมารวมคำนวณ (เลือก Final Tax 10%) เพราะประหยัดภาษีกว่า ฿${advantageAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
  }

  const dividendNetReceived = Math.max(0, dividendGross - dividendWithheld);

  return {
    salaryAnnual,
    rentIncomeGross,
    rentExpenseDeduction,
    rentIncomeNet,
    dividendGross,
    dividendWithheld,
    dividendNetReceived,
    totalGrossIncome,
    totalExpenseDeduction,
    totalIncomeAfterExpense,
    standardExpenseDeduction,
    personalAllowance,
    gpfDeduction,
    gpfItemsCount,
    thaiEsgDeduction,
    otherDeductions,
    totalDeductions,
    netTaxableIncome,
    computedTax,
    taxPaidWithheld,
    dividendTaxCredit,
    dividendTaxCreditAmount: dividendTaxCredit,
    netTaxPayableOrRefund,
    taxBracketBreakdown,
    marginalTaxRatePercent,
    revenueCategoriesList,
    deductionsList,
    dividendComparison,
  };
}
