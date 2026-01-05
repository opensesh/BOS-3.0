'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  MessageSquare,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Plus,
  MoreHorizontal,
  Trash2,
  Layers,
  FolderPlus,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { useChatContext } from '@/lib/chat-context';
import { useBreadcrumbs } from '@/lib/breadcrumb-context';
import { DateFilterDropdown, type DateFilterValue } from '@/components/chat/DateFilterDropdown';
import { CategoryFilterDropdown, type CategoryFilterValue } from '@/components/chat/CategoryFilterDropdown';
import { ChatsPagination } from '@/components/chat/ChatsPagination';
import { AddToSpaceModal } from '@/components/chat/AddToSpaceModal';
import { AddToProjectModal } from '@/components/chat/AddToProjectModal';

type SortField = 'title' | 'date';
type SortDirection = 'asc' | 'desc';

// Chat row menu component
function ChatRowMenu({
  chatId,
  chatTitle,
  onDelete,
  onAddToSpace,
  onAddToProject,
}: {
  chatId: string;
  chatTitle: string;
  onDelete: () => void;
  onAddToSpace: () => void;
  onAddToProject: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--bg-quaternary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]"
        title="More options"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] shadow-[var(--shadow-lg)] overflow-hidden min-w-[160px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onAddToProject();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Add to Project</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onAddToSpace();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <Layers className="w-4 h-4" />
            <span>Add to Space</span>
          </button>
          <div className="border-t border-[var(--border-primary)] my-1" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function ChatsPage() {
  const router = useRouter();
  const { 
    chatHistory, 
    loadSession, 
    triggerChatReset, 
    deleteFromHistory,
    // Projects
    projects,
    currentProject,
    setCurrentProject,
    createProject,
    assignChatToProject,
  } = useChatContext();
  const { setBreadcrumbs } = useBreadcrumbs();
  
  // Modal states
  const [spaceModalChatId, setSpaceModalChatId] = useState<string | null>(null);
  const [spaceModalChatTitle, setSpaceModalChatTitle] = useState<string>('');
  const [projectModalChatId, setProjectModalChatId] = useState<string | null>(null);
  const [projectModalChatTitle, setProjectModalChatTitle] = useState<string>('');
  
  // Set breadcrumbs on mount
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', href: '/' },
      { label: 'Chats' },
    ]);
  }, [setBreadcrumbs]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({ type: 'preset', preset: 'all' });
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterValue>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Helper to safely get timestamp as Date
  const getTimestamp = (timestamp: Date | number | string): Date => {
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp);
  };

  // Filter and sort chats
  const filteredChats = useMemo(() => {
    let result = [...chatHistory];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(chat => 
        chat.title.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(chat => {
        // For now, we'll categorize based on chat metadata
        // In a real implementation, you'd check chat.spaceId, chat.projectId, etc.
        if (categoryFilter === 'personal') {
          return !(chat as any).spaceId && !(chat as any).projectId;
        } else if (categoryFilter === 'spaces') {
          return !!(chat as any).spaceId;
        } else if (categoryFilter === 'projects') {
          return !!(chat as any).projectId;
        }
        return true;
      });
    }

    // Apply date filter
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (dateFilter.type === 'preset') {
      if (dateFilter.preset === 'today') {
        result = result.filter(chat => {
          const chatDate = getTimestamp(chat.timestamp);
          return chatDate >= todayStart;
        });
      } else if (dateFilter.preset === 'week') {
        result = result.filter(chat => {
          const chatDate = getTimestamp(chat.timestamp);
          return chatDate >= weekAgo;
        });
      } else if (dateFilter.preset === 'month') {
        result = result.filter(chat => {
          const chatDate = getTimestamp(chat.timestamp);
          return chatDate >= monthAgo;
        });
      }
      // 'all' doesn't filter
    } else if (dateFilter.type === 'custom') {
      const startOfDay = new Date(dateFilter.startDate.getFullYear(), dateFilter.startDate.getMonth(), dateFilter.startDate.getDate());
      const endOfDay = new Date(dateFilter.endDate.getFullYear(), dateFilter.endDate.getMonth(), dateFilter.endDate.getDate(), 23, 59, 59, 999);
      
      result = result.filter(chat => {
        const chatDate = getTimestamp(chat.timestamp);
        return chatDate >= startOfDay && chatDate <= endOfDay;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortField === 'title') {
        const comparison = a.title.localeCompare(b.title);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        const comparison = getTimestamp(a.timestamp).getTime() - getTimestamp(b.timestamp).getTime();
        return sortDirection === 'asc' ? comparison : -comparison;
      }
    });

    return result;
  }, [chatHistory, searchQuery, categoryFilter, sortField, sortDirection, dateFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleChatClick = (chatId: string) => {
    loadSession(chatId);
    router.push('/');
  };

  const handleNewChat = () => {
    triggerChatReset();
    router.push('/');
  };

  const formatDate = (timestamp: Date | number | string) => {
    const date = getTimestamp(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const chatDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (chatDate.getTime() === today.getTime()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (chatDate.getTime() === yesterday.getTime()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredChats.length / rowsPerPage);
  const paginatedChats = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredChats.slice(startIndex, endIndex);
  }, [filteredChats, currentPage, rowsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, dateFilter, rowsPerPage]);

  // Check if any filter is active
  const hasActiveFilter = 
    dateFilter.type === 'custom' || 
    (dateFilter.type === 'preset' && dateFilter.preset !== 'all') ||
    categoryFilter !== 'all';

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <MainContent className="overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-6xl mx-auto px-6 py-8 md:px-12 md:py-12">
              {/* Page Title */}
              <div className="flex flex-col gap-3 mb-10">
                <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--fg-primary)]">
                  Chats
                </h1>
                <p className="text-base md:text-lg text-[var(--fg-secondary)] max-w-2xl">
                  {filteredChats.length} conversation{filteredChats.length !== 1 ? 's' : ''} • Browse and continue your past conversations.
                </p>
              </div>

              {/* Search and Filter Row */}
              <div className="flex items-center gap-4 mb-6">
                {/* Search - takes most width */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-quaternary)]" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="
                      w-full pl-10 pr-4 py-2.5
                      bg-[var(--bg-secondary)]
                      border border-[var(--border-secondary)]
                      rounded-lg
                      text-sm text-[var(--fg-primary)]
                      placeholder:text-[var(--fg-quaternary)]
                      focus:outline-none focus:ring-2 focus:ring-[var(--fg-brand-primary)]/20 focus:border-[var(--fg-brand-primary)]
                      transition-all
                    "
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-quaternary)] hover:text-[var(--fg-primary)]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                {/* Category Filter */}
                <CategoryFilterDropdown
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                />
                
                {/* Date Filter */}
                <DateFilterDropdown
                  value={dateFilter}
                  onChange={setDateFilter}
                />
              </div>

              {/* Results */}
              {filteredChats.length > 0 ? (
                <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-secondary)] overflow-hidden">
                  {/* Table Header */}
                  <div className="flex items-center px-4 py-3 border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/50">
                    <button
                      onClick={() => handleSort('title')}
                      className="flex-1 flex items-center gap-2 text-xs font-medium text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                    >
                      <span>Conversation</span>
                      {sortField === 'title' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                      {sortField !== 'title' && <ArrowUpDown className="w-3 h-3 opacity-40" />}
                    </button>
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-2 text-xs font-medium text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors w-32 justify-end"
                    >
                      <span>Date</span>
                      {sortField === 'date' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                      {sortField !== 'date' && <ArrowUpDown className="w-3 h-3 opacity-40" />}
                    </button>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-[var(--border-secondary)]">
                    {paginatedChats.map((chat, index) => (
                      <motion.div
                        key={chat.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: index * 0.02 }}
                        className="relative group"
                      >
                        <button
                          onClick={() => handleChatClick(chat.id)}
                          className="
                            w-full flex items-center px-4 py-3.5
                            text-left
                            hover:bg-[var(--bg-tertiary)]
                            active:bg-[var(--bg-quaternary)]
                            transition-colors
                          "
                        >
                          <div className="flex-1 flex items-center gap-3 min-w-0">
                            <div className="
                              w-8 h-8 rounded-lg
                              bg-[var(--bg-tertiary)]
                              group-hover:bg-[var(--bg-quaternary)]
                              flex items-center justify-center
                              flex-shrink-0
                              transition-colors
                            ">
                              <MessageSquare className="w-4 h-4 text-[var(--fg-tertiary)]" />
                            </div>
                            <span className="text-sm text-[var(--fg-primary)] truncate pr-8">
                              {chat.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-[var(--fg-tertiary)] flex-shrink-0 pr-8 whitespace-nowrap">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(chat.timestamp)}</span>
                          </div>
                        </button>
                        {/* Three-dot menu */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <ChatRowMenu
                            chatId={chat.id}
                            chatTitle={chat.title}
                            onDelete={() => deleteFromHistory(chat.id)}
                            onAddToSpace={() => {
                              setSpaceModalChatId(chat.id);
                              setSpaceModalChatTitle(chat.title);
                            }}
                            onAddToProject={() => {
                              setProjectModalChatId(chat.id);
                              setProjectModalChatTitle(chat.title);
                            }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination Footer */}
                  <ChatsPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    rowsPerPage={rowsPerPage}
                    totalItems={filteredChats.length}
                    onPageChange={setCurrentPage}
                    onRowsPerPageChange={setRowsPerPage}
                  />
                </div>
              ) : (
                // Empty State
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="
                    w-16 h-16 mb-4
                    rounded-full
                    bg-[var(--bg-secondary)]
                    border border-[var(--border-secondary)]
                    flex items-center justify-center
                  ">
                    <MessageSquare className="w-7 h-7 text-[var(--fg-quaternary)]" />
                  </div>
                  {searchQuery || hasActiveFilter ? (
                    <>
                      <h3 className="text-lg font-semibold text-[var(--fg-primary)] mb-1">
                        No results found
                      </h3>
                      <p className="text-sm text-[var(--fg-tertiary)] text-center max-w-[280px] mb-4">
                        Try adjusting your search or filter to find what you're looking for.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setDateFilter({ type: 'preset', preset: 'all' });
                          setCategoryFilter('all');
                        }}
                        className="text-sm text-[var(--fg-brand-primary)] hover:underline"
                      >
                        Clear filters
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-[var(--fg-primary)] mb-1">
                        No conversations yet
                      </h3>
                      <p className="text-sm text-[var(--fg-tertiary)] text-center max-w-[280px] mb-4">
                        Start a new chat to begin your conversation history.
                      </p>
                      <button
                        onClick={handleNewChat}
                        className="
                          flex items-center gap-2
                          px-4 py-2
                          bg-[var(--fg-brand-primary)] hover:bg-[var(--fg-brand-secondary)]
                          text-white
                          rounded-lg font-medium text-sm
                          transition-colors
                        "
                      >
                        <Plus className="w-4 h-4" />
                        <span>Start a conversation</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </MainContent>

      {/* Add to Space Modal */}
      <AddToSpaceModal
        isOpen={!!spaceModalChatId}
        onClose={() => {
          setSpaceModalChatId(null);
          setSpaceModalChatTitle('');
        }}
        chatId={spaceModalChatId || ''}
        chatTitle={spaceModalChatTitle}
      />

      {/* Add to Project Modal */}
      <AddToProjectModal
        isOpen={!!projectModalChatId}
        onClose={() => {
          setProjectModalChatId(null);
          setProjectModalChatTitle('');
        }}
        projects={projects}
        currentProject={currentProject}
        chatId={projectModalChatId}
        onSelectProject={setCurrentProject}
        onAssignChatToProject={async (chatId, projectId) => {
          await assignChatToProject(chatId, projectId);
          return true;
        }}
        onCreateProject={async (name) => {
          await createProject(name);
        }}
      />
    </div>
  );
}
