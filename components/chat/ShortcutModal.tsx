'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Sparkles, ChevronDown, Globe } from 'lucide-react';

interface ShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultInstructions?: string;
  defaultName?: string;
}

export function ShortcutModal({
  isOpen,
  onClose,
  defaultInstructions = '',
  defaultName = '',
}: ShortcutModalProps) {
  const [shortcutName, setShortcutName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mode, setMode] = useState<'search' | 'research'>('search');
  const [model, setModel] = useState('Best');
  const [sourceType, setSourceType] = useState('Web');

  // Generate slug from name
  useEffect(() => {
    // Removed auto-slug effect to allow manual editing
  }, [shortcutName]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Use placeholder for instructions instead of response content
      setInstructions('');
      
      // Set clean shortcut name from query
      if (defaultName) {
        const cleanName = defaultName
          .replace(/^\//, '') // remove leading slash if present
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .slice(0, 40);
        setShortcutName(cleanName);
      } else {
        setShortcutName('');
      }
      
      setShowAdvanced(false);
    }
  }, [isOpen, defaultInstructions, defaultName]);

  const handleSave = () => {
    // Save shortcut logic would go here
    console.log('Saving shortcut:', {
      name: shortcutName,
      instructions,
      mode,
      model,
      sourceType,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-xl mx-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)]">
          <h2 className="text-lg font-semibold text-[var(--fg-primary)]">
            Shortcut
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--bg-primary)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--fg-tertiary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Shortcut name */}
          <div>
            <label className="block text-sm text-[var(--fg-tertiary)] mb-2">
              Shortcut name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)]">
                /
              </span>
              <input
                type="text"
                value={shortcutName}
                onChange={(e) => setShortcutName(e.target.value)}
                placeholder="my-shortcut"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg pl-6 pr-4 py-3 text-[var(--fg-primary)] placeholder:text-[var(--fg-tertiary)]/50 focus:outline-none focus:border-[var(--border-brand-solid)]/50"
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm text-[var(--fg-tertiary)] mb-2">
              Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter the instructions for this shortcut..."
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-4 py-3 text-[var(--fg-primary)] placeholder:text-[var(--fg-tertiary)]/50 focus:outline-none focus:border-[var(--border-brand-solid)]/50 min-h-[100px] resize-none"
            />
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            />
            <span>Advanced</span>
          </button>

          {/* Advanced options */}
          {showAdvanced && (
            <div className="grid grid-cols-3 gap-4 pt-2">
              {/* Mode */}
              <div>
                <label className="block text-sm text-[var(--fg-tertiary)] mb-2">
                  Mode
                </label>
                <div className="inline-flex items-center gap-1 p-1 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-primary)]">
                  <button
                    onClick={() => setMode('search')}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors
                      ${mode === 'search' 
                        ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)] font-medium' 
                        : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]'
                      }
                    `}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                  <button
                    onClick={() => setMode('research')}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors
                      ${mode === 'research' 
                        ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)] font-medium' 
                        : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]'
                      }
                    `}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Reason</span>
                  </button>
                </div>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm text-[var(--fg-tertiary)] mb-2">
                  Model
                </label>
                <div className="relative">
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full appearance-none bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm text-[var(--fg-primary)] focus:outline-none focus:border-[var(--border-brand-solid)]/50 cursor-pointer"
                  >
                    <option value="Best">Best</option>
                    <option value="Claude">Claude</option>
                    <option value="Sonar">Sonar</option>
                    <option value="Sonar Pro">Sonar Pro</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-tertiary)] pointer-events-none" />
                </div>
              </div>

              {/* Sources */}
              <div>
                <label className="block text-sm text-[var(--fg-tertiary)] mb-2">
                  Sources
                </label>
                <div className="relative">
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className="w-full appearance-none bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm text-[var(--fg-primary)] focus:outline-none focus:border-[var(--border-brand-solid)]/50 cursor-pointer"
                  >
                    <option value="Web">Web</option>
                    <option value="Academic">Academic</option>
                    <option value="News">News</option>
                    <option value="All">All</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-tertiary)] pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-primary)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--fg-primary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-primary)]/80 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!shortcutName.trim()}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg transition-colors
              ${shortcutName.trim()
                ? 'bg-[var(--bg-brand-solid)] text-white hover:bg-[var(--bg-brand-solid)]/90'
                : 'bg-[var(--bg-primary)] text-[var(--fg-tertiary)] cursor-not-allowed'
              }
            `}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

