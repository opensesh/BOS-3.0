'use client';

import { useState, useEffect, useCallback } from 'react';
import { SettingsSectionHeader } from './SettingsSection';
import {
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Key,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Check,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useMcpServerConfig } from '@/hooks/useMcpConnections';
import type { McpApiKey } from '@/lib/supabase/types';
import { toast } from 'sonner';

// ============================================
// New Key Modal
// ============================================

function NewKeyModal({
  keyValue,
  keyName,
  onClose,
}: {
  keyValue: string;
  keyName: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyKey = async () => {
    await navigator.clipboard.writeText(keyValue);
    setCopied(true);
    toast.success('API key copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[var(--bg-primary)] rounded-xl border border-[var(--border-secondary)] shadow-2xl max-w-lg w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--fg-primary)]">
              API Key Created
            </h3>
            <p className="text-sm text-[var(--fg-tertiary)]">{keyName}</p>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary-alt)] border border-[var(--border-secondary)] rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between gap-3">
            <code className="flex-1 text-sm font-mono text-[var(--fg-primary)] break-all">
              {keyValue}
            </code>
            <button
              onClick={copyKey}
              className="
                flex-shrink-0 p-2 
                text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]
                hover:bg-[var(--bg-tertiary)] rounded-lg
                transition-colors
              "
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--fg-secondary)]">
            <strong>Important:</strong> Copy this key now. You won't be able to see the full key again after closing this dialog.
          </p>
        </div>

        <button
          onClick={onClose}
          className="
            w-full py-2 px-4
            bg-[var(--bg-tertiary)]
            text-[var(--fg-primary)] text-sm font-medium
            rounded-lg
            hover:bg-[var(--bg-quaternary)]
            transition-colors
          "
        >
          Done
        </button>
      </div>
    </div>
  );
}

// ============================================
// Create Key Modal
// ============================================

function CreateKeyModal({
  onClose,
  onCreate,
  isCreating,
}: {
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  isCreating: boolean;
}) {
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a name for your API key');
      return;
    }
    await onCreate(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[var(--bg-primary)] rounded-xl border border-[var(--border-secondary)] shadow-2xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-[var(--fg-primary)] mb-1">
          Create API Key
        </h3>
        <p className="text-sm text-[var(--fg-tertiary)] mb-4">
          Give your key a memorable name to identify its purpose.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Claude Desktop, Cursor IDE, Production"
            autoFocus
            className="
              w-full px-3 py-2 mb-4
              bg-[var(--bg-secondary-alt)]
              border border-[var(--border-secondary)]
              rounded-lg
              text-sm text-[var(--fg-primary)]
              placeholder:text-[var(--fg-quaternary)]
              focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]
            "
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="
                flex-1 py-2 px-4
                bg-[var(--bg-tertiary)]
                text-[var(--fg-secondary)] text-sm font-medium
                rounded-lg
                hover:bg-[var(--bg-quaternary)]
                transition-colors
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="
                flex-1 py-2 px-4
                bg-[var(--bg-brand-solid)]
                text-white text-sm font-medium
                rounded-lg
                hover:opacity-90
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-opacity
                flex items-center justify-center gap-2
              "
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Key'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Confirm Delete Modal
// ============================================

