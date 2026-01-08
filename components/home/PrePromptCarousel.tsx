'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  ChevronRight,
  Image,
  Type,
  Palette,
  LayoutGrid,
  Megaphone,
  Target,
  Lightbulb,
  MessageSquare,
} from 'lucide-react';
import { AnimatedFolder } from './AnimatedFolder';
import { IconHover3D } from './IconHover3D';
import { useChatContext } from '@/lib/chat-context';
import type { QuickActionType } from '@/lib/quick-actions';

interface PrePromptCarouselProps {
  onPromptSubmit: (prompt: string) => void;
}

// Quick action IDs that trigger forms instead of text prompts
const QUICK_ACTION_IDS: Record<string, QuickActionType> = {
  'social-post': 'create-post-copy',
};

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
    title: 'Create post',
    description: 'Generate copy for social media',
    prompt: 'Help me create a social media post. I want to announce [topic/product] and need engaging copy that fits my brand voice.',
  },
  {
    id: 'brand-review',
    icon: MessageSquare,
    title: 'Brand Review',
    description: 'Review work for brand fit',
    prompt: 'Review this and tell me if it matches my brand guidelines. Suggest improvements to make it more on-brand: [paste your content]',
  },
  {
    id: 'reverse-engineer',
    icon: Lightbulb,
    title: 'Reverse Engineer',
    description: 'Get creative concepts',
    prompt: 'Help me brainstorm creative ideas for [campaign/project]. I want fresh concepts that align with my brand values.',
  },
  {
    id: 'product-copy',
    icon: Target,
    title: 'Product Copy',
    description: 'Map out a content strategy',
    prompt: 'Help me plan a content campaign for [goal/product]. I need ideas for posts, timing, and messaging that align with my brand.',
  },
];

// Combined for carousel: 4 folders (0-3) + 4 icons (4-7)
const allItems = [
  ...quickLinks.map(link => ({ ...link, type: 'link' as const })),
  ...prePrompts.map(prompt => ({ ...prompt, type: 'prompt' as const })),
];

// Mobile grid items: 2 folders + 2 icons (Colors, Spaces, Create post, Brand Review)
const mobileGridItems = [
  { ...quickLinks[2], type: 'link' as const }, // Colors
  { ...quickLinks[3], type: 'link' as const }, // Spaces
  { ...prePrompts[0], type: 'prompt' as const }, // Create post
  { ...prePrompts[1], type: 'prompt' as const }, // Brand Review
];

// Initial indices per breakpoint to center on 2 folders + 2 icons:
// - Desktop (4 visible): index 2 → Colors, Spaces, Create post, Brand Review
// - Tablet (3 visible): index 2 → Colors, Spaces, Create post  
const INITIAL_INDEX_DESKTOP = 2;
const INITIAL_INDEX_TABLET = 2;

// Swipe threshold in pixels
const SWIPE_THRESHOLD = 50;

export function PrePromptCarousel({ onPromptSubmit }: PrePromptCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(INITIAL_INDEX_DESKTOP);
  const [visibleCount, setVisibleCount] = useState(4); // Default to desktop
  const router = useRouter();
  
  // Get chat context for quick actions and resetting
  const { triggerChatReset } = useChatContext();
  
  // Touch handling state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle item click - either navigate to new chat with action param or submit prompt
  const handleItemClick = useCallback((item: typeof prePrompts[0]) => {
    const quickActionType = QUICK_ACTION_IDS[item.id];
    if (quickActionType) {
      // Navigate to home with action param - this will trigger the form in a new chat
      triggerChatReset();
      router.push(`/?action=${quickActionType}`);
    } else {
      // Fall back to regular prompt submission
      onPromptSubmit(item.prompt);
    }
  }, [triggerChatReset, router, onPromptSubmit]);
  
  // Adjust visible count and initial index based on screen size (for carousel only)
  useEffect(() => {
    const updateLayout = () => {
      const isTablet = window.matchMedia('(min-width: 640px) and (max-width: 1023px)').matches;
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
      
      if (isDesktop) {
        setVisibleCount(4);
      } else if (isTablet) {
        setVisibleCount(3);
      }
    };
    
    // Set initial values based on screen size
    const isTablet = window.matchMedia('(min-width: 640px) and (max-width: 1023px)').matches;
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    
    if (isDesktop) {
      setVisibleCount(4);
      setCurrentIndex(INITIAL_INDEX_DESKTOP);
    } else if (isTablet) {
      setVisibleCount(3);
      setCurrentIndex(INITIAL_INDEX_TABLET);
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
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Mobile: 2x2 grid layout (hidden on sm and up) */}
      <div className="sm:hidden">
        <div className="grid grid-cols-2 gap-3">
          {mobileGridItems.map((item) => (
            <div 
              key={item.id} 
              className="min-h-[130px]"
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
                  onClick={() => handleItemClick(item)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tablet & Desktop: Carousel layout (hidden on mobile) */}
      <div className="hidden sm:block">
        {/* Carousel with arrows outside - flex row layout */}
        <div 
          ref={containerRef}
          className="flex items-center gap-3"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Left arrow - outside cards */}
          <motion.button
            onClick={handlePrev}
            disabled={currentIndex <= 0}
            className={`shrink-0 w-9 h-9 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center transition-colors duration-150 ${
              currentIndex > 0 
                ? 'cursor-pointer hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-brand)]' 
                : 'opacity-30 cursor-not-allowed'
            }`}
            whileHover={currentIndex > 0 ? { scale: 1.05 } : {}}
            whileTap={currentIndex > 0 ? { scale: 0.95 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--fg-secondary)]" />
          </motion.button>

          {/* Cards container */}
          <div 
            className="flex-1 overflow-hidden touch-pan-y"
            role="region"
            aria-label="Quick action cards"
            aria-live="polite"
          >
            <motion.div 
              className="flex gap-3 will-change-transform"
              style={{
                width: getTrackWidth(),
              }}
              animate={{
                x: `calc(-${currentIndex} * (12.5% + 1.5px))`,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 1,
              }}
            >
              {allItems.map((item, idx) => (
                <div 
                  key={item.id} 
                  className="flex-shrink-0 min-h-[140px]"
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
                      onClick={() => handleItemClick(item)}
                    />
                  )}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right arrow - outside cards */}
          <motion.button
            onClick={handleNext}
            disabled={currentIndex >= maxIndex}
            className={`shrink-0 w-9 h-9 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center transition-colors duration-150 ${
              currentIndex < maxIndex 
                ? 'cursor-pointer hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-brand)]' 
                : 'opacity-30 cursor-not-allowed'
            }`}
            whileHover={currentIndex < maxIndex ? { scale: 1.05 } : {}}
            whileTap={currentIndex < maxIndex ? { scale: 0.95 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 text-[var(--fg-secondary)]" />
          </motion.button>
        </div>

        {/* Progress dots */}
        <div 
          className="flex justify-center gap-2 mt-5"
          role="tablist"
          aria-label="Carousel navigation"
        >
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <motion.button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              role="tab"
              aria-selected={idx === currentIndex}
              aria-label={`Go to slide ${idx + 1} of ${maxIndex + 1}`}
              className={`h-1.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2 transition-colors duration-150 ${
                idx === currentIndex 
                  ? 'bg-[var(--fg-brand-primary)]' 
                  : 'bg-[var(--border-primary)] hover:bg-[var(--fg-tertiary)]'
              }`}
              animate={{
                width: idx === currentIndex ? 20 : 6,
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
