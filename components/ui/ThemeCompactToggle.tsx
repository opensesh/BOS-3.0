'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Tooltip, TooltipTrigger } from '@/components/ui/base/tooltip/tooltip';

type ThemeOption = 'dark' | 'light' | 'system';

const themeOptions: { id: ThemeOption; label: string; icon: typeof Moon }[] = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: Monitor },
];

/**
 * Compact theme toggle for use in dropdowns.
 * Displays three icon buttons in a row with tooltips for accessibility.
 * Uses a sliding indicator to show the currently selected theme.
 */
export function ThemeCompactToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Loading placeholder - matches the final dimensions
    return (
      <div className="flex items-center gap-0.5 p-0.5 bg-[var(--bg-tertiary)] rounded-md h-8">
        {themeOptions.map((option) => (
          <div
            key={option.id}
            className="w-8 h-7 rounded bg-[var(--bg-quaternary)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  const currentTheme = theme as ThemeOption;

  return (
    <div 
      className="flex items-center gap-0.5 p-0.5 bg-[var(--bg-tertiary)] rounded-md"
      role="radiogroup"
      aria-label="Theme selection"
    >
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = currentTheme === option.id;
        
        return (
          <Tooltip
            key={option.id}
            title={option.label}
            placement="bottom"
            delay={400}
          >
            <TooltipTrigger
              onPress={() => setTheme(option.id)}
              aria-label={`${option.label} theme`}
              aria-checked={isSelected}
              className={`
                relative flex items-center justify-center
                w-8 h-7 rounded
                transition-colors duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fg-brand-primary)] focus-visible:ring-offset-1
                ${isSelected 
                  ? 'text-[var(--fg-primary)]' 
                  : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
                }
              `}
            >
              {isSelected && (
                <motion.div
                  layoutId="theme-compact-indicator"
                  className="absolute inset-0 bg-[var(--bg-secondary)] rounded shadow-sm border border-[var(--border-secondary)]"
                  transition={{ type: 'spring', duration: 0.25, bounce: 0.1 }}
                />
              )}
              <Icon className="relative z-10 w-3.5 h-3.5" />
            </TooltipTrigger>
          </Tooltip>
        );
      })}
    </div>
  );
}

