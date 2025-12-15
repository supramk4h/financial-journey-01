import React, { useState, useMemo, useEffect } from 'react';
import { Account, Transaction, TransactionLine, LedgerState } from '../types';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { Combobox } from './ui/Combobox';
import { Trash2, Plus, ArrowLeft, Save, X, Eye, Printer, Edit, FileText, Search, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface TransactionsProps {
  state: LedgerState;
  onSave: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);
const DRAFT_KEY = 'ledger_tx_draft';

/* --- Voucher Receipt Modal --- */
interface VoucherModalProps {
  tx: Transaction;
  accounts: Account[];
  onClose: () => void;
  onNavigate: (direction: 'first' | 'prev' | 'next' | 'last') => void;
  hasPrev: boolean;
  hasNext: boolean;
}

const VoucherModal = ({ tx, accounts, onClose, onNavigate, hasPrev, hasNext }: VoucherModalProps) => {
  if (!tx) return null;
  const formatMoney = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalDr = tx.lines.reduce((s, l) => s + Number(l.dr), 0);
  const totalCr = tx.lines.reduce((s, l) => s + Number(l.cr), 0);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate('prev');
      if (e.key === 'ArrowRight' && hasNext) onNavigate('next');
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate, hasPrev, hasNext, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300 border border-white/50">
        <div className="bg-indigo-600/90 text-white p-6 flex justify-between items-start print:bg-white print:text-black print:border-b-2 print:border-black backdrop-blur-sm">
            <div>
                <h2 className="text-2xl font-bold tracking-tight uppercase">Payment Voucher</h2>
                <div className="opacity-80 mt-1 font-mono text-indigo-100 print:text-slate-600">#{tx.voucherNo}</div>
            </div>
            <div className="text-right">
                <div className="text-indigo-100 text-xs uppercase font-bold tracking-wider print:text-slate-600">Date</div>
                <div className="text-xl font-bold font-mono">{tx.date}</div>
            </div>
        </div>
        <div className="p-8 overflow-auto flex-1 bg-white/50">
            <div className="border rounded-lg overflow-hidden border-slate-200/70 print:border-slate-900 mt-4">
              <table className="w-full text-sm">
                  <thead className="bg-slate-100/50 text-slate-500 print:bg-slate-100 print:text-black">
                      <tr className="border-b border-slate-200/50">
                          <th className="text-left px-4 py-3 font-bold uppercase text-xs tracking-wider">Account</th>
                          <th className="text-left px-4 py-3 font-bold uppercase text-xs tracking-wider">Details</th>
                          <th className="text-right px-4 py-3 font-bold uppercase text-xs tracking-wider w-32">Debit</th>
                          <th className="text-right px-4 py-3 font-bold uppercase text-xs tracking-wider w-32">Credit</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                      {tx.lines.map((line, i) => {
                          const acc = accounts.find(a => a.id === line.accountId);
                          return (
                              <tr key={i} className="hover:bg-slate-50/30">
                                  <td className="px-4 py-3 font-semibold text-slate-700">{acc?.name || 'Unknown'}</td>
                                  <td className="px-4 py-3 text-slate-500">{line.narration}</td>
                                  <td className="px-4 py-3 text-right font-mono text-slate-600">{line.dr ? formatMoney(line.dr) : '-'}</td>
                                  <td className="px-4 py-3 text-right font-mono text-slate-600">{line.cr ? formatMoney(line.cr) : '-'}</td>
                              </tr>
                          )
                      })}
                  </tbody>
                  <tfoot className="bg-slate-50/50 print:bg-slate-100">
                      <tr className="border-t-2 border-slate-200/50">
                          <td colSpan={2} className="px-4 py-4 text-right font-bold text-slate-700 uppercase text-xs tracking-widest">Totals</td>
                          <td className="px-4 py-4 text-right font-bold font-mono text-slate-900">{formatMoney(totalDr)}</td>
                          <td className="px-4 py-4 text-right font-bold font-mono text-slate-900">{formatMoney(totalCr)}</td>
                      </tr>
                  </tfoot>
              </table>
            </div>
            <div className="mt-16 flex justify-between gap-12 text-center print:mt-24">
                <div className="flex-1 border-t border-slate-300 pt-3">
                    <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Authorized By</div>
                </div>
                <div className="flex-1 border-t border-slate-300 pt-3">
                    <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Received By</div>
                </div>
            </div>
        </div>
        
        {/* Modal Footer & Navigation */}
        <div className="bg-slate-50/50 p-4 border-t border-slate-200/50 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
            <div className="flex items-center gap-1 bg-white/60 p-1 rounded-lg border border-slate-200/50 shadow-sm">
                 <button onClick={() => onNavigate('first')} disabled={!hasPrev} className="p-2 rounded hover:bg-indigo-50 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent" title="Newest (First)">
                    <ChevronsLeft size={18} />
                 </button>
                 <button onClick={() => onNavigate('prev')} disabled={!hasPrev} className="p-2 rounded hover:bg-indigo-50 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent" title="Newer (Previous)">
                    <ChevronLeft size={18} />
                 </button>
                 <span className="text-[10px] uppercase font-bold text-slate-400 px-2 tracking-wider select-none">Nav</span>
                 <button onClick={() => onNavigate('next')} disabled={!hasNext} className="p-2 rounded hover:bg-indigo-50 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent" title="Older (Next)">
                    <ChevronRight size={18} />
                 </button>
                 <button onClick={() => onNavigate('last')} disabled={!hasNext} className="p-2 rounded hover:bg-indigo-50 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent" title="Oldest (Last)">
                    <ChevronsRight size={18} />
                 </button>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
                <button onClick={() => window.print()} className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 bg-white/70 border border-slate-300/60 rounded-lg text-slate-700 font-medium hover:bg-white transition-colors shadow-sm">
                    <Printer size={16} className="mr-2"/> Print
                </button>
                <button onClick={onClose} className="flex-1 sm:flex-none px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200/50">
                    Close
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}

export const Transactions: React.FC<TransactionsProps> = ({ state, onSave, onDelete }) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editForm, setEditForm] = useState<Transaction | null>(null);
  const [viewModalTx, setViewModalTx] = useState<Transaction | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'posted' | 'draft'>('all');

  const formatMoney = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Filter and Sort Transactions
  const processedTransactions = useMemo(() => {
    let data = [...state.transactions];

    // 1. Filter by Status
    if (filterStatus !== 'all') {
      data = data.filter(t => filterStatus === 'posted' ? t.posted : !t.posted);
    }

    // 2. Filter by Search Term
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(t => 
        t.voucherNo.toString().includes(lower) || 
        t.narration.toLowerCase().includes(lower) ||
        t.date.includes(lower) ||
        t.lines.some(l => {
             const accName = state.accounts.find(a => a.id === l.accountId)?.name.toLowerCase() || '';
             return l.narration?.toLowerCase().includes(lower) || accName.includes(lower);
        })
      );
    }

    // 3. Sort (Date Desc, Voucher Desc)
    return data.sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return b.voucherNo - a.voucherNo;
    });
  }, [state.transactions, state.accounts, searchTerm, filterStatus]);

  // Handle Voucher Navigation
  const handleNavigate = (direction: 'first' | 'prev' | 'next' | 'last') => {
    if (!viewModalTx) return;
    const currentIndex = processedTransactions.findIndex(t => t.id === viewModalTx.id);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    const maxIndex = processedTransactions.length - 1;

    switch (direction) {
        case 'first': nextIndex = 0; break;
        case 'prev': nextIndex = Math.max(0, currentIndex - 1); break;
        case 'next': nextIndex = Math.min(maxIndex, currentIndex + 1); break;
        case 'last': nextIndex = maxIndex; break;
    }

    if (nextIndex !== currentIndex) {
        setViewModalTx(processedTransactions[nextIndex]);
    }
  };

  // Resume Draft Logic
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (window.confirm('You have an unsaved transaction draft. Do you want to resume editing?')) {
          setEditForm(parsed);
          setView('form');
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      } catch (e) {
        console.error("Failed to parse draft", e);
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, []);

  // Auto-save Draft Logic
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (view === 'form' && editForm) {
      timeout = setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(editForm));
      }, 1000); // Debounce save by 1s
    }
    return () => clearTimeout(timeout);
  }, [editForm, view]);

  const verifyAdmin = () => {
    const pwd = prompt("Enter Admin Password:");
    if (pwd === "6667") return true;
    alert("Access Denied: Incorrect Password");
    return false;
  };

  /* --- Handlers --- */
  const handleNew = () => {
    if (state.accounts.length === 0) return alert("Please create an account first.");
    const newTx: Transaction = {
      id: uid(),
      voucherNo: state.meta.nextVoucherNo,
      date: new Date().toISOString().slice(0, 10),
      narration: '',
      lines: [
        { id: uid(), accountId: state.accounts[0].id, narration: '', dr: 0, cr: 0 },
        { id: uid(), accountId: state.accounts[0].id, narration: '', dr: 0, cr: 0 }
      ],
      posted: false,
      timestamp: Date.now()
    };
    setEditForm(newTx);
    setView('form');
  };

  const handleEdit = (tx: Transaction) => {
    if (!verifyAdmin()) return;
    setEditForm(JSON.parse(JSON.stringify(tx)));
    setView('form');
  };

  const handleDelete = (tx: Transaction) => {
    if (!verifyAdmin()) return;
    if (confirm(`Delete Voucher #${tx.voucherNo}?`)) {
      onDelete(tx.id);
    }
  };

  const handleCancel = () => {
    if (confirm('Discard unsaved changes?')) {
      localStorage.removeItem(DRAFT_KEY);
      setView('list');
      setEditForm(null);
    }
  };

  const handleLineChange = (lineId: string, field: keyof TransactionLine, value: any) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      lines: editForm.lines.map(l => {
        if (l.id !== lineId) return l;
        const updated = { ...l, [field]: value };
        if (field === 'dr' && Number(value) > 0) updated.cr = 0;
        if (field === 'cr' && Number(value) > 0) updated.dr = 0;
        return updated;
      })
    });
  };

  const addLine = () => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      lines: [...editForm.lines, { id: uid(), accountId: state.accounts[0]?.id || '', narration: '', dr: 0, cr: 0 }]
    });
  };

  const removeLine = (id: string) => {
    if (!editForm) return;
    if (editForm.lines.length <= 2) return alert("Minimum 2 lines required for double entry.");
    setEditForm({
      ...editForm,
      lines: editForm.lines.filter(l => l.id !== id)
    });
  };

  const handlePost = () => {
    if (!editForm) return;
    const drSum = editForm.lines.reduce((s, l) => s + Number(l.dr || 0), 0);
    const crSum = editForm.lines.reduce((s, l) => s + Number(l.cr || 0), 0);
    
    if (Math.abs(drSum - crSum) > 0.01) {
      alert(`Totals do not match!\nDR: ${drSum.toFixed(2)}\nCR: ${crSum.toFixed(2)}\nDifference: ${(drSum - crSum).toFixed(2)}`);
      return;
    }
    
    const finalTx = { ...editForm, posted: true };
    onSave(finalTx);
    localStorage.removeItem(DRAFT_KEY); // Clear draft on success
    setView('list');
    setEditForm(null);
    setViewModalTx(finalTx); 
  };

  // Pre-calculate account options for Combobox, memoized to prevent unnecessary re-renders in Combobox
  const accountOptions = useMemo(() => 
    state.accounts.map(a => ({ value: a.id, label: `${a.name} (${a.type})` })),
  [state.accounts]);

  // Determine nav state
  const currentViewIndex = viewModalTx ? processedTransactions.findIndex(t => t.id === viewModalTx.id) : -1;
  const hasPrev = currentViewIndex > 0;
  const hasNext = currentViewIndex !== -1 && currentViewIndex < processedTransactions.length - 1;

  /* --- Render --- */
  return (
    <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500">
      <VoucherModal 
        tx={viewModalTx!} 
        accounts={state.accounts} 
        onClose={() => setViewModalTx(null)} 
        onNavigate={handleNavigate}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />

      {view === 'list' && (
        <>
          {/* List Header */}
          <div className="bg-white/60 backdrop-blur-xl p-4 rounded-xl border border-white/40 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-2 min-w-fit self-start md:self-center">
                <FileText className="text-indigo-600" size={24} />
                <h2 className="text-xl font-bold text-slate-800">Transactions</h2>
             </div>
             
             {/* Search and Filters */}
             <div className="flex flex-1 w-full md:w-auto gap-3 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search voucher #, account, narration..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white/50 border border-white/40 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/70 focus:bg-white/80 transition-all backdrop-blur-sm shadow-sm"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X size={14} />
                        </button>
                    )}
                </div>
                
                <div className="w-32 min-w-[128px]">
                    <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
                        <option value="all">All Status</option>
                        <option value="posted">Posted</option>
                        <option value="draft">Draft</option>
                    </Select>
                </div>

                <Button onClick={handleNew} className="whitespace-nowrap px-3 sm:px-4">
                  <Plus size={18} className="sm:mr-2" /> <span className="hidden sm:inline">New</span>
                </Button>
             </div>
          </div>

          {/* Transaction Table */}
          <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-xl overflow-hidden flex flex-col min-h-0">
             <div className="overflow-auto flex-1 custom-scrollbar">
               <table className="w-full text-left text-sm">
                 <thead className="bg-white/40 sticky top-0 z-10 shadow-sm border-b border-white/30 backdrop-blur-md">
                   <tr>
                     <th className="px-4 py-4 font-bold text-slate-700 w-24 whitespace-nowrap uppercase text-xs tracking-wider">Date</th>
                     <th className="px-4 py-4 font-bold text-slate-700 w-24 uppercase text-xs tracking-wider">Voucher</th>
                     <th className="px-4 py-4 font-bold text-slate-700 uppercase text-xs tracking-wider hidden md:table-cell">Entries</th>
                     <th className="px-4 py-4 font-bold text-slate-700 text-right uppercase text-xs tracking-wider">Amount</th>
                     <th className="px-4 py-4 font-bold text-slate-700 text-center w-24 uppercase text-xs tracking-wider hidden sm:table-cell">Status</th>
                     <th className="px-4 py-4 font-bold text-slate-700 text-right w-32 uppercase text-xs tracking-wider">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/20">
                   {processedTransactions.map(tx => {
                     const totalAmount = tx.lines.reduce((s,l) => s + Number(l.dr), 0);
                     return (
                       <tr key={tx.id} className="hover:bg-white/40 transition-colors group">
                         <td className="px-4 py-4 text-slate-700 font-mono whitespace-nowrap text-xs sm:text-sm">
                            <span className="hidden sm:inline">{tx.date}</span>
                            <span className="sm:hidden">{tx.date.slice(5)}</span> {/* MM-DD on mobile */}
                         </td>
                         <td className="px-4 py-4 text-indigo-800 font-mono font-medium text-xs sm:text-sm">#{tx.voucherNo}</td>
                         <td className="px-4 py-4 text-slate-600 truncate max-w-xs hidden md:table-cell">
                           <div className="flex gap-2 items-center">
                             <span className="bg-white/50 px-1.5 py-0.5 rounded text-xs border border-white/30">{tx.lines.length}</span>
                             <span className="truncate">{tx.lines.slice(0, 2).map(l => l.narration).filter(Boolean).join(', ')}...</span>
                           </div>
                         </td>
                         <td className="px-4 py-4 text-right font-mono font-medium text-slate-800">{formatMoney(totalAmount)}</td>
                         <td className="px-4 py-4 text-center hidden sm:table-cell">
                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm ${tx.posted ? 'bg-green-100/70 text-green-800 border border-green-200/50' : 'bg-yellow-100/70 text-yellow-800 border border-yellow-200/50'}`}>
                             {tx.posted ? 'Posted' : 'Draft'}
                           </span>
                         </td>
                         <td className="px-4 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => setViewModalTx(tx)} className="p-2 hover:bg-white/60 text-slate-600 rounded-lg transition-colors" title="View">
                                <Eye size={16} />
                              </button>
                              <button onClick={() => handleEdit(tx)} className="p-2 hover:bg-indigo-100/60 text-indigo-700 rounded-lg transition-colors" title="Edit">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => handleDelete(tx)} className="p-2 hover:bg-red-100/60 text-red-700 rounded-lg transition-colors" title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </div>
                         </td>
                       </tr>
                     )
                   })}
                   {processedTransactions.length === 0 && (
                     <tr>
                       <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                             {searchTerm || filterStatus !== 'all' ? (
                                <>
                                    <Search size={32} strokeWidth={1.5} className="text-slate-400 mb-2"/>
                                    <p>No transactions match your criteria.</p>
                                    <Button variant="secondary" size="sm" onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}>Clear Filters</Button>
                                </>
                             ) : (
                                <>
                                    <FileText size={32} strokeWidth={1.5} />
                                    <p>No transactions found.</p>
                                    <Button variant="secondary" size="sm" onClick={handleNew}>Create New Voucher</Button>
                                </>
                             )}
                          </div>
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </>
      )}

      {view === 'form' && editForm && (
        <div className="flex flex-col h-full bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-xl overflow-hidden animate-in slide-in-from-right-4 duration-300">
           {/* Form Header */}
           <div className="p-4 border-b border-white/30 bg-white/40 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md">
              <div className="flex items-center gap-3">
                 <button onClick={handleCancel} className="p-2 hover:bg-white/60 rounded-full transition-colors text-slate-600">
                    <ArrowLeft size={20} />
                 </button>
                 <div>
                   <h2 className="font-bold text-lg text-slate-800">{editForm.id && state.transactions.some(t => t.id === editForm.id) ? 'Edit Voucher' : 'New Voucher'}</h2>
                 </div>
              </div>
              <div className="flex gap-2">
                 <Button variant="secondary" onClick={handleCancel} className="hidden sm:flex">Cancel</Button>
                 <Button variant="success" onClick={handlePost}><Save size={16} className="sm:mr-2"/> <span className="hidden sm:inline">Post</span></Button>
              </div>
           </div>

           {/* Form Meta */}
           <div className="p-6 border-b border-white/30 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/20">
               <Input 
                 label="Voucher No" 
                 value={editForm.voucherNo} 
                 readOnly 
                 className="bg-slate-100/80 font-mono" 
               />
               <Input 
                 label="Date" 
                 type="date" 
                 value={editForm.date} 
                 onChange={e => setEditForm({...editForm, date: e.target.value})} 
               />
           </div>

           {/* Form Lines */}
           <div className="flex-1 overflow-auto p-4 sm:p-6 custom-scrollbar">
              <div className="space-y-4 max-w-5xl mx-auto">
                {editForm.lines.map((line, idx) => (
                  <div key={line.id} className="flex flex-col md:flex-row gap-3 items-start md:items-end p-4 bg-white/40 rounded-lg border border-white/40 relative group transition-all hover:bg-white/60 hover:shadow-sm">
                    <div className="w-8 pt-2 text-center text-slate-500 font-bold text-sm hidden md:block">{idx + 1}.</div>
                    
                    {/* Mobile Index + Remove */}
                    <div className="flex justify-between w-full md:hidden mb-2 border-b border-white/30 pb-2">
                        <span className="font-bold text-slate-500 text-xs uppercase tracking-wider">Line {idx + 1}</span>
                        <button onClick={() => removeLine(line.id)} className="text-red-500 text-xs flex items-center gap-1"><Trash2 size={12}/> Remove</button>
                    </div>

                    <div className="flex-1 w-full md:w-auto">
                      <Combobox 
                        label={idx === 0 ? "Account" : undefined}
                        value={line.accountId}
                        onChange={(val) => handleLineChange(line.id, 'accountId', val)}
                        options={accountOptions}
                        placeholder="Select Account"
                      />
                    </div>
                    <div className="flex-[2] w-full md:w-auto">
                       <Input 
                         label={idx === 0 ? "Line Narration" : undefined}
                         placeholder="Description"
                         value={line.narration}
                         onChange={e => handleLineChange(line.id, 'narration', e.target.value)}
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                        <div className="w-full md:w-32">
                           <Input 
                             label={idx === 0 ? "Debit" : undefined}
                             type="number"
                             placeholder="0.00"
                             value={line.dr || ''}
                             onChange={e => handleLineChange(line.id, 'dr', e.target.value)}
                             className="font-mono text-right"
                           />
                        </div>
                        <div className="w-full md:w-32">
                           <Input 
                             label={idx === 0 ? "Credit" : undefined}
                             type="number"
                             placeholder="0.00"
                             value={line.cr || ''}
                             onChange={e => handleLineChange(line.id, 'cr', e.target.value)}
                             className="font-mono text-right"
                           />
                        </div>
                    </div>
                    <button 
                      onClick={() => removeLine(line.id)}
                      className="hidden md:block absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1 border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                      title="Remove line"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                <div className="pt-2">
                  <Button variant="secondary" size="sm" onClick={addLine}><Plus size={14} className="mr-2"/> Add Entry Line</Button>
                </div>
              </div>
           </div>

           {/* Form Footer Totals */}
           <div className="p-4 bg-white/40 border-t border-white/30 flex flex-col sm:flex-row justify-end gap-4 sm:gap-12 backdrop-blur-md">
               <div className="flex justify-between sm:block text-right">
                 <div className="text-xs uppercase text-slate-600 font-bold mb-1 sm:mb-1">Total Debit</div>
                 <div className="text-xl font-mono font-bold text-slate-800">{formatMoney(editForm.lines.reduce((s,l) => s + Number(l.dr||0), 0))}</div>
               </div>
               <div className="flex justify-between sm:block text-right">
                 <div className="text-xs uppercase text-slate-600 font-bold mb-1 sm:mb-1">Total Credit</div>
                 <div className="text-xl font-mono font-bold text-slate-800">{formatMoney(editForm.lines.reduce((s,l) => s + Number(l.cr||0), 0))}</div>
               </div>
            </div>
        </div>
      )}
    </div>
  );
};