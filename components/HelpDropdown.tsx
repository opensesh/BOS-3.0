'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Heart,
  PlayCircle,
  BookOpen,
  LifeBuoy,
} from 'lucide-react';

interface HelpDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const helpMenuItems = [
  {
    id: 'blogs',
    label: 'Blogs',
    icon: FileText,
    description: 'Latest industry news and guides',
  },
  {
    id: 'customer-stories',
    label: 'Customer Stories',
    icon: Heart,
    description: 'How customers use our platform',
  },
  {
    id: 'video-tutorials',
    label: 'Video Tutorials',
    icon: PlayCircle,
    description: 'Get up and running quickly',
  },
  {
    id: 'documentation',
    label: 'Documentation',
    icon: BookOpen,
    description: 'In-depth articles and guides',
  },
  {
    id: 'help-support',
    label: 'Help and Support',
    icon: LifeBuoy,
    description: 'Our team is here to help',
  },
];

export function HelpDropdown({ isOpen, onClose, triggerRef }: HelpDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blur overlay - covers main content area only */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="
              fixed inset-0
              top-14 left-14
              backdrop-blur-sm
              bg-black/5
              z-[150]
              pointer-events-none
            "
            aria-hidden="true"
          />
          
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="
              absolute top-full right-0 mt-5
              w-80
              bg-[var(--bg-secondary)]
              rounded-lg
              border border-[var(--border-secondary)]
              shadow-lg
              z-[200]
              overflow-hidden
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 min-h-[52px] border-b border-[var(--border-secondary)]">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[var(--fg-primary)]">
                  Need help?
                </h3>
              </div>
            </div>

          {/* Menu Items */}
          <div className="py-1">
            {helpMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    // Handle item click - in real app, navigate or open modal
                    onClose();
                  }}
                  className="
                    w-full flex items-center gap-3
                    px-4 py-3
                    text-left
                    hover:bg-[var(--bg-tertiary)]
                    transition-colors
                  "
                >
                  <div className="
                    w-8 h-8 rounded-lg
                    bg-[var(--bg-tertiary)]
                    border border-[var(--border-secondary)]
                    flex items-center justify-center
                    flex-shrink-0
                  ">
                    <Icon className="w-4 h-4 text-[var(--fg-tertiary)]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[var(--fg-primary)]">{item.label}</span>
                    <span className="text-xs text-[var(--fg-tertiary)]">{item.description}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Contact Section */}
          <div className="border-t border-[var(--border-secondary)] px-4 py-3">
            <button
              onClick={() => {
                // Handle contact link - in real app, open contact form or email
                onClose();
              }}
              className="
                w-full flex items-center justify-center
                px-4 py-2.5
                bg-[var(--bg-secondary)]
                hover:bg-[var(--bg-brand-primary)]
                text-[var(--fg-brand-primary)]
                text-sm font-medium
                rounded-lg
                border border-[var(--border-brand)]
                transition-colors
              "
            >
              Contact us
            </button>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

