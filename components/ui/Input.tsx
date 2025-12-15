import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide drop-shadow-sm">{label}</label>}
      <input
        className={`w-full px-3 py-2 bg-white/50 border border-white/40 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/70 focus:bg-white/80 transition-all backdrop-blur-sm ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
};

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, children, className = '', ...props }) => {
  return (
     <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide drop-shadow-sm">{label}</label>}
      <select
        className={`w-full px-3 py-2 bg-white/50 border border-white/40 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/70 focus:bg-white/80 transition-all appearance-none backdrop-blur-sm ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}