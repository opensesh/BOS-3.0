'use client';

import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  BookOpen, 
  Wrench, 
  Mail,
  HelpCircle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useMobileMenu } from '@/lib/mobile-menu-context';

const helpMenuItems = [
  { 
    id: 'docs', 
    label: 'Docs', 
    description: 'Read guides, tutorials, and API references',
    icon: BookOpen,
    external: true,
  },
  { 
    id: 'faqs', 
    label: 'FAQs', 
    description: 'Frequently asked questions',
    icon: HelpCircle,
    external: false,
  },
  { 
    id: 'troubleshooting', 
    label: 'Troubleshooting', 
    description: 'Common issues and how to fix them',
    icon: Wrench,
    external: false,
  },
];

export function MobileHelpPanel() {
  const { activePanel, closePanel, closeAll } = useMobileMenu();
  
  const isOpen = activePanel === 'help';

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 top-14 z-[70] bg-[var(--bg-primary)] lg:hidden overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)]">
        <button
          onClick={closePanel}
          className="
            flex items-center justify-center
            w-10 h-10 -ml-2
            rounded-lg
            text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
            hover:bg-[var(--bg-tertiary)]
            transition-colors
          "
          aria-label="Back to menu"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-[var(--fg-primary)]">Need help?</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Menu Items */}
        <div className="px-4 py-4">
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-secondary)] overflow-hidden">
            {helpMenuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    // Handle navigation - in real app, this would navigate or open external link
                    closeAll();
                  }}
                  className={`
                    w-full flex items-center gap-3
                    px-4 py-3.5
                    text-left
                    hover:bg-[var(--bg-tertiary)]
                    active:bg-[var(--bg-quaternary)]
                    transition-colors
                    ${index !== helpMenuItems.length - 1 ? 'border-b border-[var(--border-secondary)]' : ''}
                  `}
                >
                  <div className="
                    w-10 h-10 rounded-lg
                    bg-[var(--bg-tertiary)]
                    border border-[var(--border-secondary)]
                    flex items-center justify-center
                    flex-shrink-0
                  ">
                    <Icon className="w-5 h-5 text-[var(--fg-tertiary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--fg-primary)]">
                      {item.label}
                    </p>
                    <p className="text-xs text-[var(--fg-tertiary)] truncate">
                      {item.description}
                    </p>
                  </div>
                  {item.external ? (
                    <ExternalLink className="w-4 h-4 text-[var(--fg-quaternary)] flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[var(--fg-quaternary)] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact Section */}
        <div className="px-4 pb-8">
          <button
            onClick={() => {
              // Handle contact - in real app, open contact form or email
              closeAll();
            }}
            className="
              w-full flex items-center justify-center gap-2
              px-4 py-3
              bg-[var(--bg-secondary)]
              hover:bg-[var(--bg-tertiary)]
              active:bg-[var(--bg-quaternary)]
              text-[var(--fg-primary)]
              text-sm font-medium
              rounded-lg
              border border-[var(--border-secondary)]
              transition-colors
            "
          >
            <Mail className="w-4 h-4" />
            <span>Contact us</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

