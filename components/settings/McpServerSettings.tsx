'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { useMcpServerConfig } from '@/hooks/useMcpConnections';
import { mcpService } from '@/lib/supabase/mcp-service';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

type Platform = 'claude' | 'cursor' | 'vscode' | 'chatgpt' | 'gemini';

interface PlatformInfo {
  id: Platform;
  name: string;
  supportsUrl: boolean;
  supportsConfig: boolean;
  description: string;
}

// ============================================
// Constants
// ============================================

const PLATFORMS: PlatformInfo[] = [
  {
    id: 'claude',
    name: 'Claude Desktop',
    supportsUrl: true,
    supportsConfig: true,
    description: 'Anthropic\'s desktop app',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    supportsUrl: true,
    supportsConfig: true,
    description: 'AI-powered code editor',
  },
  {
    id: 'vscode',
    name: 'VS Code',
    supportsUrl: true,
    supportsConfig: true,
    description: 'Continue or Cline extension',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    supportsUrl: true,
    supportsConfig: false,
    description: 'Google AI Studio',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    supportsUrl: true,
    supportsConfig: false,
    description: 'Via Custom GPT Actions',
  },
];

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
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
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
            <strong>Important:</strong> Copy this key now. You won&apos;t be able to see it again after closing this dialog.
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
// Platform Instructions Components
// ============================================

