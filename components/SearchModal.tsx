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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ResultType = 'page' | 'action' | 'docs';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle?: string;
  href: string;
  icon: typeof Home;
  keywords?: string[];
}

// Navigation pages and subpages
const navigationResults: SearchResult[] = [
  // Main pages
  { id: 'home', type: 'page', title: 'Home', subtitle: 'Go to homepage', href: '/', icon: Home, keywords: ['start', 'main', 'chat'] },
  { id: 'brand-hub', type: 'page', title: 'Brand Hub', subtitle: 'Brand assets and guidelines', href: '/brand-hub', icon: ScanFace, keywords: ['brand', 'assets', 'identity'] },
  { id: 'brain', type: 'page', title: 'Brain', subtitle: 'AI knowledge and training', href: '/brain', icon: BrainCog, keywords: ['ai', 'knowledge', 'training', 'learning'] },
  { id: 'spaces', type: 'page', title: 'Spaces', subtitle: 'Collaborative workspaces', href: '/spaces', icon: LayoutGrid, keywords: ['workspace', 'collaborate', 'projects'] },
  
  // Brand Hub subpages
  { id: 'logo', type: 'page', title: 'Logo', subtitle: 'Brand Hub › Logo assets', href: '/brand-hub/logo', icon: ScanFace, keywords: ['logo', 'mark', 'icon', 'symbol'] },
  { id: 'colors', type: 'page', title: 'Colors', subtitle: 'Brand Hub › Color palette', href: '/brand-hub/colors', icon: Palette, keywords: ['color', 'palette', 'scheme', 'hex', 'rgb'] },
  { id: 'fonts', type: 'page', title: 'Typography', subtitle: 'Brand Hub › Fonts and type', href: '/brand-hub/fonts', icon: Type, keywords: ['font', 'typography', 'text', 'typeface'] },
  { id: 'art-direction', type: 'page', title: 'Art Direction', subtitle: 'Brand Hub › Visual style', href: '/brand-hub/art-direction', icon: Image, keywords: ['art', 'direction', 'visual', 'style', 'photography'] },
  { id: 'design-tokens', type: 'page', title: 'Design Tokens', subtitle: 'Brand Hub › Token system', href: '/brand-hub/design-tokens', icon: Layers, keywords: ['tokens', 'design', 'system', 'variables'] },
  { id: 'guidelines', type: 'page', title: 'Guidelines', subtitle: 'Brand Hub › Usage guidelines', href: '/brand-hub/guidelines', icon: FileText, keywords: ['guidelines', 'rules', 'usage', 'standards'] },
  
  // Brain subpages
  { id: 'architecture', type: 'page', title: 'Architecture', subtitle: 'Brain › System architecture', href: '/brain/architecture', icon: Building, keywords: ['architecture', 'structure', 'system'] },
  { id: 'brand-identity', type: 'page', title: 'Brand Identity', subtitle: 'Brain › Brand knowledge', href: '/brain/brand-identity', icon: ScanFace, keywords: ['identity', 'brand', 'personality'] },
  { id: 'components', type: 'page', title: 'Components', subtitle: 'Brain › UI components', href: '/brain/components', icon: Boxes, keywords: ['components', 'ui', 'elements'] },
  { id: 'skills', type: 'page', title: 'Skills', subtitle: 'Brain › AI capabilities', href: '/brain/skills', icon: Lightbulb, keywords: ['skills', 'capabilities', 'abilities'] },
  { id: 'writing-styles', type: 'page', title: 'Writing Styles', subtitle: 'Brain › Content tone', href: '/brain/writing-styles', icon: Pencil, keywords: ['writing', 'style', 'tone', 'voice', 'content'] },
];

// Quick actions
const actionResults: SearchResult[] = [
  { id: 'new-chat', type: 'action', title: 'New Chat', subtitle: 'Start a new conversation', href: '/', icon: Home, keywords: ['new', 'chat', 'conversation'] },
];

// Documentation
const docsResults: SearchResult[] = [
  { id: 'docs', type: 'docs', title: 'Documentation', subtitle: 'Read the docs', href: '#', icon: BookOpen, keywords: ['docs', 'documentation', 'help'] },
];

const allResults = [...navigationResults, ...actionResults, ...docsResults];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

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
    }
  }, [isOpen]);

  // Filter results based on search query
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show all pages when no query
      return navigationResults;
    }
    
    const query = searchQuery.toLowerCase();
    return allResults.filter((result) => {
      const matchesTitle = result.title.toLowerCase().includes(query);
      const matchesSubtitle = result.subtitle?.toLowerCase().includes(query);
      const matchesKeywords = result.keywords?.some(k => k.includes(query));
      return matchesTitle || matchesSubtitle || matchesKeywords;
    });
  }, [searchQuery]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const pages = filteredResults.filter(r => r.type === 'page');
    const actions = filteredResults.filter(r => r.type === 'action');
    const docs = filteredResults.filter(r => r.type === 'docs');
    return { pages, actions, docs };
  }, [filteredResults]);

  // Handle navigation
  const handleSelect = useCallback((result: SearchResult) => {
    onClose();
    if (result.href !== '#') {
      router.push(result.href);
    }
  }, [onClose, router]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredResults.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredResults.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          handleSelect(filteredResults[selectedIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filteredResults, selectedIndex, handleSelect]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

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

          {/* Modal - centered using flex */}
          <div className="fixed inset-0 z-[201] flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="
                w-full max-w-lg
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
                  placeholder="Run a command or search..."
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
              <div className="max-h-[60vh] overflow-y-auto">
                {filteredResults.length > 0 ? (
                  <div className="py-2">
                    {/* Pages Section */}
                    {groupedResults.pages.length > 0 && (
                      <div>
                        <div className="px-4 py-1.5">
                          <span className="text-[10px] font-medium text-[var(--fg-quaternary)] uppercase tracking-wider">
                            Pages
                          </span>
                        </div>
                        {groupedResults.pages.map((result, index) => {
                          const globalIndex = index;
                          const Icon = result.icon;
                          const isSelected = selectedIndex === globalIndex;
                          
                          return (
                            <button
                              key={result.id}
                              onClick={() => handleSelect(result)}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              className={`
                                w-full flex items-center gap-3
                                px-4 py-2
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
                                <ArrowRight className="w-4 h-4 text-[var(--fg-tertiary)]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Actions Section */}
                    {groupedResults.actions.length > 0 && (
                      <div>
                        <div className="px-4 py-1.5 mt-2">
                          <span className="text-[10px] font-medium text-[var(--fg-quaternary)] uppercase tracking-wider">
                            Actions
                          </span>
                        </div>
                        {groupedResults.actions.map((result, index) => {
                          const globalIndex = groupedResults.pages.length + index;
                          const Icon = result.icon;
                          const isSelected = selectedIndex === globalIndex;
                          
                          return (
                            <button
                              key={result.id}
                              onClick={() => handleSelect(result)}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              className={`
                                w-full flex items-center gap-3
                                px-4 py-2
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
                                <ArrowRight className="w-4 h-4 text-[var(--fg-tertiary)]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Search className="w-8 h-8 text-[var(--fg-quaternary)] mx-auto mb-3" />
                    <p className="text-sm text-[var(--fg-tertiary)]">No results found</p>
                    <p className="text-xs text-[var(--fg-quaternary)] mt-1">Try a different search term</p>
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
