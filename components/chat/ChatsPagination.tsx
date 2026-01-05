'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ChatsPaginationProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

const rowOptions = [25, 50, 100, 150];

export function ChatsPagination({
  currentPage,
  totalPages,
  rowsPerPage,
  totalItems,
  onPageChange,
  onRowsPerPageChange,
}: ChatsPaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/30">
      {/* Left side: Rows per page selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-[var(--fg-tertiary)]">Rows per page:</span>
        <div className="flex items-center gap-1">
          {rowOptions.map((option) => (
            <button
              key={option}
              onClick={() => onRowsPerPageChange(option)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-md
                transition-all duration-150
                ${rowsPerPage === option
                  ? 'bg-brand-aperol text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] border border-[var(--border-secondary)]'
                }
              `}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Center: Item count */}
      <div className="text-xs text-[var(--fg-tertiary)]">
        {totalItems === 0 ? (
          <span>No items</span>
        ) : (
          <span>
            {startItem}–{endItem} of {totalItems}
          </span>
        )}
      </div>

      {/* Right side: Previous and Next buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
            transition-all duration-150
            ${currentPage <= 1
              ? 'opacity-40 cursor-not-allowed text-[var(--fg-quaternary)]'
              : 'bg-[var(--bg-secondary)] text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]'
            }
          `}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
            transition-all duration-150
            ${currentPage >= totalPages
              ? 'opacity-40 cursor-not-allowed text-[var(--fg-quaternary)]'
              : 'bg-[var(--bg-secondary)] text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]'
            }
          `}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

