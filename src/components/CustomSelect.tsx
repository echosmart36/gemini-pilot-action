import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  position?: 'top' | 'bottom';
}

export default function CustomSelect({ options, value, onChange, position = 'bottom' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative w-full font-sans" ref={dropdownRef}>
      <button
        type="button"
        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white flex justify-between items-center hover:bg-white/10 transition-colors focus:border-blue-500 outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedOption?.label || "Select an option"}</span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
      </button>

      {isOpen && (
        <div className={`absolute z-50 w-full bg-[#1a1b1e] border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
          {options.map((option) => (
            <div
              key={option.value}
              className={`p-3 text-sm cursor-pointer hover:bg-white/10 transition-colors ${
                option.value === value ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300'
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
          {options.length === 0 && (
            <div className="p-3 text-sm text-gray-500">No options available</div>
          )}
        </div>
      )}
    </div>
  );
}
