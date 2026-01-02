'use client';

import { useState } from 'react';
import { SettingsSectionHeader } from './SettingsSection';
import {
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  MoreVertical,
  Key,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

interface APIKey {
  id: string;
  name: string;
  key: string;
  lastUsed: string | null;
  createdAt: string;
  expiresAt: string | null;
}

const MOCK_API_KEYS: APIKey[] = [
  {
    id: '1',
    name: 'Production API Key',
    key: 'sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    lastUsed: '2025-12-26T10:30:00Z',
    createdAt: '2025-01-15T09:00:00Z',
    expiresAt: null,
  },
  {
    id: '2',
    name: 'Development Key',
    key: 'sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    lastUsed: '2025-12-25T14:22:00Z',
    createdAt: '2025-03-20T11:00:00Z',
    expiresAt: '2025-12-31T23:59:59Z', // Expired to show example state
  },
];

export function APIForm() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>(MOCK_API_KEYS);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = async (key: string, id: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const deleteKey = (id: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() < Date.now();
  };

  return (
    <div className="max-w-4xl">
      <SettingsSectionHeader
        title="API keys"
        description="Manage your API keys for programmatic access to your account."
      />

      {/* Warning Banner */}
      <div className="
        flex items-start gap-3
        p-4
        bg-[var(--bg-warning-primary)]
        border border-[var(--border-warning)]
        rounded-xl
        mb-6
      ">
        <AlertTriangle className="w-5 h-5 text-[var(--fg-warning-primary)] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[var(--fg-warning-primary)]">
            Keep your API keys secure
          </p>
          <p className="text-sm text-[var(--fg-warning-secondary)]">
            Do not share your API keys with anyone. If you believe a key has been compromised, delete it immediately and create a new one.
          </p>
        </div>
      </div>

      {/* Create New Key Button */}
      <div className="flex justify-end mb-5">
        <button
          onClick={() => setShowCreateModal(true)}
          className="
            flex items-center gap-2
            px-4 py-2
            bg-[var(--bg-brand-primary)]
            border border-[var(--border-brand)]
            rounded-lg
            text-sm font-medium text-[var(--fg-brand-primary)]
            hover:bg-[var(--bg-brand-primary-hover)]
            transition-all duration-150
          "
        >
          <Plus className="w-4 h-4" />
          Create new key
        </button>
      </div>

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.map((apiKey) => {
          const isVisible = visibleKeys.has(apiKey.id);
          const expiringSoon = isExpiringSoon(apiKey.expiresAt);
          const expired = isExpired(apiKey.expiresAt);

          return (
            <div
              key={apiKey.id}
              className={`
                p-5
                bg-[var(--bg-primary)]
                border rounded-xl
                ${expired
                  ? 'border-[var(--border-error)] bg-[var(--bg-error-primary)]'
                  : expiringSoon
                    ? 'border-[var(--border-warning)]'
                    : 'border-[var(--border-secondary)]'
                }
              `}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="
                    w-10 h-10
                    bg-[var(--bg-secondary-alt)]
                    rounded-lg
                    flex items-center justify-center
                  ">
                    <Key className="w-5 h-5 text-[var(--fg-tertiary)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[var(--fg-primary)]">
                        {apiKey.name}
                      </h3>
                      {expired && (
                        <span className="
                          px-2 py-0.5
                          bg-[var(--bg-error-secondary)]
                          rounded-full
                          text-xs font-medium text-[var(--fg-error-primary)]
                        ">
                          Expired
                        </span>
                      )}
                      {expiringSoon && !expired && (
                        <span className="
                          px-2 py-0.5
                          bg-[var(--bg-warning-secondary)]
                          rounded-full
                          text-xs font-medium text-[var(--fg-warning-primary)]
                        ">
                          Expiring soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--fg-tertiary)]">
                      Created {formatDate(apiKey.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => deleteKey(apiKey.id)}
                    className="
                      p-2
                      text-[var(--fg-quaternary)]
                      hover:text-[var(--fg-error-primary)]
                      transition-colors
                    "
                    title="Delete key"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    className="
                      p-2
                      text-[var(--fg-quaternary)]
                      hover:text-[var(--fg-tertiary)]
                      transition-colors
                    "
                    title="More options"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Key Value */}
              <div className="
                flex items-center gap-3
                p-3
                bg-[var(--bg-secondary-alt)]
                border border-[var(--border-secondary)]
                rounded-lg
                font-mono text-sm
              ">
                <span className="flex-1 truncate text-[var(--fg-secondary)]">
                  {isVisible ? apiKey.key : apiKey.key.replace(/./g, '•')}
                </span>
                <button
                  onClick={() => toggleKeyVisibility(apiKey.id)}
                  className="
                    p-1.5
                    text-[var(--fg-quaternary)]
                    hover:text-[var(--fg-tertiary)]
                    transition-colors
                  "
                  title={isVisible ? 'Hide key' : 'Show key'}
                >
                  {isVisible ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                  className="
                    p-1.5
                    text-[var(--fg-quaternary)]
                    hover:text-[var(--fg-tertiary)]
                    transition-colors
                  "
                  title="Copy to clipboard"
                >
                  {copiedKey === apiKey.id ? (
                    <span className="text-xs text-[var(--fg-success-primary)]">Copied!</span>
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-6 mt-4 text-sm text-[var(--fg-tertiary)]">
                {apiKey.lastUsed && (
                  <span>Last used {formatDate(apiKey.lastUsed)}</span>
                )}
                {!apiKey.lastUsed && (
                  <span>Never used</span>
                )}
                {apiKey.expiresAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {expired ? 'Expired' : 'Expires'} {formatDate(apiKey.expiresAt)}
                  </span>
                )}
                {!apiKey.expiresAt && (
                  <span>No expiration</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {apiKeys.length === 0 && (
        <div className="
          py-12
          text-center
          border border-[var(--border-secondary)]
          border-dashed
          rounded-xl
        ">
          <Key className="w-12 h-12 mx-auto text-[var(--fg-quaternary)] mb-4" />
          <h3 className="text-sm font-semibold text-[var(--fg-primary)] mb-1">
            No API keys
          </h3>
          <p className="text-sm text-[var(--fg-tertiary)] mb-4">
            Create your first API key to get started.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="
              inline-flex items-center gap-2
              px-4 py-2
              bg-[var(--bg-brand-primary)]
              border border-[var(--border-brand)]
              rounded-lg
              text-sm font-medium text-[var(--fg-brand-primary)]
              hover:bg-[var(--bg-brand-primary-hover)]
              transition-all duration-150
            "
          >
            <Plus className="w-4 h-4" />
            Create API key
          </button>
        </div>
      )}

      {/* Documentation Link */}
      <div className="mt-8 p-5 bg-[var(--bg-secondary-alt)] border border-[var(--border-secondary)] rounded-xl">
        <h3 className="text-sm font-semibold text-[var(--fg-primary)] mb-1">
          API Documentation
        </h3>
        <p className="text-sm text-[var(--fg-tertiary)] mb-3">
          Learn how to use our API to integrate with your applications.
        </p>
        <a
          href="#"
          className="
            text-sm font-semibold text-[var(--fg-brand-primary)]
            hover:text-[var(--fg-brand-primary-hover)]
            transition-colors
          "
        >
          View documentation →
        </a>
      </div>
    </div>
  );
}