function ConfirmDeleteModal({
  keyName,
  onClose,
  onConfirm,
  isDeleting,
}: {
  keyName: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[var(--bg-primary)] rounded-xl border border-[var(--border-secondary)] shadow-2xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-[var(--fg-primary)] mb-1">
          Revoke API Key
        </h3>
        <p className="text-sm text-[var(--fg-tertiary)] mb-4">
          Are you sure you want to revoke <strong>{keyName}</strong>? Any applications using this key will immediately lose access.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="
              flex-1 py-2 px-4
              bg-[var(--bg-tertiary)]
              text-[var(--fg-secondary)] text-sm font-medium
              rounded-lg
              hover:bg-[var(--bg-quaternary)]
              transition-colors
            "
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="
              flex-1 py-2 px-4
              bg-red-500
              text-white text-sm font-medium
              rounded-lg
              hover:bg-red-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
              flex items-center justify-center gap-2
            "
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Revoking...
              </>
            ) : (
              'Revoke Key'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// API Key Row
// ============================================

function ApiKeyRow({
  apiKey,
  onRevoke,
  onCopy,
}: {
  apiKey: McpApiKey;
  onRevoke: (key: string, name: string) => void;
  onCopy: (key: string) => void;
}) {
  const [copiedKey, setCopiedKey] = useState(false);

  // Mask the key - show only first 12 and last 4 chars
  const maskedKey = apiKey.key.slice(0, 12) + '••••••••' + apiKey.key.slice(-4);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(apiKey.key);
      setCopiedKey(true);
      toast.success('API key copied!');
      setTimeout(() => setCopiedKey(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy key');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const lastUsedText = apiKey.last_used 
    ? formatDate(apiKey.last_used)
    : 'Never used';

  if (!apiKey.is_active) return null;

  return (
    <div className="p-5 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-xl">
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
            <h3 className="text-sm font-semibold text-[var(--fg-primary)]">
              {apiKey.name}
            </h3>
            <p className="text-sm text-[var(--fg-tertiary)]">
              Created {formatDate(apiKey.created_at)}
            </p>
          </div>
        </div>

        <button
          onClick={() => onRevoke(apiKey.key, apiKey.name)}
          className="
            p-2
            text-[var(--fg-quaternary)]
            hover:text-red-500
            hover:bg-red-500/10
            rounded-lg
            transition-colors
          "
          title="Revoke key"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Key Value - Always masked, only copy available */}
      <div className="
        flex items-center gap-3
        p-3
        bg-[var(--bg-secondary-alt)]
        border border-[var(--border-secondary)]
        rounded-lg
        font-mono text-sm
      ">
        <span className="flex-1 truncate text-[var(--fg-secondary)]">
          {maskedKey}
        </span>
        <button
          onClick={copyToClipboard}
          className="
            p-1.5
            text-[var(--fg-quaternary)]
            hover:text-[var(--fg-tertiary)]
            transition-colors
          "
          title="Copy to clipboard"
        >
          {copiedKey ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-6 mt-4 text-sm text-[var(--fg-tertiary)]">
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          Last used: {lastUsedText}
        </span>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

// Mock brand ID - in production this would come from auth context
const BRAND_ID = 'f64b8b02-4a32-4f1a-9c5d-5e9a3b2c1d0e';

export function APIForm() {
  const [brandId, setBrandId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{ key: string; name: string } | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ key: string; name: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch brand ID on mount
  useEffect(() => {
    async function fetchBrandId() {
      try {
        const response = await fetch('/api/brand?slug=open-session');
        if (response.ok) {
          const data = await response.json();
          setBrandId(data.id);
        } else {
          setBrandId(BRAND_ID);
        }
      } catch {
        setBrandId(BRAND_ID);
      }
    }
    fetchBrandId();
  }, []);

  const { config, isLoading, error, refresh, generateApiKey, revokeApiKey } = useMcpServerConfig(brandId || undefined);

  const handleCreateKey = useCallback(async (name: string) => {
    setIsCreating(true);
    try {
      const newKey = await generateApiKey(name);
      if (newKey) {
        setShowCreateModal(false);
        setNewlyCreatedKey({ key: newKey.key, name: newKey.name });
        toast.success('API key created successfully!');
      } else {
        toast.error('Failed to create API key. Please try again.');
      }
    } catch (err) {
      console.error('Error creating key:', err);
      toast.error('An error occurred while creating the API key.');
    } finally {
      setIsCreating(false);
    }
  }, [generateApiKey]);

  const handleRevokeKey = useCallback(async () => {
    if (!showDeleteModal) return;
    
    setIsDeleting(true);
    try {
      const success = await revokeApiKey(showDeleteModal.key);
      if (success) {
        toast.success(`API key "${showDeleteModal.name}" has been revoked`);
        setShowDeleteModal(null);
      } else {
        toast.error('Failed to revoke API key. Please try again.');
      }
    } catch (err) {
      console.error('Error revoking key:', err);
      toast.error('An error occurred while revoking the API key.');
    } finally {
      setIsDeleting(false);
    }
  }, [showDeleteModal, revokeApiKey]);

  const handleCopyKey = useCallback((key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard!');
  }, []);

  // Filter to only active keys
  const activeKeys = config?.apiKeys?.filter(k => k.is_active) || [];

  if (!brandId) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-5 h-5 animate-spin text-[var(--fg-tertiary)]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <SettingsSectionHeader
        title="API Keys"
        description="Create and manage API keys for external access to your brand data via MCP."
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
            Do not share your API keys publicly. If you believe a key has been compromised, revoke it immediately and create a new one.
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
            bg-[var(--bg-brand-solid)]
            rounded-lg
            text-sm font-medium text-white
            hover:opacity-90
            transition-opacity
          "
        >
          <Plus className="w-4 h-4" />
          Create new key
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-5 h-5 animate-spin text-[var(--fg-tertiary)]" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={refresh}
            className="mt-2 text-sm text-red-500 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* API Keys List */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {activeKeys.map((apiKey) => (
            <ApiKeyRow
              key={apiKey.key}
              apiKey={apiKey}
              onRevoke={(key, name) => setShowDeleteModal({ key, name })}
              onCopy={handleCopyKey}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && activeKeys.length === 0 && (
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
            Create your first API key to connect external tools.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="
              inline-flex items-center gap-2
              px-4 py-2
              bg-[var(--bg-brand-solid)]
              rounded-lg
              text-sm font-medium text-white
              hover:opacity-90
              transition-opacity
            "
          >
            <Plus className="w-4 h-4" />
            Create API key
          </button>
        </div>
      )}

      {/* Usage info */}
      {!isLoading && !error && activeKeys.length > 0 && (
        <div className="mt-8 p-5 bg-[var(--bg-secondary-alt)] border border-[var(--border-secondary)] rounded-xl">
          <h3 className="text-sm font-semibold text-[var(--fg-primary)] mb-1">
            Using your API keys
          </h3>
          <p className="text-sm text-[var(--fg-tertiary)] mb-3">
            Use these keys to connect Claude Desktop, Cursor, or other MCP-compatible tools to your brand data.
          </p>
          <p className="text-xs text-[var(--fg-quaternary)]">
            Go to <strong>Integrations → BOS MCP</strong> for step-by-step setup instructions.
          </p>
        </div>
      )}

      {/* Create Key Modal */}
      {showCreateModal && (
        <CreateKeyModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateKey}
          isCreating={isCreating}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmDeleteModal
          keyName={showDeleteModal.name}
          onClose={() => setShowDeleteModal(null)}
          onConfirm={handleRevokeKey}
          isDeleting={isDeleting}
        />
      )}

      {/* New Key Modal */}
      {newlyCreatedKey && (
        <NewKeyModal
          keyValue={newlyCreatedKey.key}
          keyName={newlyCreatedKey.name}
          onClose={() => setNewlyCreatedKey(null)}
        />
      )}
    </div>
  );
}
