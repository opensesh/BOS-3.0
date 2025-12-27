'use client';

import { useRef, useState } from 'react';
import { User } from 'lucide-react';
import { Avatar } from '@/components/ui/base/avatar/avatar';

interface AvatarUploadProps {
  avatarUrl?: string;
  displayName?: string;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
  isUploading?: boolean;
}

export function AvatarUpload({
  avatarUrl,
  displayName,
  onUpload,
  onDelete,
  isUploading = false,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    await onUpload(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!avatarUrl) return;
    
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateClick = () => {
    fileInputRef.current?.click();
  };

  // Get initials from display name
  const initials = displayName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-start justify-between gap-4">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar
          size="2xl"
          src={avatarUrl}
          alt={displayName || 'Profile photo'}
          initials={initials}
          placeholderIcon={User}
          contrastBorder
          className={isUploading ? 'opacity-50' : ''}
        />
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
            <svg
              className="animate-spin w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleDelete}
          disabled={!avatarUrl || isDeleting || isUploading}
          className="
            text-sm font-semibold
            text-[var(--fg-tertiary)]
            hover:text-[var(--fg-secondary)]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
        <button
          type="button"
          onClick={handleUpdateClick}
          disabled={isUploading}
          className="
            text-sm font-semibold
            text-[var(--fg-brand-secondary)]
            hover:text-[var(--fg-brand-primary)]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {isUploading ? 'Uploading...' : 'Update'}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload profile photo"
      />
    </div>
  );
}

