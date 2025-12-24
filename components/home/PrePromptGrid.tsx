'use client';

import { motion } from 'framer-motion';
import { BookOpen, MessageSquare } from 'lucide-react';
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
    previewImages: [
      '/assets/logos/brandmark-vanilla.svg',
      '/assets/logos/brandmark-charcoal.svg',
    ],
    color: 'aperol' as const,
  },
  {
    id: 'design-spaces',
    title: 'Design Spaces',
    subtitle: 'Find conversations',
    href: '/spaces',
    previewImages: [],
    color: 'purple' as const,
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
      className="w-full max-w-3xl mx-auto px-4 mt-8"
    >
      {/* Section Label */}
      <motion.p 
        variants={fadeInUp}
        className="text-xs uppercase tracking-wider text-[var(--fg-quaternary)] mb-4 text-center"
      >
        Get started
      </motion.p>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Quick Link Cards (Folders) */}
        {quickLinks.map((link) => (
          <motion.div key={link.id} variants={fadeInUp}>
            <AnimatedFolder
              title={link.title}
              subtitle={link.subtitle}
              href={link.href}
              previewImages={link.previewImages}
              color={link.color}
            />
          </motion.div>
        ))}

        {/* Example Prompt Cards (Icon 3D) */}
        {examplePrompts.map((prompt) => (
          <motion.div key={prompt.id} variants={fadeInUp}>
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

