'use client';

import { useRef, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
}

type FormatAction = 'bold' | 'italic' | 'link' | 'unorderedList' | 'orderedList';

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write a short introduction...',
  maxLength = 275,
  rows = 4,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const characterCount = value.length;
  const isOverLimit = characterCount > maxLength;

  const applyFormat = useCallback((action: FormatAction) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    let newText = value;
    let newCursorPos = start;

    switch (action) {
      case 'bold':
        if (selectedText) {
          newText = value.substring(0, start) + `**${selectedText}**` + value.substring(end);
          newCursorPos = end + 4;
        } else {
          newText = value.substring(0, start) + '****' + value.substring(end);
          newCursorPos = start + 2;
        }
        break;
      case 'italic':
        if (selectedText) {
          newText = value.substring(0, start) + `*${selectedText}*` + value.substring(end);
          newCursorPos = end + 2;
        } else {
          newText = value.substring(0, start) + '**' + value.substring(end);
          newCursorPos = start + 1;
        }
        break;
      case 'link':
        if (selectedText) {
          newText = value.substring(0, start) + `[${selectedText}](url)` + value.substring(end);
          newCursorPos = end + 7;
        } else {
          newText = value.substring(0, start) + '[text](url)' + value.substring(end);
          newCursorPos = start + 1;
        }
        break;
      case 'unorderedList':
        if (selectedText) {
          const lines = selectedText.split('\n').map(line => `- ${line}`).join('\n');
          newText = value.substring(0, start) + lines + value.substring(end);
          newCursorPos = start + lines.length;
        } else {
          newText = value.substring(0, start) + '- ' + value.substring(end);
          newCursorPos = start + 2;
        }
        break;
      case 'orderedList':
        if (selectedText) {
          const lines = selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
          newText = value.substring(0, start) + lines + value.substring(end);
          newCursorPos = start + lines.length;
        } else {
          newText = value.substring(0, start) + '1. ' + value.substring(end);
          newCursorPos = start + 3;
        }
        break;
    }

    onChange(newText);

    // Restore focus and set cursor position
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  }, [value, onChange]);

  const formatButtons = [
    { action: 'bold' as const, icon: Bold, label: 'Bold' },
    { action: 'italic' as const, icon: Italic, label: 'Italic' },
    { action: 'link' as const, icon: Link, label: 'Add link' },
    { action: 'unorderedList' as const, icon: List, label: 'Bulleted list' },
    { action: 'orderedList' as const, icon: ListOrdered, label: 'Numbered list' },
  ];

  return (
    <div className="w-full">
      {/* Editor container */}
      <div
        className={`
          flex flex-col
          bg-[var(--bg-primary)]
          border rounded-lg
          overflow-hidden
          transition-colors
          ${isFocused
            ? 'border-[var(--border-brand)] ring-2 ring-[var(--focus-ring)]'
            : 'border-[var(--border-primary)]'
          }
          ${isOverLimit ? 'border-[var(--fg-error-primary)]' : ''}
        `}
      >
        {/* Toolbar */}
        <div className="
          flex items-center gap-0.5
          px-3 py-2
          border-b border-[var(--border-secondary)]
          bg-[var(--bg-secondary-alt)]
        ">
          {formatButtons.map(({ action, icon: Icon, label }) => (
            <button
              key={action}
              type="button"
              onClick={() => applyFormat(action)}
              className="
                p-1.5
                rounded
                text-[var(--fg-quaternary)]
                hover:text-[var(--fg-secondary)]
                hover:bg-[var(--bg-tertiary)]
                transition-colors
              "
              aria-label={label}
              title={label}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="
            w-full
            px-3.5 py-2.5
            bg-transparent
            text-[var(--fg-primary)] text-base
            placeholder:text-[var(--fg-placeholder)]
            resize-none
            focus:outline-none
          "
        />
      </div>

      {/* Character count */}
      <div className="flex justify-end mt-1.5">
        <span
          className={`
            text-sm
            ${isOverLimit
              ? 'text-[var(--fg-error-primary)]'
              : 'text-[var(--fg-tertiary)]'
            }
          `}
        >
          {characterCount}/{maxLength} characters
        </span>
      </div>
    </div>
  );
}

