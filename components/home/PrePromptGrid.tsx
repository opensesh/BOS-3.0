'use client';

import { useState, useEffect } from 'react';
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

export function PrePromptGrid({ onPromptSubmit }: PrePromptGridProps) {
  // Default to desktop index for SSR, will adjust on mount for smaller screens
  const [currentIndex, setCurrentIndex] = useState(INITIAL_INDEX_DESKTOP);
  
  // Adjust initial index based on screen size on mount
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const isTablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches;
    
    if (isMobile) {
      setCurrentIndex(INITIAL_INDEX_MOBILE);
    } else if (isTablet) {
      setCurrentIndex(INITIAL_INDEX_TABLET);
    }
    // Desktop keeps the default INITIAL_INDEX_DESKTOP
  }, []);
  
  // Responsive: 4 desktop, 3 tablet, 2 mobile
  const getMaxIndex = (visibleCount: number) => allItems.length - visibleCount;

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = (maxIdx: number) => {
    setCurrentIndex(prev => Math.min(maxIdx, prev + 1));
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="w-full max-w-3xl mx-auto px-4 mt-4"
    >
      {/* Carousel container - arrows inside */}
      <div className="relative">
        {/* Left arrow - overlaid */}
        <button
          onClick={handlePrev}
          disabled={currentIndex <= 0}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[var(--bg-secondary)]/90 backdrop-blur-sm border border-[var(--border-primary)] flex items-center justify-center transition-all duration-200 ${
            currentIndex > 0 
              ? 'hover:border-[var(--border-brand)] hover:bg-[var(--bg-tertiary)] cursor-pointer' 
              : 'opacity-30 cursor-not-allowed'
          }`}
          aria-label="Previous"
        >
          <ChevronLeft className="w-4 h-4 text-[var(--fg-secondary)]" />
        </button>

        {/* Right arrow - overlaid */}
        <button
          onClick={() => handleNext(getMaxIndex(4))}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[var(--bg-secondary)]/90 backdrop-blur-sm border border-[var(--border-primary)] flex items-center justify-center transition-all duration-200 hidden lg:flex ${
            currentIndex < getMaxIndex(4) 
              ? 'hover:border-[var(--border-brand)] hover:bg-[var(--bg-tertiary)] cursor-pointer' 
              : 'opacity-30 cursor-not-allowed'
          }`}
          aria-label="Next"
          disabled={currentIndex >= getMaxIndex(4)}
        >
          <ChevronRight className="w-4 h-4 text-[var(--fg-secondary)]" />
        </button>

        {/* Right arrow - tablet */}
        <button
          onClick={() => handleNext(getMaxIndex(3))}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[var(--bg-secondary)]/90 backdrop-blur-sm border border-[var(--border-primary)] flex items-center justify-center transition-all duration-200 hidden md:flex lg:hidden ${
            currentIndex < getMaxIndex(3) 
              ? 'hover:border-[var(--border-brand)] hover:bg-[var(--bg-tertiary)] cursor-pointer' 
              : 'opacity-30 cursor-not-allowed'
          }`}
          aria-label="Next"
          disabled={currentIndex >= getMaxIndex(3)}
        >
          <ChevronRight className="w-4 h-4 text-[var(--fg-secondary)]" />
        </button>

        {/* Right arrow - mobile */}
        <button
          onClick={() => handleNext(getMaxIndex(2))}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[var(--bg-secondary)]/90 backdrop-blur-sm border border-[var(--border-primary)] flex items-center justify-center transition-all duration-200 md:hidden ${
            currentIndex < getMaxIndex(2) 
              ? 'hover:border-[var(--border-brand)] hover:bg-[var(--bg-tertiary)] cursor-pointer' 
              : 'opacity-30 cursor-not-allowed'
          }`}
          aria-label="Next"
          disabled={currentIndex >= getMaxIndex(2)}
        >
          <ChevronRight className="w-4 h-4 text-[var(--fg-secondary)]" />
        </button>

        {/* Cards - Desktop: 4, Tablet: 3, Mobile: 2 */}
        {/* Desktop - 4 visible, gap=12px */}
        <div className="hidden lg:block overflow-hidden mx-10">
          <div 
            className="flex gap-3 transition-transform duration-300 ease-out"
            style={{
              // Track holds all 8 cards: 8 * card_width + 7 * gap
              // Card width relative to track = 12.5% - 10.5px (so 8 cards fit)
              // Track = 200% + 12px of viewport
              width: 'calc(200% + 12px)',
              // To move by 1 card position: (card_width + gap) = (12.5% + 1.5px) of track
              // Since % in transform is relative to element's own width (the track)
              transform: `translateX(calc(-${currentIndex} * (12.5% + 1.5px)))`,
            }}
          >
            {allItems.map((item) => (
              <div 
                key={item.id} 
                className="flex-shrink-0 min-h-[140px]"
                // Each card = 12.5% of track - gap adjustment
                style={{ width: 'calc(12.5% - 10.5px)' }}
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

        {/* Tablet - 3 visible, gap=12px */}
        <div className="hidden md:block lg:hidden overflow-hidden mx-10">
          <div 
            className="flex gap-3 transition-transform duration-300 ease-out"
            style={{
              // Track = 266.67% + 12px of viewport (8/3 ratio)
              width: 'calc(266.67% + 12px)',
              // Card + gap = 12.5% + 1.5px of track (same formula, track is just wider)
              transform: `translateX(calc(-${currentIndex} * (12.5% + 1.5px)))`,
            }}
          >
            {allItems.map((item) => (
              <div 
                key={item.id} 
                className="flex-shrink-0 min-h-[140px]"
                style={{ width: 'calc(12.5% - 10.5px)' }}
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

        {/* Mobile - 2 visible, gap=12px */}
        <div className="md:hidden overflow-hidden mx-10">
          <div 
            className="flex gap-3 transition-transform duration-300 ease-out"
            style={{
              // Track = 400% + 12px of viewport (8/2 ratio)
              width: 'calc(400% + 12px)',
              // Card + gap = 12.5% + 1.5px of track
              transform: `translateX(calc(-${currentIndex} * (12.5% + 1.5px)))`,
            }}
          >
            {allItems.map((item) => (
              <div 
                key={item.id} 
                className="flex-shrink-0 min-h-[130px]"
                style={{ width: 'calc(12.5% - 10.5px)' }}
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
      </div>

      {/* Progress dots - responsive */}
      <div className="flex justify-center gap-1.5 mt-4">
        {/* Desktop dots */}
        <div className="hidden lg:flex gap-1.5">
          {Array.from({ length: getMaxIndex(4) + 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                idx === currentIndex 
                  ? 'bg-[var(--color-brand-500)] w-4' 
                  : 'bg-[var(--border-primary)] hover:bg-[var(--fg-tertiary)] w-1.5'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Tablet dots */}
        <div className="hidden md:flex lg:hidden gap-1.5">
          {Array.from({ length: getMaxIndex(3) + 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(Math.min(idx, getMaxIndex(3)))}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                idx === currentIndex 
                  ? 'bg-[var(--color-brand-500)] w-4' 
                  : 'bg-[var(--border-primary)] hover:bg-[var(--fg-tertiary)] w-1.5'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Mobile dots */}
        <div className="flex md:hidden gap-1.5">
          {Array.from({ length: getMaxIndex(2) + 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(Math.min(idx, getMaxIndex(2)))}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                idx === currentIndex 
                  ? 'bg-[var(--color-brand-500)] w-4' 
                  : 'bg-[var(--border-primary)] hover:bg-[var(--fg-tertiary)] w-1.5'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
