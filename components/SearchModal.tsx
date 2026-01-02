'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  X, 
  Home, 
  ScanFace, 
  BrainCog, 
  LayoutGrid,
  Palette,
  Type,
  Image,
  Layers,
  FileText,
  BookOpen,
  Lightbulb,
  Pencil,
  Boxes,
  Building,
  ArrowRight,
  Command,
  MessageSquare,
  MessageSquarePlus,
  ImageIcon,
  Sparkles,
  Lock,
  Globe,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  useGlobalSearch, 
  groupResultsByType,
  type SearchResult,
  type PageResult,
  type ChatResult,
  type AssetResult,
  type SpaceResult,
} from '@/hooks/useGlobalSearch';
import { useChatContext } from '@/lib/chat-context';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Icon mapping for dynamic icon rendering
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  ScanFace,
  BrainCog,
  LayoutGrid,
  Palette,
  Type,
  Image,
  Layers,
  FileText,
  BookOpen,
  Lightbulb,
  Pencil,
  Boxes,
  Building,
  MessageSquare,
  MessageSquarePlus,
  ImageIcon,
  Sparkles,
};

function getIcon(iconName: string) {
  return iconMap[iconName] || Home;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const { loadSession } = useChatContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const { results, isLoading, search, clearResults } = useGlobalSearch({
    debounceMs: 100,
    maxResults: 30,
  });

  // Group results by type for display
  const groupedResults = useMemo(() => groupResultsByType(results), [results]);

  // Flatten results for keyboard navigation
  const flatResults = useMemo(() => {
    const flat: SearchResult[] = [];
    
    // Order: Pages, Actions, Recent Chats, Logos, Images, Spaces
    flat.push(...groupedResults.pages);
    flat.push(...groupedResults.actions);
    flat.push(...groupedResults.chats);
    flat.push(...groupedResults.logos);
    flat.push(...groupedResults.images);
    flat.push(...groupedResults.illustrations);
    flat.push(...groupedResults.spaces);
    
    return flat;
  }, [groupedResults]);

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

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
      setSelectedIndex(0);
      clearResults();
    }
  }, [isOpen, clearResults]);

  // Trigger search when query changes
  useEffect(() => {
    search(searchQuery);
  }, [searchQuery, search]);

  // Handle navigation
  const handleSelect = useCallback((result: SearchResult) => {
    onClose();
    
    // Handle different result types
    if (result.type === 'logo' || result.type === 'image' || result.type === 'illustration') {
      // For assets, navigate to the brand hub page
      const assetResult = result as AssetResult;
      if (assetResult.assetCategory === 'logos') {
        router.push('/brand-hub/logo');
      } else if (assetResult.assetCategory === 'images' || assetResult.assetCategory === 'illustrations') {
        router.push('/brand-hub/art-direction');
      } else {
        // Fallback: open in new tab for download
        window.open(result.href, '_blank');
      }
    } else if (result.type === 'chat') {
      // Load the chat session via context and navigate to home
      const chatResult = result as ChatResult;
      loadSession(chatResult.href); // href contains the chat ID
      router.push('/');
    } else {
      router.push(result.href);
    }
  }, [onClose, router, loadSession]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < flatResults.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : flatResults.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatResults[selectedIndex]) {
          handleSelect(flatResults[selectedIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, flatResults, selectedIndex, handleSelect]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Calculate global index for a result
  const getGlobalIndex = (result: SearchResult): number => {
    return flatResults.findIndex(r => r.id === result.id);
  };

  // Render individual result item based on type
  const renderResultItem = (result: SearchResult, isSelected: boolean) => {
    const globalIndex = getGlobalIndex(result);
    
    switch (result.type) {
      case 'page':
      case 'action':
        return renderPageResult(result as PageResult, isSelected, globalIndex);
      case 'chat':
        return renderChatResult(result as ChatResult, isSelected, globalIndex);
      case 'logo':
      case 'image':
      case 'illustration':
        return renderAssetResult(result as AssetResult, isSelected, globalIndex);
      case 'space':
        return renderSpaceResult(result as SpaceResult, isSelected, globalIndex);
      default:
        return null;
    }
  };

  // Page/Action result renderer
  const renderPageResult = (result: PageResult, isSelected: boolean, globalIndex: number) => {
    const Icon = getIcon(result.icon);
    
    return (
      <button
        key={result.id}
        data-index={globalIndex}
        onClick={() => handleSelect(result)}
        onMouseEnter={() => setSelectedIndex(globalIndex)}
        className={`
          w-full flex items-center gap-3
          px-4 py-2.5
          text-left
          transition-colors
          ${isSelected ? 'bg-[var(--bg-tertiary)]' : 'hover:bg-[var(--bg-tertiary)]'}
        `}
      >
        <div className={`
          w-8 h-8 rounded-lg
          flex items-center justify-center
          flex-shrink-0
          ${isSelected 
            ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]' 
            : 'bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)]'
          }
        `}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[var(--fg-primary)] truncate">
            {result.title}
          </div>
          {result.subtitle && (
            <div className="text-xs text-[var(--fg-tertiary)] truncate">
              {result.subtitle}
            </div>
          )}
        </div>
        {isSelected && (
          <ArrowRight className="w-4 h-4 text-[var(--fg-tertiary)] flex-shrink-0" />
        )}
      </button>
    );
  };

  // Chat result renderer
  const renderChatResult = (result: ChatResult, isSelected: boolean, globalIndex: number) => {
    return (
      <button
        key={result.id}
        data-index={globalIndex}
        onClick={() => handleSelect(result)}
        onMouseEnter={() => setSelectedIndex(globalIndex)}
        className={`
          w-full flex items-center gap-3
          px-4 py-2.5
          text-left
          transition-colors
          ${isSelected ? 'bg-[var(--bg-tertiary)]' : 'hover:bg-[var(--bg-tertiary)]'}
        `}
      >
        <div className={`
          w-8 h-8 rounded-lg
          flex items-center justify-center
          flex-shrink-0
          ${isSelected 
            ? 'bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]' 
            : 'bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)]'
          }
        `}>
          <MessageSquare className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[var(--fg-primary)] truncate">
            {result.title}
          </div>
          <div className="text-xs text-[var(--fg-tertiary)] truncate flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {result.subtitle}
          </div>
        </div>
        {isSelected && (
          <ArrowRight className="w-4 h-4 text-[var(--fg-tertiary)] flex-shrink-0" />
        )}
      </button>
    );
  };

  // Asset result renderer with thumbnail
  const renderAssetResult = (result: AssetResult, isSelected: boolean, globalIndex: number) => {
    const isLogo = result.type === 'logo';
    
    return (
      <button
        key={result.id}
        data-index={globalIndex}
        onClick={() => handleSelect(result)}
        onMouseEnter={() => setSelectedIndex(globalIndex)}
        className={`
          w-full flex items-center gap-3
          px-4 py-2.5
          text-left
          transition-colors
          ${isSelected ? 'bg-[var(--bg-tertiary)]' : 'hover:bg-[var(--bg-tertiary)]'}
        `}
      >
        {/* Thumbnail container */}
        <div className={`
          w-10 h-10 rounded-lg
          flex items-center justify-center
          flex-shrink-0
          overflow-hidden
          ${isLogo 
            ? 'bg-[var(--bg-primary)] border border-[var(--border-secondary)]' 
            : 'bg-[var(--bg-tertiary)]'
          }
        `}>
          {result.thumbnailPath.endsWith('.svg') || result.thumbnailPath.endsWith('.png') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={result.thumbnailPath} 
              alt={result.title}
              className={`
                object-contain
                ${isLogo ? 'w-6 h-6' : 'w-full h-full object-cover'}
              `}
            />
          ) : (
            <ImageIcon className="w-4 h-4 text-[var(--fg-tertiary)]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[var(--fg-primary)] truncate">
            {result.title}
          </div>
          <div className="text-xs text-[var(--fg-tertiary)] truncate">
            {result.subtitle}
          </div>
        </div>
        {isSelected && (
          <ExternalLink className="w-4 h-4 text-[var(--fg-tertiary)] flex-shrink-0" />
        )}
      </button>
    );
  };

  // Space result renderer
  const renderSpaceResult = (result: SpaceResult, isSelected: boolean, globalIndex: number) => {
    return (
      <button
        key={result.id}
        data-index={globalIndex}
        onClick={() => handleSelect(result)}
        onMouseEnter={() => setSelectedIndex(globalIndex)}
        className={`
          w-full flex items-center gap-3
          px-4 py-2.5
          text-left
          transition-colors
          ${isSelected ? 'bg-[var(--bg-tertiary)]' : 'hover:bg-[var(--bg-tertiary)]'}
        `}
      >
        <div className={`
          w-8 h-8 rounded-lg
          flex items-center justify-center
          flex-shrink-0
          ${isSelected 
            ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]' 
            : 'bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)]'
          }
        `}>
          {result.icon ? (
            <span className="text-base">{result.icon}</span>
          ) : (
            <LayoutGrid className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[var(--fg-primary)] truncate flex items-center gap-1.5">
            {result.title}
            {result.isPrivate ? (
              <Lock className="w-3 h-3 text-[var(--fg-quaternary)]" />
            ) : (
              <Globe className="w-3 h-3 text-[var(--fg-quaternary)]" />
            )}
          </div>
          <div className="text-xs text-[var(--fg-tertiary)] truncate">
            {result.subtitle}
            {result.threadCount !== undefined && ` • ${result.threadCount} threads`}
          </div>
        </div>
        {isSelected && (
          <ArrowRight className="w-4 h-4 text-[var(--fg-tertiary)] flex-shrink-0" />
        )}
      </button>
    );
  };

  // Section header component
  const SectionHeader = ({ title, count }: { title: string; count?: number }) => (
    <div className="px-4 py-1.5 flex items-center justify-between">
      <span className="text-[10px] font-medium text-[var(--fg-quaternary)] uppercase tracking-wider">
        {title}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-[10px] text-[var(--fg-quaternary)]">
          {count}
        </span>
      )}
    </div>
  );

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal - centered using flex, clicking outside closes modal */}
          <div 
            className="fixed inset-0 z-[201] flex items-start justify-center pt-[12vh] px-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="
                w-full max-w-xl
                bg-[var(--bg-primary)]
                rounded-xl
                border border-[var(--border-secondary)]
                shadow-2xl
                overflow-hidden
              "
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-secondary)]">
                <Search className="w-5 h-5 text-[var(--fg-tertiary)] flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages, chats, logos, spaces..."
                  className="
                    flex-1
                    bg-transparent
                    text-[var(--fg-primary)]
                    placeholder:text-[var(--fg-tertiary)]
                    focus:outline-none
                    text-sm
                  "
                />
                <div className="flex items-center gap-1">
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-[var(--fg-quaternary)] border-t-transparent rounded-full animate-spin" />
                  )}
                  <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-[var(--fg-quaternary)] bg-[var(--bg-tertiary)] rounded border border-[var(--border-secondary)]">
                    <Command className="w-2.5 h-2.5" />K
                  </kbd>
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
              </div>

              {/* Results List */}
              <div ref={resultsRef} className="max-h-[55vh] overflow-y-auto">
                {flatResults.length > 0 ? (
                  <div className="py-2">
                    {/* Pages Section */}
                    {groupedResults.pages.length > 0 && (
                      <div>
                        <SectionHeader title="Pages" count={groupedResults.pages.length} />
                        {groupedResults.pages.map((result) => {
                          const globalIndex = getGlobalIndex(result);
                          return renderResultItem(result, selectedIndex === globalIndex);
                        })}
                      </div>
                    )}

                    {/* Actions Section */}
                    {groupedResults.actions.length > 0 && (
                      <div className="mt-2">
                        <SectionHeader title="Quick Actions" />
                        {groupedResults.actions.map((result) => {
                          const globalIndex = getGlobalIndex(result);
                          return renderResultItem(result, selectedIndex === globalIndex);
                        })}
                      </div>
                    )}

                    {/* Chats Section */}
                    {groupedResults.chats.length > 0 && (
                      <div className="mt-2">
                        <SectionHeader 
                          title={searchQuery ? "Chats" : "Recent Chats"} 
                          count={groupedResults.chats.length} 
                        />
                        {groupedResults.chats.map((result) => {
                          const globalIndex = getGlobalIndex(result);
                          return renderResultItem(result, selectedIndex === globalIndex);
                        })}
                      </div>
                    )}

                    {/* Logos Section */}
                    {groupedResults.logos.length > 0 && (
                      <div className="mt-2">
                        <SectionHeader title="Logos" count={groupedResults.logos.length} />
                        {groupedResults.logos.map((result) => {
                          const globalIndex = getGlobalIndex(result);
                          return renderResultItem(result, selectedIndex === globalIndex);
                        })}
                      </div>
                    )}

                    {/* Images Section */}
                    {groupedResults.images.length > 0 && (
                      <div className="mt-2">
                        <SectionHeader title="Images" count={groupedResults.images.length} />
                        {groupedResults.images.map((result) => {
                          const globalIndex = getGlobalIndex(result);
                          return renderResultItem(result, selectedIndex === globalIndex);
                        })}
                      </div>
                    )}

                    {/* Illustrations Section */}
                    {groupedResults.illustrations.length > 0 && (
                      <div className="mt-2">
                        <SectionHeader title="Illustrations" count={groupedResults.illustrations.length} />
                        {groupedResults.illustrations.map((result) => {
                          const globalIndex = getGlobalIndex(result);
                          return renderResultItem(result, selectedIndex === globalIndex);
                        })}
                      </div>
                    )}

                    {/* Spaces Section */}
                    {groupedResults.spaces.length > 0 && (
                      <div className="mt-2">
                        <SectionHeader title="Spaces" count={groupedResults.spaces.length} />
                        {groupedResults.spaces.map((result) => {
                          const globalIndex = getGlobalIndex(result);
                          return renderResultItem(result, selectedIndex === globalIndex);
                        })}
                      </div>
                    )}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="py-12 text-center">
                    <Search className="w-8 h-8 text-[var(--fg-quaternary)] mx-auto mb-3" />
                    <p className="text-sm text-[var(--fg-tertiary)]">No results found</p>
                    <p className="text-xs text-[var(--fg-quaternary)] mt-1">Try a different search term</p>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Sparkles className="w-8 h-8 text-[var(--fg-quaternary)] mx-auto mb-3" />
                    <p className="text-sm text-[var(--fg-tertiary)]">Start typing to search</p>
                    <p className="text-xs text-[var(--fg-quaternary)] mt-1">
                      Search pages, recent chats, logos, and more
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border-secondary)] text-[10px] text-[var(--fg-quaternary)]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-[var(--bg-tertiary)] rounded">↵</kbd>
                    to select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-[var(--bg-tertiary)] rounded">↑↓</kbd>
                    to navigate
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-[var(--bg-tertiary)] rounded">esc</kbd>
                  to close
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document body level
  if (!mounted) return null;
  
  return createPortal(modalContent, document.body);
}
