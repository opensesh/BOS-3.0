'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight,
  Image,
  Type,
  Palette,
  LayoutGrid,
  Megaphone,
  Sparkles,
  Lightbulb,
  MessageSquare,
} from 'lucide-react';
import { AnimatedFolder } from './AnimatedFolder';
import { IconHover3D } from './IconHover3D';
import { fadeInUp } from '@/lib/motion';

interface PrePromptGridProps {
  onPromptSubmit: (prompt: string) => void;
}

// Quick links to subpages (folder cards)
const quickLinks = [
  {
    id: 'logos',
    title: 'Logos',
    subtitle: 'Grab your brand logos',
    href: '/brand-hub/logo',
    icon: Image,
  },
  {
    id: 'fonts',
    title: 'Fonts',
    subtitle: 'Download your typefaces',
    href: '/brand-hub/fonts',
    icon: Type,
  },
  {
    id: 'colors',
    title: 'Colors',
    subtitle: 'View your color palette',
    href: '/brand-hub/colors',
    icon: Palette,
  },
  {
    id: 'spaces',
    title: 'Spaces',
    subtitle: 'Browse your projects',
    href: '/spaces',
    icon: LayoutGrid,
  },
];

// Pre-prompts for common tasks (icon cards)
const prePrompts = [
  {
    id: 'social-post',
    icon: Megaphone,
    title: 'Create a post',
    description: 'Generate copy for social media',
    prompt: 'Help me create a social media post. I want to announce [topic/product] and need engaging copy that fits my brand voice.',
  },
  {
    id: 'campaign',
    icon: Sparkles,
    title: 'Plan a campaign',
    description: 'Map out a content strategy',
    prompt: 'Help me plan a content campaign for [goal/product]. I need ideas for posts, timing, and messaging that align with my brand.',
  },
  {
    id: 'brainstorm',
    icon: Lightbulb,
    title: 'Brainstorm ideas',
    description: 'Get creative concepts',
    prompt: 'Help me brainstorm creative ideas for [campaign/project]. I want fresh concepts that align with my brand values.',
  },
  {
    id: 'get-feedback',
    icon: MessageSquare,
    title: 'Get feedback',
    description: 'Review work for brand fit',
    prompt: 'Review this and tell me if it matches my brand guidelines. Suggest improvements to make it more on-brand: [paste your content]',
  },
];

// Combined for carousel: 4 folders (0-3) + 4 icons (4-7)
const allItems = [
  ...quickLinks.map(link => ({ ...link, type: 'link' as const })),
  ...prePrompts.map(prompt => ({ ...prompt, type: 'prompt' as const })),
];

// Initial indices to center between folder and icon cards per breakpoint:
// - Desktop (4 visible): index 2 → Colors, Spaces, Create a post, Plan a campaign (2 folders + 2 icons)
// - Tablet (3 visible): index 2 → Colors, Spaces, Create a post (2 folders + 1 icon)
// - Mobile (2 visible): index 3 → Spaces, Create a post (1 folder + 1 icon)
const INITIAL_INDEX_DESKTOP = 2;
const INITIAL_INDEX_TABLET = 2;
const INITIAL_INDEX_MOBILE = 3;

// Swipe threshold in pixels
const SWIPE_THRESHOLD = 50;

