'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { setLocale } from '@/lib/locale-actions';

interface LanguageSelectorProps {
  /** Variant style - 'dropdown' for profile dropdown, 'standalone' for settings, 'mobile' for mobile menu */
  variant?: 'dropdown' | 'standalone' | 'mobile';
}

/**
 * Language selector component for changing the application locale.
 * Uses an expandable accordion design with smooth animations and scrollable list.
 */
export function LanguageSelector({ variant = 'dropdown' }: LanguageSelectorProps) {
  const currentLocale = useLocale() as Locale;
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on escape (only for standalone/mobile variants that don't have parent dropdowns)
  useEffect(() => {
    if (!isOpen || variant === 'dropdown') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, variant]);

  const handleLocaleChange = (locale: Locale) => {
    startTransition(async () => {
      await setLocale(locale);
      setIsOpen(false);
      // Don't reload immediately - let the user continue browsing
      // The new locale will take effect on next navigation
    });
  };

  // Dropdown variant - expandable accordion style like "Add to Space"
  if (variant === 'dropdown') {
    return (
      <div ref={containerRef}>
        {/* Trigger button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isPending}
          className={`
            w-full flex items-center justify-between
            px-4 py-2
            text-left
            transition-colors duration-150
            disabled:opacity-50
            ${isOpen
              ? 'bg-[var(--bg-tertiary)] text-[var(--fg-primary)]'
              : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
            }
          `}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-[var(--fg-tertiary)]" />
            <span className="text-sm">
              {localeNames[currentLocale]}
            </span>
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-[var(--fg-tertiary)] transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
          />
        </button>

        {/* Expandable list */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden border-t border-[var(--border-secondary)]"
            >
              <div 
                className="max-h-[120px] overflow-y-auto py-1"
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
                        w-full flex items-center justify-between
                        px-4 py-2
                        text-left text-sm
                        transition-colors duration-150
                        ${isSelected 
                          ? 'bg-[var(--bg-tertiary)] text-[var(--fg-primary)]' 
                          : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                        }
                      `}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span>{localeNames[locale]}</span>
                      {isSelected && <Check className="w-4 h-4 text-[var(--fg-brand-primary)]" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Mobile variant - larger touch targets for mobile/tablet
  if (variant === 'mobile') {
    return (
      <div ref={containerRef}>
        {/* Trigger button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isPending}
          className={`
            w-full flex items-center justify-between
            px-4 py-3.5
            rounded-xl
            text-left
            transition-colors duration-150
            disabled:opacity-50
            ${isOpen
              ? 'bg-[var(--bg-tertiary)] text-[var(--fg-primary)]'
              : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
            }
          `}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium text-sm">Language</p>
              <p className="text-xs text-[var(--fg-tertiary)]">{localeNames[currentLocale]}</p>
            </div>
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-[var(--fg-quaternary)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {/* Expandable list */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div 
                className="max-h-[180px] overflow-y-auto bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-secondary)] mt-2"
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
                        w-full flex items-center justify-between
                        px-4 py-3
                        text-left text-sm
                        transition-colors duration-150
                        border-b border-[var(--border-secondary)] last:border-b-0
                        ${isSelected 
                          ? 'bg-[var(--bg-tertiary)] text-[var(--fg-primary)]' 
                          : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                        }
                      `}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="font-medium">{localeNames[locale]}</span>
                      {isSelected && <Check className="w-4 h-4 text-[var(--fg-brand-primary)]" />}
                    </button>
                  );
                })}
              </div>
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
            <div className="max-h-[160px] overflow-y-auto">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

