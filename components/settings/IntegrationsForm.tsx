'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Server, 
  Plug, 
  Trash2, 
  RefreshCw,
  CheckCircle,
  XCircle,
  MoreVertical,
  Zap,
  Settings2,
} from 'lucide-react';
import { useMcpConnections } from '@/hooks/useMcpConnections';
import { McpServerSettings } from './McpServerSettings';
import { McpConnectionModal } from './McpConnectionModal';
import type { McpConnection } from '@/lib/supabase/types';

// ============================================
// Types
// ============================================

type TabId = 'mcp-server' | 'mcp-client';

// ============================================
// Constants
// ============================================

// Mock brand ID - in production this would come from auth context
const BRAND_ID = 'f64b8b02-4a32-4f1a-9c5d-5e9a3b2c1d0e';

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


function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg
        text-sm font-medium transition-colors
        ${
          active
            ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]'
            : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)]'
        }
      `}
    >
      <Icon className="w-4 h-4" />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className={`
          px-1.5 py-0.5 text-xs rounded-full
          ${active 
            ? 'bg-white/20 text-white' 
            : 'bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)]'
          }
        `}>
          {badge}
        </span>
      )}
    </button>
  );
}

function McpConnectionRow({
  connection,
  onToggle,
  onTest,
  onDelete,
  onEdit,
}: {
  connection: McpConnection;
  onToggle: () => void;
  onTest: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = async () => {
    setIsTesting(true);
    await onTest();
    setIsTesting(false);
  };

  const healthIcon = {
    healthy: <CheckCircle className="w-4 h-4 text-green-500" />,
    unhealthy: <XCircle className="w-4 h-4 text-red-500" />,
    unknown: <div className="w-4 h-4 rounded-full bg-[var(--bg-quaternary)]" />,
  };

  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-[var(--border-secondary)] last:border-0">
      <div className="flex items-center gap-4 min-w-0">
        {/* Icon */}
        <div className="
          flex-shrink-0
          w-10 h-10
          bg-[var(--bg-tertiary)]
          rounded-lg
          flex items-center justify-center
        ">
          <Server className="w-5 h-5 text-[var(--fg-tertiary)]" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--fg-primary)]">
              {connection.name}
            </h3>
            {healthIcon[connection.healthStatus]}
          </div>
          <p className="text-xs text-[var(--fg-tertiary)] truncate">
            {connection.description || connection.serverUrl}
          </p>
          {connection.availableTools && connection.availableTools.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Zap className="w-3 h-3 text-[var(--fg-quaternary)]" />
              <span className="text-xs text-[var(--fg-quaternary)]">
                {connection.availableTools.length} tool(s)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Toggle
          enabled={connection.isActive}
          onChange={onToggle}
          label={`Toggle ${connection.name}`}
        />
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] rounded-lg"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-lg shadow-lg py-1">
                <button
                  onClick={() => {
                    handleTest();
                    setShowMenu(false);
                  }}
                  disabled={isTesting}
                  className="w-full px-3 py-2 text-left text-sm text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] flex items-center gap-2"
                >
                  {isTesting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Test Connection
                </button>
                <button
                  onClick={() => {
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] flex items-center gap-2"
                >
                  <Settings2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function IntegrationsForm() {
  const [activeTab, setActiveTab] = useState<TabId>('mcp-server');
  const [brandId, setBrandId] = useState<string | null>(null);
  
  // MCP Connection state
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<McpConnection | null>(null);
  
  const {
    connections,
    isLoading: isLoadingConnections,
    createConnection,
    updateConnection,
    deleteConnection,
    toggleConnection,
    testConnection,
  } = useMcpConnections();

  // Fetch brand ID on mount
  useEffect(() => {
    // In production, this would come from auth context or API
    // For now, fetch the Open Session brand
    async function fetchBrandId() {
      try {
        const response = await fetch('/api/brand?slug=open-session');
        if (response.ok) {
          const data = await response.json();
          setBrandId(data.id);
        } else {
          // Fallback to hardcoded brand ID
          setBrandId(BRAND_ID);
        }
      } catch {
        setBrandId(BRAND_ID);
      }
    }
    fetchBrandId();
  }, []);

  const handleSaveConnection = async (data: Parameters<typeof createConnection>[0]) => {
    if (editingConnection) {
      const success = await updateConnection(editingConnection.id, {
        name: data.name,
        description: data.description,
        serverUrl: data.serverUrl,
        serverType: data.serverType,
        authType: data.authType,
        authConfig: data.authConfig,
      });
      return success ? editingConnection : null;
    } else {
      return createConnection(data);
    }
  };

  const handleEditConnection = (connection: McpConnection) => {
    setEditingConnection(connection);
    setShowConnectionModal(true);
  };

  const handleCloseModal = () => {
    setShowConnectionModal(false);
    setEditingConnection(null);
  };

  return (
    <div className="max-w-4xl">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[var(--border-secondary)]">
        <TabButton
          active={activeTab === 'mcp-server'}
          onClick={() => setActiveTab('mcp-server')}
          icon={Server}
          label="BOS MCP"
        />
        <TabButton
          active={activeTab === 'mcp-client'}
          onClick={() => setActiveTab('mcp-client')}
          icon={Plug}
          label="Connect Apps"
          badge={connections.filter(c => c.isActive).length}
        />
      </div>

      {/* Tab Content */}
      {activeTab === 'mcp-server' && brandId && (
        <McpServerSettings brandId={brandId} />
      )}

      {activeTab === 'mcp-client' && (
        <div className="space-y-6">
          {/* Header - no icon */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--fg-primary)]">
                Connect Apps
              </h3>
              <p className="text-sm text-[var(--fg-tertiary)] max-w-lg mt-1">
                Connect to external MCP servers to extend what Claude and Polar can do. These tools become available in your chat sessions.
              </p>
            </div>
            <button
              onClick={() => setShowConnectionModal(true)}
              className="
                flex items-center gap-2 px-4 py-2
                bg-[var(--bg-brand-solid)]
                text-white text-sm font-medium
                rounded-lg
                hover:opacity-90
                transition-opacity
              "
            >
              <Plus className="w-4 h-4" />
              Add Connection
            </button>
          </div>

          {/* Connections List */}
          {isLoadingConnections ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-5 h-5 animate-spin text-[var(--fg-tertiary)]" />
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-12 bg-[var(--bg-secondary-alt)] rounded-xl border border-[var(--border-secondary)]">
              <Plug className="w-10 h-10 text-[var(--fg-quaternary)] mx-auto mb-3" />
              <h4 className="text-sm font-medium text-[var(--fg-secondary)]">
                No connections yet
              </h4>
              <p className="text-sm text-[var(--fg-tertiary)] mt-1 max-w-sm mx-auto">
                Add an MCP server to give your AI assistants access to external tools and data.
              </p>
              <button
                onClick={() => setShowConnectionModal(true)}
                className="
                  inline-flex items-center gap-2 mt-4 px-4 py-2
                  bg-[var(--bg-tertiary)]
                  text-[var(--fg-secondary)] text-sm font-medium
                  rounded-lg
                  hover:bg-[var(--bg-quaternary)]
                  transition-colors
                "
              >
                <Plus className="w-4 h-4" />
                Add your first connection
              </button>
            </div>
          ) : (
            <div className="bg-[var(--bg-secondary-alt)] rounded-xl border border-[var(--border-secondary)] divide-y divide-[var(--border-secondary)]">
              {connections.map((connection) => (
                <div key={connection.id} className="px-4">
                  <McpConnectionRow
                    connection={connection}
                    onToggle={() => toggleConnection(connection.id)}
                    onTest={() => testConnection(connection.id)}
                    onDelete={() => deleteConnection(connection.id)}
                    onEdit={() => handleEditConnection(connection)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Connection Modal */}
      <McpConnectionModal
        isOpen={showConnectionModal}
        onClose={handleCloseModal}
        onSave={handleSaveConnection}
        connection={editingConnection}
      />
    </div>
  );
}
