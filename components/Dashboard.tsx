import React, { useMemo } from 'react';
import { LedgerState } from '../types';
import { LedgerService } from '../services/ledgerService';
import { Wallet, Landmark, TrendingUp, Pin } from 'lucide-react';

interface DashboardProps {
  state: LedgerState;
}

export const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const stats = useMemo(() => LedgerService.getDashboardStats(state), [state]);
  const balances = useMemo(() => LedgerService.calculateBalances(state.accounts, state.transactions), [state]);
  const pinnedAccounts = state.accounts.filter(a => a.pinned);

  const formatMoney = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {pinnedAccounts.length > 0 && (
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-xl overflow-hidden">
           <div className="p-4 border-b border-white/30 bg-white/40 flex items-center gap-2">
              <Pin size={18} className="text-indigo-600 fill-indigo-600" />
              <h3 className="font-bold text-slate-700">Pinned Accounts</h3>
           </div>
           <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {pinnedAccounts.map(acc => {
                 const bal = balances.get(acc.id) || 0;
                 return (
                    <div key={acc.id} className="p-4 rounded-lg border border-white/40 bg-white/50 shadow-sm flex flex-col hover:bg-white/70 hover:border-indigo-200 transition-all backdrop-blur-sm">
                       <div className="flex justify-between items-start">
                         <div className="text-xs text-slate-600 uppercase font-bold tracking-wider truncate flex-1 mr-2" title={acc.name}>{acc.name}</div>
                         <div className={`w-2 h-2 rounded-full ${bal >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                       </div>
                       <div className={`text-xl font-mono font-bold mt-2 ${bal >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {formatMoney(bal)}
                       </div>
                    </div>
                 )
              })}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="bg-white/60 backdrop-blur-xl p-6 rounded-xl border border-white/40 flex items-center justify-between shadow-xl hover:bg-white/70 transition-all">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100/80 rounded-full text-green-700 backdrop-blur-sm"><Landmark size={24}/></div>
                <div>
                  <div className="text-xs text-slate-600 uppercase font-bold tracking-wider">Bank Total</div>
                  <div className="text-xl font-bold text-slate-800 mt-0.5">{formatMoney(stats.bankTotal)}</div>
                </div>
            </div>
         </div>
         <div className="bg-white/60 backdrop-blur-xl p-6 rounded-xl border border-white/40 flex items-center justify-between shadow-xl hover:bg-white/70 transition-all">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100/80 rounded-full text-emerald-700 backdrop-blur-sm"><Wallet size={24}/></div>
                <div>
                  <div className="text-xs text-slate-600 uppercase font-bold tracking-wider">Cash Total</div>
                  <div className="text-xl font-bold text-slate-800 mt-0.5">{formatMoney(stats.cashTotal)}</div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};