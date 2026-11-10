'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  Asset,
  FullWealthDatabase,
  JournalEntry,
  Liability,
  TaxItem,
  UserProfile,
  PayrollDetails,
  DEFAULT_GPF_PLAN,
} from '@/types/wealth';
import { APPLE_EPOCH_OFFSET_SECONDS } from '@/lib/wealthEngine';
import { createClient } from '@/lib/supabase/client';

export type CloudSyncStatus = 'connected' | 'connecting' | 'needs_setup' | 'offline';

interface WealthContextType {
  database: FullWealthDatabase | null;
  isLoading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  updateAsset: (id: string, asset: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  addLiability: (liability: Omit<Liability, 'id'>) => void;
  updateLiability: (id: string, liability: Partial<Liability>) => void;
  deleteLiability: (id: string) => void;
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  addPayrollBatch: (details: PayrollDetails, date: string) => void;
  deleteJournalEntry: (id: string) => void;
  importDatabase: (importedData: any) => Promise<boolean>;
  exportDatabase: () => void;
  resetDatabase: () => void;
  clearAllData: () => void;
  // Supabase Cloud Sync
  cloudSyncStatus: CloudSyncStatus;
  isSyncing: boolean;
  lastCloudSync: Date | null;
  cloudSyncError: string | null;
  syncToCloud: () => Promise<boolean>;
  pullFromCloud: () => Promise<boolean>;
}

const LOCAL_STORAGE_KEY = 'gov_wealth_database_v2';
const VAULT_ID = 'nitat_personal_vault';

const WealthContext = createContext<WealthContextType | undefined>(undefined);

export function WealthProvider({ children }: { children: React.ReactNode }) {
  const [database, setDatabase] = useState<FullWealthDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTabState] = useState('balance');

