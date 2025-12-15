import React, { useState, useMemo } from 'react';
import { LedgerState, ReportRow } from '../types';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { Combobox } from './ui/Combobox';
import { Search, Printer, RotateCcw } from 'lucide-react';
import { LedgerService } from '../services/ledgerService';

interface ReportsProps {
  state: LedgerState;
}

export const Reports: React.FC<ReportsProps> = ({ state }) => {
  const [filters, setFilters] = useState({
    accountId: '',
    from: new Date().toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10)
  });
  
  const [reportData, setReportData] = useState<{
    rows: ReportRow[];
    openingBalance: number;
    totalDr: number;
    totalCr: number;
    closingBalance: number;
    generated: boolean;
  } | null>(null);

  const handleGenerate = () => {
    // Basic sorting of posted transactions
    const posted = state.transactions
      .filter(t => t.posted)
      .sort((a, b) => {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        if (da !== db) return da - db;
        return a.voucherNo - b.voucherNo;
      });

    let openingBalance = 0;
    
    // Calculate Opening Balance if account selected
    if (filters.accountId) {
      const acc = state.accounts.find(a => a.id === filters.accountId);
      openingBalance = Number(acc?.openingBalance || 0);
      
      // Add effects of transactions BEFORE the 'from' date
      if (filters.from) {
        const fromDate = new Date(filters.from);
        posted.forEach(t => {
          if (new Date(t.date) < fromDate) {
             t.lines.forEach(l => {
               if (l.accountId === filters.accountId) {
                 openingBalance += Number(l.dr) - Number(l.cr);
               }
             });
          }
        });
      }
    }

    // Generate Rows
    const rows: ReportRow[] = [];
    let running = openingBalance;
    let totalDr = 0;
    let totalCr = 0;

    const fromDate = filters.from ? new Date(filters.from) : null;
    const toDate = filters.to ? new Date(filters.to) : null;

    posted.forEach(t => {
      const tDate = new Date(t.date);
      if (fromDate && tDate < fromDate) return;
      if (toDate && tDate > toDate) return;

      t.lines.forEach(l => {
        // If specific account filter
        if (filters.accountId && l.accountId !== filters.accountId) return;
        
        // If all accounts, we might just list lines, but balance calculation implies a single account context mostly.
        // For "All Accounts" report, we usually just list transactions without a running balance column, 
        // or grouped by account. Here we'll just dump lines.
        
        const dr = Number(l.dr);
        const cr = Number(l.cr);
        
        if (filters.accountId) {
           running = running + dr - cr;
        }

        totalDr += dr;
        totalCr += cr;

        rows.push({
          voucherNo: t.voucherNo,
          date: t.date,
          narration: l.narration || t.narration, // Fallback to master narration
          dr,
          cr,
          balance: filters.accountId ? running : 0
        });
      });
    });

    setReportData({
      rows,
      openingBalance,
      totalDr,
      totalCr,
      closingBalance: filters.accountId ? running : (totalDr - totalCr), // Rough net for all
      generated: true
    });
  };

  const formatMoney = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const selectedAccountName = state.accounts.find(a => a.id === filters.accountId)?.name || 'All Accounts';

  // Prepare options for Combobox, memoized
  // Removed "All Accounts" option so placeholder is shown by default when empty
  const accountOptions = useMemo(() => 
    state.accounts.map(a => ({ value: a.id, label: a.name })), 
  [state.accounts]);

  return (
    <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500">
      {/* Filter Bar */}
      <div className="bg-white/60 backdrop-blur-xl p-5 rounded-xl border border-white/40 shadow-xl z-20">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="w-full">
              <Combobox
                 label="Account"
                 options={accountOptions}
                 value={filters.accountId}
                 onChange={(val) => setFilters({...filters, accountId: val})}
                 placeholder="Search Account... (Empty for All)"
              />
            </div>
            <Input 
               label="From Date" 
               type="date" 
               value={filters.from} 
               onChange={e => setFilters({...filters, from: e.target.value})}
            />
            <Input 
               label="To Date" 
               type="date" 
               value={filters.to} 
               onChange={e => setFilters({...filters, to: e.target.value})}
            />
            <div className="flex gap-2">
               <Button onClick={handleGenerate} className="flex-1 transition-transform active:scale-95"><Search size={16} className="mr-2"/> Generate</Button>
               <Button variant="secondary" onClick={() => window.print()} title="Print" className="transition-transform active:scale-95"><Printer size={16}/></Button>
            </div>
         </div>
      </div>

      {/* Report Result */}
      <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-xl overflow-hidden flex flex-col min-h-0 z-10 transition-all duration-300">
         {reportData && reportData.generated ? (
           <div className="flex flex-col h-full animate-in slide-in-from-bottom-8 duration-500">
             <div className="p-6 border-b border-white/30 bg-white/40">
               <h2 className="text-2xl font-bold text-slate-800">{selectedAccountName}</h2>
               <div className="text-slate-600 text-sm mt-1">
                 Statement Period: <span className="font-semibold">{filters.from || 'Beginning'}</span> to <span className="font-semibold">{filters.to || 'Present'}</span>
               </div>
               
               {filters.accountId && (
                 <div className="mt-4 p-4 bg-indigo-50/70 backdrop-blur-sm rounded-lg border border-indigo-100/50 flex justify-between items-center shadow-sm">
                    <span className="text-indigo-800 font-medium">Opening Balance</span>
                    <span className="text-indigo-900 font-bold font-mono text-lg">{formatMoney(reportData.openingBalance)}</span>
                 </div>
               )}
             </div>

             <div className="overflow-auto flex-1 p-0 custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/40 sticky top-0 z-10 shadow-sm text-slate-600 font-semibold backdrop-blur-md">
                    <tr>
                      <th className="px-6 py-3 border-b border-white/20">Date</th>
                      <th className="px-6 py-3 border-b border-white/20">Voucher</th>
                      <th className="px-6 py-3 border-b border-white/20">Narration</th>
                      <th className="px-6 py-3 border-b border-white/20 text-right">Debit</th>
                      <th className="px-6 py-3 border-b border-white/20 text-right">Credit</th>
                      {filters.accountId && <th className="px-6 py-3 border-b border-white/20 text-right bg-white/30">Balance</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/20">
                    {reportData.rows.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">No transactions found for this period.</td></tr>
                    )}
                    {reportData.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-white/40 transition-colors">
                        <td className="px-6 py-2.5 whitespace-nowrap text-slate-700">{row.date}</td>
                        <td className="px-6 py-2.5 text-slate-500">#{row.voucherNo}</td>
                        <td className="px-6 py-2.5 text-slate-800">{row.narration}</td>
                        <td className="px-6 py-2.5 text-right font-mono text-slate-700">{row.dr ? formatMoney(row.dr) : '-'}</td>
                        <td className="px-6 py-2.5 text-right font-mono text-slate-700">{row.cr ? formatMoney(row.cr) : '-'}</td>
                        {filters.accountId && (
                          <td className="px-6 py-2.5 text-right font-mono font-medium text-slate-800 bg-white/20 border-l border-white/20">
                            {formatMoney(row.balance)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-white/50 font-bold text-slate-800 sticky bottom-0 border-t border-white/30 backdrop-blur-md">
                    <tr>
                      <td colSpan={3} className="px-6 py-3 text-right uppercase text-xs">Period Totals</td>
                      <td className="px-6 py-3 text-right font-mono">{formatMoney(reportData.totalDr)}</td>
                      <td className="px-6 py-3 text-right font-mono">{formatMoney(reportData.totalCr)}</td>
                      {filters.accountId && <td className="px-6 py-3 bg-white/30"></td>}
                    </tr>
                  </tfoot>
                </table>
             </div>

             {filters.accountId && (
               <div className="p-6 border-t border-white/30 bg-indigo-50/40 backdrop-blur-sm flex justify-between items-center">
                 <div>
                   <div className="text-sm font-bold text-slate-600 uppercase tracking-wide">Closing Balance</div>
                   <div className="text-xs text-slate-500">Carried Forward</div>
                 </div>
                 <div className="text-3xl font-bold text-indigo-800 font-mono">{formatMoney(reportData.closingBalance)}</div>
               </div>
             )}
           </div>
         ) : (
           <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <div className="p-4 bg-white/40 rounded-full mb-4 shadow-sm backdrop-blur-sm animate-pulse"><Search size={48} /></div>
              <p className="font-medium bg-white/30 px-3 py-1 rounded-lg backdrop-blur-sm">Select criteria and click Generate to view report.</p>
           </div>
         )}
      </div>
    </div>
  );
};