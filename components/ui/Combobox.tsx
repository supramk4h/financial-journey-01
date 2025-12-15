import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

interface ComboboxProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = "Type to search...", 
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Sync input value with selected option label whenever value prop changes
  useEffect(() => {
    const selectedOption = options.find(o => o.value === value);
    if (selectedOption) {
        // Only update if strictly different to avoid cursor jumps if we were the ones who triggered it?
        // Actually, for a controlled component, this is correct.
        setInputValue(selectedOption.label);
    } else if (!value) {
        setInputValue("");
    }
  }, [value, options]);

  // Handle click outside to close and revert text if invalid
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // On blur/close, if the text doesn't match the current value's label, revert it
        // This ensures the input always displays a valid selection or empty
        const selectedOption = options.find(o => o.value === value);
        if (selectedOption) {
            setInputValue(selectedOption.label);
        } else {
            setInputValue("");
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [value, options]);

  const filteredOptions = useMemo(() => {
    if (!inputValue) return options;
    return options.filter(o => 
      o.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [options, inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    
    // If user clears the input, clear the selection
    if (e.target.value === "") {
        onChange("");
    } else {
        // Auto-select if exact match found (case-insensitive)
        const exactMatch = options.find(o => o.label.toLowerCase() === e.target.value.toLowerCase());
        if (exactMatch && exactMatch.value !== value) {
             onChange(exactMatch.value);
        }
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    // inputValue update will happen via useEffect when parent updates prop
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full relative ${className}`} ref={containerRef}>
      {label && <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide drop-shadow-sm">{label}</label>}
      
      <div className="relative group">
        <input
          type="text"
          className="w-full px-3 py-2 bg-white/50 border border-white/40 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/70 focus:bg-white/80 transition-all backdrop-blur-sm pr-8 shadow-sm"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
        />
        
        {/* Helper Icon */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            {value ? (
                <Check size={14} className="text-emerald-500" />
            ) : (
                <ChevronDown size={14} className="opacity-50 group-focus-within:opacity-100 transition-opacity" />
            )}
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white/95 backdrop-blur-xl border border-white/50 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-100 origin-top">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors flex justify-between items-center
                    ${option.value === value 
                      ? 'bg-indigo-50/90 text-indigo-700 font-medium' 
                      : 'text-slate-700 hover:bg-indigo-50/50'
                    }`}
                  onClick={() => handleOptionClick(option.value)}
                >
                  {option.label}
                  {option.value === value && <Check size={14} />}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-slate-400 italic text-center">
                No matching accounts
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};