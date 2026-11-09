'use client';

import React from 'react';
import { useWealth } from '@/context/WealthContext';
import { calculateFinancialHealth } from '@/lib/financialHealthEngine';
import { formatCurrency } from '@/lib/wealthEngine';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  CreditCard,
  PiggyBank,
  PieChart,
  Coins,
  ArrowRight,
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react';
import { FinancialRatioDetail, HealthStatusLevel } from '@/types/wealth';

export default function FinancialHealthView() {
  const { database, setActiveTab } = useWealth();

  if (!database) return null;

  const report = calculateFinancialHealth(
    database.assets,
    database.liabilities,
    database.journalEntries,
    database.taxItems,
    database.profile,
    2026 // พ.ศ. 2569
  );

  const getStatusBadge = (status: HealthStatusLevel) => {
    switch (status) {
      case 'EXCELLENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
            ผ่านเกณฑ์ยอดเยี่ยม
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400" />
            เฝ้าระวัง
          </span>
        );
      case 'DANGER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertCircle size={13} className="text-rose-600 dark:text-rose-400" />
            ต้องปรับปรุง
          </span>
        );
    }
  };

  const getRatioIcon = (id: string) => {
    switch (id) {
      case 'basic-liquidity':
        return Coins;
      case 'debt-service-ratio':
        return CreditCard;
      case 'savings-ratio':
        return PiggyBank;
      case 'debt-to-asset':
        return PieChart;
      case 'survival-ratio':
        return TrendingUp;
      default:
        return Activity;
    }
  };

  const ratioList: FinancialRatioDetail[] = [
    report.ratios.basicLiquidity,
    report.ratios.debtServiceRatio,
    report.ratios.savingsRatio,
    report.ratios.debtToAssetRatio,
    report.ratios.survivalRatio,
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Academic Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/60 mb-2">
            <ShieldCheck size={14} /> มาตรฐาน CFP • SET • การเงินข้าราชการไทย พ.ศ. 2569
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Activity className="text-emerald-600" /> ตรวจสุขภาพทางการเงิน (Financial Health Checkup)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            วิเคราะห์ 5 อัตราส่วนความมั่นคงทางการเงินและสมดุลหนี้สินตามหลักวิชาการสากล
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">รอบการประเมิน</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 justify-end">
              <Calendar size={14} className="text-emerald-600" /> ประจำปี พ.ศ. 2569
            </div>
          </div>
        </div>
      </div>

      {/* Health Score Overview & Financial Baseline Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Overall Score Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-7 rounded-3xl shadow-lg border border-slate-700/60 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400">
                คะแนนรวมสุขภาพการเงิน
              </span>
              <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-slate-300">
                ถ่วงน้ำหนัก 5 มิติ
              </span>
            </div>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-6xl font-black tracking-tight text-white font-mono">
                {report.overallScore}
              </span>
              <span className="text-xl font-bold text-slate-400">/ 100</span>
            </div>

            <div className="mt-3">
              <div className="text-base font-bold text-emerald-300">
                {report.tierName}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                โครงสร้างงบดุลและสภาพคล่องมีความมั่นคง สอดคล้องตามเกณฑ์ควบคุมภาระหนี้สินของข้าราชการ
              </p>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span>ฐานเงินเดือนข้าราชการ</span>
            <span className="font-bold text-white font-mono">
              ฿{formatCurrency(database.profile.currentMonthlySalary || 0)}
            </span>
          </div>
        </div>

        {/* 3 Monthly Baseline Stats */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase">
                รายได้เฉลี่ยต่อเดือน
              </div>
              <div className="mt-2 text-xl font-black text-slate-900 dark:text-white font-mono">
                ฿{formatCurrency(report.monthlyIncomeBaseline)}
              </div>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-3">
              ดึงจากสมุดรายรับ + ฐานเงินเดือน
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase">
                ค่าใช้จ่ายเฉลี่ยต่อเดือน
              </div>
              <div className="mt-2 text-xl font-black text-slate-900 dark:text-white font-mono">
                ฿{formatCurrency(report.monthlyExpenseBaseline)}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-3">
              ค่าใช้จ่ายดำเนินชีวิตประจำวัน
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase">
                ภาระผ่อนหนี้สินต่อเดือน
              </div>
              <div className="mt-2 text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
                ฿{formatCurrency(report.monthlyDebtBaseline)}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-3">
              ยอดผ่อนชำระหนี้สินทุกสถาบัน
            </div>
          </div>
        </div>
      </div>

      {/* 5 Academic Ratios Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span>การประเมิน 5 อัตราส่วนมาตรฐานวิชาการ</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ratioList.map((ratio) => {
            const Icon = getRatioIcon(ratio.id);
            return (
              <div
                key={ratio.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700/60 transition group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Icon size={20} />
                    </div>
                    {getStatusBadge(ratio.status)}
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {ratio.nameTh}
                    </div>
                    <div className="text-xs text-slate-400">{ratio.nameEn}</div>
                  </div>

                  {/* Value & Score */}
                  <div className="mt-3 flex items-baseline justify-between">
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {ratio.formattedValue}
                    </div>
                    <div className="text-xs font-bold text-slate-500 font-mono">
                      คะแนน {ratio.score}/100
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        ratio.status === 'EXCELLENT'
                          ? 'bg-emerald-500'
                          : ratio.status === 'WARNING'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, ratio.score))}%` }}
                    />
                  </div>

                  <div className="mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md">
                    {ratio.benchmarkText}
                  </div>
                </div>

                {/* Footnotes */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-[11px]">
                  <div className="text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                    <Info size={12} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-700 dark:text-slate-200">
                        เกณฑ์ข้าราชการ:
                      </strong>{' '}
                      {ratio.civilServantNote}
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[10.5px] italic">
                    หลักวิชาการ: {ratio.academicRationale}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actionable Financial Prescription ("ใบสั่งยาทางการเงิน") */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                ข้อเสนอแนะเชิงรุก (Actionable Financial Prescription)
              </h2>
              <p className="text-xs text-slate-500">
                แนวทางปฏิบัติการเงินเชิงรุกเพื่อยกระดับความมั่นคงและสิทธิประโยชน์ทางภาษี
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {report.prescriptions.map((p) => (
            <div
              key={p.id}
              className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                p.priority === 'HIGH'
                  ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900'
                  : p.priority === 'MEDIUM'
                  ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
                  : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-800'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      p.priority === 'HIGH'
                        ? 'bg-rose-600 text-white'
                        : p.priority === 'MEDIUM'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-500 text-white'
                    }`}
                  >
                    {p.priority === 'HIGH'
                      ? 'เร่งด่วน'
                      : p.priority === 'MEDIUM'
                      ? 'แนะนำปฏิบัติ'
                      : 'เสริมความมั่งคั่ง'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {p.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
                  {p.description}
                </p>
              </div>

              {p.type === 'GPF_SAVINGS' && (
                <button
                  onClick={() => setActiveTab('tax')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 transition"
                >
                  ดูแผนภาษี & กบข. <ArrowRight size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
