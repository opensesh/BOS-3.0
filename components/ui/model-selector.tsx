'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Wand2, Brain, Search } from 'lucide-react';
import { models, ModelId, ModelConfig } from '@/lib/ai/providers';

// Simple vanilla icons for each provider
function getProviderIcon(provider: 'anthropic' | 'perplexity' | 'auto') {
  switch (provider) {
    case 'anthropic':
      return Brain;
    case 'perplexity':
      return Search;
    case 'auto':
      return Wand2;
    default:
      return Wand2;
  }
}

interface ModelSelectorProps {
  selectedModel: ModelId;
  onModelChange: (model: ModelId) => void;
  disabled?: boolean;
}

export function ModelSelector({ selectedModel, onModelChange, disabled }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ right?: number; left?: number; maxWidth?: number }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentModel = models[selectedModel];
  
  const displayName = currentModel.version 
    ? `${currentModel.name} ${currentModel.version}` 
    : currentModel.name;

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const calculatePosition = () => {
      const button = buttonRef.current;
      if (!button) return;

      const buttonRect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const isMobileOrTablet = viewportWidth < 1024;

      if (isMobileOrTablet) {
        const formContainer = button.closest('form');
        if (formContainer) {
          const containerRect = formContainer.getBoundingClientRect();
          const rightOffset = buttonRect.right - containerRect.right;
          const dropdownMaxWidth = Math.min(containerRect.width, 280);
          
          setPosition({ 
            right: rightOffset, 
            left: undefined,
            maxWidth: dropdownMaxWidth
          });
        } else {
          const containerPadding = 16;
          setPosition({ 
            right: 0, 
            left: undefined,
            maxWidth: Math.min(viewportWidth - (containerPadding * 2), 280)
          });
        }
      } else {
        setPosition({ left: 0, right: undefined, maxWidth: 256 });
      }
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    return () => window.removeEventListener('resize', calculatePosition);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const allModels = Object.values(models);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-1 px-2 py-1 rounded-md text-xs
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--bg-tertiary)] cursor-pointer'}
          ${
            isOpen
              ? 'bg-[var(--bg-tertiary)] text-[var(--fg-primary)]'
              : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]'
          }
        `}
      >
        <span className="font-medium">{displayName}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute bottom-full mb-2 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] shadow-[var(--shadow-xl)] overflow-hidden z-50 lg:w-64"
          style={{
            right: position.right !== undefined ? position.right : undefined,
            left: position.left !== undefined ? position.left : undefined,
            width: position.maxWidth !== undefined ? position.maxWidth : undefined,
          }}
        >
          <div className="py-2">
            {allModels.map((model: ModelConfig) => {
              const isSelected = model.id === selectedModel;
              const nameWithVersion = model.version 
                ? `${model.name} ${model.version}` 
                : model.name;
              const Icon = getProviderIcon(model.provider);

              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onModelChange(model.id);
                    setIsOpen(false);
                  }}
                  className="group w-full flex items-center gap-2 px-3 py-2 text-left transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
                >
                  <Icon className="w-4 h-4 text-[var(--fg-quaternary)] group-hover:text-[var(--fg-tertiary)] transition-colors flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[var(--fg-secondary)] group-hover:text-[var(--fg-primary)] transition-colors">
                      {nameWithVersion}
                    </span>
                    <p className="text-xs text-[var(--fg-quaternary)] mt-0.5 truncate">
                      {model.description}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-[var(--color-brand-500)] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
