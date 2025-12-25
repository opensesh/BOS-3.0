'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Sparkles } from 'lucide-react';
import { models, ModelId, ModelConfig } from '@/lib/ai/providers';

// Claude (Anthropic) Logo SVG Component
function ClaudeLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 509.64"
      className={className}
      fill="currentColor"
    >
      <path
        fill="#D77655"
        d="M115.612 0h280.775C459.974 0 512 52.026 512 115.612v278.415c0 63.587-52.026 115.612-115.613 115.612H115.612C52.026 509.639 0 457.614 0 394.027V115.612C0 52.026 52.026 0 115.612 0z"
      />
      <path
        fill="#FCF2EE"
        fillRule="nonzero"
        d="M142.27 316.619l73.655-41.326 1.238-3.589-1.238-1.996-3.589-.001-12.31-.759-42.084-1.138-36.498-1.516-35.361-1.896-8.897-1.895-8.34-10.995.859-5.484 7.482-5.03 10.717.935 23.683 1.617 35.537 2.452 25.782 1.517 38.193 3.968h6.064l.86-2.451-2.073-1.517-1.618-1.517-36.776-24.922-39.81-26.338-20.852-15.166-11.273-7.683-5.687-7.204-2.451-15.721 10.237-11.273 13.75.935 3.513.936 13.928 10.716 29.749 23.027 38.848 28.612 5.687 4.727 2.275-1.617.278-1.138-2.553-4.271-21.13-38.193-22.546-38.848-10.035-16.101-2.654-9.655c-.935-3.968-1.617-7.304-1.617-11.374l11.652-15.823 6.445-2.073 15.545 2.073 6.547 5.687 9.655 22.092 15.646 34.78 24.265 47.291 7.103 14.028 3.791 12.992 1.416 3.968 2.449-.001v-2.275l1.997-26.641 3.69-32.707 3.589-42.084 1.239-11.854 5.863-14.206 11.652-7.683 9.099 4.348 7.482 10.716-1.036 6.926-4.449 28.915-8.72 45.294-5.687 30.331h3.313l3.792-3.791 15.342-20.372 25.782-32.227 11.374-12.789 13.27-14.129 8.517-6.724 16.1-.001 11.854 17.617-5.307 18.199-16.581 21.029-13.75 17.819-19.716 26.54-12.309 21.231 1.138 1.694 2.932-.278 44.536-9.479 24.062-4.347 28.714-4.928 12.992 6.066 1.416 6.167-5.106 12.613-30.71 7.583-36.018 7.204-53.636 12.689-.657.48.758.935 24.164 2.275 10.337.556h25.301l47.114 3.514 12.309 8.139 7.381 9.959-1.238 7.583-18.957 9.655-25.579-6.066-59.702-14.205-20.474-5.106-2.83-.001v1.694l17.061 16.682 31.266 28.233 39.152 36.397 1.997 8.999-5.03 7.102-5.307-.758-34.401-25.883-13.27-11.651-30.053-25.302-1.996-.001v2.654l6.926 10.136 36.574 54.975 1.895 16.859-2.653 5.485-9.479 3.311-10.414-1.895-21.408-30.054-22.092-33.844-17.819-30.331-2.173 1.238-10.515 113.261-4.929 5.788-11.374 4.348-9.478-7.204-5.03-11.652 5.03-23.027 6.066-30.052 4.928-23.886 4.449-29.674 2.654-9.858-.177-.657-2.173.278-22.37 30.71-34.021 45.977-26.919 28.815-6.445 2.553-11.173-5.789 1.037-10.337 6.243-9.2 37.257-47.392 22.47-29.371 14.508-16.961-.101-2.451h-.859l-98.954 64.251-17.618 2.275-7.583-7.103.936-11.652 3.589-3.791 29.749-20.474-.101.102.024.101z"
      />
    </svg>
  );
}

