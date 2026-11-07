'use client';

import React, { useState, useRef } from 'react';
import { useWealth } from '@/context/WealthContext';
import { formatCurrency } from '@/lib/wealthEngine';
import {
  Settings,
  Upload,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  User,
  Building,
  CreditCard,
  Plus,
  Trash2,
  Database,
  Shield,
} from 'lucide-react';

export default function SettingsAndImportView() {
  const {
    database,
    updateProfile,
    importDatabase,
    exportDatabase,
    resetDatabase,
    clearAllData,
  } = useWealth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Profile edit states
  const [fullName, setFullName] = useState(database?.profile.fullName || '');
  const [org, setOrg] = useState(database?.profile.organization || '');
  const [rank, setRank] = useState(database?.profile.rank || '');
  const [salary, setSalary] = useState(database?.profile.currentMonthlySalary || 0);
  const [gpfRate, setGpfRate] = useState(database?.profile.gpfRatePercent || 10);
  const [usdRate, setUsdRate] = useState(database?.profile.usdToThbRate || 36.5);
  const [savedProfileMsg, setSavedProfileMsg] = useState(false);

  // Preset accounts
  const [newAccountPreset, setNewAccountPreset] = useState('');

  if (!database) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const ok = await importDatabase(parsed);
      if (ok) {
        setImportStatus({
          success: true,
          message: `นำเข้าข้อมูลสำเร็จเรียบร้อย! (สินทรัพย์ ${parsed.assets?.length || 0} รายการ, หนี้สิน ${parsed.liabilities?.length || 0} รายการ, สมุดรายวัน ${parsed.journalEntries?.length || 0} รายการ, กบข. ${parsed.taxItems?.length || 0} รายการ)`,
        });
      } else {
        setImportStatus({
          success: false,
          message: 'รูปแบบไฟล์ไม่ถูกต้อง กรุณาใช้ไฟล์ wealth_database_v2.json',
        });
      }
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: `เกิดข้อผิดพลาดในการอ่านไฟล์: ${err.message}`,
      });
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName,
      organization: org,
      rank,
      currentMonthlySalary: parseFloat(salary as any) || 0,
      gpfRatePercent: parseFloat(gpfRate as any) || 10,
      usdToThbRate: parseFloat(usdRate as any) || 36.5,
    });
    setSavedProfileMsg(true);
    setTimeout(() => setSavedProfileMsg(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="text-emerald-600" size={24} />
          ตั้งค่าผู้ใช้ & นำเข้าข้อมูลระบบ (Settings & One-Click Import)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          จัดการไฟล์ฐานข้อมูล สำรองข้อมูล ปรับแต่งโปรไฟล์ และกำหนดค่าระบบ
        </p>
      </div>

      {/* One-Click Import & Export Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Database className="text-emerald-600" size={18} />
          การสำรองและนำเข้าข้อมูล (One-Click Migration)
        </h2>

        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl p-4 mb-4 flex items-start gap-3">
          <Shield className="text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" size={18} />
          <div className="text-xs text-slate-700 dark:text-slate-300">
            <span className="font-bold">สถานะฐานข้อมูลปัจจุบัน:</span>{' '}
            มีสินทรัพย์ {database.assets.length} รายการ, หนี้สิน {database.liabilities.length} รายการ,{' '}
            สมุดรายวัน {database.journalEntries.length} รายการ, และสิทธิ กบข./ภาษี {database.taxItems.length} รายการ
          </div>
        </div>

        {importStatus && (
          <div className={`p-4 rounded-xl text-xs mb-4 flex items-center gap-2 ${
            importStatus.success
              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200'
              : 'bg-rose-100 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200'
          }`}>
            {importStatus.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {importStatus.message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Import Button & Dropzone */}
          <div className="border-2 border-dashed border-emerald-300 dark:border-emerald-800 rounded-2xl p-6 text-center hover:bg-emerald-50/30 transition flex flex-col items-center justify-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 mb-3">
              <Upload size={22} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              นำเข้าไฟล์ wealth_database_v2.json
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              อัปโหลดไฟล์สำรองข้อมูลจาก Mac เพื่อซิงค์ขึ้นระบบเว็บทันที
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
            >
              เลือกไฟล์ JSON นำเข้า
            </button>
          </div>

          {/* Export Button */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-700 mb-3">
              <Download size={22} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              ส่งออกข้อมูลสำรอง (Export JSON)
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              ดาวน์โหลดไฟล์ฐานข้อมูลทั้งหมดเก็บไว้ในเครื่องเพื่อความปลอดภัย
            </p>
            <button
              onClick={exportDatabase}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold transition"
            >
              ดาวน์โหลดไฟล์สำรอง .json
            </button>
          </div>
        </div>
      </div>

      {/* User Profile Settings Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <User className="text-emerald-600" size={18} />
          ข้อมูลผู้ใช้และอัตราเงินเดือนข้าราชการ
        </h2>

        {savedProfileMsg && (
          <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} /> บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                ชื่อ-นามสกุล
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                ตำแหน่ง / สายงาน
              </label>
              <input
                type="text"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                หน่วยงานสังกัด
              </label>
              <input
                type="text"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                เงินเดือนปัจจุบัน (บาท)
              </label>
              <input
                type="number"
                step="0.01"
                value={salary}
                onChange={(e) => setSalary(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                อัตราสะสม กบข. ออมเพิ่ม (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={gpfRate}
                onChange={(e) => setGpfRate(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                อัตราแลกเปลี่ยน USD / THB
              </label>
              <input
                type="number"
                step="0.01"
                value={usdRate}
                onChange={(e) => setUsdRate(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
            >
              บันทึกการตั้งค่าโปรไฟล์
            </button>
          </div>
        </form>
      </div>

      {/* Clear All Data Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-rose-200 dark:border-rose-950/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-rose-700 dark:text-rose-400 text-sm flex items-center gap-1.5">
            <Trash2 size={16} /> ลบข้อมูลทั้งหมดเพื่อเริ่มบันทึกใหม่ (Clear All Data)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            ล้างข้อมูลสินทรัพย์ หนี้สิน รายการสมุดบัญชี และรายการลดหย่อนภาษีทั้งหมดให้เป็น ๐ เพื่อเริ่มต้นกรอกข้อมูลใหม่ตั้งแต่ต้น (ยังคงเก็บชื่อและตำแหน่งไว้)
          </p>
        </div>

        <button
          onClick={() => {
            if (
              confirm(
                '⚠️ ยืนยันการลบข้อมูลทั้งหมด?\n\nข้อมูลสินทรัพย์ หนี้สิน สมุดรายรับ-รายจ่าย และภาษีทั้งหมดจะถูกลบเป็น ๐ เพื่อให้ท่านเริ่มบันทึกข้อมูลใหม่ทั้งหมด'
              )
            ) {
              clearAllData();
              setImportStatus({
                success: true,
                message: 'ลบข้อมูลทั้งหมดเรียบร้อยแล้ว พร้อมสำหรับการบันทึกใหม่!',
              });
            }
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs shrink-0"
        >
          <Trash2 size={14} /> ลบข้อมูลทั้งหมด (เริ่มบันทึกใหม่)
        </button>
      </div>

      {/* Reset System Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            คืนค่าเริ่มต้นของระบบ (Reset to Defaults)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ล้างข้อมูลในเบราว์เซอร์และโหลดเทมเพลตข้อมูลตั้งต้นมาตรฐานปี พ.ศ. ๒๕๖๙
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('คุณแน่ใจหรือไม่ว่าต้องการคืนค่าเริ่มต้นทั้งหมด? ข้อมูลที่ไม่ได้บันทึกอาจสูญหาย')) {
              resetDatabase();
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
        >
          <RotateCcw size={14} /> คืนค่าเริ่มต้น
        </button>
      </div>
    </div>
  );
}