function AdvancedSettingsDropdown({
  apiKey,
  onCopy,
  copied,
}: {
  apiKey?: string;
  onCopy: (text: string, type: string) => void;
  copied: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // For OAuth, we use the API key as the client secret
  const oauthClientId = 'bos-mcp-connector';
  const oauthClientSecret = apiKey || 'YOUR_API_KEY';

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <span className="text-xs font-medium text-[var(--fg-secondary)]">
          Advanced Settings (Optional)
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-amber-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-500" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-3 pb-3 space-y-2">
          <p className="text-xs text-[var(--fg-tertiary)] mb-2">
            If authentication is required, expand Advanced Settings in Claude and add:
          </p>
          
          <div className="flex items-center justify-between gap-2 p-2 bg-[var(--bg-primary)] rounded border border-[var(--border-secondary)]">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--fg-tertiary)] mb-0.5">OAuth Client ID (optional)</p>
              <code className="text-xs font-mono text-[var(--fg-primary)]">{oauthClientId}</code>
            </div>
            <button
              onClick={() => onCopy(oauthClientId, 'clientId')}
              className="p-1.5 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors flex-shrink-0"
            >
              {copied === 'clientId' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          
          <div className="flex items-center justify-between gap-2 p-2 bg-[var(--bg-primary)] rounded border border-[var(--border-secondary)]">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--fg-tertiary)] mb-0.5">OAuth Client Secret (optional)</p>
              <code className="text-xs font-mono text-[var(--fg-primary)] break-all">{oauthClientSecret}</code>
            </div>
            <button
              onClick={() => onCopy(oauthClientSecret, 'clientSecret')}
              className="p-1.5 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors flex-shrink-0"
            >
              {copied === 'clientSecret' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UrlInstructions({ 
  platform, 
  serverUrl, 
  apiKey,
  onCopy,
  copied,
}: { 
  platform: Platform; 
  serverUrl: string; 
  apiKey?: string;
  onCopy: (text: string, type: string) => void;
  copied: string | null;
}) {
  const instructions: Record<Platform, React.ReactNode> = {
    claude: (
      <div className="space-y-3">
        <ol className="text-sm text-[var(--fg-secondary)] space-y-2 list-decimal list-inside">
          <li>Open <strong>Claude Desktop</strong> → <strong>Settings</strong> → <strong>Connectors</strong></li>
          <li>Click <strong>&quot;Add custom connector&quot;</strong></li>
          <li>Enter the details below:</li>
        </ol>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 p-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-secondary)]">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--fg-tertiary)] mb-0.5">Name</p>
              <code className="text-xs font-mono text-[var(--fg-primary)]">BOS MCP Server</code>
            </div>
            <button
              onClick={() => onCopy('BOS MCP Server', 'name')}
              className="p-1.5 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors"
            >
              {copied === 'name' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          
          <div className="flex items-center justify-between gap-2 p-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-secondary)]">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--fg-tertiary)] mb-0.5">Remote MCP Server URL</p>
              <code className="text-xs font-mono text-[var(--fg-primary)] break-all">{serverUrl}</code>
            </div>
            <button
              onClick={() => onCopy(serverUrl, 'url')}
              className="p-1.5 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors flex-shrink-0"
            >
              {copied === 'url' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        
        <AdvancedSettingsDropdown 
          apiKey={apiKey}
          onCopy={onCopy}
          copied={copied}
        />
      </div>
    ),
    cursor: (
      <div className="space-y-3">
        <ol className="text-sm text-[var(--fg-secondary)] space-y-2 list-decimal list-inside">
          <li>Open <strong>Cursor Settings</strong> (Cmd/Ctrl + ,)</li>
          <li>Navigate to <strong>Features</strong> → <strong>MCP Servers</strong></li>
          <li>Click <strong>&quot;Add new MCP server&quot;</strong></li>
          <li>Enter the details below:</li>
        </ol>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 p-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-secondary)]">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--fg-tertiary)] mb-0.5">Server URL</p>
              <code className="text-xs font-mono text-[var(--fg-primary)] break-all">{serverUrl}</code>
            </div>
            <button
              onClick={() => onCopy(serverUrl, 'url')}
              className="p-1.5 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors flex-shrink-0"
            >
              {copied === 'url' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          
          <div className="flex items-center justify-between gap-2 p-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-secondary)]">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--fg-tertiary)] mb-0.5">API Key / Bearer Token</p>
              <code className="text-xs font-mono text-[var(--fg-primary)] break-all">{apiKey || 'YOUR_API_KEY'}</code>
            </div>
            <button
              onClick={() => onCopy(apiKey || 'YOUR_API_KEY', 'token')}
              className="p-1.5 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors flex-shrink-0"
            >
              {copied === 'token' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    ),
    vscode: (
      <div className="space-y-3">
        <p className="text-sm text-[var(--fg-secondary)]">
          For <strong>Continue</strong> or <strong>Cline</strong> extensions:
        </p>
        <ol className="text-sm text-[var(--fg-secondary)] space-y-2 list-decimal list-inside">
          <li>Open <strong>VS Code Settings</strong> (Cmd/Ctrl + ,)</li>
          <li>Search for <strong>&quot;Continue&quot;</strong> or <strong>&quot;Cline&quot;</strong> extension settings</li>
          <li>Find the <strong>MCP Servers</strong> section</li>
          <li>Click <strong>&quot;Add Server&quot;</strong> and enter these details:</li>
        </ol>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 p-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-secondary)]">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--fg-tertiary)] mb-0.5">Server URL</p>
              <code className="text-xs font-mono text-[var(--fg-primary)] break-all">{serverUrl}</code>
            </div>
            <button
              onClick={() => onCopy(serverUrl, 'url')}
              className="p-1.5 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors flex-shrink-0"
            >
              {copied === 'url' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          
          <div className="flex items-center justify-between gap-2 p-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-secondary)]">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--fg-tertiary)] mb-0.5">Authorization Header</p>
              <code className="text-xs font-mono text-[var(--fg-primary)] break-all">Bearer {apiKey || 'YOUR_API_KEY'}</code>
            </div>
            <button
              onClick={() => onCopy(`Bearer ${apiKey || 'YOUR_API_KEY'}`, 'auth')}
              className="p-1.5 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors flex-shrink-0"
            >
              {copied === 'auth' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    ),
    gemini: (
      <div className="space-y-3">
        <ol className="text-sm text-[var(--fg-secondary)] space-y-2 list-decimal list-inside">
          <li>Open <strong>Google AI Studio</strong> at <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-[var(--fg-brand)] hover:underline">aistudio.google.com</a></li>
          <li>Navigate to <strong>Extensions</strong> or <strong>Tools</strong></li>
          <li>Click <strong>&quot;Add MCP Server&quot;</strong></li>
          <li>Enter the details below:</li>
        </ol>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 p-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-secondary)]">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--fg-tertiary)] mb-0.5">Server URL</p>
              <code className="text-xs font-mono text-[var(--fg-primary)] break-all">{serverUrl}</code>
            </div>
            <button
              onClick={() => onCopy(serverUrl, 'url')}
              className="p-1.5 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors flex-shrink-0"
            >
              {copied === 'url' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          
          <div className="flex items-center justify-between gap-2 p-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-secondary)]">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--fg-tertiary)] mb-0.5">API Key</p>
              <code className="text-xs font-mono text-[var(--fg-primary)] break-all">{apiKey || 'YOUR_API_KEY'}</code>
            </div>
            <button
              onClick={() => onCopy(apiKey || 'YOUR_API_KEY', 'token')}
              className="p-1.5 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors flex-shrink-0"
            >
              {copied === 'token' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    ),
    chatgpt: (
      <div className="space-y-3">
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-xs text-[var(--fg-secondary)]">
            <strong>Note:</strong> ChatGPT doesn&apos;t natively support MCP. Use Custom GPT Actions instead.
          </p>
        </div>
        <ol className="text-sm text-[var(--fg-secondary)] space-y-2 list-decimal list-inside">
          <li>Go to <strong>ChatGPT</strong> and create a <strong>Custom GPT</strong></li>
          <li>Click <strong>Configure</strong> → <strong>Actions</strong></li>
          <li>Click <strong>&quot;Create new action&quot;</strong></li>
          <li>Set Authentication to <strong>API Key</strong> (Bearer)</li>
          <li>Use the details below:</li>
        </ol>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 p-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-secondary)]">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--fg-tertiary)] mb-0.5">API Endpoint</p>
              <code className="text-xs font-mono text-[var(--fg-primary)] break-all">{serverUrl}</code>
            </div>
            <button
              onClick={() => onCopy(serverUrl, 'url')}
              className="p-1.5 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors flex-shrink-0"
            >
              {copied === 'url' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          
          <div className="flex items-center justify-between gap-2 p-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-secondary)]">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--fg-tertiary)] mb-0.5">Bearer Token</p>
              <code className="text-xs font-mono text-[var(--fg-primary)] break-all">{apiKey || 'YOUR_API_KEY'}</code>
            </div>
            <button
              onClick={() => onCopy(apiKey || 'YOUR_API_KEY', 'token')}
              className="p-1.5 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors flex-shrink-0"
            >
              {copied === 'token' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    ),
  };

  return instructions[platform];
}

