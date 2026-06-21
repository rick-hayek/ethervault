import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface DropdownOption {
  value: string | number;
  label: React.ReactNode;
  dotColor?: string;
}

export interface CustomDropdownProps {
  value: string | number;
  onChange: (value: any) => void;
  options: DropdownOption[];
  buttonClassName?: string;
  menuClassName?: string;
  fullWidth?: boolean;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  buttonClassName,
  menuClassName,
  fullWidth = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'down' | 'up'>('down');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Estimated height of the open dropdown menu (300px is safe threshold)
      if (spaceBelow < 300 && spaceAbove > spaceBelow) {
        setDropdownPosition('up');
      } else {
        setDropdownPosition('down');
      }
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  // Default Settings style if none provided
  const defaultBtnClass = "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-normal text-slate-700 dark:text-slate-300 uppercase rounded-xl py-1.5 px-3 outline-none hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-all flex items-center gap-1.5 select-none";
  const defaultMenuClass = "absolute right-0 z-50 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl overflow-hidden py-1 animate-in fade-in duration-150";

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName || defaultBtnClass}
      >
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
          {selectedOption?.dotColor && (
            <span className={`w-1.5 h-1.5 rounded-full ${selectedOption.dotColor} shrink-0`} />
          )}
          <span>{selectedOption?.label}</span>
        </div>
        <ChevronDown className={`w-3 h-3 text-slate-450 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`${menuClassName || defaultMenuClass} ${
          dropdownPosition === 'up'
            ? 'bottom-full mb-2 slide-in-from-bottom-2'
            : 'top-full mt-2 slide-in-from-top-2'
        }`}>
          {options.map((opt, index) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs md:text-[11px] font-normal transition-colors ${
                  isSelected
                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-normal'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                } ${index > 0 ? 'border-t border-slate-50 dark:border-slate-850' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {opt.dotColor && (
                    <span className={`w-1.5 h-1.5 rounded-full ${opt.dotColor} shrink-0`} />
                  )}
                  <span>{opt.label}</span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
