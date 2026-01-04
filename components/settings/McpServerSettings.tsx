'use client';

import { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  Server,
  Key,
  Shield,
  Activity,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useMcpServerConfig } from '@/hooks/useMcpConnections';
import { mcpService } from '@/lib/supabase/mcp-service';
import type { McpApiKey, McpUsageStats } from '@/lib/supabase/types';

// ============================================
// Sub-components
// ============================================

function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer
        rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-2
        ${enabled ? 'bg-[var(--bg-brand-solid)]' : 'bg-[var(--bg-quaternary)]'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform
          rounded-full bg-white shadow ring-0
          transition duration-200 ease-in-out
          ${enabled ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

function ApiKeyRow({ 
  apiKey, 
  onRevoke,
  isRevoking,
}: { 
  apiKey: McpApiKey; 
  onRevoke: () => void;
  isRevoking: boolean;
}) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyKey = async () => {
    await navigator.clipboard.writeText(apiKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedKey = apiKey.key.slice(0, 12) + '••••••••••••' + apiKey.key.slice(-4);
  const displayKey = showKey ? apiKey.key : maskedKey;

  const formattedDate = new Date(apiKey.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const lastUsed = apiKey.last_used 
    ? new Date(apiKey.last_used).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'Never';

  if (!apiKey.is_active) return null;

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--border-secondary)] last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-[var(--fg-quaternary)]" />
          <span className="text-sm font-medium text-[var(--fg-primary)]">
            {apiKey.name}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <code className="text-xs font-mono text-[var(--fg-tertiary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded">
            {displayKey}
          </code>
          <button
            onClick={() => setShowKey(!showKey)}
            className="p-1 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)]"
            aria-label={showKey ? 'Hide key' : 'Show key'}
          >
            {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={copyKey}
            className="p-1 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)]"
            aria-label="Copy key"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-xs text-[var(--fg-quaternary)] mt-1">
          Created {formattedDate} • Last used: {lastUsed}
        </p>
      </div>
      <button
        onClick={onRevoke}
        disabled={isRevoking}
        className="
          p-2 text-[var(--fg-quaternary)] 
          hover:text-red-500 hover:bg-red-500/10
          rounded-lg transition-colors
          disabled:opacity-50
        "
        aria-label="Revoke key"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function ToolPermissionRow({
  tool,
  enabled,
  onChange,
}: {
  tool: { name: string; description: string };
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--fg-primary)]">{tool.name}</p>
        <p className="text-xs text-[var(--fg-tertiary)]">{tool.description}</p>
      </div>
      <Toggle enabled={enabled} onChange={onChange} label={`Toggle ${tool.name}`} />
    </div>
  );
}

function UsageStatsCard({ stats }: { stats: McpUsageStats | null }) {
  if (!stats) {
    return (
      <div className="text-sm text-[var(--fg-tertiary)] text-center py-8">
        No usage data available yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
        <p className="text-2xl font-semibold text-[var(--fg-primary)]">
          {stats.totalRequests.toLocaleString()}
        </p>
        <p className="text-xs text-[var(--fg-tertiary)]">Total Requests</p>
      </div>
      <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
        <p className="text-2xl font-semibold text-green-500">
          {stats.successfulRequests.toLocaleString()}
        </p>
        <p className="text-xs text-[var(--fg-tertiary)]">Successful</p>
      </div>
      <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
        <p className="text-2xl font-semibold text-red-500">
          {stats.failedRequests.toLocaleString()}
        </p>
        <p className="text-xs text-[var(--fg-tertiary)]">Failed</p>
      </div>
      <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
        <p className="text-2xl font-semibold text-[var(--fg-primary)]">
          {stats.avgResponseTime.toFixed(0)}ms
        </p>
        <p className="text-xs text-[var(--fg-tertiary)]">Avg Response</p>
      </div>
    </div>
  );
}

// ============================================
// Available Tools
// ============================================

const AVAILABLE_TOOLS = [
  { 
    name: 'search_brand_knowledge', 
    description: 'Semantic search across brand documents' 
  },
  { 
    name: 'get_brand_colors', 
    description: 'Retrieve color palette and guidelines' 
  },
  { 
    name: 'get_brand_assets', 
    description: 'List and filter brand assets' 
  },
  { 
    name: 'get_brand_guidelines', 
    description: 'Fetch guideline documents' 
  },
  { 
    name: 'search_brand_assets', 
    description: 'Semantic search for visual assets' 
  },
];

// ============================================
// Main Component
// ============================================

interface McpServerSettingsProps {
  brandId: string;
}

export function McpServerSettings({ brandId }: McpServerSettingsProps) {
  const { config, isLoading, error, refresh, updateConfig, generateApiKey, revokeApiKey, getUsageStats } = useMcpServerConfig(brandId);
  const [newKeyName, setNewKeyName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [revokingKey, setRevokingKey] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<McpUsageStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [copied, setCopied] = useState(false);

  const serverUrl = mcpService.getMcpServerUrl();

  // Load usage stats
  useEffect(() => {
    if (config) {
      setIsLoadingStats(true);
      getUsageStats(30).then(stats => {
        setUsageStats(stats);
        setIsLoadingStats(false);
      });
    }
  }, [config, getUsageStats]);

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) return;
    
    setIsGenerating(true);
    const newKey = await generateApiKey(newKeyName.trim());
    if (newKey) {
      setNewKeyName('');
      // Copy the new key to clipboard
      await navigator.clipboard.writeText(newKey.key);
    }
    setIsGenerating(false);
  };

  const handleRevokeKey = async (key: string) => {
    setRevokingKey(key);
    await revokeApiKey(key);
    setRevokingKey(null);
  };

  const handleToggleTool = async (toolName: string, enabled: boolean) => {
    if (!config) return;
    
    const newTools = enabled
      ? [...config.allowedTools, toolName]
      : config.allowedTools.filter(t => t !== toolName);
    
    await updateConfig({ allowedTools: newTools });
  };

  const copyServerUrl = async () => {
    await navigator.clipboard.writeText(serverUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-5 h-5 animate-spin text-[var(--fg-tertiary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={refresh}
          className="mt-2 text-sm text-red-500 underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-[var(--border-secondary)]">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[var(--bg-brand-primary)] rounded-lg">
            <Server className="w-5 h-5 text-[var(--fg-brand-primary)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--fg-primary)]">
              BOS as MCP Server
            </h3>
            <p className="text-sm text-[var(--fg-tertiary)] max-w-lg">
              Expose your brand data to external AI tools like Cursor, Claude Desktop, and others via the Model Context Protocol.
            </p>
          </div>
        </div>
        <Toggle
          enabled={config?.isEnabled ?? false}
          onChange={(enabled) => updateConfig({ isEnabled: enabled })}
          label="Enable MCP Server"
        />
      </div>

      {/* Server URL */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--fg-secondary)]">
          Server Endpoint
        </label>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm font-mono text-[var(--fg-tertiary)] bg-[var(--bg-tertiary)] px-3 py-2 rounded-lg truncate">
            {serverUrl}
          </code>
          <button
            onClick={copyServerUrl}
            className="p-2 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
            aria-label="Copy URL"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-[var(--fg-quaternary)]">
          Add this URL to your MCP client configuration (e.g., Cursor settings, Claude Desktop config)
        </p>
      </div>

      {/* API Keys Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-[var(--fg-tertiary)]" />
          <h4 className="text-sm font-medium text-[var(--fg-secondary)]">API Keys</h4>
        </div>
        
        {/* Existing Keys */}
        <div className="bg-[var(--bg-secondary-alt)] rounded-lg p-4">
          {config?.apiKeys && config.apiKeys.filter(k => k.is_active).length > 0 ? (
            <div className="divide-y divide-[var(--border-secondary)]">
              {config.apiKeys
                .filter(k => k.is_active)
                .map((key) => (
                  <ApiKeyRow
                    key={key.key}
                    apiKey={key}
                    onRevoke={() => handleRevokeKey(key.key)}
                    isRevoking={revokingKey === key.key}
                  />
                ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--fg-tertiary)] text-center py-4">
              No API keys generated yet
            </p>
          )}
        </div>

        {/* Generate New Key */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g., 'Cursor IDE')"
            className="
              flex-1 px-3 py-2
              bg-[var(--bg-primary)]
              border border-[var(--border-secondary)]
              rounded-lg
              text-sm text-[var(--fg-primary)]
              placeholder:text-[var(--fg-quaternary)]
              focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]
            "
          />
          <button
            onClick={handleGenerateKey}
            disabled={isGenerating || !newKeyName.trim()}
            className="
              flex items-center gap-2 px-4 py-2
              bg-[var(--bg-brand-solid)]
              text-white text-sm font-medium
              rounded-lg
              hover:opacity-90
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-opacity
            "
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Generate Key
          </button>
        </div>
      </div>

      {/* Tool Permissions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[var(--fg-tertiary)]" />
          <h4 className="text-sm font-medium text-[var(--fg-secondary)]">Tool Permissions</h4>
        </div>
        <p className="text-xs text-[var(--fg-quaternary)]">
          Control which tools are available to external AI clients
        </p>
        
        <div className="bg-[var(--bg-secondary-alt)] rounded-lg p-4 divide-y divide-[var(--border-secondary)]">
          {AVAILABLE_TOOLS.map((tool) => (
            <ToolPermissionRow
              key={tool.name}
              tool={tool}
              enabled={config?.allowedTools.includes(tool.name) ?? false}
              onChange={(enabled) => handleToggleTool(tool.name, enabled)}
            />
          ))}
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--fg-tertiary)]" />
            <h4 className="text-sm font-medium text-[var(--fg-secondary)]">Usage (Last 30 Days)</h4>
          </div>
          <button
            onClick={() => {
              setIsLoadingStats(true);
              getUsageStats(30).then(stats => {
                setUsageStats(stats);
                setIsLoadingStats(false);
              });
            }}
            disabled={isLoadingStats}
            className="text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]"
          >
            {isLoadingStats ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Refresh'}
          </button>
        </div>
        
        <UsageStatsCard stats={usageStats} />
      </div>

      {/* Documentation Link */}
      <div className="bg-[var(--bg-secondary-alt)] border border-[var(--border-secondary)] rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ExternalLink className="w-5 h-5 text-[var(--fg-tertiary)] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-[var(--fg-primary)]">
              Integration Guide
            </h4>
            <p className="text-sm text-[var(--fg-tertiary)] mt-1">
              Learn how to connect your AI tools to Brand Operating System using MCP.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-1 text-sm text-[var(--fg-brand-primary)] hover:underline mt-2"
            >
              View Documentation
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

