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
        className="w-full bg-black border border-white/10 rounded-xl p-3.5 text-sm text-white flex justify-between items-center hover:border-white/20 transition-colors focus:border-blue-500 outline-none"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <span className="truncate">{selectedOption?.label || "Select an option"}</span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
      </button>

      {isOpen && (
        <div className={`absolute z-[100] w-full bg-[#0F0F13] border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} py-1`}>
          {options.map((option) => (
            <div
              key={option.value}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                option.value === value ? 'bg-blue-600/10 text-blue-400 font-medium' : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
              onClick={(e) => {
                e.stopPropagation();
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
