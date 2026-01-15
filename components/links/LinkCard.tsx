'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Copy,
  Check,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
  Archive,
  BarChart2,
  QrCode,
  Link2,
  Clock,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagBadgeGroup } from './TagBadge';
import type { ShortLink, ShortLinkTag, ShortLinkTagColor } from '@/lib/supabase/types';

interface LinkCardProps {
  link: ShortLink;
  tags?: ShortLinkTag[];
  onEdit?: (link: ShortLink) => void;
  onDelete?: (link: ShortLink) => void;
  onArchive?: (link: ShortLink) => void;
  onDuplicate?: (link: ShortLink) => void;
  onViewAnalytics?: (link: ShortLink) => void;
  onGenerateQR?: (link: ShortLink) => void;
  className?: string;
}

/**
 * Card component for displaying a short link
 */
export function LinkCard({
  link,
  tags = [],
  onEdit,
  onDelete,
  onArchive,
  onDuplicate,
  onViewAnalytics,
  onGenerateQR,
  className,
}: LinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Build the full short URL
  const shortUrl = `${link.domain}/l/${link.shortCode}`;

  // Get tag objects for display
  const tagObjects = (link.tags || []).map((tagName) => {
    const tagObj = tags.find(
      (t) => t.name.toLowerCase() === tagName.toLowerCase()
    );
    return {
      name: tagName,
      color: tagObj?.color as ShortLinkTagColor | undefined,
    };
  });

  // Copy short URL to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`https://${shortUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [shortUrl]);

  // Format click count
  const formatClicks = (clicks: number) => {
    if (clicks >= 1000000) {
      return `${(clicks / 1000000).toFixed(1)}M`;
    }
    if (clicks >= 1000) {
      return `${(clicks / 1000).toFixed(1)}K`;
    }
    return clicks.toString();
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year:
        date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  // Check if link is expired
  const isExpired =
    link.expiresAt && new Date(link.expiresAt) < new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'group relative p-4 rounded-xl',
        'bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/40',
        'hover:bg-[var(--bg-secondary)]/60 hover:border-[var(--border-primary)]',
        'transition-all duration-200',
        isExpired && 'opacity-60',
        className
      )}
    >
      {/* Click count badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-[var(--fg-tertiary)]">
        <BarChart2 className="w-3.5 h-3.5" />
        <span className="font-medium">{formatClicks(link.clicks)} clicks</span>
      </div>

      {/* Main content */}
      <div className="space-y-2">
        {/* Short URL with copy button */}
        <div className="flex items-center gap-2 pr-20">
          <Link2 className="w-4 h-4 text-[var(--fg-tertiary)] flex-shrink-0" />
          <span className="text-sm font-medium text-[var(--fg-primary)] truncate">
            {shortUrl}
          </span>
          <button
            onClick={handleCopy}
            className={cn(
              'p-1 rounded-md transition-all',
              'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]',
              'hover:bg-[var(--bg-tertiary)]',
              'opacity-0 group-hover:opacity-100'
            )}
            title="Copy short link"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Destination URL */}
        <div className="flex items-center gap-2 pl-6">
          <span className="text-xs text-[var(--fg-tertiary)]">→</span>
          <a
            href={link.destinationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] truncate max-w-[280px] transition-colors"
            title={link.destinationUrl}
          >
            {link.destinationUrl}
          </a>
          <ExternalLink className="w-3 h-3 text-[var(--fg-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>

        {/* Tags */}
        {tagObjects.length > 0 && (
          <div className="pl-6 pt-1">
            <TagBadgeGroup tags={tagObjects} maxVisible={3} size="sm" />
          </div>
        )}

        {/* Footer: Date + Status indicators */}
        <div className="flex items-center justify-between pt-2 pl-6">
          <div className="flex items-center gap-3 text-xs text-[var(--fg-tertiary)]">
            <span>Created {formatDate(link.createdAt)}</span>
            {link.hasPassword && (
              <span className="flex items-center gap-1" title="Password protected">
                <Lock className="w-3 h-3" />
              </span>
            )}
            {link.expiresAt && (
              <span
                className={cn(
                  'flex items-center gap-1',
                  isExpired && 'text-red-500'
                )}
                title={isExpired ? 'Expired' : `Expires ${formatDate(link.expiresAt)}`}
              >
                <Clock className="w-3 h-3" />
                {isExpired ? 'Expired' : formatDate(link.expiresAt)}
              </span>
            )}
          </div>

          {/* Actions menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]',
                'hover:bg-[var(--bg-tertiary)]',
                'opacity-0 group-hover:opacity-100',
                showMenu && 'opacity-100 bg-[var(--bg-tertiary)]'
              )}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute right-0 bottom-full mb-1 z-50 w-40 py-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-lg"
                >
                  {onEdit && (
                    <MenuButton
                      icon={Pencil}
                      onClick={() => {
                        onEdit(link);
                        setShowMenu(false);
                      }}
                    >
                      Edit
                    </MenuButton>
                  )}
                  {onViewAnalytics && (
                    <MenuButton
                      icon={BarChart2}
                      onClick={() => {
                        onViewAnalytics(link);
                        setShowMenu(false);
                      }}
                    >
                      Analytics
                    </MenuButton>
                  )}
                  {onGenerateQR && (
                    <MenuButton
                      icon={QrCode}
                      onClick={() => {
                        onGenerateQR(link);
                        setShowMenu(false);
                      }}
                    >
                      QR Code
                    </MenuButton>
                  )}
                  {onDuplicate && (
                    <MenuButton
                      icon={Copy}
                      onClick={() => {
                        onDuplicate(link);
                        setShowMenu(false);
                      }}
                    >
                      Duplicate
                    </MenuButton>
                  )}
                  {onArchive && (
                    <MenuButton
                      icon={Archive}
                      onClick={() => {
                        onArchive(link);
                        setShowMenu(false);
                      }}
                    >
                      {link.isArchived ? 'Unarchive' : 'Archive'}
                    </MenuButton>
                  )}
                  {onDelete && (
                    <MenuButton
                      icon={Trash2}
                      variant="danger"
                      onClick={() => {
                        onDelete(link);
                        setShowMenu(false);
                      }}
                    >
                      Delete
                    </MenuButton>
                  )}
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface MenuButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

function MenuButton({
  icon: Icon,
  children,
  onClick,
  variant = 'default',
}: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors',
        variant === 'danger'
          ? 'text-red-500 hover:bg-red-500/10'
          : 'text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)]'
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{children}</span>
    </button>
  );
}

interface LinkCardGridProps {
  links: ShortLink[];
  tags?: ShortLinkTag[];
  onEdit?: (link: ShortLink) => void;
  onDelete?: (link: ShortLink) => void;
  onArchive?: (link: ShortLink) => void;
  onDuplicate?: (link: ShortLink) => void;
  onViewAnalytics?: (link: ShortLink) => void;
  onGenerateQR?: (link: ShortLink) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * Grid layout for link cards
 */
export function LinkCardGrid({
  links,
  tags,
  onEdit,
  onDelete,
  onArchive,
  onDuplicate,
  onViewAnalytics,
  onGenerateQR,
  isLoading,
  emptyMessage = 'No links yet',
  className,
}: LinkCardGridProps) {
  if (isLoading) {
    return (
      <div className={cn('grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3', className)}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/40 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-4">
          <Link2 className="w-7 h-7 text-[var(--fg-tertiary)]" />
        </div>
        <h3 className="text-base font-medium text-[var(--fg-primary)]">
          {emptyMessage}
        </h3>
        <p className="mt-1 text-sm text-[var(--fg-tertiary)] max-w-xs">
          Create your first short link to get started.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {links.map((link) => (
        <LinkCard
          key={link.id}
          link={link}
          tags={tags}
          onEdit={onEdit}
          onDelete={onDelete}
          onArchive={onArchive}
          onDuplicate={onDuplicate}
          onViewAnalytics={onViewAnalytics}
          onGenerateQR={onGenerateQR}
        />
      ))}
    </div>
  );
}