export function PrePromptGrid({ onPromptSubmit }: PrePromptGridProps) {
  // Default to desktop index for SSR, will adjust on mount for smaller screens
  const [currentIndex, setCurrentIndex] = useState(INITIAL_INDEX_DESKTOP);
  const [visibleCount, setVisibleCount] = useState(4); // Default to desktop
  
  // Touch handling state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Adjust initial index and visible count based on screen size
  useEffect(() => {
    const updateLayout = () => {
      const isMobile = window.matchMedia('(max-width: 767px)').matches;
      const isTablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches;
      
      if (isMobile) {
        setVisibleCount(2);
        setCurrentIndex(prev => Math.min(prev, allItems.length - 2));
      } else if (isTablet) {
        setVisibleCount(3);
        setCurrentIndex(prev => Math.min(prev, allItems.length - 3));
      } else {
        setVisibleCount(4);
        setCurrentIndex(prev => Math.min(prev, allItems.length - 4));
      }
    };
    
    // Set initial values
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const isTablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches;
    
    if (isMobile) {
      setVisibleCount(2);
      setCurrentIndex(INITIAL_INDEX_MOBILE);
    } else if (isTablet) {
      setVisibleCount(3);
      setCurrentIndex(INITIAL_INDEX_TABLET);
    } else {
      setVisibleCount(4);
      setCurrentIndex(INITIAL_INDEX_DESKTOP);
    }
    
    // Listen for resize
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);
  
  // Calculate max index based on visible count
  const maxIndex = allItems.length - visibleCount;

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  }, [maxIndex]);
  
  // Touch event handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  }, []);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);
  
  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    
    const diff = touchStartX.current - touchEndX.current;
    
    // Swipe left (next)
    if (diff > SWIPE_THRESHOLD) {
      handleNext();
    }
    // Swipe right (prev)
    else if (diff < -SWIPE_THRESHOLD) {
      handlePrev();
    }
    
    // Reset
    touchStartX.current = null;
    touchEndX.current = null;
  }, [handleNext, handlePrev]);

  // Get track width based on visible count
  const getTrackWidth = () => {
    const ratio = allItems.length / visibleCount;
    return `calc(${ratio * 100}% + 12px)`;
  };
  
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="w-full max-w-3xl mx-auto px-4 mt-2 sm:mt-4"
    >
      {/* Carousel container - arrows inside, touch-enabled */}
      <div 
        ref={containerRef}
        className="relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left arrow - visible on all screens */}
        <button
          onClick={handlePrev}
          disabled={currentIndex <= 0}
          className={`absolute -left-1 sm:left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center transition-all duration-200 shadow-sm ${
            currentIndex > 0 
              ? 'hover:border-[var(--border-brand)] hover:bg-[var(--bg-tertiary)] cursor-pointer active:scale-95' 
              : 'opacity-30 cursor-not-allowed'
          }`}
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 text-[var(--fg-secondary)]" />
        </button>

        {/* Right arrow - visible on all screens */}
        <button
          onClick={handleNext}
          disabled={currentIndex >= maxIndex}
          className={`absolute -right-1 sm:right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center transition-all duration-200 shadow-sm ${
            currentIndex < maxIndex 
              ? 'hover:border-[var(--border-brand)] hover:bg-[var(--bg-tertiary)] cursor-pointer active:scale-95' 
              : 'opacity-30 cursor-not-allowed'
          }`}
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 text-[var(--fg-secondary)]" />
        </button>

        {/* Cards container - unified for all breakpoints */}
        <div 
          className="overflow-hidden mx-8 sm:mx-10 touch-pan-y"
          role="region"
          aria-label="Quick action cards"
          aria-live="polite"
        >
          <div 
            className="flex gap-3 transition-transform duration-300 ease-out will-change-transform"
            style={{
              width: getTrackWidth(),
              transform: `translateX(calc(-${currentIndex} * (12.5% + 1.5px)))`,
            }}
          >
            {allItems.map((item, idx) => (
              <div 
                key={item.id} 
                className="flex-shrink-0 min-h-[120px] sm:min-h-[140px]"
                style={{ width: 'calc(12.5% - 10.5px)' }}
                role="group"
                aria-label={`${item.title} - ${idx + 1} of ${allItems.length}`}
              >
                {item.type === 'link' ? (
                  <AnimatedFolder
                    title={item.title}
                    subtitle={item.subtitle}
                    href={item.href}
                    icon={item.icon}
                  />
                ) : (
                  <IconHover3D
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                    onClick={() => onPromptSubmit(item.prompt)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Swipe hint for mobile - only shown briefly */}
        <div className="md:hidden flex justify-center mt-2 text-[10px] text-[var(--fg-quaternary)] select-none pointer-events-none">
          <span>Swipe to explore</span>
        </div>
      </div>

      {/* Progress dots - unified */}
      <div 
        className="flex justify-center gap-1.5 mt-3 sm:mt-4"
        role="tablist"
        aria-label="Carousel navigation"
      >
        {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            role="tab"
            aria-selected={idx === currentIndex}
            aria-label={`Go to slide ${idx + 1} of ${maxIndex + 1}`}
            className={`h-1.5 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2 ${
              idx === currentIndex 
                ? 'bg-[var(--color-brand-500)] w-4' 
                : 'bg-[var(--border-primary)] hover:bg-[var(--fg-tertiary)] w-1.5'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
