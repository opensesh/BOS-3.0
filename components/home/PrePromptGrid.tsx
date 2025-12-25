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
  Mail
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
    id: 'email-draft',
    icon: Mail,
    title: 'Draft an email',
    description: 'Write professional emails',
    prompt: 'Help me draft a professional email. I need to [purpose of email] and want it to sound on-brand and polished.',
  },
  {
    id: 'brainstorm',
    icon: Lightbulb,
    title: 'Brainstorm ideas',
    description: 'Get creative campaign concepts',
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
    id: 'review-tone',
    icon: MessageSquare,
    title: 'Check my tone',
    description: 'Review text for brand voice',
    prompt: 'Review this text and tell me if it matches my brand voice. Suggest improvements to make it more on-brand: [paste your text]',
  },
];

// Combine all items: quick links first, then pre-prompts
const allItems = [
  ...quickLinks.map(link => ({ ...link, type: 'link' as const })),
  ...prePrompts.map(prompt => ({ ...prompt, type: 'prompt' as const })),
];

export function PrePromptGrid({ onPromptSubmit }: PrePromptGridProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
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

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="w-full max-w-3xl mx-auto px-4 mt-4"
    >
      {/* Carousel container */}
      <div className="relative">
        {/* Left arrow */}
        <button
          onClick={handlePrev}
          disabled={!canGoPrev}
          className={`absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center transition-all duration-200 ${
            canGoPrev 
              ? 'hover:border-[var(--border-brand)] hover:bg-[var(--bg-tertiary)] cursor-pointer' 
              : 'opacity-30 cursor-not-allowed'
          }`}
          aria-label="Previous"
        >
          <ChevronLeft className="w-4 h-4 text-[var(--fg-secondary)]" />
        </button>

        {/* Right arrow */}
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className={`absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center transition-all duration-200 ${
            canGoNext 
              ? 'hover:border-[var(--border-brand)] hover:bg-[var(--bg-tertiary)] cursor-pointer' 
              : 'opacity-30 cursor-not-allowed'
          }`}
          aria-label="Next"
        >
          <ChevronRight className="w-4 h-4 text-[var(--fg-secondary)]" />
        </button>

        {/* Cards container with overflow hidden */}
        <div className="overflow-hidden mx-2">
          <div 
            ref={containerRef}
            className="flex gap-3 transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / visibleCount + 0.8)}%)`,
            }}
          >
            {allItems.map((item) => (
              <div 
                key={item.id} 
                className="flex-shrink-0 min-h-[140px]"
                style={{ width: `calc((100% - ${(visibleCount - 1) * 12}px) / ${visibleCount})` }}
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

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                idx === currentIndex 
                  ? 'bg-[var(--color-brand-500)] w-4' 
                  : 'bg-[var(--border-primary)] hover:bg-[var(--fg-tertiary)]'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
