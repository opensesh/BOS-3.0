'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, CalendarDays } from 'lucide-react';
import {
  Calendar as AriaCalendar,
  CalendarGrid,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarGridBody,
  CalendarCell,
  Heading,
  Button,
} from 'react-aria-components';
import { today, getLocalTimeZone, parseDate, CalendarDate, startOfMonth, endOfMonth } from '@internationalized/date';

export type DateFilterValue = 
  | { type: 'preset'; preset: 'all' | 'today' | 'week' | 'month' }
  | { type: 'custom'; startDate: Date; endDate: Date };

interface DateFilterDropdownProps {
  value: DateFilterValue;
  onChange: (value: DateFilterValue) => void;
}

const presets = [
  { id: 'all', label: 'All time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
] as const;

function formatDateRange(value: DateFilterValue): string {
  if (value.type === 'preset') {
    const preset = presets.find(p => p.id === value.preset);
    return preset?.label || 'All time';
  }
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };
  
  const start = formatDate(value.startDate);
  const end = formatDate(value.endDate);
  
  if (start === end) {
    return start;
  }
  
  return `${start} – ${end}`;
}

function toCalendarDate(date: Date): CalendarDate {
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function fromCalendarDate(calDate: CalendarDate): Date {
  return new Date(calDate.year, calDate.month - 1, calDate.day);
}

export function DateFilterDropdown({ value, onChange }: DateFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectionStart, setSelectionStart] = useState<CalendarDate | null>(null);
  const [hoverDate, setHoverDate] = useState<CalendarDate | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const todayDate = today(getLocalTimeZone());

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectionStart(null);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSelectionStart(null);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handlePresetClick = (presetId: 'all' | 'today' | 'week' | 'month') => {
    onChange({ type: 'preset', preset: presetId });
    setIsOpen(false);
    setSelectionStart(null);
  };

  const handleDateClick = (date: CalendarDate) => {
    if (!selectionStart) {
      // First click - start selection
      setSelectionStart(date);
    } else {
      // Second click - complete range
      const start = date.compare(selectionStart) < 0 ? date : selectionStart;
      const end = date.compare(selectionStart) < 0 ? selectionStart : date;
      
      onChange({
        type: 'custom',
        startDate: fromCalendarDate(start),
        endDate: fromCalendarDate(end),
      });
      setSelectionStart(null);
      setIsOpen(false);
    }
  };

  const isInRange = (date: CalendarDate): boolean => {
    if (!selectionStart) return false;
    
    const compareDate = hoverDate || selectionStart;
    const start = compareDate.compare(selectionStart) < 0 ? compareDate : selectionStart;
    const end = compareDate.compare(selectionStart) < 0 ? selectionStart : compareDate;
    
    return date.compare(start) >= 0 && date.compare(end) <= 0;
  };

  const isSelectionEndpoint = (date: CalendarDate): boolean => {
    if (selectionStart && date.compare(selectionStart) === 0) return true;
    if (value.type === 'custom') {
      const startCal = toCalendarDate(value.startDate);
      const endCal = toCalendarDate(value.endDate);
      return date.compare(startCal) === 0 || date.compare(endCal) === 0;
    }
    return false;
  };

  const isCurrentlySelected = (date: CalendarDate): boolean => {
    if (value.type !== 'custom') return false;
    const startCal = toCalendarDate(value.startDate);
    const endCal = toCalendarDate(value.endDate);
    return date.compare(startCal) >= 0 && date.compare(endCal) <= 0;
  };

  return (
    <>
      {/* Backdrop - blurs content behind (rendered at root level via portal-like fixed positioning) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => {
            setIsOpen(false);
            setSelectionStart(null);
          }}
          aria-hidden="true"
        />
      )}

      <div className="relative z-50">
        {/* Trigger Button - stays above backdrop */}
        <div className="flex items-center gap-1">
          <button
            ref={buttonRef}
            onClick={() => setIsOpen(!isOpen)}
            className={`
              flex items-center gap-2 px-3 py-2.5
              text-sm font-medium
              rounded-lg
              border border-[var(--border-secondary)]
              transition-all duration-150
              ${isOpen 
                ? 'bg-[var(--bg-tertiary)] ring-2 ring-brand-aperol/20 border-brand-aperol' 
                : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--fg-primary)]'
              }
            `}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
          >
            <CalendarDays className="w-4 h-4 text-[var(--fg-tertiary)]" />
            <span className="text-[var(--fg-primary)]">{formatDateRange(value)}</span>
          </button>
          {(value.type === 'custom' || (value.type === 'preset' && value.preset !== 'all')) && (
            <button
              onClick={() => onChange({ type: 'preset', preset: 'all' })}
              className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--fg-quaternary)] hover:text-[var(--fg-primary)] transition-colors"
              aria-label="Clear filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Panel */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="
              absolute top-full right-0 mt-2
              bg-[var(--bg-primary)]
              border border-[var(--border-secondary)]
              rounded-xl
              shadow-xl shadow-black/20
              overflow-hidden
              animate-in fade-in slide-in-from-top-2 duration-150
              w-[320px]
            "
            role="dialog"
            aria-label="Date filter"
          >
          {/* Calendar Header */}
          <div className="px-4 pt-4 pb-2 border-b border-[var(--border-secondary)]">
            <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
              {selectionStart ? 'Select end date' : 'Select date range'}
            </p>
          </div>

          {/* Calendar */}
          <div className="p-3">
            <AriaCalendar
              aria-label="Date filter calendar"
              maxValue={todayDate}
              className="w-full"
            >
              {/* Calendar Navigation */}
              <header className="flex items-center justify-between mb-3">
                <Button
                  slot="previous"
                  className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors outline-none focus:ring-2 focus:ring-brand-aperol/30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Heading className="text-sm font-semibold text-[var(--fg-primary)]" />
                <Button
                  slot="next"
                  className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors outline-none focus:ring-2 focus:ring-brand-aperol/30"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </header>

              {/* Calendar Grid */}
              <CalendarGrid className="w-full border-separate border-spacing-0.5">
                <CalendarGridHeader>
                  {(day) => (
                    <CalendarHeaderCell className="text-xs font-medium text-[var(--fg-quaternary)] pb-2 w-9">
                      {day}
                    </CalendarHeaderCell>
                  )}
                </CalendarGridHeader>
                <CalendarGridBody>
                  {(date) => (
                    <CalendarCell
                      date={date}
                      onHoverStart={() => selectionStart && setHoverDate(date)}
                      onHoverEnd={() => setHoverDate(null)}
                      className={({ isOutsideMonth, isDisabled, isFocusVisible }) => `
                        w-9 h-9 text-center text-sm rounded-md cursor-pointer
                        outline-none transition-colors
                        ${isOutsideMonth ? 'text-[var(--fg-quaternary)]/40' : ''}
                        ${isDisabled ? 'text-[var(--fg-quaternary)]/40 cursor-not-allowed' : ''}
                        ${isFocusVisible ? 'ring-2 ring-brand-aperol/30' : ''}
                        ${isCurrentlySelected(date) && !selectionStart ? 'bg-brand-aperol/15 text-brand-aperol' : ''}
                        ${isSelectionEndpoint(date) ? 'bg-brand-aperol text-white' : ''}
                        ${isInRange(date) && !isSelectionEndpoint(date) ? 'bg-brand-aperol/20 text-[var(--fg-primary)]' : ''}
                        ${!isCurrentlySelected(date) && !isInRange(date) && !isSelectionEndpoint(date) && !isOutsideMonth && !isDisabled ? 'hover:bg-[var(--bg-tertiary)] text-[var(--fg-primary)]' : ''}
                        ${date.compare(todayDate) === 0 && !isSelectionEndpoint(date) ? 'font-semibold ring-1 ring-brand-aperol/50' : ''}
                      `}
                    >
                      {({ formattedDate }) => (
                        <button
                          onClick={() => handleDateClick(date)}
                          className="w-full h-full flex items-center justify-center"
                          disabled={date.compare(todayDate) > 0}
                        >
                          {formattedDate}
                        </button>
                      )}
                    </CalendarCell>
                  )}
                </CalendarGridBody>
              </CalendarGrid>
            </AriaCalendar>
          </div>

          {/* Quick Presets */}
          <div className="px-3 py-3 border-t border-[var(--border-secondary)] bg-[var(--bg-secondary)]/50">
            <p className="text-xs font-medium text-[var(--fg-quaternary)] mb-2 px-1">Quick filters</p>
            <div className="flex gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetClick(preset.id)}
                  className={`
                    flex-1 px-2 py-1.5 rounded-md text-xs font-medium whitespace-nowrap
                    transition-colors
                    ${value.type === 'preset' && value.preset === preset.id
                      ? 'bg-brand-aperol text-white'
                      : 'bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:bg-[var(--bg-quaternary)] hover:text-[var(--fg-primary)] border border-[var(--border-secondary)]'
                    }
                  `}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

