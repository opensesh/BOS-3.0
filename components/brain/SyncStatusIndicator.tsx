'use client';

/**
 * Sync Status Indicator Component
 *
 * Displays the current sync status between local .claude/ files
 * and the Supabase database. Shows last sync time and provides
 * a manual sync trigger.
 */

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Check, AlertTriangle, Clock, Cloud, CloudOff } from 'lucide-react';
import type { SyncStats } from '@/lib/sync/types';

interface SyncStatusIndicatorProps {
  /** Optional class name for custom styling */
  className?: string;
  /** Compact mode - shows only icon */
  compact?: boolean;
  /** Auto-refresh interval in ms (0 to disable) */
  refreshInterval?: number;
}

interface SyncState {
  status: 'loading' | 'synced' | 'pending' | 'conflict' | 'error' | 'offline';
  stats: SyncStats | null;
  conflicts: Array<{ id: string; title: string; filePath: string }>;
  queueLength: number;
  lastChecked: Date | null;
  error: string | null;
}

export function SyncStatusIndicator({
  className = '',
  compact = false,
  refreshInterval = 30000,
}: SyncStatusIndicatorProps) {
  const [state, setState] = useState<SyncState>({
    status: 'loading',
    stats: null,
    conflicts: [],
    queueLength: 0,
    lastChecked: null,
    error: null,
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/sync');
      if (!response.ok) {
        throw new Error('Failed to fetch sync status');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Unknown error');
      }

      // Determine overall status
      let status: SyncState['status'] = 'synced';
      if (data.conflicts && data.conflicts.length > 0) {
        status = 'conflict';
      } else if (data.queueLength > 0) {
        status = 'pending';
      } else if (data.stats?.pending_local > 0 || data.stats?.pending_db > 0) {
        status = 'pending';
      }

      setState({
        status,
        stats: data.stats,
        conflicts: data.conflicts || [],
        queueLength: data.queueLength || 0,
        lastChecked: new Date(),
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date(),
      }));
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: 'db_to_local' }),
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      // Refresh status after sync
      await fetchStatus();
    } catch (error) {
      console.error('Sync error:', error);
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Sync failed',
      }));
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, fetchStatus]);

  // Initial fetch and interval
  useEffect(() => {
    fetchStatus();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStatus, refreshInterval]);

  // Status icon and color
  const getStatusDisplay = () => {
    switch (state.status) {
      case 'loading':
        return {
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          color: 'text-[var(--fg-tertiary)]',
          label: 'Checking...',
        };
      case 'synced':
        return {
          icon: <Check className="h-4 w-4" />,
          color: 'text-emerald-500',
          label: 'Synced',
        };
      case 'pending':
        return {
          icon: <Clock className="h-4 w-4" />,
          color: 'text-amber-500',
          label: `${state.queueLength || (state.stats?.pendingLocalCount || 0) + (state.stats?.pendingDbCount || 0)} pending`,
        };
      case 'conflict':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'text-red-500',
          label: `${state.conflicts.length} conflict${state.conflicts.length !== 1 ? 's' : ''}`,
        };
      case 'error':
        return {
          icon: <CloudOff className="h-4 w-4" />,
          color: 'text-red-500',
          label: 'Error',
        };
      case 'offline':
        return {
          icon: <CloudOff className="h-4 w-4" />,
          color: 'text-[var(--fg-tertiary)]',
          label: 'Offline',
        };
      default:
        return {
          icon: <Cloud className="h-4 w-4" />,
          color: 'text-[var(--fg-tertiary)]',
          label: 'Unknown',
        };
    }
  };

  const display = getStatusDisplay();

  const formatLastSync = () => {
    if (!state.stats?.lastSyncAt) return null;
    const date = new Date(state.stats.lastSyncAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (compact) {
    return (
      <button
        onClick={triggerSync}
        disabled={isSyncing}
        className={`
          p-2 rounded-lg transition-all duration-150
          bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/40
          hover:bg-[var(--bg-secondary)]/60 hover:border-[var(--border-primary)]
          disabled:opacity-50 disabled:cursor-not-allowed
          ${display.color}
          ${className}
        `}
        title={`${display.label}${state.error ? `: ${state.error}` : ''}`}
      >
        {isSyncing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          display.icon
        )}
      </button>
    );
  }

  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg
        bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/40
        ${className}
      `}
    >
      {/* Status indicator */}
      <div className={`flex items-center gap-2 ${display.color}`}>
        {display.icon}
        <span className="text-sm font-medium">{display.label}</span>
      </div>

      {/* Last sync time */}
      {state.stats?.lastSyncAt && (
        <span className="text-xs text-[var(--fg-tertiary)]">
          {formatLastSync()}
        </span>
      )}

      {/* Sync button */}
      <button
        onClick={triggerSync}
        disabled={isSyncing}
        className={`
          ml-auto p-1.5 rounded-md transition-all duration-150
          text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
          hover:bg-[var(--bg-tertiary)]
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title="Sync now"
      >
        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      </button>

      {/* Error tooltip */}
      {state.error && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-500 max-w-xs">
          {state.error}
        </div>
      )}
    </div>
  );
}

/**
 * Minimal sync status badge for inline use
 */
export function SyncStatusBadge({
  status,
  className = '',
}: {
  status: 'synced' | 'pending' | 'conflict';
  className?: string;
}) {
  const config = {
    synced: {
      icon: <Check className="h-3 w-3" />,
      color: 'text-emerald-500 bg-emerald-500/10',
      label: 'Synced',
    },
    pending: {
      icon: <Clock className="h-3 w-3" />,
      color: 'text-amber-500 bg-amber-500/10',
      label: 'Pending',
    },
    conflict: {
      icon: <AlertTriangle className="h-3 w-3" />,
      color: 'text-red-500 bg-red-500/10',
      label: 'Conflict',
    },
  };

  const { icon, color, label } = config[status];

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
        ${color}
        ${className}
      `}
    >
      {icon}
      {label}
    </span>
  );
}

export default SyncStatusIndicator;
