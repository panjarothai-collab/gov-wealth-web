// Financial Health Engine according to CFP, SET, and Thai Civil Servant Standards (พ.ศ. ๒๕๖๙)
import {
  Asset,
  Liability,
  JournalEntry,
  TaxItem,
  UserProfile,
  FinancialHealthReport,
  FinancialRatioDetail,
  ActionablePrescription,
  HealthStatusLevel,
} from '@/types/wealth';
import { parseAppleOrIsoDate } from './wealthEngine';

export function calculateFinancialHealth(
  assets: Asset[],
  liabilities: Liability[],
  journalEntries: JournalEntry[],
  taxItems: TaxItem[],
  profile: UserProfile,
  selectedYear: number = 2026 // พ.ศ. ๒๕๖๙
): FinancialHealthReport {
  const usdRate = profile.usdToThbRate || 36.5;

  // 1. Calculate Asset Totals
  const totalAssets = assets.reduce((sum, a) => {
    return sum + (a.isUSD ? (a.amountUSD || 0) * usdRate : (a.amountTHB || 0));
  }, 0);

  // Liquid assets = Category 1 (Cash & equivalents)
  const liquidAssetsTotal = assets
    .filter((a) => a.category === '1. เงินสดและเทียบเท่า')
    .reduce((sum, a) => {
      return sum + (a.isUSD ? (a.amountUSD || 0) * usdRate : (a.amountTHB || 0));
    }, 0);

  // 2. Calculate Liability Totals & Monthly Installments
  const totalLiabilities = liabilities.reduce(
    (sum, l) => sum + (l.totalOutstanding || 0),
    0
  );

  const monthlyLiabilitiesInstallment = liabilities.reduce(
    (sum, l) => sum + (l.monthlyInstallment || 0),
    0
  );

  // 3. Analyze Cash Flow Journal (Hybrid: Real journal entries + baseline profile)
  // Filter entries for the target year (or all if target year has few)
  const targetYearEntries = journalEntries.filter((e) => {
    const d = parseAppleOrIsoDate(e.date);
    return d.getFullYear() === selectedYear;
  });

  const activeEntries = targetYearEntries.length > 5 ? targetYearEntries : journalEntries;

  // Calculate distinct months with recorded transactions
  const recordedMonthsSet = new Set<string>();
  activeEntries.forEach((e) => {
    const d = parseAppleOrIsoDate(e.date);
    recordedMonthsSet.add(`${d.getFullYear()}-${d.getMonth()}`);
  });
  const monthCount = Math.max(1, recordedMonthsSet.size);

  // Total recorded incomes & expenses
  const journalIncomes = activeEntries
    .filter((e) => e.type === 'รับเงิน (รายได้)')
    .reduce((sum, e) => sum + e.amount, 0);

  const journalExpenses = activeEntries
    .filter((e) => e.type === 'จ่ายเงิน (ค่าใช้จ่าย)')
    .reduce((sum, e) => sum + e.amount, 0);

  // Monthly baselines
  const baseSalary = profile.currentMonthlySalary || 50000;
  const monthlyIncomeBaseline =
    journalIncomes > 0 ? journalIncomes / monthCount : baseSalary;

  // Expenses baseline
  const monthlyExpenseBaseline =
    journalExpenses > 0 ? journalExpenses / monthCount : baseSalary * 0.45;

  // Monthly Debt baseline (from liability installments or journal debt repayments)
  const monthlyDebtBaseline = Math.max(
    monthlyLiabilitiesInstallment,
    activeEntries
      .filter(
        (e) =>
          e.type === 'จ่ายเงิน (ค่าใช้จ่าย)' &&
          (e.title.includes('ชำระหนี้') ||
            e.title.includes('เงินกู้') ||
            e.title.includes('ผ่อน'))
      )
      .reduce((sum, e) => sum + e.amount, 0) / monthCount
  );

  // Monthly Savings/Investments
  const gpfEmployeeMonthly = baseSalary * ((profile.gpfRatePercent || 3) / 100);
  const journalInvestments = activeEntries
    .filter(
      (e) =>
        e.title.includes('DCA') ||
        e.title.includes('กองทุน') ||
        e.title.includes('กบข.') ||
        e.title.includes('ออม') ||
        e.title.includes('หุ้นสหกรณ์')
    )
    .reduce((sum, e) => sum + e.amount, 0) / monthCount;

  const monthlySavingsInvestments = Math.max(
    gpfEmployeeMonthly,
    gpfEmployeeMonthly + journalInvestments
  );

  // Passive Income (Dividends, Interests)
  const passiveEntries = activeEntries.filter(
    (e) =>
      e.type === 'รับเงิน (รายได้)' &&
      (e.grossDividendAmount ||
        e.title.includes('ปันผล') ||
        e.title.includes('ดอกเบี้ย'))
  );
  const totalPassive = passiveEntries.reduce(
    (sum, e) => sum + (e.grossDividendAmount || e.amount),
    0
  );
  const monthlyPassiveIncome = totalPassive > 0 ? totalPassive / monthCount : 0;

  // -------------------------------------------------------------
  // 4. Calculate the 5 Standard Academic Ratios
  // -------------------------------------------------------------

  // 4.1 Basic Liquidity Ratio (Months of expenses)
  const basicLiquidityVal =
    monthlyExpenseBaseline > 0
      ? liquidAssetsTotal / monthlyExpenseBaseline
      : 12;
  let basicLiquidityStatus: HealthStatusLevel = 'DANGER';
  let basicLiquidityScore = 30;

  if (basicLiquidityVal >= 6) {
    basicLiquidityStatus = 'EXCELLENT';
    basicLiquidityScore = 100;
  } else if (basicLiquidityVal >= 3) {
    basicLiquidityStatus = 'WARNING';
    basicLiquidityScore = 70 + ((basicLiquidityVal - 3) / 3) * 25;
  } else {
    basicLiquidityStatus = 'DANGER';
    basicLiquidityScore = Math.max(10, (basicLiquidityVal / 3) * 60);
  }

  const basicLiquidity: FinancialRatioDetail = {
    id: 'basic-liquidity',
    nameTh: 'อัตราส่วนสภาพคล่องพื้นฐาน',
    nameEn: 'Basic Liquidity Ratio',
    value: basicLiquidityVal,
    unit: 'เท่า (เดือน)',
    formattedValue: `${basicLiquidityVal.toFixed(1)} เดือน`,
    benchmarkText: 'เกณฑ์มาตรฐาน: ๓.๐ – ๖.๐ เดือน',
    status: basicLiquidityStatus,
    score: Math.round(basicLiquidityScore),
    civilServantNote:
      'ข้าราชการมีรายได้มั่นคงต่อเนื่อง แนะนำสำรองเงินสดฉุกเฉินอย่างน้อย ๓ – ๖ เท่าของค่าใช้จ่ายรายเดือน',
    academicRationale:
      'รองรับเหตุฉุกเฉินโดยไม่ต้องกู้หนี้ยืมสินหรือขายสินทรัพย์ลงทุนในภาวะตลาดตกต่ำ',
  };

  // 4.2 Debt Service Ratio (DSR) & Net Remaining Income Check
  const dsrVal =
    monthlyIncomeBaseline > 0
      ? (monthlyDebtBaseline / monthlyIncomeBaseline) * 100
      : 0;
  let dsrStatus: HealthStatusLevel = 'DANGER';
  let dsrScore = 20;

  if (dsrVal <= 35) {
    dsrStatus = 'EXCELLENT';
    dsrScore = 100;
  } else if (dsrVal <= 50) {
    dsrStatus = 'WARNING';
    dsrScore = 60 + ((50 - dsrVal) / 15) * 35;
  } else {
    dsrStatus = 'DANGER';
    dsrScore = Math.max(10, 60 - (dsrVal - 50) * 1.5);
  }

  const netRemainingIncomePercent = Math.max(0, 100 - dsrVal);

  const debtServiceRatio: FinancialRatioDetail = {
    id: 'debt-service-ratio',
    nameTh: 'อัตราส่วนภาระชำระหนี้ต่อรายได้ (DSR)',
    nameEn: 'Debt Service Ratio (DSR)',
    value: dsrVal,
    unit: '%',
    formattedValue: `${dsrVal.toFixed(1)}%`,
    benchmarkText: 'เกณฑ์มาตรฐาน: ไม่ควรเกิน ๓๕% (คงเหลือสุทธิ ≥ ๓๐%)',
    status: dsrStatus,
    score: Math.round(dsrScore),
    civilServantNote: `เงินได้สุทธิคงเหลือจ่ายจริงอยู่ที่ ${netRemainingIncomePercent.toFixed(
      1
    )}% (ระเบียบกระทรวงการคลัง/สหกรณ์กำหนดไม่น้อยกว่า ๓๐%)`,
    academicRationale:
      'หาก DSR เกิน ๔๐-๕๐% จะเริ่มกระทบสภาพคล่องและเสี่ยงต่อการก่อหนี้หมุนเวียน',
  };

  // 4.3 Savings Ratio
  const savingsVal =
    monthlyIncomeBaseline > 0
      ? (monthlySavingsInvestments / monthlyIncomeBaseline) * 100
      : 0;
  let savingsStatus: HealthStatusLevel = 'DANGER';
  let savingsScore = 20;

  if (savingsVal >= 30) {
    savingsStatus = 'EXCELLENT';
    savingsScore = 100;
  } else if (savingsVal >= 20) {
    savingsStatus = 'WARNING';
    savingsScore = 70 + ((savingsVal - 20) / 10) * 25;
  } else {
    savingsStatus = 'DANGER';
    savingsScore = Math.max(10, (savingsVal / 20) * 65);
  }

  const savingsRatio: FinancialRatioDetail = {
    id: 'savings-ratio',
    nameTh: 'อัตราส่วนการออมและการลงทุน',
    nameEn: 'Savings & Investment Ratio',
    value: savingsVal,
    unit: '%',
    formattedValue: `${savingsVal.toFixed(1)}%`,
    benchmarkText: 'เกณฑ์มาตรฐาน: ≥ ๒๐% (ระดับยอดเยี่ยม ≥ ๓๐%)',
    status: savingsStatus,
    score: Math.round(savingsScore),
    civilServantNote: `อัตราสะสม กบข. ปัจจุบัน ${profile.gpfRatePercent || 3}% (สามารถเพิ่มได้สูงสุดถึง ๓๐% เพื่อลดหย่อนภาษี)`,
    academicRationale:
      'การออมสม่ำเสมออย่างน้อย ๒๐-๓๐% ช่วยการันตีความเพียงพอของเงินทุนหลังเกษียณอายุ',
  };

  // 4.4 Debt to Asset Ratio
  const deVal =
    totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
  let deStatus: HealthStatusLevel = 'DANGER';
  let deScore = 20;

  if (deVal <= 30) {
    deStatus = 'EXCELLENT';
    deScore = 100;
  } else if (deVal <= 50) {
    deStatus = 'WARNING';
    deScore = 70 + ((50 - deVal) / 20) * 25;
  } else {
    deStatus = 'DANGER';
    deScore = Math.max(10, 70 - (deVal - 50) * 1.4);
  }

  const debtToAssetRatio: FinancialRatioDetail = {
    id: 'debt-to-asset',
    nameTh: 'อัตราส่วนหนี้สินต่อสินทรัพย์รวม',
    nameEn: 'Debt to Asset Ratio',
    value: deVal,
    unit: '%',
    formattedValue: `${deVal.toFixed(1)}%`,
    benchmarkText: 'เกณฑ์มาตรฐาน: ไม่ควรเกิน ๕๐% (ปลอดภัยสูง ≤ ๓๐%)',
    status: deStatus,
    score: Math.round(deScore),
    civilServantNote:
      'สะท้อนสัดส่วนความเป็นเจ้าของในทรัพย์สิน ปลอดภาระผูกพันมากกว่าครึ่งหนึ่ง',
    academicRationale:
      'ยิ่งอัตราส่วนต่ำ แปลว่างบดุลมีความมั่นคงสูง ทนทานต่อวิกฤตเศรษฐกิจ',
  };

  // 4.5 Survival / Wealth Ratio
  const survivalVal =
    monthlyExpenseBaseline > 0
      ? monthlyPassiveIncome / monthlyExpenseBaseline
      : 0;
  let survivalStatus: HealthStatusLevel = 'DANGER';
  let survivalScore = 20;

  if (survivalVal >= 1.0) {
    survivalStatus = 'EXCELLENT';
    survivalScore = 100;
  } else if (survivalVal >= 0.3) {
    survivalStatus = 'WARNING';
    survivalScore = 50 + ((survivalVal - 0.3) / 0.7) * 45;
  } else {
    survivalStatus = 'DANGER';
    survivalScore = Math.max(5, (survivalVal / 0.3) * 45);
  }

  const survivalRatio: FinancialRatioDetail = {
    id: 'survival-ratio',
    nameTh: 'อัตราส่วนความอยู่รอดและความมั่งคั่ง',
    nameEn: 'Survival / Wealth Ratio',
    value: survivalVal,
    unit: 'เท่า',
    formattedValue: `${survivalVal.toFixed(2)} เท่า`,
    benchmarkText: 'เกณฑ์มาตรฐาน: ≥ ๑.๐ เท่า (มีอิสรภาพทางการเงิน)',
    status: survivalStatus,
    score: Math.round(survivalScore),
    civilServantNote:
      'รายได้ดอกเบี้ยและเงินปันผลสหกรณ์/หุ้น/กองทุน ที่เข้ามาเสริมเงินเดือนประจำ',
    academicRationale:
      'หากถึง ๑.๐ เท่า จะครอบคลุมค่าใช้จ่ายได้ทั้งหมดโดยไม่ต้องพึ่งพารายได้จากการทำงาน',
  };

  // -------------------------------------------------------------
  // 5. Overall Weighted Financial Health Score
  // Weights: Liquidity (20%), DSR (25%), Savings (25%), Debt/Asset (15%), Survival (15%)
  // -------------------------------------------------------------
  const overallScore = Math.round(
    basicLiquidity.score * 0.2 +
      debtServiceRatio.score * 0.25 +
      savingsRatio.score * 0.25 +
      debtToAssetRatio.score * 0.15 +
      survivalRatio.score * 0.15
  );

  let tierName = 'ความมั่นคงระดับสูงมาก (ยอดเยี่ยม)';
  let tierColor = 'text-emerald-700 dark:text-emerald-400';

  if (overallScore < 50) {
    tierName = 'มีความเสี่ยงทางการเงิน (ควรปรับปรุงเร่งด่วน)';
    tierColor = 'text-rose-600 dark:text-rose-400';
  } else if (overallScore < 75) {
    tierName = 'ความมั่นคงระดับปานกลาง (เฝ้าระวัง)';
    tierColor = 'text-amber-600 dark:text-amber-400';
  }

  // -------------------------------------------------------------
  // 6. Actionable Financial Prescriptions
  // -------------------------------------------------------------
  const prescriptions: ActionablePrescription[] = [];

  // Prescription 1: Emergency Fund
  const targetEmergencyFund = monthlyExpenseBaseline * 6;
  if (liquidAssetsTotal < targetEmergencyFund) {
    const gap = targetEmergencyFund - liquidAssetsTotal;
    prescriptions.push({
      id: 'p-emergency',
      type: 'EMERGENCY_FUND',
      title: 'เติมเงินสำรองสภาพคล่องฉุกเฉินให้ครบ ๖ เดือน',
      description: `ปัจจุบันมีเงินสดสำรองครอบคลุม ${basicLiquidityVal.toFixed(
        1
      )} เดือน ควรทยอยสะสมเงินสด/สลากออมสินเพิ่มอีกประมาณ ฿${gap.toLocaleString(
        'th-TH',
        { maximumFractionDigits: 0 }
      )} เพื่อให้อุ่นใจเมื่อเกิดเหตุฉุกเฉิน`,
      recommendedActionAmount: gap,
      priority: basicLiquidityVal < 3 ? 'HIGH' : 'MEDIUM',
    });
  }

  // Prescription 2: GPF Tax Optimization
  if ((profile.gpfRatePercent || 3) < 12) {
    const currentRate = profile.gpfRatePercent || 3;
    const recommendedNewRate = Math.min(15, currentRate + 5);
    const addedSavingMonthly =
      baseSalary * ((recommendedNewRate - currentRate) / 100);
    prescriptions.push({
      id: 'p-gpf',
      type: 'GPF_SAVINGS',
      title: `ปรับเพิ่มอัตราสะสม กบข. จาก ${currentRate}% เป็น ${recommendedNewRate}%`,
      description: `การเพิ่มเงินสะสม กบข. อีก ${recommendedNewRate - currentRate}% (ประมาณเดือนละ ฿${addedSavingMonthly.toLocaleString(
        'th-TH',
        { maximumFractionDigits: 0 }
      )}) จะช่วยเพิ่มเงินก้อนเกษียณอย่างก้าวกระโดด และนำไปหักลดหย่อนภาษีเงินได้บุคคลธรรมดาได้เต็มจำนวน`,
      recommendedActionAmount: addedSavingMonthly,
      priority: 'MEDIUM',
    });
  }

  // Prescription 3: Debt Paydown
  if (dsrVal > 35) {
    const excessDebtPerMonth =
      monthlyDebtBaseline - monthlyIncomeBaseline * 0.35;
    prescriptions.push({
      id: 'p-debt',
      type: 'DEBT_OPTIMIZATION',
      title: 'วางแผนลดภาระผ่อนหนี้สินรายเดือนให้ต่ำกว่า ๓๕%',
      description: `ภาระผ่อนชำระหนี้รายเดือนอยู่ที่ ${dsrVal.toFixed(
        1
      )}% แนะนำให้พิจารณาโปะหนี้ดอกเบี้ยสูงก่อน หรือขอปรับโครงสร้างหนี้/รีไฟแนนซ์สหกรณ์เพื่อลดยอดผ่อนลงประมาณ ฿${excessDebtPerMonth.toLocaleString(
        'th-TH',
        { maximumFractionDigits: 0 }
      )} ต่อเดือน`,
      recommendedActionAmount: excessDebtPerMonth,
      priority: dsrVal > 50 ? 'HIGH' : 'MEDIUM',
    });
  }

  // Prescription 4: Passive Income
  if (survivalVal < 0.5) {
    prescriptions.push({
      id: 'p-passive',
      type: 'PASSIVE_INCOME',
      title: 'สะสมสินทรัพย์ที่สร้างกระแสเงินสดรับ (Cash Flow Generator)',
      description:
        'เพื่อเตรียมพร้อมสู่อิสรภาพทางการเงิน แนะนำเพิ่มการลงทุนในหุ้นปันผล กองทุนรวมโครงสร้างพื้นฐาน/อสังหาริมทรัพย์ หรือหุ้นสหกรณ์ออมทรัพย์ เพื่อสร้างรายได้ Passive ครอบคลุมค่าใช้จ่ายประจำ',
      priority: 'INFO',
    });
  }

  return {
    overallScore,
    tierName,
    tierColor,
    calculatedAt: new Date().toISOString(),
    monthlyIncomeBaseline,
    monthlyExpenseBaseline,
    monthlyDebtBaseline,
    liquidAssetsTotal,
    totalAssets,
    totalLiabilities,
    ratios: {
      basicLiquidity,
      debtServiceRatio,
      savingsRatio,
      debtToAssetRatio,
      survivalRatio,
    },
    prescriptions,
  };
}
