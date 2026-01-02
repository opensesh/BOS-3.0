'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { getAllComponents, ComponentDoc, getApplicationPages, componentRegistry } from '@/lib/component-registry';
import { 
  Search, 
  ChevronDown, 
  ChevronRight,
  // Component type icons
  Loader2,
  Square,
  Layers,
  ToggleLeft,
  Palette,
  Type,
  Image,
  MessageSquare,
  Link2,
  Upload,
  Share2,
  Bookmark,
  Grid3X3,
  Fingerprint,
  BarChart3,
  Building2,
  FolderOpen,
  ListChecks,
  SlidersHorizontal,
  X,
  Lightbulb,
  Cloud,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ComponentsListProps {
  onSelectComponent: (componentId: string) => void;
  onClose: () => void;
}

// Smart icon mapping based on component name/type
const getComponentIcon = (component: ComponentDoc) => {
  const name = component.name.toLowerCase();
  const id = component.id.toLowerCase();
  
  // Loading/Animation components
  if (name.includes('loader') || name.includes('loading')) return Loader2;
  if (name.includes('typewriter') || name.includes('text')) return Type;
  
  // UI Controls
  if (name.includes('button')) return Square;
  if (name.includes('modal') || name.includes('dialog')) return Layers;
  if (name.includes('toggle') || name.includes('switch')) return ToggleLeft;
  if (name.includes('tab') || name.includes('selector')) return SlidersHorizontal;
  
  // Visual/Brand
  if (name.includes('color') || name.includes('swatch') || name.includes('palette')) return Palette;
  if (name.includes('brand') || name.includes('logo') || name.includes('mark')) return Fingerprint;
  if (name.includes('gradient') || name.includes('background')) return Image;
  if (name.includes('card') && name.includes('flip')) return Layers;
  
  // Chat components
  if (name.includes('chat') || name.includes('message') || name.includes('response')) return MessageSquare;
  if (name.includes('citation') || name.includes('source')) return Bookmark;
  if (name.includes('question') || name.includes('related')) return MessageSquare;
  if (name.includes('action') || name.includes('menu') || name.includes('overflow')) return ListChecks;
  if (name.includes('link') || id.includes('link')) return Link2;
  if (name.includes('image') && name.includes('view')) return Grid3X3;
  if (name.includes('attachment') || name.includes('upload')) return Upload;
  if (name.includes('share')) return Share2;
  if (name.includes('shortcut')) return Bookmark;
  if (name.includes('drawer')) return Layers;
  if (name.includes('input') || name.includes('follow')) return MessageSquare;
  if (name.includes('header')) return Layers;
  if (name.includes('popover')) return MessageSquare;
  
  // Discover/News
  if (name.includes('news') || name.includes('article')) return Grid3X3;
  if (name.includes('idea')) return Lightbulb;
  if (name.includes('market') || name.includes('stock') || name.includes('widget')) return BarChart3;
  if (name.includes('weather')) return Cloud;
  
  // Finance
  if (name.includes('stats') || name.includes('chart')) return BarChart3;
  if (name.includes('profile') || name.includes('company')) return Building2;
  
  // Spaces
  if (name.includes('space') && name.includes('card')) return FolderOpen;
  if (name.includes('resource')) return ListChecks;
  
  // Default fallback
  return Layers;
};

// Get icon color - standardized with brand accent on hover (handled via group-hover)
const getIconColor = () => {
  return 'text-[var(--fg-secondary)] group-hover:text-[var(--fg-brand-primary)] transition-colors';
};

export function ComponentsList({ onSelectComponent, onClose }: ComponentsListProps) {
  const allComponents = getAllComponents();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['design-system', ...getApplicationPages()]));
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Group by category and page
  const designSystemComponents = allComponents.filter(c => c.category === 'design-system');
  const applicationPages = getApplicationPages();

  // Filter components based on search
  const filterComponents = (components: ComponentDoc[]) => {
    if (!searchQuery.trim()) return components;
    const query = searchQuery.toLowerCase();
    return components.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query)
    );
  };

  // Autocomplete suggestions
  const autocompleteSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return allComponents
      .filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query)
      )
      .slice(0, 6); // Limit to 6 suggestions
  }, [searchQuery, allComponents]);

  // Handle click outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        autocompleteRef.current && 
        !autocompleteRef.current.contains(e.target as Node) &&
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation in autocomplete
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showAutocomplete || autocompleteSuggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedAutocompleteIndex(prev => 
        prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedAutocompleteIndex(prev => 
        prev > 0 ? prev - 1 : autocompleteSuggestions.length - 1
      );
    } else if (e.key === 'Enter' && autocompleteSuggestions[selectedAutocompleteIndex]) {
      e.preventDefault();
      handleSelectSuggestion(autocompleteSuggestions[selectedAutocompleteIndex]);
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
    }
  };

  const handleSelectSuggestion = (component: ComponentDoc) => {
    setSearchQuery(component.name);
    setShowAutocomplete(false);
    onSelectComponent(component.id);
  };

  const handleSelect = (componentId: string) => {
    onSelectComponent(componentId);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const ComponentRow = ({ component }: { component: ComponentDoc }) => {
    const IconComponent = getComponentIcon(component);
    const variantCount = component.variants?.length || 0;
    const controlCount = component.controls?.length || 0;
    
    return (
      <motion.button
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
        onClick={() => handleSelect(component.id)}
        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors text-left border-b border-[var(--border-primary)]/30 last:border-b-0 group"
      >
        {/* Icon with default, brand on hover */}
        <div className={cn(
          "p-2 rounded-lg transition-colors",
          "bg-[var(--bg-tertiary)]/50 group-hover:bg-[var(--bg-tertiary)] border border-[var(--border-primary)]/50"
        )}>
          <IconComponent className={cn("w-4 h-4", getIconColor())} />
        </div>

        {/* Name & Description */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-[var(--fg-primary)] truncate group-hover:text-[var(--fg-brand-primary)] transition-colors">
            {component.name}
          </h3>
          <p className="text-xs text-[var(--fg-secondary)] truncate">
            {component.description}
          </p>
        </div>

        {/* Variants count */}
        {variantCount > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)]/30">
            <span className="text-xs text-[var(--fg-secondary)]">
              {variantCount} variant{variantCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Props/Controls count */}
        {controlCount > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)]/30">
            <SlidersHorizontal className="w-3 h-3 text-[var(--fg-secondary)]" />
            <span className="text-xs text-[var(--fg-secondary)]">
              {controlCount} prop{controlCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Arrow indicator on hover */}
        <ChevronRight className="w-4 h-4 text-[var(--fg-secondary)] opacity-0 group-hover:opacity-100 group-hover:text-[var(--fg-brand-primary)] transition-all" />
      </motion.button>
    );
  };

  const SectionHeader = ({ 
    title, 
    count, 
    sectionId,
  }: { 
    title: string; 
    count: number; 
    sectionId: string;
  }) => {
    const isExpanded = expandedSections.has(sectionId);
    
    return (
      <button
        onClick={() => toggleSection(sectionId)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)]/30 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-[var(--fg-secondary)] group-hover:text-[var(--fg-brand-primary)] transition-colors" />
          </motion.div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)] transition-colors">
            {title}
          </h2>
        </div>
        <span className="text-xs text-[var(--fg-secondary)] px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)]/50">
          {count} component{count !== 1 ? 's' : ''}
        </span>
      </button>
    );
  };

  const filteredDesignSystem = filterComponents(designSystemComponents);

  // Check if we have any results
  const hasResults = searchQuery.trim() 
    ? allComponents.some(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : true;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-secondary)] pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowAutocomplete(true);
              setSelectedAutocompleteIndex(0);
            }}
            onFocus={() => setShowAutocomplete(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search components..."
            className={cn(
              "w-full pl-11 pr-10 py-3 rounded-xl",
              "bg-[var(--bg-secondary)] border border-[var(--border-primary)]",
              "text-sm text-[var(--fg-primary)] placeholder:text-[var(--fg-placeholder)]",
              "focus:outline-none focus:border-[var(--border-brand)]/50 focus:ring-1 focus:ring-[var(--border-brand)]/20",
              "transition-colors"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowAutocomplete(false);
                searchRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <X className="w-4 h-4 text-[var(--fg-secondary)]" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        <AnimatePresence>
          {showAutocomplete && autocompleteSuggestions.length > 0 && (
            <motion.div
              ref={autocompleteRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl shadow-xl overflow-hidden z-50"
            >
              {autocompleteSuggestions.map((component, index) => {
                const IconComponent = getComponentIcon(component);
                
                return (
                  <button
                    key={component.id}
                    onClick={() => handleSelectSuggestion(component)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group/item",
                      index === selectedAutocompleteIndex 
                        ? "bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]" 
                        : "hover:bg-[var(--bg-tertiary)] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]"
                    )}
                  >
                    <IconComponent className={cn(
                      "w-4 h-4 transition-colors",
                      index === selectedAutocompleteIndex 
                        ? "text-[var(--fg-brand-primary)]" 
                        : "text-[var(--fg-secondary)] group-hover/item:text-[var(--fg-brand-primary)]"
                    )} />
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "text-sm font-medium",
                        index === selectedAutocompleteIndex ? "text-[var(--fg-primary)]" : ""
                      )}>{component.name}</span>
                      <span className="text-xs text-[var(--fg-secondary)] ml-2">
                        {component.category === 'design-system' ? 'Design System' : component.page}
                      </span>
                    </div>
                    <ChevronRight className={cn(
                      "w-3 h-3 transition-colors",
                      index === selectedAutocompleteIndex 
                        ? "text-[var(--fg-brand-primary)]" 
                        : "text-[var(--fg-secondary)] group-hover/item:text-[var(--fg-brand-primary)]"
                    )} />
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* No Results State */}
      {!hasResults && (
        <div className="text-center py-12 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
          <Search className="w-10 h-10 text-[var(--fg-secondary)] mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-medium text-[var(--fg-primary)] mb-1">No components found</h3>
          <p className="text-sm text-[var(--fg-secondary)]">
            Try a different search term
          </p>
        </div>
      )}

      {/* Design System Section */}
      {(filteredDesignSystem.length > 0 || !searchQuery) && (
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] overflow-hidden">
          <SectionHeader 
            title="Design System" 
            count={filteredDesignSystem.length}
            sectionId="design-system"
          />
          <AnimatePresence>
            {expandedSections.has('design-system') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {filteredDesignSystem.length > 0 ? (
                  filteredDesignSystem.map(component => (
                    <ComponentRow key={component.id} component={component} />
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-[var(--fg-secondary)] text-sm">
                    No design system components match your search
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Application Sections - Grouped by Page */}
      {applicationPages.map(page => {
        const pageComponents = filterComponents(
          componentRegistry.application[page] || []
        );
        
        // Skip empty sections when searching
        if (searchQuery && pageComponents.length === 0) return null;

        return (
          <div key={page} className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] overflow-hidden">
            <SectionHeader 
              title={page} 
              count={pageComponents.length}
              sectionId={page}
            />
            <AnimatePresence>
              {expandedSections.has(page) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {pageComponents.length > 0 ? (
                    pageComponents.map(component => (
                      <ComponentRow key={component.id} component={component} />
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-[var(--fg-secondary)] text-sm">
                      No {page.toLowerCase()} components match your search
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Empty State - No Components Registered */}
      {allComponents.length === 0 && (
        <div className="text-center py-12 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
          <Layers className="w-12 h-12 text-[var(--fg-secondary)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--fg-primary)] mb-2">No Components</h3>
          <p className="text-[var(--fg-secondary)]">
            No components have been registered yet.
          </p>
        </div>
      )}
    </div>
  );
}
