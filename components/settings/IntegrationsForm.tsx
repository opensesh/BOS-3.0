'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconBg: string;
  enabled: boolean;
}

const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: 'linear',
    name: 'Linear',
    description: 'Streamline software projects, sprints, tasks, and bug tracking.',
    icon: '◆',
    iconBg: 'bg-indigo-600',
    enabled: true,
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Link pull requests and automate workflows.',
    icon: '⬤',
    iconBg: 'bg-black dark:bg-white dark:text-black',
    enabled: true,
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Embed file previews in projects.',
    icon: 'F',
    iconBg: 'bg-gradient-to-br from-pink-500 via-red-500 to-purple-500',
    enabled: true,
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Build custom automations and integrations with other apps.',
    icon: '⚡',
    iconBg: 'bg-orange-500',
    enabled: true,
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Embed notion pages and notes in projects.',
    icon: 'N',
    iconBg: 'bg-black dark:bg-white dark:text-black',
    enabled: true,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications to channels and create projects from messages.',
    icon: '#',
    iconBg: 'bg-gradient-to-br from-green-400 via-blue-500 to-purple-500',
    enabled: false,
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Connect project management and issue tracking.',
    icon: '◇',
    iconBg: 'bg-blue-600',
    enabled: false,
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Sync tasks and projects with your team.',
    icon: '○',
    iconBg: 'bg-gradient-to-br from-pink-500 to-orange-400',
    enabled: false,
  },
];

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

function AnnouncementBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="
      flex items-center gap-6
      p-6
      bg-[var(--bg-secondary-alt)]
      border border-[var(--border-secondary)]
      rounded-xl
      mb-8
    ">
      {/* Image placeholder */}
      <div className="
        hidden sm:block
        flex-shrink-0
        w-48 h-32
        rounded-lg
        bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-quaternary)]
        overflow-hidden
      ">
        <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">
          👩‍💻
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-[var(--fg-primary)]">
          We've just released a new update!
        </h3>
        <p className="mt-1 text-sm text-[var(--fg-tertiary)]">
          Check out the all new dashboard view. Pages and now load faster.
        </p>
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={onDismiss}
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
            Dismiss
          </button>
          <button className="
            px-4 py-2
            bg-[var(--bg-brand-primary)]
            border border-[var(--border-brand)]
            rounded-lg
            text-sm font-medium text-[var(--fg-brand-primary)]
            hover:bg-[var(--bg-brand-primary-hover)]
            transition-all duration-150
          ">
            Changelog
          </button>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onDismiss}
        className="
          absolute top-4 right-4
          p-1
          text-[var(--fg-quaternary)]
          hover:text-[var(--fg-tertiary)]
          transition-colors
        "
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export function IntegrationsForm() {
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);
  const [showBanner, setShowBanner] = useState(true);

  const toggleIntegration = (id: string, enabled: boolean) => {
    setIntegrations(prev =>
      prev.map(int => int.id === id ? { ...int, enabled } : int)
    );
  };


  return (
    <div className="max-w-4xl">
      {/* Announcement Banner */}
      {showBanner && (
        <div className="relative">
          <AnnouncementBanner onDismiss={() => setShowBanner(false)} />
        </div>
      )}

      {/* Connected Apps Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-[var(--border-secondary)]">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-[var(--fg-primary)]">
            Connected apps
          </h2>
          <p className="mt-1 text-sm text-[var(--fg-tertiary)] max-w-xl">
            Connect external tools using MCP (Model Context Protocol). When enabled, your AI assistant can read and write data across these integrations.
          </p>
        </div>
      </div>

      {/* Integrations List */}
      <div className="divide-y divide-[var(--border-secondary)]">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="flex items-center justify-between gap-4 py-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              {/* Icon */}
              <div className={`
                flex-shrink-0
                w-12 h-12
                ${integration.iconBg}
                rounded-xl
                flex items-center justify-center
                text-white text-lg font-bold
              `}>
                {integration.icon}
              </div>

              {/* Info */}
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[var(--fg-primary)]">
                  {integration.name}
                </h3>
                <p className="text-sm text-[var(--fg-tertiary)] truncate">
                  {integration.description}
                </p>
              </div>
            </div>

            {/* Toggle */}
            <div className="flex items-center flex-shrink-0">
              <Toggle
                enabled={integration.enabled}
                onChange={(enabled) => toggleIntegration(integration.id, enabled)}
                label={`Toggle ${integration.name} integration`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

