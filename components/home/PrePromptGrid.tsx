'use client';

import { motion } from 'framer-motion';
import { BookOpen, MessageSquare, Palette, Type, Image } from 'lucide-react';
import { AnimatedFolder } from './AnimatedFolder';
import { IconHover3D } from './IconHover3D';
import { staggerContainer, fadeInUp } from '@/lib/motion';

interface PrePromptGridProps {
  onPromptSubmit: (prompt: string) => void;
}

// Quick link destinations
const quickLinks = [
  {
    id: 'brand-assets',
    title: 'Brand Assets',
    subtitle: 'Explore your brand hub',
    href: '/brand-hub',
    color: 'aperol' as const,
    variant: 'icons' as const,
    icons: [Palette, Type, Image],
  },
  {
    id: 'design-spaces',
    title: 'Design Spaces',
    subtitle: 'Find conversations',
    href: '/spaces',
    color: 'purple' as const,
    variant: 'squares' as const,
  },
];

// Example prompts that auto-submit to chat
const examplePrompts = [
  {
    id: 'instagram-post',
    icon: BookOpen,
    title: 'Write a post',
    description: 'Help me craft an engaging social media caption',
    prompt: 'Help me write an engaging Instagram caption for a new product launch. The product should feel innovative and aligned with my brand voice.',
  },
  {
    id: 'brand-voice',
    icon: MessageSquare,
    title: 'Find my voice',
    description: 'Discover your brand\'s tone and messaging style',
    prompt: 'What\'s the recommended tone and voice for my brand\'s social media? Please analyze my brand guidelines and suggest a consistent voice.',
  },
];

export function PrePromptGrid({ onPromptSubmit }: PrePromptGridProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="w-full max-w-4xl mx-auto px-4 mt-6"
    >
      {/* 4-column Grid like Gemini */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Quick Link Cards (Folders) */}
        {quickLinks.map((link) => (
          <motion.div key={link.id} variants={fadeInUp} className="min-h-[140px]">
            <AnimatedFolder
              title={link.title}
              subtitle={link.subtitle}
              href={link.href}
              color={link.color}
              variant={link.variant}
              icons={link.icons}
            />
          </motion.div>
        ))}

        {/* Example Prompt Cards (Icon 3D) */}
        {examplePrompts.map((prompt) => (
          <motion.div key={prompt.id} variants={fadeInUp} className="min-h-[140px]">
            <IconHover3D
              icon={prompt.icon}
              title={prompt.title}
              description={prompt.description}
              onClick={() => onPromptSubmit(prompt.prompt)}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

