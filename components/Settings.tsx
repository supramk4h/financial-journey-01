import React from 'react';
import { Button } from './ui/Button';
import { LedgerState } from '../types';
import { Download, Trash2, Upload, AlertTriangle, Database, Activity, Server, Hash, Clock } from 'lucide-react';

interface SettingsProps {
  state: LedgerState;
  onClear: () => void;
  onImport: (file: File) => void;
  onExport: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ state, onClear, onImport, onExport }) => {
  const verifyAdmin = () => {
    const pwd = prompt("Enter Admin Password:");
    if (pwd === "6667") return true;
    alert("Access Denied: Incorrect Password");
    return false;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (verifyAdmin()) {
        onImport(e.target.files[0]);
      } else {
        e.target.value = ''; // Reset input
      }
    }
  };

  const handleExport = () => {
    if (verifyAdmin()) {
      onExport();
    }
  };

  const handleClear = () => {
    if (verifyAdmin()) {
      onClear();
    }
  };

  // Calculate System Status Stats
  const storageSize = (JSON.stringify(state).length / 1024).toFixed(2);
  const totalDr = state.transactions.reduce((acc, tx) => acc + tx.lines.reduce((s, l) => s + Number(l.dr), 0), 0);
  const lastActivity = state.transactions.length > 0 
    ? new Date(Math.max(...state.transactions.map(t => t.timestamp || 0))).toLocaleString()
    : 'No activity';

  // Generate Log History from Transactions
  // Since we don't have a separate audit log, we derive it from transaction timestamps
  const logs = [...state.transactions]
    .filter(t => t.timestamp) // Only those with timestamps
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 50); // Last 50 items

  return (
    <div className="h-full overflow-y-auto px-1 pb-6 animate-in fade-in duration-500 custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* System Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-xl p-6 flex flex-col justify-between hover:bg-white/70 transition-all">
             <div className="flex items-center gap-3 text-slate-600 mb-2">
                <div className="p-2 bg-blue-100/70 text-blue-700 rounded-lg backdrop-blur-sm"><Server size={20}/></div>
                <span className="text-sm font-semibold uppercase tracking-wider">System Health</span>
             </div>
             <div className="space-y-2">
               <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Storage Used</span>
                  <span className="font-mono font-bold text-slate-800">{storageSize} KB</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-slate-600">DB Version</span>
                  <span className="font-mono font-bold text-slate-800">v1.2</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Status</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online</span>
               </div>
             </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-xl p-6 flex flex-col justify-between hover:bg-white/70 transition-all">
             <div className="flex items-center gap-3 text-slate-600 mb-2">
                <div className="p-2 bg-indigo-100/70 text-indigo-700 rounded-lg backdrop-blur-sm"><Hash size={20}/></div>
                <span className="text-sm font-semibold uppercase tracking-wider">Counters</span>
             </div>
             <div className="space-y-2">
               <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Accounts</span>
                  <span className="font-mono font-bold text-slate-800">{state.accounts.length}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Vouchers</span>
                  <span className="font-mono font-bold text-slate-800">{state.transactions.length}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Next Voucher #</span>
                  <span className="font-mono font-bold text-slate-800">{state.meta.nextVoucherNo}</span>
               </div>
             </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-xl p-6 flex flex-col justify-between hover:bg-white/70 transition-all">
             <div className="flex items-center gap-3 text-slate-600 mb-2">
                <div className="p-2 bg-purple-100/70 text-purple-700 rounded-lg backdrop-blur-sm"><Activity size={20}/></div>
                <span className="text-sm font-semibold uppercase tracking-wider">Activity Volume</span>
             </div>
             <div className="space-y-2">
               <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Posted Volume</span>
                  <span className="font-mono font-bold text-slate-800">{totalDr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Last Activity</span>
                  <span className="font-mono font-bold text-slate-800 text-xs text-right truncate max-w-[120px]" title={lastActivity}>{lastActivity}</span>
               </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Data Management Section */}
          <div className="lg:col-span-1 bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-xl overflow-hidden h-fit">
            <div className="p-6 border-b border-white/30 bg-white/40">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Database className="text-indigo-600" size={20} />
                Data Management
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Export */}
              <div className="flex flex-col gap-2 p-4 border border-white/40 bg-white/40 rounded-lg hover:bg-white/60 transition-colors">
                <h3 className="font-medium text-slate-800 text-sm">Export Data</h3>
                <p className="text-xs text-slate-500 mb-2">Download a JSON backup of all accounts and transactions.</p>
                <Button onClick={handleExport} variant="secondary" size="sm" className="w-full bg-white/50 hover:bg-white">
                  <Download size={14} className="mr-2" /> Export JSON
                </Button>
              </div>

              {/* Import */}
              <div className="flex flex-col gap-2 p-4 border border-white/40 bg-white/40 rounded-lg hover:bg-white/60 transition-colors">
                <h3 className="font-medium text-slate-800 text-sm">Import Data</h3>
                <p className="text-xs text-slate-500 mb-2">Restore data from a backup file. Overwrites current data.</p>
                <div className="relative">
                   <input type="file" accept=".json" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   <Button variant="secondary" size="sm" className="w-full bg-white/50 hover:bg-white">
                     <Upload size={14} className="mr-2" /> Import JSON
                   </Button>
                </div>
              </div>

              {/* Clear / Reset */}
              <div className="flex flex-col gap-2 p-4 border border-red-200/50 bg-red-50/40 rounded-lg backdrop-blur-sm">
                <h3 className="font-medium text-red-800 flex items-center gap-2 text-sm">
                  <AlertTriangle size={14} /> Danger Zone
                </h3>
                <p className="text-xs text-red-700/80 mb-2">Permanently delete all data. This action cannot be undone.</p>
                <Button onClick={handleClear} variant="danger" size="sm" className="w-full shadow-lg shadow-red-200/50">
                  <Trash2 size={14} className="mr-2" /> Clear All Data
                </Button>
              </div>
            </div>
          </div>

          {/* Log History Section */}
          <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-xl overflow-hidden flex flex-col h-96">
            <div className="p-6 border-b border-white/30 bg-white/40 flex justify-between items-center">
               <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Clock className="text-indigo-600" size={20} />
                Log History
              </h2>
              <span className="text-xs font-mono text-slate-600 bg-white/50 border border-white/40 px-2 py-1 rounded backdrop-blur-sm">Last 50 Events</span>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
               <table className="w-full text-left text-sm">
                  <thead className="bg-white/40 sticky top-0 border-b border-white/30 text-slate-600 z-10 backdrop-blur-md">
                     <tr>
                        <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Timestamp</th>
                        <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Action</th>
                        <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Details</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/20">
                     {logs.length === 0 && (
                        <tr>
                           <td colSpan={3} className="px-6 py-12 text-center text-slate-500">No activity logs recorded yet.</td>
                        </tr>
                     )}
                     {logs.map(log => (
                        <tr key={log.id} className="hover:bg-white/40">
                           <td className="px-6 py-3 font-mono text-slate-600 whitespace-nowrap text-xs">
                              {new Date(log.timestamp).toLocaleString()}
                           </td>
                           <td className="px-6 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium backdrop-blur-sm ${log.posted ? 'bg-green-100/70 text-green-800 border border-green-200/50' : 'bg-yellow-100/70 text-yellow-800 border border-yellow-200/50'}`}>
                                 {log.posted ? 'VOUCHER POSTED' : 'DRAFT SAVED'}
                              </span>
                           </td>
                           <td className="px-6 py-3 text-slate-700">
                              Voucher <span className="font-mono font-bold">#{log.voucherNo}</span> - <span className="italic text-slate-500">{log.narration || 'No narration'}</span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};