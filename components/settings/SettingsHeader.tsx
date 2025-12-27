'use client';

import { Search } from 'lucide-react';

interface SettingsHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function SettingsHeader({ searchQuery, onSearchChange }: SettingsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Title */}
      <h1 className="text-2xl font-semibold text-[var(--fg-primary)]">
        Settings
      </h1>

      {/* Search Input */}
      <div className="relative w-full sm:w-auto sm:min-w-[200px] sm:max-w-[320px]">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-[var(--fg-quaternary)]" />
        </div>
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="
            w-full
            pl-10 pr-3 py-2
            bg-[var(--bg-primary)]
            border border-[var(--border-primary)]
            rounded-lg
            text-[var(--fg-primary)]
            text-base
            placeholder:text-[var(--fg-placeholder)]
            focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]
            shadow-xs
            transition-shadow
          "
        />
        {/* Keyboard shortcut badge */}
        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
          <kbd className="
            hidden sm:inline-flex items-center
            px-1.5 py-0.5
            text-xs font-medium
            text-[var(--fg-quaternary)]
            border border-[var(--border-secondary)]
            rounded
          ">
            ⌘K
          </kbd>
        </div>
      </div>
    </div>
  );
}

