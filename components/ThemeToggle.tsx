'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  isCollapsed?: boolean;
}

export function ThemeToggle({ isCollapsed = false }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center py-2 px-2 min-h-[52px]">
        <div className="w-8 h-8 animate-pulse bg-[var(--bg-tertiary)] rounded-lg" />
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="
        flex flex-col items-center justify-center
        py-2 px-2 min-h-[52px]
        text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
        transition-colors duration-150 group
      "
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="w-8 h-8 flex items-center justify-center rounded-lg group-hover:bg-[var(--bg-tertiary)] transition-colors duration-150">
        {isDark ? (
          <Sun className="w-[18px] h-[18px]" />
        ) : (
          <Moon className="w-[18px] h-[18px]" />
        )}
      </div>
      <span 
        className="text-[9px] font-medium text-center mt-1 transition-all duration-200 ease-out"
        style={{
          opacity: isCollapsed ? 0 : 1,
          transform: isCollapsed ? 'translateY(-2px)' : 'translateY(0)',
          transitionDelay: isCollapsed ? '0ms' : '150ms',
        }}
      >
        {isDark ? 'Light' : 'Dark'}
      </span>
    </button>
  );
}