function ConfigInstructions({ 
  platform, 
  serverUrl, 
  apiKey,
  onCopy,
  copied,
}: { 
  platform: Platform; 
  serverUrl: string; 
  apiKey?: string;
  onCopy: (text: string, type: string) => void;
  copied: string | null;
}) {
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

  const vscodeConfig = `{
  "mcpServers": {
    "bos": {
      "url": "${serverUrl}",
      "auth": {
        "type": "bearer",
        "token": "${apiKey || 'YOUR_API_KEY'}"
      }
    }
  }
}`;

  const configs: Record<Platform, { config: string; path: string; instructions: string }> = {
    claude: {
      config: claudeConfig,
      path: '~/Library/Application Support/Claude/claude_desktop_config.json',
      instructions: 'Add this to your Claude Desktop config file:',
    },
    cursor: {
      config: cursorConfig,
      path: '~/.cursor/mcp.json',
      instructions: 'Add this to your Cursor MCP config:',
    },
    vscode: {
      config: vscodeConfig,
      path: '~/.continue/config.json or ~/.cline/config.json',
      instructions: 'Add this to your Continue or Cline config file:',
    },
    gemini: {
      config: '',
      path: '',
      instructions: '',
    },
    chatgpt: {
      config: '',
      path: '',
      instructions: '',
    },
  };

  const info = configs[platform];

  if (!info.config) {
    return (
      <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
        <p className="text-sm text-[var(--fg-tertiary)]">
          Config file method not available for {PLATFORMS.find(p => p.id === platform)?.name}. 
          Use the URL method instead.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--fg-secondary)]">{info.instructions}</p>
      
      <div className="relative">
        <div className="absolute top-2 right-2">
          <button
            onClick={() => onCopy(info.config, 'config')}
            className="p-1.5 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] hover:bg-[var(--bg-quaternary)] rounded transition-colors"
            title="Copy config"
          >
            {copied === 'config' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <pre className="text-xs font-mono text-[var(--fg-tertiary)] bg-[var(--bg-primary)] border border-[var(--border-secondary)] p-3 pr-12 rounded-lg overflow-x-auto">
          {info.config}
        </pre>
      </div>
      
      <p className="text-xs text-[var(--fg-quaternary)]">
        File location: <code className="bg-[var(--bg-tertiary)] px-1 rounded">{info.path}</code>
      </p>
    </div>
  );
}

// ============================================
// Quick Setup Card
// ============================================

