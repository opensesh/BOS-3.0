'use client';

import { useState } from 'react';
import { SettingsSectionHeader } from './SettingsSection';
import {
  Plus,
  Search,
  MoreVertical,
  Mail,
  Trash2,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { Avatar } from '@/components/ui/base/avatar/avatar';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending';
  joinedAt: string;
}

const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'Olivia Rhye',
    email: 'olivia@opensession.co',
    role: 'owner',
    status: 'active',
    joinedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Phoenix Baker',
    email: 'phoenix@opensession.co',
    role: 'admin',
    status: 'active',
    joinedAt: '2024-02-20',
  },
  {
    id: '3',
    name: 'Lana Steiner',
    email: 'lana@opensession.co',
    role: 'member',
    status: 'active',
    joinedAt: '2024-03-10',
  },
  {
    id: '4',
    name: 'Demi Wilkinson',
    email: 'demi@opensession.co',
    role: 'member',
    status: 'pending',
    joinedAt: '2024-12-01',
  },
];

const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  member: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export function TeamForm() {
  const [members, setMembers] = useState<TeamMember[]>(MOCK_TEAM_MEMBERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const removeMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="max-w-4xl">
      <SettingsSectionHeader
        title="Team members"
        description="Manage your team members and their account permissions here."
      />

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-5 border-b border-[var(--border-secondary)]">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-[var(--fg-quaternary)]" />
          </div>
          <input
            type="text"
            placeholder="Search team members"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full
              pl-10 pr-3 py-2
              bg-[var(--bg-primary)]
              border border-[var(--border-primary)]
              rounded-lg
              text-[var(--fg-primary)]
              text-base
              placeholder:text-[var(--fg-placeholder)]
              focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]
              shadow-xs
            "
          />
        </div>

        {/* Invite Button */}
        <button
          onClick={() => setShowInviteModal(true)}
          className="
            flex items-center gap-2
            px-4 py-2.5
            bg-[var(--bg-brand-solid)]
            border-2 border-white/12
            rounded-lg
            text-sm font-semibold text-white
            shadow-xs
            hover:bg-[var(--bg-brand-solid-hover)]
            transition-colors
          "
        >
          <Plus className="w-5 h-5" />
          Invite member
        </button>
      </div>

      {/* Team Members Table */}
      <div className="border border-[var(--border-secondary)] rounded-xl overflow-hidden mt-5">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--bg-secondary-alt)] border-b border-[var(--border-secondary)]">
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--fg-tertiary)]">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--fg-tertiary)]">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--fg-tertiary)]">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--fg-tertiary)]">
                Joined
              </th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member, index) => (
              <tr
                key={member.id}
                className={`
                  border-b border-[var(--border-secondary)]
                  ${index === filteredMembers.length - 1 ? 'border-b-0' : ''}
                `}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="sm"
                      initials={member.name.split(' ').map(n => n[0]).join('')}
                      contrastBorder
                    />
                    <div>
                      <p className="text-sm font-medium text-[var(--fg-primary)]">
                        {member.name}
                      </p>
                      <p className="text-sm text-[var(--fg-tertiary)]">
                        {member.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="relative inline-block">
                    <button className={`
                      inline-flex items-center gap-1
                      px-2.5 py-1
                      rounded-full
                      text-xs font-medium
                      ${ROLE_COLORS[member.role]}
                    `}>
                      {ROLE_LABELS[member.role]}
                      {member.role !== 'owner' && (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`
                    inline-flex items-center
                    px-2.5 py-1
                    rounded-full
                    text-xs font-medium
                    ${member.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }
                  `}>
                    {member.status === 'active' ? 'Active' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-[var(--fg-tertiary)]">
                  {new Date(member.joinedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    {member.status === 'pending' && (
                      <button
                        className="p-2 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] transition-colors"
                        title="Resend invite"
                      >
                        <Mail className="w-5 h-5" />
                      </button>
                    )}
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => removeMember(member.id)}
                        className="p-2 text-[var(--fg-quaternary)] hover:text-[var(--fg-error-primary)] transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      className="p-2 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] transition-colors"
                      title="More options"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredMembers.length === 0 && (
        <div className="py-12 text-center border border-[var(--border-secondary)] rounded-xl mt-5">
          <p className="text-sm text-[var(--fg-tertiary)]">
            No team members found matching "{searchQuery}"
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-6 mt-5 pt-5 border-t border-[var(--border-secondary)]">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[var(--fg-quaternary)]" />
          <span className="text-sm text-[var(--fg-tertiary)]">
            {members.filter(m => m.role === 'admin' || m.role === 'owner').length} admins
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--fg-tertiary)]">
            {members.length} total members
          </span>
        </div>
      </div>
    </div>
  );
}

