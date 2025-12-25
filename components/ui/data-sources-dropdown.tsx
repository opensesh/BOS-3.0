'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DataSource {
  id: 'web' | 'brand';
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  enabled: boolean;
}

interface DataSourcesDropdownProps {
  webEnabled: boolean;
  brandEnabled: boolean;
  onWebToggle: (enabled: boolean) => void;
  onBrandToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export function DataSourcesDropdown({
  webEnabled,
  brandEnabled,
  onWebToggle,
  onBrandToggle,
  disabled,
}: DataSourcesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ right?: number; left?: number; width?: number }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isActive = webEnabled || brandEnabled;

  // Calculate position
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const calculatePosition = () => {
      const button = buttonRef.current;
      if (!button) return;

      const viewportWidth = window.innerWidth;
      const isMobileOrTablet = viewportWidth < 1024;

      if (isMobileOrTablet) {
        const formContainer = button.closest('form');
        if (formContainer) {
          const containerRect = formContainer.getBoundingClientRect();
          const offsetParent = dropdownRef.current?.offsetParent as HTMLElement;
          const offsetParentRect = offsetParent?.getBoundingClientRect();

          if (offsetParentRect) {
            const rightOffset = offsetParentRect.right - containerRect.right;
            setPosition({
              right: rightOffset,
              left: undefined,
              width: Math.min(containerRect.width, 280),
            });
          } else {
            setPosition({ right: 0, left: undefined, width: 280 });
          }
        } else {
          setPosition({ right: 0, left: undefined, width: 280 });
        }
      } else {
        setPosition({ left: 0, right: undefined, width: 280 });
      }
    };

    requestAnimationFrame(calculatePosition);
    window.addEventListener('resize', calculatePosition);
    return () => window.removeEventListener('resize', calculatePosition);
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const dataSources: DataSource[] = [
    {
      id: 'web',
      icon: Globe,
      title: 'Web Search',
      description: 'Search across the internet for current information',
      enabled: webEnabled,
    },
    {
      id: 'brand',
      icon: Palette,
      title: 'Brand Search',
      description: 'Access brand assets and guidelines',
      enabled: brandEnabled,
    },
  ];

  const handleToggle = (id: 'web' | 'brand') => {
    if (id === 'web') {
      onWebToggle(!webEnabled);
    } else {
      onBrandToggle(!brandEnabled);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          p-2 rounded-lg transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen || isActive
            ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]'
            : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-primary)]'
          }
        `}
        aria-label="Data sources"
        title="Data sources"
      >
        <Globe className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-full mb-2 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] shadow-xl z-50"
            style={{
              right: position.right !== undefined ? position.right : undefined,
              left: position.left !== undefined ? position.left : undefined,
              width: position.width !== undefined ? position.width : undefined,
            }}
          >
            <div className="p-2">
              {dataSources.map((source) => {
                const Icon = source.icon;

                return (
                  <div
                    key={source.id}
                    onClick={() => handleToggle(source.id)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggle(source.id);
                      }
                    }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-[var(--fg-secondary)]" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-medium text-[var(--fg-primary)]">
                        {source.title}
                      </div>
                      {source.description && (
                        <div className="text-xs text-[var(--fg-secondary)] mt-0.5">
                          {source.description}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={`
                          relative w-9 h-5 rounded-full transition-colors
                          ${source.enabled ? 'bg-[var(--bg-brand-solid)]' : 'bg-[var(--bg-tertiary)]'}
                        `}
                        aria-label={`Toggle ${source.title}`}
                      >
                        <span
                          className={`
                            absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm
                            ${source.enabled ? 'translate-x-4' : 'translate-x-0'}
                          `}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

