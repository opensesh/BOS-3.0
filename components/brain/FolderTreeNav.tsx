'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  FileText,
  File,
} from 'lucide-react';

export interface TreeItem {
  id: string;
  slug: string;
  title: string;
  itemType: 'folder' | 'file';
  children?: TreeItem[];
  pathSegments?: string[];
}

interface FolderTreeNavProps {
  /** The root tree item (usually a folder) */
  tree: TreeItem;
  /** Currently selected item ID */
  selectedId?: string;
  /** Callback when an item is selected */
  onSelect: (item: TreeItem) => void;
  /** Additional className for the container */
  className?: string;
  /** Whether to show the root item */
  showRoot?: boolean;
  /** Initially expanded folder IDs */
  initialExpanded?: string[];
}

interface TreeNodeProps {
  item: TreeItem;
  level: number;
  selectedId?: string;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (item: TreeItem) => void;
}

function TreeNode({ 
  item, 
  level, 
  selectedId, 
  expandedIds, 
  onToggle, 
  onSelect 
}: TreeNodeProps) {
  const isExpanded = expandedIds.has(item.id);
  const isSelected = selectedId === item.id;
  const isFolder = item.itemType === 'folder';
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = useCallback(() => {
    if (isFolder && hasChildren) {
      onToggle(item.id);
    }
    onSelect(item);
  }, [isFolder, hasChildren, item, onToggle, onSelect]);

  const handleChevronClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder && hasChildren) {
      onToggle(item.id);
    }
  }, [isFolder, hasChildren, item.id, onToggle]);

  // Determine icon based on item type and state
  const Icon = isFolder 
    ? (isExpanded ? FolderOpen : Folder)
    : (item.slug.endsWith('.md') || item.title.endsWith('.md') ? FileText : File);

  const iconColor = isFolder 
    ? 'text-[var(--fg-brand-primary)]' 
    : 'text-[var(--fg-tertiary)]';

  return (
    <div>
      <motion.button
        onClick={handleClick}
        className={`
          w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left
          transition-colors duration-150
          ${isSelected 
            ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]' 
            : 'hover:bg-[var(--bg-tertiary)] text-[var(--fg-primary)]'
          }
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Chevron for folders */}
        <span 
          className={`w-4 h-4 flex items-center justify-center ${hasChildren ? 'cursor-pointer' : 'opacity-0'}`}
          onClick={handleChevronClick}
        >
          {isFolder && hasChildren && (
            <motion.span
              initial={false}
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChevronRight className="w-3.5 h-3.5 text-[var(--fg-tertiary)]" />
            </motion.span>
          )}
        </span>

        {/* Icon */}
        <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />

        {/* Label */}
        <span className="text-sm truncate flex-1">
          {item.title}
        </span>
      </motion.button>

      {/* Children */}
      <AnimatePresence initial={false}>
        {isFolder && hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {item.children?.map((child) => (
              <TreeNode
                key={child.id}
                item={child}
                level={level + 1}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FolderTreeNav({ 
  tree, 
  selectedId, 
  onSelect, 
  className = '',
  showRoot = true,
  initialExpanded = [],
}: FolderTreeNavProps) {
  // Initialize expanded state with root always expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set(initialExpanded);
    if (showRoot) {
      initial.add(tree.id);
    }
    return initial;
  });

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // If showRoot is false, render children directly
  if (!showRoot && tree.children) {
    return (
      <div className={`space-y-0.5 ${className}`}>
        {tree.children.map((child) => (
          <TreeNode
            key={child.id}
            item={child}
            level={0}
            selectedId={selectedId}
            expandedIds={expandedIds}
            onToggle={handleToggle}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-0.5 ${className}`}>
      <TreeNode
        item={tree}
        level={0}
        selectedId={selectedId}
        expandedIds={expandedIds}
        onToggle={handleToggle}
        onSelect={onSelect}
      />
    </div>
  );
}

// ============================================
// Breadcrumb Navigation Component
// ============================================

interface BreadcrumbNavProps {
  /** Array of path segments to display */
  pathSegments: string[];
  /** The root label (e.g., plugin name) */
  rootLabel: string;
  /** Callback when a segment is clicked */
  onNavigate: (index: number) => void;
  /** Additional className */
  className?: string;
}

export function BreadcrumbNav({
  pathSegments,
  rootLabel,
  onNavigate,
  className = '',
}: BreadcrumbNavProps) {
  const allSegments = [rootLabel, ...pathSegments];

  return (
    <nav className={`flex items-center gap-1 text-sm ${className}`}>
      {allSegments.map((segment, index) => {
        const isLast = index === allSegments.length - 1;
        
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-[var(--fg-quaternary)]" />
            )}
            <button
              onClick={() => onNavigate(index - 1)} // -1 because root is at index 0
              disabled={isLast}
              className={`
                px-1.5 py-0.5 rounded transition-colors
                ${isLast 
                  ? 'text-[var(--fg-primary)] cursor-default' 
                  : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)]'
                }
              `}
            >
              {formatSegmentLabel(segment)}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/**
 * Format a path segment into a readable label
 */
function formatSegmentLabel(segment: string): string {
  // Remove file extension
  const withoutExt = segment.replace(/\.(md|txt|json)$/, '');
  // Convert kebab-case or snake_case to Title Case
  return withoutExt
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================
// Responsive Tree/Breadcrumb Switcher
// ============================================

interface ResponsiveNavProps {
  tree: TreeItem;
  selectedId?: string;
  selectedPath: string[];
  rootLabel: string;
  onSelect: (item: TreeItem) => void;
  onNavigate: (index: number) => void;
  className?: string;
}

export function ResponsiveTreeNav({
  tree,
  selectedId,
  selectedPath,
  rootLabel,
  onSelect,
  onNavigate,
  className = '',
}: ResponsiveNavProps) {
  return (
    <div className={className}>
      {/* Mobile: Breadcrumb */}
      <div className="md:hidden">
        <BreadcrumbNav
          pathSegments={selectedPath}
          rootLabel={rootLabel}
          onNavigate={onNavigate}
        />
      </div>
      
      {/* Desktop: Full Tree */}
      <div className="hidden md:block">
        <FolderTreeNav
          tree={tree}
          selectedId={selectedId}
          onSelect={onSelect}
          showRoot={false}
          initialExpanded={[tree.id]}
        />
      </div>
    </div>
  );
}

export default FolderTreeNav;
