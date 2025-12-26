'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Bell,
  CheckCheck,
  Settings,
  AlertCircle,
  Info,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { useMobileMenu } from '@/lib/mobile-menu-context';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Mock notifications - in real app, this would come from an API
const mockNotifications: Notification[] = [
  // Empty for now to show empty state - add items to test populated state
];

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: AlertCircle,
};

const typeColors = {
  info: 'text-blue-500 bg-blue-500/10',
  success: 'text-green-500 bg-green-500/10',
  warning: 'text-amber-500 bg-amber-500/10',
  error: 'text-red-500 bg-red-500/10',
};

export function MobileNotificationsPanel() {
  const { activePanel, closePanel, closeAll } = useMobileMenu();
  const [notifications] = useState<Notification[]>(mockNotifications);
  
  const isOpen = activePanel === 'notifications';
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 top-14 z-50 bg-[var(--bg-primary)] lg:hidden overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-3">
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
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[var(--fg-primary)]">Notifications</h2>
            {unreadCount > 0 && (
              <span className="
                px-2 py-0.5
                bg-[var(--color-aperol)]
                text-white text-xs font-medium
                rounded-full
              ">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <button
              onClick={() => {
                // Mark all as read
              }}
              className="
                p-2.5 rounded-lg
                text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
                hover:bg-[var(--bg-tertiary)]
                transition-colors
              "
              title="Mark all as read"
            >
              <CheckCheck className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => {
              // Open notification settings
              closeAll();
            }}
            className="
              p-2.5 rounded-lg
              text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
              hover:bg-[var(--bg-tertiary)]
              transition-colors
            "
            title="Notification settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="divide-y divide-[var(--border-secondary)]">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type];
              const colorClasses = typeColors[notification.type];
              
              return (
                <div
                  key={notification.id}
                  className={`
                    flex items-start gap-3
                    px-4 py-4
                    ${!notification.read ? 'bg-[var(--bg-secondary)]' : ''}
                    active:bg-[var(--bg-tertiary)]
                    transition-colors
                  `}
                >
                  <div className={`
                    flex-shrink-0 mt-0.5
                    w-10 h-10 rounded-full
                    flex items-center justify-center
                    ${colorClasses}
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--fg-primary)]">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-aperol)] flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-[var(--fg-tertiary)] mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-[var(--fg-quaternary)] mt-1.5">
                      {notification.timestamp}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Delete notification
                    }}
                    className="
                      p-2 -mr-2 rounded-lg
                      text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)]
                      hover:bg-[var(--bg-tertiary)]
                      transition-colors
                    "
                    aria-label="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full px-8 text-center">
            <div className="
              w-20 h-20 mb-4
              rounded-full
              bg-[var(--bg-secondary)]
              border border-[var(--border-secondary)]
              flex items-center justify-center
            ">
              <Bell className="w-8 h-8 text-[var(--fg-quaternary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--fg-primary)] mb-1">
              No notifications
            </h3>
            <p className="text-sm text-[var(--fg-tertiary)] max-w-[240px]">
              When you have notifications, they'll show up here. We'll let you know when something arrives.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

