'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BookOpen, MessageSquare, Download, LayoutGrid, Pencil, Sparkles } from 'lucide-react';
import { staggerContainer, fadeInUp } from '@/lib/motion';

interface PrePromptGridProps {
  onPromptSubmit: (prompt: string) => void;
}

// Combined items - both navigation links and prompts as chips
const chipItems = [
  {
    id: 'write-post',
    icon: Pencil,
    label: 'Write',
    type: 'prompt' as const,
    prompt: 'Help me write an engaging Instagram caption for a new product launch. The product should feel innovative and aligned with my brand voice.',
  },
  {
    id: 'brand-voice',
    icon: MessageSquare,
    label: 'Find my voice',
    type: 'prompt' as const,
    prompt: "What's the recommended tone and voice for my brand's social media? Please analyze my brand guidelines and suggest a consistent voice.",
  },
  {
    id: 'learn',
    icon: BookOpen,
    label: 'Learn',
    type: 'prompt' as const,
    prompt: 'Teach me about brand consistency and how to maintain a cohesive visual identity across different platforms.',
  },
  {
    id: 'brainstorm',
    icon: Sparkles,
    label: 'Brainstorm',
    type: 'prompt' as const,
    prompt: 'Help me brainstorm creative campaign ideas for my brand. I want fresh, innovative concepts that align with my brand values.',
  },
  {
    id: 'download-logo',
    icon: Download,
    label: 'Get assets',
    type: 'link' as const,
    href: '/brand-hub',
  },
  {
    id: 'design-spaces',
    icon: LayoutGrid,
    label: 'Spaces',
    type: 'link' as const,
    href: '/spaces',
  },
];

interface ChipButtonProps {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
}

function ChipButton({ icon: Icon, label, onClick }: ChipButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)]/60 hover:border-[var(--border-brand)] hover:bg-[var(--bg-secondary)] transition-all duration-200 group"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon 
        className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--color-brand-500)] transition-colors duration-200" 
        strokeWidth={1.5}
      />
      <span className="text-sm font-medium text-[var(--fg-secondary)] group-hover:text-[var(--fg-primary)] transition-colors duration-200">
        {label}
      </span>
    </motion.button>
  );
}

export function PrePromptGrid({ onPromptSubmit }: PrePromptGridProps) {
  const router = useRouter();

  const handleChipClick = (item: typeof chipItems[0]) => {
    if (item.type === 'link' && 'href' in item) {
      router.push(item.href);
    } else if (item.type === 'prompt' && 'prompt' in item) {
      onPromptSubmit(item.prompt);
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="w-full max-w-3xl mx-auto px-4"
    >
      {/* Horizontal flex layout for chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {chipItems.map((item) => (
          <motion.div key={item.id} variants={fadeInUp}>
            <ChipButton
              icon={item.icon}
              label={item.label}
              onClick={() => handleChipClick(item)}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
