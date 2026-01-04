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
  AlertCircle,
  CheckCircle,
  Zap,
  XCircle,
} from 'lucide-react';
import { useMcpServerConfig } from '@/hooks/useMcpConnections';
import { mcpService } from '@/lib/supabase/mcp-service';
import { toast } from 'sonner';

// ============================================
// Sub-components
// ============================================

function Toggle({
  enabled,
  onChange,
  label,
  disabled,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer
        rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-2
        ${enabled ? 'bg-[var(--bg-brand-solid)]' : 'bg-[var(--bg-quaternary)]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
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

// Modal for showing newly generated key
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
            <strong>Important:</strong> Copy this key now. You won't be able to see it again after closing this dialog.
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

function QuickSetupCard({ 
  serverUrl, 
  apiKey,
  onGenerateKey,
  onTestConnection,
  isGenerating,
  isTesting,
  testResult,
}: { 
  serverUrl: string; 
  apiKey?: string;
  onGenerateKey: () => void;
  onTestConnection: () => void;
  isGenerating: boolean;
  isTesting: boolean;
  testResult: { success: boolean; message: string; toolCount?: number } | null;
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
    toast.success('Copied to clipboard!');
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
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <code className="text-xs font-mono text-green-600 dark:text-green-400 truncate">
                    {apiKey.slice(0, 20)}...
                  </code>
                </div>
                <button
                  onClick={onGenerateKey}
                  disabled={isGenerating}
                  className="text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] underline"
                >
                  {isGenerating ? 'Creating...' : 'Create another'}
                </button>
              </div>
            ) : (
              <div className="ml-7">
                <button
                  onClick={onGenerateKey}
                  disabled={isGenerating}
                  className="
                    flex items-center gap-2 px-3 py-2
                    bg-[var(--bg-brand-solid)]
                    text-white text-sm font-medium
                    rounded-lg
                    hover:opacity-90
                    disabled:opacity-50
                    transition-opacity
                  "
                >
                  {isGenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  {isGenerating ? 'Creating...' : 'Generate API Key'}
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
            <div className="ml-7 space-y-2">
              <button
                onClick={onTestConnection}
                disabled={!apiKey || isTesting}
                className="
                  flex items-center gap-2 px-3 py-2
                  bg-[var(--bg-tertiary)]
                  text-[var(--fg-primary)] text-sm font-medium
                  rounded-lg
                  hover:bg-[var(--bg-quaternary)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                {isTesting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>
              
              {/* Test result */}
              {testResult && (
                <div className={`
                  flex items-start gap-2 p-3 rounded-lg
                  ${testResult.success 
                    ? 'bg-green-500/10 border border-green-500/20' 
                    : 'bg-red-500/10 border border-red-500/20'
                  }
                `}>
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${testResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                      {testResult.success ? 'Connection successful!' : 'Connection failed'}
                    </p>
                    <p className="text-xs text-[var(--fg-tertiary)] mt-0.5">
                      {testResult.message}
                    </p>
                    {testResult.success && testResult.toolCount && (
                      <p className="text-xs text-[var(--fg-quaternary)] mt-1">
                        {testResult.toolCount} tools available
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {!apiKey && (
                <p className="text-xs text-[var(--fg-quaternary)]">
                  Generate an API key first to test the connection
                </p>
              )}
            </div>
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
  const [isTogglingServer, setIsTogglingServer] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; toolCount?: number } | null>(null);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<{ key: string; name: string } | null>(null);

  const serverUrl = mcpService.getMcpServerUrl();

  const handleGenerateKey = useCallback(async () => {
    setIsGenerating(true);
    try {
      const keyName = `Key ${(config?.apiKeys?.length || 0) + 1}`;
      const newKey = await generateApiKey(keyName);
      
      if (newKey) {
        // Show the modal with the new key
        setNewlyGeneratedKey({ key: newKey.key, name: newKey.name });
        toast.success('API key created successfully!');
      } else {
        toast.error('Failed to create API key. Please try again.');
      }
    } catch (err) {
      console.error('Error generating key:', err);
      toast.error('An error occurred while creating the API key.');
    } finally {
      setIsGenerating(false);
    }
  }, [config, generateApiKey]);

  const handleToggleServer = useCallback(async (enabled: boolean) => {
    setIsTogglingServer(true);
    try {
      const success = await updateConfig({ isEnabled: enabled });
      if (success) {
        toast.success(enabled ? 'MCP Server enabled' : 'MCP Server disabled');
      } else {
        toast.error('Failed to update server status');
      }
    } catch (err) {
      console.error('Error toggling server:', err);
      toast.error('An error occurred');
    } finally {
      setIsTogglingServer(false);
    }
  }, [updateConfig]);

  const handleTestConnection = useCallback(async () => {
    const activeKey = config?.apiKeys?.find(k => k.is_active)?.key;
    if (!activeKey) {
      toast.error('Please generate an API key first');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    
    try {
      // First, test initialize
      const initResponse = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
        }),
      });

      if (!initResponse.ok) {
        const errorText = await initResponse.text();
        setTestResult({
          success: false,
          message: `Server responded with ${initResponse.status}: ${errorText}`,
        });
        return;
      }

      const initData = await initResponse.json();
      if (initData.error) {
        setTestResult({
          success: false,
          message: initData.error.message || 'Server returned an error',
        });
        return;
      }

      // Then list tools
      const toolsResponse = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
        }),
      });

      if (!toolsResponse.ok) {
        setTestResult({
          success: true,
          message: `Connected to ${initData.result?.name || 'BOS MCP Server'} v${initData.result?.version || '1.0.0'}`,
        });
        return;
      }

      const toolsData = await toolsResponse.json();
      const toolCount = toolsData.result?.tools?.length || 0;

      setTestResult({
        success: true,
        message: `Connected to ${initData.result?.name || 'BOS MCP Server'} v${initData.result?.version || '1.0.0'}`,
        toolCount,
      });
      toast.success('Connection test passed!');
    } catch (err) {
      console.error('Test connection error:', err);
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to connect to server',
      });
      toast.error('Connection test failed');
    } finally {
      setIsTesting(false);
    }
  }, [config, serverUrl]);

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

  // Get the first active API key for display in config
  const activeApiKey = config?.apiKeys?.find(k => k.is_active)?.key;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-[var(--border-secondary)]">
        <div>
          <h3 className="text-lg font-semibold text-[var(--fg-primary)]">
            BOS MCP Server
          </h3>
          <p className="text-sm text-[var(--fg-tertiary)] max-w-lg mt-1">
            Connect AI tools like Claude Desktop and Cursor to your brand knowledge.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isTogglingServer && (
            <RefreshCw className="w-4 h-4 animate-spin text-[var(--fg-tertiary)]" />
          )}
          <Toggle
            enabled={config?.isEnabled ?? false}
            onChange={handleToggleServer}
            label="Enable MCP Server"
            disabled={isTogglingServer}
          />
        </div>
      </div>

      {/* Server Status */}
      {config?.isEnabled ? (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400">
            MCP Server is active and ready for connections
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg">
          <AlertCircle className="w-4 h-4 text-[var(--fg-tertiary)]" />
          <span className="text-sm text-[var(--fg-tertiary)]">
            MCP Server is disabled. Enable it to allow external connections.
          </span>
        </div>
      )}

      {/* Quick Setup Card - only show if enabled */}
      {config?.isEnabled && (
        <QuickSetupCard 
          serverUrl={serverUrl} 
          apiKey={activeApiKey}
          onGenerateKey={handleGenerateKey}
          onTestConnection={handleTestConnection}
          isGenerating={isGenerating}
          isTesting={isTesting}
          testResult={testResult}
        />
      )}

      {/* Documentation link */}
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

      {/* New Key Modal */}
      {newlyGeneratedKey && (
        <NewKeyModal
          keyValue={newlyGeneratedKey.key}
          keyName={newlyGeneratedKey.name}
          onClose={() => setNewlyGeneratedKey(null)}
        />
      )}
    </div>
  );
}
