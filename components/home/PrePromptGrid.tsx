'use client';

import { useState } from 'react';
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

// Quick links to subpages
const quickLinks = [
  {
    id: 'logos',
    title: 'Logos',
    subtitle: 'Grab your brand logos',
    href: '/brand-hub?tab=logos',
    icon: Image,
  },
  {
    id: 'fonts',
    title: 'Fonts',
    subtitle: 'Download your typefaces',
    href: '/brand-hub?tab=fonts',
    icon: Type,
  },
  {
    id: 'colors',
    title: 'Colors',
    subtitle: 'View your color palette',
    href: '/brand-hub?tab=colors',
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

// Pre-prompts for common tasks
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

// Combined for desktop carousel
const allItems = [
  ...quickLinks.map(link => ({ ...link, type: 'link' as const })),
  ...prePrompts.map(prompt => ({ ...prompt, type: 'prompt' as const })),
];

// Reusable carousel row component for mobile/tablet
function CarouselRow({ 
  items, 
  type, 
  onPromptSubmit,
  visibleCount = 2,
}: { 
  items: typeof quickLinks | typeof prePrompts;
  type: 'link' | 'prompt';
  onPromptSubmit?: (prompt: string) => void;
  visibleCount?: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const maxIndex = items.length - visibleCount;

  const handlePrev = () => setCurrentIndex(prev => Math.max(0, prev - 1));
  const handleNext = () => setCurrentIndex(prev => Math.min(maxIndex, prev + 1));

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < maxIndex;
  const cardWidthPercent = 100 / visibleCount;

  return (
    <div className="flex items-center gap-2">
      {/* Left arrow */}
      <button
        onClick={handlePrev}
        disabled={!canGoPrev}
        className={`flex-shrink-0 w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center transition-all duration-200 ${
          canGoPrev 
            ? 'hover:border-[var(--border-brand)] hover:bg-[var(--bg-tertiary)] cursor-pointer' 
            : 'opacity-30 cursor-not-allowed'
        }`}
        aria-label="Previous"
      >
        <ChevronLeft className="w-4 h-4 text-[var(--fg-secondary)]" />
      </button>

      {/* Cards - no gradient mask on mobile, show full cards */}
      <div className="relative flex-1 overflow-hidden">
        <div 
          className="flex gap-3 transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (cardWidthPercent + 1)}%)`,
          }}
        >
          {items.map((item) => (
            <div 
              key={item.id} 
              className="flex-shrink-0 min-h-[130px]"
              style={{ width: `calc(${cardWidthPercent}% - 6px)` }}
            >
              {type === 'link' && 'href' in item ? (
                <AnimatedFolder
                  title={item.title}
                  subtitle={item.subtitle}
                  href={item.href}
                  icon={item.icon}
                />
              ) : type === 'prompt' && 'prompt' in item ? (
                <IconHover3D
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  onClick={() => onPromptSubmit?.(item.prompt)}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Right arrow */}
      <button
        onClick={handleNext}
        disabled={!canGoNext}
        className={`flex-shrink-0 w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center transition-all duration-200 ${
          canGoNext 
            ? 'hover:border-[var(--border-brand)] hover:bg-[var(--bg-tertiary)] cursor-pointer' 
            : 'opacity-30 cursor-not-allowed'
        }`}
        aria-label="Next"
      >
        <ChevronRight className="w-4 h-4 text-[var(--fg-secondary)]" />
      </button>
    </div>
  );
}

export function PrePromptGrid({ onPromptSubmit }: PrePromptGridProps) {
  // Desktop carousel state
  const [currentIndex, setCurrentIndex] = useState(2);
  const visibleCount = 4;
  const maxIndex = allItems.length - visibleCount;

  const handlePrev = () => setCurrentIndex(prev => Math.max(0, prev - 1));
  const handleNext = () => setCurrentIndex(prev => Math.min(maxIndex, prev + 1));

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < maxIndex;
  const cardWidthPercent = 100 / visibleCount;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="w-full max-w-3xl mx-auto px-4 mt-4"
    >
      {/* Desktop: Single carousel with all items */}
      <div className="hidden lg:block">
        <div className="flex items-center gap-4">
          {/* Left arrow */}
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className={`flex-shrink-0 w-9 h-9 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center transition-all duration-200 ${
              canGoPrev 
                ? 'hover:border-[var(--border-brand)] hover:bg-[var(--bg-tertiary)] cursor-pointer' 
                : 'opacity-30 cursor-not-allowed'
            }`}
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--fg-secondary)]" />
          </button>

          {/* Cards */}
          <div 
            className="relative flex-1 overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            }}
          >
            <div 
              className="flex gap-3 transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(-${currentIndex * (cardWidthPercent + 0.5)}%)`,
              }}
            >
              {allItems.map((item) => (
                <div 
                  key={item.id} 
                  className="flex-shrink-0 min-h-[140px]"
                  style={{ width: `calc(${cardWidthPercent}% - 9px)` }}
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

          {/* Right arrow */}
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={`flex-shrink-0 w-9 h-9 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center transition-all duration-200 ${
              canGoNext 
                ? 'hover:border-[var(--border-brand)] hover:bg-[var(--bg-tertiary)] cursor-pointer' 
                : 'opacity-30 cursor-not-allowed'
            }`}
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4 text-[var(--fg-secondary)]" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
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
      </div>

      {/* Tablet & Mobile: Two carousel rows */}
      <div className="lg:hidden space-y-3">
        {/* Row 1: Quick Links carousel */}
        <CarouselRow 
          items={quickLinks} 
          type="link" 
          visibleCount={2}
        />

        {/* Row 2: Pre-prompts carousel */}
        <CarouselRow 
          items={prePrompts} 
          type="prompt" 
          onPromptSubmit={onPromptSubmit}
          visibleCount={2}
        />
      </div>
    </motion.div>
  );
}
