'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Link2, BarChart2, Archive, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLinks, type LinkFilters as LinkFiltersType } from '@/hooks/useLinks';
import { useLinkTags } from '@/hooks/useLinkTags';
import { LinkCardGrid } from './LinkCard';
import { LinkFilters, type SortBy, type SortOrder, type ViewMode } from './LinkFilters';
import { CreateLinkModal, type LinkFormData } from './CreateLinkModal';
import { ConfirmModal } from '@/components/ui/Modal';
import type { ShortLink } from '@/lib/supabase/types';

interface LinksPageProps {
  brandId?: string;
  className?: string;
}

/**
 * Main dashboard page for managing short links
 */
export function LinksPage({ brandId, className }: LinksPageProps) {
  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLink, setEditingLink] = useState<ShortLink | null>(null);
  const [deletingLink, setDeletingLink] = useState<ShortLink | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filter state
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('created');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showArchived, setShowArchived] = useState(false);

  // Hooks
  const {
    links,
    stats,
    isLoading,
    hasMore,
    createLink,
    updateLink,
    deleteLink,
    archiveLink,
    duplicateLink,
    nextPage,
    isShortCodeAvailable,
  } = useLinks({
    brandId,
    includeArchived: showArchived,
  });

  // Default stats to avoid null errors
  const safeStats = stats ?? { total: 0, active: 0, archived: 0, totalClicks: 0 };

  const { tags, createTag } = useLinkTags({ brandId });

  // Handlers
  const handleCreateLink = useCallback(
    async (data: LinkFormData) => {
      await createLink({
        destination_url: data.destinationUrl,
        short_code: data.shortCode || undefined,
        title: data.title,
        description: data.description,
        tags: data.tags,
        password: data.password,
        expires_at: data.expiresAt,
        utm_source: data.utmSource,
        utm_medium: data.utmMedium,
        utm_campaign: data.utmCampaign,
        utm_term: data.utmTerm,
        utm_content: data.utmContent,
      });
    },
    [createLink]
  );

  const handleUpdateLink = useCallback(
    async (data: LinkFormData) => {
      if (!editingLink) return;
      await updateLink(editingLink.id, {
        destination_url: data.destinationUrl,
        short_code: data.shortCode,
        title: data.title,
        description: data.description,
        tags: data.tags,
        expires_at: data.expiresAt,
        utm_source: data.utmSource,
        utm_medium: data.utmMedium,
        utm_campaign: data.utmCampaign,
        utm_term: data.utmTerm,
        utm_content: data.utmContent,
      });
      setEditingLink(null);
    },
    [editingLink, updateLink]
  );

  const handleDeleteLink = useCallback(async () => {
    if (!deletingLink) return;
    await deleteLink(deletingLink.id);
    setDeletingLink(null);
  }, [deletingLink, deleteLink]);

  const handleArchiveLink = useCallback(
    async (link: ShortLink) => {
      await archiveLink(link.id);
    },
    [archiveLink]
  );

  const handleDuplicateLink = useCallback(
    async (link: ShortLink) => {
      await duplicateLink(link.id);
    },
    [duplicateLink]
  );

  const handleCreateTag = useCallback(
    async (name: string) => {
      return createTag(name);
    },
    [createTag]
  );

  return (
    <div className={cn('min-h-screen p-4 sm:p-6 lg:p-8', className)}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-[var(--fg-primary)]">
              Links
            </h1>
            <p className="text-sm text-[var(--fg-tertiary)]">
              Create and manage your short links
            </p>
          </div>

          <motion.button
            onClick={() => setShowCreateModal(true)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5',
              'bg-[var(--bg-brand-solid)] text-white',
              'rounded-xl font-medium text-sm',
              'hover:bg-[var(--bg-brand-solid-hover)] transition-colors',
              'shadow-sm'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            Create Link
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total Links"
            value={safeStats.total}
            icon={Link2}
            isLoading={isLoading}
          />
          <StatCard
            label="Active Links"
            value={safeStats.active}
            icon={Link2}
            color="green"
            isLoading={isLoading}
          />
          <StatCard
            label="Total Clicks"
            value={safeStats.totalClicks}
            icon={BarChart2}
            color="blue"
            isLoading={isLoading}
          />
          <StatCard
            label="Archived"
            value={safeStats.archived}
            icon={Archive}
            color="gray"
            isLoading={isLoading}
          />
        </div>

        {/* Filters */}
        <LinkFilters
          search={search}
          onSearchChange={setSearch}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          availableTags={tags}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showArchived={showArchived}
          onShowArchivedChange={setShowArchived}
        />

        {/* Links Grid */}
        <LinkCardGrid
          links={links}
          tags={tags}
          isLoading={isLoading}
          onEdit={setEditingLink}
          onDelete={setDeletingLink}
          onArchive={handleArchiveLink}
          onDuplicate={handleDuplicateLink}
          emptyMessage={
            search || selectedTags.length > 0
              ? 'No links match your filters'
              : 'No links yet. Create your first link!'
          }
        />

        {/* Load More */}
        {hasMore && !isLoading && (
          <div className="flex justify-center pt-4">
            <button
              onClick={nextPage}
              className={cn(
                'px-6 py-2.5 text-sm font-medium rounded-lg',
                'bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)]/40',
                'text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)]',
                'transition-colors'
              )}
            >
              Load More
            </button>
          </div>
        )}

        {/* Create/Edit Modal */}
        <CreateLinkModal
          isOpen={showCreateModal || !!editingLink}
          onClose={() => {
            setShowCreateModal(false);
            setEditingLink(null);
          }}
          onSubmit={editingLink ? handleUpdateLink : handleCreateLink}
          editingLink={editingLink}
          availableTags={tags}
          onCreateTag={handleCreateTag}
          checkShortCodeAvailable={isShortCodeAvailable}
        />

        {/* Delete Confirmation */}
        <ConfirmModal
          isOpen={!!deletingLink}
          onClose={() => setDeletingLink(null)}
          onConfirm={handleDeleteLink}
          title="Delete Link"
          message={`Are you sure you want to delete "${deletingLink?.shortCode}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'default' | 'green' | 'blue' | 'gray';
  isLoading?: boolean;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color = 'default',
  isLoading,
}: StatCardProps) {
  const colorClasses = {
    default: 'text-[var(--fg-tertiary)]',
    green: 'text-green-500',
    blue: 'text-blue-500',
    gray: 'text-gray-500',
  };

  const formatValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  return (
    <div
      className={cn(
        'p-4 rounded-xl',
        'bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/40'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-4 h-4', colorClasses[color])} />
        <span className="text-xs font-medium text-[var(--fg-tertiary)]">
          {label}
        </span>
      </div>
      {isLoading ? (
        <div className="h-8 w-16 bg-[var(--bg-secondary)] rounded animate-pulse" />
      ) : (
        <span className="text-2xl font-bold text-[var(--fg-primary)]">
          {formatValue(value)}
        </span>
      )}
    </div>
  );
}

// Export components for individual use
export { LinkCardGrid } from './LinkCard';
export { LinkFilters } from './LinkFilters';
export { CreateLinkModal } from './CreateLinkModal';
export { TagBadge, TagBadgeGroup } from './TagBadge';
export { TagSelector, TagColorPicker } from './TagSelector';
