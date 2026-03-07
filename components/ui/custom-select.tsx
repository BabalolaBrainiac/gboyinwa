'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  color?: string;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  showCheckmark?: boolean;
  disabled?: boolean;
}

export function CustomSelect({
  value,
  options,
  onChange,
  placeholder = 'Select...',
  label,
  className = '',
  triggerClassName = '',
  dropdownClassName = '',
  showCheckmark = true,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(optionValue: string) {
    onChange(optionValue);
    setIsOpen(false);
  }

  function toggleDropdown() {
    if (!disabled) setIsOpen(!isOpen);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-1.5">
          {label}
        </label>
      )}
      
      {/* Trigger */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-brand-black text-left transition-all duration-200 ${
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:border-brand-green/40 dark:hover:border-brand-yellow/40 cursor-pointer'
        } ${triggerClassName}`}
      >
        {selectedOption?.icon || (selectedOption?.color && (
          <span 
            className="w-3 h-3 rounded-full shrink-0" 
            style={{ backgroundColor: selectedOption.color }}
          />
        ))}
        <span className={`flex-1 text-sm truncate ${selectedOption ? 'text-brand-black dark:text-brand-yellow' : 'text-gray-400'}`}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${dropdownClassName}`}>
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors text-left ${
                  value === option.value
                    ? 'bg-brand-green/10 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow font-medium'
                    : 'text-brand-black dark:text-brand-yellow hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                {option.icon || (option.color && (
                  <span 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: option.color }}
                  />
                ))}
                <span className="flex-1 truncate">{option.label}</span>
                {showCheckmark && value === option.value && (
                  <Check className="w-4 h-4 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Simpler version for compact inline use
interface CompactSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
}

export function CompactSelect({ value, options, onChange, className = '' }: CompactSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black hover:border-brand-green/40 dark:hover:border-brand-yellow/40 transition-colors text-sm"
      >
        {selectedOption?.icon || (selectedOption?.color && (
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedOption.color }} />
        ))}
        <span className="text-brand-black dark:text-brand-yellow">{selectedOption?.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                  value === option.value
                    ? 'bg-brand-green/10 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow font-medium'
                    : 'text-brand-black dark:text-brand-yellow hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                {option.icon || (option.color && (
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: option.color }} />
                ))}
                <span className="flex-1 truncate">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
