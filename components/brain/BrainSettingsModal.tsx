'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, PenTool, Check, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui';

export type BrainSection = 'architecture' | 'guidelines' | 'writing' | 'skills';

interface BrainSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSection?: BrainSection;
}

type SelectedOption = 'guidelines' | 'writing' | 'skills' | null;

export function BrainSettingsModal({ isOpen, onClose, defaultSection }: BrainSettingsModalProps) {
  const [selectedOption, setSelectedOption] = useState<SelectedOption>(null);
  
  useEffect(() => {
    if (isOpen) {
      if (defaultSection === 'guidelines' || defaultSection === 'writing' || defaultSection === 'skills') {
        setSelectedOption(defaultSection);
      } else {
        setSelectedOption(null);
      }
    }
  }, [isOpen, defaultSection]);

  const options = [
    {
      id: 'guidelines' as const,
      title: 'Brand Guidelines',
      description: 'Upload your brand identity documentation',
      icon: BookOpen,
    },
    {
      id: 'writing' as const,
      title: 'Writing Styles',
      description: 'Upload your voice and tone guidelines',
      icon: PenTool,
    },
    {
      id: 'skills' as const,
      title: 'Skills',
      description: 'Create custom AI capabilities',
      icon: Zap,
    },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-2xl shadow-[var(--shadow-xl)]"
        >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-[var(--border-secondary)] bg-[var(--bg-primary)] z-10">
          <div>
            <h2 className="text-xl font-display font-bold text-[var(--fg-primary)]">
              Brain Settings
            </h2>
            <p className="text-sm text-[var(--fg-tertiary)]">
              Configure your brand knowledge base
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--fg-tertiary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Option Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {options.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedOption === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  className={`
                    relative p-4 rounded-xl border text-left transition-all cursor-pointer
                    ${isSelected
                      ? 'bg-[var(--bg-brand-primary)] border-[var(--border-brand-solid)]'
                      : 'bg-[var(--bg-secondary)] border-[var(--border-secondary)] hover:border-[var(--border-primary)]'
                    }
                  `}
                >
                  {isSelected && (
                    <span className="absolute top-2 right-2 p-1 bg-[var(--bg-brand-solid)] rounded-full">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                  
                  <div className="p-2 rounded-lg bg-[var(--bg-brand-primary)] w-fit mb-3">
                    <Icon className="w-5 h-5 text-[var(--fg-brand-primary)]" />
                  </div>
                  <h3 className="font-display font-medium text-[var(--fg-primary)] mb-1">
                    {option.title}
                  </h3>
                  <p className="text-xs text-[var(--fg-tertiary)]">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t border-[var(--border-secondary)] bg-[var(--bg-primary)]">
          <Button
            type="button"
            color="tertiary"
            size="md"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            color="primary"
            size="md"
            onClick={onClose}
            iconTrailing={ArrowRight}
          >
            Continue
          </Button>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
