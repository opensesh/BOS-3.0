'use client';

import { useState, useEffect } from 'react';
import { X, Server, Key, Globe, Loader2, CheckCircle, XCircle, Zap } from 'lucide-react';
import type { McpConnection, McpTool } from '@/lib/supabase/types';
import { mcpService } from '@/lib/supabase/mcp-service';

// ============================================
// Types
// ============================================

interface McpConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    serverUrl: string;
    serverType: 'remote' | 'local' | 'stdio';
    authType: 'none' | 'bearer' | 'api_key' | 'oauth';
    authConfig: { token?: string; apiKey?: string; apiKeyHeader?: string };
  }) => Promise<McpConnection | null>;
  connection?: McpConnection | null;
}

// ============================================
// Sub-components
// ============================================

function FormField({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[var(--fg-secondary)]">
        {label}
        {required && <span className="text-[var(--fg-error-primary)] ml-0.5">*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-xs text-[var(--fg-quaternary)]">{hint}</p>
      )}
    </div>
  );
}

function ToolsList({ tools }: { tools: McpTool[] }) {
  if (tools.length === 0) {
    return (
      <p className="text-sm text-[var(--fg-tertiary)]">
        No tools discovered. The server may not expose any tools.
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {tools.map((tool) => (
        <div
          key={tool.name}
          className="flex items-start gap-2 p-2 bg-[var(--bg-tertiary)] rounded-lg"
        >
          <Zap className="w-4 h-4 text-[var(--fg-brand-primary)] flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--fg-primary)]">
              {tool.name}
            </p>
            {tool.description && (
              <p className="text-xs text-[var(--fg-tertiary)] truncate">
                {tool.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function McpConnectionModal({
  isOpen,
  onClose,
  onSave,
  connection,
}: McpConnectionModalProps) {
  const isEditing = !!connection;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [serverType, setServerType] = useState<'remote' | 'local' | 'stdio'>('remote');
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'api_key' | 'oauth'>('none');
  const [token, setToken] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyHeader, setApiKeyHeader] = useState('X-API-Key');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    tools?: McpTool[];
    error?: string;
  } | null>(null);

  // Initialize form when editing
  useEffect(() => {
    if (connection) {
      setName(connection.name);
      setDescription(connection.description || '');
      setServerUrl(connection.serverUrl);
      setServerType(connection.serverType);
      setAuthType(connection.authType);
      setToken(connection.authConfig.token || '');
      setApiKey(connection.authConfig.apiKey || '');
      setApiKeyHeader(connection.authConfig.apiKeyHeader || 'X-API-Key');
    } else {
      // Reset form for new connection
      setName('');
      setDescription('');
      setServerUrl('');
      setServerType('remote');
      setAuthType('none');
      setToken('');
      setApiKey('');
      setApiKeyHeader('X-API-Key');
    }
    setTestResult(null);
  }, [connection, isOpen]);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const tools = await mcpService.discoverTools(serverUrl, {
        token: authType === 'bearer' ? token : undefined,
        apiKey: authType === 'api_key' ? apiKey : undefined,
      });

      setTestResult({
        success: true,
        tools,
      });
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : 'Connection failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    const result = await onSave({
      name,
      description: description || undefined,
      serverUrl,
      serverType,
      authType,
      authConfig: {
        token: authType === 'bearer' ? token : undefined,
        apiKey: authType === 'api_key' ? apiKey : undefined,
        apiKeyHeader: authType === 'api_key' ? apiKeyHeader : undefined,
      },
    });

    setIsSaving(false);

    if (result) {
      onClose();
    }
  };

  const isValid = name.trim() && serverUrl.trim();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-[var(--bg-primary)] rounded-xl shadow-2xl border border-[var(--border-secondary)] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-secondary)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--bg-tertiary)] rounded-lg">
              <Server className="w-5 h-5 text-[var(--fg-tertiary)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--fg-primary)]">
                {isEditing ? 'Edit MCP Connection' : 'Add MCP Connection'}
              </h2>
              <p className="text-sm text-[var(--fg-tertiary)]">
                Connect to an external MCP server
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-4 space-y-4">
          {/* Name */}
          <FormField label="Connection Name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., GitHub MCP"
              className="
                w-full px-3 py-2
                bg-[var(--bg-primary)]
                border border-[var(--border-secondary)]
                rounded-lg
                text-sm text-[var(--fg-primary)]
                placeholder:text-[var(--fg-quaternary)]
                focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]
              "
            />
          </FormField>

          {/* Description */}
          <FormField label="Description" hint="Optional description for this connection">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Access GitHub repos and issues"
              className="
                w-full px-3 py-2
                bg-[var(--bg-primary)]
                border border-[var(--border-secondary)]
                rounded-lg
                text-sm text-[var(--fg-primary)]
                placeholder:text-[var(--fg-quaternary)]
                focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]
              "
            />
          </FormField>

          {/* Server URL */}
          <FormField label="Server URL" required hint="The MCP server endpoint URL">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[var(--fg-quaternary)]" />
              <input
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://api.example.com/mcp"
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
            </div>
          </FormField>

          {/* Server Type */}
          <FormField label="Server Type">
            <select
              value={serverType}
              onChange={(e) => setServerType(e.target.value as typeof serverType)}
              className="
                w-full px-3 py-2
                bg-[var(--bg-primary)]
                border border-[var(--border-secondary)]
                rounded-lg
                text-sm text-[var(--fg-primary)]
                focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]
              "
            >
              <option value="remote">Remote (HTTP/HTTPS)</option>
              <option value="local">Local</option>
              <option value="stdio">Stdio (Command-line)</option>
            </select>
          </FormField>

          {/* Authentication */}
          <FormField label="Authentication">
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value as typeof authType)}
              className="
                w-full px-3 py-2
                bg-[var(--bg-primary)]
                border border-[var(--border-secondary)]
                rounded-lg
                text-sm text-[var(--fg-primary)]
                focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]
              "
            >
              <option value="none">None</option>
              <option value="bearer">Bearer Token</option>
              <option value="api_key">API Key</option>
              <option value="oauth">OAuth (Coming Soon)</option>
            </select>
          </FormField>

          {/* Bearer Token */}
          {authType === 'bearer' && (
            <FormField label="Bearer Token" required>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[var(--fg-quaternary)]" />
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter bearer token"
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
              </div>
            </FormField>
          )}

          {/* API Key */}
          {authType === 'api_key' && (
            <>
              <FormField label="API Key" required>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-[var(--fg-quaternary)]" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter API key"
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
                </div>
              </FormField>
              <FormField label="Header Name" hint="The HTTP header to send the API key in">
                <input
                  type="text"
                  value={apiKeyHeader}
                  onChange={(e) => setApiKeyHeader(e.target.value)}
                  placeholder="X-API-Key"
                  className="
                    w-full px-3 py-2
                    bg-[var(--bg-primary)]
                    border border-[var(--border-secondary)]
                    rounded-lg
                    text-sm text-[var(--fg-primary)]
                    placeholder:text-[var(--fg-quaternary)]
                    focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]
                  "
                />
              </FormField>
            </>
          )}

          {/* Test Connection */}
          {serverType === 'remote' && serverUrl && (
            <div className="space-y-3">
              <button
                onClick={handleTest}
                disabled={isTesting || !serverUrl}
                className="
                  flex items-center gap-2 px-4 py-2
                  bg-[var(--bg-tertiary)]
                  text-[var(--fg-secondary)] text-sm font-medium
                  rounded-lg
                  hover:bg-[var(--bg-quaternary)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Test Connection
              </button>

              {/* Test Result */}
              {testResult && (
                <div
                  className={`
                    p-4 rounded-lg border
                    ${
                      testResult.success
                        ? 'bg-[var(--bg-success-primary)] border-[var(--border-success)]'
                        : 'bg-[var(--bg-error-primary)] border-[var(--border-error)]'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.success ? (
                      <CheckCircle className="w-4 h-4 text-[var(--fg-success-primary)]" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[var(--fg-error-primary)]" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        testResult.success ? 'text-[var(--fg-success-primary)]' : 'text-[var(--fg-error-primary)]'
                      }`}
                    >
                      {testResult.success ? 'Connection successful!' : 'Connection failed'}
                    </span>
                  </div>

                  {testResult.success && testResult.tools && (
                    <div className="mt-3">
                      <p className="text-xs text-[var(--fg-tertiary)] mb-2">
                        Discovered {testResult.tools.length} tool(s):
                      </p>
                      <ToolsList tools={testResult.tools} />
                    </div>
                  )}

                  {testResult.error && (
                    <p className="text-sm text-[var(--fg-error-primary)]">{testResult.error}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-secondary)]">
          <button
            onClick={onClose}
            className="
              px-4 py-2
              bg-transparent
              border border-[var(--border-secondary)]
              rounded-lg
              text-sm font-medium text-[var(--fg-tertiary)]
              hover:text-[var(--fg-secondary)]
              hover:border-[var(--border-primary)]
              hover:bg-[var(--bg-tertiary)]
              transition-all duration-150
            "
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="
              flex items-center gap-2 px-4 py-2
              bg-[var(--bg-brand-solid)]
              text-[var(--fg-white)] text-sm font-medium
              rounded-lg
              hover:bg-[var(--bg-brand-solid\_hover)]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Add Connection'}
          </button>
        </div>
      </div>
    </div>
  );
}

