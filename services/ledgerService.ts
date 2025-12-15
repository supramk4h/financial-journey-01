import { Account, LedgerState, Transaction } from '../types';

const STORAGE_KEY = 'personal_ledger_pro_v1';

export const initialMeta = {
  nextAccountSerial: 1,
  nextVoucherNo: 1,
};

export const initialState: LedgerState = {
  accounts: [],
  transactions: [],
  meta: initialMeta,
};

export const LedgerService = {
  load: (): LedgerState => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Robust merge: ensure meta and arrays exist even if importing older/partial data
        return {
          accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
          meta: { ...initialMeta, ...(parsed.meta || {}) }
        };
      }
    } catch (e) {
      console.error("Failed to load state", e);
    }
    return initialState;
  },

  save: (state: LedgerState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save state", e);
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear state", e);
    }
  },

  calculateBalances: (accounts: Account[], transactions: Transaction[]) => {
    // 1. Initialize with opening balances
    const balances = new Map<string, number>();
    accounts.forEach(acc => {
      balances.set(acc.id, Number(acc.openingBalance) || 0);
    });

    // 2. Process posted transactions
    const postedTxs = transactions.filter(t => t.posted);
    postedTxs.forEach(tx => {
      tx.lines.forEach(line => {
        const current = balances.get(line.accountId) || 0;
        // Asset/Expense logic: DR increases, CR decreases usually. 
        // For a generic ledger, we often treat DR as positive and CR as negative for calculation purposes, 
        // or strictly follow accounting equation. 
        // Based on user request "Current Total Balance", we assume DR adds to asset value.
        balances.set(line.accountId, current + Number(line.dr) - Number(line.cr));
      });
    });

    return balances;
  },

  // Calculates the specific metrics requested by user
  getDashboardStats: (state: LedgerState) => {
    const balances = LedgerService.calculateBalances(state.accounts, state.transactions);
    
    let cashTotal = 0;
    let bankTotal = 0;

    state.accounts.forEach(acc => {
      const type = (acc.type || '').toLowerCase();
      const bal = balances.get(acc.id) || 0;
      if (type.includes('cash')) cashTotal += bal;
      if (type.includes('bank')) bankTotal += bal;
    });

    const currentTotal = cashTotal + bankTotal;

    // Previous Total (Before last posted transaction)
    // We filter posted txs, sort them, remove the last one, and recalc.
    const sortedPosted = [...state.transactions]
      .filter(t => t.posted)
      .sort((a, b) => {
        const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return a.voucherNo - b.voucherNo;
      });

    let prevTotal = 0;
    
    if (sortedPosted.length > 0) {
      const txsBeforeLast = sortedPosted.slice(0, sortedPosted.length - 1);
      const prevBalances = LedgerService.calculateBalances(state.accounts, txsBeforeLast);
      
      let prevCash = 0;
      let prevBank = 0;
      
      state.accounts.forEach(acc => {
        const type = (acc.type || '').toLowerCase();
        const bal = prevBalances.get(acc.id) || 0;
        if (type.includes('cash')) prevCash += bal;
        if (type.includes('bank')) prevBank += bal;
      });
      prevTotal = prevCash + prevBank;
    } else {
        // If no transactions, previous total is effectively the same as current opening total
        prevTotal = currentTotal; 
    }

    return {
      cashTotal,
      bankTotal,
      currentTotal,
      prevTotal,
      accountCount: state.accounts.length,
      postedCount: sortedPosted.length
    };
  }
};