// Auto/Smart icon using Sparkles from Lucide
function AutoIcon({ className }: { className?: string }) {
  return <Sparkles className={className} />
}

// Perplexity Logo SVG Component
function PerplexityLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 509.64"
      className={className}
    >
      <path
        fill="#1F1F1F"
        d="M115.613 0h280.774C459.974 0 512 52.025 512 115.612v278.415c0 63.587-52.026 115.613-115.613 115.613H115.613C52.026 509.64 0 457.614 0 394.027V115.612C0 52.025 52.026 0 115.613 0z"
      />
      <path
        fill="#fff"
        fillRule="nonzero"
        d="M348.851 128.063l-68.946 58.302h68.946v-58.302zm-83.908 48.709l100.931-85.349v94.942h32.244v143.421h-38.731v90.004l-94.442-86.662v83.946h-17.023v-83.906l-96.596 86.246v-89.628h-37.445V186.365h38.732V90.768l95.309 84.958v-83.16h17.023l-.002 84.206zm-29.209 26.616c-34.955.02-69.893 0-104.83 0v109.375h20.415v-27.121l84.415-82.254zm41.445 0l82.208 82.324v27.051h21.708V203.388c-34.617 0-69.274.02-103.916 0zm-42.874-17.023l-64.669-57.646v57.646h64.669zm13.617 124.076v-95.2l-79.573 77.516v88.731l79.573-71.047zm17.252-95.022v94.863l77.19 70.83c0-29.485-.012-58.943-.012-88.425l-77.178-77.268z"
      />
    </svg>
  );
}

// Get logo component for a model provider
function getProviderLogo(provider: 'anthropic' | 'perplexity' | 'auto') {
  switch (provider) {
    case 'anthropic':
      return ClaudeLogo;
    case 'perplexity':
      return PerplexityLogo;
    case 'auto':
      return AutoIcon; // Use sparkles icon for auto
    default:
      return null;
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

  const autoModel = models.auto;
  const otherModels = Object.values(models).filter((m) => m.id !== 'auto');

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
          className="absolute bottom-full mb-2 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-secondary)] shadow-[var(--shadow-xl)] overflow-hidden z-50 lg:w-64"
          style={{
            right: position.right !== undefined ? position.right : undefined,
            left: position.left !== undefined ? position.left : undefined,
            width: position.maxWidth !== undefined ? position.maxWidth : undefined,
          }}
        >
          <div className="py-2">
            {/* Auto option */}
            <button
              type="button"
              onClick={() => {
                onModelChange(autoModel.id);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-2 text-left transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <AutoIcon className="w-4 h-4 flex-shrink-0 text-[var(--fg-brand-primary)]" />
                  <span className="text-sm font-medium text-[var(--fg-primary)]">
                    {autoModel.name}
                  </span>
                </div>
                <p className="text-xs text-[var(--fg-tertiary)] mt-0.5 ml-6">
                  {autoModel.description}
                </p>
              </div>
              {selectedModel === 'auto' && (
                <Check className="w-4 h-4 text-[var(--fg-brand-primary)] ml-2 flex-shrink-0" />
              )}
            </button>

            {/* Divider */}
            <div className="mx-3 my-1.5 border-t border-[var(--border-secondary)]" />

            {/* Other models */}
            {otherModels.map((model: ModelConfig) => {
              const isSelected = model.id === selectedModel;
              const nameWithVersion = model.version 
                ? `${model.name} ${model.version}` 
                : model.name;
              const Logo = getProviderLogo(model.provider);

              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onModelChange(model.id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-2 text-left transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {Logo && <Logo className="w-4 h-4 flex-shrink-0" />}
                      <span className="text-sm font-medium text-[var(--fg-primary)]">
                        {nameWithVersion}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--fg-tertiary)] mt-0.5 ml-6">
                      {model.description}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-[var(--fg-brand-primary)] ml-2 flex-shrink-0" />
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
