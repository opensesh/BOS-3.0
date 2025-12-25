'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Orbit } from 'lucide-react';
import { motion } from 'framer-motion';
import { suggestionsContainer, suggestionItem } from '@/lib/motion';

type Mode = 'search' | 'research';

interface SearchResearchToggleProps {
  onQueryClick?: (query: string, submit?: boolean) => void;
  onModeChange?: (showSuggestions: boolean, mode: Mode) => void;
  showSuggestions?: boolean;
}

// No fallback suggestions - only show real search suggestions
const FALLBACK_SEARCH_SUGGESTIONS: string[] = [];
const FALLBACK_RESEARCH_SUGGESTIONS: string[] = [];

export function SearchResearchToggle({ 
  onQueryClick, 
  onModeChange, 
  showSuggestions: externalShowSuggestions,
}: SearchResearchToggleProps) {
  const [activeMode, setActiveMode] = useState<Mode>('search');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const showSuggestionsState = externalShowSuggestions !== undefined ? externalShowSuggestions : showSuggestions;
  const [hoveredButton, setHoveredButton] = useState<Mode | null>(null);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Don't show tooltip when suggestions are visible
  const shouldShowTooltip = hoveredButton && !showSuggestionsState;

  // Use fallback suggestions (actual fetching happens in SearchResearchSuggestions component)
  const searchSuggestions = FALLBACK_SEARCH_SUGGESTIONS;
  const researchSuggestions = FALLBACK_RESEARCH_SUGGESTIONS;

  const handleModeClick = (mode: Mode) => {
    if (activeMode === mode) {
      const newShowSuggestions = !showSuggestions;
      setShowSuggestions(newShowSuggestions);
      if (onModeChange) {
        onModeChange(newShowSuggestions, mode);
      }
    } else {
      setActiveMode(mode);
      setShowSuggestions(true);
      if (onModeChange) {
        onModeChange(true, mode);
      }
    }
  };

  const handleQueryClick = (query: string, submit = true) => {
    if (onQueryClick) {
      // Pass submit=true to indicate this should be submitted immediately
      onQueryClick(query, submit);
    }
    setShowSuggestions(false);
    if (onModeChange) {
      onModeChange(false, activeMode);
    }
  };

  // Store onModeChange in ref to avoid dependency issues
  const onModeChangeRef = useRef(onModeChange);
  useEffect(() => {
    onModeChangeRef.current = onModeChange;
  }, [onModeChange]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-toggle-button]')) {
          setShowSuggestions(false);
          if (onModeChangeRef.current) {
            onModeChangeRef.current(false, activeMode);
          }
        }
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions, activeMode]);

  const currentSuggestions =
    activeMode === 'search' ? searchSuggestions : researchSuggestions;
  const CurrentIcon = activeMode === 'search' ? Search : Orbit;

  // Calculate arrow position for tooltip
  const getArrowPosition = () => {
    if (hoveredButton === 'search') {
      return 'left-[12px]';
    } else {
      return 'left-[44px]';
    }
  };

  const handleButtonMouseEnter = (mode: Mode) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredButton(mode);
    setIsTooltipHovered(false);
  };

  const handleButtonMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isTooltipHovered) {
        setHoveredButton(null);
      }
      hoverTimeoutRef.current = null;
    }, 150);
  };

  const handleTooltipMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsTooltipHovered(true);
  };

  const handleTooltipMouseLeave = () => {
    setIsTooltipHovered(false);
    setHoveredButton(null);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="inline-block">
      {/* Toggle Buttons with iOS-style slider */}
      <div className="relative inline-block">
        <div className="relative inline-flex items-center bg-[var(--bg-tertiary)] rounded-lg p-1">
          {/* Sliding pill indicator */}
          <div
            className="absolute top-1 h-[calc(100%-8px)] w-[32px] bg-[var(--bg-brand-solid)] rounded-md transition-all duration-300 ease-out"
            style={{
              left: activeMode === 'search' ? '4px' : '36px',
            }}
          />

          <div className="relative group/search">
            <button
              data-toggle-button
              type="button"
              onClick={() => handleModeClick('search')}
              onMouseEnter={() => handleButtonMouseEnter('search')}
              onMouseLeave={handleButtonMouseLeave}
              className={`
                relative z-10 flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-300
                ${
                  activeMode === 'search'
                    ? 'text-[var(--fg-white)]'
                    : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]'
                }
              `}
              aria-label="Search mode"
            >
              <Search className="w-4 h-4" />
            </button>
            {/* Simple tooltip when suggestions are showing */}
            {showSuggestionsState && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-[var(--fg-primary)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md opacity-0 group-hover/search:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none z-50">
                Search
              </span>
            )}
          </div>

          <div className="relative group/research">
            <button
              data-toggle-button
              type="button"
              onClick={() => handleModeClick('research')}
              onMouseEnter={() => handleButtonMouseEnter('research')}
              onMouseLeave={handleButtonMouseLeave}
              className={`
                relative z-10 flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-300
                ${
                  activeMode === 'research'
                    ? 'text-[var(--fg-white)]'
                    : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]'
                }
              `}
              aria-label="Research mode"
            >
              <Orbit className="w-4 h-4" />
            </button>
            {/* Simple tooltip when suggestions are showing */}
            {showSuggestionsState && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-[var(--fg-primary)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md opacity-0 group-hover/research:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none z-50">
                Research
              </span>
            )}
          </div>
        </div>

        {/* Hover Tooltip - Only show when suggestions are NOT visible */}
        {shouldShowTooltip && (
          <div
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
            className="absolute top-full left-0 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--border-secondary)] shadow-[var(--shadow-lg)] p-4 z-[10001] bg-[var(--bg-secondary)]"
          >
            {/* Arrow pointer with solid background */}
            <div
              className={`absolute -top-[9px] w-4 h-4 border-l border-t border-[var(--border-secondary)] transform rotate-45 transition-all duration-200 bg-[var(--bg-secondary)] ${getArrowPosition()}`}
            />
            
            <div className="relative">
              <h3 className="font-semibold text-[var(--fg-primary)] mb-1">
                {hoveredButton === 'search' ? 'Search' : 'Research'}
              </h3>
              <p className="text-sm text-[var(--fg-tertiary)] mb-3">
                {hoveredButton === 'search'
                  ? 'Fast answers to everyday questions'
                  : 'Deep research on any topic'}
              </p>
              <div className="border-t border-[var(--border-secondary)] pt-3">
                <p className="text-xs text-[var(--fg-brand-primary)] mb-2">
                  Extended access for subscribers
                </p>
                <p className="text-xs text-[var(--fg-tertiary)] mb-2">
                  {hoveredButton === 'search'
                    ? 'Advanced search with 10x the sources; powered by top models'
                    : 'In-depth reports with more sources, charts, and advanced reasoning'}
                </p>
                <p className="text-xs text-[var(--fg-tertiary)] mb-3">
                  3 queries remaining today
                </p>
                <button className="w-full bg-bg-brand-solid hover:bg-bg-brand-solid-hover text-[var(--fg-white)] text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

// Export suggestions as separate component to render inside container
export function SearchResearchSuggestions({
  mode,
  onQueryClick,
  suggestions: externalSuggestions,
  isLoading = false,
}: {
  mode: 'search' | 'research';
  onQueryClick?: (query: string, submit?: boolean) => void;
  suggestions?: string[];
  inputValue?: string;
  isLoading?: boolean;
}) {
  const CurrentIcon = mode === 'search' ? Search : Orbit;

  // Only use external suggestions - no fallbacks
  const suggestions = externalSuggestions || [];

  // Don't render anything if no suggestions and not loading
  if (!isLoading && suggestions.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="w-full px-2 py-2"
      variants={suggestionsContainer}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-3">
          <div className="w-4 h-4 border-2 border-[var(--fg-tertiary)]/30 border-t-[var(--fg-brand-primary)] rounded-full animate-spin" />
        </div>
      )}

      {/* Suggestions List */}
      {!isLoading && suggestions.length > 0 && (
        <div className="space-y-0.5">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={`${mode}-${suggestion}-${index}`}
              variants={suggestionItem}
              type="button"
              onClick={() => onQueryClick?.(suggestion, true)}
              whileHover={{ x: 4, backgroundColor: 'var(--bg-tertiary)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full text-left px-2 py-2 rounded-lg transition-colors group"
            >
              <div className="flex items-start space-x-3">
                <CurrentIcon className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)]">
                  {suggestion}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
