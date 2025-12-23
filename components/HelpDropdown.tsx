'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  Sparkles, 
  BookOpen, 
  Wrench, 
  Activity, 
  Mail,
  MessageCircle,
} from 'lucide-react';

interface HelpDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const helpMenuItems = [
  { 
    id: 'assistant', 
    label: 'BOS Assistant', 
    icon: Sparkles,
    description: 'Get AI-powered help',
  },
  { 
    id: 'docs', 
    label: 'Docs', 
    icon: BookOpen,
    description: 'Read the documentation',
  },
  { 
    id: 'troubleshooting', 
    label: 'Troubleshooting', 
    icon: Wrench,
    description: 'Common issues & fixes',
  },
  { 
    id: 'status', 
    label: 'BOS status', 
    icon: Activity,
    description: 'Service health status',
  },
  { 
    id: 'support', 
    label: 'Contact support', 
    icon: Mail,
    description: 'Reach our support team',
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
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="
            absolute top-full right-0 mt-1
            w-80
            bg-[var(--bg-secondary)]
            rounded-lg
            border border-[var(--border-secondary)]
            shadow-lg
            z-[100]
            overflow-hidden
          "
        >
          {/* Header */}
          <div className="px-4 py-3">
            <h3 className="text-sm font-semibold text-[var(--fg-primary)]">
              Need help with your project?
            </h3>
            <p className="text-xs text-[var(--fg-tertiary)] mt-0.5">
              Start with our Assistant, docs, or community.
            </p>
          </div>

          {/* Menu Items */}
          <div className="border-t border-[var(--border-secondary)] py-1">
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
                    px-4 py-2
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
                  <span className="text-sm text-[var(--fg-secondary)]">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Community Section */}
          <div className="border-t border-[var(--border-secondary)] px-4 py-3">
            <h4 className="text-sm font-medium text-[var(--fg-primary)] mb-2">
              Community support
            </h4>
            <p className="text-xs text-[var(--fg-tertiary)] mb-3">
              Our community can help with code-related issues. Many questions are answered in minutes.
            </p>
            <button
              onClick={() => {
                // Handle community link - in real app, open in new tab
                onClose();
              }}
              className="
                w-full flex items-center justify-center gap-2
                px-4 py-2.5
                bg-[#5865F2]
                hover:bg-[#4752c4]
                text-white text-sm font-medium
                rounded-lg
                transition-colors
              "
            >
              <MessageCircle className="w-4 h-4" />
              <span>Join us on Discord</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

