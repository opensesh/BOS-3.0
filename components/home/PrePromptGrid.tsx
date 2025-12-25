'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight,
  Image,
  Type,
  Palette,
  LayoutGrid,
  FileText,
  MessageSquare,
  Lightbulb,
  PenTool,
  Megaphone,
  Sparkles
} from 'lucide-react';
import { AnimatedFolder } from './AnimatedFolder';
import { IconHover3D } from './IconHover3D';
import { fadeInUp } from '@/lib/motion';

interface PrePromptGridProps {
  onPromptSubmit: (prompt: string) => void;
}

// Quick links to subpages (shown on the left side of carousel)
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
  {
    id: 'guidelines',
    title: 'Guidelines',
    subtitle: 'Review brand standards',
    href: '/brand-hub?tab=guidelines',
    icon: FileText,
  },
];

// Pre-prompts for common tasks (shown on the right side of carousel)
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
    id: 'write-copy',
    icon: PenTool,
    title: 'Write copy',
    description: 'Craft headlines and taglines',
    prompt: 'Help me write compelling copy for [where it will be used]. I need it to be catchy and on-brand.',
  },
  {
    id: 'get-feedback',
    icon: MessageSquare,
    title: 'Get feedback',
    description: 'Review work for brand fit',
    prompt: 'Review this and tell me if it matches my brand guidelines. Suggest improvements to make it more on-brand: [paste your content]',
  },
];

// Combine all items: quick links first, then pre-prompts
const allItems = [
  ...quickLinks.map(link => ({ ...link, type: 'link' as const })),
  ...prePrompts.map(prompt => ({ ...prompt, type: 'prompt' as const })),
];

export function PrePromptGrid({ onPromptSubmit }: PrePromptGridProps) {
  // Start centered: show last 2 folders + first 2 prompts (index 3 shows items 3,4,5,6)
  const [currentIndex, setCurrentIndex] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Show 4 items on desktop, 2 on mobile
  const visibleCount = 4;
  const maxIndex = allItems.length - visibleCount;

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < maxIndex;

  // Calculate card width percentage
  const cardWidthPercent = 100 / visibleCount;
  const gapPercent = 1; // Small gap percentage

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="w-full max-w-3xl mx-auto px-4 mt-4"
    >
      {/* Carousel container with arrows outside */}
      <div className="flex items-center gap-3">
        {/* Left arrow - outside the carousel */}
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

        {/* Cards container with gradient edges */}
        <div className="relative flex-1 overflow-hidden">
          {/* Left fade gradient - progressive */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none" 
            style={{
              background: 'linear-gradient(to right, var(--bg-primary) 0%, var(--bg-primary) 20%, transparent 100%)',
            }}
          />
          
          {/* Right fade gradient - progressive */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none" 
            style={{
              background: 'linear-gradient(to left, var(--bg-primary) 0%, var(--bg-primary) 20%, transparent 100%)',
            }}
          />

          <div 
            ref={containerRef}
            className="flex gap-3 transition-transform duration-300 ease-out px-2"
            style={{
              transform: `translateX(-${currentIndex * (cardWidthPercent + gapPercent)}%)`,
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

        {/* Right arrow - outside the carousel */}
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
    </motion.div>
  );
}