function QuickSetupCard({ 
  serverUrl, 
  apiKey,
  onGenerateKey,
  isGenerating,
}: { 
  serverUrl: string; 
  apiKey?: string;
  onGenerateKey: () => void;
  isGenerating: boolean;
}) {
  const [showConfig, setShowConfig] = useState(true);
  const [activePlatform, setActivePlatform] = useState<Platform>('claude');
  const [copied, setCopied] = useState<string | null>(null);

  const currentPlatform = PLATFORMS.find(p => p.id === activePlatform)!;

  const copyToClipboard = async (text: string, type: string) => {
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
          <p className="text-xs text-[var(--fg-tertiary)]">Connect your AI tools in minutes</p>
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
                <div className="flex-1 flex items-center justify-between gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <code className="text-xs font-mono text-green-600 dark:text-green-400 truncate">
                      {apiKey.slice(0, 20)}...
                    </code>
                  </div>
                  <Link 
                    href="/settings?tab=api"
                    className="text-xs text-green-600 dark:text-green-400 hover:underline flex-shrink-0"
                  >
                    View
                  </Link>
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

          {/* Step 2: Connect Your AI Tool */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 bg-[var(--bg-brand-solid)] text-white text-xs font-bold rounded-full">2</span>
              <span className="text-sm font-medium text-[var(--fg-secondary)]">Connect your AI tool</span>
            </div>
            
            <div className="ml-7 space-y-3" onClick={(e) => e.stopPropagation()}>
              {/* Platform selector tabs - outside container */}
              <div className="relative inline-flex items-center gap-0.5 p-1 rounded-lg bg-[var(--bg-tertiary)]">
                {PLATFORMS.map((platform) => {
                  const isActive = activePlatform === platform.id;
                  return (
                    <button
                      key={platform.id}
                      onClick={() => setActivePlatform(platform.id)}
                      className={`
                        relative z-10 px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                        ${isActive
                          ? 'bg-[var(--bg-primary)] text-[var(--fg-primary)] shadow-sm'
                          : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
                        }
                      `}
                    >
                      {platform.name}
                    </button>
                  );
                })}
              </div>
              
              {/* Instructions container */}
              <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 space-y-4">
                {currentPlatform.supportsUrl && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-[var(--fg-primary)] uppercase tracking-wide">
                      URL Method {currentPlatform.supportsConfig && '(Recommended)'}
                    </h5>
                    <UrlInstructions 
                      platform={activePlatform} 
                      serverUrl={serverUrl}
                      apiKey={apiKey}
                      onCopy={copyToClipboard}
                      copied={copied}
                    />
                  </div>
                )}
                
                {currentPlatform.supportsConfig && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-[var(--fg-primary)] uppercase tracking-wide">
                      Config File Method
                    </h5>
                    <ConfigInstructions 
                      platform={activePlatform}
                      serverUrl={serverUrl}
                      apiKey={apiKey}
                      onCopy={copyToClipboard}
                      copied={copied}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Verify */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 bg-[var(--bg-brand-solid)] text-white text-xs font-bold rounded-full">3</span>
              <span className="text-sm font-medium text-[var(--fg-secondary)]">Verify in your AI tool</span>
            </div>
            <div className="ml-7">
              <p className="text-xs text-[var(--fg-tertiary)]">
                After adding the connection, open your AI tool and try asking about your brand. 
                The tool should now have access to your brand knowledge, colors, assets, and guidelines.
              </p>
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
  const { config, isLoading, error, refresh, updateConfig, generateApiKey } = useMcpServerConfig(brandId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTogglingServer, setIsTogglingServer] = useState(false);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<{ key: string; name: string } | null>(null);

  const serverUrl = mcpService.getMcpServerUrl();

  const handleGenerateKey = useCallback(async () => {
    setIsGenerating(true);
    try {
      const keyName = `Key ${(config?.apiKeys?.length || 0) + 1}`;
      const newKey = await generateApiKey(keyName);
      
      if (newKey) {
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
            Connect AI tools like Claude Desktop, Cursor, and VS Code to your brand knowledge.
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

      {/* Server Status - Only show when disabled */}
      {!config?.isEnabled && (
        <div className="flex items-center gap-2 p-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg">
          <AlertCircle className="w-4 h-4 text-[var(--fg-tertiary)]" />
          <span className="text-sm text-[var(--fg-tertiary)]">
            MCP Server is disabled. Enable it to allow external AI tools to connect.
          </span>
        </div>
      )}

      {/* Quick Setup Card - only show if enabled */}
      {config?.isEnabled && (
        <QuickSetupCard 
          serverUrl={serverUrl} 
          apiKey={activeApiKey}
          onGenerateKey={handleGenerateKey}
          isGenerating={isGenerating}
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
