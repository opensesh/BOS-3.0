'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Copy, 
  Check, 
  Key,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { useMcpServerConfig } from '@/hooks/useMcpConnections';
import { mcpService } from '@/lib/supabase/mcp-service';

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

function QuickSetupCard({ 
  serverUrl, 
  apiKey,
  onNavigateToApiKeys,
}: { 
  serverUrl: string; 
  apiKey?: string;
  onNavigateToApiKeys: () => void;
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
    <div className="bg-[var(--bg-secondary-alt)] border border-[var(--border-secondary)] rounded-xl overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setShowConfig(!showConfig)}
      >
        <div>
          <h4 className="text-sm font-semibold text-[var(--fg-primary)]">Quick Setup</h4>
          <p className="text-xs text-[var(--fg-tertiary)]">Connect Claude Desktop or Cursor in 2 minutes</p>
        </div>
        {showConfig ? (
          <ChevronUp className="w-5 h-5 text-[var(--fg-tertiary)]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[var(--fg-tertiary)]" />
        )}
      </div>

      {showConfig && (
        <div className="px-4 pb-4 space-y-5 border-t border-[var(--border-secondary)] pt-4">
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
                <button
                  onClick={onNavigateToApiKeys}
                  className="text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] underline"
                >
                  Manage keys
                </button>
              </div>
            ) : (
              <div className="ml-7">
                <button
                  onClick={onNavigateToApiKeys}
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
                onClick={(e) => { e.stopPropagation(); setActiveClient('claude'); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeClient === 'claude'
                    ? 'bg-[var(--bg-primary)] text-[var(--fg-primary)] shadow-sm'
                    : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
                }`}
              >
                Claude Desktop
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveClient('cursor'); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeClient === 'cursor'
                    ? 'bg-[var(--bg-primary)] text-[var(--fg-primary)] shadow-sm'
                    : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
                }`}
              >
                Cursor
              </button>
            </div>
            
            <div className="ml-7 relative" onClick={(e) => e.stopPropagation()}>
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
// Main Component
// ============================================

interface McpServerSettingsProps {
  brandId: string;
}

export function McpServerSettings({ brandId }: McpServerSettingsProps) {
  const router = useRouter();
  const { config, isLoading, error, refresh, updateConfig, generateApiKey } = useMcpServerConfig(brandId);
  const [isGenerating, setIsGenerating] = useState(false);

  const serverUrl = mcpService.getMcpServerUrl();

  const handleNavigateToApiKeys = useCallback(async () => {
    // If no API key exists, generate one first then navigate
    if (!config?.apiKeys?.some(k => k.is_active)) {
      setIsGenerating(true);
      const newKey = await generateApiKey('Default Key');
      setIsGenerating(false);
      if (newKey) {
        // Copy to clipboard
        await navigator.clipboard.writeText(newKey.key);
      }
    }
    // Navigate to API tab
    // For now, we'll just scroll or the user stays on page
    // In future, could navigate to a dedicated API keys page
  }, [config, generateApiKey]);

  if (isLoading || isGenerating) {
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
    <div className="space-y-6">
      {/* Header Section - no icon */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-[var(--border-secondary)]">
        <div>
          <h3 className="text-lg font-semibold text-[var(--fg-primary)]">
            BOS MCP Server
          </h3>
          <p className="text-sm text-[var(--fg-tertiary)] max-w-lg mt-1">
            Connect AI tools like Claude Desktop and Cursor to your brand knowledge.
          </p>
        </div>
        <Toggle
          enabled={config?.isEnabled ?? false}
          onChange={(enabled) => updateConfig({ isEnabled: enabled })}
          label="Enable MCP Server"
        />
      </div>

      {/* Quick Setup Card - the main focus */}
      <QuickSetupCard 
        serverUrl={serverUrl} 
        apiKey={config?.apiKeys?.find(k => k.is_active)?.key}
        onNavigateToApiKeys={handleNavigateToApiKeys}
      />

      {/* Simple documentation link */}
      <a
        href="https://docs.opensession.co/mcp"
        target="_blank"
        rel="noopener noreferrer"
        className="
          inline-flex items-center gap-2 
          text-sm text-[var(--fg-tertiary)] 
          hover:text-[var(--fg-secondary)]
          transition-colors
        "
      >
        <ExternalLink className="w-4 h-4" />
        View MCP Integration Guide
      </a>
    </div>
  );
}
