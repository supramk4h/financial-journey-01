import React, { useState, useEffect, useMemo } from 'react';
import { Account, LedgerState } from '../types';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { Trash2, Edit2, Plus, X, Wallet, Pin, Search } from 'lucide-react';
import { LedgerService } from '../services/ledgerService';

interface AccountsProps {
  state: LedgerState;
  onAdd: (acc: Omit<Account, 'id' | 'serial'>) => void;
  onUpdate: (id: string, acc: Partial<Account>) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

const PREDEFINED_TYPES = ['cash', 'bank', 'income', 'expense', 'liability', 'asset'];
const DRAFT_KEY = 'ledger_acc_draft';

export const Accounts: React.FC<AccountsProps> = ({ state, onAdd, onUpdate, onDelete, onTogglePin }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    narration: '',
    openingBalance: '0'
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCustomType, setIsCustomType] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const balances = useMemo(() => LedgerService.calculateBalances(state.accounts, state.transactions), [state.accounts, state.transactions]);

  // Resume Draft Logic
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (window.confirm('You have an unsaved account draft. Do you want to resume?')) {
           setFormData(parsed.formData);
           setEditingId(parsed.editingId);
           setIsCustomType(parsed.isCustomType);
           setIsModalOpen(true);
        } else {
           localStorage.removeItem(DRAFT_KEY);
        }
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, []);

  // Auto-save Draft Logic
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isModalOpen) {
      timeout = setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          formData,
          editingId,
          isCustomType
        }));
      }, 1000);
    }
    return () => clearTimeout(timeout);
  }, [isModalOpen, formData, editingId, isCustomType]);


  const verifyAdmin = () => {
    const pwd = prompt("Enter Admin Password:");
    if (pwd === "6667") return true;
    alert("Access Denied: Incorrect Password");
    return false;
  };

  const openModal = (acc?: Account) => {
    if (acc) {
      // Protect Edit Action
      if (!verifyAdmin()) return;

      setEditingId(acc.id);
      const normalizedType = acc.type.toLowerCase();
      const isPredefined = PREDEFINED_TYPES.includes(normalizedType);
      setIsCustomType(!isPredefined);
      setFormData({
        name: acc.name,
        type: acc.type,
        narration: acc.narration,
        openingBalance: String(acc.openingBalance)
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', type: '', narration: '', openingBalance: '0' });
      setIsCustomType(false);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    // Clear draft when explicitly cancelled/closed
    localStorage.removeItem(DRAFT_KEY);
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.name) return alert('Account name is required');
    if (!formData.type) return alert('Account type is required');
    
    if (editingId) {
      onUpdate(editingId, {
        name: formData.name,
        type: formData.type,
        narration: formData.narration,
        openingBalance: parseFloat(formData.openingBalance) || 0
      });
    } else {
      onAdd({
        name: formData.name,
        type: formData.type,
        narration: formData.narration,
        openingBalance: parseFloat(formData.openingBalance) || 0
      });
    }
    closeModal(); // This will clear the draft
  };

  const handleDelete = (id: string) => {
    // Protect Delete Action
    if (verifyAdmin()) {
      onDelete(id);
    }
  };

  const formatMoney = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const selectValue = PREDEFINED_TYPES.includes(formData.type.toLowerCase()) 
    ? formData.type.toLowerCase() 
    : (isCustomType ? 'other' : '');

  const filteredAccounts = useMemo(() => {
      const term = searchTerm.toLowerCase();
      return state.accounts.filter(acc => 
        acc.name.toLowerCase().includes(term) ||
        acc.type.toLowerCase().includes(term) ||
        (acc.narration && acc.narration.toLowerCase().includes(term))
      );
  }, [state.accounts, searchTerm]);

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* Header Actions */}
      <div className="bg-white/60 backdrop-blur-xl p-4 rounded-xl border border-white/40 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 min-w-fit">
           <Wallet className="text-indigo-600" size={24} />
           <h2 className="text-xl font-bold text-slate-800">Account Registry</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1 justify-end">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search accounts..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/50 border border-white/40 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/70 focus:bg-white/80 transition-all backdrop-blur-sm shadow-sm"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <Button onClick={() => openModal()} className="w-full sm:w-auto whitespace-nowrap">
            <Plus size={18} className="mr-2" /> New Account
          </Button>
        </div>
      </div>

      {/* Account List */}
      <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-xl overflow-hidden flex flex-col min-h-0">
         <div className="overflow-auto flex-1 custom-scrollbar">
           <table className="w-full text-left text-sm">
             <thead className="bg-white/40 sticky top-0 z-10 shadow-sm border-b border-white/30 backdrop-blur-md">
               <tr>
                 <th className="px-6 py-4 font-bold text-slate-700 w-20 text-center uppercase text-xs tracking-wider hidden sm:table-cell">#</th>
                 <th className="px-6 py-4 font-bold text-slate-700 uppercase text-xs tracking-wider">Account Name</th>
                 <th className="px-6 py-4 font-bold text-slate-700 uppercase text-xs tracking-wider hidden md:table-cell">Type</th>
                 <th className="px-6 py-4 font-bold text-slate-700 text-right uppercase text-xs tracking-wider hidden lg:table-cell">Opening</th>
                 <th className="px-6 py-4 font-bold text-slate-700 text-right uppercase text-xs tracking-wider">Current Balance</th>
                 <th className="px-6 py-4 font-bold text-slate-700 text-right w-36 uppercase text-xs tracking-wider">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-white/20">
               {filteredAccounts.length === 0 && (
                 <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                     <div className="flex flex-col items-center justify-center gap-2">
                        {searchTerm ? (
                            <>
                                <Search size={32} strokeWidth={1.5} className="text-slate-400 mb-2"/>
                                <p>No accounts match "{searchTerm}"</p>
                                <Button variant="secondary" size="sm" onClick={() => setSearchTerm('')}>Clear Search</Button>
                            </>
                        ) : (
                            <>
                                <Wallet size={32} strokeWidth={1.5} />
                                <p>No accounts found.</p>
                                <Button variant="secondary" size="sm" onClick={() => openModal()}>Create your first account</Button>
                            </>
                        )}
                     </div>
                   </td>
                 </tr>
               )}
               {[...filteredAccounts].sort((a,b) => a.serial - b.serial).map((acc) => (
                 <tr key={acc.id} className="hover:bg-white/40 transition-colors group">
                   <td className="px-6 py-4 text-center text-slate-500 font-mono font-semibold hidden sm:table-cell">{acc.serial}</td>
                   <td className="px-6 py-4 font-medium text-slate-800">
                     <div className="text-base flex items-center gap-2">
                       {acc.name}
                       {acc.pinned && <Pin size={12} className="text-indigo-600 fill-indigo-600" />}
                     </div>
                     {acc.narration && <div className="text-xs text-slate-500 font-normal mt-0.5">{acc.narration}</div>}
                     {/* Show type on mobile in subtitle */}
                     <div className="md:hidden mt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{acc.type}</span>
                     </div>
                   </td>
                   <td className="px-6 py-4 hidden md:table-cell">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize backdrop-blur-sm
                       ${acc.type === 'bank' ? 'bg-blue-100/70 text-blue-800 border border-blue-200/50' : 
                         acc.type === 'cash' ? 'bg-emerald-100/70 text-emerald-800 border border-emerald-200/50' :
                         'bg-slate-200/60 text-slate-700 border border-slate-300/50'}`}>
                       {acc.type}
                     </span>
                   </td>
                   <td className="px-6 py-4 text-right text-slate-600 font-mono hidden lg:table-cell">{formatMoney(acc.openingBalance)}</td>
                   <td className="px-6 py-4 text-right">
                     <span className={`font-mono font-bold ${balances.get(acc.id)! < 0 ? 'text-red-600' : 'text-indigo-800'}`}>
                       {formatMoney(balances.get(acc.id) || 0)}
                     </span>
                   </td>
                   <td className="px-6 py-4 text-right">
                     <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={() => onTogglePin(acc.id)} 
                         className={`p-2 rounded-lg transition-colors ${acc.pinned ? 'bg-indigo-100/80 text-indigo-700' : 'hover:bg-white/60 text-slate-500 hover:text-indigo-600'}`} 
                         title={acc.pinned ? "Unpin Account" : "Pin Account"}
                       >
                         <Pin size={16} fill={acc.pinned ? "currentColor" : "none"} />
                       </button>
                       <button onClick={() => openModal(acc)} className="p-2 hover:bg-white/60 text-slate-600 rounded-lg transition-colors" title="Edit">
                         <Edit2 size={16} />
                       </button>
                       <button onClick={() => handleDelete(acc.id)} className="p-2 hover:bg-red-100/60 text-red-600 rounded-lg transition-colors" title="Delete">
                         <Trash2 size={16} />
                       </button>
                     </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      </div>

      {/* Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white/90 backdrop-blur-2xl rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-white/50">
            <div className="p-5 border-b border-slate-200/50 flex justify-between items-center bg-white/50">
              <h3 className="font-bold text-lg text-slate-800">{editingId ? 'Edit Account' : 'New Account'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-5 overflow-auto custom-scrollbar">
              <Input 
                label="Account Name" 
                placeholder="e.g. Petty Cash" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                autoFocus
              />
              
              <Select 
                label="Account Type" 
                value={selectValue} 
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'other') {
                    setIsCustomType(true);
                    setFormData(prev => ({...prev, type: ''}));
                  } else {
                    setIsCustomType(false);
                    setFormData(prev => ({...prev, type: val}));
                  }
                }}
              >
                <option value="">-- Select Type --</option>
                {PREDEFINED_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
                <option value="other">Other (Custom)</option>
              </Select>

              {isCustomType && (
                <Input 
                  label="Custom Type Name"
                  placeholder="Enter custom type"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="bg-indigo-50/50 border-indigo-200"
                />
              )}

              <Input 
                label="Narration / Description" 
                placeholder="Optional details" 
                value={formData.narration} 
                onChange={e => setFormData({...formData, narration: e.target.value})} 
              />
              
              <Input 
                label="Opening Balance" 
                type="number" 
                step="0.01" 
                value={formData.openingBalance} 
                onChange={e => setFormData({...formData, openingBalance: e.target.value})} 
              />
            </div>

            <div className="p-5 border-t border-slate-200/50 bg-white/40 flex gap-3">
              <Button onClick={handleSubmit} className="flex-1">
                {editingId ? 'Save Changes' : 'Create Account'}
              </Button>
              <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};