  // Supabase Cloud Sync States
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('connecting');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastCloudSync, setLastCloudSync] = useState<Date | null>(null);
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);

  const databaseRef = useRef<FullWealthDatabase | null>(null);
  useEffect(() => {
    databaseRef.current = database;
  }, [database]);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Helper: push directly to Supabase
  const pushToSupabase = useCallback(async (dataToPush: FullWealthDatabase): Promise<boolean> => {
    try {
      setIsSyncing(true);
      const supabase = createClient();
      if (!supabase) {
        setCloudSyncStatus('offline');
        return false;
      }

      const { error } = await supabase.from('wealth_vault').upsert({
        id: VAULT_ID,
        data: dataToPush,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('not find')) {
          setCloudSyncStatus('needs_setup');
          setCloudSyncError('ยังไม่ได้สร้างตาราง wealth_vault ใน Supabase (กรุณารันคำสั่ง SQL)');
        } else {
          setCloudSyncError(error.message);
        }
        return false;
      }

      setLastCloudSync(new Date());
      setCloudSyncStatus('connected');
      setCloudSyncError(null);
      return true;
    } catch (err: any) {
      console.error('Supabase push error:', err);
      setCloudSyncError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อคลาวด์');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Helper: pull directly from Supabase
  const pullFromCloud = useCallback(async (): Promise<boolean> => {
    try {
      setIsSyncing(true);
      const supabase = createClient();
      if (!supabase) {
        setCloudSyncStatus('offline');
        return false;
      }

      const { data, error } = await supabase
        .from('wealth_vault')
        .select('*')
        .eq('id', VAULT_ID)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('not find')) {
          setCloudSyncStatus('needs_setup');
          setCloudSyncError('ยังไม่ได้สร้างตาราง wealth_vault ใน Supabase');
        } else {
          setCloudSyncError(error.message);
        }
        return false;
      }

      if (data && data.data) {
        const remoteDb = normalizeImportedData(data.data);
        setDatabase(remoteDb);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteDb));
        setLastCloudSync(new Date());
        setCloudSyncStatus('connected');
        setCloudSyncError(null);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Supabase pull error:', err);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const syncToCloud = useCallback(async (): Promise<boolean> => {
    if (!databaseRef.current) return false;
    return await pushToSupabase(databaseRef.current);
  }, [pushToSupabase]);

  // Load initial database & Connect to Supabase
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) {
        setActiveTabState(tabParam);
      }
    }

    async function initData() {
      let initialLocal: FullWealthDatabase | null = null;
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          initialLocal = JSON.parse(saved);
          setDatabase(initialLocal);
        } else {
          // Fallback: fetch seed database
          const res = await fetch('/default_wealth_database.json');
          if (res.ok) {
            const data = await res.json();
            const normalized = normalizeImportedData(data);
            initialLocal = normalized;
            setDatabase(normalized);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
          }
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setIsLoading(false);
      }

      // Check and sync with Supabase
      try {
        const supabase = createClient();
        if (!supabase) {
          setCloudSyncStatus('offline');
          return;
        }

        const { data, error } = await supabase
          .from('wealth_vault')
          .select('*')
          .eq('id', VAULT_ID)
          .maybeSingle();

        if (error) {
          if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('not find')) {
            setCloudSyncStatus('needs_setup');
            setCloudSyncError('ยังไม่ได้สร้างตาราง wealth_vault ใน Supabase');
          } else {
            setCloudSyncStatus('offline');
            setCloudSyncError(error.message);
          }
        } else if (data && data.data) {
          const remoteDb = normalizeImportedData(data.data);
          const remoteTime = remoteDb.exportedAt || 0;
          const localTime = initialLocal?.exportedAt || 0;

          // If remote is newer than local, update local
          if (remoteTime > localTime) {
            setDatabase(remoteDb);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteDb));
          } else if (localTime > remoteTime && initialLocal) {
            // Local is newer, update cloud
            await pushToSupabase(initialLocal);
          }
          setCloudSyncStatus('connected');
          setLastCloudSync(new Date());
        } else if (initialLocal) {
          // Cloud is empty, push local to cloud
          await pushToSupabase(initialLocal);
          setCloudSyncStatus('connected');
          setLastCloudSync(new Date());
        }

        // Setup Supabase Realtime WebSocket subscription
        const channel = supabase
          .channel('wealth_vault_realtime_sync')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'wealth_vault', filter: `id=eq.${VAULT_ID}` },
            (payload: any) => {
              if (payload.new && payload.new.data) {
                const incomingDb = normalizeImportedData(payload.new.data);
                const currentLocal = databaseRef.current;
                const incomingTime = incomingDb.exportedAt || 0;
                const currentLocalTime = currentLocal?.exportedAt || 0;

                // Only apply if incoming timestamp is newer to prevent infinite loops
                if (!currentLocal || incomingTime > currentLocalTime) {
                  setDatabase(incomingDb);
                  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(incomingDb));
                  setLastCloudSync(new Date());
                  setCloudSyncStatus('connected');
                }
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setCloudSyncStatus('connected');
            }
          });

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (cloudErr: any) {
        console.error('Supabase init error:', cloudErr);
      }
    }

    initData();
  }, [pushToSupabase]);

  // Save to localStorage whenever database changes & auto sync to Supabase
  const saveDatabase = (updated: FullWealthDatabase) => {
    const stamped: FullWealthDatabase = {
      ...updated,
      exportedAt: Date.now(),
    };
    setDatabase(stamped);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stamped));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    // Auto-sync in background to Supabase
    pushToSupabase(stamped);
  };

  const updateProfile = (profileUpdate: Partial<UserProfile>) => {
    if (!database) return;
    const updated: FullWealthDatabase = {
      ...database,
      profile: {
        ...database.profile,
        ...profileUpdate,
      },
    };
    saveDatabase(updated);
  };

  const addAsset = (asset: Omit<Asset, 'id'>) => {
    if (!database) return;
    const newAsset: Asset = {
      ...asset,
      id: crypto.randomUUID(),
    };
    const updated = {
      ...database,
      assets: [newAsset, ...database.assets],
    };
    saveDatabase(updated);
  };

  const updateAsset = (id: string, assetUpdate: Partial<Asset>) => {
    if (!database) return;
    const updated = {
      ...database,
      assets: database.assets.map((a) => (a.id === id ? { ...a, ...assetUpdate } : a)),
    };
    saveDatabase(updated);
  };

  const deleteAsset = (id: string) => {
    if (!database) return;
    const updated = {
      ...database,
      assets: database.assets.filter((a) => a.id !== id),
    };
    saveDatabase(updated);
  };

  const addLiability = (liability: Omit<Liability, 'id'>) => {
    if (!database) return;
    const newLiability: Liability = {
      ...liability,
      id: crypto.randomUUID(),
    };
    const updated = {
      ...database,
      liabilities: [newLiability, ...database.liabilities],
    };
    saveDatabase(updated);
  };

  const updateLiability = (id: string, liabilityUpdate: Partial<Liability>) => {
    if (!database) return;
    const updated = {
      ...database,
      liabilities: database.liabilities.map((l) => (l.id === id ? { ...l, ...liabilityUpdate } : l)),
    };
    saveDatabase(updated);
  };

  const deleteLiability = (id: string) => {
    if (!database) return;
    const updated = {
      ...database,
      liabilities: database.liabilities.filter((l) => l.id !== id),
    };
    saveDatabase(updated);
  };

  const addJournalEntry = (entry: Omit<JournalEntry, 'id'>) => {
    if (!database) return;
    const newEntry: JournalEntry = {
      ...entry,
      id: crypto.randomUUID(),
    };

    // If entry has tax tag, add to taxItems as well (Self-healing sync)
    let updatedTaxItems = [...database.taxItems];
    if (newEntry.taxDeductionTag && newEntry.taxDeductionTag !== 'ไม่ลดหย่อน') {
      const newTaxItem: TaxItem = {
        id: crypto.randomUUID(),
        date: newEntry.date,
        deductionType: newEntry.taxDeductionTag,
        fundCode: newEntry.title,
        amount: newEntry.amount,
        assetClassName: newEntry.debitAccountName || 'รายการลดหย่อน',
      };
      updatedTaxItems.unshift(newTaxItem);
    }

    // Smart Balance Sync: Update Assets and Liabilities in real-time
    let updatedAssets = [...database.assets];
    let updatedLiabilities = [...database.liabilities];

    if (newEntry.smartType === 'CREDIT_CARD_SPEND' && newEntry.targetLiabilityId) {
      // Swiping credit card increases liability balance
      updatedLiabilities = updatedLiabilities.map((l) =>
        l.id === newEntry.targetLiabilityId
          ? { ...l, totalOutstanding: (l.totalOutstanding || 0) + newEntry.amount }
          : l
      );
    } else if (newEntry.smartType === 'CREDIT_CARD_PAYMENT') {
      // Paying credit card reduces liability balance and reduces source asset balance
      if (newEntry.targetLiabilityId) {
        updatedLiabilities = updatedLiabilities.map((l) =>
          l.id === newEntry.targetLiabilityId
            ? { ...l, totalOutstanding: Math.max(0, (l.totalOutstanding || 0) - newEntry.amount) }
            : l
        );
      }
      if (newEntry.sourceAssetId) {
        updatedAssets = updatedAssets.map((a) =>
          a.id === newEntry.sourceAssetId
            ? { ...a, amountTHB: Math.max(0, (a.amountTHB || 0) - newEntry.amount) }
            : a
        );
      }
    } else if (newEntry.smartType === 'INVESTMENT_BUY') {
      // Buying stock/fund increases target portfolio asset and reduces source bank asset
      if (newEntry.targetAssetId) {
        updatedAssets = updatedAssets.map((a) =>
          a.id === newEntry.targetAssetId
            ? { ...a, amountTHB: (a.amountTHB || 0) + newEntry.amount }
            : a
        );
      }
      if (newEntry.sourceAssetId) {
        updatedAssets = updatedAssets.map((a) =>
          a.id === newEntry.sourceAssetId
            ? { ...a, amountTHB: Math.max(0, (a.amountTHB || 0) - newEntry.amount) }
            : a
        );
      }
    } else if (newEntry.type === 'โอนเงิน') {
      // Transfer money between two assets
      if (newEntry.sourceAssetId) {
        updatedAssets = updatedAssets.map((a) =>
          a.id === newEntry.sourceAssetId
            ? { ...a, amountTHB: Math.max(0, (a.amountTHB || 0) - newEntry.amount) }
            : a
        );
      }
      const destId = newEntry.targetAssetId || newEntry.destinationAssetID;
      if (destId) {
        updatedAssets = updatedAssets.map((a) =>
          a.id === destId
            ? { ...a, amountTHB: (a.amountTHB || 0) + newEntry.amount }
            : a
        );
      }
    } else {
      // Standard transaction asset balance sync
      if (newEntry.sourceAssetId) {
        updatedAssets = updatedAssets.map((a) => {
          if (a.id !== newEntry.sourceAssetId) return a;
          if (newEntry.type === 'รับเงิน (รายได้)') {
            return { ...a, amountTHB: (a.amountTHB || 0) + newEntry.amount };
          }
          if (newEntry.type === 'จ่ายเงิน (ค่าใช้จ่าย)') {
            return { ...a, amountTHB: Math.max(0, (a.amountTHB || 0) - newEntry.amount) };
          }
          return a;
        });
      }
    }

    const updated = {
      ...database,
      assets: updatedAssets,
      liabilities: updatedLiabilities,
      journalEntries: [newEntry, ...database.journalEntries],
      taxItems: updatedTaxItems,
    };
    saveDatabase(updated);
  };

  const addPayrollBatch = (details: PayrollDetails, date: string) => {
    if (!database) return;
    const nowIso = new Date(date).toISOString();
    const batchEntries: JournalEntry[] = [];
    const newTaxItems: TaxItem[] = [];

    // 1. Gross Salary (Income 40(1))
    batchEntries.push({
      id: crypto.randomUUID(),
      date: nowIso,
      type: 'รับเงิน (รายได้)',
      smartType: 'PAYROLL',
      title: 'เงินเดือนข้าราชการ (ยอดเต็ม)',
      amount: details.grossSalary,
      debitAccountName: 'บัญชีเงินเดือน',
      creditAccountName: 'รายได้เงินเดือน 40(1)',
      revenueCategory: '40(1) เงินเดือน',
      note: 'บันทึกผ่านตัวช่วยสลิปเงินเดือนข้าราชการ',
    });

    // 2. Withholding Tax (Prepaid tax)
    if (details.withholdingTax > 0) {
      batchEntries.push({
        id: crypto.randomUUID(),
        date: nowIso,
        type: 'จ่ายเงิน (ค่าใช้จ่าย)',
        smartType: 'PAYROLL',
        title: 'ภาษีหัก ณ ที่จ่าย ภ.ง.ด.1 (เงินเดือน)',
        amount: details.withholdingTax,
        debitAccountName: 'ภาษีหัก ณ ที่จ่ายสะสม',
        creditAccountName: 'บัญชีเงินเดือน',
        withholdingTaxAmount: details.withholdingTax,
        note: 'หักภาษี ณ ที่จ่ายตามสลิปเงินเดือน',
      });
    }

    // 3. GPF (กบข. ภาคบังคับ + สะสมเพิ่ม)
    const totalGpf = (details.gpfMandatory || 0) + (details.gpfVoluntary || 0);
    if (totalGpf > 0) {
      batchEntries.push({
        id: crypto.randomUUID(),
        date: nowIso,
        type: 'โอนเงิน',
        smartType: 'PAYROLL',
        title: 'หักเงินสะสม กบข. (ตามกฎหมาย+สะสมเพิ่ม)',
        amount: totalGpf,
        debitAccountName: 'พอร์ตลงทุนเพิ่ม: กบข.ไทย',
        creditAccountName: 'บัญชีเงินเดือน',
        taxDeductionTag: 'กบข.',
        note: 'หักเงินสะสม กบข. ประจำเดือน',
      });
      newTaxItems.push({
        id: crypto.randomUUID(),
        date: nowIso,
        deductionType: 'กบข.',
        fundCode: 'กบข. สะสมประจำเดือน',
        amount: totalGpf,
        assetClassName: 'กบข.ไทย',
      });
    }

    // 4. Coop Shares
    if (details.coopSavingShare > 0) {
      batchEntries.push({
        id: crypto.randomUUID(),
        date: nowIso,
        type: 'โอนเงิน',
        smartType: 'PAYROLL',
        title: 'หักเงินค่าหุ้น สหกรณ์ออมทรัพย์สาธารณสุข',
        amount: details.coopSavingShare,
        debitAccountName: 'พอร์ตลงทุนเพิ่ม: สหกรณ์ออมทรัพย์',
        creditAccountName: 'บัญชีเงินเดือน',
        note: 'ค่าหุ้นสหกรณ์ออมทรัพย์ประจำเดือน',
      });
    }

    // 5. Coop Loan Repayment
    if (details.coopLoanPayment > 0) {
      batchEntries.push({
        id: crypto.randomUUID(),
        date: nowIso,
        type: 'จ่ายเงิน (ค่าใช้จ่าย)',
        smartType: 'PAYROLL',
        title: 'หักชำระเงินกู้ สหกรณ์ออมทรัพย์',
        amount: details.coopLoanPayment,
        debitAccountName: 'ชำระหนี้เงินกู้สหกรณ์',
        creditAccountName: 'บัญชีเงินเดือน',
        note: 'หักผ่อนชำระหนี้สหกรณ์ตามสลิป',
      });
    }

    // 6. Deposit Net Salary into chosen Bank Account
    let updatedAssets = [...database.assets];
    if (details.depositAssetId && details.netSalary > 0) {
      updatedAssets = updatedAssets.map((a) =>
        a.id === details.depositAssetId
          ? { ...a, amountTHB: (a.amountTHB || 0) + details.netSalary }
          : a
      );
    }

    // Accumulate GPF into assets
    if (totalGpf > 0) {
      const gpfIdx = updatedAssets.findIndex(
        (a) => a.isGpf || a.name.toLowerCase().includes('กบข') || a.institution.toLowerCase().includes('กบข')
      );
      if (gpfIdx >= 0) {
        updatedAssets[gpfIdx] = {
          ...updatedAssets[gpfIdx],
          amountTHB: (updatedAssets[gpfIdx].amountTHB || 0) + totalGpf,
          isGpf: true,
        };
      } else {
        const plan = database.profile.gpfPlan;
        updatedAssets.push({
          id: crypto.randomUUID(),
          name: 'กองทุนบำเหน็จบำนาญข้าราชการ (กบข.)',
          category: '2. กองทุนรวมไทย',
          institution: 'กองทุนบำเหน็จบำนาญข้าราชการ (กบข.)',
          amountTHB: totalGpf,
          amountUSD: 0,
          isUSD: false,
          notes: `สะสมจากการหักเงินเดือน (แผน กบข. Look-Through: หุ้นไทย ${plan?.thaiStockPercent ?? 35}%, หุ้น ตปท. ${plan?.foreignStockPercent ?? 40}%, ทองคำ ${plan?.goldPercent ?? 25}%)`,
          isGpf: true,
        });
      }
    }

    // Accumulate Coop Shares into assets
    if (details.coopSavingShare > 0) {
      const coopIdx = updatedAssets.findIndex(
        (a) => a.name.includes('สหกรณ์') || a.institution.includes('สหกรณ์')
      );
      if (coopIdx >= 0) {
        updatedAssets[coopIdx] = {
          ...updatedAssets[coopIdx],
          amountTHB: (updatedAssets[coopIdx].amountTHB || 0) + details.coopSavingShare,
        };
      } else {
        updatedAssets.push({
          id: crypto.randomUUID(),
          name: 'หุ้นสหกรณ์ออมทรัพย์สาธารณสุข',
          category: '2. กองทุนรวมไทย',
          institution: 'สหกรณ์ออมทรัพย์',
          amountTHB: details.coopSavingShare,
          amountUSD: 0,
          isUSD: false,
          notes: 'เงินสะสมค่าหุ้นสหกรณ์ออมทรัพย์ประจำเดือน',
        });
      }
    }

    const updated = {
      ...database,
      assets: updatedAssets,
      journalEntries: [...batchEntries, ...database.journalEntries],
      taxItems: [...newTaxItems, ...database.taxItems],
    };
    saveDatabase(updated);
  };

  const deleteJournalEntry = (id: string) => {
    if (!database) return;
    const target = database.journalEntries.find((e) => e.id === id);
    let updatedTaxItems = database.taxItems;

    if (target && target.taxDeductionTag) {
      // Remove corresponding tax item safely matching title and amount
      updatedTaxItems = updatedTaxItems.filter(
        (t) => !(t.fundCode === target.title && Math.abs(t.amount - target.amount) < 0.01)
      );
    }

    const updated = {
      ...database,
      journalEntries: database.journalEntries.filter((e) => e.id !== id),
      taxItems: updatedTaxItems,
    };
    saveDatabase(updated);
  };

  const importDatabase = async (importedData: any): Promise<boolean> => {
    try {
      const normalized = normalizeImportedData(importedData);
      saveDatabase(normalized);
      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  };

  const exportDatabase = () => {
    if (!database) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(database, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `wealth_database_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const clearAllData = () => {
    if (!database) return;
    const cleanDb: FullWealthDatabase = {
      ...database,
      assets: [],
      liabilities: [],
      journalEntries: [],
      taxItems: [],
      historicalRecords: [],
    };
    saveDatabase(cleanDb);
  };

  const resetDatabase = async () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    const res = await fetch('/default_wealth_database.json');
    if (res.ok) {
      const data = await res.json();
      const normalized = normalizeImportedData(data);
      saveDatabase(normalized);
    }
  };

  return (
    <WealthContext.Provider
      value={{
        database,
        isLoading,
        activeTab,
        setActiveTab,
        updateProfile,
        addAsset,
        updateAsset,
        deleteAsset,
        addLiability,
        updateLiability,
        deleteLiability,
        addJournalEntry,
        addPayrollBatch,
        deleteJournalEntry,
        importDatabase,
        exportDatabase,
        resetDatabase,
        clearAllData,
        // Supabase Cloud Sync
        cloudSyncStatus,
        isSyncing,
        lastCloudSync,
        cloudSyncError,
        syncToCloud,
        pullFromCloud,
      }}
    >
      {children}
    </WealthContext.Provider>
  );
}

export function useWealth() {
  const context = useContext(WealthContext);
  if (!context) {
    throw new Error('useWealth must be used within a WealthProvider');
  }
  return context;
}

// Helper: Normalize Apple Cocoa timestamps or ISO strings to uniform ISO strings
function normalizeImportedData(raw: any): FullWealthDatabase {
  const convertTimestamp = (ts: any): string => {
    if (!ts) return new Date().toISOString();
    if (typeof ts === 'number') {
      if (ts < 2000000000) {
        // Apple Cocoa timestamp
        return new Date((ts + APPLE_EPOCH_OFFSET_SECONDS) * 1000).toISOString();
      }
      return new Date(ts).toISOString();
    }
    return String(ts);
  };

  const normalizedJournal: JournalEntry[] = (raw.journalEntries || []).map((e: any) => ({
    ...e,
    id: e.id || crypto.randomUUID(),
    date: convertTimestamp(e.date),
    amount: Number(e.amount || 0),
  }));

  const normalizedTaxItems: TaxItem[] = (raw.taxItems || []).map((t: any) => ({
    ...t,
    id: t.id || crypto.randomUUID(),
    date: convertTimestamp(t.date),
    amount: Number(t.amount || 0),
  }));

  return {
    version: raw.version || 2,
    exportedAt: Date.now(),
    profile: {
      fullName: 'นายนิทัศน์ ปัญจะโรทัย',
      organization: 'สำนักงานสาธารณสุขจังหวัดนครนายก',
      rank: 'นักวิชาการสาธารณสุขชำนาญการ',
      currentMonthlySalary: 45250,
      gpfRatePercent: 10,
      targetCashPercent: 10,
      targetThaiFundPercent: 20,
      targetForeignFundPercent: 20,
      targetThaiStockPercent: 20,
      targetForeignStockPercent: 20,
      targetForexPercent: 10,
      usdToThbRate: 36.5,
      isOnboarded: true,
      ...(raw.profile || {}),
      gpfPlan: raw.profile?.gpfPlan || DEFAULT_GPF_PLAN,
    },
    assets: raw.assets || [],
    liabilities: raw.liabilities || [],
    journalEntries: normalizedJournal,
    taxItems: normalizedTaxItems,
    bankPresets: raw.bankPresets || [],
    historicalRecords: raw.historicalRecords || [],
  };
}
