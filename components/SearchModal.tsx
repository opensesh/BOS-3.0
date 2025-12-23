'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Plus, UserPlus, FileText, Users, FolderOpen, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterTab = 'all' | 'users' | 'projects' | 'files' | 'others';

interface SearchResult {
  id: string;
  type: 'user' | 'project' | 'file' | 'other';
  title: string;
  subtitle?: string;
  avatar?: string;
  icon?: typeof FileText;
  metadata?: string;
}

// Mock search results - in real app, this would come from an API
const mockResults: SearchResult[] = [
  {
    id: '1',
    type: 'user',
    title: 'Alex Bouhdary',
    subtitle: 'Last active 5 minutes ago',
    avatar: 'A',
  },
  {
    id: '2',
    type: 'project',
    title: 'Brand Guidelines',
    subtitle: 'Alex Bouhdary',
    metadata: 'Open Session',
    icon: FolderOpen,
  },
  {
    id: '3',
    type: 'file',
    title: 'Design System Notes',
    subtitle: 'Alex Bouhdary',
    metadata: 'Brand Hub',
    icon: FileText,
  },
  {
    id: '4',
    type: 'project',
    title: 'Website Redesign v2.0',
    subtitle: 'Alex Bouhdary',
    metadata: 'Spaces',
    icon: FolderOpen,
  },
];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setActiveTab('all');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter results based on search query and active tab
  const filteredResults = mockResults.filter((result) => {
    const matchesQuery = searchQuery === '' || 
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.subtitle?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'users' && result.type === 'user') ||
      (activeTab === 'projects' && result.type === 'project') ||
      (activeTab === 'files' && result.type === 'file') ||
      (activeTab === 'others' && result.type === 'other');
    
    return matchesQuery && matchesTab;
  });

  // Count results by type
  const counts = {
    all: mockResults.length,
    users: mockResults.filter(r => r.type === 'user').length,
    projects: mockResults.filter(r => r.type === 'project').length,
    files: mockResults.filter(r => r.type === 'file').length,
    others: mockResults.filter(r => r.type === 'other').length,
  };

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All results', count: counts.all },
    { id: 'users', label: 'Users', count: counts.users },
    { id: 'projects', label: 'Projects', count: counts.projects },
    { id: 'files', label: 'Files', count: counts.files },
    { id: 'others', label: 'Others', count: counts.others },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="
              fixed z-[101] 
              top-[15%] left-1/2 -translate-x-1/2
              w-full max-w-lg
              bg-[var(--bg-primary)]
              rounded-xl
              border border-[var(--border-secondary)]
              shadow-2xl
              overflow-hidden
            "
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-secondary)]">
              <Search className="w-5 h-5 text-[var(--fg-tertiary)] flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="
                  flex-1
                  bg-transparent
                  text-[var(--fg-primary)]
                  placeholder:text-[var(--fg-tertiary)]
                  focus:outline-none
                  text-sm
                "
              />
              <button
                onClick={onClose}
                className="
                  p-1 rounded-md
                  text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
                  hover:bg-[var(--bg-tertiary)]
                  transition-colors
                "
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--border-secondary)] overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-1.5
                    px-2.5 py-1
                    rounded-md
                    text-xs font-medium
                    whitespace-nowrap
                    transition-colors
                    ${activeTab === tab.id
                      ? 'bg-[var(--bg-tertiary)] text-[var(--fg-primary)]'
                      : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)]'
                    }
                  `}
                >
                  <span>{tab.label}</span>
                  <span className={`
                    ${activeTab === tab.id ? 'text-[var(--fg-secondary)]' : 'text-[var(--fg-quaternary)]'}
                  `}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Results List */}
            <div className="max-h-[300px] overflow-y-auto">
              {filteredResults.length > 0 ? (
                <div className="py-2">
                  {filteredResults.map((result) => (
                    <button
                      key={result.id}
                      className="
                        w-full flex items-center gap-3
                        px-4 py-2.5
                        text-left
                        hover:bg-[var(--bg-tertiary)]
                        transition-colors
                      "
                    >
                      {/* Avatar/Icon */}
                      {result.type === 'user' ? (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-aperol)] to-[var(--color-aperol-dark)] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-medium">{result.avatar}</span>
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] flex items-center justify-center flex-shrink-0">
                          {result.icon && <result.icon className="w-4 h-4 text-[var(--fg-tertiary)]" />}
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[var(--fg-primary)] truncate">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="flex items-center gap-1.5 text-xs text-[var(--fg-tertiary)]">
                            {result.type === 'user' ? (
                              <span>{result.subtitle}</span>
                            ) : (
                              <>
                                <span>{result.subtitle}</span>
                                {result.metadata && (
                                  <>
                                    <span>›</span>
                                    <span className="text-[var(--fg-quaternary)]">{result.metadata}</span>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-[var(--fg-tertiary)]">No results found</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t border-[var(--border-secondary)]">
              <button
                className="
                  w-full flex items-center gap-2.5
                  px-4 py-2.5
                  text-sm text-[var(--fg-secondary)]
                  hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]
                  transition-colors
                "
              >
                <Plus className="w-4 h-4" />
                <span>Create new project</span>
                <span className="ml-auto text-xs text-[var(--fg-quaternary)]">⌘N</span>
              </button>
              <button
                className="
                  w-full flex items-center gap-2.5
                  px-4 py-2.5
                  text-sm text-[var(--fg-secondary)]
                  hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]
                  transition-colors
                "
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite members</span>
                <span className="ml-auto text-xs text-[var(--fg-quaternary)]">⌘I</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

