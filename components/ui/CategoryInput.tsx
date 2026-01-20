'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CategoryInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  existingCategories: string[];
  placeholder?: string;
  className?: string;
}

export function CategoryInput({
  id,
  value,
  onChange,
  existingCategories,
  placeholder = 'e.g., Documentation',
  className,
}: CategoryInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter categories based on input
  useEffect(() => {
    if (value.trim()) {
      const filtered = existingCategories.filter((cat) =>
        cat.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(existingCategories);
    }
  }, [value, existingCategories]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (category: string) => {
    onChange(category);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const showDropdown = isOpen && filteredCategories.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={className}
        />
        {existingCategories.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] shadow-lg max-h-40 overflow-auto">
          {filteredCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleSelect(cat)}
              className="w-full px-3 py-2 text-left text-sm text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
