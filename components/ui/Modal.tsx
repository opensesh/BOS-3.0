'use client';

import { useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogTrigger,
  Modal as AriaModal,
  ModalOverlay,
  Heading,
} from 'react-aria-components';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

/**
 * Modal component built on React Aria for accessibility
 * Untitled UI design system integration
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      isDismissable
      className={({ isEntering, isExiting }) =>
        cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4',
          'bg-black/60 backdrop-blur-sm',
          isEntering && 'animate-in fade-in-0 duration-200',
          isExiting && 'animate-out fade-out-0 duration-150'
        )
      }
    >
      <AriaModal
        className={({ isEntering, isExiting }) =>
          cn(
            'relative w-full rounded-xl',
            'bg-os-surface-dark border border-os-border-dark',
            'shadow-2xl',
            'max-h-[90vh] overflow-hidden flex flex-col',
            'outline-none',
            sizeClasses[size],
            isEntering && 'animate-in fade-in-0 zoom-in-95 duration-200',
            isExiting && 'animate-out fade-out-0 zoom-out-95 duration-150'
          )
        }
      >
        <Dialog className="outline-none flex flex-col max-h-[90vh]">
          {({ close }) => (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-os-border-dark flex-shrink-0">
                <Heading
                  slot="title"
                  className="text-lg font-display font-semibold text-brand-vanilla"
                >
                  {title}
                </Heading>
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      onClose();
                    }}
                    className="p-1.5 rounded-lg text-os-text-secondary-dark hover:text-brand-vanilla hover:bg-os-border-dark transition-colors focus:outline-none focus:ring-2 focus:ring-brand-aperol/50"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Body - scrollable */}
              <div className="px-6 py-4 overflow-y-auto custom-scrollbar flex-1">
                {children}
              </div>
            </>
          )}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}

// Re-export Dialog components for advanced usage
export { DialogTrigger, Dialog, ModalOverlay, AriaModal };

// Confirmation modal variant
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmModalProps) {
  const variantClasses = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    default: 'bg-brand-aperol hover:bg-brand-aperol/80 text-white',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-os-text-secondary-dark mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg text-sm font-medium text-os-text-primary-dark bg-os-border-dark hover:bg-os-border-dark/80 transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50',
            variantClasses[variant]
          )}
        >
          {isLoading ? 'Loading...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
