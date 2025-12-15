
export interface Account {
  id: string;
  serial: number;
  name: string;
  type: string; // 'cash', 'bank', 'income', 'expense', 'liability', 'asset'
  narration: string;
  openingBalance: number;
  pinned?: boolean;
}

export interface TransactionLine {
  id: string;
  accountId: string;
  narration: string;
  dr: number;
  cr: number;
}

export interface Transaction {
  id: string;
  voucherNo: number;
  date: string; // YYYY-MM-DD
  narration: string;
  lines: TransactionLine[];
  posted: boolean;
  timestamp: number;
}

export interface LedgerMeta {
  nextAccountSerial: number;
  nextVoucherNo: number;
}

export interface LedgerState {
  accounts: Account[];
  transactions: Transaction[];
  meta: LedgerMeta;
}

// Helper types for Reports
export interface ReportRow {
  voucherNo: number;
  date: string;
  narration: string;
  dr: number;
  cr: number;
  balance: number;
}
