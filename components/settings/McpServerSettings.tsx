'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Terminal,
  ChevronDown,
  ChevronUp,
  Sparkles,
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

function QuickSetupCard({ 
  serverUrl, 
  apiKey,
  onGenerateKey,
}: { 
  serverUrl: string; 
  apiKey?: string;
  onGenerateKey: () => void;
}) {
  const [copied, setCopied] = useState<'url' | 'config' | null>(null);
  const [showConfig, setShowConfig] = useState(true);
  const [activeClient, setActiveClient] = useState<'claude' | 'cursor'>('claude');

  const claudeConfig = `{
  "mcpServers": {
    "bos": {
      "url": "${serverUrl}",
      "headers": {
        "Authorization": "Bearer ${apiKey || 'YOUR_API_KEY'}"
      }
    }
  }
}`;

  const cursorConfig = `{
  "mcpServers": {
    "bos": {
      "serverUrl": "${serverUrl}",
      "auth": {
        "type": "bearer",
        "token": "${apiKey || 'YOUR_API_KEY'}"
      }
    }
  }
}`;

  const copyToClipboard = async (text: string, type: 'url' | 'config') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-[var(--bg-secondary-alt)] to-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setShowConfig(!showConfig)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--bg-brand-solid)] rounded-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--fg-primary)]">Quick Setup</h4>
            <p className="text-xs text-[var(--fg-tertiary)]">Connect Claude Desktop or Cursor in 2 minutes</p>
          </div>
        </div>
        {showConfig ? (
          <ChevronUp className="w-5 h-5 text-[var(--fg-tertiary)]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[var(--fg-tertiary)]" />
        )}
      </div>

      {showConfig && (
        <div className="px-4 pb-4 space-y-4">
          {/* Step 1: API Key */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 bg-[var(--bg-brand-solid)] text-white text-xs font-bold rounded-full">1</span>
              <span className="text-sm font-medium text-[var(--fg-secondary)]">Get your API key</span>
            </div>
            
            {apiKey ? (
              <div className="flex items-center gap-2 ml-7">
                <code className="flex-1 text-xs font-mono text-green-500 bg-green-500/10 px-3 py-2 rounded-lg truncate">
                  ✓ API key ready: {apiKey.slice(0, 16)}...
                </code>
              </div>
            ) : (
              <div className="ml-7">
                <button
                  onClick={onGenerateKey}
                  className="
                    flex items-center gap-2 px-3 py-2
                    bg-[var(--bg-brand-solid)]
                    text-white text-sm font-medium
                    rounded-lg
                    hover:opacity-90
                    transition-opacity
                  "
                >
                  <Key className="w-4 h-4" />
                  Generate API Key
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Add to config */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 bg-[var(--bg-brand-solid)] text-white text-xs font-bold rounded-full">2</span>
              <span className="text-sm font-medium text-[var(--fg-secondary)]">Add to your config file</span>
            </div>
            
            {/* Client selector tabs */}
            <div className="ml-7 flex gap-1 bg-[var(--bg-tertiary)] p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveClient('claude')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeClient === 'claude'
                    ? 'bg-[var(--bg-primary)] text-[var(--fg-primary)] shadow-sm'
                    : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
                }`}
              >
                Claude Desktop
              </button>
              <button
                onClick={() => setActiveClient('cursor')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeClient === 'cursor'
                    ? 'bg-[var(--bg-primary)] text-[var(--fg-primary)] shadow-sm'
                    : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
                }`}
              >
                Cursor
              </button>
            </div>
            
            <div className="ml-7 relative">
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={() => copyToClipboard(activeClient === 'claude' ? claudeConfig : cursorConfig, 'config')}
                  className="p-1.5 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] hover:bg-[var(--bg-quaternary)] rounded transition-colors"
                  title="Copy config"
                >
                  {copied === 'config' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="text-xs font-mono text-[var(--fg-tertiary)] bg-[var(--bg-primary)] border border-[var(--border-secondary)] p-3 pr-12 rounded-lg overflow-x-auto">
                {activeClient === 'claude' ? claudeConfig : cursorConfig}
              </pre>
            </div>
            
            <p className="ml-7 text-xs text-[var(--fg-quaternary)]">
              {activeClient === 'claude' ? (
                <>Add this to <code className="bg-[var(--bg-tertiary)] px-1 rounded">claude_desktop_config.json</code></>
              ) : (
                <>Add this to your Cursor MCP settings</>
              )}
            </p>
          </div>

          {/* Step 3: Test */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 bg-[var(--bg-brand-solid)] text-white text-xs font-bold rounded-full">3</span>
              <span className="text-sm font-medium text-[var(--fg-secondary)]">Test the connection</span>
            </div>
            <p className="ml-7 text-xs text-[var(--fg-tertiary)]">
              Restart {activeClient === 'claude' ? 'Claude Desktop' : 'Cursor'} and try asking: <em>"Search my brand guidelines for logo usage"</em>
            </p>
          </div>
        </div>
      )}
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

  const handleGenerateKey = useCallback(async (name?: string) => {
    const keyName = name || newKeyName.trim();
    if (!keyName) return;
    
    setIsGenerating(true);
    const newKey = await generateApiKey(keyName);
    if (newKey) {
      setNewKeyName('');
      // Copy the new key to clipboard
      await navigator.clipboard.writeText(newKey.key);
    }
    setIsGenerating(false);
  }, [newKeyName, generateApiKey]);

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
              BOS MCP Server
            </h3>
            <p className="text-sm text-[var(--fg-tertiary)] max-w-lg">
              Connect AI tools like Claude Desktop and Cursor to your brand knowledge.
            </p>
          </div>
        </div>
        <Toggle
          enabled={config?.isEnabled ?? false}
          onChange={(enabled) => updateConfig({ isEnabled: enabled })}
          label="Enable MCP Server"
        />
      </div>

      {/* Quick Setup Card */}
      <QuickSetupCard 
        serverUrl={serverUrl} 
        apiKey={config?.apiKeys?.find(k => k.is_active)?.key}
        onGenerateKey={() => handleGenerateKey('Default Key')}
      />

      {/* Server Endpoint (collapsed) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--fg-secondary)]">
          Server Endpoint
        </label>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono text-[var(--fg-tertiary)] bg-[var(--bg-tertiary)] px-3 py-2 rounded-lg truncate">
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

