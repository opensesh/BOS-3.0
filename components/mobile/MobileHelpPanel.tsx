'use client';

import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Sparkles, 
  BookOpen, 
  Wrench, 
  Activity, 
  Mail,
  MessageCircle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useMobileMenu } from '@/lib/mobile-menu-context';

const helpMenuItems = [
  { 
    id: 'assistant', 
    label: 'BOS Assistant', 
    description: 'Get AI-powered help with your questions',
    icon: Sparkles,
    external: false,
  },
  { 
    id: 'docs', 
    label: 'Documentation', 
    description: 'Read guides, tutorials, and API references',
    icon: BookOpen,
    external: true,
  },
  { 
    id: 'troubleshooting', 
    label: 'Troubleshooting', 
    description: 'Common issues and how to fix them',
    icon: Wrench,
    external: false,
  },
  { 
    id: 'status', 
    label: 'System status', 
    description: 'Check service health and uptime',
    icon: Activity,
    external: true,
  },
  { 
    id: 'support', 
    label: 'Contact support', 
    description: 'Get help from our support team',
    icon: Mail,
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
        <h2 className="text-lg font-semibold text-[var(--fg-primary)]">Help & Support</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header Section */}
        <div className="p-4">
          <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-secondary)]">
            <h3 className="text-base font-semibold text-[var(--fg-primary)] mb-1">
              Need help with your project?
            </h3>
            <p className="text-sm text-[var(--fg-tertiary)]">
              Start with our Assistant, browse the docs, or reach out to support.
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="px-4 pb-4">
          <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider mb-2 px-1">
            Resources
          </p>
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

        {/* Community Section */}
        <div className="px-4 pb-8">
          <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider mb-2 px-1">
            Community
          </p>
          <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-secondary)]">
            <h4 className="text-sm font-semibold text-[var(--fg-primary)] mb-1">
              Join our community
            </h4>
            <p className="text-xs text-[var(--fg-tertiary)] mb-4">
              Get help from other users, share ideas, and stay up to date with the latest news.
            </p>
            <button
              onClick={() => {
                // Handle Discord link - in real app, open in new tab
                closeAll();
              }}
              className="
                w-full flex items-center justify-center gap-2
                px-4 py-3
                bg-[#5865F2]
                hover:bg-[#4752c4]
                active:bg-[#3c46a1]
                text-white text-sm font-medium
                rounded-lg
                transition-colors
              "
            >
              <MessageCircle className="w-4 h-4" />
              <span>Join us on Discord</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

