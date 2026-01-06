'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  LogOut,
  Mail,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useMobileMenu } from '@/lib/mobile-menu-context';
import { ThemeSegmentedControl } from './ThemeSegmentedControl';

// Mock user data - in real app, this would come from auth context
const user = {
  name: 'opensesh',
  email: 'hello@opensession.co',
  initials: 'A',
};

// Simplified menu items - just labels and tabs
const accountMenuItems = [
  { id: 'profile', label: 'Profile', tab: 'profile' },
  { id: 'my-details', label: 'My details', tab: 'my-details' },
  { id: 'password', label: 'Password', tab: 'password' },
  { id: 'team', label: 'Team', tab: 'team' },
  { id: 'plan', label: 'Plan', tab: 'plan' },
  { id: 'billing', label: 'Billing', tab: 'billing' },
  { id: 'notifications', label: 'Notifications', tab: 'notifications' },
  { id: 'integrations', label: 'Integrations', tab: 'integrations' },
];

export function MobileAccountPanel() {
  const router = useRouter();
  const { activePanel, closePanel, closeAll } = useMobileMenu();
  
  const isOpen = activePanel === 'account';

  const handleMenuItemClick = (tab: string) => {
    closeAll();
    router.push('/account');
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 top-14 z-[70] bg-[var(--bg-primary)] lg:hidden overflow-hidden"
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
        <h2 className="text-lg font-semibold text-[var(--fg-primary)]">Account</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* User Info Card */}
        <div className="p-4">
          <div className="flex items-center gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-secondary)]">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-charcoal)] to-black border border-[var(--border-secondary)] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-base font-mono">{user.initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-[var(--fg-primary)] truncate">
                {user.name}
              </p>
              <p className="text-sm text-[var(--fg-tertiary)] truncate flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Settings Links */}
        <div className="px-4 pb-4">
          <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider mb-2 px-1">
            Settings
          </p>
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-secondary)] overflow-hidden">
            {accountMenuItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleMenuItemClick(item.tab)}
                className={`
                  w-full flex items-center justify-between
                  px-4 py-3
                  text-left text-sm font-medium text-[var(--fg-primary)]
                  hover:bg-[var(--bg-tertiary)]
                  active:bg-[var(--bg-quaternary)]
                  transition-colors
                  ${index !== accountMenuItems.length - 1 ? 'border-b border-[var(--border-secondary)]' : ''}
                `}
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 text-[var(--fg-quaternary)]" />
              </button>
            ))}
          </div>
        </div>

        {/* Updates Link */}
        <div className="px-4 pb-4">
          <a
            href="https://opensession.co/updates"
            target="_blank"
            rel="noopener noreferrer"
            className="
              w-full flex items-center justify-between
              px-4 py-3
              bg-[var(--bg-secondary)]
              hover:bg-[var(--bg-tertiary)]
              active:bg-[var(--bg-quaternary)]
              border border-[var(--border-secondary)]
              rounded-xl
              text-left text-sm font-medium text-[var(--fg-primary)]
              transition-colors
            "
          >
            <span>Updates</span>
            <ExternalLink className="w-4 h-4 text-[var(--fg-quaternary)]" />
          </a>
        </div>

        {/* Appearance / Theme */}
        <div className="px-4 pb-4">
          <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider mb-2 px-1">
            Appearance
          </p>
          <ThemeSegmentedControl />
        </div>

        {/* Sign Out */}
        <div className="px-4 pb-8">
          <button
            onClick={() => {
              // Handle logout - in real app, call auth signOut
              closeAll();
            }}
            className="
              w-full flex items-center justify-center gap-2
              py-3 px-4
              bg-[var(--bg-secondary)]
              hover:bg-[var(--bg-tertiary)]
              active:bg-[var(--bg-quaternary)]
              border border-[var(--border-secondary)]
              rounded-xl
              text-[var(--fg-secondary)]
              text-sm font-medium
              transition-colors
            "
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
