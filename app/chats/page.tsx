'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  ArrowLeft,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { useChatContext } from '@/lib/chat-context';
import { useBreadcrumbs } from '@/lib/breadcrumb-context';
import { DateFilterDropdown, type DateFilterValue } from '@/components/chat/DateFilterDropdown';

type SortField = 'title' | 'date';
type SortDirection = 'asc' | 'desc';

// Header component similar to ChatHeader
function ChatsPageHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="sticky top-0 z-30 bg-[var(--bg-primary)] border-b border-[var(--border-secondary)]">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center h-12">
          {/* Left side - Back button and title */}
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1 -ml-1 rounded-md text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              title="Back to home"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-medium text-[var(--fg-primary)]">Recent Chats</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatsPage() {
  const router = useRouter();
  const { chatHistory, loadSession, triggerChatReset } = useChatContext();
  const { setBreadcrumbs } = useBreadcrumbs();
  
  // Set breadcrumbs on mount
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', href: '/' },
      { label: 'Recent Chats' },
    ]);
  }, [setBreadcrumbs]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({ type: 'preset', preset: 'all' });

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
  }, [chatHistory, searchQuery, sortField, sortDirection, dateFilter]);

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

  const handleBack = () => {
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

  // Check if any filter is active
  const hasActiveFilter = dateFilter.type === 'custom' || (dateFilter.type === 'preset' && dateFilter.preset !== 'all');

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <MainContent className="overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Chat-style Header */}
          <ChatsPageHeader onBack={handleBack} />

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto px-4 py-6 lg:py-8">
              {/* Page Description and Date Filter - Same Row */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[var(--fg-tertiary)]">
                  {chatHistory.length} conversation{chatHistory.length !== 1 ? 's' : ''}
                </p>
                <DateFilterDropdown
                  value={dateFilter}
                  onChange={setDateFilter}
                />
              </div>

              {/* Search */}
              <div className="relative mb-6">
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
                    {filteredChats.map((chat, index) => (
                      <motion.button
                        key={chat.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: index * 0.02 }}
                        onClick={() => handleChatClick(chat.id)}
                        className="
                          w-full flex items-center px-4 py-3.5
                          text-left
                          hover:bg-[var(--bg-tertiary)]
                          active:bg-[var(--bg-quaternary)]
                          transition-colors
                          group
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
                          <span className="text-sm text-[var(--fg-primary)] truncate">
                            {chat.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--fg-tertiary)] w-32 justify-end flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(chat.timestamp)}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
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
    </div>
  );
}
