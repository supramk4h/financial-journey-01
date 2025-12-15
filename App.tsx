import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, ArrowRightLeft, FileBarChart, Settings as SettingsIcon } from 'lucide-react';
import { LedgerService, initialState } from './services/ledgerService';
import { LedgerState, Account, Transaction } from './types';

// Components
import { Dashboard } from './components/Dashboard';
import { Accounts } from './components/Accounts';
import { Transactions } from './components/Transactions';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';

const App = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'transactions' | 'reports' | 'settings'>('dashboard');
  
  // Load state synchronously from LocalStorage to avoid flash of empty content
  const [state, setState] = useState<LedgerState>(() => LedgerService.load());

  // Persist state to LocalStorage whenever it changes
  useEffect(() => {
    LedgerService.save(state);
  }, [state]);

  // Actions
  const addAccount = (acc: Omit<Account, 'id' | 'serial'>) => {
    const newAccount: Account = {
      ...acc,
      id: `acc_${Math.random().toString(36).substr(2, 9)}`,
      serial: state.meta.nextAccountSerial,
      pinned: false
    };
    setState(prev => ({
      ...prev,
      accounts: [...prev.accounts, newAccount],
      meta: { ...prev.meta, nextAccountSerial: prev.meta.nextAccountSerial + 1 }
    }));
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => a.id === id ? { ...a, ...updates } : a)
    }));
  };

  const deleteAccount = (id: string) => {
    // Check usage
    const used = state.transactions.some(t => t.lines.some(l => l.accountId === id));
    if (used) {
      alert("Cannot delete account: It is used in transactions.");
      return;
    }
    if (!confirm("Are you sure?")) return;
    
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.filter(a => a.id !== id)
    }));
  };

  const toggleAccountPin = (id: string) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => a.id === id ? { ...a, pinned: !a.pinned } : a)
    }));
  };

  const saveTransaction = (tx: Transaction) => {
    setState(prev => {
      const exists = prev.transactions.find(t => t.id === tx.id);
      
      const newTxs = exists 
        ? prev.transactions.map(t => t.id === tx.id ? tx : t)
        : [...prev.transactions, tx];
      
      // Keep sorted by date/voucher
      newTxs.sort((a, b) => {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        if (da !== db) return da - db;
        return a.voucherNo - b.voucherNo;
      });

      // Recalculate next voucher number to ensure continuity or reuse of deleted tail numbers
      // This fulfills the requirement: if 6 is deleted, next is 6.
      const maxVoucher = newTxs.reduce((max, t) => Math.max(max, t.voucherNo), 0);

      return {
        ...prev,
        transactions: newTxs,
        meta: {
            ...prev.meta,
            nextVoucherNo: maxVoucher + 1
        }
      };
    });
  };

  const deleteTransaction = (id: string) => {
    setState(prev => {
      const newTransactions = prev.transactions.filter(t => t.id !== id);

      // Recalculate next voucher number immediately after deletion
      // If the latest voucher (e.g. 6) is deleted, max becomes 5, so next becomes 6 (not 7).
      const maxVoucher = newTransactions.reduce((max, t) => Math.max(max, t.voucherNo), 0);

      return {
        ...prev,
        transactions: newTransactions,
        meta: {
            ...prev.meta,
            nextVoucherNo: maxVoucher + 1
        }
      };
    });
  };

  const clearData = () => {
    if (confirm("Are you sure you want to clear ALL data? This cannot be undone.")) {
      LedgerService.clear();
      setState(initialState);
      alert("All data has been cleared.");
    }
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.accounts && data.transactions) {
          if (confirm("Replace current data with import?")) {
            setState(data);
            alert("Data imported successfully.");
          }
        } else {
          alert("Invalid file format");
        }
      } catch (err) {
        alert("Failed to parse file");
      }
    };
    reader.readAsText(file);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex flex-col h-screen bg-transparent">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-white/30 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600/90 text-white p-2 rounded-lg shadow-sm shadow-indigo-200/50 backdrop-blur-md">
               <FileBarChart size={20} />
             </div>
             <div>
               <h1 className="font-bold text-xl text-slate-900 tracking-tight leading-none drop-shadow-sm">Financial <span className="text-indigo-700">Journey</span></h1>
             </div>
          </div>
          
          <nav className="flex gap-1 p-1 bg-white/40 backdrop-blur-md border border-white/20 rounded-lg overflow-x-auto max-w-[calc(100vw-220px)] sm:max-w-none no-scrollbar">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-white/80 text-indigo-700 shadow-sm backdrop-blur-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/30'
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-6 h-full">
          {activeTab === 'dashboard' && (
            <Dashboard 
              state={state} 
            />
          )}
          {activeTab === 'accounts' && (
            <Accounts 
              state={state}
              onAdd={addAccount}
              onUpdate={updateAccount}
              onDelete={deleteAccount}
              onTogglePin={toggleAccountPin}
            />
          )}
          {activeTab === 'transactions' && (
            <Transactions 
              state={state}
              onSave={saveTransaction}
              onDelete={deleteTransaction}
            />
          )}
          {activeTab === 'reports' && (
            <Reports state={state} />
          )}
          {activeTab === 'settings' && (
            <Settings 
              state={state}
              onClear={clearData}
              onImport={importData}
              onExport={exportData}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;