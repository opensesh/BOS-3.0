'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { setLocale } from '@/lib/locale-actions';

interface LanguageSelectorProps {
  /** Variant style - 'dropdown' for profile dropdown, 'standalone' for settings */
  variant?: 'dropdown' | 'standalone';
}

/**
 * Language selector component for changing the application locale.
 * Uses a popover design with smooth animations.
 */
export function LanguageSelector({ variant = 'dropdown' }: LanguageSelectorProps) {
  const currentLocale = useLocale() as Locale;
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleLocaleChange = (locale: Locale) => {
    startTransition(async () => {
      await setLocale(locale);
      setIsOpen(false);
      // Reload the page to apply new locale
      window.location.reload();
    });
  };

  if (variant === 'dropdown') {
    return (
      <div ref={containerRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isPending}
          className="
            w-full flex items-center justify-between
            px-4 py-2
            text-left
            hover:bg-[var(--bg-tertiary)]
            transition-colors
            disabled:opacity-50
          "
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-[var(--fg-tertiary)]" />
            <span className="text-sm text-[var(--fg-secondary)]">
              {localeNames[currentLocale]}
            </span>
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-[var(--fg-tertiary)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="
                absolute left-0 right-0 mt-1
                bg-[var(--bg-tertiary)]
                rounded-md
                border border-[var(--border-secondary)]
                shadow-lg
                z-50
                overflow-hidden
              "
              role="listbox"
              aria-label="Select language"
            >
              {locales.map((locale) => {
                const isSelected = locale === currentLocale;
                return (
                  <button
                    key={locale}
                    onClick={() => handleLocaleChange(locale)}
                    disabled={isPending}
                    className={`
                      w-full flex items-center gap-2
                      px-3 py-2
                      text-left text-sm
                      transition-colors
                      ${isSelected 
                        ? 'bg-[var(--bg-quaternary)] text-[var(--fg-primary)]' 
                        : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-quaternary)] hover:text-[var(--fg-primary)]'
                      }
                    `}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-[var(--fg-brand-primary)]" />}
                    {!isSelected && <span className="w-3.5" />}
                    <span>{localeNames[locale]}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Standalone variant for settings page
  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="
          flex items-center justify-between
          w-full px-3 py-2.5
          bg-[var(--bg-tertiary)]
          border border-[var(--border-secondary)]
          rounded-lg
          text-sm text-[var(--fg-primary)]
          hover:border-[var(--border-primary)]
          transition-colors
          disabled:opacity-50
        "
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[var(--fg-tertiary)]" />
          <span>{localeNames[currentLocale]}</span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-[var(--fg-tertiary)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="
              absolute top-full left-0 right-0 mt-1
              bg-[var(--bg-secondary)]
              rounded-lg
              border border-[var(--border-secondary)]
              shadow-lg
              z-50
              overflow-hidden
            "
            role="listbox"
            aria-label="Select language"
          >
            {locales.map((locale) => {
              const isSelected = locale === currentLocale;
              return (
                <button
                  key={locale}
                  onClick={() => handleLocaleChange(locale)}
                  disabled={isPending}
                  className={`
                    w-full flex items-center gap-2
                    px-3 py-2.5
                    text-left text-sm
                    transition-colors
                    ${isSelected 
                      ? 'bg-[var(--bg-tertiary)] text-[var(--fg-primary)]' 
                      : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                    }
                  `}
                  role="option"
                  aria-selected={isSelected}
                >
                  {isSelected && <Check className="w-4 h-4 text-[var(--fg-brand-primary)]" />}
                  {!isSelected && <span className="w-4" />}
                  <span>{localeNames[locale]}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

