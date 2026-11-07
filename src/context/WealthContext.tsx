'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Asset,
  FullWealthDatabase,
  JournalEntry,
  Liability,
  TaxItem,
  UserProfile,
} from '@/types/wealth';
import { APPLE_EPOCH_OFFSET_SECONDS } from '@/lib/wealthEngine';

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
  deleteJournalEntry: (id: string) => void;
  importDatabase: (importedData: any) => Promise<boolean>;
  exportDatabase: () => void;
  resetDatabase: () => void;
}

const LOCAL_STORAGE_KEY = 'gov_wealth_database_v2';

const WealthContext = createContext<WealthContextType | undefined>(undefined);

export function WealthProvider({ children }: { children: React.ReactNode }) {
  const [database, setDatabase] = useState<FullWealthDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTabState] = useState('balance');

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Load initial database
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) {
        setActiveTabState(tabParam);
      }
    }

    async function initData() {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setDatabase(parsed);
          setIsLoading(false);
          return;
        }

        // Fallback: fetch seed database
        const res = await fetch('/default_wealth_database.json');
        if (res.ok) {
          const data = await res.json();
          // Normalize dates in journalEntries and taxItems
          const normalized = normalizeImportedData(data);
          setDatabase(normalized);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initData();
  }, []);

  // Save to localStorage whenever database changes
  const saveDatabase = (updated: FullWealthDatabase) => {
    setDatabase(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
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

    const updated = {
      ...database,
      journalEntries: [newEntry, ...database.journalEntries],
      taxItems: updatedTaxItems,
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
        deleteJournalEntry,
        importDatabase,
        exportDatabase,
        resetDatabase,
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
    profile: raw.profile || {
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
    },
    assets: raw.assets || [],
    liabilities: raw.liabilities || [],
    journalEntries: normalizedJournal,
    taxItems: normalizedTaxItems,
    bankPresets: raw.bankPresets || [],
    historicalRecords: raw.historicalRecords || [],
  };
}
