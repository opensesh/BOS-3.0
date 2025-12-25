'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

interface ExtendedThinkingToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export function ExtendedThinkingToggle({
  enabled,
  onToggle,
  disabled,
}: ExtendedThinkingToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle keyboard shortcut: Shift + Cmd + E
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.metaKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (!disabled) {
          onToggle(!enabled);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onToggle, disabled]);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowTooltip(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && onToggle(!enabled)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={disabled}
        className={`
          p-2 rounded-lg transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${enabled
            ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]'
            : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)]'
          }
        `}
        aria-label={enabled ? 'Disable extended thinking' : 'Enable extended thinking'}
        aria-pressed={enabled}
      >
        <Clock className="w-5 h-5" />
      </button>

      {/* Tooltip - positioned relative to this container */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-0 z-[100] pointer-events-none"
          >
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-[var(--shadow-lg)] px-3 py-2 whitespace-nowrap">
              <div className="text-sm text-[var(--fg-primary)]">
                Extended thinking
              </div>
              <div className="text-xs text-[var(--fg-tertiary)] mt-0.5 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-[10px] bg-[var(--bg-tertiary)] rounded border border-[var(--border-secondary)]">⇧</kbd>
                <kbd className="px-1.5 py-0.5 text-[10px] bg-[var(--bg-tertiary)] rounded border border-[var(--border-secondary)]">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-[10px] bg-[var(--bg-tertiary)] rounded border border-[var(--border-secondary)]">E</kbd>
              </div>
            </div>
            {/* Arrow pointing down */}
            <div className="absolute top-full left-4 -mt-px">
              <div className="border-6 border-transparent border-t-[var(--bg-secondary)]" style={{ borderWidth: '6px' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

