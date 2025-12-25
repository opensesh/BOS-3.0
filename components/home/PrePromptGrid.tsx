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

// Combined for carousel
const allItems = [
  ...quickLinks.map(link => ({ ...link, type: 'link' as const })),
  ...prePrompts.map(prompt => ({ ...prompt, type: 'prompt' as const })),
];

export function PrePromptGrid({ onPromptSubmit }: PrePromptGridProps) {
  // Start centered: index 2 shows Colors, Spaces, Create post, Plan campaign
  const [currentIndex, setCurrentIndex] = useState(2);
  
  // Desktop: 4 cards, Mobile: 2 cards
  const desktopVisibleCount = 4;
  const mobileVisibleCount = 2;
  
  const desktopMaxIndex = allItems.length - desktopVisibleCount;
  const mobileMaxIndex = allItems.length - mobileVisibleCount;

  const handlePrev = (maxIdx: number) => {
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
      {/* Desktop Carousel: 4 cards */}
      <div className="hidden lg:block">
        <div className="flex items-center gap-4">
          {/* Left arrow */}
          <button
            onClick={() => handlePrev(desktopMaxIndex)}
            disabled={currentIndex <= 0}
            className={`flex-shrink-0 w-9 h-9 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center transition-all duration-200 ${
              currentIndex > 0 
                ? 'hover:border-[var(--border-brand)] hover:bg-[var(--bg-tertiary)] cursor-pointer' 
                : 'opacity-30 cursor-not-allowed'
            }`}
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--fg-secondary)]" />
          </button>

          {/* Cards container */}
          <div className="relative flex-1">
            {/* Left edge fade - only for incoming cards */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-4 z-10 pointer-events-none"
              style={{
                background: 'linear-gradient(to right, var(--bg-primary), transparent)',
              }}
            />
            
            {/* Right edge fade - only for incoming cards */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-4 z-10 pointer-events-none"
              style={{
                background: 'linear-gradient(to left, var(--bg-primary), transparent)',
              }}
            />

            <div className="overflow-hidden">
              <div 
                className="flex gap-3 transition-transform duration-300 ease-out"
                style={{
                  transform: `translateX(calc(-${currentIndex} * (25% + 2.25px)))`,
                }}
              >
                {allItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex-shrink-0 min-h-[140px]"
                    style={{ width: 'calc(25% - 9px)' }}
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

          {/* Right arrow */}
          <button
            onClick={() => handleNext(desktopMaxIndex)}
            disabled={currentIndex >= desktopMaxIndex}
            className={`flex-shrink-0 w-9 h-9 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center transition-all duration-200 ${
              currentIndex < desktopMaxIndex 
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
          {Array.from({ length: desktopMaxIndex + 1 }).map((_, idx) => (
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

      {/* Tablet & Mobile Carousel: 2 cards, single row */}
      <div className="lg:hidden">
        <div className="flex items-center gap-3">
          {/* Left arrow */}
          <button
            onClick={() => handlePrev(mobileMaxIndex)}
            disabled={currentIndex <= 0}
            className={`flex-shrink-0 w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center transition-all duration-200 ${
              currentIndex > 0 
                ? 'hover:border-[var(--border-brand)] hover:bg-[var(--bg-tertiary)] cursor-pointer' 
                : 'opacity-30 cursor-not-allowed'
            }`}
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--fg-secondary)]" />
          </button>

          {/* Cards container */}
          <div className="relative flex-1">
            {/* Left edge fade */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-3 z-10 pointer-events-none"
              style={{
                background: 'linear-gradient(to right, var(--bg-primary), transparent)',
              }}
            />
            
            {/* Right edge fade */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-3 z-10 pointer-events-none"
              style={{
                background: 'linear-gradient(to left, var(--bg-primary), transparent)',
              }}
            />

            <div className="overflow-hidden">
              <div 
                className="flex gap-3 transition-transform duration-300 ease-out"
                style={{
                  transform: `translateX(calc(-${currentIndex} * (50% + 6px)))`,
                }}
              >
                {allItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex-shrink-0 min-h-[130px]"
                    style={{ width: 'calc(50% - 6px)' }}
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

          {/* Right arrow */}
          <button
            onClick={() => handleNext(mobileMaxIndex)}
            disabled={currentIndex >= mobileMaxIndex}
            className={`flex-shrink-0 w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center transition-all duration-200 ${
              currentIndex < mobileMaxIndex 
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
          {Array.from({ length: mobileMaxIndex + 1 }).map((_, idx) => (
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
    </motion.div>
  );
}
